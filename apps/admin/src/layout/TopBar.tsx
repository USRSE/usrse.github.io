import { useAuth } from "@workos-inc/authkit-react";
import type { ActorContext } from "../hooks/useActorContext";
import { clearSignInAttempt } from "../pages/auth/SignInPage";

interface TopBarProps {
  actor: ActorContext;
}

export function TopBar({ actor }: TopBarProps) {
  const { signOut } = useAuth();
  function handleSignOut() {
    clearSignInAttempt();
    signOut();
  }
  const tierLabel =
    actor.systemTier === 2
      ? "super admin"
      : actor.systemTier === 1
        ? "staff"
        : "member";
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-100">
      <div className="h-1 bg-purple-500" aria-hidden="true" />
      <div className="h-16 px-6 lg:px-10 flex items-center justify-between">
        <div className="font-display text-lg font-bold tracking-tight text-neutral-900">
          US-RSE
          <span className="text-neutral-400 font-medium"> / admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            {actor.user.email}
            <span className="text-neutral-300 mx-2">·</span>
            <span className="text-purple-700">{tierLabel}</span>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 hover:text-purple-700 transition-colors"
          >
            sign out
          </button>
        </div>
      </div>
    </header>
  );
}
