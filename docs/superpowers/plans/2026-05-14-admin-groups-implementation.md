# Admin Groups Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship lifecycle management for working / affinity / regional groups across both the admin app and the public site, replacing hardcoded public group lists with DB-driven content.

**Architecture:** One Hono sub-app at `/api/admin/groups/*` (chair-scoped via existing `canEditGroup`), one new public route file at `/api/groups/*` (no auth), and one new `canCreateGroup` (super_admin) policy. The existing `groups` table gets four new columns (`slack_channel`, `charter`, `links`, `is_published`). Three new admin React pages (list + detail + new-group modal) plus a refactor of the two existing public group list pages and a new per-group permalink page at `/community/groups/:id`. A standalone TypeScript script seeds the 45 rows from the two CSV dumps via `--dry-run` (default) and `--commit` flags.

**Tech Stack:** TypeScript everywhere. Backend: Cloudflare Workers + Hono + Drizzle ORM + Neon Postgres. Frontend: React 19 + Vite + React Router 7 + Tailwind + `@us-rse/design-system` + the admin's `editorial.css`. Tests: Vitest for policy units, Playwright for the admin foundation smoke.

Spec: `docs/superpowers/specs/2026-05-14-admin-groups-design.md`. Tracker: #1960.

---

## Pre-flight

- [ ] **Step 1: Create a feature branch off `cdcore09/site-redesign`.**

```bash
cd /Users/corderocore/Documents/usrse.github.io
git checkout cdcore09/site-redesign
git pull --ff-only
git checkout -b cdcore09/admin-groups
```

- [ ] **Step 2: Open the spec and this plan side-by-side.** Every task references the spec.

- [ ] **Step 3: Confirm clean tree.**

```bash
git status
```

Expected: `nothing to commit, working tree clean` and on `cdcore09/admin-groups`.

---

## Task 1: Migration 0019 — groups publishable columns

**Files:**
- Create: `packages/api/migrations/0019_groups_publishable.sql`
- Modify: `packages/api/migrations/meta/_journal.json`
- Modify: `packages/api/src/db/schema/groups.ts`

- [ ] **Step 1: Hand-write the migration SQL.**

`packages/api/migrations/0019_groups_publishable.sql`:

```sql
-- Adds the four columns the admin/groups subsystem reads + writes:
-- slack_channel (chip on the public group page), charter (long-form
-- markdown rendered on the per-group page), links (jsonb array of
-- {label, url}), and is_published (gates public visibility,
-- independent of is_active). The partial index covers the hot path
-- on the public list endpoint.

ALTER TABLE "groups" ADD COLUMN "slack_channel" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "charter" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "links" jsonb NOT NULL DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "is_published" boolean NOT NULL DEFAULT false;--> statement-breakpoint

CREATE INDEX "groups_published_idx"
  ON "groups" ("id")
  WHERE is_active = true AND is_published = true AND deleted_at IS NULL;
```

- [ ] **Step 2: Append the journal entry.**

```bash
node -e "console.log(Date.now())"
```

Edit `packages/api/migrations/meta/_journal.json`. After the `0018_organization_merges` entry, append:

```jsonc
    {
      "idx": 19,
      "version": "7",
      "when": <PASTE_TIMESTAMP_HERE>,
      "tag": "0019_groups_publishable",
      "breakpoints": true
    }
```

- [ ] **Step 3: Update the Drizzle declaration.**

Edit `packages/api/src/db/schema/groups.ts`. At the top, extend the imports from `drizzle-orm/pg-core` to include `jsonb` and `sql` from `drizzle-orm`:

```ts
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
```

(Verify `sql` is needed and only add if not already imported. Same for `jsonb`.)

Update the `groups` pgTable to include the four new columns. Replace the existing column block with:

```ts
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: groupType("type").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    // New as of migration 0019:
    slackChannel: text("slack_channel"),
    charter: text("charter"),
    links: jsonb("links").notNull().default(sql`'[]'::jsonb`),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("groups_published_idx")
      .on(t.id)
      .where(sql`is_active = true AND is_published = true AND deleted_at IS NULL`),
  ]
);
```

- [ ] **Step 4: Apply the migration.**

```bash
cd packages/api && npm run db:apply -- migrations/0019_groups_publishable.sql
```

Expected: `Done.` Verify the new columns exist:

```bash
node -e "
import('@neondatabase/serverless').then(async ({neon}) => {
  const fs = await import('node:fs');
  const url = fs.readFileSync('.dev.vars','utf8').match(/DATABASE_URL=['\"]?([^'\"\\n]+)/)[1];
  const sql = neon(url);
  const cols = await sql\`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='groups' AND column_name IN ('slack_channel','charter','links','is_published')\`;
  console.log(cols);
});"
```

Expected: 4 rows.

- [ ] **Step 5: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/migrations/0019_groups_publishable.sql packages/api/migrations/meta/_journal.json packages/api/src/db/schema/groups.ts
git commit -m "feat(db): add slack_channel, charter, links, is_published to groups"
```

Expected typecheck: 5/5 successful.

---

## Task 2: `canCreateGroup` policy

**Files:**
- Create: `packages/api/src/lib/policies/canCreateGroup.ts`
- Modify: `packages/api/src/lib/policies/index.ts`
- Modify: `packages/api/src/lib/policies/policies.test.ts`

- [ ] **Step 1: Write the policy.**

`packages/api/src/lib/policies/canCreateGroup.ts`:

```ts
import type { ActorContext } from "./types";

/**
 * Create a brand-new group. Super_admin only — creating a new group is
 * a governance decision (it allocates admin privilege to whoever
 * eventually chairs it). Chairs use canEditGroup to manage their
 * existing groups but can't spin up new ones.
 */
export const canCreateGroup = (a: ActorContext): boolean =>
  a.systemTier >= 2;
```

- [ ] **Step 2: Re-export from the barrel.**

In `packages/api/src/lib/policies/index.ts`, add alongside the other exports:

```ts
export { canCreateGroup } from "./canCreateGroup";
```

- [ ] **Step 3: Add tests.** Extend the existing import block from `./index` to include `canCreateGroup` (don't duplicate the import statement). Then append to `packages/api/src/lib/policies/policies.test.ts`:

```ts
describe("canCreateGroup", () => {
  it("denies plain members", () => {
    expect(canCreateGroup(actor())).toBe(false);
  });
  it("denies staff", () => {
    expect(canCreateGroup(actor({ systemTier: 1 }))).toBe(false);
  });
  it("allows super_admin", () => {
    expect(canCreateGroup(actor({ systemTier: 2 }))).toBe(true);
  });
});
```

- [ ] **Step 4: Run tests + typecheck + commit.**

```bash
cd packages/api && npm test
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/policies
git commit -m "feat(api): canCreateGroup policy (super_admin only)"
```

Expected: existing tests pass plus 3 new `canCreateGroup` assertions; typecheck 5/5.

---

## Task 3: Admin API — list + create + sub-app shell

**Files:**
- Create: `packages/api/src/routes/admin/groups/index.ts`
- Modify: `packages/api/src/routes/admin/index.ts`

- [ ] **Step 1: Build the sub-app shell with `GET /` (list) + `POST /` (create).**

`packages/api/src/routes/admin/groups/index.ts`:

```ts
import { Hono } from "hono";
import { and, asc, count, eq, inArray, isNull, isNotNull, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../../../db";
import { groups, groupMemberships } from "../../../db/schema";
import { canCreateGroup, canEditGroup } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import { buildSlug } from "../../../lib/slug";
import type { AppEnv } from "../../../types";

export const adminGroupsRoute = new Hono<AppEnv>();

/**
 * GET /api/admin/groups
 *
 * Staff sees all groups (including unpublished, archived, soft-deleted).
 * Chairs see only the groups they chair — server-side scope check
 * uses actor.chairedGroupIds; chair-or-staff is the same gate that
 * canEditGroup uses elsewhere, just applied list-side.
 */
adminGroupsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const typeFilter = c.req.query("type");
  const statusFilter = c.req.query("status") ?? "active"; // "active" | "archived" | "all"
  const visibilityFilter = c.req.query("visibility") ?? "all"; // "published" | "draft" | "all"

  const conditions: SQL[] = [];
  if (statusFilter === "active") conditions.push(isNull(groups.deletedAt));
  if (statusFilter === "archived") conditions.push(isNotNull(groups.deletedAt));
  if (visibilityFilter === "published") conditions.push(eq(groups.isPublished, true));
  if (visibilityFilter === "draft") conditions.push(eq(groups.isPublished, false));
  if (typeFilter === "working_group" || typeFilter === "affinity_group" || typeFilter === "regional_group") {
    conditions.push(eq(groups.type, typeFilter));
  }

  // Chair-only scope when not staff+.
  if (actor.systemTier < 1) {
    const chairedIds = [...actor.chairedGroupIds];
    if (chairedIds.length === 0) {
      return c.json({ ok: true, rows: [], counts: emptyCounts() });
    }
    conditions.push(inArray(groups.id, chairedIds));
  }

  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      type: groups.type,
      description: groups.description,
      isActive: groups.isActive,
      isPublished: groups.isPublished,
      slackChannel: groups.slackChannel,
      createdAt: groups.createdAt,
      updatedAt: groups.updatedAt,
      deletedAt: groups.deletedAt,
    })
    .from(groups)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(groups.name));

  // Member + chair counts in two grouped queries; cheap at this scale.
  const ids = rows.map((r) => r.id);
  const memberCounts = ids.length
    ? await db
        .select({
          groupId: groupMemberships.groupId,
          n: count(groupMemberships.userId),
        })
        .from(groupMemberships)
        .where(inArray(groupMemberships.groupId, ids))
        .groupBy(groupMemberships.groupId)
    : [];
  const chairCounts = ids.length
    ? await db
        .select({
          groupId: groupMemberships.groupId,
          n: count(groupMemberships.userId),
        })
        .from(groupMemberships)
        .where(
          and(
            inArray(groupMemberships.groupId, ids),
            or(
              eq(groupMemberships.role, "chair"),
              eq(groupMemberships.role, "co_chair")
            )!
          )
        )
        .groupBy(groupMemberships.groupId)
    : [];
  const memberByGroup = new Map(memberCounts.map((r) => [r.groupId, Number(r.n)]));
  const chairByGroup = new Map(chairCounts.map((r) => [r.groupId, Number(r.n)]));

  return c.json({
    ok: true,
    rows: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      deletedAt: r.deletedAt instanceof Date ? r.deletedAt.toISOString() : r.deletedAt,
      memberCount: memberByGroup.get(r.id) ?? 0,
      chairCount: chairByGroup.get(r.id) ?? 0,
    })),
    counts: {
      total: rows.length,
      active: rows.filter((r) => !r.deletedAt && r.isActive).length,
      draft: rows.filter((r) => !r.isPublished).length,
      archived: rows.filter((r) => !!r.deletedAt || !r.isActive).length,
    },
  });
});

const createBodySchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["working_group", "affinity_group", "regional_group"]),
  description: z.string().max(500).optional(),
  slackChannel: z.string().max(80).optional(),
});

/**
 * POST /api/admin/groups
 *
 * Super_admin only. Slug auto-generated from name; collision → 409.
 * Returns the new row with is_published=false (draft state).
 */
adminGroupsRoute.post(
  "/",
  requirePolicy(canCreateGroup, () => undefined),
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
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");
    const slug = buildSlug(body.name);
    if (!slug) {
      return c.json({ ok: false, error: "invalid_input", message: "Name has no slug-safe characters." }, 400);
    }

    try {
      const inserted = await db
        .insert(groups)
        .values({
          name: body.name,
          slug,
          type: body.type,
          description: body.description ?? null,
          slackChannel: body.slackChannel ?? null,
          isActive: true,
          isPublished: false,
        })
        .returning({ id: groups.id, name: groups.name, slug: groups.slug, type: groups.type });

      const row = inserted[0];
      c.set("auditAction", "groups.create");
      c.set("auditTarget", { type: "groups", id: row.id });
      c.set("auditPayload", { name: row.name, slug: row.slug, type: row.type });
      return c.json({ ok: true, group: row });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("unique") || message.includes("duplicate")) {
        return c.json(
          { ok: false, error: "slug_conflict", message: "Another group already uses that slug." },
          409
        );
      }
      throw err;
    }
  }
);

function emptyCounts() {
  return { total: 0, active: 0, draft: 0, archived: 0 };
}
```

**Note on `buildSlug`:** the helper from the vocab work (in `byKindId.ts`) is local. If you find it useful here, extract it to a shared `packages/api/src/lib/slug.ts` first as a separate small commit, OR inline the same shape here. Pick the cheaper option at task time.

- [ ] **Step 2: Mount the sub-app.**

In `packages/api/src/routes/admin/index.ts`, add the import:

```ts
import { adminGroupsRoute } from "./groups";
```

Mount after the existing routes (e.g., after `/vocab`):

```ts
adminApi.route("/groups", adminGroupsRoute);
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin packages/api/src/lib/slug.ts 2>/dev/null
git commit -m "feat(api): /admin/groups list + create endpoints"
```

(The `2>/dev/null` swallows the error if `slug.ts` doesn't get extracted.)

Expected: 5/5 successful.

---

## Task 4: Admin API — detail endpoint

**Files:**
- Create: `packages/api/src/routes/admin/groups/byId.ts`
- Modify: `packages/api/src/routes/admin/groups/index.ts` (mount the sub-router)

- [ ] **Step 1: Build the detail handler.**

`packages/api/src/routes/admin/groups/byId.ts`:

```ts
import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { auditLog, groups, groupMemberships, profiles, users } from "../../../db/schema";
import { canEditGroup } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import type { AppEnv } from "../../../types";

export const adminGroupsByIdRoute = new Hono<AppEnv>();

// Apply canEditGroup scope-check on every nested route. The scope
// extracts groupId from the URL parameter.
adminGroupsByIdRoute.use(
  "*",
  requirePolicy(canEditGroup, (c) => ({ groupId: c.req.param("id") ?? "" }))
);

/**
 * GET /api/admin/groups/:id
 */
adminGroupsByIdRoute.get("/", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const row = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);
  if (!row) return c.json({ ok: false, error: "not_found" }, 404);

  // Members + chairs in one query with role + profile join.
  const members = await db
    .select({
      userId: groupMemberships.userId,
      role: groupMemberships.role,
      joinedAt: groupMemberships.joinedAt,
      email: users.email,
      displayName: profiles.displayName,
    })
    .from(groupMemberships)
    .innerJoin(users, eq(users.id, groupMemberships.userId))
    .leftJoin(profiles, eq(profiles.userId, groupMemberships.userId))
    .where(eq(groupMemberships.groupId, id))
    .orderBy(desc(groupMemberships.role), desc(groupMemberships.joinedAt));

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
    .where(eq(auditLog.targetId, id))
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  return c.json({
    ok: true,
    group: {
      ...row,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
      deletedAt: row.deletedAt instanceof Date ? row.deletedAt.toISOString() : row.deletedAt,
    },
    members: members.map((m) => ({
      ...m,
      joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : m.joinedAt,
    })),
    recentAudit: recentAudit.map((a) => ({
      ...a,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
  });
});
```

- [ ] **Step 2: Mount the sub-router.**

Edit `packages/api/src/routes/admin/groups/index.ts`. Add the import near the top:

```ts
import { adminGroupsByIdRoute } from "./byId";
```

At the bottom of the file, after the POST handler:

```ts
adminGroupsRoute.route("/:id", adminGroupsByIdRoute);
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin/groups
git commit -m "feat(api): /admin/groups/:id detail endpoint"
```

---

## Task 5: Admin API — PATCH + lifecycle endpoints

**Files:**
- Modify: `packages/api/src/routes/admin/groups/byId.ts`

PATCH (edit fields), POST `/publish`, POST `/unpublish`, POST `/archive`, POST `/reopen`. All share the same scope guard (`canEditGroup`) inherited from the sub-router mount.

- [ ] **Step 1: Add the necessary imports.**

Top of `byId.ts`:

```ts
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
```

- [ ] **Step 2: Add the PATCH endpoint.**

Append:

```ts
const patchBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
    charter: z.string().max(20000).nullable().optional(),
    slackChannel: z.string().max(80).nullable().optional(),
    links: z
      .array(
        z.object({
          label: z.string().min(1).max(80),
          url: z.string().url().max(500),
        })
      )
      .max(20)
      .optional(),
  })
  .strict();

/**
 * PATCH /api/admin/groups/:id
 *
 * Slug is NOT editable — permalink stability matters even though the
 * URL itself uses id, because the slug shows up in admin display,
 * page <title>, and any external link that grabbed it.
 */
adminGroupsByIdRoute.patch(
  "/",
  zValidator("json", patchBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id))
      return c.json({ ok: false, error: "invalid_input" }, 400);
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    const existing = await db
      .select()
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    c.get("auditCapture")?.({ group: existing });

    const next: Partial<typeof existing> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (body.name !== undefined && body.name !== existing.name) {
      next.name = body.name;
      before.name = existing.name;
      after.name = body.name;
    }
    if (body.description !== undefined && body.description !== existing.description) {
      next.description = body.description;
      before.description = existing.description;
      after.description = body.description;
    }
    if (body.charter !== undefined && body.charter !== existing.charter) {
      next.charter = body.charter;
      before.charter = existing.charter;
      after.charter = body.charter;
    }
    if (body.slackChannel !== undefined && body.slackChannel !== existing.slackChannel) {
      next.slackChannel = body.slackChannel;
      before.slackChannel = existing.slackChannel;
      after.slackChannel = body.slackChannel;
    }
    if (body.links !== undefined) {
      next.links = body.links;
      before.links = existing.links;
      after.links = body.links;
    }

    if (Object.keys(after).length === 0) {
      return c.json({ ok: true, noChange: true });
    }

    await db.update(groups).set(next).where(eq(groups.id, id));

    c.set("auditAction", "groups.update");
    c.set("auditTarget", { type: "groups", id });
    c.set("auditPayload", { before, after });
    return c.json({ ok: true });
  }
);
```

- [ ] **Step 3: Add publish + unpublish endpoints.**

Append:

```ts
/**
 * POST /api/admin/groups/:id/publish
 * POST /api/admin/groups/:id/unpublish
 */
