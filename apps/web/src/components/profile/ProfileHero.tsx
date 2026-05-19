import { Link } from "react-router-dom";
import { formatMemberId } from "@/lib/member-id";
import { BadgeGlyph } from "./HexStamp";
import { ContactBylines, type ContactLink } from "./ContactBylines";
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
  organizationName: string | null;
  publicLocation: string | null;
  joinedIso: string;
  isOwner: boolean;
  badges?: BadgeItem[];
  contactLinks?: ContactLink[];
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
  organizationName,
  publicLocation,
  joinedIso,
  isOwner,
  badges = [],
  contactLinks = [],
}: ProfileHeroProps) {
  // Pick the most "interesting" badges to surface up top: milestones
  // first (rare, prestige), then most-recent contribution badges
  // (Spoke / Organized / Sponsored / Volunteered). Skip plain
  // attendance — those belong to the full grid below, not the hero.
  const featured = pickFeaturedBadges(badges, HERO_BADGE_CAP);
  const formattedId = formatMemberId(memberId);
  const subtitleParts = [jobTitle, organizationName, publicLocation].filter(
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
                    to="/members"
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

        {/* Subtle inline "view as public" link for owners. Adds
            ?view=public so MemberPage flips to the visitor render
            (public payload, no edit UI) and shows an exit-preview
            banner. Same URL, no duplicate route. */}
        {isOwner && slug && (
          <p
            className="mb-6 text-xs text-white/40 font-mono animate-fade-in"
            style={{ animationDelay: "40ms" }}
          >
            <Link
              to={`/members/${slug}?view=public`}
              className="hover:text-teal-300 transition-colors"
            >
              view as public ↗
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

        {contactLinks.length > 0 && (
          <div
            className="mt-6 animate-fade-in"
            style={{ animationDelay: "520ms" }}
          >
            <ContactBylines
              links={contactLinks}
              displayName={displayName}
              tone="dark"
            />
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
 *
 * Within the milestone tier, hero priority is now layered by rarity:
 *   1. Speaker streak + Decade Roster + 5-year/10-year anniversary
 *      and "founding" milestones — the rarest/longest arcs.
 *   2. Three-Peat / Five-Peat / Charter / Founding Roster (existing).
 *   3. Profile Complete + breadth-of-craft (Polyglot / Polymath /
 *      Cross-Disciplinary).
 *   4. Identity verifications (ORCID / GitHub / LinkedIn) — useful
 *      to surface but not at the cost of crowding out service tier.
 *      These sit *below* contribution badges in the hero ordering.
 *   5. 1-Year anniversary — too common to feature.
 */
const FEATURED_MILESTONE_PRIORITY: Record<string, number> = {
  "milestone-sustained-contributor": 0,
  "milestone-speaker-quarter": 1,
  "milestone-speaker-decade": 2,
  "milestone-decade-roster": 3,
  "milestone-anniversary-10": 4,
  "milestone-five-peat": 5,
  "milestone-founding-roster": 6,
  "milestone-anniversary-5": 7,
  "milestone-three-peat": 8,
  "milestone-charter-member": 9,
  "milestone-first-stage": 10,
  "milestone-first-contribution": 10,
  "milestone-profile-complete": 11,
  "milestone-polymath": 12,
  "milestone-polyglot": 13,
  "milestone-cross-disciplinary": 14,
};

const HERO_HIDDEN_BADGE_IDS = new Set<string>([
  // 1-year anniversary is more "you signed up" than "you're a
  // pillar of the community" — leave it for the full Recognition
  // section.
  "milestone-anniversary-1",
]);

const IDENTITY_BADGE_IDS = new Set<string>([
  "identity-orcid",
  "identity-github",
  "identity-linkedin",
]);

function pickFeaturedBadges(badges: BadgeItem[], limit: number): BadgeItem[] {
  // Service tier (Board, Executive) sits at the top — it's the
  // rarest and most prestigious tier in the system. Then milestones
  // ranked by their per-id priority (above), then non-attendance
  // conference contributions, then identity verifications. Plain
  // attendance and 1-year anniversary never make it up here — those
  // belong to the full Recognition section below.
  const visibleMilestones = badges.filter(
    (b) =>
      b.tier === "milestone" &&
      !HERO_HIDDEN_BADGE_IDS.has(b.id) &&
      !IDENTITY_BADGE_IDS.has(b.id)
  );
  const service = badges
    .filter((b) => b.tier === "service")
    .sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : -1));
  const milestones = visibleMilestones.sort((a, b) => {
    const pa = FEATURED_MILESTONE_PRIORITY[a.id] ?? 99;
    const pb = FEATURED_MILESTONE_PRIORITY[b.id] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.earnedAt < b.earnedAt ? 1 : -1;
  });
  const contributions = badges
    .filter((b) => b.tier === "conference" && b.kind !== "Attended")
    .sort((a, b) => {
      // Phase 2 adds richer session kinds — Keynote / Plenary / Tutorial
      // Lead etc. — that should outrank the generic Talk and Poster
      // badges within the contributions bucket. Lower number =
      // more prominent in the hero strip.
      const pa = CONTRIBUTION_KIND_PRIORITY[a.kind] ?? 50;
      const pb = CONTRIBUTION_KIND_PRIORITY[b.kind] ?? 50;
      if (pa !== pb) return pa - pb;
      return a.earnedAt < b.earnedAt ? 1 : -1;
    });
  const identity = badges.filter((b) => IDENTITY_BADGE_IDS.has(b.id));
  return [...service, ...milestones, ...contributions, ...identity].slice(
    0,
    limit
  );
}

/**
 * Within the conference-contributions bucket, prioritize the rare
 * keynote/plenary roles ahead of generic talks. Tutorial / Workshop
 * leads are also distinctive enough to outrank a plain Talk badge.
 * Unknown kinds default to mid-pack (50).
 */
const CONTRIBUTION_KIND_PRIORITY: Record<string, number> = {
  Keynote: 1,
  Plenary: 2,
  "Tutorial Lead": 5,
  "Workshop Lead": 6,
  "Panel Chair": 7,
  "BoF Lead": 8,
  Panelist: 12,
  Tutorial: 13,
  Workshop: 14,
  BoF: 15,
  "Lightning Talk": 16,
  Talk: 20,
  Poster: 22,
  Organized: 25,
  Sponsored: 30,
  Volunteered: 35,
};
