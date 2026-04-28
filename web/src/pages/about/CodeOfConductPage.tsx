import { AboutLayout } from "@/components/about/AboutLayout";

const prohibitedBehaviors = [
  "Harassment targeting marginalized groups based on gender, gender identity, sexual orientation, disability, physical appearance, race, ethnicity, caste, religion, or similar characteristics",
  "Unwanted sexual attention, contact, or advances",
  "Non-consensual sharing of sexual or violent content",
  "Deliberate misgendering or use of rejected names",
  "Sustained disruption of community discussions, events, or meetings",
  "Threats of violence, intimidation, or stalking — online or in person",
  "Impersonation of another individual or misrepresentation of affiliation",
  "Incitement of others to engage in any of the above behaviors",
  "Breaching the confidentiality of community members' private information",
];

const reportContents = [
  "Date and location of the incident",
  "Description of what happened",
  "Which part of the Code of Conduct was violated",
  "Individuals involved (including witnesses)",
  "Supporting documentation (screenshots, links, etc.)",
  "Your contact preferences for follow-up",
];

const consequences = [
  { label: "Warning", description: "A formal notice that the behavior is unacceptable" },
  { label: "Privilege Removal", description: "Temporary loss of access to specific community spaces or activities" },
  { label: "Temporary Ban", description: "Suspension from all US-RSE spaces for a defined period" },
  { label: "Permanent Ban", description: "Indefinite removal from all US-RSE spaces and activities" },
  { label: "Membership Revocation", description: "Full removal of US-RSE membership status" },
];

const enforcementCommittee = [
  "Ludovico Bianchi",
  "Suzanne Prentice",
  "J.C. Subida",
];

export function CodeOfConductPage() {
  return (
    <AboutLayout
      title="Code of Conduct"
      subtitle="Our commitment to a safe, respectful, and welcoming community for all."
      prevPage={{ path: "/about/elections", label: "Elections" }}
      nextPage={{
        path: "/about/sponsors",
        label: "Sponsors",
        teaser: "Who supports US-RSE",
      }}
    >
      {/* ── Section 1: Membership Requirements ──────────────────── */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-4">
          <span className="font-mono text-xs text-neutral-300 tracking-wider">01</span>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">
            Membership Requirements
          </h2>
        </div>
        <div className="pl-9">
          <p className="text-neutral-600 leading-relaxed">
            All US-RSE members must be at least 18 years of age, provide their
            full name and email address, and agree to abide by this Code of
            Conduct as a condition of membership.
          </p>
        </div>
      </section>

      {/* ── Section 2: Prohibited Behaviors ─────────────────────── */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-4">
          <span className="font-mono text-xs text-neutral-300 tracking-wider">02</span>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">
            Prohibited Behaviors
          </h2>
        </div>
        <div className="pl-9">
          <p className="text-neutral-500 text-sm mb-6">
            The following behaviors are not tolerated in any US-RSE space,
            including online forums, events, and communications.
          </p>
          <div className="space-y-4">
            {prohibitedBehaviors.map((behavior, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="font-mono text-[11px] text-neutral-300 mt-0.5 shrink-0 tabular-nums w-5 text-right">
                  {String.fromCharCode(97 + i)}.
                </span>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {behavior}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Reporting ─────────────────────────────────── */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-4">
          <span className="font-mono text-xs text-neutral-300 tracking-wider">03</span>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">
            Reporting an Incident
          </h2>
        </div>
        <div className="pl-9">
          <p className="text-neutral-600 leading-relaxed mb-6">
            If you experience or witness a violation, you may report it to the
            Code of Conduct Enforcement Committee via email or by contacting any
            individual committee member directly.
          </p>

          {/* Report CTA */}
          <div className="mb-8 py-6 border-t border-b border-neutral-200">
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
              Report an issue
            </p>
            <a
              href="mailto:coc@us-rse.org"
              className="text-xl font-display font-bold text-purple-700 hover:text-purple-900 transition-colors"
            >
              coc@us-rse.org
            </a>
            <p className="text-sm text-neutral-400 mt-1">
              Or contact any committee member listed below
            </p>
          </div>

          <p className="text-neutral-500 text-sm mb-4">
            When filing a report, please include as much of the following as possible:
          </p>
          <div className="space-y-2.5 mb-6">
            {reportContents.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-neutral-600">
                <span className="text-neutral-300 mt-px">&mdash;</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Response Process ──────────────────────────── */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-4">
          <span className="font-mono text-xs text-neutral-300 tracking-wider">04</span>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">
            Response Process
          </h2>
        </div>
        <div className="pl-9">
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 mb-6">
            <div>
              <p className="font-mono text-xs text-teal-600 tracking-wider mb-1">
                Initial response
              </p>
              <p className="text-2xl font-display font-bold text-neutral-900">
                2 weeks
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-teal-600 tracking-wider mb-1">
                Target resolution
              </p>
              <p className="text-2xl font-display font-bold text-neutral-900">
                60 days
              </p>
            </div>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">
            The Enforcement Committee will acknowledge receipt of a report within
            two weeks and aims to resolve all cases within 60 days. The committee
            may consider behavior occurring outside formal US-RSE spaces when it
            has a direct impact on the safety or well-being of community members.
          </p>
        </div>
      </section>

      {/* ── Section 5: Consequences ──────────────────────────────── */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-4">
          <span className="font-mono text-xs text-neutral-300 tracking-wider">05</span>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">
            Consequences
          </h2>
        </div>
        <div className="pl-9">
          <p className="text-neutral-500 text-sm mb-6">
            Depending on the severity and context of the violation, the committee
            may impose any of the following:
          </p>
          <div className="space-y-4">
            {consequences.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="font-mono text-[11px] text-neutral-300 mt-1 shrink-0 tabular-nums w-5 text-right">
                  {i + 1}.
                </span>
                <div>
                  <span className="text-sm font-semibold text-neutral-900">
                    {item.label}
                  </span>
                  <span className="text-sm text-neutral-400 mx-2">&mdash;</span>
                  <span className="text-sm text-neutral-500">
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Enforcement Committee ─────────────────────── */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-4">
          <span className="font-mono text-xs text-neutral-300 tracking-wider">06</span>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">
            Enforcement Committee
          </h2>
        </div>
        <div className="pl-9">
          <p className="text-neutral-600 leading-relaxed mb-6">
            The committee consists of three members serving terms of up to three
            years. Committee members cannot serve on the Board of Directors
            simultaneously.
          </p>
          <div className="space-y-3">
            {enforcementCommittee.map((member) => (
              <div key={member} className="flex items-baseline gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <p className="font-heading text-base font-semibold text-neutral-900">
                  {member}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full Document Link ───────────────────────────────────── */}
      <div className="py-6 border-t border-neutral-200">
        <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
          Full document
        </p>
        <a
          href="https://github.com/USRSE/documents/blob/master/code-of-conduct.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
        >
          View the complete Code of Conduct on GitHub
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </AboutLayout>
  );
}
