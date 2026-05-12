import type { ActorContext } from "./types";

/**
 * Merging organizations is irreversible-feeling and rewrites several
 * tables. Restrict to super_admin until we have multi-operator
 * coordination, mirroring canMergeUsers.
 */
export const canMergeOrganizations = (a: ActorContext): boolean =>
  a.systemTier >= 2;
