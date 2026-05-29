import { Hono } from "hono";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { createDb } from "../db";
import { announcements, broadcastChannels, broadcastRequests, groups, organizations } from "../db/schema";
import type { AppEnv } from "../types";

export const announcementsRoute = new Hono<AppEnv>();

/**
 * GET /announcements/active-banner
 *
 * Returns at most one announcement: the most-recently-published row whose
 * effective status is `published` (not expired) AND which has at least one
 * broadcast_channels row with channel='site_banner' AND status='posted'.
 *
 * In v1, no announcements exist yet — the endpoint exists so the SPA's
 * <SiteBanner /> can mount without conditional code. Plan 3 wires the
 * real query when announcements ship.
 */
announcementsRoute.get("/active-banner", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ banner: null });
  const db = createDb(c.env.DATABASE_URL);

  const now = new Date();
  const row = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      linkUrl: announcements.linkUrl,
      expiresAt: announcements.expiresAt,
    })
    .from(announcements)
    .innerJoin(
      broadcastRequests,
      and(
        eq(broadcastRequests.entityType, "announcement"),
        eq(broadcastRequests.entityId, announcements.id)
      )
    )
    .innerJoin(
      broadcastChannels,
      and(
        eq(broadcastChannels.broadcastRequestId, broadcastRequests.id),
        eq(broadcastChannels.channel, "site_banner"),
        eq(broadcastChannels.status, "posted")
      )
    )
    .where(
      and(
        eq(announcements.status, "published"),
        isNull(announcements.deletedAt),
        or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now))
      )
    )
    .orderBy(desc(announcements.createdAt))
    .limit(1)
    .then((r) => r[0]);

  if (!row) return c.json({ banner: null });
  return c.json({
    banner: {
      id: row.id,
      title: row.title,
      body: row.body,
      linkUrl: row.linkUrl,
    },
  });
});

/**
 * GET /announcements/:slug
 *
 * Public detail page data. Visibility-filtered the same way /events/:slug is:
 *   - anonymous viewer sees only scope='public'
 *   - signed-in member also sees scope='community'
 *   - 'group' and 'staff_only' require staff
 * 404 for draft/in_review/expired or out-of-scope.
 */
announcementsRoute.get("/:slug", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "not_found" }, 404);
  const slug = c.req.param("slug");
  if (!slug) return c.json({ ok: false, error: "not_found" }, 404);
  const db = createDb(c.env.DATABASE_URL);

  const row = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.slug, slug),
        eq(announcements.status, "published"),
        isNull(announcements.deletedAt)
      )
    )
    .limit(1)
    .then((r) => r[0]);
  if (!row) return c.json({ ok: false, error: "not_found" }, 404);

  // Expired auto-effective-status: hide from public read
  if (row.expiresAt && row.expiresAt < new Date()) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }

  const actor = c.get("actor");
  if (row.scope === "community" && !actor) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }
  if (row.scope === "group" || row.scope === "staff_only") {
    if (!actor || actor.systemTier < 1) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  }

  const [hostGroup, hostOrg] = await Promise.all([
    row.hostGroupId
      ? db
          .select({ id: groups.id, name: groups.name, slug: groups.slug })
          .from(groups)
          .where(eq(groups.id, row.hostGroupId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    row.hostOrgId
      ? db
          .select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, row.hostOrgId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  return c.json({
    ok: true,
    announcement: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      body: row.body,
      linkUrl: row.linkUrl,
      scope: row.scope,
      expiresAt: row.expiresAt,
      hostGroup,
      hostOrg,
    },
  });
});
