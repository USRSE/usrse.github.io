import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { formSubmissions, forms } from "../../../db/schema";
import type { AppEnv } from "../../../types";
import type { FormSchema } from "../../../lib/forms/schemaTypes";

export const adminFormSubmissionsRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

adminFormSubmissionsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const formId = c.req.param("id");
  if (!formId || !UUID_RE.test(formId)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  const db = createDb(c.env.DATABASE_URL);

  const form = await db
    .select({ id: forms.id, authorId: forms.authorId, schema: forms.schema })
    .from(forms)
    .where(eq(forms.id, formId))
    .limit(1)
    .then((r) => r[0]);
  if (!form) return c.json({ ok: false, error: "not_found" }, 404);

  if (actor.systemTier < 1 && form.authorId !== actor.user.id) {
    return c.json({ ok: false, error: "forbidden" }, 403);
  }

  const limit = Math.min(500, parseInt(c.req.query("limit") ?? "100", 10));
  const offset = Math.max(0, parseInt(c.req.query("offset") ?? "0", 10));

  const rows = await db
    .select({
      id: formSubmissions.id,
      formRevision: formSubmissions.formRevision,
      submitterUserId: formSubmissions.submitterUserId,
      payload: formSubmissions.payload,
      submittedAt: formSubmissions.submittedAt,
    })
    .from(formSubmissions)
    .where(eq(formSubmissions.formId, formId))
    .orderBy(desc(formSubmissions.submittedAt))
    .limit(limit)
    .offset(offset);

  // CSV branch
  if (
    c.req.query("format") === "csv" ||
    c.req.header("Accept") === "text/csv"
  ) {
    const schema = form.schema as FormSchema;
    const headerCols = [
      "submitted_at",
      "submitter_user_id",
      "form_revision",
      ...schema.fields.map((f) => f.id),
    ];
    const lines: string[] = [headerCols.map(csvCell).join(",")];
    for (const r of rows) {
      const payload = (r.payload ?? {}) as Record<string, unknown>;
      lines.push(
        [
          r.submittedAt instanceof Date
            ? r.submittedAt.toISOString()
            : String(r.submittedAt),
          r.submitterUserId ?? "",
          r.formRevision,
          ...schema.fields.map((f) => csvCell(payload[f.id])),
        ].join(",")
      );
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="form-${formId}-submissions.csv"`,
      },
    });
  }

  return c.json({ ok: true, rows });
});

function csvCell(v: unknown): string {
  const s =
    v === null || v === undefined
      ? ""
      : Array.isArray(v)
      ? v.join(";")
      : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
