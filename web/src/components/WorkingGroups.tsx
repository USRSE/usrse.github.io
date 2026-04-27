import { useInView } from "@/hooks/useInView";

const groups = [
  {
    name: "Code Review",
    description: "Best practices for scientific code review processes",
    icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
    members: 45,
  },
  {
    name: "Education & Training",
    description: "Developing curricula and workshops for RSE skills",
    icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
    members: 62,
  },
  {
    name: "Diversity, Equity & Inclusion",
    description: "Creating an inclusive and welcoming RSE community",
    icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
    members: 38,
  },
  {
    name: "Mentorship Program",
    description: "Connecting experienced RSEs with newcomers for career growth",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    members: 29,
  },
  {
    name: "Testing",
    description: "Advancing testing methodologies for research software",
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    members: 33,
  },
  {
    name: "User Experience",
    description: "Improving usability of research software interfaces",
    icon: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42",
    members: 22,
  },
];

export function WorkingGroups() {
  const { ref, isInView } = useInView(0.1);

  return (
    <section className="py-24 lg:py-32 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 mb-3">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
          >
            View all 11 groups
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group, i) => (
            <a
              key={group.name}
              href={`#wg-${group.name.toLowerCase().replace(/\s+/g, "-")}`}
              className={`group relative p-6 rounded-xl border border-neutral-100 bg-white hover:border-teal-200 hover:shadow-md transition-all duration-300 ${
                isInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d={group.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-neutral-900 mb-1 group-hover:text-teal-700 transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-3">
                    {group.description}
                  </p>
                  <span className="text-xs text-neutral-400">
                    {group.members} members
                  </span>
                </div>
              </div>

              {/* Hover arrow indicator */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
