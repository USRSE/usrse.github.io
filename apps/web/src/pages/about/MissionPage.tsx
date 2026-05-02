import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

/**
 * Approximate membership trajectory 2018 — 2026, calibrated to public
 * milestones. The curve shape tells the story — a grassroots signup list
 * that became a 4,000-person professional community.
 */
const growthData = [
  { year: 2018, members: 20 },
  { year: 2019, members: 150 },
  { year: 2020, members: 450 },
  { year: 2021, members: 900 },
  { year: 2022, members: 1500 },
  { year: 2023, members: 2200 },
  { year: 2024, members: 2900 },
  { year: 2025, members: 3600 },
  { year: 2026, members: 4000 },
];

const chartMilestones: {
  year: number;
  label: string;
  position: "top" | "bottom";
}[] = [
  { year: 2018, label: "Founded", position: "top" },
  { year: 2021, label: "First USRSE Conference", position: "bottom" },
  { year: 2026, label: "4,000+ today", position: "top" },
];

type Accent = "teal" | "purple";

interface Pillar {
  num: string;
  title: string;
  body: string;
  accent: Accent;
}

const pillars: Pillar[] = [
  {
    num: "01",
    title: "Community",
    body: "Build a connective, supportive, and diverse community of those who write and contribute to research software — spanning universities, laboratories, companies, and institutions of all sizes.",
    accent: "teal",
  },
  {
    num: "02",
    title: "Advocacy",
    body: "Advocate for the recognition of the RSE role and career path, raise awareness of the importance of software in research, and promote the value RSEs bring to the research enterprise.",
    accent: "purple",
  },
  {
    num: "03",
    title: "Resources",
    body: "Provide useful shared resources including a jobs board, educational materials, working groups, and connections to opportunities for professional development.",
    accent: "teal",
  },
  {
    num: "04",
    title: "Diversity, Equity & Inclusion",
    body: "Ensure an inclusive environment with equitable treatment for all, and actively promote diversity throughout the RSE community in the US.",
    accent: "purple",
  },
];

const accentClass: Record<Accent, { border: string; num: string }> = {
  teal: { border: "border-teal-500", num: "text-teal-600" },
  purple: { border: "border-purple-500", num: "text-purple-500" },
};

/** Fields that rely meaningfully on research software — a small sample. */
const domains = [
  "Genomics",
  "Climate science",
  "Astrophysics",
  "Materials science",
  "Neuroscience",
  "High-energy physics",
  "Epidemiology",
  "Quantum computing",
  "Machine learning",
  "Bioinformatics",
  "Oceanography",
  "Digital humanities",
];

interface Archetype {
  num: string;
  label: string;
  detail: string;
}

const archetypes: Archetype[] = [
  {
    num: "01",
    label: "RSEs",
    detail: "People who identify as Research Software Engineers.",
  },
  {
    num: "02",
    label: "Future RSEs",
    detail: "People exploring a career as an RSE.",
  },
  {
    num: "03",
    label: "Allies",
    detail: "Anyone who supports the RSE community.",
  },
  {
    num: "04",
    label: "Managers",
    detail: "Leaders of teams that include RSEs.",
  },
];

interface TimelineEntry {
  year: string;
  title: string;
  body: string;
}

const timeline: TimelineEntry[] = [
  {
    year: "2017",
    title: "International RSE Leaders Workshop",
    body: "Five US representatives at the London workshop are inspired to form a formal US community.",
  },
  {
    year: "2018",
    title: "US-RSE Association founded",
    body: "The US Research Software Engineer Association launches with a handful of founding members.",
  },
  {
    year: "2019",
    title: "Community calls begin",
    body: "A monthly cadence of calls establishes connection across the growing network.",
  },
  {
    year: "2021",
    title: "First USRSE conference",
    body: "USRSE'21 brings the community together and sets the template for annual gatherings.",
  },
  {
    year: "2022",
    title: "Alfred P. Sloan Foundation grant",
    body: "A multi-year grant enables the first paid staff and sustained programs.",
  },
  {
    year: "2024",
    title: "Working groups expand",
    body: "Eleven active working groups tackle specialized areas from education to DEI.",
  },
  {
    year: "2026",
    title: "4,000+ members",
    body: "US-RSE is a 4,000-person professional community across universities, labs, and industry.",
  },
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
    title: "Meet the Board",
    teaser: "The elected directors steering the association.",
    path: "/about/board",
  },
  {
    eyebrow: "Support",
    title: "Our Sponsors",
    teaser: "The organizations and grants that make this possible.",
    path: "/about/sponsors",
  },
  {
    eyebrow: "Accountability",
    title: "Financial Status",
    teaser: "Where the money comes from and where it goes.",
    path: "/about/financial-status",
  },
  {
    eyebrow: "Team",
    title: "Our Staff",
    teaser: "The full-time humans running the organization day-to-day.",
    path: "/about/staff",
  },
];

