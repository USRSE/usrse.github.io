import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  artifactComments,
  artifactReviews,
  auditLog,
  events,
  users,
} from "../../../db/schema";
import { canEditArtifact } from "../../../lib/policies";
import type { AppEnv } from "../../../types";

export const adminEventByIdRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const patchBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["conference", "workshop", "meetup", "webinar", "community_call", "other"]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  url: z.string().url().max(500).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  scope: z.enum(["public", "community", "group", "staff_only"]).optional(),
  hostGroupId: z.string().uuid().nullable().optional(),
  hostOrgId: z.string().uuid().nullable().optional(),
  externalUrl: z.string().url().max(500).nullable().optional(),
}).strict();

adminEventByIdRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const id = c.req.param("id");
  if (!id || !UUID_RE.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
  const db = createDb(c.env.DATABASE_URL);

  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!event) return c.json({ ok: false, error: "not_found" }, 404);

  // Access: staff can view any; author can view their own; everyone else 403.
  if (actor.systemTier < 1 && event.authorId !== actor.user.id) {
    return c.json({ ok: false, error: "forbidden" }, 403);
  }

  const [reviews, comments, audit] = await Promise.all([
    db
      .select({
        id: artifactReviews.id,
        reviewerId: artifactReviews.reviewerId,
        reviewerName: users.email,
        decision: artifactReviews.decision,
        comment: artifactReviews.comment,
        entityRevision: artifactReviews.entityRevision,
        createdAt: artifactReviews.createdAt,
      })
      .from(artifactReviews)
      .leftJoin(users, eq(users.id, artifactReviews.reviewerId))
      .where(and(eq(artifactReviews.entityType, "event"), eq(artifactReviews.entityId, id)))
      .orderBy(asc(artifactReviews.createdAt)),
    db
      .select({
        id: artifactComments.id,
        authorId: artifactComments.authorId,
        authorName: users.email,
        body: artifactComments.body,
        createdAt: artifactComments.createdAt,
      })
      .from(artifactComments)
      .leftJoin(users, eq(users.id, artifactComments.authorId))
      .where(and(eq(artifactComments.entityType, "event"), eq(artifactComments.entityId, id)))
      .orderBy(asc(artifactComments.createdAt)),
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        actorId: auditLog.actorId,
        payload: auditLog.payload,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(eq(auditLog.targetId, id))
      .orderBy(desc(auditLog.createdAt))
      .limit(50),
  ]);

  return c.json({ ok: true, event, reviews, comments, audit });
});

adminEventByIdRoute.patch(
  "/",
  zValidator("json", patchBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: "invalid_input", issues: result.error.issues }, 400);
    }
  }),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const id = c.req.param("id");
    if (!id || !UUID_RE.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
    const db = createDb(c.env.DATABASE_URL);

    const existing = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    if (
      !canEditArtifact(actor, {
        entityType: "event",
        entityId: id,
        status: existing.status,
        authorId: existing.authorId,
      })
    ) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }

    const body = c.req.valid("json");
    const next: Record<string, unknown> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    for (const k of [
      "name", "type", "startDate", "endDate", "location", "url",
      "description", "scope", "hostGroupId", "hostOrgId", "externalUrl",
    ] as const) {
      if (k in body && body[k] !== undefined && body[k] !== existing[k]) {
        next[k] = body[k];
        before[k] = existing[k];
        after[k] = body[k];
      }
    }
    if (Object.keys(after).length === 0) {
      return c.json({ ok: true, noChange: true });
    }

    await db.update(events).set(next).where(eq(events.id, id));
    await db.insert(auditLog).values({
      actorId: actor.user.id,
      actorRole: actor.user.role,
      action: "events.update",
      targetType: "events",
      targetId: id,
      payload: { before, after },
    });

    return c.json({ ok: true });
  }
);
