import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

interface BoardMember {
  name: string;
  org: string;
  term: string;
  photo: string;
}

const currentBoard: BoardMember[] = [
  { name: "Keith Beattie", org: "Lawrence Berkeley National Laboratory", term: "2024–2026", photo: "/images/board-of-directors/keith-beattie.jpeg" },
  { name: "Jeffrey C. Carver", org: "University of Alabama", term: "2019–2027", photo: "/images/board-of-directors/jeff-carver.jpeg" },
  { name: "Cordero Core", org: "University of Washington", term: "2025–2026", photo: "/images/board-of-directors/cordero-core.jpeg" },
  { name: "Ian Cosden", org: "Princeton University", term: "2019–2027", photo: "/images/board-of-directors/ian-cosden.jpeg" },
  { name: "Julia Damerow", org: "Arizona State University", term: "2021–2026", photo: "/images/board-of-directors/julia-damerow.jpeg" },
  { name: "Alex Koufos", org: "Stanford University", term: "2024–2027", photo: "/images/board-of-directors/alex-koufos.jpeg" },
  { name: "Miranda Mundt", org: "Sandia National Laboratories", term: "2023–2026", photo: "/images/board-of-directors/miranda-mundt.jpeg" },
  { name: "Abbey Roelofs", org: "University of Michigan", term: "2024–2027", photo: "/images/board-of-directors/abbey-roelofs.jpeg" },
  { name: "Pengyin Shan", org: "University of Illinois Urbana-Champaign", term: "2026–2027", photo: "/images/board-of-directors/pengyin-shan.png" },
];

const formerBoard: BoardMember[] = [
  { name: "Charles Ferenbaugh", org: "Los Alamos National Laboratory", term: "2021–2024", photo: "/images/board-of-directors/charles-ferenbaugh.jpeg" },
  { name: "Chris Hill", org: "MIT", term: "2019–2022", photo: "/images/board-of-directors/chris-hill.jpeg" },
  { name: "Christina Maimone", org: "Northwestern University", term: "2019–2023", photo: "/images/board-of-directors/christina-maimone.jpeg" },
  { name: "Daniel S. Katz", org: "University of Illinois Urbana-Champaign", term: "2019–2023", photo: "/images/board-of-directors/daniel-katz.jpeg" },
  { name: "Jordan Perr-Sauer", org: "National Renewable Energy Laboratory", term: "2019–2021", photo: "/images/board-of-directors/jordan-perr-sauer.png" },
  { name: "Kenton McHenry", org: "University of Illinois Urbana-Champaign", term: "2023–2025", photo: "/images/board-of-directors/kenton-mchenry.jpeg" },
  { name: "Lance Parsons", org: "Princeton University", term: "2019–2022", photo: "/images/board-of-directors/lance-parsons.jpg" },
  { name: "Nicole Brewer", org: "Arizona State University", term: "2023–2025", photo: "/images/board-of-directors/nicole-brewer.jpeg" },
  { name: "Rinku Gupta", org: "Argonne National Laboratory", term: "2022–2025", photo: "/images/board-of-directors/rinku-gupta.jpeg" },
  { name: "Sandra Gesing", org: "University of Illinois Chicago", term: "2019–2024", photo: "/images/board-of-directors/sandra-gesing.jpeg" },
];

interface Fact {
  value: string;
  label: string;
}

const facts: Fact[] = [
  { value: "9", label: "Seats" },
  { value: "Annual", label: "Elections" },
  { value: "Biweekly", label: "Meetings" },
  { value: "Staggered", label: "Terms" },
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Team",
    title: "Our Staff",
    teaser: "The full-time humans running day-to-day operations.",
    path: "/about/staff",
  },
  {
    eyebrow: "Finances",
    title: "Financial Status",
    teaser: "Where the money comes from and where it goes.",
    path: "/about/financial-status",
  },
  {
    eyebrow: "Standards",
    title: "Code of Conduct",
    teaser: "The rules we hold ourselves and each other to.",
    path: "/about/code-of-conduct",
  },
  {
    eyebrow: "Support",
    title: "Sponsors",
    teaser: "The funders and partners who make this possible.",
    path: "/about/sponsors",
  },
];

