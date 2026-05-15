import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { NewGroupModal } from "./NewGroupModal";

type GroupType = "working_group" | "affinity_group" | "regional_group";
type StatusFilter = "active" | "archived" | "all";
type VisibilityFilter = "all" | "published" | "draft";

interface GroupRow {
  id: string;
  name: string;
  slug: string;
  type: GroupType;
  description: string | null;
  isActive: boolean;
  isPublished: boolean;
  slackChannel: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  memberCount: number;
  chairCount: number;
}

interface ListResponse {
  ok: true;
  rows: GroupRow[];
  counts: { total: number; active: number; draft: number; archived: number };
}

const TYPE_LABELS: Record<GroupType | "all", string> = {
  all: "All kinds",
  working_group: "Working",
  affinity_group: "Affinity",
  regional_group: "Regional",
};

export function GroupsListPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const typeFilter = (params.get("type") ?? "all") as GroupType | "all";
  const status = (params.get("status") ?? "active") as StatusFilter;
  const visibility = (params.get("visibility") ?? "all") as VisibilityFilter;

  const load = useCallback(async () => {
    setError(null);
    const sp = new URLSearchParams({ status, visibility });
    if (typeFilter !== "all") sp.set("type", typeFilter);
    try {
      const res = await apiFetch(`/admin/groups?${sp}`);
      if (!res.ok) {
        setError(`/admin/groups responded ${res.status}`);
        return;
      }
      setData((await res.json()) as ListResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, typeFilter, status, visibility]);

  useEffect(() => { void load(); }, [load]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    const isDefault =
      (name === "type" && value === "all") ||
      (name === "status" && value === "active") ||
      (name === "visibility" && value === "all");
    if (value && !isDefault) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Groups</p>
      <div className="flex items-baseline justify-between gap-6 mb-2">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          Groups.
        </h2>
        {actor.systemTier >= 2 && (
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600"
          >
            + New group
          </button>
        )}
      </div>
      {data && (
        <p className="admin-classification mb-8">
          {data.counts.active} active · {data.counts.draft} draft ·{" "}
          {data.counts.archived} archived
        </p>
      )}

      <div className="flex items-baseline gap-6 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setParam("type", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="all">All kinds</option>
          <option value="working_group">Working</option>
          <option value="affinity_group">Affinity</option>
          <option value="regional_group">Regional</option>
        </select>
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <select
          value={visibility}
          onChange={(e) => setParam("visibility", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none ml-auto"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="all">Any visibility</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div>
        <div
          className="grid grid-cols-[3rem_minmax(0,1fr)_6rem_minmax(0,1fr)_5rem_5rem_6rem_auto] gap-6 items-baseline py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--admin-ink)", borderBottom: "1px solid var(--admin-rule)" }}
        >
          <span className="admin-classification">#</span>
          <span className="admin-classification">Name</span>
          <span className="admin-classification">Type</span>
          <span className="admin-classification">Slack</span>
          <span className="admin-classification text-right">Chairs</span>
          <span className="admin-classification text-right">Members</span>
          <span className="admin-classification">Visibility</span>
          <span className="admin-classification text-right">Open →</span>
        </div>
        {data?.rows.map((r, i) => (
          <Link
            key={r.id}
            to={`/groups/${r.id}`}
            className="grid grid-cols-[3rem_minmax(0,1fr)_6rem_minmax(0,1fr)_5rem_5rem_6rem_auto] gap-6 items-baseline py-3 text-[14px] transition-colors hover:bg-[var(--admin-paper-edge)]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            <span className="truncate" style={{ color: "var(--admin-ink)" }}>
              {r.name}
              {!r.isActive && (
                <span className="admin-marginalia ml-2" style={{ color: "var(--color-danger-700)" }}>
                  · archived
                </span>
              )}
            </span>
            <span className="admin-marginalia">{TYPE_LABELS[r.type]}</span>
            <span className="truncate font-mono text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
              {r.slackChannel ? `#${r.slackChannel}` : "—"}
            </span>
            <span className="text-right tabular-nums" style={{ color: "var(--admin-ink)" }}>{r.chairCount}</span>
            <span className="text-right tabular-nums" style={{ color: "var(--admin-ink-medium)" }}>{r.memberCount}</span>
            <span
              className="admin-classification"
              style={{
                color: r.isPublished ? "var(--color-success-700)" : "var(--admin-marginalia)",
              }}
            >
              {r.isPublished ? "Published" : "Draft"}
            </span>
            <span className="admin-classification text-right" style={{ color: "var(--admin-ribbon)" }}>
              Open →
            </span>
          </Link>
        ))}
        {data && data.rows.length === 0 && (
          <p className="py-6 text-center italic" style={{ color: "var(--admin-marginalia)" }}>
            No groups match.
          </p>
        )}
      </div>

      {showNewModal && (
        <NewGroupModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false);
            void load();
          }}
        />
      )}
    </div>
  );
}
