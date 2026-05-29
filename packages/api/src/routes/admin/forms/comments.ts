import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { artifactComments, forms } from "../../../db/schema";
import { sanitizeCommentBody } from "../../../lib/artifacts/comments";
import type { AppEnv } from "../../../types";

export const adminFormCommentsRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const bodySchema = z.object({ body: z.string() });

adminFormCommentsRoute.post(
  "/",
  zValidator("json", bodySchema, (result, c) => {
    if (!result.success) return c.json({ ok: false, error: "invalid_input" }, 400);
  }),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const id = c.req.param("id");
    if (!id || !UUID_RE.test(id)) {
      return c.json({ ok: false, error: "invalid_input" }, 400);
    }

    const db = createDb(c.env.DATABASE_URL);
    const existing = await db
      .select({ authorId: forms.authorId })
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    if (actor.systemTier < 1 && existing.authorId !== actor.user.id) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }

    const sanitized = sanitizeCommentBody(c.req.valid("json").body);
    if (!sanitized.ok) return c.json({ ok: false, error: sanitized.error }, 400);

    const [row] = await db
      .insert(artifactComments)
      .values({
        entityType: "form",
        entityId: id,
        authorId: actor.user.id,
        body: sanitized.body,
      })
      .returning();

    return c.json({ ok: true, comment: row }, 201);
  }
);
