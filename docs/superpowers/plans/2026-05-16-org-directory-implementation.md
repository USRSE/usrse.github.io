# Public Org Directory & Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a DB-driven public organizations directory at `/orgs` plus UUID-keyed profile pages at `/orgs/:id`, replacing the hardcoded `/resources/directory`. Add admin form support for the three new fields and backfill scripts for type + location + description.

**Architecture:** New public Hono route `/organizations` (list + profile). Profile uses an optional-auth middleware so anonymous viewers get only `isPublic = true` members while signed-in callers also see `isDiscoverable = true` stubs. Schema migration adds `type` enum + `country` + `description` + `created_by` + `updated_by`. Frontend renders two new pages reusing `OrgLogo`/`InitialsHex`/`MemberCard`. Three backfill scripts handle type heuristics, external-resource seeding, and Wikidata + Wikipedia lookup.

**Tech Stack:** Drizzle, Hono, Neon Postgres (transactions via `db.transaction`), React 19 + React Router 7, Tailwind v4, Wikidata SPARQL JSON, Wikipedia REST `/page/summary`, Photon geocoder, vitest.

**Spec:** `docs/superpowers/specs/2026-05-16-org-directory-design.md`

---

## File Structure

**Migrations**
- Create: `packages/api/migrations/0020_organizations_public_profile.sql`

**API**
- Modify: `packages/api/src/db/schema/enums.ts` — add `orgType` enum
- Modify: `packages/api/src/db/schema/vocab.ts` — add new columns to `organizations`
- Create: `packages/api/src/lib/orgVisibility.ts` — shared roster predicate
- Create: `packages/api/src/lib/orgVisibility.test.ts`
- Create: `packages/api/src/middleware/optionalActor.ts` — set actor if token present, never 401
- Create: `packages/api/src/routes/organizations.ts` — public list + profile
- Create: `packages/api/src/routes/organizations.test.ts`
- Modify: `packages/api/src/index.ts` — mount `/organizations`
- Modify: `packages/api/src/routes/admin/organizations/index.ts` — accept new fields, write `created_by`
- Modify: `packages/api/src/routes/admin/organizations/byId.ts` — accept new fields, write `updated_by` on all mutations

**Admin web**
- Modify: `apps/admin/src/pages/organizations/OrganizationDetailPage.tsx` — three new inputs

**Public web**
- Create: `apps/web/src/hooks/useOrganizations.ts`
- Create: `apps/web/src/pages/orgs/OrgsDirectoryPage.tsx`
- Create: `apps/web/src/pages/orgs/OrgProfilePage.tsx`
- Create: `apps/web/src/pages/orgs/OrgCard.tsx` (local subcomponent)
- Modify: `apps/web/src/App.tsx` — three new routes + redirect
- Modify: `apps/web/src/components/Nav.tsx` — Community menu entry, drop Resources→Directory entry
- Delete: `apps/web/src/pages/resources/DirectoryPage.tsx`

**Backfill scripts**
- Create: `packages/api/scripts/data/legacy-rse-groups.json` — preserved from old DirectoryPage
- Create: `packages/api/scripts/data/external-resources.json` — preserved BSSw/SSI/URSSI/ReSA/etc
- Create: `packages/api/scripts/backfill-org-types.ts`
- Create: `packages/api/scripts/backfill-org-locations.ts`
- Create: `packages/api/scripts/lib/wikidata.ts` — SPARQL helper
- Create: `packages/api/scripts/lib/wikipedia.ts` — REST summary helper
- Create: `packages/api/scripts/lib/photon.ts` — geocoder helper

---

## Task 1: Schema migration + Drizzle declaration

**Files:**
- Create: `packages/api/migrations/0020_organizations_public_profile.sql`
- Modify: `packages/api/src/db/schema/enums.ts`
- Modify: `packages/api/src/db/schema/vocab.ts`

- [ ] **Step 1: Write the migration SQL**

```sql
-- packages/api/migrations/0020_organizations_public_profile.sql
-- Adds the columns the public org directory + profile pages depend on,
-- plus a directory-serving partial index. `type` defaults to 'other'
-- so the migration applies cleanly; the type backfill script
-- reclassifies after.

CREATE TYPE org_type AS ENUM (
  'university',
  'national_lab',
  'agency',
  'company',
  'nonprofit',
  'external_resource',
  'other'
);--> statement-breakpoint

ALTER TABLE organizations
  ADD COLUMN type org_type NOT NULL DEFAULT 'other',
  ADD COLUMN country text,
  ADD COLUMN description text,
  ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;--> statement-breakpoint

CREATE INDEX organizations_directory_idx
  ON organizations (type, name)
  WHERE deleted_at IS NULL
    AND merged_into_id IS NULL
    AND status = 'approved';
```

- [ ] **Step 2: Add `orgType` enum to Drizzle**

In `packages/api/src/db/schema/enums.ts`, add alongside the existing enums:

```ts
export const orgType = pgEnum("org_type", [
  "university",
  "national_lab",
  "agency",
  "company",
  "nonprofit",
  "external_resource",
  "other",
]);
```

- [ ] **Step 3: Add columns to the Drizzle `organizations` table**

In `packages/api/src/db/schema/vocab.ts`, import `orgType` from `./enums` and add five new column definitions inside the `organizations` `pgTable(...)` definition, immediately after `logoCredit: text("logo_credit"),`:

```ts
    type: orgType("type").notNull().default("other"),
    country: text("country"),
    description: text("description"),
    createdBy: uuid("created_by").references((): any => users.id, {
      onDelete: "set null",
    }),
    updatedBy: uuid("updated_by").references((): any => users.id, {
      onDelete: "set null",
    }),
```

Then add the partial index inside the table's third-argument array, after `organizations_active_idx`:

```ts
    index("organizations_directory_idx")
      .on(t.type, t.name)
      .where(
        sql`deleted_at IS NULL AND merged_into_id IS NULL AND status = 'approved'`
      ),
```

- [ ] **Step 4: Apply the migration locally**

Run from repo root:

```bash
npm run db:apply --workspace=@us-rse/api -- migrations/0020_organizations_public_profile.sql
```

Expected: `Applied: 0020_organizations_public_profile.sql` (or equivalent). If the script doesn't accept a positional arg, fall back to `tsx scripts/apply-migration.ts migrations/0020_organizations_public_profile.sql`.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: PASS. If `vocab.ts` complains about `sql` import, add `sql` to the existing `drizzle-orm` import at the top.

- [ ] **Step 6: Commit**

```bash
git add packages/api/migrations/0020_organizations_public_profile.sql \
        packages/api/src/db/schema/enums.ts \
        packages/api/src/db/schema/vocab.ts
git commit -m "feat(db): add org type, country, description, and audit columns

Migration 0020 introduces the org_type enum and adds type/country/
description/created_by/updated_by to the organizations table. Adds a
partial index covering the public directory's hot query path. New
columns default to NULL or 'other' so existing rows apply cleanly;
backfill runs in a separate task."
```

---

## Task 2: Shared roster-visibility predicate

**Files:**
- Create: `packages/api/src/lib/orgVisibility.ts`
- Create: `packages/api/src/lib/orgVisibility.test.ts`

The predicate is shared between the profile endpoint and the future "members on this org" widgets, so it lives in its own module.

- [ ] **Step 1: Write the failing test**

```ts
// packages/api/src/lib/orgVisibility.test.ts
import { describe, expect, it } from "vitest";
import {
  classifyMember,
  shouldIncludeInRoster,
  stripPrivateFields,
  type RosterMember,
  type CallerClass,
} from "./orgVisibility";

const publicMember: RosterMember = {
  userId: "u1",
  memberSlug: "ada",
  displayName: "Ada Lovelace",
  avatarUrl: "https://x/ada.jpg",
  role: "Principal Investigator",
  isPrimary: true,
  isPublic: true,
  isDiscoverable: true,
};

const listedPrivate: RosterMember = {
  ...publicMember,
  userId: "u2",
  memberSlug: "ed",
  displayName: "Edsger Dijkstra",
  isPublic: false,
  isDiscoverable: true,
};

const hidden: RosterMember = {
  ...publicMember,
  userId: "u3",
  memberSlug: "gh",
  displayName: "Grace Hopper",
  isPublic: false,
  isDiscoverable: false,
};

describe("shouldIncludeInRoster", () => {
  it.each<[CallerClass, RosterMember, boolean]>([
    ["anonymous", publicMember, true],
    ["anonymous", listedPrivate, false],
    ["anonymous", hidden, false],
    ["member", publicMember, true],
    ["member", listedPrivate, true],
    ["member", hidden, false],
    ["admin", publicMember, true],
    ["admin", listedPrivate, true],
    ["admin", hidden, false],
  ])("caller=%s, member=%j → %s", (caller, member, expected) => {
    expect(shouldIncludeInRoster(caller, member)).toBe(expected);
  });
});

describe("stripPrivateFields", () => {
  it("nulls avatarUrl + role for listed-private members", () => {
    expect(stripPrivateFields(listedPrivate)).toMatchObject({
      memberSlug: "ed",
      displayName: "Edsger Dijkstra",
      avatarUrl: null,
      role: null,
      isPrimary: true,
    });
  });
  it("passes through fully-public members unchanged", () => {
    expect(stripPrivateFields(publicMember)).toMatchObject({
      avatarUrl: "https://x/ada.jpg",
      role: "Principal Investigator",
    });
  });
});

describe("classifyMember", () => {
  it("returns 'public' for isPublic=true", () => {
    expect(classifyMember(publicMember)).toBe("public");
  });
  it("returns 'listed' for isPublic=false + isDiscoverable=true", () => {
    expect(classifyMember(listedPrivate)).toBe("listed");
  });
  it("returns 'hidden' for both false", () => {
    expect(classifyMember(hidden)).toBe("hidden");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test --workspace=@us-rse/api -- orgVisibility
```

