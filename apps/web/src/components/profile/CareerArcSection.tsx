import { SectionFrame, NotYetWritten } from "./SectionFrame";
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
} from "@/hooks/useCurrentMember";

interface CareerArcSectionProps {
  experiences: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  isOwner: boolean;
}

type Entry = {
  kind: "experience" | "education" | "certification";
  key: string;
  sortDate: string;
  yearRange: string;
  title: string;
  org: string;
  description: string | null;
  isCurrent: boolean;
};

const KIND_LABEL: Record<Entry["kind"], string> = {
  experience: "Role",
  education: "Education",
  certification: "Credential",
};

// Mirrors the Governance "How we're organized" dot language:
// purple-filled = primary work (roles), teal-filled = formative (education),
// amber-hollow = lighter weight (credentials). Eyebrow + accent-text follow suit.
const KIND_DOT: Record<Entry["kind"], string> = {
  experience: "border-purple-500 bg-purple-500",
  education: "border-teal-500 bg-teal-500",
  certification: "border-amber-400 bg-white",
};

const KIND_EYEBROW: Record<Entry["kind"], string> = {
  experience: "text-purple-600",
  education: "text-teal-700",
  certification: "text-amber-700",
};

function yearOf(date: string | null): string {
  if (!date) return "";
  if (/^\d{4}$/.test(date)) return date;
  return date.slice(0, 4);
}

function makeEntries(
  experiences: ExperienceItem[],
  education: EducationItem[],
  certifications: CertificationItem[]
): Entry[] {
  const out: Entry[] = [];

  for (const e of experiences) {
    const start = yearOf(e.startDate);
    const end = e.isCurrent ? "Present" : yearOf(e.endDate);
    out.push({
      kind: "experience",
      key: `exp-${e.id}`,
      sortDate: e.startDate,
      yearRange: end ? `${start} — ${end}` : start,
      title: e.title,
      org: e.organization,
      description: e.description,
      isCurrent: e.isCurrent,
    });
  }

  for (const ed of education) {
    const start = ed.startYear ? String(ed.startYear) : "";
    const end =
      ed.endYear && ed.endYear !== 0
        ? String(ed.endYear)
        : ed.startYear
        ? "Present"
        : "";
    const yearRange = start && end ? `${start} — ${end}` : start || end || "";
    const isCurrent = !ed.endYear && !!ed.startYear;
    const title = ed.fieldOfStudy
      ? `${ed.degreeLabel} · ${ed.fieldOfStudy}`
      : ed.degreeLabel;
    out.push({
      kind: "education",
      key: `edu-${ed.id}`,
      sortDate: ed.startYear ? `${ed.startYear}-01-01` : "0000-01-01",
      yearRange,
      title,
      org: ed.institution,
      description: ed.description,
      isCurrent,
    });
  }

  for (const c of certifications) {
    const start = yearOf(c.issueDate);
    const end = yearOf(c.expiryDate);
    out.push({
      kind: "certification",
      key: `cert-${c.id}`,
      sortDate: c.issueDate ?? "0000-01-01",
      yearRange: end ? `${start} — ${end}` : start,
      title: c.name,
      org: c.issuingOrg,
      description: c.credentialUrl
        ? `credential ↗ ${c.credentialUrl}`
        : null,
      isCurrent: false,
    });
  }

  return out.sort((a, b) => (a.sortDate < b.sortDate ? 1 : -1));
}

export function CareerArcSection({
  experiences,
  education,
  certifications,
  isOwner,
}: CareerArcSectionProps) {
  const entries = makeEntries(experiences, education, certifications);

  return (
    <SectionFrame
      number="03"
      eyebrow="Career Arc"
      status={`${entries.length} entries`}
      accent="purple"
      action={
        isOwner ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300">
            ✎ soon
          </span>
        ) : null
      }
    >
      {entries.length === 0 ? (
        <NotYetWritten message="positions, education, and certifications appear here as a chronological timeline" />
      ) : (
        <div className="relative">
          {/* Vertical connector — centered through dots, matches Governance */}
          <div
            aria-hidden="true"
            className="absolute left-[9px] lg:left-[10px] top-5 bottom-5 w-px bg-neutral-200"
          />

          {entries.map((e) => {
            const dot = KIND_DOT[e.kind];
            const eyebrow = KIND_EYEBROW[e.kind];
            return (
              <div
                key={e.key}
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
                    {KIND_LABEL[e.kind]}
                  </p>
                  <span
                    aria-hidden="true"
                    className="text-neutral-300 text-[10px]"
                  >
                    ·
                  </span>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 tabular-nums">
                    {e.yearRange}
                  </p>
                  {e.isCurrent && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-teal-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-soft" />
                      current
                    </span>
                  )}
                </div>

                <p className="font-display text-xl lg:text-2xl font-bold text-neutral-900 mt-1.5 tracking-tight leading-tight text-balance">
                  {e.title}
                </p>
                <p className="text-sm text-neutral-500 mt-1 max-w-xl">
                  {e.org}
                </p>
                {e.description && (
                  <p className="mt-3 text-sm lg:text-[15px] text-neutral-700 leading-relaxed max-w-2xl whitespace-pre-line">
                    {e.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionFrame>
  );
}
