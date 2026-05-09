import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useMemberSearch } from "@/hooks/useMemberSearch";
import type { MemberSearchResult } from "@/hooks/useMemberSearch";
import { formatMemberId } from "@/lib/member-id";
import { OrgLogo } from "@/components/profile/OrgLogo";

/**
 * Global command palette — cmd+k / ctrl+k from anywhere on the site
 * opens a centered editorial modal that lets you jump straight to a
 * member by name. Keyboard-first by design: `/` is the page-level
 * search shortcut on the directory, cmd-K is the global "I know who"
 * shortcut.
 *
 * Auth-gated quietly — the keyboard listener only attaches when a
 * WorkOS user is signed in, so the shortcut is a no-op for visitors
 * and there's no flash of an auth-walled modal.
 *
 * Visual direction: dark editorial surface (matches the profile hero
 * gradient), monospace shortcut framing, single-purpose. Not a full
 * "command bar" — just member lookup. Future: extend with recent
 * pages, profile actions, etc., but keep it sparse.
 */
const PALETTE_LIMIT = 8;

export function CommandPalette() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Keyboard listener: cmd/ctrl+K toggles. Lives at window level so
  // it works whether or not focus is in an input — except inside
  // contenteditable, where browser default chord behavior should win.
  useEffect(() => {
    if (!user) return;
    const handler = (e: KeyboardEvent) => {
      const isToggle =
        (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (!isToggle) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [user]);

  // Reset state when closing.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }
    // Defer focus to next paint so the portal node is mounted.
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const search = useMemberSearch(
    useMemo(
      () => ({
        q: query,
        disciplineIds: [],
        careerStageIds: [],
        countryIds: [],
        limit: PALETTE_LIMIT,
        offset: 0,
      }),
      [query]
    )
  );

  // Reset highlight when results change.
  useEffect(() => {
    setActiveIndex(0);
  }, [search.results]);

  const close = useCallback(() => setOpen(false), []);
  const selectAt = useCallback(
    (idx: number) => {
      const target = search.results[idx];
      if (!target) return;
      navigate(`/members/${target.slug}`);
      close();
    },
    [search.results, navigate, close]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) =>
          search.results.length === 0 ? 0 : (i + 1) % search.results.length
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) =>
          search.results.length === 0
            ? 0
            : (i - 1 + search.results.length) % search.results.length
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        selectAt(activeIndex);
        return;
      }
    },
    [search.results.length, activeIndex, selectAt, close]
  );

  // Keep the active row scrolled into view as the highlight moves —
  // a small affordance that turns the keyboard nav from "kind of
  // works" to "feels native."
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const node = list.querySelector<HTMLElement>(
      `[data-row-index="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!user || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] pb-12 animate-fade-in"
      onClick={close}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-purple-950/60 backdrop-blur-sm"
      />

      {/* Modal — clicks inside don't close it. */}
      <div
        className="relative w-full max-w-2xl bg-neutral-950 text-white rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Member search"
        aria-modal="true"
      >
        {/* Soft accent glow on the corner — the same teal tint the
            hero uses, just dimmer. */}
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"
        />

        <div className="relative">
          <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10">
            <span
              aria-hidden="true"
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-teal-300"
            >
              USR ➝
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Find a member by name…"
              className="flex-1 bg-transparent border-0 focus:outline-none text-xl font-display font-medium text-white placeholder:text-white/30 placeholder:font-normal"
              aria-label="Search members"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 px-2 py-1 border border-white/15 rounded">
              esc
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {query === "" ? (
              <EmptyHint />
            ) : search.status === "loading" && search.results.length === 0 ? (
              <PaletteSkeleton />
            ) : search.results.length === 0 ? (
              <NoMatches query={query} />
            ) : (
              <ul ref={listRef} role="listbox">
                {search.results.map((m, i) => (
                  <PaletteRow
                    key={m.memberId}
                    member={m}
                    index={i}
                    active={i === activeIndex}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => selectAt(i)}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/30">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              {search.status === "ready" && search.results.length > 0
                ? `${search.total} match${search.total === 1 ? "" : "es"}`
                : "member directory"}
            </p>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              <ShortcutHint keys={["↑", "↓"]} label="navigate" />
              <ShortcutHint keys={["⏎"]} label="open" />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────

function PaletteRow({
  member,
  index,
  active,
  onMouseEnter,
  onClick,
}: {
  member: MemberSearchResult;
  index: number;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  const initials = initialsFor(member.displayName);
  return (
    <li
      role="option"
      aria-selected={active}
      data-row-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`relative flex items-center gap-4 px-6 py-3.5 cursor-pointer border-l-[3px] transition-colors ${
        active
          ? "bg-white/5 border-teal-400"
          : "border-transparent hover:bg-white/[0.025]"
      }`}
    >
      {member.kind === "public" && member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt=""
          loading="lazy"
          className="w-9 h-9 rounded-full object-cover bg-white/10 ring-1 ring-white/10"
        />
      ) : (
        <PaletteHex initials={member.kind === "public" ? initials : null} />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-white truncate">
          {member.displayName}
        </p>
        {member.kind === "public" ? (
          <PublicByline member={member} />
        ) : (
          <p className="text-xs text-white/50 truncate">Private profile</p>
        )}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 shrink-0 hidden sm:block">
        {formatMemberId(member.memberId)}
      </p>
    </li>
  );
}

function PublicByline({
  member,
}: {
  member: Extract<MemberSearchResult, { kind: "public" }>;
}) {
  const job = member.jobTitle?.trim() || null;
  const org = member.organizationName?.trim() || null;
  const country = member.countryName?.trim() || null;

  if (!job && !org && !country) {
    return <p className="text-xs text-white/50 truncate">Member</p>;
  }

  return (
    <p className="text-xs text-white/50 truncate flex items-center gap-1.5">
      {job && <span>{job}</span>}
      {job && (org || country) && (
        <span className="text-white/30" aria-hidden="true">·</span>
      )}
      {org && (
        <span className="inline-flex items-center gap-1">
          <OrgLogo
            name={org}
            slug={member.organizationSlug ?? undefined}
            logoUrl={member.organizationLogoUrl}
            logoMarkUrl={member.organizationLogoMarkUrl}
            logoUsageConsent={member.organizationLogoUsageConsent}
            variant="mark"
            size="xs"
          />
          <span>{org}</span>
        </span>
      )}
      {org && country && (
        <span className="text-white/30" aria-hidden="true">·</span>
      )}
      {country && <span>{country}</span>}
    </p>
  );
}

function PaletteHex({ initials }: { initials: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block w-9 h-9 shrink-0"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        <path
          d="M 50 4 L 92 27 L 92 73 L 50 96 L 8 73 L 8 27 Z"
          fill="rgba(255,255,255,0.04)"
          stroke={initials ? "rgba(255,255,255,0.15)" : "rgba(216,212,229,0.3)"}
          strokeWidth={2}
          strokeDasharray={initials ? undefined : "3 3"}
          strokeLinejoin="round"
        />
        {initials && (
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize="34"
            fontWeight={600}
            fill="#5EEAD4"
            letterSpacing={1}
          >
            {initials}
          </text>
        )}
      </svg>
    </span>
  );
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {keys.map((k) => (
        <kbd
          key={k}
          className="px-1.5 py-0.5 bg-white/10 border border-white/15 rounded text-white/60 text-[10px]"
        >
          {k}
        </kbd>
      ))}
      <span>{label}</span>
    </span>
  );
}

function EmptyHint() {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">
        Type to begin
      </p>
      <p className="text-sm text-white/50 max-w-sm mx-auto leading-relaxed">
        Search the member roster by name. Use the directory at{" "}
        <span className="font-mono text-teal-300/80">/members</span> for
        filtering by discipline, career stage, or country.
      </p>
    </div>
  );
}

function NoMatches({ query }: { query: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3">
        ∅ no matches
      </p>
      <p className="text-sm text-white/50">
        Nothing in the roster matches{" "}
        <span className="font-mono text-white/70">"{query}"</span>.
      </p>
    </div>
  );
}

function PaletteSkeleton() {
  return (
    <ul aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-4 px-6 py-3.5 border-l-[3px] border-transparent animate-pulse"
        >
          <div className="w-9 h-9 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-white/10 rounded w-2/3" />
            <div className="h-2.5 bg-white/10 rounded w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function initialsFor(displayName: string): string {
  const source = displayName.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
