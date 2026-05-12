import { Hono } from "hono";
import { and, asc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createDb } from "../../../db";
import { organizations, userOrganizations } from "../../../db/schema";
import { canEditOrganizations } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import type { AppEnv } from "../../../types";
import { adminOrganizationsByIdRoute } from "./byId";

export const adminOrganizationsRoute = new Hono<AppEnv>();

adminOrganizationsRoute.use(
  "*",
  requirePolicy(canEditOrganizations, () => undefined)
);

/**
 * GET /api/admin/organizations
 *
 * Cursor-paginated org register. Filters:
 *   - q          → ILIKE on name / slug / shortName / url
 *   - status     → "active" (default), "merged", "deleted"
 *   - vocab      → "all" (default), "pending", "approved"
 *   - cursor     → last id from the previous page (stable id ordering)
 *   - limit      → page size, clamped [1, 200]
 *
 * Row payload bundles the lightweight identity fields plus a member
 * count so the register can show "01 — Foo Inc · 14 members" at a
 * glance without a follow-up call per row.
 */
adminOrganizationsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const q = c.req.query("q") ?? "";
  const status = c.req.query("status") ?? "active";
  const vocab = c.req.query("vocab") ?? "all";
  const cursor = c.req.query("cursor");
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") ?? "50", 10) || 50, 1),
    200
  );

  const conditions: SQL[] = [];

  if (status === "active") {
    conditions.push(isNull(organizations.deletedAt));
    conditions.push(isNull(organizations.mergedIntoId));
  } else if (status === "merged") {
    conditions.push(isNotNull(organizations.mergedIntoId));
  } else if (status === "deleted") {
    conditions.push(isNotNull(organizations.deletedAt));
  }

  if (vocab === "pending") {
    conditions.push(eq(organizations.status, "pending"));
  } else if (vocab === "approved") {
    conditions.push(eq(organizations.status, "approved"));
  }

  if (q.trim()) {
    const needle = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(organizations.name, needle),
        ilike(organizations.slug, needle),
        ilike(organizations.shortName, needle),
        ilike(organizations.url, needle)
      )!
    );
  }

  if (cursor) {
    conditions.push(sql`${organizations.id} > ${cursor}`);
  }

  // Subquery for member counts. Drizzle's relational API can't express
  // a left-join + group-by in one statement cleanly, so we use a SQL
  // expression that the planner can fold into a single scan.
  const memberCountExpr = sql<number>`(
    SELECT COUNT(*)::int FROM ${userOrganizations}
    WHERE ${userOrganizations.organizationId} = ${organizations.id}
  )`;

  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      shortName: organizations.shortName,
      url: organizations.url,
      logoUrl: organizations.logoUrl,
      logoMarkUrl: organizations.logoMarkUrl,
      logoUsageConsent: organizations.logoUsageConsent,
      status: organizations.status,
      mergedIntoId: organizations.mergedIntoId,
      deletedAt: organizations.deletedAt,
      createdAt: organizations.createdAt,
      memberCount: memberCountExpr,
    })
    .from(organizations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(organizations.id))
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

adminOrganizationsRoute.route("/:id", adminOrganizationsByIdRoute);
