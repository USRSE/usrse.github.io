import { Hono } from "hono";
import { and, asc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../../../db";
import {
  organizationDuplicateDismissals,
  organizations,
  userOrganizations,
} from "../../../db/schema";
import { canEditOrganizations, canMergeOrganizations } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import {
  buildAndScoreOrgPairs,
  type CandidateOrg,
} from "../../../lib/admin/orgDuplicateDetection";
import { joinErrorChain } from "../../../lib/errorChain";
import { buildSlug } from "../../../lib/slug";
import type { AppEnv } from "../../../types";
import { adminOrganizationsByIdRoute } from "./byId";

type OrgType =
  | "university"
  | "national_lab"
  | "agency"
  | "company"
  | "nonprofit"
  | "external_resource"
  | "other";

const ORG_TYPES: OrgType[] = [
  "university",
  "national_lab",
  "agency",
  "company",
  "nonprofit",
  "external_resource",
  "other",
];

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

  // Filter vs page conditions split — same rationale as the users list:
  // the COUNT(*) should reflect the full filtered set, not the current
  // pagination cut.
  const filterConditions: SQL[] = [];

  if (status === "active") {
    filterConditions.push(isNull(organizations.deletedAt));
    filterConditions.push(isNull(organizations.mergedIntoId));
  } else if (status === "merged") {
    filterConditions.push(isNotNull(organizations.mergedIntoId));
  } else if (status === "deleted") {
    filterConditions.push(isNotNull(organizations.deletedAt));
  }

  if (vocab === "pending") {
    filterConditions.push(eq(organizations.status, "pending"));
  } else if (vocab === "approved") {
    filterConditions.push(eq(organizations.status, "approved"));
  }

  if (q.trim()) {
    const needle = `%${q.trim()}%`;
    filterConditions.push(
      or(
        ilike(organizations.name, needle),
        ilike(organizations.slug, needle),
        ilike(organizations.shortName, needle),
        ilike(organizations.url, needle)
      )!
    );
  }

  const pageConditions: SQL[] = [...filterConditions];
  if (cursor) {
    pageConditions.push(sql`${organizations.id} > ${cursor}`);
  }

  // Subquery for member counts. Drizzle's relational API can't express
  // a left-join + group-by in one statement cleanly, so we use a SQL
  // expression that the planner can fold into a single scan.
  const memberCountExpr = sql<number>`(
    SELECT COUNT(*)::int FROM ${userOrganizations}
    WHERE ${userOrganizations.organizationId} = ${organizations.id}
  )`;

  const [rows, [{ count: total }]] = await Promise.all([
    db
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
      .where(pageConditions.length ? and(...pageConditions) : undefined)
      .orderBy(asc(organizations.id))
      .limit(limit + 1),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(organizations)
      .where(filterConditions.length ? and(...filterConditions) : undefined),
  ]);

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
    total,
    nextCursor,
  });
});

/**
 * GET /api/admin/organizations/duplicates
 *
 * On-demand duplicate scorer mirroring /admin/users/duplicates. Pulls
 * every active org, anchors + scores in JS, filters out pairs that
 * have already been dismissed, returns up to 100 with hydrated card
 * payloads. super_admin only.
 */
adminOrganizationsRoute.get(
  "/duplicates",
  requirePolicy(canMergeOrganizations, () => undefined),
  async (c) => {
    if (!c.env.DATABASE_URL)
      return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    try {
      const memberCountExpr = sql<number>`(
        SELECT COUNT(*)::int FROM ${userOrganizations}
        WHERE ${userOrganizations.organizationId} = ${organizations.id}
      )`;

      const baseRows = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          shortName: organizations.shortName,
          url: organizations.url,
          status: organizations.status,
          memberCount: memberCountExpr,
        })
        .from(organizations)
        .where(
          and(
            isNull(organizations.deletedAt),
            isNull(organizations.mergedIntoId)
          )
        );

      const candidates: CandidateOrg[] = baseRows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        shortName: r.shortName,
        url: r.url,
        status: r.status,
        memberCount: r.memberCount,
      }));

      const allPairs = buildAndScoreOrgPairs(candidates, { limit: 1000 });

      const dismissalRows = await db
        .select({
          organizationAId: organizationDuplicateDismissals.organizationAId,
          organizationBId: organizationDuplicateDismissals.organizationBId,
        })
        .from(organizationDuplicateDismissals);
      const dismissedKeys = new Set(
        dismissalRows.map((d) => `${d.organizationAId}|${d.organizationBId}`)
      );
      const pairs = allPairs
        .filter((p) => {
          const key =
            p.a.id < p.b.id
              ? `${p.a.id}|${p.b.id}`
              : `${p.b.id}|${p.a.id}`;
          return !dismissedKeys.has(key);
        })
        .slice(0, 100);

      return c.json({
        ok: true,
        dismissedCount: dismissedKeys.size,
        pairs: pairs.map((p) => ({
          score: p.score,
          tier: p.tier,
          signals: p.signals,
          organizations: [
            {
              id: p.a.id,
              name: p.a.name,
              slug: p.a.slug,
              shortName: p.a.shortName,
              url: p.a.url,
              status: p.a.status,
              memberCount: p.a.memberCount,
            },
            {
              id: p.b.id,
              name: p.b.name,
              slug: p.b.slug,
              shortName: p.b.shortName,
              url: p.b.url,
              status: p.b.status,
              memberCount: p.b.memberCount,
            },
          ],
        })),
      });
    } catch (err) {
      const isDev = (c.env.GIT_SHA ?? "dev") === "dev";
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      console.error("[/admin/organizations/duplicates]", message, stack);
      return c.json(
        {
          ok: false,
          error: "duplicates_failed",
          message: isDev ? message : "internal",
          ...(isDev && stack ? { stack } : {}),
        },
        500
      );
    }
  }
);

