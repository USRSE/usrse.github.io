import { useAuth } from "@workos-inc/authkit-react";
import type { ActorContext } from "../hooks/useActorContext";

interface TopBarProps {
  actor: ActorContext;
}

export function TopBar({ actor }: TopBarProps) {
  const { signOut } = useAuth();
  const tierLabel =
    actor.systemTier === 2
      ? "super admin"
      : actor.systemTier === 1
        ? "staff"
        : "member";
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="h-1 bg-purple-700" aria-hidden="true" />
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="font-display text-lg font-semibold text-neutral-900">
          US-RSE <span className="text-neutral-400">/ admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            {actor.user.email} · {tierLabel}
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 hover:text-purple-700"
          >
            sign out
          </button>
        </div>
      </div>
    </header>
  );
}
