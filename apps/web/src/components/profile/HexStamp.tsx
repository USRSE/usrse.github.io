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

  // Phase 1 — anniversary / identity / breadth / streak
  if (badge.id === "milestone-anniversary-1")
    return <AnniversaryMark color={color} years={1} />;
  if (badge.id === "milestone-anniversary-5")
    return <AnniversaryMark color={color} years={5} />;
  if (badge.id === "milestone-anniversary-10")
    return <AnniversaryMark color={color} years={10} />;
  if (badge.id === "identity-orcid") return <OrcidMark color={color} />;
  if (badge.id === "identity-github") return <GithubMark color={color} />;
  if (badge.id === "identity-linkedin") return <LinkedinMark color={color} />;
  if (badge.id === "milestone-profile-complete")
    return <CheckMark color={color} />;
  if (badge.id === "milestone-polyglot") return <PolyglotMark color={color} />;
  if (badge.id === "milestone-polymath") return <PolymathMark color={color} />;
  if (badge.id === "milestone-cross-disciplinary")
    return <CrossDisciplinaryMark color={color} />;
  if (badge.id === "milestone-decade-roster")
    return <CountStampMark color={color} count="10" />;
  if (badge.id === "milestone-speaker-decade")
    return <SpeakerCountMark color={color} count="10" />;
  if (badge.id === "milestone-speaker-quarter")
    return <SpeakerCountMark color={color} count="25" />;

  // Service tier — board / executive
  if (badge.kind === "Board") return <ShieldMark color={color} />;
  if (badge.kind === "Executive") return <GavelMark color={color} />;

  // Phase 2 — session-type, committee, and group glyphs.
  // Session types (richer than the old Talk/Poster pair):
  if (badge.kind === "Keynote") return <KeynoteMark color={color} />;
  if (badge.kind === "Plenary") return <PlenaryMark color={color} />;
  if (badge.kind === "Lightning Talk") return <LightningTalkMark color={color} />;
  if (badge.kind === "Tutorial Lead" || badge.kind === "Tutorial")
    return <TutorialMark color={color} />;
  if (badge.kind === "Workshop Lead" || badge.kind === "Workshop")
    return <WorkshopMark color={color} />;
  if (badge.kind === "BoF Lead" || badge.kind === "BoF")
    return <BoFMark color={color} />;
  if (badge.kind === "Panel Chair" || badge.kind === "Panelist")
    return <PanelMark color={color} />;
  // Group leadership / membership:
  if (badge.kind === "WG Chair" || badge.kind === "WG Member")
    return <WorkingGroupMark color={color} lead={badge.kind === "WG Chair"} />;
  if (badge.kind === "AG Coordinator" || badge.kind === "AG Member")
    return (
      <AffinityGroupMark color={color} lead={badge.kind === "AG Coordinator"} />
    );
  if (
    badge.kind === "Regional Coordinator" ||
    badge.kind === "Regional Member"
  )
    return (
      <RegionalGroupMark
        color={color}
        lead={badge.kind === "Regional Coordinator"}
      />
    );
  // Committee assignments — service-tier badges with arbitrary area
  // labels as the kind. Use a generic compass-with-check glyph; only
  // the existing Board/Executive service kinds get bespoke marks.
  if (badge.tier === "service" && badge.id.startsWith("committee-")) {
    return <CommitteeMark color={color} />;
  }

  // Phase 3 — awards, mentorship, contributions.
  if (badge.id.startsWith("award-")) {
    return (
      <AwardMark
        color={color}
        tier={badge.subtitle.toLowerCase() as "lifetime" | "special" | "annual"}
      />
    );
  }
  if (badge.id.startsWith("mentorship-")) {
    return (
      <MentorshipMark color={color} mentee={badge.kind === "Mentee"} />
    );
  }
  if (badge.id === "milestone-first-contribution")
    return <FirstContributionMark color={color} />;
  if (badge.id === "milestone-sustained-contributor")
    return <SustainedContributorMark color={color} />;
  if (badge.id.startsWith("contribution-")) {
    if (badge.kind === "Newsletter")
      return <NewsletterMark color={color} />;
    if (badge.kind === "Tutorial") return <TutorialMark color={color} />;
    if (badge.kind === "Resource Author")
      return <ResourceMark color={color} />;
    if (badge.kind === "Translator")
      return <TranslatorMark color={color} />;
    if (badge.kind === "Call Host") return <CallHostMark color={color} />;
    if (badge.kind === "Blog Author") return <BlogMark color={color} />;
    if (badge.kind === "Podcast") return <PodcastMark color={color} />;
    return <ContributionMark color={color} />;
  }

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

