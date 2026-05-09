import { Hono } from "hono";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { createDb } from "../../db";
import { auditLog, users } from "../../db/schema";
import { canViewAuditLog } from "../../lib/policies";
import { requirePolicy } from "../../middleware/policy";
import type { AppEnv } from "../../types";

/**
 * Cursor-paginated audit reader. Filterable by actor id, action
 * substring, target type/id, and a created_at date range.
 *
 * The cursor is a base64-encoded `${createdAt}|${id}` pair — both
 * components ride together because audit rows can share a millisecond.
 * Limit is capped at 200 to keep payloads sane.
 */
export const adminAuditRoute = new Hono<AppEnv>();

adminAuditRoute.use(
  "*",
  requirePolicy(canViewAuditLog, () => undefined)
);

adminAuditRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json({ ok: false, error: "internal" }, 500);
  }
  const db = createDb(c.env.DATABASE_URL);

  const actorIdFilter = c.req.query("actorId");
  const actionFilter = c.req.query("action");
  const targetTypeFilter = c.req.query("targetType");
  const targetIdFilter = c.req.query("targetId");
  const fromFilter = c.req.query("from");
  const toFilter = c.req.query("to");
  const cursorRaw = c.req.query("cursor");
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") ?? "50", 10) || 50, 1),
    200
  );

  const conditions = [] as ReturnType<typeof eq>[];
  if (actorIdFilter) conditions.push(eq(auditLog.actorId, actorIdFilter));
  if (actionFilter)
    conditions.push(ilike(auditLog.action, `%${actionFilter}%`));
  if (targetTypeFilter)
    conditions.push(eq(auditLog.targetType, targetTypeFilter));
  if (targetIdFilter)
    conditions.push(eq(auditLog.targetId, targetIdFilter));
  if (fromFilter)
    conditions.push(gte(auditLog.createdAt, new Date(fromFilter)));
  if (toFilter)
    conditions.push(lte(auditLog.createdAt, new Date(toFilter)));
  if (cursorRaw) {
    try {
      const decoded = atob(cursorRaw);
      const [tsStr, idStr] = decoded.split("|");
      const ts = new Date(tsStr);
      conditions.push(
        or(
          // Strictly older row...
          sql`${auditLog.createdAt} < ${ts}`,
          // ...or same instant, lower id (stable secondary sort).
          and(eq(auditLog.createdAt, ts), sql`${auditLog.id} < ${idStr}`)!
        )!
      );
    } catch {
      return c.json(
        { ok: false, error: "invalid_input", message: "bad cursor" },
        400
      );
    }
  }

  const rows = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorEmail: users.email,
      actorRole: auditLog.actorRole,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      payload: auditLog.payload,
      ipAddress: auditLog.ipAddress,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? btoa(
          `${
            last.createdAt instanceof Date
              ? last.createdAt.toISOString()
              : last.createdAt
          }|${last.id}`
        )
      : null;

  return c.json({
    ok: true,
    rows: page.map((r) => ({
      ...r,
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
    nextCursor,
  });
});
