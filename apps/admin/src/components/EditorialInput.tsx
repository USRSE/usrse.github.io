import { forwardRef, type InputHTMLAttributes } from "react";

export interface EditorialInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | null;
}

export const EditorialInput = forwardRef<HTMLInputElement, EditorialInputProps>(
  function EditorialInput({ label, hint, error, className, ...rest }, ref) {
    return (
      <label className="block">
        <span className="admin-classification block mb-2">{label}</span>
        <input
          ref={ref}
          className="w-full bg-transparent border-0 py-1.5 outline-none transition-colors"
          style={{
            borderBottom: "1px solid var(--admin-rule)",
            color: "var(--admin-ink)",
            fontSize: "15px",
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
