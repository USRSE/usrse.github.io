import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

const prohibitedBehaviors = [
  "Harassment targeting marginalized groups based on gender, gender identity, sexual orientation, disability, physical appearance, race, ethnicity, caste, religion, or similar characteristics.",
  "Unwanted sexual attention, contact, or advances.",
  "Non-consensual sharing of sexual or violent content.",
  "Deliberate misgendering or use of rejected names.",
  "Sustained disruption of community discussions, events, or meetings.",
  "Threats of violence, intimidation, or stalking — online or in person.",
  "Impersonation of another individual or misrepresentation of affiliation.",
  "Incitement of others to engage in any of the above behaviors.",
  "Breaching the confidentiality of community members' private information.",
];

const reportContents = [
  "Date and location of the incident",
  "Description of what happened",
  "Which part of the Code of Conduct was violated",
  "Individuals involved (including witnesses)",
  "Supporting documentation (screenshots, links, etc.)",
  "Your contact preferences for follow-up",
];

interface ResponseStage {
  num: string;
  window: string;
  title: string;
  detail: string;
}

const responseStages: ResponseStage[] = [
  {
    num: "01",
    window: "Within 2 weeks",
    title: "Acknowledge",
    detail: "The committee confirms receipt of your report and outlines what happens next.",
  },
  {
    num: "02",
    window: "Rolling",
    title: "Investigate",
    detail: "The committee reviews the incident and speaks with the parties involved and any witnesses.",
  },
  {
    num: "03",
    window: "Within 60 days",
    title: "Resolve",
    detail: "The committee communicates a decision and, when appropriate, imposes consequences.",
  },
];

interface Consequence {
  num: string;
  severity: string;
  title: string;
  description: string;
  borderColor: string;
  severityColor: string;
}

const consequences: Consequence[] = [
  {
    num: "01",
    severity: "Mild",
    title: "Warning",
    description: "A formal notice that the behavior is unacceptable.",
    borderColor: "border-teal-500",
    severityColor: "text-teal-700",
  },
  {
    num: "02",
    severity: "Moderate",
    title: "Privilege removal",
    description: "Temporary loss of access to specific community spaces or activities.",
    borderColor: "border-teal-700",
    severityColor: "text-teal-800",
  },
  {
    num: "03",
    severity: "Serious",
    title: "Temporary ban",
    description: "Suspension from all US-RSE spaces for a defined period.",
    borderColor: "border-purple-500",
    severityColor: "text-purple-600",
  },
  {
    num: "04",
    severity: "Severe",
    title: "Permanent ban",
    description: "Indefinite removal from all US-RSE spaces and activities.",
    borderColor: "border-purple-700",
    severityColor: "text-purple-800",
  },
  {
    num: "05",
    severity: "Terminal",
    title: "Membership revocation",
    description: "Full removal of US-RSE membership status.",
    borderColor: "border-neutral-900",
    severityColor: "text-neutral-900",
  },
];

interface CommitteeMember {
  name: string;
  photo: string;
}

const committee: CommitteeMember[] = [
  {
    name: "Ludovico Bianchi",
    photo: "/images/code-of-conduct/ludovico-bianchi.jpeg",
  },
  {
    name: "Suzanne Prentice",
    photo: "/images/code-of-conduct/suzanne-prentice.jpeg",
  },
  {
    name: "J.C. Subida",
    photo: "/images/code-of-conduct/jc-subida.jpeg",
  },
];

const behaviorAccent = {
  teal: "text-teal-600",
  purple: "text-purple-500",
};

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Values",
    title: "DEI Statement",
    teaser: "The commitments that inform every standard here.",
    path: "/about/dei",
  },
  {
    eyebrow: "Belonging",
    title: "Affinity Groups",
    teaser: "Communities within the community, where you'll find support.",
    path: "/community/affinity-groups",
  },
  {
    eyebrow: "Accountability",
    title: "Governance",
    teaser: "How enforcement stays independent of leadership.",
    path: "/about/governance",
  },
  {
    eyebrow: "Support",
    title: "Community Funds",
    teaser: "Travel support and financial access for members.",
    path: "/community/funds",
  },
];

