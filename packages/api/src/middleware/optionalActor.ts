import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";
import { and, eq, isNull } from "drizzle-orm";
import { createDb } from "../db";
import { users } from "../db/schema";
import { getJwks } from "./auth";
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
 * Extracts and verifies the WorkOS JWT from the Authorization header.
 * All failures (missing token, malformed header, invalid signature,
 * expired token, missing sub claim, DB lookup failure) are silently
 * swallowed — if any step fails, the request continues as anonymous.
 * This is safe because the middleware is hit by anonymous traffic on
 * every request.
 */
export const optionalActor = createMiddleware<AppEnv>(async (c, next) => {
  let workosId: string | undefined;

  try {
    // Extract the Authorization header and parse the token.
    const header = c.req.header("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
      // No token; continue as anonymous.
      await next();
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      // Empty bearer token; continue as anonymous.
      await next();
      return;
    }

    // If WORKOS_CLIENT_ID is missing, silently no-op (do NOT 500).
    if (!c.env.WORKOS_CLIENT_ID) {
      await next();
      return;
    }

    // Verify the JWT signature and extract claims.
    const { payload } = await jwtVerify(token, getJwks(c.env.WORKOS_CLIENT_ID));
    if (!payload.sub) {
      // Token has no sub claim; continue as anonymous.
      await next();
      return;
    }

    workosId = payload.sub as string;
    c.set("workosUserId", workosId);
    c.set("workosClaims", payload);
  } catch {
    // Token extraction or verification failed; continue as anonymous.
    // This includes invalid signatures, expired tokens, malformed headers,
    // and any other JWT errors.
    await next();
    return;
  }

  // Only proceed with DB lookup if we have a valid workosId.
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
