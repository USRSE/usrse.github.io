import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../layout/AdminShell";

interface AuditRow {
  id: string;
  actorEmail: string | null;
  action: string;
  createdAt: string;
}

export function DashboardPage() {
  const actor = useShellActor();
  const apiFetch = useApi();
  const [recentAudit, setRecentAudit] = useState<AuditRow[] | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    if (actor.systemTier < 2) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch("/admin/audit?limit=10");
        if (cancelled) return;
        if (!res.ok) {
          setAuditError(`/admin/audit responded ${res.status}`);
          return;
        }
        const body = (await res.json()) as { ok: true; rows: AuditRow[] };
        setRecentAudit(body.rows);
      } catch (e) {
        if (cancelled) return;
        setAuditError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor.systemTier, apiFetch]);

  return (
    <div className="space-y-10">
      <header>
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Welcome, {actor.user.email.split("@")[0]}
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 mt-3">
          {actor.systemTier === 2
            ? "super admin"
            : actor.systemTier === 1
              ? "staff"
              : "member"}
          {actor.leadershipPositions.length > 0 &&
            ` · ${actor.leadershipPositions.map((p) => p.label).join(", ")}`}
        </p>
      </header>

      {actor.systemTier >= 2 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-3">
            Recent admin activity
          </h3>
          <div className="border border-neutral-100 rounded-xl overflow-hidden bg-white">
            {auditError ? (
              <p className="p-4 text-sm text-rose-600">{auditError}</p>
            ) : !recentAudit ? (
              <p className="p-4 text-sm text-neutral-500">Loading…</p>
            ) : recentAudit.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500 italic">
                No admin activity yet.
              </p>
            ) : (
              <ul>
                {recentAudit.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-4 py-2 border-b border-neutral-100 last:border-0"
                  >
                    <span className="text-sm">{r.action}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                      {r.actorEmail ?? "?"} ·{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="p-3 border-t border-neutral-100 bg-neutral-50">
              <Link
                to="/audit"
                className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-700 hover:text-purple-900"
              >
                View full audit timeline →
              </Link>
            </div>
          </div>
        </section>
      )}

      {(actor.chairedGroupIds.length > 0 ||
        actor.chairedEventIds.length > 0) && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-3">
            Your responsibilities
          </h3>
          <ul className="space-y-1">
            {actor.chairedGroupIds.map((id) => (
              <li key={`g-${id}`}>
                <Link
                  to={`/groups/${id}`}
                  className="text-sm text-purple-700 hover:underline"
                >
                  Group · {id}
                </Link>
              </li>
            ))}
            {actor.chairedEventIds.map((id) => (
              <li key={`e-${id}`}>
                <Link
                  to={`/events/${id}`}
                  className="text-sm text-purple-700 hover:underline"
                >
                  Event · {id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
