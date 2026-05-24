# Events Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the events subsystem on top of the Plan 1 foundation: admin events CRUD with the standard 4-tab detail UI (Identity / Content / Review / Audit), member event submission from the public site, and a dynamic public `/events` surface that respects scope visibility. No thumbnail upload (deferred until `ARTIFACT_THUMBNAILS` R2 binding is provisioned), no Broadcast tab (Plan 5 inserts it), no attached-form section (Plan 4 inserts it).

**Architecture:** New Hono sub-app at `/admin/events/*` (mounted under the existing admin app, gated by the existing actor middleware) with five endpoints (list, create, detail, update, transitions, comments). New public route file at `/events` with two endpoints (list, detail) using the existing `optionalActor` middleware to gate scope. A new auth-gated public POST `/events/submit` lands a member draft and immediately transitions it to `in_review`. Four new admin React pages under `apps/admin/src/pages/events/`. The hardcoded `UpcomingEventsPage` in `apps/web` gets replaced by a dynamic dataset wired through a new `useEvents` hook. All lifecycle transitions go through the Plan 1 `applyTransition` orchestrator; all comments through the Plan 1 sanitizer. Per-route policy gating uses `canEditArtifact` and `canReviewArtifact`.

**Tech Stack:** Hono, Drizzle ORM, Neon HTTP, Zod, React 19, React Router 7, Vite — all existing patterns from the groups and orgs subsystems.

**Spec:** [`docs/superpowers/specs/2026-05-20-events-announcements-forms-design.md`](../specs/2026-05-20-events-announcements-forms-design.md)
**Builds on:** Plan 1 (`docs/superpowers/plans/2026-05-20-artifact-subsystem-foundation-implementation.md`, merged as #1994 → `31a0f2b`)

---

## Pre-flight

- [ ] **Confirm on `cdcore09/site-redesign`, clean tree, foundation merged**

```bash
git checkout cdcore09/site-redesign
git pull --ff-only
git log --oneline -3
```

Expected: HEAD is at or after `31a0f2b feat(api): artifact subsystem foundation (schema + lifecycle + queue) (#1994)`. If not, stop — Plan 1 is the prerequisite.

- [ ] **Verify baseline typecheck + tests**

```bash
npm run typecheck
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npm test ; cd ../..
```

Expected: 193+ tests pass, typecheck clean.

- [ ] **Create feature branch**

```bash
git checkout -b cdcore09/events-implementation
```

---

## Task 1: POST `/admin/events` — create draft

**Files:**
- Create: `packages/api/src/routes/admin/events/index.ts`
- Create: `packages/api/src/routes/admin/events/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/api/src/routes/admin/events/index.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const TEST_AUTHOR = "00000000-0000-0000-0000-000000000c01";
const TEST_STAFF = "00000000-0000-0000-0000-000000000c02";

describeIfDb("POST /admin/events", () => {
  let sql: ReturnType<typeof neon>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    for (const [id, role] of [
      [TEST_AUTHOR, "member"],
      [TEST_STAFF, "staff"],
    ] as const) {
      await sql`DELETE FROM users WHERE id = ${id}::uuid`;
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"wos-" + id}, ${"mem-" + id}, ${id + "@test"}, ${role}::user_role)
      `;
    }
  });

  afterAll(async () => {
    if (createdIds.length) {
      await sql`DELETE FROM events WHERE id = ANY(${createdIds}::uuid[])`;
    }
    await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
  });

  test("requires actor context (rejects unauthenticated)", async () => {
    const res = await testApp.request("/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", type: "workshop", startDate: "2099-01-01" }),
    });
    expect(res.status).toBe(401);
  });

  test("any signed-in actor can create a draft", async () => {
    const res = await testApp.request("/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor(TEST_AUTHOR),
      },
      body: JSON.stringify({
        name: "Member-submitted draft",
        type: "meetup",
        startDate: "2099-06-01",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: true; event: { id: string; status: string; scope: string } };
    expect(body.event.status).toBe("draft");
    expect(body.event.scope).toBe("community"); // member default
    createdIds.push(body.event.id);
  });

  test("rejects invalid input", async () => {
    const res = await testApp.request("/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });

  test("auto-generates slug from name", async () => {
    const res = await testApp.request("/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({
        name: "Awesome Workshop 2099!",
        type: "workshop",
        startDate: "2099-09-15",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: true; event: { id: string; slug: string } };
    expect(body.event.slug).toMatch(/^awesome-workshop-2099-[a-z0-9]{4,}$/);
    createdIds.push(body.event.id);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/events/index.test.ts
```

Expected: FAIL (module missing) OR `404` from no route mounted.

- [ ] **Step 3: Implement the route**

Write `packages/api/src/routes/admin/events/index.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { createDb } from "../../../db";
import { events } from "../../../db/schema";
import type { AppEnv } from "../../../types";

export const adminEventsRoute = new Hono<AppEnv>();

const EVENT_TYPES = ["conference", "workshop", "meetup", "webinar", "community_call", "other"] as const;
const SCOPES = ["public", "community", "group", "staff_only"] as const;
const STATUSES = [
  "draft", "in_review", "changes_requested", "rejected", "published",
  "cancelled", "completed", "archived",
] as const;

const createBodySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(EVENT_TYPES),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().max(200).optional(),
  url: z.string().url().max(500).optional(),
  description: z.string().max(5000).optional(),
  scope: z.enum(SCOPES).optional(),
  hostGroupId: z.string().uuid().optional(),
  hostOrgId: z.string().uuid().optional(),
  externalUrl: z.string().url().max(500).optional(),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : `event-${suffix}`;
}

/**
 * POST /admin/events
 *
 * Create a draft event. Any signed-in actor can create; author defaults
 * to the actor. Scope defaults differ by author class:
 *   - member       → community (per spec §3.1)
 *   - group lead   → group (if any chairedGroupIds; pick first; can override)
 *   - staff+       → community
 */
adminEventsRoute.post(
  "/",
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
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    let scope = body.scope;
    if (!scope) {
      if (actor.systemTier === 0 && actor.chairedGroupIds.size > 0) {
        scope = "group";
      } else if (actor.systemTier === 0) {
        scope = "community";
      } else {
        scope = "community";
      }
    }

    let hostGroupId = body.hostGroupId;
    if (!hostGroupId && scope === "group" && actor.chairedGroupIds.size > 0) {
      hostGroupId = [...actor.chairedGroupIds][0];
    }

    const slug = slugify(body.name);

    const [row] = await db
      .insert(events)
      .values({
        slug,
        name: body.name,
        type: body.type,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
        location: body.location ?? null,
        url: body.url ?? null,
        description: body.description ?? null,
        status: "draft",
        revision: 1,
        authorId: actor.user.id,
        scope,
        hostGroupId: hostGroupId ?? null,
        hostOrgId: body.hostOrgId ?? null,
        externalUrl: body.externalUrl ?? null,
      })
      .returning();

    return c.json(
      {
        ok: true,
        event: {
          id: row.id,
          slug: row.slug,
          name: row.name,
          type: row.type,
          status: row.status,
          scope: row.scope,
          revision: row.revision,
          authorId: row.authorId,
          startDate: row.startDate,
          endDate: row.endDate,
          createdAt: row.createdAt,
        },
      },
      201
    );
  }
);

/**
 * GET /admin/events
 *
 * List events for the admin queue/list view. Filters via query params:
 *   - status, type, scope, hostGroupId, hostOrgId — exact match
 *   - q — substring search across name
 *   - limit (default 50, max 200), offset
 */
adminEventsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const db = createDb(c.env.DATABASE_URL);

  const status = c.req.query("status");
  const type = c.req.query("type");
  const scope = c.req.query("scope");
  const hostGroupId = c.req.query("hostGroupId");
  const hostOrgId = c.req.query("hostOrgId");
  const q = c.req.query("q");
  const limit = Math.min(200, parseInt(c.req.query("limit") ?? "50", 10));
  const offset = Math.max(0, parseInt(c.req.query("offset") ?? "0", 10));

  const whereParts = [isNull(events.deletedAt)];
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    whereParts.push(eq(events.status, status as (typeof STATUSES)[number]));
  }
  if (type && EVENT_TYPES.includes(type as (typeof EVENT_TYPES)[number])) {
    whereParts.push(eq(events.type, type as (typeof EVENT_TYPES)[number]));
  }
  if (scope && SCOPES.includes(scope as (typeof SCOPES)[number])) {
    whereParts.push(eq(events.scope, scope as (typeof SCOPES)[number]));
  }
  if (hostGroupId) whereParts.push(eq(events.hostGroupId, hostGroupId));
  if (hostOrgId) whereParts.push(eq(events.hostOrgId, hostOrgId));
  if (q) whereParts.push(ilike(events.name, `%${q}%`));

  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      name: events.name,
      type: events.type,
      status: events.status,
      revision: events.revision,
      scope: events.scope,
      authorId: events.authorId,
      hostGroupId: events.hostGroupId,
      hostOrgId: events.hostOrgId,
      startDate: events.startDate,
      endDate: events.endDate,
      createdAt: events.createdAt,
    })
    .from(events)
    .where(and(...whereParts))
    .orderBy(desc(events.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ ok: true, rows });
});
```

- [ ] **Step 4: Mount the sub-app in the admin barrel**

Open `packages/api/src/routes/admin/index.ts`. Add:

```ts
import { adminEventsRoute } from "./events";