/**
 * POST /api/admin/organizations/duplicates/dismiss
 *
 * Persist a "not a duplicate" decision. Idempotent via the pair
 * unique index — re-dismissing is a no-op.
 */
const dismissOrgDuplicateBodySchema = z.object({
  organizationAId: z.uuid(),
  organizationBId: z.uuid(),
  reason: z.string().max(280).optional(),
});

adminOrganizationsRoute.post(
  "/duplicates/dismiss",
  requirePolicy(canMergeOrganizations, () => undefined),
  zValidator("json", dismissOrgDuplicateBodySchema, (result, c) => {
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
    if (body.organizationAId === body.organizationBId) {
      return c.json(
        {
          ok: false,
          error: "invalid_input",
          message: "Cannot dismiss a pair with itself.",
        },
        400
      );
    }
    const [a, b] =
      body.organizationAId < body.organizationBId
        ? [body.organizationAId, body.organizationBId]
        : [body.organizationBId, body.organizationAId];
    await db
      .insert(organizationDuplicateDismissals)
      .values({
        organizationAId: a,
        organizationBId: b,
        dismissedByUserId: actor.user.id,
        reason: body.reason ?? null,
      })
      .onConflictDoNothing();

    c.set("auditAction", "organizations.duplicate_dismiss");
    c.set("auditTarget", { type: "organizations", id: a });
    c.set("auditPayload", {
      organizationAId: a,
      organizationBId: b,
      reason: body.reason ?? null,
    });
    return c.json({ ok: true });
  }
);

/**
 * POST /api/admin/organizations
 *
 * Admin-initiated org creation. Accepts name, optional shortName / url,
 * type (defaults to "other"), optional country, optional description.
 * Generates the slug from name; rejects if it collides with an existing
 * non-deleted org. Sets created_by + updated_by from the actor so the
 * row is immediately attributable.
 */
adminOrganizationsRoute.post("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);
  const actor = c.get("actor")!;

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid_input", message: "Expected JSON body" }, 400);
  }

  const {
    name,
    shortName,
    url,
    type = "other",
    country,
    description,
  } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return c.json({ ok: false, error: "invalid_input", message: "name is required" }, 400);
  }
  if (typeof type !== "string" || !ORG_TYPES.includes(type as OrgType)) {
    return c.json({ ok: false, error: "invalid_type" }, 400);
  }
  if (description != null && (typeof description !== "string" || description.length > 280)) {
    return c.json({ ok: false, error: "description_too_long" }, 400);
  }

  const slug = buildSlug(name.trim());
  if (!slug) {
    return c.json({ ok: false, error: "invalid_input", message: "name has no slug-safe characters" }, 400);
  }

  // Reject if an active org already occupies this slug.
  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt), isNull(organizations.mergedIntoId)))
    .limit(1)
    .then((r) => r[0]);
  if (existing) {
    return c.json(
      {
        ok: false,
        error: "conflict",
        message: `An active organization with slug "${slug}" already exists.`,
      },
      409
    );
  }

  try {
    const [inserted] = await db
      .insert(organizations)
      .values({
        name: name.trim(),
        shortName: typeof shortName === "string" ? shortName : null,
        url: typeof url === "string" ? url : null,
        type: type as OrgType,
        country: typeof country === "string" ? country : null,
        description: typeof description === "string" ? description : null,
        slug,
        status: "pending",
        suggestedBy: actor.user.id,
        createdBy: actor.user.id,
        updatedBy: actor.user.id,
      })
      .returning({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        status: organizations.status,
      });

    c.set("auditAction", "organizations.create");
    c.set("auditTarget", { type: "organizations", id: inserted.id });
    c.set("auditPayload", { name: inserted.name, slug: inserted.slug, type });

    return c.json({ ok: true, organization: inserted }, 201);
  } catch (e) {
    const chain = joinErrorChain(e);
    if (/duplicate key value/i.test(chain) || /unique constraint/i.test(chain)) {
      const which = /name/i.test(chain) ? "name" : /slug/i.test(chain) ? "slug" : "value";
      return c.json(
        {
          ok: false,
          error: "conflict",
          message: `Another organization already uses that ${which}.`,
        },
        409
      );
    }
    throw e;
  }
});

adminOrganizationsRoute.route("/:id", adminOrganizationsByIdRoute);
