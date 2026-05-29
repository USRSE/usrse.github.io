/**
 * FormBuilder — admin authoring UI for `forms.schema`.
 *
 * Library: @coltorapps/builder + @coltorapps/builder-react (v0.2.4, MIT).
 *
 * Coltorapps notes:
 *   - Headless: no CSS to override; we render everything with admin tokens.
 *   - Schema shape is `{ entities: Record<id, {type, attributes, parentId?, children?}>, root: string[] }`.
 *     Very different from our flat `{ fields: FormField[] }`, so we adapt
 *     bidirectionally (see `coltorappsToFormSchema` / `formSchemaToColtorapps`).
 *   - State lives in a store from `useBuilderStore`; we subscribe with
 *     `useBuilderStoreData` and call imperative methods (addEntity,
 *     setEntityAttribute, setEntityIndex, deleteEntity).
 *   - To avoid a different entity per field type, we declare ONE entity
 *     ("field") with a union of all attributes our 9 field types might use.
 *     The `type` attribute discriminates. Type-specific config (placeholder,
 *     options, min/max) is conditionally rendered.
 *   - Loose attribute validators (everything optional) — the server's
 *     `parseFormSchema` is the source of truth on PATCH.
 */

import { useEffect, useMemo, useRef } from "react";
import {
  createAttribute,
  createBuilder,
  createEntity,
  type Schema,
  type SchemaEntity,
} from "@coltorapps/builder";
import {
  useBuilderStore,
  useBuilderStoreData,
} from "@coltorapps/builder-react";
import {
  ALLOWED_FIELD_TYPES,
  FIELD_TYPES_WITH_OPTIONS,
  FIELD_TYPES_WITH_PLACEHOLDER,
  FIELD_TYPE_LABELS,
  type FormField,
  type FormFieldChoiceOption,
  type FormFieldType,
  type FormSchema,
} from "../lib/formSchema";

// ---- Attributes ----------------------------------------------------------

const typeAttribute = createAttribute({
  name: "type",
  validate(value): FormFieldType {
    if (
      typeof value === "string" &&
      (ALLOWED_FIELD_TYPES as ReadonlyArray<string>).includes(value)
    ) {
      return value as FormFieldType;
    }
    return "text";
  },
});

const labelAttribute = createAttribute({
  name: "label",
  validate(value): string {
    return typeof value === "string" ? value : "";
  },
});

const requiredAttribute = createAttribute({
  name: "required",
  validate(value): boolean {
    return value === true;
  },
});

const hintAttribute = createAttribute({
  name: "hint",
  validate(value): string {
    return typeof value === "string" ? value : "";
  },
});

const placeholderAttribute = createAttribute({
  name: "placeholder",
  validate(value): string {
    return typeof value === "string" ? value : "";
  },
});

const maxLengthAttribute = createAttribute({
  name: "maxLength",
  validate(value): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return null;
  },
});

const minAttribute = createAttribute({
  name: "min",
  validate(value): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return null;
  },
});

const maxAttribute = createAttribute({
  name: "max",
  validate(value): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return null;
  },
});

const optionsAttribute = createAttribute({
  name: "options",
  validate(value): FormFieldChoiceOption[] {
    if (!Array.isArray(value)) return [];
    return value.filter(
      (o): o is FormFieldChoiceOption =>
        !!o &&
        typeof o === "object" &&
        typeof (o as FormFieldChoiceOption).value === "string" &&
        typeof (o as FormFieldChoiceOption).label === "string"
    );
  },
});

// ---- Entity -------------------------------------------------------------

const fieldEntity = createEntity({
  name: "field",
  attributes: [
    typeAttribute,
    labelAttribute,
    requiredAttribute,
    hintAttribute,
    placeholderAttribute,
    maxLengthAttribute,
    minAttribute,
    maxAttribute,
    optionsAttribute,
  ],
});

const formBuilder = createBuilder({
  entities: [fieldEntity],
});

