import { Link } from "react-router-dom";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "$100–10k", label: "Proposal range" },
  { value: "$2,500", label: "Most awards under" },
  { value: "Quarterly", label: "Review cycle" },
  { value: "04", label: "Program goals" },
];

interface Goal {
  num: string;
  title: string;
  body: string;
  accent: "teal" | "purple";
}

const goals: Goal[] = [
  {
    num: "01",
    title: "Expand & diversify",
    body: "Grow and diversify the US-RSE community by supporting activities that reach new audiences and underrepresented groups.",
    accent: "teal",
  },
  {
    num: "02",
    title: "Foster connections",
    body: "Strengthen relationships within the community through events, meetups, and collaborative projects.",
    accent: "purple",
  },
  {
    num: "03",
    title: "Support career development",
    body: "Help members develop professional skills through training, certifications, and conference attendance.",
    accent: "teal",
  },
  {
    num: "04",
    title: "Elevate RSE visibility",
    body: "Raise the profile of research software engineering through outreach, media production, and sponsorships.",
    accent: "purple",
  },
];

const goalAccent = {
  teal: { border: "border-teal-500", num: "text-teal-600" },
  purple: { border: "border-purple-500", num: "text-purple-500" },
};

interface Activity {
  title: string;
  detail: string;
}

const eligibleActivities: Activity[] = [
  {
    title: "Local events",
    detail: "Workshops, regional meetups, and chapter gatherings.",
  },
  {
    title: "Training & certifications",
    detail: "Professional development programs and certifications.",
  },
  {
    title: "Conference travel",
    detail: "Attendance and travel support for community members.",
  },
  {
    title: "Media production",
    detail: "Podcasts, videos, and written content about RSE work.",
  },
  {
    title: "Working group infrastructure",
    detail: "Tooling, software, and systems that keep groups running.",
  },
  {
    title: "Visibility sponsorships",
    detail: "Sponsorships that promote RSE recognition at external events.",
  },
];

interface ProcessStep {
  num: string;
  title: string;
  body: string;
}

const processSteps: ProcessStep[] = [
  {
    num: "01",
    title: "Submit",
    body: "Applications are evaluated quarterly. Proposals describe the activity, expected community impact, a budget, and a brief timeline.",
  },
  {
    num: "02",
    title: "Review",
    body: "Each proposal is assessed on community impact, mission alignment, funding availability, and the applicant's qualifications.",
  },
  {
    num: "03",
    title: "Report",
    body: "Successful applicants submit a brief post-activity report, which US-RSE publishes to share outcomes with the community.",
  },
];

const eligibility = [
  "Applicants must be current US-RSE members.",
  "Individual funding is limited to once per rolling 12-month period.",
  "Travel covers economy airfare, hotel, and registration only — meals and per diem are not covered.",
  "Most awards are $2,500 or less; proposals up to $10,000 are considered for larger initiatives.",
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Funders",
    title: "Sponsors",
    teaser: "The funders and partners that make this program possible.",
    path: "/about/sponsors",
  },
  {
    eyebrow: "Accountability",
    title: "Financial Status",
    teaser: "The full picture of how US-RSE&rsquo;s money flows.",
    path: "/about/financial-status",
  },
  {
    eyebrow: "Where funds land",
    title: "Upcoming Events",
    teaser: "Some of what the Community Funds make possible.",
    path: "/events/upcoming",
  },
  {
    eyebrow: "Helping",
    title: "Volunteer",
    teaser: "Another way to contribute beyond applying for funds.",
    path: "/jobs/volunteer",
  },
];

