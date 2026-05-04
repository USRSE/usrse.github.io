import type { BadgeAccent, BadgeItem } from "@/hooks/useCurrentMember";

/**
 * Hexagonal stamp used in the Recognition section. Flat-top geometry
 * (wider than tall) gives a medal-like silhouette — they tessellate
 * cleanly without the spiky look of pointy-top hexes.
 *
 * Three weights tell the recognition story at a glance:
 *   • outline — passive participation (e.g. "Attended USRSE'24")
 *   • solid   — active contribution (Spoke, Organized, Sponsored, Volunteered)
 *   • double  — milestones and service tier (Three-Peat, Charter, Founding Roster)
 *
 * The hex is drawn as a single SVG path so it scales crisply at any
 * size and keeps a tight clip on the inner glyph.
 */

interface HexStampProps {
  badge: BadgeItem;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface AccentTokens {
  fill: string;
  ring: string;
  ink: string;
  glyph: string;
  caption: string;
}

// Tokens chosen to match the rest of the site palette: purple/teal/amber
// already in use throughout, plus rose for "five-peat" and graphite for
// "founding roster". Each accent has a soft tint (fill), a saturated stroke
// (ring), and a contrasting ink color for typography on the soft tint.
const ACCENT_TOKENS: Record<BadgeAccent, AccentTokens> = {
  purple: {
    fill: "#F4F0FF",
    ring: "#741755",
    ink: "#1B1238",
    glyph: "#741755",
    caption: "text-purple-700",
  },
  teal: {
    fill: "#E8F8F4",
    ring: "#188EAC",
    ink: "#0E2B25",
    glyph: "#188EAC",
    caption: "text-teal-700",
  },
  amber: {
    fill: "#FFF6E5",
    ring: "#B8780A",
    ink: "#2A1D03",
    glyph: "#B8780A",
    caption: "text-amber-700",
  },
  rose: {
    fill: "#FFE9EB",
    ring: "#C0344E",
    ink: "#2A0B11",
    glyph: "#C0344E",
    caption: "text-rose-700",
  },
  graphite: {
    fill: "#F1F2F4",
    ring: "#1F1F2A",
    ink: "#0A0A0F",
    glyph: "#1F1F2A",
    caption: "text-neutral-700",
  },
  // Used for plain conference attendance — warm slate / "graphite
  // memento" tone that reads as an earned permanent record rather
  // than a placeholder. Distinct from the milestone graphite by way
  // of the single-ring weight (no outer ring) and the YearMark glyph
  // (instead of the Roster mark).
  neutral: {
    fill: "#EFEDE7",
    ring: "#5C544A",
    ink: "#1F1B16",
    glyph: "#3A332B",
    caption: "text-stone-700",
  },
};

const SIZE_MAP = {
  sm: { hex: "w-14 h-14", title: "text-xs", subtitle: "text-[9px]" },
  md: { hex: "w-20 h-20", title: "text-sm", subtitle: "text-[10px]" },
  lg: { hex: "w-24 h-24", title: "text-base", subtitle: "text-[10px]" },
} as const;

// Flat-top hexagon path inscribed in a 100×100 box. Slightly squashed
// vertically so the silhouette feels medal-like rather than honeycomb-y.
const HEX_PATH =
  "M 50 4 L 92 27 L 92 73 L 50 96 L 8 73 L 8 27 Z";

export function HexStamp({ badge, size = "md", className = "" }: HexStampProps) {
  const tokens = ACCENT_TOKENS[badge.accent];
  const sizing = SIZE_MAP[size];

  return (
    <div className={`group flex flex-col items-center text-center ${className}`}>
      <div
        className={`relative ${sizing.hex} transition-transform duration-300 group-hover:-translate-y-0.5`}
        title={`${badge.kind} · ${badge.title} — ${badge.description}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
          aria-hidden="true"
        >
          {/* Outer ring for "double" weight — sits 4px outside the hex */}
          {badge.weight === "double" && (
            <path
              d={HEX_PATH}
              fill="none"
              stroke={tokens.ring}
              strokeWidth={1.25}
              strokeOpacity={0.4}
              transform="translate(-3 -3) scale(1.06)"
            />
          )}

          {/* Body */}
          <path
            d={HEX_PATH}
            fill={badge.weight === "outline" ? "white" : tokens.fill}
            stroke={tokens.ring}
            strokeWidth={badge.weight === "outline" ? 1.25 : 1.5}
            strokeLinejoin="round"
          />

          {/* Inner glyph — geometric mark per tier kind */}
          <BadgeGlyph badge={badge} color={tokens.glyph} />
        </svg>
      </div>

      <p
        className={`mt-3 font-display font-bold tracking-tight tabular-nums text-neutral-900 ${sizing.title}`}
      >
        {badge.title}
      </p>
      <p
        className={`mt-0.5 font-mono uppercase tracking-[0.2em] ${sizing.subtitle} ${tokens.caption}`}
      >
        {badge.subtitle}
      </p>
    </div>
  );
}

/**
 * Inner glyph drawn on top of the hex body. Exported so other surfaces
 * (e.g. the dark-mode hero strip) can render the same mark inside a
 * differently-styled hex without redefining every shape.
 *
 * Conference *attendance* badges render the year ("'24") as the glyph
 * itself — turning each yearly attendance into its own distinct stamp.
 * Conference *contribution* and milestone badges keep their custom
 * marks (mic, compass, star, etc.) since those are stronger visual
 * identifiers than a year would be.
 */
export function BadgeGlyph({
  badge,
  color,
}: {
  badge: BadgeItem;
  color: string;
}) {
  // Milestones — distinctive marks
  if (badge.id === "milestone-three-peat") return <ThreePeatMark color={color} />;
  if (badge.id === "milestone-five-peat") return <StarMark color={color} />;
  if (badge.id === "milestone-first-stage") return <MicMark color={color} />;
  if (badge.id === "milestone-founding-roster")
    return <RosterMark color={color} />;
  if (badge.id === "milestone-charter-member")
    return <ChevronMark color={color} />;

  // Service tier — board / executive
  if (badge.kind === "Board") return <ShieldMark color={color} />;
  if (badge.kind === "Executive") return <GavelMark color={color} />;

  // Conference badges — role-specific marks for active contribution,
  // year-stamp for plain attendance.
  switch (badge.kind) {
    case "Talk":
      return <MicMark color={color} />;
    case "Poster":
      return <PosterMark color={color} />;
    case "Organized":
      return <CompassMark color={color} />;
    case "Sponsored":
      return <CrownMark color={color} />;
    case "Volunteered":
      return <HandMark color={color} />;
    case "Attended":
    default:
      return <YearMark year={extractYear(badge.title)} color={color} />;
  }
}

/**
 * Pulls "'24" out of "USRSE'24" — the canonical title shape for a
 * conference badge. Falls back to the raw title trimmed if something
 * unexpected comes through.
 */
function extractYear(title: string): string {
  const match = title.match(/'(\d{2})/);
  return match ? `'${match[1]}` : title.slice(-3);
}

// ── Glyph primitives ─────────────────────────────────────────────────
// Each mark is a tiny SVG drawn into a 100x100 viewBox, centered at
// (50, 50). Strokes use round line-caps to keep the editorial feel.

function YearMark({ year, color }: { year: string; color: string }) {
  // Year sits centered in the hex with a faint underline tick — turns
  // each attendance hex into a "year stamp" that's instantly distinct
  // from every other year.
  return (
    <g>
      <text
        x={50}
        y={50}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={36}
        letterSpacing={-1.5}
        fill={color}
      >
        {year}
      </text>
      <line
        x1={38}
        y1={70}
        x2={62}
        y2={70}
        stroke={color}
        strokeOpacity={0.35}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
    </g>
  );
}

function ShieldMark({ color }: { color: string }) {
  // Heraldic shield silhouette — top edge straight, sides curve in,
  // base comes to a soft point. Centered "·" at the heart suggests
  // the institutional anchor without being overly emblematic.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M 50 32 L 66 36 L 66 52 Q 66 64 50 70 Q 34 64 34 52 L 34 36 Z"
        fill={color}
        fillOpacity={0.14}
      />
      <line x1={50} y1={42} x2={50} y2={58} strokeWidth={2} />
      <circle cx={50} cy={50} r={2.5} fill={color} stroke="none" />
    </g>
  );
}

function GavelMark({ color }: { color: string }) {
  // Gavel — head at top-left struck against a sound block at bottom-
  // right. Diagonal handle reinforces the "rule of order" association
  // without leaning too judicial.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Sound block (anvil) */}
      <rect x={36} y={62} width={28} height={5} rx={1} fill={color} />
      {/* Handle */}
      <line x1={42} y1={56} x2={62} y2={36} strokeWidth={3} />
      {/* Gavel head */}
      <rect
        x={32}
        y={34}
        width={18}
        height={10}
        rx={1.5}
        transform="rotate(-45 41 39)"
        fill={color}
      />
    </g>
  );
}

function PosterMark({ color }: { color: string }) {
  // Poster board on an easel — small frame with two horizontal data
  // bars (chart marks) suggesting "research presented visually", on a
  // tripod stand. Distinct silhouette from the mic; same purple tier.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* Board */}
      <rect x={36} y={32} width={28} height={22} rx={1.5} fill={color} fillOpacity={0.12} />
      {/* Chart bars on the board */}
      <line x1={41} y1={42} x2={55} y2={42} strokeWidth={2} />
      <line x1={41} y1={48} x2={50} y2={48} strokeWidth={2} />
      {/* Easel legs */}
      <line x1={42} y1={54} x2={36} y2={70} />
      <line x1={58} y1={54} x2={64} y2={70} />
      {/* Cross-brace */}
      <line x1={40} y1={62} x2={60} y2={62} strokeOpacity={0.5} />
    </g>
  );
}

