import type { ActorContext } from "./types";

/**
 * Authorize a role change. Staff can set a member's role to `member`
 * or `staff`; only super_admin can grant `super_admin`. Demoting from
 * super_admin (to staff or member) also requires super_admin.
 *
 * Scope is the NEW role being assigned. The current role of the target
 * is checked at the route level — this policy is purely about what the
 * actor is allowed to grant.
 */
export const canPromoteToRole = (
  a: ActorContext,
  scope: { newRole: "member" | "staff" | "super_admin" }
): boolean => {
  if (scope.newRole === "super_admin") return a.systemTier >= 2;
  return a.systemTier >= 1;
};
