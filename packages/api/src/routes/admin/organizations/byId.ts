import { Hono } from "hono";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../../../db";
import {
  auditLog,
  organizations,
  profiles,
  userOrganizations,
  users,
} from "../../../db/schema";
import type { AppEnv } from "../../../types";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const URL_MAX = 500;

const orgPatchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(SLUG_PATTERN, "slug must be lowercase alphanumerics with optional hyphens")
      .optional(),
    shortName: z.string().max(60).nullable().optional(),
    url: z.url().max(URL_MAX).nullable().optional(),
    status: z.enum(["pending", "approved"]).optional(),
  })
  .strict();

type OrgPatchInput = z.infer<typeof orgPatchSchema>;

export const adminOrganizationsByIdRoute = new Hono<AppEnv>();

/**
 * GET /api/admin/organizations/:id
 *
 * Returns the org row plus a small summary of related state: a member
 * count, the most recent affiliations (so admins can sanity-check who
 * this org is attached to before editing), and recent audit entries
 * that name this org as actor or target.
 */
adminOrganizationsByIdRoute.get("/", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const orgRow = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!orgRow) return c.json({ ok: false, error: "not_found" }, 404);

  const [{ count: memberCount }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userOrganizations)
    .where(eq(userOrganizations.organizationId, id));

  // Recent affiliations — show the 20 most-recently-added members so
  // an admin can eyeball who's attached before they edit / delete.
  // Order: primary first (badge-relevant), then most recently linked.
  const recentAffiliations = await db
    .select({
      userId: users.id,
      memberId: users.memberId,
      displayName: profiles.displayName,
      isPrimary: userOrganizations.isPrimary,
      role: userOrganizations.role,
      startedAt: userOrganizations.startedAt,
      createdAt: userOrganizations.createdAt,
    })
    .from(userOrganizations)
    .innerJoin(users, eq(users.id, userOrganizations.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        eq(userOrganizations.organizationId, id),
        isNull(users.deletedAt),
        isNull(users.mergedIntoUserId)
      )
    )
    .orderBy(desc(userOrganizations.isPrimary), desc(userOrganizations.createdAt))
    .limit(20);

  const recentAudit = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorRole: auditLog.actorRole,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(
      or(
        and(eq(auditLog.targetType, "organizations"), eq(auditLog.targetId, id))
      )!
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  return c.json({
    ok: true,
    organization: {
      ...orgRow,
      createdAt:
        orgRow.createdAt instanceof Date
          ? orgRow.createdAt.toISOString()
          : orgRow.createdAt,
      updatedAt:
        orgRow.updatedAt instanceof Date
          ? orgRow.updatedAt.toISOString()
          : orgRow.updatedAt,
      deletedAt:
        orgRow.deletedAt instanceof Date
          ? orgRow.deletedAt.toISOString()
          : orgRow.deletedAt,
    },
    memberCount,
    recentAffiliations: recentAffiliations.map((a) => ({
      ...a,
      startedAt:
        a.startedAt instanceof Date ? a.startedAt.toISOString() : a.startedAt,
      createdAt:
        a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
    recentAudit: recentAudit.map((a) => ({
      ...a,
      createdAt:
        a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
  });
});

/**
 * PATCH /api/admin/organizations/:id
 *
 * Edits name / slug / shortName / url, and flips the vocab status
 * (pending → approved or back). Logo upload + consent gating land in
 * a follow-up slice.
 */
adminOrganizationsByIdRoute.patch(
  "/",
  zValidator("json", orgPatchSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          error: "invalid_input",
          issues: result.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        400
      );
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return c.json({ ok: false, error: "invalid_input" }, 400);
    }
    if (!c.env.DATABASE_URL)
      return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const input = c.req.valid("json") as OrgPatchInput;

    if (Object.keys(input).length === 0) {
      return c.json({ ok: true, noop: true });
    }

    const existing = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    c.get("auditCapture")?.({ organization: existing });

    try {
      await db
        .update(organizations)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(organizations.id, id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // The `name` and `slug` columns are unique — a collision should
      // not 500 the request, it should tell the admin which field
      // clashed so they can pick a different value.
      if (/duplicate key value/i.test(msg) || /unique constraint/i.test(msg)) {
        return c.json(
          {
            ok: false,
            error: "conflict",
            message:
              "Another organization already uses that name or slug. Pick a different value.",
          },
          409
        );
      }
      throw e;
    }

    c.set("auditAction", "organizations.update");
    c.set("auditTarget", { type: "organizations", id });

    return c.json({ ok: true });
  }
);

/**
 * POST /api/admin/organizations/:id/soft-delete
 *
 * Idempotent — re-deleting a soft-deleted row is a no-op. We do not
 * cascade to user_organizations: a deleted org keeps its membership
 * rows so an admin can review who was attached before the row is
 * eventually hard-deleted or merged.
 */
adminOrganizationsByIdRoute.post("/soft-delete", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

  c.get("auditCapture")?.({ organization: existing });

  if (existing.deletedAt === null) {
    await db
      .update(organizations)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(organizations.id, id));
  }
  c.set("auditAction", "organizations.soft_delete");
  c.set("auditTarget", { type: "organizations", id });
  return c.json({ ok: true });
});

/**
 * POST /api/admin/organizations/:id/restore
 */
adminOrganizationsByIdRoute.post("/restore", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

  c.get("auditCapture")?.({ organization: existing });

  if (existing.deletedAt !== null) {
    await db
      .update(organizations)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(organizations.id, id));
  }
  c.set("auditAction", "organizations.restore");
  c.set("auditTarget", { type: "organizations", id });
  return c.json({ ok: true });
});
