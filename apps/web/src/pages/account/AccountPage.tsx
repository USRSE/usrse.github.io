import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import {
  useCurrentMember,
  type CurrentMember,
} from "@/hooks/useCurrentMember";
import { useInView } from "@/hooks/useInView";

/* ── Helpers ────────────────────────────────────────────────────────── */

function initialsFor(displayName: string | undefined, email: string): string {
  const source = (displayName || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatJoinedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function composeLocation(
  publicLocation: string | null | undefined,
  city: string | null | undefined,
  region: string | null | undefined
): string | null {
  if (publicLocation && publicLocation.trim()) return publicLocation;
  const parts = [city, region].filter(
    (s): s is string => typeof s === "string" && s.trim().length > 0
  );
  return parts.length ? parts.join(", ") : null;
}

interface ContactLink {
  label: string;
  href: string;
}

function buildContactLinks(member: CurrentMember): ContactLink[] {
  const p = member.profile;
  if (!p) return [];
  const out: ContactLink[] = [];
  if (p.websiteUrl) out.push({ label: "Website", href: p.websiteUrl });
  if (p.githubUrl) out.push({ label: "GitHub", href: p.githubUrl });
  if (p.linkedinUrl) out.push({ label: "LinkedIn", href: p.linkedinUrl });
  if (p.orcid)
    out.push({ label: "ORCID", href: `https://orcid.org/${p.orcid}` });
  return out;
}

/* ── Top-level page ─────────────────────────────────────────────────── */

export function AccountPage() {
  const { user: workosUser, isLoading: authLoading } = useAuth();
  const { status, member, error, refetch } = useCurrentMember();

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

  return <ProfileView member={member} />;
}

/* ── The view ───────────────────────────────────────────────────────── */

function ProfileView({ member }: { member: CurrentMember }) {
  const { ref: heroRef, isInView: heroInView } = useInView(0.1);
  const { ref: dossierRef, isInView: dossierInView } = useInView(0.1);
  const { ref: bioRef, isInView: bioInView } = useInView(0.1);

  const profile = member.profile;
  const displayName = profile?.displayName ?? member.email.split("@")[0];
  const headline = profile?.headline ?? null;
  const bio = profile?.bio ?? null;
  const photoUrl = profile?.photoUrl ?? null;
  const slug = profile?.slug ?? null;
  const jobTitle = profile?.jobTitle ?? null;
  const location = profile
    ? composeLocation(profile.publicLocation, null, null)
    : null;
  const contactLinks = useMemo(() => buildContactLinks(member), [member]);
  const initials = initialsFor(profile?.displayName, member.email);

  const profileEmpty =
    !profile ||
    (!profile.bio &&
      !profile.headline &&
      !profile.jobTitle &&
      !profile.photoUrl &&
      contactLinks.length === 0);

  return (
    <article className="bg-white">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header
        ref={heroRef}
        className={`max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-10 lg:pb-16 ${
          heroInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          {slug ? <>01 &nbsp;·&nbsp; member &nbsp;·&nbsp; {slug}</> : "01 · member"}
        </p>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-4xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.05] text-balance">
              {displayName}
            </h1>
            {headline && (
              <p className="mt-5 text-lg lg:text-xl text-neutral-600 leading-relaxed max-w-3xl">
                {headline}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 border border-neutral-200">
              {member.role.replace("_", " ")}
            </span>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border border-purple-200 text-purple-700 bg-purple-50/40 cursor-not-allowed opacity-70"
              title="Profile editor coming soon"
            >
              Edit profile
              <span className="font-mono text-[9px] uppercase tracking-wider text-purple-500">
                soon
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 lg:pb-32">
        <hr className="border-neutral-200 mb-12 lg:mb-16" />

        {profileEmpty ? (
          <EmptyProfileNudge memberCreatedAt={member.createdAt} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* ── Left rail: photo + identity dossier ───────────── */}
            <aside
              ref={dossierRef}
              className={`lg:col-span-5 ${
                dossierInView ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <Portrait photoUrl={photoUrl} initials={initials} />

              <Dossier
                rows={[
                  jobTitle ? { label: "Role", value: jobTitle } : null,
                  location ? { label: "Location", value: location } : null,
                  member.createdAt
                    ? {
                        label: "Member since",
                        value: formatJoinedDate(member.createdAt),
                      }
                    : null,
                ].filter(
                  (r): r is { label: string; value: string } => r !== null
                )}
              />

              {contactLinks.length > 0 && (
                <ContactLinks links={contactLinks} />
              )}
            </aside>

            {/* ── Right column: about + visibility ──────────────── */}
            <main
              ref={bioRef}
              className={`lg:col-span-7 ${
                bioInView ? "animate-slide-up" : "opacity-0"
              }`}
            >
              {bio ? (
                <Section eyebrow="About" number="02">
                  <p className="text-base lg:text-lg text-neutral-700 leading-relaxed whitespace-pre-line">
                    {bio}
                  </p>
                </Section>
              ) : (
                <Section eyebrow="About" number="02">
                  <p className="text-neutral-400 italic">
                    No bio yet.
                  </p>
                </Section>
              )}

              {profile && <VisibilityPanel profile={profile} />}

              <AccountPanel member={member} />
            </main>
          </div>
        )}
      </div>
    </article>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function Portrait({
  photoUrl,
  initials,
}: {
  photoUrl: string | null;
  initials: string;
}) {
  return (
    <div className="relative aspect-[4/5] w-full max-w-md mb-10 group overflow-hidden border border-neutral-200">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-teal-50">
          <span className="font-display text-7xl lg:text-8xl font-bold text-purple-700/80 tracking-tight">
            {initials}
          </span>
        </div>
      )}
      <span className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white/90 mix-blend-difference">
        Portrait
      </span>
    </div>
  );
}

interface DossierRow {
  label: string;
  value: string;
}

function Dossier({ rows }: { rows: DossierRow[] }) {
  if (rows.length === 0) return null;
  return (
    <dl className="border-y border-neutral-200 divide-y divide-neutral-100">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-3 gap-4 py-3"
        >
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 self-center">
            {row.label}
          </dt>
          <dd className="col-span-2 text-sm text-neutral-800 self-center">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ContactLinks({ links }: { links: ContactLink[] }) {
  return (
    <div className="mt-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
        Contact
      </p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-baseline gap-3 text-base text-neutral-800 hover:text-purple-700 transition-colors"
            >
              <span className="font-mono text-xs text-neutral-400 group-hover:text-purple-500 transition-colors">
                →
              </span>
              <span className="border-b border-neutral-300 group-hover:border-purple-500 transition-colors pb-0.5">
                {l.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({
  eyebrow,
  number,
  children,
}: {
  eyebrow: string;
  number: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
          {number}
        </span>
        <span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
          {eyebrow}
        </h2>
      </div>
      {children}
    </section>
  );
}

function VisibilityPanel({
  profile,
}: {
  profile: NonNullable<CurrentMember["profile"]>;
}) {
  const items: { label: string; on: boolean; description: string }[] = [
    {
      label: "Public profile",
      on: profile.isPublic,
      description: profile.isPublic
        ? "Anyone can find this profile in the directory."
        : "Hidden from the directory.",
    },
    {
      label: "Map pin",
      on: profile.showOnMap,
      description: profile.showOnMap
        ? "Location is shown on the community map."
        : "Not shown on the community map.",
    },
  ];
  return (
    <Section eyebrow="Visibility" number="03">
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-start gap-4 py-2"
          >
            <span
              aria-hidden="true"
              className={`mt-1.5 inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                item.on ? "bg-teal-500" : "bg-neutral-300"
              }`}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                {item.label}{" "}
                <span
                  className={`ml-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                    item.on ? "text-teal-700" : "text-neutral-400"
                  }`}
                >
                  {item.on ? "On" : "Off"}
                </span>
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed mt-0.5">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function AccountPanel({ member }: { member: CurrentMember }) {
  const { signOut } = useAuth();
  return (
    <Section eyebrow="Account" number="04">
      <dl className="border-y border-neutral-200 divide-y divide-neutral-100 mb-8">
        <div className="grid grid-cols-3 gap-4 py-3">
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 self-center">
            Email
          </dt>
          <dd className="col-span-2 text-sm text-neutral-800 break-all self-center">
            {member.email}
          </dd>
        </div>
        <div className="grid grid-cols-3 gap-4 py-3">
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 self-center">
            Marketing
          </dt>
          <dd className="col-span-2 text-sm text-neutral-800 self-center">
            {member.marketingConsent ? "Opted in" : "Not subscribed"}
          </dd>
        </div>
        {member.isLegacyImport && (
          <div className="grid grid-cols-3 gap-4 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 self-center">
              Origin
            </dt>
            <dd className="col-span-2 text-sm text-neutral-800 self-center">
              Imported from legacy roster
            </dd>
          </div>
        )}
      </dl>

      <button
        onClick={() => signOut()}
        className="text-sm font-semibold text-neutral-700 hover:text-purple-700 transition-colors"
      >
        Sign out
      </button>
    </Section>
  );
}

/* ── States ─────────────────────────────────────────────────────────── */

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
          <div className="h-3 w-24 bg-neutral-100 mb-3" />
          <div className="h-3 w-full bg-neutral-100 mb-3" />
          <div className="h-3 w-2/3 bg-neutral-100" />
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

function EmptyProfileNudge({ memberCreatedAt }: { memberCreatedAt: string }) {
  return (
    <section className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        First time here
      </p>
      <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6 text-balance">
        Your account is set up. Now let's introduce you to the community.
      </h2>
      <p className="text-base lg:text-lg text-neutral-600 leading-relaxed mb-10">
        Add your bio, affiliation, and links so other members can find you.
        You're in control — public or hidden, on the map or off, your call.
      </p>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400 mb-3">
        Joined {formatJoinedDate(memberCreatedAt)}
      </p>
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-500 text-white font-semibold cursor-not-allowed opacity-70"
      >
        Set up your profile
        <span className="font-mono text-[9px] uppercase tracking-wider text-white/80">
          soon
        </span>
      </button>
    </section>
  );
}
