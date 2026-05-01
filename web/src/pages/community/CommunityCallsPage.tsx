import { Link } from "react-router-dom";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "12", label: "Calls per year" },
  { value: "60 min", label: "Each call" },
  { value: "All members", label: "Welcome" },
  { value: "02", label: "Co-chairs" },
];

interface ScheduleBlock {
  eyebrow: string;
  day: string;
  time: string;
  months: string[];
  accent: "teal" | "purple";
}

const scheduleBlocks: ScheduleBlock[] = [
  {
    eyebrow: "Odd months",
    day: "Second Thursday",
    time: "12:00 – 1:00 PM ET",
    months: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
    accent: "teal",
  },
  {
    eyebrow: "Even months",
    day: "Second Friday",
    time: "2:00 – 3:00 PM ET",
    months: ["Feb", "Apr", "Jun", "Aug", "Oct", "Dec"],
    accent: "purple",
  },
];

const scheduleAccent = {
  teal: { border: "border-teal-500", eyebrow: "text-teal-700", chip: "bg-teal-50 text-teal-800 border-teal-100" },
  purple: { border: "border-purple-500", eyebrow: "text-purple-600", chip: "bg-purple-50 text-purple-800 border-purple-100" },
};

interface Pathway {
  num: string;
  title: string;
  detail: string;
  accent: "teal" | "purple";
}

const topicPathways: Pathway[] = [
  {
    num: "01",
    title: "Browse or submit",
    detail: "The working group maintains a public GitHub Issues list of topic ideas — browse, upvote, or add your own.",
    accent: "teal",
  },
  {
    num: "02",
    title: "Volunteer to present",
    detail: "Community calls welcome speakers at every career stage — from first-year PhDs to national lab directors.",
    accent: "purple",
  },
  {
    num: "03",
    title: "Suggest a theme",
    detail: "Drop an idea in the #wg-community-calls Slack channel and see what resonates with the group.",
    accent: "teal",
  },
];

const joinPathways: Pathway[] = [
  {
    num: "01",
    title: "Slack",
    detail: "Join the #wg-community-calls channel on the US-RSE Slack workspace to get meeting links and updates.",
    accent: "teal",
  },
  {
    num: "02",
    title: "Email",
    detail: "Reach the working group directly at wg-community-calls@us-rse.org for questions or speaker proposals.",
    accent: "purple",
  },
  {
    num: "03",
    title: "Just show up",
    detail: "All US-RSE members are welcome. No sign-up required — just join the call when it happens.",
    accent: "teal",
  },
];

const pillarAccent = {
  teal: { border: "border-teal-500", num: "text-teal-600" },
  purple: { border: "border-purple-500", num: "text-purple-500" },
};

interface CoChair {
  name: string;
  org: string;
  photo: string;
}

const coChairs: CoChair[] = [
  {
    name: "Julia Damerow",
    org: "Arizona State University",
    photo: "/images/board-of-directors/julia-damerow.jpeg",
  },
  {
    name: "Abbey Roelofs",
    org: "University of Michigan",
    photo: "/images/board-of-directors/abbey-roelofs.jpeg",
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
    eyebrow: "Events",
    title: "Upcoming Events",
    teaser: "Every upcoming gathering, in one place.",
    path: "/events/upcoming",
  },
  {
    eyebrow: "Focus",
    title: "Working Groups",
    teaser: "Where the real work happens between calls.",
    path: "/community/working-groups",
  },
  {
    eyebrow: "Access",
    title: "Community Funds",
    teaser: "Travel support and financial access for members.",
    path: "/community/funds",
  },
  {
    eyebrow: "Helping",
    title: "Volunteer",
    teaser: "Help run events, programs, and community infrastructure.",
    path: "/jobs/volunteer",
  },
];

