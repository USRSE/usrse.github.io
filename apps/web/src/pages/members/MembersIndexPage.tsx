import { useEffect, useMemo, useRef } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useMemberSearch } from "@/hooks/useMemberSearch";
import { useVocab } from "@/hooks/useVocab";
import type { VocabCareerStage, VocabCountry, VocabDiscipline } from "@/hooks/useVocab";
import { MemberCard } from "@/components/members/MemberCard";

/**
 * Authenticated member directory. Designed as an *editorial archival
 * index* — the back-matter of a research-journal volume rather than a
 * SaaS dashboard. The tone is: numbered entries, tight typographic
 * hierarchy, mono eyebrows, sparing motion. Reuses the existing
 * brand tokens (purple→teal hero gradient, hex stamps, gap-px pillar
 * grids) so it sits next to the dossier without feeling stitched on.
 */

const PAGE_SIZE = 24;

export function MembersIndexPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const q = searchParams.get("q") ?? "";
  const disciplineIds = parseList(searchParams.get("discipline"));
  const careerStageIds = parseList(searchParams.get("careerStage"));
  const countryIds = parseList(searchParams.get("country"));
  const offset = Math.max(0, Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0);

  const vocab = useVocab();
  const search = useMemberSearch({
    q,
    disciplineIds,
    careerStageIds,
    countryIds,
    limit: PAGE_SIZE,
    offset,
  });

  // `/` focuses the search input from anywhere on the page —
  // matching the convention DirectoryPage already establishes for
  // its institutions index.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      e.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (authLoading) return <PageSkeleton />;
  if (!user) return <Navigate to="/sign-in" replace />;

  const hasFilters =
    disciplineIds.length + careerStageIds.length + countryIds.length > 0;

  function patchParams(patch: Record<string, string | null>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      // Any meaningful filter/query change resets pagination; the
      // current offset would otherwise point off the end of the new
      // result set and surface an empty page.
      next.delete("offset");
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      return next;
    });
  }

  function toggleFilter(key: string, id: string) {
    const current = parseList(searchParams.get(key));
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    patchParams({ [key]: next.length ? next.join(",") : null });
  }

  function clearAll() {
    setSearchParams(new URLSearchParams());
  }

  function loadMore() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("offset", String(offset + PAGE_SIZE));
      return next;
    });
  }

  return (
    <article className="bg-white">
      <Hero total={search.status === "ready" ? search.total : null} />

      <SearchBar
        inputRef={searchInputRef}
        value={q}
        onChange={(v) => patchParams({ q: v || null })}
        total={search.status === "ready" ? search.total : null}
        loading={search.status === "loading"}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* ── Filter sidebar ─────────────────────────────────────── */}
          <aside className="lg:w-72 lg:shrink-0">
            <div className="lg:sticky lg:top-24 space-y-10">
              <FacetHeader hasFilters={hasFilters} onClear={clearAll} />
              <FacetGroup
                eyebrow="α · Discipline"
                items={vocab.vocab?.disciplines ?? []}
                getId={(d: VocabDiscipline) => d.id}
                getLabel={(d: VocabDiscipline) => d.name}
                selected={disciplineIds}
                onToggle={(id) => toggleFilter("discipline", id)}
                loading={vocab.status === "loading"}
              />
              <FacetGroup
                eyebrow="β · Career stage"
                items={vocab.vocab?.careerStages ?? []}
                getId={(c: VocabCareerStage) => c.id}
                getLabel={(c: VocabCareerStage) => c.label}
                selected={careerStageIds}
                onToggle={(id) => toggleFilter("careerStage", id)}
                loading={vocab.status === "loading"}
              />
              <FacetGroup
                eyebrow="γ · Country"
                items={vocab.vocab?.countries ?? []}
                getId={(c: VocabCountry) => c.id}
                getLabel={(c: VocabCountry) => c.name}
                selected={countryIds}
                onToggle={(id) => toggleFilter("country", id)}
                loading={vocab.status === "loading"}
                collapsible
              />
            </div>
          </aside>

          {/* ── Results stream ─────────────────────────────────────── */}
          <section className="flex-1 min-w-0">
            <ResultsStream
              search={search}
              startIndex={offset + 1}
              hasFilters={hasFilters || q.length > 0}
              onClear={clearAll}
              onLoadMore={loadMore}
            />
          </section>
        </div>
      </div>
    </article>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────

