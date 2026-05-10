import { NavLink } from "react-router-dom";
import type { NavSection } from "../hooks/useNavSections";

interface SidebarProps {
  sections: NavSection[];
}

export function Sidebar({ sections }: SidebarProps) {
  return (
    <nav className="hidden lg:block w-56 shrink-0 border-r border-neutral-200 bg-neutral-50/60 min-h-screen">
      <ul className="py-6">
        {sections.map((s) => (
          <li key={s.id}>
            <NavLink
              to={s.to}
              end={s.to === "/"}
              className={({ isActive }) =>
                `flex items-baseline gap-3 px-5 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-purple-50 text-purple-900 border-l-[3px] border-purple-500"
                    : "text-neutral-600 hover:text-neutral-900 border-l-[3px] border-transparent"
                }`
              }
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                {s.number}
              </span>
              <span>{s.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
