import type { ActorContext } from "./types";

/**
 * Merging users is irreversible-feeling and rewrites several tables.
 * Restrict to super_admin until we have a reversal UI.
 */
export const canMergeUsers = (a: ActorContext): boolean =>
  a.systemTier >= 2;
