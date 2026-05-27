# Announcements Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the announcements subsystem on top of the Plan 1 foundation and the Plan 2 event-admin patterns: admin announcements CRUD with the standard 4-tab detail UI (Identity / Content / Review / Audit), and the public `<SiteBanner />` that consumes the existing `GET /announcements/active-banner` endpoint. No public `/announcements/submit` form (members author via admin app), no Broadcast tab (Plan 5 inserts it), no attached-form section (Plan 4 inserts it), no public `/announcements` index page (deferred per spec §7.4).

**Architecture:** New Hono sub-app at `/admin/announcements/*` mounted under the existing admin app (gated by `requireActorContext`) with the same four-endpoint shape as `/admin/events/*` (list/create/detail/patch + transitions + comments). The active-banner endpoint already exists from Plan 1 and returns at most one row via an inner-join chain (announcements → broadcast_requests → broadcast_channels). A new `<SiteBanner />` mounted in the public app shell calls that endpoint, renders a dismissable strip, and persists dismissal in `localStorage` keyed by announcement id. Four new admin React pages under `apps/admin/src/pages/announcements/` follow the events pattern. All lifecycle goes through the Plan 1 `applyTransition`; comments through the Plan 1 sanitizer.

**Tech Stack:** Hono, Drizzle ORM, Neon HTTP, Zod, React 19 — all patterns from Plans 1 and 2.

**Spec:** [`docs/superpowers/specs/2026-05-20-events-announcements-forms-design.md`](../specs/2026-05-20-events-announcements-forms-design.md)
**Builds on:** Plan 1 (`docs/superpowers/plans/2026-05-20-artifact-subsystem-foundation-implementation.md`, merged as #1994 → `31a0f2b`) and Plan 2 (`docs/superpowers/plans/2026-05-24-events-implementation.md`, merged as #1998 → `54c393e`)

---

## Pre-flight

- [ ] **Confirm on `cdcore09/site-redesign`, clean tree, prior plans merged**

```bash
git checkout cdcore09/site-redesign
git pull --ff-only
git log --oneline -3
```

Expected: HEAD is at or after `54c393e feat: events subsystem (admin + member submit + public) (#1998)`. If not, stop — Plan 2 is the prerequisite.

- [ ] **Verify baseline typecheck + tests**

```bash
npm run typecheck
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npm test ; cd ../..
```

Expected: 216+ tests pass, typecheck clean.

- [ ] **Create feature branch**

```bash
git checkout -b cdcore09/announcements-implementation
```

---

## Task 1: POST + GET `/admin/announcements`

**Files:**
- Create: `packages/api/src/routes/admin/announcements/index.ts`
- Create: `packages/api/src/routes/admin/announcements/index.test.ts`
- Modify: `packages/api/src/routes/admin/index.ts` (mount the sub-app)

- [ ] **Step 1: Write the failing test**

`packages/api/src/routes/admin/announcements/index.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const TEST_AUTHOR = "00000000-0000-0000-0000-00000000aa01";
const TEST_STAFF = "00000000-0000-0000-0000-00000000aa02";

describeIfDb("POST/GET /admin/announcements", () => {
  let sql: ReturnType<typeof neon>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    // Defensive cleanup from prior runs
    await sql`DELETE FROM audit_log WHERE actor_id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    for (const [id, role] of [
      [TEST_AUTHOR, "member"],
      [TEST_STAFF, "staff"],
    ] as const) {
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"wos-" + id}, ${"mem-" + id}, ${id + "@test"}, ${role}::user_role)
      `;
    }
  });

  afterAll(async () => {
    if (createdIds.length) {
      await sql`DELETE FROM announcements WHERE id = ANY(${createdIds}::uuid[])`;
    }
    await sql`DELETE FROM audit_log WHERE actor_id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
  });

  test("requires actor context (rejects unauthenticated)", async () => {
    const res = await testApp.request("/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x", body: "y" }),
    });
    expect(res.status).toBe(401);
  });

  test("any signed-in actor can create a draft", async () => {
    const res = await testApp.request("/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor(TEST_AUTHOR),
      },
      body: JSON.stringify({
        title: "Member-authored announcement",
        body: "Body text here",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      ok: true;
      announcement: { id: string; status: string; scope: string };
    };
    expect(body.announcement.status).toBe("draft");
    expect(body.announcement.scope).toBe("community");
    createdIds.push(body.announcement.id);
  });

  test("staff with explicit scope='public' accepted", async () => {
    const res = await testApp.request("/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({
        title: "Public announcement",
        body: "Visible to all",
        scope: "public",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      ok: true;
      announcement: { id: string; scope: string };
    };
    expect(body.announcement.scope).toBe("public");
    createdIds.push(body.announcement.id);
  });

  test("rejects invalid input (missing body)", async () => {
    const res = await testApp.request("/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({ title: "no body" }),
    });
    expect(res.status).toBe(400);
  });

  test("GET lists announcements with status filter", async () => {
    const res = await testApp.request("/admin/announcements?status=draft", {
      headers: { Authorization: makeStaffActor(TEST_STAFF) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: Array<{ status: string }> };
    expect(body.rows.every((r) => r.status === "draft")).toBe(true);
  });
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/announcements/index.test.ts
```

- [ ] **Step 3: Implement the route**

`packages/api/src/routes/admin/announcements/index.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { createDb } from "../../../db";
import { announcements } from "../../../db/schema";
import type { AppEnv } from "../../../types";

export const adminAnnouncementsRoute = new Hono<AppEnv>();

const SCOPES = ["public", "community", "group", "staff_only"] as const;
const STATUSES = [
  "draft", "in_review", "changes_requested", "rejected", "published",
  "expired", "archived",
] as const;

const createBodySchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  linkUrl: z.string().url().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
  scope: z.enum(SCOPES).optional(),
  hostGroupId: z.string().uuid().optional(),
  hostOrgId: z.string().uuid().optional(),
});

