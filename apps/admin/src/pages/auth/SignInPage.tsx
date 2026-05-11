import { useAuth } from "@workos-inc/authkit-react";

/**
 * Sign-in surface for admin.us-rse.org. Standalone landing screen
 * shown when no WorkOS session is active. Visually heavier than the
 * inner admin shell (centered, branded) so it reads as a real product
 * entry point, then gives way to the dense workspace treatment after
 * the actor context loads.
 */
export function SignInPage() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="h-1 bg-purple-700" aria-hidden="true" />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-6">
            Staff workspace
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-neutral-900">
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
