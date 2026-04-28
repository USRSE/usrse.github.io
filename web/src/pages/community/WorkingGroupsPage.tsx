import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";

const workingGroups = [
  {
    name: "Code Review",
    description:
      "Building a community interested in code review and providing resources for code review practices in research software.",
    href: "#wg-code-review",
  },
  {
    name: "Community Calls",
    description:
      "Monthly virtual meetings featuring invited speakers and breakout discussion sessions open to all members.",
    href: "/community/calls",
    route: true,
  },
  {
    name: "Diversity, Equity & Inclusion",
    description:
      "Fostering an inclusive environment with equitable treatment for all and integrating DEI practices across the organization.",
    href: "#wg-dei",
  },
  {
    name: "Education & Training",
    description:
      "Developing RSE education resources, curating skill lists, and running a seminar series on research software topics.",
    href: "#wg-edu",
  },
  {
    name: "Group Management",
    description:
      "Providing support and facilitating conversation between working group chairs on logistics, governance, and best practices.",
    href: "#wg-group-mgmt",
  },
  {
    name: "Mentorship Program",
    description:
      "Inter-institutional mentorship pairing for professional growth, connecting early-career and experienced RSEs.",
    href: "#wg-mentorship",
  },
  {
    name: "RSE Empowerment in National Labs",
    description:
      "Addressing unique challenges RSEs face in national laboratories through advocacy, knowledge sharing, and community building.",
    href: "#wg-national-labs",
  },
  {
    name: "Testing",
    description:
      "Exploring testing limitations, sharing knowledge across domains, and improving research software reliability.",
    href: "#wg-testing",
  },
  {
    name: "User Experience",
    description:
      "Promoting adoption of UX methods in research software engineering to improve usability and accessibility.",
    href: "#wg-ux",
  },
  {
    name: "Website",
    description:
      "Managing the content, design, and technical infrastructure of the US-RSE website.",
    href: "#wg-website",
  },
];

export function WorkingGroupsPage() {
  const { ref, isInView } = useInView(0.05);

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
      {/* Opening editorial text */}
      <p className="text-xl text-neutral-700 leading-relaxed mb-6 max-w-2xl">
        Working groups are where the real work happens. Each group is led by
        volunteers who care deeply about a specific aspect of the RSE
        community — from code quality to career development.
      </p>

      <p className="text-neutral-500 leading-relaxed mb-16">
        All US-RSE members are welcome to join any working group. Most
        coordinate through Slack and hold regular virtual meetings. Find one
        that matches your interests and get involved.
      </p>

      {/* ── Two-column typographic list ─────────────────────────── */}
      <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
        {/* Left column */}
        <div>
          {leftColumn.map((wg, i) => (
            <div
              key={wg.name}
              className={`py-6 ${i < leftColumn.length - 1 ? "border-b border-neutral-100" : ""} ${
                isInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono text-xs text-teal-600 tabular-nums shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  {wg.name}
                </h3>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed pl-8">
                {wg.description}
              </p>
              <a
                href={wg.href}
                className="inline-block mt-2 pl-8 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                Learn more &rarr;
              </a>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div>
          {rightColumn.map((wg, i) => (
            <div
              key={wg.name}
              className={`py-6 ${i < rightColumn.length - 1 ? "border-b border-neutral-100" : ""} ${
                isInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${(i + midpoint) * 60}ms` }}
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono text-xs text-teal-600 tabular-nums shrink-0">
                  {String(i + midpoint + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  {wg.name}
                </h3>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed pl-8">
                {wg.description}
              </p>
              <a
                href={wg.href}
                className="inline-block mt-2 pl-8 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                Learn more &rarr;
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── Getting involved ───────────────────────────────────── */}
      <hr className="my-16 border-neutral-100" />

      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Start or Join a Working Group
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Have an idea for a new working group? US-RSE encourages members to
          propose new groups around topics that matter to the community. Reach
          out to the Group Management working group to get started.
        </p>
        <div className="border-l-2 border-teal-200 pl-5 space-y-3 text-neutral-600">
          <p>Browse the <strong>#working-groups</strong> channel on Slack to see what's active</p>
          <p>Attend a group's next meeting — most are open to all members</p>
          <p>Contact group chairs directly if you'd like to contribute</p>
        </div>
      </div>
    </CommunityLayout>
  );
}
