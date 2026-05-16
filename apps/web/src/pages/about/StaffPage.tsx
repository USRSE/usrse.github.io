import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

interface Stat {
  value: string;
  label: string;
}

const roleStats: Stat[] = [
  { value: "~20", label: "Founding members (2018)" },
  { value: "4,000+", label: "Members today" },
  { value: "280+", label: "Annual conference participants" },
  { value: "900+", label: "K-12 students reached" },
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Leadership",
    title: "Board of Directors",
    teaser: "The elected body the Executive Director answers to.",
    path: "/about/board",
  },
  {
    eyebrow: "Framework",
    title: "Governance",
    teaser: "The structure within which the role operates.",
    path: "/about/governance",
  },
  {
    eyebrow: "Purpose",
    title: "Our Mission",
    teaser: "What the organization stands for and works toward.",
    path: "/about/mission",
  },
  {
    eyebrow: "Values",
    title: "DEI Statement",
    teaser: "The commitments shaping every program and decision.",
    path: "/about/dei",
  },
];

export function StaffPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: profileRef, isInView: profileInView } = useInView(0.1);
  const { ref: storyRef, isInView: storyInView } = useInView(0.1);
  const { ref: statsRef, isInView: statsInView } = useInView(0.15);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <AboutLayout
      title="Staff"
      subtitle="The dedicated team powering US-RSE's day-to-day operations."
      prevPage={{ path: "/about/sponsors", label: "Sponsors" }}
      nextPage={{
        path: "/about/financial-status",
        label: "Financial Status",
        teaser: "How US-RSE is funded and sustained",
      }}
    >
      {/* ── The stance — manifesto + framing ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-20 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          Who keeps it running day-to-day
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          A 4,000-member community. One person holding the center.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          &ldquo;Staff&rdquo; at US-RSE means the paid operations team that
          works under the direction of the elected Board &mdash; keeping
          programs, members, grants, and infrastructure running day-to-day.
          Today, that team is one person.
        </p>
      </section>

      {/* ── Meet the ED — preserved asymmetric profile ──────────── */}
      <section
        ref={profileRef}
        className={`mb-20 pt-12 border-t border-neutral-200 ${
          profileInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Photo — links to Sandra's public profile (same image source
              as the BoardPage former-board entry; both point at the R2-
              hosted profile photo so a future change in admin propagates
              once the page data is refreshed). */}
          <div className="lg:w-72 shrink-0">
            <Link
              to="/members/sandra-gesing-y496vr20"
              className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-neutral-100 group block"
              aria-label="Sandra Gesing — view profile"
            >
              <img
                src="https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/5b56c6ca-3caf-4340-b27d-e6c903f3c2d5/1778904173372-qt6ddw.jpg"
                alt="Sandra Gesing"
                className="absolute inset-0 w-full h-full object-cover object-top grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
              />
            </Link>
          </div>

          {/* Name block */}
          <div className="flex-1 lg:pt-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal-700 mb-4">
              Executive Director
            </p>
            <Link
              to="/members/sandra-gesing-y496vr20"
              className="inline-block group"
              aria-label="Sandra Gesing — view profile"
            >
              <h2 className="font-display text-4xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-none mb-5 group-hover:text-purple-700 transition-colors">
                Sandra Gesing
              </h2>
            </Link>
            <p className="text-neutral-600 leading-relaxed max-w-xl mb-8">
              Sandra brings more than 17 years of experience across research
              software engineering, academic research, and industry leadership
              &mdash; systems development, programming group management, and
              administrative roles in industry before pivoting to academia,
              where she earned her PhD in bioinformatics.
            </p>

            {/* Contact links */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href="mailto:sandra@us-rse.org"
                className="group inline-flex items-center gap-1.5 font-mono text-[12px] text-purple-700 hover:text-purple-900 transition-colors"
              >
                sandra@us-rse.org
                <svg
                  className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <span className="text-neutral-300" aria-hidden="true">
                &middot;
              </span>
              <a
                href="https://www.linkedin.com/in/sandragesing/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[12px] text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                LinkedIn
              </a>
              <span className="text-neutral-300" aria-hidden="true">
                &middot;
              </span>
              <a
                href="https://sandra-gesing.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[12px] text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                sandra-gesing.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Her story — preserved prose, framed ──────────────────── */}
      <section ref={storyRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            The story
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-10 text-balance">
          From 20 members to 4,000.
        </h2>
        <div
          className={`space-y-5 max-w-3xl ${storyInView ? "animate-slide-up" : "opacity-0"}`}
        >
          <p className="text-base lg:text-lg text-neutral-700 leading-relaxed">
            Sandra joined US-RSE in its earliest days, when the community
            numbered roughly 20 members. Under her leadership as Executive
            Director, the organization has grown into one of the most active
            RSE communities in the world, now exceeding 4,000 members as of
            2026.
          </p>
          <p className="text-base lg:text-lg text-neutral-700 leading-relaxed">
            She has been instrumental in securing grant funding from the
            Alfred P. Sloan Foundation and Schmidt Sciences, launching the
            annual US-RSE Conference with 280+ participants, establishing an
            organizational membership program, and building K-12 outreach
            efforts that have reached more than 900 students across 46
            classrooms.
          </p>
        </div>
      </section>

      {/* ── What the role has built — stats ─────────────────────── */}
      <section ref={statsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What the role has built
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          By the numbers.
        </h2>

        <div
          className={`grid grid-cols-2 md:grid-cols-4 ${
            statsInView ? "animate-fade-in" : "opacity-0"
          }`}
        >
          {roleStats.map((s, i) => (
            <div
              key={s.label}
              className={`py-5 px-5 md:px-7 ${
                i > 0 ? "md:border-l md:border-neutral-200" : ""
              } ${i % 2 !== 0 ? "border-l border-neutral-200 md:border-l" : ""} ${
                i >= 2 ? "border-t border-neutral-200 md:border-t-0" : ""
              }`}
            >
              <p className="font-display text-3xl lg:text-4xl font-bold text-teal-700 tabular-nums tracking-tight leading-none">
                {s.value}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500 mt-3 leading-snug">
                {s.label}
              </p>
            </div>
          ))}
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
          The organization she steers.
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
    </AboutLayout>
  );
}