adminApi.route("/events", adminEventsRoute);
```

- [ ] **Step 5: Tests pass**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/events/index.test.ts
```

Expected: 4 pass.

Then full typecheck:
```bash
cd ../.. && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/events/index.ts \
        packages/api/src/routes/admin/events/index.test.ts \
        packages/api/src/routes/admin/index.ts
git commit -m "feat(api): admin events create + list endpoints"
```

---

## Task 2: GET + PATCH `/admin/events/:id` — detail & update

**Files:**
- Create: `packages/api/src/routes/admin/events/byId.ts`
- Create: `packages/api/src/routes/admin/events/byId.test.ts`
- Modify: `packages/api/src/routes/admin/events/index.ts` (mount the byId sub-app)

- [ ] **Step 1: Write the failing test**

Write `packages/api/src/routes/admin/events/byId.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-000000000d01";
const STAFF = "00000000-0000-0000-0000-000000000d02";
const EVT = "00000000-0000-0000-0000-000000000d03";

describeIfDb("/admin/events/:id", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    for (const [id, role] of [
      [AUTHOR, "member"],
      [STAFF, "staff"],
    ] as const) {
      await sql`DELETE FROM users WHERE id = ${id}::uuid`;
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"w-" + id}, ${"m-" + id}, ${id + "@t"}, ${role}::user_role)
      `;
    }
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    await sql`
      INSERT INTO events (id, slug, name, type, start_date, status, revision, author_id, scope)
      VALUES (
        ${EVT}::uuid, ${'detail-test-' + Date.now()}, 'Detail Test', 'workshop'::event_type,
        '2099-01-01'::date, 'draft'::artifact_status, 1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${EVT}::uuid`;
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
  });

  test("GET 200 returns event detail for staff", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      headers: { Authorization: makeStaffActor(STAFF) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: true; event: { id: string; name: string }; reviews: unknown[]; comments: unknown[] };
    expect(body.event.id).toBe(EVT);
    expect(Array.isArray(body.reviews)).toBe(true);
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test("GET 200 returns event detail for the author", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      headers: { Authorization: makeMemberActor(AUTHOR) },
    });
    expect(res.status).toBe(200);
  });

  test("GET 403 for non-author non-staff", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      headers: { Authorization: makeMemberActor("00000000-0000-0000-0000-000000000d99") },
    });
    expect(res.status).toBe(403);
  });

  test("PATCH 200 staff can update any field on any state", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(STAFF) },
      body: JSON.stringify({ name: "Updated by staff" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT name FROM events WHERE id = ${EVT}::uuid`;
    expect(after[0].name).toBe("Updated by staff");
  });

  test("PATCH 403 non-author non-staff", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-000000000d99") },
      body: JSON.stringify({ name: "Nope" }),
    });
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/events/byId.test.ts
```

- [ ] **Step 3: Implement byId.ts**

Write `packages/api/src/routes/admin/events/byId.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  artifactComments,
  artifactReviews,
  auditLog,
  events,
  users,
} from "../../../db/schema";
import { canEditArtifact } from "../../../lib/policies";
import type { AppEnv } from "../../../types";

export const adminEventByIdRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const patchBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["conference", "workshop", "meetup", "webinar", "community_call", "other"]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  url: z.string().url().max(500).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  scope: z.enum(["public", "community", "group", "staff_only"]).optional(),
  hostGroupId: z.string().uuid().nullable().optional(),
  hostOrgId: z.string().uuid().nullable().optional(),
  externalUrl: z.string().url().max(500).nullable().optional(),
}).strict();

adminEventByIdRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const id = c.req.param("id");
  if (!id || !UUID_RE.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
  const db = createDb(c.env.DATABASE_URL);

  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!event) return c.json({ ok: false, error: "not_found" }, 404);

  // Access: staff can view any; author can view their own; everyone else 403.
  if (actor.systemTier < 1 && event.authorId !== actor.user.id) {
    return c.json({ ok: false, error: "forbidden" }, 403);
  }

  const [reviews, comments, audit] = await Promise.all([
    db
      .select({
        id: artifactReviews.id,
        reviewerId: artifactReviews.reviewerId,
        reviewerName: users.email,
        decision: artifactReviews.decision,
        comment: artifactReviews.comment,
        entityRevision: artifactReviews.entityRevision,
        createdAt: artifactReviews.createdAt,
      })
      .from(artifactReviews)
      .leftJoin(users, eq(users.id, artifactReviews.reviewerId))
      .where(and(eq(artifactReviews.entityType, "event"), eq(artifactReviews.entityId, id)))
      .orderBy(asc(artifactReviews.createdAt)),
    db
      .select({
        id: artifactComments.id,
        authorId: artifactComments.authorId,
        authorName: users.email,
        body: artifactComments.body,
        createdAt: artifactComments.createdAt,
      })
      .from(artifactComments)
      .leftJoin(users, eq(users.id, artifactComments.authorId))
      .where(and(eq(artifactComments.entityType, "event"), eq(artifactComments.entityId, id)))
      .orderBy(asc(artifactComments.createdAt)),
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        actorId: auditLog.actorId,
        payload: auditLog.payload,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(eq(auditLog.targetId, id))
      .orderBy(desc(auditLog.createdAt))
      .limit(50),
  ]);

  return c.json({ ok: true, event, reviews, comments, audit });
});

adminEventByIdRoute.patch(
  "/",
  zValidator("json", patchBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: "invalid_input", issues: result.error.issues }, 400);
    }
  }),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const id = c.req.param("id");
    if (!id || !UUID_RE.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
    const db = createDb(c.env.DATABASE_URL);

    const existing = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

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

    const body = c.req.valid("json");
    const next: Record<string, unknown> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    for (const k of [
      "name", "type", "startDate", "endDate", "location", "url",
      "description", "scope", "hostGroupId", "hostOrgId", "externalUrl",
    ] as const) {
      if (k in body && body[k] !== undefined && body[k] !== existing[k]) {
        next[k] = body[k];
        before[k] = existing[k];
        after[k] = body[k];
      }
    }
    if (Object.keys(after).length === 0) {
      return c.json({ ok: true, noChange: true });
    }

    await db.update(events).set(next).where(eq(events.id, id));
    await db.insert(auditLog).values({
      actorId: actor.user.id,
      actorRole: actor.user.role,
      action: "events.update",
      targetType: "events",
      targetId: id,
      payload: { before, after },
    });

    return c.json({ ok: true });
  }
);
```

- [ ] **Step 4: Mount byId on the events sub-app**

Open `packages/api/src/routes/admin/events/index.ts`. At the top, add:

```ts
import { adminEventByIdRoute } from "./byId";
```

Just before the `export const adminEventsRoute`, after the existing route definitions, add:

```ts
adminEventsRoute.route("/:id", adminEventByIdRoute);
```

- [ ] **Step 5: Tests pass + typecheck**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/events/byId.test.ts
cd ../.. && npm run typecheck
```

5 byId tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/events/byId.ts \
        packages/api/src/routes/admin/events/byId.test.ts \
        packages/api/src/routes/admin/events/index.ts
git commit -m "feat(api): admin event detail + patch endpoints with policy gate"
```

---

## Task 3: POST `/admin/events/:id/transitions` — lifecycle actions

**Files:**
- Create: `packages/api/src/routes/admin/events/transitions.ts`
- Create: `packages/api/src/routes/admin/events/transitions.test.ts`
- Modify: `packages/api/src/routes/admin/events/index.ts` (mount)

- [ ] **Step 1: Write the failing test**

`packages/api/src/routes/admin/events/transitions.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-000000000e01";
const REV1 = "00000000-0000-0000-0000-000000000e02";
const REV2 = "00000000-0000-0000-0000-000000000e03";
const EVT = "00000000-0000-0000-0000-000000000e04";

describeIfDb("POST /admin/events/:id/transitions", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    for (const [id, role] of [
      [AUTHOR, "member"], [REV1, "staff"], [REV2, "staff"],
    ] as const) {
      await sql`DELETE FROM users WHERE id = ${id}::uuid`;
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"w-" + id}, ${"m-" + id}, ${id + "@t"}, ${role}::user_role)
      `;
    }
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    await sql`
      INSERT INTO events (id, slug, name, type, start_date, status, revision, author_id, scope)
      VALUES (
        ${EVT}::uuid, ${'trans-' + Date.now()}, 'Transition Test', 'workshop'::event_type,
        '2099-01-01'::date, 'draft'::artifact_status, 1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${EVT}::uuid`;
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
  });

  test("author submits → in_review", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor(AUTHOR) },
      body: JSON.stringify({ action: "submit_for_review" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT status FROM events WHERE id = ${EVT}::uuid`;
    expect(after[0].status).toBe("in_review");
  });

  test("reviewer 1 approves → still in_review", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(REV1) },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT status FROM events WHERE id = ${EVT}::uuid`;
    expect(after[0].status).toBe("in_review");
  });

  test("reviewer 2 approves → published", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(REV2) },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT status FROM events WHERE id = ${EVT}::uuid`;
    expect(after[0].status).toBe("published");
  });

  test("members cannot trigger review actions on someone else's event", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-000000000e99") },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/events/transitions.test.ts
```

