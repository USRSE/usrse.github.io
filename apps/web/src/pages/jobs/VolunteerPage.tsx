import { Link } from "react-router-dom";
import { JobsLayout } from "@/components/jobs/JobsLayout";
import { useInView } from "@/hooks/useInView";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "6", label: "Ways to contribute" },
  { value: "10+", label: "Working groups" },
  { value: "Zero", label: "Application forms" },
  { value: "Your pace", label: "Time commitment" },
];

interface Opportunity {
  num: string;
  tag: string;
  title: string;
  desc: string;
  commitment: string;
  accent: "teal" | "purple";
}

const opportunities: Opportunity[] = [
  {
    num: "01",
    tag: "#ongoing",
    title: "Working group participation",
    desc: "Join any active group — Code Review, DEI, Testing, Education & Training, Mentorship, and more. Each group sets its own cadence and welcomes new contributors at any time.",
    commitment: "1–2 hrs/month",
    accent: "teal",
  },
  {
    num: "02",
    tag: "#conference",
    title: "Conference organizing",
    desc: "Help plan USRSE'26 and beyond. Roles span proposal review, logistics, program committee service, session moderation, and day-of support.",
    commitment: "Seasonal",
    accent: "purple",
  },
  {
    num: "03",
    tag: "#mentorship",
    title: "Mentorship",
    desc: "Mentor newer RSEs through the program, or share expertise via community calls and lightning talks. Relationships are flexible — you set the pace and format.",
    commitment: "Flexible",
    accent: "teal",
  },
  {
    num: "04",
    tag: "#code",
    title: "Website & infrastructure",
    desc: "Contribute to the US-RSE website, documentation, or community tools. The site is open source on GitHub. Pull requests of all sizes welcome — typo fixes to new features.",
    commitment: "Self-paced",
    accent: "purple",
  },
  {
    num: "05",
    tag: "#outreach",
    title: "Outreach & advocacy",
    desc: "Spread the word about RSE careers through writing, speaking, K-12 outreach, or social. Represent US-RSE at partner events and contribute to newsletters.",
    commitment: "Project-based",
    accent: "teal",
  },
  {
    num: "06",
    tag: "#events",
    title: "Event support",
    desc: "Help run community calls, affinity meetups, or regional events. From scheduling and Zoom moderation to curating discussion topics. Great for behind-the-scenes work.",
    commitment: "Recurring",
    accent: "purple",
  },
];

const accentMap = {
  teal: {
    border: "border-teal-500",
    num: "text-teal-600",
    eyebrow: "text-teal-700",
    chip: "bg-teal-50 text-teal-800 border-teal-100",
  },
  purple: {
    border: "border-purple-500",
    num: "text-purple-600",
    eyebrow: "text-purple-600",
    chip: "bg-purple-50 text-purple-800 border-purple-100",
  },
};

interface StartStep {
  num: string;
  title: string;
  desc: string;
}

const startSteps: StartStep[] = [
  {
    num: "01",
    title: "Join Slack",
    desc: "The US-RSE workspace is where the community lives day-to-day.",
  },
  {
    num: "02",
    title: "Introduce yourself",
    desc: "Drop a hello in #general — what you do, what brought you here.",
  },
  {
    num: "03",
    title: "Show up",
    desc: "Join a working group channel, attend a call, or reply to an ask.",
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
    eyebrow: "Where work happens",
    title: "Working Groups",
    teaser: "The active groups doing day-to-day community work.",
    path: "/community/working-groups",
  },
  {
    eyebrow: "Belonging",
    title: "Affinity Groups",
    teaser: "Communities within the community for support and growth.",
    path: "/community/affinity-groups",
  },
  {
    eyebrow: "Connect",
    title: "Community Calls",
    teaser: "The monthly rhythm where most volunteer work begins.",
    path: "/community/calls",
  },
  {
    eyebrow: "How we run",
    title: "Governance",
    teaser: "How decisions get made — and how to take on more.",
    path: "/about/governance",
  },
];

