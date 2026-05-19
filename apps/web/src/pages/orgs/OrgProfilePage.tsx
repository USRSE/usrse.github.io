import { Link, useParams } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganizations";
import { OrgLogo } from "@/components/profile/OrgLogo";
import { useAuth } from "@workos-inc/authkit-react";

const TYPE_LABELS: Record<string, string> = {
  university: "University",
  national_lab: "National Lab",
  agency: "Agency",
  company: "Company",
  nonprofit: "Nonprofit",
  external_resource: "External Resource",
  other: "Other",
};

export function OrgProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, notFound } = useOrganization(id);
  const { user } = useAuth();
  const isSignedIn = !!user;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-neutral-500">
        Loading…
      </div>
    );
  }
  if (notFound || error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Organization not found</h1>
        <p className="mt-2 text-neutral-600">
          This organization is no longer available or has been merged.
        </p>
        <Link to="/orgs" className="mt-4 inline-block text-purple-700 hover:underline">
          ← Back to the directory
        </Link>
      </div>
    );
  }

  const org = data.organization;
  const members = data.members;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        to="/orgs"
        className="text-sm text-neutral-500 hover:text-purple-700"
      >
        ← Organizations
      </Link>

      <header className="mt-4 flex items-start gap-6">
        <OrgLogo name={org.name} logoUrl={org.logoUrl} logoMarkUrl={org.logoMarkUrl} size="lg" />
        <div className="flex-1">
          {org.shortName && (
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {org.shortName}
            </div>
          )}
          <h1 className="text-3xl font-semibold text-neutral-900">{org.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
              {TYPE_LABELS[org.type] ?? org.type}
            </span>
            {org.country && <span>· {org.country}</span>}
            {org.isOrgMember && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                Member · {org.membershipTier}
              </span>
            )}
          </div>
          {org.url && (
            <a
              href={org.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-purple-700 hover:underline"
            >
              {org.url} ↗
            </a>
          )}
          {org.logoCredit && (
            <div className="mt-3 text-xs text-neutral-400">{org.logoCredit}</div>
          )}
        </div>
      </header>

      {org.description && (
        <p className="mt-8 max-w-prose text-neutral-700 leading-relaxed">
          {org.description}
        </p>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold">{members.totalCount} members</h2>
        {members.totalCount === 0 ? (
          <p className="mt-3 text-neutral-600">
            No US-RSE members are affiliated with this org yet.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.rows.map((m) => (
                <OrgMemberTile
                  key={m.userId}
                  slug={m.memberSlug}
                  displayName={m.displayName}
                  avatarUrl={m.avatarUrl}
                  role={m.role}
                  isPrimary={m.isPrimary}
                />
              ))}
              {!isSignedIn && members.hiddenCount > 0 && (
                <Link
                  to={`/sign-in?next=/orgs/${org.id}`}
                  className="flex items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 p-5 text-center text-sm text-neutral-600 hover:border-purple-500 hover:text-purple-700"
                >
                  <div>
                    <div className="font-semibold">+{members.hiddenCount} more members</div>
                    <div className="mt-1 text-xs">Sign in to see the full roster</div>
                  </div>
                </Link>
              )}
            </div>
            {isSignedIn && members.hiddenCount > 0 && (
              <p className="mt-4 text-xs text-neutral-500">
                {members.hiddenCount} members have private profiles.
              </p>
            )}
          </>
        )}
      </section>

      {org.sponsoredEvents.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Sponsorships</h2>
          <ul className="mt-4 divide-y divide-neutral-200">
            {org.sponsoredEvents.map((s) => (
              <li key={s.eventId} className="py-3 flex justify-between text-sm">
                <Link
                  to={`/events/${s.eventId}`}
                  className="text-neutral-800 hover:text-purple-700"
                >
                  {s.eventName}
                </Link>
                <span className="text-neutral-500">
                  {s.tier} · {new Date(s.eventDate).getFullYear()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-16 rounded-xl bg-neutral-50 p-5 text-sm text-neutral-600">
        <strong className="text-neutral-800">Information out of date?</strong>{" "}
        Members can update their org affiliation from their profile. Org
        admins can request changes by emailing the contact email.
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal inline member tile — OrgProfileMember has a different shape from
// MemberSearchResult, so we can't reuse the shared MemberCard which expects
// the full search result. This tile is intentionally simple: avatar/initials
// hex + display name + role badge.
// ---------------------------------------------------------------------------

interface OrgMemberTileProps {
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  role: string | null;
  isPrimary: boolean;
}

function OrgMemberTile({ slug, displayName, avatarUrl, role, isPrimary }: OrgMemberTileProps) {
  const initials = initialsFor(displayName);
  return (
    <Link
      to={`/members/${slug}`}
      className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm hover:border-purple-400 hover:bg-neutral-50 transition-colors"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          className="w-10 h-10 rounded-full object-cover bg-neutral-100 ring-1 ring-neutral-200 shrink-0"
        />
      ) : (
        <TileInitialsHex initials={initials} />
      )}
      <div className="min-w-0">
        <div className="font-medium text-neutral-900 truncate">{displayName}</div>
        {(role || isPrimary) && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {isPrimary && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-purple-600">
                Primary
              </span>
            )}
            {role && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                {role}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function TileInitialsHex({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block w-10 h-10 shrink-0"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        <path
          d="M 50 4 L 92 27 L 92 73 L 50 96 L 8 73 L 8 27 Z"
          fill="#F5F4F8"
          stroke="#E5E2EC"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="32"
          fontWeight={600}
          fill="#7B5FBF"
          letterSpacing={1}
        >
          {initials}
        </text>
      </svg>
    </span>
  );
}

function initialsFor(displayName: string): string {
  const source = displayName.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
