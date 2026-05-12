import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";
import { RoleTag } from "../../components/RoleTag";
import { StatusTag } from "../../components/StatusTag";

interface DetailResponse {
  ok: true;
  user: {
    id: string;
    memberId: string;
    email: string;
    role: "member" | "staff" | "super_admin" | "admin";
    mergedIntoUserId: string | null;
    deletedAt: string | null;
    isLegacyImport: boolean;
    createdAt: string;
  };
  profile: {
    id: string;
    displayName: string;
    headline: string | null;
    bio: string | null;
    photoUrl: string | null;
    jobTitle: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    orcid: string | null;
    websiteUrl: string | null;
  } | null;
  affiliations: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    isPrimary: boolean;
    role: string | null;
  }>;
  merges: {
    inbound: Array<{ id: string; sourceUserId: string; createdAt: string; revertedAt: string | null; reason: string | null }>;
    outbound: { id: string; targetUserId: string; createdAt: string } | null;
  };
  recentAudit: Array<{
    id: string;
    actorId: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }>;
}

type Tab = "identity" | "affiliations" | "status" | "audit";

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const actor = useShellActor();
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeResults, setMergeResults] = useState<Array<{ id: string; displayName: string | null; email: string; memberId: string }>>([]);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/users/${id}`);
      if (!res.ok) { setError(`/admin/users/${id} responded ${res.status}`); return; }
      const body = (await res.json()) as DetailResponse;
      setData(body);
      setDraft({
        displayName: body.profile?.displayName ?? "",
        headline: body.profile?.headline ?? "",
        bio: body.profile?.bio ?? "",
        jobTitle: body.profile?.jobTitle ?? "",
        githubUrl: body.profile?.githubUrl ?? "",
        linkedinUrl: body.profile?.linkedinUrl ?? "",
        orcid: body.profile?.orcid ?? "",
        websiteUrl: body.profile?.websiteUrl ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => { void fetchUser(); }, [fetchUser]);

  // Debounced lookup for the "merge into another member" picker.
  useEffect(() => {
    const term = mergeSearch.trim();
    if (term.length < 2) {
      setMergeResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({ q: term, limit: "10", status: "active" });
        const res = await apiFetch(`/admin/users?${sp}`);
        if (!res.ok) return;
        const body = (await res.json()) as {
          rows: Array<{ id: string; displayName: string | null; email: string; memberId: string }>;
        };
        // Exclude the user we are merging FROM.
        setMergeResults(body.rows.filter((r) => r.id !== id));
      } catch {
        /* swallow — picker is a convenience, not load-bearing */
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [apiFetch, id, mergeSearch]);

  async function saveIdentity() {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, string | null> = {};
      for (const k of ["displayName", "headline", "bio", "jobTitle", "githubUrl", "linkedinUrl", "orcid", "websiteUrl"] as const) {
        body[k] = draft[k]?.trim() === "" ? null : draft[k];
      }
      const res = await apiFetch(`/admin/users/${data.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setSaveError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await fetchUser();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  async function setRole(newRole: "member" | "staff" | "super_admin") {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiFetch(`/admin/users/${data.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setSaveError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await fetchUser();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  async function toggleSoftDelete(deleted: boolean) {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const url = `/admin/users/${data.user.id}/${deleted ? "soft-delete" : "restore"}`;
      const res = await apiFetch(url, { method: "POST" });
      if (!res.ok) {
        setSaveError(`POST ${url} responded ${res.status}`);
        return;
      }
      await fetchUser();
    } finally { setSaving(false); }
  }

  async function unmerge(mergeId: string) {
    if (!data) return;
    if (!window.confirm("Unmerge this user?")) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiFetch(`/admin/users/${data.user.id}/unmerge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mergeId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setSaveError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      await fetchUser();
    } finally { setSaving(false); }
  }

  if (error) return <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>{error}</p>;
  if (!data) return <p className="admin-marginalia">Loading…</p>;

  const canEditRole = actor.systemTier >= 1;
  const canPromoteToSuperAdmin = actor.systemTier >= 2;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">
        US-RSE · Admin · Member · {data.user.memberId}
      </p>
      <div className="flex items-baseline justify-between gap-6 mb-2">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          {data.profile?.displayName ?? <em style={{ color: "var(--admin-marginalia)" }}>No display name</em>}
        </h2>
      </div>
      <div className="flex items-center gap-4 mb-10">
        <RoleTag role={data.user.role} />
        <StatusTag
          deletedAt={data.user.deletedAt}
          mergedIntoUserId={data.user.mergedIntoUserId}
          isLegacyImport={data.user.isLegacyImport}
        />
      </div>

      <nav className="flex items-baseline gap-8 mb-8" style={{ borderBottom: "1px solid var(--admin-rule)" }}>
        {(["identity", "affiliations", "status", "audit"] as Tab[]).map((t, i) => (
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
            <span className="tabular-nums mr-2">{["I", "II", "III", "IV"][i]}</span>
            <span>{t === "identity" ? "Identity" : t === "affiliations" ? "Affiliations" : t === "status" ? "Status" : "Audit"}</span>
          </button>
        ))}
      </nav>

      {saveError && (
        <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>{saveError}</p>
      )}

      {tab === "identity" && (
        <div className="space-y-6 max-w-2xl">
          <EditorialInput
            label="Display name"
            value={draft.displayName ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
          />
          <EditorialInput
            label="Email"
            value={data.user.email}
            readOnly
            hint="Managed by WorkOS"
            style={{ color: "var(--admin-ink-medium)" }}
          />
          <EditorialInput
            label="Job title"
            value={draft.jobTitle ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, jobTitle: e.target.value }))}
          />
          <EditorialInput
            label="Headline"
            value={draft.headline ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
          />
          <EditorialTextarea
            label="Bio"
            value={draft.bio ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
            rows={6}
          />
          <EditorialInput
            label="ORCID"
            value={draft.orcid ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, orcid: e.target.value }))}
            hint="0000-0000-0000-000X"
          />
          <EditorialInput
            label="GitHub URL"
            value={draft.githubUrl ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, githubUrl: e.target.value }))}
          />
          <EditorialInput
            label="LinkedIn URL"
            value={draft.linkedinUrl ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, linkedinUrl: e.target.value }))}
          />
          <EditorialInput
            label="Website URL"
            value={draft.websiteUrl ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, websiteUrl: e.target.value }))}
          />

          {canEditRole && (
            <div>
              <p className="admin-classification block mb-2">Role</p>
              <select
                value={data.user.role === "admin" ? "staff" : data.user.role}
                onChange={(e) => void setRole(e.target.value as "member" | "staff" | "super_admin")}
                className="bg-transparent border-0 outline-none py-1.5"
                style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)", fontSize: "15px" }}
                disabled={saving}
              >
                <option value="member">Member</option>
                <option value="staff">Staff</option>
                <option value="super_admin" disabled={!canPromoteToSuperAdmin}>
                  Super admin
                </option>
              </select>
            </div>
          )}

          <div className="pt-4">
            <button
              type="button"
              onClick={() => void saveIdentity()}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save identity"}
            </button>
          </div>
        </div>
      )}

      {tab === "affiliations" && (
        <div>
          {data.affiliations.length === 0 ? (
            <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No affiliations on file.</p>
          ) : (
            <ul style={{ borderTop: "1px solid var(--admin-rule)" }}>
              {data.affiliations.map((a) => (
                <li key={a.id} className="py-3 grid grid-cols-[1fr_8rem_8rem] gap-6 items-baseline" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                  <span style={{ color: "var(--admin-ink)" }}>{a.organizationName}</span>
                  <span className="admin-marginalia">{a.role ?? "—"}</span>
                  <span className="admin-marginalia">{a.isPrimary ? "Primary" : "Secondary"}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-[13px]" style={{ color: "var(--admin-marginalia)" }}>
            Edit affiliations from the member's dossier on the public site.
          </p>
        </div>
      )}

      {tab === "status" && (
        <div className="space-y-8">
          <div>
            <p className="admin-classification mb-3">Lifecycle</p>
            {data.user.deletedAt ? (
              <div className="flex items-center gap-4">
                <p className="text-[14px]" style={{ color: "var(--admin-ink-medium)" }}>
                  Soft-deleted at {new Date(data.user.deletedAt).toLocaleString()}.
                </p>
                <button
                  type="button"
                  onClick={() => void toggleSoftDelete(false)}
                  disabled={saving}
                  className="admin-classification disabled:opacity-50"
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  Restore
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void toggleSoftDelete(true)}
                disabled={saving}
                className="admin-classification disabled:opacity-50"
                style={{ color: "var(--color-danger-700)" }}
              >
                Soft-delete this member
              </button>
            )}
          </div>

          {data.merges.outbound && (
            <div>
              <p className="admin-classification mb-3">Merged into</p>
              <p className="text-[14px]" style={{ color: "var(--admin-ink-medium)" }}>
                Folded into <Link to={`/members/${data.merges.outbound.targetUserId}`} style={{ color: "var(--admin-ribbon)" }}>{data.merges.outbound.targetUserId.slice(0, 8)}…</Link> on {new Date(data.merges.outbound.createdAt).toLocaleString()}.
              </p>
            </div>
          )}

          {data.merges.inbound.length > 0 && (
            <div>
              <p className="admin-classification mb-3">Folded-in sources</p>
              <ul style={{ borderTop: "1px solid var(--admin-rule)" }}>
                {data.merges.inbound.map((m) => (
                  <li key={m.id} className="py-3 flex items-baseline justify-between" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                    <span className="font-mono text-[13px]" style={{ color: "var(--admin-ink-medium)" }}>
                      {m.sourceUserId.slice(0, 8)}… · {new Date(m.createdAt).toLocaleString()}
                      {m.reason && <span className="admin-marginalia ml-3">{m.reason}</span>}
                      {m.revertedAt && <span className="admin-marginalia ml-3 italic">reverted</span>}
                    </span>
                    {!m.revertedAt && actor.systemTier >= 2 && (
                      <button
                        type="button"
                        onClick={() => void unmerge(m.id)}
                        disabled={saving}
                        className="admin-classification disabled:opacity-50"
                        style={{ color: "var(--admin-ribbon)" }}
                      >
                        Unmerge →
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actor.systemTier >= 2 && !data.user.mergedIntoUserId && (
            <div>
              <p className="admin-classification mb-3">Merge into another member</p>
              <p className="text-[13px] mb-3" style={{ color: "var(--admin-ink-medium)" }}>
                Find the canonical record this member should be folded into. You'll pick which side is canonical and which fields to promote in the next step.
              </p>
              <input
                type="text"
                placeholder="Search by name, email, or member ID…"
                value={mergeSearch}
                onChange={(e) => setMergeSearch(e.target.value)}
                className="w-full max-w-lg font-mono text-[13px] py-1.5 outline-none bg-transparent"
                style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)" }}
              />
              {mergeResults.length > 0 && (
                <ul className="mt-4 max-w-2xl" style={{ borderTop: "1px solid var(--admin-rule-subtle)" }}>
                  {mergeResults.map((r) => (
                    <li key={r.id} style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/members/duplicates/merge?a=${data.user.id}&b=${r.id}`)}
                        className="w-full text-left py-3 grid grid-cols-[1fr_minmax(0,1fr)_8rem] gap-4 items-baseline transition-colors hover:bg-[var(--admin-paper-edge)]"
                      >
                        <span style={{ color: "var(--admin-ink)" }}>
                          {r.displayName ?? <em style={{ color: "var(--admin-marginalia)" }}>no name</em>}
                        </span>
                        <span className="font-mono text-[12px] truncate" style={{ color: "var(--admin-ink-medium)" }}>
                          {r.email}
                        </span>
                        <span className="font-mono text-[11px] admin-marginalia tabular-nums truncate">
                          {r.memberId}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {mergeSearch.trim().length >= 2 && mergeResults.length === 0 && (
                <p className="mt-3 text-[13px] italic" style={{ color: "var(--admin-marginalia)" }}>
                  No active members match that search.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div>
          {data.recentAudit.length === 0 ? (
            <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No audit entries.</p>
          ) : (
            <ol style={{ borderTop: "1px solid var(--admin-ink)" }}>
              {data.recentAudit.map((a, i) => (
                <li key={a.id} className="py-3 grid grid-cols-[3rem_minmax(8rem,auto)_minmax(0,1fr)_minmax(7rem,auto)] gap-6 items-baseline text-[13px]" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                  <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
                  <span className="font-mono whitespace-nowrap" style={{ color: "var(--admin-ink-medium)" }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                  <span className="font-mono" style={{ color: "var(--admin-ink)" }}>{a.action}</span>
                  <span className="admin-marginalia text-right">{a.targetType} · {a.targetId.slice(0, 8)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
