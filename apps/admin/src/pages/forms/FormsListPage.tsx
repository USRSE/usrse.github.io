import { useState } from "react";
import { Link } from "react-router-dom";
import { useFormsList } from "../../hooks/useForms";

const STATUS_OPTIONS = [
  "", "draft", "in_review", "changes_requested", "rejected",
  "published", "expired", "archived",
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  published: "Published",
  expired: "Expired",
  archived: "Archived",
};

const ENTITY_LABEL: Record<string, string> = {
  event: "Event",
  announcement: "Announcement",
  group: "Group",
};

export function FormsListPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const { data, error, loading } = useFormsList({
    status: statusFilter || undefined,
    q: query || undefined,
  });

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Forms</p>
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          Forms
        </h2>
        <Link
          to="/admin/forms/new"
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm no-underline shadow-sm hover:bg-purple-600"
        >
          + New form
        </Link>
      </div>

      <div className="flex gap-4 mb-8">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border admin-input"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? STATUS_LABEL[s] : "All statuses"}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border admin-input"
        />
      </div>

      {error && (
        <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {error}
        </p>
      )}
      {loading && <p className="admin-marginalia">Loading…</p>}

      {data && data.length === 0 && (
        <p className="admin-marginalia">No forms match the filters.</p>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y" style={{ borderColor: "var(--admin-rule)" }}>
          {data.map((f) => {
            const attached =
              f.entityType && f.entityId
                ? `${ENTITY_LABEL[f.entityType] ?? f.entityType}: ${f.entityId}`
                : "—";
            return (
              <li key={f.id} className="py-4">
                <Link to={`/admin/forms/${f.id}`} className="block hover:bg-gray-50 -mx-3 px-3 py-2 rounded-md">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-semibold">{f.title}</span>
                    <span className="admin-classification">{STATUS_LABEL[f.status] ?? f.status}</span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="admin-classification">{f.scope}</span>
                    <span className="admin-classification">{attached}</span>
                    <span className="admin-classification">
                      {f.acceptsSubmissions ? "accepting submissions" : "submissions closed"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
