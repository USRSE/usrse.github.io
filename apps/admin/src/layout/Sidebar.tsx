import { NavLink } from "react-router-dom";
import type { NavSection } from "../hooks/useNavSections";

/**
 * Public web app URL — mirrors the env-aware pattern apps/web uses for
 * its VITE_ADMIN_URL link. Lets an admin jump back to the member-
 * facing site without typing the URL: dev → vite (5173), prod →
 * usrse.org, override via VITE_WEB_URL for preview deploys.
 */
const WEB_URL: string =
  import.meta.env.VITE_WEB_URL ??
  (import.meta.env.DEV
    ? "http://localhost:5173"
    : "https://usrse.org");

interface SidebarProps {
  sections: NavSection[];
}

export function Sidebar({ sections }: SidebarProps) {
  const top = sections.filter((s) => s.number === "00");
  const curation = sections.filter((s) => /^0[1-6]$/.test(s.number));
  const system = sections.filter((s) => /^0[78]$/.test(s.number));

  return (
    <nav
      className="hidden lg:flex w-64 shrink-0 flex-col min-h-[calc(100vh-4.25rem)]"
      style={{
        borderRight: "1px solid var(--admin-rule)",
        background: "var(--admin-paper)",
      }}
    >
      <div className="px-8 pt-10 pb-6">
        <p className="admin-classification">Workspace</p>
      </div>

      <ul className="space-y-px pb-3">
        {top.map((s) => <SidebarItem key={s.id} section={s} />)}
      </ul>

      {curation.length > 0 && (
        <>
          <Divider />
          <ul className="space-y-px py-3">
            {curation.map((s) => <SidebarItem key={s.id} section={s} />)}
          </ul>
        </>
      )}

      {system.length > 0 && (
        <>
          <Divider />
          <ul className="space-y-px py-3">
            {system.map((s) => <SidebarItem key={s.id} section={s} />)}
          </ul>
        </>
      )}

      <ElsewhereColophon />
    </nav>
  );
}

/**
 * Bottom-anchored "colophon" — the editorial convention for a block
 * that sits below the body and names the publisher/printer. Here it
 * names the *other* place an admin might want to go: the public site.
 * Distinct visual class from the numbered workspace items so it
 * doesn't pretend to be one of them — an "↗" replaces the numeric
 * prefix to signal an external destination.
 */
function ElsewhereColophon() {
  return (
    <div className="mt-auto pt-6 pb-8">
      <div
        className="mx-8 mb-4"
        style={{ borderTop: "1px solid var(--admin-rule-subtle)" }}
      />
      <p className="admin-classification px-8 mb-3">Elsewhere</p>
      <a
        href={WEB_URL}
        className="group flex items-baseline gap-4 pl-8 pr-6 py-2 text-[15px] transition-colors"
        style={{ color: "var(--admin-ink-medium)" }}
      >
        <span
          aria-hidden="true"
          className="font-mono text-[10px] tracking-[0.2em] tabular-nums w-6 inline-block transition-transform group-hover:-translate-y-px group-hover:translate-x-px"
          style={{ color: "var(--admin-marginalia)" }}
        >
          ↗
        </span>
        <span className="flex-1 tracking-tight group-hover:text-[color:var(--admin-ink)] transition-colors">
          public site
        </span>
      </a>
    </div>
  );
}

function Divider() {
  return <div className="mx-8 my-2" style={{ borderTop: "1px solid var(--admin-rule-subtle)" }} />;
}

function SidebarItem({ section }: { section: NavSection }) {
  return (
    <li>
      <NavLink
        to={section.to}
        end={section.to === "/"}
        className={({ isActive: _isActive }) =>
          `group relative flex items-baseline gap-4 pl-8 pr-6 py-3 text-[15px] transition-colors`
        }
        style={({ isActive }) => ({
          color: isActive ? "var(--admin-ink)" : "var(--admin-ink-medium)",
          fontWeight: isActive ? 500 : 400,
        })}
      >
        {({ isActive }) => (
          <>
            <span
              aria-hidden="true"
              className={isActive ? "admin-animate-ribbon" : ""}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "4px",
                background: isActive ? "var(--admin-ribbon)" : "transparent",
              }}
            />
            <span
              className="font-mono text-[10px] tracking-[0.2em] tabular-nums w-6 inline-block"
              style={{ color: isActive ? "var(--admin-ribbon)" : "var(--admin-marginalia)" }}
            >
              {section.number}
            </span>
            <span className="flex-1 tracking-tight">{section.label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}
