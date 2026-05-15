import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { StatusDot } from "../../components/StatusDot";

type VocabKind = "disciplines" | "skills" | "languages";
type StatusFilter = "pending" | "approved" | "rejected" | "all";

interface ListRow {
  kind: VocabKind;
  id: string;
  name: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  suggestedBy: { id: string; displayName: string | null; email: string } | null;
  usageCount: number;
}

interface ListResponse {
  ok: true;
  rows: ListRow[];
}

const KIND_LABELS: Record<VocabKind, string> = {
  disciplines: "Disciplines",
  skills: "Skills",
  languages: "Languages",
};

export function VocabListPage() {
  const apiFetch = useApi();
  const { kind } = useParams<{ kind: VocabKind }>();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = (params.get("status") ?? "pending") as StatusFilter;
  const q = params.get("q") ?? "";

  const load = useCallback(async () => {
    if (!kind) return;
    setError(null);
    const sp = new URLSearchParams({ status });
    if (q) sp.set("q", q);
    try {
      const res = await apiFetch(`/admin/vocab/${kind}?${sp}`);
      if (!res.ok) {
        setError(`/admin/vocab/${kind} responded ${res.status}`);
        return;
      }
      setData((await res.json()) as ListResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, kind, status, q]);

  useEffect(() => { void load(); }, [load]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "pending") next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  if (!kind || !["disciplines", "skills", "languages"].includes(kind))
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        Unknown vocab kind.
      </p>
    );
  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Vocab · {KIND_LABELS[kind]}</p>
      <h2 className="admin-display mb-6" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {KIND_LABELS[kind]}.
      </h2>

      <div className="flex items-baseline gap-6 mb-6">
        <input
          type="text"
          placeholder="Search by name…"
          value={q}
          onChange={(e) => setParam("q", e.target.value)}
          className="font-mono text-xs px-3 py-1.5 flex-1 max-w-md"
          style={{
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--admin-rule)",
            color: "var(--admin-ink)",
            outline: "none",
          }}
        />
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div>
        <div
          className="grid grid-cols-[3rem_minmax(0,1fr)_5rem_8rem_minmax(0,1fr)_6rem_auto] gap-6 items-baseline py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--admin-ink)", borderBottom: "1px solid var(--admin-rule)" }}
        >
          <span className="admin-classification">#</span>
          <span className="admin-classification">Name</span>
          <span className="admin-classification text-right">Usage</span>
          <span className="admin-classification">Status</span>
          <span className="admin-classification">Suggested by</span>
          <span className="admin-classification text-right">Proposed</span>
          <span className="admin-classification text-right">Action</span>
        </div>
        {data?.rows.map((r, i) => (
          <Link
            key={r.id}
            to={`/vocab/${r.kind}/${r.id}`}
            className="grid grid-cols-[3rem_minmax(0,1fr)_5rem_8rem_minmax(0,1fr)_6rem_auto] gap-6 items-baseline py-3 text-[14px] transition-colors hover:bg-[var(--admin-paper-edge)]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            <span className="truncate" style={{ color: "var(--admin-ink)" }}>{r.name}</span>
            <span
              className="text-right tabular-nums"
              style={{ color: r.usageCount > 0 ? "var(--admin-ink)" : "var(--admin-marginalia)" }}
            >
              {r.usageCount}
            </span>
            <span>
              <StatusDot status={r.status} />
            </span>
            <span className="truncate text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
              {r.suggestedBy?.displayName ?? r.suggestedBy?.email ?? "—"}
            </span>
            <span className="admin-marginalia text-right whitespace-nowrap tabular-nums">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
            <span className="admin-classification text-right" style={{ color: "var(--admin-ribbon)" }}>
              Open →
            </span>
          </Link>
        ))}
        {data && data.rows.length === 0 && (
          <p className="py-6 text-center italic" style={{ color: "var(--admin-marginalia)" }}>
            No entries.
          </p>
        )}
      </div>
    </div>
  );
}