function Hero({ total }: { total: number | null }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-purple-950 via-purple-800 to-purple-600 py-14 lg:py-20">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-teal-500/20 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6 animate-fade-in"
        >
          <span
            className="w-2 h-2 rounded-full bg-teal-300 animate-pulse-soft"
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-white/80 tracking-wide uppercase font-mono">
            Index of members · USR-Network
          </span>
        </div>

        <h1
          className="font-display text-5xl lg:text-7xl font-bold tracking-tight leading-[1.02] text-white animate-slide-up text-balance max-w-4xl"
          style={{ animationDelay: "120ms" }}
        >
          The community, indexed.
        </h1>

        <p
          className="mt-6 text-lg lg:text-xl text-white/70 leading-relaxed max-w-2xl animate-slide-up"
          style={{ animationDelay: "240ms" }}
        >
          Search by name, institution, or discipline. Filter by career stage and
          country. Find the people behind the research software.
        </p>

        <p
          className="mt-7 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40 animate-fade-in"
          style={{ animationDelay: "360ms" }}
        >
          {total == null ? "loading roster…" : `${total} members listed`}
          <span className="mx-2 text-white/20">·</span>
          press <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-[10px] mx-0.5">/</kbd> to search
        </p>
      </div>
    </header>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────

function SearchBar({
  inputRef,
  value,
  onChange,
  total,
  loading,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  total: number | null;
  loading: boolean;
}) {
  return (
    <div className="border-b border-neutral-200 bg-white sticky top-0 z-10 backdrop-blur-sm bg-white/90">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-12 gap-4 items-center py-5">
          <span
            aria-hidden="true"
            className="hidden lg:block col-span-1 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400"
          >
            Query ➝
          </span>
          <div className="col-span-12 lg:col-span-9 flex items-center gap-3">
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search by name, institution, or keyword…"
              className="w-full bg-transparent border-0 border-b border-transparent focus:border-purple-500 focus:outline-none text-lg lg:text-2xl font-display font-medium text-neutral-900 placeholder:text-neutral-300 placeholder:font-normal py-1 transition-colors"
              aria-label="Search members"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 hover:text-purple-600 transition-colors shrink-0"
                aria-label="Clear search"
              >
                clear
              </button>
            )}
          </div>
          <p className="hidden lg:block col-span-2 text-right font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 tabular-nums">
            {loading
              ? "searching…"
              : total != null
                ? `${total} match${total === 1 ? "" : "es"}`
                : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Filter sidebar ────────────────────────────────────────────────────

function FacetHeader({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-neutral-200 pb-3">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
        Filters
      </h2>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-600 hover:text-purple-800 transition-colors"
        >
          clear all
        </button>
      )}
    </div>
  );
}

interface FacetGroupProps<T> {
  eyebrow: string;
  items: T[];
  getId: (t: T) => string;
  getLabel: (t: T) => string;
  selected: string[];
  onToggle: (id: string) => void;
  loading: boolean;
  collapsible?: boolean;
}