function AnniversaryMark({ color, years }: { color: string; years: 1 | 5 | 10 }) {
  // Year-count number ringed by a thin laurel arc — a ribbon-of-time
  // motif. Years scaled per tier so "10" reads larger than "1".
  const fontSize = years === 1 ? 30 : years === 5 ? 32 : 30;
  return (
    <g>
      <path
        d="M 30 56 Q 24 50 28 42 M 70 56 Q 76 50 72 42"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.55}
      />
      <text
        x={50}
        y={51}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={fontSize}
        letterSpacing={-1.5}
        fill={color}
      >
        {years}
      </text>
      <text
        x={50}
        y={70}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontWeight={600}
        fontSize={9}
        letterSpacing={1.5}
        fill={color}
        fillOpacity={0.7}
      >
        YR
      </text>
    </g>
  );
}

function OrcidMark({ color }: { color: string }) {
  // Stylized "iD" mark — a circle with a lower-case "id" inscribed.
  // Matches ORCID's brand silhouette without lifting their logo.
  return (
    <g>
      <circle
        cx={50}
        cy={50}
        r={16}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
      <text
        x={50}
        y={51}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={16}
        fill={color}
      >
        iD
      </text>
    </g>
  );
}

function GithubMark({ color }: { color: string }) {
  // Stylized cat-like silhouette: rounded rect body + two ear notches
  // + a tail curl. Reads as "GitHub" without lifting the octocat.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Ears */}
      <path d="M 38 36 L 42 30 L 46 36" fill={color} />
      <path d="M 54 36 L 58 30 L 62 36" fill={color} />
      {/* Body / head */}
      <path
        d="M 36 38 Q 36 56 50 60 Q 64 56 64 38 Q 64 34 60 34 L 40 34 Q 36 34 36 38 Z"
        fill={color}
        fillOpacity={0.18}
      />
      {/* Eyes */}
      <circle cx={44} cy={46} r={1.6} fill={color} stroke="none" />
      <circle cx={56} cy={46} r={1.6} fill={color} stroke="none" />
      {/* Tail curl */}
      <path
        d="M 50 60 Q 50 68 58 70"
        fill="none"
      />
    </g>
  );
}

function LinkedinMark({ color }: { color: string }) {
  // Lower-case "in" inside a rounded square — the universal LinkedIn
  // shorthand without lifting the brand mark verbatim.
  return (
    <g>
      <rect
        x={32}
        y={32}
        width={36}
        height={36}
        rx={5}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
      <text
        x={50}
        y={52}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={18}
        fill={color}
      >
        in
      </text>
    </g>
  );
}

