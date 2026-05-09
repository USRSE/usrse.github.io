import { useState } from "react";
import { SectionFrame, NotYetWritten } from "./SectionFrame";
import {
  OrganizationCombobox,
  type OrganizationSimple,
} from "./OrganizationCombobox";
import { useApi } from "@/lib/api";
import type {
  AffiliationItem,
  CurrentMember,
} from "@/hooks/useCurrentMember";

/**
 * §02 Affiliation — institutional anchor for the dossier.
 *
 * Renders one Pillar per affiliation. Primary affiliation always
 * leads. When the viewer is the owner, a secondary editor lets them
 * add/remove/edit affiliations and pick which one is primary. The
 * editor talks to POST/PATCH/DELETE /me/organizations and threads the
 * refreshed dossier back to onSaved so sibling sections stay in sync
 * (e.g., the hero subtitle reads from profile.organizationName which
 * is sourced from the primary affiliation).
 */

interface AffiliationSectionProps {
  member: CurrentMember;
  isOwner: boolean;
  jobTitle: string | null;
  careerStageLabel: string | null;
  publicLocation: string | null;
  countryName: string | null;
  onMemberUpdated?: (next: CurrentMember) => void;
}

export function AffiliationSection({
  member,
  isOwner,
  jobTitle,
  careerStageLabel,
  publicLocation,
  countryName,
  onMemberUpdated,
}: AffiliationSectionProps) {
  const [editing, setEditing] = useState(false);
  const affiliations = member.affiliations ?? [];

  return (
    <SectionFrame
      number="02"
      eyebrow="Affiliation"
      accent="teal"
      action={
        isOwner ? (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 hover:text-purple-600 transition-colors"
          >
            {editing ? "↩ done" : "✎ edit"}
          </button>
        ) : null
      }
    >
      <AffiliationRead
        affiliations={affiliations}
        jobTitle={jobTitle}
        careerStageLabel={careerStageLabel}
        publicLocation={publicLocation}
        countryName={countryName}
      />

      {editing && isOwner && (
        <div className="mt-8">
          <AffiliationEditor
            affiliations={affiliations}
            onMemberUpdated={(next) => onMemberUpdated?.(next)}
          />
        </div>
      )}
    </SectionFrame>
  );
}

// ── Read ──────────────────────────────────────────────────────────────

