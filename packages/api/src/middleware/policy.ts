import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";
import type { ActorContext } from "../lib/policies";

/**
 * Wraps a policy fn into Hono middleware. Use this on routes (or a
 * sub-app's entire surface) to gate by a single named policy. For
 * mid-handler checks where multiple resources are touched, call the
 * policy fn directly — c.var.actor is already populated.
 *
 *   requirePolicy(canEditGroup, c => ({ groupId: c.req.param("id") }))
 */
export function requirePolicy<S>(
  policy: (a: ActorContext, scope: S) => boolean,
  scopeFn: (c: Context<AppEnv>) => S
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const actor = c.get("actor");
    if (!actor) {
      // requireActorContext should have run first. If we got here
      // without an actor it's a wiring bug, not a 403.
      return c.json({ ok: false, error: "internal" }, 500);
    }
    if (!policy(actor, scopeFn(c))) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }
    await next();
  };
}
