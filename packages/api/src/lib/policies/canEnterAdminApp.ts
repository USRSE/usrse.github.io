import type { ActorContext } from "./types";

/**
 * Gate for the admin sub-app at large. True when the actor has any
 * admin-shaped position — system tier >= staff, OR an active board /
 * executive / advisor / staff leadership term, OR they chair at least
 * one group, OR they chair at least one event committee.
 */
export const canEnterAdminApp = (a: ActorContext): boolean =>
  a.systemTier >= 1 ||
  a.leadershipPositions.length > 0 ||
  a.chairedGroupIds.size > 0 ||
  a.chairedEventIds.size > 0;
