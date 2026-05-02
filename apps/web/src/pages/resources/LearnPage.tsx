import { Link } from "react-router-dom";
import { ResourcesLayout } from "@/components/resources/ResourcesLayout";
import { useInView } from "@/hooks/useInView";

interface Seminar {
  title: string;
  speaker: string;
  affiliation?: string;
  date: string;
  shortDate: string;
  year: string;
  type: "Tutorial" | "Talk";
  topics: string[];
}

const seminars: Seminar[] = [
  {
    title: "CI/CD with GitHub Actions",
    speaker: "Andres Rios-Tascon",
    date: "Mar 24, 2026",
    shortDate: "Mar 24",
    year: "2026",
    type: "Tutorial",
    topics: ["CI/CD", "Tooling"],
  },
  {
    title: "Rapid Usability Assessments",
    speaker: "Hannah Cohoon",
    date: "Jun 23, 2025",
    shortDate: "Jun 23",
    year: "2025",
    type: "Tutorial",
    topics: ["Usability", "Practice"],
  },
  {
    title: "Eating Your Own Dogfood",
    speaker: "Jonathan Woodring",
    affiliation: "LANL",
    date: "Aug 28, 2024",
    shortDate: "Aug 28",
    year: "2024",
    type: "Talk",
    topics: ["Software Engineering"],
  },
  {
    title: "Building and Running Containers on HPC",
    speaker: "Subil Abraham",
    affiliation: "ORNL",
    date: "May 10, 2024",
    shortDate: "May 10",
    year: "2024",
    type: "Talk",
    topics: ["Containers", "HPC"],
  },
];

interface LearningLink {
  mono: string;
  name: string;
  url: string;
  domain: string;
  desc: string;
  accent: "teal" | "purple";
}

const additionalResources: LearningLink[] = [
  {
    mono: "swebok",
    name: "Software Engineering Body of Knowledge",
    url: "https://www.computer.org/education/bodies-of-knowledge/software-engineering",
    domain: "computer.org/swebok",
    desc: "The canonical reference for software engineering practice — standards, terminology, knowledge areas.",
    accent: "teal",
  },
  {
    mono: "askci",
    name: "Ask Cyberinfrastructure",
    url: "https://ask.cyberinfrastructure.org",
    domain: "ask.cyberinfrastructure.org",
    desc: "Community Q&A forum for research computing — peers answering peers across institutions.",
    accent: "purple",
  },
  {
    mono: "se4sci",
    name: "Software Engineering for Science",
    url: "https://se4science.org",
    domain: "se4science.org",
    desc: "Applying SE principles specifically to scientific research software — papers, workshops, community.",
    accent: "teal",
  },
];

interface Topic {
  label: string;
  count: number;
}

const topicCounts: Topic[] = (() => {
  const counts = new Map<string, number>();
  for (const s of seminars) {
    for (const t of s.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
})();

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: `${seminars.length}+`, label: "Seminars in archive" },
  { value: "Since 2024", label: "Series running" },
  { value: "Tutorial + Talk", label: "Two formats" },
  { value: "Recorded", label: "All sessions" },
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Where the field lives",
    title: "Directory",
    teaser: "Institutional RSE groups and peer organizations across the US.",
    path: "/resources/directory",
  },
  {
    eyebrow: "Hands-on practice",
    title: "Working Groups",
    teaser: "Code Review, Testing, DEI — where day-to-day learning happens.",
    path: "/community/working-groups",
  },
  {
    eyebrow: "Live discussion",
    title: "Community Calls",
    teaser: "Monthly conversations on RSE topics, careers, and the field.",
    path: "/community/calls",
  },
  {
    eyebrow: "Stay current",
    title: "Newsletters",
    teaser: "Seminar announcements, recaps, and links go out monthly.",
    path: "/news",
  },
];

const accentMap = {
  teal: {
    border: "border-teal-500",
    eyebrow: "text-teal-700",
    chip: "bg-teal-50 text-teal-800 border-teal-100",
  },
  purple: {
    border: "border-purple-500",
    eyebrow: "text-purple-600",
    chip: "bg-purple-50 text-purple-800 border-purple-100",
  },
};

