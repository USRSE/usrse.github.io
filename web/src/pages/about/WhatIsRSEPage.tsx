import { AboutLayout } from "@/components/about/AboutLayout";

export function WhatIsRSEPage() {
  return (
    <AboutLayout
      title="What is an RSE?"
      subtitle="Research Software Engineers use expertise in programming to advance research."
      prevPage={{ path: "/about/mission", label: "Mission" }}
      nextPage={{
        path: "/about/dei",
        label: "DEI Statement",
        teaser: "Our commitment to inclusion and equity",
      }}
    >
      {/* ── Core definition — large editorial quote ─────────────────── */}
      <blockquote className="relative mb-14">
        <p className="text-xl lg:text-2xl text-neutral-800 leading-relaxed font-medium">
          "We like an inclusive definition of Research Software Engineers to
          encompass those who regularly use expertise in programming to advance
          research."
        </p>
        <div className="mt-4 w-16 h-0.5 bg-teal-500" />
      </blockquote>

      <p className="text-neutral-600 leading-relaxed mb-16">
        This includes researchers who spend a significant amount of time
        programming, full-time software engineers writing code to solve
        research problems, and those somewhere in-between. We aspire to apply
        the skills and practices of software development to research to create
        more robust, manageable, and sustainable research software.
      </p>

      {/* ── The Spectrum ───────────────────────────────────────────── */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8">
          The RSE Spectrum
        </h2>

        {/* Visual spectrum bar */}
        <div className="mb-12">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 via-teal-500 to-teal-300" />
          <div className="flex justify-between mt-2">
            <span className="text-xs font-mono text-purple-500">
              Research-focused
            </span>
            <span className="text-xs font-mono text-teal-600">
              Engineering-focused
            </span>
          </div>
        </div>

        {/* Three types — horizontal rule-separated, not cards */}
        {[
          {
            num: "01",
            label: "Researcher who codes",
            body: "Researchers who spend a significant amount of time programming as part of their own research work.",
          },
          {
            num: "02",
            label: "Software engineer in research",
            body: "Full-time software engineers who write code to solve research problems in an academic or scientific setting.",
          },
          {
            num: "03",
            label: "Somewhere in between",
            body: "Professionals who combine domain expertise with software development, spanning the full spectrum between research and engineering.",
          },
        ].map((type, i) => (
          <div
            key={type.num}
            className={`flex gap-5 lg:gap-8 py-7 ${
              i < 2 ? "border-b border-neutral-100" : ""
            }`}
          >
            <span className="font-mono text-sm text-teal-600 shrink-0 pt-0.5">
              {type.num}
            </span>
            <div>
              <h3 className="font-bold text-neutral-900 mb-1">
                {type.label}
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {type.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── What RSEs Do ───────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          What RSEs Do
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Research Software Engineers work across every domain of science and
          scholarship. They might be:
        </p>

        {/* Two-column text list — no icons, no checkmarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 border-l-2 border-teal-200 pl-5">
          {[
            "Writing simulation code for climate models",
            "Building data pipelines for genomics research",
            "Developing visualization tools for astronomers",
            "Maintaining shared libraries used by hundreds of researchers",
            "Teaching best practices for reproducible software",
            "Architecting HPC applications for national labs",
          ].map((task) => (
            <p key={task} className="text-sm text-neutral-600">{task}</p>
          ))}
        </div>
      </div>

      {/* ── CTA — not a card, just a clear ask ─────────────────────── */}
      <div className="border-t border-neutral-100 pt-10">
        <h3 className="text-lg font-bold text-neutral-900 mb-2">
          Sound like you?
        </h3>
        <p className="text-neutral-600 mb-5">
          Whether you write code for research, manage those who do, or simply
          believe in the mission — you belong in the US-RSE community.
        </p>
        <a
          href="/#join"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white text-sm font-bold rounded-xl hover:bg-teal-600 transition-colors"
        >
          Join US-RSE
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </AboutLayout>
  );
}
