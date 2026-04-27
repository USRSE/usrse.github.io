const members = [
  "Stanford University",
  "MIT",
  "Oak Ridge National Lab",
  "NCAR",
  "Sandia National Labs",
  "Princeton University",
  "NASA",
  "Lawrence Livermore",
  "University of Illinois",
  "Caltech",
  "NOAA",
  "Johns Hopkins University",
  "Georgia Tech",
  "UC Berkeley",
  "Argonne National Lab",
  "University of Washington",
];

function LogoPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(/[\s-]+/)
    .filter((w) => w[0] === w[0].toUpperCase())
    .map((w) => w[0])
    .join("")
    .slice(0, 3);

  return (
    <div className="flex items-center gap-3 px-6 shrink-0">
      <div className="w-10 h-10 rounded-lg bg-neutral-200/60 border border-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-400 tracking-tight">
        {initials}
      </div>
      <span className="text-sm text-neutral-400 font-medium whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export function LogoMarquee() {
  return (
    <section className="relative bg-neutral-50 py-12 overflow-hidden border-b border-neutral-100">
      {/* Header */}
      <div className="text-center mb-8 px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Trusted by 190+ institutions
        </p>
      </div>

      {/* Marquee track — two copies for seamless loop */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-neutral-50 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-neutral-50 to-transparent pointer-events-none" />

        <div className="flex animate-[marquee_40s_linear_infinite]">
          {members.map((name) => (
            <LogoPlaceholder key={`a-${name}`} name={name} />
          ))}
          {members.map((name) => (
            <LogoPlaceholder key={`b-${name}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
