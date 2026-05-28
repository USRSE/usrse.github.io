import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { createDb } from "../../../db";
import { forms } from "../../../db/schema";
import type { AppEnv } from "../../../types";
import { parseFormSchema } from "../../../lib/forms/schemaParser";
import { adminFormByIdRoute } from "./byId";
import { adminFormCommentsRoute } from "./comments";
import { adminFormTransitionsRoute } from "./transitions";

export const adminFormsRoute = new Hono<AppEnv>();

const SCOPES = ["public", "community", "group", "staff_only"] as const;
const STATUSES = [
  "draft", "in_review", "changes_requested", "rejected", "published",
  "expired", "archived",
] as const;
const ENTITY_TYPES = ["event", "announcement", "group"] as const;

const createBodySchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .min(1)
      .max(80),
    description: z.string().max(2000).optional(),
    schema: z.unknown(),
    entityType: z.enum(ENTITY_TYPES).optional(),
    entityId: z.string().uuid().optional(),
    scope: z.enum(SCOPES).optional(),
    hostGroupId: z.string().uuid().optional(),
  })
  .refine(
    (v) =>
      (v.entityType === undefined && v.entityId === undefined) ||
      (v.entityType !== undefined && v.entityId !== undefined),
    {
      message: "entityType and entityId must both be set or both be omitted",
      path: ["entityType"],
    }
  );

adminFormsRoute.post(
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

    const schemaResult = parseFormSchema(body.schema);
    if (!schemaResult.ok) {
      return c.json(
        { ok: false, error: "invalid_schema", message: schemaResult.error },
        400
      );
    }

    let scope = body.scope;
    if (!scope) {
      if (actor.systemTier === 0 && actor.chairedGroupIds.size > 0) {
        scope = "group";
      } else {
        scope = "community";
      }
    }

    let hostGroupId = body.hostGroupId;
    if (!hostGroupId && scope === "group" && actor.chairedGroupIds.size > 0) {
      hostGroupId = [...actor.chairedGroupIds][0];
    }

    const [row] = await db
      .insert(forms)
      .values({
        title: body.title,
        slug: body.slug,
        description: body.description ?? null,
        schema: schemaResult.schema,
        entityType: body.entityType ?? null,
        entityId: body.entityId ?? null,
        status: "draft",
        revision: 1,
        authorId: actor.user.id,
        scope,
        hostGroupId: hostGroupId ?? null,
      })
      .returning();

    return c.json(
      {
        ok: true,
        form: {
          id: row.id,
          title: row.title,
          slug: row.slug,
          status: row.status,
          scope: row.scope,
          revision: row.revision,
          authorId: row.authorId,
          entityType: row.entityType,
          entityId: row.entityId,
          createdAt: row.createdAt,
        },
      },
      201
    );
  }
);

adminFormsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const db = createDb(c.env.DATABASE_URL);

  const status = c.req.query("status");
  const scope = c.req.query("scope");
  const entityType = c.req.query("entityType");
  const q = c.req.query("q");
  const limit = Math.min(200, parseInt(c.req.query("limit") ?? "50", 10));
  const offset = Math.max(0, parseInt(c.req.query("offset") ?? "0", 10));

  const whereParts = [isNull(forms.deletedAt)];
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    whereParts.push(eq(forms.status, status as (typeof STATUSES)[number]));
  }
  if (scope && SCOPES.includes(scope as (typeof SCOPES)[number])) {
    whereParts.push(eq(forms.scope, scope as (typeof SCOPES)[number]));
  }
  if (
    entityType &&
    ENTITY_TYPES.includes(entityType as (typeof ENTITY_TYPES)[number])
  ) {
    whereParts.push(
      eq(forms.entityType, entityType as (typeof ENTITY_TYPES)[number])
    );
  }
  if (q) whereParts.push(ilike(forms.title, `%${q}%`));

  const rows = await db
    .select({
      id: forms.id,
      title: forms.title,
      slug: forms.slug,
      status: forms.status,
      revision: forms.revision,
      scope: forms.scope,
      authorId: forms.authorId,
      hostGroupId: forms.hostGroupId,
      entityType: forms.entityType,
      entityId: forms.entityId,
      acceptsSubmissions: forms.acceptsSubmissions,
      createdAt: forms.createdAt,
    })
    .from(forms)
    .where(and(...whereParts))
    .orderBy(desc(forms.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ ok: true, rows });
});

adminFormsRoute.route("/:id/transitions", adminFormTransitionsRoute);
adminFormsRoute.route("/:id/comments", adminFormCommentsRoute);
adminFormsRoute.route("/:id", adminFormByIdRoute);
