import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";

type VocabKind = "disciplines" | "skills" | "languages";

interface DetailResponse {
  ok: true;
  row: {
    kind: VocabKind;
    id: string;
    name: string;
    slug: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    suggestedBy: { id: string; displayName: string | null; email: string } | null;
    usageCount: number;
  };
  similarApproved: Array<{ id: string; name: string; score: number }>;
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

export function VocabDetailPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const { kind, id } = useParams<{ kind: VocabKind; id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [mergeTarget, setMergeTarget] = useState<string>("");

  const load = useCallback(async () => {
    if (!kind || !id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/vocab/${kind}/${id}`);
      if (!res.ok) {
        setError(`/admin/vocab/${kind}/${id} responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as DetailResponse;
      setData(body);
      setDraftName(body.row.name);
      setDraftSlug(body.row.slug);
      setMergeTarget(body.similarApproved[0]?.id ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, kind, id]);

  useEffect(() => { void load(); }, [load]);

  async function saveIdentity() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const body: Record<string, string> = {};
      if (draftName !== data.row.name) body.name = draftName;
      if (draftSlug !== data.row.slug) body.slug = draftSlug;
      if (Object.keys(body).length === 0) {
        setActing(false);
        return;
      }
      const res = await apiFetch(`/admin/vocab/${data.row.kind}/${data.row.id}`, {
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

  async function approve() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(
        `/admin/vocab/${data.row.kind}/${data.row.id}/approve`,
        { method: "POST" }
      );
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

  async function reject() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(
        `/admin/vocab/${data.row.kind}/${data.row.id}/reject`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          message?: string;
          error?: string;
          usageCount?: number;
        } | null;
        setActionError(
          err?.error === "has_usages"
            ? `Cannot reject: ${err.usageCount} usage(s). Use merge instead.`
            : err?.message ?? `POST responded ${res.status}`
        );
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function merge() {
    if (!data || !mergeTarget) return;
    if (!window.confirm(`Merge "${data.row.name}" into the canonical term?`)) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(
        `/admin/vocab/${data.row.kind}/${data.row.id}/merge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId: mergeTarget }),
        }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      // Source row is now gone — navigate back to the queue.
      navigate("/vocab", { replace: true });
    } finally {
      setActing(false);
    }
  }

  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );
  if (!data) return <p className="admin-marginalia">Loading…</p>;

  const isPending = data.row.status === "pending";
  const shortName = data.row.name.replace(/[^a-zA-Z0-9]+/g, "").length <= 2;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">
        US-RSE · Admin · Vocab · {data.row.kind}
      </p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {data.row.name}
      </h2>
      <div className="flex items-center gap-4 mb-10">
        <span className="admin-classification">{data.row.status}</span>
        <span className="admin-classification" style={{ color: "var(--admin-marginalia)" }}>
          {data.row.kind}
        </span>
        <span className="admin-classification" style={{ color: "var(--admin-marginalia)" }}>
          {data.row.usageCount} usage{data.row.usageCount === 1 ? "" : "s"}
        </span>
      </div>

      {actionError && (
        <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {actionError}
        </p>
      )}

      {/* Identity */}
      <section className="mb-10 max-w-2xl">
        <p className="admin-classification mb-4">Identity</p>
        <div className="space-y-6">
          <EditorialInput
            label="Name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            readOnly={!isPending}
            hint={shortName ? "Short term — exact name match recommended over similarity-based merge." : undefined}
          />
          <EditorialInput
            label="Slug"
            value={draftSlug}
            onChange={(e) => setDraftSlug(e.target.value)}
            readOnly={!isPending}
            hint="Auto-derives from name when left empty in PATCH."
          />
          {isPending && (
            <button
              type="button"
              onClick={() => void saveIdentity()}
              disabled={acting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
            >
              {acting ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
      </section>

      {/* Curation */}
      <section className="mb-10 max-w-2xl">
        <p className="admin-classification mb-4">Curation</p>
        <div className="flex flex-wrap items-baseline gap-6">
          <button
            type="button"
            onClick={() => void approve()}
            disabled={acting || data.row.status === "approved"}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--color-success-700)" }}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => void reject()}
            disabled={acting || !isPending}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--color-danger-700)" }}
          >
            Reject
          </button>
        </div>
        <div className="mt-6">
          <label className="block mb-2">
            <span className="admin-classification">Merge into…</span>
          </label>
          <div className="flex items-baseline gap-4">
            <select
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
              className="bg-transparent border-0 outline-none py-1.5 flex-1 max-w-md"
              style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)", fontSize: "15px" }}
            >
              <option value="">— select a target —</option>
              {data.similarApproved.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (score {s.score})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void merge()}
              disabled={acting || !mergeTarget}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
            >
              {acting ? "Merging…" : "Merge →"}
            </button>
          </div>
          {data.similarApproved.length === 0 && (
            <p className="mt-3 text-[13px] italic" style={{ color: "var(--admin-marginalia)" }}>
              No similar approved terms found. Use search on the per-table page if you know the canonical name.
            </p>
          )}
        </div>
      </section>

      {/* Audit */}
      <section className="max-w-3xl">
        <p className="admin-classification mb-4">Audit</p>
        {data.recentAudit.length === 0 ? (
          <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No audit entries.</p>
        ) : (
          <ol style={{ borderTop: "1px solid var(--admin-ink)" }}>
            {data.recentAudit.map((a, i) => (
              <li
                key={a.id}
                className="py-3 grid grid-cols-[3rem_minmax(8rem,auto)_minmax(0,1fr)_minmax(7rem,auto)] gap-6 items-baseline text-[13px]"
                style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
              >
                <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
                <span className="font-mono whitespace-nowrap" style={{ color: "var(--admin-ink-medium)" }}>
                  {new Date(a.createdAt).toLocaleString()}
                </span>
                <span className="font-mono" style={{ color: "var(--admin-ink)" }}>{a.action}</span>
                <span className="admin-marginalia text-right">{a.targetType}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="mt-10">
        <Link to="/vocab" className="admin-classification" style={{ color: "var(--admin-ribbon)" }}>
          ← Back to queue
        </Link>
      </p>
    </div>
  );
}
