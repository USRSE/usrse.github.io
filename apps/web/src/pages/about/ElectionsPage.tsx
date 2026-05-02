import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

interface Winner {
  name: string;
  org: string;
  term: string;
  photo: string;
}

/**
 * Winners of the December 2025 election. Listed alphabetically by last name
 * to avoid implying ranking; terms come from the board roster.
 */
const latestWinners: Winner[] = [
  {
    name: "Jeffrey C. Carver",
    org: "University of Alabama",
    term: "2019–2027",
    photo: "/images/board-of-directors/jeff-carver.jpeg",
  },
  {
    name: "Ian Cosden",
    org: "Princeton University",
    term: "2019–2027",
    photo: "/images/board-of-directors/ian-cosden.jpeg",
  },
  {
    name: "Alex Koufos",
    org: "Stanford University",
    term: "2024–2027",
    photo: "/images/board-of-directors/alex-koufos.jpeg",
  },
  {
    name: "Abbey Roelofs",
    org: "University of Michigan",
    term: "2024–2027",
    photo: "/images/board-of-directors/abbey-roelofs.jpeg",
  },
  {
    name: "Pengyin Shan",
    org: "University of Illinois Urbana-Champaign",
    term: "2026–2027",
    photo: "/images/board-of-directors/pengyin-shan.png",
  },
];

interface Phase {
  step: string;
  title: string;
  when: string;
  description: string;
}

const electionTimeline: Phase[] = [
  {
    step: "01",
    title: "Nominations open",
    when: "Early fall",
    description:
      "Any US-RSE member in good standing may self-nominate or be nominated by another member. Candidates must demonstrate a meaningful connection to, history with, and vested interest in the community.",
  },
  {
    step: "02",
    title: "Candidate statements",
    when: "Mid fall",
    description:
      "Nominees submit statements describing their vision, qualifications, and what they'd bring to the Board. Statements are shared with all members for review.",
  },
  {
    step: "03",
    title: "Voting period",
    when: "Late fall",
    description:
      "If the number of candidates exceeds available seats, an election is held via ElectionBuddy using Single Transferable Vote (STV). Voters rank candidates by preference. All members as of the eligibility cutoff receive one ballot.",
  },
  {
    step: "04",
    title: "Results & transition",
    when: "End of year",
    description:
      "Results are announced to the community. Newly elected directors begin their terms at the start of the following year, with an onboarding period alongside continuing members.",
  },
];

const phaseAccent = {
  teal: { num: "text-teal-600", when: "text-teal-700", rule: "bg-teal-500" },
  purple: {
    num: "text-purple-500",
    when: "text-purple-600",
    rule: "bg-purple-500",
  },
};

const eligibility = [
  "A meaningful connection to, history with, and vested interest in the US-RSE community.",
  "Documented engagement history within US-RSE — working groups, events, or contributions.",
  "US residency and affiliation with a US-based entity, self-employment, or retirement status.",
];

const responsibilities = [
  "Attend biweekly board meetings (currently Fridays, subject to change).",
  "Participate actively in Slack discussions and async decision-making.",
  "Contribute to website updates, newsletters, and community events.",
  "Represent US-RSE in international RSE committees and conferences.",
  "Support and engage with working groups and community initiatives.",
];

interface BallotStep {
  num: string;
  title: string;
  detail: string;
}

const ballotSteps: BallotStep[] = [
  {
    num: "01",
    title: "Rank",
    detail: "You order candidates by preference — first choice, second, third, as far as you care to go.",
  },
  {
    num: "02",
    title: "Transfer",
    detail: "If your top choice has enough votes already, your ballot transfers to your next preference.",
  },
  {
    num: "03",
    title: "Seat",
    detail: "Seats fill proportionally. The result reflects the community's ranked preferences, not just plurality.",
  },
];

interface Chair {
  name: string;
  role: string;
  org: string;
  email: string;
  photo: string;
}

