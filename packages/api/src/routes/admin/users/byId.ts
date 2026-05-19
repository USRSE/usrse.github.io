import { Hono } from "hono";
import { and, desc, eq, or } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../../../db";
import {
  auditLog,
  organizations,
  profiles,
  userMerges,
  userOrganizations,
  users,
} from "../../../db/schema";
import { buildProfileSlug } from "../../../lib/member-id";
import { canMergeUsers, canPromoteToRole } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import {
  buildMergeSnapshot,
  executeMerge,
  executeUnmerge,
  PROMOTABLE_PROFILE_FIELDS,
  validateMerge,
  type PromotableField,
} from "../../../lib/admin/userMerge";
import type { AppEnv } from "../../../types";

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

const userPatchSchema = z
  .object({
    displayName: z.string().min(1).max(100).optional(),
    headline: z.string().max(140).nullable().optional(),
    bio: z.string().max(5000).nullable().optional(),
    photoUrl: z.url().max(500).nullable().optional(),
    jobTitle: z.string().max(100).nullable().optional(),
    githubUrl: z.url().max(200).nullable().optional(),
    linkedinUrl: z.url().max(200).nullable().optional(),
    orcid: z.string().regex(ORCID_PATTERN).nullable().optional(),
    websiteUrl: z.url().max(200).nullable().optional(),
    pronounId: z.uuid().nullable().optional(),
    careerStageId: z.uuid().nullable().optional(),
    countryId: z.uuid().nullable().optional(),
    region: z.string().max(100).nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    publicLocation: z.string().max(140).nullable().optional(),
    slackUsername: z.string().max(80).nullable().optional(),
    role: z.enum(["member", "staff", "super_admin"]).optional(),
  })
  .strict();

type UserPatchInput = z.infer<typeof userPatchSchema>;

export const adminUsersByIdRoute = new Hono<AppEnv>();

/**
 * GET /api/admin/users/:id
 */
adminUsersByIdRoute.get("/", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!userRow) return c.json({ ok: false, error: "not_found" }, 404);

  const profileRow = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  // Affiliations summary.
  const affiliations = await db
    .select({
      id: userOrganizations.id,
      organizationId: organizations.id,
      organizationName: organizations.name,
      isPrimary: userOrganizations.isPrimary,
      role: userOrganizations.role,
    })
    .from(userOrganizations)
    .innerJoin(
      organizations,
      eq(organizations.id, userOrganizations.organizationId)
    )
    .where(eq(userOrganizations.userId, id))
    .orderBy(desc(userOrganizations.isPrimary), organizations.name);

  // Source merges into this user (this user is target).
  const inboundMerges = await db
    .select({
      id: userMerges.id,
      sourceUserId: userMerges.sourceUserId,
      mergedByUserId: userMerges.mergedByUserId,
      createdAt: userMerges.createdAt,
      revertedAt: userMerges.revertedAt,
      reason: userMerges.reason,
    })
    .from(userMerges)
    .where(eq(userMerges.targetUserId, id))
    .orderBy(desc(userMerges.createdAt));

  // Outbound merge if this user is a source.
  const outboundMerge = userRow.mergedIntoUserId
    ? await db
        .select()
        .from(userMerges)
        .where(
          and(
            eq(userMerges.sourceUserId, id),
            eq(userMerges.targetUserId, userRow.mergedIntoUserId)
          )
        )
        .orderBy(desc(userMerges.createdAt))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  // Recent audit (last 20 rows touching this user).
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
    .where(or(eq(auditLog.actorId, id), eq(auditLog.targetId, id))!)
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  return c.json({
    ok: true,
    user: {
      ...userRow,
      createdAt:
        userRow.createdAt instanceof Date
          ? userRow.createdAt.toISOString()
          : userRow.createdAt,
      updatedAt:
        userRow.updatedAt instanceof Date
          ? userRow.updatedAt.toISOString()
          : userRow.updatedAt,
      deletedAt:
        userRow.deletedAt instanceof Date
          ? userRow.deletedAt.toISOString()
          : userRow.deletedAt,
    },
    profile: profileRow,
    affiliations,
    merges: { inbound: inboundMerges, outbound: outboundMerge },
    recentAudit: recentAudit.map((r) => ({
      ...r,
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
  });
});

/**
 * PATCH /api/admin/users/:id
 *
 * Edits profile fields and optionally the role. Role changes go
 * through canPromoteToRole; self-promotion/demotion is blocked
 * regardless. Demoting a super_admin requires super_admin.
 */
adminUsersByIdRoute.patch(
  "/",
  zValidator("json", userPatchSchema, (result, c) => {
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
    const input = c.req.valid("json") as UserPatchInput;
    const actor = c.get("actor")!;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    // Role gating.
    if (input.role && input.role !== existing.role) {
      // Block self-promotion/demotion explicitly.
      if (actor.user.id === id) {
        return c.json(
          {
            ok: false,
            error: "forbidden",
            message: "You cannot change your own role.",
          },
          403
        );
      }
      if (!canPromoteToRole(actor, { newRole: input.role })) {
        return c.json(
          {
            ok: false,
            error: "forbidden",
            message: "You cannot grant that role.",
          },
          403
        );
      }
      // Demotion FROM super_admin requires super_admin.
      if (existing.role === "super_admin" && actor.systemTier < 2) {
        return c.json(
          {
            ok: false,
            error: "forbidden",
            message: "Demoting a super_admin requires super_admin.",
          },
          403
        );
      }
    }

    c.get("auditCapture")?.({ user: existing });

    // Split into profile vs user fields.
    const { role, ...profileFields } = input;

    if (Object.keys(profileFields).length > 0) {
      const existingProfile = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, id))
        .limit(1);
      if (existingProfile[0]) {
        await db
          .update(profiles)
          .set({ ...profileFields, updatedAt: new Date() })
          .where(eq(profiles.userId, id));
      } else if (input.displayName) {
        await db.insert(profiles).values({
          userId: id,
          slug: buildProfileSlug(input.displayName, existing.memberId),
          displayName: input.displayName,
          ...profileFields,
        });
      } else {
        return c.json({
          ok: false,
          error: "invalid_input",
          message:
            "Cannot create a profile without a displayName. Include displayName in the PATCH body or update an existing profile.",
        }, 400);
      }
    }

    if (role && role !== existing.role) {
      await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id));
    }

    c.set("auditAction", "users.update");
    c.set("auditTarget", { type: "users", id });

    return c.json({ ok: true });
  }
);

