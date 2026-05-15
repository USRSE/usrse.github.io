import { Link } from "react-router-dom";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useGroups } from "@/hooks/useGroups";

export function RegionalGroupsPage() {
  const { rows, loading, error } = useGroups("regional_group");

  return (
    <CommunityLayout
      title="Regional Groups"
      subtitle="Local US-RSE communities organized by geography."
    >
      {loading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-700">{error}</p>}

      {rows && rows.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-md">
          <p className="text-gray-700 mb-3">
            Regional groups are coming soon. Interested in starting one in your
            area?
          </p>
          <p className="text-sm text-gray-500">
            <a
              href="mailto:info@us-rse.org"
              className="text-purple-700 underline"
            >
              Get in touch →
            </a>
          </p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-6">
          {rows.map((g) => (
            <li
              key={g.id}
              className="border border-gray-200 rounded-md p-6"
            >
              <h2 className="text-xl font-semibold mb-2">{g.name}</h2>
              {g.description && (
                <p className="text-sm text-gray-700 mb-4">{g.description}</p>
              )}
              <Link
                to={`/community/groups/${g.id}`}
                className="text-purple-700 text-sm underline"
              >
                View →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CommunityLayout>
  );
}
