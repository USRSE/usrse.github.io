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
    actor.systemTier === 2 ? "super admin"
    : actor.systemTier === 1 ? "staff" : "member";

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "var(--admin-paper)",
        borderBottom: "1px solid var(--admin-rule)",
      }}
    >
      <div className="h-1" style={{ background: "var(--admin-ribbon)" }} aria-hidden="true" />
      <div className="h-16 px-8 lg:px-16 flex items-center justify-between">
        <div className="font-display text-xl font-bold tracking-tight" style={{ color: "var(--admin-ink)" }}>
          US-RSE
          <span style={{ color: "var(--admin-marginalia)" }} className="font-medium"> / admin</span>
        </div>
        <div className="flex items-center gap-5">
          <span
            className="hidden md:inline-flex items-center gap-2 admin-classification"
            aria-label="current session"
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
              style={{ background: "var(--admin-mark)" }}
              aria-hidden="true"
            />
            <span>{actor.user.email}</span>
            <span style={{ color: "var(--admin-rule)" }}>·</span>
            <span style={{ color: "var(--admin-ribbon)" }}>{tierLabel}</span>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="admin-classification hover:transition-colors"
            style={{ color: "var(--admin-marginalia)" }}
          >
            sign out
          </button>
        </div>
      </div>
    </header>
  );
}
