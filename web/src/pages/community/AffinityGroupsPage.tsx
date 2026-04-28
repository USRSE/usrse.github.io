import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";

const affinityGroups = [
  {
    name: "RSE Group Leaders' Network (RSE-GLN)",
    description:
      "A space for leaders of RSE teams to share management strategies, organizational challenges, and successes. Includes the Aspiring RSE-GLN for those building toward leadership roles.",
    type: "Leadership",
  },
  {
    name: "Neuro-RSE",
    description:
      "Connecting research software engineers working in neuroscience — sharing tools, workflows, and domain-specific challenges.",
    type: "Domain",
  },
  {
    name: "R-RSE",
    description:
      "Increasing R user representation within US-RSE and fostering collaboration among R-focused research software engineers.",
    type: "Language",
  },
  {
    name: "Institutional RSE Networking",
    description:
      "Connecting RSEs who are building or sustaining RSE communities within their own organizations — sharing playbooks and institutional strategies.",
    type: "Organizational",
  },
];

const regionalGroups = [
  {
    name: "DMV-RSE",
    description:
      "Delaware-Maryland-Virginia regional group organizing local meetups, talks, and networking for RSEs in the capital region.",
    region: "Mid-Atlantic",
  },
  {
    name: "North Carolina Regional Group",
    description:
      "Local events, meetups, and collaboration opportunities for RSEs based in North Carolina.",
    region: "Southeast",
  },
  {
    name: "St. Louis Metro Regional Group",
    description:
      "Bringing together RSEs in the greater St. Louis metropolitan area for local events and community building.",
    region: "Midwest",
  },
];

export function AffinityGroupsPage() {
  const { ref: affinityRef, isInView: affinityVisible } = useInView(0.05);
  const { ref: regionalRef, isInView: regionalVisible } = useInView(0.05);

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
      {/* Opening narrative */}
      <p className="text-xl text-neutral-700 leading-relaxed mb-16 max-w-2xl">
        While working groups focus on specific projects, affinity groups
        create space for connection. They bring together members who share an
        identity, a research domain, a programming language, or a place on
        the map.
      </p>

      {/* ── Affinity Groups ────────────────────────────────────── */}
      <div ref={affinityRef} className="mb-20">
        <div className="flex items-baseline gap-4 mb-8">
          <h2 className="text-2xl font-bold text-neutral-900">
            Affinity Groups
          </h2>
          <span className="font-mono text-xs text-neutral-400 tracking-wider uppercase">
            Interest &amp; Identity
          </span>
        </div>

        {affinityGroups.map((group, i) => (
          <div
            key={group.name}
            className={`flex gap-5 lg:gap-8 py-7 ${
              i < affinityGroups.length - 1 ? "border-b border-neutral-100" : ""
            } ${affinityVisible ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="font-mono text-xs text-teal-600 shrink-0 pt-1 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="flex flex-wrap items-baseline gap-3 mb-1.5">
                <h3 className="text-base font-bold text-neutral-900">
                  {group.name}
                </h3>
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
                  {group.type}
                </span>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {group.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Regional Groups ────────────────────────────────────── */}
      <div ref={regionalRef} className="mb-20">
        <div className="flex items-baseline gap-4 mb-8">
          <h2 className="text-2xl font-bold text-neutral-900">
            Regional Groups
          </h2>
          <span className="font-mono text-xs text-neutral-400 tracking-wider uppercase">
            Geographic
          </span>
        </div>

        {regionalGroups.map((group, i) => (
          <div
            key={group.name}
            className={`flex gap-5 lg:gap-8 py-7 ${
              i < regionalGroups.length - 1 ? "border-b border-neutral-100" : ""
            } ${regionalVisible ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="font-mono text-xs text-teal-600 shrink-0 pt-1 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="flex flex-wrap items-baseline gap-3 mb-1.5">
                <h3 className="text-base font-bold text-neutral-900">
                  {group.name}
                </h3>
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
                  {group.region}
                </span>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {group.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Forming New Groups ─────────────────────────────────── */}
      <hr className="mb-16 border-neutral-100" />

      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Start a New Group
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Don't see a group that fits? US-RSE members can propose new
          affinity groups around any shared identity, interest, or region.
          The process is lightweight and community-driven.
        </p>
        <div className="border-l-2 border-teal-200 pl-5 space-y-3 text-neutral-600">
          <p>
            Reach out on{" "}
            <strong>Slack</strong> to gauge interest among fellow members
          </p>
          <p>
            Contact the Group Management working group for logistical support
          </p>
          <p>
            Groups typically need a chair, a Slack channel, and a brief
            charter to get started
          </p>
        </div>
      </div>
    </CommunityLayout>
  );
}
