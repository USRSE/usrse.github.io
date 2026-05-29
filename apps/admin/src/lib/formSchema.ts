/**
 * Mirror of `packages/api/src/lib/forms/schemaTypes.ts` — the JSON shape we
 * persist in `forms.schema`. Duplicated here (not imported) because the admin
 * app and api package have separate tsconfig roots.
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

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  email: "Email",
  url: "URL",
  number: "Number",
  date: "Date",
  single_choice: "Single choice",
  multi_choice: "Multi choice",
  checkbox: "Checkbox",
};

export const FIELD_TYPES_WITH_PLACEHOLDER: ReadonlyArray<FormFieldType> = [
  "text",
  "textarea",
  "email",
  "url",
];

export const FIELD_TYPES_WITH_OPTIONS: ReadonlyArray<FormFieldType> = [
  "single_choice",
  "multi_choice",
];
