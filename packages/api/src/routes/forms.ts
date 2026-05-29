import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { createDb } from "../db";
import { formSubmissions, forms } from "../db/schema";
import { validateSubmissionPayload } from "../lib/forms/schemaParser";
import type { FormSchema } from "../lib/forms/schemaTypes";
import type { AppEnv } from "../types";

export const formsRoute = new Hono<AppEnv>();

formsRoute.get("/:slug", async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }
  const slug = c.req.param("slug");
  if (!slug) return c.json({ ok: false, error: "not_found" }, 404);
  const db = createDb(c.env.DATABASE_URL);

  const form = await db
    .select()
    .from(forms)
    .where(
      and(
        eq(forms.slug, slug),
        eq(forms.status, "published"),
        isNull(forms.deletedAt)
      )
    )
    .limit(1)
    .then((r) => r[0]);
  if (!form) return c.json({ ok: false, error: "not_found" }, 404);

  // Scope check via optionalActor
  const actor = c.get("actor");
  if (form.scope === "community" && !actor) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }
  if (form.scope === "group" || form.scope === "staff_only") {
    if (!actor || actor.systemTier < 1) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  }

  return c.json({
    ok: true,
    form: {
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description,
      schema: form.schema,
      revision: form.revision,
      acceptsSubmissions: form.acceptsSubmissions,
    },
  });
});

formsRoute.post("/:slug/submissions", async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json({ ok: false, error: "internal" }, 500);
  }
  const slug = c.req.param("slug");
  if (!slug) return c.json({ ok: false, error: "not_found" }, 404);
  const db = createDb(c.env.DATABASE_URL);

  const form = await db
    .select()
    .from(forms)
    .where(
      and(
        eq(forms.slug, slug),
        eq(forms.status, "published"),
        isNull(forms.deletedAt)
      )
    )
    .limit(1)
    .then((r) => r[0]);
  if (!form) return c.json({ ok: false, error: "not_found" }, 404);

  if (!form.acceptsSubmissions) {
    return c.json({ ok: false, error: "closed" }, 410);
  }

  const actor = c.get("actor");
  if (form.scope !== "public" && !actor) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }
  if (
    (form.scope === "group" || form.scope === "staff_only") &&
    (!actor || actor.systemTier < 1)
  ) {
    return c.json({ ok: false, error: "forbidden" }, 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid_json" }, 400);
  }

  const validation = validateSubmissionPayload(
    form.schema as FormSchema,
    body
  );
  if (!validation.ok) {
    return c.json(
      { ok: false, error: validation.error, field: validation.field },
      400
    );
  }

  const [row] = await db
    .insert(formSubmissions)
    .values({
      formId: form.id,
      formRevision: form.revision,
      submitterUserId: actor?.user.id ?? null,
      payload: validation.cleanPayload,
    })
    .returning();

  return c.json({ ok: true, submissionId: row.id }, 201);
});
