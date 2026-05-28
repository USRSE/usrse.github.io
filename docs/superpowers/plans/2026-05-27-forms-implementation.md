# Forms Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the forms subsystem on top of the Plan 1 foundation and the Plan 2/3 admin patterns: admin forms CRUD with the standard 4-tab detail UI plus an inline form-builder in the Content tab (Coltorapps headless), a `form_submissions` admin sub-page with CSV export, polymorphic form-to-entity attachment, and a public form renderer at `/forms/:slug` that consumes the stored schema. No file uploads (spec §10 — defers to follow-up), no analytics beyond submission counts.

**Architecture:** New Hono sub-app at `/admin/forms/*` (same shape as events + announcements) plus `/admin/forms/:id/submissions` for the admin-only submissions view. Two new public endpoints: `GET /forms/:slug` returns schema + metadata for published forms; `POST /forms/:slug/submissions` validates a submitted payload against the stored schema and inserts a `form_submissions` row. The form schema is stored as `jsonb` in `forms.schema` — we own the format, Coltorapps just authors it. A new server-side normalizer (`packages/api/src/lib/forms/schemaParser.ts`) caps field count, whitelists field types, and rejects unknown shapes before persistence. The admin builder UI mounts Coltorapps headless primitives onto the existing `EditorialInput` / `EditorialTextarea` / `EditorialSelect` components so the vendor never reaches our CSS. A new `<FormRenderer />` in `apps/web` consumes the same schema for the public surface.

**Tech Stack:** Coltorapps Builder (MIT, headless), Hono, Drizzle, Neon HTTP, Zod, React 19 — all patterns from Plans 1-3.

**Spec:** [`docs/superpowers/specs/2026-05-20-events-announcements-forms-design.md`](../specs/2026-05-20-events-announcements-forms-design.md) §5
**Builds on:** Plan 1 (`#1994` → `31a0f2b`), Plan 2 (`#1998` → `54c393e`), Plan 3 (`#1999` → `976bbc8`)

---

## Pre-flight

- [ ] **Confirm on `cdcore09/site-redesign`, clean tree, prior plans merged**

```bash
git checkout cdcore09/site-redesign
git pull --ff-only
git log --oneline -3
```

Expected: HEAD at or after `976bbc8 feat: announcements subsystem (admin + site banner) (#1999)`.

- [ ] **Verify baseline**

```bash
npm run typecheck
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npm test ; cd ../..
```

234+ tests pass, typecheck clean.

- [ ] **Create feature branch**

```bash
git checkout -b cdcore09/forms-implementation
```

---

## Task 1: Server-side form-schema parser

**Why first:** the schema-shape decision is load-bearing for every other task. Lock the format we accept BEFORE writing the route handlers that persist it or the renderer that interprets it.

**Files:**
- Create: `packages/api/src/lib/forms/schemaTypes.ts`
- Create: `packages/api/src/lib/forms/schemaParser.ts`
- Create: `packages/api/src/lib/forms/schemaParser.test.ts`

- [ ] **Step 1: Define the schema types**

`packages/api/src/lib/forms/schemaTypes.ts`:

```ts
/**
 * Form schema shape — the JSON blob stored in `forms.schema`. We own this
 * format. Coltorapps Builder produces it (with some transformation in the
 * admin layer); the public renderer consumes it. Designed to survive a
 * builder-library swap.
 */

export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "number"
  | "date"
  | "single_choice"
  | "multi_choice"
  | "checkbox";

export interface FormFieldBase {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  hint?: string;
}

export interface FormFieldChoiceOption {
  value: string;
  label: string;
}

export interface FormFieldChoice extends FormFieldBase {
  type: "single_choice" | "multi_choice";
  options: FormFieldChoiceOption[];
}

export interface FormFieldText extends FormFieldBase {
  type: "text" | "textarea" | "email" | "url";
  placeholder?: string;
  maxLength?: number;
}

export interface FormFieldNumber extends FormFieldBase {
  type: "number";
  min?: number;
  max?: number;
}

export interface FormFieldDate extends FormFieldBase {
  type: "date";
}

export interface FormFieldCheckbox extends FormFieldBase {
  type: "checkbox";
}

export type FormField =
  | FormFieldText
  | FormFieldNumber
  | FormFieldDate
  | FormFieldChoice
  | FormFieldCheckbox;

export interface FormSchema {
  fields: FormField[];
}

export const ALLOWED_FIELD_TYPES: ReadonlyArray<FormFieldType> = [
  "text",
  "textarea",
  "email",
  "url",
  "number",
  "date",
  "single_choice",
  "multi_choice",
  "checkbox",
];

export const MAX_FIELDS = 50;
export const MAX_CHOICE_OPTIONS = 30;
export const MAX_LABEL_LENGTH = 200;
```

