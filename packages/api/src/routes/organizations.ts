import { Hono } from "hono";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createDb } from "../db";
import {
  events,
  eventSponsorships,
  organizations,
  orgMemberships,
  profiles,
  userOrganizations,
  users,
} from "../db/schema";
import type { AppEnv } from "../types";
import { optionalActor } from "../middleware/optionalActor";
import type { ActorContext } from "../lib/policies";
import {
  shouldIncludeInRoster,
  stripPrivateFields,
  type CallerClass,
  type RosterMember,
} from "../lib/orgVisibility";
import { ORG_TYPES, type OrgType } from "../lib/orgType";

export const organizationsRoute = new Hono<AppEnv>();

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

export function classifyCaller(actor: ActorContext | undefined): CallerClass {
  if (!actor) return "anonymous";
  // systemTier: 2 = super_admin, 1 = staff, 0 = member.
  return actor.systemTier >= 1 ? "admin" : "member";
}

/**
 * GET /organizations/:id
 *
 * Public org profile. Reads optional actor via optionalActor middleware
 * applied below; never 401s. 404s for non-approved, deleted, or merged
 * orgs regardless of caller class.
 */
organizationsRoute.get("/:id", optionalActor, async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const id = c.req.param("id");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.id, id),
        eq(organizations.status, "approved"),
        isNull(organizations.deletedAt),
        isNull(organizations.mergedIntoId)
      )
    )
    .limit(1);
  if (!org) return c.json({ ok: false, error: "not_found" }, 404);

  const actor = c.get("actor");
  const caller = classifyCaller(actor);

  const [activeMembership] = await db
    .select({ tier: orgMemberships.tier })
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.organizationId, id),
        lte(orgMemberships.startedAt, sql`now()`),
        or(
          isNull(orgMemberships.endedAt),
          gte(orgMemberships.endedAt, sql`now()`)
        )!
      )
    )
    .limit(1);

  const sponsoredEvents = await db
    .select({
      eventId: events.id,
      eventName: events.name,
      tier: eventSponsorships.tier,
      eventDate: events.startDate,
    })
    .from(eventSponsorships)
    .innerJoin(events, eq(events.id, eventSponsorships.eventId))
    .where(eq(eventSponsorships.organizationId, id))
    .orderBy(desc(events.startDate));

  // Roster — load every current membership, then filter in JS so the
  // visibility predicate stays expressible without table-specific SQL.
  // Volume per org is small (median ~10, P99 ~50).
  const rosterRaw = await db
    .select({
      userId: users.id,
      // profiles.slug serves as the member's public slug identifier
      memberSlug: profiles.slug,
      displayName: profiles.displayName,
      // profiles.photoUrl is the avatar; aliased as avatarUrl for RosterMember
      avatarUrl: profiles.photoUrl,
      role: userOrganizations.role,
      isPrimary: userOrganizations.isPrimary,
      // Visibility flags live on profiles, not users
      isPublic: profiles.isPublic,
      isDiscoverable: profiles.isDiscoverable,
      // Soft-delete / merge sentinel columns (used to exclude inactive users)
      deletedAt: users.deletedAt,
      mergedIntoUserId: users.mergedIntoUserId,
    })
    .from(userOrganizations)
    .innerJoin(users, eq(users.id, userOrganizations.userId))
    .innerJoin(profiles, eq(profiles.userId, userOrganizations.userId))
    .where(
      and(
        eq(userOrganizations.organizationId, id),
        isNull(userOrganizations.endedAt)
      )
    );

  // Filter out soft-deleted and merged users (profile join already
  // ensures hasProfile implicitly — innerJoin means only rows with a
  // profile are returned).
  const eligible = rosterRaw.filter(
    (r) => r.deletedAt == null && r.mergedIntoUserId == null
  );
  const totalCount = eligible.length;

  // Cast to RosterMember — shape is compatible after the field mapping above.
  const included: RosterMember[] = (eligible as RosterMember[]).filter((r) =>
    shouldIncludeInRoster(caller, r)
  );
  const visibleCount = included.length;
  const hiddenCount = totalCount - visibleCount;

  included.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    const aHasRole = a.role != null;
    const bHasRole = b.role != null;
    if (aHasRole !== bHasRole) return aHasRole ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return c.json({
    ok: true,
    organization: {
      id: org.id,
      name: org.name,
      shortName: org.shortName,
      url: org.url,
      type: org.type,
      country: org.country,
      description: org.description,
      logoUrl: org.logoUrl,
      logoDarkUrl: org.logoDarkUrl,
      logoMarkUrl: org.logoMarkUrl,
      logoCredit: org.logoCredit,
      isOrgMember: !!activeMembership,
      membershipTier: activeMembership?.tier ?? null,
      sponsoredEvents: sponsoredEvents.map((s) => ({
        ...s,
        // events.startDate is a Drizzle date column — always returned as a
        // string (YYYY-MM-DD). Spread it through unchanged.
        eventDate: s.eventDate,
      })),
    },
    members: {
      totalCount,
      visibleCount,
      hiddenCount,
      rows: included.map((m) => stripPrivateFields(m)),
    },
  });
});