- [ ] **Step 3: Implement transitions.ts**

Write `packages/api/src/routes/admin/events/transitions.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "../../../db";
import {
  applyTransition,
  drizzleLifecycleDb,
} from "../../../lib/lifecycle";
import { canEditArtifact, canReviewArtifact } from "../../../lib/policies";
import { eq } from "drizzle-orm";
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
      return c.json({ ok: false, error: "invalid_input", issues: result.error.issues }, 400);
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
```

- [ ] **Step 4: Mount on the events sub-app**

In `packages/api/src/routes/admin/events/index.ts`, add to imports and mount under the byId path:

```ts
import { adminEventTransitionsRoute } from "./transitions";
// ...
adminEventsRoute.route("/:id/transitions", adminEventTransitionsRoute);
```

Order matters in Hono: mount this BEFORE the `/:id` mount so it isn't shadowed. Place the `/transitions` mount BEFORE `/:id`.

- [ ] **Step 5: Tests pass + typecheck**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/events/transitions.test.ts
cd ../.. && npm run typecheck
```

4 transition tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/events/transitions.ts \
        packages/api/src/routes/admin/events/transitions.test.ts \
        packages/api/src/routes/admin/events/index.ts
git commit -m "feat(api): admin event transitions endpoint (wraps applyTransition)"
```

---

## Task 4: POST + GET `/admin/events/:id/comments`

**Files:**
- Create: `packages/api/src/routes/admin/events/comments.ts`
- Create: `packages/api/src/routes/admin/events/comments.test.ts`
- Modify: `packages/api/src/routes/admin/events/index.ts` (mount)

- [ ] **Step 1: Write the failing test**

`packages/api/src/routes/admin/events/comments.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-000000000f01";
const STAFF = "00000000-0000-0000-0000-000000000f02";
const EVT = "00000000-0000-0000-0000-000000000f03";

describeIfDb("/admin/events/:id/comments", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    for (const [id, role] of [
      [AUTHOR, "member"], [STAFF, "staff"],
    ] as const) {
      await sql`DELETE FROM users WHERE id = ${id}::uuid`;
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"w-" + id}, ${"m-" + id}, ${id + "@t"}, ${role}::user_role)
      `;
    }
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    await sql`
      INSERT INTO events (id, slug, name, type, start_date, status, revision, author_id, scope)
      VALUES (
        ${EVT}::uuid, ${'cmt-' + Date.now()}, 'Comments Test', 'workshop'::event_type,
        '2099-01-01'::date, 'in_review'::artifact_status, 1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
  });

  test("staff posts a comment", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(STAFF) },
      body: JSON.stringify({ body: "Looks good but title needs work." }),
    });
    expect(res.status).toBe(201);
  });

  test("author posts a comment", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor(AUTHOR) },
      body: JSON.stringify({ body: "Updated, please re-review." }),
    });
    expect(res.status).toBe(201);
  });

  test("non-author non-staff cannot comment", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-000000000f99") },
      body: JSON.stringify({ body: "should be blocked" }),
    });
    expect(res.status).toBe(403);
  });

  test("empty body rejected", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(STAFF) },
      body: JSON.stringify({ body: "   " }),
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/events/comments.test.ts
```

- [ ] **Step 3: Implement comments.ts**

`packages/api/src/routes/admin/events/comments.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { artifactComments, events } from "../../../db/schema";
import { sanitizeCommentBody } from "../../../lib/artifacts/comments";
import type { AppEnv } from "../../../types";

export const adminEventCommentsRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const bodySchema = z.object({ body: z.string() });

adminEventCommentsRoute.post(
  "/",
  zValidator("json", bodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: "invalid_input" }, 400);
    }
  }),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const id = c.req.param("id");
    if (!id || !UUID_RE.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const existing = await db
      .select({ authorId: events.authorId })
      .from(events)
      .where(eq(events.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    // Visibility: staff or the artifact author can comment
    if (actor.systemTier < 1 && existing.authorId !== actor.user.id) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }

    const sanitized = sanitizeCommentBody(c.req.valid("json").body);
    if (!sanitized.ok) {
      return c.json({ ok: false, error: sanitized.error }, 400);
    }

    const [row] = await db
      .insert(artifactComments)
      .values({
        entityType: "event",
        entityId: id,
        authorId: actor.user.id,
        body: sanitized.body,
      })
      .returning();

    return c.json({ ok: true, comment: row }, 201);
  }
);
```

- [ ] **Step 4: Mount on the events sub-app**

In `packages/api/src/routes/admin/events/index.ts`, add to imports and mount BEFORE the bare `/:id` mount:

```ts
import { adminEventCommentsRoute } from "./comments";
// ...
adminEventsRoute.route("/:id/comments", adminEventCommentsRoute);
```

Final mount order in events/index.ts should be:

```ts
adminEventsRoute.route("/:id/transitions", adminEventTransitionsRoute);
adminEventsRoute.route("/:id/comments", adminEventCommentsRoute);
adminEventsRoute.route("/:id", adminEventByIdRoute);
```

- [ ] **Step 5: Tests + typecheck**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/events/comments.test.ts
cd ../.. && npm run typecheck
```

4 comment tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/events/comments.ts \
        packages/api/src/routes/admin/events/comments.test.ts \
        packages/api/src/routes/admin/events/index.ts
git commit -m "feat(api): admin event comments POST endpoint"
```

---

## Task 5: Public `GET /events` + `GET /events/:slug`

**Files:**
- Create: `packages/api/src/routes/events.ts`
- Create: `packages/api/src/routes/events.test.ts`
- Modify: `packages/api/src/index.ts` (mount the route + apply `optionalActor` middleware)

- [ ] **Step 1: Write the failing test**

