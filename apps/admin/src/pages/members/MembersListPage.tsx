import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { RoleTag } from "../../components/RoleTag";
import { StatusTag } from "../../components/StatusTag";
import { useShellActor } from "../../layout/AdminShell";

interface MemberRow {
  id: string;
  memberId: string;
  email: string;
  role: "member" | "staff" | "super_admin" | "admin";
  mergedIntoUserId: string | null;
  deletedAt: string | null;
  isLegacyImport: boolean;
  createdAt: string;
  displayName: string | null;
  photoUrl: string | null;
}

type StatusFilter = "active" | "merged" | "deleted";
type RoleFilter = "" | "member" | "staff" | "super_admin";

export function MembersListPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = params.get("q") ?? "";
  const status = (params.get("status") ?? "active") as StatusFilter;
  const role = (params.get("role") ?? "") as RoleFilter;

  const load = useCallback(async (nextCursor: string | null) => {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams({ limit: "50", status });
    if (q) sp.set("q", q);
    if (role) sp.set("role", role);
    if (nextCursor) sp.set("cursor", nextCursor);
    try {
      const res = await apiFetch(`/admin/users?${sp}`);
      if (!res.ok) { setError(`/admin/users responded ${res.status}`); return; }
      const body = (await res.json()) as { ok: true; rows: MemberRow[]; nextCursor: string | null };
      setRows((prev) => (nextCursor ? [...prev, ...body.rows] : body.rows));
      setCursor(body.nextCursor);
      setHasMore(Boolean(body.nextCursor));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, [apiFetch, q, role, status]);

  useEffect(() => { void load(null); }, [load]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value); else next.delete(name);
    setParams(next, { replace: true });
  }

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-8">US-RSE · Admin · Register I</p>
      <div className="flex items-baseline justify-between gap-6 mb-6">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          Members.
        </h2>
        {actor.systemTier >= 2 && (
          <Link to="/members/duplicates" className="admin-classification" style={{ color: "var(--admin-ribbon)" }}>
            Find duplicates →
          </Link>
        )}
      </div>

      <div className="flex items-baseline gap-6 mb-6">
        <input
          type="text"
          placeholder="Search displayName, email, member id…"
          value={q}
          onChange={(e) => setParam("q", e.target.value)}
          className="font-mono text-xs px-3 py-1.5 flex-1 max-w-md"
          style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)", outline: "none" }}
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
          value={role}
          onChange={(e) => setParam("role", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="">All roles</option>
          <option value="member">Member</option>
          <option value="staff">Staff</option>
          <option value="super_admin">Super admin</option>
        </select>
      </div>

      {error && <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>{error}</p>}

      <div>
        <div
          className="grid grid-cols-[3rem_8rem_minmax(0,1fr)_minmax(0,1fr)_8rem_7rem] gap-6 items-baseline py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--admin-ink)", borderBottom: "1px solid var(--admin-rule)" }}
        >
          <span className="admin-classification">#</span>
          <span className="admin-classification">Member ID</span>
          <span className="admin-classification">Name</span>
          <span className="admin-classification">Email</span>
          <span className="admin-classification">Role</span>
          <span className="admin-classification text-right">Joined</span>
        </div>
        {rows.map((r, i) => (
          <Link
            key={r.id}
            to={`/members/${r.id}`}
            className="grid grid-cols-[3rem_8rem_minmax(0,1fr)_minmax(0,1fr)_8rem_7rem] gap-6 items-baseline py-3 text-[14px] transition-colors hover:bg-[var(--admin-paper-edge)]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            <span className="font-mono text-[11px] admin-marginalia tabular-nums truncate">
              {r.memberId}
            </span>
            <span className="truncate" style={{ color: "var(--admin-ink)" }}>
              {r.displayName ?? <em style={{ color: "var(--admin-marginalia)" }}>no name</em>}{" "}
              <StatusTag deletedAt={r.deletedAt} mergedIntoUserId={r.mergedIntoUserId} isLegacyImport={r.isLegacyImport} />
            </span>
            <span className="font-mono text-[12px] truncate" style={{ color: "var(--admin-ink-medium)" }}>
              {r.email}
            </span>
            <RoleTag role={r.role} />
            <span className="admin-marginalia text-right whitespace-nowrap tabular-nums">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </Link>
        ))}
        {rows.length === 0 && !loading && (
          <p className="py-6 text-center italic" style={{ color: "var(--admin-marginalia)" }}>No entries found.</p>
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
