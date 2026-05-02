import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

interface Principle {
  num: string;
  title: string;
  body: string;
}

const principles: Principle[] = [
  {
    num: "01",
    title: "Transparency",
    body: "All governance documents live publicly on GitHub, open to community contribution. Board meeting minutes are published regularly.",
  },
  {
    num: "02",
    title: "Accountability",
    body: "Nine elected directors serving staggered terms, elected annually by the membership. Leadership answers to members — not the other way around.",
  },
  {
    num: "03",
    title: "Representation",
    body: "Every member can vote. Every member can run. The direction of the organization is set by the community that builds it.",
  },
  {
    num: "04",
    title: "Stewardship",
    body: "Fiscally sponsored by Community Initiatives, a 501(c)(3) nonprofit, so funds are handled with nonprofit-grade financial oversight.",
  },
];

const pillarAccent = {
  teal: { border: "border-teal-500", num: "text-teal-600" },
  purple: { border: "border-purple-500", num: "text-purple-500" },
};

interface Fact {
  label: string;
  value: string;
}

const keyFacts: Fact[] = [
  { label: "Board size", value: "9 elected directors" },
  { label: "Terms", value: "Staggered, multi-year" },
  { label: "Election cadence", value: "Annual" },
  { label: "Voting eligibility", value: "All US-RSE members" },
  { label: "Meeting minutes", value: "Published on GitHub" },
  { label: "Governance docs", value: "Open to community PRs" },
];

interface ParticipationStep {
  num: string;
  action: string;
  detail: string;
}

const participationSteps: ParticipationStep[] = [
  {
    num: "01",
    action: "Vote",
    detail: "Cast a ballot in the annual board election.",
  },
  {
    num: "02",
    action: "Run",
    detail: "Stand for election when seats open each year.",
  },
  {
    num: "03",
    action: "Attend",
    detail: "Drop in on open board sessions and community calls.",
  },
  {
    num: "04",
    action: "Read",
    detail: "Review published minutes on our GitHub repo.",
  },
  {
    num: "05",
    action: "Propose",
    detail: "Open a GitHub issue or pull request on governance docs.",
  },
  {
    num: "06",
    action: "Ask",
    detail: "Email the board with questions, ideas, or concerns.",
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
    eyebrow: "Participation",
    title: "Elections",
    teaser: "When seats open, who can run, and how to vote.",
    path: "/about/elections",
  },
  {
    eyebrow: "Team",
    title: "Our Staff",
    teaser: "The full-time humans running day-to-day operations.",
    path: "/about/staff",
  },
  {
    eyebrow: "Finances",
    title: "Financial Status",
    teaser: "Where the money comes from and where it goes.",
    path: "/about/financial-status",
  },
  {
    eyebrow: "Standards",
    title: "Code of Conduct",
    teaser: "The standards we hold ourselves and each other to.",
    path: "/about/code-of-conduct",
  },
];

