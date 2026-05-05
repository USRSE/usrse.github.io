import { SectionFrame, NotYetWritten } from "./SectionFrame";
import type { WorkItem, WorkType } from "@/hooks/useCurrentMember";

interface OnStageSectionProps {
  works: WorkItem[];
}

// Only stage-shaped types render here. Software / dataset / other belong
// to a future "Built" or "Data" section, not the editorial stage.
const STAGE_TYPES: WorkType[] = ["paper", "talk", "panel", "workshop"];

interface TypeStyle {
  label: string;
  ink: string;
  border: string;
  bullet: string;
}

const TYPE_STYLE: Record<WorkType, TypeStyle> = {
  paper: {
    label: "Paper",
    ink: "text-amber-700",
    border: "border-amber-400",
    bullet: "bg-amber-500",
  },
  talk: {
    label: "Talk",
    ink: "text-purple-700",
    border: "border-purple-400",
    bullet: "bg-purple-500",
  },
  panel: {
    label: "Panel",
    ink: "text-rose-700",
    border: "border-rose-400",
    bullet: "bg-rose-500",
  },
  workshop: {
    label: "Workshop",
    ink: "text-teal-700",
    border: "border-teal-400",
    bullet: "bg-teal-500",
  },
  software: {
    label: "Software",
    ink: "text-neutral-700",
    border: "border-neutral-400",
    bullet: "bg-neutral-500",
  },
  dataset: {
    label: "Dataset",
    ink: "text-neutral-700",
    border: "border-neutral-400",
    bullet: "bg-neutral-500",
  },
  other: {
    label: "Work",
    ink: "text-neutral-700",
    border: "border-neutral-400",
    bullet: "bg-neutral-500",
  },
};

function summarize(items: WorkItem[]): string {
  // Count only stage-shaped items, since those are the ones rendered.
  const counts: Partial<Record<WorkType, number>> = {};
  for (const w of items) {
    if (!STAGE_TYPES.includes(w.type)) continue;
    counts[w.type] = (counts[w.type] ?? 0) + 1;
  }
  const order: WorkType[] = ["talk", "paper", "workshop", "panel"];
  const labels: Record<WorkType, [string, string]> = {
    talk: ["talk", "talks"],
    paper: ["paper", "papers"],
    workshop: ["workshop", "workshops"],
    panel: ["panel", "panels"],
    // Unused but the type system wants exhaustive entries:
    software: ["", ""],
    dataset: ["", ""],
    other: ["", ""],
  };
  const parts: string[] = [];
  for (const t of order) {
    const n = counts[t];
    if (!n) continue;
    parts.push(`${n} ${n === 1 ? labels[t][0] : labels[t][1]}`);
  }
  return parts.join(" · ");
}

function yearOf(dateIso: string | null): string {
  if (!dateIso) return "—";
  return dateIso.slice(0, 4);
}

export function OnStageSection({ works }: OnStageSectionProps) {
  const stage = works.filter((w) => STAGE_TYPES.includes(w.type));
  const summary = summarize(stage);
  const status = summary || "talks · panels · workshops · papers";

  return (
    <SectionFrame
      number="07"
      eyebrow="On Stage"
      status={status}
      accent="teal"
    >
      {stage.length === 0 ? (
        <NotYetWritten message="talks, panels, workshops, and papers appear here once added — ORCID-linked works import automatically" />
      ) : (
        <ol className="space-y-12 lg:space-y-14">
          {stage.map((item, i) => (
            <li key={item.id}>
              <StageEntry item={item} />
              {i < stage.length - 1 && (
                <hr
                  className="mt-12 lg:mt-14 border-t border-neutral-100"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </SectionFrame>
  );
}

function StageEntry({ item }: { item: WorkItem }) {
  const style = TYPE_STYLE[item.type];
  const year = yearOf(item.workDate);
  const meta = buildMetaLine(item);
  const actions = buildActions(item);
  const doiUrl = item.doi ? `https://doi.org/${item.doi}` : null;

  return (
    <article>
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-3">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.25em] ${style.ink} inline-flex items-center gap-2`}
        >
          <span
            aria-hidden="true"
            className={`w-1.5 h-1.5 rounded-full ${style.bullet}`}
          />
          {style.label}
        </span>
        <span aria-hidden="true" className="text-neutral-300 text-[10px]">
          ·
        </span>
        <span className="font-mono text-[11px] tabular-nums text-neutral-500">
          {year}
        </span>
        {actions.length > 0 && (
          <ul className="ml-auto flex flex-wrap gap-x-4 gap-y-1">
            {actions.map((a) => (
              <li key={a.label}>
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:text-purple-700 transition-colors"
                >
                  {a.label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>

      <h3 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight leading-snug text-balance">
        {doiUrl || item.url ? (
          <a
            href={doiUrl ?? item.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-700 transition-colors"
          >
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </h3>

      {meta && (
        <p className="mt-2 font-mono text-xs text-neutral-500">{meta}</p>
      )}

      {item.abstract && (
        <blockquote
          className={`mt-5 border-l-2 ${style.border} pl-5 max-w-2xl`}
        >
          <p className="font-display italic text-lg lg:text-xl text-neutral-700 leading-relaxed">
            &ldquo;{item.abstract}&rdquo;
          </p>
          <footer className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
            — from the abstract
          </footer>
        </blockquote>
      )}
    </article>
  );
}

interface ActionLink {
  label: string;
  href: string;
}

function buildActions(item: WorkItem): ActionLink[] {
  const out: ActionLink[] = [];
  if (item.doi) out.push({ label: "doi", href: `https://doi.org/${item.doi}` });
  if (item.pdfUrl) out.push({ label: "pdf", href: item.pdfUrl });
  if (item.slidesUrl) out.push({ label: "slides", href: item.slidesUrl });
  if (item.videoUrl) out.push({ label: "video", href: item.videoUrl });
  // url is the canonical link; only render if there isn't already a doi
  // pointing somewhere (doi.org will resolve to the same canonical
  // landing page, so showing both is noise).
  if (item.url && !item.doi) {
    out.push({ label: item.type === "workshop" ? "materials" : "link", href: item.url });
  }
  return out;
}

function buildMetaLine(item: WorkItem): string | null {
  const parts: string[] = [];
  if (item.venue) parts.push(item.venue);
  if (item.collaborators.length > 0) {
    const c = item.collaborators;
    if (c.length === 1) parts.push(`with ${c[0]}`);
    else if (c.length === 2) parts.push(`with ${c[0]} and ${c[1]}`);
    else if (c.length <= 4) parts.push(`with ${c.slice(0, -1).join(", ")} and ${c[c.length - 1]}`);
    else parts.push(`with ${c[0]} et al.`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
