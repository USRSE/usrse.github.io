import { Link, useLocation } from "react-router-dom";

const aboutPages = [
  { path: "/about/mission", label: "Mission", shortLabel: "Mission" },
  { path: "/about/what-is-an-rse", label: "What is an RSE?", shortLabel: "RSE" },
  { path: "/about/dei", label: "DEI Statement", shortLabel: "DEI" },
  { path: "/about/governance", label: "Governance", shortLabel: "Gov" },
  { path: "/about/board", label: "Board of Directors", shortLabel: "Board" },
  { path: "/about/elections", label: "Elections", shortLabel: "Vote" },
  { path: "/about/code-of-conduct", label: "Code of Conduct", shortLabel: "CoC" },
  { path: "/about/sponsors", label: "Sponsors", shortLabel: "Spon" },
  { path: "/about/staff", label: "Staff", shortLabel: "Staff" },
  { path: "/about/financial-status", label: "Financial Status", shortLabel: "Finance" },
];

interface AboutLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Index (0-3) of the next page in the journey, or null for last page */
  nextPage?: { path: string; label: string; teaser: string } | null;
  /** Index (0-3) of the previous page */
  prevPage?: { path: string; label: string } | null;
}

export function AboutLayout({
  title,
  subtitle,
  children,
  nextPage,
  prevPage,
}: AboutLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white">
      {/* Page hero banner — compact, not full-screen */}
      <div className="bg-gradient-to-br from-purple-950 via-purple-800 to-purple-600 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 animate-fade-in"
          >
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li className="text-white/30">/</li>
              <li>
                <span className="text-white/50">About</span>
              </li>
              <li className="text-white/30">/</li>
              <li>
                <span className="text-white/90 font-medium">{title}</span>
              </li>
            </ol>
          </nav>

          <h1
            className="font-display text-4xl lg:text-5xl font-bold text-white tracking-tight animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-4 text-lg text-white/60 max-w-2xl leading-relaxed animate-slide-up"
              style={{ animationDelay: "200ms" }}
            >
              {subtitle}
            </p>
          )}

          {/* Journey progress dots */}
          <div
            className="flex items-center gap-2 mt-8 animate-slide-up"
            style={{ animationDelay: "300ms" }}
          >
            {aboutPages.map((page) => {
              const isCurrent = location.pathname === page.path;
              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isCurrent
                      ? "bg-white/20 text-white border border-white/30"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }`}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCurrent ? "bg-teal-300" : "bg-white/30"
                    }`}
                  />
                  <span className="hidden sm:inline">{page.label}</span>
                  <span className="sm:hidden">{page.shortLabel}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Sidebar nav — desktop only */}
          <aside className="hidden lg:block w-48 shrink-0">
            <nav className="sticky top-24" aria-label="About pages">
              <ul className="space-y-0">
                {aboutPages.map((page, i) => {
                  const isCurrent = location.pathname === page.path;
                  return (
                    <li key={page.path}>
                      <Link
                        to={page.path}
                        className={`group flex items-baseline gap-3 py-2.5 text-[13px] transition-colors ${
                          isCurrent
                            ? "text-neutral-900 font-semibold"
                            : "text-neutral-400 hover:text-neutral-700"
                        }`}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        <span className={`font-mono text-[10px] tabular-nums ${
                          isCurrent ? "text-purple-500" : "text-neutral-300 group-hover:text-neutral-400"
                        }`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {page.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {children}
          </article>
        </div>
      </div>

      {/* Journey navigation — prev/next */}
      <div className="border-t border-neutral-100 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {prevPage ? (
              <Link
                to={prevPage.path}
                className="group flex items-center gap-3 px-5 py-4 rounded-xl hover:bg-white hover:shadow-sm transition-all"
              >
                <svg
                  className="w-5 h-5 text-neutral-400 group-hover:text-purple-500 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <div>
                  <p className="text-xs text-neutral-400 font-medium">
                    Previous
                  </p>
                  <p className="text-sm font-semibold text-neutral-700 group-hover:text-purple-700 transition-colors">
                    {prevPage.label}
                  </p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextPage ? (
              <Link
                to={nextPage.path}
                className="group flex items-center gap-3 px-5 py-4 rounded-xl hover:bg-white hover:shadow-sm transition-all text-right"
              >
                <div>
                  <p className="text-xs text-neutral-400 font-medium">
                    Continue the journey
                  </p>
                  <p className="text-sm font-semibold text-neutral-700 group-hover:text-purple-700 transition-colors">
                    {nextPage.label}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {nextPage.teaser}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-neutral-400 group-hover:text-purple-500 transition-colors shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <Link
                to="/sign-up"
                className="group flex items-center gap-3 px-5 py-4 rounded-xl bg-teal-50 hover:bg-teal-100 transition-all text-right"
              >
                <div>
                  <p className="text-xs text-teal-600 font-medium">
                    Ready to get involved?
                  </p>
                  <p className="text-sm font-bold text-teal-700">
                    Join US-RSE
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-teal-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