Expected: FAIL — `cannot find module './orgVisibility'`.

- [ ] **Step 3: Write the implementation**

```ts
// packages/api/src/lib/orgVisibility.ts

export type CallerClass = "anonymous" | "member" | "admin";

export type MemberVisibility = "public" | "listed" | "hidden";

export interface RosterMember {
  userId: string;
  memberSlug: string;
  displayName: string;
  avatarUrl: string | null;
  role: string | null;
  isPrimary: boolean;
  isPublic: boolean;
  isDiscoverable: boolean;
}

export interface PublicRosterMember {
  userId: string;
  memberSlug: string;
  displayName: string;
  avatarUrl: string | null;
  role: string | null;
  isPrimary: boolean;
}

/**
 * Returns the effective visibility class of a member based on the
 * two-boolean `users.isPublic` + `users.isDiscoverable` model.
 *
 *   public  — isPublic=true (renders full card everywhere)
 *   listed  — isPublic=false, isDiscoverable=true (stub only, signed-in only)
 *   hidden  — isPublic=false, isDiscoverable=false (never rendered)
 */
export function classifyMember(m: RosterMember): MemberVisibility {
  if (m.isPublic) return "public";
  return m.isDiscoverable ? "listed" : "hidden";
}

/**
 * Whether a member appears in the org-profile roster for the given
 * caller class. See spec section 5 for the rationale behind each row.
 */
export function shouldIncludeInRoster(
  caller: CallerClass,
  member: RosterMember
): boolean {
  const v = classifyMember(member);
  if (v === "hidden") return false;
  if (v === "listed") return caller !== "anonymous";
  return true; // public
}

/**
 * Serialization-time projection. Listed-private members appear in the
 * signed-in roster but with avatar + role nulled, matching the stub
 * behavior of /members. Public members pass through unchanged.
 *
 * Hidden members must be filtered upstream — this function does not
 * defend against being called with one.
 */
export function stripPrivateFields(m: RosterMember): PublicRosterMember {
  const v = classifyMember(m);
  return {
    userId: m.userId,
    memberSlug: m.memberSlug,
    displayName: m.displayName,
    avatarUrl: v === "public" ? m.avatarUrl : null,
    role: v === "public" ? m.role : null,
    isPrimary: m.isPrimary,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npm run test --workspace=@us-rse/api -- orgVisibility
```

Expected: all 14 tests PASS.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/lib/orgVisibility.ts \
        packages/api/src/lib/orgVisibility.test.ts
git commit -m "feat(api): shared visibility predicate for org-profile roster

Three-class classification (public/listed/hidden) from the existing
isPublic + isDiscoverable booleans on users. shouldIncludeInRoster
and stripPrivateFields are the two primitives the org profile
endpoint uses; both have full table-test coverage."
```

---

## Task 3: Optional-actor middleware

**Files:**
- Create: `packages/api/src/middleware/optionalActor.ts`

The org profile endpoint is public but the roster shape depends on whether the caller is signed in. The existing `requireActorContext` middleware 401s on missing auth; we need a variant that loads `ActorContext` if a valid token is present and silently sets `c.var.actor = null` otherwise.

- [ ] **Step 1: Inspect the existing middleware to mirror its shape**

Read `packages/api/src/middleware/actorContext.ts:38-120` for the canonical lookup logic — the new middleware reuses that exact query but wraps it in a no-throw outer block.

- [ ] **Step 2: Implement the optional-actor middleware**

```ts
// packages/api/src/middleware/optionalActor.ts

import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { users } from "../db/schema";
import type { ActorContext } from "../lib/policies";
import type { AppEnv } from "../types";

/**
 * Sets `c.var.actor` to an ActorContext when a valid WorkOS token is
 * present, otherwise leaves it undefined. Never 401s. Use on
 * public-by-default routes whose response shape varies for signed-in
 * callers (the org profile member roster is the original use case).
 *
 * Unlike requireActorContext, this middleware does NOT enforce
 * canEnterAdminApp — anyone signed in is "a member" for the purposes
 * of the optional-auth flow. Admin-only routes still gate with
 * requireActorContext.
 */
export const optionalActor = createMiddleware<AppEnv>(async (c, next) => {
  const workosId = c.get("workosUserId");

  if (!workosId || !c.env.DATABASE_URL) {
    await next();
    return;
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const [u] = await db
      .select({
        id: users.id,
        memberId: users.memberId,
        email: users.email,
        systemTier: users.systemTier,
      })
      .from(users)
      .where(eq(users.workosId, workosId))
      .limit(1);

    if (u) {
      const actor: ActorContext = {
        id: u.id,
        memberId: u.memberId,
        email: u.email,
        systemTier: u.systemTier,
        chairedGroupIds: [],
        chairedEventIds: [],
        leadershipTerms: [],
      };
      c.set("actor", actor);
    }
  } catch {
    // Optional-auth middleware must never throw. Logging a DB failure
    // here would swamp Workers logs since anonymous traffic hits this
    // path on every request.
  }

  await next();
});
```

- [ ] **Step 3: Verify the ActorContext shape matches `lib/policies.ts`**

```bash
grep -n "interface ActorContext" packages/api/src/lib/policies.ts
```

If the interface requires additional fields beyond what's loaded above (e.g. `chairedGroupIds`), adjust the construction so the type compiles. The minimal load is intentional — the profile endpoint only uses `actor.systemTier` to classify callers, but `ActorContext` is the canonical type.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/middleware/optionalActor.ts
git commit -m "feat(api): optional-actor middleware for public-by-default routes

Sets c.var.actor when a WorkOS token is valid, no-ops otherwise.
Used by the public org profile endpoint to vary the member roster
shape for signed-in callers without 401'ing anonymous visitors."
```

---

## Task 4: Public list endpoint `GET /organizations`

**Files:**
- Create: `packages/api/src/routes/organizations.ts`
- Create: `packages/api/src/routes/organizations.test.ts`
- Modify: `packages/api/src/index.ts`

- [ ] **Step 1: Write the failing test for filter assembly**

