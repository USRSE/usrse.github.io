import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { applyTransition } from "../../../lib/lifecycle";
import { drizzleLifecycleDb } from "../../../lib/lifecycle/drizzleAdapter";
import { canEditArtifact, canReviewArtifact } from "../../../lib/policies";
import { events } from "../../../db/schema";
import type { AppEnv } from "../../../types";

export const adminEventTransitionsRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const bodySchema = z.object({
  action: z.enum([
    "submit_for_review",
    "approve",
    "reject",
    "request_changes",
    "cancel",
    "archive",
  ]),
  comment: z.string().max(4000).optional(),
});

adminEventTransitionsRoute.post(
  "/",
  zValidator("json", bodySchema, (result, c) => {
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
    const id = c.req.param("id");
    if (!id || !UUID_RE.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    const existing = await db
      .select({ status: events.status, authorId: events.authorId })
      .from(events)
      .where(eq(events.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    // Policy gates by action class
    if (body.action === "submit_for_review") {
      if (
        !canEditArtifact(actor, {
          entityType: "event",
          entityId: id,
          status: existing.status,
          authorId: existing.authorId,
        })
      ) {
        return c.json({ ok: false, error: "forbidden" }, 403);
      }
    } else if (
      body.action === "approve" ||
      body.action === "reject" ||
      body.action === "request_changes"
    ) {
      if (!canReviewArtifact(actor, { authorId: existing.authorId })) {
        return c.json({ ok: false, error: "forbidden" }, 403);
      }
    } else {
      // cancel, archive — staff only
      if (actor.systemTier < 1) {
        return c.json({ ok: false, error: "forbidden" }, 403);
      }
    }

    const lifecycleDb = drizzleLifecycleDb(db, {
      id: actor.user.id,
      role: actor.user.role,
    });
    const result = await applyTransition(lifecycleDb, {
      entityType: "event",
      entityId: id,
      action: body.action,
      actorId: actor.user.id,
      comment: body.comment,
    });
    if (!result.ok) {
      return c.json({ ok: false, error: result.error }, 400);
    }
    return c.json({ ok: true, newStatus: result.newStatus });
  }
);
