import { Hono } from "hono";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createDb } from "../db";
import { groups, groupMemberships, profiles, users } from "../db/schema";
import type { AppEnv } from "../types";

export const publicGroupsRoute = new Hono<AppEnv>();

/**
 * GET /groups?type=<type>
 *
 * Public list of published, active, non-deleted groups. Minimal
 * card shape — no charter, no links, no member roster.
 */
publicGroupsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const typeFilter = c.req.query("type");
  const conditions: SQL[] = [
    eq(groups.isActive, true),
    eq(groups.isPublished, true),
    isNull(groups.deletedAt),
  ];
  if (
    typeFilter === "working_group" ||
    typeFilter === "affinity_group" ||
    typeFilter === "regional_group"
  ) {
    conditions.push(eq(groups.type, typeFilter));
  }

  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      type: groups.type,
      description: groups.description,
      slackChannel: groups.slackChannel,
    })
    .from(groups)
    .where(and(...conditions))
    .orderBy(asc(groups.name));

  return c.json({ ok: true, rows });
});

/**
 * GET /groups/:id
 *
 * Public per-group detail. Includes charter, links, and chair
 * names/photos (no emails — that's admin-only).
 */
publicGroupsRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const row = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      type: groups.type,
      description: groups.description,
      slackChannel: groups.slackChannel,
      charter: groups.charter,
      links: groups.links,
      isActive: groups.isActive,
      isPublished: groups.isPublished,
      deletedAt: groups.deletedAt,
    })
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  // Only published, active, non-deleted groups visible publicly.
  if (!row || !row.isActive || !row.isPublished || row.deletedAt) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }

  const chairs = await db
    .select({
      displayName: profiles.displayName,
      photoUrl: profiles.photoUrl,
    })
    .from(groupMemberships)
    .innerJoin(users, eq(users.id, groupMemberships.userId))
    .leftJoin(profiles, eq(profiles.userId, groupMemberships.userId))
    .where(
      and(
        eq(groupMemberships.groupId, id),
        or(
          eq(groupMemberships.role, "chair"),
          eq(groupMemberships.role, "co_chair")
        )!
      )
    );

  return c.json({
    ok: true,
    group: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      description: row.description,
      slackChannel: row.slackChannel,
      charter: row.charter,
      links: row.links,
      chairs,
    },
  });
});
