import { useInView } from "@/hooks/useInView";
import { useEffect, useState } from "react";

const stats = [
  { value: 2400, suffix: "+", label: "Members", description: "Across universities, labs & industry" },
  { value: 11, suffix: "", label: "Working Groups", description: "Active collaborative teams" },
  { value: 190, suffix: "+", label: "Institutions", description: "Represented in our community" },
  { value: 6, suffix: "", label: "Years Strong", description: "Growing since 2018" },
];

function AnimatedCounter({
  target,
  suffix,
  active,
}: {
  target: number;
  suffix: string;
  active: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;

    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(target * eased);
      setCount(start);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, active]);

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function Stats() {
  const { ref, isInView } = useInView(0.3);

  return (
    <section
      ref={ref}
      className="relative py-20 lg:py-28 bg-gradient-to-br from-teal-950 via-teal-900 to-purple-950 overflow-hidden"
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "2rem 2rem",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            Our Impact in Numbers
          </h2>
          <p className="text-teal-200/60 text-lg">
            A rapidly growing movement for research software excellence
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center ${isInView ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="text-4xl lg:text-5xl font-display font-bold text-white mb-2">
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  active={isInView}
                />
              </div>
              <div className="text-sm font-semibold text-teal-300 uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-white/40">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