function GrowthSparkline({ active }: { active: boolean }) {
  const w = 900;
  const h = 260;
  const pad = { top: 48, right: 72, bottom: 56, left: 56 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const maxMembers = 4200;
  const minYear = growthData[0].year;
  const maxYear = growthData[growthData.length - 1].year;

  const xFor = (year: number) =>
    pad.left + ((year - minYear) / (maxYear - minYear)) * innerW;
  const yFor = (n: number) => pad.top + innerH - (n / maxMembers) * innerH;

  const pts = growthData.map((d) => [xFor(d.year), yFor(d.members)] as const);
  let path = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    path += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }

  const area =
    path +
    ` L ${pts[pts.length - 1][0]},${pad.top + innerH}` +
    ` L ${pts[0][0]},${pad.top + innerH} Z`;

  const lineLength = 2400;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-auto"
      role="img"
      aria-label="US-RSE membership growth from 2018 to 2026, rising from 20 to over 4,000"
    >
      <defs>
        <linearGradient id="missionSparkArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2cb4d2" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2cb4d2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="missionSparkLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#741755" />
          <stop offset="55%" stopColor="#188eac" />
          <stop offset="100%" stopColor="#2cb4d2" />
        </linearGradient>
      </defs>

      {[0, 1000, 2000, 3000, 4000].map((v) => (
        <g key={v}>
          <line
            x1={pad.left}
            x2={w - pad.right}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="rgba(17,21,22,0.06)"
            strokeDasharray="2 4"
          />
          <text
            x={pad.left - 12}
            y={yFor(v) + 3}
            textAnchor="end"
            fontFamily="Fira Code, monospace"
            fontSize="10"
            fill="#b8bec1"
          >
            {v === 0 ? "0" : `${v / 1000}k`}
          </text>
        </g>
      ))}

      {growthData.map((d) => (
        <text
          key={d.year}
          x={xFor(d.year)}
          y={pad.top + innerH + 22}
          textAnchor="middle"
          fontFamily="Fira Code, monospace"
          fontSize="10"
          fill="#b8bec1"
        >
          {`'${String(d.year).slice(2)}`}
        </text>
      ))}

      <path
        d={area}
        fill="url(#missionSparkArea)"
        style={{
          opacity: active ? 1 : 0,
          transition: "opacity 1.2s ease 0.6s",
        }}
      />

      <path
        d={path}
        fill="none"
        stroke="url(#missionSparkLine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: lineLength,
          strokeDashoffset: active ? 0 : lineLength,
          transition: "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
        }}
      />

      {chartMilestones.map((m, i) => {
        const d = growthData.find((p) => p.year === m.year)!;
        const x = xFor(d.year);
        const y = yFor(d.members);
        const isTop = m.position === "top";
        const labelY = isTop ? y - 20 : y + 28;
        return (
          <g
            key={m.year}
            style={{
              opacity: active ? 1 : 0,
              transition: `opacity 0.5s ease ${1.2 + i * 0.2}s`,
            }}
          >
            <line
              x1={x}
              x2={x}
              y1={isTop ? y - 6 : y + 6}
              y2={isTop ? labelY + 6 : labelY - 14}
              stroke="rgba(17,21,22,0.2)"
              strokeWidth="1"
            />
            <circle cx={x} cy={y} r="6" fill="#ffffff" stroke="#111516" strokeWidth="1.5" />
            <circle cx={x} cy={y} r="3" fill="#188eac" />
            <text
              x={x}
              y={labelY}
              textAnchor="middle"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="11"
              fontWeight="600"
              fill="#111516"
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function MissionPage() {
  const { ref: manifestoRef, isInView: manifestoInView } = useInView(0.2);
  const { ref: chartRef, isInView: chartInView } = useInView(0.2);
  const { ref: pillarsRef, isInView: pillarsInView } = useInView(0.1);
  const { ref: whyRef, isInView: whyInView } = useInView(0.1);
  const { ref: belongRef, isInView: belongInView } = useInView(0.1);
  const { ref: timelineRef, isInView: timelineInView } = useInView(0.05);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <AboutLayout
      title="Our Mission"
      subtitle="A community-driven effort focused on the increasingly important role of the Research Software Engineer."
      nextPage={{
        path: "/about/what-is-an-rse",
        label: "What is an RSE?",
        teaser: "Learn who Research Software Engineers are",
      }}
    >
      {/* ── Manifesto ───────────────────────────────────────────── */}
      <section
        ref={manifestoRef}
        className={`mb-24 ${manifestoInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          Our belief
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          Research software is the invisible infrastructure of modern science.
          The people who build it deserve recognition, community, and a career.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          US-RSE is a community-driven effort focused on the increasingly
          important role of the Research Software Engineer — built on four
          pillars, sustained by thousands of members, and rooted in work that
          powers modern research.
        </p>
      </section>

      {/* ── Proof — growth trajectory ───────────────────────────── */}
      <section ref={chartRef} className="mb-24 pt-12 border-t border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal-700 mb-2">
              The movement, measured
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              From 20 signups to 4,000+ members.
            </h2>
          </div>
          <p className="text-sm text-neutral-500 max-w-xs md:text-right">
            A 200&times; increase over eight years, tracking the emergence of
            research software engineering as a profession.
          </p>
        </div>

        <GrowthSparkline active={chartInView} />
      </section>

      {/* ── Four Pillars — redesigned ───────────────────────────── */}
      <section ref={pillarsRef} className="mb-24">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What we stand on
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Four pillars.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {pillars.map((p, i) => {
            const a = accentClass[p.accent];
            return (
              <article
                key={p.num}
                className={`bg-white pt-10 pb-12 px-6 md:px-8 border-t-2 ${a.border} ${
                  pillarsInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span
                  className={`font-display text-5xl font-black tracking-tight ${a.num}`}
                >
                  {p.num}
                </span>
                <h3 className="font-display text-2xl font-bold text-neutral-900 mt-5 mb-3 tracking-tight">
                  {p.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed max-w-md">
                  {p.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Why it matters — pull quote + domain cluster ─────────── */}
      <section
        ref={whyRef}
        className="mb-24 py-16 border-y-2 border-neutral-900 bg-neutral-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16">
          <div className={`${whyInView ? "animate-slide-up" : "opacity-0"}`}>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
              Why it matters
            </p>
            <blockquote className="font-display text-2xl lg:text-[2rem] font-bold text-neutral-900 leading-[1.15] tracking-tight mb-8 text-balance">
              &ldquo;Research software does not develop, curate, or maintain
              itself.&rdquo;
            </blockquote>
            <p className="text-base text-neutral-600 leading-relaxed mb-5 max-w-xl">
              The increasing use of digital technologies across research
              communities has gone hand in hand with a strong growth and
              reliance on software written or customized to solve research
              problems. RSEs create value both directly — by enabling specific
              research projects — and indirectly — by ensuring that research
              software meets standards for impact and reproducibility.
            </p>
            <p className="text-base text-neutral-600 leading-relaxed max-w-xl">
              Without dedicated investment in the people who build it, progress
              slows, duplication compounds, and the knowledge walks out the
              door when grants end.
            </p>
          </div>

          <div
            className={`${whyInView ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: "200ms" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
              Fields powered by research software
            </p>
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <span
                  key={d}
                  className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700"
                >
                  {d}
                </span>
              ))}
              <span className="font-mono text-[11px] px-2.5 py-1 text-neutral-400">
                … and counting
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who belongs here — archetypes + Join CTA ────────────── */}
      <section ref={belongRef} className="mb-24">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700">
            Who belongs here
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Membership is free.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          We welcome anyone who supports our mission, regardless of location or
          institutional affiliation. Our community includes:
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 mb-12">
          {archetypes.map((a, i) => (
            <div
              key={a.num}
              className={`bg-white p-5 lg:p-6 ${
                belongInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p className="font-mono text-[10px] text-neutral-400 tabular-nums mb-3">
                {a.num}
              </p>
              <p className="font-display text-lg font-bold text-neutral-900 mb-1.5 tracking-tight">
                {a.label}
              </p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {a.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="mailto:info@us-rse.org?subject=Join%20US-RSE"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Join for free
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
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            No dues &middot; No application &middot; Anyone who fits above
          </p>
        </div>
      </section>

      {/* ── Origins — expanded timeline ─────────────────────────── */}
      <section ref={timelineRef} className="mb-24">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Where we came from
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          A short history.
        </h2>

        <ol className="relative border-l border-neutral-200 ml-2">
          {timeline.map((entry, i) => (
            <li
              key={entry.year}
              className={`pl-8 pb-8 last:pb-0 ${
                timelineInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${Math.min(i * 70, 400)}ms` }}
            >
              <span
                className="absolute -left-[5px] w-[10px] h-[10px] rounded-full bg-white border-2 border-neutral-900"
                aria-hidden="true"
              />
              <p className="font-mono text-xs text-neutral-400 tabular-nums mb-1">
                {entry.year}
              </p>
              <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1.5">
                {entry.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
                {entry.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Continue exploring — bridge cards ───────────────────── */}
      <section ref={bridgeRef} className="mb-4 pt-12 border-t-2 border-neutral-900">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Continue exploring
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-10">
          More of US-RSE.
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