- [ ] **Step 2: Write the failing test**

`packages/api/src/lib/forms/schemaParser.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { parseFormSchema, validateSubmissionPayload } from "./schemaParser";

describe("parseFormSchema", () => {
  test("accepts a valid schema", () => {
    const result = parseFormSchema({
      fields: [
        { id: "name", type: "text", label: "Name", required: true },
        { id: "age", type: "number", label: "Age", required: false, min: 0, max: 150 },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.schema.fields).toHaveLength(2);
  });

  test("rejects unknown field types", () => {
    const result = parseFormSchema({
      fields: [{ id: "f", type: "wizard", label: "x", required: false } as never],
    });
    expect(result.ok).toBe(false);
  });

  test("rejects more than 50 fields", () => {
    const fields = Array.from({ length: 51 }, (_, i) => ({
      id: `f${i}`,
      type: "text" as const,
      label: `Field ${i}`,
      required: false,
    }));
    const result = parseFormSchema({ fields });
    expect(result.ok).toBe(false);
  });

  test("rejects choice fields with more than 30 options", () => {
    const result = parseFormSchema({
      fields: [
        {
          id: "huge",
          type: "single_choice",
          label: "x",
          required: false,
          options: Array.from({ length: 31 }, (_, i) => ({ value: String(i), label: String(i) })),
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  test("rejects duplicate field ids", () => {
    const result = parseFormSchema({
      fields: [
        { id: "x", type: "text", label: "A", required: false },
        { id: "x", type: "email", label: "B", required: false },
      ],
    });
    expect(result.ok).toBe(false);
  });

  test("rejects non-object root", () => {
    expect(parseFormSchema(null).ok).toBe(false);
    expect(parseFormSchema([]).ok).toBe(false);
    expect(parseFormSchema("schema").ok).toBe(false);
  });
});

describe("validateSubmissionPayload", () => {
  const schema = {
    fields: [
      { id: "name", type: "text" as const, label: "Name", required: true, maxLength: 100 },
      { id: "email", type: "email" as const, label: "Email", required: true },
      { id: "color", type: "single_choice" as const, label: "Color", required: false,
        options: [{ value: "red", label: "Red" }, { value: "blue", label: "Blue" }] },
    ],
  };

  test("accepts a valid payload", () => {
    const result = validateSubmissionPayload(schema, {
      name: "Alice",
      email: "alice@example.com",
      color: "red",
    });
    expect(result.ok).toBe(true);
  });

  test("rejects when required field missing", () => {
    const result = validateSubmissionPayload(schema, { email: "a@b.c" });
    expect(result.ok).toBe(false);
  });

  test("rejects invalid email", () => {
    const result = validateSubmissionPayload(schema, {
      name: "A",
      email: "not-an-email",
    });
    expect(result.ok).toBe(false);
  });

  test("rejects choice value not in options", () => {
    const result = validateSubmissionPayload(schema, {
      name: "A",
      email: "a@b.c",
      color: "purple",
    });
    expect(result.ok).toBe(false);
  });

  test("strips unknown field keys from payload silently", () => {
    const result = validateSubmissionPayload(schema, {
      name: "A",
      email: "a@b.c",
      surprise: "ignored",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect("surprise" in result.cleanPayload).toBe(false);
  });
});
```

- [ ] **Step 3: Verify FAIL**

```bash
cd packages/api && npx vitest run src/lib/forms/schemaParser.test.ts
```

