import { Hono } from "hono";
import { and, asc, eq, ilike, isNull, isNotNull, or, sql } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  organizations,
  profiles,
  userOrganizations,
  users,
} from "../../../db/schema";
import { canEditMembers, canMergeUsers } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import {
  buildAndScorePairs,
  type CandidateUser,
} from "../../../lib/admin/duplicateDetection";
import type { AppEnv } from "../../../types";
import { adminUsersByIdRoute } from "./byId";

export const adminUsersRoute = new Hono<AppEnv>();

adminUsersRoute.use("*", requirePolicy(canEditMembers, () => undefined));

/**
 * GET /api/admin/users
 *
 * Cursor-paginated list. Filters: role, status (active|merged|deleted),
 * hasProfile, search query (matches displayName, email, memberId).
 */
adminUsersRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const q = c.req.query("q") ?? "";
  const role = c.req.query("role");
  const status = c.req.query("status") ?? "active";
  const hasProfile = c.req.query("hasProfile");
  const cursor = c.req.query("cursor");
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") ?? "50", 10) || 50, 1),
    200
  );

  const conditions = [] as ReturnType<typeof eq>[];

  if (status === "active") {
    conditions.push(isNull(users.deletedAt));
    conditions.push(isNull(users.mergedIntoUserId));
  } else if (status === "merged") {
    conditions.push(isNotNull(users.mergedIntoUserId));
  } else if (status === "deleted") {
    conditions.push(isNotNull(users.deletedAt));
  }

  if (role && (role === "member" || role === "staff" || role === "super_admin")) {
    conditions.push(eq(users.role, role));
  }
  if (hasProfile === "true") {
    conditions.push(isNotNull(profiles.id));
  } else if (hasProfile === "false") {
    conditions.push(isNull(profiles.id));
  }
  if (q.trim()) {
    const needle = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(profiles.displayName, needle),
        ilike(users.email, needle),
        ilike(users.memberId, needle)
      )!
    );
  }
  if (cursor) {
    // Cursor is the last user's id; we paginate alphabetically by id for
    // a stable order.
    conditions.push(sql`${users.id} > ${cursor}`);
  }

  const rows = await db
    .select({
      id: users.id,
      memberId: users.memberId,
      email: users.email,
      role: users.role,
      mergedIntoUserId: users.mergedIntoUserId,
      deletedAt: users.deletedAt,
      isLegacyImport: users.isLegacyImport,
      createdAt: users.createdAt,
      displayName: profiles.displayName,
      photoUrl: profiles.photoUrl,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(users.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return c.json({
    ok: true,
    rows: page.map((r) => ({
      ...r,
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      deletedAt:
        r.deletedAt instanceof Date ? r.deletedAt.toISOString() : r.deletedAt,
    })),
    nextCursor,
  });
});

/**
 * GET /api/admin/users/duplicates
 *
 * Computes on-demand. Loads all active users + their identity-relevant
 * fields, runs anchor-driven discovery + multi-signal scoring, returns
 * top 100 scored pairs.
 *
 * super_admin only — canMergeUsers gate.
 */
adminUsersRoute.get(
  "/duplicates",
  requirePolicy(canMergeUsers, () => undefined),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);

    // Fetch every active user with the fields the scorer needs.
    const baseRows = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        displayName: profiles.displayName,
        orcid: profiles.orcid,
        githubUrl: profiles.githubUrl,
        linkedinUrl: profiles.linkedinUrl,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(and(isNull(users.deletedAt), isNull(users.mergedIntoUserId)));

    // Pull each user's primary org id in one query.
    const primaryRows = await db
      .select({
        userId: userOrganizations.userId,
        organizationId: userOrganizations.organizationId,
      })
      .from(userOrganizations)
      .where(eq(userOrganizations.isPrimary, true));
    const primaryByUser = new Map<string, string>();
    for (const r of primaryRows) primaryByUser.set(r.userId, r.organizationId);

    // groupIds — empty for now; the group subsystem isn't shipped yet.
    const candidates: CandidateUser[] = baseRows.map((r) => ({
      id: r.id,
      displayName: r.displayName,
      email: r.email,
      orcid: r.orcid,
      githubUrl: r.githubUrl,
      linkedinUrl: r.linkedinUrl,
      primaryOrgId: primaryByUser.get(r.id) ?? null,
      signedUpAt:
        r.createdAt instanceof Date
          ? r.createdAt
          : new Date(r.createdAt as unknown as string),
      groupIds: new Set(),
    }));

    const pairs = buildAndScorePairs(candidates, { limit: 100 });

    // Hydrate compact card payloads with org name + photo.
    const userIdsInPairs = new Set<string>();
    for (const p of pairs) {
      userIdsInPairs.add(p.a.id);
      userIdsInPairs.add(p.b.id);
    }
    const orgIds = new Set<string>();
    for (const u of candidates) {
      if (userIdsInPairs.has(u.id) && u.primaryOrgId) orgIds.add(u.primaryOrgId);
    }
    const orgRows =
      orgIds.size > 0
        ? await db
            .select({ id: organizations.id, name: organizations.name })
            .from(organizations)
            .where(sql`${organizations.id} = ANY(${[...orgIds]})`)
        : [];
    const orgNameById = new Map(orgRows.map((o) => [o.id, o.name] as const));

    const photoByUser = new Map<string, string | null>();
    for (const r of baseRows) photoByUser.set(r.id, null);
    const photoRows =
      userIdsInPairs.size > 0
        ? await db
            .select({ userId: profiles.userId, photoUrl: profiles.photoUrl })
            .from(profiles)
            .where(sql`${profiles.userId} = ANY(${[...userIdsInPairs]})`)
        : [];
    for (const r of photoRows) photoByUser.set(r.userId, r.photoUrl);

    return c.json({
      ok: true,
      pairs: pairs.map((p) => ({
        score: p.score,
        tier: p.tier,
        signals: p.signals,
        users: [
          {
            id: p.a.id,
            displayName: p.a.displayName,
            email: p.a.email,
            orcid: p.a.orcid,
            githubUrl: p.a.githubUrl,
            linkedinUrl: p.a.linkedinUrl,
            photoUrl: photoByUser.get(p.a.id) ?? null,
            primaryOrgId: p.a.primaryOrgId,
            primaryOrgName: p.a.primaryOrgId
              ? orgNameById.get(p.a.primaryOrgId) ?? null
              : null,
            signedUpAt: p.a.signedUpAt.toISOString(),
          },
          {
            id: p.b.id,
            displayName: p.b.displayName,
            email: p.b.email,
            orcid: p.b.orcid,
            githubUrl: p.b.githubUrl,
            linkedinUrl: p.b.linkedinUrl,
            photoUrl: photoByUser.get(p.b.id) ?? null,
            primaryOrgId: p.b.primaryOrgId,
            primaryOrgName: p.b.primaryOrgId
              ? orgNameById.get(p.b.primaryOrgId) ?? null
              : null,
            signedUpAt: p.b.signedUpAt.toISOString(),
          },
        ],
      })),
    });
  }
);

adminUsersRoute.route("/:id", adminUsersByIdRoute);
