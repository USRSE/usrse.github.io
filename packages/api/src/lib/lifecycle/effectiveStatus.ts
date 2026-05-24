import type { ArtifactSnapshot, ArtifactStatus } from "./types";

/**
 * Compute the effective status for an artifact at read time.
 *
 * Only `published` rows are subject to auto-transition:
 *   - events past `end_date` → `completed`
 *   - announcements past `expires_at` → `expired`
 *
 * Forms never auto-transition. The stored `status` is returned in every
 * other case.
 */
export function effectiveStatus(snap: ArtifactSnapshot): ArtifactStatus {
  if (snap.status !== "published") return snap.status;
  const now = new Date();
  if (snap.entityType === "event") {
    const endDate = snap.effectiveStatusInputs?.endDate;
    if (endDate && new Date(endDate) < now) return "completed";
  }
  if (snap.entityType === "announcement") {
    const expiresAt = snap.effectiveStatusInputs?.expiresAt;
    if (expiresAt && expiresAt < now) return "expired";
  }
  return "published";
}