function CheckMark({ color }: { color: string }) {
  // Profile complete — a clean checkmark inside a soft-fill circle.
  return (
    <g>
      <circle
        cx={50}
        cy={50}
        r={16}
        fill={color}
        fillOpacity={0.14}
        stroke={color}
        strokeWidth={1.5}
      />
      <path
        d="M 41 51 L 47 57 L 60 43"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function PolyglotMark({ color }: { color: string }) {
  // Three language brackets stacked — curly, square, angle — quoting
  // the punctuation that defines different language families.
  return (
    <g
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* { } */}
      <path d="M 38 36 Q 34 36 34 40 Q 34 44 30 44 Q 34 44 34 48 Q 34 52 38 52" />
      <path d="M 62 36 Q 66 36 66 40 Q 66 44 70 44 Q 66 44 66 48 Q 66 52 62 52" />
      {/* < > */}
      <path d="M 38 60 L 32 64 L 38 68" />
      <path d="M 62 60 L 68 64 L 62 68" />
    </g>
  );
}

function PolymathMark({ color }: { color: string }) {
  // Three overlapping circles — Venn-diagram shorthand for "wide
  // intersecting expertise."
  return (
    <g
      stroke={color}
      strokeWidth={1.8}
      fill="none"
    >
      <circle cx={42} cy={45} r={11} fill={color} fillOpacity={0.14} />
      <circle cx={58} cy={45} r={11} fill={color} fillOpacity={0.14} />
      <circle cx={50} cy={58} r={11} fill={color} fillOpacity={0.14} />
    </g>
  );
}

function CrossDisciplinaryMark({ color }: { color: string }) {
  // Three triangles converging on a center node — bridges across
  // domains. Crossbar emphasizes the *crossing* aspect.
  return (
    <g
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={50} y1={36} x2={50} y2={64} />
      <line x1={36} y1={50} x2={64} y2={50} />
      <line x1={40} y1={40} x2={60} y2={60} />
      <circle cx={50} cy={50} r={4} fill={color} stroke="none" />
    </g>
  );
}

function CountStampMark({ color, count }: { color: string; count: string }) {
  // Plain two-digit count centered in the hex with two flanking ticks.
  // Used for "10 conferences" / "25 talks" style badges.
  return (
    <g>
      <line
        x1={28}
        y1={50}
        x2={36}
        y2={50}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.55}
      />
      <line
        x1={64}
        y1={50}
        x2={72}
        y2={50}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.55}
      />
      <text
        x={50}
        y={52}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={32}
        letterSpacing={-1}
        fill={color}
      >
        {count}
      </text>
    </g>
  );
}

function SpeakerCountMark({ color, count }: { color: string; count: string }) {
  // Compact mic at top, count digits below — visually links the
  // speaker streak to the existing MicMark vocabulary while making
  // the count itself the primary reading.
  return (
    <g>
      {/* Mini mic */}
      <rect
        x={46}
        y={28}
        width={8}
        height={12}
        rx={4}
        fill={color}
        stroke="none"
      />
      <path
        d="M 42 38 Q 42 46 50 46 Q 58 46 58 38"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <line
        x1={50}
        y1={46}
        x2={50}
        y2={50}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Count */}
      <text
        x={50}
        y={62}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={20}
        letterSpacing={-0.5}
        fill={color}
      >
        {count}
      </text>
    </g>
  );
}

// ── Phase 2 glyphs ──────────────────────────────────────────────────

function KeynoteMark({ color }: { color: string }) {
  // Mic with three sparkle marks — the rarity bump. Same mic geometry
  // as MicMark so the visual family stays cohesive.
  return (
    <g
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <rect x={44} y={40} width={12} height={18} rx={6} fill={color} stroke="none" />
      <path d="M 38 56 Q 38 66 50 66 Q 62 66 62 56" />
      <line x1={50} y1={66} x2={50} y2={70} />
      {/* Sparkles */}
      <path d="M 32 36 L 34 38 L 36 36 L 34 34 Z" fill={color} stroke="none" />
      <path d="M 64 32 L 66 34 L 68 32 L 66 30 Z" fill={color} stroke="none" />
      <path d="M 34 28 L 35 30 L 36 28 L 35 26 Z" fill={color} stroke="none" />
    </g>
  );
}

