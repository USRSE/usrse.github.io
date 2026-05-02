import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

interface Tier {
  name: string;
  sponsors: string[];
  titleSize: string;
  titleWeight: string;
}

const conferenceTiers: Tier[] = [
  {
    name: "Platinum",
    sponsors: [
      "University of Illinois Urbana-Champaign",
      "Princeton University",
      "SHI",
      "Dell Technologies",
      "Schmidt Sciences",
    ],
    titleSize: "text-2xl lg:text-3xl",
    titleWeight: "font-bold text-neutral-800",
  },
  {
    name: "Gold",
    sponsors: ["Globus", "Los Alamos National Laboratory", "IBM", "HPE / AMD"],
    titleSize: "text-lg lg:text-xl",
    titleWeight: "font-semibold text-neutral-700",
  },
  {
    name: "Travel Support",
    sponsors: ["Sustainable Horizons Institute", "Schmidt Sciences"],
    titleSize: "text-base",
    titleWeight: "font-medium text-neutral-600",
  },
];

type Accent = "purple" | "teal" | "neutral";

interface SponsorPathway {
  num: string;
  eyebrow: string;
  title: string;
  lead: string;
  funds: string[];
  ctaLabel: string;
  ctaHref: string;
  accent: Accent;
}

const sponsorPathways: SponsorPathway[] = [
  {
    num: "01",
    eyebrow: "For individuals",
    title: "Make a gift",
    lead: "Tax-deductible donations through our fiscal sponsor, Community Initiatives. Every gift — at any level — compounds directly into programs and scholarships.",
    funds: [
      "Student & early-career travel scholarships",
      "Community calls and working-group infrastructure",
      "Newsletter, website, and member resources",
    ],
    ctaLabel: "Give today",
    ctaHref: "mailto:info@us-rse.org?subject=Individual%20gift%20to%20US-RSE",
    accent: "purple",
  },
  {
    num: "02",
    eyebrow: "For organizations",
    title: "Become a year-round partner",
    lead: "For universities, national labs, and companies who want to support the profession across the full calendar — not just at the conference.",
    funds: [
      "Year-round community programs",
      "Staff time and governance",
      "Eleven active working groups",
    ],
    ctaLabel: "Start the conversation",
    ctaHref: "mailto:info@us-rse.org?subject=Organization%20partnership%20with%20US-RSE",
    accent: "teal",
  },
  {
    num: "03",
    eyebrow: "For USRSE'26",
    title: "Sponsor the conference",
    lead: "Platinum, Gold, and Travel-Support tiers available for our annual conference — Oct 19–21, 2026. Request the prospectus for tier benefits.",
    funds: [
      "Keynote and plenary programming",
      "Workshops, mentoring, and BoF sessions",
      "Travel grants for students and underrepresented groups",
    ],
    ctaLabel: "Request the prospectus",
    ctaHref: "mailto:info@us-rse.org?subject=USRSE%2726%20sponsorship%20prospectus",
    accent: "neutral",
  },
];

const accentStyles: Record<
  Accent,
  { border: string; num: string; arrow: string; hoverText: string }
> = {
  purple: {
    border: "border-purple-500",
    num: "text-purple-500",
    arrow: "text-purple-500",
    hoverText: "group-hover:text-purple-700",
  },
  teal: {
    border: "border-teal-500",
    num: "text-teal-600",
    arrow: "text-teal-600",
    hoverText: "group-hover:text-teal-700",
  },
  neutral: {
    border: "border-neutral-900",
    num: "text-neutral-900",
    arrow: "text-neutral-700",
    hoverText: "group-hover:text-neutral-900",
  },
};

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Purpose",
    title: "Our Mission",
    teaser: "What US-RSE stands for and works toward.",
    path: "/about/mission",
  },
  {
    eyebrow: "Accountability",
    title: "Financial Status",
    teaser: "Where the money comes from and where it goes.",
    path: "/about/financial-status",
  },
  {
    eyebrow: "Framework",
    title: "Governance",
    teaser: "The structure that stewards every sponsor gift.",
    path: "/about/governance",
  },
  {
    eyebrow: "Values",
    title: "DEI Statement",
    teaser: "The commitments shaping how funds are deployed.",
    path: "/about/dei",
  },
];

