import { Link } from "react-router-dom";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";
import { useGroups } from "@/hooks/useGroups";

interface RegionalGroup {
  num: string;
  name: string;
  region: string;
  description: string;
}

const regionalGroups: RegionalGroup[] = [
  {
    num: "01",
    name: "DMV-RSE",
    region: "Mid-Atlantic",
    description:
      "Delaware-Maryland-Virginia regional group organizing local meetups, talks, and networking for RSEs in the capital region.",
  },
  {
    num: "02",
    name: "North Carolina Regional Group",
    region: "Southeast",
    description:
      "Local events, meetups, and collaboration opportunities for RSEs based in North Carolina.",
  },
  {
    num: "03",
    name: "St. Louis Metro Regional Group",
    region: "Midwest",
    description:
      "Bringing together RSEs in the greater St. Louis metropolitan area for local events and community building.",
  },
];

const pillarAccent = {
  teal: { border: "border-teal-500", num: "text-teal-600", tag: "text-teal-700" },
  purple: { border: "border-purple-500", num: "text-purple-500", tag: "text-purple-600" },
};

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "07", label: "Active groups" },
  { value: "04", label: "Interest-based" },
  { value: "03", label: "Regional" },
  { value: "Member-initiated", label: "Every group" },
];

interface StartStep {
  num: string;
  title: string;
  detail: string;
}

const startSteps: StartStep[] = [
  {
    num: "01",
    title: "Gauge interest",
    detail: "Post in the #affinity-groups or #working-groups Slack channel and see who shows up.",
  },
  {
    num: "02",
    title: "Get logistical support",
    detail: "The Group Management working group helps you scope, charter, and launch new groups.",
  },
  {
    num: "03",
    title: "Launch",
    detail: "Groups typically need a chair, a Slack channel, and a brief charter to get started.",
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
    eyebrow: "Values",
    title: "DEI Statement",
    teaser: "The commitments shaping inclusion across every group.",
    path: "/about/dei",
  },
  {
    eyebrow: "Helping",
    title: "Volunteer",
    teaser: "Help run events, programs, and community infrastructure.",
    path: "/jobs/volunteer",
  },
];

export function AffinityGroupsPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: affinityRef, isInView: affinityInView } = useInView(0.05);
  const { ref: regionalRef, isInView: regionalInView } = useInView(0.05);
  const { ref: startRef, isInView: startInView } = useInView(0.1);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);
  const { rows: affinityGroups, loading, error } = useGroups("affinity_group");

  if (loading) {
    return (
      <CommunityLayout
        title="Affinity Groups"
        subtitle="Spaces for members who share identities, interests, or geography to connect and support each other."
      >
        <p className="text-gray-500">Loading…</p>
      </CommunityLayout>
    );
  }
  if (error) {
    return (
      <CommunityLayout
        title="Affinity Groups"
        subtitle="Spaces for members who share identities, interests, or geography to connect and support each other."
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
  if (!affinityGroups) return null;

  return (
    <CommunityLayout
      title="Affinity Groups"
      subtitle="Spaces for members who share identities, interests, or geography to connect and support each other."
      prevPage={{
        path: "/community/working-groups",
        label: "Working Groups",
      }}
      nextPage={{
        path: "/community/calls",
        label: "Community Calls",
        teaser: "Monthly virtual gatherings",
      }}
    >
      {/* ── The stance — manifesto + framing ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          Find your people
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          A community, with communities inside it.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          Working groups produce outputs. Affinity groups produce belonging.
          Each one is a space for members who share an identity, a research
          domain, a programming language, or a place on the map to connect,
          compare notes, and celebrate together.
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

      {/* ── Find your people — 4 affinity groups ─────────────────── */}
      <section ref={affinityRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Interest &amp; identity
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {affinityGroups.length.toString().padStart(2, "0")} groups
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Find your people.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {affinityGroups.map((g, i) => {
            const a = i % 2 === 0 ? pillarAccent.teal : pillarAccent.purple;
            const num = String(i + 1).padStart(2, "0");
            return (
              <Link
                key={g.id}
                to={`/community/groups/${g.id}`}
                className={`bg-white pt-9 pb-10 px-6 md:px-8 border-t-2 ${a.border} hover:bg-neutral-50/60 transition-colors ${
                  affinityInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="flex items-baseline justify-between mb-5">
                  <p
                    className={`font-mono text-[11px] uppercase tracking-[0.2em] ${a.tag}`}
                  >
                    Affinity group
                  </p>
                  <span
                    className={`font-display text-sm font-bold tabular-nums ${a.num}`}
                  >
                    {num}
                  </span>
                </div>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight leading-[1.2] mb-4 text-balance">
                  {g.name}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {g.description ?? ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Find your region — 3 regional groups ─────────────────── */}
      <section ref={regionalRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Geographic
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {regionalGroups.length.toString().padStart(2, "0")} chapters
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Find your region.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
          {regionalGroups.map((g, i) => {
            const a = i % 2 === 0 ? pillarAccent.teal : pillarAccent.purple;
            return (
              <article
                key={g.num}
                className={`bg-white pt-8 pb-9 px-6 md:px-7 border-t-2 ${a.border} ${
                  regionalInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="flex items-baseline justify-between mb-5">
                  <p
                    className={`font-mono text-[11px] uppercase tracking-[0.2em] ${a.tag}`}
                  >
                    {g.region}
                  </p>
                  <span
                    className={`font-display text-sm font-bold tabular-nums ${a.num}`}
                  >
                    {g.num}
                  </span>
                </div>
                <h3 className="font-display text-lg lg:text-xl font-bold text-neutral-900 tracking-tight leading-[1.2] mb-3 text-balance">
                  {g.name}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {g.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Start a new group — 3-step CTA ───────────────────────── */}
      <section ref={startRef} className="mb-20 pt-12 border-t border-neutral-100">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Don&rsquo;t see your community?
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Start one.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          US-RSE members can propose new affinity groups around any shared
          identity, interest, or region. The process is lightweight and
          community-driven.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 mb-10">
          {startSteps.map((s, i) => (
            <div
              key={s.num}
              className={`bg-white p-6 md:p-7 ${
                startInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 tabular-nums mb-3">
                Step {s.num}
              </p>
              <h3 className="font-display text-xl font-bold text-neutral-900 tracking-tight mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {s.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="mailto:info@us-rse.org?subject=Proposal%20for%20a%20new%20affinity%20group"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Contact Group Management
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
            Or post in the #affinity-groups Slack channel
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
