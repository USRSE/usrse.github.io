import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { announcements, artifactComments, artifactReviews, auditLog, users } from "../../../db/schema";
import { canEditArtifact } from "../../../lib/policies";
import type { AppEnv } from "../../../types";

export const adminAnnouncementByIdRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const patchBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000).optional(),
  linkUrl: z.string().url().max(500).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  scope: z.enum(["public", "community", "group", "staff_only"]).optional(),
  hostGroupId: z.string().uuid().nullable().optional(),
  hostOrgId: z.string().uuid().nullable().optional(),
}).strict();

adminAnnouncementByIdRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const id = c.req.param("id");
  if (!id || !UUID_RE.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
  const db = createDb(c.env.DATABASE_URL);

  const announcement = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!announcement) return c.json({ ok: false, error: "not_found" }, 404);

  if (actor.systemTier < 1 && announcement.authorId !== actor.user.id) {
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
      .where(and(eq(artifactReviews.entityType, "announcement"), eq(artifactReviews.entityId, id)))
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
      .where(and(eq(artifactComments.entityType, "announcement"), eq(artifactComments.entityId, id)))
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

  return c.json({ ok: true, announcement, reviews, comments, audit });
});

adminAnnouncementByIdRoute.patch(
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
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    if (
      !canEditArtifact(actor, {
        entityType: "announcement",
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
      "title", "body", "linkUrl", "scope", "hostGroupId", "hostOrgId",
    ] as const) {
      if (k in body && body[k] !== undefined && body[k] !== existing[k]) {
        next[k] = body[k];
        before[k] = existing[k];
        after[k] = body[k];
      }
    }
    // expiresAt needs Date conversion
    if (body.expiresAt !== undefined) {
      const nextExpires = body.expiresAt === null ? null : new Date(body.expiresAt);
      if (nextExpires?.getTime() !== existing.expiresAt?.getTime()) {
        next.expiresAt = nextExpires;
        before.expiresAt = existing.expiresAt;
        after.expiresAt = nextExpires;
      }
    }
    if (Object.keys(after).length === 0) {
      return c.json({ ok: true, noChange: true });
    }

    await db.update(announcements).set(next).where(eq(announcements.id, id));
    await db.insert(auditLog).values({
      actorId: actor.user.id,
      actorRole: actor.user.role,
      action: "announcements.update",
      targetType: "announcements",
      targetId: id,
      payload: { before, after },
    });

    return c.json({ ok: true });
  }
);
