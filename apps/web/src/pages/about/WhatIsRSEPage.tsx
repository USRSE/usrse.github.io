import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

interface Persona {
  num: string;
  name: string;
  role: string;
  position: number; // 0-100 along the spectrum
  intro: string;
  day: string;
  mix: { label: string; value: number }[];
  titles: string[];
  tools: string[];
}

const personas: Persona[] = [
  {
    num: "01",
    name: "Maya",
    role: "Computational biologist",
    position: 18,
    intro:
      "A researcher who codes. Analyzing single-cell sequencing data across 200+ tumor biopsies to identify rare cell types. Coding is the tool; the paper is the goal.",
    day: "Morning standup with the biology PI, then a quick Snakemake fix for a lab member. Afternoon split between running analyses on the HPC cluster and drafting paper methods. End of day reviewing a collaborator's R notebook.",
    mix: [
      { label: "Research", value: 60 },
      { label: "Code", value: 30 },
      { label: "Writing", value: 10 },
    ],
    titles: [
      "Computational Biologist",
      "Postdoctoral Researcher",
      "Scientific Programmer",
      "Data Scientist",
      "Bioinformatician",
    ],
    tools: ["Python", "R", "Jupyter", "Snakemake", "Seurat", "SLURM"],
  },
  {
    num: "02",
    name: "Priya",
    role: "Research software engineer",
    position: 52,
    intro:
      "Somewhere in between. Maintains a shared molecular dynamics framework used by 40+ labs across 15 universities. Splits her week between new features, user support, and co-authoring the papers her code enables.",
    day: "Morning triaging a GitHub issue from a European lab. Pair-programs a new feature with a grad student over video. Afternoon writing release notes and benchmarking a performance regression. Evening reviewing a journal submission co-authored with three PIs.",
    mix: [
      { label: "Code", value: 60 },
      { label: "Collaboration", value: 25 },
      { label: "Docs", value: 15 },
    ],
    titles: [
      "Research Software Engineer",
      "Scientific Software Developer",
      "Research Computing Engineer",
      "Computational Scientist",
      "Software Engineer (Research)",
    ],
    tools: ["Python", "C++", "CI/CD", "pytest", "Sphinx", "Git"],
  },
  {
    num: "03",
    name: "Alex",
    role: "Scientific software engineer",
    position: 82,
    intro:
      "A software engineer in research. Builds and operates the HPC performance layer that lets a dozen research groups run simulations at scale. The science downstream is someone else's; the infrastructure is theirs.",
    day: "Morning troubleshooting an MPI job failure on the new cluster. Afternoon profiling a code kernel alongside domain scientists to explain where time goes. Evening pushing a Terraform change that provisions compute for a collaborator group.",
    mix: [
      { label: "Code", value: 75 },
      { label: "Ops", value: 15 },
      { label: "Review", value: 10 },
    ],
    titles: [
      "Scientific Software Engineer",
      "Research Engineer",
      "HPC Engineer",
      "Performance Engineer",
      "Systems Programmer",
    ],
    tools: ["C++", "Fortran", "MPI", "SLURM", "Kubernetes", "CUDA"],
  },
];

const mixColors = ["bg-teal-500", "bg-purple-400", "bg-neutral-400"];

const titleAliases = [
  "Research Software Engineer",
  "Computational Scientist",
  "Scientific Programmer",
  "Research Software Developer",
  "Bioinformatician",
  "Computational Biologist",
  "Scientific Software Engineer",
  "HPC Engineer",
  "Research Data Engineer",
  "Software Engineer (Research)",
  "Research Computing Engineer",
  "Data Scientist",
  "Systems Programmer",
  "Performance Engineer",
  "Research Developer",
  "Postdoctoral Researcher",
  "Cyberinfrastructure Engineer",
  "Research Computing Specialist",
  "Scientific Software Developer",
  "Research Engineer",
];

interface DomainTask {
  domain: string;
  accent: "teal" | "purple";
  task: string;
}

const domainTasks: DomainTask[] = [
  {
    domain: "Genomics",
    accent: "teal",
    task: "Build data pipelines that turn raw sequencing reads into biological insight.",
  },
  {
    domain: "Climate",
    accent: "purple",
    task: "Parallelize simulations across multi-core HPC to model decades of planetary data.",
  },
  {
    domain: "Astrophysics",
    accent: "teal",
    task: "Develop visualization tools that help astronomers explore petabyte-scale telescope archives.",
  },
  {
    domain: "Open science",
    accent: "purple",
    task: "Maintain shared libraries used by hundreds of researchers across institutions.",
  },
  {
    domain: "Reproducibility",
    accent: "teal",
    task: "Teach best practices for testing, packaging, and releasing research code.",
  },
  {
    domain: "National labs",
    accent: "purple",
    task: "Architect HPC applications that scale to the largest supercomputers in the world.",
  },
];

