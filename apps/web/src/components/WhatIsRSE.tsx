import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInView } from "@/hooks/useInView";

/**
 * Homepage section explaining what an RSE is — the "aha moment" for first-time visitors.
 * The spectrum is a true slider: drag the thumb along the gradient (or click/keyboard),
 * and it snaps to one of three real-feeling personas. A ghost thumb tracks the cursor
 * on hover so the continuous-ness of the spectrum is visible even though the data is discrete.
 */

type PersonaId = "01" | "02" | "03";

interface Persona {
  id: PersonaId;
  position: number; // percentage along the spectrum (0 = research, 100 = engineering)
  name: string;
  role: string;
  day: string;
  mix: { label: string; value: number }[];
  tools: string[];
}

const personas: Persona[] = [
  {
    id: "01",
    position: 18,
    name: "Maya",
    role: "Computational biologist",
    day: "Spends her mornings analyzing single-cell sequencing data and her afternoons writing up results — coding is the tool, the paper is the goal.",
    mix: [
      { label: "Research", value: 60 },
      { label: "Code", value: 30 },
      { label: "Writing", value: 10 },
    ],
    tools: ["Python", "R", "Jupyter", "Snakemake"],
  },
  {
    id: "02",
    position: 52,
    name: "Priya",
    role: "Research software engineer",
    day: "Maintains a shared simulation framework used by 40+ labs. Splits her week between new features, user support, and co-authoring the papers her code enables.",
    mix: [
      { label: "Code", value: 60 },
      { label: "Collaboration", value: 25 },
      { label: "Docs", value: 15 },
    ],
    tools: ["Python", "C++", "CI/CD", "Profiling"],
  },
  {
    id: "03",
    position: 82,
    name: "Alex",
    role: "Scientific software engineer",
    day: "Builds and operates the HPC performance layer that lets a dozen research groups run simulations at scale — the science downstream is someone else's, the infrastructure is theirs.",
    mix: [
      { label: "Code", value: 75 },
      { label: "Ops", value: 15 },
      { label: "Review", value: 10 },
    ],
    tools: ["C++", "MPI", "SLURM", "Kubernetes"],
  },
];

const mixColors = ["bg-teal-500", "bg-purple-400", "bg-neutral-400"];

