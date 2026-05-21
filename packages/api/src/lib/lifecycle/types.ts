/**
 * Shared types for the artifact lifecycle library.
 *
 * Three artifact types share a status machine; each only uses the subset
 * of states that makes sense. See spec §2.
 */

export type ArtifactStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "rejected"
  | "published"
  | "cancelled"
  | "completed"
  | "expired"
  | "closed"
  | "archived";

export type ArtifactScope = "public" | "community" | "group" | "staff_only";

export type ArtifactEntityType = "event" | "announcement" | "form" | "group";

export type ReviewDecision = "approve" | "reject" | "request_changes";

/**
 * Transitions an actor can request via the API. Internal-only transitions
 * (the system-driven ones like auto-`completed` / auto-`expired`) are
 * intentionally not in this set; they're computed by `effectiveStatus`.
 */
export type LifecycleAction =
  | "submit_for_review"
  | "request_changes"
  | "reject"
  | "approve"
  | "cancel"
  | "archive"
  | "close"
  | "publish"; // synthetic — emitted by applyTransition when the 2nd approval lands

/**
 * Inputs an applyTransition call needs at the row level. The lifecycle
 * library doesn't know which concrete table the artifact lives in; the
 * caller passes the resolved row + the entity_type.
 */
export interface ArtifactSnapshot {
  id: string;
  entityType: ArtifactEntityType;
  status: ArtifactStatus;
  revision: number;
  authorId: string | null;
  /** end_date for events, expires_at for announcements, undefined for forms */
  effectiveStatusInputs?: {
    endDate?: string | null;
    expiresAt?: Date | null;
  };
}