export function VolunteerPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: whyRef, isInView: whyInView } = useInView(0.1);
  const { ref: oppsRef, isInView: oppsInView } = useInView(0.05);
  const { ref: startRef, isInView: startInView } = useInView(0.1);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <JobsLayout
      title="Volunteer with US-RSE"
      subtitle="Contribute your skills to strengthen the research software engineering community."
      prevPage={{ path: "/jobs/submit", label: "Post a Job" }}
      nextPage={null}
    >
      {/* ── The stance — built by the people who show up ─────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          The community runs on volunteers
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-10 text-balance max-w-4xl">
          US-RSE is built by the people{" "}
          <span className="text-teal-700">who show up.</span>
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          Every working group, conference, and community initiative exists
          because someone volunteered their time. There&rsquo;s no application
          form &mdash; just channels you can join and asks you can answer.
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
            } ${i % 2 !== 0 ? "border-l border-neutral-200 md:border-l" : ""} ${
              i >= 2 ? "border-t border-neutral-200 md:border-t-0" : ""
            }`}
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

      {/* ── Why volunteer — pull quote ───────────────────────────── */}
      <section
        ref={whyRef}
        className="mb-20 py-16 border-y-2 border-neutral-900 bg-teal-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className={whyInView ? "animate-slide-up" : "opacity-0"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
            Why volunteer
          </p>
          <blockquote className="font-display text-2xl lg:text-[2rem] font-bold text-neutral-900 leading-[1.15] tracking-tight mb-8 text-balance max-w-4xl">
            &ldquo;The fastest way to belong to this community is to help
            shape it &mdash; and the bar to start is genuinely low.&rdquo;
          </blockquote>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 max-w-4xl">
            <p className="text-base text-neutral-600 leading-relaxed">
              Volunteering with US-RSE is how most members find their people.
              You meet the others doing the work you care about, you grow
              skills outside your day job, and you build the network that
              follows you across institutions and roles.
            </p>
            <p className="text-base text-neutral-600 leading-relaxed">
              No expertise is required &mdash; only care. Working groups
              welcome newcomers explicitly. Mentorship is available in both
              directions. The smallest contribution moves the field forward.
            </p>
          </div>
        </div>
      </section>

      {/* ── Six ways to contribute — 2×3 pillar grid ─────────────── */}
      <section ref={oppsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Ways to contribute
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            06 paths in
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Six ways to plug in.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Pick one. Pick three. Switch later. Each path has its own rhythm
          and welcomes new contributors at any time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {opportunities.map((o, i) => {
            const a = accentMap[o.accent];
            return (
              <article
                key={o.num}
                className={`bg-white pt-9 pb-10 px-6 md:px-8 border-t-2 ${a.border} ${
                  oppsInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <span
                    className={`font-display text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${a.num}`}
                  >
                    {o.num}
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.18em] ${a.eyebrow}`}
                  >
                    {o.tag}
                  </span>
                </div>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight mb-3">
                  {o.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-6 max-w-md">
                  {o.desc}
                </p>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.2em] inline-block px-2 py-0.5 rounded-full border ${a.chip}`}
                >
                  {o.commitment}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Getting started — 3 simple steps ─────────────────────── */}
      <section ref={startRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
            Getting started
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            03 steps
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Less than an hour.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          There&rsquo;s no formal application. Most volunteers start the same
          way &mdash; here&rsquo;s the path of least resistance.
        </p>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
            {startSteps.map((s, i) => (
              <article
                key={s.num}
                className={`bg-white pt-7 pb-8 px-6 ${
                  startInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 tabular-nums">
                  Step {s.num}
                </span>
                <h3 className="font-display text-lg lg:text-xl font-bold text-neutral-900 tracking-tight mt-2 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed max-w-xs">
                  {s.desc}
                </p>
              </article>
            ))}
          </div>

          {/* Inter-step arrows — overlay so they paint above all cards */}
          {[1, 2].map((boundary) => (
            <span
              key={boundary}
              className="hidden md:flex absolute top-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-white rounded-full border border-neutral-200 text-neutral-400 pointer-events-none"
              style={{ left: `${(boundary / 3) * 100}%` }}
              aria-hidden="true"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          ))}
        </div>

        {/* Inline contact note */}
        <p className="text-sm text-neutral-500 leading-relaxed mt-8 max-w-2xl">
          Not sure where you fit? Email the community team at{" "}
          <a
            href="mailto:contact@us-rse.org"
            className="font-semibold text-neutral-800 hover:text-teal-700 transition-colors"
          >
            contact@us-rse.org
          </a>{" "}
          &mdash; we&rsquo;ll point you toward the right channel.
        </p>
      </section>

      {/* ── CTA — join Slack ─────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Front door
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Slack is where it starts.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Every working group, every event, every project lives in the US-RSE
          Slack workspace. Join, say hi, and find your people.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="https://us-rse.org/join"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Join the Slack
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </a>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>or</span>
            <Link
              to="/community/working-groups"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Browse working groups
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/community/calls"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Attend a community call
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
          Where volunteer work actually happens.
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
    </JobsLayout>
  );
}
