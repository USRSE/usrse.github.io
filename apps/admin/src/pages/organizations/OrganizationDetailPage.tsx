import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";
import { OrgStatusTag } from "../../components/OrgStatusTag";
import { useShellActor } from "../../layout/AdminShell";

type LogoVariant = "main" | "dark" | "mark";

interface DetailResponse {
  ok: true;
  organization: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
    url: string | null;
    logoUrl: string | null;
    logoStorageKey: string | null;
    logoDarkUrl: string | null;
    logoDarkStorageKey: string | null;
    logoMarkUrl: string | null;
    logoMarkStorageKey: string | null;
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
  merges: {
    inbound: Array<{
      id: string;
      sourceOrganizationId: string;
      mergedByUserId: string | null;
      createdAt: string;
      revertedAt: string | null;
      reason: string | null;
    }>;
    outbound: {
      id: string;
      targetOrganizationId: string;
      createdAt: string;
      revertedAt: string | null;
      reason: string | null;
    } | null;
  };
}

type Tab = "identity" | "members" | "branding" | "status";

interface Draft {
  name: string;
  slug: string;
  shortName: string;
  url: string;
}

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const actor = useShellActor();
  const apiFetch = useApi();
  const navigate = useNavigate();
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
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeResults, setMergeResults] = useState<
    Array<{
      id: string;
      name: string;
      slug: string;
      shortName: string | null;
    }>
  >([]);

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

  // ── Branding ────────────────────────────────────────────────────────
  // Upload, fetch-from-URL, and delete each take a variant. The API
  // returns 503 with error:"not_configured" until the R2 bucket is
  // provisioned — the UI catches that and renders a clear banner
  // rather than letting the error stack look like a real failure.

  async function uploadLogo(variant: LogoVariant, file: File) {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch(
        `/admin/organizations/${data.organization.id}/logo?variant=${variant}`,
        { method: "POST", body: form }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setSaveError(err?.message ?? `Upload responded ${res.status}`);
        return;
      }
      await fetchOrg();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogoFromUrl(variant: LogoVariant, sourceUrl: string) {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiFetch(
        `/admin/organizations/${data.organization.id}/logo/from-url?variant=${variant}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: sourceUrl }),
        }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setSaveError(err?.message ?? `Upload responded ${res.status}`);
        return;
      }
      await fetchOrg();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  // Debounced lookup for the "Merge into another org" picker.
  useEffect(() => {
    const term = mergeSearch.trim();
    if (term.length < 2) {
      setMergeResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({ q: term, limit: "10", status: "active" });
        const res = await apiFetch(`/admin/organizations?${sp}`);
        if (!res.ok) return;
        const body = (await res.json()) as {
          rows: Array<{ id: string; name: string; slug: string; shortName: string | null }>;
        };
        setMergeResults(body.rows.filter((r) => r.id !== id));
      } catch {
        /* picker is convenience-only — swallow */
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [apiFetch, id, mergeSearch]);

  async function unmerge(mergeId: string) {
    if (!data) return;
    if (!window.confirm("Unmerge this organization?")) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiFetch(`/admin/organizations/${data.organization.id}/unmerge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mergeId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setSaveError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      await fetchOrg();
    } finally {
      setSaving(false);
    }
  }

  async function deleteLogo(variant: LogoVariant) {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiFetch(
        `/admin/organizations/${data.organization.id}/logo?variant=${variant}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        setSaveError(`Delete responded ${res.status}`);
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
        {(["identity", "members", "branding", "status"] as Tab[]).map((t, i) => (
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
                  : t === "branding"
                    ? "Branding"
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

      {tab === "branding" && (
        <div className="space-y-10 max-w-2xl">
          <LogoSlot
            label="Main logo"
            hint="Surfaces on member dossiers, the organization detail page, and the public sponsors strip. Use the brand's primary horizontal mark."
            variant="main"
            currentUrl={o.logoUrl}
            ownsStorage={Boolean(o.logoStorageKey)}
            saving={saving}
            onUpload={uploadLogo}
            onFromUrl={uploadLogoFromUrl}
            onDelete={deleteLogo}
          />
          <LogoSlot
            label="Dark variant"
            hint="Optional. Falls back to the main logo on dark surfaces if not provided."
            variant="dark"
            currentUrl={o.logoDarkUrl}
            ownsStorage={Boolean(o.logoDarkStorageKey)}
            saving={saving}
            onUpload={uploadLogo}
            onFromUrl={uploadLogoFromUrl}
            onDelete={deleteLogo}
          />
          <LogoSlot
            label="Mark"
            hint="Optional. The compact mark / icon — used in the directory list and command palette where the full logo doesn't fit."
            variant="mark"
            currentUrl={o.logoMarkUrl}
            ownsStorage={Boolean(o.logoMarkStorageKey)}
            saving={saving}
            onUpload={uploadLogo}
            onFromUrl={uploadLogoFromUrl}
            onDelete={deleteLogo}
          />

          <ConsentAndCredit
            consent={o.logoUsageConsent}
            credit={o.logoCredit}
            saving={saving}
            onPatch={patch}
          />
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

          {data.merges.outbound && (
            <div>
              <p className="admin-classification mb-3">Merged into</p>
              <p
                className="text-[14px]"
                style={{ color: "var(--admin-ink-medium)" }}
              >
                Folded into{" "}
                <Link
                  to={`/organizations/${data.merges.outbound.targetOrganizationId}`}
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  {data.merges.outbound.targetOrganizationId.slice(0, 8)}…
                </Link>{" "}
                on {new Date(data.merges.outbound.createdAt).toLocaleString()}.
              </p>
            </div>
          )}

          {data.merges.inbound.length > 0 && (
            <div>
              <p className="admin-classification mb-3">Folded-in sources</p>
              <ul style={{ borderTop: "1px solid var(--admin-rule)" }}>
                {data.merges.inbound.map((m) => (
                  <li
                    key={m.id}
                    className="py-3 flex items-baseline justify-between"
                    style={{
                      borderBottom: "1px solid var(--admin-rule-subtle)",
                    }}
                  >
                    <span
                      className="font-mono text-[13px]"
                      style={{ color: "var(--admin-ink-medium)" }}
                    >
                      {m.sourceOrganizationId.slice(0, 8)}… ·{" "}
                      {new Date(m.createdAt).toLocaleString()}
                      {m.reason && (
                        <span className="admin-marginalia ml-3">
                          {m.reason}
                        </span>
                      )}
                      {m.revertedAt && (
                        <span className="admin-marginalia ml-3 italic">
                          reverted
                        </span>
                      )}
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

          {actor.systemTier >= 2 && !o.mergedIntoId && !o.deletedAt && (
            <div>
              <p className="admin-classification mb-3">Merge into another organization</p>
              <p
                className="text-[13px] mb-3"
                style={{ color: "var(--admin-ink-medium)" }}
              >
                Find the canonical record this org should be folded into.
                You'll pick which side is canonical and which fields to
                promote in the next step.
              </p>
              <input
                type="text"
                placeholder="Search by name, slug, short name, or URL…"
                value={mergeSearch}
                onChange={(e) => setMergeSearch(e.target.value)}
                className="w-full max-w-lg font-mono text-[13px] py-1.5 outline-none bg-transparent"
                style={{
                  borderBottom: "1px solid var(--admin-rule)",
                  color: "var(--admin-ink)",
                }}
              />
              {mergeResults.length > 0 && (
                <ul
                  className="mt-4 max-w-2xl"
                  style={{ borderTop: "1px solid var(--admin-rule-subtle)" }}
                >
                  {mergeResults.map((r) => (
                    <li
                      key={r.id}
                      style={{
                        borderBottom: "1px solid var(--admin-rule-subtle)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/organizations/duplicates/merge?a=${o.id}&b=${r.id}`
                          )
                        }
                        className="w-full text-left py-3 grid grid-cols-[1fr_minmax(0,1fr)_8rem] gap-4 items-baseline transition-colors hover:bg-[var(--admin-paper-edge)]"
                      >
                        <span style={{ color: "var(--admin-ink)" }}>
                          {r.name}
                        </span>
                        <span
                          className="font-mono text-[12px] truncate"
                          style={{ color: "var(--admin-ink-medium)" }}
                        >
                          {r.slug}
                        </span>
                        <span className="admin-marginalia text-right">
                          {r.shortName ?? ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {mergeSearch.trim().length >= 2 && mergeResults.length === 0 && (
                <p
                  className="mt-3 text-[13px] italic"
                  style={{ color: "var(--admin-marginalia)" }}
                >
                  No active organizations match that search.
                </p>
              )}
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

// ─── Branding subcomponents ───────────────────────────────────────────

interface LogoSlotProps {
  label: string;
  hint: string;
  variant: LogoVariant;
  currentUrl: string | null;
  ownsStorage: boolean;
  saving: boolean;
  onUpload: (variant: LogoVariant, file: File) => Promise<void>;
  onFromUrl: (variant: LogoVariant, sourceUrl: string) => Promise<void>;
  onDelete: (variant: LogoVariant) => Promise<void>;
}

/**
 * One variant slot — main / dark / mark. Each carries:
 *   - A preview (current logo or "no logo set" stamp)
 *   - File upload via a hidden <input type="file"> wired to a button
 *     so the editorial visual treatment isn't broken by the browser's
 *     default file-picker chrome
 *   - From-URL fallback for cases where staff has the canonical URL
 *     rather than a local file
 *   - Remove control — clears the column reference; the bytes get
 *     deleted from R2 only when we own them (ownsStorage)
 */
function LogoSlot({
  label,
  hint,
  variant,
  currentUrl,
  ownsStorage,
  saving,
  onUpload,
  onFromUrl,
  onDelete,
}: LogoSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <p className="admin-classification">{label}</p>
        <span
          className="admin-marginalia"
          style={{ color: "var(--admin-marginalia)" }}
        >
          variant: {variant}
        </span>
      </header>

      <div
        className="flex items-center gap-6 p-4 mb-3"
        style={{
          border: "1px solid var(--admin-rule)",
          background: "var(--admin-paper-edge, transparent)",
        }}
      >
        <div
          className="w-24 h-24 shrink-0 flex items-center justify-center"
          style={{ background: "var(--admin-paper, #fff)" }}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span
              className="admin-classification text-center"
              style={{ color: "var(--admin-marginalia)" }}
            >
              ∅<br />no logo
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] leading-relaxed mb-3"
            style={{ color: "var(--admin-ink-medium)" }}
          >
            {hint}
          </p>
          {currentUrl && (
            <p
              className="font-mono text-[10px] truncate"
              style={{ color: "var(--admin-marginalia)" }}
              title={currentUrl}
            >
              {ownsStorage ? "hosted · " : "external · "}
              {currentUrl}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(variant, file);
            // Reset so re-selecting the same file fires onChange.
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={saving}
          className="admin-classification disabled:opacity-50"
          style={{ color: "var(--admin-ribbon)" }}
        >
          Upload file →
        </button>
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          disabled={saving}
          className="admin-classification disabled:opacity-50"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          {showUrlInput ? "Cancel URL" : "Or paste URL"}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={() => void onDelete(variant)}
            disabled={saving}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--color-danger-700)" }}
          >
            Remove
          </button>
        )}
      </div>

      {showUrlInput && (
        <div className="mt-4 flex items-center gap-3">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://example.org/logo.png"
            className="flex-1 bg-transparent border-0 outline-none py-1.5 font-mono text-[13px]"
            style={{
              borderBottom: "1px solid var(--admin-rule)",
              color: "var(--admin-ink)",
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (urlDraft.trim()) {
                void onFromUrl(variant, urlDraft.trim()).then(() => {
                  setUrlDraft("");
                  setShowUrlInput(false);
                });
              }
            }}
            disabled={saving || !urlDraft.trim()}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--admin-ribbon)" }}
          >
            Fetch →
          </button>
        </div>
      )}
    </section>
  );
}

