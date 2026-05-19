import { Link } from "react-router-dom";
import { OrgLogo } from "@/components/profile/OrgLogo";
import type { OrgRow } from "@/hooks/useOrganizations";

const TYPE_LABELS: Record<string, string> = {
  university: "University",
  national_lab: "National Lab",
  agency: "Agency",
  company: "Company",
  nonprofit: "Nonprofit",
  external_resource: "External Resource",
  other: "Other",
};

export function OrgCard({ org }: { org: OrgRow }) {
  return (
    <Link
      to={`/orgs/${org.id}`}
      className="group block rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-purple-400 hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <OrgLogo
          name={org.name}
          slug={org.shortName ?? org.name.toLowerCase()}
          logoUrl={org.logoUrl}
          logoMarkUrl={org.logoMarkUrl}
          size="md"
        />
        <div className="flex-1 min-w-0">
          {org.shortName && (
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {org.shortName}
            </div>
          )}
          <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-purple-700 truncate">
            {org.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
              {TYPE_LABELS[org.type] ?? org.type}
            </span>
            {org.country && <span>· {org.country}</span>}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
            <span>{org.memberCount} members</span>
            {org.isOrgMember && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-800">
                Member
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