for (const [path, isPublished, action] of [
  ["/publish", true, "groups.publish"],
  ["/unpublish", false, "groups.unpublish"],
] as const) {
  adminGroupsByIdRoute.post(path, async (c) => {
    const id = c.req.param("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id))
      return c.json({ ok: false, error: "invalid_input" }, 400);
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);

    const existing = await db
      .select({ id: groups.id, name: groups.name, isPublished: groups.isPublished })
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    if (existing.isPublished === isPublished) {
      return c.json({ ok: true, noChange: true });
    }
    c.get("auditCapture")?.({ group: existing });
    await db
      .update(groups)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(groups.id, id));

    c.set("auditAction", action);
    c.set("auditTarget", { type: "groups", id });
    c.set("auditPayload", { name: existing.name });
    return c.json({ ok: true });
  });
}
```

- [ ] **Step 4: Add archive + reopen endpoints.**

Append:

```ts
/**
 * POST /api/admin/groups/:id/archive
 *
 * Soft-archive — sets is_active=false. The deleted_at column is
 * reserved for hard deletes (not exposed in v1).
 */
adminGroupsByIdRoute.post("/archive", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select({ id: groups.id, name: groups.name, isActive: groups.isActive })
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);
  if (!existing.isActive) {
    return c.json(
      { ok: false, error: "already_archived", message: "Group is already archived." },
      409
    );
  }

  c.get("auditCapture")?.({ group: existing });
  await db.update(groups).set({ isActive: false, updatedAt: new Date() }).where(eq(groups.id, id));

  c.set("auditAction", "groups.archive");
  c.set("auditTarget", { type: "groups", id });
  c.set("auditPayload", { name: existing.name });
  return c.json({ ok: true });
});

/**
 * POST /api/admin/groups/:id/reopen
 */
adminGroupsByIdRoute.post("/reopen", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select({ id: groups.id, name: groups.name, isActive: groups.isActive })
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);
  if (existing.isActive) {
    return c.json(
      { ok: false, error: "already_active", message: "Group is already active." },
      409
    );
  }

  c.get("auditCapture")?.({ group: existing });
  await db.update(groups).set({ isActive: true, updatedAt: new Date() }).where(eq(groups.id, id));

  c.set("auditAction", "groups.reopen");
  c.set("auditTarget", { type: "groups", id });
  c.set("auditPayload", { name: existing.name });
  return c.json({ ok: true });
});
```

- [ ] **Step 5: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin/groups/byId.ts
git commit -m "feat(api): groups PATCH + publish/unpublish/archive/reopen"
```

---

## Task 6: Admin API — chair management

**Files:**
- Modify: `packages/api/src/routes/admin/groups/byId.ts`

- [ ] **Step 1: Add POST /chairs.**

Append to `byId.ts`:

```ts
const assignChairBodySchema = z.object({
  userId: z.uuid(),
  role: z.enum(["chair", "co_chair"]),
});

/**
 * POST /api/admin/groups/:id/chairs
 *
 * Body: { userId, role: "chair" | "co_chair" }
 *
 * If a membership row exists, upgrade its role. Otherwise insert a
 * new membership with the given role. Either way, the assigned user
 * becomes a chair (their actor-context recomputes chairedGroupIds on
 * the next request — and canEditGroup grants edit access to this
 * group from that moment on).
 */
adminGroupsByIdRoute.post(
  "/chairs",
  zValidator("json", assignChairBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id))
      return c.json({ ok: false, error: "invalid_input" }, 400);
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    // Validate user exists.
    const userRow = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1)
      .then((r) => r[0]);
    if (!userRow) return c.json({ ok: false, error: "user_not_found" }, 404);

    // Validate group exists.
    const groupRow = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!groupRow) return c.json({ ok: false, error: "not_found" }, 404);

    // Upsert via lookup-and-branch — neon-http doesn't have native
    // upsert with onConflict for non-PK conflict targets.
    const existing = await db
      .select({ id: groupMemberships.id, role: groupMemberships.role })
      .from(groupMemberships)
      .where(and(eq(groupMemberships.groupId, id), eq(groupMemberships.userId, body.userId)))
      .limit(1)
      .then((r) => r[0]);

    if (existing) {
      if (existing.role === body.role) {
        return c.json({ ok: true, noChange: true });
      }
      await db
        .update(groupMemberships)
        .set({ role: body.role })
        .where(eq(groupMemberships.id, existing.id));
    } else {
      await db.insert(groupMemberships).values({
        userId: body.userId,
        groupId: id,
        role: body.role,
      });
    }

    c.set("auditAction", "groups.chair_assign");
    c.set("auditTarget", { type: "groups", id });
    c.set("auditPayload", { userId: body.userId, role: body.role });
    return c.json({ ok: true });
  }
);
```

- [ ] **Step 2: Add DELETE /chairs/:userId.**

Append:

```ts
/**
 * DELETE /api/admin/groups/:id/chairs/:userId
 *
 * Demotes a chair to a regular member. Does NOT remove the membership
 * entirely. Returns 404 not_chair if the user isn't currently a
 * chair / co_chair of this group.
 */
adminGroupsByIdRoute.delete("/chairs/:userId", async (c) => {
  const id = c.req.param("id");
  const userId = c.req.param("userId");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select({ id: groupMemberships.id, role: groupMemberships.role })
    .from(groupMemberships)
    .where(and(eq(groupMemberships.groupId, id), eq(groupMemberships.userId, userId)))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_chair" }, 404);
  if (existing.role !== "chair" && existing.role !== "co_chair") {
    return c.json({ ok: false, error: "not_chair" }, 404);
  }

  const previousRole = existing.role;
  await db
    .update(groupMemberships)
    .set({ role: "member" })
    .where(eq(groupMemberships.id, existing.id));

  c.set("auditAction", "groups.chair_remove");
  c.set("auditTarget", { type: "groups", id });
  c.set("auditPayload", { userId, previousRole });
  return c.json({ ok: true });
});
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin/groups/byId.ts
git commit -m "feat(api): groups chair assign + remove"
```

---

## Task 7: Public API — list + detail

**Files:**
- Create: `packages/api/src/routes/groups.ts`
- Modify: `packages/api/src/index.ts` (mount the public route)

No auth. Anyone can hit these. Returns only `is_active AND is_published AND deleted_at IS NULL` rows.

- [ ] **Step 1: Write the public routes.**

`packages/api/src/routes/groups.ts`:

```ts
import { Hono } from "hono";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createDb } from "../db";
import { groups, groupMemberships, profiles, users } from "../db/schema";
import type { AppEnv } from "../types";

export const publicGroupsRoute = new Hono<AppEnv>();

/**
 * GET /api/groups?type=<type>
 *
 * Public list of published, active, non-deleted groups. Minimal
 * card shape — no charter, no links, no member roster.
 */
publicGroupsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const typeFilter = c.req.query("type");
  const conditions: SQL[] = [
    eq(groups.isActive, true),
    eq(groups.isPublished, true),
    isNull(groups.deletedAt),
  ];
  if (typeFilter === "working_group" || typeFilter === "affinity_group" || typeFilter === "regional_group") {
    conditions.push(eq(groups.type, typeFilter));
  }

  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      type: groups.type,
      description: groups.description,
      slackChannel: groups.slackChannel,
    })
    .from(groups)
    .where(and(...conditions))
    .orderBy(asc(groups.name));

  return c.json({ ok: true, rows });
});

/**
 * GET /api/groups/:id
 *
 * Public per-group detail. Includes charter, links, and chair
 * names/photos (no emails — that's admin-only).
 */
publicGroupsRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const row = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      type: groups.type,
      description: groups.description,
      slackChannel: groups.slackChannel,
      charter: groups.charter,
      links: groups.links,
      isActive: groups.isActive,
      isPublished: groups.isPublished,
      deletedAt: groups.deletedAt,
    })
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  // Only published, active, non-deleted groups visible publicly.
  if (!row || !row.isActive || !row.isPublished || row.deletedAt) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }

  const chairs = await db
    .select({
      displayName: profiles.displayName,
      photoUrl: profiles.photoUrl,
    })
    .from(groupMemberships)
    .innerJoin(users, eq(users.id, groupMemberships.userId))
    .leftJoin(profiles, eq(profiles.userId, groupMemberships.userId))
    .where(
      and(
        eq(groupMemberships.groupId, id),
        or(
          eq(groupMemberships.role, "chair"),
          eq(groupMemberships.role, "co_chair")
        )!
      )
    );

  return c.json({
    ok: true,
    group: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      description: row.description,
      slackChannel: row.slackChannel,
      charter: row.charter,
      links: row.links,
      chairs,
    },
  });
});
```

- [ ] **Step 2: Mount the public route.**

In `packages/api/src/index.ts`, add the import:

```ts
import { publicGroupsRoute } from "./routes/groups";
```

Mount at `/api/groups` — pick a slot before the auth middleware applies (or alongside other public routes like `/health`).

Look at how `/health` is mounted for the pattern; the public groups route follows the same shape (no `requireAuth` in front).

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/groups.ts packages/api/src/index.ts
git commit -m "feat(api): public /api/groups list + detail endpoints"
```

---

## Task 8: Admin frontend — groups list page

**Files:**
- Create: `apps/admin/src/pages/groups/GroupsListPage.tsx`
- Create: `apps/admin/src/pages/groups/NewGroupModal.tsx`

- [ ] **Step 1: Build the list page.**

`apps/admin/src/pages/groups/GroupsListPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { NewGroupModal } from "./NewGroupModal";

type GroupType = "working_group" | "affinity_group" | "regional_group";
type StatusFilter = "active" | "archived" | "all";
type VisibilityFilter = "all" | "published" | "draft";

interface GroupRow {
  id: string;
  name: string;
  slug: string;
  type: GroupType;
  description: string | null;
  isActive: boolean;
  isPublished: boolean;
  slackChannel: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  memberCount: number;
  chairCount: number;
}

interface ListResponse {
  ok: true;
  rows: GroupRow[];
  counts: { total: number; active: number; draft: number; archived: number };
}

