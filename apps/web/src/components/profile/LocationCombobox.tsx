import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Location autocomplete backed by Photon (komoot.io) — an open-source
 * geocoder built on top of OpenStreetMap data, designed specifically
 * for typeahead use. We hit the public instance directly from the
 * browser; the public endpoint requires no API key and supports the
 * lookup volume an RSE-scale roster needs.
 *
 * The combobox is permissive about free text. If a user types a place
 * Photon doesn't return a match for (a research station, a private
 * address, a name spelled idiosyncratically), pressing Enter saves
 * the raw string as the public-facing label with no coordinates —
 * always more useful than rejecting input.
 *
 * Keyboard model:
 *   ↓ / ↑          highlight next / prev suggestion
 *   Enter           commit highlighted suggestion (or raw text)
 *   Esc             collapse the menu without changing the value
 *   Tab             move focus on, also commits raw text if open
 */

const PHOTON_ENDPOINT = "https://photon.komoot.io/api";
const DEBOUNCE_MS = 220;
const RESULT_LIMIT = 8;

export interface LocationValue {
  /** Human-readable label saved as profile.publicLocation. */
  display: string;
  /** ISO 3166-1 alpha-2 (uppercase). Server resolves to countryId. */
  countryIso2: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const EMPTY_LOCATION: LocationValue = {
  display: "",
  countryIso2: null,
  city: null,
  region: null,
  latitude: null,
  longitude: null,
};

interface LocationComboboxProps {
  id?: string;
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface PhotonProperties {
  name?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  type?: string;
  osm_value?: string;
}

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: PhotonProperties;
}

interface Suggestion extends LocationValue {
  /** Stable key for React reconciliation across debounced refetches. */
  key: string;
  /**
   * Primary line shown in the dropdown — includes the country for
   * disambiguation across same-named cities. Distinct from
   * `display` (the saved value), which omits the country since the
   * country renders separately on the dossier alongside the place
   * line and would otherwise duplicate.
   */
  menuLine: string;
  /** Secondary line shown under `menuLine` (place kind, country code). */
  secondary: string;
}

export function LocationCombobox({
  id,
  value,
  onChange,
  placeholder = "City, region, or country…",
  disabled = false,
}: LocationComboboxProps) {
  const reactId = useId();
  const inputId = id ?? `location-${reactId}`;
  const listboxId = `${inputId}-listbox`;

  const [query, setQuery] = useState(value.display);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  // Position of the dropdown — computed from the input's bounding
  // rect every time the menu opens or the page scrolls/resizes,
  // because the menu is portaled to <body> and can't rely on
  // CSS-only anchoring anymore.
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Whether the live `query` represents an unconfirmed edit (i.e.,
  // the user has typed something different from the saved
  // `value.display`). When dirty and the user navigates away, we
  // commit the raw text as a free-text location.
  const dirty = query !== value.display;

  // Sync inbound value changes (e.g., parent reset on cancel) into
  // the local query.
  useEffect(() => {
    setQuery(value.display);
  }, [value.display]);

  // Debounced fetch.
  useEffect(() => {
    const trimmed = query.trim();
    // The menu is only useful for unconfirmed edits — if the
    // current query matches the committed value, the user isn't
    // searching, they're just looking at it.
    if (!dirty || trimmed.length < 2) {
      setSuggestions([]);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const url =
          `${PHOTON_ENDPOINT}?q=${encodeURIComponent(trimmed)}` +
          `&limit=${RESULT_LIMIT}&lang=en`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`photon ${res.status}`);
        const data = (await res.json()) as {
          features?: PhotonFeature[];
        };
        const next = (data.features ?? [])
          .map(featureToSuggestion)
          .filter((s): s is Suggestion => s !== null);
        setSuggestions(next);
        setActiveIndex(next.length > 0 ? 0 : -1);
        setStatus("idle");
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setSuggestions([]);
        setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, dirty]);

  // Measure the input's position so the portaled dropdown can sit
  // directly below it. Re-measures on scroll/resize because the
  // portal lives in document.body coordinates and won't follow the
  // input automatically when the page reflows.
  const showMenu =
    open && (status === "loading" || status === "error" || suggestions.length > 0);

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

  // Close on outside click. The dropdown is portaled to <body>, so
  // it isn't a descendant of wrapperRef — we have to also accept
  // clicks inside listRef as "inside" to avoid closing the menu the
  // moment a user tries to click a suggestion.
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrapper =
        wrapperRef.current && wrapperRef.current.contains(target);
      const insideMenu = listRef.current && listRef.current.contains(target);
      if (!insideWrapper && !insideMenu) {
        commitRawIfDirty();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, dirty]);

  // Keep the active row scrolled into view as the highlight moves.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-suggestion="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function commitSuggestion(s: Suggestion) {
    onChange({
      display: s.display,
      countryIso2: s.countryIso2,
      city: s.city,
      region: s.region,
      latitude: s.latitude,
      longitude: s.longitude,
    });
    setQuery(s.display);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
  }

