import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
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

const patchBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
    charter: z.string().max(20000).nullable().optional(),
    slackChannel: z.string().max(80).nullable().optional(),
    links: z
      .array(
        z.object({
          label: z.string().min(1).max(80),
          url: z.string().url().max(500),
        })
      )
      .max(20)
      .optional(),
  })
  .strict();

/**
 * PATCH /api/admin/groups/:id
 *
 * Slug is NOT editable — permalink stability matters even though the
 * URL itself uses id, because the slug shows up in admin display,
 * page <title>, and any external link that grabbed it.
 */
adminGroupsByIdRoute.patch(
  "/",
  zValidator("json", patchBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id))
      return c.json({ ok: false, error: "invalid_input" }, 400);
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    const existing = await db
      .select()
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    c.get("auditCapture")?.({ group: existing });

    const next: Partial<typeof existing> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (body.name !== undefined && body.name !== existing.name) {
      next.name = body.name;
      before.name = existing.name;
      after.name = body.name;
    }
    if (body.description !== undefined && body.description !== existing.description) {
      next.description = body.description;
      before.description = existing.description;
      after.description = body.description;
    }
    if (body.charter !== undefined && body.charter !== existing.charter) {
      next.charter = body.charter;
      before.charter = existing.charter;
      after.charter = body.charter;
    }
    if (body.slackChannel !== undefined && body.slackChannel !== existing.slackChannel) {
      next.slackChannel = body.slackChannel;
      before.slackChannel = existing.slackChannel;
      after.slackChannel = body.slackChannel;
    }
    if (body.links !== undefined) {
      next.links = body.links;
      before.links = existing.links;
      after.links = body.links;
    }

    if (Object.keys(after).length === 0) {
      return c.json({ ok: true, noChange: true });
    }

    await db.update(groups).set(next).where(eq(groups.id, id));

    c.set("auditAction", "groups.update");
    c.set("auditTarget", { type: "groups", id });
    c.set("auditPayload", { before, after });
    return c.json({ ok: true });
  }
);

/**
 * POST /api/admin/groups/:id/publish
 * POST /api/admin/groups/:id/unpublish
 */
for (const [path, isPublished, action] of [
  ["/publish", true, "groups.publish"],
  ["/unpublish", false, "groups.unpublish"],
] as const) {
  adminGroupsByIdRoute.post(path, async (c) => {
    const id = c.req.param("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id))
      return c.json({ ok: false, error: "invalid_input" }, 400);
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);

    const existing = await db
      .select({ id: groups.id, name: groups.name, isPublished: groups.isPublished })
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    if (existing.isPublished === isPublished) {
      return c.json({ ok: true, noChange: true });
    }
    c.get("auditCapture")?.({ group: existing });
    await db
      .update(groups)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(groups.id, id));

    c.set("auditAction", action);
    c.set("auditTarget", { type: "groups", id });
    c.set("auditPayload", { name: existing.name });
    return c.json({ ok: true });
  });
}

/**
 * POST /api/admin/groups/:id/archive
 *
 * Soft-archive — sets is_active=false. The deleted_at column is
 * reserved for hard deletes (not exposed in v1).
 */
adminGroupsByIdRoute.post("/archive", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select({ id: groups.id, name: groups.name, isActive: groups.isActive })
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);
  if (!existing.isActive) {
    return c.json(
      { ok: false, error: "already_archived", message: "Group is already archived." },
      409
    );
  }

  c.get("auditCapture")?.({ group: existing });
  await db.update(groups).set({ isActive: false, updatedAt: new Date() }).where(eq(groups.id, id));

  c.set("auditAction", "groups.archive");
  c.set("auditTarget", { type: "groups", id });
  c.set("auditPayload", { name: existing.name });
  return c.json({ ok: true });
});

/**
 * POST /api/admin/groups/:id/reopen
 */
adminGroupsByIdRoute.post("/reopen", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select({ id: groups.id, name: groups.name, isActive: groups.isActive })
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);
  if (existing.isActive) {
    return c.json(
      { ok: false, error: "already_active", message: "Group is already active." },
      409
    );
  }

  c.get("auditCapture")?.({ group: existing });
  await db.update(groups).set({ isActive: true, updatedAt: new Date() }).where(eq(groups.id, id));

  c.set("auditAction", "groups.reopen");
  c.set("auditTarget", { type: "groups", id });
  c.set("auditPayload", { name: existing.name });
  return c.json({ ok: true });
});
