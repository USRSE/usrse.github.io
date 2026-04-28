import { ResourcesLayout } from "@/components/resources/ResourcesLayout";
import { useInView } from "@/hooks/useInView";

interface Seminar {
  title: string;
  speaker: string;
  date: string;
  type: "Tutorial" | "Talk";
}

const seminars: Seminar[] = [
  { title: "CI/CD with GitHub Actions", speaker: "Andres Rios-Tascon", date: "Mar 24, 2026", type: "Tutorial" },
  { title: "Rapid Usability Assessments", speaker: "Hannah Cohoon", date: "Jun 23, 2025", type: "Tutorial" },
  { title: "Eating Your Own Dogfood", speaker: "Jonathan Woodring, LANL", date: "Aug 28, 2024", type: "Talk" },
  { title: "Building and Running Containers on HPC", speaker: "Subil Abraham, ORNL", date: "May 10, 2024", type: "Talk" },
];

const additionalResources = [
  { name: "Software Engineering Body of Knowledge (SWEBOK)", url: "https://www.computer.org/education/bodies-of-knowledge/software-engineering" },
  { name: "Ask Cyberinfrastructure", url: "https://ask.cyberinfrastructure.org", desc: "Community Q&A forum for research computing" },
  { name: "Software Engineering for Science (SE4Science)", url: "https://se4science.org", desc: "Applying SE principles to scientific research software" },
];

export function EducationPage() {
  const { ref: seminarsRef, isInView: seminarsInView } = useInView(0.1);

  return (
    <ResourcesLayout
      title="Education & Training"
      subtitle="Technical talks, tutorials, and learning resources for research software engineers."
      prevPage={{ path: "/resources", label: "Resources Hub" }}
      nextPage={{ path: "/resources/organizations", label: "RSE Organizations", teaser: "RSE groups and relevant organizations" }}
    >
      {/* ── Seminar Series ────────────────────────────────────────────── */}
      <section className="mb-16" ref={seminarsRef}>
        <h2 className="font-display text-2xl font-bold text-neutral-900 mb-2">Seminar Series</h2>
        <p className="text-neutral-500 mb-8 max-w-2xl">
          Technical talks and tutorials by leading researchers and practitioners.
          Sessions are recorded and available to members.
        </p>

        <div>
          {seminars.map((seminar, i) => (
            <div
              key={seminar.title}
              className={`flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-5 border-b border-neutral-100 last:border-0 ${
                seminarsInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Date */}
              <span className="font-mono text-xs text-neutral-400 tabular-nums shrink-0 w-28">
                {seminar.date}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-semibold text-neutral-900">{seminar.title}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2 py-0.5">
                    {seminar.type}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 mt-0.5">{seminar.speaker}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-neutral-400 mt-6 font-mono">
          + more sessions in the archive
        </p>
      </section>

      {/* ── Additional Resources ──────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold text-neutral-900 mb-6">Additional Resources</h2>

        <div className="border-l-2 border-neutral-200 pl-6 space-y-4">
          {additionalResources.map((resource) => (
            <div key={resource.name}>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-neutral-700 hover:text-teal-700 transition-colors"
              >
                {resource.name}
                <span className="text-neutral-300 ml-2">&rarr;</span>
              </a>
              {resource.desc && (
                <p className="text-xs text-neutral-400 mt-0.5">{resource.desc}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </ResourcesLayout>
  );
}