`packages/api/src/routes/events.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor } from "../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const PUBLIC_EVT = "00000000-0000-0000-0000-00000000ee01";
const COMMUNITY_EVT = "00000000-0000-0000-0000-00000000ee02";
const DRAFT_EVT = "00000000-0000-0000-0000-00000000ee03";
const MEMBER = "00000000-0000-0000-0000-00000000ee04";

describeIfDb("public events routes", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM users WHERE id = ${MEMBER}::uuid`;
    await sql`
      INSERT INTO users (id, workos_id, member_id, email, role)
      VALUES (${MEMBER}::uuid, ${"w-" + MEMBER}, ${"m-" + MEMBER}, ${MEMBER + "@t"}, 'member'::user_role)
    `;
    await sql`DELETE FROM events WHERE id IN (${PUBLIC_EVT}::uuid, ${COMMUNITY_EVT}::uuid, ${DRAFT_EVT}::uuid)`;
    await sql`
      INSERT INTO events (id, slug, name, type, start_date, status, revision, scope)
      VALUES
        (${PUBLIC_EVT}::uuid, ${'pub-' + Date.now()}, 'Public Event', 'workshop'::event_type, '2099-06-01'::date, 'published'::artifact_status, 1, 'public'::artifact_scope),
        (${COMMUNITY_EVT}::uuid, ${'com-' + Date.now()}, 'Community Event', 'meetup'::event_type, '2099-06-02'::date, 'published'::artifact_status, 1, 'community'::artifact_scope),
        (${DRAFT_EVT}::uuid, ${'drf-' + Date.now()}, 'Draft Event', 'webinar'::event_type, '2099-06-03'::date, 'draft'::artifact_status, 1, 'public'::artifact_scope)
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM events WHERE id IN (${PUBLIC_EVT}::uuid, ${COMMUNITY_EVT}::uuid, ${DRAFT_EVT}::uuid)`;
    await sql`DELETE FROM users WHERE id = ${MEMBER}::uuid`;
  });

  test("anonymous: only public published events", async () => {
    const res = await testApp.request("/events");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { events: { id: string; scope: string }[] };
    const ids = body.events.map((e) => e.id);
    expect(ids).toContain(PUBLIC_EVT);
    expect(ids).not.toContain(COMMUNITY_EVT);
    expect(ids).not.toContain(DRAFT_EVT);
  });

  test("authenticated: public + community published events", async () => {
    const res = await testApp.request("/events", {
      headers: { Authorization: makeMemberActor(MEMBER) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { events: { id: string }[] };
    const ids = body.events.map((e) => e.id);
    expect(ids).toContain(PUBLIC_EVT);
    expect(ids).toContain(COMMUNITY_EVT);
    expect(ids).not.toContain(DRAFT_EVT);
  });

  test("GET /events/:slug returns published event detail", async () => {
    const row = await sql`SELECT slug FROM events WHERE id = ${PUBLIC_EVT}::uuid`;
    const slug = row[0].slug;
    const res = await testApp.request(`/events/${slug}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { event: { id: string; scope: string } };
    expect(body.event.id).toBe(PUBLIC_EVT);
  });

  test("GET /events/:slug 404 on non-published", async () => {
    const row = await sql`SELECT slug FROM events WHERE id = ${DRAFT_EVT}::uuid`;
    const slug = row[0].slug;
    const res = await testApp.request(`/events/${slug}`);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/events.test.ts
```

- [ ] **Step 3: Implement events.ts**

`packages/api/src/routes/events.ts`:

```ts
import { Hono } from "hono";
import { and, asc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { createDb } from "../db";
import { events, groups, organizations, users } from "../db/schema";
import type { AppEnv } from "../types";

export const eventsRoute = new Hono<AppEnv>();

/**
 * GET /events
 *
 * Public list of published events, filtered by scope visibility:
 *   - anonymous viewer: only scope='public'
 *   - signed-in member: scope IN ('public', 'community') + scope='group' for groups they're in
 *
 * Auto-completed events (past end_date) are filtered out at read time.
 */
eventsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ events: [] });
  const db = createDb(c.env.DATABASE_URL);
  const actor = c.get("actor");

  const visibleScopes: ("public" | "community" | "group")[] = ["public"];
  if (actor && actor.systemTier >= 0) {
    visibleScopes.push("community");
  }
  // group-scoped events shown if viewer is in the group (joined membership query)
  const whereParts = [
    eq(events.status, "published"),
    isNull(events.deletedAt),
    inArray(events.scope, visibleScopes),
  ];

  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      name: events.name,
      type: events.type,
      startDate: events.startDate,
      endDate: events.endDate,
      location: events.location,
      description: events.description,
      scope: events.scope,
      externalUrl: events.externalUrl,
      authorId: events.authorId,
    })
    .from(events)
    .where(and(...whereParts))
    .orderBy(asc(events.startDate));

  // Filter out events whose end_date has passed (effective auto-completed)
  const today = new Date().toISOString().slice(0, 10);
  const active = rows.filter((e) => !e.endDate || e.endDate >= today);

  return c.json({ events: active });
});

/**
 * GET /events/:slug
 *
 * Public event detail. Returns the event + host_group + host_org +
 * author display name (when public profile permits). 404 for non-published.
 */
eventsRoute.get("/:slug", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "not_found" }, 404);
  const slug = c.req.param("slug");
  if (!slug) return c.json({ ok: false, error: "not_found" }, 404);
  const db = createDb(c.env.DATABASE_URL);

  const event = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.slug, slug),
        eq(events.status, "published"),
        isNull(events.deletedAt)
      )
    )
    .limit(1)
    .then((r) => r[0]);
  if (!event) return c.json({ ok: false, error: "not_found" }, 404);

  // Visibility check: anonymous viewer only sees public.
  const actor = c.get("actor");
  if (event.scope === "community" && !actor) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }
  if (event.scope === "group" || event.scope === "staff_only") {
    if (!actor || actor.systemTier < 1) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  }

  const [hostGroup, hostOrg, author] = await Promise.all([
    event.hostGroupId
      ? db.select({ id: groups.id, name: groups.name, slug: groups.slug })
          .from(groups).where(eq(groups.id, event.hostGroupId)).limit(1).then((r) => r[0])
      : null,
    event.hostOrgId
      ? db.select({ id: organizations.id, name: organizations.name })
          .from(organizations).where(eq(organizations.id, event.hostOrgId)).limit(1).then((r) => r[0])
      : null,
    event.authorId
      ? db.select({ id: users.id, email: users.email }).from(users)
          .where(eq(users.id, event.authorId)).limit(1).then((r) => r[0])
      : null,
  ]);

  return c.json({
    event: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      url: event.url,
      description: event.description,
      scope: event.scope,
      externalUrl: event.externalUrl,
      hostGroup,
      hostOrg,
      author: author ? { id: author.id } : null,
    },
  });
});
```

- [ ] **Step 4: Mount the route in `packages/api/src/index.ts`**

The route needs `optionalActor` middleware so it can see the viewer when signed in. The middleware exists at `packages/api/src/middleware/optionalActor.ts` from the orgs PR.

Add import + middleware + mount:

```ts
import { optionalActor } from "./middleware/optionalActor";
import { eventsRoute } from "./routes/events";

// (existing requireAuth + actorContext stay on /admin; do not touch them)

// apply optionalActor to public routes that benefit from the viewer
app.use("/events/*", optionalActor);
app.use("/events", optionalActor);

app.route("/events", eventsRoute);
```

Place the mount near the other public route mounts (around the `app.route("/organizations", ...)` line).

- [ ] **Step 5: Tests pass + typecheck**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/events.test.ts
cd ../.. && npm run typecheck
```

4 events tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/events.ts packages/api/src/routes/events.test.ts packages/api/src/index.ts
git commit -m "feat(api): public GET /events list + GET /events/:slug detail"
```

---

## Task 6: Public POST `/events/submit` — member submission

**Files:**
- Create: `packages/api/src/routes/eventsSubmit.ts`
- Create: `packages/api/src/routes/eventsSubmit.test.ts`
- Modify: `packages/api/src/index.ts` (mount with `requireAuth` + `requireActorContext`)

- [ ] **Step 1: Write the failing test**

`packages/api/src/routes/eventsSubmit.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor } from "../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const MEMBER = "00000000-0000-0000-0000-00000000fa01";

describeIfDb("POST /events/submit", () => {
  let sql: ReturnType<typeof neon>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM users WHERE id = ${MEMBER}::uuid`;
    await sql`
      INSERT INTO users (id, workos_id, member_id, email, role)
      VALUES (${MEMBER}::uuid, ${"w-" + MEMBER}, ${"m-" + MEMBER}, ${MEMBER + "@t"}, 'member'::user_role)
    `;
  });

  afterAll(async () => {
    if (createdIds.length) {
      await sql`DELETE FROM artifact_reviews WHERE entity_id = ANY(${createdIds}::uuid[])`;
      await sql`DELETE FROM audit_log WHERE target_id = ANY(${createdIds}::uuid[])`;
      await sql`DELETE FROM events WHERE id = ANY(${createdIds}::uuid[])`;
    }
    await sql`DELETE FROM users WHERE id = ${MEMBER}::uuid`;
  });

  test("requires auth (401 unauthenticated)", async () => {
    const res = await testApp.request("/events/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", type: "workshop", startDate: "2099-01-01" }),
    });
    expect(res.status).toBe(401);
  });

  test("auth'd member submits → lands as in_review with author=member", async () => {
    const res = await testApp.request("/events/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor(MEMBER),
      },
      body: JSON.stringify({
        name: "Member-submitted from another community",
        type: "conference",
        startDate: "2099-10-15",
        externalUrl: "https://example.org/conf",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: true; event: { id: string; status: string; authorId: string } };
    expect(body.event.status).toBe("in_review");
    expect(body.event.authorId).toBe(MEMBER);
    createdIds.push(body.event.id);
  });
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/eventsSubmit.test.ts
```

- [ ] **Step 3: Implement eventsSubmit.ts**

`packages/api/src/routes/eventsSubmit.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "../db";
import { events } from "../db/schema";
import {
  applyTransition,
  drizzleLifecycleDb,
} from "../lib/lifecycle";
import type { AppEnv } from "../types";

export const eventsSubmitRoute = new Hono<AppEnv>();

const submitBodySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["conference", "workshop", "meetup", "webinar", "community_call", "other"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  externalUrl: z.string().url().max(500).optional(),
  hostOrgId: z.string().uuid().optional(),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : `event-${suffix}`;
}

/**
 * POST /events/submit
 *
 * Auth-gated member submission. Creates a draft event with the member
 * as author, defaults scope to 'community', then transitions to
 * 'in_review' immediately so it appears in the staff queue.
 */
eventsSubmitRoute.post(
  "/",
  zValidator("json", submitBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: "invalid_input", issues: result.error.issues }, 400);
    }
  }),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const body = c.req.valid("json");
    const db = createDb(c.env.DATABASE_URL);

    const slug = slugify(body.name);
    const [row] = await db
      .insert(events)
      .values({
        slug,
        name: body.name,
        type: body.type,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
        location: body.location ?? null,
        description: body.description ?? null,
        status: "draft",
        revision: 1,
        authorId: actor.user.id,
        scope: "community",
        hostOrgId: body.hostOrgId ?? null,
        externalUrl: body.externalUrl ?? null,
      })
      .returning();

    // Immediately submit for review
    const lifecycleDb = drizzleLifecycleDb(db, {
      id: actor.user.id,
      role: actor.user.role,
    });
    const result = await applyTransition(lifecycleDb, {
      entityType: "event",
      entityId: row.id,
      action: "submit_for_review",
      actorId: actor.user.id,
    });
    if (!result.ok) {
      // Transition failed (shouldn't normally happen — draft → in_review is
      // always valid). Leave the row as `draft`; staff can clean it up
      // via the admin queue. Don't try to delete; the row may have already
      // produced audit_log entries that FK back via target_id.
      return c.json({ ok: false, error: result.error }, 400);
    }

    return c.json(
      {
        ok: true,
        event: {
          id: row.id,
          status: "in_review",
          slug: row.slug,
          authorId: row.authorId,
        },
      },
      201
    );
  }
);
```

- [ ] **Step 4: Mount the route**

In `packages/api/src/index.ts`, mount with auth (re-use the same middlewares as `/admin` since member submission requires actor context):

```ts
import { requireAuth } from "./middleware/auth";
import { requireActorContext } from "./middleware/actorContext";
import { eventsSubmitRoute } from "./routes/eventsSubmit";

