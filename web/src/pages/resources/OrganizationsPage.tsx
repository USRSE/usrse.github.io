import { ResourcesLayout } from "@/components/resources/ResourcesLayout";
import { useInView } from "@/hooks/useInView";

interface Organization {
  name: string;
  url: string;
  domain: string;
  desc: string;
}

const organizations: Organization[] = [
  { name: "Better Scientific Software (BSSw)", url: "https://bssw.io", domain: "bssw.io", desc: "A central hub for software productivity, quality, and sustainability" },
  { name: "Ask Cyberinfrastructure", url: "https://ask.cyberinfrastructure.org", domain: "ask.cyberinfrastructure.org", desc: "Community Q&A forum for research computing" },
  { name: "IDEAS Productivity", url: "https://ideas-productivity.org", domain: "ideas-productivity.org", desc: "Extreme-scale application software productivity" },
  { name: "Software Engineering for Science", url: "https://se4science.org", domain: "se4science.org", desc: "SE principles in scientific research" },
  { name: "SWEBOK", url: "https://www.computer.org/education/bodies-of-knowledge/software-engineering", domain: "computer.org", desc: "Software engineering standards and body of knowledge" },
  { name: "Software Sustainability Institute (SSI)", url: "https://software.ac.uk", domain: "software.ac.uk", desc: "Better, more sustainable research software" },
  { name: "URSSI", url: "https://urssi.us", domain: "urssi.us", desc: "US research software sustainability planning" },
  { name: "Research Software Alliance (ReSA)", url: "https://researchsoft.org", domain: "researchsoft.org", desc: "Global network for research software policy and practice" },
];

interface RSEGroup {
  institution: string;
  group: string;
}

const rseGroups: RSEGroup[] = [
  { institution: "Boston University", group: "Research Software Engineering" },
  { institution: "Brown University", group: "Center for Computation and Visualization" },
  { institution: "Dartmouth College", group: "Research Computing" },
  { institution: "Georgia Tech", group: "Research Software Engineers" },
  { institution: "Georgia Tech", group: "Scientific Software Engineering Center" },
  { institution: "Harvard University", group: "Research Software Engineering" },
  { institution: "Harvard University", group: "Institute for Applied Computational Science" },
  { institution: "Lawrence Berkeley National Lab", group: "NERSC Application Performance" },
  { institution: "Lawrence Berkeley National Lab", group: "Scientific Data Division" },
  { institution: "Lawrence Livermore National Lab", group: "Applications, Simulations & Quality" },
  { institution: "MIT", group: "Research Software Engineering" },
  { institution: "Mississippi State University", group: "Center for Advanced Vehicular Systems" },
  { institution: "NASA", group: "High-End Computing Capability" },
  { institution: "NYU Langone Health", group: "Scientific Computing" },
  { institution: "Northern Arizona University", group: "Research Computing" },
  { institution: "Northwestern University", group: "Research Computing and Data" },
  { institution: "Oak Ridge National Lab", group: "Software Engineering Group" },
  { institution: "Oak Ridge National Lab", group: "Computer Science and Mathematics Division" },
  { institution: "Oak Ridge National Lab", group: "Advanced Computing for Life Sciences" },
  { institution: "Princeton University", group: "Research Software Engineering" },
  { institution: "Princeton University", group: "Center for Statistics and Machine Learning" },
  { institution: "Princeton University", group: "Princeton Plasma Physics Lab" },
  { institution: "Princeton University", group: "Language and Intelligence Initiative" },
  { institution: "Purdue University", group: "Research Computing" },
  { institution: "Saint Louis University", group: "Research Computing Group" },
  { institution: "Sandia National Laboratories", group: "Software Engineering and Research" },
  { institution: "Stanford University", group: "Research Computing Center" },
  { institution: "University of Colorado Boulder", group: "Research Computing" },
  { institution: "University of Florida", group: "Research Computing" },
  { institution: "University of Illinois Urbana-Champaign", group: "NCSA" },
  { institution: "University of Michigan", group: "Advanced Research Computing" },
  { institution: "University of Notre Dame", group: "Center for Research Computing" },
  { institution: "University of Vermont", group: "Vermont Advanced Computing Core" },
  { institution: "University of Washington", group: "eScience Institute" },
  { institution: "University of Washington", group: "Scientific Computing" },
];

export function OrganizationsPage() {
  const { ref: orgsRef, isInView: orgsInView } = useInView(0.1);
  const { ref: groupsRef, isInView: groupsInView } = useInView(0.1);

  return (
    <ResourcesLayout
      title="RSE Organizations"
      subtitle="Relevant organizations and institutional RSE groups across the US and beyond."
      prevPage={{ path: "/resources/education", label: "Education & Training" }}
      nextPage={{ path: "/resources/map", label: "RSE Map", teaser: "Interactive community map" }}
    >
      {/* ── Relevant Organizations ────────────────────────────────────── */}
      <section className="mb-16" ref={orgsRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          Relevant Organizations
        </p>

        <div>
          {organizations.map((org, i) => (
            <div
              key={org.name}
              className={`py-4 border-b border-neutral-100 last:border-0 ${
                orgsInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-baseline gap-3 flex-wrap">
                <a
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-neutral-900 hover:text-teal-700 transition-colors"
                >
                  {org.name}
                </a>
                <span className="font-mono text-xs text-teal-600">{org.domain}</span>
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">{org.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Institutional RSE Groups ─────────────────────────────────── */}
      <section className="mb-16" ref={groupsRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-2">
          Institutional RSE Groups
        </p>
        <p className="text-sm text-neutral-400 mb-8">
          University, national lab, and agency teams dedicated to research software engineering.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0">
          {rseGroups.map((group, i) => (
            <div
              key={`${group.institution}-${group.group}`}
              className={`py-2.5 border-b border-neutral-50 ${
                groupsInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
            >
              <span className="text-sm font-semibold text-neutral-800">{group.institution}</span>
              <span className="text-sm text-neutral-400 ml-2">{group.group}</span>
              <span className="font-mono text-[10px] text-neutral-300 ml-1.5">{"\u2197"}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-neutral-400 mt-6 font-mono">
          {rseGroups.length} groups listed &mdash; submit additions via GitHub
        </p>
      </section>
    </ResourcesLayout>
  );
}