function PlenaryMark({ color }: { color: string }) {
  // Mic centered in a laurel wreath — civic / institutional gravitas.
  return (
    <g
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* Laurel arcs */}
      <path d="M 28 50 Q 24 42 30 32" strokeOpacity={0.6} />
      <path d="M 30 56 Q 26 58 22 54" strokeOpacity={0.6} />
      <path d="M 72 50 Q 76 42 70 32" strokeOpacity={0.6} />
      <path d="M 70 56 Q 74 58 78 54" strokeOpacity={0.6} />
      {/* Mic */}
      <rect x={45} y={38} width={10} height={16} rx={5} fill={color} stroke="none" />
      <path d="M 40 52 Q 40 62 50 62 Q 60 62 60 52" />
      <line x1={50} y1={62} x2={50} y2={66} />
      <line x1={44} y1={66} x2={56} y2={66} strokeWidth={1.5} />
    </g>
  );
}

function LightningTalkMark({ color }: { color: string }) {
  // Lightning bolt — speed/brevity reading. No mic; the bolt alone is
  // distinctive enough at this scale.
  return (
    <g>
      <path
        d="M 54 28 L 38 52 L 48 52 L 44 72 L 62 46 L 52 46 Z"
        fill={color}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </g>
  );
}

function TutorialMark({ color }: { color: string }) {
  // Open book — instruction. Center spine implied by two facing
  // pages with subtle text-line marks.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Spine */}
      <line x1={50} y1={36} x2={50} y2={66} />
      {/* Pages */}
      <path
        d="M 50 36 Q 42 34 32 38 L 32 64 Q 42 60 50 64 Q 58 60 68 64 L 68 38 Q 58 34 50 36 Z"
        fill={color}
        fillOpacity={0.12}
      />
      {/* Lines on the pages */}
      <line x1={36} y1={44} x2={46} y2={44} strokeOpacity={0.55} />
      <line x1={36} y1={50} x2={45} y2={50} strokeOpacity={0.55} />
      <line x1={54} y1={44} x2={64} y2={44} strokeOpacity={0.55} />
      <line x1={54} y1={50} x2={63} y2={50} strokeOpacity={0.55} />
    </g>
  );
}

function WorkshopMark({ color }: { color: string }) {
  // Gear silhouette — the workshop / making metaphor.
  const teeth = 8;
  const cx = 50;
  const cy = 50;
  const outer = 18;
  const inner = 14;
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / teeth) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return (
    <g>
      <polygon
        points={pts.join(" ")}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={5} fill={color} />
    </g>
  );
}

function BoFMark({ color }: { color: string }) {
  // Cluster of birds — three small triangles in a flock arrangement.
  return (
    <g fill={color} stroke={color} strokeWidth={1.4} strokeLinejoin="round">
      <path d="M 36 44 Q 40 40 44 44 Q 40 42 36 44 Z" />
      <path d="M 50 36 Q 54 32 58 36 Q 54 34 50 36 Z" />
      <path d="M 56 52 Q 60 48 64 52 Q 60 50 56 52 Z" />
      {/* Connection lines hint at the gathering */}
      <line
        x1={42}
        y1={46}
        x2={52}
        y2={38}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <line
        x1={54}
        y1={38}
        x2={60}
        y2={50}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <line
        x1={42}
        y1={46}
        x2={58}
        y2={54}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
    </g>
  );
}

function PanelMark({ color }: { color: string }) {
  // Three figures behind a table — the panel silhouette.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Table */}
      <rect x={32} y={58} width={36} height={4} rx={1} fill={color} />
      {/* Three figures (head + shoulders) */}
      <g fill={color}>
        <circle cx={40} cy={42} r={3} />
        <path
          d="M 34 56 Q 34 48 40 48 Q 46 48 46 56 Z"
          fillOpacity={0.18}
          stroke={color}
        />
        <circle cx={50} cy={40} r={3.5} />
        <path
          d="M 43 56 Q 43 47 50 47 Q 57 47 57 56 Z"
          fillOpacity={0.18}
          stroke={color}
        />
        <circle cx={60} cy={42} r={3} />
        <path
          d="M 54 56 Q 54 48 60 48 Q 66 48 66 56 Z"
          fillOpacity={0.18}
          stroke={color}
        />
      </g>
    </g>
  );
}