function MicMark({ color }: { color: string }) {
  return (
    <g
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <rect x={44} y={36} width={12} height={20} rx={6} fill={color} stroke="none" />
      <path d="M 38 52 Q 38 64 50 64 Q 62 64 62 52" />
      <line x1={50} y1={64} x2={50} y2={70} />
      <line x1={42} y1={70} x2={58} y2={70} />
    </g>
  );
}

function CompassMark({ color }: { color: string }) {
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx={50} cy={50} r={14} />
      <path d={`M 50 38 L 54 52 L 50 62 L 46 52 Z`} fill={color} stroke="none" />
      <circle cx={50} cy={50} r={1.8} fill="white" stroke="none" />
    </g>
  );
}

function CrownMark({ color }: { color: string }) {
  return (
    <g fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round">
      <path d="M 34 58 L 38 42 L 46 52 L 50 38 L 54 52 L 62 42 L 66 58 Z" />
      <line x1={34} y1={64} x2={66} y2={64} strokeLinecap="round" />
    </g>
  );
}

function HandMark({ color }: { color: string }) {
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M 40 56 L 40 42 M 46 58 L 46 38 M 52 58 L 52 40 M 58 58 L 58 44" />
      <path d="M 36 56 Q 36 70 50 70 Q 64 70 64 58" fill={color} fillOpacity={0.15} />
    </g>
  );
}

function ThreePeatMark({ color }: { color: string }) {
  return (
    <g
      fill={color}
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
    >
      {/* three stacked chevrons */}
      <path d="M 36 38 L 50 32 L 64 38" fill="none" strokeLinecap="round" />
      <path d="M 36 50 L 50 44 L 64 50" fill="none" strokeLinecap="round" />
      <path d="M 36 62 L 50 56 L 64 62" fill={color} stroke={color} strokeLinecap="round" />
    </g>
  );
}

function StarMark({ color }: { color: string }) {
  // Five-pointed star
  const cx = 50;
  const cy = 51;
  const outer = 16;
  const inner = 7;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return <polygon points={pts.join(" ")} fill={color} />;
}

function RosterMark({ color }: { color: string }) {
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <rect x={36} y={36} width={28} height={28} rx={2} />
      <line x1={42} y1={44} x2={58} y2={44} />
      <line x1={42} y1={50} x2={58} y2={50} />
      <line x1={42} y1={56} x2={52} y2={56} />
    </g>
  );
}

function ChevronMark({ color }: { color: string }) {
  return (
    <g
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M 38 56 L 50 40 L 62 56" />
      <line x1={50} y1={62} x2={50} y2={48} />
    </g>
  );
}