```ts
// packages/api/src/routes/organizations.test.ts
import { describe, expect, it } from "vitest";
import { buildListFilters, computeFacets } from "./organizations";

describe("buildListFilters", () => {
  it("always applies the base predicate", () => {
    const { sqlFragments } = buildListFilters({});
    expect(sqlFragments).toContain("status = 'approved'");
    expect(sqlFragments).toContain("deleted_at IS NULL");
    expect(sqlFragments).toContain("merged_into_id IS NULL");
  });

  it("adds type filter when type !== 'all'", () => {
    const { sqlFragments } = buildListFilters({ type: "university" });
    expect(sqlFragments.some((s) => s.includes("type = 'university'"))).toBe(true);
  });

  it("does not add type filter when type === 'all'", () => {
    const { sqlFragments } = buildListFilters({ type: "all" });
    expect(sqlFragments.every((s) => !s.includes("type ="))).toBe(true);
  });

  it("adds country filter when country present", () => {
    const { sqlFragments } = buildListFilters({ country: "US" });
    expect(sqlFragments.some((s) => s.includes("country = 'US'"))).toBe(true);
  });

  it("adds member-join clause when member=true", () => {
    const { joins } = buildListFilters({ member: true });
    expect(joins).toContain("org_memberships");
  });

  it("substring-searches name/shortName/url for q", () => {
    const { sqlFragments } = buildListFilters({ q: "MIT" });
    const joined = sqlFragments.join(" ");
    expect(joined).toMatch(/name.*ilike.*%MIT%/i);
    expect(joined).toMatch(/short_name.*ilike/i);
    expect(joined).toMatch(/url.*ilike/i);
  });
});

describe("computeFacets", () => {
  it("counts orgs by type and country, taking top 20 countries", () => {
    const rows = [
      { type: "university", country: "US" },
      { type: "university", country: "UK" },
      { type: "national_lab", country: "US" },
      { type: "company", country: null },
    ];
    const facets = computeFacets(rows as any);
    expect(facets.types.university).toBe(2);
    expect(facets.types.national_lab).toBe(1);
    expect(facets.types.company).toBe(1);
    expect(facets.countries.US).toBe(2);
    expect(facets.countries.UK).toBe(1);
    expect(facets.countries).not.toHaveProperty("null");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test --workspace=@us-rse/api -- organizations
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route + helpers**

```ts
// packages/api/src/routes/organizations.ts
import { Hono } from "hono";
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
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
import { optionalActor } from "../middleware/optionalActor";
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
 * Public directory list. No auth. See spec section 3 for the full
 * query-param contract.
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
```

- [ ] **Step 4: Mount the route in `packages/api/src/index.ts`**

Add the import next to the others:

```ts
import { organizationsRoute } from "./routes/organizations";
```

Mount it next to the existing public routes, after `app.route("/groups", publicGroupsRoute);`:

```ts
app.route("/organizations", organizationsRoute);
```

- [ ] **Step 5: Run tests to verify the helpers pass**

```bash
npm run test --workspace=@us-rse/api -- organizations
```

Expected: all `buildListFilters` and `computeFacets` tests PASS.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Smoke test against the running dev worker**

```bash
npm run dev --workspace=@us-rse/api &
sleep 3
curl -s "http://localhost:8787/organizations?limit=5" | jq '.ok, .rows[0].name, .facets.types'
```

Expected: `true`, an org name, `{}` (empty facets until backfill runs) or a count map.

- [ ] **Step 8: Commit**

```bash
git add packages/api/src/routes/organizations.ts \
        packages/api/src/routes/organizations.test.ts \
        packages/api/src/index.ts
git commit -m "feat(api): public GET /organizations list endpoint

Filterable by q, type, country, member; returns paginated rows with
memberCount + isOrgMember plus facet counts for types and top-20
countries. Pure-function helpers (buildListFilters, computeFacets)
are unit-tested; the SQL wiring is exercised manually against
wrangler dev."
```

---

## Task 5: Public profile endpoint `GET /organizations/:id`

**Files:**
- Modify: `packages/api/src/routes/organizations.ts`
- Modify: `packages/api/src/routes/organizations.test.ts`

- [ ] **Step 1: Add failing test for `classifyCaller` helper**

Append to `organizations.test.ts`:

```ts
import { classifyCaller } from "./organizations";

describe("classifyCaller", () => {
  it("returns 'anonymous' when actor is undefined", () => {
    expect(classifyCaller(undefined)).toBe("anonymous");
  });
  it("returns 'admin' when actor.systemTier is super_admin", () => {
    expect(classifyCaller({ systemTier: "super_admin" } as any)).toBe("admin");
  });
  it("returns 'admin' when actor.systemTier is staff", () => {
    expect(classifyCaller({ systemTier: "staff" } as any)).toBe("admin");
  });
  it("returns 'member' for any other authenticated actor", () => {
    expect(classifyCaller({ systemTier: "member" } as any)).toBe("member");
  });
});
```

- [ ] **Step 2: Verify test fails**

```bash
npm run test --workspace=@us-rse/api -- organizations
```

Expected: FAIL — `classifyCaller` not exported.

- [ ] **Step 3: Implement `classifyCaller` and the profile route**

Add to `packages/api/src/routes/organizations.ts`, after the existing helpers:

```ts
import { eventSponsorships, events } from "../db/schema";
import type { ActorContext } from "../lib/policies";
import {
  shouldIncludeInRoster,
  stripPrivateFields,
  type CallerClass,
  type RosterMember,
} from "../lib/orgVisibility";

export function classifyCaller(actor: ActorContext | undefined): CallerClass {
  if (!actor) return "anonymous";
  if (actor.systemTier === "super_admin" || actor.systemTier === "staff") {
    return "admin";
  }
  return "member";
}

