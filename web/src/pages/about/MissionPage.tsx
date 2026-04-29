import { AboutLayout } from "@/components/about/AboutLayout";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { useInView } from "@/hooks/useInView";

/**
 * Approximate membership trajectory 2018 — 2026, calibrated to public
 * milestones. Exact figures vary; the curve shape tells the story — a
 * grassroots signup list that became a 4,000-person professional community.
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

const milestones: {
  year: number;
  label: string;
  position: "top" | "bottom";
}[] = [
  { year: 2018, label: "Founded", position: "top" },
  { year: 2021, label: "First USRSE Conference", position: "bottom" },
  { year: 2026, label: "4,000+ today", position: "top" },
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

      {/* horizontal gridlines with k-suffixed labels */}
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

      {/* year ticks */}
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

      {/* filled area */}
      <path
        d={area}
        fill="url(#missionSparkArea)"
        style={{
          opacity: active ? 1 : 0,
          transition: "opacity 1.2s ease 0.6s",
        }}
      />

      {/* trajectory line, drawn on scroll */}
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

      {/* milestone markers */}
      {milestones.map((m, i) => {
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
  const { ref, isInView } = useInView(0.1);
  const { ref: chartRef, isInView: chartInView } = useInView(0.2);

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
      {/* Community photo */}
      <div className="mb-12">
        <PhotoPlaceholder label="US-RSE community at a conference" aspect="ultrawide" />
      </div>

      {/* Opening narrative */}
      <p className="text-xl text-neutral-700 leading-relaxed mb-16 max-w-2xl">
        The US Research Software Engineer Association (US-RSE) is a
        community-driven effort focused on the increasingly important role of
        the Research Software Engineer. We focus on four overarching areas.
      </p>

      {/* ── Four Pillars — typographic, not cards ──────────────────── */}
      <div ref={ref} className="mb-20">
        {[
          {
            num: "01",
            title: "Community",
            color: "text-teal-600",
            body: "Building a connective, supportive, and diverse community of those who write and contribute to research software. Our community spans universities, laboratories, companies, and institutions of all sizes.",
          },
          {
            num: "02",
            title: "Advocacy",
            color: "text-purple-500",
            body: "Advocating for the recognition of the RSE role and career path, raising awareness of the importance of software in research, and promoting the value RSEs bring to the research enterprise.",
          },
          {
            num: "03",
            title: "Resources",
            color: "text-teal-600",
            body: "Providing useful shared resources to the community including a jobs board, educational materials, and connections to opportunities for professional development.",
          },
          {
            num: "04",
            title: "Diversity, Equity & Inclusion",
            color: "text-purple-500",
            body: "Ensuring an inclusive environment with equitable treatment for all, and promoting and encouraging diversity throughout the RSE community in the US.",
          },
        ].map((pillar, i) => (
          <div
            key={pillar.num}
            className={`flex gap-5 lg:gap-8 py-8 ${
              i < 3 ? "border-b border-neutral-100" : ""
            } ${isInView ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className={`font-mono text-sm ${pillar.color} shrink-0 pt-1`}>
              {pillar.num}
            </span>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                {pillar.title}
              </h3>
              <p className="text-neutral-500 leading-relaxed">
                {pillar.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Membership ─────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Membership
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Membership in US-RSE is easy and free. We welcome anyone who supports
          our organizational mission, regardless of location or institutional
          affiliation. Our members include:
        </p>

        {/* Indented text block — not bullet points in cards */}
        <div className="border-l-2 border-neutral-200 pl-5 space-y-3 text-neutral-600">
          <p>People who identify as Research Software Engineers</p>
          <p>People who are interested in a career as an RSE</p>
          <p>People who are allies of the RSE community</p>
          <p>People who are managers of RSEs</p>
        </div>
      </div>

      {/* ── Why Research Software Matters ───────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Why Research Software Matters
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          The increasing use of digital technologies across research communities
          has gone hand in hand with a strong growth and reliance on software
          written or customized to solve research problems. This growth presents
          great opportunities to:
        </p>

        <div className="border-l-2 border-purple-200 pl-5 space-y-3 text-neutral-600 mb-6">
          <p>Improve the development of research software</p>
          <p>Incentivize the sharing, curation, and maintenance of research software artifacts and knowledge</p>
        </div>

        <p className="text-neutral-600 leading-relaxed">
          Research software does not develop, curate, or maintain itself. RSEs
          create value both directly — by enabling specific research projects —
          and indirectly — by ensuring that research software meets standards for
          impact and reproducibility.
        </p>
      </div>

      {/* ── Origins — timeline style, not a card ───────────────────── */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          Our Origins
        </h2>
        <div className="flex gap-5 lg:gap-8">
          <div className="shrink-0 flex flex-col items-center">
            <span className="font-mono text-xs text-neutral-400">2017</span>
            <div className="w-px flex-1 bg-neutral-200 my-2" />
            <span className="font-mono text-xs text-neutral-400">2018</span>
          </div>
          <p className="text-neutral-600 leading-relaxed">
            US-RSE traces its origins to conversations at an international RSE
            survey and the first International RSE Leaders Workshop held in
            London. Five US representatives at that workshop were inspired to
            establish a formal US community, and the US-RSE Association has been
            growing ever since — from a handful of founding members to over
            4,000 today.
          </p>
        </div>
      </div>

      {/* ── Growth trajectory — visual receipt for the Origins paragraph ── */}
      <div ref={chartRef} className="mb-4 pt-8 border-t border-neutral-100">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal-700 mb-2">
              Membership trajectory — 2018 to 2026
            </p>
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight">
              From 20 signups to 4,000+ members.
            </h3>
          </div>
          <p className="text-sm text-neutral-500 max-w-xs md:text-right">
            A 200&times; increase over eight years, tracking the emergence of
            research software engineering as a profession.
          </p>
        </div>

        <GrowthSparkline active={chartInView} />
      </div>
    </AboutLayout>
  );
}
