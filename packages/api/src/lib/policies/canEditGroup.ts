import type { ActorContext } from "./types";

export const canEditGroup = (
  a: ActorContext,
  scope: { groupId: string }
): boolean => a.systemTier >= 1 || a.chairedGroupIds.has(scope.groupId);
