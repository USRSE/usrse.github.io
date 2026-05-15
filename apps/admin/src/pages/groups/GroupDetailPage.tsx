import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

type GroupType = "working_group" | "affinity_group" | "regional_group";
type Tab = "identity" | "content" | "roster" | "lifecycle";

interface GroupDetail {
  ok: true;
  group: {
    id: string;
    name: string;
    slug: string;
    type: GroupType;
    description: string | null;
    charter: string | null;
    slackChannel: string | null;
    links: Array<{ label: string; url: string }>;
    isActive: boolean;
    isPublished: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  members: Array<{
    userId: string;
    email: string;
    displayName: string | null;
    role: "member" | "chair" | "co_chair";
    joinedAt: string;
  }>;
  recentAudit: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }>;
}

const TYPE_LABELS: Record<GroupType, string> = {
  working_group: "Working group",
  affinity_group: "Affinity group",
  regional_group: "Regional group",
};

export function GroupDetailPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<GroupDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Identity draft state
  const [draftDescription, setDraftDescription] = useState("");
  const [draftSlackChannel, setDraftSlackChannel] = useState("");
  // Content draft state
  const [draftCharter, setDraftCharter] = useState("");
  const [draftLinks, setDraftLinks] = useState<Array<{ label: string; url: string }>>([]);
  // Roster picker state
  const [chairSearch, setChairSearch] = useState("");
  const [chairResults, setChairResults] = useState<
    Array<{ id: string; displayName: string | null; email: string }>
  >([]);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/groups/${id}`);
      if (!res.ok) {
        setError(`/admin/groups/${id} responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as GroupDetail;
      setData(body);
      setDraftDescription(body.group.description ?? "");
      setDraftSlackChannel(body.group.slackChannel ?? "");
      setDraftCharter(body.group.charter ?? "");
      setDraftLinks(body.group.links ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounced member search for the chair picker.
  useEffect(() => {
    const term = chairSearch.trim();
    if (term.length < 2) {
      setChairResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({ q: term, limit: "10", status: "active" });
        const res = await apiFetch(`/admin/users?${sp}`);
        if (!res.ok) return;
        const body = (await res.json()) as {
          rows: Array<{ id: string; displayName: string | null; email: string }>;
        };
        setChairResults(body.rows);
      } catch {
        /* silent — picker is a convenience */
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [apiFetch, chairSearch]);

  async function saveIdentity() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const body: Record<string, unknown> = {};
      if (draftDescription !== (data.group.description ?? "")) {
        body.description = draftDescription.trim() || null;
      }
      if (draftSlackChannel !== (data.group.slackChannel ?? "")) {
        body.slackChannel = draftSlackChannel.trim() || null;
      }
      if (Object.keys(body).length === 0) {
        setActing(false);
        return;
      }
      const res = await apiFetch(`/admin/groups/${data.group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function saveContent() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const cleanLinks = draftLinks.filter((l) => l.label.trim() && l.url.trim());
      const body: Record<string, unknown> = {};
      if (draftCharter !== (data.group.charter ?? "")) {
        body.charter = draftCharter.trim() || null;
      }
      if (JSON.stringify(cleanLinks) !== JSON.stringify(data.group.links)) {
        body.links = cleanLinks;
      }
      if (Object.keys(body).length === 0) {
        setActing(false);
        return;
      }
      const res = await apiFetch(`/admin/groups/${data.group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function assignChair(userId: string, role: "chair" | "co_chair") {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/groups/${data.group.id}/chairs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      setChairSearch("");
      setChairResults([]);
      await load();
    } finally {
      setActing(false);
    }
  }

  async function removeChair(userId: string) {
    if (!data) return;
    if (!window.confirm("Demote this chair to a regular member?")) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/groups/${data.group.id}/chairs/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `DELETE responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function togglePublish(makePublished: boolean) {
    if (!data) return;
    if (
      !makePublished &&
      !window.confirm("Unpublish this group? It will disappear from the public site immediately.")
    )
      return;
    setActing(true);
    setActionError(null);
    try {
      const path = makePublished ? "publish" : "unpublish";
      const res = await apiFetch(`/admin/groups/${data.group.id}/${path}`, { method: "POST" });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function toggleArchive(archive: boolean) {
    if (!data) return;
    if (
      archive &&
      !window.confirm(
        "Archive this group? It will be hidden from the public site and the default admin list."
      )
    )
      return;
    setActing(true);
    setActionError(null);
    try {
      const path = archive ? "archive" : "reopen";
      const res = await apiFetch(`/admin/groups/${data.group.id}/${path}`, { method: "POST" });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  // Render fallthrough until data loads
  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );
  if (!data) return <p className="admin-marginalia">Loading…</p>;

  const g = data.group;
  const isStaff = actor.systemTier >= 1;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">
        US-RSE · Admin · Groups · {TYPE_LABELS[g.type]}
      </p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {g.name}
      </h2>
      <div className="flex items-center gap-4 mb-10">
        <span className="admin-classification">{TYPE_LABELS[g.type]}</span>
        <span
          className="admin-classification"
          style={{
            color: g.isPublished ? "var(--color-success-700)" : "var(--admin-marginalia)",
          }}
        >
          {g.isPublished ? "Published" : "Draft"}
        </span>
        {!g.isActive && (
          <span className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
            Archived
          </span>
        )}
      </div>

      <nav
        className="flex items-baseline gap-8 mb-8"
        style={{ borderBottom: "1px solid var(--admin-rule)" }}
      >
        {(["identity", "content", "roster", "lifecycle"] as Tab[]).map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="pb-3 admin-classification transition-colors"
            style={{
              color: tab === t ? "var(--admin-ribbon)" : "var(--admin-ink-medium)",
              borderBottom: tab === t ? "2px solid var(--admin-ribbon)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            <span className="tabular-nums mr-2">{String(i + 1).padStart(2, "0")}</span>
            <span>
              {t === "identity"
                ? "Identity"
                : t === "content"
                  ? "Content"
                  : t === "roster"
                    ? "Roster + chairs"
                    : "Lifecycle + audit"}
            </span>
          </button>
        ))}
      </nav>

      {actionError && (
        <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {actionError}
        </p>
      )}

      {tab === "identity" && (
        <section className="max-w-2xl space-y-6">
          <EditorialInput
            label="Name"
            value={g.name}
            readOnly
            hint="Name is locked after create. Contact a super_admin to rename."
          />
          <EditorialInput
            label="Slug"
            value={g.slug}
            readOnly
            hint="Slug is locked. The permalink uses the group ID, not the slug."
          />
          <EditorialTextarea
            label="Short description"
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            rows={2}
            hint="One sentence shown on the public list card."
          />
          <EditorialInput
            label="Slack channel"
            value={draftSlackChannel}
            onChange={(e) => setDraftSlackChannel(e.target.value)}
            hint="Bare channel name, no leading #."
          />
          <button
            type="button"
            onClick={() => void saveIdentity()}
            disabled={acting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            {acting ? "Saving…" : "Save changes"}
          </button>
        </section>
      )}

      {tab === "content" && (
        <section className="max-w-3xl space-y-8">
          <EditorialTextarea
            label="Charter (markdown)"
            value={draftCharter}
            onChange={(e) => setDraftCharter(e.target.value)}
            rows={16}
            hint="Long-form purpose / governance text rendered on the public per-group page."
          />
          <div>
            <p className="admin-classification mb-3">Links</p>
            <div className="space-y-3">
              {draftLinks.map((l, i) => (
                <div key={i} className="flex items-baseline gap-3">
                  <input
                    type="text"
                    placeholder="Label"
                    value={l.label}
                    onChange={(e) => {
                      const next = [...draftLinks];
                      next[i] = { ...next[i], label: e.target.value };
                      setDraftLinks(next);
                    }}
                    className="font-mono text-[13px] py-1.5 outline-none bg-transparent flex-1 max-w-[12rem]"
                    style={{
                      borderBottom: "1px solid var(--admin-rule)",
                      color: "var(--admin-ink)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={l.url}
                    onChange={(e) => {
                      const next = [...draftLinks];
                      next[i] = { ...next[i], url: e.target.value };
                      setDraftLinks(next);
                    }}
                    className="font-mono text-[13px] py-1.5 outline-none bg-transparent flex-1"
                    style={{
                      borderBottom: "1px solid var(--admin-rule)",
                      color: "var(--admin-ink)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setDraftLinks(draftLinks.filter((_, j) => j !== i))}
                    className="admin-classification"
                    style={{ color: "var(--color-danger-700)" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDraftLinks([...draftLinks, { label: "", url: "" }])}
                className="admin-classification"
                style={{ color: "var(--admin-ribbon)" }}
              >
                + Add link
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void saveContent()}
            disabled={acting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            {acting ? "Saving…" : "Save content"}
          </button>
        </section>
      )}

      {tab === "roster" && (
        <section className="max-w-3xl space-y-8">
          {isStaff && (
            <div>
              <p className="admin-classification mb-3">Assign chair / co-chair</p>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={chairSearch}
                onChange={(e) => setChairSearch(e.target.value)}
                className="w-full max-w-lg font-mono text-[13px] py-1.5 outline-none bg-transparent"
                style={{
                  borderBottom: "1px solid var(--admin-rule)",
                  color: "var(--admin-ink)",
                }}
              />
              {chairResults.length > 0 && (
                <ul
                  className="mt-4 max-w-2xl"
                  style={{ borderTop: "1px solid var(--admin-rule-subtle)" }}
                >
                  {chairResults.map((r) => (
                    <li
                      key={r.id}
                      className="py-3 flex items-baseline justify-between gap-6"
                      style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
                    >
                      <span className="flex-1">
                        <span style={{ color: "var(--admin-ink)" }}>
                          {r.displayName ?? <em>no name</em>}
                        </span>
                        <span
                          className="font-mono text-[12px] ml-3"
                          style={{ color: "var(--admin-ink-medium)" }}
                        >
                          {r.email}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void assignChair(r.id, "chair")}
                        disabled={acting}
                        className="admin-classification disabled:opacity-50"
                        style={{ color: "var(--admin-ribbon)" }}
                      >
                        Add as chair
                      </button>
                      <button
                        type="button"
                        onClick={() => void assignChair(r.id, "co_chair")}
                        disabled={acting}
                        className="admin-classification disabled:opacity-50"
                        style={{ color: "var(--admin-ribbon)" }}
                      >
                        Add as co-chair
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <p className="admin-classification mb-3">Members ({data.members.length})</p>
            {data.members.length === 0 ? (
              <p className="italic" style={{ color: "var(--admin-marginalia)" }}>
                No members yet.
              </p>
            ) : (
              <ul style={{ borderTop: "1px solid var(--admin-rule)" }}>
                {data.members.map((m) => (
                  <li
                    key={m.userId}
                    className="py-3 flex items-baseline justify-between gap-6"
                    style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
                  >
                    <span className="flex-1">
                      <span style={{ color: "var(--admin-ink)" }}>
                        {m.displayName ?? <em>no name</em>}
                      </span>
                      <span
                        className="font-mono text-[12px] ml-3"
                        style={{ color: "var(--admin-ink-medium)" }}
                      >
                        {m.email}
                      </span>
                      <span
                        className="admin-marginalia ml-3"
                        style={{
                          color:
                            m.role === "chair"
                              ? "var(--admin-ribbon)"
                              : m.role === "co_chair"
                                ? "var(--admin-mark)"
                                : "var(--admin-marginalia)",
                        }}
                      >
                        {m.role.replace("_", "-")}
                      </span>
                    </span>
                    {(m.role === "chair" || m.role === "co_chair") && isStaff && (
                      <button
                        type="button"
                        onClick={() => void removeChair(m.userId)}
                        disabled={acting}
                        className="admin-classification disabled:opacity-50"
                        style={{ color: "var(--color-danger-700)" }}
                      >
                        Demote to member ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {tab === "lifecycle" && (
        <section className="max-w-3xl space-y-10">
          <div>
            <p className="admin-classification mb-3">Visibility</p>
            <div className="flex items-baseline gap-4">
              <p className="text-[14px]" style={{ color: "var(--admin-ink-medium)" }}>
                Currently:{" "}
                <span
                  style={{
                    color: g.isPublished
                      ? "var(--color-success-700)"
                      : "var(--admin-marginalia)",
                  }}
                >
                  {g.isPublished ? "Published" : "Draft"}
                </span>
              </p>
              <button
                type="button"
                onClick={() => void togglePublish(!g.isPublished)}
                disabled={acting}
                className="admin-classification disabled:opacity-50"
                style={{ color: "var(--admin-ribbon)" }}
              >
                {g.isPublished ? "Unpublish →" : "Publish →"}
              </button>
              {g.isPublished && (
                <a
                  href={`/community/groups/${g.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-classification ml-auto"
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  View public page →
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="admin-classification mb-3">Lifecycle</p>
            <div className="flex items-baseline gap-4">
              <p className="text-[14px]" style={{ color: "var(--admin-ink-medium)" }}>
                Currently:{" "}
                <span
                  style={{
                    color: g.isActive ? "var(--admin-ink)" : "var(--color-danger-700)",
                  }}
                >
                  {g.isActive ? "Active" : "Archived"}
                </span>
              </p>
              {g.isActive ? (
                <button
                  type="button"
                  onClick={() => void toggleArchive(true)}
                  disabled={acting}
                  className="admin-classification disabled:opacity-50"
                  style={{ color: "var(--color-danger-700)" }}
                >
                  Archive this group
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void toggleArchive(false)}
                  disabled={acting}
                  className="admin-classification disabled:opacity-50"
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  Reopen
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="admin-classification mb-3">
              Recent audit ({data.recentAudit.length})
            </p>
            {data.recentAudit.length === 0 ? (
              <p className="italic" style={{ color: "var(--admin-marginalia)" }}>
                No audit entries.
              </p>
            ) : (
              <ol style={{ borderTop: "1px solid var(--admin-ink)" }}>
                {data.recentAudit.map((a, i) => (
                  <li
                    key={a.id}
                    className="py-3 grid grid-cols-[3rem_minmax(8rem,auto)_minmax(0,1fr)] gap-6 items-baseline text-[13px]"
                    style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
                  >
                    <span className="admin-marginalia tabular-nums">
                      {String(i + 1).padStart(3, "0")}
                    </span>
                    <span
                      className="font-mono whitespace-nowrap"
                      style={{ color: "var(--admin-ink-medium)" }}
                    >
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                    <span className="font-mono" style={{ color: "var(--admin-ink)" }}>
                      {a.action}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      )}

      <p className="mt-12">
        <Link
          to="/groups"
          className="admin-classification"
          style={{ color: "var(--admin-ribbon)" }}
        >
          ← Back to all groups
        </Link>
      </p>
    </div>
  );
}
