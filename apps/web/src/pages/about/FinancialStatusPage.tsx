import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "501(c)(3)", label: "Nonprofit status" },
  { value: "Tax-deductible", label: "Every contribution" },
  { value: "Board-overseen", label: "All financial decisions" },
  { value: "Audited", label: "Annually" },
];

interface FundingSource {
  num: string;
  title: string;
  body: string;
}

const fundingSources: FundingSource[] = [
  {
    num: "01",
    title: "Grant funding",
    body: "The Alfred P. Sloan Foundation has been the primary funder of US-RSE, providing the grant support that enabled the organization to hire staff, launch annual conferences, and build sustainable programs.",
  },
  {
    num: "02",
    title: "Conference sponsorships",
    body: "Annual conference sponsors at Platinum, Gold, and Travel Support tiers fund the USRSE conference series, making it accessible to the broadest possible audience.",
  },
  {
    num: "03",
    title: "Organizational memberships",
    body: "Premier, Standard, and Basic tier organizational memberships from universities, national labs, and industry partners provide sustaining revenue for community programs.",
  },
  {
    num: "04",
    title: "Individual donations",
    body: "Community members contribute personal donations of all sizes. Every contribution directly supports the RSE mission — events, resources, outreach, and advocacy.",
  },
];

interface Allocation {
  num: string;
  title: string;
  body: string;
}

const allocations: Allocation[] = [
  {
    num: "01",
    title: "Staff & operations",
    body: "Executive Director salary, benefits, and day-to-day infrastructure that keeps the organization running.",
  },
  {
    num: "02",
    title: "Annual conference",
    body: "Venue, programming, catering, and accessibility support for the yearly USRSE conference.",
  },
  {
    num: "03",
    title: "Travel grants",
    body: "Scholarships for students, early-career RSEs, and underrepresented participants to attend events.",
  },
  {
    num: "04",
    title: "K-12 outreach",
    body: "Educational programs reaching 900+ students across 46 classrooms and counting.",
  },
  {
    num: "05",
    title: "Community infrastructure",
    body: "Website, Slack workspace, event tooling, and the shared systems members use every day.",
  },
  {
    num: "06",
    title: "Working & affinity groups",
    body: "Support for the eleven working groups and affinity groups that build community initiatives.",
  },
];

const pillarAccent = {
  teal: { border: "border-teal-500", num: "text-teal-600" },
  purple: { border: "border-purple-500", num: "text-purple-500" },
};

interface TransparencyProof {
  label: string;
  title: string;
  detail: string;
}

const transparencyProofs: TransparencyProof[] = [
  {
    label: "Layer 01",
    title: "Board oversight",
    detail: "Nine elected directors review and approve all budgets, contracts, and major spending decisions.",
  },
  {
    label: "Layer 02",
    title: "Published minutes",
    detail: "Board meeting notes, including budget discussions, live publicly on our GitHub repository.",
  },
  {
    label: "Layer 03",
    title: "Annual audit",
    detail: "Community Initiatives audits the books each year and files all required IRS paperwork on our behalf.",
  },
];

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
    teaser: "What the numbers are in service of.",
    path: "/about/mission",
  },
  {
    eyebrow: "Leadership",
    title: "Board of Directors",
    teaser: "The elected body that oversees every dollar.",
    path: "/about/board",
  },
  {
    eyebrow: "Framework",
    title: "Governance",
    teaser: "The structure behind the oversight.",
    path: "/about/governance",
  },
  {
    eyebrow: "Support",
    title: "Sponsors",
    teaser: "The funders and partners that make this work.",
    path: "/about/sponsors",
  },
];

