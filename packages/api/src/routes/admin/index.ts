import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth";
import { requireActorContext } from "../../middleware/actorContext";
import type { AppEnv } from "../../types";
import { adminMeRoute } from "./me";

/**
 * Hono sub-app for /api/admin/*. Order matters:
 *   1. requireAuth — verifies WorkOS access token
 *   2. requireActorContext — loads ActorContext, gates on canEnterAdminApp
 *   (audit middleware lands in Task 6 and slots in here)
 *
 * Child routers are mounted after the gates so each handler can assume
 * c.var.actor is set.
 */
export const adminApi = new Hono<AppEnv>();

adminApi.use("*", requireAuth);
adminApi.use("*", requireActorContext);

adminApi.route("/me", adminMeRoute);
