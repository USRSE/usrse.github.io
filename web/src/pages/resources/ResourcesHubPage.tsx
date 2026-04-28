import { Link } from "react-router-dom";
import { ResourcesLayout } from "@/components/resources/ResourcesLayout";

const externalResources = [
  { name: "Better Scientific Software (BSSw)", url: "https://bssw.io", desc: "A central hub for scientific software productivity, quality, and sustainability." },
  { name: "Software Sustainability Institute (SSI)", url: "https://software.ac.uk", desc: "UK-based institute cultivating better, more sustainable research software." },
  { name: "Research Software Alliance (ReSA)", url: "https://researchsoft.org", desc: "A global network advancing research software policy, people, and infrastructure." },
  { name: "IDEAS Productivity", url: "https://ideas-productivity.org", desc: "Improving developer productivity for extreme-scale scientific applications." },
];

export function ResourcesHubPage() {
  return (
    <ResourcesLayout
      title="Resources"
      subtitle="Tools, learning materials, organizations, and references for the RSE community."
      nextPage={{ path: "/resources/education", label: "Education & Training", teaser: "Seminars, tutorials, and skill development" }}
    >
      {/* Opening */}
      <section className="mb-16">
        <p className="text-lg text-neutral-600 leading-relaxed max-w-3xl">
          US-RSE maintains a growing collection of shared resources for research software engineers
          at every stage of their career. Whether you are looking for technical training, peer organizations,
          or tools to advance your practice, this is the starting point.
        </p>
      </section>

      {/* ── 01 Education & Training ──────────────────────────────────── */}
      <section className="mb-14">
        <div className="flex items-baseline gap-4 mb-3">
          <span className="font-mono text-sm text-neutral-300 tabular-nums">01</span>
          <h2 className="font-display text-xl font-bold text-neutral-900">Education &amp; Training</h2>
        </div>
        <div className="border-l-2 border-neutral-200 pl-6 ml-4">
          <p className="text-neutral-600 leading-relaxed mb-3">
            The US-RSE seminar series brings technical talks and tutorials from leading researchers
            and practitioners. Topics range from CI/CD pipelines and containerization to usability
            assessment and software engineering best practices.
          </p>
          <Link
            to="/resources/education"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
          >
            Browse seminars and resources
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── 02 RSE Organizations ─────────────────────────────────────── */}
      <section className="mb-14">
        <div className="flex items-baseline gap-4 mb-3">
          <span className="font-mono text-sm text-neutral-300 tabular-nums">02</span>
          <h2 className="font-display text-xl font-bold text-neutral-900">RSE Organizations</h2>
        </div>
        <div className="border-l-2 border-neutral-200 pl-6 ml-4">
          <p className="text-neutral-600 leading-relaxed mb-3">
            A directory of relevant organizations and institutional RSE groups across the United States
            and beyond. From national labs to university research computing teams, the RSE community
            is distributed and growing.
          </p>
          <Link
            to="/resources/organizations"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
          >
            View organizations directory
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── 03 RSE Map ───────────────────────────────────────────────── */}
      <section className="mb-14">
        <div className="flex items-baseline gap-4 mb-3">
          <span className="font-mono text-sm text-neutral-300 tabular-nums">03</span>
          <h2 className="font-display text-xl font-bold text-neutral-900">RSE Map</h2>
        </div>
        <div className="border-l-2 border-neutral-200 pl-6 ml-4">
          <p className="text-neutral-600 leading-relaxed mb-3">
            An interactive map of RSE community members and institutions across the country.
            Explore geographic distribution and find RSEs near you.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/resources/map"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
            >
              View map
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2 py-0.5">
              Coming soon
            </span>
          </div>
        </div>
      </section>

      {/* ── 04 External Resources ────────────────────────────────────── */}
      <section className="mb-14">
        <div className="flex items-baseline gap-4 mb-3">
          <span className="font-mono text-sm text-neutral-300 tabular-nums">04</span>
          <h2 className="font-display text-xl font-bold text-neutral-900">External Resources</h2>
        </div>
        <div className="border-l-2 border-neutral-200 pl-6 ml-4">
          <p className="text-neutral-600 leading-relaxed mb-6">
            Curated links to complementary organizations and resources across the research software ecosystem.
          </p>
          <div className="space-y-4">
            {externalResources.map((resource) => (
              <div key={resource.name} className="pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-neutral-900 hover:text-teal-700 transition-colors"
                >
                  {resource.name}
                </a>
                <span className="font-mono text-xs text-teal-600 ml-2">{resource.url.replace("https://", "")}</span>
                <p className="text-sm text-neutral-500 mt-0.5">{resource.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ResourcesLayout>
  );
}
