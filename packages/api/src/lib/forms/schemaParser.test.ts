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
