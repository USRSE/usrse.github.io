import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ResourcesLayout } from "@/components/resources/ResourcesLayout";
import { useInView } from "@/hooks/useInView";

type EntryType = "University" | "National Lab" | "Agency" | "External Org";
type FilterType = "All" | EntryType;

interface DirectoryEntry {
  primary: string;
  secondary?: string;
  type: EntryType;
  url?: string;
  domain?: string;
  desc?: string;
}

const externalOrgs: DirectoryEntry[] = [
  {
    primary: "Better Scientific Software (BSSw)",
    type: "External Org",
    url: "https://bssw.io",
    domain: "bssw.io",
    desc: "A central hub for software productivity, quality, and sustainability",
  },
  {
    primary: "Ask Cyberinfrastructure",
    type: "External Org",
    url: "https://ask.cyberinfrastructure.org",
    domain: "ask.cyberinfrastructure.org",
    desc: "Community Q&A forum for research computing",
  },
  {
    primary: "IDEAS Productivity",
    type: "External Org",
    url: "https://ideas-productivity.org",
    domain: "ideas-productivity.org",
    desc: "Extreme-scale application software productivity",
  },
  {
    primary: "Software Engineering for Science",
    type: "External Org",
    url: "https://se4science.org",
    domain: "se4science.org",
    desc: "SE principles in scientific research",
  },
  {
    primary: "SWEBOK",
    type: "External Org",
    url: "https://www.computer.org/education/bodies-of-knowledge/software-engineering",
    domain: "computer.org",
    desc: "Software engineering standards and body of knowledge",
  },
  {
    primary: "Software Sustainability Institute (SSI)",
    type: "External Org",
    url: "https://software.ac.uk",
    domain: "software.ac.uk",
    desc: "Better, more sustainable research software",
  },
  {
    primary: "URSSI",
    type: "External Org",
    url: "https://urssi.us",
    domain: "urssi.us",
    desc: "US research software sustainability planning",
  },
  {
    primary: "Research Software Alliance (ReSA)",
    type: "External Org",
    url: "https://researchsoft.org",
    domain: "researchsoft.org",
    desc: "Global network for research software policy and practice",
  },
];

interface RawGroup {
  institution: string;
  group: string;
}

const rawRseGroups: RawGroup[] = [
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

function classifyInstitution(institution: string): EntryType {
  if (/National Lab|National Laborator/i.test(institution)) return "National Lab";
  if (institution === "NASA") return "Agency";
  return "University";
}

const institutionalEntries: DirectoryEntry[] = rawRseGroups.map((g) => ({
  primary: g.institution,
  secondary: g.group,
  type: classifyInstitution(g.institution),
}));

const allEntries: DirectoryEntry[] = [
  ...externalOrgs,
  ...institutionalEntries,
];

const filterTypes: FilterType[] = [
  "All",
  "University",
  "National Lab",
  "Agency",
  "External Org",
];

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

interface Fact {
  value: string;
  label: string;
}

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Grow as an RSE",
    title: "Learn",
    teaser: "Seminars, tutorials, and canonical references for the field.",
    path: "/resources",
  },
  {
    eyebrow: "Where work happens",
    title: "Working Groups",
    teaser: "Join the cross-institutional groups doing the day-to-day work.",
    path: "/community/working-groups",
  },
  {
    eyebrow: "Live discussion",
    title: "Community Calls",
    teaser: "Where members from these institutions meet every month.",
    path: "/community/calls",
  },
  {
    eyebrow: "Backers",
    title: "Sponsors",
    teaser: "Organizations that support the network from the outside.",
    path: "/about/sponsors",
  },
];

