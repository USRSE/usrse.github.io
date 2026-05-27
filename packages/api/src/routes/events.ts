import { Hono } from "hono";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { createDb } from "../db";
import { events, groups, organizations, users } from "../db/schema";
import type { AppEnv } from "../types";

export const eventsRoute = new Hono<AppEnv>();

/**
 * GET /events
 *
 * Public list of published events, filtered by scope visibility:
 *   - anonymous viewer: only scope='public'
 *   - signed-in member: scope IN ('public', 'community')
 *
 * Auto-completed events (past end_date) are filtered out at read time.
 */
eventsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ events: [] });
  const db = createDb(c.env.DATABASE_URL);
  const actor = c.get("actor");

  const visibleScopes: ("public" | "community" | "group")[] = ["public"];
  if (actor && actor.systemTier >= 0) {
    visibleScopes.push("community");
  }

  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      name: events.name,
      type: events.type,
      startDate: events.startDate,
      endDate: events.endDate,
      location: events.location,
      description: events.description,
      scope: events.scope,
      externalUrl: events.externalUrl,
      authorId: events.authorId,
    })
    .from(events)
    .where(
      and(
        eq(events.status, "published"),
        isNull(events.deletedAt),
        inArray(events.scope, visibleScopes)
      )
    )
    .orderBy(asc(events.startDate));

  // Filter out events whose end_date has passed (effective auto-completed)
  const today = new Date().toISOString().slice(0, 10);
  const active = rows.filter((e) => !e.endDate || e.endDate >= today);

  return c.json({ events: active });
});

/**
 * GET /events/:slug
 *
 * Public event detail. Returns the event + host_group + host_org +
 * author display name (when public profile permits). 404 for non-published.
 */
eventsRoute.get("/:slug", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "not_found" }, 404);
  const slug = c.req.param("slug");
  if (!slug) return c.json({ ok: false, error: "not_found" }, 404);
  const db = createDb(c.env.DATABASE_URL);

  const event = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.slug, slug),
        eq(events.status, "published"),
        isNull(events.deletedAt)
      )
    )
    .limit(1)
    .then((r) => r[0]);
  if (!event) return c.json({ ok: false, error: "not_found" }, 404);

  // Visibility check: anonymous viewer only sees public.
  const actor = c.get("actor");
  if (event.scope === "community" && !actor) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }
  if (event.scope === "group" || event.scope === "staff_only") {
    if (!actor || actor.systemTier < 1) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  }

  const [hostGroup, hostOrg, author] = await Promise.all([
    event.hostGroupId
      ? db
          .select({ id: groups.id, name: groups.name, slug: groups.slug })
          .from(groups)
          .where(eq(groups.id, event.hostGroupId))
          .limit(1)
          .then((r) => r[0])
      : null,
    event.hostOrgId
      ? db
          .select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, event.hostOrgId))
          .limit(1)
          .then((r) => r[0])
      : null,
    event.authorId
      ? db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(eq(users.id, event.authorId))
          .limit(1)
          .then((r) => r[0])
      : null,
  ]);

  return c.json({
    event: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      url: event.url,
      description: event.description,
      scope: event.scope,
      externalUrl: event.externalUrl,
      hostGroup,
      hostOrg,
      author: author ? { id: author.id } : null,
    },
  });
});
