import { useInView } from "@/hooks/useInView";

const events = [
  {
    date: "Oct 19-21",
    year: "2026",
    title: "USRSE'26 Conference",
    location: "San Jose, California",
    type: "Conference",
    featured: true,
    description:
      "The annual gathering of the US-RSE community. Three days of talks, workshops, and community building.",
  },
  {
    date: "Monthly",
    year: "",
    title: "Community Calls",
    location: "Virtual",
    type: "Recurring",
    featured: false,
    description:
      "Open discussions on topics relevant to the RSE community. All welcome.",
  },
  {
    date: "Bi-weekly",
    year: "",
    title: "Working Group Meetings",
    location: "Virtual",
    type: "Recurring",
    featured: false,
    description:
      "Focused collaboration sessions across our 11 active working groups.",
  },
];

export function Events() {
  const { ref, isInView } = useInView(0.1);

  return (
    <section className="py-24 lg:py-32 bg-neutral-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-500 mb-3">
              Events & Gatherings
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 text-balance">
              Where the community connects
            </h2>
          </div>
          <a
            href="#calendar"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
          >
            View full calendar
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        <div className="space-y-5">
          {events.map((event, i) => (
            <div
              key={event.title}
              className={`group relative flex flex-col md:flex-row md:items-center gap-6 p-6 md:p-8 rounded-2xl bg-white border transition-all duration-300 ${
                event.featured
                  ? "border-teal-200 shadow-sm hover:shadow-lg"
                  : "border-neutral-100 hover:border-neutral-200 hover:shadow-md"
              } ${isInView ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {/* Date badge */}
              <div
                className={`shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center ${
                  event.featured
                    ? "bg-teal-500 text-white"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                  {event.year || event.date.split(" ")[0]}
                </span>
                <span className="text-lg font-bold leading-tight">
                  {event.year ? event.date.split(" ")[0] : ""}
                </span>
                {event.year && (
                  <span className="text-xs opacity-70">
                    {event.date.split(" ")[1]}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-neutral-900 group-hover:text-teal-700 transition-colors">
                    {event.title}
                  </h3>
                  {event.featured && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-700 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 mb-2">
                  {event.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {event.location}
                  </span>
                  <span className="px-2 py-0.5 bg-neutral-100 rounded-md font-medium">
                    {event.type}
                  </span>
                </div>
              </div>

              {/* Action */}
              <a
                href={`#event-${event.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
              >
                Learn more
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
