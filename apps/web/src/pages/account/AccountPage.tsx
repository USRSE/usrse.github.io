import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import {
  useCurrentMember,
  type CurrentMember,
} from "@/hooks/useCurrentMember";
import { SectionFrame } from "@/components/profile/SectionFrame";
import {
  ProfileSidebar,
  type SidebarSection,
} from "@/components/profile/ProfileSidebar";

const SETTINGS_SECTIONS: SidebarSection[] = [
  { id: "section-01", number: "01", label: "Identity" },
  { id: "section-02", number: "02", label: "Notifications" },
  { id: "section-03", number: "03", label: "Profile" },
  { id: "section-04", number: "04", label: "Danger zone" },
];

export function AccountPage() {
  const { user: workosUser, isLoading: authLoading } = useAuth();
  const { status, member, error, refetch } = useCurrentMember();

  if (authLoading || status === "loading") return <SkeletonState />;
  if (status === "idle" || !workosUser) return <SignedOutState />;
  if (status === "provisioning") return <ProvisioningState />;
  if (status === "error") {
    return (
      <ErrorState
        message={error?.message ?? "Something went wrong loading your account."}
        onRetry={refetch}
      />
    );
  }
  if (!member) return <SkeletonState />;

  return <AccountSettings member={member} />;
}

function AccountSettings({ member }: { member: CurrentMember }) {
  const { signOut } = useAuth();
  const profileSlug = member.profile?.slug ?? null;

  return (
    <article className="bg-white">
      {/* Hero — compact gradient band, mirrors AboutLayout. */}
      <div className="bg-gradient-to-br from-purple-950 via-purple-800 to-purple-600 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <nav aria-label="Breadcrumb" className="mb-6 animate-fade-in">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li className="text-white/30">/</li>
              <li>
                <span className="text-white/90 font-medium">Account</span>
              </li>
            </ol>
          </nav>
          <h1
            className="font-display text-4xl lg:text-5xl font-bold text-white tracking-tight animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            Account settings
          </h1>
          <p
            className="mt-4 text-lg text-white/60 max-w-2xl leading-relaxed animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            Manage how your account works on US-RSE. Your public dossier lives
            on your profile — this page is for the rest.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <ProfileSidebar sections={SETTINGS_SECTIONS} />
          <div className="flex-1 min-w-0 max-w-3xl">
            {/* 01 · Identity */}
            <SectionFrame number="01" eyebrow="Identity" accent="purple">
              <SettingsCard>
                <SettingsRow
                  label="Email"
                  value={member.email}
                  action={<StubEdit />}
                />
                <SettingsRow
                  label="Member ID"
                  value={member.memberId}
                  hint="Your stable internal identifier."
                />
                {member.isLegacyImport && (
                  <SettingsRow
                    label="Origin"
                    value="Imported from legacy roster"
                  />
                )}
              </SettingsCard>
            </SectionFrame>

            {/* 02 · Notifications */}
            <SectionFrame number="02" eyebrow="Notifications" accent="teal">
              <SettingsCard>
                <SettingsRow
                  label="Marketing emails"
                  value={member.marketingConsent ? "Subscribed" : "Not subscribed"}
                  hint="Occasional newsletters about US-RSE news and events."
                  action={<StubEdit />}
                />
              </SettingsCard>
            </SectionFrame>

            {/* 03 · Profile */}
            <SectionFrame number="03" eyebrow="Profile" accent="amber">
              <SettingsCard>
                <SettingsRow
                  label="Public profile"
                  value={profileSlug ? `/members/${profileSlug}` : "Not yet public"}
                  hint="Where the rest of US-RSE finds you."
                  action={
                    profileSlug ? (
                      <Link
                        to={`/members/${profileSlug}`}
                        className="font-mono text-[11px] uppercase tracking-[0.25em] text-purple-600 hover:text-purple-800 transition-colors whitespace-nowrap"
                      >
                        view →
                      </Link>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 whitespace-nowrap">
                        not yet public
                      </span>
                    )
                  }
                />
              </SettingsCard>
            </SectionFrame>

            {/* 04 · Danger zone */}
            <SectionFrame number="04" eyebrow="Danger zone" accent="neutral">
              <SettingsCard>
                <SettingsRow
                  label="Sign out"
                  value="End this session in this browser."
                  action={
                    <button
                      onClick={() => signOut()}
                      className="font-mono text-[11px] uppercase tracking-[0.25em] text-neutral-500 hover:text-purple-700 transition-colors whitespace-nowrap"
                    >
                      ↩ sign out
                    </button>
                  }
                />
              </SettingsCard>
            </SectionFrame>
          </div>
        </div>
      </div>
    </article>
  );
}

function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden">
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  value,
  hint,
  action,
}: {
  label: string;
  value: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr_auto] gap-3 sm:gap-5 px-5 lg:px-6 py-5 items-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <div className="min-w-0">
        <p className="text-sm text-neutral-900 break-all">{value}</p>
        {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
      </div>
      {action && (
        <div className="justify-self-start sm:justify-self-end">{action}</div>
      )}
    </div>
  );
}

function StubEdit() {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 whitespace-nowrap">
      ✎ soon
    </span>
  );
}

function SignedOutState() {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        Account settings
      </p>
      <h1 className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6">
        Sign in to manage your account.
      </h1>
      <p className="text-lg text-neutral-600 leading-relaxed mb-10 max-w-xl mx-auto">
        Account settings live behind authentication. Sign in with your member
        account to view and update them.
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
        We couldn't load your account.
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
      <div className="space-y-6">
        <div className="h-24 w-full bg-neutral-100 rounded-2xl" />
        <div className="h-24 w-full bg-neutral-100 rounded-2xl" />
        <div className="h-24 w-full bg-neutral-100 rounded-2xl" />
      </div>
    </article>
  );
}
