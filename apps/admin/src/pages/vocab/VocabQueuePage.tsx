import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

type VocabKind = "disciplines" | "skills" | "languages";
type SortMode = "newest" | "most-used" | "strongest-match";
type StatusFilter = "pending" | "approved" | "rejected" | "all";

interface QueueRow {
  kind: VocabKind;
  id: string;
  name: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  suggestedBy: { id: string; displayName: string | null; email: string } | null;
  usageCount: number;
  similarApproved: { id: string; name: string; score: number } | null;
}

interface QueueResponse {
  ok: true;
  rows: QueueRow[];
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    withUsages: number;
    withStrongMatch: number;
  };
}

export function VocabQueuePage() {
  const apiFetch = useApi();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const kind = (params.get("kind") ?? "all") as VocabKind | "all";
  const sort = (params.get("sort") ?? "newest") as SortMode;
  const status = (params.get("status") ?? "pending") as StatusFilter;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams({ sort, status });
    if (kind !== "all") sp.set("kind", kind);
    try {
      const res = await apiFetch(`/admin/vocab/queue?${sp}`);
      if (!res.ok) {
        setError(`/admin/vocab/queue responded ${res.status}`);
        return;
      }
      setData((await res.json()) as QueueResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [apiFetch, kind, sort, status]);

  useEffect(() => { void load(); }, [load]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    // Defaults that should NOT appear in the URL.
    const isDefault =
      (name === "kind" && value === "all") ||
      (name === "sort" && value === "newest") ||
      (name === "status" && value === "pending");
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
      <p className="admin-classification mb-6">US-RSE · Admin · Vocab</p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        Vocab.
      </h2>
      {data && (
        <p className="admin-classification mb-8">
          {status === "pending" ? (
            <>
              {data.counts.total} pending · {data.counts.withUsages} with usages
              {" · "}
              {data.counts.withStrongMatch} with strong match
            </>
          ) : status === "all" ? (
            <>
              {data.counts.total} terms · {data.counts.pending} pending ·{" "}
              {data.counts.approved} approved · {data.counts.rejected} rejected
            </>
          ) : (
            <>
              {data.counts.total} {status} · {data.counts.withUsages} with usages
            </>
          )}
        </p>
      )}

      <div className="flex items-baseline gap-6 mb-6">
        <select
          value={kind}
          onChange={(e) => setParam("kind", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="all">All kinds</option>
          <option value="disciplines">Disciplines</option>
          <option value="skills">Skills</option>
          <option value="languages">Languages</option>
        </select>
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All statuses</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none ml-auto"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="newest">Newest first</option>
          <option value="most-used">Most used first</option>
          {status === "pending" && (
            <option value="strongest-match">Strongest match first</option>
          )}
        </select>
      </div>

      <div>
        <div
          className="grid grid-cols-[3rem_8rem_minmax(0,1fr)_5rem_minmax(0,1fr)_minmax(0,1fr)_6rem_auto] gap-6 items-baseline py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--admin-ink)", borderBottom: "1px solid var(--admin-rule)" }}
        >
          <span className="admin-classification">#</span>
          <span className="admin-classification">Kind</span>
          <span className="admin-classification">Name</span>
          <span className="admin-classification text-right">Usage</span>
          <span className="admin-classification">Similar</span>
          <span className="admin-classification">Suggested by</span>
          <span className="admin-classification text-right">Proposed</span>
          <span className="admin-classification text-right">Action</span>
        </div>
        {data?.rows.map((r, i) => (
          <Link
            key={`${r.kind}-${r.id}`}
            to={`/vocab/${r.kind}/${r.id}`}
            className="grid grid-cols-[3rem_8rem_minmax(0,1fr)_5rem_minmax(0,1fr)_minmax(0,1fr)_6rem_auto] gap-6 items-baseline py-3 text-[14px] transition-colors hover:bg-[var(--admin-paper-edge)]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            <span className="admin-marginalia truncate">
              {r.kind}
              {r.status !== "pending" && (
                <span
                  className="ml-2"
                  style={{
                    color:
                      r.status === "approved"
                        ? "var(--color-success-700)"
                        : "var(--color-danger-700)",
                  }}
                >
                  · {r.status}
                </span>
              )}
            </span>
            <span className="truncate" style={{ color: "var(--admin-ink)" }}>{r.name}</span>
            <span
              className="text-right tabular-nums"
              style={{
                color:
                  r.usageCount > 0
                    ? "var(--admin-ink)"
                    : "var(--admin-marginalia)",
              }}
            >
              {r.usageCount}
            </span>
            <span className="truncate text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
              {r.similarApproved ? (
                <>
                  <span style={{ color: r.similarApproved.score >= 80 ? "var(--admin-ribbon)" : "var(--admin-ink-medium)" }}>
                    {r.similarApproved.name}
                  </span>
                  <span className="admin-marginalia ml-2 tabular-nums">{r.similarApproved.score}</span>
                </>
              ) : (
                "—"
              )}
            </span>
            <span className="truncate text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
              {r.suggestedBy?.displayName ?? r.suggestedBy?.email ?? "—"}
            </span>
            <span className="admin-marginalia text-right whitespace-nowrap tabular-nums">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
            <span className="admin-classification text-right" style={{ color: "var(--admin-ribbon)" }}>
              Review →
            </span>
          </Link>
        ))}
        {data && data.rows.length === 0 && !loading && (
          <p className="py-6 text-center italic" style={{ color: "var(--admin-marginalia)" }}>
            Nothing pending. Curation queue is clear.
          </p>
        )}
      </div>
    </div>
  );
}
