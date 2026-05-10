import type { ActorContext } from "./hooks/useActorContext";

/**
 * Mirror of the server policies in packages/api/src/lib/policies.
 * Server is the gate; these functions exist so components can show
 * or hide affordances without forcing a 403 round trip. If a server
 * policy is updated, update its mirror here in the same change.
 */

export const canEnterAdminApp = (a: ActorContext): boolean =>
  a.systemTier >= 1 ||
  a.leadershipPositions.length > 0 ||
  a.chairedGroupIds.length > 0 ||
  a.chairedEventIds.length > 0;

export const canApproveVocab = (a: ActorContext): boolean =>
  a.systemTier >= 1;

export const canMergeUsers = (a: ActorContext): boolean =>
  a.systemTier >= 2;

export const canEditGroup = (
  a: ActorContext,
  scope: { groupId: string }
): boolean => a.systemTier >= 1 || a.chairedGroupIds.includes(scope.groupId);

export const canEditEvent = (
  a: ActorContext,
  scope: { eventId: string }
): boolean => a.systemTier >= 1 || a.chairedEventIds.includes(scope.eventId);

export const canViewAuditLog = (a: ActorContext): boolean =>
  a.systemTier >= 2;
