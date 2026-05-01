import { useState } from "react";
import { Link } from "react-router-dom";
import { NewsLayout } from "@/components/news/NewsLayout";
import { useInView } from "@/hooks/useInView";

interface NewsletterEntry {
  date: string;
  title: string;
}

const newsletters2026: NewsletterEntry[] = [
  { date: "Apr 13", title: "Just Hit Me Up On Slack" },
  { date: "Mar 12", title: "Who Run the Code… GIRLS!" },
  { date: "Feb 17", title: "Cold Weather, Cold AI Reviews, and a Cold World" },
  { date: "Jan 10", title: "Welcome to 2026!" },
];

const newsletters2025Recent: NewsletterEntry[] = [
  { date: "Dec 14", title: "A Year in Review" },
  { date: "Nov 10", title: "Conference Afterglow" },
  { date: "Oct 12", title: "USRSE'25 Is Here" },
  { date: "Sep 8", title: "Back to Research Season" },
];

interface YearArchive {
  year: number;
  count: number;
  span: string;
}

const olderArchives: YearArchive[] = [
  { year: 2024, count: 12, span: "Jan–Dec" },
  { year: 2023, count: 12, span: "Jan–Dec" },
  { year: 2022, count: 12, span: "Jan–Dec" },
  { year: 2021, count: 12, span: "Jan–Dec" },
  { year: 2020, count: 10, span: "Mar–Dec" },
  { year: 2019, count: 3, span: "Oct–Dec" },
];

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "50+", label: "Issues published" },
  { value: "Since 2019", label: "Running monthly" },
  { value: "Monthly", label: "Cadence" },
  { value: "Free", label: "No paywall" },
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Announcements",
    title: "News & Updates",
    teaser: "Community statements and time-sensitive announcements.",
    path: "/news/updates",
  },
  {
    eyebrow: "How we run",
    title: "Governance",
    teaser: "How decisions get made — the structure behind the page.",
    path: "/about/governance",
  },
  {
    eyebrow: "Live discussion",
    title: "Community Calls",
    teaser: "What ends up in the newsletter often starts on a call.",
    path: "/community/calls",
  },
  {
    eyebrow: "Why we publish",
    title: "Mission",
    teaser: "The community we’re building one issue at a time.",
    path: "/about/mission",
  },
];

