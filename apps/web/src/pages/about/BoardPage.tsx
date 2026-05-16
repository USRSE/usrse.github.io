import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

interface BoardMember {
  name: string;
  org: string;
  term: string;
  photo: string;
  /** Optional public-profile slug. When set, the photo card becomes a
   *  Link to `/members/{slug}`. Current board photos are hosted in the
   *  profile-photos R2 bucket and authored from each member's profile;
   *  former-board photos remain static for now. */
  slug?: string;
}

// Current-board photos are sourced from the profile-photos R2 bucket —
// the same store backing /members/{slug} dossiers. Updating a member's
// photo in admin automatically refreshes their profile page; this page
// hardcodes the URL at the time of migration and is updated alongside.
const currentBoard: BoardMember[] = [
  { name: "Keith Beattie", org: "Lawrence Berkeley National Laboratory", term: "2024–2026", slug: "keith-beattie-pej0h8fh", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/1332e320-e637-4ba5-8d4d-47a4a83c4e54/1778904171616-8vpgu9.jpg" },
  { name: "Jeffrey C. Carver", org: "University of Alabama", term: "2019–2027", slug: "jeffrey-c-carver-00w5xrc8", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/10135eb0-d866-4845-9878-a70bfc132a68/1778904172151-zxrfa2.jpg" },
  { name: "Cordero Core", org: "University of Washington", term: "2025–2026", slug: "cordero-core-fcmt2v08", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/aba5daa5-5d93-4673-8b4c-d5ddbe0a0de7/1778904172284-py4lxo.jpg" },
  { name: "Ian Cosden", org: "Princeton University", term: "2019–2027", slug: "ian-cosden-r3f0w3k9", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/c00419dc-b196-48f7-9b03-6b8decf71381/1778904172520-rb2wi1.jpg" },
  { name: "Julia Damerow", org: "Arizona State University", term: "2021–2026", slug: "julia-damerow-r9nqn1nd", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/ef7a3c90-879d-49c1-8994-e0e0f66649b4/1778904172652-wotq44.jpg" },
  { name: "Alex Koufos", org: "Stanford University", term: "2024–2027", slug: "alex-koufos-edc92atf", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/f153d816-9908-4e97-89ab-eaf26a2d10c3/1778904172804-to79ey.jpg" },
  { name: "Miranda Mundt", org: "Sandia National Laboratories", term: "2023–2026", slug: "miranda-mundt-y2z8165z", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/b8708764-24e7-4d73-a333-a0097c9d3c24/1778904172936-h8gv7h.jpg" },
  { name: "Abbey Roelofs", org: "University of Michigan", term: "2024–2027", slug: "abbey-roelofs-4zevzbzb", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/7fc87391-8c53-4c1b-8e3c-820df9e26398/1778904173088-bo8491.jpg" },
  { name: "Pengyin Shan", org: "University of Illinois Urbana-Champaign", term: "2026–2027", slug: "pengyin-shan-ass52449", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/500a9e77-8d1d-4bdf-b8c2-35581ff5837d/1778904173222-4rlvnf.png" },
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
  // Sandra appears in formerBoard AND as the active ED on StaffPage.
  // Her photo was migrated to R2 alongside the current-board photos;
  // both surfaces share the same R2 URL + link to her public profile.
  { name: "Sandra Gesing", org: "University of Illinois Chicago", term: "2019–2024", slug: "sandra-gesing-y496vr20", photo: "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev/profiles/5b56c6ca-3caf-4340-b27d-e6c903f3c2d5/1778904173372-qt6ddw.jpg" },
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
            <BoardCard
              key={member.name}
              member={member}
              index={i}
              variant="current"
              animate={boardVisible}
            />
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
            <BoardCard
              key={member.name}
              member={member}
              index={i}
              variant="former"
              animate={formerVisible}
            />
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

/**
 * One member tile, used in both the current-board grid (3-col, taller
 * 3/4 portrait) and the former-board grid (up-to-5-col, square).
 * Renders as a <Link> to /members/{slug} when the member has a public
 * profile, otherwise a plain <div>. The link wraps the WHOLE tile so
 * the click target is the full card (photo + name + org + term),
 * matching the way the BoD page already reads as a "directory of
 * faces."
 */
function BoardCard({
  member,
  index,
  variant,
  animate,
}: {
  member: BoardMember;
  index: number;
  variant: "current" | "former";
  animate: boolean;
}) {
  const isCurrent = variant === "current";
  const wrapperClass = isCurrent
    ? `group block ${index % 3 === 1 ? "sm:mt-10" : ""} ${
        animate ? "animate-slide-up" : "opacity-0"
      }`
    : `group block ${animate ? "animate-fade-in" : "opacity-0"}`;
  const wrapperStyle = isCurrent
    ? { animationDelay: `${index * 70}ms` }
    : { animationDelay: `${Math.min(index * 40, 400)}ms` };

  const photoBox = isCurrent ? (
    <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[3/4] bg-neutral-100">
      <img
        src={member.photo}
        alt={member.name}
        className="absolute inset-0 w-full h-full object-cover object-top grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
        loading="lazy"
      />
    </div>
  ) : (
    <div className="relative overflow-hidden rounded-xl mb-3 aspect-square bg-neutral-100">
      <img
        src={member.photo}
        alt={member.name}
        className="absolute inset-0 w-full h-full object-cover object-top grayscale-[45%] group-hover:grayscale-0 transition-all duration-500"
        loading="lazy"
      />
    </div>
  );

  const meta = isCurrent ? (
    <>
      <h3 className="font-heading text-[15px] font-bold text-neutral-900 leading-tight group-hover:text-purple-700 transition-colors">
        {member.name}
      </h3>
      <p className="text-[12px] text-neutral-500 mt-1 leading-snug">{member.org}</p>
      <p className="font-mono text-[11px] text-purple-600 mt-1.5 tabular-nums">
        {member.term}
      </p>
    </>
  ) : (
    <>
      <p className="text-[13px] font-semibold text-neutral-800 leading-tight group-hover:text-purple-700 transition-colors">
        {member.name}
      </p>
      <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{member.org}</p>
      <p className="font-mono text-[10px] text-neutral-400 mt-1 tabular-nums">
        {member.term}
      </p>
    </>
  );

  // Slug present → public profile exists → entire tile is a Link.
  if (member.slug) {
    return (
      <Link
        to={`/members/${member.slug}`}
        className={wrapperClass}
        style={wrapperStyle}
        aria-label={`${member.name} — view profile`}
      >
        {photoBox}
        {meta}
      </Link>
    );
  }
  return (
    <div className={wrapperClass} style={wrapperStyle}>
      {photoBox}
      {meta}
    </div>
  );
}
