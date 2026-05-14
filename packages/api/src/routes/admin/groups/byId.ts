import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { auditLog, groups, groupMemberships, profiles, users } from "../../../db/schema";
import { canEditGroup } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import type { AppEnv } from "../../../types";

export const adminGroupsByIdRoute = new Hono<AppEnv>();

// Apply canEditGroup scope-check on every nested route. The scope
// extracts groupId from the URL parameter.
adminGroupsByIdRoute.use(
  "*",
  requirePolicy(canEditGroup, (c) => ({ groupId: c.req.param("id") ?? "" }))
);

/**
 * GET /api/admin/groups/:id
 */
adminGroupsByIdRoute.get("/", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const row = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);
  if (!row) return c.json({ ok: false, error: "not_found" }, 404);

  const members = await db
    .select({
      userId: groupMemberships.userId,
      role: groupMemberships.role,
      joinedAt: groupMemberships.joinedAt,
      email: users.email,
      displayName: profiles.displayName,
    })
    .from(groupMemberships)
    .innerJoin(users, eq(users.id, groupMemberships.userId))
    .leftJoin(profiles, eq(profiles.userId, groupMemberships.userId))
    .where(eq(groupMemberships.groupId, id))
    .orderBy(desc(groupMemberships.role), desc(groupMemberships.joinedAt));

  const recentAudit = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorRole: auditLog.actorRole,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(eq(auditLog.targetId, id))
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  return c.json({
    ok: true,
    group: {
      ...row,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
      deletedAt: row.deletedAt instanceof Date ? row.deletedAt.toISOString() : row.deletedAt,
    },
    members: members.map((m) => ({
      ...m,
      joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : m.joinedAt,
    })),
    recentAudit: recentAudit.map((a) => ({
      ...a,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
  });
});