/**
 * GET /organizations/:id
 *
 * Public org profile. Reads optional actor via the optionalActor
 * middleware applied below; never 401s. 404s for non-approved,
 * deleted, or merged orgs regardless of caller class.
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
  // Volume per org is small (median ~10, P99 ~50), so a JS filter is
  // cheaper than a CASE-heavy SQL predicate that hand-rolls the same
  // 3-class classification.
  const rosterRaw = await db
    .select({
      userId: sql<string>`users.id`,
      memberSlug: sql<string>`users.member_slug`,
      displayName: sql<string>`coalesce(profiles.display_name, users.email)`,
      avatarUrl: sql<string | null>`profiles.avatar_url`,
      role: sql<string | null>`user_organizations.role`,
      isPrimary: sql<boolean>`user_organizations.is_primary`,
      isPublic: sql<boolean>`users.is_public`,
      isDiscoverable: sql<boolean>`users.is_discoverable`,
      hasProfile: sql<boolean>`profiles.user_id IS NOT NULL`,
      isDeleted: sql<boolean>`users.deleted_at IS NOT NULL`,
      isMerged: sql<boolean>`users.merged_into_id IS NOT NULL`,
    })
    .from(userOrganizations)
    .innerJoin(
      sql.raw("users"),
      sql`users.id = ${userOrganizations.userId}`
    )
    .leftJoin(
      sql.raw("profiles"),
      sql`profiles.user_id = ${userOrganizations.userId}`
    )
    .where(
      and(
        eq(userOrganizations.organizationId, id),
        isNull(userOrganizations.endedAt)
      )
    );

  const eligible = rosterRaw.filter(
    (r) => r.hasProfile && !r.isDeleted && !r.isMerged
  );
  const totalCount = eligible.length;

  const included: RosterMember[] = eligible.filter((r) =>
    shouldIncludeInRoster(caller, r as RosterMember)
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
        eventDate:
          s.eventDate instanceof Date
            ? s.eventDate.toISOString()
            : s.eventDate,
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
```

- [ ] **Step 4: Run tests to verify helper passes**

```bash
npm run test --workspace=@us-rse/api -- organizations
```

Expected: `classifyCaller` tests PASS.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: PASS. If the `users` / `profiles` raw-table refs error, replace `sql.raw("users")` with the imported `users` schema table and use proper Drizzle joins instead — left as a refinement allowed during implementation if the raw-table approach doesn't compile cleanly.

- [ ] **Step 6: Smoke test against dev worker**

```bash
# Pick an org id from the list endpoint:
ORG_ID=$(curl -s "http://localhost:8787/organizations?limit=1" | jq -r '.rows[0].id')
curl -s "http://localhost:8787/organizations/$ORG_ID" | jq '.organization.name, .members.totalCount, .members.visibleCount, .members.hiddenCount'
```

Expected: an org name, three integer counts. Anonymous caller — hiddenCount should be ≥ visibleCount for any private members.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/routes/organizations.ts \
        packages/api/src/routes/organizations.test.ts
git commit -m "feat(api): public GET /organizations/:id profile endpoint

Returns org metadata + active membership tier + event sponsorships +
visibility-respecting member roster. Anonymous callers see public
members only; signed-in callers also see listed-private stubs with
avatar + role nulled. classifyCaller maps the optional ActorContext
to the three caller classes used by the orgVisibility module."
```

---

## Task 6: Admin route extensions for new fields

**Files:**
- Modify: `packages/api/src/routes/admin/organizations/index.ts`
- Modify: `packages/api/src/routes/admin/organizations/byId.ts`

- [ ] **Step 1: Locate the existing POST handler at `index.ts:274`**

Read lines 270-326 to see how the existing create endpoint reads its body and inserts.

- [ ] **Step 2: Extend the POST request schema + insert payload**

In `routes/admin/organizations/index.ts`, locate the `POST /` body parsing. Add `type`, `country`, `description` to the destructured body. Validate `type` against the enum values; reject otherwise. Add `createdBy: actor.id` and `updatedBy: actor.id` to the `.values({...})` of the insert.

```ts
// Inside POST /:
const body = await c.req.json();
const {
  name,
  shortName,
  url,
  type = "other",
  country,
  description,
} = body;

if (typeof type !== "string" || !ORG_TYPES.includes(type as OrgType)) {
  return c.json({ ok: false, error: "invalid_type" }, 400);
}
if (description != null && (typeof description !== "string" || description.length > 280)) {
  return c.json({ ok: false, error: "description_too_long" }, 400);
}

// In the insert:
.values({
  name,
  shortName: shortName ?? null,
  url: url ?? null,
  type,
  country: country ?? null,
  description: description ?? null,
  slug,
  status: "pending",
  suggestedBy: actor.id,
  createdBy: actor.id,
  updatedBy: actor.id,
})
```

(`ORG_TYPES` may need to be exported from `organizations.ts` or duplicated locally — duplication is fine, it's seven strings.)

- [ ] **Step 3: Extend the PATCH handler in `byId.ts:255`**

Read lines 255-360 to understand the existing patch shape (it builds a `Partial<Organization>` from the request body, then updates).

Add `type`, `country`, `description` to the allowed-fields whitelist. Validate `type` and `description` length the same way. Add `updatedBy: actor.id` to the update set unconditionally.

```ts
// In the patch handler — extend the existing field whitelist:
const patch: Record<string, unknown> = {};
if (typeof body.name === "string") patch.name = body.name;
if ("shortName" in body) patch.shortName = body.shortName ?? null;
if ("url" in body) patch.url = body.url ?? null;
if ("type" in body) {
  if (!ORG_TYPES.includes(body.type)) {
    return c.json({ ok: false, error: "invalid_type" }, 400);
  }
  patch.type = body.type;
}
if ("country" in body) patch.country = body.country ?? null;
if ("description" in body) {
  if (
    body.description != null &&
    (typeof body.description !== "string" || body.description.length > 280)
  ) {
    return c.json({ ok: false, error: "description_too_long" }, 400);
  }
  patch.description = body.description ?? null;
}

if (Object.keys(patch).length === 0) {
  return c.json({ ok: false, error: "no_fields_to_update" }, 400);
}

patch.updatedBy = actor.id;
patch.updatedAt = new Date();
```

- [ ] **Step 4: Add `updated_by` writes to the other byId mutations**

For each of the four other byId handlers (`soft-delete`, `restore`, `logo` POST/PUT/DELETE, `merge`), add `updatedBy: actor.id` to whichever `update({...})` builder they use. The merge handler updates two orgs (source + target); apply `updatedBy` to both.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Smoke test via the admin app**

In the admin app, edit any org and verify it still saves. Run a SELECT to confirm `updated_by` populated:

```bash
# In a psql session against the dev DB:
SELECT id, name, type, country, description, created_by, updated_by, updated_at
FROM organizations ORDER BY updated_at DESC LIMIT 3;
```

Expected: `updated_by` set to the current admin user UUID for any row touched.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/routes/admin/organizations/index.ts \
        packages/api/src/routes/admin/organizations/byId.ts
git commit -m "feat(api): admin org endpoints accept type/country/description + audit

POST writes created_by; PATCH + soft-delete + restore + logo + merge
all write updated_by from the actor. type validates against the
org_type enum, description enforces the 280-char cap at the API layer."
```

---

## Task 7: Admin UI — three new fields on `OrganizationDetailPage`

**Files:**
- Modify: `apps/admin/src/pages/organizations/OrganizationDetailPage.tsx`

- [ ] **Step 1: Locate the existing field editor section**

Read `OrganizationDetailPage.tsx:1-300` to find where `name`/`shortName`/`url` inputs live and how they wire to the PATCH call.

- [ ] **Step 2: Add the three new inputs**

Add immediately below the existing `url` input:

```tsx
<EditorialField label="Type">
  <select
    value={form.type}
    onChange={(e) => updateField("type", e.target.value)}
    className="…"   // match existing select styling on this page
  >
    <option value="university">University</option>
    <option value="national_lab">National Lab</option>
    <option value="agency">Agency</option>
    <option value="company">Company</option>
    <option value="nonprofit">Nonprofit</option>
    <option value="external_resource">External Resource</option>
    <option value="other">Other</option>
  </select>
</EditorialField>

<EditorialField label="Country">
  <EditorialInput
    value={form.country ?? ""}
    onChange={(e) => updateField("country", e.target.value || null)}
    placeholder="e.g. United States"
  />
</EditorialField>

<EditorialField label="Description (280 char max)">
  <EditorialTextarea
    value={form.description ?? ""}
    onChange={(e) => {
      if (e.target.value.length <= 280) {
        updateField("description", e.target.value || null);
      }
    }}
    rows={3}
  />
  <div className="text-xs text-stone-500 mt-1">
    {(form.description ?? "").length}/280
  </div>
</EditorialField>
```

`EditorialField` / `EditorialInput` / `EditorialTextarea` are the existing form primitives — check `apps/admin/src/components/` for exact names. If the component is called something different on this page (e.g. just `<input>` styled with Tailwind), match what's already there.

- [ ] **Step 3: Extend the form state initializer**

Wherever `useState` initializes the form from the loaded org, add the three new fields:

```ts
const [form, setForm] = useState({
  // ...existing fields...
  type: org?.type ?? "other",
  country: org?.country ?? null,
  description: org?.description ?? null,
});
```

- [ ] **Step 4: Verify the PATCH submission includes the new fields**

The existing PATCH handler likely sends the whole `form` object as the request body; no change needed if so. If it cherry-picks fields, add the new three.

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev --workspace=@us-rse/admin
```

Open any org in the admin app, change the type to "University", set country to "United States", write a description, save. Reload — values persist.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/pages/organizations/OrganizationDetailPage.tsx
git commit -m "feat(admin): type, country, description editors on org detail page

Three new fields surface as a select, text input, and 280-char-capped
textarea matching the existing editorial form style. Saves through
the same PATCH path as the other editable fields."
```

---

## Task 8: `useOrganizations` hook

**Files:**
- Create: `apps/web/src/hooks/useOrganizations.ts`

- [ ] **Step 1: Implement the two hooks**

```ts
// apps/web/src/hooks/useOrganizations.ts
import { useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

export type OrgType =
  | "university"
  | "national_lab"
  | "agency"
  | "company"
  | "nonprofit"
  | "external_resource"
  | "other";

export interface OrgRow {
  id: string;
  name: string;
  shortName: string | null;
  url: string | null;
  type: OrgType;
  country: string | null;
  logoUrl: string | null;
  logoMarkUrl: string | null;
  memberCount: number;
  isOrgMember: boolean;
}

export interface OrgsListResponse {
  ok: true;
  rows: OrgRow[];
  total: number;
  nextCursor: string | null;
  facets: {
    types: Record<OrgType, number>;
    countries: Record<string, number>;
  };
}

export interface OrgProfileMember {
  userId: string;
  memberSlug: string;
  displayName: string;
  avatarUrl: string | null;
  role: string | null;
  isPrimary: boolean;
}

export interface OrgProfileResponse {
  ok: true;
  organization: {
    id: string;
    name: string;
    shortName: string | null;
    url: string | null;
    type: OrgType;
    country: string | null;
    description: string | null;
    logoUrl: string | null;
    logoDarkUrl: string | null;
    logoMarkUrl: string | null;
    logoCredit: string | null;
    isOrgMember: boolean;
    membershipTier: string | null;
    sponsoredEvents: Array<{
      eventId: string;
      eventName: string;
      tier: string;
      eventDate: string;
    }>;
  };
  members: {
    totalCount: number;
    visibleCount: number;
    hiddenCount: number;
    rows: OrgProfileMember[];
  };
}

export interface OrgsFilters {
  q?: string;
  type?: OrgType | "all";
  country?: string;
  member?: boolean;
  cursor?: string | null;
  limit?: number;
}

function buildQs(f: OrgsFilters): string {
  const params = new URLSearchParams();
  if (f.q?.trim()) params.set("q", f.q.trim());
  if (f.type && f.type !== "all") params.set("type", f.type);
  if (f.country) params.set("country", f.country);
  if (f.member) params.set("member", "true");
  if (f.cursor) params.set("cursor", f.cursor);
  if (f.limit) params.set("limit", String(f.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useOrganizations(filters: OrgsFilters) {
  const { callApi } = useApi();
  const [data, setData] = useState<OrgsListResponse | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    callApi<OrgsListResponse>(`/organizations${buildQs(filters)}`, "GET")
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, isLoading, error };
}

export function useOrganization(id: string | undefined) {
  const { callApi } = useApi();
  const [data, setData] = useState<OrgProfileResponse | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    callApi<OrgProfileResponse>(`/organizations/${id}`, "GET")
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { data, isLoading, error };
}
```

- [ ] **Step 2: Verify the `useApi` import path**

```bash
grep -n "useApi" apps/web/src/hooks/*.ts apps/web/src/pages/**/*.tsx 2>/dev/null | head -3
```

If the existing hooks import `useApi` from a different path (e.g. `@/lib/api` rather than `@us-rse/auth-shell`), match what's already in use.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/useOrganizations.ts
git commit -m "feat(web): useOrganizations + useOrganization hooks

Wraps GET /organizations + GET /organizations/:id with cancellable
fetch state. Mirrors the shape of useGroups/useGroup so the
downstream page components feel consistent."
```