const chairs: Chair[] = [
  {
    name: "Cordero Core",
    role: "Election Chair",
    org: "University of Washington",
    email: "cdcore@uw.edu",
    photo: "/images/board-of-directors/cordero-core.jpeg",
  },
  {
    name: "Miranda Mundt",
    role: "Election Chair",
    org: "Sandia National Laboratories",
    email: "mmundt@sandia.gov",
    photo: "/images/board-of-directors/miranda-mundt.jpeg",
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
    eyebrow: "Observe",
    title: "Events",
    teaser: "Show up in person — the lowest-bar way to start.",
    path: "/events/upcoming",
  },
  {
    eyebrow: "Connect",
    title: "Community Calls",
    teaser: "Monthly conversations across the network.",
    path: "/community/calls",
  },
  {
    eyebrow: "Contribute",
    title: "Working Groups",
    teaser: "Eleven focus areas building the community's shared work.",
    path: "/community/working-groups",
  },
  {
    eyebrow: "Serve",
    title: "Volunteer",
    teaser: "Help run events, programs, and day-to-day operations.",
    path: "/jobs/volunteer",
  },
];

export function ElectionsPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: resultsRef, isInView: resultsInView } = useInView(0.05);
  const { ref: timelineRef, isInView: timelineInView } = useInView(0.05);
  const { ref: whoRef, isInView: whoInView } = useInView(0.05);
  const { ref: ballotRef, isInView: ballotInView } = useInView(0.1);
  const { ref: chairsRef, isInView: chairsInView } = useInView(0.1);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <AboutLayout
      title="Elections"
      subtitle="How the US-RSE community chooses its leadership — transparently, democratically, annually."
      prevPage={{ path: "/about/board", label: "Board of Directors" }}
      nextPage={{
        path: "/about/code-of-conduct",
        label: "Code of Conduct",
        teaser: "Community standards and reporting",
      }}
    >
      {/* ── The stance — manifesto + framing ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-20 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          Democracy, practiced
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          One member. One vote. Every year.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          US-RSE holds open elections for open Board seats every year, using a
          ranked-choice method administered by ElectionBuddy. Every member as
          of the eligibility cutoff receives one ballot — no dues, no
          hierarchy, no gatekeeping.
        </p>
      </section>

      {/* ── Latest results — 2025 election winners ───────────────── */}
      <section ref={resultsRef} className="mb-24">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
            The 2025 election
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {latestWinners.length.toString().padStart(2, "0")} seats filled
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          Five new and returning directors.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Elected by the membership in December 2025 and serving through their
          term end. Listed alphabetically.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-10">
          {latestWinners.map((w, i) => (
            <div
              key={w.name}
              className={`group ${resultsInView ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[3/4] bg-neutral-100">
                <img
                  src={w.photo}
                  alt={w.name}
                  className="absolute inset-0 w-full h-full object-cover object-top grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
                  loading="lazy"
                />
              </div>
              <h3 className="font-heading text-[14px] font-bold text-neutral-900 leading-tight">
                {w.name}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                {w.org}
              </p>
              <p className="font-mono text-[10px] text-purple-600 mt-1.5 tabular-nums">
                {w.term}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The four phases — timeline with alternating accents ──── */}
      <section ref={timelineRef} className="mb-24">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            How elections work
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          The four phases.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Elections run on an annual cadence near the end of each calendar year.
        </p>

        <div className="space-y-0">
          {electionTimeline.map((phase, i) => {
            const isLast = i === electionTimeline.length - 1;
            const a = i % 2 === 0 ? phaseAccent.teal : phaseAccent.purple;
            return (
              <div
                key={phase.step}
                className={`relative flex gap-6 lg:gap-8 ${!isLast ? "pb-12 lg:pb-14" : ""} ${
                  timelineInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {/* Step number column */}
                <div className="relative shrink-0 w-14 lg:w-16">
                  <span
                    className={`font-display text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${a.num}`}
                  >
                    {phase.step}
                  </span>
                  {/* Connector to next step */}
                  {!isLast && (
                    <div
                      className={`absolute left-3 lg:left-3.5 top-14 lg:top-16 bottom-0 w-px ${a.rule} opacity-30`}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="flex items-baseline gap-3 flex-wrap mb-2">
                    <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight">
                      {phase.title}
                    </h3>
                    <span
                      className={`font-mono text-[11px] uppercase tracking-[0.15em] ${a.when}`}
                    >
                      {phase.when}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
                    {phase.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Who runs + what they sign up for — 2-column split ────── */}
      <section ref={whoRef} className="mb-24">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Running for the board
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Who runs &mdash; and what they sign up for.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left — eligibility */}
          <div
            className={whoInView ? "animate-slide-up" : "opacity-0"}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-4">
              Who can run
            </p>
            <p className="text-sm text-neutral-500 mb-5">
              Candidates must demonstrate:
            </p>
            <ol className="space-y-4 mb-8">
              {eligibility.map((req, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[auto_1fr] gap-4 items-baseline"
                >
                  <span className="font-mono text-[11px] text-teal-600 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {req}
                  </p>
                </li>
              ))}
            </ol>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              Exceptions to residency and affiliation requirements are
              considered on a case-by-case basis by the Election Chairs and a
              subcommittee.
            </p>

            {/* Volunteer callout — encourage engagement as a path to candidacy */}
            <div className="p-5 rounded-xl bg-teal-50/60 border border-teal-100">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-2">
                Not quite ready?
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed mb-3">
                The best path to a future candidacy starts with getting
                involved — joining a working group, helping run an event, or
                supporting a community initiative.
              </p>
              <Link
                to="/jobs/volunteer"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
              >
                See volunteer opportunities
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
          </div>

          {/* Right — responsibilities */}
          <div
            className={whoInView ? "animate-slide-up" : "opacity-0"}
            style={{ animationDelay: "150ms" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-600 mb-4">
              What they sign up for
            </p>
            <p className="text-sm text-neutral-500 mb-5">
              Board members set direction and share day-to-day load. Typical
              expectations:
            </p>
            <ol className="space-y-4">
              {responsibilities.map((item, i) => (
                <li
                  key={item}
                  className="grid grid-cols-[auto_1fr] gap-4 items-baseline"
                >
                  <span className="font-mono text-[11px] text-purple-500 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {item}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── How your ballot works — STV Rank/Transfer/Seat ───────── */}
      <section
        ref={ballotRef}
        className="mb-24 py-16 border-y-2 border-neutral-900 bg-teal-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className={ballotInView ? "animate-slide-up" : "opacity-0"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
            How your ballot works
          </p>
          <h2 className="font-display text-3xl lg:text-[2.5rem] font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4 text-balance">
            Rank. Transfer. Seat.
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed max-w-3xl mb-10">
            US-RSE uses Single Transferable Vote &mdash; so every ballot
            counts, even if your first choice doesn&rsquo;t win.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 mb-6">
            {ballotSteps.map((s, i) => (
              <div
                key={s.num}
                className="bg-white p-6 md:p-7"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 tabular-nums mb-3">
                  Step {s.num}
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

          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Administered via ElectionBuddy &middot; One ballot per eligible
            member
          </p>
        </div>
      </section>

      {/* ── Talk to the chairs — CTA + chair cards ───────────────── */}
      <section ref={chairsRef} className="mb-20">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Got questions? Ready to run?
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          The Election Chairs are your first call.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          Nominations, eligibility questions, process concerns — the Chairs
          answer all of it and keep the election on track.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200 mb-6">
          {chairs.map((c, i) => (
            <div
              key={c.email}
              className={`bg-white p-6 md:p-7 flex items-start gap-5 ${
                chairsInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-neutral-100">
                <img
                  src={c.photo}
                  alt={c.name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-1">
                  {c.role}
                </p>
                <p className="font-display text-lg font-bold text-neutral-900 tracking-tight leading-tight">
                  {c.name}
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">{c.org}</p>
                <a
                  href={`mailto:${c.email}`}
                  className="group inline-flex items-center gap-1.5 mt-3 font-mono text-[12px] text-teal-700 hover:text-teal-900 transition-colors"
                >
                  {c.email}
                  <svg
                    className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
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
            </div>
          ))}
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
          Get involved.
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
