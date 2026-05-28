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
        type: f.type as "text" | "textarea" | "email" | "url",
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
