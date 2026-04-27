import { useInView } from "@/hooks/useInView";

const pillars = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Community",
    description:
      "Building a connective, supportive, and diverse community of research software engineers and allies across the US.",
    color: "teal",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
      </svg>
    ),
    title: "Advocacy",
    description:
      "Championing the recognition and career paths for those who develop and maintain research software.",
    color: "purple",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: "Resources",
    description:
      "Providing shared infrastructure, learning materials, and tools that help RSEs grow and create impact.",
    color: "teal",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: "Diversity, Equity & Inclusion",
    description:
      "Ensuring equitable treatment for all and promoting diversity in every dimension within the RSE community.",
    color: "purple",
  },
];

export function Mission() {
  const { ref, isInView } = useInView(0.15);

  return (
    <section className="py-24 lg:py-32 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section header */}
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 mb-3">
            Our Mission
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4 text-balance">
            A community of people who make research software happen
          </h2>
          <p className="text-lg text-neutral-500 leading-relaxed">
            Research Software Engineers use expertise in programming to advance
            research — creating more robust, manageable, and sustainable research
            software to drive scientific breakthroughs.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className={`group relative p-8 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:shadow-lg hover:border-neutral-200 transition-all duration-300 ${
                isInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 100 + 100}ms` }}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  pillar.color === "teal"
                    ? "bg-teal-100 text-teal-700"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {pillar.icon}
              </div>

              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                {pillar.title}
              </h3>
              <p className="text-neutral-500 leading-relaxed">
                {pillar.description}
              </p>

              {/* Decorative corner accent */}
              <div
                className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  pillar.color === "teal" ? "bg-teal-50" : "bg-purple-50"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
