import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { OrgStatusTag } from "../../components/OrgStatusTag";
import { useShellActor } from "../../layout/AdminShell";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  url: string | null;
  logoUrl: string | null;
  logoMarkUrl: string | null;
  logoUsageConsent: string | null;
  status: "pending" | "approved";
  mergedIntoId: string | null;
  deletedAt: string | null;
  createdAt: string;
  memberCount: number;
}

type LifecycleFilter = "active" | "merged" | "deleted";
type VocabFilter = "all" | "pending" | "approved";

export function OrganizationsListPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = params.get("q") ?? "";
  const status = (params.get("status") ?? "active") as LifecycleFilter;
  const vocab = (params.get("vocab") ?? "all") as VocabFilter;

  const load = useCallback(
    async (nextCursor: string | null) => {
      setLoading(true);
      setError(null);
      const sp = new URLSearchParams({ limit: "50", status });
      if (q) sp.set("q", q);
      if (vocab !== "all") sp.set("vocab", vocab);
      if (nextCursor) sp.set("cursor", nextCursor);
      try {
        const res = await apiFetch(`/admin/organizations?${sp}`);
        if (!res.ok) {
          setError(`/admin/organizations responded ${res.status}`);
          return;
        }
        const body = (await res.json()) as {
          ok: true;
          rows: OrgRow[];
          total?: number;
          nextCursor: string | null;
        };
        setRows((prev) => (nextCursor ? [...prev, ...body.rows] : body.rows));
        setCursor(body.nextCursor);
        setHasMore(Boolean(body.nextCursor));
        if (typeof body.total === "number") setTotal(body.total);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [apiFetch, q, status, vocab]
  );

  useEffect(() => {
    void load(null);
  }, [load]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-8">US-RSE · Admin · Register II</p>
      <div className="flex items-baseline justify-between gap-6 mb-6">
        <h2
          className="admin-display"
          style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}
        >
          Organizations.
        </h2>
        <div className="flex items-baseline gap-6 ml-auto">
          {total !== null && (
            <span
              className="admin-classification tabular-nums"
              style={{ color: "var(--admin-marginalia)" }}
            >
              {total.toLocaleString()} total
            </span>
          )}
          {actor.systemTier >= 2 && (
            <Link
              to="/organizations/duplicates"
              className="admin-classification"
              style={{ color: "var(--admin-ribbon)" }}
            >
              Find duplicates →
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-6 mb-6">
        <input
          type="text"
          placeholder="Search name, slug, short name, URL…"
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
          <option value="active">Active</option>
          <option value="merged">Merged</option>
          <option value="deleted">Deleted</option>
        </select>
        <select
          value={vocab}
          onChange={(e) => setParam("vocab", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="all">All approval states</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {error && (
        <p
          className="mb-4 admin-classification"
          style={{ color: "var(--color-danger-700)" }}
        >
          {error}
        </p>
      )}

      <div>
        <div
          className="grid grid-cols-[3rem_10rem_minmax(0,1fr)_6rem_7rem_7rem] gap-6 items-baseline py-2 text-[11px]"
          style={{
            borderTop: "1px solid var(--admin-ink)",
            borderBottom: "1px solid var(--admin-rule)",
          }}
        >
          <span className="admin-classification">#</span>
          <span className="admin-classification">Slug</span>
          <span className="admin-classification">Name</span>
          <span className="admin-classification text-right">Members</span>
          <span className="admin-classification">Status</span>
          <span className="admin-classification text-right">Added</span>
        </div>
        {rows.map((r, i) => (
          <Link
            key={r.id}
            to={`/organizations/${r.id}`}
            className="grid grid-cols-[3rem_10rem_minmax(0,1fr)_6rem_7rem_7rem] gap-6 items-baseline py-3 text-[14px] transition-colors hover:bg-[var(--admin-paper-edge)]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">
              {String(i + 1).padStart(3, "0")}
            </span>
            <span
              className="font-mono text-[11px] admin-marginalia truncate"
              title={r.slug}
            >
              {r.slug}
            </span>
            <span
              className="truncate"
              style={{ color: "var(--admin-ink)" }}
              title={r.name}
            >
              {r.name}
              {r.shortName && (
                <span className="admin-marginalia ml-2">· {r.shortName}</span>
              )}
            </span>
            <span
              className="admin-marginalia text-right tabular-nums"
              title={`${r.memberCount} member${r.memberCount === 1 ? "" : "s"}`}
            >
              {r.memberCount}
            </span>
            <span>
              <OrgStatusTag
                deletedAt={r.deletedAt}
                mergedIntoId={r.mergedIntoId}
                vocabStatus={r.status}
              />
            </span>
            <span className="admin-marginalia text-right whitespace-nowrap tabular-nums">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </Link>
        ))}
        {rows.length === 0 && !loading && (
          <p
            className="py-6 text-center italic"
            style={{ color: "var(--admin-marginalia)" }}
          >
            No entries found.
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