const rseAdditions = [
  "Type hints and runtime validation",
  "Unit tests, integration tests, and CI",
  "Documentation other researchers can actually read",
  "Packaging so the code runs on someone else's system",
  "Performance profiling and optimization",
  "Long-term maintenance after the grant ends",
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Careers",
    title: "Browse Jobs",
    teaser: "Open RSE and RSE-adjacent positions across the US.",
    path: "/jobs",
  },
  {
    eyebrow: "Focus areas",
    title: "Working Groups",
    teaser: "Eleven groups collaborating on specialized topics.",
    path: "/community/working-groups",
  },
  {
    eyebrow: "Connection",
    title: "Community Calls",
    teaser: "Monthly conversations across the network.",
    path: "/community/calls",
  },
  {
    eyebrow: "Learning",
    title: "Learn",
    teaser: "Seminars, tutorials, and references for research software.",
    path: "/resources",
  },
];

function MiniSpectrum({ position }: { position: number }) {
  return (
    <div className="w-full max-w-xs">
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-purple-500 via-teal-500 to-teal-300">
        <div
          className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-neutral-900 shadow-sm"
          style={{
            left: `${position}%`,
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] font-mono text-purple-600">
          Research-focused
        </span>
        <span className="text-[10px] font-mono text-teal-700">
          Engineering-focused
        </span>
      </div>
    </div>
  );
}

export function WhatIsRSEPage() {
  const { ref: personasRef, isInView: personasInView } = useInView(0.05);
  const { ref: titlesRef, isInView: titlesInView } = useInView(0.1);
  const { ref: domainRef, isInView: domainInView } = useInView(0.1);
  const { ref: codeRef, isInView: codeInView } = useInView(0.1);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

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
      {/* ── Core definition — kept as the official anchor ───────────── */}
      <section className="mb-16">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          The definition
        </p>
        <blockquote className="relative mb-8">
          <p className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 leading-[1.2] tracking-tight text-balance max-w-3xl">
            &ldquo;We like an inclusive definition of Research Software
            Engineers to encompass those who regularly use expertise in
            programming to advance research.&rdquo;
          </p>
          <div className="mt-6 w-16 h-0.5 bg-teal-500" />
        </blockquote>
        <p className="text-neutral-600 leading-relaxed max-w-2xl">
          That covers researchers who spend a significant amount of time
          programming, full-time software engineers writing code to solve
          research problems, and everyone in between. The spectrum is real —
          and so are the three people below.
        </p>
      </section>

      {/* ── Three deep persona profiles ─────────────────────────────── */}
      <section ref={personasRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            The spectrum, in three profiles
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Three real shapes of the same job.
        </h2>

        <div className="space-y-14">
          {personas.map((p, i) => (
            <article
              key={p.num}
              className={`pt-10 border-t border-neutral-200 ${
                personasInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {/* Header — mini spectrum right, number+name+role left */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                <div>
                  <p className="font-mono text-xs text-neutral-400 tabular-nums mb-2">
                    {p.num}
                  </p>
                  <h3 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-none mb-2">
                    {p.name}
                  </h3>
                  <p className="text-lg text-neutral-500 font-medium">
                    {p.role}
                  </p>
                </div>
                <MiniSpectrum position={p.position} />
              </div>

              {/* Intro paragraph */}
              <p className="text-lg text-neutral-700 leading-relaxed mb-8 max-w-3xl text-pretty">
                {p.intro}
              </p>

              {/* A day in practice */}
              <div className="mb-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-2">
                  A day in practice
                </p>
                <p className="text-base text-neutral-600 leading-relaxed max-w-3xl">
                  {p.day}
                </p>
              </div>

              {/* Typical week — stacked bar */}
              <div className="mb-8 max-w-xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-2">
                  Typical week
                </p>
                <div className="flex h-2 rounded-full overflow-hidden bg-neutral-100 mb-2.5">
                  {p.mix.map((m, mi) => (
                    <div
                      key={m.label}
                      style={{ width: `${m.value}%` }}
                      className={mixColors[mi]}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  {p.mix.map((m, mi) => (
                    <span
                      key={m.label}
                      className="inline-flex items-center gap-1.5 font-mono"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${mixColors[mi]}`}
                      />
                      <span className="text-neutral-800 font-semibold tabular-nums">
                        {m.value}%
                      </span>
                      <span className="text-neutral-500">{m.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Titles + Tools — two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-3">
                    Common job titles
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.titles.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-3">
                    Tools of the trade
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.tools.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-neutral-900 text-white"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Title alias cloud ───────────────────────────────────────── */}
      <section
        ref={titlesRef}
        className="mb-20 py-14 border-y-2 border-neutral-900 bg-neutral-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className={titlesInView ? "animate-slide-up" : "opacity-0"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-4">
            Recognize yourself?
          </p>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-8 text-balance max-w-3xl">
            You might already hold one of these titles.
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {titleAliases.map((t) => (
              <span
                key={t}
                className="font-mono text-[12px] px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-700"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="text-sm text-neutral-500 max-w-2xl">
            RSE is an inclusive label, not a job-title requirement. If your
            title is here — or it&rsquo;s close — you&rsquo;re in good
            company.
          </p>
        </div>
      </section>

      {/* ── Domain × task pairings ──────────────────────────────────── */}
      <section ref={domainRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What RSEs actually do
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          The work touches every domain.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {domainTasks.map((d, i) => (
            <div
              key={d.domain}
              className={`bg-white py-6 px-6 md:px-7 flex gap-5 items-start ${
                domainInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p
                className={`font-display text-sm font-bold tracking-wider uppercase shrink-0 w-40 pt-1 ${
                  d.accent === "teal" ? "text-teal-700" : "text-purple-600"
                }`}
              >
                {d.domain}
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {d.task}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── RSE work in practice — code + "what RSEs add" ───────────── */}
      <section ref={codeRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Research code vs. RSE code
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          It&rsquo;s not just writing code.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          A simplified example of research software — analyzing decades of
          climate data in parallel. An RSE turns snippets like this into
          something a dozen other labs can actually use.
        </p>

        <div
          className={`grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-8 items-start ${
            codeInView ? "animate-fade-in" : "opacity-0"
          }`}
        >
          {/* Code block */}
          <div className="bg-neutral-950 rounded-xl p-5 lg:p-6 overflow-x-auto shadow-lg">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              <span className="ml-3 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                climate_pipeline.py
              </span>
            </div>
            <pre className="text-sm font-mono leading-relaxed">
              <code>
                <span className="text-teal-300">import</span>{" "}
                <span className="text-neutral-100">xarray</span>{" "}
                <span className="text-teal-300">as</span>{" "}
                <span className="text-neutral-100">xr</span>
                {"\n"}
                <span className="text-teal-300">from</span>{" "}
                <span className="text-neutral-100">dask.distributed</span>{" "}
                <span className="text-teal-300">import</span>{" "}
                <span className="text-neutral-100">Client</span>
                {"\n\n"}
                <span className="text-neutral-500">
                  # Parallelized analysis across 50 years of climate data
                </span>
                {"\n"}
                <span className="text-teal-300">def</span>{" "}
                <span className="text-purple-300">compute_anomalies</span>
                <span className="text-neutral-400">(</span>
                <span className="text-neutral-100">dataset</span>
                <span className="text-neutral-400">:</span>{" "}
                <span className="text-neutral-100">xr.Dataset</span>
                <span className="text-neutral-400">)</span>{" "}
                <span className="text-neutral-400">-&gt;</span>{" "}
                <span className="text-neutral-100">xr.Dataset</span>
                <span className="text-neutral-400">:</span>
                {"\n"}
                <span className="text-neutral-100">{"    "}climatology</span>{" "}
                <span className="text-neutral-400">=</span>{" "}
                <span className="text-neutral-100">dataset.groupby</span>
                <span className="text-neutral-400">(</span>
                <span className="text-success-500">&quot;time.month&quot;</span>
                <span className="text-neutral-400">)</span>
                <span className="text-neutral-100">.mean</span>
                <span className="text-neutral-400">(</span>
                <span className="text-success-500">&quot;time&quot;</span>
                <span className="text-neutral-400">)</span>
                {"\n"}
                <span className="text-neutral-100">{"    "}</span>
                <span className="text-teal-300">return</span>{" "}
                <span className="text-neutral-100">dataset.groupby</span>
                <span className="text-neutral-400">(</span>
                <span className="text-success-500">&quot;time.month&quot;</span>
                <span className="text-neutral-400">)</span>{" "}
                <span className="text-neutral-400">-</span>{" "}
                <span className="text-neutral-100">climatology</span>
              </code>
            </pre>
          </div>

          {/* What an RSE adds */}
          <div className="lg:pt-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-4">
              What an RSE adds
            </p>
            <ul className="space-y-2.5">
              {rseAdditions.map((item, i) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm text-neutral-700 leading-snug"
                >
                  <span
                    className="font-mono text-teal-600 shrink-0 w-6 tabular-nums"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA — sound like you? ───────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Sound like you?
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          If you recognized yourself anywhere on this page, you belong.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Whether you write code for research, manage those who do, or simply
          believe in the mission — membership is free, there&rsquo;s no
          application, and you&rsquo;re one click away.
        </p>

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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>or</span>
            <Link
              to="/jobs"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Browse jobs
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/community/working-groups"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Working groups
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/community/calls"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Community calls
            </Link>
          </div>
        </div>
      </section>

      {/* ── Continue exploring — bridge cards ───────────────────────── */}
      <section ref={bridgeRef} className="mb-4 pt-12 border-t-2 border-neutral-900">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Continue exploring
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-10">
          Where RSEs go next.
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
