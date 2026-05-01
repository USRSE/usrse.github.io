import { Link } from "react-router-dom";
import { NewsLayout } from "@/components/news/NewsLayout";
import { useInView } from "@/hooks/useInView";

type UpdateType = "Statement" | "Announcement" | "Milestone" | "Letter";

interface NewsPost {
  title: string;
  date: string;
  shortDate: string;
  year: string;
  type: UpdateType;
  author?: string;
  tags?: string[];
  description?: string;
}

const featuredPost: NewsPost = {
  title: "Re: The Proposed Dismantling of NCAR",
  date: "Dec 19, 2025",
  shortDate: "Dec 19",
  year: "2025",
  type: "Statement",
  author: "Steering Committee & Executive Director",
  tags: ["leadership", "steering committee", "executive director"],
  description:
    "A leadership statement responding to proposed structural changes at a major research institution.",
};

const posts: NewsPost[] = [
  {
    title: "US-RSE Surpasses 4,000 Members",
    date: "Apr 2026",
    shortDate: "Apr",
    year: "2026",
    type: "Milestone",
  },
  {
    title: "Message from the Executive Director",
    date: "Dec 15, 2025",
    shortDate: "Dec",
    year: "2025",
    type: "Letter",
    author: "Sandra Gesing",
    description: "Year-end reflection on community growth, achievements, and vision.",
  },
  {
    title: "USRSE'25 Conference Recap",
    date: "Oct 2025",
    shortDate: "Oct",
    year: "2025",
    type: "Announcement",
  },
  {
    title: "2025 Community Awards Announced",
    date: "Sep 2025",
    shortDate: "Sep",
    year: "2025",
    type: "Announcement",
  },
  {
    title: "New Organizational Membership Program",
    date: "Mar 2025",
    shortDate: "Mar",
    year: "2025",
    type: "Announcement",
  },
  {
    title: "Message from the Executive Director",
    date: "Dec 1, 2024",
    shortDate: "Dec",
    year: "2024",
    type: "Letter",
    author: "Sandra Gesing",
    description: "Reflecting on 2024 accomplishments and community milestones.",
  },
  {
    title: "Message from the Executive Director",
    date: "Oct 1, 2023",
    shortDate: "Oct",
    year: "2023",
    type: "Letter",
    author: "Sandra Gesing",
    description: "Mid-year update on organizational initiatives.",
  },
];

const typeStyle: Record<
  UpdateType,
  { chip: string; dot: string; ring: string }
> = {
  Statement: {
    chip: "bg-purple-50 text-purple-800 border-purple-100",
    dot: "bg-purple-500",
    ring: "border-purple-500",
  },
  Announcement: {
    chip: "bg-teal-50 text-teal-800 border-teal-100",
    dot: "bg-teal-500",
    ring: "border-teal-500",
  },
  Milestone: {
    chip: "bg-neutral-100 text-neutral-700 border-neutral-200",
    dot: "bg-neutral-500",
    ring: "border-neutral-500",
  },
  Letter: {
    chip: "bg-amber-50 text-amber-800 border-amber-100",
    dot: "bg-amber-500",
    ring: "border-amber-500",
  },
};

interface Fact {
  value: string;
  label: string;
}

const allCount = posts.length + 1;
const keyFacts: Fact[] = [
  { value: String(allCount).padStart(2, "0"), label: "Recent updates" },
  { value: "4", label: "Update types" },
  { value: "Since 2019", label: "On the record" },
  { value: "Public", label: "All statements" },
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Monthly read",
    title: "Newsletters",
    teaser: "The dispatch where most updates first appear in narrative form.",
    path: "/news",
  },
  {
    eyebrow: "Live discussion",
    title: "Community Calls",
    teaser: "Where many of these updates first surface in conversation.",
    path: "/community/calls",
  },
  {
    eyebrow: "How we run",
    title: "Governance",
    teaser: "The structure behind every official statement.",
    path: "/about/governance",
  },
  {
    eyebrow: "Why we publish",
    title: "Mission",
    teaser: "What this community stands for, written down.",
    path: "/about/mission",
  },
];