- [ ] **Step 4: Implement the parser**

`packages/api/src/lib/forms/schemaParser.ts`:

```ts
import {
  ALLOWED_FIELD_TYPES,
  MAX_CHOICE_OPTIONS,
  MAX_FIELDS,
  MAX_LABEL_LENGTH,
  type FormField,
  type FormSchema,
} from "./schemaTypes";

export type ParseResult =
  | { ok: true; schema: FormSchema }
  | { ok: false; error: string };

export type ValidateResult =
  | { ok: true; cleanPayload: Record<string, unknown> }
  | { ok: false; error: string; field?: string };

const URL_RE = /^https?:\/\/.{3,}/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseFormSchema(raw: unknown): ParseResult {
  if (!isObject(raw)) return { ok: false, error: "schema must be an object" };
  if (!Array.isArray(raw.fields)) return { ok: false, error: "fields must be an array" };
  if (raw.fields.length > MAX_FIELDS) {
    return { ok: false, error: `too many fields (max ${MAX_FIELDS})` };
  }

  const seen = new Set<string>();
  const cleanFields: FormField[] = [];

  for (const f of raw.fields) {
    if (!isObject(f)) return { ok: false, error: "field must be an object" };
    if (typeof f.id !== "string" || !f.id.trim()) {
      return { ok: false, error: "field id required" };
    }
    if (seen.has(f.id)) return { ok: false, error: `duplicate field id: ${f.id}` };
    seen.add(f.id);
    if (typeof f.type !== "string" || !ALLOWED_FIELD_TYPES.includes(f.type as never)) {
      return { ok: false, error: `unknown field type: ${String(f.type)}` };
    }
    if (typeof f.label !== "string" || f.label.length > MAX_LABEL_LENGTH) {
      return { ok: false, error: `field label invalid for ${f.id}` };
    }
    const required = Boolean(f.required);
    const hint = typeof f.hint === "string" ? f.hint : undefined;

    if (f.type === "single_choice" || f.type === "multi_choice") {
      if (!Array.isArray(f.options) || f.options.length === 0) {
        return { ok: false, error: `${f.id}: options required for choice` };
      }
      if (f.options.length > MAX_CHOICE_OPTIONS) {
        return { ok: false, error: `${f.id}: too many options (max ${MAX_CHOICE_OPTIONS})` };
      }
      const options = f.options.map((o) =>
        isObject(o) && typeof o.value === "string" && typeof o.label === "string"
          ? { value: o.value, label: o.label }
          : null
      );
      if (options.some((o) => !o)) {
        return { ok: false, error: `${f.id}: malformed option` };
      }
      cleanFields.push({
        id: f.id,
        type: f.type,
        label: f.label,
        required,
        hint,
        options: options as { value: string; label: string }[],
      });
    } else if (f.type === "number") {
      const min = typeof f.min === "number" ? f.min : undefined;
      const max = typeof f.max === "number" ? f.max : undefined;
      cleanFields.push({ id: f.id, type: "number", label: f.label, required, hint, min, max });
    } else if (f.type === "date") {
      cleanFields.push({ id: f.id, type: "date", label: f.label, required, hint });
    } else if (f.type === "checkbox") {
      cleanFields.push({ id: f.id, type: "checkbox", label: f.label, required, hint });
    } else {
      // text / textarea / email / url
      const placeholder = typeof f.placeholder === "string" ? f.placeholder : undefined;
      const maxLength = typeof f.maxLength === "number" ? f.maxLength : undefined;
      cleanFields.push({
        id: f.id,
        type: f.type,
        label: f.label,
        required,
        hint,
        placeholder,
        maxLength,
      });
    }
  }

  return { ok: true, schema: { fields: cleanFields } };
}

export function validateSubmissionPayload(
  schema: FormSchema,
  payload: unknown
): ValidateResult {
  if (!isObject(payload)) return { ok: false, error: "payload must be an object" };
  const clean: Record<string, unknown> = {};
  for (const f of schema.fields) {
    const v = payload[f.id];
    if (v === undefined || v === null || v === "") {
      if (f.required) return { ok: false, field: f.id, error: "required" };
      continue;
    }
    switch (f.type) {
      case "text":
      case "textarea":
        if (typeof v !== "string") return { ok: false, field: f.id, error: "must be string" };
        if (f.maxLength && v.length > f.maxLength) return { ok: false, field: f.id, error: "too long" };
        clean[f.id] = v;
        break;
      case "email":
        if (typeof v !== "string" || !EMAIL_RE.test(v)) {
          return { ok: false, field: f.id, error: "invalid email" };
        }
        clean[f.id] = v;
        break;
      case "url":
        if (typeof v !== "string" || !URL_RE.test(v)) {
          return { ok: false, field: f.id, error: "invalid url" };
        }
        clean[f.id] = v;
        break;
      case "number": {
        const n = typeof v === "number" ? v : Number(v);
        if (Number.isNaN(n)) return { ok: false, field: f.id, error: "not a number" };
        if (f.min !== undefined && n < f.min) return { ok: false, field: f.id, error: "below min" };
        if (f.max !== undefined && n > f.max) return { ok: false, field: f.id, error: "above max" };
        clean[f.id] = n;
        break;
      }
      case "date":
        if (typeof v !== "string" || !DATE_RE.test(v)) {
          return { ok: false, field: f.id, error: "must be YYYY-MM-DD" };
        }
        clean[f.id] = v;
        break;
      case "single_choice":
        if (typeof v !== "string" || !f.options.some((o) => o.value === v)) {
          return { ok: false, field: f.id, error: "invalid choice" };
        }
        clean[f.id] = v;
        break;
      case "multi_choice": {
        if (!Array.isArray(v)) return { ok: false, field: f.id, error: "must be array" };
        const allowed = new Set(f.options.map((o) => o.value));
        const filtered = v.filter((x) => typeof x === "string" && allowed.has(x));
        if (filtered.length !== v.length) {
          return { ok: false, field: f.id, error: "invalid choice value" };
        }
        clean[f.id] = filtered;
        break;
      }
      case "checkbox":
        clean[f.id] = Boolean(v);
        break;
    }
  }
  return { ok: true, cleanPayload: clean };
}
```

