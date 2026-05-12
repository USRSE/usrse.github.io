import { useEffect, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";

/**
 * Sign-in surface for admin.us-rse.org — styled as a frontispiece.
 *
 * On first arrival in a tab session, immediately calls `signIn()` —
 * WorkOS checks for an existing SSO session cookie and silently calls
 * back with an auth code if one exists, so an admin who is already
 * signed in elsewhere (e.g., usrse.org) lands straight in the admin
 * app with no button press.
 *
 * If we already auto-redirected once this tab session and the user
 * returned still unauthenticated (cancelled the WorkOS prompt, or
 * their session is invalid), we fall back to a manual sign-in frontispiece
 * with an explicit button + an escape link to the public site.
 */
const ATTEMPT_KEY = "admin:signInAttempted";

/** Clear the attempt flag — called from sign-out paths so the next
 *  visit gets the auto-redirect experience again instead of being
 *  stuck on the manual surface. */
export function clearSignInAttempt() {
  try {
    sessionStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* ok */
  }
}

export function SignInPage() {
  const { signIn } = useAuth();
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    let alreadyTried = false;
    try {
      alreadyTried = sessionStorage.getItem(ATTEMPT_KEY) === "1";
    } catch {
      /* ok */
    }
    if (alreadyTried) {
      setShowManual(true);
      return;
    }
    try {
      sessionStorage.setItem(ATTEMPT_KEY, "1");
    } catch {
      /* ok */
    }
    signIn();
  }, [signIn]);

  if (!showManual) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--admin-paper)" }}>
        <div className="h-1" style={{ background: "var(--admin-ribbon)" }} aria-hidden="true" />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <p className="admin-classification">Connecting to WorkOS…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--admin-paper)" }}>
      <div className="h-1" style={{ background: "var(--admin-ribbon)" }} aria-hidden="true" />
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16 admin-animate-reveal">
        <div className="w-full max-w-2xl">
          <p className="admin-classification mb-8">
            US-RSE · Admin · Frontispiece
          </p>
          <h1 className="admin-display mb-8">
            <span style={{ color: "var(--admin-ink)" }}>The Steward's</span>
            <br />
            <span style={{ color: "var(--admin-ribbon)" }}>Workspace.</span>
          </h1>
          <div style={{ borderTop: "1px solid var(--admin-rule)" }} className="pt-6 mb-10">
            <p className="text-[17px] leading-[1.7]" style={{ color: "var(--admin-ink-medium)", maxWidth: "var(--admin-measure)" }}>
              For US-RSE staff, board members, group leads, and event committee
              chairs. The community's record is kept here — every member,
              every organization, every event, every decision — held against
              the integrity of a well-maintained archive.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signIn()}
            className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600"
          >
            <span>Sign in</span>
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </button>
          <div className="mt-16 pt-6" style={{ borderTop: "1px solid var(--admin-rule-subtle)" }}>
            <a href="https://usrse.org" className="admin-classification">
              ← Return to the public site
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
