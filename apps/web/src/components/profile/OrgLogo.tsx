/**
 * Organization mark — image when consent is given, deterministic
 * InitialsHex when not. Renders inline so callers can place it in a
 * pillar, a card, or a cmd-K row without each surface re-implementing
 * the fallback logic.
 *
 * Variant selection:
 *   - `mark`     symbol-only, used for tight rows (cmd-K, breadcrumbs)
 *   - `primary`  full logo, used in cards and pillar headers
 *
 * The image-vs-fallback decision is made here, not at the data layer.
 * That way an org with `logo_url` set but `logo_usage_consent` empty
 * still renders the InitialsHex — consent gates display, not storage.
 */
import { InitialsHex } from "./InitialsHex";

interface OrgLogoProps {
  name: string;
  /** Slug for the InitialsHex color seed. */
  slug?: string;
  /** Hosted logo URL (full mark). */
  logoUrl?: string | null;
  /** Symbol-only variant — preferred for the "mark" variant. */
  logoMarkUrl?: string | null;
  /**
   * "Yes" / "Acknowledged" / etc. when the org has consented to us
   * displaying the mark. Empty / null = no display, fall back to
   * InitialsHex even if logoUrl is populated.
   */
  logoUsageConsent?: string | null;
  variant?: "primary" | "mark";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Hide from a11y tree — caller usually labels the wrapper. */
  decorative?: boolean;
}

const PIXEL_BY_SIZE = {
  xs: 20,
  sm: 28,
  md: 40,
  lg: 56,
} as const;

export function OrgLogo({
  name,
  slug,
  logoUrl,
  logoMarkUrl,
  logoUsageConsent,
  variant = "primary",
  size = "md",
  className = "",
  decorative = true,
}: OrgLogoProps) {
  const consentGiven = Boolean(logoUsageConsent && logoUsageConsent.trim());
  const src =
    consentGiven &&
    (variant === "mark"
      ? logoMarkUrl ?? logoUrl ?? null
      : logoUrl ?? logoMarkUrl ?? null);

  if (!src) {
    return (
      <InitialsHex
        name={name}
        seed={slug ?? name.toLowerCase()}
        size={size}
        className={className}
        decorative={decorative}
      />
    );
  }

  const px = PIXEL_BY_SIZE[size];
  return (
    <img
      src={src}
      alt={decorative ? "" : name}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      className={`inline-block flex-shrink-0 object-contain ${className}`}
      style={{ width: px, height: px }}
    />
  );
}
