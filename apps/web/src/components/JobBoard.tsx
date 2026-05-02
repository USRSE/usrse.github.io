import { Link } from "react-router-dom";
import { useInView } from "@/hooks/useInView";

const featuredJobs = [
  {
    title: "Research Software Engineer",
    org: "Stanford University",
    location: "Stanford, CA",
    type: "Full-time",
    posted: "2 days ago",
  },
  {
    title: "Senior RSE — Climate Modeling",
    org: "NCAR",
    location: "Boulder, CO (Hybrid)",
    type: "Full-time",
    posted: "5 days ago",
  },
  {
    title: "Scientific Software Developer",
    org: "Oak Ridge National Lab",
    location: "Oak Ridge, TN",
    type: "Full-time",
    posted: "1 week ago",
  },
  {
    title: "RSE Team Lead",
    org: "MIT Lincoln Lab",
    location: "Lexington, MA",
    type: "Full-time",
    posted: "1 week ago",
  },
];

export function JobBoard() {
  const { ref, isInView } = useInView(0.1);

  return (
    <section className="py-24 lg:py-32 bg-neutral-50 border-t border-neutral-100" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 mb-3">
              Job Board
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-3 text-balance">
              Find your next RSE role
            </h2>
            <p className="text-neutral-500 text-lg max-w-xl">
              Positions at universities, national labs, and industry — all
              looking for research software expertise.
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors shadow-sm"
          >
            Browse all positions
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Job listing */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden divide-y divide-neutral-100">
          {featuredJobs.map((job, i) => (
            <a
              key={job.title}
              href={`#job-${i}`}
              className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 hover:bg-teal-50/50 transition-colors ${
                isInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Org avatar */}
              <div className="w-11 h-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600 shrink-0">
                {job.org
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 group-hover:text-teal-700 transition-colors truncate">
                  {job.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                  <span>{job.org}</span>
                  <span className="text-neutral-300">|</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {job.location}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-md">
                  {job.type}
                </span>
                <span className="text-xs text-neutral-400 hidden sm:inline">
                  {job.posted}
                </span>
                <svg className="w-4 h-4 text-neutral-300 group-hover:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* Post a job CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-400">
            Hiring RSEs?{" "}
            <Link to="/jobs/submit" className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
              Post a position for free
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