export function SponsorsPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: primaryRef, isInView: primaryInView } = useInView(0.1);
  const { ref: tiersRef, isInView: tiersInView } = useInView(0.05);
  const { ref: individualRef, isInView: individualInView } = useInView(0.1);
  const { ref: pathwaysRef, isInView: pathwaysInView } = useInView(0.05);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <AboutLayout
      title="Sponsors"
      subtitle="The organizations and individuals who make our mission possible."
      prevPage={{ path: "/about/code-of-conduct", label: "Code of Conduct" }}
      nextPage={{
        path: "/about/staff",
        label: "Staff",
        teaser: "The team behind the community",
      }}
    >
      {/* ── The stance — manifesto + framing ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-20 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          The people who make it possible
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          Every program, every conference, every travel grant &mdash; someone
          made it possible.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          US-RSE is sustained through a mix of grant funding, institutional
          sponsorships, and individual gifts &mdash; all stewarded through a
          501(c)(3) fiscal structure. What&rsquo;s below is a record of who
          built the foundation.
        </p>
      </section>

      {/* ── Primary funder — Sloan ───────────────────────────────── */}
      <section
        ref={primaryRef}
        className={`mb-20 pt-12 border-t border-neutral-200 ${
          primaryInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-3">
          Primary grant funder
        </p>
        <h2 className="font-display text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-4 text-balance">
          Alfred P. Sloan Foundation
        </h2>
        <p className="text-neutral-600 leading-relaxed max-w-2xl">
          The Alfred P. Sloan Foundation has been the primary funder of
          US-RSE, providing the grant support that enabled the organization
          to grow from a grassroots initiative into a thriving professional
          community with dedicated staff, annual conferences, and sustained
          programs.
        </p>
      </section>

      {/* ── Conference sponsors — tiered ─────────────────────────── */}
      <section ref={tiersRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Conference sponsors
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-purple-600 tracking-wider">
            USRSE&rsquo;25
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          The organizations behind the conference.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Eleven institutions underwrote USRSE&rsquo;25 across three tiers,
          funding keynotes, workshops, and travel grants.
        </p>

        <div className="space-y-12">
          {conferenceTiers.map((tier, i) => (
            <div
              key={tier.name}
              className={`${tiersInView ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-baseline gap-3 mb-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal-700">
                  {tier.name}
                </p>
                <span className="flex-1 h-px bg-neutral-100" aria-hidden="true" />
                <span className="font-mono text-[10px] text-neutral-400 tabular-nums">
                  {tier.sponsors.length.toString().padStart(2, "0")}
                </span>
              </div>
              <div className="space-y-1.5">
                {tier.sponsors.map((name) => (
                  <p
                    key={name}
                    className={`font-display ${tier.titleSize} ${tier.titleWeight} tracking-tight leading-tight`}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Individual giving + fiscal mechanism ─────────────────── */}
      <section ref={individualRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Individual giving
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Hundreds of smaller gifts, stewarded through a 501(c)(3).
        </h2>
        <p className="text-neutral-600 leading-relaxed max-w-2xl mb-10">
          We gratefully acknowledge the many individuals who have contributed
          personal donations to support US-RSE&rsquo;s programs, events, and
          community infrastructure. Every contribution, regardless of size,
          strengthens the RSE movement.
        </p>

        {/* Fiscal mechanism — elevated callout */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200 ${
            individualInView ? "animate-slide-up" : "opacity-0"
          }`}
          style={{ animationDelay: "150ms" }}
        >
          <div className="bg-teal-50/50 p-6 md:p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-2">
              Tax-deductible
            </p>
            <p className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1.5">
              Your gift is deductible in the US.
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Because we operate under a 501(c)(3) fiscal sponsor, donations
              qualify for the standard charitable deduction.
            </p>
          </div>
          <div className="bg-white p-6 md:p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-2">
              Fiscal sponsor
            </p>
            <p className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1.5">
              Community Initiatives
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              A 501(c)(3) nonprofit that handles legal structure, financial
              oversight, and fund stewardship for US-RSE.
            </p>
          </div>
        </div>
      </section>

      {/* ── Become a sponsor — three pathways (preserved) ────────── */}
      <section
        id="become-a-sponsor"
        ref={pathwaysRef}
        className="mb-20 scroll-mt-24"
      >
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Three ways to help
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>

        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Become a sponsor.
        </h2>
        <p className="text-neutral-500 leading-relaxed mb-12 max-w-2xl">
          Your support sustains the community, funds the conference, and
          advances the recognition of research software engineering as a
          profession. Pick the pathway that fits &mdash; we&rsquo;ll take it
          from there.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
          {sponsorPathways.map((p, i) => {
            const a = accentStyles[p.accent];
            return (
              <a
                key={p.num}
                href={p.ctaHref}
                className={`group relative bg-white pt-10 pb-8 px-6 md:px-7 border-t-2 ${a.border} flex flex-col transition-colors hover:bg-neutral-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                  pathwaysInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Top row: eyebrow + number */}
                <div className="flex items-baseline justify-between mb-7">
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500">
                    {p.eyebrow}
                  </span>
                  <span
                    className={`font-display text-sm font-bold tabular-nums ${a.num}`}
                  >
                    {p.num}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-2xl lg:text-[1.6rem] font-bold text-neutral-900 leading-[1.15] tracking-tight mb-4 text-balance">
                  {p.title}
                </h3>

                {/* Lead paragraph */}
                <p className="text-sm text-neutral-500 leading-relaxed mb-8 text-pretty">
                  {p.lead}
                </p>

                {/* Funds list */}
                <div className="pt-5 mb-7 border-t border-neutral-100">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-3">
                    Your support funds
                  </p>
                  <ul className="space-y-1.5">
                    {p.funds.map((f) => (
                      <li
                        key={f}
                        className="flex gap-2.5 text-xs text-neutral-600 leading-relaxed"
                      >
                        <span
                          className={`${a.arrow} select-none shrink-0`}
                          aria-hidden="true"
                        >
                          →
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <span
                  className={`mt-auto inline-flex items-center gap-2 font-semibold text-sm text-neutral-900 ${a.hoverText} transition-colors`}
                >
                  {p.ctaLabel}
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </a>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-neutral-400 font-mono">
          Prefer a direct line? Email{" "}
          <a
            href="mailto:info@us-rse.org"
            className="text-teal-700 hover:text-teal-900 transition-colors"
          >
            info@us-rse.org
          </a>
          .
        </p>
      </section>

      {/* ── Continue exploring — bridge cards ────────────────────── */}
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
          The organization you&rsquo;d be funding.
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
                <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1 group-hover:text-teal-700 transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-neutral-500">{b.teaser}</p>
              </div>
              <svg
                className="w-5 h-5 text-neutral-400 group-hover:text-teal-700 transition-all group-hover:translate-x-1 shrink-0"
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