adminAnnouncementsRoute.post(
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
      } else {
        scope = "community";
      }
    }

    let hostGroupId = body.hostGroupId;
    if (!hostGroupId && scope === "group" && actor.chairedGroupIds.size > 0) {
      hostGroupId = [...actor.chairedGroupIds][0];
    }

    const [row] = await db
      .insert(announcements)
      .values({
        title: body.title,
        body: body.body,
        linkUrl: body.linkUrl ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        status: "draft",
        revision: 1,
        authorId: actor.user.id,
        scope,
        hostGroupId: hostGroupId ?? null,
        hostOrgId: body.hostOrgId ?? null,
      })
      .returning();

    return c.json(
      {
        ok: true,
        announcement: {
          id: row.id,
          title: row.title,
          status: row.status,
          scope: row.scope,
          revision: row.revision,
          authorId: row.authorId,
          createdAt: row.createdAt,
        },
      },
      201
    );
  }
);

adminAnnouncementsRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const db = createDb(c.env.DATABASE_URL);

  const status = c.req.query("status");
  const scope = c.req.query("scope");
  const hostGroupId = c.req.query("hostGroupId");
  const q = c.req.query("q");
  const limit = Math.min(200, parseInt(c.req.query("limit") ?? "50", 10));
  const offset = Math.max(0, parseInt(c.req.query("offset") ?? "0", 10));

  const whereParts = [isNull(announcements.deletedAt)];
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    whereParts.push(eq(announcements.status, status as (typeof STATUSES)[number]));
  }
  if (scope && SCOPES.includes(scope as (typeof SCOPES)[number])) {
    whereParts.push(eq(announcements.scope, scope as (typeof SCOPES)[number]));
  }
  if (hostGroupId) whereParts.push(eq(announcements.hostGroupId, hostGroupId));
  if (q) whereParts.push(ilike(announcements.title, `%${q}%`));

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      status: announcements.status,
      revision: announcements.revision,
      scope: announcements.scope,
      authorId: announcements.authorId,
      hostGroupId: announcements.hostGroupId,
      hostOrgId: announcements.hostOrgId,
      expiresAt: announcements.expiresAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(and(...whereParts))
    .orderBy(desc(announcements.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ ok: true, rows });
});
```

- [ ] **Step 4: Mount the sub-app**

In `packages/api/src/routes/admin/index.ts`:
```ts
import { adminAnnouncementsRoute } from "./announcements";

adminApi.route("/announcements", adminAnnouncementsRoute);
```

Place next to the other route mounts.

- [ ] **Step 5: Tests + typecheck**

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/announcements/index.test.ts
cd ../.. && npm run typecheck
```

5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/announcements/index.ts \
        packages/api/src/routes/admin/announcements/index.test.ts \
        packages/api/src/routes/admin/index.ts
git commit -m "feat(api): admin announcements create + list endpoints"
```

---

## Task 2: GET + PATCH `/admin/announcements/:id`

**Files:**
- Create: `packages/api/src/routes/admin/announcements/byId.ts`
- Create: `packages/api/src/routes/admin/announcements/byId.test.ts`
- Modify: `packages/api/src/routes/admin/announcements/index.ts` (mount)

- [ ] **Step 1: Test**

`packages/api/src/routes/admin/announcements/byId.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-00000000ab01";
const STAFF = "00000000-0000-0000-0000-00000000ab02";
const ANN = "00000000-0000-0000-0000-00000000ab03";

