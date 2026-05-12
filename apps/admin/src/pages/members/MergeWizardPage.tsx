import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

const PROMOTABLE_FIELDS = [
  "displayName", "headline", "bio", "photoUrl", "jobTitle",
  "githubUrl", "linkedinUrl", "orcid", "websiteUrl",
  "pronounId", "careerStageId", "countryId",
  "region", "city", "publicLocation",
] as const;
type PromotableField = (typeof PROMOTABLE_FIELDS)[number];

interface UserDetail {
  ok: true;
  user: {
    id: string;
    memberId: string;
    email: string;
    role: string;
    mergedIntoUserId: string | null;
    deletedAt: string | null;
    isLegacyImport: boolean;
    createdAt: string;
  };
  profile: Record<string, unknown> | null;
  affiliations: Array<{ id: string }>;
  recentAudit: Array<{ id: string }>;
}

export function MergeWizardPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const aId = params.get("a");
  const bId = params.get("b");

  const [a, setA] = useState<UserDetail | null>(null);
  const [b, setB] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [canonicalId, setCanonicalId] = useState<string | null>(null);
  const [promote, setPromote] = useState<Set<PromotableField>>(new Set());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!aId || !bId) {
      setError("Missing user ids in URL");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [ra, rb] = await Promise.all([
          apiFetch(`/admin/users/${aId}`).then((r) => r.json()),
          apiFetch(`/admin/users/${bId}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setA(ra as UserDetail);
        setB(rb as UserDetail);
        // Default canonical = the one with more populated fields.
        const aCount = countPopulated(ra.profile);
        const bCount = countPopulated(rb.profile);
        if (aCount > bCount) setCanonicalId(aId);
        else if (bCount > aCount) setCanonicalId(bId);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [apiFetch, aId, bId]);

  const promotable = useMemo(() => {
    if (!a || !b || !canonicalId) return [];
    const sourceProfile = (canonicalId === aId ? b : a).profile;
    const targetProfile = (canonicalId === aId ? a : b).profile;
    if (!sourceProfile) return [];
    return PROMOTABLE_FIELDS.filter((f) => {
      const sv = (sourceProfile as Record<string, unknown>)[f];
      const tv = targetProfile ? (targetProfile as Record<string, unknown>)[f] : null;
      if (sv === null || sv === undefined || sv === "") return false;
      if (tv === null || tv === undefined || tv === "") return true;
      if (typeof sv === "string" && typeof tv === "string" && sv.length > tv.length) return true;
      return false;
    });
  }, [a, b, canonicalId, aId]);

  async function submitMerge() {
    if (!a || !b || !canonicalId) return;
    setSubmitting(true);
    setSubmitError(null);
    const targetId = canonicalId;
    const sourceId = canonicalId === aId ? bId : aId;
    try {
      const res = await apiFetch(`/admin/users/${sourceId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: targetId,
          promotedFields: [...promote],
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setSubmitError(body?.message ?? `POST responded ${res.status}`);
        return;
      }
      navigate(`/members/${targetId}`, { replace: true });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally { setSubmitting(false); }
  }

  if (error) return <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>{error}</p>;
  if (!a || !b) return <p className="admin-marginalia">Loading…</p>;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Members · Merge · Step {["I", "II", "III"][step - 1]}</p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {step === 1 ? "Pick canonical." : step === 2 ? "Promote fields." : "Confirm."}
      </h2>
      <div className="h-[2px] mb-10" style={{ background: "var(--admin-rule-subtle)" }}>
        <div className="h-full" style={{ width: `${(step / 3) * 100}%`, background: "var(--admin-ribbon)", transition: "width 250ms" }} />
      </div>

      {step === 1 && (
        <div>
          <div className="grid grid-cols-2 gap-8 mb-8">
            {[a, b].map((u) => (
              <label key={u.user.id} className="cursor-pointer block p-6" style={{ border: canonicalId === u.user.id ? "2px solid var(--admin-ribbon)" : "1px solid var(--admin-rule)" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-display text-xl font-semibold" style={{ color: "var(--admin-ink)" }}>
                    {(u.profile as { displayName?: string } | null)?.displayName ?? <em>no name</em>}
                  </p>
                  <input
                    type="radio"
                    checked={canonicalId === u.user.id}
                    onChange={() => setCanonicalId(u.user.id)}
                  />
                </div>
                <p className="font-mono text-[12px] mb-2" style={{ color: "var(--admin-ink-medium)" }}>{u.user.email}</p>
                <p className="admin-marginalia">Member {u.user.memberId} · Joined {new Date(u.user.createdAt).toLocaleDateString()}</p>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={!canonicalId}
            onClick={() => setStep(2)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            Next → Step II
          </button>
        </div>
      )}

      {step === 2 && canonicalId && (
        <div>
          {promotable.length === 0 ? (
            <p className="italic mb-8" style={{ color: "var(--admin-marginalia)" }}>
              No fields to promote — target's profile is fuller or equal across the board.
            </p>
          ) : (
            <ul className="space-y-3 mb-8" style={{ borderTop: "1px solid var(--admin-rule)" }}>
              {promotable.map((f) => (
                <li key={f} className="py-3 grid grid-cols-[1.5rem_8rem_1fr_1fr] gap-4 items-baseline" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                  <input
                    type="checkbox"
                    checked={promote.has(f)}
                    onChange={(e) => {
                      const next = new Set(promote);
                      if (e.target.checked) next.add(f); else next.delete(f);
                      setPromote(next);
                    }}
                  />
                  <span className="admin-classification">{f}</span>
                  <span className="font-mono text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
                    src: {String((canonicalId === aId ? b : a).profile?.[f as keyof object] ?? "—").slice(0, 60)}
                  </span>
                  <span className="font-mono text-[12px]" style={{ color: "var(--admin-marginalia)" }}>
                    tgt: {String((canonicalId === aId ? a : b).profile?.[f as keyof object] ?? "—").slice(0, 60)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="admin-classification">← Back</button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="ml-auto inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600"
            >
              Next → Step III
            </button>
          </div>
        </div>
      )}

      {step === 3 && canonicalId && (
        <div>
          <div className="mb-6 p-6" style={{ border: "1px solid var(--admin-rule)" }}>
            <p className="text-[14px] leading-[1.7]" style={{ color: "var(--admin-ink)" }}>
              Merging{" "}
              <strong>{(canonicalId === aId ? b : a).profile?.["displayName" as keyof object] as string ?? "(no name)"}</strong>{" "}
              ({(canonicalId === aId ? b : a).user.email}) into{" "}
              <strong>{(canonicalId === aId ? a : b).profile?.["displayName" as keyof object] as string ?? "(no name)"}</strong>{" "}
              ({(canonicalId === aId ? a : b).user.email}).
            </p>
            <p className="mt-4 admin-marginalia">
              Will move {(canonicalId === aId ? b : a).affiliations.length} affiliations and audit history to the target.
              Promoting {promote.size} field{promote.size === 1 ? "" : "s"}.
            </p>
          </div>

          <label className="block mb-6">
            <span className="admin-classification block mb-2">Reason (optional)</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={280}
              className="w-full bg-transparent border-0 py-1.5 outline-none"
              style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)" }}
            />
          </label>

          {submitError && (
            <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>{submitError}</p>
          )}

          <div className="flex gap-3">
            <Link to="/members/duplicates" className="admin-classification">Cancel</Link>
            <button
              type="button"
              onClick={() => void submitMerge()}
              disabled={submitting}
              className="ml-auto inline-flex items-center gap-2 px-8 py-3 rounded-md bg-purple-500 text-white font-semibold text-base shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
            >
              {submitting ? "Merging…" : "Confirm merge"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function countPopulated(profile: unknown): number {
  if (!profile || typeof profile !== "object") return 0;
  let n = 0;
  for (const v of Object.values(profile as Record<string, unknown>)) {
    if (v !== null && v !== undefined && v !== "") n++;
  }
  return n;
}