- [ ] **Step 5: Tests pass**

```bash
cd packages/api && npx vitest run src/lib/forms/schemaParser.test.ts
cd ../.. && npm run typecheck
```

11 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/lib/forms/schemaTypes.ts \
        packages/api/src/lib/forms/schemaParser.ts \
        packages/api/src/lib/forms/schemaParser.test.ts
git commit -m "feat(api): form schema parser + submission payload validator"
```

---

## Task 2: POST + GET `/admin/forms`

**Files:**
- Create: `packages/api/src/routes/admin/forms/index.ts`
- Create: `packages/api/src/routes/admin/forms/index.test.ts`
- Modify: `packages/api/src/routes/admin/index.ts` (mount)

Pattern is parallel to `/admin/events` and `/admin/announcements`. The CREATE body shape differs:

- `slug` is required (forms have a stable URL; not auto-generated like events)
- `title` (NOT `name`)
- `schema` (jsonb) — validated through `parseFormSchema`
- Optional `entityType` + `entityId` for polymorphic attachment (both-or-neither — CHECK constraint enforced at DB level)
- Optional `description`

LIST query is shaped like events list: filters by status, scope, entityType, q (title ilike).

- [ ] **Step 1: Test** — mirror `packages/api/src/routes/admin/events/index.test.ts` structure:
  - 401 unauthenticated
  - 201 staff creates with valid schema → returns draft
  - 400 rejects empty fields array OR invalid field type (round-trips through schemaParser)
  - 400 rejects entityType set but entityId null (or vice versa)
  - 200 list with status filter

- [ ] **Step 2: Implement** — similar shape to events. Read `packages/api/src/routes/admin/events/index.ts` first. Key differences from that file:
  - Validate `schema` via `parseFormSchema`; on `ok: false`, return `400 { error: "invalid_schema", message: parseError }`
  - Reject CHECK violation early: if either `entityType` or `entityId` is set, both must be
  - No `slugify` (slug comes from the body)

- [ ] **Step 3: Mount on adminApi** — `adminApi.route("/forms", adminFormsRoute);` in `packages/api/src/routes/admin/index.ts`

- [ ] **Step 4: Tests + typecheck** with `set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/forms/index.test.ts`

- [ ] **Step 5: Commit** as `feat(api): admin forms create + list endpoints`

---

## Task 3: GET + PATCH `/admin/forms/:id`

**Files:**
- Create: `packages/api/src/routes/admin/forms/byId.ts`
- Create: `packages/api/src/routes/admin/forms/byId.test.ts`
- Modify: `packages/api/src/routes/admin/forms/index.ts` (mount `/:id` AFTER `/:id/...` paths added in later tasks)

Pattern from `packages/api/src/routes/admin/events/byId.ts`. Key differences:

- GET returns: form + reviews + comments + audit + submission count (one extra COUNT query)
- PATCH validates `schema` through `parseFormSchema` when present
- PATCH respects the CHECK constraint: if changing `entityType` or `entityId`, both must end up null OR both must end up set
- Editing a `published` form's schema is allowed for staff (the spec doesn't require revision invalidation just because schema changed — distinct from artifact revision which only bumps on resubmit). Note: submitters who started filling the form may submit against an older schema, but `form_revision` is captured on submission so the historical context is preserved.

Wait — actually the spec at §2 says revisions bump only on resubmit-from-changes_requested. A PATCH while `published` is still allowed for staff. Verify by reading `applyTransition` — only `submit_for_review` from `changes_requested` bumps revision.

- [ ] **Step 1-6:** Tests + impl + mount + verify + commit as `feat(api): admin form detail + patch endpoints with schema re-validation`

---

## Task 4: POST `/admin/forms/:id/transitions`

Pattern from `events/transitions.ts` and `announcements/transitions.ts`. Key differences:

- Action enum: `submit_for_review | approve | reject | request_changes | close | archive` (note: `close` is forms-specific, marks the form as no longer accepting submissions; `cancel` is NOT in this set)
- Policy gates same as events/announcements: submit → `canEditArtifact`; review actions → `canReviewArtifact`; close/archive → staff only

- [ ] **Step 1-6:** Tests + impl + mount BEFORE bare `/:id` + verify + commit as `feat(api): admin form transitions endpoint`

---

## Task 5: POST `/admin/forms/:id/comments`

Mirror `events/comments.ts` exactly with `entityType: "form"`.

- [ ] **Step 1-6:** Tests + impl + mount BEFORE bare `/:id` + verify + commit as `feat(api): admin form comments POST endpoint`

---

## Task 6: GET `/admin/forms/:id/submissions` — paginated list + CSV export

**Files:**
- Create: `packages/api/src/routes/admin/forms/submissions.ts`
- Create: `packages/api/src/routes/admin/forms/submissions.test.ts`
- Modify: `packages/api/src/routes/admin/forms/index.ts` (mount `/:id/submissions` BEFORE bare `/:id`)

- [ ] **Step 1: Test**

```ts
// Test outline:
// - 200 list paginated submissions for a form
// - 200 CSV export via Accept: text/csv (or ?format=csv)
// - 403 non-staff non-author
// - 404 unknown form id
// CSV columns: submitted_at, submitter_user_id, form_revision, then one column per field id in schema order
```

Seed: 1 form + 3 submissions with varying payloads.

- [ ] **Step 2: Implement**

```ts
import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
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
  if (!formId || !UUID_RE.test(formId)) return c.json({ ok: false, error: "invalid_input" }, 400);
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
  if (c.req.query("format") === "csv" || c.req.header("Accept") === "text/csv") {
    const schema = form.schema as FormSchema;
    const headerCols = ["submitted_at", "submitter_user_id", "form_revision", ...schema.fields.map((f) => f.id)];
    const lines: string[] = [headerCols.map(csvCell).join(",")];
    for (const r of rows) {
      const payload = r.payload as Record<string, unknown>;
      lines.push([
        r.submittedAt instanceof Date ? r.submittedAt.toISOString() : String(r.submittedAt),
        r.submitterUserId ?? "",
        r.formRevision,
        ...schema.fields.map((f) => csvCell(payload[f.id])),
      ].join(","));
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
  const s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join(";") : String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
```

- [ ] **Step 3: Mount**

In `packages/api/src/routes/admin/forms/index.ts`, mount order:
```ts
adminFormsRoute.route("/:id/transitions", adminFormTransitionsRoute);
adminFormsRoute.route("/:id/comments", adminFormCommentsRoute);
adminFormsRoute.route("/:id/submissions", adminFormSubmissionsRoute);
adminFormsRoute.route("/:id", adminFormByIdRoute);
```

- [ ] **Step 4: Tests + typecheck** — 4 tests pass

- [ ] **Step 5: Commit** as `feat(api): admin form submissions list + CSV export`

---

## Task 7: Public `GET /forms/:slug` + `POST /forms/:slug/submissions`

**Files:**
- Create: `packages/api/src/routes/forms.ts`
- Create: `packages/api/src/routes/forms.test.ts`
- Modify: `packages/api/src/index.ts` (mount `/forms`)

- [ ] **Step 1: Test**

```ts
// - GET /forms/:slug 200 returns schema + metadata for published, accepting forms
// - GET /forms/:slug 404 for draft / in_review / closed / archived
// - GET /forms/:slug 404 for forms with scope='community' when anonymous
// - POST /forms/:slug/submissions 201 valid payload (anonymous allowed for scope='public')
// - POST /forms/:slug/submissions 400 invalid payload (missing required field)
// - POST /forms/:slug/submissions 403 when scope='community' and anonymous
// - POST /forms/:slug/submissions 410 when accepts_submissions=false
```

- [ ] **Step 2: Implement**

```ts
import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { createDb } from "../db";
import { formSubmissions, forms } from "../db/schema";
import { validateSubmissionPayload } from "../lib/forms/schemaParser";
import type { FormSchema } from "../lib/forms/schemaTypes";
import type { AppEnv } from "../types";

export const formsRoute = new Hono<AppEnv>();

formsRoute.get("/:slug", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "not_found" }, 404);
  const slug = c.req.param("slug");
  if (!slug) return c.json({ ok: false, error: "not_found" }, 404);
  const db = createDb(c.env.DATABASE_URL);

  const form = await db
    .select()
    .from(forms)
    .where(and(eq(forms.slug, slug), eq(forms.status, "published"), isNull(forms.deletedAt)))
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
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const slug = c.req.param("slug");
  if (!slug) return c.json({ ok: false, error: "not_found" }, 404);
  const db = createDb(c.env.DATABASE_URL);

  const form = await db
    .select()
    .from(forms)
    .where(and(eq(forms.slug, slug), eq(forms.status, "published"), isNull(forms.deletedAt)))
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
  if ((form.scope === "group" || form.scope === "staff_only") && (!actor || actor.systemTier < 1)) {
    return c.json({ ok: false, error: "forbidden" }, 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid_json" }, 400);
  }

  const validation = validateSubmissionPayload(form.schema as FormSchema, body);
  if (!validation.ok) {
    return c.json({ ok: false, error: validation.error, field: validation.field }, 400);
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
```

- [ ] **Step 3: Mount**

In `packages/api/src/index.ts`, alongside `/events` and `/announcements`:
```ts
import { formsRoute } from "./routes/forms";

app.use("/forms/*", optionalActor);
app.route("/forms", formsRoute);
```

Ensure `/forms` mount is registered AFTER any auth-gated /forms/... routes if added (none in v1).

- [ ] **Step 4: Tests + typecheck** — 7 tests pass

- [ ] **Step 5: Commit** as `feat(api): public form fetch + submission endpoints`

---

## Task 8: Install Coltorapps Builder

**Files:**
- Modify: `apps/admin/package.json` (add Coltorapps dependency)
- Run: `npm install`

- [ ] **Step 1: Add the dependency**

```bash
cd apps/admin && npm install @coltorapps/builder @coltorapps/builder-react
cd ../..
```

(Verify the exact package names by checking https://github.com/coltorapps/builder — these are the current names as of brainstorm time. If the names have changed, install the current ones and note the deviation in the commit message.)

- [ ] **Step 2: Confirm install**

```bash
cd apps/admin && npm ls @coltorapps/builder 2>&1 | head -5
cd ../..
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit** as `chore(admin): add Coltorapps form-builder dependency`

---

## Task 9: Admin `useForms` hook + list page + sidebar nav

**Files:**
- Create: `apps/admin/src/hooks/useForms.ts`
- Create: `apps/admin/src/pages/forms/FormsListPage.tsx`
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/src/hooks/useNavSections.ts`

Mirror the announcements pattern (`useAnnouncements.ts` + `AnnouncementsListPage.tsx`). List columns: title, status, scope, revision, attached entity ("Event: X" / "Announcement: X" / "—"), submission count, createdAt.

Sidebar entry: slot 07 (after Announcements 06). Shift Recognition/Settings/Audit numbers up by one.

Two commits: `feat(admin): useFormsList hook` and `feat(admin): forms list page + sidebar nav`.

---

## Task 10: Admin new-form compose page

**Files:**
- Create: `apps/admin/src/pages/forms/NewFormPage.tsx`
- Modify: `apps/admin/src/App.tsx` (add route BEFORE `:id`)

The compose page is lighter than NewEventPage / NewAnnouncementPage — it captures:
- Title
- Slug (required, validate slug format `^[a-z0-9-]+$`, surface uniqueness errors from API)
- Description
- A single placeholder field in the initial schema (e.g., a text field named "name")

It does NOT mount the full Coltorapps builder yet — that's on the detail page's Content tab (Task 11). The new-form flow creates a minimal valid form so the author lands on the detail page to start building.

POST body: `{ title, slug, description?, schema: { fields: [{ id: "name", type: "text", label: "Name", required: true }] } }`.

Commit as `feat(admin): new form compose page`.

---

## Task 11: Admin form detail page with Coltorapps builder in Content tab

**Files:**
- Create: `apps/admin/src/pages/forms/FormDetailPage.tsx`
- Create: `apps/admin/src/components/FormBuilder.tsx` (wraps Coltorapps headless primitives onto editorial design system)
- Modify: `apps/admin/src/App.tsx`

The detail page mirrors `EventDetailPage.tsx` and `AnnouncementDetailPage.tsx`:
- 4 tabs: **Identity** (title/slug/description/attached entity), **Content** (the Coltorapps builder), **Review** (same as events/announcements), **Audit** (same)
- The submissions sub-page is a separate route `/admin/forms/:id/submissions` (Task 12) — link to it from the Review tab

**The Coltorapps wiring is the load-bearing piece here.** The implementer must:

1. Read the Coltorapps Builder documentation (or its README in `node_modules/@coltorapps/builder`) to determine the actual API surface
2. Build the `<FormBuilder />` component that:
   - Accepts a `schema: FormSchema` prop and an `onChange(schema: FormSchema)` callback
   - Renders Coltorapps' headless primitives using the project's `EditorialInput`/`EditorialTextarea`/`EditorialSelect` for the field-edit UI
   - Supports the 9 field types declared in `schemaTypes.ts`: text, textarea, email, url, number, date, single_choice, multi_choice, checkbox
   - Provides drag-to-reorder via Coltorapps' built-in drag primitives (NOT a separate DnD library)
3. On Save:
   - PATCH `/admin/forms/:id` with `{ schema }` field
   - Server-side `parseFormSchema` re-validates; surface 400 errors inline if the builder produces something invalid

**Fallback if Coltorapps doesn't fit cleanly:** If the implementer's research surfaces that Coltorapps has a fundamentally different schema shape than `FormSchema`, write a translation layer in `FormBuilder.tsx` that converts between the two. The plan's stored format (`FormSchema`) is the source of truth and shouldn't change to match the library.

**Escalation:** If the implementer finds that Coltorapps is unmaintained, requires a paid plan, or won't render in the existing admin shell, **STOP and report BLOCKED**. Don't substitute an unvetted library; ask for a re-evaluation.

Commit as `feat(admin): form detail page with inline Coltorapps builder`.

---

## Task 12: Admin form submissions page

**Files:**
- Create: `apps/admin/src/pages/forms/FormSubmissionsPage.tsx`
- Modify: `apps/admin/src/App.tsx`

Paginated table of submissions for a given form. Columns: submitted_at, submitter (display name or "Anonymous"), one column per top-level field in the form's schema. CSV export button that hits `GET /admin/forms/:id/submissions?format=csv` and triggers a browser download.

Route: `/admin/forms/:id/submissions` (mount AFTER `/admin/forms/:id` so the detail page handles the bare `:id`).

Commit as `feat(admin): form submissions list page + CSV download`.

---

## Task 13: Public `<FormRenderer />` + `/forms/:slug` page

**Files:**
- Create: `apps/web/src/components/FormRenderer.tsx`
- Create: `apps/web/src/pages/forms/FormPage.tsx`
- Modify: `apps/web/src/App.tsx` (add route `/forms/:slug`)

`<FormRenderer />` consumes the same `FormSchema` type from `packages/api/src/lib/forms/schemaTypes.ts` (extract to a shared module first if not already shared, OR copy the type into apps/web — note that running the same parser server-side is what enforces validity, so a structural duplicate is acceptable).

The renderer:
- Walks `schema.fields` and renders the appropriate input for each type
- Tracks state via `useState` per field id
- On submit: POSTs to `/forms/:slug/submissions`
- On success: renders a thank-you state
- On 400: surfaces the field-specific error inline

`/forms/:slug` page:
- Calls `GET /forms/:slug` to fetch schema + metadata
- Handles 404 (form not found / not published / wrong scope)
- Wraps `<FormRenderer />` with title + description chrome

Two commits: `feat(web): FormRenderer component` and `feat(web): /forms/:slug page`.

---

## Task 14: Full test suite + typecheck

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npm test
cd ../.. && npm run typecheck
```

Expected: ~234 + ~30 new = ~264 tests pass. Typecheck clean across all 5 packages.

---

## Task 15: Push branch + open PR

```bash
git push -u origin cdcore09/forms-implementation
gh pr create --base cdcore09/site-redesign --title "feat: forms subsystem (admin + public renderer + Coltorapps builder)" --body "..."
```

PR body should call out:
- Coltorapps integration details
- Schema parser as the source of truth for stored schema shape
- v1 deferrals: file uploads, analytics, one-form-many-entities attachment
- Test plan: full suite passes, manual smoke creates a form, submits a public submission, checks the submissions table renders, downloads CSV

---

## Wrap

Plan 4 (Forms) is done when:

1. PR opened against `cdcore09/site-redesign`.
2. Full vitest suite passes with DB env set.
3. Full typecheck clean.
4. Manual smoke confirms: staff creates form → submits for review → second staff approves twice → form publishes at `/forms/:slug` → anonymous submits → admin sees submission in `/admin/forms/:id/submissions` → CSV export works.

**Next:** Plan 5 (Broadcast subsystem) is the last plan — Broadcast tab on event/announcement detail pages, channel dispatcher, native `site_banner` flip, manual-handoff sub-queue.

---

## Summary

This plan adds forms as the third user-facing artifact. The load-bearing decisions: store schemas as our own JSON format (not a library-specific blob), server-side validate every submission against the stored schema, mount Coltorapps' headless primitives onto our own design-system components so the vendor never reaches our CSS. CSV export for submissions is included. File uploads, analytics, and multi-entity attachment all stay deferred per spec §10.

## Test plan

- [ ] All vitest unit + integration tests pass (~264 total)
- [ ] PR CI green on Cloudflare Pages checks
- [ ] Admin happy path verified manually: create form → submit → 2x approve → publish
- [ ] Public happy path verified manually: anonymous fills `/forms/:slug` → submission lands in admin table
- [ ] CSV export downloads correctly with one column per field
- [ ] Form attachment to an event verified manually (admin attaches form to an event; visit the event page to confirm the linked form is referenced)
