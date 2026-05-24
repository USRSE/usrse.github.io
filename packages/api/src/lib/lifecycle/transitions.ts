import type { ArtifactEntityType, ArtifactStatus, LifecycleAction } from "./types";

/**
 * Valid transitions: (entity type, current status) → set of allowed actions.
 *
 * Reject and request_changes are single-reviewer; approve is the only
 * action that requires the 2-vote tally to actually move state to
 * `published`. Cancel/archive/close are post-publish administrative
 * actions and only valid from `published`.
 */
type TransitionMap = Partial<Record<ArtifactStatus, ReadonlyArray<LifecycleAction>>>;

const SHARED_TRANSITIONS: TransitionMap = {
  draft: ["submit_for_review"],
  in_review: ["approve", "reject", "request_changes"],
  changes_requested: ["submit_for_review"],
  // rejected: terminal
  published: ["archive"],
  // archived: terminal
};

const TYPE_OVERRIDES: Record<ArtifactEntityType, TransitionMap> = {
  event: {
    published: ["cancel", "archive"],
    // completed: auto, terminal
    // cancelled: terminal
  },
  announcement: {
    // expired: auto, terminal
  },
  form: {
    published: ["close", "archive"],
    closed: ["archive"],
  },
  group: {
    // groups aren't a real artifact type for lifecycle purposes — included
    // in the entity-type enum because comments/reviews can attach to them
    // in future. No transitions defined here.
  },
};

export function isValidTransition(
  entityType: ArtifactEntityType,
  currentStatus: ArtifactStatus,
  action: LifecycleAction
): boolean {
  const typeOverride = TYPE_OVERRIDES[entityType][currentStatus];
  if (typeOverride !== undefined) {
    return typeOverride.includes(action);
  }
  const shared = SHARED_TRANSITIONS[currentStatus];
  return shared !== undefined && shared.includes(action);
}

export function allowedActionsFor(
  entityType: ArtifactEntityType,
  currentStatus: ArtifactStatus
): ReadonlyArray<LifecycleAction> {
  return (
    TYPE_OVERRIDES[entityType][currentStatus] ??
    SHARED_TRANSITIONS[currentStatus] ??
    []
  );
}
