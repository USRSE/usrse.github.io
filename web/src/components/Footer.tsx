const footerLinks = {
  Organization: [
    { label: "About", href: "#about" },
    { label: "Mission", href: "#mission" },
    { label: "Governance", href: "#governance" },
    { label: "Code of Conduct", href: "#coc" },
    { label: "DEI Statement", href: "#dei" },
  ],
  Community: [
    { label: "Working Groups", href: "#wg" },
    { label: "Events", href: "#events" },
    { label: "Job Board", href: "#jobs" },
    { label: "Community Awards", href: "#awards" },
    { label: "Newsletter", href: "#newsletter" },
  ],
  Resources: [
    { label: "RSE Stories", href: "#stories" },
    { label: "Publications", href: "#publications" },
    { label: "Tutorials", href: "#tutorials" },
    { label: "GitHub", href: "https://github.com/USRSE" },
    { label: "Documentation", href: "#docs" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo-circular.png"
                alt=""
                className="h-10 w-10 rounded-full"
              />
              <img
                src="/logo-main.png"
                alt="US-RSE"
                className="h-7"
              />
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">
              The United States Research Software Engineer Association. A
              community of people who make research software happen.
            </p>
            <div className="flex items-center gap-3">
              {/* GitHub */}
              <a
                href="https://github.com/USRSE"
                className="w-9 h-9 rounded-lg bg-neutral-200/60 hover:bg-teal-100 hover:text-teal-700 text-neutral-500 flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              {/* Slack */}
              <a
                href="#slack"
                className="w-9 h-9 rounded-lg bg-neutral-200/60 hover:bg-teal-100 hover:text-teal-700 text-neutral-500 flex items-center justify-center transition-colors"
                aria-label="Slack"
              >
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.163 0a2.528 2.528 0 012.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.163 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 01-2.52-2.523 2.527 2.527 0 012.52-2.52h6.315A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.522 2.523h-6.315z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-neutral-500 hover:text-teal-600 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">
            US-RSE is fiscally sponsored by Community Initiatives, a 501(c)(3) nonprofit.
          </p>
          <p className="text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} US-RSE Association. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