function WorkingGroupMark({ color, lead }: { color: string; lead: boolean }) {
  // Three nodes arranged in a triangle, connected — a working unit.
  // Lead variant adds a small ring around the apex node.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      fill={color}
    >
      {/* Edges */}
      <line x1={50} y1={36} x2={36} y2={60} strokeOpacity={0.55} />
      <line x1={50} y1={36} x2={64} y2={60} strokeOpacity={0.55} />
      <line x1={36} y1={60} x2={64} y2={60} strokeOpacity={0.55} />
      {/* Nodes */}
      <circle cx={50} cy={36} r={lead ? 6 : 4} fill={color} stroke="none" />
      {lead && (
        <circle
          cx={50}
          cy={36}
          r={9}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
      )}
      <circle cx={36} cy={60} r={4} fill={color} stroke="none" />
      <circle cx={64} cy={60} r={4} fill={color} stroke="none" />
    </g>
  );
}

function AffinityGroupMark({ color, lead }: { color: string; lead: boolean }) {
  // Two figures linked by a small bond — the affinity / kinship motif.
  // Coordinator variant adds a small star above to flag the role.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Two heads */}
      <circle cx={40} cy={46} r={5} fill={color} stroke="none" />
      <circle cx={60} cy={46} r={5} fill={color} stroke="none" />
      {/* Two bodies (arc) */}
      <path
        d="M 32 64 Q 32 54 40 54 Q 48 54 48 64"
        fill={color}
        fillOpacity={0.15}
      />
      <path
        d="M 52 64 Q 52 54 60 54 Q 68 54 68 64"
        fill={color}
        fillOpacity={0.15}
      />
      {/* Bond line */}
      <line
        x1={45}
        y1={46}
        x2={55}
        y2={46}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {lead && (
        <path
          d="M 50 28 L 51.5 31 L 54.5 31 L 52 33 L 53 36 L 50 34.5 L 47 36 L 48 33 L 45.5 31 L 48.5 31 Z"
          fill={color}
          stroke="none"
        />
      )}
    </g>
  );
}

function RegionalGroupMark({ color, lead }: { color: string; lead: boolean }) {
  // Map pin sitting on a lat-long crosshair — the local-organizing
  // metaphor. Coordinator variant solid-fills the pin.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Crosshair */}
      <line x1={28} y1={56} x2={72} y2={56} strokeOpacity={0.5} />
      <line x1={50} y1={28} x2={50} y2={72} strokeOpacity={0.5} />
      {/* Pin */}
      <path
        d="M 50 30 Q 38 30 38 42 Q 38 50 50 60 Q 62 50 62 42 Q 62 30 50 30 Z"
        fill={lead ? color : "white"}
        stroke={color}
        strokeWidth={1.8}
      />
      <circle cx={50} cy={42} r={4} fill={lead ? "white" : color} stroke="none" />
    </g>
  );
}

function CommitteeMark({ color }: { color: string }) {
  // Generic committee mark: compass with a checkmark at center —
  // "directed approval." Used for any committee area not separately
  // recognized by Board/Executive marks.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx={50} cy={50} r={15} />
      <path d="M 43 51 L 48 56 L 58 44" strokeWidth={2.4} />
    </g>
  );
}

// ── Phase 3 glyphs ──────────────────────────────────────────────────