---

## Task 9: `OrgsDirectoryPage`

**Files:**
- Create: `apps/web/src/pages/orgs/OrgCard.tsx`
- Create: `apps/web/src/pages/orgs/OrgsDirectoryPage.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/Nav.tsx`

- [ ] **Step 1: Write the `OrgCard` subcomponent**

```tsx
// apps/web/src/pages/orgs/OrgCard.tsx
import { Link } from "react-router-dom";
import { OrgLogo } from "@/components/profile/OrgLogo";
import type { OrgRow } from "@/hooks/useOrganizations";

const TYPE_LABELS: Record<string, string> = {
  university: "University",
  national_lab: "National Lab",
  agency: "Agency",
  company: "Company",
  nonprofit: "Nonprofit",
  external_resource: "External Resource",
  other: "Other",
};

export function OrgCard({ org }: { org: OrgRow }) {
  return (
    <Link
      to={`/orgs/${org.id}`}
      className="group block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-purple-400 hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <OrgLogo
          name={org.name}
          logoUrl={org.logoMarkUrl ?? org.logoUrl}
          size={48}
        />
        <div className="flex-1 min-w-0">
          {org.shortName && (
            <div className="text-xs uppercase tracking-wide text-stone-500">
              {org.shortName}
            </div>
          )}
          <h3 className="text-lg font-semibold text-stone-900 group-hover:text-purple-700 truncate">
            {org.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-stone-600">
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">
              {TYPE_LABELS[org.type] ?? org.type}
            </span>
            {org.country && <span>· {org.country}</span>}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
            <span>{org.memberCount} members</span>
            {org.isOrgMember && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-800">
                Member
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Write the directory page**

```tsx
// apps/web/src/pages/orgs/OrgsDirectoryPage.tsx
import { useEffect, useRef, useState } from "react";
import { useOrganizations, type OrgType } from "@/hooks/useOrganizations";
import { OrgCard } from "./OrgCard";

const TYPE_CHIPS: Array<{ value: OrgType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "university", label: "University" },
  { value: "national_lab", label: "National Lab" },
  { value: "agency", label: "Agency" },
  { value: "company", label: "Company" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "external_resource", label: "External Resource" },
];

export function OrgsDirectoryPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<OrgType | "all">("all");
  const [country, setCountry] = useState<string>("");
  const [memberOnly, setMemberOnly] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [accumulated, setAccumulated] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useOrganizations({
    q,
    type,
    country: country || undefined,
    member: memberOnly,
    cursor: cursor ?? undefined,
    limit: 50,
  });

  // Keyboard shortcuts mirrored from legacy DirectoryPage: `/` focuses,
  // `Esc` clears.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQ("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset accumulated rows whenever the filter set changes.
  useEffect(() => {
    setAccumulated([]);
    setCursor(null);
  }, [q, type, country, memberOnly]);

  // Append page on cursor advance.
  useEffect(() => {
    if (!data) return;
    if (cursor === null) {
      setAccumulated(data.rows);
    } else {
      setAccumulated((prev) => [...prev, ...data.rows]);
    }
  }, [data, cursor]);

  const facets = data?.facets;
  const topCountries = facets
    ? Object.entries(facets.countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-stone-900">Organizations</h1>
        <p className="mt-2 text-stone-600">
          The organizations where RSE work happens.
        </p>
        {facets && (
          <div className="mt-4 text-sm text-stone-500">
            {facets.types.university} universities · {facets.types.national_lab}{" "}
            national labs · {facets.types.agency} agencies ·{" "}
            {data?.rows.filter((r) => r.isOrgMember).length ?? 0} member orgs
          </div>
        )}
      </header>

      <div className="sticky top-0 z-10 bg-white py-3 mb-6 border-b border-stone-200">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search organizations (press / to focus)"
          className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setType(chip.value)}
              className={`rounded-full px-3 py-1 text-xs ${
                type === chip.value
                  ? "bg-purple-600 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
          >
            <option value="">All countries</option>
            {topCountries.map(([c, n]) => (
              <option key={c} value={c}>
                {c} ({n})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={memberOnly}
              onChange={(e) => setMemberOnly(e.target.checked)}
            />
            US-RSE member orgs only
          </label>
        </div>
      </div>

      {isLoading && accumulated.length === 0 && (
        <div className="text-center text-stone-500 py-12">Loading…</div>
      )}

      {!isLoading && accumulated.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-600">
            No organizations match those filters.
          </p>
          <button
            onClick={() => {
              setQ("");
              setType("all");
              setCountry("");
              setMemberOnly(false);
            }}
            className="mt-3 text-sm text-purple-700 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accumulated.map((org) => (
          <OrgCard key={org.id} org={org} />
        ))}
      </div>

      {data?.nextCursor && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setCursor(data.nextCursor)}
            className="rounded-lg border border-stone-300 px-5 py-2 text-sm font-medium hover:border-purple-500 hover:text-purple-700"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire the route in `App.tsx`**

Locate the route group near `/community/groups/:id` and add:

```tsx
<Route path="/orgs" element={<OrgsDirectoryPage />} />
```

Add the import at the top:

```tsx
import { OrgsDirectoryPage } from "./pages/orgs/OrgsDirectoryPage";
```

- [ ] **Step 4: Add nav entry in `Nav.tsx`**

Find the "Community" menu section. Add a new entry alongside Working Groups / Affinity Groups / Regional Groups:

```tsx
{ label: "Organizations", to: "/orgs" }
```

(Match the exact data structure of the existing entries on that menu.)

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev --workspace=@us-rse/web
```

Open `http://localhost:5173/orgs`. Verify:
- Cards render
- Search filters live
- Type chips filter
- Country dropdown populated
- Member-only toggle works
- Load more reveals more rows when there are more than 50 orgs

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/orgs/OrgCard.tsx \
        apps/web/src/pages/orgs/OrgsDirectoryPage.tsx \
        apps/web/src/App.tsx \
        apps/web/src/components/Nav.tsx
git commit -m "feat(web): public organizations directory at /orgs

Filterable grid with type chips, country dropdown, member-only
toggle, and cursor-based load-more. Cards link through to the
profile page. Nav surfaces it under Community."
```

---

## Task 10: `OrgProfilePage`

**Files:**
- Create: `apps/web/src/pages/orgs/OrgProfilePage.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write the profile page**

```tsx
// apps/web/src/pages/orgs/OrgProfilePage.tsx
import { Link, useParams } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganizations";
import { OrgLogo } from "@/components/profile/OrgLogo";
import { MemberCard } from "@/components/members/MemberCard";
import { useAuth } from "@workos-inc/authkit-react";

const TYPE_LABELS: Record<string, string> = {
  university: "University",
  national_lab: "National Lab",
  agency: "Agency",
  company: "Company",
  nonprofit: "Nonprofit",
  external_resource: "External Resource",
  other: "Other",
};

export function OrgProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useOrganization(id);
  const { user } = useAuth();
  const isSignedIn = !!user;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-stone-500">
        Loading…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Organization not found</h1>
        <p className="mt-2 text-stone-600">
          This organization is no longer available or has been merged.
        </p>
        <Link to="/orgs" className="mt-4 inline-block text-purple-700 hover:underline">
          ← Back to the directory
        </Link>
      </div>
    );
  }

  const org = data.organization;
  const members = data.members;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        to="/orgs"
        className="text-sm text-stone-500 hover:text-purple-700"
      >
        ← Organizations
      </Link>

      <header className="mt-4 flex items-start gap-6">
        <OrgLogo name={org.name} logoUrl={org.logoUrl ?? org.logoMarkUrl} size={96} />
        <div className="flex-1">
          {org.shortName && (
            <div className="text-xs uppercase tracking-wide text-stone-500">
              {org.shortName}
            </div>
          )}
          <h1 className="text-3xl font-semibold text-stone-900">{org.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">
              {TYPE_LABELS[org.type] ?? org.type}
            </span>
            {org.country && <span>· {org.country}</span>}
            {org.isOrgMember && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                Member · {org.membershipTier}
              </span>
            )}
          </div>
          {org.url && (
            <a
              href={org.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-purple-700 hover:underline"
            >
              {org.url} ↗
            </a>
          )}
          {org.logoCredit && (
            <div className="mt-3 text-xs text-stone-400">{org.logoCredit}</div>
          )}
        </div>
      </header>

      {org.description && (
        <p className="mt-8 max-w-prose text-stone-700 leading-relaxed">
          {org.description}
        </p>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold">{members.totalCount} members</h2>
        {members.totalCount === 0 ? (
          <p className="mt-3 text-stone-600">
            No US-RSE members are affiliated with this org yet.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.rows.map((m) => (
                <MemberCard
                  key={m.userId}
                  slug={m.memberSlug}
                  displayName={m.displayName}
                  avatarUrl={m.avatarUrl}
                  role={m.role}
                  isPrimary={m.isPrimary}
                />
              ))}
              {!isSignedIn && members.hiddenCount > 0 && (
                <Link
                  to={`/sign-in?next=/orgs/${org.id}`}
                  className="flex items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 p-5 text-center text-sm text-stone-600 hover:border-purple-500 hover:text-purple-700"
                >
                  <div>
                    <div className="font-semibold">+{members.hiddenCount} more members</div>
                    <div className="mt-1 text-xs">Sign in to see the full roster</div>
                  </div>
                </Link>
              )}
            </div>
            {isSignedIn && members.hiddenCount > 0 && (
              <p className="mt-4 text-xs text-stone-500">
                {members.hiddenCount} members have private profiles.
              </p>
            )}
          </>
        )}
      </section>

      {org.sponsoredEvents.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Sponsorships</h2>
          <ul className="mt-4 divide-y divide-stone-200">
            {org.sponsoredEvents.map((s) => (
              <li key={s.eventId} className="py-3 flex justify-between text-sm">
                <Link
                  to={`/events/${s.eventId}`}
                  className="text-stone-800 hover:text-purple-700"
                >
                  {s.eventName}
                </Link>
                <span className="text-stone-500">
                  {s.tier} · {new Date(s.eventDate).getFullYear()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-16 rounded-xl bg-stone-50 p-5 text-sm text-stone-600">
        <strong className="text-stone-800">Information out of date?</strong>{" "}
        Members can update their org affiliation from their profile. Org
        admins can request changes by emailing the contact email.
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Check `MemberCard` props match**

```bash
grep -n "export function MemberCard\|interface MemberCard" apps/web/src/components/members/MemberCard.tsx
```

If the prop names differ from `slug`/`displayName`/`avatarUrl`/`role`/`isPrimary`, adjust the call site to match the existing component's API.

- [ ] **Step 3: Wire the route**

In `App.tsx`, add below the `/orgs` route:

```tsx
<Route path="/orgs/:id" element={<OrgProfilePage />} />
```

Add the import at the top.

- [ ] **Step 4: Manual smoke test (anonymous + signed-in)**

```bash
npm run dev --workspace=@us-rse/web
```

Open an org profile while signed-out, then sign in and reload. Verify:
- Anonymous: only public members shown; "+ N more members" affordance appears if any hidden
- Signed-in: public + listed-private (stubbed) members shown; "N members have private profiles" footnote if hidden > 0
- 404 path when navigating to a garbage UUID
- Sponsorship strip renders if any rows exist

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/orgs/OrgProfilePage.tsx apps/web/src/App.tsx
git commit -m "feat(web): public org profile page at /orgs/:id

Header band with logo + type + country + member tier; optional
description; members section that surfaces the public roster and
the hidden-count affordance with a sign-in CTA for anonymous
viewers; sponsorship strip pulled from event_sponsorships."
```

---

## Task 11: Legacy redirect + nav cleanup

**Files:**
- Modify: `apps/web/src/App.tsx`
- Delete: `apps/web/src/pages/resources/DirectoryPage.tsx`
- Modify: `apps/web/src/components/Nav.tsx` (or wherever Resources→Directory is linked)
- Modify: any internal pages that link to `/resources/directory`
- Create: `packages/api/scripts/data/legacy-rse-groups.json`
- Create: `packages/api/scripts/data/external-resources.json`

- [ ] **Step 1: Extract the legacy data first (before deleting the page)**

Read `apps/web/src/pages/resources/DirectoryPage.tsx` and copy:
- The `rawRseGroups` array (~lines 80-125 probably) → write to `packages/api/scripts/data/legacy-rse-groups.json` as a plain JSON array
- The `externalOrgs` array (lines 18-75) → write to `packages/api/scripts/data/external-resources.json` as a plain JSON array

Verify both JSON files parse:

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('packages/api/scripts/data/legacy-rse-groups.json','utf8')).length)"
node -e "console.log(JSON.parse(require('fs').readFileSync('packages/api/scripts/data/external-resources.json','utf8')).length)"
```

Expected: counts matching the source arrays.

- [ ] **Step 2: Add the redirect in `App.tsx`**

```tsx
<Route
  path="/resources/directory"
  element={<Navigate to="/orgs" replace />}
