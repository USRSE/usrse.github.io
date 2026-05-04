import { Link, useParams } from "react-router-dom";
import { usePublicMember } from "@/hooks/usePublicMember";
import { ProfileView } from "@/pages/account/ProfileView";

export function MemberPage() {
  const { slug } = useParams<{ slug: string }>();
  const { status, member, error } = usePublicMember(slug);

  if (status === "loading") return <SkeletonState />;

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

  return <ProfileView member={member} isOwner={false} />;
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
