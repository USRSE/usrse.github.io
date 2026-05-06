import { useState } from "react";
import { useApi } from "@/lib/api";
import {
  VocabCombobox,
  type VocabSimple,
} from "./VocabCombobox";
import type { CurrentMember, VocabItem } from "@/hooks/useCurrentMember";

/**
 * Owner-only editable chip ribbon for a controlled vocabulary axis
 * (disciplines or skills today). Existing chips render with a hover-
 * revealed remove × and a dashed-border "pending" mark when the
 * underlying vocab row hasn't been approved yet. A trailing "+ Add"
 * affordance opens an inline VocabCombobox.
 *
 * Mutations fire POST/DELETE against the supplied endpoint path and
 * then call `onChanged` so the parent can refetch — this avoids
 * duplicating optimistic-rollback bookkeeping in two places (here
 * and in useCurrentMember). Buttons are disabled while a request
 * is in flight to prevent double-clicks.
 */

type Accent = "teal" | "purple" | "amber";

interface EditableChipListProps {
  /** Current chips on the user — source of truth. */
  items: VocabItem[];
  /** Approved vocab pool for autocomplete. */
  vocab: VocabSimple[];
  /** Resource name used in copy and propose-new affordance ("discipline" / "skill"). */
  axisLabel: string;
  /** Endpoint path to POST adds and DELETE removals against. */
  endpointPath: "/me/disciplines" | "/me/skills" | "/me/languages";
  /** Visual accent for the chips — matches the existing Craft palette. */
  accent: Accent;
  /** Refreshed dossier returned by the mutation endpoint. */
  onChanged: (next: CurrentMember) => void;
  /** Fallback message shown when the list is empty. */
  emptyMessage: string;
}

const CHIP_VARIANT: Record<Accent, string> = {
  teal: "border-neutral-200 text-teal-700 hover:border-teal-400 hover:text-teal-900 hover:bg-teal-50/30",
  purple:
    "border-neutral-200 text-purple-700 hover:border-purple-400 hover:text-purple-900 hover:bg-purple-50/30",
  amber:
    "border-neutral-200 text-amber-700 hover:border-amber-400 hover:text-amber-900 hover:bg-amber-50/30",
};

const PENDING_VARIANT: Record<Accent, string> = {
  teal: "border-dashed border-teal-300 text-teal-700/80",
  purple: "border-dashed border-purple-300 text-purple-700/80",
  amber: "border-dashed border-amber-300 text-amber-700/80",
};

export function EditableChipList({
  items,
  vocab,
  axisLabel,
  endpointPath,
  accent,
  onChanged,
  emptyMessage,
}: EditableChipListProps) {
  const apiFetch = useApi();
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const excludeIds = items.map((it) => it.id);

  async function postAdd(body: { id?: string; name?: string }) {
    setError(null);
    try {
      const res = await apiFetch(endpointPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; user: CurrentMember }
        | { ok: false; message?: string }
        | null;
      if (!res.ok || !data || !data.ok) {
        const msg =
          data && "message" in data && data.message
            ? data.message
            : `Add failed (${res.status})`;
        throw new Error(msg);
      }
      onChanged(data.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function deleteChip(id: string) {
    setError(null);
    setBusyId(id);
    try {
      const res = await apiFetch(`${endpointPath}/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; user: CurrentMember }
        | { ok: false; message?: string }
        | null;
      if (!res.ok || !data || !data.ok) {
        const msg =
          data && "message" in data && data.message
            ? data.message
            : `Remove failed (${res.status})`;
        throw new Error(msg);
      }
      onChanged(data.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <ul className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          const isPending = item.status === "pending";
          const isBusy = busyId === item.id;
          return (
            <li
              key={item.id}
              className={`group inline-flex items-baseline gap-1.5 pl-3 pr-2 py-1.5 rounded-full border font-mono text-xs transition-all ${
                isPending ? PENDING_VARIANT[accent] : CHIP_VARIANT[accent]
              } ${isBusy ? "opacity-40" : ""}`}
            >
              <span>{item.name}</span>
              {isPending && (
                <span className="text-[9px] uppercase tracking-[0.25em] opacity-70 self-center">
                  pending
                </span>
              )}
              <button
                type="button"
                onClick={() => deleteChip(item.id)}
                disabled={isBusy}
                aria-label={`Remove ${item.name}`}
                className="self-center w-4 h-4 inline-flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition-colors disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 12 12"
                  className="w-2.5 h-2.5"
                  aria-hidden="true"
                >
                  <path
                    d="M3 3 L9 9 M9 3 L3 9"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          );
        })}

        {/* Add affordance: idle button or inline combobox. */}
        {adding ? (
          <li>
            <VocabCombobox
              items={vocab}
              excludeIds={excludeIds}
              onPick={(item) => postAdd({ id: item.id })}
              onPropose={(name) => postAdd({ name })}
              onDismiss={() => setAdding(false)}
              autoFocus
              placeholder={`Search ${axisLabel}…`}
              proposeKind={axisLabel}
            />
          </li>
        ) : (
          <li>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-neutral-300 font-mono text-xs text-neutral-500 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50/30 transition-colors"
            >
              <span aria-hidden="true">+</span>
              <span>add {axisLabel}</span>
            </button>
          </li>
        )}
      </ul>

      {/* Empty-state caption when nothing's been added yet. The
          combobox itself is enough affordance to explain the next
          step, so we don't render a NotYetWritten panel. */}
      {items.length === 0 && !adding && (
        <p className="mt-3 text-xs text-neutral-500">{emptyMessage}</p>
      )}

      {error && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-rose-600">
          ! {error}
        </p>
      )}
    </div>
  );
}
