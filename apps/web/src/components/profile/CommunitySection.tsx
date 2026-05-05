import { useMemo, useState } from "react";
import { SectionFrame, NotYetWritten } from "./SectionFrame";
import type { ConferenceItem } from "@/hooks/useCurrentMember";

interface CommunitySectionProps {
  conferences: ConferenceItem[];
}

type RowKey =
  | "organized"
  | "sponsored"
  | "volunteered"
  | "talk"
  | "poster"
  | "attended";

interface RowDef {
  key: RowKey;
  label: string;
  fill: string;
  border: string;
  ink: string;
}

// Top → bottom = highest investment → lowest. The grid reads as a
// settling column: deep contributions (Organized, Talk) sit above,
// the baseline of attendance anchors the bottom.
const ROWS: RowDef[] = [
  {
    key: "organized",
    label: "Organized",
    fill: "bg-teal-500",
    border: "border-teal-500",
    ink: "text-teal-700",
  },
  {
    key: "sponsored",
    label: "Sponsored",
    fill: "bg-amber-500",
    border: "border-amber-500",
    ink: "text-amber-700",
  },
  {
    key: "volunteered",
    label: "Volunteered",
    fill: "bg-rose-500",
    border: "border-rose-500",
    ink: "text-rose-700",
  },
  {
    key: "talk",
    label: "Talk",
    fill: "bg-purple-600",
    border: "border-purple-600",
    ink: "text-purple-700",
  },
  {
    key: "poster",
    label: "Poster",
    fill: "bg-purple-400",
    border: "border-purple-400",
    ink: "text-purple-600",
  },
  {
    key: "attended",
    label: "Attended",
    fill: "bg-neutral-500",
    border: "border-neutral-500",
    ink: "text-neutral-600",
  },
];

function rowKeyFor(c: ConferenceItem): RowKey {
  if (c.role === "speaker") {
    if (c.notes && /poster/i.test(c.notes)) return "poster";
    return "talk";
  }
  if (c.role === "organizer") return "organized";
  if (c.role === "sponsor") return "sponsored";
  if (c.role === "volunteer") return "volunteered";
  return "attended";
}

interface CellState {
  items: ConferenceItem[];
}

interface MatrixModel {
  years: string[];
  cells: Map<string, CellState>;
  hasAnyData: boolean;
  counts: Record<RowKey, number>;
}

function buildMatrix(conferences: ConferenceItem[]): MatrixModel {
  const counts: Record<RowKey, number> = {
    organized: 0,
    sponsored: 0,
    volunteered: 0,
    talk: 0,
    poster: 0,
    attended: 0,
  };
  let minYear = Infinity;
  let maxYear = -Infinity;
  const cells = new Map<string, CellState>();

  for (const c of conferences) {
    const year = parseInt(c.startDate.slice(0, 4), 10);
    if (!Number.isFinite(year)) continue;
    if (year < minYear) minYear = year;
    if (year > maxYear) maxYear = year;
    const row = rowKeyFor(c);
    counts[row]++;
    const key = `${row}|${year}`;
    const existing = cells.get(key);
    if (existing) existing.items.push(c);
    else cells.set(key, { items: [c] });
  }

  const years: string[] = [];
  if (minYear !== Infinity && maxYear !== -Infinity) {
    // Continuous range — empty columns are signal ("took a year off").
    for (let y = minYear; y <= maxYear; y++) years.push(String(y));
  }

  return { years, cells, hasAnyData: years.length > 0, counts };
}

// Past-tense roles ("organized") don't pluralize; talks/posters do.
function summarize(counts: Record<RowKey, number>): string {
  const parts: string[] = [];
  if (counts.talk)
    parts.push(`${counts.talk} talk${counts.talk === 1 ? "" : "s"}`);
  if (counts.poster)
    parts.push(`${counts.poster} poster${counts.poster === 1 ? "" : "s"}`);
  if (counts.organized) parts.push(`${counts.organized} organized`);
  if (counts.sponsored) parts.push(`${counts.sponsored} sponsored`);
  if (counts.volunteered) parts.push(`${counts.volunteered} volunteered`);
  return parts.join(" · ");
}

function parseKey(key: string): { row: RowKey; year: string } {
  const [row, year] = key.split("|");
  return { row: row as RowKey, year };
}

