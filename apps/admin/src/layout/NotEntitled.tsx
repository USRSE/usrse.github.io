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
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="h-1 bg-purple-500" aria-hidden="true" />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-6">
            Access denied
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900 mb-6">
            You don't have access to the admin app.
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed">
            This workspace is for US-RSE staff, board members, group leads, and
            event committee chairs. If you should be here, contact a super
            admin.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-neutral-200 text-neutral-700 font-medium text-sm hover:border-purple-300 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 transition-colors"
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