const TYPE_LABELS: Record<GroupType | "all", string> = {
  all: "All kinds",
  working_group: "Working",
  affinity_group: "Affinity",
  regional_group: "Regional",
};

export function GroupsListPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const typeFilter = (params.get("type") ?? "all") as GroupType | "all";
  const status = (params.get("status") ?? "active") as StatusFilter;
  const visibility = (params.get("visibility") ?? "all") as VisibilityFilter;

  const load = useCallback(async () => {
    setError(null);
    const sp = new URLSearchParams({ status, visibility });
    if (typeFilter !== "all") sp.set("type", typeFilter);
    try {
      const res = await apiFetch(`/admin/groups?${sp}`);
      if (!res.ok) {
        setError(`/admin/groups responded ${res.status}`);
        return;
      }
      setData((await res.json()) as ListResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, typeFilter, status, visibility]);

  useEffect(() => { void load(); }, [load]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    const isDefault =
      (name === "type" && value === "all") ||
      (name === "status" && value === "active") ||
      (name === "visibility" && value === "all");
    if (value && !isDefault) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Groups</p>
      <div className="flex items-baseline justify-between gap-6 mb-2">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          Groups.
        </h2>
        {actor.systemTier >= 2 && (
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600"
          >
            + New group
          </button>
        )}
      </div>
      {data && (
        <p className="admin-classification mb-8">
          {data.counts.active} active · {data.counts.draft} draft ·{" "}
          {data.counts.archived} archived
        </p>
      )}

      <div className="flex items-baseline gap-6 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setParam("type", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="all">All kinds</option>
          <option value="working_group">Working</option>
          <option value="affinity_group">Affinity</option>
          <option value="regional_group">Regional</option>
        </select>
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <select
          value={visibility}
          onChange={(e) => setParam("visibility", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none ml-auto"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="all">Any visibility</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div>
        <div
          className="grid grid-cols-[3rem_minmax(0,1fr)_6rem_minmax(0,1fr)_5rem_5rem_6rem_auto] gap-6 items-baseline py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--admin-ink)", borderBottom: "1px solid var(--admin-rule)" }}
        >
          <span className="admin-classification">#</span>
          <span className="admin-classification">Name</span>
          <span className="admin-classification">Type</span>
          <span className="admin-classification">Slack</span>
          <span className="admin-classification text-right">Chairs</span>
          <span className="admin-classification text-right">Members</span>
          <span className="admin-classification">Visibility</span>
          <span className="admin-classification text-right">Open →</span>
        </div>
        {data?.rows.map((r, i) => (
          <Link
            key={r.id}
            to={`/groups/${r.id}`}
            className="grid grid-cols-[3rem_minmax(0,1fr)_6rem_minmax(0,1fr)_5rem_5rem_6rem_auto] gap-6 items-baseline py-3 text-[14px] transition-colors hover:bg-[var(--admin-paper-edge)]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            <span className="truncate" style={{ color: "var(--admin-ink)" }}>
              {r.name}
              {!r.isActive && (
                <span className="admin-marginalia ml-2" style={{ color: "var(--color-danger-700)" }}>
                  · archived
                </span>
              )}
            </span>
            <span className="admin-marginalia">{TYPE_LABELS[r.type]}</span>
            <span className="truncate font-mono text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
              {r.slackChannel ? `#${r.slackChannel}` : "—"}
            </span>
            <span className="text-right tabular-nums" style={{ color: "var(--admin-ink)" }}>{r.chairCount}</span>
            <span className="text-right tabular-nums" style={{ color: "var(--admin-ink-medium)" }}>{r.memberCount}</span>
            <span
              className="admin-classification"
              style={{
                color: r.isPublished ? "var(--color-success-700)" : "var(--admin-marginalia)",
              }}
            >
              {r.isPublished ? "Published" : "Draft"}
            </span>
            <span className="admin-classification text-right" style={{ color: "var(--admin-ribbon)" }}>
              Open →
            </span>
          </Link>
        ))}
        {data && data.rows.length === 0 && (
          <p className="py-6 text-center italic" style={{ color: "var(--admin-marginalia)" }}>
            No groups match.
          </p>
        )}
      </div>

      {showNewModal && (
        <NewGroupModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false);
            void load();
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build the new-group modal.**

`apps/admin/src/pages/groups/NewGroupModal.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NewGroupModal({ onClose, onCreated }: Props) {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<"working_group" | "affinity_group" | "regional_group">("working_group");
  const [description, setDescription] = useState("");
  const [slackChannel, setSlackChannel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          slackChannel: slackChannel.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as { ok: true; group: { id: string } };
      onCreated();
      navigate(`/groups/${body.group.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-white p-8 max-w-lg w-full rounded-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="admin-classification mb-4">New group</p>
        <h3 className="admin-display mb-6" style={{ fontSize: "1.5rem" }}>
          Create a group.
        </h3>

        {error && (
          <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>
            {error}
          </p>
        )}

        <div className="space-y-6">
          <EditorialInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div>
            <p className="admin-classification mb-2">Type</p>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="bg-transparent border-0 outline-none py-1.5 w-full"
              style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)", fontSize: "15px" }}
            >
              <option value="working_group">Working group</option>
              <option value="affinity_group">Affinity group</option>
              <option value="regional_group">Regional group</option>
            </select>
          </div>
          <EditorialTextarea
            label="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            hint="One sentence shown on the public group list card."
          />
          <EditorialInput
            label="Slack channel (optional)"
            value={slackChannel}
            onChange={(e) => setSlackChannel(e.target.value)}
            hint="e.g., wg-outreach — no leading #."
          />
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--admin-ink-medium)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create draft →"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add apps/admin/src/pages/groups
git commit -m "feat(admin): groups list page + new-group modal"
```

---

## Task 9: Admin frontend — group detail page

**Files:**
- Create: `apps/admin/src/pages/groups/GroupDetailPage.tsx`

Four-tab layout (Identity / Content / Roster + chairs / Lifecycle + audit). Large file (~600 LOC). Implement in the listed order so each section can typecheck-pass independently before adding the next.

- [ ] **Step 1: Write the page skeleton with state + load.**

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

type GroupType = "working_group" | "affinity_group" | "regional_group";
type Tab = "identity" | "content" | "roster" | "lifecycle";

interface GroupDetail {
  ok: true;
  group: {
    id: string;
    name: string;
    slug: string;
    type: GroupType;
    description: string | null;
    charter: string | null;
    slackChannel: string | null;
    links: Array<{ label: string; url: string }>;
    isActive: boolean;
    isPublished: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  members: Array<{
    userId: string;
    email: string;
    displayName: string | null;
    role: "member" | "chair" | "co_chair";
    joinedAt: string;
  }>;
  recentAudit: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }>;
}

const TYPE_LABELS: Record<GroupType, string> = {
  working_group: "Working group",
  affinity_group: "Affinity group",
  regional_group: "Regional group",
};

export function GroupDetailPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<GroupDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Identity draft state
  const [draftDescription, setDraftDescription] = useState("");
  const [draftSlackChannel, setDraftSlackChannel] = useState("");
  // Content draft state
  const [draftCharter, setDraftCharter] = useState("");
  const [draftLinks, setDraftLinks] = useState<Array<{ label: string; url: string }>>([]);
  // Roster picker state
  const [chairSearch, setChairSearch] = useState("");
  const [chairResults, setChairResults] = useState<Array<{ id: string; displayName: string | null; email: string }>>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/groups/${id}`);
      if (!res.ok) {
        setError(`/admin/groups/${id} responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as GroupDetail;
      setData(body);
      setDraftDescription(body.group.description ?? "");
      setDraftSlackChannel(body.group.slackChannel ?? "");
      setDraftCharter(body.group.charter ?? "");
      setDraftLinks(body.group.links ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => { void load(); }, [load]);

  // Debounced member search for the chair picker.
  useEffect(() => {
    const term = chairSearch.trim();
    if (term.length < 2) {
      setChairResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({ q: term, limit: "10", status: "active" });
        const res = await apiFetch(`/admin/users?${sp}`);
        if (!res.ok) return;
        const body = (await res.json()) as {
          rows: Array<{ id: string; displayName: string | null; email: string }>;
        };
        setChairResults(body.rows);
      } catch {
        /* silent — picker is a convenience */
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [apiFetch, chairSearch]);

  // Render fallthrough until data loads
  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );
  if (!data) return <p className="admin-marginalia">Loading…</p>;

  const g = data.group;
  const isStaff = actor.systemTier >= 1;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">
        US-RSE · Admin · Groups · {TYPE_LABELS[g.type]}
      </p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {g.name}
      </h2>
      <div className="flex items-center gap-4 mb-10">
        <span className="admin-classification">{TYPE_LABELS[g.type]}</span>
        <span
          className="admin-classification"
          style={{ color: g.isPublished ? "var(--color-success-700)" : "var(--admin-marginalia)" }}
        >
          {g.isPublished ? "Published" : "Draft"}
        </span>
        {!g.isActive && (
          <span className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
            Archived
          </span>
        )}
      </div>

      <nav className="flex items-baseline gap-8 mb-8" style={{ borderBottom: "1px solid var(--admin-rule)" }}>
        {(["identity", "content", "roster", "lifecycle"] as Tab[]).map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="pb-3 admin-classification transition-colors"
            style={{
              color: tab === t ? "var(--admin-ribbon)" : "var(--admin-ink-medium)",
              borderBottom: tab === t ? "2px solid var(--admin-ribbon)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            <span className="tabular-nums mr-2">{String(i + 1).padStart(2, "0")}</span>
            <span>
              {t === "identity" ? "Identity" : t === "content" ? "Content" : t === "roster" ? "Roster + chairs" : "Lifecycle + audit"}
            </span>
          </button>
        ))}
      </nav>

      {actionError && (
        <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {actionError}
        </p>
      )}

      {/* TODO: Identity tab in step 2, Content in step 3, etc. */}
    </div>
  );
}
```

- [ ] **Step 2: Add the Identity tab.**

Inside the component (replace the `{/* TODO */}` placeholder), append the Identity tab block:

```tsx
      {tab === "identity" && (
        <section className="max-w-2xl space-y-6">
          <EditorialInput label="Name" value={g.name} readOnly hint="Name is locked after create. Contact a super_admin to rename." />
          <EditorialInput label="Slug" value={g.slug} readOnly hint="Slug is locked. The permalink uses the group ID, not the slug." />
          <EditorialTextarea
            label="Short description"
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            rows={2}
            hint="One sentence shown on the public list card."
          />
          <EditorialInput
            label="Slack channel"
            value={draftSlackChannel}
            onChange={(e) => setDraftSlackChannel(e.target.value)}
            hint="Bare channel name, no leading #."
          />
          <button
            type="button"
            onClick={() => void saveIdentity()}
            disabled={acting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            {acting ? "Saving…" : "Save changes"}
          </button>
        </section>
      )}
```

And add the `saveIdentity` helper inside the component, alongside the other functions:

```tsx
  async function saveIdentity() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const body: Record<string, unknown> = {};
      if (draftDescription !== (data.group.description ?? "")) {
        body.description = draftDescription.trim() || null;
      }
      if (draftSlackChannel !== (data.group.slackChannel ?? "")) {
        body.slackChannel = draftSlackChannel.trim() || null;
      }
      if (Object.keys(body).length === 0) { setActing(false); return; }
      const res = await apiFetch(`/admin/groups/${data.group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await load();
    } finally { setActing(false); }
  }
```

- [ ] **Step 3: Add the Content tab.**

```tsx
      {tab === "content" && (
        <section className="max-w-3xl space-y-8">
          <EditorialTextarea
            label="Charter (markdown)"
            value={draftCharter}
            onChange={(e) => setDraftCharter(e.target.value)}
            rows={16}
            hint="Long-form purpose / governance text rendered on the public per-group page."
          />
          <div>
            <p className="admin-classification mb-3">Links</p>
            <div className="space-y-3">
              {draftLinks.map((l, i) => (
                <div key={i} className="flex items-baseline gap-3">
                  <input
                    type="text"
                    placeholder="Label"
                    value={l.label}
                    onChange={(e) => {
                      const next = [...draftLinks];
                      next[i] = { ...next[i], label: e.target.value };
                      setDraftLinks(next);
                    }}
                    className="font-mono text-[13px] py-1.5 outline-none bg-transparent flex-1 max-w-[12rem]"
                    style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)" }}
                  />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={l.url}
                    onChange={(e) => {
                      const next = [...draftLinks];
                      next[i] = { ...next[i], url: e.target.value };
                      setDraftLinks(next);
                    }}
                    className="font-mono text-[13px] py-1.5 outline-none bg-transparent flex-1"
                    style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setDraftLinks(draftLinks.filter((_, j) => j !== i))}
                    className="admin-classification"
                    style={{ color: "var(--color-danger-700)" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDraftLinks([...draftLinks, { label: "", url: "" }])}
                className="admin-classification"
                style={{ color: "var(--admin-ribbon)" }}
              >
                + Add link
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void saveContent()}
            disabled={acting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            {acting ? "Saving…" : "Save content"}
          </button>
        </section>
      )}
```

Plus the `saveContent` helper:

```tsx
  async function saveContent() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const cleanLinks = draftLinks.filter((l) => l.label.trim() && l.url.trim());
      const body: Record<string, unknown> = {};
      if (draftCharter !== (data.group.charter ?? "")) {
        body.charter = draftCharter.trim() || null;
      }
      if (JSON.stringify(cleanLinks) !== JSON.stringify(data.group.links)) {
        body.links = cleanLinks;
      }
      if (Object.keys(body).length === 0) { setActing(false); return; }
      const res = await apiFetch(`/admin/groups/${data.group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await load();
    } finally { setActing(false); }
  }
```

- [ ] **Step 4: Add the Roster + chairs tab.**

```tsx
      {tab === "roster" && (
        <section className="max-w-3xl space-y-8">
          {isStaff && (
            <div>
              <p className="admin-classification mb-3">Assign chair / co-chair</p>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={chairSearch}
                onChange={(e) => setChairSearch(e.target.value)}
                className="w-full max-w-lg font-mono text-[13px] py-1.5 outline-none bg-transparent"
                style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)" }}
              />
              {chairResults.length > 0 && (
                <ul className="mt-4 max-w-2xl" style={{ borderTop: "1px solid var(--admin-rule-subtle)" }}>
                  {chairResults.map((r) => (
                    <li key={r.id} className="py-3 flex items-baseline justify-between gap-6" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                      <span className="flex-1">
                        <span style={{ color: "var(--admin-ink)" }}>{r.displayName ?? <em>no name</em>}</span>
                        <span className="font-mono text-[12px] ml-3" style={{ color: "var(--admin-ink-medium)" }}>{r.email}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void assignChair(r.id, "chair")}
                        disabled={acting}
                        className="admin-classification disabled:opacity-50"
                        style={{ color: "var(--admin-ribbon)" }}
                      >
                        Add as chair
                      </button>
                      <button
                        type="button"
                        onClick={() => void assignChair(r.id, "co_chair")}
                        disabled={acting}
                        className="admin-classification disabled:opacity-50"
                        style={{ color: "var(--admin-ribbon)" }}
                      >
                        Add as co-chair
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <p className="admin-classification mb-3">Members ({data.members.length})</p>
            {data.members.length === 0 ? (
              <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No members yet.</p>
            ) : (
              <ul style={{ borderTop: "1px solid var(--admin-rule)" }}>
                {data.members.map((m) => (
                  <li
                    key={m.userId}
                    className="py-3 flex items-baseline justify-between gap-6"
                    style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
                  >
                    <span className="flex-1">
                      <span style={{ color: "var(--admin-ink)" }}>{m.displayName ?? <em>no name</em>}</span>
                      <span className="font-mono text-[12px] ml-3" style={{ color: "var(--admin-ink-medium)" }}>{m.email}</span>
                      <span
                        className="admin-marginalia ml-3"
                        style={{
                          color:
                            m.role === "chair"
                              ? "var(--admin-ribbon)"
                              : m.role === "co_chair"
                                ? "var(--admin-mark)"
                                : "var(--admin-marginalia)",
                        }}
                      >
                        {m.role.replace("_", "-")}
                      </span>
                    </span>
                    {(m.role === "chair" || m.role === "co_chair") && isStaff && (
                      <button
                        type="button"
                        onClick={() => void removeChair(m.userId)}
                        disabled={acting}
                        className="admin-classification disabled:opacity-50"
                        style={{ color: "var(--color-danger-700)" }}
                      >
                        Demote to member ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
```

Plus the helpers:

```tsx
  async function assignChair(userId: string, role: "chair" | "co_chair") {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/groups/${data.group.id}/chairs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      setChairSearch("");
      setChairResults([]);
      await load();
    } finally { setActing(false); }
  }

  async function removeChair(userId: string) {
    if (!data) return;
    if (!window.confirm("Demote this chair to a regular member?")) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/groups/${data.group.id}/chairs/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `DELETE responded ${res.status}`);
        return;
      }
      await load();
    } finally { setActing(false); }
  }
```

- [ ] **Step 5: Add the Lifecycle + audit tab.**

```tsx
      {tab === "lifecycle" && (
        <section className="max-w-3xl space-y-10">
          <div>
            <p className="admin-classification mb-3">Visibility</p>
            <div className="flex items-baseline gap-4">
              <p className="text-[14px]" style={{ color: "var(--admin-ink-medium)" }}>
                Currently:{" "}
                <span style={{ color: g.isPublished ? "var(--color-success-700)" : "var(--admin-marginalia)" }}>
                  {g.isPublished ? "Published" : "Draft"}
                </span>
              </p>
              <button
                type="button"
                onClick={() => void togglePublish(!g.isPublished)}
                disabled={acting}
                className="admin-classification disabled:opacity-50"
                style={{ color: "var(--admin-ribbon)" }}
              >
                {g.isPublished ? "Unpublish →" : "Publish →"}
              </button>
              {g.isPublished && (
                <a
                  href={`/community/groups/${g.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-classification ml-auto"
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  View public page →
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="admin-classification mb-3">Lifecycle</p>
            <div className="flex items-baseline gap-4">
              <p className="text-[14px]" style={{ color: "var(--admin-ink-medium)" }}>
                Currently:{" "}
                <span style={{ color: g.isActive ? "var(--admin-ink)" : "var(--color-danger-700)" }}>
                  {g.isActive ? "Active" : "Archived"}
                </span>
              </p>
              {g.isActive ? (
                <button
                  type="button"
                  onClick={() => void toggleArchive(true)}
                  disabled={acting}
                  className="admin-classification disabled:opacity-50"
                  style={{ color: "var(--color-danger-700)" }}
                >
                  Archive this group
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void toggleArchive(false)}
                  disabled={acting}
                  className="admin-classification disabled:opacity-50"
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  Reopen
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="admin-classification mb-3">Recent audit ({data.recentAudit.length})</p>
            {data.recentAudit.length === 0 ? (
              <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No audit entries.</p>
            ) : (
              <ol style={{ borderTop: "1px solid var(--admin-ink)" }}>
                {data.recentAudit.map((a, i) => (
                  <li
                    key={a.id}
                    className="py-3 grid grid-cols-[3rem_minmax(8rem,auto)_minmax(0,1fr)] gap-6 items-baseline text-[13px]"
                    style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
                  >
                    <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
                    <span className="font-mono whitespace-nowrap" style={{ color: "var(--admin-ink-medium)" }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                    <span className="font-mono" style={{ color: "var(--admin-ink)" }}>{a.action}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      )}
```

Plus the lifecycle helpers:

```tsx
  async function togglePublish(makePublished: boolean) {
    if (!data) return;
    if (!makePublished && !window.confirm("Unpublish this group? It will disappear from the public site immediately.")) return;
    setActing(true);
    setActionError(null);
    try {
      const path = makePublished ? "publish" : "unpublish";
      const res = await apiFetch(`/admin/groups/${data.group.id}/${path}`, { method: "POST" });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      await load();
    } finally { setActing(false); }
  }

  async function toggleArchive(archive: boolean) {
    if (!data) return;
    if (archive && !window.confirm("Archive this group? It will be hidden from the public site and the default admin list.")) return;
    setActing(true);
    setActionError(null);
    try {
      const path = archive ? "archive" : "reopen";
      const res = await apiFetch(`/admin/groups/${data.group.id}/${path}`, { method: "POST" });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      await load();
    } finally { setActing(false); }
  }
```

- [ ] **Step 6: Add the back-link.**

At the bottom of the component, before the closing `</div>`:

```tsx
      <p className="mt-12">
        <Link to="/groups" className="admin-classification" style={{ color: "var(--admin-ribbon)" }}>
          ← Back to all groups
        </Link>
      </p>
```

- [ ] **Step 7: Typecheck + build smoke + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
npm run build --workspace=@us-rse/admin
git add apps/admin/src/pages/groups/GroupDetailPage.tsx
git commit -m "feat(admin): group detail page with 4-tab editor"
```

---

## Task 10: Public frontend — refactor list pages

**Files:**
- Create: `apps/web/src/hooks/useGroups.ts`
- Modify: `apps/web/src/pages/community/WorkingGroupsPage.tsx`
- Modify: `apps/web/src/pages/community/AffinityGroupsPage.tsx`

- [ ] **Step 1: Write the `useGroups` hook.**

`apps/web/src/hooks/useGroups.ts`:

```ts
import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://us-rse-api.leadership-28b.workers.dev";

export type GroupType = "working_group" | "affinity_group" | "regional_group";

export interface PublicGroupCard {
  id: string;
  name: string;
  slug: string;
  type: GroupType;
  description: string | null;
  slackChannel: string | null;
}

interface UseGroupsState {
  rows: PublicGroupCard[] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Public hook for the /community/working-groups, affinity-groups,
 * regional-groups list pages. Fetches once per type.
 */
export function useGroups(type: GroupType): UseGroupsState {
  const [state, setState] = useState<UseGroupsState>({
    rows: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ rows: null, loading: true, error: null });
    void (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/groups?type=${type}`);
        if (cancelled) return;
        if (!res.ok) {
          setState({ rows: null, loading: false, error: `/api/groups responded ${res.status}` });
          return;
        }
        const body = (await res.json()) as { ok: true; rows: PublicGroupCard[] };
        setState({ rows: body.rows, loading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        setState({
          rows: null,
          loading: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    })();
    return () => { cancelled = true; };
  }, [type]);

  return state;
}
```

- [ ] **Step 2: Refactor `WorkingGroupsPage.tsx`.**

Read the file first (need to preserve the existing layout structure). Delete the hardcoded `workingGroups` const array. Replace any iteration over the const with iteration over the hook's `rows`. The card content (name + description) should match the current shape. The card's previously-optional `route?: string` link is replaced unconditionally with `/community/groups/${row.id}`.

If the existing file has loading/error skeleton patterns, reuse them; otherwise add minimal handling:

```tsx
const { rows, loading, error } = useGroups("working_group");

if (loading) return <p className="text-gray-500">Loading…</p>;
if (error) return <p className="text-red-700">Group list temporarily unavailable. <button onClick={() => window.location.reload()}>Retry</button></p>;
if (!rows) return null;
```

Inside the existing card layout, iterate `rows.map((g) => ...)` instead of `workingGroups.map(...)`. The card link href becomes `/community/groups/${g.id}`.

Do the same refactor to `AffinityGroupsPage.tsx`, passing `"affinity_group"` to `useGroups`.

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add apps/web/src/hooks/useGroups.ts apps/web/src/pages/community/WorkingGroupsPage.tsx apps/web/src/pages/community/AffinityGroupsPage.tsx
git commit -m "feat(web): make group list pages DB-driven"
```

---

## Task 11: Public frontend — per-group page + regional page + /community/calls redirect

**Files:**
- Create: `apps/web/src/pages/community/GroupPage.tsx`
- Create: `apps/web/src/pages/community/RegionalGroupsPage.tsx`
- Modify: `apps/web/src/hooks/useGroups.ts` (add `useGroup(id)`)
- Modify: `apps/web/src/App.tsx` (or wherever the route tree lives) — add new routes + redirect

- [ ] **Step 1: Add `useGroup(id)` to the hook file.**

Append to `apps/web/src/hooks/useGroups.ts`:

```ts
export interface PublicGroupDetail extends PublicGroupCard {
  charter: string | null;
  links: Array<{ label: string; url: string }>;
  chairs: Array<{ displayName: string | null; photoUrl: string | null }>;
}

interface UseGroupState {
  group: PublicGroupDetail | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useGroup(id: string | undefined): UseGroupState {
  const [state, setState] = useState<UseGroupState>({
    group: null,
    loading: true,
    error: null,
    notFound: false,
  });

  useEffect(() => {
    if (!id) {
      setState({ group: null, loading: false, error: null, notFound: true });
      return;
    }
    let cancelled = false;
    setState({ group: null, loading: true, error: null, notFound: false });
    void (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/groups/${id}`);
        if (cancelled) return;
        if (res.status === 404) {
          setState({ group: null, loading: false, error: null, notFound: true });
          return;
        }
        if (!res.ok) {
          setState({ group: null, loading: false, error: `/api/groups/${id} responded ${res.status}`, notFound: false });
          return;
        }
        const body = (await res.json()) as { ok: true; group: PublicGroupDetail };
        setState({ group: body.group, loading: false, error: null, notFound: false });
      } catch (e) {
        if (cancelled) return;
        setState({
          group: null,
          loading: false,
          error: e instanceof Error ? e.message : String(e),
          notFound: false,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return state;
}
```

- [ ] **Step 2: Write the per-group page.**

`apps/web/src/pages/community/GroupPage.tsx`:

```tsx
import { useParams } from "react-router-dom";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useGroup } from "@/hooks/useGroups";

const TYPE_LABELS: Record<string, string> = {
  working_group: "Working group",
  affinity_group: "Affinity group",
  regional_group: "Regional group",
};

export function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const { group, loading, error, notFound } = useGroup(id);

  if (loading) {
    return (
      <CommunityLayout>
        <p className="text-gray-500">Loading…</p>
      </CommunityLayout>
    );
  }
  if (notFound) {
    return (
      <CommunityLayout>
        <h1 className="text-3xl font-bold mb-4">Group not found</h1>
        <p className="text-gray-600">This group may have been archived or unpublished. <a href="/community/working-groups" className="text-purple-700 underline">Browse working groups →</a></p>
      </CommunityLayout>
    );
  }
  if (error || !group) {
    return (
      <CommunityLayout>
        <p className="text-red-700">{error ?? "Group temporarily unavailable."}</p>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">{TYPE_LABELS[group.type] ?? group.type}</p>
      <h1 className="text-4xl font-bold mb-4">{group.name}</h1>
      {group.description && <p className="text-lg text-gray-700 mb-8">{group.description}</p>}

      {group.charter && (
        <div className="prose max-w-2xl mb-12 whitespace-pre-wrap">{group.charter}</div>
      )}

      {group.slackChannel && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Slack</p>
          <p className="font-mono text-sm">#{group.slackChannel}</p>
        </div>
      )}

      {group.chairs.length > 0 && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Chairs</p>
          <div className="flex flex-wrap items-center gap-4">
            {group.chairs.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                {c.photoUrl ? (
                  <img src={c.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-gray-200 inline-block" />
                )}
                <span className="text-sm">{c.displayName ?? "Chair"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {group.links.length > 0 && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Links</p>
          <ul className="space-y-1">
            {group.links.map((l, i) => (
              <li key={i}>
                <a href={l.url} target="_blank" rel="noreferrer" className="text-purple-700 underline">
                  {l.label} →
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CommunityLayout>
  );
}
```

Note: the markdown renderer is intentionally minimal (`whitespace-pre-wrap`). If the web app already has a markdown renderer (e.g., used by the dossier bio), use that instead — search the codebase for `marked` or `react-markdown` and use whatever the dossier uses. Otherwise the pre-wrap fallback is acceptable for v1.

- [ ] **Step 3: Write `RegionalGroupsPage.tsx`.**

`apps/web/src/pages/community/RegionalGroupsPage.tsx`:

```tsx
import { Link } from "react-router-dom";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useGroups } from "@/hooks/useGroups";

export function RegionalGroupsPage() {
  const { rows, loading, error } = useGroups("regional_group");

  return (
    <CommunityLayout>
      <h1 className="text-4xl font-bold mb-4">Regional groups</h1>
      <p className="text-lg text-gray-700 mb-8">
        Local US-RSE communities organized by geography.
      </p>

      {loading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-700">{error}</p>}

      {rows && rows.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-md">
          <p className="text-gray-700 mb-3">
            Regional groups are coming soon. Interested in starting one in your area?
          </p>
          <p className="text-sm text-gray-500">
            <a href="mailto:info@us-rse.org" className="text-purple-700 underline">Get in touch →</a>
          </p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-6">
          {rows.map((g) => (
            <li key={g.id} className="border border-gray-200 rounded-md p-6">
              <h2 className="text-xl font-semibold mb-2">{g.name}</h2>
              {g.description && <p className="text-sm text-gray-700 mb-4">{g.description}</p>}
              <Link to={`/community/groups/${g.id}`} className="text-purple-700 text-sm underline">
                View →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CommunityLayout>
  );
}
```

- [ ] **Step 4: Wire the new routes + the /community/calls redirect.**

In `apps/web/src/App.tsx` (or wherever the route tree is — search for `WorkingGroupsPage` to find it), add the imports:

```tsx
import { GroupPage } from "./pages/community/GroupPage";
import { RegionalGroupsPage } from "./pages/community/RegionalGroupsPage";
```

Add the new routes inside the existing community route block:

```tsx
<Route path="/community/groups/:id" element={<GroupPage />} />
<Route path="/community/regional-groups" element={<RegionalGroupsPage />} />
```

Update the `/community/calls` route. If currently:
```tsx
<Route path="/community/calls" element={<CommunityCallsPage />} />
```
Change to a `<Navigate>` to the Community Calls group's permalink. Since the ID won't be known until after ingest, leave a TODO comment AND a fallback:

```tsx
{/* TODO: replace with hard-coded community-calls group id after ingest */}
<Route path="/community/calls" element={<Navigate to="/community/working-groups" replace />} />
```

The fallback redirects to the working-groups list rather than to a specific group. Once the import runs and the Community Calls group's ID is known, an admin updates the redirect target. Add a comment explaining the TODO.

- [ ] **Step 5: Typecheck + build + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
npm run build --workspace=@us-rse/web
git add apps/web/src/hooks/useGroups.ts apps/web/src/pages/community/GroupPage.tsx apps/web/src/pages/community/RegionalGroupsPage.tsx apps/web/src/App.tsx
git commit -m "feat(web): per-group page + regional list + /community/calls redirect"
```

---

## Task 12: Seed-data import script

**Files:**
- Create: `packages/api/scripts/import-groups.ts`

Standalone TypeScript. Invoked via `node` (or `tsx` if the script uses TS-only features). Default mode is dry-run; `--commit` writes.

- [ ] **Step 1: Write the script skeleton + CSV parser.**

`packages/api/scripts/import-groups.ts`:

```ts
#!/usr/bin/env node --experimental-strip-types
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";

// ─── Inputs ─────────────────────────────────────────────────────────
const REPO_ROOT = path.resolve(__dirname, "../../..");
const WORKING_CSV = path.join(REPO_ROOT, ".data/US-RSE Working Group Creation Form (Responses) - Form Responses 1.csv");
const AFFINITY_CSV = path.join(REPO_ROOT, ".data/US-RSE Affinity Group Creation Form (Responses) - Form Responses 1.csv");

// ─── CLI args ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");

// ─── Tiny CSV parser (handles quoted fields with embedded commas + newlines) ─
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(cell); cell = ""; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (ch === '\r') { /* skip */ }
      else cell += ch;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// ─── Helpers ────────────────────────────────────────────────────────
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeDisplayName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

function firstSentence(s: string, maxLen = 200): string {
  const trimmed = s.trim();
  const period = trimmed.indexOf(". ");
  if (period > 0 && period < maxLen) return trimmed.slice(0, period + 1);
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen - 1) + "…";
}

function cleanSlack(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#+/, "").toLowerCase();
  return trimmed || null;
}

function isPlaceholderEmail(email: string): boolean {
  return /tbd@/i.test(email);
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  const dotEnv = fs.readFileSync(path.join(REPO_ROOT, "packages/api/.dev.vars"), "utf8");
  const dbUrl = dotEnv.match(/DATABASE_URL=['"]?([^'"\n]+)/)?.[1];
  if (!dbUrl) throw new Error("DATABASE_URL not found in .dev.vars");
  const sql = neon(dbUrl);

  console.log(COMMIT ? "=== COMMIT mode — writes will land ===\n" : "=== DRY-RUN mode (default) — no writes ===\n");

  await importGroups(sql, "working_group", WORKING_CSV);
  await importGroups(sql, "affinity_group", AFFINITY_CSV);

  console.log(COMMIT ? "\n=== COMMITTED ===" : "\n=== DRY-RUN — re-run with --commit to apply ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the per-CSV import function.**

Append to the script (above `main()`):

```ts
async function importGroups(
  sql: NeonQueryFunction<false, false>,
  type: "working_group" | "affinity_group",
  csvPath: string
) {
  const text = fs.readFileSync(csvPath, "utf8");
  const [header, ...rows] = parseCsv(text);
  console.log(`─── ${type} ──── ${rows.length} CSV rows from ${path.basename(csvPath)} ───`);

  const col = (name: string) => header.indexOf(name);
  const NAME = col(type === "working_group" ? "Working Group Name" : "Affinity Group Name");
  const PURPOSE = col(type === "working_group" ? "Working Group Purpose" : "One-sentence Description");
  const SLACK = col("Slack channel name");
  const CHAIR_NAME_1 = col(type === "working_group" ? "Chair name" : "Coordinator 1 Name");
  const CHAIR_EMAIL_1 = col(type === "working_group" ? "Chair email" : "Coordinate 1 Email");
  const CHAIR_NAME_2 = col(type === "working_group" ? "Co-chair name" : "Coordinator 2 Name");
  const CHAIR_EMAIL_2 = col(type === "working_group" ? "Co-chair email" : "Coordinator 2 Email");
  const INITIAL_MEMBERS = type === "working_group" ? col("Initial Members") : -1;

  // Pre-fetch existing groups by slug and existing users by email (cheap).
  const existingGroups = await sql`SELECT slug FROM groups`;
  const existingSlugs = new Set<string>(existingGroups.map((r) => r.slug));

  let inserted = 0;
  let skipped = 0;
  const chairAssignments: Array<{ groupName: string; email: string; role: "chair" | "co_chair"; matched: boolean; userId: string | null }> = [];
  const memberAssignments: Array<{ groupName: string; rawName: string; matched: boolean; userId: string | null }> = [];

  for (const row of rows) {
    const name = (row[NAME] ?? "").trim();
    if (!name) continue;
    const slug = slugify(name);
    if (!slug) { console.log(`  · skipped (no slug-safe chars): ${name}`); continue; }
    if (existingSlugs.has(slug)) {
      console.log(`  · skipped (slug already exists): ${slug}`);
      skipped++;
      continue;
    }

    const purpose = (row[PURPOSE] ?? "").trim();
    const description = type === "working_group" ? firstSentence(purpose, 200) : purpose;
    const charter = type === "working_group" ? purpose : null;
    const slackChannel = cleanSlack(row[SLACK] ?? "");

    let groupId: string | null = null;
    if (COMMIT) {
      const inserted = await sql`
        INSERT INTO groups (name, slug, type, description, charter, slack_channel, links, is_active, is_published)
        VALUES (${name}, ${slug}, ${type}, ${description || null}, ${charter}, ${slackChannel}, '[]'::jsonb, true, true)
        RETURNING id
      `;
      groupId = inserted[0].id;
    }

    console.log(`  ✓ ${name}  (slug: ${slug}, type: ${type})`);
    inserted++;
    existingSlugs.add(slug);

    // Chair assignments.
    for (const [emailIdx, nameIdx, role] of [
      [CHAIR_EMAIL_1, CHAIR_NAME_1, "chair" as const],
      [CHAIR_EMAIL_2, CHAIR_NAME_2, "co_chair" as const],
    ]) {
      const email = (row[emailIdx] ?? "").trim().toLowerCase();
      const chairName = (row[nameIdx] ?? "").trim();
      if (!email) continue;
      if (isPlaceholderEmail(email)) {
        chairAssignments.push({ groupName: name, email, role, matched: false, userId: null });
        continue;
      }
      const userMatch = await sql`SELECT id FROM users WHERE LOWER(email) = ${email} LIMIT 1`;
      if (userMatch.length > 0) {
        const userId = userMatch[0].id;
        if (COMMIT && groupId) {
          await sql`
            INSERT INTO group_memberships (user_id, group_id, role)
            VALUES (${userId}, ${groupId}, ${role})
            ON CONFLICT (user_id, group_id) DO UPDATE SET role = ${role}
          `;
        }
        chairAssignments.push({ groupName: name, email, role, matched: true, userId });
      } else {
        chairAssignments.push({ groupName: name, email, role, matched: false, userId: null });
      }
    }

    // Initial members (working_group only).
    if (INITIAL_MEMBERS >= 0) {
      const raw = (row[INITIAL_MEMBERS] ?? "").trim();
      if (raw) {
        const namesList = raw.split(",").map((s) => s.trim()).filter(Boolean);
        for (const memberName of namesList) {
          const norm = normalizeDisplayName(memberName);
          if (norm.length < 4) {
            memberAssignments.push({ groupName: name, rawName: memberName, matched: false, userId: null });
            continue;
          }
          const match = await sql`
            SELECT u.id FROM users u
            INNER JOIN profiles p ON p.user_id = u.id
            WHERE LOWER(REGEXP_REPLACE(p.display_name, '[^a-zA-Z0-9]', '', 'g')) = ${norm}
            LIMIT 2
          `;
          if (match.length === 1) {
            const userId = match[0].id;
            if (COMMIT && groupId) {
              await sql`
                INSERT INTO group_memberships (user_id, group_id, role)
                VALUES (${userId}, ${groupId}, 'member')
                ON CONFLICT (user_id, group_id) DO NOTHING
              `;
            }
            memberAssignments.push({ groupName: name, rawName: memberName, matched: true, userId });
          } else {
            memberAssignments.push({ groupName: name, rawName: memberName, matched: false, userId: null });
          }
        }
      }
    }
  }

  // Reports.
  console.log(`\n─── Summary for ${type} ───`);
  console.log(`  Inserted: ${inserted}, Skipped (slug exists): ${skipped}`);

  const chairsMatched = chairAssignments.filter((a) => a.matched).length;
  const chairsUnmatched = chairAssignments.filter((a) => !a.matched && !isPlaceholderEmail(a.email)).length;
  const chairsPlaceholder = chairAssignments.filter((a) => isPlaceholderEmail(a.email)).length;
  console.log(`  Chair assignments: ${chairsMatched} matched, ${chairsUnmatched} unmatched, ${chairsPlaceholder} placeholder`);
  for (const a of chairAssignments.filter((a) => !a.matched && !isPlaceholderEmail(a.email))) {
    console.log(`    × ${a.email} → ${a.role} of ${a.groupName}  (no user with that email)`);
  }

  if (memberAssignments.length) {
    const membersMatched = memberAssignments.filter((m) => m.matched).length;
    console.log(`  Initial members: ${membersMatched} matched, ${memberAssignments.length - membersMatched} unmatched/ambiguous`);
  }
}
```

- [ ] **Step 3: Run dry-run.**

```bash
cd /Users/corderocore/Documents/usrse.github.io
node --experimental-strip-types packages/api/scripts/import-groups.ts
```

Verify the report. Expected: ~45 group inserts proposed, ~38+ chair matches, some unmatched chairs to follow up.

- [ ] **Step 4: Run `--commit`.**

```bash
node --experimental-strip-types packages/api/scripts/import-groups.ts --commit
```

Verify the dev DB now has the rows:

```bash
cd packages/api && node -e "
import('@neondatabase/serverless').then(async ({neon}) => {
  const fs = await import('node:fs');
  const url = fs.readFileSync('.dev.vars','utf8').match(/DATABASE_URL=['\"]?([^'\"\\n]+)/)[1];
  const sql = neon(url);
  console.log('groups:', await sql\`SELECT COUNT(*)::int AS n FROM groups\`);
  console.log('chair memberships:', await sql\`SELECT COUNT(*)::int AS n FROM group_memberships WHERE role IN ('chair', 'co_chair')\`);
});"
```

Expected: roughly 45 groups, ~38 chair memberships.

- [ ] **Step 5: Commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io
git add packages/api/scripts/import-groups.ts
git commit -m "feat(api): seed-data import script for working/affinity groups"
```

---

## Task 13: Wire admin routes + Playwright smoke

**Files:**
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/tests/admin-foundation.spec.ts`

- [ ] **Step 1: Wire the admin routes.**

In `apps/admin/src/App.tsx`, add the imports:

```tsx
import { GroupDetailPage } from "./pages/groups/GroupDetailPage";
import { GroupsListPage } from "./pages/groups/GroupsListPage";
```

Inside the `<Route element={<AdminShell ... />}>` block, find the existing `<Route path="groups" element={<ComingSoon ... />} />` line. Replace with two routes — most-specific first:

```tsx
<Route path="groups/:id" element={<GroupDetailPage />} />
<Route path="groups" element={<GroupsListPage />} />
```

- [ ] **Step 2: Extend the Playwright smoke.**

Append to `apps/admin/tests/admin-foundation.spec.ts`:

```ts
test("unauthenticated visit to /groups triggers sign-in flow", async ({ page }) => {
  await page.goto("/groups");
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});

test("unauthenticated visit to /groups/<uuid> triggers sign-in flow", async ({ page }) => {
  await page.goto("/groups/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});
```

- [ ] **Step 3: Typecheck + build + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
npm run build --workspace=@us-rse/admin
git add apps/admin/src/App.tsx apps/admin/tests/admin-foundation.spec.ts
git commit -m "feat(admin): wire groups routes + Playwright smoke"
```

Expected typecheck: 5/5 successful. Expected build: clean.

---

## Wrap

- [ ] **Step 1: Final typecheck + tests.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck && (cd packages/api && npm test)
```

Expected: 5/5 typecheck + all vitest tests pass (existing + 3 new for `canCreateGroup`).

- [ ] **Step 2: Push and open PR.**

```bash
git push -u origin cdcore09/admin-groups
gh pr create --base cdcore09/site-redesign --title "feat(admin): groups subsystem + public refactor" --body "$(cat <<'EOF'
Closes #1960.

Spec: docs/superpowers/specs/2026-05-14-admin-groups-design.md
Plan: docs/superpowers/plans/2026-05-14-admin-groups-implementation.md

## Summary

- Migration 0019 adds slack_channel, charter, links, is_published to groups
- canCreateGroup policy (super_admin only); canEditGroup already in place
- /api/admin/groups/* sub-app: list, create, detail, edit, lifecycle (publish/unpublish/archive/reopen), chair assign/remove
- /api/groups/* public sub-app (no auth): list + per-group detail
- /groups + /groups/:id admin pages (4-tab editor)
- WorkingGroupsPage + AffinityGroupsPage refactored to DB-driven
- New /community/groups/:id per-group public page and /community/regional-groups list
- /community/calls redirect placeholder (update with Community Calls group ID post-ingest)
- Standalone import script (--dry-run default, --commit) seeds 45 working+affinity groups from .data CSVs

Audit log writes on every mutation (8 distinct action names).

## Test plan
- [ ] Sign in as super_admin
- [ ] Click + New group, create a draft, verify it lands in /groups
- [ ] Edit charter and slack channel on the new group, publish
- [ ] Visit /community/groups/<new id> on the public site, verify it renders
- [ ] Assign a chair via the Roster tab; verify the assignee can edit the group
- [ ] Demote that chair; verify they can no longer edit
- [ ] Archive a group; verify it disappears from public list and shows as archived in admin
- [ ] Reopen; verify visible again
- [ ] Sign in as a chair, verify the admin /groups list shows ONLY their chaired groups
EOF
)"
```

**IMPORTANT:** No `Co-Authored-By: Claude`, "Generated with Claude Code", or any AI attribution trailer/footer.

- [ ] **Step 3: Update the issue.**

After merge, comment on #1960 with the merge commit SHA. Check off the issue requirements.

- [ ] **Step 4: Post-ingest follow-up.**

After the production import runs and the Community Calls group's UUID is known, update the `/community/calls` redirect target from the temporary `/community/working-groups` fallback to `/community/groups/<community-calls-id>`. Single commit, trivial diff.

---

## Summary

| Phase | Tasks |
|---|---|
| Schema + policy | 1, 2 (migration, canCreateGroup) |
| Admin API | 3, 4, 5, 6 (list/create, detail, PATCH+lifecycle, chair management) |
| Public API | 7 (list + detail) |
| Admin frontend | 8, 9 (list + modal, detail page) |
| Public frontend | 10, 11 (refactor list pages, new per-group + regional + redirect) |
| Data | 12 (import script) |
| Wire + smoke | 13 |
| Wrap | typecheck, push, PR |

13 numbered tasks. One migration. No reversibility decisions (groups don't merge or unmerge). Major reuse from prior subsystems: editorial design components, admin-foundation routing patterns, audit middleware contract.

## Self-review notes

Spec coverage:

- Migration with all four new columns → Task 1 ✓
- canCreateGroup + tests → Task 2 ✓
- canEditGroup scope-check on admin routes → Tasks 3, 4 (mount-level) ✓
- Admin list with chair-scoped visibility → Task 3 ✓
- Admin create (super_admin only) → Task 3 ✓
- Admin detail with members + audit → Task 4 ✓
- Admin PATCH + lifecycle (publish/unpublish/archive/reopen) → Task 5 ✓
- Chair assign/remove with audit → Task 6 ✓
- Public list + detail (no auth) → Task 7 ✓
- Admin list page with filters → Task 8 ✓
- + New group modal (super_admin only) → Task 8 ✓
- Admin detail page with 4 tabs → Task 9 ✓
- DB-driven public list pages → Task 10 ✓
- New per-group public page at /community/groups/:id → Task 11 ✓
- Regional groups page (empty-state-ready) → Task 11 ✓
- /community/calls redirect → Task 11 (with post-merge TODO for the final target) ✓
- CSV ingest script with --dry-run + --commit → Task 12 ✓
- Playwright smoke → Task 13 ✓

No placeholders remain except the documented `<community-calls-id>` follow-up which is intentional (UUID won't exist until ingest runs).