  function commitRawIfDirty() {
    if (!dirty) return;
    const trimmed = query.trim();
    onChange({
      display: trimmed,
      countryIso2: null,
      city: null,
      region: null,
      latitude: null,
      longitude: null,
    });
  }

  function clear() {
    onChange(EMPTY_LOCATION);
    setQuery("");
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) =>
        suggestions.length === 0 ? -1 : (i + 1) % suggestions.length
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        suggestions.length === 0
          ? -1
          : (i - 1 + suggestions.length) % suggestions.length
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const pick =
        activeIndex >= 0 ? suggestions[activeIndex] : undefined;
      if (pick) {
        commitSuggestion(pick);
      } else {
        commitRawIfDirty();
        setOpen(false);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      // Esc reverts to the saved value rather than clearing — the
      // user is bailing out of the edit.
      setQuery(value.display);
      setOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    if (e.key === "Tab") {
      // Tab commits raw text and lets focus move on naturally.
      commitRawIfDirty();
      setOpen(false);
    }
  }

  const hasCoords = value.latitude != null && value.longitude != null && !dirty;
  const hasAnything = Boolean(query || value.display);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Inner wrapper anchors the absolute suggestion menu directly
          below the input — keeping the status row from getting
          covered when the menu opens, and the menu from drifting
          when the status row's content changes height. */}
      <div className="relative">
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
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          // Password-manager ignore hints. Without these, 1Password,
          // LastPass, Bitwarden, etc. inject a fill icon at the right
          // edge of the input. The four attributes cover the major
          // managers; harmless for users without an extension. The
          // status row below the input means a stubborn extension
          // can't collide with our adornments either way.
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
          data-form-type="other"
          name="profile-location"
          className="editorial-input"
        />
        {/* Suggestion menu — portaled to <body> with computed
            absolute coords. Living outside any ancestor stacking
            context means transformed/animated parents (e.g. the
            RevealOnView wrappers around each profile section) can't
            sandwich the dropdown behind their own stacking layer. */}
        {showMenu && menuRect &&
          createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Location suggestions"
            style={{
              position: "absolute",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
            }}
            className="z-[100] max-h-72 overflow-y-auto bg-white border border-neutral-200 rounded-xl shadow-lg ring-1 ring-black/5 py-1"
          >
            {status === "loading" && suggestions.length === 0 && (
              <li className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                consulting OSM…
              </li>
            )}
            {status === "error" && (
              <li className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-rose-600">
                ! couldn't reach the geocoder. press Enter to keep the raw text.
              </li>
            )}
            {suggestions.map((s, i) => (
              <li
                key={s.key}
                id={`${listboxId}-${i}`}
                data-suggestion={i}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  // mousedown rather than click so the selection
                  // commits before the input's blur handler fires.
                  e.preventDefault();
                  commitSuggestion(s);
                }}
                className={`relative cursor-pointer px-4 py-2.5 transition-colors ${
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
                  {s.menuLine}
                </p>
                {s.secondary && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-0.5">
                    {s.secondary}
                  </p>
                )}
              </li>
            ))}
            {/* OSM ODbL requires visible attribution wherever the
                data is shown. Living inside the menu means the
                credit is present whenever the user sees results
                derived from OSM, but doesn't clutter the form when
                the field is dormant. */}
            {suggestions.length > 0 && (
              <li
                role="presentation"
                className="px-4 py-2 mt-1 border-t border-neutral-100 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400"
              >
                © {" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseDown={(e) => e.stopPropagation()}
                  className="underline decoration-neutral-300 hover:text-purple-600 hover:decoration-purple-500 underline-offset-2"
                >
                  OpenStreetMap contributors
                </a>
              </li>
            )}
          </ul>,
          document.body
        )}
      </div>

      {/* Status row — sits below the input so the value, the
          coords-on-file mark, and the clear affordance never have
          to share horizontal space with each other or with a
          password-manager icon. Mono labels match the form's
          typographic register. */}
      <div className="mt-1.5 flex items-center justify-between gap-3 min-h-[1.1rem]">
        <div className="flex items-center gap-3 min-w-0">
          {status === "loading" && (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
              searching…
            </span>
          )}
          {status !== "loading" && hasCoords && (
            <span
              title="Coordinates on file"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-600"
            >
              ⌖ geocoded · coordinates on file
            </span>
          )}
          {status !== "loading" && !hasCoords && hasAnything && !dirty && (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
              free text · no coordinates
            </span>
          )}
        </div>
        {hasAnything && !disabled && (
          <button
            type="button"
            onClick={clear}
            tabIndex={-1}
            aria-label="Clear location"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-purple-600 transition-colors shrink-0"
          >
            clear
          </button>
        )}
      </div>

    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

function featureToSuggestion(f: PhotonFeature): Suggestion | null {
  const p = f.properties;
  // Photon coords are [lng, lat].
  const [lng, lat] = f.geometry.coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") return null;

  const primary = (p.name ?? p.city ?? "").trim();
  const region = (p.state ?? p.county ?? "").trim();
  const country = (p.country ?? "").trim();
  const countryIso2 = (p.countrycode ?? "").toUpperCase().trim() || null;

  if (!primary && !country) return null;

  // menuLine — what the user sees in the dropdown. Includes the
  // country so "Boulder, Colorado · United States" is distinguishable
  // from "Boulder, Wyoming · United States".
  const menuParts: string[] = [];
  if (primary) menuParts.push(primary);
  if (region && region !== primary) menuParts.push(region);
  let menuLine = menuParts.join(", ");
  if (country) menuLine = menuLine ? `${menuLine} · ${country}` : country;

  // display — what gets saved as profile.publicLocation. Country is
  // intentionally omitted because the dossier composes the public
  // place line as `publicLocation · countryName` from the resolved
  // country reference; including the country name in the saved
  // string would render twice ("Seattle · US · US"). When the picked
  // result IS a country (primary === country), the saved display is
  // empty and the dossier renders the country alone.
  const saveParts: string[] = [];
  if (primary && primary !== country) saveParts.push(primary);
  if (region && region !== primary && region !== country)
    saveParts.push(region);
  const display = saveParts.join(", ");

  // Type/value tag plus country code in the secondary line — gives
  // the user enough context to disambiguate cities sharing a name.
  const kind = (p.type ?? p.osm_value ?? "").replace(/_/g, " ");
  const secondaryParts: string[] = [];
  if (kind) secondaryParts.push(kind);
  if (countryIso2) secondaryParts.push(countryIso2);
  const secondary = secondaryParts.join(" · ");

  return {
    key: `${countryIso2 ?? ""}-${lat}-${lng}-${primary}`,
    display,
    menuLine,
    city: p.city ?? primary ?? null,
    region: region || null,
    countryIso2,
    latitude: lat,
    longitude: lng,
    secondary,
  };
}