type FormBuilderType = typeof formBuilder;
type FieldEntity = SchemaEntity<FormBuilderType>;

// ---- Adapters -----------------------------------------------------------

function coltorappsToFormSchema(schema: Schema<FormBuilderType>): FormSchema {
  const fields: FormField[] = [];
  for (const id of schema.root) {
    const entity = schema.entities[id];
    if (!entity) continue;
    const attrs = entity.attributes;
    const type = attrs.type;
    const base: FormField = {
      id,
      type,
      label: attrs.label,
      required: attrs.required,
    };
    if (attrs.hint && attrs.hint.length > 0) base.hint = attrs.hint;
    if (
      FIELD_TYPES_WITH_PLACEHOLDER.includes(type) &&
      attrs.placeholder &&
      attrs.placeholder.length > 0
    ) {
      base.placeholder = attrs.placeholder;
    }
    if (
      FIELD_TYPES_WITH_PLACEHOLDER.includes(type) &&
      attrs.maxLength !== null
    ) {
      base.maxLength = attrs.maxLength;
    }
    if (type === "number") {
      if (attrs.min !== null) base.min = attrs.min;
      if (attrs.max !== null) base.max = attrs.max;
    }
    if (FIELD_TYPES_WITH_OPTIONS.includes(type)) {
      base.options = attrs.options;
    }
    fields.push(base);
  }
  return { fields };
}

function formSchemaToColtorapps(schema: FormSchema): Schema<FormBuilderType> {
  const entities: Record<string, FieldEntity> = {};
  const root: string[] = [];
  for (const field of schema.fields) {
    root.push(field.id);
    entities[field.id] = {
      type: "field",
      attributes: {
        type: field.type,
        label: field.label,
        required: field.required,
        hint: field.hint ?? "",
        placeholder: field.placeholder ?? "",
        maxLength: field.maxLength ?? null,
        min: field.min ?? null,
        max: field.max ?? null,
        options: field.options ?? [],
      },
    };
  }
  return { entities, root };
}

// Stable equality (shallow JSON) — used to detect "real" changes from the
// builder store vs the parent's onChange echoes.
function shallowSchemaEqual(a: FormSchema, b: FormSchema): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---- Component ----------------------------------------------------------

export interface FormBuilderProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
}