export function NewslettersPage() {
  const [show2025, setShow2025] = useState(false);
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: latestRef, isInView: latestInView } = useInView(0.1);
  const { ref: archive26Ref, isInView: archive26InView } = useInView(0.05);
  const { ref: archive25Ref, isInView: archive25InView } = useInView(0.05);
  const { ref: olderRef, isInView: olderInView } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  const latest = newsletters2026[0];
  const totalOlder = olderArchives.reduce((acc, y) => acc + y.count, 0);

  return (
    <NewsLayout
      title="Newsletters"
      subtitle="Monthly dispatches from the US-RSE community — since 2019."
      nextPage={{
        path: "/news/updates",
        label: "News & Updates",
        teaser: "Community announcements and statements",
      }}
    >
      {/* ── The stance — masthead-style editorial hello ──────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          A monthly dispatch since October 2019
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-10 text-balance max-w-4xl">
          The newsletter is{" "}
          <span className="text-purple-600">how the community thinks out loud.</span>
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          Working group updates, event recaps, member spotlights, opinionated
          essays, and what&rsquo;s coming next &mdash; written by community
          members, delivered the second week of every month.
        </p>
      </section>

      {/* ── At a glance — 4-column facts strip ───────────────────── */}
      <section
        ref={factsRef}
        className={`mb-20 py-8 border-y border-neutral-200 grid grid-cols-2 md:grid-cols-4 ${
          factsInView ? "animate-fade-in" : "opacity-0"
        }`}
      >
        {keyFacts.map((f, i) => (
          <div
            key={f.label}
            className={`py-3 px-4 md:px-6 ${
              i > 0 ? "md:border-l md:border-neutral-200" : ""
            } ${i % 2 !== 0 ? "border-l border-neutral-200 md:border-l" : ""} ${
              i >= 2 ? "border-t border-neutral-200 md:border-t-0" : ""
            }`}
          >
            <p className="font-display text-xl lg:text-2xl font-bold text-purple-700 tracking-tight leading-none tabular-nums">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2.5">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── The latest issue — magazine cover ────────────────────── */}
      <section ref={latestRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
            The latest issue
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            New
          </span>
        </div>

        <div
          className={`relative rounded-2xl bg-neutral-900 overflow-hidden px-6 py-10 lg:px-12 lg:py-14 ${
            latestInView ? "animate-slide-up" : "opacity-0"
          }`}
        >
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
            aria-hidden="true"
          />
          {/* Purple radial glow */}
          <div
            className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full opacity-25 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgb(168 85 247) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="relative">
            {/* Masthead row */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                US-RSE Dispatch &middot; Vol. 7
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 tabular-nums">
                {latest.date}, 2026
              </p>
            </div>

            {/* Title — magazine headline */}
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.05] mb-6 text-balance max-w-3xl">
              &ldquo;{latest.title}&rdquo;
            </h2>

            {/* Lede */}
            <p className="text-base lg:text-lg text-white/70 leading-relaxed max-w-2xl mb-8">
              The latest from the US-RSE community &mdash; working group
              updates, event recaps, member spotlights, and what&rsquo;s
              ahead.
            </p>

            {/* Read CTA */}
            <a
              href="#"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 text-sm font-bold rounded-xl hover:bg-purple-100 transition-all"
            >
              Read this issue
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>

            {/* Issue plate corner */}
            <p className="absolute bottom-0 right-0 font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 tabular-nums">
              No. {String(50 + newsletters2026.length).padStart(3, "0")}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2026 archive — current year ──────────────────────────── */}
      <section ref={archive26Ref} className="mb-16">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            This year
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {String(newsletters2026.length).padStart(2, "0")} issues &middot; 2026
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-8">
          Volume 7.
        </h2>

        <div>
          {newsletters2026.map((entry, i) => (
            <a
              key={entry.date}
              href="#"
              className={`group block py-5 border-b border-neutral-100 last:border-0 transition-colors hover:bg-neutral-50/60 -mx-3 px-3 rounded-md ${
                archive26InView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-baseline gap-5 lg:gap-8">
                {/* Date */}
                <div className="shrink-0 w-20">
                  <p className="font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight tabular-nums">
                    {entry.date}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-0.5 tabular-nums">
                    2026
                  </p>
                </div>
                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base lg:text-lg font-bold text-neutral-700 group-hover:text-purple-700 transition-colors tracking-tight leading-snug">
                    &ldquo;{entry.title}&rdquo;
                  </p>
                </div>
                {/* Issue number */}
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300 shrink-0 tabular-nums hidden sm:inline">
                  No.{" "}
                  {String(50 + newsletters2026.length - i).padStart(3, "0")}
                </span>
                {/* Hover arrow */}
                <svg
                  className="w-4 h-4 text-neutral-300 group-hover:text-purple-600 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── 2025 archive — recent past year ──────────────────────── */}
      <section ref={archive25Ref} className="mb-16">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Last year
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            13 issues &middot; 2025
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-8">
          Volume 6.
        </h2>

        <div>
          {(show2025
            ? newsletters2025Recent
            : newsletters2025Recent.slice(0, 3)
          ).map((entry, i) => (
            <a
              key={entry.date}
              href="#"
              className={`group block py-5 border-b border-neutral-100 last:border-0 transition-colors hover:bg-neutral-50/60 -mx-3 px-3 rounded-md ${
                archive25InView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-baseline gap-5 lg:gap-8">
                <div className="shrink-0 w-20">
                  <p className="font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight tabular-nums">
                    {entry.date}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-0.5 tabular-nums">
                    2025
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base lg:text-lg font-bold text-neutral-700 group-hover:text-purple-700 transition-colors tracking-tight leading-snug">
                    &ldquo;{entry.title}&rdquo;
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-neutral-300 group-hover:text-purple-600 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {!show2025 && (
          <button
            onClick={() => setShow2025(true)}
            className="group mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-purple-600 transition-colors"
          >
            <span className="inline-block w-6 h-px bg-neutral-300 group-hover:bg-purple-400 transition-colors" />
            <span>Show all 13 from 2025</span>
            <svg
              className="w-3 h-3 transition-transform group-hover:translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </section>

      {/* ── Older archives — yearly grid ─────────────────────────── */}
      <section ref={olderRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            The full archive
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {totalOlder} issues &middot; 2019–2024
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-3">
          Six years deep.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Every issue, kept and searchable. From the earliest three issues of
          October 2019 through last year&rsquo;s wrap.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-neutral-200">
          {olderArchives.map((y, i) => (
            <a
              key={y.year}
              href={`#archive-${y.year}`}
              className={`group bg-white px-5 py-6 hover:bg-neutral-50/60 transition-colors ${
                olderInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <p className="font-display text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight tabular-nums group-hover:text-purple-600 transition-colors">
                  {y.year}
                </p>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 tabular-nums">
                  Vol. {y.year - 2019 + 1}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 tabular-nums">
                  {y.count} issues
                </p>
                <p className="font-mono text-[10px] text-neutral-300 tabular-nums">
                  {y.span}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Subscribe CTA ────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-4">
          Don&rsquo;t miss the next one
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Get the newsletter in your inbox.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Delivered the second week of every month. No spam. Unsubscribe
          anytime &mdash; though we hope you won&rsquo;t.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="mailto:contact@us-rse.org?subject=Subscribe%20to%20Newsletter"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Subscribe
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>Or email</span>
            <a
              href="mailto:contact@us-rse.org"
              className="text-neutral-700 hover:text-purple-700 transition-colors normal-case tracking-normal font-semibold"
            >
              contact@us-rse.org
            </a>
          </div>
        </div>
      </section>

      {/* ── Continue exploring — bridge cards ────────────────────── */}
      <section
        ref={bridgeRef}
        className="mb-4 pt-12 border-t-2 border-neutral-900"
      >
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Continue exploring
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-10">
          More from the community.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {bridges.map((b, i) => (
            <Link
              key={b.path}
              to={b.path}
              className={`group bg-white p-6 md:p-7 flex items-center gap-5 hover:bg-neutral-50 transition-colors ${
                bridgeInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-1.5">
                  {b.eyebrow}
                </p>
                <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1 group-hover:text-purple-700 transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-neutral-500">{b.teaser}</p>
              </div>
              <svg
                className="w-5 h-5 text-neutral-400 group-hover:text-purple-700 transition-all group-hover:translate-x-1 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </NewsLayout>
  );
}
