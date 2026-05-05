import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";

/* ── Types ─────────────────────────────────────────────────────────── */

interface SimpleLink {
  label: string;
  href: string;
  route?: boolean;
  desc?: string;
}

interface MegaMenuColumn {
  heading: string;
  links: SimpleLink[];
}

interface NavItemSimple {
  label: string;
  href: string;
  route?: boolean;
  type: "link";
}

interface NavItemDropdown {
  label: string;
  href: string;
  route?: boolean;
  type: "dropdown";
  children: SimpleLink[];
}

interface NavItemMega {
  label: string;
  href: string;
  route?: boolean;
  type: "mega";
  columns: MegaMenuColumn[];
  /** Optional featured callout on the right side */
  featured?: { label: string; desc: string; href: string; route?: boolean };
}

type NavItem = NavItemSimple | NavItemDropdown | NavItemMega;

/* ── Navigation Data ───────────────────────────────────────────────── */

const navItems: NavItem[] = [
  {
    label: "About",
    href: "/about/mission",
    route: true,
    type: "mega",
    columns: [
      {
        heading: "Organization",
        links: [
          { label: "Mission", href: "/about/mission", route: true, desc: "What we stand for" },
          { label: "What is an RSE?", href: "/about/what-is-an-rse", route: true, desc: "The role defined" },
          { label: "DEI Statement", href: "/about/dei", route: true, desc: "Inclusion & equity" },
          { label: "Code of Conduct", href: "/about/code-of-conduct", route: true, desc: "Community standards" },
          { label: "Sponsors", href: "/about/sponsors", route: true, desc: "Who supports us" },
        ],
      },
      {
        heading: "Leadership",
        links: [
          { label: "Governance", href: "/about/governance", route: true, desc: "How we're organized" },
          { label: "Board of Directors", href: "/about/board", route: true, desc: "Elected leadership" },
          { label: "Staff", href: "/about/staff", route: true, desc: "Operations team" },
          { label: "Elections", href: "/about/elections", route: true, desc: "Annual voting process" },
          { label: "Financial Status", href: "/about/financial-status", route: true, desc: "Transparency reports" },
        ],
      },
    ],
    featured: {
      label: "Contact Us",
      desc: "Questions? Reach the team at contact@us-rse.org",
      href: "mailto:contact@us-rse.org",
    },
  },
  {
    label: "Community",
    href: "/community/working-groups",
    route: true,
    type: "mega",
    columns: [
      {
        heading: "Working Groups",
        links: [
          { label: "All Working Groups", href: "/community/working-groups", route: true, desc: "Community-led teams" },
          { label: "Code Review", href: "#wg-code-review" },
          { label: "Education & Training", href: "#wg-edu" },
          { label: "DEI", href: "#wg-dei" },
          { label: "Mentorship Program", href: "#wg-mentorship" },
          { label: "Testing", href: "#wg-testing" },
        ],
      },
      {
        heading: "Connect",
        links: [
          { label: "Affinity Groups", href: "/community/affinity-groups", route: true, desc: "Identity & regional communities" },
          { label: "Community Calls", href: "/community/calls", route: true, desc: "Monthly virtual meetings" },
          { label: "Community Awards", href: "/community/awards", route: true, desc: "Recognizing contributions" },
          { label: "Community Funds", href: "/community/funds", route: true, desc: "Funding for initiatives" },
        ],
      },
    ],
    featured: {
      label: "Join US-RSE",
      desc: "Free membership. Open to anyone supporting the RSE mission.",
      href: "/community/working-groups",
      route: true,
    },
  },
  {
    label: "Events",
    href: "/events",
    route: true,
    type: "dropdown",
    children: [
      { label: "Upcoming Events", href: "/events", route: true },
      { label: "Calendar", href: "/events/calendar", route: true },
      { label: "USRSE'26 Conference", href: "/events/usrse26", route: true },
    ],
  },
  {
    label: "Opportunities",
    href: "/jobs",
    route: true,
    type: "dropdown",
    children: [
      { label: "Job Board", href: "/jobs", route: true },
      { label: "Post a Job", href: "/jobs/submit", route: true },
      { label: "Volunteer with US-RSE", href: "/jobs/volunteer", route: true },
    ],
  },
  {
    label: "News",
    href: "/news",
    route: true,
    type: "dropdown",
    children: [
      { label: "Newsletters", href: "/news", route: true },
      { label: "News & Updates", href: "/news/updates", route: true },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    route: true,
    type: "dropdown",
    children: [
      { label: "Learn", href: "/resources", route: true },
      { label: "Directory", href: "/resources/directory", route: true },
    ],
  },
];

/* ── Helper ────────────────────────────────────────────────────────── */

function SmartLink({ href, route, className, children, onClick }: {
  href: string;
  route?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  if (route) {
    return <Link to={href} className={className} onClick={onClick}>{children}</Link>;
  }
  return <a href={href} className={className} onClick={onClick}>{children}</a>;
}

/* ── Component ─────────────────────────────────────────────────────── */

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const closeMobile = () => setMobileOpen(false);

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
          <Link to="/" className="flex items-center group">
            <img
              src="/us-rse-logo-001.svg"
              alt="US-RSE"
              className="h-10 group-hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* ── Desktop Nav ────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.type !== "link" && setActiveMenu(item.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                {/* Trigger */}
                <SmartLink
                  href={item.href}
                  route={item.route}
                  className="text-neutral-600 hover:text-purple-600 text-sm font-medium px-3 py-2 rounded-md hover:bg-neutral-50 transition-all duration-200 inline-flex items-center gap-1"
                >
                  {item.label}
                  {item.type !== "link" && (
                    <svg
                      className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${
                        activeMenu === item.label ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </SmartLink>

                {/* ── Mega Menu Panel ─────────────────────────────── */}
                {item.type === "mega" && activeMenu === item.label && (
                  <div className="absolute top-full -left-4 pt-3 animate-slide-down">
                    <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 p-6 flex gap-0" style={{ minWidth: "540px" }}>
                      {/* Columns */}
                      <div className="flex gap-8 flex-1">
                        {item.columns.map((col) => (
                          <div key={col.heading} className="min-w-[180px]">
                            <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-3">
                              {col.heading}
                            </p>
                            <ul className="space-y-0.5">
                              {col.links.map((link) => (
                                <li key={link.label}>
                                  <SmartLink
                                    href={link.href}
                                    route={link.route}
                                    className="group block px-2.5 py-2 -mx-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
                                  >
                                    <span className="block text-sm font-medium text-neutral-800 group-hover:text-purple-700 transition-colors">
                                      {link.label}
                                    </span>
                                    {link.desc && (
                                      <span className="block text-[11px] text-neutral-400 mt-0.5">
                                        {link.desc}
                                      </span>
                                    )}
                                  </SmartLink>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Featured callout */}
                      {item.featured && (
                        <div className="ml-6 pl-6 border-l border-neutral-100 w-48 shrink-0 flex flex-col justify-center">
                          <SmartLink
                            href={item.featured.href}
                            route={item.featured.route}
                            className="group"
                          >
                            <p className="text-sm font-bold text-neutral-900 group-hover:text-purple-700 transition-colors">
                              {item.featured.label}
                            </p>
                            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                              {item.featured.desc}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 mt-2 group-hover:text-teal-700 transition-colors">
                              Learn more
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </span>
                          </SmartLink>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Simple Dropdown ─────────────────────────────── */}
                {item.type === "dropdown" && activeMenu === item.label && (
                  <div className="absolute top-full left-0 pt-3 animate-slide-down">
                    <div className="bg-white rounded-xl shadow-lg border border-neutral-100 py-2 min-w-48">
                      {item.children.map((child) => (
                        <SmartLink
                          key={child.label}
                          href={child.href}
                          route={child.route}
                          className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-purple-700 transition-colors"
                        >
                          {child.label}
                        </SmartLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-1.5">
            <UserNavSlot />
            <Link
              to="/sign-up"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors shadow-sm"
            >
              Join Us
            </Link>

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

      {/* ── Mobile Menu ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[calc(4rem+4px)] z-40 bg-white animate-fade-in overflow-y-auto">
          <div className="px-6 py-6 space-y-1">
            {navItems.map((item) => (
              <div key={item.label} className="border-b border-neutral-100 last:border-0">
                {item.type === "link" ? (
                  <SmartLink
                    href={item.href}
                    route={item.route}
                    className="block text-neutral-900 font-medium py-3.5"
                    onClick={closeMobile}
                  >
                    {item.label}
                  </SmartLink>
                ) : (
                  <MobileAccordion item={item} onNavigate={closeMobile} />
                )}
              </div>
            ))}

            <div className="pt-4 space-y-3">
              <UserNavSlotMobile onNavigate={closeMobile} />
              <Link
                to="/sign-up"
                className="block text-center w-full px-6 py-3 bg-purple-500 text-white font-bold rounded-xl shadow-sm"
                onClick={closeMobile}
              >
                Join US-RSE
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ── Mobile Accordion ──────────────────────────────────────────────── */

function MobileAccordion({
  item,
  onNavigate,
}: {
  item: NavItemDropdown | NavItemMega;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  const allLinks: SimpleLink[] =
    item.type === "mega"
      ? item.columns.flatMap((col) => col.links)
      : item.children;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-neutral-900 font-medium py-3.5"
      >
        {item.label}
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="pb-3 space-y-0.5">
          {item.type === "mega" &&
            item.columns.map((col) => (
              <div key={col.heading} className="mb-3 last:mb-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-3 mb-1">
                  {col.heading}
                </p>
                {col.links.map((link) => (
                  <SmartLink
                    key={link.label}
                    href={link.href}
                    route={link.route}
                    className="block px-3 py-2 text-sm text-neutral-600 hover:text-purple-700 hover:bg-neutral-50 rounded-lg transition-colors"
                    onClick={onNavigate}
                  >
                    {link.label}
                  </SmartLink>
                ))}
              </div>
            ))}

          {item.type === "dropdown" &&
            allLinks.map((link) => (
              <SmartLink
                key={link.label}
                href={link.href}
                route={link.route}
                className="block px-3 py-2 text-sm text-neutral-600 hover:text-purple-700 hover:bg-neutral-50 rounded-lg transition-colors"
                onClick={onNavigate}
              >
                {link.label}
              </SmartLink>
            ))}
        </div>
      )}
    </div>
  );
}

/* ── Auth slots ────────────────────────────────────────────────────── */

function userInitials(name: string | null | undefined, email: string | null | undefined): string {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function UserNavSlot() {
  const { user, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <button
        onClick={() => signIn()}
        className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 hover:text-purple-700 hover:bg-neutral-50 rounded-md transition-colors"
      >
        Sign In
      </button>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  const initials = userInitials(fullName, user.email);

  return (
    <div ref={ref} className="hidden sm:block relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-neutral-50 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-purple-500 text-white text-xs font-semibold grid place-items-center">
            {initials}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-100 p-2 animate-slide-down"
        >
          <div className="px-3 py-2.5 border-b border-neutral-100 mb-1">
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {fullName || user.email}
            </p>
            {fullName && (
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            )}
          </div>
          <Link
            to="/me"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
            role="menuitem"
          >
            My profile
          </Link>
          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
            role="menuitem"
          >
            Settings
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function UserNavSlotMobile({ onNavigate }: { onNavigate: () => void }) {
  const { user, signIn, signOut } = useAuth();

  if (!user) {
    return (
      <button
        onClick={() => {
          onNavigate();
          signIn();
        }}
        className="block text-center w-full px-6 py-3 border border-purple-500 text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors"
      >
        Sign In
      </button>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50">
        <p className="text-sm font-semibold text-neutral-900 truncate">
          {fullName || user.email}
        </p>
        {fullName && (
          <p className="text-xs text-neutral-500 truncate">{user.email}</p>
        )}
      </div>
      <Link
        to="/me"
        onClick={onNavigate}
        className="block w-full text-left px-4 py-3 text-sm text-neutral-700 border-t border-neutral-100 hover:bg-neutral-50 transition-colors"
      >
        My profile
      </Link>
      <Link
        to="/account"
        onClick={onNavigate}
        className="block w-full text-left px-4 py-3 text-sm text-neutral-700 border-t border-neutral-100 hover:bg-neutral-50 transition-colors"
      >
        Settings
      </Link>
      <button
        onClick={() => {
          onNavigate();
          signOut();
        }}
        className="block w-full text-left px-4 py-3 text-sm text-neutral-700 border-t border-neutral-100 hover:bg-neutral-50 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
