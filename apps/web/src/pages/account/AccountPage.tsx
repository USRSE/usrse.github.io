import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useCurrentMember, type CurrentMember } from "@/hooks/useCurrentMember";
import { ProfileView } from "./ProfileView";

export function AccountPage() {
  const { user: workosUser, isLoading: authLoading } = useAuth();
  const { status, member, error, refetch } = useCurrentMember();
  const [override, setOverride] = useState<CurrentMember | null>(null);

  if (authLoading || status === "loading") return <SkeletonState />;
  if (status === "idle" || !workosUser) return <SignedOutState />;
  if (status === "provisioning") return <ProvisioningState />;
  if (status === "error") {
    return (
      <ErrorState
        message={error?.message ?? "Something went wrong loading your profile."}
        onRetry={refetch}
      />
    );
  }
  if (!member) return <SkeletonState />;

  const display = override ?? member;

  return (
    <ProfileView
      member={display}
      isOwner={true}
      onMemberUpdated={(next) => setOverride(next)}
    />
  );
}

function SignedOutState() {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        Member profile
      </p>
      <h1 className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6">
        Sign in to view your profile.
      </h1>
      <p className="text-lg text-neutral-600 leading-relaxed mb-10 max-w-xl mx-auto">
        Your profile lives behind authentication. Sign in with your member
        account to view and edit it.
      </p>
      <Link
        to="/sign-in"
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
      >
        Sign in
      </Link>
    </article>
  );
}

function ProvisioningState() {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        One moment
      </p>
      <h1 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4">
        Setting up your account…
      </h1>
      <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
        We're finishing the handshake between WorkOS and our database. This
        usually takes a second or two.
      </p>
      <div
        className="mt-10 inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse"
        aria-hidden="true"
      />
    </article>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        Something broke
      </p>
      <h1 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4">
        We couldn't load your profile.
      </h1>
      <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto mb-8">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
      >
        Try again
      </button>
    </article>
  );
}

function SkeletonState() {
  return (
    <article className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-24 animate-pulse">
      <div className="h-3 w-32 bg-neutral-100 mb-6" />
      <div className="h-12 w-2/3 bg-neutral-100 mb-4" />
      <div className="h-5 w-1/2 bg-neutral-100 mb-12" />
      <hr className="border-neutral-200 mb-12" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="aspect-[4/5] w-full max-w-md bg-neutral-100 mb-8" />
        </div>
        <div className="lg:col-span-7">
          <div className="h-3 w-24 bg-neutral-100 mb-6" />
          <div className="h-4 w-full bg-neutral-100 mb-2" />
          <div className="h-4 w-full bg-neutral-100 mb-2" />
          <div className="h-4 w-4/5 bg-neutral-100" />
        </div>
      </div>
    </article>
  );
}
