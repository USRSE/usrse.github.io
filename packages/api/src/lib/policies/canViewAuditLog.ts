import type { ActorContext } from "./types";

/** Reading the audit log is super_admin-only. */
export const canViewAuditLog = (a: ActorContext): boolean =>
  a.systemTier >= 2;