describeIfDb("/admin/announcements/:id", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM announcements WHERE id = ${ANN}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    for (const [id, role] of [
      [AUTHOR, "member"],
      [STAFF, "staff"],
    ] as const) {
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"w-" + id}, ${"m-" + id}, ${id + "@t"}, ${role}::user_role)
      `;
    }
    await sql`
      INSERT INTO announcements (id, title, body, status, revision, author_id, scope)
      VALUES (
        ${ANN}::uuid, 'Detail Test', 'Body text', 'draft'::artifact_status,
        1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${ANN}::uuid`;
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${ANN}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${ANN}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM announcements WHERE id = ${ANN}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
  });

  test("GET 200 for staff", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      headers: { Authorization: makeStaffActor(STAFF) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { announcement: { id: string }; reviews: unknown[]; comments: unknown[] };
    expect(body.announcement.id).toBe(ANN);
  });

  test("GET 200 for the author", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      headers: { Authorization: makeMemberActor(AUTHOR) },
    });
    expect(res.status).toBe(200);
  });

  test("GET 403 for non-author non-staff", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      headers: { Authorization: makeMemberActor("00000000-0000-0000-0000-00000000ab99") },
    });
    expect(res.status).toBe(403);
  });

  test("PATCH 200 staff updates title", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(STAFF) },
      body: JSON.stringify({ title: "Updated by staff" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT title FROM announcements WHERE id = ${ANN}::uuid` as Array<{ title: string }>;
    expect(after[0].title).toBe("Updated by staff");
  });

  test("PATCH 403 non-author non-staff", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-00000000ab99") },
      body: JSON.stringify({ title: "Nope" }),
    });
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/announcements/byId.test.ts
```

- [ ] **Step 3: Implement byId.ts**

`packages/api/src/routes/admin/announcements/byId.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { announcements, artifactComments, artifactReviews, auditLog, users } from "../../../db/schema";
import { canEditArtifact } from "../../../lib/policies";
import type { AppEnv } from "../../../types";

export const adminAnnouncementByIdRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const patchBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000).optional(),
  linkUrl: z.string().url().max(500).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  scope: z.enum(["public", "community", "group", "staff_only"]).optional(),
  hostGroupId: z.string().uuid().nullable().optional(),
  hostOrgId: z.string().uuid().nullable().optional(),
}).strict();

adminAnnouncementByIdRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  const id = c.req.param("id");
  if (!id || !UUID_RE.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
  const db = createDb(c.env.DATABASE_URL);

  const announcement = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!announcement) return c.json({ ok: false, error: "not_found" }, 404);

  if (actor.systemTier < 1 && announcement.authorId !== actor.user.id) {
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
      .where(and(eq(artifactReviews.entityType, "announcement"), eq(artifactReviews.entityId, id)))
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
      .where(and(eq(artifactComments.entityType, "announcement"), eq(artifactComments.entityId, id)))
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

  return c.json({ ok: true, announcement, reviews, comments, audit });
});

adminAnnouncementByIdRoute.patch(
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
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    if (
      !canEditArtifact(actor, {
        entityType: "announcement",
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
      "title", "body", "linkUrl", "scope", "hostGroupId", "hostOrgId",
    ] as const) {
      if (k in body && body[k] !== undefined && body[k] !== existing[k]) {
        next[k] = body[k];
        before[k] = existing[k];
        after[k] = body[k];
      }
    }
    // expiresAt needs Date conversion
    if (body.expiresAt !== undefined) {
      const nextExpires = body.expiresAt === null ? null : new Date(body.expiresAt);
      if (nextExpires?.getTime() !== existing.expiresAt?.getTime()) {
        next.expiresAt = nextExpires;
        before.expiresAt = existing.expiresAt;
        after.expiresAt = nextExpires;
      }
    }
    if (Object.keys(after).length === 0) {
      return c.json({ ok: true, noChange: true });
    }

    await db.update(announcements).set(next).where(eq(announcements.id, id));
    await db.insert(auditLog).values({
      actorId: actor.user.id,
      actorRole: actor.user.role,
      action: "announcements.update",
      targetType: "announcements",
      targetId: id,
      payload: { before, after },
    });

    return c.json({ ok: true });
  }
);
```

- [ ] **Step 4: Mount in announcements/index.ts**

```ts
import { adminAnnouncementByIdRoute } from "./byId";

// At the bottom of the file:
adminAnnouncementsRoute.route("/:id", adminAnnouncementByIdRoute);
```

- [ ] **Step 5: Tests + typecheck**

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/announcements/byId.test.ts
cd ../.. && npm run typecheck
```

5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/announcements/byId.ts \
        packages/api/src/routes/admin/announcements/byId.test.ts \
        packages/api/src/routes/admin/announcements/index.ts
git commit -m "feat(api): admin announcement detail + patch endpoints with policy gate"
```

---

## Task 3: POST `/admin/announcements/:id/transitions`

**Files:**
- Create: `packages/api/src/routes/admin/announcements/transitions.ts`
- Create: `packages/api/src/routes/admin/announcements/transitions.test.ts`
- Modify: `packages/api/src/routes/admin/announcements/index.ts` (mount BEFORE `/:id`)

- [ ] **Step 1: Test**

`packages/api/src/routes/admin/announcements/transitions.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-00000000ac01";
const REV1 = "00000000-0000-0000-0000-00000000ac02";
const REV2 = "00000000-0000-0000-0000-00000000ac03";
const ANN = "00000000-0000-0000-0000-00000000ac04";

