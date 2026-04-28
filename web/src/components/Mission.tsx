import { Link } from "react-router-dom";
import { useInView } from "@/hooks/useInView";

const pillars = [
  {
    num: "01",
    title: "Community",
    description:
      "Building a connective, supportive, and diverse community of research software engineers and allies across the US.",
    accent: "text-teal-600",
  },
  {
    num: "02",
    title: "Advocacy",
    description:
      "Championing the recognition and career paths for those who develop and maintain research software.",
    accent: "text-purple-500",
  },
  {
    num: "03",
    title: "Resources",
    description:
      "Providing shared infrastructure, learning materials, and tools that help RSEs grow and create impact.",
    accent: "text-teal-600",
  },
  {
    num: "04",
    title: "Diversity, Equity & Inclusion",
    description:
      "Ensuring equitable treatment for all and promoting diversity in every dimension within the RSE community.",
    accent: "text-purple-500",
  },
];

export function Mission() {
  const { ref, isInView } = useInView(0.1);

  return (
    <section className="py-24 lg:py-32 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row gap-14 lg:gap-20">
          {/* Left — section intro */}
          <div className="lg:w-2/5 shrink-0">
            <p className="text-sm font-mono uppercase tracking-wider text-teal-600 mb-3">
              Our Mission
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4 text-balance">
              A community of people who make research software happen
            </h2>
            <p className="text-neutral-500 leading-relaxed mb-6">
              Research Software Engineers use expertise in programming to advance
              research — creating more robust, manageable, and sustainable
              research software to drive scientific breakthroughs.
            </p>
            <Link
              to="/about/mission"
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              Read our full mission
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Right — four pillars as typographic list */}
          <div className="flex-1">
            {pillars.map((pillar, i) => (
              <div
                key={pillar.num}
                className={`flex gap-5 py-6 ${
                  i < pillars.length - 1 ? "border-b border-neutral-100" : ""
                } ${isInView ? "animate-slide-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 80 + 100}ms` }}
              >
                <span className={`font-mono text-sm ${pillar.accent} shrink-0 pt-0.5`}>
                  {pillar.num}
                </span>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
