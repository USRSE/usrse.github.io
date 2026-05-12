import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

interface PairUser {
  id: string;
  displayName: string | null;
  email: string;
  orcid: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  photoUrl: string | null;
  primaryOrgId: string | null;
  primaryOrgName: string | null;
  signedUpAt: string;
}

interface ScoredPair {
  score: number;
  tier: "high" | "medium" | "weak";
  signals: string[];
  users: [PairUser, PairUser];
}

export function DuplicatesPage() {
  const apiFetch = useApi();
  const [pairs, setPairs] = useState<ScoredPair[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch("/admin/users/duplicates");
        if (cancelled) return;
        if (!res.ok) { setError(`/admin/users/duplicates responded ${res.status}`); return; }
        const body = (await res.json()) as { ok: true; pairs: ScoredPair[] };
        setPairs(body.pairs);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [apiFetch]);

  if (error) return <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>{error}</p>;
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
      <p className="admin-classification mb-8">US-RSE · Admin · Members · Duplicates queue</p>
      <h2 className="admin-display mb-6" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        Candidate duplicates.
      </h2>

      <div className="flex items-baseline gap-6 mb-10">
        <span className="admin-classification">
          {counts.total} candidates · {counts.high} high · {counts.medium} medium · {counts.weak} weak
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
        <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No candidates at this tier.</p>
      ) : (
        <ul className="space-y-12">
          {filtered.map((p, i) => (
            <li key={`${p.users[0].id}-${p.users[1].id}`}>
              <div className="flex items-baseline justify-between mb-3">
                <p className="admin-classification tabular-nums">No. {String(i + 1).padStart(3, "0")}</p>
                <p className="admin-classification" style={{ color: p.tier === "high" ? "var(--admin-ribbon)" : p.tier === "medium" ? "var(--admin-mark)" : "var(--admin-marginalia)" }}>
                  Score {p.score} · {p.tier} · {p.signals.join(" · ")}
                </p>
              </div>
              <div className="grid grid-cols-[1fr_4rem_1fr] gap-8 items-stretch" style={{ borderTop: "1px solid var(--admin-rule)", paddingTop: "1.5rem" }}>
                <PairCard user={p.users[0]} />
                <div className="flex items-center justify-center">
                  <span className="admin-classification" style={{ color: "var(--admin-marginalia)" }}>↔</span>
                </div>
                <PairCard user={p.users[1]} />
              </div>
              <div className="mt-6 flex justify-end">
                <Link
                  to={`/members/duplicates/merge?a=${p.users[0].id}&b=${p.users[1].id}`}
                  className="admin-classification"
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  Review →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PairCard({ user }: { user: PairUser }) {
  return (
    <div>
      <p className="font-display text-xl font-semibold mb-1" style={{ color: "var(--admin-ink)" }}>
        {user.displayName ?? <em style={{ color: "var(--admin-marginalia)" }}>no name</em>}
      </p>
      <p className="font-mono text-[12px] mb-3" style={{ color: "var(--admin-ink-medium)" }}>{user.email}</p>
      <dl className="space-y-1 text-[13px]">
        {user.primaryOrgName && <DL k="Org" v={user.primaryOrgName} />}
        {user.orcid && <DL k="ORCID" v={user.orcid} />}
        {user.githubUrl && <DL k="GitHub" v={user.githubUrl} />}
        {user.linkedinUrl && <DL k="LinkedIn" v={user.linkedinUrl} />}
        <DL k="Joined" v={new Date(user.signedUpAt).toLocaleDateString()} />
      </dl>
    </div>
  );
}

function DL({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-3">
      <dt className="admin-marginalia">{k}</dt>
      <dd className="font-mono text-[12px]" style={{ color: "var(--admin-ink)" }}>{v}</dd>
    </div>
  );
}