describeIfDb("POST /admin/announcements/:id/transitions", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${ANN}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
    await sql`DELETE FROM audit_log WHERE target_id = ${ANN}::uuid`;
    await sql`DELETE FROM announcements WHERE id = ${ANN}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
    for (const [id, role] of [
      [AUTHOR, "member"], [REV1, "staff"], [REV2, "staff"],
    ] as const) {
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"w-" + id}, ${"m-" + id}, ${id + "@t"}, ${role}::user_role)
      `;
    }
    await sql`
      INSERT INTO announcements (id, title, body, status, revision, author_id, scope)
      VALUES (
        ${ANN}::uuid, 'Transition Test', 'Body', 'draft'::artifact_status,
        1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${ANN}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${ANN}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
    await sql`DELETE FROM announcements WHERE id = ${ANN}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
  });

  test("author submits → in_review", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor(AUTHOR) },
      body: JSON.stringify({ action: "submit_for_review" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT status FROM announcements WHERE id = ${ANN}::uuid` as Array<{ status: string }>;
    expect(after[0].status).toBe("in_review");
  });

  test("reviewer 1 approves → still in_review", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(REV1) },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT status FROM announcements WHERE id = ${ANN}::uuid` as Array<{ status: string }>;
    expect(after[0].status).toBe("in_review");
  });

  test("reviewer 2 approves → published", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(REV2) },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT status FROM announcements WHERE id = ${ANN}::uuid` as Array<{ status: string }>;
    expect(after[0].status).toBe("published");
  });

  test("non-staff non-author cannot approve", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-00000000ac99") },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/announcements/transitions.test.ts
```

- [ ] **Step 3: Implement transitions.ts**

`packages/api/src/routes/admin/announcements/transitions.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { announcements } from "../../../db/schema";
import { applyTransition } from "../../../lib/lifecycle";
import { drizzleLifecycleDb } from "../../../lib/lifecycle/drizzleAdapter";
import { canEditArtifact, canReviewArtifact } from "../../../lib/policies";
import type { AppEnv } from "../../../types";

export const adminAnnouncementTransitionsRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const bodySchema = z.object({
  action: z.enum([
    "submit_for_review",
    "approve",
    "reject",
    "request_changes",
    "archive",
  ]),
  comment: z.string().max(4000).optional(),
});

adminAnnouncementTransitionsRoute.post(
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
      .select({ status: announcements.status, authorId: announcements.authorId })
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    if (body.action === "submit_for_review") {
      if (
        !canEditArtifact(actor, {
          entityType: "announcement",
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
      // archive — staff only
      if (actor.systemTier < 1) {
        return c.json({ ok: false, error: "forbidden" }, 403);
      }
    }

    const lifecycleDb = drizzleLifecycleDb(db, {
      id: actor.user.id,
      role: actor.user.role,
    });
    const result = await applyTransition(lifecycleDb, {
      entityType: "announcement",
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

- [ ] **Step 4: Mount BEFORE the bare `/:id` route**

In `packages/api/src/routes/admin/announcements/index.ts`, FINAL mount order:
```ts
adminAnnouncementsRoute.route("/:id/transitions", adminAnnouncementTransitionsRoute);
adminAnnouncementsRoute.route("/:id", adminAnnouncementByIdRoute);
```

- [ ] **Step 5: Tests + typecheck**

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/announcements/transitions.test.ts
cd ../.. && npm run typecheck
```

4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/announcements/transitions.ts \
        packages/api/src/routes/admin/announcements/transitions.test.ts \
        packages/api/src/routes/admin/announcements/index.ts
git commit -m "feat(api): admin announcement transitions endpoint"
```

---

## Task 4: POST `/admin/announcements/:id/comments`

**Files:**
- Create: `packages/api/src/routes/admin/announcements/comments.ts`
- Create: `packages/api/src/routes/admin/announcements/comments.test.ts`
- Modify: `packages/api/src/routes/admin/announcements/index.ts` (mount BEFORE `/:id`)

- [ ] **Step 1: Test**

`packages/api/src/routes/admin/announcements/comments.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-00000000ad01";
const STAFF = "00000000-0000-0000-0000-00000000ad02";
const ANN = "00000000-0000-0000-0000-00000000ad03";

describeIfDb("/admin/announcements/:id/comments", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${ANN}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM announcements WHERE id = ${ANN}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    for (const [id, role] of [
      [AUTHOR, "member"], [STAFF, "staff"],
    ] as const) {
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"w-" + id}, ${"m-" + id}, ${id + "@t"}, ${role}::user_role)
      `;
    }
    await sql`
      INSERT INTO announcements (id, title, body, status, revision, author_id, scope)
      VALUES (
        ${ANN}::uuid, 'Comments Test', 'Body', 'in_review'::artifact_status,
        1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${ANN}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM announcements WHERE id = ${ANN}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
  });

  test("staff posts a comment", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(STAFF) },
      body: JSON.stringify({ body: "Looks good." }),
    });
    expect(res.status).toBe(201);
  });

  test("author posts a comment", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor(AUTHOR) },
      body: JSON.stringify({ body: "Thanks, updating." }),
    });
    expect(res.status).toBe(201);
  });

  test("non-author non-staff blocked", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-00000000ad99") },
      body: JSON.stringify({ body: "should be blocked" }),
    });
    expect(res.status).toBe(403);
  });

  test("empty body rejected", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}/comments`, {
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
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/announcements/comments.test.ts
```

- [ ] **Step 3: Implement comments.ts**