export function DirectoryPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: directoryRef, isInView: directoryInView } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

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
      All: allEntries.length,
      University: 0,
      "National Lab": 0,
      Agency: 0,
      "External Org": 0,
    };
    for (const e of allEntries) counts[e.type]++;
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEntries.filter((e) => {
      if (activeType !== "All" && e.type !== activeType) return false;
      if (!q) return true;
      return (
        e.primary.toLowerCase().includes(q) ||
        (e.secondary?.toLowerCase().includes(q) ?? false) ||
        (e.desc?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, activeType]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || activeType !== "All";

  const keyFacts: Fact[] = [
    {
      value: String(institutionalEntries.length),
      label: "Institutional groups",
    },
    { value: String(externalOrgs.length), label: "Peer organizations" },
    { value: String(typeCounts.University), label: "Universities" },
    { value: String(typeCounts["National Lab"]), label: "National labs" },
  ];

  const typeColor: Record<EntryType, string> = {
    University: "text-teal-600",
    "National Lab": "text-purple-600",
    Agency: "text-amber-600",
    "External Org": "text-neutral-500",
  };

  return (
    <ResourcesLayout
      title="Directory"
      subtitle="Institutional RSE groups and peer organizations across the US and beyond."
      prevPage={{ path: "/resources", label: "Learn" }}
      nextPage={null}
    >
      {/* ── The stance — the field, mapped ───────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          The institutional RSE network
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-10 text-balance max-w-4xl">
          Where the RSE world{" "}
          <span className="text-teal-700">actually lives.</span>
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          A searchable directory of institutional RSE groups, national labs,
          agencies, and peer organizations &mdash; the places where the field
          is being built.
        </p>
      </section>

      {/* ── At a glance — 4-column facts strip ───────────────────── */}
      <section
        ref={factsRef}
        className={`mb-20 py-8 border-y border-neutral-200 grid grid-cols-2 md:grid-cols-4 ${
          factsInView ? "animate-fade-in" : "opacity-0"
        }`}
      >
        {keyFacts.map((f, i) => (
          <div
            key={f.label}
            className={`py-3 px-4 md:px-6 ${
              i > 0 ? "md:border-l md:border-neutral-200" : ""
            } ${i % 2 !== 0 ? "border-l border-neutral-200 md:border-l" : ""} ${
              i >= 2 ? "border-t border-neutral-200 md:border-t-0" : ""
            }`}
          >
            <p className="font-display text-xl lg:text-2xl font-bold text-teal-700 tracking-tight leading-none tabular-nums">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2.5">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── The directory — search + filter + results ────────────── */}
      <section ref={directoryRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            The directory
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {String(allEntries.length).padStart(2, "0")} entries
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          Find the people doing this work.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          Type to search across institutions, group names, and organizations.
          Filter by type to narrow the field.
        </p>

        {/* Filter bar — count anchor + search input */}
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:gap-8">
          <div className="flex items-baseline gap-3 lg:shrink-0">
            <span className="font-display text-5xl lg:text-6xl font-bold text-neutral-900 tabular-nums leading-none">
              {filtered.length.toString().padStart(2, "0")}
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">
              of {allEntries.length}
              <br />
              entries
            </span>
          </div>

          <div className="flex-1 w-full">
            <label htmlFor="directory-search" className="sr-only">
              Search the directory
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
                id="directory-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by institution, group, or organization"
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
        <div className="flex flex-wrap gap-2 mb-10">
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

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center border-t border-b border-neutral-100">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400 mb-3">
              No matches
            </p>
            <p className="font-display text-2xl font-bold text-neutral-900 mb-3">
              Nothing here yet &mdash; that could be your group.
            </p>
            <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
              If your institution or organization should be listed, open a
              pull request on our GitHub and we&rsquo;ll add it.
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
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
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
            {filtered.map((e, i) => {
              const isExternal = e.type === "External Org";
              const Wrapper: React.ElementType = isExternal && e.url ? "a" : "div";
              const wrapperProps = isExternal && e.url
                ? {
                    href: e.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "block",
                  }
                : {};
              return (
                <li
                  key={`${e.primary}-${e.secondary ?? e.url ?? ""}`}
                  className={`group py-3 border-b border-neutral-100 ${
                    directoryInView ? "animate-slide-up" : "opacity-0"
                  }`}
                  style={{
                    animationDelay: isFiltered
                      ? `${Math.min(i * 15, 200)}ms`
                      : `${Math.min(i * 20, 600)}ms`,
                  }}
                >
                  <Wrapper {...wrapperProps}>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold transition-colors ${
                          isExternal
                            ? "text-neutral-900 group-hover:text-teal-700"
                            : "text-neutral-900"
                        }`}
                      >
                        {highlight(e.primary, query)}
                      </span>
                      {e.secondary && (
                        <span className="text-sm text-neutral-500">
                          {highlight(e.secondary, query)}
                        </span>
                      )}
                      {isExternal && e.domain && (
                        <span className="font-mono text-[10px] text-neutral-400 truncate">
                          {e.domain}
                        </span>
                      )}
                      <span
                        className={`font-mono text-[9px] uppercase tracking-wider ml-auto shrink-0 ${typeColor[e.type]} opacity-60 group-hover:opacity-100 transition-opacity`}
                      >
                        {e.type}
                      </span>
                    </div>
                    {isExternal && e.desc && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {e.desc}
                      </p>
                    )}
                  </Wrapper>
                </li>
              );
            })}
          </ul>
        )}

        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 mt-6 flex items-center gap-2">
          <span className="inline-block w-6 h-px bg-neutral-300" aria-hidden="true" />
          {allEntries.length} entries listed &middot; submit additions via GitHub
        </p>
      </section>

      {/* ── CTA — submit a group ─────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Help keep the directory honest
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Missing a group? Submit it.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          The directory is open source. If your institution has an RSE team
          or you know of a peer organization we should list, open a pull
          request &mdash; or send us a note.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="https://github.com/USRSE/usrse.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Open a PR on GitHub
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </a>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>or email</span>
            <a
              href="mailto:contact@us-rse.org?subject=Directory%20Submission"
              className="text-neutral-700 hover:text-teal-700 transition-colors normal-case tracking-normal font-semibold"
            >
              contact@us-rse.org
            </a>
          </div>
        </div>
      </section>

      {/* ── Continue exploring — bridge cards ────────────────────── */}
      <section
        ref={bridgeRef}
        className="mb-4 pt-12 border-t-2 border-neutral-900"
      >
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Continue exploring
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-10">
          From here, the network connects.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {bridges.map((b, i) => (
            <Link
              key={b.path}
              to={b.path}
              className={`group bg-white p-6 md:p-7 flex items-center gap-5 hover:bg-neutral-50 transition-colors ${
                bridgeInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-1.5">
                  {b.eyebrow}
                </p>
                <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1 group-hover:text-teal-700 transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-neutral-500">{b.teaser}</p>
              </div>
              <svg
                className="w-5 h-5 text-neutral-400 group-hover:text-teal-700 transition-all group-hover:translate-x-1 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </ResourcesLayout>
  );
}