export function FormBuilder({ schema, onChange }: FormBuilderProps) {
  const initialColtorapps = useMemo(
    () => formSchemaToColtorapps(schema),
    // Only hydrate from the prop on initial mount — subsequent prop changes
    // that originate from our own onChange would otherwise create a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const builderStore = useBuilderStore(formBuilder, {
    initialData: { schema: initialColtorapps },
  });

  const data = useBuilderStoreData(builderStore);

  // If the parent supplies a schema that materially differs from the current
  // store (e.g. server-side reload after save), reset the store.
  const lastEmittedRef = useRef<FormSchema>(schema);
  useEffect(() => {
    if (shallowSchemaEqual(schema, lastEmittedRef.current)) return;
    builderStore.setData({
      schema: formSchemaToColtorapps(schema),
      entitiesAttributesErrors: {},
      schemaError: undefined,
    });
    lastEmittedRef.current = schema;
  }, [schema, builderStore]);

  // Emit to parent on store change.
  useEffect(() => {
    const next = coltorappsToFormSchema(data.schema);
    if (shallowSchemaEqual(next, lastEmittedRef.current)) return;
    lastEmittedRef.current = next;
    onChange(next);
  }, [data.schema, onChange]);

  function addField() {
    const nextIndex = data.schema.root.length;
    builderStore.addEntity({
      type: "field",
      attributes: {
        type: "text",
        label: `Field ${nextIndex + 1}`,
        required: false,
        hint: "",
        placeholder: "",
        maxLength: null,
        min: null,
        max: null,
        options: [],
      },
    });
  }

  function deleteField(id: string) {
    builderStore.deleteEntity(id);
  }

  function moveField(id: string, direction: -1 | 1) {
    const current = data.schema.root.indexOf(id);
    if (current === -1) return;
    const target = current + direction;
    if (target < 0 || target >= data.schema.root.length) return;
    builderStore.setEntityIndex(id, target);
  }

  function setAttr<K extends "type" | "label" | "required" | "hint" | "placeholder" | "maxLength" | "min" | "max" | "options">(
    id: string,
    name: K,
    value: unknown
  ) {
    // The attribute signature is broad on purpose — Coltorapps validates each.
    builderStore.setEntityAttribute(
      id,
      name,
      value as never
    );
  }

  return (
    <div className="space-y-6">
      {data.schema.root.length === 0 && (
        <p className="admin-marginalia">No fields yet. Add one below.</p>
      )}

      {data.schema.root.map((id, idx) => {
        const entity = data.schema.entities[id];
        if (!entity) return null;
        const attrs = entity.attributes;
        const type = attrs.type;
        return (
          <article
            key={id}
            className="p-5"
            style={{
              border: "1px solid var(--admin-rule)",
              background: "var(--admin-paper)",
            }}
          >
            <header className="flex items-center justify-between mb-4">
              <p className="admin-classification">
                Field {String(idx + 1).padStart(2, "0")}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveField(id, -1)}
                  disabled={idx === 0}
                  className="px-2 py-1 text-sm disabled:opacity-30"
                  title="Move up"
                  aria-label="Move field up"
                  style={{ border: "1px solid var(--admin-rule)" }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveField(id, 1)}
                  disabled={idx === data.schema.root.length - 1}
                  className="px-2 py-1 text-sm disabled:opacity-30"
                  title="Move down"
                  aria-label="Move field down"
                  style={{ border: "1px solid var(--admin-rule)" }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => deleteField(id)}
                  className="px-3 py-1 text-sm"
                  style={{
                    border: "1px solid var(--admin-rule)",
                    color: "var(--color-danger-700)",
                  }}
                >
                  Remove
                </button>
              </div>
            </header>

            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <label className="block">
                <span className="admin-classification block mb-2">Type</span>
                <select
                  value={type}
                  onChange={(e) =>
                    setAttr(id, "type", e.target.value as FormFieldType)
                  }
                  className="w-full bg-transparent py-1.5 outline-none"
                  style={{
                    borderBottom: "1px solid var(--admin-rule)",
                    color: "var(--admin-ink)",
                    fontSize: "15px",
                  }}
                >
                  {ALLOWED_FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="admin-classification block mb-2">Label</span>
                <input
                  value={attrs.label}
                  onChange={(e) => setAttr(id, "label", e.target.value)}
                  className="w-full bg-transparent py-1.5 outline-none"
                  style={{
                    borderBottom: "1px solid var(--admin-rule)",
                    color: "var(--admin-ink)",
                    fontSize: "15px",
                  }}
                />
              </label>
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={attrs.required}
                  onChange={(e) => setAttr(id, "required", e.target.checked)}
                />
                <span className="admin-classification">Required</span>
              </label>
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="admin-classification block mb-2">
                  Hint (optional)
                </span>
                <input
                  value={attrs.hint}
                  onChange={(e) => setAttr(id, "hint", e.target.value)}
                  className="w-full bg-transparent py-1.5 outline-none"
                  style={{
                    borderBottom: "1px solid var(--admin-rule)",
                    color: "var(--admin-ink)",
                    fontSize: "15px",
                  }}
                />
              </label>
            </div>

            {FIELD_TYPES_WITH_PLACEHOLDER.includes(type) && (
              <div
                className="mt-4 grid gap-4"
                style={{ gridTemplateColumns: "2fr 1fr" }}
              >
                <label className="block">
                  <span className="admin-classification block mb-2">
                    Placeholder
                  </span>
                  <input
                    value={attrs.placeholder}
                    onChange={(e) =>
                      setAttr(id, "placeholder", e.target.value)
                    }
                    className="w-full bg-transparent py-1.5 outline-none"
                    style={{
                      borderBottom: "1px solid var(--admin-rule)",
                      color: "var(--admin-ink)",
                      fontSize: "15px",
                    }}
                  />
                </label>
                <label className="block">
                  <span className="admin-classification block mb-2">
                    Max length
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={attrs.maxLength ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAttr(
                        id,
                        "maxLength",
                        v === "" ? null : Number(v)
                      );
                    }}
                    className="w-full bg-transparent py-1.5 outline-none"
                    style={{
                      borderBottom: "1px solid var(--admin-rule)",
                      color: "var(--admin-ink)",
                      fontSize: "15px",
                    }}
                  />
                </label>
              </div>
            )}

            {type === "number" && (
              <div
                className="mt-4 grid gap-4"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="block">
                  <span className="admin-classification block mb-2">Min</span>
                  <input
                    type="number"
                    value={attrs.min ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAttr(id, "min", v === "" ? null : Number(v));
                    }}
                    className="w-full bg-transparent py-1.5 outline-none"
                    style={{
                      borderBottom: "1px solid var(--admin-rule)",
                      color: "var(--admin-ink)",
                      fontSize: "15px",
                    }}
                  />
                </label>
                <label className="block">
                  <span className="admin-classification block mb-2">Max</span>
                  <input
                    type="number"
                    value={attrs.max ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAttr(id, "max", v === "" ? null : Number(v));
                    }}
                    className="w-full bg-transparent py-1.5 outline-none"
                    style={{
                      borderBottom: "1px solid var(--admin-rule)",
                      color: "var(--admin-ink)",
                      fontSize: "15px",
                    }}
                  />
                </label>
              </div>
            )}

            {FIELD_TYPES_WITH_OPTIONS.includes(type) && (
              <OptionsEditor
                options={attrs.options}
                onChange={(opts) => setAttr(id, "options", opts)}
              />
            )}
          </article>
        );
      })}

      <button
        type="button"
        onClick={addField}
        className="px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold"
      >
        + Add field
      </button>
    </div>
  );
}

