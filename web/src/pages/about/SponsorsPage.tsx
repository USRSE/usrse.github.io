import { AboutLayout } from "@/components/about/AboutLayout";

const platinumSponsors = [
  "University of Illinois Urbana-Champaign",
  "Princeton University",
  "SHI",
  "Dell Technologies",
  "Schmidt Sciences",
];

const goldSponsors = [
  "Globus",
  "Los Alamos National Laboratory",
  "IBM",
  "HPE / AMD",
];

const travelSupportSponsors = [
  "Sustainable Horizons Institute",
  "Schmidt Sciences",
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

export function SponsorsPage() {
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
      {/* ── Primary Funder ──────────────────────────────────────── */}
      <section className="mb-20">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-3">
          Primary Grant Funding
        </p>
        <h2 className="font-display text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
          Alfred P. Sloan Foundation
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl">
          The Alfred P. Sloan Foundation has been the primary funder of US-RSE,
          providing the grant support that has enabled the organization to grow
          from a grassroots initiative into a thriving professional community
          with dedicated staff, annual conferences, and sustained programs.
        </p>
      </section>

      {/* ── Conference Sponsors ─────────────────────────────────── */}
      <section className="mb-20">
        <div className="flex items-baseline gap-3 mb-10">
          <h2 className="text-2xl font-bold text-neutral-900">
            Conference Sponsors
          </h2>
          <span className="font-mono text-sm text-purple-500">USRSE'25</span>
        </div>

        {/* Platinum tier */}
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-4">
            Platinum
          </p>
          <div className="space-y-1.5">
            {platinumSponsors.map((name) => (
              <p
                key={name}
                className="font-display text-2xl lg:text-3xl font-bold text-neutral-800 leading-tight"
              >
                {name}
              </p>
            ))}
          </div>
        </div>

        {/* Gold tier */}
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-4">
            Gold
          </p>
          <div className="space-y-1">
            {goldSponsors.map((name) => (
              <p
                key={name}
                className="font-heading text-lg lg:text-xl font-semibold text-neutral-700 leading-snug"
              >
                {name}
              </p>
            ))}
          </div>
        </div>

        {/* Travel Support */}
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-4">
            Travel Support
          </p>
          <div className="space-y-1">
            {travelSupportSponsors.map((name) => (
              <p
                key={name}
                className="text-base font-medium text-neutral-600 leading-snug"
              >
                {name}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── Individual Sponsors ─────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">
          Individual Sponsors
        </h2>
        <p className="text-neutral-500 leading-relaxed">
          We gratefully acknowledge the many individuals who have contributed
          personal donations to support US-RSE's programs, events, and community
          infrastructure. Every contribution, regardless of size, strengthens the
          RSE movement.
        </p>
      </section>

      {/* ── Fiscal Sponsorship ──────────────────────────────────── */}
      <section className="mb-16">
        <div className="py-6 border-t border-b border-neutral-200">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-2">
            Fiscal Sponsor
          </p>
          <p className="font-heading text-lg font-bold text-neutral-900">
            Community Initiatives
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            US-RSE operates as a fiscally sponsored project of Community
            Initiatives, a 501(c)(3) nonprofit organization. This structure
            allows tax-deductible donations and provides organizational
            governance.
          </p>
        </div>
      </section>

      {/* ── Become a Sponsor — three pathways ───────────────────── */}
      <section id="become-a-sponsor" className="scroll-mt-24">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
            Three ways to help
          </p>
          <span
            className="flex-1 h-px bg-neutral-200"
            aria-hidden="true"
          />
        </div>

        <h2 className="font-display text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
          Become a sponsor.
        </h2>
        <p className="text-neutral-500 leading-relaxed mb-14 max-w-2xl">
          Your support sustains the community, funds the conference, and
          advances the recognition of research software engineering as a
          profession. Pick the pathway that fits — we&rsquo;ll take it from
          there.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
          {sponsorPathways.map((p) => {
            const a = accentStyles[p.accent];
            return (
              <a
                key={p.num}
                href={p.ctaHref}
                className={`group relative bg-white pt-10 pb-8 px-6 md:px-7 border-t-2 ${a.border} flex flex-col transition-colors hover:bg-neutral-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`}
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
            className="text-teal-600 hover:text-teal-800 transition-colors"
          >
            info@us-rse.org
          </a>
          .
        </p>
      </section>
    </AboutLayout>
  );
}