export function BoardPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: boardRef, isInView: boardVisible } = useInView(0.05);
  const { ref: formerRef, isInView: formerVisible } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <AboutLayout
      title="Board of Directors"
      subtitle="The elected leaders who set the strategic direction for US-RSE."
      prevPage={{ path: "/about/governance", label: "Governance" }}
      nextPage={{
        path: "/about/elections",
        label: "Elections",
        teaser: "How board members are elected",
      }}
    >
      {/* ── The stance — manifesto + framing ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          Who you elected
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          Nine people. Elected by members. Steering what you build.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          The Board of Directors sets organizational policy and direction,
          manages operations, and represents the interests of the membership
          in the broader research community.
        </p>
      </section>

      {/* ── At a glance — 4-column facts strip ───────────────────── */}
      <section
        ref={factsRef}
        className={`mb-20 py-8 border-y border-neutral-200 grid grid-cols-2 md:grid-cols-4 ${
          factsInView ? "animate-fade-in" : "opacity-0"
        }`}
      >
        {facts.map((f, i) => (
          <div
            key={f.label}
            className={`py-3 px-5 md:px-7 ${
              i > 0 ? "md:border-l md:border-neutral-200" : ""
            } ${
              i % 2 !== 0 ? "border-l border-neutral-200 md:border-l" : ""
            }`}
          >
            <p className="font-display text-3xl lg:text-4xl font-bold text-purple-600 tracking-tight leading-none">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── Current members — refined portrait grid ──────────────── */}
      <section className="mb-24" ref={boardRef}>
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Current members
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {currentBoard.length.toString().padStart(2, "0")} seats
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          The current board.
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-12">
          {currentBoard.map((member, i) => (
            <div
              key={member.name}
              className={`group ${i % 3 === 1 ? "sm:mt-10" : ""} ${
                boardVisible ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[3/4] bg-neutral-100">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="absolute inset-0 w-full h-full object-cover object-top grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
                  loading="lazy"
                />
              </div>
              <h3 className="font-heading text-[15px] font-bold text-neutral-900 leading-tight">
                {member.name}
              </h3>
              <p className="text-[12px] text-neutral-500 mt-1 leading-snug">
                {member.org}
              </p>
              <p className="font-mono text-[11px] text-purple-600 mt-1.5 tabular-nums">
                {member.term}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stewards who came before ─────────────────────────────── */}
      <section className="mb-24" ref={formerRef}>
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Stewards who came before
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {formerBoard.length.toString().padStart(2, "0")} alumni
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          Former members.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          The people whose service built the foundations of the organization —
          with lasting gratitude for their time in these seats.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
          {formerBoard.map((member, i) => (
            <div
              key={member.name}
              className={`group ${
                formerVisible ? "animate-fade-in" : "opacity-0"
              }`}
              style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
            >
              <div className="relative overflow-hidden rounded-xl mb-3 aspect-square bg-neutral-100">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="absolute inset-0 w-full h-full object-cover object-top grayscale-[45%] group-hover:grayscale-0 transition-all duration-500"
                  loading="lazy"
                />
              </div>
              <p className="text-[13px] font-semibold text-neutral-800 leading-tight">
                {member.name}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                {member.org}
              </p>
              <p className="font-mono text-[10px] text-neutral-400 mt-1 tabular-nums">
                {member.term}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Have a voice — CTA + inline exit ramps ───────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-4">
          Have a voice
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Talk to the people representing you.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          The Board reads member mail. Questions, concerns, nominations, and
          policy proposals all land in the same inbox — and get a response.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="mailto:info@us-rse.org?subject=Board%20question"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Email the board
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
              to="/about/elections"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Next election
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/about/governance"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Governance
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/about/staff"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Meet the staff
            </Link>
          </div>
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
          The rest of what keeps this running.
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
                <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1 group-hover:text-purple-700 transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-neutral-500">{b.teaser}</p>
              </div>
              <svg
                className="w-5 h-5 text-neutral-400 group-hover:text-purple-700 transition-all group-hover:translate-x-1 shrink-0"
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
