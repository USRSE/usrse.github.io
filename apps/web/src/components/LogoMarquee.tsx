/* ── Organizational Members ─────────────────────────────────────────── */

const premierMembers = [
  "University of Illinois Urbana-Champaign",
  "Lawrence Berkeley National Laboratory",
  "Princeton University",
  "Sandia National Laboratories",
  "NumFOCUS",
  "Coalition for Academic Scientific Computation",
  "The Carpentries",
];

const standardMembers = [
  "Center for Research Computing — Notre Dame",
  "Rosen Center for Advanced Computing — Purdue",
  "NSF National Center for Atmospheric Research",
  "Pasteur ISI",
  "Research Technologies — Indiana University",
  "Globus",
  "Academic Data Science Alliance",
  "Research Software Alliance",
  "Omnibond",
  "Dartmouth",
  "Open Molecular Software Foundation",
  "University of Florida Research Computing",
  "University of Colorado Anschutz",
  "UChicago Data Science Institute",
];

const basicMembers = [
  "Open OnDemand",
  "Renaissance Computing Institute",
];

const allMembers = [...premierMembers, ...standardMembers, ...basicMembers];

/* ── Sponsors ──────────────────────────────────────────────────────── */

const sponsors = [
  { name: "Alfred P. Sloan Foundation", tier: "major" },
  { name: "University of Illinois Urbana-Champaign", tier: "platinum" },
  { name: "Princeton University", tier: "platinum" },
  { name: "SHI", tier: "platinum" },
  { name: "Dell", tier: "platinum" },
  { name: "Schmidt Sciences", tier: "platinum" },
  { name: "Globus", tier: "gold" },
  { name: "Los Alamos National Laboratory", tier: "gold" },
  { name: "IBM", tier: "gold" },
  { name: "HPE / AMD", tier: "gold" },
  { name: "Sustainable Horizons Institute", tier: "supporter" },
  { name: "Omnibond", tier: "supporter" },
];

/* ── Shared logo placeholder ───────────────────────────────────────── */

function LogoPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(/[\s—\-/]+/)
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .map((w) => w[0])
    .join("")
    .slice(0, 3);

  return (
    <div className="flex items-center gap-3 px-5 shrink-0">
      <div className="w-9 h-9 rounded-lg bg-neutral-200/60 border border-neutral-200 flex items-center justify-center text-[11px] font-bold text-neutral-400 tracking-tight">
        {initials}
      </div>
      <span className="text-sm text-neutral-400 font-medium whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

/* ── Marquee row ───────────────────────────────────────────────────── */

function MarqueeRow({
  items,
  direction = "left",
  speed = 50,
}: {
  items: string[];
  direction?: "left" | "right";
  speed?: number;
}) {
  const duration = items.length * speed / 10;
  const animationName = direction === "left" ? "marquee" : "marquee-reverse";

  return (
    <div className="relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-neutral-50 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-neutral-50 to-transparent pointer-events-none" />

      <div
        className="flex"
        style={{ animation: `${animationName} ${duration}s linear infinite` }}
      >
        {items.map((name) => (
          <LogoPlaceholder key={`a-${name}`} name={name} />
        ))}
        {items.map((name) => (
          <LogoPlaceholder key={`b-${name}`} name={name} />
        ))}
      </div>
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────────── */

export function LogoMarquee() {
  const sponsorNames = sponsors.map((s) => s.name);

  return (
    <section className="relative bg-neutral-50 py-10 overflow-hidden border-b border-neutral-100">
      {/* Row 1: Organizational Members */}
      <div className="mb-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4 px-6">
          Organizational Members
        </p>
        <MarqueeRow items={allMembers} direction="left" speed={45} />
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-100 mx-auto max-w-5xl" />

      {/* Row 2: Sponsors */}
      <div className="mt-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4 px-6">
          Sponsors
        </p>
        <MarqueeRow items={sponsorNames} direction="right" speed={55} />
      </div>
    </section>
  );
}