function nearestPersona(pct: number): Persona {
  let best = personas[0];
  let bestDist = Infinity;
  for (const p of personas) {
    const d = Math.abs(p.position - pct);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function WhatIsRSE() {
  const { ref, isInView } = useInView(0.15);
  const [selectedId, setSelectedId] = useState<PersonaId>("02");
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const persona = personas.find((p) => p.id === selectedId)!;
  const selectedIndex = personas.findIndex((p) => p.id === selectedId);
  const isDragging = dragPosition !== null;
  const thumbPosition = dragPosition ?? persona.position;

  const posFromClientX = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragPosition(posFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setDragPosition(posFromClientX(e.clientX));
  };

  const endPointerInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const final = dragPosition ?? posFromClientX(e.clientX);
    setSelectedId(nearestPersona(final).id);
    setDragPosition(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = selectedIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedId(personas[Math.min(personas.length - 1, idx + 1)].id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedId(personas[Math.max(0, idx - 1)].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      setSelectedId(personas[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      setSelectedId(personas[personas.length - 1].id);
    }
  };

  return (
    <section
      ref={ref}
      className="relative py-20 lg:py-28 overflow-hidden bg-neutral-50"
    >
      {/* Echo of the spectrum — horizontal wash from purple-50 to teal-50 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(253,240,247,0.9) 0%, rgba(255,255,255,1) 45%, rgba(255,255,255,1) 55%, rgba(237,249,253,0.9) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-neutral-400) 1px, transparent 1px), linear-gradient(to bottom, var(--color-neutral-400) 1px, transparent 1px)",
          backgroundSize: "3rem 3rem",
        }}
        aria-hidden="true"
      />

      {/* Decorative oversized question glyph — a quiet visual anchor */}
      <span
        aria-hidden="true"
        className="absolute -top-10 right-4 lg:right-12 font-display font-black text-[16rem] lg:text-[22rem] leading-none select-none pointer-events-none text-purple-500/[0.06]"
      >
        ?
      </span>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-start gap-14 lg:gap-20">
          {/* Left — question and answer */}
          <div
            className={`flex-1 ${isInView ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: "100ms" }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal-700 mb-4">
              You might already be one
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight leading-tight mb-6 text-neutral-900">
              What is a Research
              <br />
              Software Engineer?
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-8 max-w-lg">
              Anyone who regularly uses expertise in programming to advance
              research. The title covers researchers who code, full-time
              engineers solving research problems, and everyone in between —
              three real shapes of the same job.
            </p>
            <Link
              to="/about/what-is-an-rse"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
            >
              Explore the full definition
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Right — interactive spectrum slider */}
          <div
            className={`lg:w-[420px] shrink-0 ${isInView ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: "300ms" }}
          >
            {/* Number labels above the bar */}
            <div className="relative h-5 mb-3" aria-hidden="true">
              {personas.map((p) => (
                <span
                  key={`${p.id}-label`}
                  className={`absolute -translate-x-1/2 font-mono text-[10px] font-bold transition-colors duration-300 ${
                    selectedId === p.id
                      ? "text-neutral-900"
                      : "text-neutral-300"
                  }`}
                  style={{ left: `${p.position}%` }}
                >
                  {p.id}
                </span>
              ))}
            </div>

            {/* The slider track — captures all pointer + keyboard interaction */}
            <div
              ref={trackRef}
              role="slider"
              aria-label="RSE spectrum — drag to explore personas"
              aria-valuemin={0}
              aria-valuemax={personas.length - 1}
              aria-valuenow={selectedIndex}
              aria-valuetext={`${persona.name}, ${persona.role}`}
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endPointerInteraction}
              onPointerCancel={endPointerInteraction}
              onKeyDown={handleKeyDown}
              className={`relative h-10 flex items-center rounded-full select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                isDragging ? "cursor-grabbing" : "cursor-pointer"
              }`}
              style={{ touchAction: "pan-y" }}
            >
              {/* Gradient bar */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-purple-500 via-teal-500 to-teal-300 shadow-sm pointer-events-none" />

              {/* Three fixed persona markers — small ticks on the bar */}
              {personas.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <div
                    key={`${p.id}-marker`}
                    className="absolute top-1/2 pointer-events-none"
                    style={{
                      left: `${p.position}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    aria-hidden="true"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                        isSelected ? "bg-white" : "bg-white/60"
                      }`}
                    />
                  </div>
                );
              })}

              {/* Active thumb — slides smoothly between personas on release */}
              <div
                className={`absolute top-1/2 w-5 h-5 rounded-full bg-white border-2 border-neutral-900 pointer-events-none ${
                  isDragging ? "shadow-lg" : "shadow-md"
                }`}
                style={{
                  left: `${thumbPosition}%`,
                  transform: `translate(-50%, -50%) scale(${isDragging ? 1.15 : 1})`,
                  transition: isDragging
                    ? "transform 0.15s var(--ease-smooth), box-shadow 0.15s var(--ease-smooth)"
                    : "left 0.3s var(--ease-smooth), transform 0.3s var(--ease-smooth), box-shadow 0.3s var(--ease-smooth)",
                }}
                aria-hidden="true"
              />
            </div>

            {/* Spectrum endpoint labels */}
            <div className="flex justify-between mt-3 mb-8">
              <span className="text-[11px] font-mono text-purple-600">
                Research-focused
              </span>
              <span className="text-[11px] font-mono text-teal-700">
                Engineering-focused
              </span>
            </div>

            {/* Profile card */}
            <div
              key={persona.id}
              role="region"
              aria-live="polite"
              aria-label={`Persona: ${persona.name}, ${persona.role}`}
              className="animate-fade-in"
            >
              <div className="flex items-baseline gap-2.5 flex-wrap mb-3">
                <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
                  {persona.id}
                </span>
                <h3 className="font-display text-lg font-bold text-neutral-900">
                  {persona.name}
                </h3>
                <span className="text-sm text-neutral-500">
                  · {persona.role}
                </span>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed mb-6 text-pretty">
                {persona.day}
              </p>

              {/* Time breakdown — stacked bar */}
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">
                  Typical week
                </p>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-neutral-100 mb-2.5">
                  {persona.mix.map((m, i) => (
                    <div
                      key={m.label}
                      style={{
                        width: `${m.value}%`,
                        transition: "width 0.4s var(--ease-smooth)",
                      }}
                      className={mixColors[i]}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  {persona.mix.map((m, i) => (
                    <span
                      key={m.label}
                      className="inline-flex items-center gap-1.5 font-mono"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${mixColors[i]}`}
                      />
                      <span className="text-neutral-800 font-semibold tabular-nums">
                        {m.value}%
                      </span>
                      <span className="text-neutral-500">{m.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">
                  Tools of the trade
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {persona.tools.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation hint */}
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400">
              Drag the thumb or press{" "}
              <kbd className="inline-flex items-center justify-center w-4 h-4 align-middle text-[10px] bg-white border border-neutral-200 rounded">
                ←
              </kbd>{" "}
              <kbd className="inline-flex items-center justify-center w-4 h-4 align-middle text-[10px] bg-white border border-neutral-200 rounded">
                →
              </kbd>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