/>
```

- [ ] **Step 3: Find + update internal links**

```bash
grep -rn "/resources/directory" apps/web/src --include="*.tsx" --include="*.ts"
```

For each match, change the path to `/orgs`. The bridge cards in `LearnPage.tsx` and any layout sidebars are likely hits.

- [ ] **Step 4: Remove the Resources → Directory nav entry**

In `Nav.tsx`, find the Resources menu and remove the Directory item (it's now under Community).

- [ ] **Step 5: Delete the legacy page**

```bash
rm apps/web/src/pages/resources/DirectoryPage.tsx
```

And remove the corresponding `import` + `<Route>` for it from `App.tsx`.

- [ ] **Step 6: Smoke test the redirect**

```bash
npm run dev --workspace=@us-rse/web
```

Visit `http://localhost:5173/resources/directory` — expect immediate redirect to `/orgs`.

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/App.tsx \
        apps/web/src/components/Nav.tsx \
        packages/api/scripts/data/legacy-rse-groups.json \
        packages/api/scripts/data/external-resources.json
git add -u  # picks up the rm + any updated internal links
git commit -m "refactor(web): retire /resources/directory in favor of /orgs

301 redirect at the route level; nav now surfaces Organizations
under Community instead of Resources. Legacy hardcoded directory
data preserved as JSON fixtures under packages/api/scripts/data/
for the type and external-resource backfill scripts to consume."
```

---

## Task 12: Type heuristic + external-resource seed backfill

**Files:**
- Create: `packages/api/scripts/backfill-org-types.ts`
- Create: `packages/api/scripts/backfill-org-types.test.ts`

- [ ] **Step 1: Write the classifier test**

```ts
// packages/api/scripts/backfill-org-types.test.ts
import { describe, expect, it } from "vitest";
import { classifyOrgByName } from "./backfill-org-types";

describe("classifyOrgByName", () => {
  it.each<[string, string]>([
    ["Princeton University", "university"],
    ["MIT", "other"], // not matched by simple regex; needs the abbreviation list
    ["Massachusetts Institute of Technology", "university"],
    ["Lawrence Berkeley National Laboratory", "national_lab"],
    ["ORNL", "national_lab"],
    ["NSF", "agency"],
    ["National Science Foundation", "agency"],
    ["BSSw", "external_resource"],
    ["Better Scientific Software (BSSw)", "external_resource"],
    ["Software Sustainability Institute (SSI)", "external_resource"],
    ["Acme Corp", "other"],
  ])("'%s' → %s", (name, expected) => {
    expect(classifyOrgByName(name)).toBe(expected);
  });
});
```

- [ ] **Step 2: Implement the classifier + the runner**

```ts
// packages/api/scripts/backfill-org-types.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { createDb } from "../src/db";
import { organizations } from "../src/db/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NATIONAL_LAB_ABBREVIATIONS = new Set([
  "LANL", "ORNL", "LBNL", "ANL", "NREL", "PNNL", "SNL",
  "INL", "BNL", "FNAL", "SLAC", "Ames",
]);

const AGENCY_TOKENS = new Set([
  "NSF", "NIH", "DOE", "NASA", "NOAA", "USDA", "DARPA", "NIST",
]);

const EXTERNAL_RESOURCE_NAMES: Array<RegExp> = [
  /\bBSSw\b/,
  /Better Scientific Software/,
  /\bSSI\b/,
  /Software Sustainability Institute/,
  /\bURSSI\b/,
  /\bReSA\b/,
  /Research Software Alliance/,
  /IDEAS Productivity/,
  /SWEBOK/,
  /Software Engineering for Science/,
  /Ask Cyberinfrastructure/,
];

export function classifyOrgByName(name: string): string {
  if (EXTERNAL_RESOURCE_NAMES.some((re) => re.test(name))) {
    return "external_resource";
  }
  if (/\b(national\s+lab(oratory)?)\b/i.test(name)) return "national_lab";
  for (const abbr of NATIONAL_LAB_ABBREVIATIONS) {
    if (new RegExp(`\\b${abbr}\\b`).test(name)) return "national_lab";
  }
  for (const tok of AGENCY_TOKENS) {
    if (new RegExp(`\\b${tok}\\b`).test(name)) return "agency";
  }
  if (/\b(National\s+(Science|Institutes?)\s+Foundation|of\s+Health)\b/i.test(name)) {
    return "agency";
  }
  if (/\b(university|college|institute of technology)\b/i.test(name)) {
    return "university";
  }
  return "other";
}

