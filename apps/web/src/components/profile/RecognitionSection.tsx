import { SectionFrame, NotYetWritten } from "./SectionFrame";
import { HexStamp } from "./HexStamp";
import type { BadgeItem } from "@/hooks/useCurrentMember";

interface RecognitionSectionProps {
  badges: BadgeItem[];
  isOwner: boolean;
}

export function RecognitionSection({
  badges,
  isOwner,
}: RecognitionSectionProps) {
  const milestones = badges.filter((b) => b.tier === "milestone");
  const conferences = badges.filter((b) => b.tier === "conference");
  const service = badges.filter((b) => b.tier === "service");

  // Newest milestone first (Five-Peat reads more impressive than Three-Peat
  // sitting next to it). Conferences flow oldest → newest so the row reads
  // left-to-right as a journey, mirroring the conference timeline above.
  const sortedMilestones = [...milestones].sort((a, b) =>
    a.earnedAt < b.earnedAt ? 1 : -1
  );
  const sortedConferences = [...conferences].sort((a, b) =>
    a.earnedAt < b.earnedAt ? -1 : 1
  );

  const total = badges.length;

  return (
    <SectionFrame
      id="recognition"
      number="04"
      eyebrow="Recognition"
      status={total === 0 ? "no badges yet" : `${total} earned`}
      accent="amber"
      action={
        isOwner ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300">
            ✎ auto
          </span>
        ) : null
      }
    >
      {total === 0 ? (
        <NotYetWritten message="badges appear here as conferences attended, milestones reached, and service rendered" />
      ) : (
        <div className="space-y-12 lg:space-y-14">
          {service.length > 0 && (
            <BadgeGroup label="04.a · Service" badges={service} />
          )}
          {sortedMilestones.length > 0 && (
            <BadgeGroup label="04.b · Milestones" badges={sortedMilestones} />
          )}
          {sortedConferences.length > 0 && (
            <BadgeGroup
              label="04.c · Conferences"
              badges={sortedConferences}
            />
          )}
        </div>
      )}
    </SectionFrame>
  );
}

function BadgeGroup({
  label,
  badges,
}: {
  label: string;
  badges: BadgeItem[];
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-6">
        {label}
      </p>
      {/* Honeycomb-ish grid: dense on desktop, generous gaps on mobile.
          Auto-fit ensures the row fills cleanly regardless of badge count. */}
      <div
        className="grid gap-x-4 gap-y-8"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))",
        }}
      >
        {badges.map((b) => (
          <HexStamp key={b.id} badge={b} size="md" />
        ))}
      </div>
    </div>
  );
}
