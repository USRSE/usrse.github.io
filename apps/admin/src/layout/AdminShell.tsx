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
    <div className="min-h-screen bg-white text-neutral-900">
      <TopBar actor={actor} />
      <div className="flex">
        <Sidebar sections={sections} />
        <main className="flex-1 px-6 lg:px-10 py-10 lg:py-14 max-w-6xl">
          <Outlet context={{ actor } satisfies AdminShellContext} />
        </main>
      </div>
    </div>
  );
}

export function useShellActor(): ActorContext {
  return useOutletContext<AdminShellContext>().actor;
}
