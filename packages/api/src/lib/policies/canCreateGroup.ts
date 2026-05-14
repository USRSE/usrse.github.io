import type { ActorContext } from "./types";

/**
 * Create a brand-new group. Super_admin only — creating a new group is
 * a governance decision (it allocates admin privilege to whoever
 * eventually chairs it). Chairs use canEditGroup to manage their
 * existing groups but can't spin up new ones.
 */
export const canCreateGroup = (a: ActorContext): boolean =>
  a.systemTier >= 2;
