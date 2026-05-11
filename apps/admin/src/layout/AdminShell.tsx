import { Outlet, useOutletContext } from "react-router-dom";
import type { ActorContext } from "../hooks/useActorContext";
import { useNavSections } from "../hooks/useNavSections";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AdminShellProps {
  actor: ActorContext;
}

export type AdminShellContext = { actor: ActorContext };

export function AdminShell({ actor }: AdminShellProps) {
  const sections = useNavSections(actor);
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--admin-paper)" }}>
      <TopBar actor={actor} />
      <div className="flex flex-1">
        <Sidebar sections={sections} />
        <main className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-8 lg:px-16 py-12 lg:py-16 admin-animate-reveal">
            <Outlet context={{ actor } satisfies AdminShellContext} />
          </div>
        </main>
      </div>
    </div>
  );
}

export function useShellActor(): ActorContext {
  return useOutletContext<AdminShellContext>().actor;
}
