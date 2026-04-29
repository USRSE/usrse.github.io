import { useEffect, useMemo, useRef, useState } from "react";
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

type GroupType = "University" | "National Lab" | "Agency";
type FilterType = "All" | GroupType;

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

function classify(institution: string): GroupType {
  if (/National Lab|National Laborator/i.test(institution)) return "National Lab";
  if (institution === "NASA") return "Agency";
  return "University";
}

const filterTypes: FilterType[] = ["All", "University", "National Lab", "Agency"];

/**
 * Render text with the matching query substring wrapped in <mark>.
 * Case-insensitive; preserves original casing of the text.
 */
function highlight(text: string, query: string) {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-teal-100 text-teal-900 rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function OrganizationsPage() {
  const { ref: orgsRef, isInView: orgsInView } = useInView(0.1);
  const { ref: groupsRef, isInView: groupsInView } = useInView(0.05);

  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<FilterType>("All");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: `/` focuses the input from anywhere on the page,
  // `Esc` clears it when focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const typeCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {
      All: rseGroups.length,
      University: 0,
      "National Lab": 0,
      Agency: 0,
    };
    for (const g of rseGroups) counts[classify(g.institution)]++;
    return counts;
  }, []);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rseGroups.filter((g) => {
      const matchesType =
        activeType === "All" || classify(g.institution) === activeType;
      if (!matchesType) return false;
      if (!q) return true;
      return (
        g.institution.toLowerCase().includes(q) ||
        g.group.toLowerCase().includes(q)
      );
    });
  }, [query, activeType]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || activeType !== "All";

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

        {/* ── Filter bar ─────────────────────────────────────────────── */}
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:gap-8">
          {/* Running count, large typographic anchor */}
          <div className="flex items-baseline gap-3 lg:shrink-0">
            <span className="font-display text-5xl lg:text-6xl font-bold text-neutral-900 tabular-nums leading-none">
              {filteredGroups.length.toString().padStart(2, "0")}
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">
              of {rseGroups.length}
              <br />
              groups
            </span>
          </div>

          {/* Search input */}
          <div className="flex-1 w-full">
            <label htmlFor="rse-search" className="sr-only">
              Search institutional groups
            </label>
            <div className="relative group">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-teal-600 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3-3" />
              </svg>
              <input
                ref={inputRef}
                id="rse-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by institution or group name"
                spellCheck={false}
                autoComplete="off"
                className="w-full h-12 pl-11 pr-24 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition"
              />
              {hasQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded transition-colors"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              ) : (
                <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center justify-center w-6 h-6 font-mono text-[11px] text-neutral-500 bg-neutral-100 border border-neutral-200 rounded">
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>

        {/* Type chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filterTypes.map((t) => {
            const isActive = activeType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveType(t)}
                className={`inline-flex items-baseline gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  isActive
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900"
                }`}
                aria-pressed={isActive}
              >
                {t}
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    isActive ? "text-white/60" : "text-neutral-400"
                  }`}
                >
                  {typeCounts[t]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Results ─────────────────────────────────────────────── */}
        {filteredGroups.length === 0 ? (
          <div className="py-16 text-center border-t border-b border-neutral-100">
            <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-3">
              No matches
            </p>
            <p className="font-display text-2xl font-bold text-neutral-900 mb-3">
              Nothing here yet &mdash; that could be your group.
            </p>
            <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
              If your institution has an RSE team we should list, open a pull
              request on our GitHub and we&rsquo;ll add it.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveType("All");
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900 transition-colors"
            >
              Reset filters
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M4 4v5h5M20 20v-5h-5" />
                <path d="M4 9a8 8 0 0114-3M20 15a8 8 0 01-14 3" />
              </svg>
            </button>
          </div>
        ) : (
          <ul
            key={`${query}-${activeType}`}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0"
          >
            {filteredGroups.map((g, i) => {
              const type = classify(g.institution);
              return (
                <li
                  key={`${g.institution}-${g.group}`}
                  className={`group py-3 border-b border-neutral-100 ${
                    groupsInView ? "animate-slide-up" : "opacity-0"
                  }`}
                  style={{
                    animationDelay: isFiltered
                      ? `${Math.min(i * 20, 200)}ms`
                      : `${Math.min(i * 30, 600)}ms`,
                  }}
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-900">
                      {highlight(g.institution, query)}
                    </span>
                    <span className="text-sm text-neutral-500">
                      {highlight(g.group, query)}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-300 ml-auto shrink-0 group-hover:text-teal-500 transition-colors">
                      {type}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-sm text-neutral-400 mt-6 font-mono">
          {rseGroups.length} groups listed &mdash; submit additions via GitHub
        </p>
      </section>
    </ResourcesLayout>
  );
}
