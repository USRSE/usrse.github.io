import { NavLink } from "react-router-dom";
import type { NavSection } from "../hooks/useNavSections";

interface SidebarProps {
  sections: NavSection[];
}

/**
 * Adaptive sidebar — visible items derive from the actor's positions
 * (see useNavSections). The visual rhythm matches the public site's
 * mono-eyebrow + editorial-prose treatment, scaled down for a
 * workspace surface.
 *
 * Layout groups the sections into three bands:
 *   1. Dashboard (always)
 *   2. Curation (staff + scoped chairs)
 *   3. System (super_admin only)
 *
 * Group boundaries are derived from the section's number prefix:
 *   "00" → top, "01–06" → curation, "07–08" → system.
 */
export function Sidebar({ sections }: SidebarProps) {
  const top = sections.filter((s) => s.number === "00");
  const curation = sections.filter(
    (s) => /^0[1-6]$/.test(s.number)
  );
  const system = sections.filter((s) => /^0[78]$/.test(s.number));

  return (
    <nav className="hidden lg:flex w-60 shrink-0 flex-col border-r border-neutral-100 bg-neutral-50/60 min-h-[calc(100vh-4.25rem)]">
      <div className="px-6 pt-8 pb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
          Workspace
        </p>
      </div>

      <ul className="space-y-px pb-4">
        {top.map((s) => (
          <SidebarItem key={s.id} section={s} />
        ))}
      </ul>

      {curation.length > 0 && (
        <>
          <Divider />
          <ul className="space-y-px py-2">
            {curation.map((s) => (
              <SidebarItem key={s.id} section={s} />
            ))}
          </ul>
        </>
      )}

      {system.length > 0 && (
        <>
          <Divider />
          <ul className="space-y-px py-2">
            {system.map((s) => (
              <SidebarItem key={s.id} section={s} />
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}

function Divider() {
  return <div className="mx-6 my-2 border-t border-neutral-200/60" />;
}

function SidebarItem({ section }: { section: NavSection }) {
  return (
    <li>
      <NavLink
        to={section.to}
        end={section.to === "/"}
        className={({ isActive }) =>
          `group relative flex items-baseline gap-3 pl-6 pr-4 py-2.5 text-sm transition-colors ${
            isActive
              ? "text-purple-700 font-medium bg-purple-50/40"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              aria-hidden="true"
              className={`absolute left-0 top-0 bottom-0 w-[4px] transition-colors ${
                isActive ? "bg-purple-500" : "bg-transparent"
              }`}
            />
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.25em] tabular-nums ${
                isActive ? "text-purple-400" : "text-neutral-300"
              }`}
            >
              {section.number}
            </span>
            <span className="flex-1">{section.label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}
