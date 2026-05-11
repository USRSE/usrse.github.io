import { useCallback, useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

interface AuditRow {
  id: string;
  actorId: string;
  actorEmail: string | null;
  actorRole: "member" | "staff" | "super_admin";
  action: string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export function AuditPage() {
  const apiFetch = useApi();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");

  const load = useCallback(async (nextCursor: string | null) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "50" });
    if (actionFilter) params.set("action", actionFilter);
    if (nextCursor) params.set("cursor", nextCursor);
    try {
      const res = await apiFetch(`/admin/audit?${params}`);
      if (!res.ok) { setError(`/admin/audit responded ${res.status}`); return; }
      const body = (await res.json()) as { ok: true; rows: AuditRow[]; nextCursor: string | null };
      setRows((prev) => (nextCursor ? [...prev, ...body.rows] : body.rows));
      setCursor(body.nextCursor);
      setHasMore(Boolean(body.nextCursor));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, [apiFetch, actionFilter]);

  useEffect(() => { void load(null); }, [load]);

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-8">US-RSE · Admin · Register VIII</p>
      <div className="flex items-baseline justify-between gap-6 mb-8">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          Audit
        </h2>
        <input
          type="text"
          placeholder="Filter action…"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="font-mono text-xs px-3 py-1.5 w-72 transition-colors"
          style={{
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--admin-rule)",
            color: "var(--admin-ink)",
            outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--admin-ribbon)"; }}
          onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--admin-rule)"; }}
        />
      </div>

      {error && (
        <p className="mb-6 admin-classification" style={{ color: "var(--color-danger-700)" }}>{error}</p>
      )}

      <div style={{ borderTop: "1px solid var(--admin-ink)" }}>
        {rows.map((r, i) => (
          <div
            key={r.id}
            className="grid grid-cols-[3rem_minmax(7rem,auto)_minmax(0,1fr)_minmax(0,1fr)_minmax(7rem,auto)] gap-6 items-baseline py-3 text-[13px]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            <span className="font-mono tabular-nums whitespace-nowrap" style={{ color: "var(--admin-ink-medium)" }}>
              {new Date(r.createdAt).toLocaleString()}
            </span>
            <span style={{ color: "var(--admin-ink)" }}>
              {r.actorEmail ?? r.actorId}
              <span className="admin-marginalia ml-2">· {r.actorRole}</span>
            </span>
            <span className="font-mono" style={{ color: "var(--admin-ink)" }}>{r.action}</span>
            <span className="font-mono admin-marginalia text-right">
              {r.targetType} · {r.targetId.slice(0, 8)}
            </span>
          </div>
        ))}
        {rows.length === 0 && !loading && (
          <p className="py-6 text-center italic" style={{ color: "var(--admin-marginalia)" }}>
            No entries recorded.
          </p>
        )}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void load(cursor)}
            disabled={loading}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--admin-ribbon)" }}
          >
            {loading ? "Loading…" : "Load more entries →"}
          </button>
        </div>
      )}
    </div>
  );
}