export function CommunityCallsPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: scheduleRef, isInView: scheduleInView } = useInView(0.1);
  const { ref: topicsRef, isInView: topicsInView } = useInView(0.1);
  const { ref: joinRef, isInView: joinInView } = useInView(0.1);
  const { ref: chairsRef, isInView: chairsInView } = useInView(0.1);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <CommunityLayout
      title="Community Calls"
      subtitle="Monthly virtual meetings to connect, share, and discuss topics that matter to the RSE community."
      prevPage={{
        path: "/community/affinity-groups",
        label: "Affinity Groups",
      }}
      nextPage={{
        path: "/community/awards",
        label: "Community Awards",
        teaser: "Recognizing outstanding contributions",
      }}
    >
      {/* ── The stance — manifesto ───────────────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          Once a month, the whole community in one room
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          The heartbeat of US-RSE.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          Once a month, the community gathers for a virtual call with an
          invited speaker, a small-group breakout, and the conversations you
          don&rsquo;t get anywhere else. Open to every member &mdash; no
          signup, no gatekeeping.
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
            <p className="font-display text-xl lg:text-2xl font-bold text-teal-700 tracking-tight leading-none tabular-nums">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2.5">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── Schedule — 2 upgraded month cards ────────────────────── */}
      <section ref={scheduleRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            When
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          A rotating schedule, twice the accessibility.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          We alternate meeting day and time across the year so members in
          every timezone &mdash; and every calendar conflict &mdash; have
          months that work for them.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {scheduleBlocks.map((b, i) => {
            const a = scheduleAccent[b.accent];
            return (
              <article
                key={b.eyebrow}
                className={`bg-white pt-10 pb-10 px-6 md:px-8 border-t-2 ${a.border} ${
                  scheduleInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <p
                  className={`font-mono text-[11px] uppercase tracking-[0.2em] ${a.eyebrow} mb-4`}
                >
                  {b.eyebrow}
                </p>
                <p className="font-display text-3xl lg:text-[2.25rem] font-bold text-neutral-900 tracking-tight leading-[1.1] mb-3 text-balance">
                  {b.day}
                </p>
                <p className="font-mono text-sm text-neutral-700 mb-6">
                  {b.time}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {b.months.map((m) => (
                    <span
                      key={m}
                      className={`font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${a.chip}`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Topics & suggestions — 3 pathway blocks ──────────────── */}
      <section ref={topicsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What we talk about
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Topics are driven by the community.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Past sessions have covered CI/CD best practices, navigating RSE
          career paths, HPC performance, testing strategies, and more. Got
          an idea? There are three ways to surface it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
          {topicPathways.map((p, i) => {
            const a = pillarAccent[p.accent];
            return (
              <article
                key={p.num}
                className={`bg-white pt-9 pb-10 px-6 md:px-7 border-t-2 ${a.border} ${
                  topicsInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span
                  className={`font-display text-3xl font-black tracking-tight tabular-nums ${a.num}`}
                >
                  {p.num}
                </span>
                <h3 className="font-display text-lg lg:text-xl font-bold text-neutral-900 mt-4 mb-3 tracking-tight">
                  {p.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {p.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── How to join — 3 pillar blocks ────────────────────────── */}
      <section ref={joinRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            How to join
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Three doors in.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
          {joinPathways.map((p, i) => {
            const a = pillarAccent[p.accent];
            return (
              <article
                key={p.num}
                className={`bg-white pt-9 pb-10 px-6 md:px-7 border-t-2 ${a.border} ${
                  joinInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span
                  className={`font-display text-3xl font-black tracking-tight tabular-nums ${a.num}`}
                >
                  {p.num}
                </span>
                <h3 className="font-display text-lg lg:text-xl font-bold text-neutral-900 mt-4 mb-3 tracking-tight">
                  {p.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {p.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Co-chairs — humanized cards ─────────────────────────── */}
      <section ref={chairsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Who runs the calls
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          The co-chairs.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {coChairs.map((c, i) => (
            <div
              key={c.name}
              className={`group bg-white p-6 md:p-7 border-t-2 border-teal-500 flex items-start gap-5 ${
                chairsInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative overflow-hidden rounded-xl w-20 h-20 md:w-24 md:h-24 bg-neutral-100 shrink-0">
                <img
                  src={c.photo}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover object-top grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-1.5">
                  Community Calls Co-Chair
                </p>
                <p className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight leading-tight mb-1">
                  {c.name}
                </p>
                <p className="text-sm text-neutral-500 mb-3">{c.org}</p>
                <a
                  href="mailto:wg-community-calls@us-rse.org"
                  className="inline-flex items-center gap-1.5 font-mono text-[12px] text-teal-700 hover:text-teal-900 transition-colors"
                >
                  wg-community-calls@us-rse.org
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
          The rest of how the community shows up.
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
    </CommunityLayout>
  );
}
