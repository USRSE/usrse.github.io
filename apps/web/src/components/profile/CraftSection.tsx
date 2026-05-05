import { SectionFrame, NotYetWritten } from "./SectionFrame";
import type { CertificationItem } from "@/hooks/useCurrentMember";

interface CraftSectionProps {
  skills: { name: string }[];
  disciplines: { name: string }[];
  certifications: CertificationItem[];
  isOwner: boolean;
}

// Unified chip DNA across all Craft sub-sections so the eyebrow
// (05.a, 05.b, 05.c) does the categorical labeling instead of three
// chip vocabularies competing for attention. Resting state is shared;
// hover lifts to a sub-section accent so the page's dot-language
// (teal / purple / amber) stays alive without shouting at rest.
type ChipAccent = "teal" | "purple" | "amber";

const CHIP_HOVER: Record<ChipAccent, string> = {
  teal: "hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50/40",
  purple:
    "hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50/40",
  amber:
    "hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/40",
};

function chipClass(accent: ChipAccent): string {
  return `font-mono text-[11px] px-2.5 py-1 rounded-[2px] bg-white border border-neutral-200 text-neutral-700 transition-colors cursor-default ${CHIP_HOVER[accent]}`;
}

export function CraftSection({
  skills,
  disciplines,
  certifications,
  isOwner,
}: CraftSectionProps) {
  const hasAny =
    skills.length || disciplines.length || certifications.length;

  return (
    <SectionFrame
      number="05"
      eyebrow="Craft"
      status="disciplines · languages · skills · credentials"
      accent="teal"
      action={
        isOwner ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300">
            ✎ soon
          </span>
        ) : null
      }
    >
      {!hasAny ? (
        <NotYetWritten message="disciplines, languages, skills, and credentials appear here once added" />
      ) : (
        <div className="space-y-12 lg:space-y-14">
          {/* 05.a · Disciplines */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
              05.a · Disciplines
            </p>
            {disciplines.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {disciplines.map((d) => (
                  <li key={d.name} className={chipClass("teal")}>
                    {d.name}
                  </li>
                ))}
              </ul>
            ) : (
              <NotYetWritten message="research areas appear here once added to your profile" />
            )}
          </div>

          {/* 05.b · Languages — structural stub. The backend doesn't
              carry a language vocabulary yet (skills + disciplines
              are the only vocab tables in vocab.ts), so this row
              renders the placeholder unconditionally for now. When
              the data lands it slots in alongside the other chips
              with no layout change. */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
              05.b · Languages
            </p>
            <NotYetWritten message="programming languages appear here once added to your profile" />
          </div>

          {/* 05.c · Skills */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
              05.c · Skills
            </p>
            {skills.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <li key={s.name} className={chipClass("amber")}>
                    {s.name}
                  </li>
                ))}
              </ul>
            ) : (
              <NotYetWritten message="tools, frameworks, and methods appear here once added to your profile" />
            )}
          </div>

          {/* 05.d · Credentials */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
              05.d · Credentials
            </p>
            {certifications.length > 0 ? (
              <ul className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden">
                {certifications.map((c) => (
                  <li
                    key={c.id}
                    className="grid grid-cols-1 sm:grid-cols-[6rem_1fr_auto] gap-3 px-5 py-4 hover:bg-neutral-50 transition-colors"
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 self-center">
                      {c.issueDate ? c.issueDate.slice(0, 4) : "—"}
                    </span>
                    <span className="self-center">
                      <span className="font-display text-base font-semibold text-neutral-900">
                        {c.name}
                      </span>
                      <span className="text-neutral-500"> · {c.issuingOrg}</span>
                    </span>
                    {c.credentialUrl && (
                      <a
                        href={c.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-center inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800"
                      >
                        credential
                        <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <NotYetWritten message="certifications and licenses appear here once issued" />
            )}
          </div>
        </div>
      )}
    </SectionFrame>
  );
}
