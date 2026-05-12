import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

const PROMOTABLE_FIELDS = [
  "shortName",
  "url",
  "logoUsageConsent",
  "logoCredit",
  "logoMain",
  "logoDark",
  "logoMark",
] as const;
type PromotableField = (typeof PROMOTABLE_FIELDS)[number];

interface OrgDetail {
  ok: true;
  organization: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
    url: string | null;
    logoUrl: string | null;
    logoStorageKey: string | null;
    logoDarkUrl: string | null;
    logoDarkStorageKey: string | null;
    logoMarkUrl: string | null;
    logoMarkStorageKey: string | null;
    logoUsageConsent: string | null;
    logoCredit: string | null;
    status: "pending" | "approved" | "rejected";
    mergedIntoId: string | null;
    deletedAt: string | null;
    createdAt: string;
  };
  memberCount: number;
}

/**
 * For each virtual logo field, return the URL we should show in the
 * preview column — the URL half of the pair. Empty string when not set.
 */
function logoPreview(
  o: OrgDetail["organization"],
  variant: "Main" | "Dark" | "Mark"
): string {
  if (variant === "Main") return o.logoUrl ?? "";
  if (variant === "Dark") return o.logoDarkUrl ?? "";
  return o.logoMarkUrl ?? "";
}

function previewValue(
  o: OrgDetail["organization"],
  field: PromotableField
): string {
  if (field === "logoMain") return logoPreview(o, "Main");
  if (field === "logoDark") return logoPreview(o, "Dark");
  if (field === "logoMark") return logoPreview(o, "Mark");
  const v = o[field];
  return v == null ? "" : String(v);
}

