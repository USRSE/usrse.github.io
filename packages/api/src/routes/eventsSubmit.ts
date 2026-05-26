import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "../db";
import { events } from "../db/schema";
import { applyTransition } from "../lib/lifecycle";
import { drizzleLifecycleDb } from "../lib/lifecycle/drizzleAdapter";
import type { AppEnv } from "../types";

export const eventsSubmitRoute = new Hono<AppEnv>();

const submitBodySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum([
    "conference",
    "workshop",
    "meetup",
    "webinar",
    "community_call",
    "other",
  ]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  externalUrl: z.string().url().max(500).optional(),
  hostOrgId: z.string().uuid().optional(),
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

/**
 * POST /events/submit
 *
 * Auth-gated member submission. Creates a draft event with the member
 * as author, defaults scope to 'community', then transitions to
 * 'in_review' immediately so it appears in the staff queue.
 *
 * If the transition fails (shouldn't normally happen — draft → in_review
 * is always valid), the row is left as `draft` for staff cleanup via the
 * admin queue. We don't try to delete it, since the failed transition may
 * have already produced audit_log entries that FK back via target_id.
 */
eventsSubmitRoute.post(
  "/",
  zValidator("json", submitBodySchema, (result, c) => {
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
    const body = c.req.valid("json");
    const db = createDb(c.env.DATABASE_URL);

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
        description: body.description ?? null,
        status: "draft",
        revision: 1,
        authorId: actor.user.id,
        scope: "community",
        hostOrgId: body.hostOrgId ?? null,
        externalUrl: body.externalUrl ?? null,
      })
      .returning();

    // Immediately submit for review.
    const lifecycleDb = drizzleLifecycleDb(db, {
      id: actor.user.id,
      role: actor.user.role,
    });
    const result = await applyTransition(lifecycleDb, {
      entityType: "event",
      entityId: row.id,
      action: "submit_for_review",
      actorId: actor.user.id,
    });
    if (!result.ok) {
      return c.json({ ok: false, error: result.error }, 400);
    }

    return c.json(
      {
        ok: true,
        event: {
          id: row.id,
          status: "in_review",
          slug: row.slug,
          authorId: row.authorId,
        },
      },
      201
    );
  }
);
