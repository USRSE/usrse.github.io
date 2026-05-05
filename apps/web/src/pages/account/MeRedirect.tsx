import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useCurrentMember } from "@/hooks/useCurrentMember";

/**
 * Resolves /me to the current member's public profile URL.
 *
 * Nav links to /me instead of /members/:slug because the slug isn't
 * known until the user is fetched. This component keeps that resolve
 * step on its own route so the rest of the nav doesn't have to load
 * the full /me payload just to render a link.
 */
export function MeRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const { status, member } = useCurrentMember();

  if (authLoading) return <Pending />;

  // Decide on auth first, before looking at member status. Otherwise the
  // brief render where useCurrentMember sits at "idle" (between mount and
  // its effect kicking off the fetch) bounces signed-in users to /sign-in,
  // and SignInPage sees they're already signed in and sends them to /.
  if (!user) return <Navigate to="/sign-in" replace />;

  if (
    status === "idle" ||
    status === "loading" ||
    status === "provisioning"
  ) {
    return <Pending />;
  }

  if (status === "error") {
    return (
      <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          Something broke
        </p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4">
          We couldn't find your profile.
        </h1>
        <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto mb-8">
          Try signing out and back in, or open your account settings to check.
        </p>
        <Link
          to="/account"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
        >
          Go to account
        </Link>
      </article>
    );
  }

  const slug = member?.profile?.slug;
  if (!slug) {
    // Authenticated but no public profile slug yet — send them to
    // settings so they can finish their setup.
    return <Navigate to="/account" replace />;
  }

  return <Navigate to={`/members/${slug}`} replace />;
}

function Pending() {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        One moment
      </p>
      <h1 className="font-display text-2xl lg:text-3xl font-semibold text-neutral-900 tracking-tight leading-[1.1] mb-4">
        Finding your profile…
      </h1>
      <div
        className="mt-6 inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse"
        aria-hidden="true"
      />
    </article>
  );
}