export function OrganizationMergeWizardPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const aId = params.get("a");
  const bId = params.get("b");

  // URL-backed wizard state — same pattern as the member merge wizard.
  const initialStep = (() => {
    const raw = parseInt(params.get("step") ?? "1", 10);
    return raw === 2 || raw === 3 ? (raw as 2 | 3) : 1;
  })();
  const initialCanonical = params.get("canonical");
  const initialPromote = new Set<PromotableField>(
    (params.get("promote") ?? "")
      .split(",")
      .filter((s): s is PromotableField =>
        (PROMOTABLE_FIELDS as readonly string[]).includes(s)
      )
  );
  const initialReason = params.get("reason") ?? "";

  const [a, setA] = useState<OrgDetail | null>(null);
  const [b, setB] = useState<OrgDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [canonicalId, setCanonicalId] = useState<string | null>(
    initialCanonical
  );
  const [promote, setPromote] = useState<Set<PromotableField>>(initialPromote);
  const [reason, setReason] = useState(initialReason);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set("step", String(step));
    if (canonicalId) next.set("canonical", canonicalId);
    else next.delete("canonical");
    if (promote.size > 0) next.set("promote", [...promote].join(","));
    else next.delete("promote");
    if (reason.trim()) next.set("reason", reason);
    else next.delete("reason");
    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canonicalId, promote, reason]);

  useEffect(() => {
    if (!aId || !bId) {
      setError("Missing organization ids in URL");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [ra, rb] = await Promise.all([
          apiFetch(`/admin/organizations/${aId}`).then((r) => r.json()),
          apiFetch(`/admin/organizations/${bId}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setA(ra as OrgDetail);
        setB(rb as OrgDetail);
        // Default canonical = the side with more members. Ties break on
        // populated-field count.
        setCanonicalId((current) => {
          if (current) return current;
          if (ra.memberCount > rb.memberCount) return aId;
          if (rb.memberCount > ra.memberCount) return bId;
          const aCount = countPopulated(ra.organization);
          const bCount = countPopulated(rb.organization);
          if (aCount > bCount) return aId;
          if (bCount > aCount) return bId;
          return null;
        });
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch, aId, bId]);

  const promotable = useMemo(() => {
    if (!a || !b || !canonicalId) return [];
    const source = (canonicalId === aId ? b : a).organization;
    const target = (canonicalId === aId ? a : b).organization;
    return PROMOTABLE_FIELDS.filter((f) => {
      const sv = previewValue(source, f);
      const tv = previewValue(target, f);
      if (!sv) return false;
      if (!tv) return true;
      if (sv.length > tv.length) return true;
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
      const res = await apiFetch(
        `/admin/organizations/${sourceId}/merge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetOrganizationId: targetId,
            promotedFields: [...promote],
            reason: reason.trim() || undefined,
          }),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setSubmitError(body?.message ?? `POST responded ${res.status}`);
        return;
      }
      navigate(`/organizations/${targetId}`, { replace: true });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
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
  if (!a || !b) return <p className="admin-marginalia">Loading…</p>;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">
        US-RSE · Admin · Organizations · Merge · Step{" "}
        {["I", "II", "III"][step - 1]}
      </p>
      <h2
        className="admin-display mb-2"
        style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}
      >
        {step === 1
          ? "Pick canonical."
          : step === 2
            ? "Promote fields."
            : "Confirm."}
      </h2>
      <div
        className="h-[2px] mb-10"
        style={{ background: "var(--admin-rule-subtle)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${(step / 3) * 100}%`,
            background: "var(--admin-ribbon)",
            transition: "width 250ms",
          }}
        />
      </div>

      {step === 1 && (
        <div>
          <div className="grid grid-cols-2 gap-8 mb-8">
            {[a, b].map((o) => (
              <label
                key={o.organization.id}
                className="cursor-pointer block p-6"
                style={{
                  border:
                    canonicalId === o.organization.id
                      ? "2px solid var(--admin-ribbon)"
                      : "1px solid var(--admin-rule)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p
                    className="font-display text-xl font-semibold"
                    style={{ color: "var(--admin-ink)" }}
                  >
                    {o.organization.name}
                  </p>
                  <input
                    type="radio"
                    checked={canonicalId === o.organization.id}
                    onChange={() => setCanonicalId(o.organization.id)}
                  />
                </div>
                <p
                  className="font-mono text-[12px] mb-2"
                  style={{ color: "var(--admin-ink-medium)" }}
                >
                  {o.organization.slug}
                </p>
                <p className="admin-marginalia">
                  {o.memberCount} member{o.memberCount === 1 ? "" : "s"} ·
                  added{" "}
                  {new Date(o.organization.createdAt).toLocaleDateString()}
                  {o.organization.url && ` · ${o.organization.url}`}
                </p>
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
            <p
              className="italic mb-8"
              style={{ color: "var(--admin-marginalia)" }}
            >
              No fields to promote — the canonical row is fuller or equal
              across the board.
            </p>
          ) : (
            <ul
              className="space-y-3 mb-8"
              style={{ borderTop: "1px solid var(--admin-rule)" }}
            >
              {promotable.map((f) => {
                const source = (canonicalId === aId ? b : a).organization;
                const target = (canonicalId === aId ? a : b).organization;
                return (
                  <li
                    key={f}
                    className="py-3 grid grid-cols-[1.5rem_8rem_1fr_1fr] gap-4 items-baseline"
                    style={{
                      borderBottom: "1px solid var(--admin-rule-subtle)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={promote.has(f)}
                      onChange={(e) => {
                        const next = new Set(promote);
                        if (e.target.checked) next.add(f);
                        else next.delete(f);
                        setPromote(next);
                      }}
                    />
                    <span className="admin-classification">{f}</span>
                    <span
                      className="font-mono text-[12px] truncate"
                      style={{ color: "var(--admin-ink-medium)" }}
                      title={previewValue(source, f)}
                    >
                      src: {previewValue(source, f).slice(0, 60) || "—"}
                    </span>
                    <span
                      className="font-mono text-[12px] truncate"
                      style={{ color: "var(--admin-marginalia)" }}
                      title={previewValue(target, f)}
                    >
                      tgt: {previewValue(target, f).slice(0, 60) || "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="admin-classification"
            >
              ← Back
            </button>
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
            <p
              className="text-[14px] leading-[1.7]"
              style={{ color: "var(--admin-ink)" }}
            >
              Merging{" "}
              <strong>
                {(canonicalId === aId ? b : a).organization.name}
              </strong>{" "}
              into{" "}
              <strong>
                {(canonicalId === aId ? a : b).organization.name}
              </strong>
              .
            </p>
            <p className="mt-4 admin-marginalia">
              Will move{" "}
              {(canonicalId === aId ? b : a).memberCount} member affiliation
              {(canonicalId === aId ? b : a).memberCount === 1 ? "" : "s"} plus
              any org memberships / event sponsorships to the target. Promoting{" "}
              {promote.size} field{promote.size === 1 ? "" : "s"}.
            </p>
          </div>

          <label className="block mb-6">
            <span className="admin-classification block mb-2">
              Reason (optional)
            </span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={280}
              className="w-full bg-transparent border-0 py-1.5 outline-none"
              style={{
                borderBottom: "1px solid var(--admin-rule)",
                color: "var(--admin-ink)",
              }}
            />
          </label>

          {submitError && (
            <p
              className="mb-4 admin-classification"
              style={{ color: "var(--color-danger-700)" }}
            >
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <Link
              to="/organizations/duplicates"
              className="admin-classification"
            >
              Cancel
            </Link>
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

function countPopulated(o: OrgDetail["organization"]): number {
  let n = 0;
  for (const v of Object.values(o)) {
    if (v !== null && v !== undefined && v !== "") n++;
  }
  return n;
}
