import { AboutLayout } from "@/components/about/AboutLayout";

const rseTypes = [
  {
    label: "Researcher who codes",
    description:
      "Researchers who spend a significant amount of time programming as part of their own research work.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    label: "Software engineer in research",
    description:
      "Full-time software engineers who write code to solve research problems in an academic or scientific setting.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    label: "Somewhere in between",
    description:
      "Professionals who combine domain expertise with software development, spanning the full spectrum between research and engineering.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
];

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
      {/* Core definition */}
      <div className="mb-12">
        <blockquote className="relative pl-6 border-l-4 border-teal-500 py-2 mb-8">
          <p className="text-xl text-neutral-700 leading-relaxed font-medium italic">
            "We like an inclusive definition of Research Software Engineers to
            encompass those who regularly use expertise in programming to advance
            research."
          </p>
        </blockquote>

        <p className="text-neutral-600 leading-relaxed">
          This includes researchers who spend a significant amount of time
          programming, full-time software engineers writing code to solve
          research problems, and those somewhere in-between. We aspire to apply
          the skills and practices of software development to research to create
          more robust, manageable, and sustainable research software.
        </p>
      </div>

      {/* The spectrum */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          The RSE Spectrum
        </h2>

        {/* Visual spectrum bar */}
        <div className="relative mb-10">
          <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-teal-500 to-teal-300" />
          <div className="flex justify-between mt-3">
            <span className="text-xs font-medium text-purple-600">
              Research-focused
            </span>
            <span className="text-xs font-medium text-teal-600">
              Engineering-focused
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {rseTypes.map((type, i) => (
            <div
              key={type.label}
              className="flex items-start gap-5 p-5 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:shadow-sm hover:border-neutral-200 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-teal-100 text-purple-600 flex items-center justify-center shrink-0">
                {type.icon}
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-1">
                  {type.label}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {type.description}
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-300 shrink-0 mt-1">
                0{i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* What RSEs do */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          What RSEs Do
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Research Software Engineers work across every domain of science and
          scholarship. They might be:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "Writing simulation code for climate models",
            "Building data pipelines for genomics research",
            "Developing visualization tools for astronomers",
            "Maintaining shared libraries used by hundreds of researchers",
            "Teaching best practices for reproducible software",
            "Architecting HPC applications for national labs",
          ].map((task) => (
            <div
              key={task}
              className="flex items-start gap-2.5 text-sm text-neutral-600"
            >
              <svg
                className="w-4 h-4 text-teal-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {task}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-teal-50 to-purple-50 border border-teal-100">
        <h3 className="font-bold text-neutral-900 mb-2">Sound like you?</h3>
        <p className="text-sm text-neutral-600 mb-4">
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