export function NewsUpdatesPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: featuredRef, isInView: featuredInView } = useInView(0.1);
  const { ref: listRef, isInView: listInView } = useInView(0.05);
  const { ref: legendRef, isInView: legendInView } = useInView(0.2);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  const featuredStyle = typeStyle[featuredPost.type];

  return (
    <NewsLayout
      title="News & Updates"
      subtitle="Announcements, statements, and milestones from the US-RSE community."
      prevPage={{ path: "/news", label: "Newsletters" }}
      nextPage={null}
    >
      {/* ── The stance — public record ───────────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          Statements, announcements, and milestones
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-10 text-balance max-w-4xl">
          What the community says{" "}
          <span className="text-purple-600">on the record.</span>
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          Official positions from leadership, time-sensitive announcements,
          and the milestones worth marking &mdash; archived here so the
          community has a public memory.
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

      {/* ── Featured — top story ─────────────────────────────────── */}
      <section ref={featuredRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
            Featured
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            Top story
          </span>
        </div>

        <article
          className={`relative grid grid-cols-12 gap-6 lg:gap-10 border-l-2 ${featuredStyle.ring} pl-6 lg:pl-8 ${
            featuredInView ? "animate-slide-up" : "opacity-0"
          }`}
        >
          {/* Date stamp */}
          <div className="col-span-12 sm:col-span-3 lg:col-span-2">
            <p className="font-display text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight leading-none tabular-nums">
              {featuredPost.shortDate}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 mt-2 tabular-nums">
              {featuredPost.year}
            </p>
          </div>

          {/* Body */}
          <div className="col-span-12 sm:col-span-9 lg:col-span-10">
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${featuredStyle.chip}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${featuredStyle.dot}`} />
              {featuredPost.type}
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mt-4 mb-3 text-balance max-w-3xl">
              {featuredPost.title}
            </h2>
            {featuredPost.author && (
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-5">
                By {featuredPost.author}
              </p>
            )}
            <p className="text-base lg:text-lg text-neutral-600 leading-relaxed mb-6 max-w-2xl">
              {featuredPost.description}
            </p>

            {featuredPost.tags && (
              <div className="flex flex-wrap gap-2 mb-7">
                {featuredPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <a
              href="#"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Read statement
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
          </div>
        </article>
      </section>

      {/* ── Type legend ──────────────────────────────────────────── */}
      <section
        ref={legendRef}
        className={`mb-12 ${legendInView ? "animate-fade-in" : "opacity-0"}`}
      >
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Four kinds of update
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {(
            [
              { type: "Statement", desc: "Official position from leadership" },
              { type: "Letter", desc: "Reflection from the ED or board" },
              { type: "Announcement", desc: "Time-sensitive community news" },
              { type: "Milestone", desc: "Marks worth celebrating" },
            ] as { type: UpdateType; desc: string }[]
          ).map((entry) => {
            const s = typeStyle[entry.type];
            return (
              <div
                key={entry.type}
                className="flex items-center gap-2.5"
              >
                <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
                <span className="font-display text-sm font-bold text-neutral-900 tracking-tight">
                  {entry.type}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                  {entry.desc}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── All updates list ─────────────────────────────────────── */}
      <section ref={listRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            All updates
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {String(posts.length).padStart(2, "0")} entries
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-8">
          The wire.
        </h2>

        <div>
          {posts.map((post, i) => {
            const s = typeStyle[post.type];
            return (
              <a
                key={post.title}
                href="#"
                className={`group block py-5 border-b border-neutral-100 last:border-0 transition-colors hover:bg-neutral-50/60 -mx-3 px-3 rounded-md ${
                  listInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-baseline gap-4 lg:gap-6">
                  {/* Date column */}
                  <div className="shrink-0 w-16 text-right">
                    <p className="font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight tabular-nums">
                      {post.shortDate}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-0.5 tabular-nums">
                      {post.year}
                    </p>
                  </div>

                  {/* Type indicator dot */}
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${s.dot} mt-2`}
                    aria-hidden="true"
                  />

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base lg:text-lg font-bold text-neutral-700 group-hover:text-purple-700 transition-colors tracking-tight leading-snug">
                      {post.title}
                    </p>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                          post.type === "Statement"
                            ? "text-purple-600"
                            : post.type === "Announcement"
                            ? "text-teal-700"
                            : post.type === "Letter"
                            ? "text-amber-700"
                            : "text-neutral-500"
                        }`}
                      >
                        {post.type}
                      </span>
                      {post.author && (
                        <>
                          <span
                            className="font-mono text-[10px] text-neutral-300"
                            aria-hidden="true"
                          >
                            ·
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                            {post.author}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <svg
                    className="w-4 h-4 text-neutral-300 group-hover:text-purple-600 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0 mt-2"
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
            );
          })}
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 mt-6 flex items-center gap-2">
          <span className="inline-block w-6 h-px bg-neutral-300" aria-hidden="true" />
          Older entries archived in the newsletters
        </p>
      </section>

      {/* ── CTA — stay in the loop ───────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-4">
          Stay in the loop
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Get updates as they go out.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Statements, letters, and announcements are also published in the
          monthly newsletter and posted on Slack as they happen.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <Link
            to="/news"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Read the newsletter
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
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>or</span>
            <a
              href="https://us-rse.org/join"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Join the Slack
            </a>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/about/governance"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Governance
            </Link>
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
          Where the rest of the record lives.
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
