import type { ActorContext } from "./types";

export const canEditEvent = (
  a: ActorContext,
  scope: { eventId: string }
): boolean => a.systemTier >= 1 || a.chairedEventIds.has(scope.eventId);
