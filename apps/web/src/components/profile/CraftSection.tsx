import { SectionFrame, NotYetWritten } from "./SectionFrame";
import type { CertificationItem } from "@/hooks/useCurrentMember";

interface CraftSectionProps {
  skills: { name: string }[];
  disciplines: { name: string }[];
  certifications: CertificationItem[];
  isOwner: boolean;
}

export function CraftSection({
  skills,
  disciplines,
  certifications,
  isOwner,
}: CraftSectionProps) {
  const hasAny = skills.length || disciplines.length || certifications.length;

  return (
    <SectionFrame
      number="05"
      eyebrow="Craft"
      status="skills · disciplines · credentials"
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
        <NotYetWritten message="skills, disciplines, and credentials appear here once added" />
      ) : (
        <div className="space-y-12 lg:space-y-14">
          {disciplines.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
                05.a · Disciplines
              </p>
              <ul className="flex flex-wrap gap-2">
                {disciplines.map((d) => (
                  <li
                    key={d.name}
                    className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:border-purple-300 hover:text-purple-700 transition-colors cursor-default"
                  >
                    {d.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
                05.b · Skills
              </p>
              <ul className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <li
                    key={s.name}
                    className="px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium hover:bg-teal-100 transition-colors cursor-default"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
                05.c · Credentials
              </p>
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
            </div>
          )}
        </div>
      )}
    </SectionFrame>
  );
}