`packages/api/src/routes/admin/announcements/comments.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { announcements, artifactComments } from "../../../db/schema";
import { sanitizeCommentBody } from "../../../lib/artifacts/comments";
import type { AppEnv } from "../../../types";

export const adminAnnouncementCommentsRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const bodySchema = z.object({ body: z.string() });

adminAnnouncementCommentsRoute.post(
  "/",
  zValidator("json", bodySchema, (result, c) => {
    if (!result.success) return c.json({ ok: false, error: "invalid_input" }, 400);
  }),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const actor = c.get("actor");
    if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
    const id = c.req.param("id");
    if (!id || !UUID_RE.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const existing = await db
      .select({ authorId: announcements.authorId })
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    if (actor.systemTier < 1 && existing.authorId !== actor.user.id) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }

    const sanitized = sanitizeCommentBody(c.req.valid("json").body);
    if (!sanitized.ok) return c.json({ ok: false, error: sanitized.error }, 400);

    const [row] = await db
      .insert(artifactComments)
      .values({
        entityType: "announcement",
        entityId: id,
        authorId: actor.user.id,
        body: sanitized.body,
      })
      .returning();

    return c.json({ ok: true, comment: row }, 201);
  }
);
```

- [ ] **Step 4: Mount**

In `packages/api/src/routes/admin/announcements/index.ts`, FINAL order:
```ts
adminAnnouncementsRoute.route("/:id/transitions", adminAnnouncementTransitionsRoute);
adminAnnouncementsRoute.route("/:id/comments", adminAnnouncementCommentsRoute);
adminAnnouncementsRoute.route("/:id", adminAnnouncementByIdRoute);
```

- [ ] **Step 5: Tests + typecheck**

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/announcements/comments.test.ts
cd ../.. && npm run typecheck
```

4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/announcements/comments.ts \
        packages/api/src/routes/admin/announcements/comments.test.ts \
        packages/api/src/routes/admin/announcements/index.ts
git commit -m "feat(api): admin announcement comments POST endpoint"
```

---

## Task 5: Admin `useAnnouncementsList` hook

**Files:**
- Create: `apps/admin/src/hooks/useAnnouncements.ts`

- [ ] **Step 1: Implement**

`apps/admin/src/hooks/useAnnouncements.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

export interface AnnouncementRow {
  id: string;
  title: string;
  status: string;
  revision: number;
  scope: string;
  authorId: string | null;
  hostGroupId: string | null;
  hostOrgId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function useAnnouncementsList(filters?: {
  status?: string;
  scope?: string;
  q?: string;
}) {
  const apiFetch = useApi();
  const [data, setData] = useState<AnnouncementRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.scope) params.set("scope", filters.scope);
      if (filters?.q) params.set("q", filters.q);
      const res = await apiFetch(`/admin/announcements?${params}`);
      if (!res.ok) {
        setError(`/admin/announcements responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as { rows: AnnouncementRow[] };
      setData(body.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [apiFetch, filters?.status, filters?.scope, filters?.q]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, refetch: load };
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/hooks/useAnnouncements.ts
git commit -m "feat(admin): useAnnouncementsList hook"
```

---

## Task 6: Admin announcements list page + sidebar nav

**Files:**
- Create: `apps/admin/src/pages/announcements/AnnouncementsListPage.tsx`
- Modify: `apps/admin/src/App.tsx` (add route)
- Modify: `apps/admin/src/layout/Sidebar.tsx` OR `apps/admin/src/hooks/useNavSections.ts` (whichever drives the sidebar — verify by reading)

- [ ] **Step 1: Read existing pattern**

Read `apps/admin/src/pages/events/EventsListPage.tsx` (from Plan 2). The announcements list mirrors it. Also read `apps/admin/src/hooks/useNavSections.ts` to determine whether the announcements entry needs to be added there (probably yes — that's how Events landed in Plan 2).

- [ ] **Step 2: Implement the list page**

`apps/admin/src/pages/announcements/AnnouncementsListPage.tsx`:

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAnnouncementsList } from "../../hooks/useAnnouncements";

const STATUS_OPTIONS = [
  "", "draft", "in_review", "changes_requested", "rejected",
  "published", "expired", "archived",
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  published: "Published",
  expired: "Expired",
  archived: "Archived",
};

export function AnnouncementsListPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const { data, error, loading } = useAnnouncementsList({
    status: statusFilter || undefined,
    q: query || undefined,
  });

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Announcements</p>
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          Announcements
        </h2>
        <Link
          to="/admin/announcements/new"
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600"
        >
          + New announcement
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
          placeholder="Search title…"
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
        <p className="admin-marginalia">No announcements match the filters.</p>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y" style={{ borderColor: "var(--admin-rule)" }}>
          {data.map((a) => (
            <li key={a.id} className="py-4">
              <Link to={`/admin/announcements/${a.id}`} className="block hover:bg-gray-50 -mx-3 px-3 py-2 rounded-md">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold">{a.title}</span>
                  <span className="admin-classification">{STATUS_LABEL[a.status] ?? a.status}</span>
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="admin-classification">{a.scope}</span>
                  {a.expiresAt && (
                    <span className="admin-classification">
                      expires {new Date(a.expiresAt).toLocaleDateString()}
                    </span>
                  )}
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

- [ ] **Step 3: Wire the route**

In `apps/admin/src/App.tsx`:
```tsx
import { AnnouncementsListPage } from "./pages/announcements/AnnouncementsListPage";

