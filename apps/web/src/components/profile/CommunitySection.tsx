import { SectionFrame, NotYetWritten } from "./SectionFrame";
import type { ConferenceItem } from "@/hooks/useCurrentMember";

interface CommunitySectionProps {
  conferences: ConferenceItem[];
}

const ROLE_LABEL: Record<string, string> = {
  attendee: "Attended",
  speaker: "Talk",
  organizer: "Organized",
  sponsor: "Sponsored",
  volunteer: "Volunteered",
};

/**
 * Resolves a conference row to a human label, branching speaker into
 * "Talk" vs "Poster" by reading the free-text notes — same logic the
 * badge system uses, just here for the timeline.
 */
function resolveTimelineLabel(role: string, notes: string | null): string {
  if (role === "speaker") {
    if (notes && /poster/i.test(notes)) return "Poster";
    return "Talk";
  }
  return ROLE_LABEL[role] ?? role;
}

// Dot language matches Governance: filled = active contribution,
// hollow = passive attendance. Eyebrow color pairs with the dot.
const ROLE_DOT: Record<string, string> = {
  attendee: "border-neutral-300 bg-white",
  speaker: "border-purple-500 bg-purple-500",
  organizer: "border-teal-500 bg-teal-500",
  sponsor: "border-amber-500 bg-amber-500",
  volunteer: "border-rose-500 bg-rose-500",
};

const ROLE_EYEBROW: Record<string, string> = {
  attendee: "text-neutral-500",
  speaker: "text-purple-600",
  organizer: "text-teal-700",
  sponsor: "text-amber-700",
  volunteer: "text-rose-700",
};

export function CommunitySection({ conferences }: CommunitySectionProps) {
  return (
    <SectionFrame
      number="06"
      eyebrow="Community"
      status="conferences · groups · service"
      accent="purple"
    >
      <div className="space-y-14 lg:space-y-16">
        {/* 06.a · Conferences — vertical timeline */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
            06.a · Conferences
          </p>
          {conferences.length === 0 ? (
            <NotYetWritten message="conference attendance appears here as a chronological timeline" />
          ) : (
            <ConferenceTimeline conferences={conferences} />
          )}
        </div>

        {/* 06.b · Groups */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
            06.b · Groups
          </p>
          <NotYetWritten message="working, affinity, and regional groups appear here once joined" />
        </div>

        {/* 06.c · Service */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
            06.c · Service
          </p>
          <NotYetWritten message="board, executive, and committee terms appear here as a service record" />
        </div>
      </div>
    </SectionFrame>
  );
}

function ConferenceTimeline({ conferences }: { conferences: ConferenceItem[] }) {
  // Same dedup rule the badge system uses: when a contribution role
  // exists for an event, suppress the implicit attendance row for
  // that event. Contribution roles still stack — a year with both a
  // Talk and an Organized role gets two rail entries.
  const eventsWithContribution = new Set(
    conferences.filter((c) => c.role !== "attendee").map((c) => c.eventId)
  );
  const visible = conferences.filter(
    (c) => !(c.role === "attendee" && eventsWithContribution.has(c.eventId))
  );
  // Most recent first — matches the Career Arc above so both rails read top-down.
  const sorted = [...visible].sort((a, b) =>
    a.startDate < b.startDate ? 1 : -1
  );

  return (
    <div className="relative">
      {/* Vertical connector */}
      <div
        aria-hidden="true"
        className="absolute left-[9px] lg:left-[10px] top-5 bottom-5 w-px bg-neutral-200"
      />

      {sorted.map((c) => {
        const year = c.startDate.slice(0, 4);
        const yy = year.slice(2);
        const dot = ROLE_DOT[c.role] ?? ROLE_DOT.attendee;
        const eyebrow = ROLE_EYEBROW[c.role] ?? ROLE_EYEBROW.attendee;
        const roleLabel = resolveTimelineLabel(c.role, c.notes);

        return (
          <div
            key={`${c.eventId}-${c.role}-${c.notes ?? ""}`}
            className="relative pb-10 lg:pb-12 pl-[30px] lg:pl-8 last:pb-0"
          >
            <div
              aria-hidden="true"
              className={`absolute left-0 top-2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border-2 z-10 ${dot}`}
            />

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p
                className={`font-mono text-[11px] uppercase tracking-wider ${eyebrow}`}
              >
                {roleLabel}
              </p>
              <span
                aria-hidden="true"
                className="text-neutral-300 text-[10px]"
              >
                ·
              </span>
              <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 tabular-nums">
                USRSE&rsquo;{yy}
              </p>
            </div>

            <p className="font-display text-xl lg:text-2xl font-bold text-neutral-900 mt-1.5 tracking-tight leading-tight tabular-nums">
              {year}
            </p>
            {c.location && (
              <p className="text-sm text-neutral-500 mt-1 max-w-xl">
                {c.location}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