export function FinancialStatusPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: sourcesRef, isInView: sourcesInView } = useInView(0.05);
  const { ref: allocationsRef, isInView: allocationsInView } = useInView(0.05);
  const { ref: transparencyRef, isInView: transparencyInView } = useInView(0.1);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <AboutLayout
      title="Financial Status"
      subtitle="Transparency in how US-RSE is funded, governed financially, and sustained."
      prevPage={{ path: "/about/staff", label: "Staff" }}
      nextPage={null}
    >
      {/* ── The stance — manifesto + framing ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          Where the money goes
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          Every dollar, in public.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          US-RSE operates as a fiscally sponsored project of Community
          Initiatives, a 501(c)(3) nonprofit. All finances are overseen by
          the elected Board, subject to annual audit, and reported to the
          IRS. What&rsquo;s below is where the money comes from and where
          it goes.
        </p>
      </section>

      {/* ── At a glance — 4-column facts strip ───────────────────── */}
      <section
        ref={factsRef}
        className={`mb-20 py-8 border-y border-neutral-200 grid grid-cols-2 md:grid-cols-4 ${
          factsInView ? "animate-fade-in" : "opacity-0"
        }`}
      >
        {keyFacts.map((f, i) => (
          <div
            key={f.label}
            className={`py-3 px-4 md:px-6 ${
              i > 0 ? "md:border-l md:border-neutral-200" : ""
            } ${
              i % 2 !== 0 ? "border-l border-neutral-200 md:border-l" : ""
            } ${i >= 2 ? "border-t border-neutral-200 md:border-t-0" : ""}`}
          >
            <p className="font-display text-xl lg:text-2xl font-bold text-purple-600 tracking-tight leading-none">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2.5">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── Where the money comes from — 4 pillar blocks ────────── */}
      <section ref={sourcesRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Funding sources
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Where the money comes from.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          US-RSE is sustained through a mix of grants, sponsorships, and
          individual contributions &mdash; four channels, working together.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {fundingSources.map((s, i) => {
            const a = i % 2 === 0 ? pillarAccent.teal : pillarAccent.purple;
            return (
              <article
                key={s.num}
                className={`bg-white pt-9 pb-10 px-6 md:px-8 border-t-2 ${a.border} ${
                  sourcesInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span
                  className={`font-display text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${a.num}`}
                >
                  {s.num}
                </span>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 mt-4 mb-3 tracking-tight">
                  {s.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed max-w-md">
                  {s.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Where the money goes — 6 pillar blocks, 3x2 grid ────── */}
      <section ref={allocationsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Fund allocation
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Where the money goes.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Six categories, each directly serving the community that funds
          them.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200">
          {allocations.map((a, i) => {
            const acc = i % 2 === 0 ? pillarAccent.teal : pillarAccent.purple;
            return (
              <article
                key={a.num}
                className={`bg-white pt-8 pb-9 px-6 md:px-7 border-t-2 ${acc.border} ${
                  allocationsInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  className={`font-display text-3xl lg:text-4xl font-black tracking-tight tabular-nums ${acc.num}`}
                >
                  {a.num}
                </span>
                <h3 className="font-display text-lg lg:text-xl font-bold text-neutral-900 mt-4 mb-2.5 tracking-tight">
                  {a.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {a.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Transparency — full-bleed purple panel ──────────────── */}
      <section
        ref={transparencyRef}
        className="mb-20 py-16 border-y-2 border-neutral-900 bg-purple-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className={transparencyInView ? "animate-slide-up" : "opacity-0"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
            Open books
          </p>
          <h2 className="font-display text-3xl lg:text-[2.25rem] font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4 text-balance">
            Three layers of accountability.
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed max-w-3xl mb-10">
            Transparency isn&rsquo;t a claim &mdash; it&rsquo;s a paper
            trail. Every financial decision passes through the Board, every
            decision gets written down, and every year the books are audited
            by an independent 501(c)(3).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 mb-6">
            {transparencyProofs.map((t) => (
              <div key={t.label} className="bg-white p-6 md:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-600 mb-3">
                  {t.label}
                </p>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight mb-2">
                  {t.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {t.detail}
                </p>
              </div>
            ))}
          </div>

          <p className="text-sm text-neutral-600 leading-relaxed max-w-3xl">
            Questions about the finances? Email the Board directly &mdash;
            they read member mail.
          </p>
        </div>
      </section>

      {/* ── Support the Mission — donate CTA ────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-4">
          Support the mission
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Every contribution is tax-deductible.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Donations of any size help sustain US-RSE&rsquo;s programs and
          community &mdash; stewarded through Community Initiatives&rsquo;
          501(c)(3) structure.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="mailto:info@us-rse.org?subject=Donate%20to%20US-RSE"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Make a donation
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>or</span>
            <Link
              to="/about/sponsors"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Become a sponsor
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/about/board"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Email the board
            </Link>
          </div>
        </div>
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
          Where to go from here.
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