function AffiliationRead({
  affiliations,
  jobTitle,
  careerStageLabel,
  publicLocation,
  countryName,
}: {
  affiliations: AffiliationItem[];
  jobTitle: string | null;
  careerStageLabel: string | null;
  publicLocation: string | null;
  countryName: string | null;
}) {
  // Defensive de-dupe (mirrors ProfileView's place-line builder).
  const locationContainsCountry = Boolean(
    publicLocation &&
      countryName &&
      publicLocation.toLowerCase().includes(countryName.toLowerCase())
  );
  const placeLine = locationContainsCountry
    ? publicLocation
    : [publicLocation, countryName].filter(Boolean).join(" · ");

  if (
    !jobTitle &&
    !placeLine &&
    affiliations.length === 0
  ) {
    return (
      <NotYetWritten message="organization, role, and location will live here" />
    );
  }

  // Primary first, then any secondaries. The dossier loader already
  // sorts this way but we re-sort here defensively in case of stale
  // local optimistic updates.
  const primary = affiliations.find((a) => a.isPrimary) ?? null;
  const secondaries = affiliations.filter((a) => a !== primary);
  const primaryName = primary?.organizationName ?? null;

  return (
    <div className="space-y-8">
      {/* Three-pillar header — same shape as the original. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gradient-to-r from-purple-200 via-neutral-200 to-teal-200">
        <Pillar
          label="Role"
          value={jobTitle}
          subValue={careerStageLabel}
          accent="purple"
        />
        <Pillar label="Organization" value={primaryName} accent="neutral" />
        <Pillar label="Based in" value={placeLine || null} accent="teal" />
      </div>

      {secondaries.length > 0 && (
        <div className="border-t border-neutral-200 pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-3">
            Also affiliated with
          </p>
          <ul className="flex flex-wrap gap-2">
            {secondaries.map((a) => (
              <li
                key={a.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-sm text-neutral-800"
              >
                <span>{a.organizationName}</span>
                {a.role && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                    {a.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Pillar({
  label,
  value,
  subValue,
  accent,
}: {
  label: string;
  value: string | null;
  subValue?: string | null;
  accent: "purple" | "teal" | "neutral";
}) {
  const accentBar = {
    purple: "bg-purple-500",
    teal: "bg-teal-500",
    neutral: "bg-neutral-300",
  }[accent];
  return (
    <article className="relative bg-white px-6 lg:px-7 py-7">
      <span
        aria-hidden="true"
        className={`absolute top-0 left-6 right-6 h-[3px] ${accentBar}`}
      />
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mt-3 mb-3">
        {label}
      </p>
      {value ? (
        <p className="font-display text-xl lg:text-2xl font-semibold text-neutral-900 leading-tight tracking-tight text-balance">
          {value}
        </p>
      ) : (
        <p className="text-sm text-neutral-400 italic">not set</p>
      )}
      {subValue && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
          {subValue}
        </p>
      )}
    </article>
  );
}

// ── Editor ────────────────────────────────────────────────────────────

function AffiliationEditor({
  affiliations,
  onMemberUpdated,
}: {
  affiliations: AffiliationItem[];
  onMemberUpdated: (next: CurrentMember) => void;
}) {
  const apiFetch = useApi();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callApi(
    path: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown
  ): Promise<boolean> {
    setError(null);
    try {
      const res = await apiFetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        setError(data?.message ?? `Request failed (${res.status}).`);
        return false;
      }
      const data = (await res.json()) as { ok: true; user: CurrentMember };
      onMemberUpdated(data.user);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  }

  async function handlePick(item: OrganizationSimple) {
    setBusyId("__add__");
    await callApi("/me/organizations", "POST", { id: item.id });
    setBusyId(null);
    setAdding(false);
  }

  async function handlePropose(name: string) {
    setBusyId("__add__");
    await callApi("/me/organizations", "POST", { name });
    setBusyId(null);
    setAdding(false);
  }

  async function handleSetPrimary(joinId: string) {
    setBusyId(joinId);
    await callApi(`/me/organizations/${joinId}`, "PATCH", { isPrimary: true });
    setBusyId(null);
  }

  async function handleDelete(joinId: string) {
    if (!window.confirm("Remove this affiliation?")) return;
    setBusyId(joinId);
    await callApi(`/me/organizations/${joinId}`, "DELETE");
    setBusyId(null);
  }

  const linkedIds = affiliations.map((a) => a.organizationId);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5 lg:p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-4">
        Edit affiliations
      </p>

      {affiliations.length > 0 ? (
        <ul className="space-y-2 mb-5">
          {affiliations.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-neutral-200 rounded-xl"
            >
              <div className="min-w-0">
                <p className="text-sm text-neutral-900 leading-tight truncate">
                  {a.organizationName}
                </p>
                {a.role && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-0.5">
                    {a.role}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {a.isPrimary ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700">
                    primary
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => handleSetPrimary(a.id)}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-teal-700 disabled:opacity-50 transition-colors"
                  >
                    set primary
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => handleDelete(a.id)}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-rose-600 disabled:opacity-50 transition-colors"
                  aria-label={`Remove ${a.organizationName}`}
                >
                  remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500 italic mb-5">
          No affiliations yet — add your primary organization below.
        </p>
      )}

      {adding ? (
        <div className="space-y-2">
          <OrganizationCombobox
            excludeIds={linkedIds}
            onPick={handlePick}
            onPropose={handlePropose}
            onDismiss={() => setAdding(false)}
            autoFocus
            placeholder="Search organizations…"
          />
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ↩ cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={busyId === "__add__"}
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors"
        >
          + add affiliation
        </button>
      )}

      {error && (
        <p className="mt-3 text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