// ...
app.use("/events/submit", requireAuth);
app.use("/events/submit", requireActorContext);
app.route("/events/submit", eventsSubmitRoute);
```

This MUST be mounted BEFORE `app.route("/events", eventsRoute)` so the route resolver picks `/events/submit` first. Hono matches in registration order.

Adjust the optionalActor middleware path from Task 5 to NOT match `/events/submit` (the requireAuth chain handles it). Easiest: change `app.use("/events/*", optionalActor)` to a more specific path or skip; the simpler approach is to mount `/events/submit` first with its own middlewares.

- [ ] **Step 5: Tests + typecheck**

```bash
cd packages/api && TEST_BYPASS_AUTH=1 npx vitest run src/routes/eventsSubmit.test.ts
cd ../.. && npm run typecheck
```

2 submit tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/eventsSubmit.ts packages/api/src/routes/eventsSubmit.test.ts packages/api/src/index.ts
git commit -m "feat(api): public POST /events/submit member submission endpoint"
```

---

## Task 7: Admin React hook for events

**Files:**
- Create: `apps/admin/src/hooks/useEvents.ts`

- [ ] **Step 1: Inspect the existing groups hook for the pattern**

```bash
cat apps/admin/src/hooks/useGroups.ts 2>/dev/null | head -30
```

If it doesn't exist, fall back to inspecting `apps/admin/src/pages/groups/GroupsListPage.tsx` for how API calls + state are structured. Follow that exact pattern.

- [ ] **Step 2: Implement the hook**

`apps/admin/src/hooks/useEvents.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

export interface EventRow {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  revision: number;
  scope: string;
  authorId: string | null;
  hostGroupId: string | null;
  hostOrgId: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export function useEventsList(filters?: {
  status?: string;
  type?: string;
  scope?: string;
  q?: string;
}) {
  const apiFetch = useApi();
  const [data, setData] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.type) params.set("type", filters.type);
      if (filters?.scope) params.set("scope", filters.scope);
      if (filters?.q) params.set("q", filters.q);
      const res = await apiFetch(`/admin/events?${params}`);
      if (!res.ok) {
        setError(`/admin/events responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as { rows: EventRow[] };
      setData(body.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [apiFetch, filters?.status, filters?.type, filters?.scope, filters?.q]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, refetch: load };
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/hooks/useEvents.ts
git commit -m "feat(admin): useEventsList hook"
```

---

## Task 8: Admin events list page

**Files:**
- Create: `apps/admin/src/pages/events/EventsListPage.tsx`
- Modify: `apps/admin/src/App.tsx` (add route)
- Modify: `apps/admin/src/layout/AdminSidebar.tsx` (add nav link)

- [ ] **Step 1: Read existing pattern**

Read `apps/admin/src/pages/groups/GroupsListPage.tsx` to mirror the layout (filters at top, list rows, status chips). Copy the visual style — same `admin-display`, `admin-classification`, etc. design tokens.

- [ ] **Step 2: Implement the list page**

`apps/admin/src/pages/events/EventsListPage.tsx`:

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useEventsList } from "../../hooks/useEvents";

const STATUS_OPTIONS = [
  "", "draft", "in_review", "changes_requested", "rejected",
  "published", "cancelled", "completed", "archived",
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  published: "Published",
  cancelled: "Cancelled",
  completed: "Completed",
  archived: "Archived",
};

export function EventsListPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const { data, error, loading } = useEventsList({
    status: statusFilter || undefined,
    q: query || undefined,
  });

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Events</p>
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          Events
        </h2>
        <Link
          to="/admin/events/new"
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600"
        >
          + New event
        </Link>
      </div>

      <div className="flex gap-4 mb-8">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border admin-input"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? STATUS_LABEL[s] : "All statuses"}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border admin-input"
        />
      </div>

      {error && (
        <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {error}
        </p>
      )}
      {loading && <p className="admin-marginalia">Loading…</p>}

      {data && data.length === 0 && (
        <p className="admin-marginalia">No events match the filters.</p>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y" style={{ borderColor: "var(--admin-rule)" }}>
          {data.map((e) => (
            <li key={e.id} className="py-4">
              <Link to={`/admin/events/${e.id}`} className="block hover:bg-gray-50 -mx-3 px-3 py-2 rounded-md">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold">{e.name}</span>
                  <span className="admin-classification">{STATUS_LABEL[e.status] ?? e.status}</span>
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="admin-classification">{e.type}</span>
                  <span className="admin-classification">{e.scope}</span>
                  <span className="admin-classification">{e.startDate}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire the route in `apps/admin/src/App.tsx`**

Inspect the existing routes (groups, organizations) and follow the pattern:

```tsx
import { EventsListPage } from "./pages/events/EventsListPage";

