import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";
import { OrgStatusTag } from "../../components/OrgStatusTag";

interface DetailResponse {
  ok: true;
  organization: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
    url: string | null;
    logoUrl: string | null;
    logoMarkUrl: string | null;
    logoUsageConsent: string | null;
    logoCredit: string | null;
    status: "pending" | "approved";
    mergedIntoId: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  memberCount: number;
  recentAffiliations: Array<{
    userId: string;
    memberId: string;
    displayName: string | null;
    isPrimary: boolean;
    role: string | null;
    startedAt: string | null;
    createdAt: string;
  }>;
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

type Tab = "identity" | "members" | "status";

interface Draft {
  name: string;
  slug: string;
  shortName: string;
  url: string;
}

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const apiFetch = useApi();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [draft, setDraft] = useState<Draft>({
    name: "",
    slug: "",
    shortName: "",
    url: "",
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchOrg = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/organizations/${id}`);
      if (!res.ok) {
        setError(`/admin/organizations/${id} responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as DetailResponse;
      setData(body);
      setDraft({
        name: body.organization.name,
        slug: body.organization.slug,
        shortName: body.organization.shortName ?? "",
        url: body.organization.url ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => {
    void fetchOrg();
  }, [fetchOrg]);

  async function patch(body: Record<string, unknown>) {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiFetch(`/admin/organizations/${data.organization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setSaveError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await fetchOrg();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function saveIdentity() {
    await patch({
      name: draft.name.trim() || undefined,
      slug: draft.slug.trim() || undefined,
      shortName: draft.shortName.trim() === "" ? null : draft.shortName.trim(),
      url: draft.url.trim() === "" ? null : draft.url.trim(),
    });
  }

  async function setVocabStatus(next: "pending" | "approved") {
    await patch({ status: next });
  }

  async function toggleSoftDelete(deleted: boolean) {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const url = `/admin/organizations/${data.organization.id}/${
        deleted ? "soft-delete" : "restore"
      }`;
      const res = await apiFetch(url, { method: "POST" });
      if (!res.ok) {
        setSaveError(`POST ${url} responded ${res.status}`);
        return;
      }
      await fetchOrg();
    } finally {
      setSaving(false);
    }
  }

  if (error)
    return (
      <p
        className="admin-classification"
        style={{ color: "var(--color-danger-700)" }}
      >
        {error}
      </p>
    );
  if (!data) return <p className="admin-marginalia">Loading…</p>;

  const o = data.organization;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">
        US-RSE · Admin · Organization · {o.slug}
      </p>
      <div className="flex items-baseline justify-between gap-6 mb-2">
        <h2
          className="admin-display"
          style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}
        >
          {o.name}
        </h2>
      </div>
      <div className="flex items-center gap-4 mb-10">
        <OrgStatusTag
          deletedAt={o.deletedAt}
          mergedIntoId={o.mergedIntoId}
          vocabStatus={o.status}
        />
        <span
          className="admin-classification"
          style={{ color: "var(--admin-marginalia)" }}
        >
          {data.memberCount} member{data.memberCount === 1 ? "" : "s"}
        </span>
      </div>

      <nav
        className="flex items-baseline gap-8 mb-8"
        style={{ borderBottom: "1px solid var(--admin-rule)" }}
      >
        {(["identity", "members", "status"] as Tab[]).map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="pb-3 admin-classification transition-colors"
            style={{
              color: tab === t ? "var(--admin-ribbon)" : "var(--admin-ink-medium)",
              borderBottom:
                tab === t ? "2px solid var(--admin-ribbon)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            <span className="tabular-nums mr-2">{String(i + 1).padStart(2, "0")}</span>
            <span>
              {t === "identity"
                ? "Identity"
                : t === "members"
                  ? "Members"
                  : "Status"}
            </span>
          </button>
        ))}
      </nav>

      {saveError && (
        <p
          className="mb-4 admin-classification"
          style={{ color: "var(--color-danger-700)" }}
        >
          {saveError}
        </p>
      )}

      {tab === "identity" && (
        <div className="space-y-6 max-w-2xl">
          <EditorialInput
            label="Name"
            value={draft.name}
            onChange={(e) =>
              setDraft((d) => ({ ...d, name: e.target.value }))
            }
          />
          <EditorialInput
            label="Slug"
            value={draft.slug}
            onChange={(e) =>
              setDraft((d) => ({ ...d, slug: e.target.value }))
            }
            hint="Lowercase, hyphens only — used in URLs and the cmd-K palette."
          />
          <EditorialInput
            label="Short name"
            value={draft.shortName}
            onChange={(e) =>
              setDraft((d) => ({ ...d, shortName: e.target.value }))
            }
            hint="Abbreviation shown in compact contexts (e.g., MIT for Massachusetts Institute of Technology)."
          />
          <EditorialInput
            label="URL"
            value={draft.url}
            onChange={(e) =>
              setDraft((d) => ({ ...d, url: e.target.value }))
            }
            hint="Canonical homepage. Leave blank if unknown."
          />

          <div>
            <p className="admin-classification block mb-2">Vocab status</p>
            <select
              value={o.status}
              onChange={(e) =>
                void setVocabStatus(
                  e.target.value as "pending" | "approved"
                )
              }
              className="bg-transparent border-0 outline-none py-1.5"
              style={{
                borderBottom: "1px solid var(--admin-rule)",
                color: "var(--admin-ink)",
                fontSize: "15px",
              }}
              disabled={saving}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
            <p
              className="mt-1.5 text-[11px]"
              style={{ color: "var(--admin-marginalia)" }}
            >
              Pending orgs surface in vocab queues only; approved orgs can be
              picked by members from the dossier.
            </p>
          </div>

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

      {tab === "members" && (
        <div>
          {data.recentAffiliations.length === 0 ? (
            <p
              className="italic"
              style={{ color: "var(--admin-marginalia)" }}
            >
              No active members affiliated with this organization.
            </p>
          ) : (
            <ul style={{ borderTop: "1px solid var(--admin-rule)" }}>
              {data.recentAffiliations.map((a) => (
                <li
                  key={a.userId}
                  className="py-3 grid grid-cols-[minmax(0,1fr)_8rem_8rem_7rem] gap-6 items-baseline"
                  style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
                >
                  <Link
                    to={`/members/${a.userId}`}
                    style={{ color: "var(--admin-ink)" }}
                    className="truncate"
                  >
                    {a.displayName ?? (
                      <em style={{ color: "var(--admin-marginalia)" }}>
                        no name
                      </em>
                    )}
                  </Link>
                  <span className="font-mono text-[11px] admin-marginalia tabular-nums truncate">
                    {a.memberId}
                  </span>
                  <span className="admin-marginalia">
                    {a.role ?? "—"}
                  </span>
                  <span className="admin-marginalia">
                    {a.isPrimary ? "Primary" : "Secondary"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p
            className="mt-6 text-[13px]"
            style={{ color: "var(--admin-marginalia)" }}
          >
            Showing up to 20 active affiliations. Total members on this org:{" "}
            {data.memberCount}.
          </p>
        </div>
      )}

      {tab === "status" && (
        <div className="space-y-8">
          <div>
            <p className="admin-classification mb-3">Lifecycle</p>
            {o.deletedAt ? (
              <div className="flex items-center gap-4">
                <p
                  className="text-[14px]"
                  style={{ color: "var(--admin-ink-medium)" }}
                >
                  Soft-deleted at {new Date(o.deletedAt).toLocaleString()}.
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
                Soft-delete this organization
              </button>
            )}
            <p
              className="mt-3 text-[12px]"
              style={{ color: "var(--admin-marginalia)" }}
            >
              Soft-delete hides the org from public search and the directory,
              but preserves membership rows so the merge wizard (phase 3) can
              still resolve historical affiliations.
            </p>
          </div>

          {o.mergedIntoId && (
            <div>
              <p className="admin-classification mb-3">Merged into</p>
              <p
                className="text-[14px]"
                style={{ color: "var(--admin-ink-medium)" }}
              >
                Folded into{" "}
                <Link
                  to={`/organizations/${o.mergedIntoId}`}
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  {o.mergedIntoId.slice(0, 8)}…
                </Link>
                . Org merging UI ships in phase 3.
              </p>
            </div>
          )}

          <div>
            <p className="admin-classification mb-3">Recent activity</p>
            {data.recentAudit.length === 0 ? (
              <p
                className="italic"
                style={{ color: "var(--admin-marginalia)" }}
              >
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
                    <span
                      className="font-mono"
                      style={{ color: "var(--admin-ink)" }}
                    >
                      {a.action}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
