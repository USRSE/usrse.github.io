import { useState } from "react";
import { NewsLayout } from "@/components/news/NewsLayout";
import { useInView } from "@/hooks/useInView";

interface NewsletterEntry {
  date: string;
  title: string;
}

const newsletters2026: NewsletterEntry[] = [
  { date: "Apr 13", title: "Just Hit Me Up On Slack" },
  { date: "Mar 12", title: "Who Run the Code\u2026 GIRLS!" },
  { date: "Feb 17", title: "Cold Weather, Cold AI Reviews, and a Cold World" },
  { date: "Jan 10", title: "Welcome to 2026!" },
];

const newsletters2025Recent: NewsletterEntry[] = [
  { date: "Dec 14", title: "A Year in Review" },
  { date: "Nov 10", title: "Conference Afterglow" },
  { date: "Oct 12", title: "USRSE'25 Is Here" },
  { date: "Sep 8", title: "Back to Research Season" },
];

const olderArchives = [
  { year: 2024, count: 12 },
  { year: 2023, count: 12 },
  { year: 2022, count: 12 },
  { year: 2021, count: 12 },
  { year: 2020, count: 10 },
  { year: 2019, count: 3 },
];

export function NewslettersPage() {
  const [show2025, setShow2025] = useState(false);
  const { ref: latestRef, isInView: latestInView } = useInView(0.1);
  const { ref: archiveRef, isInView: archiveInView } = useInView(0.1);

  const latest = newsletters2026[0];

  return (
    <NewsLayout
      title="Newsletters"
      subtitle="Monthly dispatches from the US-RSE community \u2014 since 2019."
      nextPage={{ path: "/news/updates", label: "News & Updates", teaser: "Community announcements and statements" }}
    >
      {/* ── Display stat ─────────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-display text-6xl lg:text-7xl font-bold text-neutral-900 leading-none">
          50+
        </p>
        <p className="font-mono text-sm text-neutral-400 mt-2 tracking-wide">
          newsletters published since Oct 2019
        </p>
      </section>

      {/* ── Latest issue ─────────────────────────────────────────── */}
      <section className="mb-16" ref={latestRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-4">
          Latest Issue
        </p>
        <div
          className={`border-l-2 border-purple-500 pl-6 ${latestInView ? "animate-slide-up" : "opacity-0"}`}
        >
          <p className="font-mono text-sm text-neutral-400 mb-2">{latest.date}, 2026</p>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 leading-tight">
            &ldquo;{latest.title}&rdquo;
          </h2>
          <p className="text-neutral-500 mt-3 max-w-xl leading-relaxed">
            The latest from the US-RSE community &mdash; working group updates, event recaps,
            member spotlights, and what&rsquo;s ahead.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors mt-4"
          >
            Read this issue
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── 2026 Archive ─────────────────────────────────────────── */}
      <section className="mb-16" ref={archiveRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          2026
        </p>
        <div>
          {newsletters2026.map((entry, i) => (
            <div
              key={entry.date}
              className={`flex items-baseline gap-6 py-3 border-b border-neutral-100 last:border-0 ${
                archiveInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="font-mono text-sm text-neutral-400 w-16 shrink-0">{entry.date}</span>
              <span className="text-neutral-800 font-medium">{entry.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2025 Archive ─────────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          2025
        </p>
        <div>
          {(show2025 ? newsletters2025Recent : newsletters2025Recent.slice(0, 3)).map((entry, i) => (
            <div
              key={entry.date}
              className="flex items-baseline gap-6 py-3 border-b border-neutral-100 last:border-0"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="font-mono text-sm text-neutral-400 w-16 shrink-0">{entry.date}</span>
              <span className="text-neutral-800 font-medium">{entry.title}</span>
            </div>
          ))}
        </div>
        {!show2025 && (
          <button
            onClick={() => setShow2025(true)}
            className="font-mono text-sm text-neutral-400 hover:text-purple-600 transition-colors mt-4"
          >
            + and 9 more from 2025
          </button>
        )}
      </section>

      {/* ── Older Archives ───────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          Archive
        </p>
        <div className="space-y-2">
          {olderArchives.map((year) => (
            <p key={year.year} className="font-mono text-sm text-neutral-500">
              {year.year} <span className="text-neutral-300 mx-2">&middot;</span> {year.count} issues
            </p>
          ))}
        </div>
      </section>

      {/* ── Subscribe CTA ────────────────────────────────────────── */}
      <section>
        <hr className="border-neutral-100 mb-10" />
        <p className="text-lg text-neutral-600 mb-2">
          Get the newsletter
        </p>
        <p className="text-sm text-neutral-400 mb-4">
          Delivered monthly. No spam. Unsubscribe anytime.
        </p>
        <a
          href="mailto:contact@us-rse.org"
          className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
        >
          contact@us-rse.org
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </section>
    </NewsLayout>
  );
}
