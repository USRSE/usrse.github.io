import { useEffect, useRef, useState } from "react";
import { useOrganizations, type OrgType, type OrgRow } from "@/hooks/useOrganizations";
import { OrgCard } from "./OrgCard";

const TYPE_CHIPS: Array<{ value: OrgType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "university", label: "University" },
  { value: "national_lab", label: "National Lab" },
  { value: "agency", label: "Agency" },
  { value: "company", label: "Company" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "external_resource", label: "External Resource" },
];

export function OrgsDirectoryPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<OrgType | "all">("all");
  const [country, setCountry] = useState<string>("");
  const [memberOnly, setMemberOnly] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [accumulated, setAccumulated] = useState<OrgRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useOrganizations({
    q,
    type,
    country: country || undefined,
    member: memberOnly,
    cursor: cursor ?? undefined,
    limit: 50,
  });

  // Keyboard shortcuts mirrored from legacy DirectoryPage:
  // `/` focuses the input, `Esc` clears it.
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
        setQ("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset accumulated rows whenever the filter set changes.
  useEffect(() => {
    setAccumulated([]);
    setCursor(null);
  }, [q, type, country, memberOnly]);

  // Append page on cursor advance.
  useEffect(() => {
    if (!data) return;
    if (cursor === null) {
      setAccumulated(data.rows);
    } else {
      setAccumulated((prev) => [...prev, ...data.rows]);
    }
  }, [data, cursor]);

  const facets = data?.facets;
  const topCountries = facets
    ? Object.entries(facets.countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero banner — purple to distinguish from community (teal) */}
      <div className="bg-gradient-to-br from-purple-950 via-purple-800 to-purple-600 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white tracking-tight animate-slide-up">
            Organizations
          </h1>
          <p
            className="mt-4 text-lg text-white/60 max-w-2xl leading-relaxed animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            The organizations where RSE work happens.
          </p>
          {facets && (
            <p
              className="mt-3 font-mono text-sm text-white/40 animate-slide-up tabular-nums"
              style={{ animationDelay: "200ms" }}
            >
              {facets.types.university ?? 0} universities ·{" "}
              {facets.types.national_lab ?? 0} national labs ·{" "}
              {facets.types.agency ?? 0} agencies
            </p>
          )}
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[calc(4rem+4px)] z-10 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 space-y-3">
          {/* Search input */}
          <div className="relative group">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-purple-600 transition-colors"
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
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search organizations"
              spellCheck={false}
              autoComplete="off"
              className="w-full h-11 pl-11 pr-12 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 transition"
            />
            {q ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
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

          {/* Type chips */}
          <div className="flex flex-wrap gap-2">
            {TYPE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setType(chip.value)}
                aria-pressed={type === chip.value}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all ${
                  type === chip.value
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Country + member toggle */}
          <div className="flex items-center gap-4">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/15 transition"
            >
              <option value="">All countries</option>
              {topCountries.map(([c, n]) => (
                <option key={c} value={c}>
                  {c} ({n})
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={memberOnly}
                onChange={(e) => setMemberOnly(e.target.checked)}
                className="accent-purple-600"
              />
              US-RSE member orgs only
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {isLoading && accumulated.length === 0 && (
          <div className="text-center text-neutral-500 py-20">
            <p className="font-mono text-sm uppercase tracking-wider">Loading…</p>
          </div>
        )}

        {!isLoading && accumulated.length === 0 && (
          <div className="text-center py-20">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400 mb-3">
              No matches
            </p>
            <p className="font-display text-2xl font-bold text-neutral-900 mb-4">
              No organizations match those filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setType("all");
                setCountry("");
                setMemberOnly(false);
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors"
            >
              Clear filters
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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accumulated.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>

        {data?.nextCursor != null && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setCursor(data.nextCursor)}
              disabled={isLoading}
              className="rounded-xl border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-700 hover:border-purple-500 hover:text-purple-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
