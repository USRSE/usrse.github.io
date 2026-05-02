import { Link } from "react-router-dom";
import { JobsLayout } from "@/components/jobs/JobsLayout";
import { useInView } from "@/hooks/useInView";

interface JobListing {
  title: string;
  org: string;
  location: string;
  date: string;
  url?: string;
  fresh?: "new" | "recent";
}

const orgMemberListings: JobListing[] = [
  {
    title: "Data Systems Software Engineer",
    org: "Lawrence Berkeley National Lab",
    location: "Berkeley, CA",
    date: "Apr 2026",
    fresh: "new",
  },
  {
    title: "Research Software Engineering II",
    org: "Princeton Language and Intelligence Initiative",
    location: "Princeton, NJ",
    date: "Jan 2026",
  },
];

const rseOpenings: JobListing[] = [
  {
    title: "Research Software Engineer",
    org: "Oak Ridge National Laboratory",
    location: "Oak Ridge, TN",
    date: "Apr 2026",
    fresh: "new",
  },
  {
    title: "Scientific Software Developer",
    org: "Simons Foundation",
    location: "New York, NY",
    date: "Mar 2026",
    fresh: "recent",
  },
  {
    title: "Research Software Engineer, FAS Informatics",
    org: "Harvard University",
    location: "Cambridge, MA",
    date: "Mar 2026",
    fresh: "recent",
  },
  {
    title: "Software Engineer for Research Computing",
    org: "Carnegie Mellon University",
    location: "Pittsburgh, PA",
    date: "Feb 2026",
  },
  {
    title: "Research Software Engineer",
    org: "University of Illinois Urbana-Champaign",
    location: "Urbana, IL",
    date: "Feb 2026",
  },
  {
    title: "Senior Research Software Engineer",
    org: "Stanford University",
    location: "Stanford, CA",
    date: "Jan 2026",
  },
];

const relatedOpenings: JobListing[] = [
  {
    title: "Research Advocate",
    org: "Redivis",
    location: "Remote",
    date: "Mar 2026",
    fresh: "recent",
  },
  {
    title: "Data Engineer",
    org: "Library of Virginia",
    location: "Richmond, VA",
    date: "Feb 2026",
  },
  {
    title: "HPC Systems Administrator",
    org: "National Center for Atmospheric Research",
    location: "Boulder, CO",
    date: "Jan 2026",
  },
];

const freelanceOpenings: JobListing[] = [
  {
    title: "Python Research Software Consultant",
    org: "Texas Southern University",
    location: "Remote",
    date: "Mar 2026",
    fresh: "recent",
  },
];

interface ExternalBoard {
  name: string;
  url: string;
  desc: string;
}

const externalBoards: ExternalBoard[] = [
  {
    name: "Research Software Engineers Job Board",
    url: "https://research-software.org/jobs",
    desc: "Global RSE positions from the international community.",
  },
  {
    name: "The Carpentries Job Board",
    url: "https://carpentries.org/jobs/",
    desc: "Teaching and instructional roles in research computing.",
  },
  {
    name: "HPC Wire Career Center",
    url: "https://www.hpcwire.com/jobs/",
    desc: "High-performance computing and supercomputing positions.",
  },
  {
    name: "Science Gateways Community",
    url: "https://sciencegateways.org/",
    desc: "Roles building science gateways and research portals.",
  },
];

interface Fact {
  value: string;
  label: string;
}

const totalCount =
  orgMemberListings.length +
  rseOpenings.length +
  relatedOpenings.length +
  freelanceOpenings.length;

const keyFacts: Fact[] = [
  { value: `${totalCount}+`, label: "Open positions" },
  { value: "12", label: "Institutions" },
  { value: "Weekly", label: "Updated" },
  { value: "Free", label: "To post" },
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Hiring",
    title: "Post a Job",
    teaser: "Get your RSE opening in front of the right people. Free.",
    path: "/jobs/submit",
  },
  {
    eyebrow: "Give back",
    title: "Volunteer",
    teaser: "Help review proposals, run programs, and support the community.",
    path: "/jobs/volunteer",
  },
  {
    eyebrow: "Connect",
    title: "Community Calls",
    teaser: "Where many RSEs first hear about openings — and meet hiring managers.",
    path: "/community/calls",
  },
  {
    eyebrow: "Belonging",
    title: "Affinity Groups",
    teaser: "Communities within the community for support and growth.",
    path: "/community/affinity-groups",
  },
];

