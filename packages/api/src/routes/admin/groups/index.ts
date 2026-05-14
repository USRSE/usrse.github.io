import { Hono } from "hono";
import { and, asc, count, eq, inArray, isNull, isNotNull, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../../../db";
import { groups, groupMemberships } from "../../../db/schema";
import { canCreateGroup } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import { buildSlug } from "../../../lib/slug";
import type { AppEnv } from "../../../types";

export const adminGroupsRoute = new Hono<AppEnv>();

/**
 * GET /api/admin/groups
 *
 * Staff sees all groups (including unpublished, archived, soft-deleted).
 * Chairs see only the groups they chair — server-side scope check
 * uses actor.chairedGroupIds; chair-or-staff is the same gate that
 * canEditGroup uses elsewhere, just applied list-side.
 */
adminGroupsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const typeFilter = c.req.query("type");
  const statusFilter = c.req.query("status") ?? "active";
  const visibilityFilter = c.req.query("visibility") ?? "all";

  const conditions: SQL[] = [];
  if (statusFilter === "active") conditions.push(isNull(groups.deletedAt));
  if (statusFilter === "archived") conditions.push(isNotNull(groups.deletedAt));
  if (visibilityFilter === "published") conditions.push(eq(groups.isPublished, true));
  if (visibilityFilter === "draft") conditions.push(eq(groups.isPublished, false));
  if (
    typeFilter === "working_group" ||
    typeFilter === "affinity_group" ||
    typeFilter === "regional_group"
  ) {
    conditions.push(eq(groups.type, typeFilter));
  }

  if (actor.systemTier < 1) {
    const chairedIds = [...actor.chairedGroupIds];
    if (chairedIds.length === 0) {
      return c.json({ ok: true, rows: [], counts: emptyCounts() });
    }
    conditions.push(inArray(groups.id, chairedIds));
  }

  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      type: groups.type,
      description: groups.description,
      isActive: groups.isActive,
      isPublished: groups.isPublished,
      slackChannel: groups.slackChannel,
      createdAt: groups.createdAt,
      updatedAt: groups.updatedAt,
      deletedAt: groups.deletedAt,
    })
    .from(groups)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(groups.name));

  const ids = rows.map((r) => r.id);
  const memberCounts = ids.length
    ? await db
        .select({
          groupId: groupMemberships.groupId,
          n: count(groupMemberships.userId),
        })
        .from(groupMemberships)
        .where(inArray(groupMemberships.groupId, ids))
        .groupBy(groupMemberships.groupId)
    : [];
  const chairCounts = ids.length
    ? await db
        .select({
          groupId: groupMemberships.groupId,
          n: count(groupMemberships.userId),
        })
        .from(groupMemberships)
        .where(
          and(
            inArray(groupMemberships.groupId, ids),
            or(
              eq(groupMemberships.role, "chair"),
              eq(groupMemberships.role, "co_chair")
            )!
          )
        )
        .groupBy(groupMemberships.groupId)
    : [];
  const memberByGroup = new Map(memberCounts.map((r) => [r.groupId, Number(r.n)]));
  const chairByGroup = new Map(chairCounts.map((r) => [r.groupId, Number(r.n)]));

  return c.json({
    ok: true,
    rows: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      deletedAt: r.deletedAt instanceof Date ? r.deletedAt.toISOString() : r.deletedAt,
      memberCount: memberByGroup.get(r.id) ?? 0,
      chairCount: chairByGroup.get(r.id) ?? 0,
    })),
    counts: {
      total: rows.length,
      active: rows.filter((r) => !r.deletedAt && r.isActive).length,
      draft: rows.filter((r) => !r.isPublished).length,
      archived: rows.filter((r) => !!r.deletedAt || !r.isActive).length,
    },
  });
});

const createBodySchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["working_group", "affinity_group", "regional_group"]),
  description: z.string().max(500).optional(),
  slackChannel: z.string().max(80).optional(),
});

/**
 * POST /api/admin/groups
 *
 * Super_admin only. Slug auto-generated from name; collision → 409.
 * Returns the new row with is_published=false (draft state).
 */
adminGroupsRoute.post(
  "/",
  requirePolicy(canCreateGroup, () => undefined),
  zValidator("json", createBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");
    const slug = buildSlug(body.name);
    if (!slug) {
      return c.json({ ok: false, error: "invalid_input", message: "Name has no slug-safe characters." }, 400);
    }

    try {
      const inserted = await db
        .insert(groups)
        .values({
          name: body.name,
          slug,
          type: body.type,
          description: body.description ?? null,
          slackChannel: body.slackChannel ?? null,
          isActive: true,
          isPublished: false,
        })
        .returning({ id: groups.id, name: groups.name, slug: groups.slug, type: groups.type });

      const row = inserted[0];
      c.set("auditAction", "groups.create");
      c.set("auditTarget", { type: "groups", id: row.id });
      c.set("auditPayload", { name: row.name, slug: row.slug, type: row.type });
      return c.json({ ok: true, group: row });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("unique") || message.includes("duplicate")) {
        return c.json(
          { ok: false, error: "slug_conflict", message: "Another group already uses that slug." },
          409
        );
      }
      throw err;
    }
  }
);

function emptyCounts() {
  return { total: 0, active: 0, draft: 0, archived: 0 };
}
