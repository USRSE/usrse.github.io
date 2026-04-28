import { useInView } from "@/hooks/useInView";

const groups = [
  { name: "Code Review", description: "Best practices for scientific code review processes", members: 45 },
  { name: "Education & Training", description: "Developing curricula and workshops for RSE skills", members: 62 },
  { name: "Diversity, Equity & Inclusion", description: "Creating an inclusive and welcoming RSE community", members: 38 },
  { name: "Mentorship Program", description: "Connecting experienced RSEs with newcomers for career growth", members: 29 },
  { name: "Testing", description: "Advancing testing methodologies for research software", members: 33 },
  { name: "User Experience", description: "Improving usability of research software interfaces", members: 22 },
];

export function WorkingGroups() {
  const { ref, isInView } = useInView(0.1);

  return (
    <section className="py-24 lg:py-32 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <p className="text-sm font-mono uppercase tracking-wider text-teal-600 mb-3">
              Working Groups
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-3 text-balance">
              Collaborate on what matters
            </h2>
            <p className="text-neutral-500 text-lg">
              Join specialized teams tackling the challenges that Research
              Software Engineers face every day.
            </p>
          </div>
          <a
            href="#all-groups"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors shrink-0"
          >
            View all groups
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        {/* Groups — two-column typographic list, not cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16">
          {groups.map((group, i) => (
            <a
              key={group.name}
              href={`#wg-${group.name.toLowerCase().replace(/[\s&,]+/g, "-")}`}
              className={`group flex items-baseline justify-between gap-4 py-5 border-b border-neutral-100 ${
                isInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="min-w-0">
                <h3 className="font-bold text-neutral-900 group-hover:text-teal-700 transition-colors">
                  {group.name}
                </h3>
                <p className="text-sm text-neutral-400 mt-0.5 truncate">
                  {group.description}
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-300 shrink-0">
                {group.members}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
