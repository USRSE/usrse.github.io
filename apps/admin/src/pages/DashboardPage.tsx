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

interface RegisterTotals {
  members: number | null;
  organizations: number | null;
}

export function DashboardPage() {
  const actor = useShellActor();
  const apiFetch = useApi();
  const [recentAudit, setRecentAudit] = useState<AuditRow[] | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [totals, setTotals] = useState<RegisterTotals>({
    members: null,
    organizations: null,
  });

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

  // Register totals — only staff+ see Members / Organizations in the
  // sidebar, so we also gate the dashboard counts the same way to
  // avoid 403s for plain members. limit=1 keeps the response tiny;
  // we only care about the total field.
  useEffect(() => {
    if (actor.systemTier < 1) return;
    let cancelled = false;
    void (async () => {
      try {
        const [usersRes, orgsRes] = await Promise.all([
          apiFetch("/admin/users?limit=1"),
          apiFetch("/admin/organizations?limit=1"),
        ]);
        if (cancelled) return;
        const next: RegisterTotals = { members: null, organizations: null };
        if (usersRes.ok) {
          const body = (await usersRes.json()) as { total?: number };
          if (typeof body.total === "number") next.members = body.total;
        }
        if (orgsRes.ok) {
          const body = (await orgsRes.json()) as { total?: number };
          if (typeof body.total === "number") next.organizations = body.total;
        }
        if (!cancelled) setTotals(next);
      } catch {
        /* totals are a glance affordance, not load-bearing — swallow */
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

      {actor.systemTier >= 1 && (
        <section className="mt-16">
          <p className="admin-classification mb-6">Register · Totals</p>
          <div
            className="grid grid-cols-2 gap-px"
            style={{
              borderTop: "1px solid var(--admin-rule)",
              borderBottom: "1px solid var(--admin-rule)",
              background: "var(--admin-rule-subtle)",
            }}
          >
            <TotalTile
              eyebrow="α · Members"
              total={totals.members}
              to="/members"
            />
            <TotalTile
              eyebrow="β · Organizations"
              total={totals.organizations}
              to="/organizations"
            />
          </div>
        </section>
      )}

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

/**
 * Single-stat tile for the dashboard register-totals strip. The number
 * is the visual anchor; the eyebrow names the register; the tile is
 * itself the affordance to drill into the corresponding list page.
 * Editorial sparse: oversized tabular figure, mono eyebrow, ribbon-on-
 * hover so the link semantics are obvious without explicit chrome.
 */
function TotalTile({
  eyebrow,
  total,
  to,
}: {
  eyebrow: string;
  total: number | null;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group block p-8 transition-colors"
      style={{ background: "var(--admin-paper)" }}
    >
      <p
        className="admin-classification mb-4 transition-colors group-hover:text-[color:var(--admin-ribbon)]"
        style={{ color: "var(--admin-marginalia)" }}
      >
        {eyebrow}
      </p>
      <p
        className="font-display font-semibold tabular-nums leading-none"
        style={{
          fontSize: "clamp(2.5rem, 4vw, 4rem)",
          color: "var(--admin-ink)",
        }}
      >
        {total === null ? (
          <span style={{ color: "var(--admin-marginalia)" }}>—</span>
        ) : (
          total.toLocaleString()
        )}
      </p>
      <p
        className="admin-classification mt-4 transition-colors group-hover:text-[color:var(--admin-ribbon)]"
        style={{ color: "var(--admin-ink-medium)" }}
      >
        Browse register →
      </p>
    </Link>
  );
}
