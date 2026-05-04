import type { ReactNode } from "react";

export type SectionAccent = "purple" | "teal" | "neutral" | "amber";

interface SectionFrameProps {
  number: string;
  eyebrow: string;
  status?: string;
  action?: ReactNode;
  accent?: SectionAccent;
  children: ReactNode;
  id?: string;
}

const ACCENT_TEXT: Record<SectionAccent, string> = {
  purple: "text-purple-600",
  teal: "text-teal-700",
  amber: "text-amber-700",
  neutral: "text-neutral-500",
};

/**
 * Numbered editorial section header. Mirrors MissionPage's alternating
 * eyebrow rhythm — purple for some sections, teal for others, neutral
 * for utility/account areas.
 */
export function SectionFrame({
  number,
  eyebrow,
  status,
  action,
  accent = "purple",
  children,
  id,
}: SectionFrameProps) {
  return (
    <section id={id} className="mb-20 lg:mb-28">
      <div className="flex items-baseline gap-3 mb-8 lg:mb-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
          {number}
        </span>
        <span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
        <h2
          className={`font-mono font-normal text-xs uppercase tracking-[0.25em] ${ACCENT_TEXT[accent]}`}
        >
          {eyebrow}
        </h2>
        {status && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            · {status}
          </span>
        )}
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Soft pill-shaped placeholder for sections without data yet.
 * Matches the rounded-full chip pattern used throughout the site
 * (MissionPage domains, Hero "4,000+ Members" chip).
 */
export function NotYetWritten({ message }: { message: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-500 italic">
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full bg-neutral-300"
      />
      {message}
    </span>
  );
}
