import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { formatMemberId } from "@/lib/member-id";
import { usePublicMember } from "@/hooks/usePublicMember";
import {
  useCurrentMember,
  type CurrentMember,
} from "@/hooks/useCurrentMember";
import { ProfileView } from "@/pages/account/ProfileView";

export function MemberPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const previewAsPublic = searchParams.get("view") === "public";
  const { status, member, privateStub, error } = usePublicMember(slug);
  const current = useCurrentMember();
  const { user: workosUser, isLoading: authLoading } = useAuth();
  const [override, setOverride] = useState<CurrentMember | null>(null);

  if (status === "loading") return <SkeletonState />;

  // Before rendering a private stub we need to know whether the
  // viewer is the owner — otherwise an owner whose `/me` hasn't
  // fired yet would briefly see the visitor stub of their own
  // profile and conclude they're locked out. Wait if (a) WorkOS auth
  // is still loading, or (b) we have a signed-in WorkOS user but
  // the membership lookup hasn't reached a terminal state.
  if (status === "private") {
    if (authLoading) return <SkeletonState />;
    if (
      workosUser &&
      current.status !== "ready" &&
      current.status !== "error"
    ) {
      return <SkeletonState />;
    }
  }

  if (status === "error") {
    return (
      <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          Something broke
        </p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4">
          We couldn't load that profile.
        </h1>
        <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
          {error?.message ?? "Unknown error"}
        </p>
      </article>
    );
  }

  // Owner detection: signed-in user's profile slug matches the slug
  // being viewed. When that's true, render the richer CurrentMember
  // (which carries fields the public payload doesn't) so the inline
  // editors have everything they need, and let edits flow back via
  // the override state so saves are reflected without a refetch.
  const isActualOwner =
    current.status === "ready" &&
    current.member !== null &&
    current.member.profile?.slug === slug;

  // ?view=public lets the owner see exactly what a visitor sees:
  // public payload (no email/marketing fields), no edit affordances.
  // The banner below lets them flip back without losing the URL.
  const isPreviewing = isActualOwner && previewAsPublic;
  const isOwner = isActualOwner && !previewAsPublic;

  // Private profile branch. The owner (when not previewing) still
  // gets their full editable dossier — privacy is about what others
  // see, not a lockout on the owner's own page. Visitors and owners
  // who are previewing get the stub.
  if (status === "private" && privateStub) {
    if (isOwner && current.member) {
      const ownerMember = override ?? current.member;
      return (
        <ProfileView
          member={ownerMember}
          isOwner
          onMemberUpdated={(next) => setOverride(next)}
        />
      );
    }
    return (
      <>
        {isPreviewing && <PreviewBanner slug={slug} />}
        <PrivateStubPage
          memberId={privateStub.memberId}
          displayName={privateStub.displayName}
        />
      </>
    );
  }

  if (status === "not_found" || !member) {
    return (
      <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          404 · member not found
        </p>
        <h1 className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6">
          We couldn't find that profile.
        </h1>
        <p className="text-lg text-neutral-600 leading-relaxed mb-10 max-w-xl mx-auto">
          The slug <code className="font-mono text-purple-700">/{slug}</code>{" "}
          doesn't match a public profile. They may have made it private or the
          link may be wrong.
        </p>
        <Link
          to="/resources/directory"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
        >
          Browse the directory
        </Link>
      </article>
    );
  }

  const displayMember =
    isOwner && current.member ? override ?? current.member : member;

  return (
    <>
      {isPreviewing && <PreviewBanner slug={slug} />}
      <ProfileView
        member={displayMember}
        isOwner={isOwner}
        onMemberUpdated={isOwner ? (next) => setOverride(next) : undefined}
      />
    </>
  );
}

function PrivateStubPage({
  memberId,
  displayName,
}: {
  memberId: string;
  displayName: string;
}) {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        Private profile
      </p>
      <h1 className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6 text-balance">
        {displayName}
      </h1>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full border border-neutral-200 mb-8">
        <span className="text-xs font-medium text-neutral-700 tracking-wide uppercase font-mono">
          Member · {formatMemberId(memberId)}
        </span>
      </div>
      <p className="text-lg text-neutral-600 leading-relaxed mb-10 max-w-xl mx-auto">
        This member has chosen to keep their profile private.
      </p>
      <Link
        to="/resources/directory"
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
      >
        Browse the directory
      </Link>
    </article>
  );
}

function PreviewBanner({ slug }: { slug: string | undefined }) {
  return (
    <div className="bg-purple-950 text-white border-b border-purple-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
          <span className="text-teal-300">●</span> Previewing as public
          <span className="hidden sm:inline text-white/40">
            {" "}
            · this is what visitors see at /members/{slug}
          </span>
        </p>
        <Link
          to={`/members/${slug}`}
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/80 hover:text-teal-300 transition-colors whitespace-nowrap"
        >
          Exit preview ↗
        </Link>
      </div>
    </div>
  );
}

function SkeletonState() {
  return (
    <article className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-24 animate-pulse">
      <div className="h-3 w-32 bg-neutral-100 mb-6" />
      <div className="h-12 w-2/3 bg-neutral-100 mb-4" />
      <div className="h-5 w-1/2 bg-neutral-100 mb-12" />
      <hr className="border-neutral-200 mb-12" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <div className="aspect-[4/5] w-full max-w-md bg-neutral-100" />
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