export function LearnPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: latestRef, isInView: latestInView } = useInView(0.1);
  const { ref: archiveRef, isInView: archiveInView } = useInView(0.05);
  const { ref: topicsRef, isInView: topicsInView } = useInView(0.2);
  const { ref: extrasRef, isInView: extrasInView } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  const latest = seminars[0];

  return (
    <ResourcesLayout
      title="Learn"
      subtitle="Seminars, tutorials, and learning resources for research software engineers."
      nextPage={{
        path: "/resources/directory",
        label: "Directory",
        teaser: "Where the RSE world lives",
      }}
    >
      {/* ── The stance — RSEs grow by sharing ────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          The seminar series and beyond
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-10 text-balance max-w-4xl">
          The fastest way to grow as an RSE is{" "}
          <span className="text-teal-700">to learn from other RSEs.</span>
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          The US-RSE seminar series brings practitioners from across the
          country to share what they&rsquo;ve learned &mdash; tooling,
          tradecraft, and the hard-won lessons that don&rsquo;t fit in a paper.
          All sessions are recorded.
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
            <p className="font-display text-xl lg:text-2xl font-bold text-teal-700 tracking-tight leading-none tabular-nums">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2.5">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── Latest seminar — featured ────────────────────────────── */}
      <section ref={latestRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700">
            Latest seminar
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
            {latest.type}
          </span>
        </div>

        <article
          className={`grid grid-cols-12 gap-6 lg:gap-10 border-l-2 border-teal-500 pl-6 lg:pl-8 ${
            latestInView ? "animate-slide-up" : "opacity-0"
          }`}
        >
          {/* Date stamp */}
          <div className="col-span-12 sm:col-span-3 lg:col-span-2">
            <p className="font-display text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight leading-none tabular-nums">
              {latest.shortDate}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 mt-2 tabular-nums">
              {latest.year}
            </p>
          </div>

          {/* Body */}
          <div className="col-span-12 sm:col-span-9 lg:col-span-10">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-3 text-balance max-w-3xl">
              {latest.title}
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-5">
              {latest.speaker}
              {latest.affiliation ? ` · ${latest.affiliation}` : ""}
            </p>
            <p className="text-base lg:text-lg text-neutral-600 leading-relaxed mb-7 max-w-2xl">
              A hands-on tutorial covering CI/CD pipelines for research
              software with GitHub Actions &mdash; from first workflow file
              through reusable templates and matrix builds.
            </p>

            <div className="flex flex-wrap gap-2 mb-7">
              {latest.topics.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded"
                >
                  #{t}
                </span>
              ))}
            </div>

            <a
              href="#"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Watch the recording
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

      {/* ── Seminar archive ──────────────────────────────────────── */}
      <section ref={archiveRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Seminar archive
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {String(seminars.length).padStart(2, "0")} sessions
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-3">
          Every session, recorded.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          Members can watch recordings of any past seminar. Click a session
          for video, slides, and discussion notes.
        </p>

        <div>
          {seminars.map((s, i) => (
            <a
              key={s.title}
              href="#"
              className={`group block py-5 border-b border-neutral-100 last:border-0 transition-colors hover:bg-neutral-50/60 -mx-3 px-3 rounded-md ${
                archiveInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-baseline gap-5 lg:gap-8">
                {/* Date */}
                <div className="shrink-0 w-20">
                  <p className="font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight tabular-nums">
                    {s.shortDate}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-0.5 tabular-nums">
                    {s.year}
                  </p>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base lg:text-lg font-bold text-neutral-700 group-hover:text-teal-700 transition-colors tracking-tight leading-snug">
                    {s.title}
                  </p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {s.speaker}
                    {s.affiliation ? ` · ${s.affiliation}` : ""}
                  </p>
                </div>

                {/* Type chip */}
                <span
                  className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border hidden sm:inline ${
                    s.type === "Tutorial"
                      ? "bg-teal-50 text-teal-800 border-teal-100"
                      : "bg-purple-50 text-purple-800 border-purple-100"
                  }`}
                >
                  {s.type}
                </span>

                {/* Hover arrow */}
                <svg
                  className="w-4 h-4 text-neutral-300 group-hover:text-teal-600 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0"
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

        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 mt-6 flex items-center gap-2">
          <span className="inline-block w-6 h-px bg-neutral-300" aria-hidden="true" />
          More sessions in the full archive
        </p>
      </section>

      {/* ── What we cover — topic chips ──────────────────────────── */}
      <section
        ref={topicsRef}
        className={`mb-20 ${topicsInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What the series covers
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {String(topicCounts.length).padStart(2, "0")} topics
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-8">
          Topics in rotation.
        </h2>
        <div className="flex flex-wrap gap-2">
          {topicCounts.map((t) => (
            <span
              key={t.label}
              className="inline-flex items-baseline gap-2 font-mono text-xs px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-700"
            >
              <span>{t.label}</span>
              <span className="text-[10px] tabular-nums text-neutral-400">
                {t.count}
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* ── Additional resources — pillar cards ──────────────────── */}
      <section ref={extrasRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Beyond the seminars
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {String(additionalResources.length).padStart(2, "0")} references
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-3">
          Canonical references.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          The standards documents, community forums, and adjacent communities
          worth keeping a tab open to.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
          {additionalResources.map((r, i) => {
            const a = accentMap[r.accent];
            return (
              <a
                key={r.mono}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group bg-white pt-7 pb-8 px-6 border-t-2 ${a.border} hover:bg-neutral-50/60 transition-colors ${
                  extrasInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${a.chip}`}
                  >
                    {r.mono}
                  </span>
                  <svg
                    className={`w-4 h-4 text-neutral-300 transition-all shrink-0 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                      r.accent === "teal"
                        ? "group-hover:text-teal-600"
                        : "group-hover:text-purple-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
                <h3
                  className={`font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight leading-snug mb-2 transition-colors ${
                    r.accent === "teal"
                      ? "group-hover:text-teal-700"
                      : "group-hover:text-purple-700"
                  }`}
                >
                  {r.name}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-4 max-w-sm">
                  {r.desc}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 truncate">
                  {r.domain}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      {/* ── CTA — propose a topic ────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          The series is built by members
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Got a topic worth teaching? Propose a session.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Talks and tutorials come from members willing to share what
          they&rsquo;ve learned. New speakers welcome &mdash; the Education
          working group helps you shape the session.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="mailto:contact@us-rse.org?subject=Seminar%20Proposal"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Propose a topic
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
            <span>or</span>
            <Link
              to="/community/working-groups"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Join the Education WG
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
          Where the rest of the field gathers.
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
                <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1 group-hover:text-teal-700 transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-neutral-500">{b.teaser}</p>
              </div>
              <svg
                className="w-5 h-5 text-neutral-400 group-hover:text-teal-700 transition-all group-hover:translate-x-1 shrink-0"
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
    </ResourcesLayout>
  );
}
