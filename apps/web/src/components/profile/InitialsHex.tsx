/**
 * Deterministic hexagonal initials stamp — fallback when an
 * organization doesn't have a hosted logo yet.
 *
 * Same flat-top silhouette HexStamp uses for badges, so the
 * dossier reads as a single visual family. Background color
 * is picked from a small palette by hashing the slug, so the
 * same org always renders the same color even across rerenders
 * and across surfaces (dossier pillar, member card, cmd-K).
 */

interface InitialsHexProps {
  /** Org display name used to derive the initials. */
  name: string;
  /**
   * Stable slug used to seed the color hash. Falls back to the name
   * when omitted, but passing the slug is preferred — it's stable
   * across name edits.
   */
  seed?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Hide from a11y tree — caller usually labels the wrapper itself. */
  decorative?: boolean;
}

const SIZE_MAP = {
  xs: { box: "w-5 h-5", text: "text-[8px]" },
  sm: { box: "w-7 h-7", text: "text-[10px]" },
  md: { box: "w-10 h-10", text: "text-[13px]" },
  lg: { box: "w-14 h-14", text: "text-[15px]" },
} as const;

// Flat-top hexagon path matching HexStamp so badges and org marks
// read as the same visual family. Slightly squashed vertically.
const HEX_PATH = "M 50 4 L 92 27 L 92 73 L 50 96 L 8 73 L 8 27 Z";

// Small palette tuned to play with the page accents (purple, teal,
// amber, rose, graphite). Each entry is fill + ink so the initials
// stay readable on the chosen tint.
const PALETTE = [
  { fill: "#1e1b4b", ink: "#f5f3ff" }, // deep purple
  { fill: "#0f766e", ink: "#f0fdfa" }, // teal
  { fill: "#7c2d12", ink: "#fef2f2" }, // brick
  { fill: "#3f3f46", ink: "#fafafa" }, // graphite
  { fill: "#581c87", ink: "#faf5ff" }, // plum
  { fill: "#0c4a6e", ink: "#f0f9ff" }, // ocean
  { fill: "#854d0e", ink: "#fefce8" }, // bronze
  { fill: "#155e75", ink: "#ecfeff" }, // cyan
] as const;

function pickPalette(seed: string): (typeof PALETTE)[number] {
  // Simple djb2-ish hash — overkill is not needed here, we just want
  // a stable, well-distributed integer per slug.
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % PALETTE.length;
  return PALETTE[idx];
}

/**
 * Pull initials from an org name. Strategy:
 *   - Strip leading "The ", trailing punctuation, parenthetical
 *     short names ("(NREL)" suffixes).
 *   - Take the first letter of the first word and the first letter
 *     of the next significant word (skip lowercase glue words).
 *   - Fall back to the first two letters of the name if there's only
 *     one word.
 *   - Always uppercase, capped at 2 chars.
 */
function deriveInitials(name: string): string {
  const cleaned = name
    .replace(/^the\s+/i, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim();
  const words = cleaned
    .split(/\s+/)
    .filter((w) => w && !/^(of|and|the|for|de|la|le|du|da|der|von|van)$/i.test(w));
  if (words.length === 0) return cleaned.slice(0, 2).toUpperCase() || "·";
  if (words.length === 1) {
    return words[0].replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();
  }
  const a = words[0].replace(/[^a-z0-9]/gi, "")[0] ?? "";
  const b = words[1].replace(/[^a-z0-9]/gi, "")[0] ?? "";
  return (a + b).toUpperCase().slice(0, 2) || "·";
}

export function InitialsHex({
  name,
  seed,
  size = "md",
  className = "",
  decorative = true,
}: InitialsHexProps) {
  const initials = deriveInitials(name);
  const colors = pickPalette(seed ?? name.toLowerCase());
  const sizing = SIZE_MAP[size];

  return (
    <span
      className={`relative inline-block flex-shrink-0 ${sizing.box} ${className}`}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
      >
        <path d={HEX_PATH} fill={colors.fill} />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-mono font-semibold tracking-wider ${sizing.text}`}
        style={{ color: colors.ink }}
      >
        {initials}
      </span>
    </span>
  );
}
