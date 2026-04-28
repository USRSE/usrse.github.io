import { Link } from "react-router-dom";
import { JobsLayout } from "@/components/jobs/JobsLayout";
import { useInView } from "@/hooks/useInView";

interface JobListing {
  title: string;
  org: string;
  location: string;
  date: string;
  url?: string;
}

const orgMemberListings: JobListing[] = [
  {
    title: "Data Systems Software Engineer",
    org: "Lawrence Berkeley National Lab",
    location: "Berkeley, CA",
    date: "Apr 2026",
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
  },
  {
    title: "Scientific Software Developer",
    org: "Simons Foundation",
    location: "New York, NY",
    date: "Mar 2026",
  },
  {
    title: "Research Software Engineer, FAS Informatics",
    org: "Harvard University",
    location: "Cambridge, MA",
    date: "Mar 2026",
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
  },
];

const externalBoards = [
  { name: "Research Software Engineers Job Board", url: "https://research-software.org/jobs" },
  { name: "The Carpentries Job Board", url: "https://carpentries.org/jobs/" },
  { name: "HPC Wire Career Center", url: "https://www.hpcwire.com/jobs/" },
  { name: "Science Gateways Community", url: "https://sciencegateways.org/" },
];

function JobRow({ listing, index, isInView, featured }: { listing: JobListing; index: number; isInView: boolean; featured?: boolean }) {
  return (
    <div
      className={`py-5 border-b border-neutral-100 last:border-0 ${
        isInView ? "animate-slide-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Row 1: title + featured pill */}
      <div className="flex items-center gap-3 mb-1">
        <span className="font-semibold text-neutral-900">{listing.title}</span>
        {featured && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-soft" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-teal-700">
              Featured
            </span>
          </span>
        )}
      </div>
      {/* Row 2: org + location/date */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-4">
        <span className="text-sm text-neutral-500">{listing.org}</span>
        <span className="font-mono text-xs text-neutral-400 shrink-0">
          {listing.location} &middot; {listing.date}
        </span>
      </div>
    </div>
  );
}

export function BrowseJobsPage() {
  const { ref: orgRef, isInView: orgInView } = useInView(0.1);
  const { ref: rseRef, isInView: rseInView } = useInView(0.1);
  const { ref: relatedRef, isInView: relatedInView } = useInView(0.1);
  const { ref: freelanceRef, isInView: freelanceInView } = useInView(0.1);

  return (
    <JobsLayout
      title="Job Board"
      subtitle="RSE positions at universities, national labs, and industry."
      nextPage={{ path: "/jobs/submit", label: "Post a Job", teaser: "Free posting for RSE positions" }}
    >
      {/* ── Opening stat ──────────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-display text-5xl lg:text-6xl font-bold text-neutral-900 leading-none">
          18+
        </p>
        <p className="text-lg text-neutral-500 mt-2">open positions across research institutions</p>
      </section>

      {/* ── Organizational Member Listings ─────────────────────────── */}
      <section className="mb-16" ref={orgRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-1">
          Organizational Member Listings
        </p>
        <p className="text-sm text-neutral-400 mb-6">Priority placement for US-RSE member organizations</p>

        <div>
          {orgMemberListings.map((listing, i) => (
            <JobRow key={listing.title} listing={listing} index={i} isInView={orgInView} featured />
          ))}
        </div>
      </section>

      {/* ── RSE Openings ──────────────────────────────────────────── */}
      <section className="mb-16" ref={rseRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          RSE Openings
        </p>

        <div>
          {rseOpenings.map((listing, i) => (
            <JobRow key={listing.title} listing={listing} index={i} isInView={rseInView} />
          ))}
        </div>

        <p className="text-sm text-neutral-400 mt-4 font-mono">
          + 6 more positions &mdash; full list updated weekly
        </p>
      </section>

      {/* ── Related Openings ──────────────────────────────────────── */}
      <section className="mb-16" ref={relatedRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          Related Openings
        </p>

        <div>
          {relatedOpenings.map((listing, i) => (
            <JobRow key={listing.title} listing={listing} index={i} isInView={relatedInView} />
          ))}
        </div>
      </section>

      {/* ── Freelance ─────────────────────────────────────────────── */}
      <section className="mb-16" ref={freelanceRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          Freelance
        </p>

        <div>
          {freelanceOpenings.map((listing, i) => (
            <JobRow key={listing.title} listing={listing} index={i} isInView={freelanceInView} />
          ))}
        </div>
      </section>

      {/* ── External Boards ───────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          External Job Boards
        </p>

        <div className="border-l-2 border-neutral-200 pl-6 space-y-3">
          {externalBoards.map((board) => (
            <a
              key={board.name}
              href={board.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-neutral-600 hover:text-purple-700 transition-colors"
            >
              {board.name}
              <span className="text-neutral-300 ml-2">&rarr;</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section>
        <hr className="border-neutral-100 mb-10" />
        <p className="text-lg text-neutral-600 mb-4">
          Have a position to fill?
        </p>
        <Link
          to="/jobs/submit"
          className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
        >
          Post a job for free
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>
    </JobsLayout>
  );
}
