const footerLinks = {
  Organization: [
    { label: "Mission", href: "/about/mission" },
    { label: "Governance", href: "/about/governance" },
    { label: "Board of Directors", href: "/about/board" },
    { label: "Code of Conduct", href: "/about/code-of-conduct" },
    { label: "DEI Statement", href: "/about/dei" },
  ],
  Community: [
    { label: "Working Groups", href: "/community/working-groups" },
    { label: "Events", href: "/events" },
    { label: "Job Board", href: "/jobs" },
    { label: "Community Awards", href: "/community/awards" },
    { label: "Newsletter", href: "/news" },
  ],
  Resources: [
    { label: "Education & Training", href: "/resources/education" },
    { label: "RSE Organizations", href: "/resources/organizations" },
    { label: "Volunteer", href: "/jobs/volunteer" },
    { label: "GitHub", href: "https://github.com/USRSE" },
    { label: "Sponsors", href: "/about/sponsors" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <img
                src="/us-rse-logo-001.svg"
                alt="US-RSE"
                className="h-12"
              />
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">
              The United States Research Software Engineer Association. A
              community of people who make research software happen.
            </p>
            {/* Contact */}
            <a
              href="mailto:contact@us-rse.org"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-teal-600 transition-colors mb-5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              contact@us-rse.org
            </a>

            {/* Socials */}
            <div className="flex items-center gap-2.5">
              {/* GitHub */}
              <a
                href="https://github.com/USRSE"
                className="w-9 h-9 rounded-lg bg-neutral-200/60 hover:bg-teal-100 hover:text-teal-700 text-neutral-500 flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com/company/us-rse/"
                className="w-9 h-9 rounded-lg bg-neutral-200/60 hover:bg-teal-100 hover:text-teal-700 text-neutral-500 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* Mastodon */}
              <a
                href="https://fosstodon.org/@us_rse"
                rel="me noopener noreferrer"
                target="_blank"
                className="w-9 h-9 rounded-lg bg-neutral-200/60 hover:bg-teal-100 hover:text-teal-700 text-neutral-500 flex items-center justify-center transition-colors"
                aria-label="Mastodon"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 00.023-.043v-1.809a.052.052 0 00-.02-.041.053.053 0 00-.046-.01 20.282 20.282 0 01-4.709.547c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 01-.319-1.433.053.053 0 01.066-.054 19.648 19.648 0 004.636.536c.356 0 .711 0 1.069-.008 2.207-.06 4.511-.164 6.678-.66.056-.013.11-.028.16-.05 2.348-.525 4.584-2.168 4.817-6.39.009-.17.034-1.768.034-1.941 0-.595.072-4.029-.266-6.152zM19.69 14.633h-2.55V8.34c0-1.324-.556-1.997-1.67-1.997-1.23 0-1.846.798-1.846 2.376v3.458h-2.535V8.72c0-1.578-.617-2.376-1.846-2.376-1.114 0-1.67.673-1.67 1.996v6.294H5.024V8.12c0-1.324.338-2.376 1.018-3.155.7-.779 1.616-1.178 2.75-1.178 1.312 0 2.305.504 2.967 1.512l.64 1.072.638-1.072c.663-1.008 1.656-1.512 2.968-1.512 1.133 0 2.049.399 2.748 1.178.681.779 1.02 1.831 1.02 3.155v6.524z" />
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com/@us_rse"
                className="w-9 h-9 rounded-lg bg-neutral-200/60 hover:bg-teal-100 hover:text-teal-700 text-neutral-500 flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