function AwardMark({
  color,
  tier,
}: {
  color: string;
  tier: "lifetime" | "special" | "annual";
}) {
  // Trophy + ribbon — varies by tier:
  //   lifetime: trophy with twin laurels (most ornate)
  //   special:  star inside a medallion
  //   annual:   ribbon medallion
  if (tier === "lifetime") {
    return (
      <g
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* Laurels */}
        <path d="M 28 50 Q 24 40 32 32" strokeOpacity={0.55} />
        <path d="M 30 56 Q 26 60 22 56" strokeOpacity={0.55} />
        <path d="M 72 50 Q 76 40 68 32" strokeOpacity={0.55} />
        <path d="M 70 56 Q 74 60 78 56" strokeOpacity={0.55} />
        {/* Cup body */}
        <path
          d="M 38 36 L 62 36 L 60 54 Q 50 60 40 54 Z"
          fill={color}
          fillOpacity={0.18}
        />
        {/* Handles */}
        <path d="M 38 40 Q 32 42 32 48" />
        <path d="M 62 40 Q 68 42 68 48" />
        {/* Stem + base */}
        <line x1={50} y1={56} x2={50} y2={64} strokeWidth={2} />
        <rect x={42} y={64} width={16} height={4} rx={1} fill={color} stroke="none" />
      </g>
    );
  }
  if (tier === "special") {
    return (
      <g>
        <circle
          cx={50}
          cy={50}
          r={16}
          fill={color}
          fillOpacity={0.16}
          stroke={color}
          strokeWidth={1.8}
        />
        {/* Centered five-point star */}
        {(() => {
          const cx = 50;
          const cy = 50;
          const outer = 9;
          const inner = 4;
          const pts: string[] = [];
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const a = (Math.PI / 5) * i - Math.PI / 2;
            pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
          }
          return <polygon points={pts.join(" ")} fill={color} />;
        })()}
        {/* Hanging ribbons */}
        <path
          d="M 42 64 L 46 74 L 50 70 L 54 74 L 58 64"
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </g>
    );
  }
  // annual
  return (
    <g>
      <circle
        cx={50}
        cy={48}
        r={14}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={1.8}
      />
      <text
        x={50}
        y={49}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={14}
        fill={color}
      >
        ★
      </text>
      {/* Ribbon tails */}
      <path
        d="M 42 60 L 38 76 L 50 70 L 62 76 L 58 60"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </g>
  );
}

function MentorshipMark({
  color,
  mentee,
}: {
  color: string;
  mentee: boolean;
}) {
  // Two figures with a baton passing between them. Mentor variant has
  // the baton angled away from the central figure (giving); mentee
  // variant has it angled toward (receiving).
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Two heads */}
      <circle cx={38} cy={44} r={4} fill={color} stroke="none" />
      <circle cx={62} cy={44} r={4} fill={color} stroke="none" />
      {/* Two bodies */}
      <path
        d="M 32 60 Q 32 50 38 50 Q 44 50 44 60"
        fill={color}
        fillOpacity={0.15}
      />
      <path
        d="M 56 60 Q 56 50 62 50 Q 68 50 68 60"
        fill={color}
        fillOpacity={0.15}
      />
      {/* Baton — direction flips for mentee */}
      {mentee ? (
        <path d="M 56 50 L 44 56" strokeWidth={2.4} />
      ) : (
        <path d="M 44 50 L 56 56" strokeWidth={2.4} />
      )}
      <circle
        cx={mentee ? 56 : 44}
        cy={50}
        r={2}
        fill={color}
        stroke="none"
      />
    </g>
  );
}

function NewsletterMark({ color }: { color: string }) {
  // Folded newsletter — masthead block + two text lines.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x={32}
        y={34}
        width={36}
        height={32}
        rx={1.5}
        fill={color}
        fillOpacity={0.12}
      />
      <rect x={36} y={38} width={28} height={6} rx={0.5} fill={color} stroke="none" />
      <line x1={36} y1={50} x2={62} y2={50} strokeOpacity={0.55} />
      <line x1={36} y1={56} x2={56} y2={56} strokeOpacity={0.55} />
      <line x1={36} y1={62} x2={60} y2={62} strokeOpacity={0.55} />
    </g>
  );
}

function ResourceMark({ color }: { color: string }) {
  // Stacked papers / resource bundle.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x={36}
        y={38}
        width={26}
        height={32}
        rx={1.5}
        fill={color}
        fillOpacity={0.12}
      />
      <rect
        x={32}
        y={34}
        width={26}
        height={32}
        rx={1.5}
        fill="white"
        stroke={color}
      />
      <line x1={36} y1={42} x2={50} y2={42} strokeOpacity={0.55} />
      <line x1={36} y1={48} x2={52} y2={48} strokeOpacity={0.55} />
      <line x1={36} y1={54} x2={48} y2={54} strokeOpacity={0.55} />
    </g>
  );
}

