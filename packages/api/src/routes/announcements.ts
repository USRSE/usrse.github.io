import { Hono } from "hono";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { createDb } from "../db";
import { announcements, broadcastChannels, broadcastRequests } from "../db/schema";
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
