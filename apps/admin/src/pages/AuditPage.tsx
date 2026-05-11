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

  const load = useCallback(
    async (nextCursor: string | null) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: "50" });
      if (actionFilter) params.set("action", actionFilter);
      if (nextCursor) params.set("cursor", nextCursor);
      try {
        const res = await apiFetch(`/admin/audit?${params}`);
        if (!res.ok) {
          setError(`/admin/audit responded ${res.status}`);
          return;
        }
        const body = (await res.json()) as {
          ok: true;
          rows: AuditRow[];
          nextCursor: string | null;
        };
        setRows((prev) => (nextCursor ? [...prev, ...body.rows] : body.rows));
        setCursor(body.nextCursor);
        setHasMore(Boolean(body.nextCursor));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [apiFetch, actionFilter]
  );

  useEffect(() => {
    void load(null);
  }, [load]);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Audit log
        </h2>
        <input
          type="text"
          placeholder="Filter by action substring…"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="font-mono text-xs px-3 py-1.5 rounded-full border border-neutral-300 w-72"
        />
      </header>

      {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}

      <div className="border border-neutral-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                When
              </th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Actor
              </th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Action
              </th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Target
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-3 py-2 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-neutral-800">
                  {r.actorEmail ?? r.actorId}{" "}
                  <span className="font-mono text-[10px] text-neutral-400">
                    · {r.actorRole}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[12px] text-neutral-800">
                  {r.action}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-neutral-600">
                  {r.targetType} · {r.targetId.slice(0, 8)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-neutral-500 italic"
                >
                  No rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-center">
        {hasMore && (
          <button
            type="button"
            onClick={() => void load(cursor)}
            disabled={loading}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-700 hover:text-purple-900 disabled:opacity-50"
          >
            {loading ? "loading…" : "load more"}
          </button>
        )}
      </div>
    </div>
  );
}
