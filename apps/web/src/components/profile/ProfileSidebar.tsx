import { useCallback, useEffect, useState } from "react";

export interface SidebarSection {
  id: string;
  number: string;
  label: string;
}

interface ProfileSidebarProps {
  sections: SidebarSection[];
}

/**
 * Sticky in-page table of contents for the dossier. Mirrors the
 * AboutLayout sidebar visual so the dossier feels consistent with
 * the rest of the site, but the items scroll to anchors on this
 * page instead of routing elsewhere.
 *
 * Active section is detected with an IntersectionObserver focused
 * on the upper third of the viewport — the nav-offset band. The
 * topmost section in that band wins, so as you scroll the active
 * label tracks the section currently under the eye.
 */
export function ProfileSidebar({ sections }: ProfileSidebarProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          .sort(
            (a, b) =>
              a.getBoundingClientRect().top - b.getBoundingClientRect().top
          );
        if (visible.length > 0) {
          setActiveId(visible[0].id);
        }
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault();
      const target = document.getElementById(id);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // Keep the URL in sync so the section is shareable, without
      // pushing a history entry on every nav click.
      history.replaceState(null, "", `#${id}`);
      setActiveId(id);
    },
    []
  );

  return (
    <aside className="hidden lg:block w-48 shrink-0">
      <nav className="sticky top-24" aria-label="Profile sections">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-4">
          On this page
        </p>
        <ul className="space-y-0">
          {sections.map((s) => {
            const isActive = activeId === s.id;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(event) => handleClick(event, s.id)}
                  aria-current={isActive ? "location" : undefined}
                  className={`group flex items-baseline gap-3 py-2.5 text-[13px] transition-colors ${
                    isActive
                      ? "text-neutral-900 font-semibold"
                      : "text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] tabular-nums ${
                      isActive
                        ? "text-purple-500"
                        : "text-neutral-300 group-hover:text-neutral-400"
                    }`}
                  >
                    {s.number}
                  </span>
                  {s.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
