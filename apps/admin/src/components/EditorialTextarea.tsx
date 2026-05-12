import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface EditorialTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string | null;
}

export const EditorialTextarea = forwardRef<HTMLTextAreaElement, EditorialTextareaProps>(
  function EditorialTextarea({ label, hint, error, className, rows = 4, ...rest }, ref) {
    return (
      <label className="block">
        <span className="admin-classification block mb-2">{label}</span>
        <textarea
          ref={ref}
          rows={rows}
          className="w-full bg-transparent border-0 py-2 outline-none resize-vertical leading-[1.6]"
          style={{
            borderBottom: "1px solid var(--admin-rule)",
            color: "var(--admin-ink)",
            fontSize: "15px",
            minHeight: "5rem",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderBottomColor = "var(--admin-ribbon)";
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = "var(--admin-rule)";
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {hint && !error && (
          <span className="block mt-1.5 text-[11px]" style={{ color: "var(--admin-marginalia)" }}>
            {hint}
          </span>
        )}
        {error && (
          <span className="block mt-1.5 text-[11px]" style={{ color: "var(--color-danger-700)" }}>
            {error}
          </span>
        )}
      </label>
    );
  }
);
