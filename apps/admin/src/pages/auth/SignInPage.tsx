import { useEffect, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";

/**
 * Sign-in surface for admin.us-rse.org.
 *
 * On first arrival in a tab session, immediately calls `signIn()` —
 * WorkOS checks for an existing SSO session cookie and silently calls
 * back with an auth code if one exists, so an admin who is already
 * signed in elsewhere (e.g., usrse.org) lands straight in the admin
 * app with no button press.
 *
 * If we already auto-redirected once this tab session and the user
 * returned still unauthenticated (cancelled the WorkOS prompt, or
 * their session is invalid), we fall back to a manual sign-in card
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
      /* sessionStorage may throw in some private-mode contexts; treat as
         "haven't tried" so the auto-redirect still runs. */
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
      <div className="min-h-screen flex flex-col bg-neutral-50">
        <div className="h-1 bg-purple-500" aria-hidden="true" />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-500 text-center">
            Connecting to WorkOS…
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="h-1 bg-purple-500" aria-hidden="true" />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-6">
            Staff workspace
          </p>
          <h1 className="font-display text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-neutral-900">
            US-RSE
            <span className="text-neutral-400 font-normal"> / admin</span>
          </h1>
          <p className="mt-6 text-base text-neutral-600 leading-relaxed">
            For US-RSE staff, board members, group leads, and event
            committee chairs. Sign in with your usual WorkOS account.
          </p>
          <button
            type="button"
            onClick={() => signIn()}
            className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-700 text-white font-medium text-sm tracking-wide shadow-sm hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 transition-colors"
          >
            Sign in
            <span aria-hidden="true">→</span>
          </button>
          <div className="mt-12 pt-6 border-t border-neutral-200">
            <a
              href="https://usrse.org"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 hover:text-purple-700 transition-colors"
            >
              ← Public site
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