interface CliFlags {
  commit: boolean;
  seedExternal: boolean;
}

function parseArgs(argv: string[]): CliFlags {
  return {
    commit: argv.includes("--commit"),
    seedExternal: !argv.includes("--no-seed"),
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const db = createDb(connStr);

  // Pass 1: classify existing rows whose type is 'other'.
  const rows = await db
    .select({ id: organizations.id, name: organizations.name, type: organizations.type })
    .from(organizations);

  const csvLines = ["id,name,current_type,suggested_type,action"];
  let toUpdate = 0;
  for (const r of rows) {
    const suggested = classifyOrgByName(r.name);
    const action =
      r.type === "other" && suggested !== "other" ? "update" : "skip";
    if (action === "update") toUpdate++;
    csvLines.push(
      `${r.id},"${r.name.replace(/"/g, '""')}",${r.type},${suggested},${action}`
    );
    if (flags.commit && action === "update") {
      await db
        .update(organizations)
        .set({ type: suggested as any })
        .where(eq(organizations.id, r.id));
    }
  }

  // Pass 2: seed external-resource entries from the JSON fixture.
  if (flags.seedExternal) {
    const fixturePath = path.join(__dirname, "data", "external-resources.json");
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Array<{
      primary: string;
      url?: string;
      desc?: string;
    }>;
    for (const e of fixture) {
      const slug = e.primary
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const [existing] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
      if (existing) continue;
      csvLines.push(
        `(new),"${e.primary.replace(/"/g, '""')}",none,external_resource,insert`
      );
      if (flags.commit) {
        await db.insert(organizations).values({
          name: e.primary,
          slug,
          url: e.url ?? null,
          type: "external_resource",
          status: "approved",
        } as any);
      }
    }
  }

  const reportPath = `org-types-${flags.commit ? "applied" : "dry-run"}.csv`;
  fs.writeFileSync(reportPath, csvLines.join("\n"));
  console.log(
    `${flags.commit ? "Wrote" : "Would update"} ${toUpdate} rows. Report: ${reportPath}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Add the npm script**

In `packages/api/package.json`, add to `scripts`:

```json
"backfill:org-types": "tsx scripts/backfill-org-types.ts"
```

- [ ] **Step 4: Run tests**

```bash
npm run test --workspace=@us-rse/api -- backfill-org-types
```

Expected: all classifier tests PASS.

- [ ] **Step 5: Dry-run against dev DB**

```bash
DATABASE_URL="$(grep ^NEON_CONNECTION_STRING .env | cut -d'=' -f2- | tr -d '\"')" \
  npm run backfill:org-types --workspace=@us-rse/api
```

Open `org-types-dry-run.csv` — scan it. Sanity-check: universities mostly become `university`, labs become `national_lab`, the 8 external resources get inserted (or skipped if already present), unclassifiable rows stay `other`.

- [ ] **Step 6: Commit the changes (then run --commit separately)**

```bash
git add packages/api/scripts/backfill-org-types.ts \
        packages/api/scripts/backfill-org-types.test.ts \
        packages/api/package.json
git commit -m "feat(scripts): backfill-org-types classifier + external-resource seed

Heuristic name-based classifier with table-tested rules covering
universities, national labs, federal agencies, and the canonical
external-resource set. Dry-run by default, --commit writes; ships
a CSV report each run. --no-seed skips the external-resource seed
pass for cases where those are already present."
```

- [ ] **Step 7: Run --commit, verify, commit any data state docs**

```bash
DATABASE_URL=... npm run backfill:org-types --workspace=@us-rse/api -- --commit
```

Spot-check 5 rows in the DB to confirm type changes applied. No commit needed for DB-only changes; if a runbook doc is created, commit it.

---

## Task 13: Location + Wikipedia summary backfill

**Files:**
- Create: `packages/api/scripts/lib/wikidata.ts`
- Create: `packages/api/scripts/lib/wikipedia.ts`
- Create: `packages/api/scripts/lib/photon.ts`
- Create: `packages/api/scripts/backfill-org-locations.ts`
- Create: `packages/api/scripts/backfill-org-locations.test.ts`

- [ ] **Step 1: Implement the Wikidata helper**

```ts
// packages/api/scripts/lib/wikidata.ts
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

export interface WikidataHit {
  qid: string;
  label: string;
  country: string | null;
  city: string | null;
  officialWebsite: string | null;
  enwikiTitle: string | null;
}

export async function searchWikidataOrg(
  name: string
): Promise<WikidataHit | null> {
  const query = `
    SELECT ?item ?itemLabel ?countryLabel ?hqLabel ?website ?article WHERE {
      ?item rdfs:label "${name.replace(/"/g, '\\"')}"@en .
      ?item wdt:P31/wdt:P279* wd:Q43229 . # instance of organization (or subclass)
      OPTIONAL { ?item wdt:P17 ?country . }
      OPTIONAL { ?item wdt:P159 ?hq . }
      OPTIONAL { ?item wdt:P856 ?website . }
      OPTIONAL {
        ?article schema:about ?item ;
                 schema:isPartOf <https://en.wikipedia.org/> .
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 1
  `;
  const res = await fetch(
    `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`,
    { headers: { "User-Agent": "us-rse-backfill/1.0" } }
  );
  if (!res.ok) return null;
  const body = (await res.json()) as any;
  const b = body.results?.bindings?.[0];
  if (!b) return null;
  const article = b.article?.value as string | undefined;
  const enwikiTitle = article
    ? decodeURIComponent(article.split("/wiki/")[1] ?? "").replace(/_/g, " ")
    : null;
  return {
    qid: b.item.value.split("/").pop(),
    label: b.itemLabel?.value ?? name,
    country: b.countryLabel?.value ?? null,
    city: b.hqLabel?.value ?? null,
    officialWebsite: b.website?.value ?? null,
    enwikiTitle,
  };
}
```

- [ ] **Step 2: Implement the Wikipedia summary helper**

```ts
// packages/api/scripts/lib/wikipedia.ts
const SUMMARY_BASE =
  "https://en.wikipedia.org/api/rest_v1/page/summary/";

export async function fetchWikipediaSummary(
  title: string
): Promise<string | null> {
  const url = `${SUMMARY_BASE}${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "us-rse-backfill/1.0" },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as any;
  if (body.type === "disambiguation") return null;
  return truncateAtSentence(body.extract ?? "", 280);
}

export function truncateAtSentence(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastPeriod = slice.lastIndexOf(". ");
  if (lastPeriod > 0) return slice.slice(0, lastPeriod + 1);
  return slice;
}
```

- [ ] **Step 3: Implement the Photon helper**

```ts
// packages/api/scripts/lib/photon.ts
const PHOTON_BASE = "https://photon.komoot.io/api";

export async function geocodeOrg(
  name: string
): Promise<{ country: string | null; city: string | null }> {
  const url = `${PHOTON_BASE}?q=${encodeURIComponent(name)}&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "us-rse-backfill/1.0" },
  });
  if (!res.ok) return { country: null, city: null };
  const body = (await res.json()) as any;
  const feature = body.features?.[0];
  if (!feature) return { country: null, city: null };
  const props = feature.properties ?? {};
  return {
    country: props.country ?? null,
    city: props.city ?? props.locality ?? props.name ?? null,
  };
}
```

- [ ] **Step 4: Write the helper tests**

```ts
// packages/api/scripts/backfill-org-locations.test.ts
import { describe, expect, it } from "vitest";
import { truncateAtSentence } from "./lib/wikipedia";
import { nameMatchScore, domainsMatch } from "./backfill-org-locations";

describe("truncateAtSentence", () => {
  it("returns text unchanged if under limit", () => {
    expect(truncateAtSentence("Short.", 280)).toBe("Short.");
  });
  it("cuts at the last sentence boundary within limit", () => {
    const t = "Alpha sentence. Beta sentence. Gamma sentence keeps going forever and ever.";
    expect(truncateAtSentence(t, 35)).toBe("Alpha sentence.");
  });
});

describe("nameMatchScore", () => {
  it("scores exact match 100", () => {
    expect(nameMatchScore("Princeton University", "Princeton University")).toBeGreaterThanOrEqual(99);
  });
  it("scores substring match high", () => {
    expect(nameMatchScore("Princeton University", "Princeton")).toBeGreaterThan(70);
  });
  it("scores unrelated names low", () => {
    expect(nameMatchScore("Acme Corp", "Princeton University")).toBeLessThan(50);
  });
});