// inside the <Routes>:
<Route path="/events" element={<EventsListPage />} />
```

- [ ] **Step 4: Add sidebar nav link**

Open `apps/admin/src/layout/AdminSidebar.tsx`. Find the nav list (between Groups and Organizations or wherever fits). Add:

```tsx
{ to: "/events", label: "Events" },
```

Match the existing tuple/object shape used by the sidebar.

- [ ] **Step 5: Typecheck + visual smoke**

```bash
npm run typecheck
```

If you can start the admin dev server (`cd apps/admin && npm run dev`), open `/admin/events` and confirm the page renders. Smoke OK if the list paints (empty state is fine).

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/pages/events/EventsListPage.tsx \
        apps/admin/src/App.tsx \
        apps/admin/src/layout/AdminSidebar.tsx
git commit -m "feat(admin): events list page + sidebar nav"
```

---

## Task 9: Admin new-event modal/page

**Files:**
- Create: `apps/admin/src/pages/events/NewEventPage.tsx`
- Modify: `apps/admin/src/App.tsx` (route)

- [ ] **Step 1: Implement the page**

`apps/admin/src/pages/events/NewEventPage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

const EVENT_TYPES = [
  { value: "conference", label: "Conference" },
  { value: "workshop", label: "Workshop" },
  { value: "meetup", label: "Meetup" },
  { value: "webinar", label: "Webinar" },
  { value: "community_call", label: "Community call" },
  { value: "other", label: "Other" },
];

export function NewEventPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState("workshop");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          startDate,
          endDate: endDate || undefined,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          externalUrl: externalUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
        setError(err?.error ?? err?.message ?? `POST responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as { event: { id: string } };
      navigate(`/admin/events/${body.event.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-animate-reveal max-w-2xl">
      <p className="admin-classification mb-6">US-RSE · Admin · Events · New</p>
      <h2 className="admin-display mb-8" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        New event
      </h2>
      {error && (
        <p className="mb-6 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <EditorialInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <label className="admin-classification block mb-2">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 rounded-md border admin-input w-full"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <EditorialInput
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <EditorialInput
          label="End date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <EditorialInput
          label="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <EditorialInput
          label="External registration URL (optional)"
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          hint="Use this when registration is hosted elsewhere"
        />
        <EditorialTextarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
        <button
          type="submit"
          disabled={saving || !name || !startDate}
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save as draft"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Wire route**

Add in `apps/admin/src/App.tsx`:

```tsx
import { NewEventPage } from "./pages/events/NewEventPage";

// inside <Routes>:
<Route path="/events/new" element={<NewEventPage />} />
```

Place this route BEFORE any `/events/:id` route so React Router matches `/new` first.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/pages/events/NewEventPage.tsx apps/admin/src/App.tsx
git commit -m "feat(admin): new event compose page"
```

---

## Task 10: Admin event detail page (4 tabs)

**Files:**
- Create: `apps/admin/src/pages/events/EventDetailPage.tsx`
- Modify: `apps/admin/src/App.tsx` (route)

- [ ] **Step 1: Read the groups detail page**

```bash
head -100 apps/admin/src/pages/groups/GroupDetailPage.tsx
```

Follow the same tabbed structure (`tab` state + tab switcher row + per-tab section). Tabs for this page: Identity / Content / Review / Audit (NO Broadcast tab — Plan 5).

- [ ] **Step 2: Implement the page**

`apps/admin/src/pages/events/EventDetailPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

type Tab = "identity" | "content" | "review" | "audit";

interface EventDetail {
  ok: true;
  event: {
    id: string;
    slug: string;
    name: string;
    type: string;
    status: string;
    revision: number;
    scope: string;
    authorId: string | null;
    hostGroupId: string | null;
    hostOrgId: string | null;
    startDate: string;
    endDate: string | null;
    location: string | null;
    url: string | null;
    description: string | null;
    externalUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  reviews: Array<{
    id: string;
    reviewerId: string;
    reviewerName: string | null;
    decision: "approve" | "reject" | "request_changes";
    comment: string | null;
    entityRevision: number;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    authorId: string;
    authorName: string | null;
    body: string;
    createdAt: string;
  }>;
  audit: Array<{
    id: string;
    action: string;
    actorId: string;
    payload: unknown;
    createdAt: string;
  }>;
}

export function EventDetailPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Identity drafts
  const [draftName, setDraftName] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftExternalUrl, setDraftExternalUrl] = useState("");

  // Content drafts
  const [draftDescription, setDraftDescription] = useState("");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");

  // Comment composer
  const [newComment, setNewComment] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/events/${id}`);
      if (!res.ok) {
        setError(`/admin/events/${id} responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as EventDetail;
      setData(body);
      setDraftName(body.event.name);
      setDraftLocation(body.event.location ?? "");
      setDraftExternalUrl(body.event.externalUrl ?? "");
      setDraftDescription(body.event.description ?? "");
      setDraftStartDate(body.event.startDate);
      setDraftEndDate(body.event.endDate ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchEvent(body: Record<string, unknown>) {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/events/${data.event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setActionError(err?.error ?? `PATCH responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function transition(action: string, comment?: string) {
    if (!data) return;
    if (
      (action === "reject" || action === "request_changes") &&
      !comment?.trim()
    ) {
      setActionError("A comment is required for this action.");
      return;
    }
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/events/${data.event.id}/transitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setActionError(err?.error ?? `POST responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function postComment() {
    if (!data || !newComment.trim()) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/events/${data.event.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setActionError(err?.error ?? `POST responded ${res.status}`);
        return;
      }
      setNewComment("");
      await load();
    } finally {
      setActing(false);
    }
  }

  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );
  if (!data) return <p className="admin-marginalia">Loading…</p>;

  const e = data.event;
  const isStaff = actor.systemTier >= 1;
  const isAuthor = actor.user.id === e.authorId;
  const canTransition = isStaff || (isAuthor && (e.status === "draft" || e.status === "changes_requested"));

  // Approval count on current revision
  const currentRevApprovals = data.reviews
    .filter((r) => r.decision === "approve" && r.entityRevision === e.revision)
    .map((r) => r.reviewerId);
  const uniqueApprovals = new Set(currentRevApprovals).size;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Events · {e.name}</p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {e.name}
      </h2>
      <div className="flex items-center gap-4 mb-10">
        <span className="admin-classification">{e.type}</span>
        <span className="admin-classification">{e.scope}</span>
        <span className="admin-classification">{e.status}</span>
        <span className="admin-classification">rev {e.revision}</span>
      </div>

      <nav
        className="flex items-baseline gap-8 mb-8"
        style={{ borderBottom: "1px solid var(--admin-rule)" }}
      >
        {(["identity", "content", "review", "audit"] as Tab[]).map((t, i) => (
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
            <span>{t[0].toUpperCase() + t.slice(1)}</span>
          </button>
        ))}
      </nav>

      {actionError && (
        <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {actionError}
        </p>
      )}

      {tab === "identity" && (
        <section className="max-w-2xl space-y-6">
          <EditorialInput
            label="Name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <EditorialInput
            label="Location"
            value={draftLocation}
            onChange={(e) => setDraftLocation(e.target.value)}
          />
          <EditorialInput
            label="External registration URL"
            value={draftExternalUrl}
            onChange={(e) => setDraftExternalUrl(e.target.value)}
            hint="When set, the public event page links here instead of showing internal signup"
          />
          <button
            type="button"
            disabled={acting}
            onClick={() => patchEvent({
              name: draftName.trim() || undefined,
              location: draftLocation.trim() || null,
              externalUrl: draftExternalUrl.trim() || null,
            })}
            className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Save identity
          </button>
        </section>
      )}

      {tab === "content" && (
        <section className="max-w-2xl space-y-6">
          <EditorialInput
            label="Start date"
            type="date"
            value={draftStartDate}
            onChange={(e) => setDraftStartDate(e.target.value)}
          />
          <EditorialInput
            label="End date"
            type="date"
            value={draftEndDate}
            onChange={(e) => setDraftEndDate(e.target.value)}
          />
          <EditorialTextarea
            label="Description"
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            rows={8}
          />
          <button
            type="button"
            disabled={acting}
            onClick={() => patchEvent({
              startDate: draftStartDate,
              endDate: draftEndDate || null,
              description: draftDescription.trim() || null,
            })}
            className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Save content
          </button>
        </section>
      )}

      {tab === "review" && (
        <section className="max-w-3xl space-y-8">
          <div>
            <p className="admin-classification mb-3">
              Approvals on revision {e.revision}: {uniqueApprovals} of 2
            </p>
            <div className="flex gap-3 flex-wrap">
              {canTransition && e.status === "draft" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("submit_for_review")}
                  className="px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Submit for review
                </button>
              )}
              {canTransition && e.status === "changes_requested" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("submit_for_review")}
                  className="px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Resubmit
                </button>
              )}
              {isStaff && e.status === "in_review" && !isAuthor && (
                <>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => transition("approve")}
                    className="px-5 py-2 rounded-md bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      const c = window.prompt("Comment (required):");
                      if (c) void transition("request_changes", c);
                    }}
                    className="px-5 py-2 rounded-md bg-amber-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      const c = window.prompt("Reason (required):");
                      if (c) void transition("reject", c);
                    }}
                    className="px-5 py-2 rounded-md bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {isStaff && e.status === "published" && (
                <>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      if (window.confirm("Cancel this event?")) void transition("cancel");
                    }}
                    className="px-5 py-2 rounded-md bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Cancel event
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => transition("archive")}
                    className="px-5 py-2 rounded-md bg-gray-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Archive
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="admin-classification mb-3">Review history</p>
            {data.reviews.length === 0 && <p className="admin-marginalia">No reviews yet.</p>}
            <ul className="space-y-3">
              {data.reviews.map((r) => (
                <li key={r.id} className="text-sm">
                  <span className="font-mono">[{r.decision}]</span>{" "}
                  <span>{r.reviewerName ?? r.reviewerId}</span>{" "}
                  <span className="admin-marginalia">on rev {r.entityRevision}</span>
                  {r.comment && <p className="ml-6 mt-1 text-gray-700">{r.comment}</p>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="admin-classification mb-3">Comments</p>
            <ul className="space-y-3 mb-4">
              {data.comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="font-semibold">{c.authorName ?? c.authorId}</span>{" "}
                  <span className="admin-marginalia">{new Date(c.createdAt).toLocaleString()}</span>
                  <p className="mt-1 text-gray-800">{c.body}</p>
                </li>
              ))}
            </ul>
            <EditorialTextarea
              label="Add comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <button
              type="button"
              disabled={acting || !newComment.trim()}
              onClick={postComment}
              className="mt-2 px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              Post comment
            </button>
          </div>
        </section>
      )}

      {tab === "audit" && (
        <section className="max-w-3xl">
          {data.audit.length === 0 && <p className="admin-marginalia">No audit entries yet.</p>}
          <ul className="space-y-2">
            {data.audit.map((a) => (
              <li key={a.id} className="text-sm font-mono">
                <span className="admin-marginalia">{new Date(a.createdAt).toLocaleString()}</span>{" "}
                <span className="font-semibold">{a.action}</span>
                <span className="admin-marginalia"> by {a.actorId}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 admin-marginalia">
        <Link to="/admin/events">← Back to events</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Wire route in App.tsx**

```tsx
import { EventDetailPage } from "./pages/events/EventDetailPage";

// inside <Routes>, AFTER /events/new:
<Route path="/events/:id" element={<EventDetailPage />} />
```

- [ ] **Step 4: Typecheck + smoke**

```bash
npm run typecheck
```

Optional dev-server smoke: open `/admin/events/<id>` for an event you created. Confirm all 4 tabs render.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/pages/events/EventDetailPage.tsx apps/admin/src/App.tsx
git commit -m "feat(admin): event detail page with identity/content/review/audit tabs"
```

---

## Task 11: Public events list — replace hardcoded UpcomingEventsPage

**Files:**
- Create: `apps/web/src/hooks/useEvents.ts`
- Modify: `apps/web/src/pages/events/UpcomingEventsPage.tsx` (replace hardcoded data with hook-driven list while preserving page chrome)

- [ ] **Step 1: Create the public hook**

`apps/web/src/hooks/useEvents.ts`:

```ts
import { useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

export interface PublicEvent {
  id: string;
  slug: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  description: string | null;
  scope: string;
  externalUrl: string | null;
  authorId: string | null;
}

export function useEvents() {
  const apiFetch = useApi();
  const [events, setEvents] = useState<PublicEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/events");
        if (cancelled) return;
        if (!res.ok) {
          setError(`/events responded ${res.status}`);
          return;
        }
        const body = (await res.json()) as { events: PublicEvent[] };
        setEvents(body.events);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  return { events, error };
}
```

(`useApi` should work for unauthenticated calls too — verify by reading `apps/web/src/hooks/` for similar patterns like `useOrganizations`.)

- [ ] **Step 2: Inject hook-driven events into UpcomingEventsPage**

Open `apps/web/src/pages/events/UpcomingEventsPage.tsx`. The page currently renders a `recurringEvents` constant array. Add a new section that pulls dynamic events from the API.

Above the existing page content (after the imports), add a new section component or simply add a section in the JSX that renders the dynamic list. Match the existing visual style — use the same card/list patterns the recurringEvents section uses.

Example diff sketch (apply to whatever the file looks like; the existing recurring-events visuals stay intact):

```tsx
// Add near the top:
import { useEvents } from "@/hooks/useEvents";

// Inside the component, near the top of the JSX render:
const { events: dynamicEvents } = useEvents();

// New section in the JSX, above the recurring-events section:
{dynamicEvents && dynamicEvents.length > 0 && (
  <section className="my-16">
    <h2 className="text-3xl font-semibold mb-8">Upcoming community events</h2>
    <ul className="grid gap-6 md:grid-cols-2">
      {dynamicEvents.map((e) => (
        <li key={e.id} className="border rounded-md p-6">
          <p className="text-xs uppercase tracking-wider text-purple-700 mb-2">{e.type}</p>
          <h3 className="text-xl font-semibold mb-2">
            <a href={`/events/${e.slug}`} className="hover:underline">{e.name}</a>
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {new Date(e.startDate).toLocaleDateString(undefined, {
              year: "numeric", month: "short", day: "numeric",
            })}
            {e.location ? ` · ${e.location}` : ""}
          </p>
          {e.description && (
            <p className="text-sm text-gray-700 line-clamp-3">{e.description}</p>
          )}
        </li>
      ))}
    </ul>
  </section>
)}
```

Read the existing page carefully and integrate this with the existing visual rhythm rather than dumping it in awkwardly.

- [ ] **Step 3: Add the "Submit an event" CTA when authenticated**

Below the dynamic events list, add a CTA. Use the existing auth-shell `useAuth()` (or equivalent — check `apps/web/src/hooks/useAuth.ts` or similar) to conditionally show:

```tsx
{authenticated && (
  <div className="mt-8 text-center">
    <a href="/events/submit" className="inline-flex items-center px-6 py-3 rounded-md bg-purple-700 text-white">
      + Submit an event
    </a>
  </div>
)}
```

If the auth hook isn't obvious, fall back to always showing the link — when an anonymous visitor clicks, the submit page will redirect to sign-in.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useEvents.ts apps/web/src/pages/events/UpcomingEventsPage.tsx
git commit -m "feat(web): dynamic upcoming events list with submit CTA"
```

---

## Task 12: Public `/events/submit` page

**Files:**
- Create: `apps/web/src/pages/events/SubmitEventPage.tsx`
- Modify: `apps/web/src/App.tsx` (auth-gated route)

- [ ] **Step 1: Implement the page**

`apps/web/src/pages/events/SubmitEventPage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

export function SubmitEventPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState("conference");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          startDate,
          endDate: endDate || undefined,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          externalUrl: externalUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(err?.error ?? `POST responded ${res.status}`);
        return;
      }
      navigate("/events?submitted=1");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-16 max-w-2xl">
      <h1 className="text-4xl font-bold mb-4">Submit an event</h1>
      <p className="text-gray-700 mb-8">
        Share an event from your community that US-RSE members might benefit from.
        Submissions are reviewed by US-RSE staff before publishing.
      </p>
      {error && (
        <p className="mb-6 text-red-700">{error}</p>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <label className="block">
          <span className="text-sm font-semibold">Event name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          >
            <option value="conference">Conference</option>
            <option value="workshop">Workshop</option>
            <option value="meetup">Meetup</option>
            <option value="webinar">Webinar</option>
            <option value="community_call">Community call</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">End date (optional)</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Location (optional)</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Registration URL (optional)</span>
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2"
            placeholder="https://example.org/register"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={saving || !name || !startDate}
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-700 text-white font-semibold disabled:opacity-50"
        >
          {saving ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Wire route in App.tsx**

Find the existing auth-gated route pattern in `apps/web/src/App.tsx` (e.g., the account page). Mirror it:

```tsx
import { SubmitEventPage } from "./pages/events/SubmitEventPage";

// inside <Routes>, ensure /events/submit appears BEFORE /events/:slug if both exist:
<Route path="/events/submit" element={<SubmitEventPage />} />
```

If there's an `AuthRequired` wrapper component, wrap in it.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/events/SubmitEventPage.tsx apps/web/src/App.tsx
git commit -m "feat(web): /events/submit member submission page"
```

---

## Task 13: Public `/events/:slug` detail page

**Files:**
- Create: `apps/web/src/pages/events/EventDetailPage.tsx`
- Modify: `apps/web/src/App.tsx` (route)

- [ ] **Step 1: Implement the page**

`apps/web/src/pages/events/EventDetailPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

interface EventDetail {
  id: string;
  slug: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  url: string | null;
  description: string | null;
  scope: string;
  externalUrl: string | null;
  hostGroup: { id: string; name: string; slug: string } | null;
  hostOrg: { id: string; name: string } | null;
  author: { id: string } | null;
}

export function EventDetailPage() {
  const apiFetch = useApi();
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/events/${slug}`);
        if (cancelled) return;
        if (res.status === 404) {
          setError("Event not found");
          return;
        }
        if (!res.ok) {
          setError(`/events/${slug} responded ${res.status}`);
          return;
        }
        const body = (await res.json()) as { event: EventDetail };
        setEvent(body.event);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [apiFetch, slug]);

  if (error) {
    return (
      <main className="container mx-auto px-4 py-16">
        <p className="text-red-700">{error}</p>
        <p className="mt-4"><Link to="/events" className="text-purple-700">← Back to events</Link></p>
      </main>
    );
  }
  if (!event) return <main className="container mx-auto px-4 py-16"><p>Loading…</p></main>;

  const dateRange = event.endDate
    ? `${event.startDate} – ${event.endDate}`
    : event.startDate;

  return (
    <main className="container mx-auto px-4 py-16 max-w-3xl">
      <p className="text-xs uppercase tracking-wider text-purple-700 mb-3">{event.type}</p>
      <h1 className="text-4xl font-bold mb-4">{event.name}</h1>
      <p className="text-gray-700 mb-2">{dateRange}{event.location ? ` · ${event.location}` : ""}</p>

      {(event.hostGroup || event.hostOrg) && (
        <p className="text-gray-700 mb-6">
          Hosted by{" "}
          {event.hostGroup && (
            <a href={`/community/groups/${event.hostGroup.id}`} className="text-purple-700 underline">
              {event.hostGroup.name}
            </a>
          )}
          {event.hostOrg && (
            <a href={`/orgs/${event.hostOrg.id}`} className="text-purple-700 underline">
              {event.hostOrg.name}
            </a>
          )}
        </p>
      )}

      {event.description && (
        <div className="prose mb-8">
          <p className="whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {event.externalUrl ? (
        <a
          href={event.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-700 text-white font-semibold"
        >
          Register at {event.hostOrg?.name ?? "external site"} →
        </a>
      ) : event.url ? (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-700 text-white font-semibold"
        >
          Event link →
        </a>
      ) : null}

      <p className="mt-12 text-sm text-gray-500">
        <Link to="/events" className="hover:underline">← All events</Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Route**

In `apps/web/src/App.tsx`:

```tsx
import { EventDetailPage as PublicEventDetail } from "./pages/events/EventDetailPage";

// inside <Routes>, AFTER /events/submit:
<Route path="/events/:slug" element={<PublicEventDetail />} />
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/events/EventDetailPage.tsx apps/web/src/App.tsx
git commit -m "feat(web): public /events/:slug detail page"
```

---

## Task 14: Full test suite + typecheck

- [ ] **Step 1: Full API test run**

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npm test
cd ../..
```

Expected: all green. New tests added in Tasks 1-6 (4 + 5 + 4 + 4 + 4 + 2 = 23 new tests) plus the 193 pre-existing = 216 tests.

- [ ] **Step 2: Without DB — should still pass with new suites skipped**

```bash
cd packages/api && unset DATABASE_URL && unset TEST_BYPASS_AUTH && npm test
cd ../..
```

Expected: integration + new admin event suites skipped; unit tests pass.

- [ ] **Step 3: Full repo typecheck**

```bash
npm run typecheck
```

Expected: 5/5 packages clean.

---

## Task 15: Push branch + open PR

- [ ] **Step 1: Push**

```bash
git push -u origin cdcore09/events-implementation
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --base cdcore09/site-redesign --title "feat: events subsystem (admin + member submit + public)" --body "$(cat <<'EOF'
## Summary

Plan 2 of 5 from the events / announcements / forms brainstorm. Lands the events admin + member submit + public surfaces on top of the Plan 1 foundation (#1994).

- **Admin API:** POST/GET /admin/events, GET/PATCH /admin/events/:id, POST /admin/events/:id/transitions (wraps applyTransition), POST /admin/events/:id/comments (uses sanitizer)
- **Public API:** GET /events (scope-aware list), GET /events/:slug (detail with host attribution), POST /events/submit (auth-gated member submission, auto-transitions to in_review)
- **Admin UI:** /admin/events list, /admin/events/new compose, /admin/events/:id detail with 4 tabs (Identity / Content / Review / Audit). Sidebar nav updated. Broadcast tab deferred to Plan 5; attached form section deferred to Plan 4.
- **Public UI:** UpcomingEventsPage now renders dynamic events from the API alongside the existing hardcoded recurring-events section. New /events/submit form. New /events/:slug detail page with external_url CTA.

## Test plan

- [ ] CI green (Cloudflare Pages preview deploys)
- [ ] Full vitest suite passes against staging DB (216 tests)
- [ ] Manual: log in as super_admin, create an event, submit for review, log in as second super_admin, approve, verify it publishes
- [ ] Manual: log in as member, /events/submit, fill out form, see in_review event appear in /admin/queue
- [ ] Manual: anonymous viewer hits /events, sees only public events; sign in, sees community events too

## Plan + spec

- Spec: `docs/superpowers/specs/2026-05-20-events-announcements-forms-design.md`
- Plan: `docs/superpowers/plans/2026-05-24-events-implementation.md`
- Builds on: PR #1994 (Plan 1 foundation)
EOF
)"
```

- [ ] **Step 3: Verify CI**

```bash
sleep 10 && gh pr checks
```

Expected: Cloudflare Pages previews succeed; CircleCI legacy may error (expected on site-redesign-base PRs).

---

## Wrap

Plan 2 (Events) is done when:

1. PR opened against `cdcore09/site-redesign`.
2. Full vitest suite passes (216 tests) with DB env set.
3. Full typecheck clean.
4. Manual smoke confirms admin create → submit → 2-approve → publish, member submission → in_review queue, and public list scope-aware.

**Next:** Plan 3 (Announcements + banner) — admin announcements CRUD with same lifecycle, public banner rendering, full active-banner endpoint replacing the Plan 1 stub.

---

## Summary

This plan adds events as the first user-facing artifact on top of the Plan 1 foundation. Admin gets full CRUD + lifecycle + comments + audit; members can submit external-community events from the public site; public visitors see scope-filtered events on /events and per-event detail pages. Form attachment and broadcast UI are intentionally deferred to Plans 4 and 5.

## Test plan

- [ ] All vitest unit + integration tests pass (216 total)
- [ ] PR CI green on Cloudflare Pages checks
- [ ] Admin happy path verified manually: create → submit → 2x approve → publish
- [ ] Member submit happy path verified: /events/submit → appears in /admin/queue as in_review
- [ ] Public list verified anonymous (only public) and authenticated (public + community)