export function CommunitySection({ conferences }: CommunitySectionProps) {
  const matrix = useMemo(() => buildMatrix(conferences), [conferences]);
  const summary = summarize(matrix.counts);
  const status = summary
    ? `${summary} · groups · service`
    : "conferences · groups · service";

  return (
    <SectionFrame
      number="06"
      eyebrow="Community"
      status={status}
      accent="purple"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-14 lg:gap-y-0">
        {/* 06.a · Contributions — participation matrix */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
            06.a · Contributions
          </p>
          {!matrix.hasAnyData ? (
            <NotYetWritten message="conference participation appears here as a year-by-role matrix" />
          ) : (
            <ContributionMatrix matrix={matrix} />
          )}
        </div>

        {/* 06.b · Groups */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
            06.b · Groups
          </p>
          <NotYetWritten message="working, affinity, and regional groups appear here once joined" />
        </div>

        {/* 06.c · Service */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-5">
            06.c · Service
          </p>
          <NotYetWritten message="board, executive, and committee terms appear here as a service record" />
        </div>
      </div>
    </SectionFrame>
  );
}

function ContributionMatrix({ matrix }: { matrix: MatrixModel }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const openCell = openKey ? matrix.cells.get(openKey) : null;
  const openMeta = openKey ? parseKey(openKey) : null;
  const openRow = openMeta
    ? ROWS.find((r) => r.key === openMeta.row) ?? null
    : null;

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <div className="inline-block">
        <div
          className="grid gap-y-1.5 gap-x-1 items-center"
          style={{
            // First column auto-sized for row labels, then one fixed
            // 16px column per year. Inline-block parent + horizontal
            // scroll on overflow handles narrow viewports.
            gridTemplateColumns: `auto repeat(${matrix.years.length}, 16px)`,
          }}
        >
          {ROWS.map((row) => (
            <MatrixRow
              key={row.key}
              row={row}
              years={matrix.years}
              cells={matrix.cells}
              openKey={openKey}
              onToggle={setOpenKey}
            />
          ))}
          {/* Year axis: spacer for the label column, then one tick per year. */}
          <div aria-hidden="true" />
          {matrix.years.map((y) => (
            <div
              key={y}
              className="font-mono text-[9px] tracking-wider text-neutral-400 tabular-nums text-center mt-1.5"
            >
              {`'${y.slice(2)}`}
            </div>
          ))}
        </div>

        {/* Detail panel: anchored below the matrix so multi-item cells
            (a year with two talks, say) can list every entry without
            cramping the grid itself. */}
        <div aria-live="polite" className="mt-5 min-h-[3.25rem]">
          {openCell && openRow && openMeta && (
            <CellDetail
              row={openRow}
              year={openMeta.year}
              items={openCell.items}
              onClose={() => setOpenKey(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface MatrixRowProps {
  row: RowDef;
  years: string[];
  cells: Map<string, CellState>;
  openKey: string | null;
  onToggle: (key: string | null) => void;
}

function MatrixRow({ row, years, cells, openKey, onToggle }: MatrixRowProps) {
  return (
    <>
      <div
        className={`font-mono text-[10px] uppercase tracking-[0.18em] ${row.ink} pr-3 leading-4 whitespace-nowrap text-right`}
      >
        {row.label}
      </div>
      {years.map((year) => {
        const key = `${row.key}|${year}`;
        const cell = cells.get(key);
        const isOpen = openKey === key;

        if (!cell) {
          return (
            <div
              key={key}
              className="w-4 h-4 rounded-[2px] bg-neutral-100 border border-neutral-200"
              aria-hidden="true"
            />
          );
        }

        const n = cell.items.length;
        const aria = `${row.label}, ${year}, ${n} ${n === 1 ? "entry" : "entries"}`;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(isOpen ? null : key)}
            aria-label={aria}
            aria-pressed={isOpen}
            className={`w-4 h-4 rounded-[2px] ${row.fill} transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-neutral-500 ${
              isOpen ? "ring-2 ring-offset-1 ring-neutral-500" : ""
            }`}
          />
        );
      })}
    </>
  );
}

interface CellDetailProps {
  row: RowDef;
  year: string;
  items: ConferenceItem[];
  onClose: () => void;
}

function CellDetail({ row, year, items, onClose }: CellDetailProps) {
  return (
    <div className={`flex items-baseline gap-3 border-l-2 ${row.border} pl-4`}>
      <div className="flex-1">
        <p
          className={`font-mono text-[10px] uppercase tracking-[0.2em] ${row.ink}`}
        >
          {row.label} · {year}
        </p>
        <ul className="mt-1.5 space-y-1.5">
          {items.map((c, i) => (
            <li key={`${c.eventId}-${i}`}>
              <p className="font-display text-base font-semibold text-neutral-900 tracking-tight">
                {c.name}
              </p>
              {(c.location || c.notes) && (
                <p className="text-sm text-neutral-500">
                  {[c.location, c.notes].filter(Boolean).join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close detail"
        className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        close
      </button>
    </div>
  );
}
