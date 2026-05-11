import { Hono } from "hono";
import type { AppEnv } from "../../types";

/**
 * Returns the actor context the SPA needs to render its shell:
 *   - basic user fields
 *   - systemTier (0/1/2) so the FE can show super_admin-only chrome
 *   - active leadership positions
 *   - chaired group / event ids (as arrays — the SPA reconstructs the
 *     Set client-side if it needs membership tests)
 *
 * Mounted under /api/admin/me, so the gating middleware (auth →
 * actorContext) has already run; c.var.actor is guaranteed populated.
 */
export const adminMeRoute = new Hono<AppEnv>();

adminMeRoute.get("/", (c) => {
  const a = c.get("actor")!;
  return c.json({
    ok: true,
    actor: {
      user: a.user,
      systemTier: a.systemTier,
      leadershipPositions: a.leadershipPositions,
      chairedGroupIds: [...a.chairedGroupIds],
      chairedEventIds: [...a.chairedEventIds],
    },
  });
});
