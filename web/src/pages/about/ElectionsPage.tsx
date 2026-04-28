import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

const latestCohort = {
  term: "2026–2028",
  members: [
    { name: "Cordero Core", photo: "/images/board-of-directors/cordero-core.jpeg" },
    { name: "Julia Damerow", photo: "/images/board-of-directors/julia-damerow.jpeg" },
    { name: "Kenton McHenry", photo: "/images/board-of-directors/kenton-mchenry.jpeg" },
    { name: "Miranda Mundt", photo: "/images/board-of-directors/miranda-mundt.jpeg" },
  ],
};

const electionTimeline = [
  {
    step: "01",
    title: "Nominations Open",
    when: "Early Fall",
    description:
      "Any US-RSE member in good standing may self-nominate or be nominated by another member. Candidates must demonstrate a meaningful connection to, history with, and vested interest in the community.",
  },
  {
    step: "02",
    title: "Candidate Statements",
    when: "Mid Fall",
    description:
      "Nominees submit statements describing their vision, qualifications, and what they'd bring to the Board. Statements are shared with all members for review.",
  },
  {
    step: "03",
    title: "Voting Period",
    when: "Late Fall",
    description:
      "If the number of candidates exceeds available seats, an election is held via ElectionBuddy using Single Transferable Vote (STV). Voters rank candidates by preference. All members as of the eligibility cutoff date receive one ballot.",
  },
  {
    step: "04",
    title: "Results & Transition",
    when: "End of Year",
    description:
      "Results are announced to the community. Newly elected board members begin their terms at the start of the following year, with an onboarding period alongside continuing members.",
  },
];

const eligibility = [
  "A meaningful connection to, history with, and vested interest in the US-RSE community",
  "Documented engagement history within US-RSE (working groups, events, contributions)",
  "US residency and affiliation with a US-based entity, self-employment, or retirement status",
];

const responsibilities = [
  "Attend biweekly board meetings (currently Fridays, subject to change)",
  "Participate actively in Slack discussions and async decision-making",
  "Contribute to website updates, newsletters, and community events",
  "Represent US-RSE in international RSE committees and conferences",
  "Support and engage with working groups and community initiatives",
];

export function ElectionsPage() {
  const { ref: timelineRef, isInView: timelineVisible } = useInView(0.05);
  const { ref: resultsRef, isInView: resultsVisible } = useInView(0.1);

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
      {/* ── Latest Results ──────────────────────────────────────────── */}
      <div className="mb-16" ref={resultsRef}>
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Latest Results
          </h2>
          <span className="text-sm font-mono text-purple-500">
            {latestCohort.term}
          </span>
        </div>

        <div className="flex flex-wrap gap-6">
          {latestCohort.members.map((member, i) => (
            <div
              key={member.name}
              className={`group ${resultsVisible ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden mb-3 bg-neutral-100">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover object-top grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  loading="lazy"
                />
              </div>
              <p className="text-sm font-semibold text-neutral-900">{member.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How Elections Work — Timeline ───────────────────────────── */}
      <div className="mb-16" ref={timelineRef}>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          How Elections Work
        </h2>
        <p className="text-neutral-500 mb-10">
          Elections happen near the end of each year for open seats on the Board of Directors.
        </p>

        <div className="space-y-0">
          {electionTimeline.map((phase, i) => {
            const isLast = i === electionTimeline.length - 1;
            return (
              <div
                key={phase.step}
                className={`relative flex gap-6 lg:gap-8 ${!isLast ? "pb-10 lg:pb-12" : ""} ${
                  timelineVisible ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {/* Step number column */}
                <div className="relative shrink-0 w-12 lg:w-14">
                  <span className="font-display text-3xl lg:text-4xl font-bold text-neutral-200">
                    {phase.step}
                  </span>
                  {/* Connector to next step */}
                  {!isLast && (
                    <div className="absolute left-6 lg:left-7 top-12 bottom-0 w-px bg-neutral-100" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-baseline gap-3 mb-1.5">
                    <h3 className="text-lg font-bold text-neutral-900">
                      {phase.title}
                    </h3>
                    <span className="text-xs font-mono text-teal-600 tracking-wide">
                      {phase.when}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {phase.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Eligibility ────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Who Can Run
        </h2>
        <p className="text-neutral-500 mb-6">
          Candidates must demonstrate:
        </p>

        <div className="space-y-3">
          {eligibility.map((req, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-mono text-xs text-purple-500 mt-1 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-neutral-600 text-sm leading-relaxed">{req}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-neutral-400 mt-4">
          Exceptions to residency and affiliation requirements are considered on
          a case-by-case basis, reviewed by the Election Chairs and a subcommittee.
        </p>
      </div>

      {/* ── What Board Members Do ──────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          What Board Members Do
        </h2>
        <p className="text-neutral-500 mb-6">
          Board members set the strategic direction and manage the day-to-day
          operations of US-RSE. Expected commitments include:
        </p>

        <div className="space-y-2.5">
          {responsibilities.map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm text-neutral-600">
              <svg className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── Voting Method ──────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Voting Method
        </h2>
        <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 mb-1">
                Single Transferable Vote (STV)
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Voters rank candidates by preference. Seats are allocated based on
                preference rankings, ensuring proportional representation. Elections
                are administered via ElectionBuddy. Each eligible member receives
                one ballot.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact ────────────────────────────────────────────────── */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-100">
        <h3 className="font-bold text-neutral-900 mb-1">Questions?</h3>
        <p className="text-sm text-neutral-600 mb-3">
          Reach out to the Election Chairs:
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <a
            href="mailto:cdcore@uw.edu"
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            Cordero Core
          </a>
          <a
            href="mailto:mmundt@sandia.gov"
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            Miranda Mundt
          </a>
        </div>
      </div>
    </AboutLayout>
  );
}