/**
 * POST /api/admin/users/:id/soft-delete
 */
adminUsersByIdRoute.post("/soft-delete", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

  c.get("auditCapture")?.({ user: existing });

  if (existing.deletedAt === null) {
    await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
  }
  c.set("auditAction", "users.soft_delete");
  c.set("auditTarget", { type: "users", id });
  return c.json({ ok: true });
});

/**
 * POST /api/admin/users/:id/restore
 */
adminUsersByIdRoute.post("/restore", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

  c.get("auditCapture")?.({ user: existing });

  if (existing.deletedAt !== null) {
    await db
      .update(users)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(users.id, id));
  }
  c.set("auditAction", "users.restore");
  c.set("auditTarget", { type: "users", id });
  return c.json({ ok: true });
});

const mergeBodySchema = z.object({
  targetUserId: z.uuid(),
  promotedFields: z
    .array(
      z.enum(
        PROMOTABLE_PROFILE_FIELDS as unknown as readonly [
          PromotableField,
          ...PromotableField[]
        ]
      )
    )
    .default([]),
  reason: z.string().max(280).optional(),
});

/**
 * POST /api/admin/users/:id/merge
 *
 * Source = :id (the URL user), target = body.targetUserId.
 * Super-admin only via canMergeUsers (the parent canEditMembers gate is broader).
 */
adminUsersByIdRoute.post(
  "/merge",
  requirePolicy(canMergeUsers, () => undefined),
  zValidator("json", mergeBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
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
    const actor = c.get("actor")!;
    const body = c.req.valid("json");

    const req = {
      sourceUserId: id,
      targetUserId: body.targetUserId,
      mergedByUserId: actor.user.id,
      promotedFields: body.promotedFields,
      reason: body.reason,
    };

    const err = await validateMerge(db, req);
    if (err)
      return c.json(
        { ok: false, error: err.error, message: err.message },
        err.status
      );

    const snapshot = await buildMergeSnapshot(db, req);
    c.get("auditCapture")?.({ source: snapshot.source, target: snapshot.target });

    const result = await executeMerge(db, snapshot, req);

    c.set("auditAction", "users.merge");
    // auditTarget is the SURVIVING (canonical) user; sourceUserId lives in
    // payload below so source-side history queries can still find this row
    // via a payload->>'sourceUserId' = $id filter.
    c.set("auditTarget", { type: "users", id: req.targetUserId });
    c.set("auditPayload", {
      mergeId: result.mergeId,
      sourceUserId: req.sourceUserId,
      targetUserId: req.targetUserId,
      promotedFieldCount: req.promotedFields.length,
      conflictCount: result.conflicts.length,
      reason: req.reason ?? null,
    });

    return c.json({ ok: true, mergeId: result.mergeId });
  }
);

const unmergeBodySchema = z.object({
  mergeId: z.uuid(),
});

/**
 * POST /api/admin/users/:id/unmerge
 *
 * :id is unused (admin app convention — every action sits under the user's
 * URL) but the body's mergeId drives the operation.
 */
adminUsersByIdRoute.post(
  "/unmerge",
  requirePolicy(canMergeUsers, () => undefined),
  zValidator("json", unmergeBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    if (!c.env.DATABASE_URL)
      return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const actor = c.get("actor")!;
    const body = c.req.valid("json");

    const result = await executeUnmerge(db, {
      mergeId: body.mergeId,
      revertedByUserId: actor.user.id,
    });
    if ("error" in result) {
      return c.json(
        { ok: false, error: result.error, message: result.message },
        result.status
      );
    }

    c.set("auditAction", "users.unmerge");
    c.set("auditTarget", { type: "user_merges", id: result.mergeId });
    c.set("auditPayload", { mergeId: result.mergeId });

    return c.json({ ok: true, mergeId: result.mergeId });
  }
);
