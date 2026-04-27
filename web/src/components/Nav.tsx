import { useState } from "react";

const navLinks = [
  {
    label: "About",
    href: "#about",
    children: [
      { label: "Mission", href: "#mission" },
      { label: "What is an RSE?", href: "#rse" },
      { label: "DEI Statement", href: "#dei" },
      { label: "Governance", href: "#governance" },
    ],
  },
  {
    label: "Get Involved",
    href: "#involved",
    children: [
      { label: "Join US-RSE", href: "#join" },
      { label: "Working Groups", href: "#wg" },
      { label: "Affinity Groups", href: "#affinity" },
      { label: "Community Funds", href: "#funds" },
    ],
  },
  { label: "Events", href: "#events" },
  { label: "Job Board", href: "#jobs" },
  { label: "Resources", href: "#resources" },
  { label: "News", href: "#news" },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-teal-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Purple brand accent bar */}
      <div className="h-1 bg-purple-500" aria-hidden="true" />

      <nav
        className="bg-white border-b border-neutral-100 h-16 flex items-center px-6 lg:px-10"
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Logo */}
          <a href="/" className="flex items-center group">
            <img
              src="/us-rse-logo-001.svg"
              alt="US-RSE"
              className="h-10 group-hover:opacity-80 transition-opacity"
            />
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() =>
                  link.children && setActiveDropdown(link.label)
                }
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={link.href}
                  className="text-neutral-600 hover:text-purple-600 text-sm font-medium px-3.5 py-2 rounded-md hover:bg-neutral-50 transition-all duration-200 inline-flex items-center gap-1"
                >
                  {link.label}
                  {link.children && (
                    <svg
                      className="w-3.5 h-3.5 opacity-60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </a>

                {/* Dropdown */}
                {link.children && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 pt-2 animate-slide-down">
                    <div className="bg-white rounded-xl shadow-lg border border-neutral-100 py-2 min-w-48">
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <a
              href="#join"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors shadow-sm"
            >
              Join Us
            </a>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-gradient-to-br from-teal-900 via-teal-700 to-teal-500 animate-fade-in overflow-y-auto">
          <div className="px-6 py-8 space-y-2">
            {navLinks.map((link) => (
              <div key={link.label}>
                <a
                  href={link.href}
                  className="block text-white text-lg font-medium py-3 border-b border-white/10"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
                {link.children && (
                  <div className="pl-4 pb-2">
                    {link.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className="block text-white/70 hover:text-white py-2 text-sm"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-6">
              <a
                href="#join"
                className="block text-center w-full px-6 py-3 bg-white text-purple-500 font-bold rounded-xl shadow-lg"
              >
                Join US-RSE
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
