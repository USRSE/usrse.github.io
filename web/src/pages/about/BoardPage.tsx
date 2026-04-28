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

export function BoardPage() {
  const { ref: boardRef, isInView: boardVisible } = useInView(0.05);
  const { ref: formerRef, isInView: formerVisible } = useInView(0.1);

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
      {/* ── Overview ────────────────────────────────────────────────── */}
      <p className="text-neutral-600 leading-relaxed mb-4">
        The Board of Directors is elected by the US-RSE membership. Members
        serve staggered terms to ensure organizational continuity, with
        elections held annually near the end of each year.
      </p>
      <p className="text-neutral-600 leading-relaxed mb-14">
        Board responsibilities include setting organizational policy and
        direction, managing day-to-day operations, attending biweekly meetings,
        and representing US-RSE in the broader research community.
      </p>

      {/* ── Current Board — editorial portraits ────────────────────── */}
      <div className="mb-20" ref={boardRef}>
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="text-2xl font-bold text-neutral-900">
            Current Members
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            {currentBoard.length} seats
          </span>
        </div>

        {/* 3-column staggered portrait grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-10">
          {currentBoard.map((member, i) => (
            <div
              key={member.name}
              className={`group ${i % 3 === 1 ? "sm:mt-8" : ""} ${
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
                <span className="absolute bottom-3 right-3 px-2 py-1 text-[10px] font-mono text-white/90 bg-black/30 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {member.term}
                </span>
              </div>
              <h3 className="font-heading text-[15px] font-bold text-neutral-900 leading-tight">
                {member.name}
              </h3>
              <p className="text-[12px] text-neutral-400 mt-0.5 leading-snug">
                {member.org}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Former Members ─────────────────────────────────────────── */}
      <div ref={formerRef}>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-bold text-neutral-900">
            Former Board Members
          </h2>
          <p className="text-xs text-neutral-400">
            With gratitude for their service
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-6">
          {formerBoard.map((member, i) => (
            <div
              key={member.name}
              className={`group ${formerVisible ? "animate-fade-in" : "opacity-0"}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative overflow-hidden rounded-xl mb-2.5 aspect-square bg-neutral-100">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="absolute inset-0 w-full h-full object-cover object-top grayscale-[40%] group-hover:grayscale-0 transition-all duration-500"
                  loading="lazy"
                />
              </div>
              <p className="text-[12px] font-semibold text-neutral-700 leading-tight">
                {member.name}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {member.term}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AboutLayout>
  );
}