<Route path="announcements" element={<AnnouncementsListPage />} />
```

- [ ] **Step 4: Add to sidebar nav**

Read `apps/admin/src/hooks/useNavSections.ts`. Find where the Events entry is added (Plan 2 wired the existing entry). Add an Announcements entry following the same shape, placed sensibly in the order (probably after Events).

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/pages/announcements/AnnouncementsListPage.tsx \
        apps/admin/src/App.tsx \
        apps/admin/src/hooks/useNavSections.ts
git commit -m "feat(admin): announcements list page + sidebar nav"
```

---

## Task 7: Admin new-announcement compose page

**Files:**
- Create: `apps/admin/src/pages/announcements/NewAnnouncementPage.tsx`
- Modify: `apps/admin/src/App.tsx` (add route BEFORE `:id` route)

- [ ] **Step 1: Implement**

`apps/admin/src/pages/announcements/NewAnnouncementPage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

export function NewAnnouncementPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          linkUrl: linkUrl.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
        setError(err?.error ?? err?.message ?? `POST responded ${res.status}`);
        return;
      }
      const data = (await res.json()) as { announcement: { id: string } };
      navigate(`/admin/announcements/${data.announcement.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-animate-reveal max-w-2xl">
      <p className="admin-classification mb-6">US-RSE · Admin · Announcements · New</p>
      <h2 className="admin-display mb-8" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        New announcement
      </h2>
      {error && (
        <p className="mb-6 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <EditorialInput
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <EditorialTextarea
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          required
        />
        <EditorialInput
          label="Link URL (optional)"
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          hint="Optional link the banner CTA points to"
        />
        <EditorialInput
          label="Expires at (optional)"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          hint="After this time, the announcement auto-transitions to expired"
        />
        <button
          type="submit"
          disabled={saving || !title || !body}
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

`apps/admin/src/App.tsx`:
```tsx
import { NewAnnouncementPage } from "./pages/announcements/NewAnnouncementPage";

// AFTER /announcements list route, BEFORE any /announcements/:id route:
<Route path="announcements/new" element={<NewAnnouncementPage />} />
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/pages/announcements/NewAnnouncementPage.tsx apps/admin/src/App.tsx
git commit -m "feat(admin): new announcement compose page"
```

---

## Task 8: Admin announcement detail page (4 tabs)

**Files:**
- Create: `apps/admin/src/pages/announcements/AnnouncementDetailPage.tsx`
- Modify: `apps/admin/src/App.tsx` (route)

- [ ] **Step 1: Read the events detail page**

```bash
wc -l apps/admin/src/pages/events/EventDetailPage.tsx
```

Read it fully. The announcements detail page is structurally identical with these substitutions:
- Identity tab: title (instead of name + location + externalUrl) + scope + hostGroup/hostOrg attribution
- Content tab: body markdown + linkUrl + expiresAt (instead of startDate/endDate/description)
- Review tab: same as events (approval count, transition buttons gated by canTransition, review history, comment thread). Note that announcements have no `cancel` action — only `archive`. The transition button set is: submit_for_review/approve/reject/request_changes/archive (no cancel).
- Audit tab: same as events

- [ ] **Step 2: Implement**

`apps/admin/src/pages/announcements/AnnouncementDetailPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

type Tab = "identity" | "content" | "review" | "audit";

interface AnnouncementDetail {
  ok: true;
  announcement: {
    id: string;
    title: string;
    body: string;
    linkUrl: string | null;
    expiresAt: string | null;
    status: string;
    revision: number;
    scope: string;
    authorId: string | null;
    hostGroupId: string | null;
    hostOrgId: string | null;
    thumbnailKey: string | null;
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

export function AnnouncementDetailPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<AnnouncementDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftLinkUrl, setDraftLinkUrl] = useState("");
  const [draftExpiresAt, setDraftExpiresAt] = useState("");

  const [newComment, setNewComment] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/announcements/${id}`);
      if (!res.ok) {
        setError(`/admin/announcements/${id} responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as AnnouncementDetail;
      setData(body);
      setDraftTitle(body.announcement.title);
      setDraftBody(body.announcement.body);
      setDraftLinkUrl(body.announcement.linkUrl ?? "");
      setDraftExpiresAt(
        body.announcement.expiresAt
          ? new Date(body.announcement.expiresAt).toISOString().slice(0, 16)
          : ""
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchAnnouncement(body: Record<string, unknown>) {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/announcements/${data.announcement.id}`, {
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
      const res = await apiFetch(`/admin/announcements/${data.announcement.id}/transitions`, {
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
      const res = await apiFetch(`/admin/announcements/${data.announcement.id}/comments`, {
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

  const a = data.announcement;
  const isStaff = actor.systemTier >= 1;
  const isAuthor = actor.user.id === a.authorId;
  const canTransition = isStaff || (isAuthor && (a.status === "draft" || a.status === "changes_requested"));

  const currentRevApprovals = data.reviews
    .filter((r) => r.decision === "approve" && r.entityRevision === a.revision)
    .map((r) => r.reviewerId);
  const uniqueApprovals = new Set(currentRevApprovals).size;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Announcements · {a.title}</p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {a.title}
      </h2>
      <div className="flex items-center gap-4 mb-10">
        <span className="admin-classification">{a.scope}</span>
        <span className="admin-classification">{a.status}</span>
        <span className="admin-classification">rev {a.revision}</span>
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
            label="Title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
          />
          <button
            type="button"
            disabled={acting}
            onClick={() => patchAnnouncement({
              title: draftTitle.trim() || undefined,
            })}
            className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Save identity
          </button>
        </section>
      )}

      {tab === "content" && (
        <section className="max-w-2xl space-y-6">
          <EditorialTextarea
            label="Body"
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            rows={8}
          />
          <EditorialInput
            label="Link URL"
            value={draftLinkUrl}
            onChange={(e) => setDraftLinkUrl(e.target.value)}
          />
          <EditorialInput
            label="Expires at"
            type="datetime-local"
            value={draftExpiresAt}
            onChange={(e) => setDraftExpiresAt(e.target.value)}
          />
          <button
            type="button"
            disabled={acting}
            onClick={() => patchAnnouncement({
              body: draftBody.trim() || undefined,
              linkUrl: draftLinkUrl.trim() || null,
              expiresAt: draftExpiresAt ? new Date(draftExpiresAt).toISOString() : null,
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
              Approvals on revision {a.revision}: {uniqueApprovals} of 2
            </p>
            <div className="flex gap-3 flex-wrap">
              {canTransition && a.status === "draft" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("submit_for_review")}
                  className="px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Submit for review
                </button>
              )}
              {canTransition && a.status === "changes_requested" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("submit_for_review")}
                  className="px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Resubmit
                </button>
              )}
              {isStaff && a.status === "in_review" && !isAuthor && (
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
              {isStaff && a.status === "published" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("archive")}
                  className="px-5 py-2 rounded-md bg-gray-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Archive
                </button>
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
        <Link to="/admin/announcements">← Back to announcements</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Wire route**

`apps/admin/src/App.tsx`:
```tsx
import { AnnouncementDetailPage } from "./pages/announcements/AnnouncementDetailPage";

// AFTER /announcements/new:
<Route path="announcements/:id" element={<AnnouncementDetailPage />} />
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/pages/announcements/AnnouncementDetailPage.tsx apps/admin/src/App.tsx
git commit -m "feat(admin): announcement detail page with identity/content/review/audit tabs"
```

---

## Task 9: Public `<SiteBanner />` component

**Files:**
- Create: `apps/web/src/components/SiteBanner.tsx`
- Modify: `apps/web/src/App.tsx` (mount the banner in the public shell)

- [ ] **Step 1: Implement the component**

`apps/web/src/components/SiteBanner.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

interface Banner {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
}

const DISMISS_KEY_PREFIX = "dismissed_banner_";

export function SiteBanner() {
  const apiFetch = useApi();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/announcements/active-banner");
        if (cancelled || !res.ok) return;
        const body = (await res.json()) as { banner: Banner | null };
        if (cancelled) return;
        if (!body.banner) {
          setBanner(null);
          return;
        }
        // Check localStorage for prior dismissal
        try {
          if (window.localStorage.getItem(DISMISS_KEY_PREFIX + body.banner.id)) {
            setDismissed(true);
          }
        } catch {
          /* localStorage may be disabled; show banner anyway */
        }
        setBanner(body.banner);
      } catch {
        /* swallow — banner is a nice-to-have */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  function onDismiss() {
    if (!banner) return;
    try {
      window.localStorage.setItem(DISMISS_KEY_PREFIX + banner.id, "1");
    } catch {
      /* localStorage may be disabled */
    }
    setDismissed(true);
  }

  if (!banner || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-purple-700 text-white"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {banner.title}
          </p>
          <p className="text-sm text-purple-100 line-clamp-1">{banner.body}</p>
        </div>
        {banner.linkUrl && (
          <a
            href={banner.linkUrl}
            className="text-sm underline hover:text-white font-semibold whitespace-nowrap"
          >
            Learn more →
          </a>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className="text-purple-100 hover:text-white p-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount in the public shell**

Read `apps/web/src/App.tsx` to find where the global Nav / chrome lives. Mount `<SiteBanner />` at the top of the rendered tree, ABOVE the Nav. The banner should appear on every public page until dismissed.

Add the import:
```tsx
import { SiteBanner } from "./components/SiteBanner";
```

Insert `<SiteBanner />` inside the BrowserRouter, above the existing layout chrome (probably above `<Nav />` or the page container, depending on what's there now).

If the app uses an `AppShell` or similar wrapper component, mount the banner inside that wrapper. Verify by reading the file before placing.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Visual smoke (optional)**

If you can run `npm run dev` for `apps/web`, browse the homepage. Banner should NOT render (no published announcement with a posted site_banner channel yet — the active-banner endpoint returns `{ banner: null }`). Plan 5 will wire the broadcast channel flow that makes banners actually post.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/SiteBanner.tsx apps/web/src/App.tsx
git commit -m "feat(web): SiteBanner component with localStorage dismiss"
```

---

## Task 10: Full test suite + typecheck

- [ ] **Step 1: Full API test run with DB**

```bash
cd packages/api && set -a && source .dev.vars && set +a && TEST_BYPASS_AUTH=1 npm test
cd ../..
```

Expected: 216 + ~18 new = ~234 tests pass.

- [ ] **Step 2: Without DB — should skip integration suites**

```bash
cd packages/api && unset DATABASE_URL && unset TEST_BYPASS_AUTH && npm test
cd ../..
```

Expected: unit tests pass, integration suites skip.

- [ ] **Step 3: Full repo typecheck**

```bash
npm run typecheck
```

Expected: 5/5 packages clean.

---

## Task 11: Push branch + open PR

- [ ] **Step 1: Push**

```bash
git push -u origin cdcore09/announcements-implementation
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --base cdcore09/site-redesign --title "feat: announcements subsystem (admin + site banner)" --body "$(cat <<'EOF'
## Summary

Plan 3 of 5 from the events / announcements / forms brainstorm. Lands the announcements admin + the public `<SiteBanner />` on top of the Plan 1 foundation (#1994) and Plan 2 event-admin patterns (#1998).

### Admin API
- `POST/GET /admin/announcements` — create draft + list with filters (status/scope/host/q)
- `GET/PATCH /admin/announcements/:id` — detail (with reviews/comments/audit) + patch gated by `canEditArtifact`
- `POST /admin/announcements/:id/transitions` — wraps `applyTransition` with per-action policy gates
- `POST /admin/announcements/:id/comments` — comment endpoint using `sanitizeCommentBody`

### Admin UI
- `/admin/announcements` list with status filter + search
- `/admin/announcements/new` compose form
- `/admin/announcements/:id` detail page with Identity / Content / Review / Audit tabs (Broadcast deferred to Plan 5; attached forms deferred to Plan 4)
- Sidebar nav entry added

### Public UI
- `<SiteBanner />` mounted in the public app shell. Calls `GET /announcements/active-banner` (already shipped from Plan 1) and renders the banner when one is active. Dismissible per banner-id via localStorage.
- Returns null today since no announcement has a `posted` `site_banner` channel yet (Plan 5 wires the broadcast flow that flips channels to posted).

## Stats

- ~10 commits, atomic, conventional, **zero AI attribution**
- ~18 new vitest tests on top of 216 → ~234 total pass
- Full repo typecheck clean

## Test plan

- [ ] CI green (Cloudflare Pages preview deploys)
- [ ] Manual: super_admin creates an announcement, submits, second super_admin approves twice — announcement publishes
- [ ] Manual: until Plan 5 ships, the banner does not appear (active-banner returns null) — visit `/` and confirm no banner renders
- [ ] Manual: announcement with `expiresAt` in the past auto-transitions to `expired` (read-time `effectiveStatus` logic from Plan 1)

## Plan + spec

- Spec: `docs/superpowers/specs/2026-05-20-events-announcements-forms-design.md`
- Plan: `docs/superpowers/plans/2026-05-27-announcements-implementation.md`
- Builds on: PR #1994 (Plan 1 foundation), PR #1998 (Plan 2 events)

## Deferred to subsequent plans

- Broadcast tab on announcement detail — Plan 5 (makes banners actually appear via channel approval)
- Attached form section — Plan 4
- Public `/announcements` index page — spec §7.4 defers indefinitely
EOF
)"
```

- [ ] **Step 3: Verify CI**

```bash
sleep 10 && gh pr checks
```

Expected: Cloudflare Pages previews green; CircleCI legacy may error (expected).

---

## Wrap

Plan 3 (Announcements) is done when:

1. PR opened against `cdcore09/site-redesign`.
2. Full vitest suite passes (~234 tests) with DB env set.
3. Full typecheck clean.
4. Manual smoke confirms create → submit → 2-approve → publish.
5. Banner endpoint returns null on a clean DB (Plan 5 will flip channels to make banners visible).

**Next:** Plan 4 (Forms + Coltorapps builder) or Plan 5 (Broadcast subsystem).

---

## Summary

This plan adds announcements as the second user-facing artifact, sitting on top of Plan 1's foundation and reusing Plan 2's admin patterns wholesale. Admin gets full CRUD + lifecycle + comments + audit; the public site gets a `<SiteBanner />` that consumes the already-shipped active-banner endpoint. Banners become visible once Plan 5 wires the broadcast channel approval flow.

## Test plan

- [ ] All vitest unit + integration tests pass (~234 total)
- [ ] PR CI green on Cloudflare Pages checks
- [ ] Admin happy path verified manually: create → submit → 2x approve → publish
- [ ] Banner component renders nothing on clean DB (active-banner returns null until Plan 5 lands)
