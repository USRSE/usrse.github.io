import type { ActorContext } from "./types";

/**
 * Edit organizations in the admin app — list, view detail, edit name /
 * slug / shortName / url, approve pending entries, soft-delete,
 * restore. Same tier as canEditMembers (staff and super_admin); we
 * keep the policies separate so they can diverge later (e.g., if logo
 * uploads gain a stricter gate, or if org merging restricts to super).
 */
export const canEditOrganizations = (a: ActorContext): boolean =>
  a.systemTier >= 1;
