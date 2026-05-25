import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { createDb } from "../../../db";
import { events } from "../../../db/schema";
import type { AppEnv } from "../../../types";

export const adminEventsRoute = new Hono<AppEnv>();

const EVENT_TYPES = ["conference", "workshop", "meetup", "webinar", "community_call", "other"] as const;
const SCOPES = ["public", "community", "group", "staff_only"] as const;
const STATUSES = [
  "draft", "in_review", "changes_requested", "rejected", "published",
  "cancelled", "completed", "archived",
] as const;

const createBodySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(EVENT_TYPES),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().max(200).optional(),
  url: z.string().url().max(500).optional(),
  description: z.string().max(5000).optional(),
  scope: z.enum(SCOPES).optional(),
  hostGroupId: z.string().uuid().optional(),
  hostOrgId: z.string().uuid().optional(),
  externalUrl: z.string().url().max(500).optional(),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : `event-${suffix}`;
}

adminEventsRoute.post(
  "/",
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
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    let scope = body.scope;
    if (!scope) {
      if (actor.systemTier === 0 && actor.chairedGroupIds.size > 0) {
        scope = "group";
      } else if (actor.systemTier === 0) {
        scope = "community";
      } else {
        scope = "community";
      }
    }

    let hostGroupId = body.hostGroupId;
    if (!hostGroupId && scope === "group" && actor.chairedGroupIds.size > 0) {
      hostGroupId = [...actor.chairedGroupIds][0];
    }

    const slug = slugify(body.name);

    const [row] = await db
      .insert(events)
      .values({
        slug,
        name: body.name,
        type: body.type,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
        location: body.location ?? null,
        url: body.url ?? null,
        description: body.description ?? null,
        status: "draft",
        revision: 1,
        authorId: actor.user.id,
        scope,
        hostGroupId: hostGroupId ?? null,
        hostOrgId: body.hostOrgId ?? null,
        externalUrl: body.externalUrl ?? null,
      })
      .returning();

    return c.json(
      {
        ok: true,
        event: {
          id: row.id,
          slug: row.slug,
          name: row.name,
          type: row.type,
          status: row.status,
          scope: row.scope,
          revision: row.revision,
          authorId: row.authorId,
          startDate: row.startDate,
          endDate: row.endDate,
          createdAt: row.createdAt,
        },
      },
      201
    );
  }
);

adminEventsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const db = createDb(c.env.DATABASE_URL);

  const status = c.req.query("status");
  const type = c.req.query("type");
  const scope = c.req.query("scope");
  const hostGroupId = c.req.query("hostGroupId");
  const hostOrgId = c.req.query("hostOrgId");
  const q = c.req.query("q");
  const limit = Math.min(200, parseInt(c.req.query("limit") ?? "50", 10));
  const offset = Math.max(0, parseInt(c.req.query("offset") ?? "0", 10));

  const whereParts = [isNull(events.deletedAt)];
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    whereParts.push(eq(events.status, status as (typeof STATUSES)[number]));
  }
  if (type && EVENT_TYPES.includes(type as (typeof EVENT_TYPES)[number])) {
    whereParts.push(eq(events.type, type as (typeof EVENT_TYPES)[number]));
  }
  if (scope && SCOPES.includes(scope as (typeof SCOPES)[number])) {
    whereParts.push(eq(events.scope, scope as (typeof SCOPES)[number]));
  }
  if (hostGroupId) whereParts.push(eq(events.hostGroupId, hostGroupId));
  if (hostOrgId) whereParts.push(eq(events.hostOrgId, hostOrgId));
  if (q) whereParts.push(ilike(events.name, `%${q}%`));

  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      name: events.name,
      type: events.type,
      status: events.status,
      revision: events.revision,
      scope: events.scope,
      authorId: events.authorId,
      hostGroupId: events.hostGroupId,
      hostOrgId: events.hostOrgId,
      startDate: events.startDate,
      endDate: events.endDate,
      createdAt: events.createdAt,
    })
    .from(events)
    .where(and(...whereParts))
    .orderBy(desc(events.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ ok: true, rows });
});
