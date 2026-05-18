import { createMiddleware } from "hono/factory";
import { and, eq, isNull } from "drizzle-orm";
import { createDb } from "../db";
import { users } from "../db/schema";
import type { ActorContext } from "../lib/policies";
import type { AppEnv } from "../types";

/**
 * Sets `c.var.actor` to an ActorContext when a valid WorkOS token is
 * present, otherwise leaves it undefined. Never 401s. Use on
 * public-by-default routes whose response shape varies for signed-in
 * callers (the org profile member roster is the original use case).
 *
 * Unlike requireActorContext, this middleware does NOT enforce
 * canEnterAdminApp — anyone signed in is "a member" for the purposes
 * of the optional-auth flow. Admin-only routes still gate with
 * requireActorContext.
 *
 * Assumes workosUserId is set upstream by requireAuth middleware.
 * Silently no-ops if the user is not found or if any DB error occurs
 * (since this path is hit by anonymous traffic on every request).
 */
export const optionalActor = createMiddleware<AppEnv>(async (c, next) => {
  const workosId = c.get("workosUserId");

  if (!workosId || !c.env.DATABASE_URL) {
    await next();
    return;
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const [u] = await db
      .select({
        id: users.id,
        memberId: users.memberId,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(and(eq(users.workosId, workosId), isNull(users.deletedAt)))
      .limit(1);

    if (u) {
      // Compute systemTier from role, mirroring requireActorContext logic.
      const role = u.role === "admin" ? "staff" : u.role;
      const tier =
        role === "super_admin" ? 2 : role === "staff" ? 1 : 0;

      const actor: ActorContext = {
        user: {
          id: u.id,
          memberId: u.memberId,
          email: u.email,
          role: role as "member" | "staff" | "super_admin",
        },
        systemTier: tier as 0 | 1 | 2,
        // For optional-auth flows, we don't eagerly load leadership terms,
        // chaired groups, or chaired events. Those are only needed by
        // admin-policy gates that requireActorContext enforces (this
        // middleware explicitly does not run). The profile endpoint uses
        // only systemTier to classify callers.
        leadershipPositions: [],
        chairedGroupIds: new Set(),
        chairedEventIds: new Set(),
      };
      c.set("actor", actor);
    }
  } catch {
    // Optional-auth middleware must never throw. A DB failure on this
    // path would swamp Workers logs since anonymous traffic hits it
    // on every request. Silently continue.
  }

  await next();
});
