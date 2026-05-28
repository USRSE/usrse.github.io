import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  artifactComments,
  artifactReviews,
  auditLog,
  formSubmissions,
  forms,
  users,
} from "../../../db/schema";
import { canEditArtifact } from "../../../lib/policies";
import { parseFormSchema } from "../../../lib/forms/schemaParser";
import type { AppEnv } from "../../../types";

export const adminFormByIdRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;
const ENTITY_TYPES = ["event", "announcement", "group"] as const;
const SCOPES = ["public", "community", "group", "staff_only"] as const;

const patchBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .min(1)
      .max(80)
      .optional(),
    description: z.string().max(2000).nullable().optional(),
    schema: z.unknown().optional(),
    entityType: z.enum(ENTITY_TYPES).nullable().optional(),
    entityId: z.string().uuid().nullable().optional(),
    scope: z.enum(SCOPES).optional(),
    hostGroupId: z.string().uuid().nullable().optional(),
    acceptsSubmissions: z.boolean().optional(),
  })
  .strict();

adminFormByIdRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const id = c.req.param("id");
  if (!id || !UUID_RE.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  const db = createDb(c.env.DATABASE_URL);

  const form = await db
    .select()
    .from(forms)
    .where(eq(forms.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!form) return c.json({ ok: false, error: "not_found" }, 404);

  if (actor.systemTier < 1 && form.authorId !== actor.user.id) {
    return c.json({ ok: false, error: "forbidden" }, 403);
  }

  const [reviews, comments, audit, submissionCountRow] = await Promise.all([
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
      .where(
        and(eq(artifactReviews.entityType, "form"), eq(artifactReviews.entityId, id))
      )
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
      .where(
        and(eq(artifactComments.entityType, "form"), eq(artifactComments.entityId, id))
      )
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
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, id))
      .then((r) => r[0]),
  ]);

  return c.json({
    ok: true,
    form,
    reviews,
    comments,
    audit,
    submissionCount: submissionCountRow?.n ?? 0,
  });
});

adminFormByIdRoute.patch(
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
    if (!c.env.DATABASE_URL) {
      return c.json({ ok: false, error: "internal" }, 500);
    }
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const id = c.req.param("id");
    if (!id || !UUID_RE.test(id)) {
      return c.json({ ok: false, error: "invalid_input" }, 400);
    }
    const db = createDb(c.env.DATABASE_URL);

    const existing = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    if (
      !canEditArtifact(actor, {
        entityType: "form",
        entityId: id,
        status: existing.status,
        authorId: existing.authorId,
      })
    ) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }

    const body = c.req.valid("json");

    // Re-validate schema if provided.
    let parsedSchema: unknown | undefined;
    if ("schema" in body && body.schema !== undefined) {
      const result = parseFormSchema(body.schema);
      if (!result.ok) {
        return c.json(
          { ok: false, error: "invalid_schema", message: result.error },
          400
        );
      }
      parsedSchema = result.schema;
    }

    // CHECK constraint: both entityType and entityId must be null or both set.
    const nextEntityType =
      "entityType" in body ? body.entityType ?? null : existing.entityType;
    const nextEntityId =
      "entityId" in body ? body.entityId ?? null : existing.entityId;
    if ((nextEntityType === null) !== (nextEntityId === null)) {
      return c.json(
        {
          ok: false,
          error: "invalid_input",
          message: "entityType and entityId must both be set or both be null",
        },
        400
      );
    }

    const next: Record<string, unknown> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    for (const k of [
      "title",
      "slug",
      "description",
      "scope",
      "hostGroupId",
      "acceptsSubmissions",
    ] as const) {
      if (k in body && body[k] !== undefined && body[k] !== existing[k]) {
        next[k] = body[k];
        before[k] = existing[k];
        after[k] = body[k];
      }
    }
    if (parsedSchema !== undefined) {
      next.schema = parsedSchema;
      before.schema = existing.schema;
      after.schema = parsedSchema;
    }
    if ("entityType" in body && nextEntityType !== existing.entityType) {
      next.entityType = nextEntityType;
      before.entityType = existing.entityType;
      after.entityType = nextEntityType;
    }
    if ("entityId" in body && nextEntityId !== existing.entityId) {
      next.entityId = nextEntityId;
      before.entityId = existing.entityId;
      after.entityId = nextEntityId;
    }

    if (Object.keys(after).length === 0) {
      return c.json({ ok: true, noChange: true });
    }

    await db.update(forms).set(next).where(eq(forms.id, id));
    await db.insert(auditLog).values({
      actorId: actor.user.id,
      actorRole: actor.user.role,
      action: "forms.update",
      targetType: "forms",
      targetId: id,
      payload: { before, after },
    });

    return c.json({ ok: true });
  }
);
