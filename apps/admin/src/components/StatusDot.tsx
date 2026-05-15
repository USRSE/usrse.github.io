type StatusDotKind = "pending" | "approved" | "rejected";

interface StatusDotProps {
  status: StatusDotKind;
  /** Size hint. Default "md" (7px) suits dense list rows. "sm" (5px)
   *  pairs with marginalia-sized type. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Tiny circular status indicator — the three-state vocab signal
 * (pending / approved / rejected) as a glyph rather than a word.
 * Used on list/index surfaces where horizontal column space is at a
 * premium and the eye scans dozens of rows; detail pages keep the
 * spelled-out word because individual rows there earn their space.
 *
 * Aesthetic register: editorial atlas. No animation (the topbar's
 * pulse-soft is reserved for "live now" state, and re-using it here
 * would dilute that signal). Solid fill, no border, sized to read as
 * a typographic dingbat rather than a UI pill.
 *
 * Accessibility: color alone is hostile to colorblind users and
 * useless to screen readers. The element carries role="img" with an
 * aria-label and a native title tooltip so the meaning is always
 * available — by hover, by keyboard focus (assistive), and by screen
 * reader announcement.
 */
const COLOR: Record<StatusDotKind, string> = {
  pending: "var(--color-warning-700)",
  approved: "var(--color-success-700)",
  rejected: "var(--color-danger-700)",
};

const LABEL: Record<StatusDotKind, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export function StatusDot({ status, size = "md", className }: StatusDotProps) {
  const px = size === "sm" ? 5 : 7;
  return (
    <span
      role="img"
      aria-label={LABEL[status]}
      title={LABEL[status]}
      className={`inline-block rounded-full align-middle ${className ?? ""}`}
      style={{
        width: `${px}px`,
        height: `${px}px`,
        background: COLOR[status],
      }}
    />
  );
}
