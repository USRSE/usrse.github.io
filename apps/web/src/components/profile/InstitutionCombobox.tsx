import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useApi } from "@/lib/api";

/**
 * Server-side search combobox over the institutions vocabulary.
 *
 * Institutions are too numerous to bundle (~1,400+) so this hits
 * /vocab/institutions/search?q= on each keystroke, debounced to keep
 * the request rate modest. Patterns mirrors VocabCombobox: portaled
 * dropdown, propose-new affordance, keyboard navigation, password-
 * manager-ignore hints.
 */

export interface InstitutionSimple {
  id: string;
  name: string;
  slug: string;
}

interface InstitutionComboboxProps {
  /** Already-linked institution ids — filtered out so duplicates aren't pickable. */
  excludeIds: string[];
  onPick: (item: InstitutionSimple) => void;
  onPropose: (name: string) => void;
  onDismiss?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const MAX_VISIBLE = 8;
const DEBOUNCE_MS = 220;

export function InstitutionCombobox({
  excludeIds,
  onPick,
  onPropose,
  onDismiss,
  placeholder = "Search institutions…",
  autoFocus = false,
}: InstitutionComboboxProps) {
  const reactId = useId();
  const inputId = `inst-${reactId}`;
  const listboxId = `${inputId}-listbox`;
  const apiFetch = useApi();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<InstitutionSimple[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const requestTokenRef = useRef(0);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  // Debounced server search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const token = ++requestTokenRef.current;
    const handle = window.setTimeout(async () => {
      try {
        const res = await apiFetch(
          `/vocab/institutions/search?q=${encodeURIComponent(q)}&limit=${MAX_VISIBLE}`
        );
        if (token !== requestTokenRef.current) return;
        if (!res.ok) {
          setResults([]);
          setLoading(false);
          return;
        }
        const body = (await res.json()) as {
          ok: boolean;
          results?: InstitutionSimple[];
        };
        setResults(
          (body.results ?? []).filter((r) => !excludeSet.has(r.id))
        );
        setLoading(false);
      } catch {
        if (token !== requestTokenRef.current) return;
        setResults([]);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, apiFetch, excludeSet]);

  const trimmedQuery = query.trim();
  const exactMatchExists = useMemo(
    () =>
      trimmedQuery.length > 0 &&
      results.some(
        (it) => it.name.toLowerCase() === trimmedQuery.toLowerCase()
      ),
    [results, trimmedQuery]
  );
  const canPropose = trimmedQuery.length >= 2 && !exactMatchExists && !loading;
  const proposeIndex = canPropose ? results.length : -1;
  const totalRows = results.length + (canPropose ? 1 : 0);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, canPropose]);

  const showMenu = open && trimmedQuery.length >= 2 && (totalRows > 0 || loading);

  useLayoutEffect(() => {
    if (!showMenu) {
      setMenuRect(null);
      return;
    }
    function measure() {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setMenuRect({
        top: r.bottom + window.scrollY + 4,
        left: r.left + window.scrollX,
        width: r.width,
      });
    }
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrapper =
        wrapperRef.current && wrapperRef.current.contains(target);
      const insideMenu = listRef.current && listRef.current.contains(target);
      if (!insideWrapper && !insideMenu) {
        setOpen(false);
        if (!query) onDismiss?.();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, query, onDismiss]);

  useEffect(() => {
    if (!showMenu) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-row="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showMenu]);

  function commitAt(idx: number) {
    if (idx < results.length) {
      onPick(results[idx]);
    } else if (idx === proposeIndex) {
      onPropose(trimmedQuery);
    } else {
      return;
    }
    setQuery("");
    setResults([]);
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalRows === 0) return;
      setActiveIndex((i) => (i + 1) % totalRows);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalRows === 0) return;
      setActiveIndex((i) => (i - 1 + totalRows) % totalRows);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (totalRows === 0) return;
      commitAt(activeIndex);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (query) {
        setQuery("");
      } else {
        setOpen(false);
        onDismiss?.();
      }
    }
  }

  return (
    <div ref={wrapperRef} className="relative inline-block w-full">
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showMenu}
        aria-controls={showMenu ? listboxId : undefined}
        aria-activedescendant={
          showMenu && activeIndex >= 0
            ? `${listboxId}-${activeIndex}`
            : undefined
        }
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-lpignore="true"
        data-bwignore="true"
        data-form-type="other"
        name={`institution-${reactId}`}
        className="font-mono text-xs px-3 py-2 rounded-full bg-white border border-dashed border-neutral-300 text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-purple-400 focus:bg-purple-50/30 transition-colors w-full"
      />

      {showMenu && menuRect &&
        createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            style={{
              position: "absolute",
              top: menuRect.top,
              left: menuRect.left,
              width: Math.max(menuRect.width, 280),
            }}
            className="z-[100] max-h-72 overflow-y-auto bg-white border border-neutral-200 rounded-xl shadow-lg ring-1 ring-black/5 py-1"
          >
            {loading && results.length === 0 && (
              <li className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                searching…
              </li>
            )}

            {results.map((item, i) => (
              <li
                key={item.id}
                id={`${listboxId}-${i}`}
                data-row={i}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitAt(i);
                }}
                className={`relative cursor-pointer px-4 py-2 transition-colors ${
                  i === activeIndex
                    ? "bg-purple-50/70"
                    : "hover:bg-neutral-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-0 bottom-0 w-[2px] transition-colors ${
                    i === activeIndex ? "bg-teal-500" : "bg-transparent"
                  }`}
                />
                <p className="text-sm text-neutral-900 leading-tight">
                  {item.name}
                </p>
              </li>
            ))}

            {canPropose && (
              <li
                id={`${listboxId}-${proposeIndex}`}
                data-row={proposeIndex}
                role="option"
                aria-selected={proposeIndex === activeIndex}
                onMouseEnter={() => setActiveIndex(proposeIndex)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitAt(proposeIndex);
                }}
                className={`relative cursor-pointer px-4 py-2.5 border-t border-neutral-100 mt-1 transition-colors ${
                  proposeIndex === activeIndex
                    ? "bg-purple-50/70"
                    : "hover:bg-neutral-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-0 bottom-0 w-[2px] transition-colors ${
                    proposeIndex === activeIndex
                      ? "bg-purple-500"
                      : "bg-transparent"
                  }`}
                />
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-600 mb-0.5">
                  + Propose new institution
                </p>
                <p className="text-sm text-neutral-900 leading-tight">
                  "{trimmedQuery}"
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                    pending review
                  </span>
                </p>
              </li>
            )}
          </ul>,
          document.body
        )}
    </div>
  );
}
