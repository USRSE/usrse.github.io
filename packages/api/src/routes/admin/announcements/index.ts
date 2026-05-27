import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { createDb } from "../../../db";
import { announcements } from "../../../db/schema";
import type { AppEnv } from "../../../types";
import { adminAnnouncementByIdRoute } from "./byId";
import { adminAnnouncementTransitionsRoute } from "./transitions";
import { adminAnnouncementCommentsRoute } from "./comments";

export const adminAnnouncementsRoute = new Hono<AppEnv>();

const SCOPES = ["public", "community", "group", "staff_only"] as const;
const STATUSES = [
  "draft", "in_review", "changes_requested", "rejected", "published",
  "expired", "archived",
] as const;

const createBodySchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  linkUrl: z.string().url().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
  scope: z.enum(SCOPES).optional(),
  hostGroupId: z.string().uuid().optional(),
  hostOrgId: z.string().uuid().optional(),
});

adminAnnouncementsRoute.post(
  "/",
  zValidator("json", createBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    let scope = body.scope;
    if (!scope) {
      if (actor.systemTier === 0 && actor.chairedGroupIds.size > 0) {
        scope = "group";
      } else {
        scope = "community";
      }
    }

    let hostGroupId = body.hostGroupId;
    if (!hostGroupId && scope === "group" && actor.chairedGroupIds.size > 0) {
      hostGroupId = [...actor.chairedGroupIds][0];
    }

    const [row] = await db
      .insert(announcements)
      .values({
        title: body.title,
        body: body.body,
        linkUrl: body.linkUrl ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        status: "draft",
        revision: 1,
        authorId: actor.user.id,
        scope,
        hostGroupId: hostGroupId ?? null,
        hostOrgId: body.hostOrgId ?? null,
      })
      .returning();

    return c.json(
      {
        ok: true,
        announcement: {
          id: row.id,
          title: row.title,
          status: row.status,
          scope: row.scope,
          revision: row.revision,
          authorId: row.authorId,
          createdAt: row.createdAt,
        },
      },
      201
    );
  }
);

adminAnnouncementsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const db = createDb(c.env.DATABASE_URL);

  const status = c.req.query("status");
  const scope = c.req.query("scope");
  const hostGroupId = c.req.query("hostGroupId");
  const q = c.req.query("q");
  const limit = Math.min(200, parseInt(c.req.query("limit") ?? "50", 10));
  const offset = Math.max(0, parseInt(c.req.query("offset") ?? "0", 10));

  const whereParts = [isNull(announcements.deletedAt)];
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    whereParts.push(eq(announcements.status, status as (typeof STATUSES)[number]));
  }
  if (scope && SCOPES.includes(scope as (typeof SCOPES)[number])) {
    whereParts.push(eq(announcements.scope, scope as (typeof SCOPES)[number]));
  }
  if (hostGroupId) whereParts.push(eq(announcements.hostGroupId, hostGroupId));
  if (q) whereParts.push(ilike(announcements.title, `%${q}%`));

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      status: announcements.status,
      revision: announcements.revision,
      scope: announcements.scope,
      authorId: announcements.authorId,
      hostGroupId: announcements.hostGroupId,
      hostOrgId: announcements.hostOrgId,
      expiresAt: announcements.expiresAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(and(...whereParts))
    .orderBy(desc(announcements.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ ok: true, rows });
});

adminAnnouncementsRoute.route("/:id/transitions", adminAnnouncementTransitionsRoute);
adminAnnouncementsRoute.route("/:id/comments", adminAnnouncementCommentsRoute);
adminAnnouncementsRoute.route("/:id", adminAnnouncementByIdRoute);