export function CodeOfConductPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: reportRef, isInView: reportInView } = useInView(0.1);
  const { ref: prohibitedRef, isInView: prohibitedInView } = useInView(0.05);
  const { ref: responseRef, isInView: responseInView } = useInView(0.1);
  const { ref: consequencesRef, isInView: consequencesInView } = useInView(0.05);
  const { ref: committeeRef, isInView: committeeInView } = useInView(0.1);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

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
      {/* ── The stance — manifesto + framing ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-20 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          A shared standard
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          You belong here. We act to keep it that way.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl mb-5">
          Every US-RSE member agrees to uphold this Code as a condition of
          membership &mdash; members must be at least 18 years of age and
          provide their full name and email address. But this page isn&rsquo;t
          about the paperwork. It&rsquo;s about what a community owes the
          people in it.
        </p>
      </section>

      {/* ── Report an incident — SURFACED near top ──────────────── */}
      <section
        ref={reportRef}
        className={`mb-20 ${reportInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
            Need to report something?
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Tell us. We&rsquo;ll act.
        </h2>
        <p className="text-neutral-600 leading-relaxed max-w-2xl mb-8">
          If you&rsquo;ve experienced or witnessed a violation, the
          Enforcement Committee wants to hear from you. Email the committee
          directly, or contact any individual member listed below.
        </p>

        {/* Primary report CTA */}
        <div className="py-8 border-t-2 border-b-2 border-purple-500 mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
            Report an issue
          </p>
          <a
            href="mailto:coc@us-rse.org"
            className="group inline-flex items-center gap-3 font-display text-3xl lg:text-4xl font-bold text-purple-700 hover:text-purple-900 tracking-tight transition-colors"
          >
            coc@us-rse.org
            <svg
              className="w-6 h-6 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <p className="text-sm text-neutral-500 mt-2">
            Or email any committee member directly &mdash; see below.
          </p>
        </div>

        {/* Reassurance strip — "we're on your side" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 mb-10">
          {[
            {
              label: "Your privacy",
              text: "Reports are confidential. Only committee members see them.",
            },
            {
              label: "Response window",
              text: "You&rsquo;ll hear back from the committee within two weeks.",
            },
            {
              label: "Anti-retaliation",
              text: "Retaliation against reporters is itself a Code violation.",
            },
          ].map((r) => (
            <div key={r.label} className="bg-teal-50/50 p-5 md:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-2">
                {r.label}
              </p>
              <p
                className="text-sm text-neutral-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: r.text }}
              />
            </div>
          ))}
        </div>

        {/* What to include in a report */}
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
            What to include in your report
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
            {reportContents.map((item, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr] gap-3 items-baseline text-sm text-neutral-700"
              >
                <span className="font-mono text-[11px] text-purple-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── What's not tolerated — 9 behaviors in 2-col grid ────── */}
      <section ref={prohibitedRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            The line
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          What&rsquo;s not tolerated.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          These behaviors are unacceptable in any US-RSE space &mdash; online
          forums, events, or communications.
        </p>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
          {prohibitedBehaviors.map((behavior, i) => {
            const accent =
              i % 2 === 0 ? behaviorAccent.teal : behaviorAccent.purple;
            return (
              <li
                key={i}
                className={`grid grid-cols-[auto_1fr] gap-4 items-baseline ${
                  prohibitedInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                <span
                  className={`font-display text-xl font-black tracking-tight tabular-nums ${accent}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {behavior}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── How we respond — full-bleed 3-stage panel ───────────── */}
      <section
        ref={responseRef}
        className="mb-20 py-16 border-y-2 border-neutral-900 bg-teal-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className={responseInView ? "animate-slide-up" : "opacity-0"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
            How we respond
          </p>
          <h2 className="font-display text-3xl lg:text-[2.25rem] font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4 text-balance">
            Acknowledged in 2 weeks. Resolved in 60 days.
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed max-w-3xl mb-10">
            The committee follows a clear three-stage process and commits to
            real timelines &mdash; because accountability only works if it
            happens on a schedule you can hold us to.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 mb-6">
            {responseStages.map((s) => (
              <div key={s.num} className="bg-white p-6 md:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-3">
                  Stage {s.num}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-teal-700 mb-2">
                  {s.window}
                </p>
                <h3 className="font-display text-2xl font-bold text-neutral-900 tracking-tight mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {s.detail}
                </p>
              </div>
            ))}
          </div>

          <p className="text-sm text-neutral-600 leading-relaxed max-w-3xl">
            The committee may consider behavior occurring outside formal
            US-RSE spaces when it has a direct impact on the safety or
            well-being of community members.
          </p>
        </div>
      </section>

      {/* ── Consequences — graduated severity ladder ────────────── */}
      <section ref={consequencesRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            The response
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          What follows a violation.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          Depending on the severity and context of a violation, the committee
          may impose any of the following &mdash; escalating from formal
          notice to full revocation.
        </p>

        <ol className="space-y-3">
          {consequences.map((c, i) => (
            <li
              key={c.num}
              className={`bg-white border-l-4 ${c.borderColor} pl-6 py-5 pr-6 rounded-r-lg shadow-[0_1px_0_0_var(--color-neutral-100)] ${
                consequencesInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 items-baseline">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 tabular-nums mb-1">
                    Level {c.num}
                  </p>
                  <p
                    className={`font-mono text-[11px] uppercase tracking-wider ${c.severityColor}`}
                  >
                    {c.severity}
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-neutral-900 tracking-tight mb-1">
                    {c.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {c.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── The Enforcement Committee ───────────────────────────── */}
      <section ref={committeeRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Who reads your report
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          The three-member Enforcement Committee.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          Committee members serve terms of up to three years. They cannot
          serve on the Board of Directors simultaneously &mdash; keeping
          enforcement independent of leadership.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
          {committee.map((m, i) => (
            <div
              key={m.name}
              className={`group bg-white p-6 md:p-7 border-t-2 border-purple-500 ${
                committeeInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="relative overflow-hidden rounded-xl mb-5 aspect-square bg-neutral-100">
                <img
                  src={m.photo}
                  alt={m.name}
                  className="absolute inset-0 w-full h-full object-cover object-top grayscale-[25%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
                  loading="lazy"
                />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-600 mb-2">
                Enforcement Committee
              </p>
              <p className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight mb-4">
                {m.name}
              </p>
              <a
                href="mailto:coc@us-rse.org"
                className="inline-flex items-center gap-1.5 font-mono text-[12px] text-purple-700 hover:text-purple-900 transition-colors"
              >
                coc@us-rse.org
                <svg
                  className="w-3 h-3 transition-transform hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-neutral-400 font-mono">
          Full document on GitHub:{" "}
          <a
            href="https://github.com/USRSE/documents/blob/master/code-of-conduct.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 transition-colors"
          >
            USRSE/documents/code-of-conduct.md
          </a>
        </p>
      </section>

      {/* ── Continue exploring — bridge cards ───────────────────── */}
      <section
        ref={bridgeRef}
        className="mb-4 pt-12 border-t-2 border-neutral-900"
      >
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Continue exploring
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-10">
          You&rsquo;re not alone.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {bridges.map((b, i) => (
            <Link
              key={b.path}
              to={b.path}
              className={`group bg-white p-6 md:p-7 flex items-center gap-5 hover:bg-neutral-50 transition-colors ${
                bridgeInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-1.5">
                  {b.eyebrow}
                </p>
                <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1 group-hover:text-purple-700 transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-neutral-500">{b.teaser}</p>
              </div>
              <svg
                className="w-5 h-5 text-neutral-400 group-hover:text-purple-700 transition-all group-hover:translate-x-1 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </AboutLayout>
  );
}