function freshChip(fresh?: "new" | "recent") {
  if (fresh === "new") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 rounded-full border border-teal-100 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-soft" />
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-teal-700">
          New
        </span>
      </span>
    );
  }
  if (fresh === "recent") {
    return (
      <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-neutral-400 shrink-0">
        Recent
      </span>
    );
  }
  return null;
}

function JobRow({
  listing,
  index,
  isInView,
  featured,
}: {
  listing: JobListing;
  index: number;
  isInView: boolean;
  featured?: boolean;
}) {
  const idx = String(index + 1).padStart(3, "0");
  return (
    <a
      href={listing.url ?? "#"}
      className={`group block py-5 border-b border-neutral-100 last:border-0 transition-colors hover:bg-neutral-50/60 -mx-3 px-3 rounded-md ${
        isInView ? "animate-slide-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Index number */}
        <span
          className={`font-mono text-[10px] tabular-nums tracking-tight pt-1.5 shrink-0 w-9 ${
            featured
              ? "text-teal-600"
              : "text-neutral-300 group-hover:text-neutral-400"
          }`}
        >
          {idx}
        </span>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Row 1: title + freshness + arrow */}
          <div className="flex items-start gap-3 mb-1">
            <h3 className="font-display text-base lg:text-lg font-bold text-neutral-900 group-hover:text-teal-700 transition-colors leading-snug tracking-tight flex-1 min-w-0">
              {listing.title}
            </h3>
            {featured ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 rounded-full border border-teal-100 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-soft" />
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-teal-700">
                  Featured
                </span>
              </span>
            ) : (
              freshChip(listing.fresh)
            )}
          </div>
          {/* Row 2: org + location/date */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-4">
            <span className="text-sm text-neutral-500 truncate">
              {listing.org}
            </span>
            <span className="font-mono text-[11px] text-neutral-400 shrink-0 tabular-nums">
              {listing.location} &middot; {listing.date}
            </span>
          </div>
        </div>

        {/* Hover arrow */}
        <svg
          className="w-4 h-4 text-neutral-300 group-hover:text-teal-600 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0 mt-1.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </a>
  );
}

export function BrowseJobsPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: orgRef, isInView: orgInView } = useInView(0.1);
  const { ref: rseRef, isInView: rseInView } = useInView(0.05);
  const { ref: relatedRef, isInView: relatedInView } = useInView(0.1);
  const { ref: freelanceRef, isInView: freelanceInView } = useInView(0.1);
  const { ref: externalRef, isInView: externalInView } = useInView(0.1);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <JobsLayout
      title="Job Board"
      subtitle="RSE positions at universities, national labs, and industry."
      nextPage={{
        path: "/jobs/submit",
        label: "Post a Job",
        teaser: "Free posting for RSE positions",
      }}
    >
      {/* ── The stance — RSEs are in demand ──────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          The market for research software engineers
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-10 text-balance max-w-4xl">
          Research institutions are hiring &mdash;{" "}
          <span className="text-teal-700">and they&rsquo;re looking for you.</span>
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          A curated, weekly-updated list of RSE openings at universities,
          national labs, foundations, and adjacent organizations. No filters
          to fight, no algorithms to game &mdash; just the jobs.
        </p>
      </section>

      {/* ── At a glance — 4-column facts strip ───────────────────── */}
      <section
        ref={factsRef}
        className={`mb-20 py-8 border-y border-neutral-200 grid grid-cols-2 md:grid-cols-4 ${
          factsInView ? "animate-fade-in" : "opacity-0"
        }`}
      >
        {keyFacts.map((f, i) => (
          <div
            key={f.label}
            className={`py-3 px-4 md:px-6 ${
              i > 0 ? "md:border-l md:border-neutral-200" : ""
            } ${i % 2 !== 0 ? "border-l border-neutral-200 md:border-l" : ""} ${
              i >= 2 ? "border-t border-neutral-200 md:border-t-0" : ""
            }`}
          >
            <p className="font-display text-xl lg:text-2xl font-bold text-teal-700 tracking-tight leading-none tabular-nums">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2.5">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── Org Member Listings — featured tier ──────────────────── */}
      <section ref={orgRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700">
            Organizational members
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {String(orgMemberListings.length).padStart(2, "0")} featured
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-3">
          Priority placement.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Listings from US-RSE organizational members. These positions support
          the community that brings you this board.
        </p>

        {/* Featured listings — surrounded by teal accent rail */}
        <div className="relative pl-6 border-l-2 border-teal-500">
          {orgMemberListings.map((listing, i) => (
            <JobRow
              key={listing.title}
              listing={listing}
              index={i}
              isInView={orgInView}
              featured
            />
          ))}
        </div>
      </section>

      {/* ── RSE Openings — main list ─────────────────────────────── */}
      <section ref={rseRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            RSE openings
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {String(rseOpenings.length + 6).padStart(2, "0")} positions
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-3">
          Currently hiring.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Direct RSE roles, sorted by posting date. Click any title to view
          the full posting at the institution.
        </p>

        <div>
          {rseOpenings.map((listing, i) => (
            <JobRow
              key={listing.title}
              listing={listing}
              index={i}
              isInView={rseInView}
            />
          ))}
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 mt-6 flex items-center gap-2">
          <span className="inline-block w-6 h-px bg-neutral-300" aria-hidden="true" />
          + 6 more positions &middot; updated weekly
        </p>
      </section>

      {/* ── Related + Freelance — two-column on lg ───────────────── */}
      <section className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10">
        {/* Related */}
        <div ref={relatedRef}>
          <div className="flex items-baseline gap-3 mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
              Related
            </p>
            <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
            <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
              {String(relatedOpenings.length).padStart(2, "0")}
            </span>
          </div>
          <h2 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight mb-2">
            Adjacent roles.
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-6 max-w-md">
            Data engineering, HPC admin, research advocacy &mdash; positions
            many RSEs grow into or out of.
          </p>
          <div>
            {relatedOpenings.map((listing, i) => (
              <JobRow
                key={listing.title}
                listing={listing}
                index={i}
                isInView={relatedInView}
              />
            ))}
          </div>
        </div>

        {/* Freelance */}
        <div ref={freelanceRef}>
          <div className="flex items-baseline gap-3 mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
              Freelance
            </p>
            <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
            <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
              {String(freelanceOpenings.length).padStart(2, "0")}
            </span>
          </div>
          <h2 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight mb-2">
            Contract work.
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-6 max-w-md">
            Short-term, project-based, or consulting engagements &mdash; for
            independent RSEs.
          </p>
          <div>
            {freelanceOpenings.map((listing, i) => (
              <JobRow
                key={listing.title}
                listing={listing}
                index={i}
                isInView={freelanceInView}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── External boards — pillar cards ───────────────────────── */}
      <section ref={externalRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Beyond US-RSE
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {String(externalBoards.length).padStart(2, "0")} boards
          </span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-3">
          Where else to look.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Other curated boards in adjacent communities. Cross-posting is
          common &mdash; the same role often appears in multiple places.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {externalBoards.map((board, i) => {
            const accent = i % 2 === 0 ? "border-teal-500" : "border-purple-500";
            const titleHover =
              i % 2 === 0 ? "group-hover:text-teal-700" : "group-hover:text-purple-700";
            const arrowHover =
              i % 2 === 0 ? "group-hover:text-teal-600" : "group-hover:text-purple-600";
            return (
              <a
                key={board.name}
                href={board.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group bg-white pt-7 pb-8 px-6 md:px-7 border-t-2 ${accent} hover:bg-neutral-50/60 transition-colors ${
                  externalInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3
                    className={`font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight leading-snug transition-colors ${titleHover}`}
                  >
                    {board.name}
                  </h3>
                  <svg
                    className={`w-4 h-4 text-neutral-300 transition-all shrink-0 mt-1 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${arrowHover}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">
                  {board.desc}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-4 truncate">
                  {board.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      {/* ── CTA — post a job ─────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Hiring an RSE?
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Post your opening on this board. Free.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Reach the largest organized network of RSEs in the United States.
          Listings from organizational members get priority placement.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <Link
            to="/jobs/submit"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Post a job
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
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>or</span>
            <a
              href="mailto:info@us-rse.org?subject=Org%20Membership"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Become a member org
            </a>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/about/sponsors"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Sponsor US-RSE
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
          More than a job board.
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
    </JobsLayout>
  );
}