function FacetGroup<T>({
  eyebrow,
  items,
  getId,
  getLabel,
  selected,
  onToggle,
  loading,
  collapsible = false,
}: FacetGroupProps<T>) {
  // Show all items by default. Long lists (countries) collapse to
  // the first ~10 with a show-all toggle so the sidebar doesn't run
  // longer than the result column on default state.
  const visibleLimit = collapsible && items.length > 10 ? 10 : items.length;
  const visible = items.slice(0, visibleLimit);
  const overflow = items.length - visibleLimit;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-3">
        {eyebrow}
      </h3>
      {loading ? (
        <ul className="space-y-2" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="h-4 bg-neutral-100 rounded w-3/4 animate-pulse" />
          ))}
        </ul>
      ) : (
        <ul className="space-y-1.5">
          {visible.map((item) => {
            const id = getId(item);
            const label = getLabel(item);
            const checked = selectedSet.has(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onToggle(id)}
                  aria-pressed={checked}
                  className={`group w-full flex items-center gap-3 text-left text-sm leading-tight py-1 transition-colors ${
                    checked
                      ? "text-neutral-900"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`relative w-3.5 h-3.5 shrink-0 rounded-sm border transition-colors ${
                      checked
                        ? "bg-purple-500 border-purple-500"
                        : "bg-white border-neutral-300 group-hover:border-purple-300"
                    }`}
                  >
                    {checked && (
                      <svg
                        viewBox="0 0 12 12"
                        className="absolute inset-0 w-full h-full text-white"
                      >
                        <path
                          d="M2.5 6.5 L5 9 L9.5 3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
          {overflow > 0 && (
            <li className="pt-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                +{overflow} more — refine via search
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Results stream ────────────────────────────────────────────────────

function ResultsStream({
  search,
  startIndex,
  hasFilters,
  onClear,
  onLoadMore,
}: {
  search: ReturnType<typeof useMemberSearch>;
  startIndex: number;
  hasFilters: boolean;
  onClear: () => void;
  onLoadMore: () => void;
}) {
  if (search.status === "loading" && search.results.length === 0) {
    return <ResultsSkeleton />;
  }

  if (search.status === "error") {
    return (
      <div className="border-t border-neutral-200 py-16 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-rose-600 mb-3">
          Error · could not load roster
        </p>
        <p className="text-base text-neutral-600 max-w-md mx-auto">
          {search.error?.message ?? "Unknown error"}
        </p>
      </div>
    );
  }

  if (search.status === "ready" && search.results.length === 0) {
    return (
      <div className="border-t border-neutral-200 py-16 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">
          ∅ no matches
        </p>
        <h3 className="font-display text-2xl font-semibold text-neutral-900 mb-3 tracking-tight">
          No members fit those constraints.
        </h3>
        <p className="text-base text-neutral-600 max-w-md mx-auto mb-8">
          Try a broader query, or strip a filter to widen the index.
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-600 hover:text-purple-800 transition-colors"
          >
            clear all filters →
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <ol className="border-b border-neutral-200">
        {search.results.map((m, i) => (
          <li key={m.memberId}>
            <MemberCard member={m} index={startIndex + i} />
          </li>
        ))}
      </ol>

      <div className="mt-10 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 tabular-nums">
          showing {startIndex.toString().padStart(2, "0")}–
          {(startIndex + search.results.length - 1).toString().padStart(2, "0")}{" "}
          of {search.total}
        </p>
        {search.hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={search.status === "loading"}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white font-mono text-[10px] uppercase tracking-[0.25em] rounded-full hover:bg-purple-600 transition-colors disabled:opacity-60"
          >
            {search.status === "loading" ? "loading…" : "load more →"}
          </button>
        )}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <ol className="border-b border-neutral-200" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="border-t border-neutral-200 px-2 py-7 grid grid-cols-12 gap-4 lg:gap-6 animate-pulse"
        >
          <div className="col-span-3 sm:col-span-2 flex items-start gap-3 lg:gap-4">
            <div className="w-6 h-3 bg-neutral-100 rounded mt-2" />
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-neutral-100" />
          </div>
          <div className="col-span-9 sm:col-span-7 space-y-2">
            <div className="h-5 bg-neutral-100 rounded w-2/3" />
            <div className="h-3.5 bg-neutral-100 rounded w-1/2" />
            <div className="h-3 bg-neutral-100 rounded w-1/3" />
          </div>
          <div className="hidden sm:flex sm:col-span-3 flex-col items-end gap-1.5">
            <div className="h-3 bg-neutral-100 rounded w-20" />
            <div className="h-3 bg-neutral-100 rounded w-12" />
          </div>
        </li>
      ))}
    </ol>
  );
}

function PageSkeleton() {
  return <div className="min-h-[60vh]" aria-hidden="true" />;
}

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
