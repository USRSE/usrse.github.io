import { useAuth } from "@workos-inc/authkit-react";
import { clearSignInAttempt } from "../pages/auth/SignInPage";

/** Shown when the actor signed in but has no admin-shaped position. */
export function NotEntitled() {
  const { signOut } = useAuth();
  function handleSignOut() {
    clearSignInAttempt();
    signOut();
  }
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--admin-paper)" }}>
      <div className="h-1" style={{ background: "var(--admin-ribbon)" }} aria-hidden="true" />
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16 admin-animate-reveal">
        <div className="w-full max-w-2xl">
          <p className="admin-classification mb-8">US-RSE · Admin · Access denied</p>
          <h1 className="admin-display mb-8">
            <span style={{ color: "var(--admin-ink)" }}>You are not</span>
            <br />
            <span style={{ color: "var(--admin-ribbon)" }}>in the register.</span>
          </h1>
          <div style={{ borderTop: "1px solid var(--admin-rule)" }} className="pt-6 mb-10">
            <p className="text-[17px] leading-[1.7]" style={{ color: "var(--admin-ink-medium)", maxWidth: "var(--admin-measure)" }}>
              This workspace is reserved for US-RSE staff, board members, group
              leads, and event committee chairs. If you should be listed here,
              contact a super administrator.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-3 px-6 py-3"
            style={{
              border: "1px solid var(--admin-ink)",
              color: "var(--admin-ink)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "15px",
              letterSpacing: "0.02em",
              background: "transparent",
            }}
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
