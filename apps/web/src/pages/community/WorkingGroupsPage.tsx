import { Link } from "react-router-dom";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";
import { useGroups } from "@/hooks/useGroups";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "10", label: "Active groups" },
  { value: "All members", label: "Can join" },
  { value: "Slack", label: "Coordination" },
  { value: "Volunteer-led", label: "Every group" },
];

interface Pathway {
  num: string;
  eyebrow: string;
  title: string;
  lead: string;
  ctaLabel: string;
  ctaHref: string;
  accent: "teal" | "purple";
}

const pathways: Pathway[] = [
  {
    num: "01",
    eyebrow: "Join an existing group",
    title: "Hop into the conversation.",
    lead: "Browse the #working-groups channel on Slack, attend a group's next meeting, or contact a group chair directly. Most meetings are open to all members.",
    ctaLabel: "Email for a Slack invite",
    ctaHref: "mailto:info@us-rse.org?subject=Slack%20invite%20for%20working%20groups",
    accent: "teal",
  },
  {
    num: "02",
    eyebrow: "Propose a new group",
    title: "Start something new.",
    lead: "Have an idea that doesn't fit an existing group? The Group Management working group helps members scope, staff, and launch new ones.",
    ctaLabel: "Contact Group Management",
    ctaHref: "mailto:info@us-rse.org?subject=Proposal%20for%20a%20new%20working%20group",
    accent: "purple",
  },
];

const pathwayAccent = {
  teal: { border: "border-teal-500", num: "text-teal-600", hover: "group-hover:text-teal-700" },
  purple: { border: "border-purple-500", num: "text-purple-500", hover: "group-hover:text-purple-700" },
};

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Connection",
    title: "Community Calls",
    teaser: "Monthly virtual gatherings across the whole network.",
    path: "/community/calls",
  },
  {
    eyebrow: "Recognition",
    title: "Community Awards",
    teaser: "How the community honors its own.",
    path: "/community/awards",
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
    teaser: "Help run the events, programs, and infrastructure.",
    path: "/jobs/volunteer",
  },
];

export function WorkingGroupsPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: groupsRef, isInView: groupsInView } = useInView(0.05);
  const { ref: pathwaysRef, isInView: pathwaysInView } = useInView(0.1);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);
  const { rows, loading, error } = useGroups("working_group");

  if (loading) {
    return (
      <CommunityLayout
        title="Working Groups"
        subtitle="Community-led teams tackling the challenges Research Software Engineers face every day."
      >
        <p className="text-gray-500">Loading…</p>
      </CommunityLayout>
    );
  }
  if (error) {
    return (
      <CommunityLayout
        title="Working Groups"
        subtitle="Community-led teams tackling the challenges Research Software Engineers face every day."
      >
        <p className="text-red-700">
          Group list temporarily unavailable.{" "}
          <button
            onClick={() => window.location.reload()}
            className="underline"
          >
            Retry
          </button>
        </p>
      </CommunityLayout>
    );
  }
  if (!rows) return null;

  const workingGroups = rows;
  const midpoint = Math.ceil(workingGroups.length / 2);
  const leftColumn = workingGroups.slice(0, midpoint);
  const rightColumn = workingGroups.slice(midpoint);

  return (
    <CommunityLayout
      title="Working Groups"
      subtitle="Community-led teams tackling the challenges Research Software Engineers face every day."
      nextPage={{
        path: "/community/affinity-groups",
        label: "Affinity Groups",
        teaser: "Identity and regional communities",
      }}
    >
      {/* ── The stance — manifesto + framing ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          Where the community does the work
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          Working groups are where the real work happens.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          Every program, every policy, and every piece of infrastructure
          members rely on starts as a conversation inside a working group.
          Each one is volunteer-led, open to all members, and coordinates on
          Slack.
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
            <p className="font-display text-xl lg:text-2xl font-bold text-teal-700 tracking-tight leading-none">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2.5">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── The 10 working groups — refined two-column ────────── */}
      <section ref={groupsRef} className="mb-16">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            The groups
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {workingGroups.length.toString().padStart(2, "0")} active
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Ten places to plug in.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
          {[leftColumn, rightColumn].map((column, colIdx) => (
            <div key={colIdx}>
              {column.map((wg, i) => {
                const globalIdx = colIdx === 0 ? i : i + midpoint;
                const isLast = i === column.length - 1;
                return (
                  <div
                    key={wg.id}
                    className={`py-6 ${!isLast ? "border-b border-neutral-100" : ""} ${
                      groupsInView ? "animate-slide-up" : "opacity-0"
                    }`}
                    style={{ animationDelay: `${globalIdx * 50}ms` }}
                  >
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-mono text-xs text-teal-600 tabular-nums shrink-0">
                        {String(globalIdx + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight">
                        {wg.name}
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed pl-8">
                      {wg.description ?? ""}
                    </p>
                    <Link
                      to={`/community/groups/${wg.id}`}
                      className="group inline-flex items-center gap-1.5 mt-2 pl-8 font-mono text-[11px] uppercase tracking-wider text-teal-700 hover:text-teal-900 transition-colors"
                    >
                      View page
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
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Engagement footer — honest Slack instruction replacing the broken per-group links */}
        <div className="mt-12 p-6 rounded-xl bg-teal-50/50 border border-teal-100">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-2">
            Want to join a group?
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed max-w-2xl">
            Most groups coordinate in the{" "}
            <span className="font-mono text-[12px] px-1.5 py-0.5 rounded bg-white border border-teal-200 text-teal-800">
              #working-groups
            </span>{" "}
            channel on Slack &mdash; meeting links, notes, and group chairs
            all post there. Email{" "}
            <a
              href="mailto:info@us-rse.org?subject=Slack%20invite%20for%20working%20groups"
              className="text-teal-700 hover:text-teal-900 font-medium transition-colors"
            >
              info@us-rse.org
            </a>{" "}
            for a Slack invite.
          </p>
        </div>
      </section>

      {/* ── Start or join — two-pathway CTA ──────────────────────── */}
      <section ref={pathwaysRef} className="mb-20 pt-12 border-t border-neutral-100">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Start or join
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Hop into what&rsquo;s running. Or start something new.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Two paths in &mdash; pick the one that fits.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {pathways.map((p, i) => {
            const a = pathwayAccent[p.accent];
            return (
              <a
                key={p.num}
                href={p.ctaHref}
                className={`group relative bg-white pt-9 pb-8 px-6 md:px-7 border-t-2 ${a.border} flex flex-col hover:bg-neutral-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 transition-colors ${
                  pathwaysInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-baseline justify-between mb-5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500">
                    {p.eyebrow}
                  </span>
                  <span
                    className={`font-display text-sm font-bold tabular-nums ${a.num}`}
                  >
                    {p.num}
                  </span>
                </div>
                <h3 className="font-display text-2xl lg:text-[1.6rem] font-bold text-neutral-900 leading-[1.15] tracking-tight mb-4 text-balance">
                  {p.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-8 text-pretty">
                  {p.lead}
                </p>
                <span
                  className={`mt-auto inline-flex items-center gap-2 font-semibold text-sm text-neutral-900 ${a.hover} transition-colors`}
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
