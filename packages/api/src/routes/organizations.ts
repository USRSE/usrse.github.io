import { Hono } from "hono";
import {
  and,
  asc,
  eq,
  ilike,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createDb } from "../db";
import {
  organizations,
  orgMemberships,
  userOrganizations,
} from "../db/schema";
import type { AppEnv } from "../types";

export const organizationsRoute = new Hono<AppEnv>();

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

interface ListFilters {
  q?: string;
  type?: OrgType | "all";
  country?: string;
  member?: boolean;
}

/**
 * Pure builder exposed for unit testing. Returns string fragments
 * representing the SQL predicates that will be applied, plus any
 * joins the member filter introduces. The real query uses Drizzle
 * column expressions; this builder only mirrors the shape for tests.
 */
export function buildListFilters(f: ListFilters): {
  sqlFragments: string[];
  joins: string[];
} {
  const sqlFragments = [
    "status = 'approved'",
    "deleted_at IS NULL",
    "merged_into_id IS NULL",
  ];
  const joins: string[] = [];

  if (f.type && f.type !== "all") {
    sqlFragments.push(`type = '${f.type}'`);
  }
  if (f.country) {
    sqlFragments.push(`country = '${f.country}'`);
  }
  if (f.q && f.q.trim()) {
    const needle = `%${f.q.trim()}%`;
    sqlFragments.push(
      `(name ilike '${needle}' or short_name ilike '${needle}' or url ilike '${needle}')`
    );
  }
  if (f.member) {
    joins.push("org_memberships");
    sqlFragments.push(
      "EXISTS (SELECT 1 FROM org_memberships WHERE org_memberships.organization_id = organizations.id AND org_memberships.started_at <= now() AND (org_memberships.ended_at IS NULL OR org_memberships.ended_at >= now()))"
    );
  }

  return { sqlFragments, joins };
}

interface FacetInputRow {
  type: OrgType;
  country: string | null;
}

export function computeFacets(rows: FacetInputRow[]) {
  const types = Object.fromEntries(
    ORG_TYPES.map((t) => [t, 0])
  ) as Record<OrgType, number>;
  const countriesRaw: Record<string, number> = {};
  for (const r of rows) {
    types[r.type] = (types[r.type] ?? 0) + 1;
    if (r.country) {
      countriesRaw[r.country] = (countriesRaw[r.country] ?? 0) + 1;
    }
  }
  // Top 20 countries by count.
  const countries = Object.fromEntries(
    Object.entries(countriesRaw)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
  );
  return { types, countries };
}

/**
 * GET /organizations
 *
 * Public directory list. No auth. Filterable by q, type, country, member.
 * Cursor-paginated with default 50 / max 200. Returns rows with
 * memberCount (current user_organizations only) + isOrgMember plus
 * facet counts for types and top-20 countries.
 */
organizationsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const q = c.req.query("q") ?? "";
  const typeParam = c.req.query("type") ?? "all";
  const country = c.req.query("country");
  const memberOnly = c.req.query("member") === "true";
  const cursor = c.req.query("cursor");
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") ?? "50", 10) || 50, 1),
    200
  );

  const type: OrgType | "all" = ORG_TYPES.includes(typeParam as OrgType)
    ? (typeParam as OrgType)
    : "all";

  const filterConditions: SQL[] = [
    eq(organizations.status, "approved"),
    isNull(organizations.deletedAt),
    isNull(organizations.mergedIntoId),
  ];

  if (type !== "all") {
    filterConditions.push(eq(organizations.type, type));
  }
  if (country) {
    filterConditions.push(eq(organizations.country, country));
  }
  if (q.trim()) {
    const needle = `%${q.trim()}%`;
    filterConditions.push(
      or(
        ilike(organizations.name, needle),
        ilike(organizations.shortName, needle),
        ilike(organizations.url, needle)
      )!
    );
  }
  if (memberOnly) {
    filterConditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${orgMemberships}
        WHERE ${orgMemberships.organizationId} = ${organizations.id}
          AND ${orgMemberships.startedAt} <= now()
          AND (${orgMemberships.endedAt} IS NULL OR ${orgMemberships.endedAt} >= now())
      )`
    );
  }

  const pageConditions: SQL[] = [...filterConditions];
  if (cursor) {
    pageConditions.push(sql`${organizations.id} > ${cursor}`);
  }

  const memberCountExpr = sql<number>`(
    SELECT COUNT(*)::int FROM ${userOrganizations}
    WHERE ${userOrganizations.organizationId} = ${organizations.id}
      AND ${userOrganizations.endedAt} IS NULL
  )`;

  const isOrgMemberExpr = sql<boolean>`EXISTS (
    SELECT 1 FROM ${orgMemberships}
    WHERE ${orgMemberships.organizationId} = ${organizations.id}
      AND ${orgMemberships.startedAt} <= now()
      AND (${orgMemberships.endedAt} IS NULL OR ${orgMemberships.endedAt} >= now())
  )`;

  const [pageRows, [{ count: total }], facetRows] = await Promise.all([
    db
      .select({
        id: organizations.id,
        name: organizations.name,
        shortName: organizations.shortName,
        url: organizations.url,
        type: organizations.type,
        country: organizations.country,
        logoUrl: organizations.logoUrl,
        logoMarkUrl: organizations.logoMarkUrl,
        memberCount: memberCountExpr,
        isOrgMember: isOrgMemberExpr,
      })
      .from(organizations)
      .where(and(...pageConditions))
      .orderBy(asc(organizations.id))
      .limit(limit + 1),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(organizations)
      .where(and(...filterConditions)),
    db
      .select({
        type: organizations.type,
        country: organizations.country,
      })
      .from(organizations)
      .where(and(...filterConditions)),
  ]);

  const hasMore = pageRows.length > limit;
  const page = hasMore ? pageRows.slice(0, limit) : pageRows;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return c.json({
    ok: true,
    rows: page,
    total,
    nextCursor,
    facets: computeFacets(facetRows as FacetInputRow[]),
  });
});

// Profile endpoint added in Task 5.
