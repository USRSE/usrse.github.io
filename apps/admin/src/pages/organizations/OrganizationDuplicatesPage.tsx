import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

interface PairOrg {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  url: string | null;
  status: "pending" | "approved" | "rejected";
  memberCount: number;
}

interface ScoredOrgPair {
  score: number;
  tier: "high" | "medium" | "weak";
  signals: string[];
  organizations: [PairOrg, PairOrg];
}

export function OrganizationDuplicatesPage() {
  const apiFetch = useApi();
  const [pairs, setPairs] = useState<ScoredOrgPair[] | null>(null);
  const [dismissedCount, setDismissedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch("/admin/organizations/duplicates");
        if (cancelled) return;
        if (!res.ok) {
          setError(`/admin/organizations/duplicates responded ${res.status}`);
          return;
        }
        const body = (await res.json()) as {
          ok: true;
          pairs: ScoredOrgPair[];
          dismissedCount?: number;
        };
        setPairs(body.pairs);
        setDismissedCount(body.dismissedCount ?? 0);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  async function dismissPair(aId: string, bId: string) {
    const key = `${aId}|${bId}`;
    setDismissing((s) => new Set(s).add(key));
    const previous = pairs;
    setPairs((cur) =>
      cur
        ? cur.filter(
            (p) =>
              !(p.organizations[0].id === aId && p.organizations[1].id === bId)
          )
        : cur
    );
    setDismissedCount((n) => n + 1);
    try {
      const res = await apiFetch("/admin/organizations/duplicates/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationAId: aId, organizationBId: bId }),
      });
      if (!res.ok) {
        setPairs(previous);
        setDismissedCount((n) => Math.max(0, n - 1));
        setError(`Dismiss failed (${res.status})`);
      }
    } catch (e) {
      setPairs(previous);
      setDismissedCount((n) => Math.max(0, n - 1));
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDismissing((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
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
  if (!pairs) return <p className="admin-marginalia">Computing candidates…</p>;

  const counts = {
    total: pairs.length,
    high: pairs.filter((p) => p.tier === "high").length,
    medium: pairs.filter((p) => p.tier === "medium").length,
    weak: pairs.filter((p) => p.tier === "weak").length,
  };

  const filtered = pairs.filter((p) => {
    if (filter === "all") return true;
    if (filter === "high") return p.tier === "high";
    if (filter === "medium") return p.tier === "high" || p.tier === "medium";
    return true;
  });

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-8">
        US-RSE · Admin · Organizations · Duplicates queue
      </p>
      <h2
        className="admin-display mb-6"
        style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}
      >
        Candidate duplicates.
      </h2>

      <div className="flex items-baseline gap-6 mb-10">
        <span className="admin-classification">
          {counts.total} candidates · {counts.high} high · {counts.medium}{" "}
          medium · {counts.weak} weak
          {dismissedCount > 0 ? ` · ${dismissedCount} dismissed` : ""}
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="admin-classification bg-transparent border-0 outline-none ml-auto"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="all">Show all</option>
          <option value="medium">Show ≥ medium</option>
          <option value="high">Show only high</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p
          className="italic"
          style={{ color: "var(--admin-marginalia)" }}
        >
          No candidates at this tier.
        </p>
      ) : (
        <ul className="space-y-12">
          {filtered.map((p, i) => (
            <li
              key={`${p.organizations[0].id}-${p.organizations[1].id}`}
            >
              <div className="flex items-baseline justify-between mb-3">
                <p className="admin-classification tabular-nums">
                  No. {String(i + 1).padStart(3, "0")}
                </p>
                <p
                  className="admin-classification"
                  style={{
                    color:
                      p.tier === "high"
                        ? "var(--admin-ribbon)"
                        : p.tier === "medium"
                          ? "var(--admin-mark)"
                          : "var(--admin-marginalia)",
                  }}
                >
                  Score {p.score} · {p.tier} · {p.signals.join(" · ")}
                </p>
              </div>
              <div
                className="grid grid-cols-[1fr_4rem_1fr] gap-8 items-stretch"
                style={{
                  borderTop: "1px solid var(--admin-rule)",
                  paddingTop: "1.5rem",
                }}
              >
                <PairOrgCard org={p.organizations[0]} />
                <div className="flex items-center justify-center">
                  <span
                    className="admin-classification"
                    style={{ color: "var(--admin-marginalia)" }}
                  >
                    ↔
                  </span>
                </div>
                <PairOrgCard org={p.organizations[1]} />
              </div>
              <div className="mt-6 flex justify-end items-baseline gap-6">
                <button
                  type="button"
                  onClick={() =>
                    void dismissPair(
                      p.organizations[0].id,
                      p.organizations[1].id
                    )
                  }
                  disabled={dismissing.has(
                    `${p.organizations[0].id}|${p.organizations[1].id}`
                  )}
                  className="admin-classification disabled:opacity-50"
                  style={{ color: "var(--admin-marginalia)" }}
                >
                  Not a duplicate ✕
                </button>
                <Link
                  to={`/organizations/duplicates/merge?a=${p.organizations[0].id}&b=${p.organizations[1].id}`}
                  className="admin-classification"
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  Open merge wizard →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PairOrgCard({ org }: { org: PairOrg }) {
  return (
    <div>
      <p
        className="font-display text-xl font-semibold mb-1"
        style={{ color: "var(--admin-ink)" }}
      >
        {org.name}
      </p>
      <p
        className="font-mono text-[12px] mb-3"
        style={{ color: "var(--admin-ink-medium)" }}
      >
        {org.slug}
        {org.shortName && (
          <span className="ml-2 admin-marginalia">· {org.shortName}</span>
        )}
      </p>
      <dl className="space-y-1 text-[13px]">
        {org.url && <DL k="URL" v={org.url} />}
        <DL k="Members" v={String(org.memberCount)} />
        <DL k="Status" v={org.status} />
      </dl>
    </div>
  );
}

function DL({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-3">
      <dt className="admin-marginalia">{k}</dt>
      <dd
        className="font-mono text-[12px] truncate"
        style={{ color: "var(--admin-ink)" }}
        title={v}
      >
        {v}
      </dd>
    </div>
  );
}