function TranslatorMark({ color }: { color: string }) {
  // Two character glyphs (A and 文-style block) with a bridge between.
  return (
    <g>
      <text
        x={36}
        y={54}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={20}
        fill={color}
      >
        A
      </text>
      <path
        d="M 44 50 L 56 50"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <text
        x={64}
        y={54}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={20}
        fill={color}
      >
        亜
      </text>
    </g>
  );
}

function CallHostMark({ color }: { color: string }) {
  // Headset / mic-with-arc — calls in progress.
  return (
    <g
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M 30 52 Q 30 36 50 36 Q 70 36 70 52" />
      <rect x={28} y={50} width={8} height={14} rx={2} fill={color} stroke="none" />
      <rect x={64} y={50} width={8} height={14} rx={2} fill={color} stroke="none" />
      {/* Mouthpiece */}
      <path d="M 64 60 Q 60 66 50 66 Q 46 66 46 62" />
    </g>
  );
}

function BlogMark({ color }: { color: string }) {
  // Quill on paper.
  return (
    <g
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x={32}
        y={36}
        width={28}
        height={30}
        rx={1.5}
        fill={color}
        fillOpacity={0.12}
      />
      <line x1={36} y1={44} x2={54} y2={44} strokeOpacity={0.55} />
      <line x1={36} y1={50} x2={50} y2={50} strokeOpacity={0.55} />
      {/* Quill */}
      <path
        d="M 56 36 L 70 50 L 64 56 L 50 42 Z"
        fill={color}
        fillOpacity={0.4}
      />
      <line x1={64} y1={56} x2={56} y2={64} strokeWidth={2} />
    </g>
  );
}

function PodcastMark({ color }: { color: string }) {
  // Microphone with broadcast waves.
  return (
    <g
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <rect x={45} y={32} width={10} height={20} rx={5} fill={color} stroke="none" />
      <path d="M 38 50 Q 38 60 50 60 Q 62 60 62 50" />
      <line x1={50} y1={60} x2={50} y2={66} />
      <line x1={42} y1={66} x2={58} y2={66} />
      {/* Waves */}
      <path d="M 28 38 Q 26 42 28 46" strokeOpacity={0.6} />
      <path d="M 24 34 Q 20 42 24 50" strokeOpacity={0.4} />
      <path d="M 72 38 Q 74 42 72 46" strokeOpacity={0.6} />
      <path d="M 76 34 Q 80 42 76 50" strokeOpacity={0.4} />
    </g>
  );
}

function ContributionMark({ color }: { color: string }) {
  // Generic upward arrow inside a hex-implied frame for the "other"
  // contribution kind.
  return (
    <g
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M 50 64 L 50 38 M 38 50 L 50 38 L 62 50" />
    </g>
  );
}

function FirstContributionMark({ color }: { color: string }) {
  // Number "1" inside a soft circle — the first ascent.
  return (
    <g>
      <circle
        cx={50}
        cy={50}
        r={16}
        fill={color}
        fillOpacity={0.14}
        stroke={color}
        strokeWidth={1.6}
      />
      <text
        x={50}
        y={51}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        fontSize={24}
        fill={color}
      >
        1
      </text>
    </g>
  );
}

function SustainedContributorMark({ color }: { color: string }) {
  // Five small dots ascending — sustained output rendered as a step
  // pattern.
  return (
    <g fill={color} stroke={color}>
      <circle cx={32} cy={62} r={2.5} />
      <circle cx={40} cy={56} r={2.5} />
      <circle cx={50} cy={50} r={3} />
      <circle cx={60} cy={44} r={2.5} />
      <circle cx={68} cy={38} r={2.5} />
      {/* Connecting line */}
      <path
        d="M 32 62 L 40 56 L 50 50 L 60 44 L 68 38"
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.55}
      />
    </g>
  );
}
