import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth";
import { requireActorContext } from "../../middleware/actorContext";
import { auditMiddleware } from "../../middleware/audit";
import type { AppEnv } from "../../types";
import { adminMeRoute } from "./me";
import { adminAuditRoute } from "./audit";
import { adminUsersRoute } from "./users";
import { adminOrganizationsRoute } from "./organizations";
import { adminVocabRoute } from "./vocab";
import { adminGroupsRoute } from "./groups";
import { adminQueueRoute } from "./queue";
import { adminEventsRoute } from "./events";
import { adminAnnouncementsRoute } from "./announcements";

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
adminApi.use("*", auditMiddleware);

adminApi.route("/me", adminMeRoute);
adminApi.route("/audit", adminAuditRoute);
adminApi.route("/users", adminUsersRoute);
adminApi.route("/vocab", adminVocabRoute);
adminApi.route("/groups", adminGroupsRoute);
adminApi.route("/organizations", adminOrganizationsRoute);
adminApi.route("/queue", adminQueueRoute);
adminApi.route("/events", adminEventsRoute);
adminApi.route("/announcements", adminAnnouncementsRoute);