export function GovernancePage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: whyRef, isInView: whyInView } = useInView(0.1);
  const { ref: principlesRef, isInView: principlesInView } = useInView(0.1);
  const { ref: orgRef, isInView: orgInView } = useInView(0.05);
  const { ref: practiceRef, isInView: practiceInView } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <AboutLayout
      title="Governance"
      subtitle="How US-RSE is organized, led, and sustained as a community."
      prevPage={{ path: "/about/dei", label: "DEI Statement" }}
      nextPage={{
        path: "/about/board",
        label: "Board of Directors",
        teaser: "Meet the elected leadership",
      }}
    >
      {/* ── The stance — manifesto + official framing ─────────────── */}
      <section
        ref={stanceRef}
        className={`mb-20 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          How decisions get made
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          Elected by members. Transparent by default. Accountable to the
          community.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          US-RSE is governed by an elected Board of Directors that sets the
          strategic direction of the organization, manages community
          resources, and represents the interests of the membership — all
          under the fiscal sponsorship of Community Initiatives, a 501(c)(3)
          nonprofit.
        </p>
      </section>

      {/* ── Why transparency matters — pull quote + full-bleed ──── */}
      <section
        ref={whyRef}
        className="mb-20 py-16 border-y-2 border-neutral-900 bg-teal-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className={whyInView ? "animate-slide-up" : "opacity-0"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
            Why it matters
          </p>
          <blockquote className="font-display text-2xl lg:text-[2rem] font-bold text-neutral-900 leading-[1.15] tracking-tight mb-8 text-balance max-w-4xl">
            &ldquo;A professional community is only as trustworthy as its
            records are public.&rdquo;
          </blockquote>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 max-w-4xl">
            <p className="text-base text-neutral-600 leading-relaxed">
              Every decision the Board makes, every dollar the organization
              spends, and every policy the community adopts is recorded and
              published. The default is public; the exception is rare and
              justified.
            </p>
            <p className="text-base text-neutral-600 leading-relaxed">
              Governance documents live openly on GitHub and invite
              contribution — because the rules of a member-owned community
              belong to its members, not just to the people currently in its
              seats.
            </p>
          </div>
        </div>
      </section>

      {/* ── Four principles — pillar blocks ─────────────────────── */}
      <section ref={principlesRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What governs the governance
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Four principles.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {principles.map((p, i) => {
            const a = i % 2 === 0 ? pillarAccent.teal : pillarAccent.purple;
            return (
              <article
                key={p.num}
                className={`bg-white pt-10 pb-12 px-6 md:px-8 border-t-2 ${a.border} ${
                  principlesInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span
                  className={`font-display text-5xl font-black tracking-tight tabular-nums ${a.num}`}
                >
                  {p.num}
                </span>
                <h3 className="font-display text-2xl font-bold text-neutral-900 mt-5 mb-3 tracking-tight">
                  {p.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed max-w-md">
                  {p.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── How we're organized — refined org chart ─────────────── */}
      <section ref={orgRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Who does what
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          How we&rsquo;re organized.
        </h2>

        <div className="relative">
          {/* Vertical connector — centered through dots */}
          <div className="absolute left-[9px] lg:left-[10px] top-5 bottom-5 w-px bg-neutral-200" />

          {/* Community Initiatives — fiscal sponsor */}
          <div
            className={`relative pb-10 lg:pb-12 pl-[30px] lg:pl-8 ${
              orgInView ? "animate-slide-up" : "opacity-0"
            }`}
            style={{ animationDelay: "0ms" }}
          >
            <div
              className="absolute left-0 top-2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border-2 border-neutral-300 bg-white z-10"
              aria-hidden="true"
            />
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              Fiscal sponsor
            </p>
            <p className="text-lg font-semibold text-neutral-700 mt-1">
              Community Initiatives
            </p>
            <p className="text-sm text-neutral-400 mt-0.5">
              501(c)(3) nonprofit providing the legal and financial framework.
            </p>
          </div>

          {/* Board of Directors — elected leadership */}
          <div
            className={`relative pb-10 lg:pb-12 pl-[30px] lg:pl-8 ${
              orgInView ? "animate-slide-up" : "opacity-0"
            }`}
            style={{ animationDelay: "100ms" }}
          >
            <div
              className="absolute left-0 top-2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border-2 border-purple-500 bg-purple-500 z-10"
              aria-hidden="true"
            />
            <p className="font-mono text-[11px] uppercase tracking-wider text-purple-600">
              Elected leadership
            </p>
            <p className="font-display text-xl lg:text-2xl font-bold text-neutral-900 mt-1 tracking-tight">
              Board of Directors
            </p>
            <p className="text-sm text-neutral-500 mt-1 max-w-xl">
              Nine members serving staggered terms, elected annually by the
              membership. Sets strategic direction, approves budgets, and
              represents community interests.
            </p>
            <Link
              to="/about/board"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors mt-3"
            >
              Meet the board
              <svg
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Staff — operations */}
          <div
            className={`relative pb-10 lg:pb-12 pl-[30px] lg:pl-8 ${
              orgInView ? "animate-slide-up" : "opacity-0"
            }`}
            style={{ animationDelay: "200ms" }}
          >
            <div
              className="absolute left-0 top-2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border-2 border-teal-500 bg-teal-500 z-10"
              aria-hidden="true"
            />
            <p className="font-mono text-[11px] uppercase tracking-wider text-teal-700">
              Operations
            </p>
            <p className="font-display text-xl lg:text-2xl font-bold text-neutral-900 mt-1 tracking-tight">
              Staff
            </p>
            <p className="text-sm text-neutral-500 mt-1 max-w-xl">
              Dedicated team supporting day-to-day community operations,
              programs, and member services.
            </p>
            <Link
              to="/about/staff"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors mt-3"
            >
              Meet the staff
              <svg
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Community-led groups — three peer nodes */}
          <div
            className={`relative pl-[30px] lg:pl-8 ${
              orgInView ? "animate-slide-up" : "opacity-0"
            }`}
            style={{ animationDelay: "300ms" }}
          >
            <div
              className="absolute left-0 top-2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border-2 border-neutral-300 bg-white z-10"
              aria-hidden="true"
            />
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              Community-led
            </p>

            <div className="mt-2 space-y-5">
              <div>
                <p className="font-display text-lg lg:text-xl font-bold text-neutral-900 tracking-tight">
                  Working Groups
                </p>
                <p className="text-sm text-neutral-500 mt-0.5 max-w-xl">
                  Volunteer-run focus areas: code review, DEI, mentorship,
                  testing, education, outreach, and more.
                </p>
              </div>

              <div>
                <p className="font-display text-lg lg:text-xl font-bold text-neutral-900 tracking-tight">
                  Affinity Groups
                </p>
                <p className="text-sm text-neutral-500 mt-0.5 max-w-xl">
                  Shared-identity communities: RSE Group Leaders&rsquo;
                  Network, Neuro-RSE, R-RSE, Institutional RSE Networking.
                </p>
              </div>

              <div>
                <p className="font-display text-lg lg:text-xl font-bold text-neutral-900 tracking-tight">
                  Regional Groups
                </p>
                <p className="text-sm text-neutral-500 mt-0.5 max-w-xl">
                  Geographic chapters: DMV-RSE, North Carolina, St. Louis
                  Metro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Governance in practice — key facts + participation ─── */}
      <section ref={practiceRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Governance in practice
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          The facts, and how to take part.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left — Key facts */}
          <div
            className={practiceInView ? "animate-slide-up" : "opacity-0"}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-4">
              Key facts
            </p>
            <dl className="divide-y divide-neutral-100 border-t border-neutral-200">
              {keyFacts.map((f) => (
                <div
                  key={f.label}
                  className="py-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 items-baseline"
                >
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                    {f.label}
                  </dt>
                  <dd className="text-sm font-semibold text-neutral-900">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right — How to participate */}
          <div
            className={practiceInView ? "animate-slide-up" : "opacity-0"}
            style={{ animationDelay: "150ms" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-600 mb-4">
              How to participate
            </p>
            <ol className="space-y-3">
              {participationSteps.map((s) => (
                <li
                  key={s.num}
                  className="grid grid-cols-[auto_1fr] gap-4 items-baseline"
                >
                  <span className="font-mono text-[10px] text-neutral-400 tabular-nums">
                    {s.num}
                  </span>
                  <div>
                    <span className="font-display text-sm font-bold text-neutral-900 tracking-tight">
                      {s.action}.
                    </span>
                    <span className="text-sm text-neutral-600 leading-relaxed ml-1.5">
                      {s.detail}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Have your say — CTA + inline exit ramps ─────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Have your say
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          The organization is yours. Shape it.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Every member can vote, run, read, and propose. The next election is
          the next chance — and it comes around every year.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <Link
            to="/about/elections"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            See the next election
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
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>or</span>
            <a
              href="https://github.com/USRSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Governance on GitHub
            </a>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/about/board"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Meet the board
            </Link>
            <span aria-hidden="true">&middot;</span>
            <a
              href="mailto:info@us-rse.org?subject=Governance%20question"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Email the board
            </a>
          </div>
        </div>
      </section>

      {/* ── Continue exploring — bridge cards ───────────────────── */}
      <section ref={bridgeRef} className="mb-4 pt-12 border-t-2 border-neutral-900">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Continue exploring
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-10">
          The accountability hub.
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