interface ConsentAndCreditProps {
  consent: string | null;
  credit: string | null;
  saving: boolean;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
}

/**
 * Consent text doubles as a granted-flag (any non-empty value =
 * granted) and a record of when/how. "Record consent today" stamps an
 * ISO timestamp so we know when an admin gave the green light;
 * "Revoke" clears it. Editing the text directly is allowed for cases
 * where the consent is tied to a specific document or version
 * ("Logo policy v2 — 2026-05").
 */
function ConsentAndCredit({
  consent,
  credit,
  saving,
  onPatch,
}: ConsentAndCreditProps) {
  const [consentDraft, setConsentDraft] = useState(consent ?? "");
  const [creditDraft, setCreditDraft] = useState(credit ?? "");

  useEffect(() => {
    setConsentDraft(consent ?? "");
  }, [consent]);
  useEffect(() => {
    setCreditDraft(credit ?? "");
  }, [credit]);

  const consentGiven = Boolean(consent && consent.trim());

  return (
    <section
      className="pt-8"
      style={{ borderTop: "1px solid var(--admin-rule)" }}
    >
      <p className="admin-classification mb-3">Usage consent</p>
      <p
        className="text-[12px] mb-4"
        style={{ color: "var(--admin-ink-medium)", maxWidth: "var(--admin-measure)" }}
      >
        Public surfaces hide the logo until this field is non-empty. The text
        is for the audit trail — typically the date consent was granted or a
        reference to the org's logo-use policy.
      </p>

      <div className="flex items-center gap-3 mb-2">
        <span
          className="admin-classification"
          style={{
            color: consentGiven
              ? "var(--admin-ribbon)"
              : "var(--color-danger-700)",
          }}
        >
          {consentGiven ? "Granted" : "Not granted"}
        </span>
        <button
          type="button"
          onClick={() =>
            void onPatch({ logoUsageConsent: new Date().toISOString() })
          }
          disabled={saving}
          className="admin-classification disabled:opacity-50"
          style={{ color: "var(--admin-ribbon)" }}
        >
          Record consent today
        </button>
        {consentGiven && (
          <button
            type="button"
            onClick={() => void onPatch({ logoUsageConsent: null })}
            disabled={saving}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--color-danger-700)" }}
          >
            Revoke
          </button>
        )}
      </div>

      <input
        type="text"
        value={consentDraft}
        onChange={(e) => setConsentDraft(e.target.value)}
        onBlur={() => {
          const next = consentDraft.trim() === "" ? null : consentDraft.trim();
          if (next !== consent) void onPatch({ logoUsageConsent: next });
        }}
        placeholder="ISO timestamp, policy reference, or note"
        className="w-full bg-transparent border-0 outline-none py-1.5 font-mono text-[13px]"
        style={{
          borderBottom: "1px solid var(--admin-rule)",
          color: "var(--admin-ink)",
        }}
      />

      <p className="admin-classification mt-8 mb-3">Credit string</p>
      <p
        className="text-[12px] mb-3"
        style={{ color: "var(--admin-ink-medium)", maxWidth: "var(--admin-measure)" }}
      >
        Attribution line surfaced next to the logo when the org's policy
        requires it (e.g., "Logo © Organization, used with permission.").
        Leave blank if no credit line is required.
      </p>
      <EditorialInput
        label="Credit"
        value={creditDraft}
        onChange={(e) => setCreditDraft(e.target.value)}
        onBlur={() => {
          const next = creditDraft.trim() === "" ? null : creditDraft.trim();
          if (next !== credit) void onPatch({ logoCredit: next });
        }}
      />
    </section>
  );
}
