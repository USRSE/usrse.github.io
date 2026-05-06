import { Link } from "react-router-dom";
import { formatMemberId } from "@/lib/member-id";
import type { MemberSearchResult } from "@/hooks/useMemberSearch";

/**
 * Result row for the member directory. Designed as an editorial
 * archive entry rather than a card-grid tile — leans on horizontal
 * rules, mono index marks, and tight typographic hierarchy so a
 * scrolling list reads as a documented index, not a CRM grid.
 *
 * Two variants share the same shell so listed-private rows visually
 * line up with public rows but are stripped of fields the member
 * hasn't opted to surface.
 */
export interface MemberCardProps {
  member: MemberSearchResult;
  /** 1-indexed position in the result stream — printed as the mono "01"-style index mark. */
  index: number;
}

export function MemberCard({ member, index }: MemberCardProps) {
  if (member.kind === "private") {
    return <PrivateRow member={member} index={index} />;
  }
  return <PublicRow member={member} index={index} />;
}

function PublicRow({
  member,
  index,
}: {
  member: Extract<MemberSearchResult, { kind: "public" }>;
  index: number;
}) {
  const initials = initialsFor(member.displayName);
  const placeLine = [member.publicLocation, member.countryName]
    .filter(Boolean)
    .join(" · ");
  const subtitleParts = [member.jobTitle, member.institutionName].filter(
    (p): p is string => Boolean(p && p.trim())
  );

  return (
    <Link
      to={`/members/${member.slug}`}
      className="group relative block border-t border-neutral-200 transition-colors hover:bg-neutral-50/60 focus-visible:bg-neutral-50/60 focus-visible:outline-none"
    >
      {/* Hover indicator — a teal hairline that slides in from the
          left edge. Replaces the usual hover-shadow, fits the
          archival aesthetic better. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-teal-500 origin-top scale-y-0 transition-transform duration-300 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
      />

      <div className="grid grid-cols-12 gap-4 lg:gap-6 px-2 py-6 lg:py-7 transition-transform duration-300 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1">
        {/* Index mark + portrait */}
        <div className="col-span-3 sm:col-span-2 flex items-start gap-3 lg:gap-4">
          <span
            aria-hidden="true"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 pt-1 lg:pt-2 tabular-nums"
          >
            {String(index).padStart(2, "0")}
          </span>
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt=""
              loading="lazy"
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover bg-neutral-100 ring-1 ring-neutral-200"
            />
          ) : (
            <InitialsHex initials={initials} />
          )}
        </div>

        {/* Identity column */}
        <div className="col-span-9 sm:col-span-7 min-w-0">
          <h3 className="font-display text-xl lg:text-2xl font-semibold text-neutral-900 leading-tight tracking-tight text-balance">
            {member.displayName}
          </h3>
          {subtitleParts.length > 0 && (
            <p className="mt-1.5 text-sm lg:text-base text-neutral-600 leading-snug">
              {subtitleParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < subtitleParts.length - 1 && (
                    <span className="mx-2 text-neutral-300">·</span>
                  )}
                </span>
              ))}
            </p>
          )}
          {member.disciplines.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {member.disciplines.slice(0, 3).map((d) => (
                <li
                  key={d.slug}
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600 group-hover:border-purple-200 group-hover:text-purple-700 transition-colors"
                >
                  {d.name}
                </li>
              ))}
              {member.disciplines.length > 3 && (
                <li className="font-mono text-[10px] px-2 py-0.5 text-neutral-400">
                  +{member.disciplines.length - 3}
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Meta column — place + member id eyebrow, right-aligned on
            wider viewports, hidden under sm to keep the row tight. */}
        <div className="hidden sm:flex sm:col-span-3 flex-col items-end justify-start text-right gap-1.5">
          {placeLine && (
            <p className="text-sm text-neutral-700 leading-snug">{placeLine}</p>
          )}
          {member.careerStageLabel && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
              {member.careerStageLabel}
            </p>
          )}
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300 mt-auto pt-2">
            {formatMemberId(member.memberId)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function PrivateRow({
  member,
  index,
}: {
  member: Extract<MemberSearchResult, { kind: "private" }>;
  index: number;
}) {
  return (
    <Link
      to={`/members/${member.slug}`}
      className="group relative block border-t border-neutral-200 transition-colors hover:bg-neutral-50/60 focus-visible:bg-neutral-50/60 focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-purple-500 origin-top scale-y-0 transition-transform duration-300 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
      />

      <div className="grid grid-cols-12 gap-4 lg:gap-6 px-2 py-6 lg:py-7 transition-transform duration-300 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1">
        <div className="col-span-3 sm:col-span-2 flex items-start gap-3 lg:gap-4">
          <span
            aria-hidden="true"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 pt-1 lg:pt-2 tabular-nums"
          >
            {String(index).padStart(2, "0")}
          </span>
          <PrivateHex />
        </div>

        <div className="col-span-9 sm:col-span-7 min-w-0">
          <h3 className="font-display text-xl lg:text-2xl font-semibold text-neutral-900 leading-tight tracking-tight text-balance">
            {member.displayName}
          </h3>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-purple-600">
            Private profile
          </p>
        </div>

        <div className="hidden sm:flex sm:col-span-3 flex-col items-end justify-start text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300">
            {formatMemberId(member.memberId)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function InitialsHex({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block w-12 h-12 lg:w-14 lg:h-14 shrink-0"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        <path
          d="M 50 4 L 92 27 L 92 73 L 50 96 L 8 73 L 8 27 Z"
          fill="#F5F4F8"
          stroke="#E5E2EC"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="32"
          fontWeight={600}
          fill="#7B5FBF"
          letterSpacing={1}
        >
          {initials}
        </text>
      </svg>
    </span>
  );
}

function PrivateHex() {
  // Empty hex outline — quietly distinct from filled portrait hexes,
  // signals "person exists, content withheld" without shouting.
  return (
    <span
      aria-hidden="true"
      className="relative inline-block w-12 h-12 lg:w-14 lg:h-14 shrink-0"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        <path
          d="M 50 4 L 92 27 L 92 73 L 50 96 L 8 73 L 8 27 Z"
          fill="white"
          stroke="#D8D4E5"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function initialsFor(displayName: string): string {
  const source = displayName.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