// ---- OptionsEditor -------------------------------------------------------

function OptionsEditor({
  options,
  onChange,
}: {
  options: FormFieldChoiceOption[];
  onChange: (next: FormFieldChoiceOption[]) => void;
}) {
  function update(i: number, patch: Partial<FormFieldChoiceOption>) {
    const next = options.map((o, idx) => (idx === i ? { ...o, ...patch } : o));
    onChange(next);
  }
  function remove(i: number) {
    onChange(options.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([
      ...options,
      { value: `option_${options.length + 1}`, label: `Option ${options.length + 1}` },
    ]);
  }
  return (
    <div className="mt-4">
      <p className="admin-classification mb-2">Options</p>
      <div className="space-y-2">
        {options.map((o, i) => (
          <div
            key={i}
            className="grid gap-2 items-center"
            style={{ gridTemplateColumns: "1fr 1fr auto" }}
          >
            <input
              value={o.value}
              onChange={(e) => update(i, { value: e.target.value })}
              placeholder="value"
              className="bg-transparent py-1.5 outline-none"
              style={{
                borderBottom: "1px solid var(--admin-rule)",
                color: "var(--admin-ink)",
                fontSize: "14px",
              }}
            />
            <input
              value={o.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="label"
              className="bg-transparent py-1.5 outline-none"
              style={{
                borderBottom: "1px solid var(--admin-rule)",
                color: "var(--admin-ink)",
                fontSize: "14px",
              }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="px-2 py-1 text-sm"
              style={{
                border: "1px solid var(--admin-rule)",
                color: "var(--color-danger-700)",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 px-3 py-1.5 text-sm"
        style={{ border: "1px solid var(--admin-rule)", color: "var(--admin-ink)" }}
      >
        + Add option
      </button>
    </div>
  );
}