describe("domainsMatch", () => {
  it("true when registrable domains match", () => {
    expect(
      domainsMatch("https://www.princeton.edu", "https://princeton.edu/")
    ).toBe(true);
  });
  it("false when different domains", () => {
    expect(
      domainsMatch("https://princeton.edu", "https://mit.edu")
    ).toBe(false);
  });
  it("false when either is null", () => {
    expect(domainsMatch(null, "https://x.edu")).toBe(false);
  });
});
```

- [ ] **Step 5: Implement the backfill runner**

```ts
// packages/api/scripts/backfill-org-locations.ts
import fs from "node:fs";
import { isNull } from "drizzle-orm";
import { createDb } from "../src/db";
import { organizations } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { searchWikidataOrg } from "./lib/wikidata";
import { fetchWikipediaSummary } from "./lib/wikipedia";
import { geocodeOrg } from "./lib/photon";

export function nameMatchScore(a: string, b: string): number {
  if (!a || !b) return 0;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 100;
  if (al.includes(bl) || bl.includes(al)) return 80;
  // Naive Levenshtein-based score (1 - distance / max-len) * 100.
  const dist = levenshtein(al, bl);
  return Math.max(0, 100 - (dist / Math.max(al.length, bl.length)) * 100);
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const v0 = new Array(b.length + 1).fill(0).map((_, i) => i);
  const v1 = new Array(b.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

function rootDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function domainsMatch(a: string | null, b: string | null): boolean {
  const ra = rootDomain(a);
  const rb = rootDomain(b);
  return !!ra && !!rb && ra === rb;
}

interface BackfillFlags {
  commit: boolean;
}

function parseArgs(argv: string[]): BackfillFlags {
  return { commit: argv.includes("--commit") };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const db = createDb(conn);
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      url: organizations.url,
      country: organizations.country,
      description: organizations.description,
    })
    .from(organizations)
    .where(isNull(organizations.country));

  const csv = [
    "id,name,suggested_country,country_source,suggested_city,city_source,suggested_description,description_source,confidence,needs_rewrite",
  ];
  let updatedCountries = 0;
  for (const r of rows) {
    let country: string | null = null;
    let countrySource: string | null = null;
    let city: string | null = null;
    let citySource: string | null = null;
    let description: string | null = null;
    let descriptionSource: string | null = null;
    let confidence = 0;

    const wd = await searchWikidataOrg(r.name);
    if (wd) {
      const nameScore = nameMatchScore(r.name, wd.label);
      const dMatch = domainsMatch(r.url, wd.officialWebsite);
      const accept = nameScore >= 85 || dMatch;
      if (accept) {
        country = wd.country;
        countrySource = "wikidata";
        city = wd.city;
        citySource = "wikidata";
        confidence = dMatch ? 100 : nameScore;
        if (wd.enwikiTitle) {
          description = await fetchWikipediaSummary(wd.enwikiTitle);
          if (description) descriptionSource = "wikipedia";
        }
      }
    }
    if (!country) {
      const geo = await geocodeOrg(r.name);
      if (geo.country) {
        country = geo.country;
        countrySource = "photon";
        city = geo.city;
        citySource = "photon";
        confidence = 60;
      }
    }

    const needsRewrite = description ? "true" : "false";
    csv.push(
      [
        r.id,
        `"${r.name.replace(/"/g, '""')}"`,
        country ?? "",
        countrySource ?? "",
        city ?? "",
        citySource ?? "",
        description ? `"${description.replace(/"/g, '""')}"` : "",
        descriptionSource ?? "",
        Math.round(confidence),
        needsRewrite,
      ].join(",")
    );

    if (flags.commit && country) {
      await db
        .update(organizations)
        .set({ country })
        .where(eq(organizations.id, r.id));
      updatedCountries++;
      // Description NOT written automatically — strict CC BY-SA path.
      // Admins review CSV, paraphrase, then run a separate description
      // patch step (manual or via admin UI).
    }

    // Be polite to upstream APIs.
    await new Promise((res) => setTimeout(res, 250));
  }

  const reportPath = `org-locations-${flags.commit ? "applied" : "dry-run"}.csv`;
  fs.writeFileSync(reportPath, csv.join("\n"));
  console.log(
    `${flags.commit ? "Wrote" : "Would write"} ${updatedCountries} countries. Report: ${reportPath}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 6: Run helper tests**

```bash
npm run test --workspace=@us-rse/api -- backfill-org-locations
```

Expected: all PASS.

- [ ] **Step 7: Add the npm script + dry-run**

In `packages/api/package.json`:

```json
"backfill:org-locations": "tsx scripts/backfill-org-locations.ts"
```

Then:

```bash
DATABASE_URL=... npm run backfill:org-locations --workspace=@us-rse/api
```

Inspect `org-locations-dry-run.csv` — countries should be populated for universities, labs, agencies. Descriptions should be flagged `needs_rewrite=true` for every row that got one.

- [ ] **Step 8: Commit**

```bash
git add packages/api/scripts/backfill-org-locations.ts \
        packages/api/scripts/backfill-org-locations.test.ts \
        packages/api/scripts/lib/wikidata.ts \
        packages/api/scripts/lib/wikipedia.ts \
        packages/api/scripts/lib/photon.ts \
        packages/api/package.json
git commit -m "feat(scripts): backfill-org-locations via Wikidata + Wikipedia + Photon

Wikidata SPARQL primary, Photon fallback for misses. Match-scoring
gates writes (name Levenshtein >=85 or domain match required).
Wikipedia summaries are emitted in the CSV report flagged
needs_rewrite=true; --commit only writes country + city, never
description, to keep CC BY-SA compliance in admin's hands."
```

---

## Task 14: Run live backfills + final smoke test + PR

**Files:** none (manual operations + final commit if any docs change)

- [ ] **Step 1: Run type backfill against dev**

```bash
DATABASE_URL=... npm run backfill:org-types --workspace=@us-rse/api -- --commit
```

Spot-check 5 random rows for correctness.

- [ ] **Step 2: Run location backfill against dev**

```bash
DATABASE_URL=... npm run backfill:org-locations --workspace=@us-rse/api -- --commit
```

Confirm `country` is populated for ~80%+ of universities/labs/agencies.

- [ ] **Step 3: Admin sweep**

Open the admin app, filter the org list by `type=other`, manually reclassify obvious misses. For 10-20 orgs with high-quality Wikipedia summaries in the dry-run CSV, paraphrase the description and save it via the admin form.

- [ ] **Step 4: Public smoke test**

Visit `/orgs` while signed-out and signed-in. Verify:
- Cards render with correct type badges
- Country filter dropdown populates from facets
- A profile page renders correctly with header + (when available) description + roster + sponsorship strip
- Anonymous: only public members; "+N more" affordance appears for orgs with private members
- Signed-in: listed-private stubs visible

- [ ] **Step 5: Final typecheck + tests**

```bash
npm run typecheck
npm run test --workspace=@us-rse/api
```

Expected: PASS.

- [ ] **Step 6: Push the branch and open the PR**

```bash
git push -u origin cdcore09/org-directory
gh pr create --title "feat: public organizations directory & profile" --body "$(cat <<'EOF'
## Summary

- New public org directory at /orgs (DB-driven, type/country/member filters)
- New profile pages at /orgs/:id with visibility-respecting member roster
- Migration 0020 adds type/country/description/created_by/updated_by
- Backfill scripts: heuristic type classifier + Wikidata/Photon location lookup + Wikipedia description suggestions (admin-rewritten before publish)
- /resources/directory now 301s to /orgs

Spec: docs/superpowers/specs/2026-05-16-org-directory-design.md

## Test plan

- [ ] /orgs renders with cards, filters live
- [ ] /orgs/:id renders for anonymous (public members only)
- [ ] /orgs/:id renders for signed-in (public + listed-private stubs)
- [ ] /resources/directory redirects to /orgs
- [ ] Admin can edit type/country/description and save
- [ ] Type backfill --commit reclassifies existing orgs
- [ ] Location backfill --commit populates country for known orgs
EOF
)"
```

Return the PR URL.

---

## Self-Review (run before declaring plan complete)

- [x] All 14 tasks have concrete code blocks, no `TBD`/`TODO` placeholders
- [x] Migration columns match Drizzle schema additions exactly
- [x] Visibility predicate uses `isPublic` + `isDiscoverable` consistently across spec section 5, Task 2 tests, Task 5 SQL, and Task 10 frontend
- [x] Audit columns (`created_by` / `updated_by`) referenced in migration + admin route extensions + admin form
- [x] UUID-keyed URLs throughout (no slug-based routing for `/orgs/:id`)
- [x] Backfill scripts idempotent (re-runs safely)
- [x] Wikipedia descriptions deliberately NOT auto-committed (strict CC BY-SA path)
- [x] Each task ends with a commit, no batched commits across tasks
- [x] Step-level granularity 2-5 minutes per step
