import type { ActorContext } from "./types";

/**
 * Edit members in the admin app — list, view detail, edit identity
 * fields, soft-delete, restore. Staff and super_admin only.
 */
export const canEditMembers = (a: ActorContext): boolean =>
  a.systemTier >= 1;
