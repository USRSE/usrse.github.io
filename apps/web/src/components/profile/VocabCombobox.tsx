import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/**
 * Type-ahead combobox over an in-memory controlled vocabulary list.
 * Used by the Craft section to add disciplines and skills — search
 * by substring, pick an existing approved entry, or propose a new
 * term that lands in the vocab table with status="pending" pending
 * admin review.
 *
 * The vocab is small enough (a few hundred rows per axis) that we
 * filter client-side. The dropdown portals to <body> with a measured
 * position so transformed/animated ancestors (e.g., the dossier's
 * RevealOnView wrappers) can't sandwich it behind their own stacking
 * layers — same pattern as LocationCombobox.
 */

export interface VocabSimple {
  id: string;
  name: string;
  slug: string;
}

interface VocabComboboxProps {
  /** Approved vocab list to search. Comes from /vocab via useVocab. */
  items: VocabSimple[];
  /** Already-linked vocab ids — filtered out so duplicates aren't pickable. */
  excludeIds: string[];
  /** Existing pick. */
  onPick: (item: VocabSimple) => void;
  /** Propose a new term not already in the list. */
  onPropose: (name: string) => void;
  /** User pressed Esc / clicked away with the input empty. */
  onDismiss?: () => void;
  /** Placeholder for the search input. */
  placeholder?: string;
  /** Text in the "+ Propose 'xxx' as new <kind>" affordance. */
  proposeKind?: string;
  /** Auto-focus the input on mount. */
  autoFocus?: boolean;
}

const MAX_VISIBLE = 8;

export function VocabCombobox({
  items,
  excludeIds,
  onPick,
  onPropose,
  onDismiss,
  placeholder = "Search…",
  proposeKind = "term",
  autoFocus = false,
}: VocabComboboxProps) {
  const reactId = useId();
  const inputId = `vocab-${reactId}`;
  const listboxId = `${inputId}-listbox`;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as VocabSimple[];
    const out: VocabSimple[] = [];
    for (const it of items) {
      if (excludeSet.has(it.id)) continue;
      if (it.name.toLowerCase().includes(q)) out.push(it);
      if (out.length >= MAX_VISIBLE) break;
    }
    return out;
  }, [items, query, excludeSet]);

  const trimmedQuery = query.trim();
  const exactMatchExists = useMemo(
    () =>
      trimmedQuery.length > 0 &&
      items.some(
        (it) => it.name.toLowerCase() === trimmedQuery.toLowerCase()
      ),
    [items, trimmedQuery]
  );
  const canPropose = trimmedQuery.length >= 2 && !exactMatchExists;

  // Total navigable rows = filtered matches + (1 if propose row visible).
  const proposeIndex = canPropose ? filtered.length : -1;
  const totalRows = filtered.length + (canPropose ? 1 : 0);

  useEffect(() => {
    setActiveIndex(0);
  }, [filtered.length, canPropose]);

  const showMenu = open && trimmedQuery.length > 0 && totalRows > 0;

  // Position the portaled menu directly below the input. Same
  // pattern as LocationCombobox for the same stacking-context
  // reasons.
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

  // Close on outside click — wrapper or portaled menu both count
  // as "inside" for our purposes.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  // Keep highlighted row in view.
  useEffect(() => {
    if (!showMenu) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-row="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showMenu]);

  function commitAt(idx: number) {
    if (idx < filtered.length) {
      onPick(filtered[idx]);
    } else if (idx === proposeIndex) {
      onPropose(trimmedQuery);
    } else {
      return;
    }
    setQuery("");
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
    <div ref={wrapperRef} className="relative inline-block">
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
        // Same password-manager-ignore hints as LocationCombobox to
        // prevent extensions from injecting fill icons over the
        // chip-add input.
        data-1p-ignore="true"
        data-lpignore="true"
        data-bwignore="true"
        data-form-type="other"
        name={`vocab-${reactId}`}
        className="font-mono text-xs px-3 py-1.5 rounded-full bg-white border border-dashed border-neutral-300 text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-purple-400 focus:bg-purple-50/30 transition-colors min-w-[12rem]"
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
              width: Math.max(menuRect.width, 240),
            }}
            className="z-[100] max-h-72 overflow-y-auto bg-white border border-neutral-200 rounded-xl shadow-lg ring-1 ring-black/5 py-1"
          >
            {filtered.map((item, i) => (
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
                  + Propose new {proposeKind}
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
