import { useParams } from "react-router-dom";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useGroup } from "@/hooks/useGroups";

const TYPE_LABELS: Record<string, string> = {
  working_group: "Working group",
  affinity_group: "Affinity group",
  regional_group: "Regional group",
};

export function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const { group, loading, error, notFound } = useGroup(id);

  if (loading) {
    return (
      <CommunityLayout title="Loading…">
        <p className="text-gray-500">Loading…</p>
      </CommunityLayout>
    );
  }
  if (notFound) {
    return (
      <CommunityLayout title="Group not found">
        <p className="text-gray-600">
          This group may have been archived or unpublished.{" "}
          <a
            href="/community/working-groups"
            className="text-purple-700 underline"
          >
            Browse working groups →
          </a>
        </p>
      </CommunityLayout>
    );
  }
  if (error || !group) {
    return (
      <CommunityLayout title="Group">
        <p className="text-red-700">
          {error ?? "Group temporarily unavailable."}
        </p>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout
      title={group.name}
      subtitle={group.description ?? undefined}
    >
      <p className="text-sm uppercase tracking-wider text-gray-500 mb-8">
        {TYPE_LABELS[group.type] ?? group.type}
      </p>

      {group.charter && (
        <div className="prose max-w-2xl mb-12 whitespace-pre-wrap">
          {group.charter}
        </div>
      )}

      {group.slackChannel && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
            Slack
          </p>
          <p className="font-mono text-sm">#{group.slackChannel}</p>
        </div>
      )}

      {group.chairs.length > 0 && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Chairs
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {group.chairs.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                {c.photoUrl ? (
                  <img
                    src={c.photoUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-gray-200 inline-block" />
                )}
                <span className="text-sm">{c.displayName ?? "Chair"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {group.links.length > 0 && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Links
          </p>
          <ul className="space-y-1">
            {group.links.map((l, i) => (
              <li key={i}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-700 underline"
                >
                  {l.label} →
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CommunityLayout>
  );
}