export function CommunityFundsPage() {
  const { ref: statusRef, isInView: statusInView } = useInView(0.2);
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: goalsRef, isInView: goalsInView } = useInView(0.05);
  const { ref: activitiesRef, isInView: activitiesInView } = useInView(0.05);
  const { ref: processRef, isInView: processInView } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <CommunityLayout
      title="Community Funds"
      subtitle="Financial support for activities that grow and strengthen the RSE community."
      prevPage={{
        path: "/community/awards",
        label: "Community Awards",
      }}
      nextPage={null}
    >
      {/* ── Status callout — applications paused ─────────────────── */}
      <section
        ref={statusRef}
        className={`mb-14 p-6 md:p-7 rounded-xl bg-warning-50 border border-warning-500/40 ${
          statusInView ? "animate-fade-in" : "opacity-0"
        }`}
        role="status"
      >
        <div className="flex items-start gap-4">
          <span
            className="shrink-0 mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-warning-500 text-neutral-900 font-bold text-lg"
            aria-hidden="true"
          >
            !
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-warning-700 mb-1.5">
              Current status
            </p>
            <p className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight mb-2">
              Applications are paused.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed max-w-2xl">
              The Community Funds program is not currently accepting
              applications. What&rsquo;s below describes how the program
              works when it&rsquo;s active &mdash; scroll to the bottom to
              get notified when it reopens, or follow announcements on Slack
              and the US-RSE newsletter.
            </p>
          </div>
        </div>
      </section>

      {/* ── The stance — manifesto ───────────────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          Funding that builds the community
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          Small grants, big community effects.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          Supported by the Alfred P. Sloan Foundation, the Community Funds
          program puts money behind member-led ideas that expand, diversify,
          and strengthen the RSE community &mdash; from regional meetups to
          training programs to conference travel support.
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

      {/* ── Program goals — 2×2 pillar blocks ────────────────────── */}
      <section ref={goalsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What the program is for
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Four goals.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {goals.map((g, i) => {
            const a = goalAccent[g.accent];
            return (
              <article
                key={g.num}
                className={`bg-white pt-10 pb-12 px-6 md:px-8 border-t-2 ${a.border} ${
                  goalsInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span
                  className={`font-display text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${a.num}`}
                >
                  {g.num}
                </span>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 mt-5 mb-3 tracking-tight">
                  {g.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed max-w-md">
                  {g.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── What it funds — 6 eligible activities grid ───────────── */}
      <section ref={activitiesRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What it funds
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {eligibleActivities.length.toString().padStart(2, "0")} categories
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Eligible activities.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          The program supports a wide range of community-building work.
          Examples include but aren&rsquo;t limited to:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200">
          {eligibleActivities.map((a, i) => {
            const acc = i % 2 === 0 ? goalAccent.teal : goalAccent.purple;
            return (
              <article
                key={a.title}
                className={`bg-white pt-7 pb-8 px-5 md:px-6 border-t-2 ${acc.border} ${
                  activitiesInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <p
                  className={`font-mono text-[10px] uppercase tracking-[0.2em] tabular-nums ${acc.num} mb-3`}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight mb-2">
                  {a.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {a.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── How it works — process timeline + eligibility ────────── */}
      <section ref={processRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            How it works
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Three steps. Quarterly cycle.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          The Community Funds review process is intentionally lightweight
          so that small, time-sensitive proposals don&rsquo;t get lost in
          bureaucracy.
        </p>

        {/* 3-step timeline — horizontal process flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 mb-12">
          {processSteps.map((s, i) => (
            <div
              key={s.num}
              className={`bg-white p-6 md:p-7 ${
                processInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 tabular-nums mb-3">
                Step {s.num}
              </p>
              <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight mb-3">
                {s.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* Eligibility rules */}
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-600 mb-4">
            Eligibility &amp; limits
          </p>
          <ul className="space-y-3">
            {eligibility.map((rule, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr] gap-4 items-baseline"
              >
                <span className="font-mono text-[11px] text-purple-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {rule}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Notify me CTA — turning the pause into lead capture ── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Want to know when it reopens?
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Get on the list.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Applications are paused for now. We&rsquo;ll send a note when the
          program reopens &mdash; or you can follow announcements directly
          on Slack and in the monthly newsletter.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="mailto:info@us-rse.org?subject=Notify%20me%20about%20Community%20Funds"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Notify me when applications reopen
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
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            Or follow announcements on Slack &amp; newsletter
          </p>
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
          Follow the money &mdash; in and out.
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
                <p
                  className="text-sm text-neutral-500"
                  dangerouslySetInnerHTML={{ __html: b.teaser }}
                />
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
