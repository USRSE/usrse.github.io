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
  { name: "Jordan Perr-Sauer", org: "National Renewable Energy Laboratory", term: "2019–2021", photo: "/images/board-of-directors/jordan-perr-sauer.jpeg" },
  { name: "Kenton McHenry", org: "University of Illinois Urbana-Champaign", term: "2023–2025", photo: "/images/board-of-directors/kenton-mchenry.jpeg" },
  { name: "Lance Parsons", org: "Princeton University", term: "2019–2022", photo: "/images/board-of-directors/lance-parsons.jpg" },
  { name: "Nicole Brewer", org: "Arizona State University", term: "2023–2025", photo: "/images/board-of-directors/nicole-brewer.jpeg" },
  { name: "Rinku Gupta", org: "Argonne National Laboratory", term: "2022–2025", photo: "/images/board-of-directors/rinku-gupta.jpeg" },
  { name: "Sandra Gesing", org: "University of Illinois Chicago", term: "2019–2024", photo: "/images/board-of-directors/sandra-gesing.jpeg" },
];

function BoardPortrait({ member, index }: { member: BoardMember; index: number }) {
  return (
    <div
      className="group animate-slide-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* Photo — no card, no border, just the image */}
      <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[3/4] bg-neutral-100">
        <img
          src={member.photo}
          alt={member.name}
          className="absolute inset-0 w-full h-full object-cover object-top grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
          loading="lazy"
        />
        {/* Subtle bottom gradient for name legibility */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Term badge — appears on hover */}
        <span className="absolute bottom-3 right-3 px-2 py-1 text-[10px] font-mono text-white/90 bg-black/30 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {member.term}
        </span>
      </div>

      {/* Name + org — tight editorial typography */}
      <h3 className="font-heading text-[15px] font-bold text-neutral-900 leading-tight">
        {member.name}
      </h3>
      <p className="text-[12px] text-neutral-400 mt-0.5 leading-snug">
        {member.org}
      </p>
    </div>
  );
}

export function GovernancePage() {
  const { ref: boardRef, isInView: boardVisible } = useInView(0.05);
  const { ref: formerRef, isInView: formerVisible } = useInView(0.1);

  return (
    <AboutLayout
      title="Governance"
      subtitle="How US-RSE is organized, led, and sustained as a community."
      prevPage={{ path: "/about/dei", label: "DEI Statement" }}
      nextPage={null}
    >
      {/* Overview */}
      <div className="mb-14">
        <p className="text-neutral-600 leading-relaxed mb-4">
          US-RSE is governed by an elected Board of Directors that sets the
          strategic direction of the organization, manages community resources,
          and represents the interests of the membership. The organization
          operates as a fiscally sponsored project of Community Initiatives, a
          501(c)(3) nonprofit organization.
        </p>
        <p className="text-neutral-600 leading-relaxed">
          All governance documents are publicly accessible and open to
          community contribution through our GitHub repository. Transparency is
          a core value — board meeting minutes are published regularly.
        </p>
      </div>

      {/* ── Board of Directors ─────────────────────────────────────── */}
      <div className="mb-20" ref={boardRef}>
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Board of Directors
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              {currentBoard.length} elected members serving staggered terms
            </p>
          </div>
          <span className="hidden sm:block text-xs font-mono text-neutral-300">
            {currentBoard.length} members
          </span>
        </div>

        {/* Portrait grid — 3 columns with staggered vertical offsets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-8">
          {currentBoard.map((member, i) => (
            <div
              key={member.name}
              className={i % 3 === 1 ? "sm:mt-8" : ""}
            >
              {boardVisible && (
                <BoardPortrait member={member} index={i} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Former Board Members ───────────────────────────────────── */}
      <div className="mb-14" ref={formerRef}>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Former Board Members
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              With gratitude for their service and leadership
            </p>
          </div>
        </div>

        {/* Compact horizontal strip — smaller photos, denser layout */}
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

      {/* ── Organizational Structure ───────────────────────────────── */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Organizational Structure
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: "Board of Directors",
              description:
                "Elected leadership body that governs the organization and makes strategic decisions.",
              accent: "purple",
            },
            {
              title: "Staff",
              description:
                "Dedicated team members who support the day-to-day operations of the community.",
              accent: "teal",
            },
            {
              title: "Working Groups",
              description:
                "11 active community-led teams focused on specific areas like code review, DEI, mentorship, and more.",
              accent: "teal",
            },
            {
              title: "Affinity Groups",
              description:
                "Spaces for members who share identities or experiences to connect and support each other.",
              accent: "purple",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-xl border border-neutral-100 bg-neutral-50/50"
            >
              <div
                className={`w-2 h-2 rounded-full mb-3 ${
                  item.accent === "purple" ? "bg-purple-500" : "bg-teal-500"
                }`}
              />
              <h3 className="font-bold text-neutral-900 text-sm mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Elections */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Elections
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-4">
          Board members are elected by the US-RSE membership. Elections are held
          annually, with members serving staggered terms to ensure organizational
          continuity. Any US-RSE member in good standing may run for a position
          on the Board of Directors.
        </p>
        <p className="text-neutral-600 leading-relaxed">
          The election process, including timelines, eligibility requirements,
          and procedures, is documented in the governance repository and
          announced to all members via the newsletter.
        </p>
      </div>

      {/* Fiscal sponsorship */}
      <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-100">
        <h3 className="font-bold text-neutral-900 mb-2">
          Fiscal Sponsorship
        </h3>
        <p className="text-sm text-neutral-600 leading-relaxed">
          US-RSE is a fiscally sponsored project of Community Initiatives, a
          501(c)(3) nonprofit organization. This structure provides the
          organizational and financial framework needed to accept donations,
          manage funds, and operate as a recognized nonprofit entity without
          requiring independent incorporation.
        </p>
      </div>
    </AboutLayout>
  );
}
