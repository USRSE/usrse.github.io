import { useState, type FormEvent } from "react";
import { useApi } from "@/lib/api";

/**
 * Structural duplicate of `apps/admin/src/lib/formSchema.ts` and the
 * canonical type in `packages/api/src/lib/forms/schemaTypes.ts`. The
 * web, admin, and api packages each have their own tsconfig root so
 * the shape is restated here rather than imported.
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

export interface FormFieldChoiceOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  hint?: string;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: FormFieldChoiceOption[];
}

export interface FormSchema {
  fields: FormField[];
}

interface FormRendererProps {
  schema: FormSchema;
  slug: string;
}

type FieldValue = string | number | boolean | string[] | null;

function initialValue(field: FormField): FieldValue {
  switch (field.type) {
    case "multi_choice":
      return [];
    case "checkbox":
      return false;
    case "number":
      return "";
    default:
      return "";
  }
}

function cleanPayload(
  schema: FormSchema,
  values: Record<string, FieldValue>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of schema.fields) {
    const raw = values[field.id];
    switch (field.type) {
      case "number": {
        if (raw === "" || raw === null || raw === undefined) {
          if (field.required) out[field.id] = null;
          continue;
        }
        const n = typeof raw === "number" ? raw : Number(raw);
        out[field.id] = Number.isFinite(n) ? n : null;
        break;
      }
      case "checkbox":
        out[field.id] = Boolean(raw);
        break;
      case "multi_choice":
        out[field.id] = Array.isArray(raw) ? raw : [];
        break;
      default: {
        const s = typeof raw === "string" ? raw.trim() : raw;
        if (s === "" || s === null || s === undefined) {
          if (field.required) out[field.id] = "";
          continue;
        }
        out[field.id] = s;
      }
    }
  }
  return out;
}

export function FormRenderer({ schema, slug }: FormRendererProps) {
  const apiFetch = useApi();
  const initial: Record<string, FieldValue> = {};
  for (const f of schema.fields) initial[f.id] = initialValue(f);

  const [values, setValues] = useState<Record<string, FieldValue>>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{
    field: string;
    message: string;
  } | null>(null);

  function setValue(id: string, v: FieldValue) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setFieldError(null);

    const payload = cleanPayload(schema, values);
    setSubmitting(true);
    try {
      const res = await apiFetch(`/forms/${slug}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; message?: string; field?: string }
          | null;
        if (res.status === 400 && body?.field) {
          setFieldError({
            field: body.field,
            message: body.message ?? body.error ?? "Invalid value",
          });
        } else {
          setError(
            body?.message ?? body?.error ?? `Submission failed (${res.status})`
          );
        }
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-teal-200 bg-teal-50/60 p-8 lg:p-10"
        role="status"
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Submitted
        </p>
        <p className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight leading-tight mb-3">
          Thanks — your response has been recorded.
        </p>
        <p className="text-base text-neutral-600 leading-relaxed">
          We&rsquo;ve received your submission. You can close this page.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200 bg-neutral-50/40 p-6 lg:p-8 space-y-6"
      noValidate
    >
      {schema.fields.map((field) => (
        <FieldRow
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={(v) => setValue(field.id, v)}
          error={
            fieldError && fieldError.field === field.id
              ? fieldError.message
              : null
          }
        />
      ))}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-colors";

const errorInputClass =
  "w-full rounded-lg border border-rose-400 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-colors";

interface FieldRowProps {
  field: FormField;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  error: string | null;
}

function FieldRow({ field, value, onChange, error }: FieldRowProps) {
  const isCheckbox = field.type === "checkbox";

  return (
    <div className="block">
      {!isCheckbox && (
        <span className="block font-display text-sm font-bold text-neutral-900 tracking-tight mb-1.5">
          {field.label}
          {field.required && (
            <span className="text-purple-600 ml-1" aria-label="required">
              *
            </span>
          )}
        </span>
      )}

      <FieldInput field={field} value={value} onChange={onChange} hasError={!!error} />

      {field.hint && (
        <span className="block text-xs text-neutral-500 mt-1.5">{field.hint}</span>
      )}
      {error && (
        <span
          className="block text-xs text-rose-600 mt-1.5"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}

interface FieldInputProps {
  field: FormField;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  hasError: boolean;
}

function FieldInput({ field, value, onChange, hasError }: FieldInputProps) {
  const cls = hasError ? errorInputClass : inputClass;

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          rows={5}
          required={field.required}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-y min-h-[8rem]`}
        />
      );
    case "email":
      return (
        <input
          type="email"
          required={field.required}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      );
    case "url":
      return (
        <input
          type="url"
          required={field.required}
          maxLength={field.maxLength}
          placeholder={field.placeholder ?? "https://"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      );
    case "number":
      return (
        <input
          type="number"
          required={field.required}
          min={field.min}
          max={field.max}
          value={typeof value === "string" || typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      );
    case "date":
      return (
        <input
          type="date"
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      );
    case "single_choice":
      return (
        <select
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        >
          <option value="">— Select —</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "multi_choice": {
      const current = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {(field.options ?? []).map((opt) => {
            const checked = current.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2.5 text-sm text-neutral-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...current, opt.value]);
                    } else {
                      onChange(current.filter((v) => v !== opt.value));
                    }
                  }}
                  className="h-4 w-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      );
    }
    case "checkbox":
      return (
        <label className="flex items-start gap-3 text-sm text-neutral-800 cursor-pointer">
          <input
            type="checkbox"
            required={field.required}
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 mt-0.5 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="font-display text-sm font-bold text-neutral-900 tracking-tight">
            {field.label}
            {field.required && (
              <span className="text-purple-600 ml-1" aria-label="required">
                *
              </span>
            )}
          </span>
        </label>
      );
    case "text":
    default:
      return (
        <input
          type="text"
          required={field.required}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      );
  }
}
