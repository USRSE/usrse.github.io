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
