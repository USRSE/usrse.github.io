import { NavLink } from "react-router-dom";
import type { NavSection } from "../hooks/useNavSections";

interface SidebarProps {
  sections: NavSection[];
}

export function Sidebar({ sections }: SidebarProps) {
  return (
    <nav className="hidden lg:block w-56 shrink-0 border-r border-neutral-100 bg-neutral-50 min-h-[calc(100vh-4.25rem)]">
      <ul className="py-8">
        {sections.map((s) => (
          <li key={s.id}>
            <NavLink
              to={s.to}
              end={s.to === "/"}
              className={({ isActive }) =>
                `group relative flex items-baseline gap-3 px-6 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "text-purple-700 font-medium"
                    : "text-neutral-600 hover:text-neutral-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all ${
                      isActive
                        ? "bg-purple-500"
                        : "bg-transparent group-hover:bg-neutral-200"
                    }`}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                    {s.number}
                  </span>
                  <span>{s.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
