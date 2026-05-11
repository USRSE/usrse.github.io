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
        if (!res.ok) { setAuditError(`/admin/audit responded ${res.status}`); return; }
        const body = (await res.json()) as { ok: true; rows: AuditRow[] };
        setRecentAudit(body.rows);
      } catch (e) {
        if (cancelled) return;
        setAuditError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [actor.systemTier, apiFetch]);

  const handle = actor.user.email.split("@")[0];
  const tierLabel = actor.systemTier === 2 ? "Super admin"
    : actor.systemTier === 1 ? "Staff" : "Member";

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-8">
        US-RSE · Admin · Dashboard
      </p>
      <h2 className="admin-display mb-6" style={{ fontSize: "clamp(2.5rem, 3.5vw + 0.5rem, 3.5rem)" }}>
        <span style={{ color: "var(--admin-ink)" }}>Welcome,</span>
        <br />
        <span style={{ color: "var(--admin-ribbon)" }}>{handle}.</span>
      </h2>
      <div style={{ borderTop: "1px solid var(--admin-rule)" }} className="pt-6">
        <p className="text-[15px] leading-[1.7]" style={{ color: "var(--admin-ink-medium)", maxWidth: "var(--admin-measure)" }}>
          You are signed in as <span style={{ color: "var(--admin-ink)" }}>{tierLabel}</span>
          {actor.leadershipPositions.length > 0 && (
            <>, also serving as {actor.leadershipPositions.map((p) => p.label).join(", ")}</>
          )}.
        </p>
      </div>

      {actor.systemTier >= 2 && (
        <section className="mt-16">
          <div className="flex items-baseline justify-between mb-6">
            <p className="admin-classification">Register · Recent activity</p>
            <Link to="/audit" className="admin-classification" style={{ color: "var(--admin-ribbon)" }}>
              Full register →
            </Link>
          </div>
          {auditError ? (
            <p className="text-sm" style={{ color: "var(--color-danger-700)" }}>{auditError}</p>
          ) : !recentAudit ? (
            <p className="admin-marginalia">Loading…</p>
          ) : recentAudit.length === 0 ? (
            <p className="text-[15px] italic" style={{ color: "var(--admin-marginalia)" }}>
              No entries recorded.
            </p>
          ) : (
            <ol className="space-y-0" style={{ borderTop: "1px solid var(--admin-rule)" }}>
              {recentAudit.map((r, i) => (
                <li
                  key={r.id}
                  className="grid grid-cols-[3rem_1fr_auto] gap-6 items-baseline py-3"
                  style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
                >
                  <span className="admin-marginalia tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[13px]" style={{ color: "var(--admin-ink)" }}>
                    {r.action}
                  </span>
                  <span className="admin-marginalia text-right whitespace-nowrap">
                    {r.actorEmail ?? "?"} · {new Date(r.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {(actor.chairedGroupIds.length > 0 || actor.chairedEventIds.length > 0) && (
        <section className="mt-16">
          <p className="admin-classification mb-6">Register · Your responsibilities</p>
          <ul className="space-y-0" style={{ borderTop: "1px solid var(--admin-rule)" }}>
            {actor.chairedGroupIds.map((id) => (
              <li key={`g-${id}`} className="py-3 flex items-baseline gap-4" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                <span className="admin-marginalia">Group</span>
                <Link to={`/groups/${id}`} className="text-[15px]" style={{ color: "var(--admin-ink)" }}>
                  {id}
                </Link>
              </li>
            ))}
            {actor.chairedEventIds.map((id) => (
              <li key={`e-${id}`} className="py-3 flex items-baseline gap-4" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                <span className="admin-marginalia">Event</span>
                <Link to={`/events/${id}`} className="text-[15px]" style={{ color: "var(--admin-ink)" }}>
                  {id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
