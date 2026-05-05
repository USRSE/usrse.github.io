import { Link } from "react-router-dom";
import { formatMemberId } from "@/lib/member-id";
import { BadgeGlyph } from "./HexStamp";
import type { BadgeItem } from "@/hooks/useCurrentMember";

/**
 * Cap on the hero "Achievements" strip. Higher than 3 so the strip can
 * actually showcase a member's accomplishments, low enough that it
 * doesn't compete with the breadcrumb or push the headline down. The
 * larger Recognition section below is the canonical surface for the
 * full set.
 */
const HERO_BADGE_CAP = 5;

interface ProfileHeroProps {
  displayName: string;
  memberId: string;
  slug: string | null;
  role: string;
  jobTitle: string | null;
  institutionName: string | null;
  publicLocation: string | null;
  joinedIso: string;
  isOwner: boolean;
  badges?: BadgeItem[];
}

function formatJoinedDate(iso: string): string {
  // Safari is strict about Date parsing — refuses "YYYY-MM-DD HH:MM:SS"
  // (with a space) which Postgres may return through some drivers.
  // Replace the space with T as a defensive normalizer, then guard
  // against Invalid Date so a quirky timestamp can never crash the
  // page.
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "recently";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function ProfileHero({
  displayName,
  memberId,
  slug,
  role,
  jobTitle,
  institutionName,
  publicLocation,
  joinedIso,
  isOwner,
  badges = [],
}: ProfileHeroProps) {
  // Pick the most "interesting" badges to surface up top: milestones
  // first (rare, prestige), then most-recent contribution badges
  // (Spoke / Organized / Sponsored / Volunteered). Skip plain
  // attendance — those belong to the full grid below, not the hero.
  const featured = pickFeaturedBadges(badges, HERO_BADGE_CAP);
  const formattedId = formatMemberId(memberId);
  const subtitleParts = [jobTitle, institutionName, publicLocation].filter(
    (p): p is string => Boolean(p && p.trim())
  );

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-purple-950 via-purple-800 to-purple-600 py-16 lg:py-24">
      {/* Subtle grid texture — matches Hero.tsx */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />

      {/* Soft teal glow bottom-right */}
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-teal-500/20 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-3 animate-fade-in">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                to="/"
                className="text-white/50 hover:text-white/80 transition-colors"
              >
                Home
              </Link>
            </li>
            <li className="text-white/30">/</li>
            {isOwner ? (
              <li>
                <span className="text-white/90 font-medium">My profile</span>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    to="/resources/directory"
                    className="text-white/50 hover:text-white/80 transition-colors"
                  >
                    Members
                  </Link>
                </li>
                <li className="text-white/30">/</li>
                <li>
                  <span className="text-white/90 font-medium">
                    {displayName}
                  </span>
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Subtle inline "view public version" link for owners */}
        {isOwner && slug && (
          <p
            className="mb-6 text-xs text-white/40 font-mono animate-fade-in"
            style={{ animationDelay: "40ms" }}
          >
            <Link
              to={`/members/${slug}`}
              className="hover:text-teal-300 transition-colors"
            >
              view public version /members/{slug} ↗
            </Link>
          </p>
        )}

        {/* Member-ID chip eyebrow */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-7 animate-fade-in"
          style={{ animationDelay: "80ms" }}
        >
          <span
            className="w-2 h-2 rounded-full bg-teal-300 animate-pulse-soft"
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-white/80 tracking-wide uppercase">
            Member · {formattedId}
          </span>
        </div>

        <h1
          className="font-display text-5xl lg:text-7xl font-bold tracking-tight leading-[1.02] text-white animate-slide-up text-balance max-w-4xl"
          style={{ animationDelay: "120ms" }}
        >
          {displayName}
        </h1>

        {subtitleParts.length > 0 && (
          <p
            className="mt-6 text-lg lg:text-xl text-white/70 leading-relaxed max-w-3xl animate-slide-up"
            style={{ animationDelay: "240ms" }}
          >
            {subtitleParts.map((part, i) => (
              <span key={i}>
                {part}
                {i < subtitleParts.length - 1 && (
                  <span className="mx-3 text-white/30">·</span>
                )}
              </span>
            ))}
          </p>
        )}

        <p
          className="mt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40 animate-fade-in"
          style={{ animationDelay: "360ms" }}
        >
          joined {formatJoinedDate(joinedIso)}
          <span className="mx-2 text-white/20">·</span>
          role {role.replace("_", " ")}
        </p>

        {featured.length > 0 && (
          <div
            className="mt-7 flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: "440ms" }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 shrink-0">
              Achievements
            </span>
            <a
              href="#recognition"
              className="flex items-center gap-2"
              aria-label="See all badges"
            >
              {featured.map((b) => (
                <HeroHexMark key={b.id} badge={b} />
              ))}
              {badges.length > featured.length && (
                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white/80 transition-colors">
                  +{badges.length - featured.length} more
                </span>
              )}
            </a>
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * Small dark-mode hex mark used in the hero "Achievements" strip.
 * Reuses the same BadgeGlyph as the full Recognition section so a
 * speaker badge here reads as the same idea as a speaker badge below
 * — just smaller and tuned for the purple gradient backdrop.
 *
 * Visual tuning: saturated accent fill with a white hairline ring,
 * white-tinted glyph ink. The double-ring weight from the section
 * collapses to a single ring at this size — anything more reads as
 * noise.
 */
function HeroHexMark({ badge }: { badge: BadgeItem }) {
  const fill = HERO_HEX_FILL[badge.accent];
  const glyphColor = HERO_GLYPH_COLOR[badge.accent];
  return (
    <span
      title={`${badge.kind} · ${badge.title} — ${badge.description}`}
      className="relative inline-block w-9 h-9 transition-transform hover:-translate-y-0.5"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        <path
          d="M 50 4 L 92 27 L 92 73 L 50 96 L 8 73 L 8 27 Z"
          fill={fill}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <BadgeGlyph badge={badge} color={glyphColor} />
      </svg>
    </span>
  );
}

const HERO_HEX_FILL: Record<BadgeItem["accent"], string> = {
  purple: "#9B5FFF",
  teal: "#1FB5A8",
  amber: "#E5A332",
  rose: "#E04A6A",
  graphite: "#0F0F18",
  neutral: "rgba(255,255,255,0.2)",
};

// Glyph ink color — tuned for legibility against the saturated fills
// above. Most fills are dark enough that white reads cleanly; the
// amber fill needs a deeper tint to keep the glyph visible.
const HERO_GLYPH_COLOR: Record<BadgeItem["accent"], string> = {
  purple: "#FFFFFF",
  teal: "#FFFFFF",
  amber: "#3A2A05",
  rose: "#FFFFFF",
  graphite: "#FFFFFF",
  neutral: "#FFFFFF",
};

/**
 * Hero strip should celebrate the rarest things first — milestones
 * (Charter, Three-Peat, First Stage), then meaningful contribution
 * (Spoke, Organized, Sponsored, Volunteered). Plain attendance is
 * worth recognizing in the full section, but it's noise up here.
 */
function pickFeaturedBadges(badges: BadgeItem[], limit: number): BadgeItem[] {
  // Service tier (Board, Executive) sits at the top — it's the
  // rarest and most prestigious tier in the system. Then milestones
  // (Three-Peat, Founding Roster, etc.), then non-attendance
  // conference contributions. Plain attendance never makes it up
  // here — those belong to the full Recognition section below.
  const service = badges
    .filter((b) => b.tier === "service")
    .sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : -1));
  const milestones = badges
    .filter((b) => b.tier === "milestone")
    .sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : -1));
  const contributions = badges
    .filter((b) => b.tier === "conference" && b.kind !== "Attended")
    .sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : -1));
  return [...service, ...milestones, ...contributions].slice(0, limit);
}
