# Broadcast Dispatcher (Plan 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the broadcast flow for events and announcements: authors request channels at submit, reviewers approve per-channel, on publish a dispatcher fires native channels (`site_banner` DB-only flip, `workspace_chat` via Slack webhook), and external social rows land in a manual-handoff sub-queue at `/admin/broadcasts`.

**Architecture:** A new library `packages/api/src/lib/broadcast/` exposes `dispatchDbEffects` (phase 1: flip approved site_banner rows to posted) and `dispatchOutbound` (phase 2: post to Slack webhook for workspace_chat rows). Both are called from `applyTransition` immediately after a successful flip to `published`, and from new `/admin/broadcasts/channels/:id/approve` and `/retry` handlers for the late-addition fallback. A new Hono sub-app at `/admin/broadcasts/*` provides the sub-queue and per-channel actions. The public site gains `/announcements/:slug` detail pages. Author UI extends `SubmitEventPage` and `NewAnnouncementPage` with a "Promote this …" section; reviewer UI is a new `BroadcastPanel` on the admin event and announcement detail pages.

**Tech Stack:** Hono on Cloudflare Workers, Drizzle (`drizzle-orm/neon-http` — **no** transactions), Neon Postgres, React + react-router on the web/admin SPAs, Vitest. Spec at `docs/superpowers/specs/2026-05-29-broadcast-dispatcher-design.md`.

---

## Pre-flight context for the implementor

- The repo uses Neon's HTTP driver, which does **not** support `db.transaction()`. `applyTransition` is sequential; the dispatcher follows the same convention. Do not introduce `db.transaction(...)` — it will throw at runtime.
- The lifecycle `LifecycleDb` interface (`packages/api/src/lib/lifecycle/applyTransition.ts`) is the seam between `applyTransition` and Drizzle. We will extend it with two new methods rather than threading raw `db` through `applyTransition`.
- Admin route mount order is `requireAuth` → `requireActorContext` → `auditMiddleware`. The new `/admin/broadcasts` router mounts under this chain — handlers may assume `c.var.actor` is set.
- Migration files are generated via `npm run db:generate` in `packages/api/` and live in `packages/api/migrations/`. The journal `migrations/meta/_journal.json` is auto-updated. Generated files are edited by hand to add backfill statements when needed (see `0015_legacy_visibility_backfill.sql` for the pattern).
- Test helpers in `packages/api/src/test/helpers.ts` bypass auth via `Authorization: test:<role>:<userId>`. `TEST_BYPASS_AUTH=1` must be set (already in `testApp`).
- Existing endpoint `GET /announcements/active-banner` returns `{ banner: { id, title, body, linkUrl } | null }`. We will add `slug` to this response shape — the SPA's `<SiteBanner />` will consume it.
- Existing public event detail page already lives at `apps/web/src/pages/events/EventDetailPage.tsx` — no changes there. Announcement detail page is **new**.

---

## File structure

### `packages/api/`

**Create:**
- `migrations/0023_broadcast_plan5.sql` — slug + observability columns + sub-queue index
- `src/lib/broadcast/dispatcher.ts` — `dispatchDbEffects`, `dispatchOutbound`
- `src/lib/broadcast/dispatcher.test.ts`
- `src/lib/broadcast/chatAdapter.ts` — Slack webhook adapter
- `src/lib/broadcast/chatAdapter.test.ts`
- `src/routes/admin/broadcasts/index.ts` — mount
- `src/routes/admin/broadcasts/queue.ts` — `GET /queue`
- `src/routes/admin/broadcasts/channelActions.ts` — `approve`, `decline`, `mark-posted`, `retry`
- `src/routes/admin/broadcasts/addChannel.ts` — `POST /requests/:requestId/channels`
- `src/routes/admin/broadcasts/queue.test.ts`
- `src/routes/admin/broadcasts/channelActions.test.ts`
- `src/routes/admin/broadcasts/addChannel.test.ts`

**Modify:**
- `src/db/schema/announcements.ts` — add `slug` column
- `src/db/schema/artifacts.ts` — add `lastError`, `lastAttemptedAt`, `attemptCount` on `broadcastChannels`
- `src/lib/lifecycle/applyTransition.ts` — call dispatcher after publish status flip
- `src/lib/lifecycle/drizzleAdapter.ts` — implement two new `LifecycleDb` methods
- `src/lib/lifecycle/applyTransition.test.ts` — assert dispatcher hook
- `src/routes/announcements.ts` — add `slug` to active-banner response; add `GET /:slug`
- `src/routes/announcements.test.ts` — cover new endpoint + new field
- `src/routes/eventsSubmit.ts` — accept `broadcast` field
- `src/routes/eventsSubmit.test.ts` — cover broadcast field
- `src/routes/admin/announcements/index.ts` — accept `broadcast` field in create
- `src/routes/admin/announcements/index.test.ts` — cover broadcast field
- `src/routes/admin/index.ts` — mount `/broadcasts`
- `src/types.ts` — add `WORKSPACE_CHAT_WEBHOOK?: string` binding
- `wrangler.jsonc` — document new var (no value)

### `apps/web/`

**Create:**
- `src/pages/announcements/AnnouncementDetailPage.tsx`
- `src/components/events/PromoteEventSection.tsx` — shared author UI

**Modify:**
- `src/App.tsx` — add `/announcements/:slug` route
- `src/components/SiteBanner.tsx` — link defaults to `/announcements/:slug` when `linkUrl` null
- `src/pages/events/SubmitEventPage.tsx` — render `<PromoteEventSection />`

### `apps/admin/`

**Create:**
- `src/components/broadcast/BroadcastPanel.tsx` — shared reviewer panel
- `src/components/broadcast/PromoteSection.tsx` — shared author UI (mirror of web's)
- `src/pages/broadcasts/BroadcastsQueuePage.tsx`

**Modify:**
- `src/App.tsx` — add `/broadcasts` route
- `src/layout/AdminNav.tsx` — add Broadcasts nav item + badge
- `src/pages/announcements/NewAnnouncementPage.tsx` — render `<PromoteSection />`
- `src/pages/announcements/AnnouncementDetailPage.tsx` — render `<BroadcastPanel />`
- `src/pages/events/EventDetailPage.tsx` — render `<BroadcastPanel />`

---

# Phase A — Data model and public detail page

### Task 1: Migration 0023 — slug, observability columns, sub-queue index

**Files:**
- Modify: `packages/api/src/db/schema/announcements.ts`
- Modify: `packages/api/src/db/schema/artifacts.ts`
- Create: `packages/api/migrations/0023_broadcast_plan5.sql`
- Modify: `packages/api/migrations/meta/_journal.json` (auto-updated by drizzle-kit)
- Create: `packages/api/migrations/meta/0023_snapshot.json` (auto-generated)

- [ ] **Step 1: Update the announcements Drizzle schema**

Edit `packages/api/src/db/schema/announcements.ts`. Add a `slug` column after `id`. Make it `text` and `notNull`. Append a unique index on `slug`.

Replace the existing `announcements` table definition with the version below (only the changes are: `slug` field + unique index):

```ts
export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    status: artifactStatus("status").notNull().default("draft"),
    revision: integer("revision").notNull().default(1),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    scope: artifactScope("scope").notNull().default("community"),
    hostGroupId: uuid("host_group_id").references(() => groups.id, {
      onDelete: "set null",
    }),
    hostOrgId: uuid("host_org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    linkUrl: text("link_url"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    thumbnailKey: text("thumbnail_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("announcements_status_idx")
      .on(t.status, t.createdAt)
      .where(sql`deleted_at IS NULL`),
    uniqueIndex("announcements_slug_unique").on(t.slug),
  ]
);
```

Add `uniqueIndex` to the import list from `drizzle-orm/pg-core`.

- [ ] **Step 2: Update the broadcastChannels schema with observability columns**

Edit `packages/api/src/db/schema/artifacts.ts`. Inside `broadcastChannels`, add three columns after `preparedImageKey`:

```ts
lastError: text("last_error"),
lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
attemptCount: integer("attempt_count").notNull().default(0),
```

Add `integer` to the existing import line if missing (it is already there).

- [ ] **Step 3: Generate the migration**

Run:

```bash
cd packages/api && npm run db:generate
```

Expected: drizzle-kit prints "Generated 1 migration file" and creates `migrations/0023_<slug>.sql`. The exact slug portion is non-deterministic; rename the file to `0023_broadcast_plan5.sql` and update the matching entry in `migrations/meta/_journal.json` (the `tag` field) before committing.

- [ ] **Step 4: Edit the generated migration to add the slug backfill**

Open `packages/api/migrations/0023_broadcast_plan5.sql`. The generator will have produced something like `ALTER TABLE announcements ADD COLUMN slug text NOT NULL;`. That will fail against an existing table with rows. Replace it with the three-step backfill below. Keep all other generated statements (column additions for broadcast_channels, the manual-queue index, the unique constraint on slug — though we will reshape the slug block).

Final file shape (preserve any other generated statements between blocks; the comments are illustrative):

```sql
-- 1. announcements gain a public slug for the new detail page
ALTER TABLE "announcements" ADD COLUMN "slug" text;--> statement-breakpoint

UPDATE "announcements"
SET "slug" = lower(regexp_replace("title", '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr("id"::text, 1, 4)
WHERE "slug" IS NULL;--> statement-breakpoint

ALTER TABLE "announcements" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX "announcements_slug_unique" ON "announcements" ("slug");--> statement-breakpoint

-- 2. broadcast_channels gain delivery observability
ALTER TABLE "broadcast_channels" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "broadcast_channels" ADD COLUMN "last_attempted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "broadcast_channels" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint

-- 3. Drive the /admin/broadcasts manual-handoff sub-queue
CREATE INDEX "broadcast_channels_manual_queue_idx"
  ON "broadcast_channels" ("status", "channel", "decided_at" DESC)
  WHERE "status" = 'approved'
    AND "posted_at" IS NULL
    AND "channel" IN ('twitter_x', 'bluesky', 'mastodon', 'linkedin');--> statement-breakpoint
```

- [ ] **Step 5: Apply the migration locally**

Run:

```bash
cd packages/api && npm run db:migrate
```

Expected: drizzle-kit reports `0023_broadcast_plan5` applied. If you see a unique-violation on slug, re-check that step 4's backfill UPDATE ran before the `ALTER COLUMN SET NOT NULL` line.

- [ ] **Step 6: Verify schema in psql**

Run:

```bash
psql "$DATABASE_URL" -c "\d announcements" | grep slug
psql "$DATABASE_URL" -c "\d broadcast_channels" | grep -E "last_error|attempt_count"
psql "$DATABASE_URL" -c "\d+ broadcast_channels_manual_queue_idx" 2>/dev/null | head -5
```

Expected: `slug` shows as `not null`, observability columns are present, the partial index exists with the predicate on status / posted_at / channel.

- [ ] **Step 7: Typecheck**

Run:

```bash
cd <repo-root> && npm run typecheck
```

Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add packages/api/src/db/schema/announcements.ts \
        packages/api/src/db/schema/artifacts.ts \
        packages/api/migrations/0023_broadcast_plan5.sql \
        packages/api/migrations/meta/
git commit -m "feat(api): plan 5 migration — announcement slug, channel observability, sub-queue index"
```

---

### Task 2: Public `GET /announcements/:slug` endpoint

**Files:**
- Modify: `packages/api/src/routes/announcements.ts`
- Modify: `packages/api/src/routes/announcements.test.ts`

- [ ] **Step 1: Write failing tests for the new endpoint**

Append to `packages/api/src/routes/announcements.test.ts` (create if not yet present — the existing file may already have other tests; preserve them):

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testApp, makeStaffActor } from "../test/helpers";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function insertAnnouncement(args: {
  slug: string;
  title: string;
  body: string;
  status: string;
  scope: string;
}): Promise<string> {
  const rows = await sql/* sql */`
    INSERT INTO announcements (slug, title, body, status, scope)
    VALUES (${args.slug}, ${args.title}, ${args.body}, ${args.status}, ${args.scope})
    RETURNING id
  `;
  return rows[0].id as string;
}

describe("GET /announcements/:slug", () => {
  it("returns a published, public announcement to an anonymous viewer", async () => {
    const slug = `pub-${Date.now()}`;
    await insertAnnouncement({
      slug,
      title: "Public announcement",
      body: "Body text",
      status: "published",
      scope: "public",
    });

    const res = await testApp.request(`/announcements/${slug}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.announcement.slug).toBe(slug);
    expect(json.announcement.title).toBe("Public announcement");
  });

  it("returns 404 for a draft", async () => {
    const slug = `draft-${Date.now()}`;
    await insertAnnouncement({
      slug,
      title: "Draft",
      body: "Body",
      status: "draft",
      scope: "public",
    });
    const res = await testApp.request(`/announcements/${slug}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 to anonymous when scope is community", async () => {
    const slug = `comm-${Date.now()}`;
    await insertAnnouncement({
      slug,
      title: "Community",
      body: "Body",
      status: "published",
      scope: "community",
    });
    const res = await testApp.request(`/announcements/${slug}`);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run tests; confirm they fail**

```bash
cd packages/api && npx vitest run src/routes/announcements.test.ts
```

Expected: failures with 404 or 500 on the new endpoint (it doesn't exist yet).

- [ ] **Step 3: Implement the endpoint**

Append to `packages/api/src/routes/announcements.ts` (after the existing `active-banner` handler, before any sub-router mounts):

```ts
import { groups, organizations } from "../db/schema";

/**
 * GET /announcements/:slug
 *
 * Public detail page data. Visibility-filtered the same way /events/:slug is:
 *   - anonymous viewer sees only scope='public'
 *   - signed-in member also sees scope='community'
 *   - 'group' and 'staff_only' require staff
 * 404 for draft/in_review/expired or out-of-scope.
 */
announcementsRoute.get("/:slug", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "not_found" }, 404);
  const slug = c.req.param("slug");
  if (!slug) return c.json({ ok: false, error: "not_found" }, 404);
  const db = createDb(c.env.DATABASE_URL);

  const row = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.slug, slug),
        eq(announcements.status, "published"),
        isNull(announcements.deletedAt)
      )
    )
    .limit(1)
    .then((r) => r[0]);
  if (!row) return c.json({ ok: false, error: "not_found" }, 404);

  // Expired auto-effective-status: hide from public read
  if (row.expiresAt && row.expiresAt < new Date()) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }

  const actor = c.get("actor");
  if (row.scope === "community" && !actor) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }
  if (row.scope === "group" || row.scope === "staff_only") {
    if (!actor || actor.systemTier < 1) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  }

  const [hostGroup, hostOrg] = await Promise.all([
    row.hostGroupId
      ? db
          .select({ id: groups.id, name: groups.name, slug: groups.slug })
          .from(groups)
          .where(eq(groups.id, row.hostGroupId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    row.hostOrgId
      ? db
          .select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, row.hostOrgId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  return c.json({
    ok: true,
    announcement: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      body: row.body,
      linkUrl: row.linkUrl,
      scope: row.scope,
      expiresAt: row.expiresAt,
      hostGroup,
      hostOrg,
    },
  });
});
```

Add `isNull` to the import list from `drizzle-orm` if it isn't already there.

- [ ] **Step 4: Run tests; confirm they pass**

```bash
cd packages/api && npx vitest run src/routes/announcements.test.ts
```

Expected: all three new specs pass.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/routes/announcements.ts \
        packages/api/src/routes/announcements.test.ts
git commit -m "feat(api): public GET /announcements/:slug detail endpoint"
```

---

### Task 3: Surface `slug` in the active-banner response

**Files:**
- Modify: `packages/api/src/routes/announcements.ts`
- Modify: `packages/api/src/routes/announcements.test.ts`

- [ ] **Step 1: Write failing test**

Append to `announcements.test.ts`:

```ts
describe("GET /announcements/active-banner — slug in response", () => {
  it("includes slug on the banner payload when one is active", async () => {
    const slug = `banner-${Date.now()}`;
    const rows = await sql/* sql */`
      INSERT INTO announcements (slug, title, body, status, scope)
      VALUES (${slug}, 'Banner', 'Body', 'published', 'public')
      RETURNING id
    `;
    const announcementId = rows[0].id as string;

    const reqRows = await sql/* sql */`
      INSERT INTO broadcast_requests (entity_type, entity_id, created_by)
      VALUES ('announcement', ${announcementId},
              (SELECT id FROM users LIMIT 1))
      RETURNING id
    `;
    const reqId = reqRows[0].id as string;

    await sql/* sql */`
      INSERT INTO broadcast_channels
        (broadcast_request_id, channel, status, posted_at)
      VALUES
        (${reqId}, 'site_banner', 'posted', now())
    `;

    const res = await testApp.request("/announcements/active-banner");
    const json = await res.json();
    expect(json.banner).not.toBeNull();
    expect(json.banner.slug).toBe(slug);
  });
});
```

- [ ] **Step 2: Run test; confirm it fails on `slug` field missing**

```bash
cd packages/api && npx vitest run src/routes/announcements.test.ts -t "slug in response"
```

Expected: `expect(json.banner.slug).toBe(slug)` fails because `slug` is undefined.

- [ ] **Step 3: Add slug to the select + response in the active-banner handler**

In `packages/api/src/routes/announcements.ts`, edit the `active-banner` `.select({...})` to add `slug: announcements.slug,` and the response builder to add `slug: row.slug,`.

```ts
const row = await db
  .select({
    id: announcements.id,
    slug: announcements.slug,
    title: announcements.title,
    body: announcements.body,
    linkUrl: announcements.linkUrl,
    expiresAt: announcements.expiresAt,
  })
  // ... rest unchanged
```

```ts
return c.json({
  banner: {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    linkUrl: row.linkUrl,
  },
});
```

- [ ] **Step 4: Run test; confirm passes**

```bash
cd packages/api && npx vitest run src/routes/announcements.test.ts
```

Expected: all specs pass.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/routes/announcements.ts \
        packages/api/src/routes/announcements.test.ts
git commit -m "feat(api): include announcement slug in /active-banner payload"
```

---

# Phase B — Dispatcher library

### Task 4: Chat adapter (Slack incoming webhook)

**Files:**
- Modify: `packages/api/src/types.ts`
- Create: `packages/api/src/lib/broadcast/chatAdapter.ts`
- Create: `packages/api/src/lib/broadcast/chatAdapter.test.ts`

- [ ] **Step 1: Extend Bindings type**

Edit `packages/api/src/types.ts`. Add to the `Bindings` type after the existing fields:

```ts
/**
 * Slack incoming webhook URL for workspace_chat broadcast posts.
 * When #1924 (Zulip transition) lands, the URL value swaps and the
 * payload builder in chatAdapter.ts is rewritten — no callers change.
 * Optional so local dev / tests can run without it; adapter no-ops
 * when missing.
 */
WORKSPACE_CHAT_WEBHOOK?: string;
```

- [ ] **Step 2: Write failing tests**

Create `packages/api/src/lib/broadcast/chatAdapter.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { postToWorkspaceChat } from "./chatAdapter";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("postToWorkspaceChat", () => {
  it("returns webhook_unset error when env has no webhook", async () => {
    const result = await postToWorkspaceChat(
      { title: "T", preparedText: "P", linkUrl: "https://example.com" },
      {} as never
    );
    expect(result).toEqual({ ok: false, error: "webhook_unset" });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("POSTs a Slack blocks payload when webhook is set", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("ok", { status: 200 })
    );
    const result = await postToWorkspaceChat(
      { title: "Hi", preparedText: "Body", linkUrl: "https://example.com/x" },
      { WORKSPACE_CHAT_WEBHOOK: "https://hooks.slack.com/services/T/B/Z" } as never
    );
    expect(result).toEqual({ ok: true });
    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe("https://hooks.slack.com/services/T/B/Z");
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body as string);
    expect(body).toHaveProperty("blocks");
    expect(body.blocks[0].text.text).toContain("Hi");
    expect(body.blocks[1].text.text).toContain("Body");
    expect(body.blocks[2].elements[0].url).toBe("https://example.com/x");
  });

  it("returns ok:false with status text when webhook returns non-2xx", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("invalid_payload", { status: 400 })
    );
    const result = await postToWorkspaceChat(
      { title: "Hi", preparedText: "Body", linkUrl: "https://example.com" },
      { WORKSPACE_CHAT_WEBHOOK: "https://hooks.slack.com/services/X/Y/Z" } as never
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("400");
    }
  });

  it("returns ok:false on fetch throw", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("network down")
    );
    const result = await postToWorkspaceChat(
      { title: "Hi", preparedText: "Body", linkUrl: "https://example.com" },
      { WORKSPACE_CHAT_WEBHOOK: "https://hooks.slack.com/x" } as never
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.toLowerCase()).toContain("network");
    }
  });
});
```

- [ ] **Step 3: Run tests; confirm they fail (module not found)**

```bash
cd packages/api && npx vitest run src/lib/broadcast/chatAdapter.test.ts
```

Expected: failure with "Cannot find module './chatAdapter'".

- [ ] **Step 4: Implement the adapter**

Create `packages/api/src/lib/broadcast/chatAdapter.ts`:

```ts
import type { Bindings } from "../../types";

export type ChatPayload = {
  title: string;
  preparedText: string;
  linkUrl: string;
};

export type ChatResult =
  | { ok: true; postUrl?: string }
  | { ok: false; error: string };

/**
 * Post a message to the workspace chat (Slack today, Zulip after #1924).
 *
 * v1 body shape: Slack incoming webhook with a three-block layout.
 * Slack does NOT return a permalink in the webhook response, so
 * post_url stays undefined; Zulip will fill it in later.
 *
 * Failure modes returned as typed errors (never thrown):
 *   - "webhook_unset" — env var missing (dev/test).
 *   - "<status> <statusText>" — webhook returned non-2xx.
 *   - "<message>" — fetch threw (network/DNS/etc).
 */
export async function postToWorkspaceChat(
  payload: ChatPayload,
  env: Bindings
): Promise<ChatResult> {
  if (!env.WORKSPACE_CHAT_WEBHOOK) {
    return { ok: false, error: "webhook_unset" };
  }
  const body = buildSlackBlocks(payload);
  try {
    const res = await fetch(env.WORKSPACE_CHAT_WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { ok: false, error: `${res.status} ${res.statusText}`.trim() };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

function buildSlackBlocks(p: ChatPayload) {
  return {
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*${p.title}*` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: p.preparedText },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Learn more" },
            url: p.linkUrl,
          },
        ],
      },
    ],
  };
}
```

- [ ] **Step 5: Run tests; confirm passes**

```bash
cd packages/api && npx vitest run src/lib/broadcast/chatAdapter.test.ts
```

Expected: all four tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/types.ts \
        packages/api/src/lib/broadcast/chatAdapter.ts \
        packages/api/src/lib/broadcast/chatAdapter.test.ts
git commit -m "feat(api): workspace chat adapter (Slack incoming webhook)"
```

---

### Task 5: Dispatcher — `dispatchDbEffects` (phase 1, site_banner flip)

**Files:**
- Create: `packages/api/src/lib/broadcast/dispatcher.ts`
- Create: `packages/api/src/lib/broadcast/dispatcher.test.ts`

- [ ] **Step 1: Write failing tests for phase 1**

Create `packages/api/src/lib/broadcast/dispatcher.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { neon } from "@neondatabase/serverless";
import { dispatchDbEffects } from "./dispatcher";
import { createDb } from "../../db";

const sql = neon(process.env.DATABASE_URL!);
const db = createDb(process.env.DATABASE_URL!);

async function seedAnnouncement(slug: string): Promise<string> {
  const rows = await sql/* sql */`
    INSERT INTO announcements (slug, title, body, status, scope)
    VALUES (${slug}, 'T', 'B', 'published', 'public')
    RETURNING id
  `;
  return rows[0].id as string;
}

async function seedActor(): Promise<string> {
  const rows = await sql`SELECT id FROM users LIMIT 1`;
  return rows[0].id as string;
}

async function seedBroadcast(args: {
  entityId: string;
  channels: Array<{ channel: string; status: string }>;
  actorId: string;
}): Promise<{ requestId: string; channelIds: string[] }> {
  const reqRows = await sql/* sql */`
    INSERT INTO broadcast_requests (entity_type, entity_id, created_by)
    VALUES ('announcement', ${args.entityId}, ${args.actorId})
    RETURNING id
  `;
  const requestId = reqRows[0].id as string;
  const channelIds: string[] = [];
  for (const c of args.channels) {
    const r = await sql/* sql */`
      INSERT INTO broadcast_channels (broadcast_request_id, channel, status)
      VALUES (${requestId}, ${c.channel}, ${c.status})
      RETURNING id
    `;
    channelIds.push(r[0].id as string);
  }
  return { requestId, channelIds };
}

describe("dispatchDbEffects", () => {
  it("flips approved site_banner channels to posted", async () => {
    const actorId = await seedActor();
    const entityId = await seedAnnouncement(`disp-${Date.now()}-banner`);
    const { channelIds } = await seedBroadcast({
      entityId,
      actorId,
      channels: [{ channel: "site_banner", status: "approved" }],
    });
    const result = await dispatchDbEffects(db, {
      type: "announcement",
      id: entityId,
    }, actorId);
    expect(result.siteBannerPosted).toBe(1);
    const after = await sql/* sql */`
      SELECT status, posted_by FROM broadcast_channels WHERE id = ${channelIds[0]}
    `;
    expect(after[0].status).toBe("posted");
    expect(after[0].posted_by).toBe(actorId);
  });

  it("ignores requested (not approved) site_banner channels", async () => {
    const actorId = await seedActor();
    const entityId = await seedAnnouncement(`disp-${Date.now()}-req`);
    const { channelIds } = await seedBroadcast({
      entityId,
      actorId,
      channels: [{ channel: "site_banner", status: "requested" }],
    });
    const result = await dispatchDbEffects(db, {
      type: "announcement",
      id: entityId,
    }, actorId);
    expect(result.siteBannerPosted).toBe(0);
    const after = await sql/* sql */`
      SELECT status FROM broadcast_channels WHERE id = ${channelIds[0]}
    `;
    expect(after[0].status).toBe("requested");
  });

  it("is idempotent — already-posted rows are skipped", async () => {
    const actorId = await seedActor();
    const entityId = await seedAnnouncement(`disp-${Date.now()}-idem`);
    await seedBroadcast({
      entityId,
      actorId,
      channels: [{ channel: "site_banner", status: "posted" }],
    });
    const result = await dispatchDbEffects(db, {
      type: "announcement",
      id: entityId,
    }, actorId);
    expect(result.siteBannerPosted).toBe(0);
  });

  it("does not touch workspace_chat or manual channels", async () => {
    const actorId = await seedActor();
    const entityId = await seedAnnouncement(`disp-${Date.now()}-mix`);
    const { channelIds } = await seedBroadcast({
      entityId,
      actorId,
      channels: [
        { channel: "workspace_chat", status: "approved" },
        { channel: "twitter_x", status: "approved" },
      ],
    });
    await dispatchDbEffects(db, { type: "announcement", id: entityId }, actorId);
    const after = await sql/* sql */`
      SELECT id, status FROM broadcast_channels WHERE id = ANY(${channelIds}::uuid[])
    `;
    for (const row of after) {
      expect(row.status).toBe("approved");
    }
  });
});
```

- [ ] **Step 2: Run tests; confirm they fail**

```bash
cd packages/api && npx vitest run src/lib/broadcast/dispatcher.test.ts
```

Expected: failure with "Cannot find module './dispatcher'".

- [ ] **Step 3: Implement `dispatchDbEffects`**

Create `packages/api/src/lib/broadcast/dispatcher.ts`:

```ts
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../../db";
import { broadcastChannels, broadcastRequests } from "../../db/schema";

export type DispatchEntity = {
  type: "event" | "announcement";
  id: string;
};

/**
 * Phase 1 of the dispatcher. DB-only effects: flip approved site_banner
 * channels for the given artifact to posted, stamping posted_at and
 * posted_by. Idempotent — already-posted channels are skipped by the
 * WHERE clause.
 *
 * Called from applyTransition immediately after a successful publish flip,
 * and from the channel-approval handler for late additions. Workspace
 * chat and manual channels are not touched here — phase 2 / sub-queue
 * handle them.
 */
export async function dispatchDbEffects(
  db: Database,
  entity: DispatchEntity,
  actorId: string
): Promise<{ siteBannerPosted: number }> {
  const result = await db
    .update(broadcastChannels)
    .set({
      status: "posted",
      postedAt: new Date(),
      postedBy: actorId,
    })
    .where(
      and(
        eq(broadcastChannels.status, "approved"),
        eq(broadcastChannels.channel, "site_banner"),
        sql`${broadcastChannels.broadcastRequestId} IN (
          SELECT id FROM ${broadcastRequests}
          WHERE entity_type = ${entity.type}
            AND entity_id = ${entity.id}
        )`
      )
    )
    .returning({ id: broadcastChannels.id });

  return { siteBannerPosted: result.length };
}
```

- [ ] **Step 4: Run tests; confirm all four pass**

```bash
cd packages/api && npx vitest run src/lib/broadcast/dispatcher.test.ts
```

Expected: all four phase-1 tests pass. Idempotency test passes because `status = 'approved'` in the WHERE clause excludes already-posted rows.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/lib/broadcast/dispatcher.ts \
        packages/api/src/lib/broadcast/dispatcher.test.ts
git commit -m "feat(api): dispatcher phase 1 — flip approved site_banner channels"
```

---

### Task 6: Dispatcher — `dispatchOutbound` (phase 2, workspace_chat posts)

**Files:**
- Modify: `packages/api/src/lib/broadcast/dispatcher.ts`
- Modify: `packages/api/src/lib/broadcast/dispatcher.test.ts`

- [ ] **Step 1: Write failing tests for phase 2**

Append to `packages/api/src/lib/broadcast/dispatcher.test.ts`:

```ts
import { dispatchOutbound } from "./dispatcher";
import { vi, beforeEach, afterEach } from "vitest";

const originalFetch = globalThis.fetch;

describe("dispatchOutbound", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("posts workspace_chat channels and flips them to posted on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("ok", { status: 200 })
    );
    const actorId = await seedActor();
    const entityId = await seedAnnouncement(`out-${Date.now()}-ok`);
    const { channelIds } = await seedBroadcast({
      entityId,
      actorId,
      channels: [{ channel: "workspace_chat", status: "approved" }],
    });

    const summary = await dispatchOutbound(
      db,
      { type: "announcement", id: entityId },
      {
        WORKSPACE_CHAT_WEBHOOK: "https://hooks.slack.com/x",
      } as never,
      actorId
    );
    expect(summary.workspaceChatPosted).toBe(1);
    expect(summary.workspaceChatFailed).toBe(0);

    const after = await sql/* sql */`
      SELECT status, posted_by FROM broadcast_channels WHERE id = ${channelIds[0]}
    `;
    expect(after[0].status).toBe("posted");
    expect(after[0].posted_by).toBe(actorId);
  });

  it("records last_error and increments attempt_count on webhook failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("bad", { status: 500 })
    );
    const actorId = await seedActor();
    const entityId = await seedAnnouncement(`out-${Date.now()}-fail`);
    const { channelIds } = await seedBroadcast({
      entityId,
      actorId,
      channels: [{ channel: "workspace_chat", status: "approved" }],
    });

    const summary = await dispatchOutbound(
      db,
      { type: "announcement", id: entityId },
      { WORKSPACE_CHAT_WEBHOOK: "https://hooks.slack.com/x" } as never,
      actorId
    );
    expect(summary.workspaceChatPosted).toBe(0);
    expect(summary.workspaceChatFailed).toBe(1);

    const after = await sql/* sql */`
      SELECT status, last_error, attempt_count
      FROM broadcast_channels WHERE id = ${channelIds[0]}
    `;
    expect(after[0].status).toBe("approved");
    expect(after[0].last_error).toContain("500");
    expect(after[0].attempt_count).toBe(1);
  });

  it("is idempotent — already-posted channels are not re-fired", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("ok", { status: 200 })
    );
    const actorId = await seedActor();
    const entityId = await seedAnnouncement(`out-${Date.now()}-idem`);
    await seedBroadcast({
      entityId,
      actorId,
      channels: [{ channel: "workspace_chat", status: "posted" }],
    });
    const summary = await dispatchOutbound(
      db,
      { type: "announcement", id: entityId },
      { WORKSPACE_CHAT_WEBHOOK: "https://hooks.slack.com/x" } as never,
      actorId
    );
    expect(summary.workspaceChatPosted).toBe(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("does not touch manual channels", async () => {
    const actorId = await seedActor();
    const entityId = await seedAnnouncement(`out-${Date.now()}-man`);
    const { channelIds } = await seedBroadcast({
      entityId,
      actorId,
      channels: [{ channel: "twitter_x", status: "approved" }],
    });
    const summary = await dispatchOutbound(
      db,
      { type: "announcement", id: entityId },
      { WORKSPACE_CHAT_WEBHOOK: "https://hooks.slack.com/x" } as never,
      actorId
    );
    expect(summary.workspaceChatPosted).toBe(0);
    expect(summary.workspaceChatFailed).toBe(0);
    const after = await sql/* sql */`
      SELECT status FROM broadcast_channels WHERE id = ${channelIds[0]}
    `;
    expect(after[0].status).toBe("approved");
  });
});
```

- [ ] **Step 2: Run tests; confirm they fail (import or symbol missing)**

```bash
cd packages/api && npx vitest run src/lib/broadcast/dispatcher.test.ts
```

Expected: `dispatchOutbound` import resolves to undefined or import fails.

- [ ] **Step 3: Implement `dispatchOutbound`**

Append to `packages/api/src/lib/broadcast/dispatcher.ts`:

```ts
import type { Bindings } from "../../types";
import { announcements, events } from "../../db/schema";
import { postToWorkspaceChat } from "./chatAdapter";

export type DispatchSummary = {
  siteBannerPosted: number;
  workspaceChatPosted: number;
  workspaceChatFailed: number;
};

/**
 * Phase 2 of the dispatcher. Outbound network calls only: post each
 * approved workspace_chat channel for the artifact, flip to 'posted' on
 * success, record last_error / increment attempt_count on failure
 * (leaving status='approved' so /admin/broadcasts retries can pick it up).
 *
 * Idempotent — already-posted channels are filtered out by status='approved'.
 */
export async function dispatchOutbound(
  db: Database,
  entity: DispatchEntity,
  env: Bindings,
  actorId: string
): Promise<{ workspaceChatPosted: number; workspaceChatFailed: number }> {
  // Load parent artifact for payload composition
  const artifact = await loadArtifactForPayload(db, entity);
  if (!artifact) {
    return { workspaceChatPosted: 0, workspaceChatFailed: 0 };
  }

  const rows = await db
    .select({
      id: broadcastChannels.id,
      preparedText: broadcastChannels.preparedText,
    })
    .from(broadcastChannels)
    .innerJoin(
      broadcastRequests,
      eq(broadcastChannels.broadcastRequestId, broadcastRequests.id)
    )
    .where(
      and(
        eq(broadcastRequests.entityType, entity.type),
        eq(broadcastRequests.entityId, entity.id),
        eq(broadcastChannels.channel, "workspace_chat"),
        eq(broadcastChannels.status, "approved")
      )
    );

  let posted = 0;
  let failed = 0;
  for (const row of rows) {
    const result = await postToWorkspaceChat(
      {
        title: artifact.title,
        preparedText: row.preparedText ?? artifact.fallbackText,
        linkUrl: artifact.linkUrl,
      },
      env
    );
    if (result.ok) {
      await db
        .update(broadcastChannels)
        .set({
          status: "posted",
          postedAt: new Date(),
          postedBy: actorId,
          lastAttemptedAt: new Date(),
        })
        .where(eq(broadcastChannels.id, row.id));
      posted++;
    } else {
      await db
        .update(broadcastChannels)
        .set({
          lastError: result.error.slice(0, 1000),
          lastAttemptedAt: new Date(),
          attemptCount: sql`${broadcastChannels.attemptCount} + 1`,
        })
        .where(eq(broadcastChannels.id, row.id));
      failed++;
    }
  }
  return { workspaceChatPosted: posted, workspaceChatFailed: failed };
}

type PayloadArtifact = { title: string; fallbackText: string; linkUrl: string };

async function loadArtifactForPayload(
  db: Database,
  entity: DispatchEntity
): Promise<PayloadArtifact | null> {
  const baseUrl = "https://us-rse.org"; // matches the public web origin
  if (entity.type === "announcement") {
    const row = await db
      .select({
        slug: announcements.slug,
        title: announcements.title,
        body: announcements.body,
        linkUrl: announcements.linkUrl,
      })
      .from(announcements)
      .where(eq(announcements.id, entity.id))
      .limit(1)
      .then((r) => r[0]);
    if (!row) return null;
    return {
      title: row.title,
      fallbackText: row.body.slice(0, 280),
      linkUrl: row.linkUrl ?? `${baseUrl}/announcements/${row.slug}`,
    };
  }
  const row = await db
    .select({
      slug: events.slug,
      name: events.name,
      externalUrl: events.externalUrl,
      location: events.location,
    })
    .from(events)
    .where(eq(events.id, entity.id))
    .limit(1)
    .then((r) => r[0]);
  if (!row) return null;
  return {
    title: row.name,
    fallbackText: row.location ?? "New event posted",
    linkUrl: row.externalUrl ?? `${baseUrl}/events/${row.slug}`,
  };
}
```

- [ ] **Step 4: Run tests; confirm passes**

```bash
cd packages/api && npx vitest run src/lib/broadcast/dispatcher.test.ts
```

Expected: phase-1 tests still green, phase-2 tests now green.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/lib/broadcast/dispatcher.ts \
        packages/api/src/lib/broadcast/dispatcher.test.ts
git commit -m "feat(api): dispatcher phase 2 — workspace_chat outbound posts"
```

---

### Task 7: Wire dispatcher into `applyTransition` publish path

**Files:**
- Modify: `packages/api/src/lib/lifecycle/applyTransition.ts`
- Modify: `packages/api/src/lib/lifecycle/drizzleAdapter.ts`
- Modify: `packages/api/src/lib/lifecycle/applyTransition.test.ts`

- [ ] **Step 1: Extend LifecycleDb with a publish-side hook**

Edit `packages/api/src/lib/lifecycle/applyTransition.ts`. Inside the `LifecycleDb` interface, add a method:

```ts
runPublishDispatcher(args: {
  entityType: ArtifactEntityType;
  entityId: string;
  actorId: string;
}): Promise<void>;
```

In the `approve` case, after `updateArtifactStatus(... status: "published")` and before `insertAudit(...)`, call `await db.runPublishDispatcher({ entityType: input.entityType, entityId: input.entityId, actorId: input.actorId });`.

The dispatcher must not be called for `event` if and only if a future event-specific gating decision blocks it; for now it runs for both `event` and `announcement`. `form` does not have a broadcast flow in Plan 5, so the implementation in `drizzleAdapter.ts` will no-op when `entityType === 'form'`.

- [ ] **Step 2: Implement `runPublishDispatcher` on the Drizzle adapter**

Edit `packages/api/src/lib/lifecycle/drizzleAdapter.ts`. Inside `drizzleLifecycleDb(db, actor)`, return one more method:

```ts
async runPublishDispatcher({ entityType, entityId, actorId }) {
  if (entityType !== "event" && entityType !== "announcement") return;
  await dispatchDbEffects(db, { type: entityType, id: entityId }, actorId);
  // Phase 2 is fire-and-forget from lifecycle's perspective; failures
  // are recorded on the channel row and surfaced via the sub-queue.
  await dispatchOutbound(db, { type: entityType, id: entityId }, env, actorId);
},
```

Two adjustments required to make `env` available:

1. Add `env: Bindings` to the `drizzleLifecycleDb` constructor's third parameter. Update its signature:

```ts
export function drizzleLifecycleDb(
  db: Database,
  actor: { id: string; role: ActorRole },
  env: Bindings
): LifecycleDb {
```

2. Update all call sites: `packages/api/src/routes/admin/announcements/transitions.ts`, `packages/api/src/routes/admin/events/transitions.ts`, `packages/api/src/routes/admin/forms/transitions.ts`, and any others that construct `drizzleLifecycleDb`. Pass `c.env` as the third argument. Use grep to find them all:

```bash
cd packages/api && grep -rn "drizzleLifecycleDb(" src/ --include='*.ts'
```

For each match, change `drizzleLifecycleDb(db, { id: actor.user.id, role: actor.user.role })` to `drizzleLifecycleDb(db, { id: actor.user.id, role: actor.user.role }, c.env)`.

Add to top of `drizzleAdapter.ts`:

```ts
import type { Bindings } from "../../types";
import { dispatchDbEffects, dispatchOutbound } from "../broadcast/dispatcher";
```

- [ ] **Step 3: Write failing test for the hook**

Append to `packages/api/src/lib/lifecycle/applyTransition.test.ts`:

```ts
describe("applyTransition publish hook", () => {
  it("calls runPublishDispatcher when an approve transition flips status to published", async () => {
    const calls: Array<{ entityType: string; entityId: string; actorId: string }> = [];
    const stubDb: LifecycleDb = {
      ...makeStubLifecycleDb({
        artifact: {
          id: "ann-1",
          entityType: "announcement",
          status: "in_review",
          revision: 1,
          authorId: "author-x",
          effectiveStatusInputs: {},
        },
        approvalCountAfterInsert: 2, // hits PUBLISH_APPROVAL_THRESHOLD
      }),
      async runPublishDispatcher(args) {
        calls.push(args);
      },
    };
    const result = await applyTransition(stubDb, {
      entityType: "announcement",
      entityId: "ann-1",
      action: "approve",
      actorId: "reviewer-1",
    });
    expect(result).toEqual({ ok: true, newStatus: "published" });
    expect(calls).toEqual([
      { entityType: "announcement", entityId: "ann-1", actorId: "reviewer-1" },
    ]);
  });

  it("does NOT call runPublishDispatcher when approve does not reach threshold", async () => {
    const calls: Array<unknown> = [];
    const stubDb: LifecycleDb = {
      ...makeStubLifecycleDb({
        artifact: {
          id: "ann-2",
          entityType: "announcement",
          status: "in_review",
          revision: 1,
          authorId: "author-y",
          effectiveStatusInputs: {},
        },
        approvalCountAfterInsert: 1,
      }),
      async runPublishDispatcher(args) {
        calls.push(args);
      },
    };
    await applyTransition(stubDb, {
      entityType: "announcement",
      entityId: "ann-2",
      action: "approve",
      actorId: "reviewer-1",
    });
    expect(calls).toEqual([]);
  });
});
```

If `makeStubLifecycleDb` doesn't yet exist in the test file, the existing tests will have an equivalent helper (look at how existing tests in this file build the stub) — reuse that pattern and add `runPublishDispatcher: async () => {}` as a default.

- [ ] **Step 4: Run tests; confirm new ones fail**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/applyTransition.test.ts
```

Expected: the two new tests fail because `runPublishDispatcher` is not called (TypeScript may complain that the property doesn't exist on the existing test stubs — add `runPublishDispatcher: async () => {}` to those stubs to keep them compiling).

- [ ] **Step 5: Implement the hook in applyTransition**

In `packages/api/src/lib/lifecycle/applyTransition.ts`, inside the `approve` case, locate the block that calls `updateArtifactStatus({ ... status: "published" })`. Right after the `await db.updateArtifactStatus(...)` and BEFORE the `await db.insertAudit(...)` call, insert:

```ts
await db.runPublishDispatcher({
  entityType: input.entityType,
  entityId: input.entityId,
  actorId: input.actorId,
});
```

- [ ] **Step 6: Run tests; confirm all pass**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/applyTransition.test.ts
```

Expected: all green.

- [ ] **Step 7: Run the broader API test suite to confirm no regressions**

```bash
cd packages/api && npm test
```

Expected: no regressions. If a route test compile-fails on `drizzleLifecycleDb` missing the third arg, audit the grep from Step 2 — you missed a call site.

- [ ] **Step 8: Commit**

```bash
git add packages/api/src/lib/lifecycle/ \
        packages/api/src/routes/admin/announcements/transitions.ts \
        packages/api/src/routes/admin/events/transitions.ts \
        packages/api/src/routes/admin/forms/transitions.ts
git commit -m "feat(api): call broadcast dispatcher on publish transition"
```

---

# Phase C — Author submit broadcast extensions

### Task 8: Extend `POST /events/submit` with optional `broadcast` field

**Files:**
- Modify: `packages/api/src/routes/eventsSubmit.ts`
- Modify: `packages/api/src/routes/eventsSubmit.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `packages/api/src/routes/eventsSubmit.test.ts`:

```ts
describe("POST /events/submit — broadcast field", () => {
  const NOW = Date.now();
  it("creates the event without a broadcast_request when broadcast absent", async () => {
    const res = await testApp.request("/events/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: makeMemberActor(await seedActor()),
      },
      body: JSON.stringify({
        name: `Plain ${NOW}`,
        type: "meetup",
        startDate: "2026-09-01",
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    const reqRows = await sql/* sql */`
      SELECT id FROM broadcast_requests
      WHERE entity_type = 'event' AND entity_id = ${json.event.id}
    `;
    expect(reqRows.length).toBe(0);
  });

  it("creates a broadcast_request + channels when broadcast provided", async () => {
    const res = await testApp.request("/events/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: makeMemberActor(await seedActor()),
      },
      body: JSON.stringify({
        name: `Promoted ${NOW}`,
        type: "meetup",
        startDate: "2026-09-01",
        broadcast: {
          channels: ["site_banner", "workspace_chat", "twitter_x"],
          preparedText: "Custom preview text",
        },
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();

    const reqRows = await sql/* sql */`
      SELECT id FROM broadcast_requests
      WHERE entity_type = 'event' AND entity_id = ${json.event.id}
    `;
    expect(reqRows.length).toBe(1);

    const chanRows = await sql/* sql */`
      SELECT channel, status, prepared_text FROM broadcast_channels
      WHERE broadcast_request_id = ${reqRows[0].id}
      ORDER BY channel
    `;
    expect(chanRows.map((r) => r.channel).sort()).toEqual([
      "site_banner",
      "twitter_x",
      "workspace_chat",
    ]);
    for (const r of chanRows) {
      expect(r.status).toBe("requested");
      expect(r.prepared_text).toBe("Custom preview text");
    }
  });

  it("does NOT create a broadcast_request when channels is empty", async () => {
    const res = await testApp.request("/events/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: makeMemberActor(await seedActor()),
      },
      body: JSON.stringify({
        name: `Empty ${NOW}`,
        type: "meetup",
        startDate: "2026-09-01",
        broadcast: { channels: [] },
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    const reqRows = await sql/* sql */`
      SELECT id FROM broadcast_requests
      WHERE entity_type = 'event' AND entity_id = ${json.event.id}
    `;
    expect(reqRows.length).toBe(0);
  });
});
```

Add `seedActor` helper at the top of the test file if it doesn't exist (same pattern as in dispatcher.test.ts).

- [ ] **Step 2: Run tests; confirm they fail**

```bash
cd packages/api && npx vitest run src/routes/eventsSubmit.test.ts -t "broadcast field"
```

Expected: failures — either zod rejects unknown `broadcast` field, or the broadcast_request rows are not created.

- [ ] **Step 3: Extend the zod schema and handler**

Edit `packages/api/src/routes/eventsSubmit.ts`.

Replace the `submitBodySchema` with:

```ts
const BROADCAST_CHANNELS = [
  "site_banner",
  "workspace_chat",
  "newsletter",
  "twitter_x",
  "bluesky",
  "mastodon",
  "linkedin",
] as const;

const submitBodySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum([
    "conference",
    "workshop",
    "meetup",
    "webinar",
    "community_call",
    "other",
  ]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  externalUrl: z.string().url().max(500).optional(),
  hostOrgId: z.string().uuid().optional(),
  broadcast: z
    .object({
      channels: z.array(z.enum(BROADCAST_CHANNELS)).max(7),
      preparedText: z.string().max(2000).optional(),
    })
    .optional(),
});
```

After the event INSERT and BEFORE the `applyTransition(... submit_for_review)` call, insert the broadcast persistence:

```ts
if (body.broadcast && body.broadcast.channels.length > 0) {
  const [requestRow] = await db
    .insert(broadcastRequests)
    .values({
      entityType: "event",
      entityId: row.id,
      createdBy: actor.user.id,
    })
    .returning({ id: broadcastRequests.id });
  await db.insert(broadcastChannels).values(
    body.broadcast.channels.map((channel) => ({
      broadcastRequestId: requestRow.id,
      channel,
      status: "requested" as const,
      preparedText: body.broadcast?.preparedText ?? null,
    }))
  );
}
```

Add to the imports near the top: `import { broadcastChannels, broadcastRequests } from "../db/schema";`.

- [ ] **Step 4: Run tests; confirm they pass**

```bash
cd packages/api && npx vitest run src/routes/eventsSubmit.test.ts
```

Expected: all three new specs pass plus existing specs unchanged.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/routes/eventsSubmit.ts \
        packages/api/src/routes/eventsSubmit.test.ts
git commit -m "feat(api): /events/submit accepts optional broadcast channel request"
```

---

### Task 9: Extend `POST /admin/announcements` with optional `broadcast` field

**Files:**
- Modify: `packages/api/src/routes/admin/announcements/index.ts`
- Create or modify: `packages/api/src/routes/admin/announcements/index.test.ts`

- [ ] **Step 1: Write failing tests**

Append (or create) the test file with the same three cases as Task 8 — present-absent, present-with-channels, present-with-empty-channels — but POSTing to `/admin/announcements` with staff auth and inserting an announcement instead of an event. Adapt:

```ts
it("creates broadcast_request + channels when broadcast provided", async () => {
  const res = await testApp.request("/admin/announcements", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: makeStaffActor(await seedActor()),
    },
    body: JSON.stringify({
      title: `Promoted Ann ${Date.now()}`,
      body: "Body text here",
      broadcast: {
        channels: ["site_banner"],
        preparedText: "Banner blurb",
      },
    }),
  });
  expect(res.status).toBe(201);
  const json = await res.json();
  const reqRows = await sql/* sql */`
    SELECT id FROM broadcast_requests
    WHERE entity_type = 'announcement' AND entity_id = ${json.announcement.id}
  `;
  expect(reqRows.length).toBe(1);
});
```

Plus the absent and empty-channels analogs.

Also assert that the created announcement now has a slug:

```ts
it("creates an announcement with a server-generated slug", async () => {
  const res = await testApp.request("/admin/announcements", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: makeStaffActor(await seedActor()),
    },
    body: JSON.stringify({
      title: `Slug check ${Date.now()}`,
      body: "Body",
    }),
  });
  const json = await res.json();
  expect(json.announcement.slug).toMatch(/^slug-check-\d+/);
});
```

- [ ] **Step 2: Run tests; confirm they fail**

```bash
cd packages/api && npx vitest run src/routes/admin/announcements/index.test.ts
```

Expected: failures — the broadcast field is rejected, and the create handler does not write a slug.

- [ ] **Step 3: Implement slug generation in the create handler**

Edit `packages/api/src/routes/admin/announcements/index.ts`. Add a `slugify` helper at the top of the file:

```ts
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : `announcement-${suffix}`;
}
```

In the `.values({...})` block, add `slug: slugify(body.title),`.

- [ ] **Step 4: Extend the zod schema with the broadcast field**

Replace `createBodySchema` with:

```ts
const BROADCAST_CHANNELS = [
  "site_banner",
  "workspace_chat",
  "newsletter",
  "twitter_x",
  "bluesky",
  "mastodon",
  "linkedin",
] as const;

const createBodySchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  linkUrl: z.string().url().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
  scope: z.enum(SCOPES).optional(),
  hostGroupId: z.string().uuid().optional(),
  hostOrgId: z.string().uuid().optional(),
  broadcast: z
    .object({
      channels: z.array(z.enum(BROADCAST_CHANNELS)).max(7),
      preparedText: z.string().max(2000).optional(),
    })
    .optional(),
});
```

- [ ] **Step 5: Persist the broadcast request after the announcement insert**

After the INSERT-RETURNING block and BEFORE the response, add (same pattern as Task 8):

```ts
if (body.broadcast && body.broadcast.channels.length > 0) {
  const [requestRow] = await db
    .insert(broadcastRequests)
    .values({
      entityType: "announcement",
      entityId: row.id,
      createdBy: actor.user.id,
    })
    .returning({ id: broadcastRequests.id });
  await db.insert(broadcastChannels).values(
    body.broadcast.channels.map((channel) => ({
      broadcastRequestId: requestRow.id,
      channel,
      status: "requested" as const,
      preparedText: body.broadcast?.preparedText ?? null,
    }))
  );
}
```

Add `broadcastRequests, broadcastChannels` to the schema imports at the top.

Also add `slug: row.slug` to the announcement object returned in the 201 response.

- [ ] **Step 6: Run tests; confirm they pass**

```bash
cd packages/api && npx vitest run src/routes/admin/announcements/index.test.ts
```

Expected: all new specs pass; existing list/filter specs untouched.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/routes/admin/announcements/index.ts \
        packages/api/src/routes/admin/announcements/index.test.ts
git commit -m "feat(api): /admin/announcements writes slug + accepts optional broadcast"
```

---

# Phase D — Admin broadcast routes

### Task 10: Scaffold the `/admin/broadcasts` router and `GET /queue`

**Files:**
- Create: `packages/api/src/routes/admin/broadcasts/index.ts`
- Create: `packages/api/src/routes/admin/broadcasts/queue.ts`
- Create: `packages/api/src/routes/admin/broadcasts/queue.test.ts`
- Modify: `packages/api/src/routes/admin/index.ts`

- [ ] **Step 1: Write failing tests for `GET /queue`**

Create `packages/api/src/routes/admin/broadcasts/queue.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "../../../test/helpers";

const sql = neon(process.env.DATABASE_URL!);

async function seedActor(): Promise<string> {
  const rows = await sql`SELECT id FROM users LIMIT 1`;
  return rows[0].id as string;
}

async function seedAnnouncementWithChannel(args: {
  slug: string;
  channel: string;
  status: string;
  postedAt: string | null;
  preparedText?: string | null;
}): Promise<{ entityId: string; channelId: string }> {
  const actorId = await seedActor();
  const ann = await sql/* sql */`
    INSERT INTO announcements (slug, title, body, status, scope)
    VALUES (${args.slug}, 'Q', 'B', 'published', 'public')
    RETURNING id
  `;
  const entityId = ann[0].id as string;
  const req = await sql/* sql */`
    INSERT INTO broadcast_requests (entity_type, entity_id, created_by)
    VALUES ('announcement', ${entityId}, ${actorId})
    RETURNING id
  `;
  const chan = await sql/* sql */`
    INSERT INTO broadcast_channels
      (broadcast_request_id, channel, status, posted_at, prepared_text, decided_at)
    VALUES
      (${req[0].id}, ${args.channel}, ${args.status},
       ${args.postedAt}, ${args.preparedText ?? null}, now())
    RETURNING id
  `;
  return { entityId, channelId: chan[0].id as string };
}

describe("GET /admin/broadcasts/queue", () => {
  it("returns approved + unposted manual channels by default", async () => {
    const { channelId } = await seedAnnouncementWithChannel({
      slug: `qm-${Date.now()}`,
      channel: "twitter_x",
      status: "approved",
      postedAt: null,
      preparedText: "Tweet copy",
    });
    const res = await testApp.request("/admin/broadcasts/queue", {
      headers: { authorization: makeStaffActor(await seedActor()) },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rows.some((r: { id: string }) => r.id === channelId)).toBe(true);
  });

  it("excludes posted channels and native channels by default", async () => {
    const { channelId: postedId } = await seedAnnouncementWithChannel({
      slug: `qp-${Date.now()}`,
      channel: "twitter_x",
      status: "posted",
      postedAt: new Date().toISOString(),
    });
    const { channelId: bannerId } = await seedAnnouncementWithChannel({
      slug: `qb-${Date.now()}`,
      channel: "site_banner",
      status: "approved",
      postedAt: null,
    });
    const res = await testApp.request("/admin/broadcasts/queue", {
      headers: { authorization: makeStaffActor(await seedActor()) },
    });
    const json = await res.json();
    const ids = json.rows.map((r: { id: string }) => r.id);
    expect(ids).not.toContain(postedId);
    expect(ids).not.toContain(bannerId);
  });

  it("403s for non-staff", async () => {
    const res = await testApp.request("/admin/broadcasts/queue", {
      headers: { authorization: makeMemberActor(await seedActor()) },
    });
    expect(res.status).toBe(403);
  });

  it("includes errored native channels when ?include_errored_native=1", async () => {
    const { channelId } = await seedAnnouncementWithChannel({
      slug: `qe-${Date.now()}`,
      channel: "workspace_chat",
      status: "approved",
      postedAt: null,
    });
    await sql/* sql */`
      UPDATE broadcast_channels SET attempt_count = 2, last_error = '500 boom'
      WHERE id = ${channelId}
    `;
    const res = await testApp.request(
      "/admin/broadcasts/queue?include_errored_native=1",
      { headers: { authorization: makeStaffActor(await seedActor()) } }
    );
    const json = await res.json();
    expect(json.rows.some((r: { id: string }) => r.id === channelId)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests; confirm they fail (route not mounted)**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/queue.test.ts
```

Expected: 404 on the route.

- [ ] **Step 3: Implement the queue handler**

Create `packages/api/src/routes/admin/broadcasts/queue.ts`:

```ts
import { Hono } from "hono";
import { and, desc, eq, inArray, isNull, isNotNull, or, sql } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  announcements,
  broadcastChannels,
  broadcastRequests,
  events,
} from "../../../db/schema";
import type { AppEnv } from "../../../types";

export const broadcastsQueueRoute = new Hono<AppEnv>();

const MANUAL_CHANNELS = [
  "twitter_x",
  "bluesky",
  "mastodon",
  "linkedin",
] as const;
const NATIVE_CHANNELS = ["site_banner", "workspace_chat"] as const;

broadcastsQueueRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  if (actor.systemTier < 1) return c.json({ ok: false, error: "forbidden" }, 403);
  const db = createDb(c.env.DATABASE_URL);

  const includeErroredNative = c.req.query("include_errored_native") === "1";

  const channelPredicate = includeErroredNative
    ? or(
        inArray(broadcastChannels.channel, [...MANUAL_CHANNELS]),
        and(
          inArray(broadcastChannels.channel, [...NATIVE_CHANNELS]),
          sql`${broadcastChannels.attemptCount} > 0`
        )
      )
    : inArray(broadcastChannels.channel, [...MANUAL_CHANNELS]);

  const rows = await db
    .select({
      id: broadcastChannels.id,
      channel: broadcastChannels.channel,
      status: broadcastChannels.status,
      preparedText: broadcastChannels.preparedText,
      preparedImageKey: broadcastChannels.preparedImageKey,
      decidedAt: broadcastChannels.decidedAt,
      lastError: broadcastChannels.lastError,
      attemptCount: broadcastChannels.attemptCount,
      entityType: broadcastRequests.entityType,
      entityId: broadcastRequests.entityId,
      announcementTitle: announcements.title,
      announcementSlug: announcements.slug,
      eventName: events.name,
      eventSlug: events.slug,
    })
    .from(broadcastChannels)
    .innerJoin(
      broadcastRequests,
      eq(broadcastChannels.broadcastRequestId, broadcastRequests.id)
    )
    .leftJoin(
      announcements,
      and(
        eq(broadcastRequests.entityType, "announcement"),
        eq(announcements.id, broadcastRequests.entityId)
      )
    )
    .leftJoin(
      events,
      and(
        eq(broadcastRequests.entityType, "event"),
        eq(events.id, broadcastRequests.entityId)
      )
    )
    .where(
      and(
        eq(broadcastChannels.status, "approved"),
        isNull(broadcastChannels.postedAt),
        channelPredicate
      )
    )
    .orderBy(desc(broadcastChannels.decidedAt));

  return c.json({
    ok: true,
    rows: rows.map((r) => ({
      id: r.id,
      channel: r.channel,
      status: r.status,
      preparedText: r.preparedText,
      preparedImageKey: r.preparedImageKey,
      decidedAt: r.decidedAt,
      lastError: r.lastError,
      attemptCount: r.attemptCount,
      entityType: r.entityType,
      entityId: r.entityId,
      title: r.entityType === "announcement" ? r.announcementTitle : r.eventName,
      slug: r.entityType === "announcement" ? r.announcementSlug : r.eventSlug,
    })),
  });
});
```

- [ ] **Step 4: Mount the queue route**

Create `packages/api/src/routes/admin/broadcasts/index.ts`:

```ts
import { Hono } from "hono";
import type { AppEnv } from "../../../types";
import { broadcastsQueueRoute } from "./queue";

/**
 * Hono sub-app for /api/admin/broadcasts/*. Mounts the manual-handoff
 * sub-queue plus per-channel action routes (added in later tasks).
 * Auth + actor context are applied by the parent /admin/* chain.
 */
export const adminBroadcastsRoute = new Hono<AppEnv>();

adminBroadcastsRoute.route("/queue", broadcastsQueueRoute);
```

Then edit `packages/api/src/routes/admin/index.ts`. Add:

```ts
import { adminBroadcastsRoute } from "./broadcasts";
```

and below the existing `adminApi.route("/forms", adminFormsRoute);` line:

```ts
adminApi.route("/broadcasts", adminBroadcastsRoute);
```

- [ ] **Step 5: Run tests; confirm passes**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/queue.test.ts
```

Expected: all four specs pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/broadcasts/ \
        packages/api/src/routes/admin/index.ts
git commit -m "feat(api): /admin/broadcasts/queue sub-queue endpoint"
```

---

### Task 11: `POST /admin/broadcasts/channels/:channelId/approve`

**Files:**
- Create: `packages/api/src/routes/admin/broadcasts/channelActions.ts`
- Create: `packages/api/src/routes/admin/broadcasts/channelActions.test.ts`
- Modify: `packages/api/src/routes/admin/broadcasts/index.ts`

- [ ] **Step 1: Write failing tests for approve**

Create `packages/api/src/routes/admin/broadcasts/channelActions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "../../../test/helpers";

const sql = neon(process.env.DATABASE_URL!);
const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function seedActor(role: "staff" | "member" = "staff"): Promise<string> {
  // role is informational only — we use it via the test helper auth header
  const rows = await sql`SELECT id FROM users LIMIT 1`;
  return rows[0].id as string;
}

async function seedRequested(channel: string, artifactStatus = "in_review") {
  const actorId = await seedActor();
  const ann = await sql/* sql */`
    INSERT INTO announcements (slug, title, body, status, scope)
    VALUES (${`act-${Date.now()}-${Math.random()}`}, 'A', 'B',
            ${artifactStatus}, 'public')
    RETURNING id
  `;
  const req = await sql/* sql */`
    INSERT INTO broadcast_requests (entity_type, entity_id, created_by)
    VALUES ('announcement', ${ann[0].id}, ${actorId})
    RETURNING id
  `;
  const chan = await sql/* sql */`
    INSERT INTO broadcast_channels
      (broadcast_request_id, channel, status, prepared_text)
    VALUES (${req[0].id}, ${channel}, 'requested', 'orig text')
    RETURNING id
  `;
  return {
    actorId,
    announcementId: ann[0].id as string,
    requestId: req[0].id as string,
    channelId: chan[0].id as string,
  };
}

describe("POST /admin/broadcasts/channels/:channelId/approve", () => {
  it("flips channel to approved, records reviewer", async () => {
    const { channelId } = await seedRequested("twitter_x");
    const reviewerId = await seedActor();
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/approve`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(reviewerId),
        },
        body: JSON.stringify({}),
      }
    );
    expect(res.status).toBe(200);
    const row = await sql/* sql */`
      SELECT status, decided_by, prepared_text FROM broadcast_channels
      WHERE id = ${channelId}
    `;
    expect(row[0].status).toBe("approved");
    expect(row[0].decided_by).toBe(reviewerId);
    expect(row[0].prepared_text).toBe("orig text");
  });

  it("overrides preparedText when supplied", async () => {
    const { channelId } = await seedRequested("twitter_x");
    await testApp.request(
      `/admin/broadcasts/channels/${channelId}/approve`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(await seedActor()),
        },
        body: JSON.stringify({ preparedText: "new copy" }),
      }
    );
    const row = await sql/* sql */`
      SELECT prepared_text FROM broadcast_channels WHERE id = ${channelId}
    `;
    expect(row[0].prepared_text).toBe("new copy");
  });

  it("rejects self-approval (actor is broadcast_requests.created_by)", async () => {
    const { channelId, actorId } = await seedRequested("twitter_x");
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/approve`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(actorId),
        },
        body: JSON.stringify({}),
      }
    );
    expect(res.status).toBe(403);
    const row = await sql/* sql */`
      SELECT status FROM broadcast_channels WHERE id = ${channelId}
    `;
    expect(row[0].status).toBe("requested");
  });

  it("403s for non-staff", async () => {
    const { channelId } = await seedRequested("twitter_x");
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/approve`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeMemberActor(await seedActor()),
        },
        body: JSON.stringify({}),
      }
    );
    expect(res.status).toBe(403);
  });

  it("late-addition: artifact already published — approving site_banner flips channel to posted", async () => {
    const { channelId } = await seedRequested("site_banner", "published");
    await testApp.request(
      `/admin/broadcasts/channels/${channelId}/approve`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(await seedActor()),
        },
        body: JSON.stringify({}),
      }
    );
    const row = await sql/* sql */`
      SELECT status FROM broadcast_channels WHERE id = ${channelId}
    `;
    expect(row[0].status).toBe("posted");
  });
});
```

- [ ] **Step 2: Run tests; confirm they fail (404)**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/channelActions.test.ts -t "approve"
```

Expected: 404 on the route.

- [ ] **Step 3: Implement the approve handler**

Create `packages/api/src/routes/admin/broadcasts/channelActions.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  announcements,
  broadcastChannels,
  broadcastRequests,
  events,
} from "../../../db/schema";
import {
  dispatchDbEffects,
  dispatchOutbound,
} from "../../../lib/broadcast/dispatcher";
import type { AppEnv } from "../../../types";

export const broadcastChannelActionsRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

async function loadChannelWithRequest(db: ReturnType<typeof createDb>, channelId: string) {
  return db
    .select({
      id: broadcastChannels.id,
      status: broadcastChannels.status,
      channel: broadcastChannels.channel,
      preparedText: broadcastChannels.preparedText,
      requestId: broadcastRequests.id,
      requestCreatedBy: broadcastRequests.createdBy,
      entityType: broadcastRequests.entityType,
      entityId: broadcastRequests.entityId,
    })
    .from(broadcastChannels)
    .innerJoin(
      broadcastRequests,
      eq(broadcastChannels.broadcastRequestId, broadcastRequests.id)
    )
    .where(eq(broadcastChannels.id, channelId))
    .limit(1)
    .then((r) => r[0] ?? null);
}

async function isArtifactPublished(
  db: ReturnType<typeof createDb>,
  entityType: "event" | "announcement",
  entityId: string
): Promise<boolean> {
  if (entityType === "announcement") {
    const row = await db
      .select({ status: announcements.status })
      .from(announcements)
      .where(eq(announcements.id, entityId))
      .limit(1)
      .then((r) => r[0]);
    return row?.status === "published";
  }
  const row = await db
    .select({ status: events.status })
    .from(events)
    .where(eq(events.id, entityId))
    .limit(1)
    .then((r) => r[0]);
  return row?.status === "published";
}

const approveBodySchema = z.object({
  preparedText: z.string().max(2000).optional(),
});

broadcastChannelActionsRoute.post(
  "/:channelId/approve",
  zValidator("json", approveBodySchema, (result, c) => {
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
    if (actor.systemTier < 1) return c.json({ ok: false, error: "forbidden" }, 403);
    const channelId = c.req.param("channelId");
    if (!channelId || !UUID_RE.test(channelId)) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    const channel = await loadChannelWithRequest(db, channelId);
    if (!channel) return c.json({ ok: false, error: "not_found" }, 404);
    if (channel.requestCreatedBy === actor.user.id) {
      return c.json({ ok: false, error: "self_approval_forbidden" }, 403);
    }
    if (channel.status !== "requested") {
      return c.json({ ok: false, error: "invalid_status" }, 409);
    }

    await db
      .update(broadcastChannels)
      .set({
        status: "approved",
        decidedBy: actor.user.id,
        decidedAt: new Date(),
        preparedText: body.preparedText ?? channel.preparedText,
      })
      .where(eq(broadcastChannels.id, channelId));

    // Late-addition fallback: if artifact already published, run dispatcher
    const isPublished = await isArtifactPublished(
      db,
      channel.entityType,
      channel.entityId
    );
    let summary: {
      siteBannerPosted: number;
      workspaceChatPosted: number;
      workspaceChatFailed: number;
    } = {
      siteBannerPosted: 0,
      workspaceChatPosted: 0,
      workspaceChatFailed: 0,
    };
    if (isPublished) {
      const db1 = await dispatchDbEffects(
        db,
        { type: channel.entityType, id: channel.entityId },
        actor.user.id
      );
      const db2 = await dispatchOutbound(
        db,
        { type: channel.entityType, id: channel.entityId },
        c.env,
        actor.user.id
      );
      summary = { ...db1, ...db2 };
    }

    return c.json({ ok: true, summary });
  }
);
```

- [ ] **Step 4: Wire the channel actions route into the broadcasts mount**

Edit `packages/api/src/routes/admin/broadcasts/index.ts`. Add:

```ts
import { broadcastChannelActionsRoute } from "./channelActions";
// ...
adminBroadcastsRoute.route("/channels", broadcastChannelActionsRoute);
```

- [ ] **Step 5: Run tests; confirm passes**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/channelActions.test.ts -t "approve"
```

Expected: all five approve specs pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/broadcasts/
git commit -m "feat(api): /admin/broadcasts/channels/:id/approve handler"
```

---

### Task 12: `POST /admin/broadcasts/channels/:channelId/decline`

**Files:**
- Modify: `packages/api/src/routes/admin/broadcasts/channelActions.ts`
- Modify: `packages/api/src/routes/admin/broadcasts/channelActions.test.ts`

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe("POST /admin/broadcasts/channels/:channelId/decline", () => {
  it("requires a reason", async () => {
    const { channelId } = await seedRequested("twitter_x");
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/decline`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(await seedActor()),
        },
        body: JSON.stringify({}),
      }
    );
    expect(res.status).toBe(400);
  });

  it("flips channel to declined with reason and decided_by", async () => {
    const { channelId } = await seedRequested("twitter_x");
    const reviewerId = await seedActor();
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/decline`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(reviewerId),
        },
        body: JSON.stringify({ reason: "off-topic" }),
      }
    );
    expect(res.status).toBe(200);
    const row = await sql/* sql */`
      SELECT status, decided_by, decline_reason
      FROM broadcast_channels WHERE id = ${channelId}
    `;
    expect(row[0].status).toBe("declined");
    expect(row[0].decided_by).toBe(reviewerId);
    expect(row[0].decline_reason).toBe("off-topic");
  });

  it("rejects self-decline (creator)", async () => {
    const { channelId, actorId } = await seedRequested("twitter_x");
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/decline`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(actorId),
        },
        body: JSON.stringify({ reason: "x" }),
      }
    );
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run; confirm fail**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/channelActions.test.ts -t "decline"
```

Expected: 404.

- [ ] **Step 3: Implement decline**

Append to `packages/api/src/routes/admin/broadcasts/channelActions.ts`:

```ts
const declineBodySchema = z.object({
  reason: z.string().min(1).max(1000),
});

broadcastChannelActionsRoute.post(
  "/:channelId/decline",
  zValidator("json", declineBodySchema, (result, c) => {
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
    if (actor.systemTier < 1) return c.json({ ok: false, error: "forbidden" }, 403);
    const channelId = c.req.param("channelId");
    if (!channelId || !UUID_RE.test(channelId)) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    const channel = await loadChannelWithRequest(db, channelId);
    if (!channel) return c.json({ ok: false, error: "not_found" }, 404);
    if (channel.requestCreatedBy === actor.user.id) {
      return c.json({ ok: false, error: "self_review_forbidden" }, 403);
    }
    if (channel.status !== "requested") {
      return c.json({ ok: false, error: "invalid_status" }, 409);
    }

    await db
      .update(broadcastChannels)
      .set({
        status: "declined",
        decidedBy: actor.user.id,
        decidedAt: new Date(),
        declineReason: body.reason,
      })
      .where(eq(broadcastChannels.id, channelId));

    return c.json({ ok: true });
  }
);
```

- [ ] **Step 4: Run; confirm passes**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/channelActions.test.ts -t "decline"
```

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/routes/admin/broadcasts/
git commit -m "feat(api): /admin/broadcasts/channels/:id/decline handler"
```

---

### Task 13: `POST /admin/broadcasts/channels/:channelId/mark-posted`

**Files:**
- Modify: `packages/api/src/routes/admin/broadcasts/channelActions.ts`
- Modify: `packages/api/src/routes/admin/broadcasts/channelActions.test.ts`

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe("POST /admin/broadcasts/channels/:channelId/mark-posted", () => {
  async function seedApproved(channel: string) {
    const { channelId } = await seedRequested(channel);
    await sql/* sql */`
      UPDATE broadcast_channels SET status = 'approved', decided_at = now()
      WHERE id = ${channelId}
    `;
    return channelId;
  }

  it("requires postUrl", async () => {
    const channelId = await seedApproved("twitter_x");
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/mark-posted`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(await seedActor()),
        },
        body: JSON.stringify({}),
      }
    );
    expect(res.status).toBe(400);
  });

  it("flips approved → posted with postUrl and posted_by", async () => {
    const channelId = await seedApproved("twitter_x");
    const reviewerId = await seedActor();
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/mark-posted`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(reviewerId),
        },
        body: JSON.stringify({ postUrl: "https://x.com/post/1" }),
      }
    );
    expect(res.status).toBe(200);
    const row = await sql/* sql */`
      SELECT status, post_url, posted_by FROM broadcast_channels WHERE id = ${channelId}
    `;
    expect(row[0].status).toBe("posted");
    expect(row[0].post_url).toBe("https://x.com/post/1");
    expect(row[0].posted_by).toBe(reviewerId);
  });

  it("409s if channel is not approved", async () => {
    const { channelId } = await seedRequested("twitter_x"); // still requested
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/mark-posted`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(await seedActor()),
        },
        body: JSON.stringify({ postUrl: "https://x.com/p" }),
      }
    );
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 2: Run; confirm fail**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/channelActions.test.ts -t "mark-posted"
```

- [ ] **Step 3: Implement mark-posted**

Append to `channelActions.ts`:

```ts
const markPostedBodySchema = z.object({
  postUrl: z.string().url().max(1000),
});

broadcastChannelActionsRoute.post(
  "/:channelId/mark-posted",
  zValidator("json", markPostedBodySchema, (result, c) => {
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
    if (actor.systemTier < 1) return c.json({ ok: false, error: "forbidden" }, 403);
    const channelId = c.req.param("channelId");
    if (!channelId || !UUID_RE.test(channelId)) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    const channel = await loadChannelWithRequest(db, channelId);
    if (!channel) return c.json({ ok: false, error: "not_found" }, 404);
    if (channel.status !== "approved") {
      return c.json({ ok: false, error: "invalid_status" }, 409);
    }

    await db
      .update(broadcastChannels)
      .set({
        status: "posted",
        postedBy: actor.user.id,
        postedAt: new Date(),
        postUrl: body.postUrl,
      })
      .where(eq(broadcastChannels.id, channelId));

    return c.json({ ok: true });
  }
);
```

- [ ] **Step 4: Run; confirm passes**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/channelActions.test.ts -t "mark-posted"
```

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/routes/admin/broadcasts/
git commit -m "feat(api): /admin/broadcasts/channels/:id/mark-posted handler"
```

---

### Task 14: `POST /admin/broadcasts/channels/:channelId/retry`

**Files:**
- Modify: `packages/api/src/routes/admin/broadcasts/channelActions.ts`
- Modify: `packages/api/src/routes/admin/broadcasts/channelActions.test.ts`

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe("POST /admin/broadcasts/channels/:channelId/retry", () => {
  it("re-fires a failed workspace_chat channel; success clears last_error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("ok", { status: 200 })
    );
    const { channelId } = await seedRequested("workspace_chat");
    await sql/* sql */`
      UPDATE broadcast_channels
      SET status = 'approved',
          decided_at = now(),
          attempt_count = 2,
          last_error = '500 boom'
      WHERE id = ${channelId}
    `;
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/retry`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(await seedActor()),
        },
        body: JSON.stringify({}),
      }
    );
    expect(res.status).toBe(200);
    const row = await sql/* sql */`
      SELECT status, last_error FROM broadcast_channels WHERE id = ${channelId}
    `;
    expect(row[0].status).toBe("posted");
    expect(row[0].last_error).toBeNull();
  });

  it("no-ops on a posted channel", async () => {
    const { channelId } = await seedRequested("workspace_chat");
    await sql/* sql */`
      UPDATE broadcast_channels SET status = 'posted', posted_at = now()
      WHERE id = ${channelId}
    `;
    const res = await testApp.request(
      `/admin/broadcasts/channels/${channelId}/retry`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(await seedActor()),
        },
        body: JSON.stringify({}),
      }
    );
    expect(res.status).toBe(200);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run; confirm fail**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/channelActions.test.ts -t "retry"
```

- [ ] **Step 3: Implement retry**

Append to `channelActions.ts`:

```ts
broadcastChannelActionsRoute.post("/:channelId/retry", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  if (actor.systemTier < 1) return c.json({ ok: false, error: "forbidden" }, 403);
  const channelId = c.req.param("channelId");
  if (!channelId || !UUID_RE.test(channelId)) {
    return c.json({ ok: false, error: "not_found" }, 404);
  }
  const db = createDb(c.env.DATABASE_URL);
  const channel = await loadChannelWithRequest(db, channelId);
  if (!channel) return c.json({ ok: false, error: "not_found" }, 404);
  if (channel.status === "posted") {
    return c.json({ ok: true, noop: true });
  }
  if (channel.status !== "approved") {
    return c.json({ ok: false, error: "invalid_status" }, 409);
  }

  // Run both phases — they're idempotent. dispatchDbEffects handles site_banner
  // (effectively a no-op if this channel is workspace_chat); dispatchOutbound
  // handles workspace_chat. last_error is cleared on success because the row's
  // status is flipped to 'posted' and we explicitly clear lastError there.
  await dispatchDbEffects(
    db,
    { type: channel.entityType, id: channel.entityId },
    actor.user.id
  );
  const summary = await dispatchOutbound(
    db,
    { type: channel.entityType, id: channel.entityId },
    c.env,
    actor.user.id
  );

  // If outbound succeeded for this channel, clear last_error on the row.
  // dispatchOutbound clears errors implicitly by flipping to 'posted', but
  // posted rows leave last_error unchanged; surfacing a stale error after
  // a successful retry would be confusing — clear it.
  if (summary.workspaceChatPosted > 0) {
    await db
      .update(broadcastChannels)
      .set({ lastError: null })
      .where(eq(broadcastChannels.id, channelId));
  }

  return c.json({ ok: true, summary });
});
```

- [ ] **Step 4: Run; confirm passes**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/channelActions.test.ts -t "retry"
```

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/routes/admin/broadcasts/
git commit -m "feat(api): /admin/broadcasts/channels/:id/retry handler"
```

---

### Task 15: `POST /admin/broadcasts/requests/:requestId/channels` (reviewer add-channel)

**Files:**
- Create: `packages/api/src/routes/admin/broadcasts/addChannel.ts`
- Create: `packages/api/src/routes/admin/broadcasts/addChannel.test.ts`
- Modify: `packages/api/src/routes/admin/broadcasts/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/api/src/routes/admin/broadcasts/addChannel.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "../../../test/helpers";

const sql = neon(process.env.DATABASE_URL!);

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
});

async function seedActor(): Promise<string> {
  const rows = await sql`SELECT id FROM users LIMIT 1`;
  return rows[0].id as string;
}

async function seedRequest(artifactStatus = "in_review") {
  const actorId = await seedActor();
  const ann = await sql/* sql */`
    INSERT INTO announcements (slug, title, body, status, scope)
    VALUES (${`add-${Date.now()}-${Math.random()}`}, 'A', 'B',
            ${artifactStatus}, 'public')
    RETURNING id
  `;
  const req = await sql/* sql */`
    INSERT INTO broadcast_requests (entity_type, entity_id, created_by)
    VALUES ('announcement', ${ann[0].id}, ${actorId})
    RETURNING id
  `;
  return { actorId, requestId: req[0].id as string, entityId: ann[0].id as string };
}

describe("POST /admin/broadcasts/requests/:requestId/channels", () => {
  it("inserts a directly-approved channel row", async () => {
    const { requestId } = await seedRequest();
    const reviewerId = await seedActor();
    const res = await testApp.request(
      `/admin/broadcasts/requests/${requestId}/channels`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(reviewerId),
        },
        body: JSON.stringify({
          channel: "linkedin",
          preparedText: "Reviewer-added blurb",
        }),
      }
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    const row = await sql/* sql */`
      SELECT channel, status, decided_by, prepared_text
      FROM broadcast_channels WHERE id = ${json.channel.id}
    `;
    expect(row[0].channel).toBe("linkedin");
    expect(row[0].status).toBe("approved");
    expect(row[0].decided_by).toBe(reviewerId);
    expect(row[0].prepared_text).toBe("Reviewer-added blurb");
  });

  it("rejects self-add (actor is request creator)", async () => {
    const { requestId, actorId } = await seedRequest();
    const res = await testApp.request(
      `/admin/broadcasts/requests/${requestId}/channels`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(actorId),
        },
        body: JSON.stringify({ channel: "linkedin" }),
      }
    );
    expect(res.status).toBe(403);
  });

  it("409s on duplicate channel for same request", async () => {
    const { requestId } = await seedRequest();
    await testApp.request(
      `/admin/broadcasts/requests/${requestId}/channels`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(await seedActor()),
        },
        body: JSON.stringify({ channel: "mastodon" }),
      }
    );
    const res2 = await testApp.request(
      `/admin/broadcasts/requests/${requestId}/channels`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(await seedActor()),
        },
        body: JSON.stringify({ channel: "mastodon" }),
      }
    );
    expect(res2.status).toBe(409);
  });

  it("403s for non-staff", async () => {
    const { requestId } = await seedRequest();
    const res = await testApp.request(
      `/admin/broadcasts/requests/${requestId}/channels`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeMemberActor(await seedActor()),
        },
        body: JSON.stringify({ channel: "linkedin" }),
      }
    );
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run; confirm fail**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/addChannel.test.ts
```

- [ ] **Step 3: Implement the handler**

Create `packages/api/src/routes/admin/broadcasts/addChannel.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { createDb } from "../../../db";
import { broadcastChannels, broadcastRequests } from "../../../db/schema";
import {
  dispatchDbEffects,
  dispatchOutbound,
} from "../../../lib/broadcast/dispatcher";
import { announcements, events } from "../../../db/schema";
import type { AppEnv } from "../../../types";

export const broadcastAddChannelRoute = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f-]{36}$/i;
const BROADCAST_CHANNELS = [
  "site_banner",
  "workspace_chat",
  "newsletter",
  "twitter_x",
  "bluesky",
  "mastodon",
  "linkedin",
] as const;

const bodySchema = z.object({
  channel: z.enum(BROADCAST_CHANNELS),
  preparedText: z.string().max(2000).optional(),
  preparedImageKey: z.string().max(500).optional(),
});

broadcastAddChannelRoute.post(
  "/:requestId/channels",
  zValidator("json", bodySchema, (result, c) => {
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
    if (actor.systemTier < 1) return c.json({ ok: false, error: "forbidden" }, 403);
    const requestId = c.req.param("requestId");
    if (!requestId || !UUID_RE.test(requestId)) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    const request = await db
      .select({
        id: broadcastRequests.id,
        createdBy: broadcastRequests.createdBy,
        entityType: broadcastRequests.entityType,
        entityId: broadcastRequests.entityId,
      })
      .from(broadcastRequests)
      .where(eq(broadcastRequests.id, requestId))
      .limit(1)
      .then((r) => r[0]);
    if (!request) return c.json({ ok: false, error: "not_found" }, 404);
    if (request.createdBy === actor.user.id) {
      return c.json({ ok: false, error: "self_add_forbidden" }, 403);
    }

    // Probe for duplicate (the unique constraint will reject it, but a
    // clean 409 is friendlier than the raw DB error).
    const dup = await db
      .select({ id: broadcastChannels.id })
      .from(broadcastChannels)
      .where(eq(broadcastChannels.broadcastRequestId, requestId))
      .then((rows) => rows.find((r) => r.id === undefined ? false : true));
    // (Drizzle .where with composite predicates can be added, but the unique
    // constraint + a defensive try/catch on the insert is more robust.)

    try {
      const [row] = await db
        .insert(broadcastChannels)
        .values({
          broadcastRequestId: requestId,
          channel: body.channel,
          status: "approved",
          decidedBy: actor.user.id,
          decidedAt: new Date(),
          preparedText: body.preparedText ?? null,
          preparedImageKey: body.preparedImageKey ?? null,
        })
        .returning();

      // Late-addition fallback if artifact already published.
      const status = await artifactStatus(db, request.entityType, request.entityId);
      if (status === "published") {
        await dispatchDbEffects(
          db,
          { type: request.entityType, id: request.entityId },
          actor.user.id
        );
        await dispatchOutbound(
          db,
          { type: request.entityType, id: request.entityId },
          c.env,
          actor.user.id
        );
      }

      return c.json({ ok: true, channel: row }, 201);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("broadcast_channels_unique_channel_per_request")) {
        return c.json({ ok: false, error: "duplicate_channel" }, 409);
      }
      throw err;
    }
  }
);

async function artifactStatus(
  db: ReturnType<typeof createDb>,
  entityType: "event" | "announcement",
  entityId: string
): Promise<string | null> {
  if (entityType === "announcement") {
    const r = await db
      .select({ s: announcements.status })
      .from(announcements)
      .where(eq(announcements.id, entityId))
      .limit(1)
      .then((rows) => rows[0]);
    return r?.s ?? null;
  }
  const r = await db
    .select({ s: events.status })
    .from(events)
    .where(eq(events.id, entityId))
    .limit(1)
    .then((rows) => rows[0]);
  return r?.s ?? null;
}
```

- [ ] **Step 4: Mount the route**

Edit `packages/api/src/routes/admin/broadcasts/index.ts`. Add:

```ts
import { broadcastAddChannelRoute } from "./addChannel";
// ...
adminBroadcastsRoute.route("/requests", broadcastAddChannelRoute);
```

- [ ] **Step 5: Run; confirm passes**

```bash
cd packages/api && npx vitest run src/routes/admin/broadcasts/addChannel.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/broadcasts/
git commit -m "feat(api): /admin/broadcasts/requests/:id/channels add-channel handler"
```

---

# Phase E — Public web UI

### Task 16: `AnnouncementDetailPage` route on `apps/web`

**Files:**
- Create: `apps/web/src/pages/announcements/AnnouncementDetailPage.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Add the route registration**

Edit `apps/web/src/App.tsx`. Add an import:

```tsx
import { AnnouncementDetailPage } from "@/pages/announcements/AnnouncementDetailPage";
```

In the routes block (find where `EventDetailPage` is registered) add a route:

```tsx
<Route path="/announcements/:slug" element={<AnnouncementDetailPage />} />
```

- [ ] **Step 2: Implement the page**

Create `apps/web/src/pages/announcements/AnnouncementDetailPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

interface HostGroup {
  id: string;
  name: string;
  slug: string;
}
interface HostOrg {
  id: string;
  name: string;
}
interface AnnouncementDetail {
  id: string;
  slug: string;
  title: string;
  body: string;
  linkUrl: string | null;
  scope: string;
  expiresAt: string | null;
  hostGroup: HostGroup | null;
  hostOrg: HostOrg | null;
}

export function AnnouncementDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const apiFetch = useApi();
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "error" } | { kind: "ok"; data: AnnouncementDetail }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/announcements/${slug}`);
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: "error" });
          return;
        }
        const json = (await res.json()) as
          | { ok: true; announcement: AnnouncementDetail }
          | { ok: false };
        if (cancelled) return;
        if (!json.ok) {
          setState({ kind: "error" });
          return;
        }
        setState({ kind: "ok", data: json.announcement });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch, slug]);

  if (state.kind === "loading") {
    return <div className="container mx-auto px-4 py-12">Loading…</div>;
  }
  if (state.kind === "error") {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Announcement not found</h1>
        <Link to="/news" className="text-purple-700 underline">
          ← Back to news
        </Link>
      </div>
    );
  }
  const ann = state.data;
  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/news" className="text-sm text-purple-700 underline">
        ← Back to news
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-3">{ann.title}</h1>
      <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
        {ann.hostGroup && (
          <Link
            to={`/community/groups/${ann.hostGroup.slug}`}
            className="underline"
          >
            {ann.hostGroup.name}
          </Link>
        )}
        {ann.hostOrg && <span>{ann.hostOrg.name}</span>}
        {ann.expiresAt && (
          <span className="text-amber-700">
            Expires {new Date(ann.expiresAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <div
        className="prose prose-purple max-w-none"
        // body is server-sanitized by the existing admin pipeline
        dangerouslySetInnerHTML={{ __html: ann.body }}
      />
      {ann.linkUrl && (
        <p className="mt-8">
          <a href={ann.linkUrl} className="text-purple-700 underline">
            Learn more →
          </a>
        </p>
      )}
    </article>
  );
}
```

- [ ] **Step 3: Run the web dev server and verify**

```bash
cd <repo-root> && npm run dev --workspace=@us-rse/web
```

Open `http://localhost:5173/announcements/<a-published-slug>` in a browser. Expected: page renders. Visit `/announcements/does-not-exist` — should show the not-found message and a back link. The user CLAUDE.md memory note says verify through the dev server rather than visual companion.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/App.tsx \
        apps/web/src/pages/announcements/
git commit -m "feat(web): public /announcements/:slug detail page"
```

---

### Task 17: SiteBanner — default `linkUrl` to `/announcements/:slug`

**Files:**
- Modify: `apps/web/src/components/SiteBanner.tsx`

- [ ] **Step 1: Update Banner type and link target**

Edit `apps/web/src/components/SiteBanner.tsx`. Change the `Banner` interface to add `slug`:

```tsx
interface Banner {
  id: string;
  slug: string;
  title: string;
  body: string;
  linkUrl: string | null;
}
```

In the rendered JSX, replace the `Learn more →` link block with:

```tsx
<a
  href={banner.linkUrl ?? `/announcements/${banner.slug}`}
  className="text-sm underline hover:text-white font-semibold whitespace-nowrap"
>
  Learn more →
</a>
```

Remove the surrounding `{banner.linkUrl && (...)}` conditional (the link now always renders, falling back to the detail page).

- [ ] **Step 2: Verify manually**

Run the web dev server. With a published announcement that has `link_url IS NULL` and a posted `site_banner` channel: the banner should render with a "Learn more →" link pointing to `/announcements/:slug`. With `link_url` set, the link points to the author-supplied URL.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/SiteBanner.tsx
git commit -m "feat(web): SiteBanner defaults Learn-more link to /announcements/:slug"
```

---

### Task 18: `PromoteEventSection` on `SubmitEventPage`

**Files:**
- Create: `apps/web/src/components/events/PromoteEventSection.tsx`
- Modify: `apps/web/src/pages/events/SubmitEventPage.tsx`

- [ ] **Step 1: Implement the shared author UI**

Create `apps/web/src/components/events/PromoteEventSection.tsx`:

```tsx
import { useId } from "react";

export type BroadcastChannel =
  | "site_banner"
  | "workspace_chat"
  | "twitter_x"
  | "bluesky"
  | "mastodon"
  | "linkedin";

export type BroadcastValue = {
  channels: BroadcastChannel[];
  preparedText: string;
};

interface ChannelOption {
  value: BroadcastChannel;
  label: string;
  defaultChecked: boolean;
}

const OPTIONS: ChannelOption[] = [
  { value: "site_banner", label: "Site banner", defaultChecked: true },
  { value: "workspace_chat", label: "Workspace chat", defaultChecked: true },
  { value: "twitter_x", label: "X / Twitter", defaultChecked: false },
  { value: "bluesky", label: "Bluesky", defaultChecked: false },
  { value: "mastodon", label: "Mastodon", defaultChecked: false },
  { value: "linkedin", label: "LinkedIn", defaultChecked: false },
];

interface Props {
  value: BroadcastValue;
  onChange: (next: BroadcastValue) => void;
  defaultPreparedText: string;
}

export function PromoteEventSection({ value, onChange, defaultPreparedText }: Props) {
  const textareaId = useId();
  function toggleChannel(channel: BroadcastChannel) {
    const next = value.channels.includes(channel)
      ? value.channels.filter((c) => c !== channel)
      : [...value.channels, channel];
    onChange({ ...value, channels: next });
  }
  return (
    <fieldset className="border border-gray-200 rounded-lg p-4 mt-6">
      <legend className="text-sm font-semibold px-2">
        Promote this event (optional)
      </legend>
      <p className="text-sm text-gray-600 mb-3">
        Request the channels where staff should consider broadcasting your event.
        Each requested channel needs staff approval before it posts.
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.channels.includes(opt.value)}
              onChange={() => toggleChannel(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
      <label htmlFor={textareaId} className="text-sm font-medium">
        Suggested preview text
      </label>
      <textarea
        id={textareaId}
        rows={3}
        className="w-full border border-gray-300 rounded p-2 mt-1 text-sm"
        value={value.preparedText}
        onChange={(e) => onChange({ ...value, preparedText: e.target.value })}
        placeholder={defaultPreparedText}
      />
    </fieldset>
  );
}

export function defaultPromote(defaultText: string): BroadcastValue {
  return {
    channels: OPTIONS.filter((o) => o.defaultChecked).map((o) => o.value),
    preparedText: defaultText,
  };
}
```

- [ ] **Step 2: Integrate into SubmitEventPage**

Edit `apps/web/src/pages/events/SubmitEventPage.tsx`. Near the top of the component, add state for the promote section:

```tsx
import { PromoteEventSection, defaultPromote, type BroadcastValue } from "@/components/events/PromoteEventSection";
// ...
const [promote, setPromote] = useState<BroadcastValue>(() =>
  defaultPromote("")
);
```

When the user edits the `name` or `location` fields, update the default placeholder for prepared text. Simplest approach: compute the default at submit time and only send `broadcast` if at least one channel is checked. Add the `<PromoteEventSection />` JSX inside the form, after the existing fields and before the submit button:

```tsx
<PromoteEventSection
  value={promote}
  onChange={setPromote}
  defaultPreparedText={`${name}${location ? ` — ${location}` : ""}`}
/>
```

In the submit handler, before posting the request, construct:

```tsx
const broadcast =
  promote.channels.length > 0
    ? {
        channels: promote.channels,
        preparedText:
          promote.preparedText.trim() ||
          `${name}${location ? ` — ${location}` : ""}`,
      }
    : undefined;
```

Add `broadcast` to the JSON body passed to `apiFetch("/events/submit", ...)`.

- [ ] **Step 3: Verify manually**

Run the web dev server. Log in as a member. Visit `/events/submit`. Verify the Promote section is rendered, site_banner and workspace_chat default to checked, and submitting with the section results in a row appearing in the admin queue with broadcast channels (use the admin app to confirm).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/events/PromoteEventSection.tsx \
        apps/web/src/pages/events/SubmitEventPage.tsx
git commit -m "feat(web): event submit form requests broadcast channels"
```

---

# Phase F — Admin UI

### Task 19: `PromoteSection` on admin `NewAnnouncementPage`

**Files:**
- Create: `apps/admin/src/components/broadcast/PromoteSection.tsx`
- Modify: `apps/admin/src/pages/announcements/NewAnnouncementPage.tsx`

- [ ] **Step 1: Implement the admin promote section**

Create `apps/admin/src/components/broadcast/PromoteSection.tsx`. Use the same shape as the web component in Task 18, but tweak the labels to match admin styling (no functional difference). Copy the OPTIONS/BroadcastChannel/BroadcastValue types and the component implementation verbatim — the design-system primitives in admin may differ from web, but plain HTML + tailwind works either way.

- [ ] **Step 2: Wire it into NewAnnouncementPage**

Edit `apps/admin/src/pages/announcements/NewAnnouncementPage.tsx` to:
1. Import `PromoteSection`, `defaultPromote`, `BroadcastValue`.
2. Add state: `const [promote, setPromote] = useState<BroadcastValue>(() => defaultPromote(""));`
3. Render `<PromoteSection ... />` inside the form after the existing fields.
4. In the submit handler, build `broadcast` the same way as Task 18 (defaults to `title — body.slice(0,140)` when prepared_text is blank). Add `broadcast` to the request body.

- [ ] **Step 3: Verify manually**

Run the admin dev server, create a new announcement with the section, and verify the broadcast_request + channels rows are created (psql or via admin detail page in Task 21).

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/components/broadcast/PromoteSection.tsx \
        apps/admin/src/pages/announcements/NewAnnouncementPage.tsx
git commit -m "feat(admin): NewAnnouncementPage requests broadcast channels"
```

---

### Task 20: `BroadcastPanel` shared component

**Files:**
- Create: `apps/admin/src/components/broadcast/BroadcastPanel.tsx`

- [ ] **Step 1: Implement the panel**

This panel is rendered on the admin event and announcement detail pages (Tasks 21–22). It owns the per-channel UI: status chip, prepared_text inline editor, action buttons (approve / decline / mark-posted / retry), "Add channel" button, and shows last_error chip when applicable. Self-approval is disabled with tooltip when the actor is the broadcast_request creator.

Create `apps/admin/src/components/broadcast/BroadcastPanel.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";

interface ChannelRow {
  id: string;
  channel: string;
  status: "requested" | "approved" | "declined" | "posted";
  preparedText: string | null;
  preparedImageKey: string | null;
  decidedAt: string | null;
  postUrl: string | null;
  lastError: string | null;
  attemptCount: number;
}
interface RequestRow {
  id: string;
  createdBy: string;
  channels: ChannelRow[];
}

interface Props {
  entityType: "event" | "announcement";
  entityId: string;
  currentActorId: string;
}

const MANUAL = ["twitter_x", "bluesky", "mastodon", "linkedin"];
const ALL_CHANNELS = ["site_banner", "workspace_chat", ...MANUAL] as const;

export function BroadcastPanel({ entityType, entityId, currentActorId }: Props) {
  const apiFetch = useApi();
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const res = await apiFetch(
      `/admin/${entityType === "event" ? "events" : "announcements"}/${entityId}/broadcast`
    );
    if (res.ok) {
      const json = (await res.json()) as { request: RequestRow | null };
      setRequest(json.request);
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, [entityType, entityId]);

  if (loading) return <div className="text-sm text-gray-600">Loading broadcast…</div>;
  if (!request) {
    return (
      <div className="text-sm text-gray-600">
        No broadcast was requested for this artifact.
      </div>
    );
  }
  const isOwnRequest = request.createdBy === currentActorId;

  async function approve(channelId: string, preparedText: string) {
    await apiFetch(`/admin/broadcasts/channels/${channelId}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ preparedText }),
    });
    await reload();
  }
  async function decline(channelId: string, reason: string) {
    await apiFetch(`/admin/broadcasts/channels/${channelId}/decline`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    await reload();
  }
  async function markPosted(channelId: string, postUrl: string) {
    await apiFetch(`/admin/broadcasts/channels/${channelId}/mark-posted`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postUrl }),
    });
    await reload();
  }
  async function retry(channelId: string) {
    await apiFetch(`/admin/broadcasts/channels/${channelId}/retry`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    await reload();
  }
  async function addChannel(channel: string) {
    await apiFetch(`/admin/broadcasts/requests/${request!.id}/channels`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    await reload();
  }

  const existingChannels = new Set(request.channels.map((c) => c.channel));
  const addable = ALL_CHANNELS.filter((c) => !existingChannels.has(c));

  return (
    <section className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-base font-semibold mb-3">Broadcast</h3>
      <ul className="space-y-3">
        {request.channels.map((ch) => (
          <ChannelRowView
            key={ch.id}
            row={ch}
            disabledSelf={isOwnRequest}
            onApprove={approve}
            onDecline={decline}
            onMarkPosted={markPosted}
            onRetry={retry}
          />
        ))}
      </ul>
      {addable.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="text-sm font-medium mr-2">Add channel:</label>
          <select
            disabled={isOwnRequest}
            title={isOwnRequest ? "You created this request" : undefined}
            onChange={(e) => {
              if (e.target.value) {
                addChannel(e.target.value);
                e.target.value = "";
              }
            }}
            className="text-sm border border-gray-300 rounded p-1"
          >
            <option value="">Select…</option>
            {addable.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}

function ChannelRowView(props: {
  row: ChannelRow;
  disabledSelf: boolean;
  onApprove: (id: string, text: string) => Promise<void>;
  onDecline: (id: string, reason: string) => Promise<void>;
  onMarkPosted: (id: string, url: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
}) {
  const { row, disabledSelf } = props;
  const [text, setText] = useState(row.preparedText ?? "");
  const isManual = MANUAL.includes(row.channel);
  return (
    <li className="border border-gray-100 rounded p-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-medium">{row.channel}</span>
        <StatusChip status={row.status} />
        {row.lastError && (
          <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded">
            error: {row.lastError.slice(0, 80)}
          </span>
        )}
      </div>
      <textarea
        rows={2}
        className="w-full border border-gray-300 rounded p-2 text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        {row.status === "requested" && (
          <>
            <button
              type="button"
              disabled={disabledSelf}
              title={disabledSelf ? "You created this request" : undefined}
              onClick={() => props.onApprove(row.id, text)}
              className="text-sm bg-purple-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={disabledSelf}
              onClick={() => {
                const reason = window.prompt("Decline reason?");
                if (reason) props.onDecline(row.id, reason);
              }}
              className="text-sm bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
            >
              Decline
            </button>
          </>
        )}
        {row.status === "approved" && isManual && (
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("Posted URL?");
              if (url) props.onMarkPosted(row.id, url);
            }}
            className="text-sm bg-purple-600 text-white px-3 py-1 rounded"
          >
            Mark posted
          </button>
        )}
        {row.status === "approved" && !isManual && row.lastError && (
          <button
            type="button"
            onClick={() => props.onRetry(row.id)}
            className="text-sm bg-amber-600 text-white px-3 py-1 rounded"
          >
            Retry
          </button>
        )}
      </div>
    </li>
  );
}

function StatusChip({ status }: { status: ChannelRow["status"] }) {
  const map: Record<ChannelRow["status"], string> = {
    requested: "bg-gray-200 text-gray-800",
    approved: "bg-amber-100 text-amber-800",
    declined: "bg-red-100 text-red-700",
    posted: "bg-green-100 text-green-800",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${map[status]}`}>{status}</span>
  );
}
```

The panel calls `GET /admin/(events|announcements)/:id/broadcast` to fetch the request + channels. This endpoint does not exist yet — add it in Step 2.

- [ ] **Step 2: Add a per-artifact broadcast read endpoint**

The panel needs to read its own state. Add a small handler.

Edit `packages/api/src/routes/admin/events/byId.ts` and `packages/api/src/routes/admin/announcements/byId.ts`. To each, add (after the existing GET handler):

```ts
adminEventByIdRoute.get("/broadcast", async (c) => {
  // For events use entityType "event"; for announcements use "announcement".
  // The id is the artifact id from the parent route.
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const actor = c.get("actor");
  if (!actor) return c.json({ ok: false, error: "unauthorized" }, 401);
  if (actor.systemTier < 1) return c.json({ ok: false, error: "forbidden" }, 403);
  const entityId = c.req.param("id");
  const db = createDb(c.env.DATABASE_URL);

  const req = await db
    .select({
      id: broadcastRequests.id,
      createdBy: broadcastRequests.createdBy,
    })
    .from(broadcastRequests)
    .where(
      and(
        eq(broadcastRequests.entityType, "event"),
        eq(broadcastRequests.entityId, entityId)
      )
    )
    .limit(1)
    .then((r) => r[0]);
  if (!req) return c.json({ ok: true, request: null });

  const channels = await db
    .select()
    .from(broadcastChannels)
    .where(eq(broadcastChannels.broadcastRequestId, req.id));

  return c.json({
    ok: true,
    request: { id: req.id, createdBy: req.createdBy, channels },
  });
});
```

Use the same shape on `announcements/byId.ts` substituting `"announcement"` for the entityType. Add the needed imports.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/components/broadcast/BroadcastPanel.tsx \
        packages/api/src/routes/admin/events/byId.ts \
        packages/api/src/routes/admin/announcements/byId.ts
git commit -m "feat: admin broadcast panel + per-artifact /broadcast read endpoint"
```

---

### Task 21: Wire `BroadcastPanel` into admin event + announcement detail pages

**Files:**
- Modify: `apps/admin/src/pages/events/EventDetailPage.tsx`
- Modify: `apps/admin/src/pages/announcements/AnnouncementDetailPage.tsx`

- [ ] **Step 1: Mount the panel on the event detail page**

Edit `apps/admin/src/pages/events/EventDetailPage.tsx`. Import:

```tsx
import { BroadcastPanel } from "@/components/broadcast/BroadcastPanel";
```

Render the panel in the section where Reviews and Comments live. Pass `entityType="event"`, `entityId={event.id}`, and `currentActorId` from the auth context (the admin app already exposes the actor — look for how the Reviews tab accesses it).

- [ ] **Step 2: Same for AnnouncementDetailPage**

Edit `apps/admin/src/pages/announcements/AnnouncementDetailPage.tsx`. Same mount, with `entityType="announcement"`.

- [ ] **Step 3: Verify manually**

Run the admin dev server. Open an event that has a broadcast request. Verify the panel renders, approve a channel, refresh — channel chip flips to `approved`. Add a channel, decline a channel, verify all the state transitions.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/pages/events/EventDetailPage.tsx \
        apps/admin/src/pages/announcements/AnnouncementDetailPage.tsx
git commit -m "feat(admin): mount BroadcastPanel on event + announcement detail"
```

---

### Task 22: `BroadcastsQueuePage` + route + nav badge

**Files:**
- Create: `apps/admin/src/pages/broadcasts/BroadcastsQueuePage.tsx`
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/src/layout/AdminNav.tsx`

- [ ] **Step 1: Implement the page**

Create `apps/admin/src/pages/broadcasts/BroadcastsQueuePage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/lib/api";

interface QueueRow {
  id: string;
  channel: string;
  status: string;
  preparedText: string | null;
  decidedAt: string | null;
  lastError: string | null;
  attemptCount: number;
  entityType: "event" | "announcement";
  entityId: string;
  title: string | null;
  slug: string | null;
}

export function BroadcastsQueuePage() {
  const apiFetch = useApi();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [includeErrored, setIncludeErrored] = useState(false);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const url = `/admin/broadcasts/queue${
      includeErrored ? "?include_errored_native=1" : ""
    }`;
    const res = await apiFetch(url);
    if (res.ok) {
      const json = (await res.json()) as { rows: QueueRow[] };
      setRows(json.rows);
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, [includeErrored]);

  async function markPosted(channelId: string) {
    const url = window.prompt("Posted URL?");
    if (!url) return;
    await apiFetch(`/admin/broadcasts/channels/${channelId}/mark-posted`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postUrl: url }),
    });
    await reload();
  }
  async function retry(channelId: string) {
    await apiFetch(`/admin/broadcasts/channels/${channelId}/retry`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    await reload();
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Broadcasts queue</h1>
      <label className="flex items-center gap-2 text-sm mb-4">
        <input
          type="checkbox"
          checked={includeErrored}
          onChange={(e) => setIncludeErrored(e.target.checked)}
        />
        Include errored native channels
      </label>
      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600">Nothing in the queue.</div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2">Artifact</th>
              <th>Channel</th>
              <th>Approved</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="py-2">
                  <Link
                    to={`/${r.entityType === "event" ? "events" : "announcements"}/${r.entityId}`}
                    className="text-purple-700 underline"
                  >
                    {r.title ?? "(untitled)"}
                  </Link>
                </td>
                <td>{r.channel}</td>
                <td>{r.decidedAt ? new Date(r.decidedAt).toLocaleString() : "—"}</td>
                <td className="max-w-xs">
                  <div className="text-xs text-gray-700 line-clamp-2">
                    {r.preparedText ?? "(empty)"}
                  </div>
                  {r.lastError && (
                    <div className="text-xs text-red-700">
                      err: {r.lastError.slice(0, 60)}
                    </div>
                  )}
                </td>
                <td className="space-x-2">
                  <button
                    type="button"
                    onClick={() => markPosted(r.id)}
                    className="text-xs bg-purple-600 text-white px-2 py-1 rounded"
                  >
                    Mark posted
                  </button>
                  {r.lastError && (
                    <button
                      type="button"
                      onClick={() => retry(r.id)}
                      className="text-xs bg-amber-600 text-white px-2 py-1 rounded"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Register the route**

Edit `apps/admin/src/App.tsx`. Add import + route:

```tsx
import { BroadcastsQueuePage } from "@/pages/broadcasts/BroadcastsQueuePage";
// ...
<Route path="/broadcasts" element={<BroadcastsQueuePage />} />
```

- [ ] **Step 3: Add nav item with badge**

Edit `apps/admin/src/layout/AdminNav.tsx`. Add a nav entry between Forms and the next item. Mimic the badge pattern used by Groups (the existing nav file shows how to fetch a count). The badge URL can call the same queue endpoint and count rows:

```tsx
const [broadcastsBadge, setBroadcastsBadge] = useState(0);
useEffect(() => {
  apiFetch("/admin/broadcasts/queue?include_errored_native=1").then(async (res) => {
    if (res.ok) {
      const json = await res.json();
      setBroadcastsBadge(json.rows?.length ?? 0);
    }
  });
}, []);
// ...
<NavLink to="/broadcasts">Broadcasts {broadcastsBadge > 0 && <Badge n={broadcastsBadge} />}</NavLink>
```

Adapt to existing `<NavLink>` and `<Badge>` patterns used by the file.

- [ ] **Step 4: Verify manually**

Run the admin dev server. Confirm the nav badge reflects current queue depth. Visit `/broadcasts`, mark a row posted, verify the row disappears and the badge decrements after a refresh.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/pages/broadcasts/ \
        apps/admin/src/App.tsx \
        apps/admin/src/layout/AdminNav.tsx
git commit -m "feat(admin): /broadcasts sub-queue page + nav badge"
```

---

# Phase G — Integration & smoke

### Task 23: Integration test — full submit → approve → publish → posted path

**Files:**
- Modify: `packages/api/src/test/integration.test.ts` (or create if missing)

- [ ] **Step 1: Write the integration test**

Append to (or create) the integration test file. The test covers the full lifecycle end-to-end against the test DB:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "./helpers";

const sql = neon(process.env.DATABASE_URL!);
const originalFetch = globalThis.fetch;

describe("broadcast integration — announcement publish flow", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    process.env.WORKSPACE_CHAT_WEBHOOK = "https://hooks.slack.com/x";
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.WORKSPACE_CHAT_WEBHOOK;
  });

  it("staff create → request channels → two approvers → publish → banner + chat posted, tweet queued", async () => {
    const users = await sql`SELECT id FROM users LIMIT 3`;
    const [author, reviewerA, reviewerB] = users.map((u) => u.id as string);

    // Author creates announcement with three channels
    const createRes = await testApp.request("/admin/announcements", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: makeStaffActor(author),
      },
      body: JSON.stringify({
        title: `Integration ${Date.now()}`,
        body: "Integration body",
        broadcast: {
          channels: ["site_banner", "workspace_chat", "twitter_x"],
          preparedText: "Promo blurb",
        },
      }),
    });
    expect(createRes.status).toBe(201);
    const { announcement } = await createRes.json();

    // Author submits for review
    await testApp.request(`/admin/announcements/${announcement.id}/transitions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: makeStaffActor(author),
      },
      body: JSON.stringify({ action: "submit_for_review" }),
    });

    // Two reviewers approve channels + artifact
    const reqRow = await sql/* sql */`
      SELECT id FROM broadcast_requests
      WHERE entity_type = 'announcement' AND entity_id = ${announcement.id}
    `;
    const channels = await sql/* sql */`
      SELECT id, channel FROM broadcast_channels
      WHERE broadcast_request_id = ${reqRow[0].id}
    `;
    for (const ch of channels) {
      await testApp.request(`/admin/broadcasts/channels/${ch.id}/approve`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(reviewerA),
        },
        body: JSON.stringify({}),
      });
    }
    for (const reviewer of [reviewerA, reviewerB]) {
      await testApp.request(`/admin/announcements/${announcement.id}/transitions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: makeStaffActor(reviewer),
        },
        body: JSON.stringify({ action: "approve" }),
      });
    }

    // Artifact should be published
    const annAfter = await sql/* sql */`
      SELECT status FROM announcements WHERE id = ${announcement.id}
    `;
    expect(annAfter[0].status).toBe("published");

    // site_banner channel should be posted; workspace_chat should be posted (webhook mock 200);
    // twitter_x should still be approved.
    const after = await sql/* sql */`
      SELECT channel, status FROM broadcast_channels
      WHERE broadcast_request_id = ${reqRow[0].id}
      ORDER BY channel
    `;
    const byChannel = Object.fromEntries(after.map((r) => [r.channel, r.status]));
    expect(byChannel.site_banner).toBe("posted");
    expect(byChannel.workspace_chat).toBe("posted");
    expect(byChannel.twitter_x).toBe("approved");

    // Active banner endpoint returns this announcement
    const bannerRes = await testApp.request("/announcements/active-banner");
    const bannerJson = await bannerRes.json();
    expect(bannerJson.banner?.id).toBe(announcement.id);

    // Twitter row is in the manual sub-queue
    const queueRes = await testApp.request("/admin/broadcasts/queue", {
      headers: { authorization: makeStaffActor(reviewerA) },
    });
    const queueJson = await queueRes.json();
    const tw = after.find((r) => r.channel === "twitter_x")!;
    expect(queueJson.rows.some((r: { id: string }) => r.id === tw.id)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the full test suite**

```bash
cd packages/api && npm test
```

Expected: every test passes — the integration test plus all unit tests from prior tasks.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/test/integration.test.ts
git commit -m "test(api): broadcast end-to-end integration test"
```

---

### Task 24: Verify in the live dev server (no commit — pure verification)

This task has no code changes. It's the manual-smoke pass required by the CLAUDE.md instruction to test UI behavior in the real app before reporting the task complete.

- [ ] **Step 1: Run the API, web, and admin dev servers**

In three terminals:

```bash
cd packages/api && npm run dev
cd apps/web && npm run dev
cd apps/admin && npm run dev
```

For the API to talk to Slack, set `WORKSPACE_CHAT_WEBHOOK` in `packages/api/.dev.vars` to a real (sandbox) Slack webhook URL. If left unset, workspace_chat will record `webhook_unset` errors — that's fine for local smoke unless you specifically want to validate the chat path.

- [ ] **Step 2: Smoke #1 — member submits an event with all three native + one social channel**

As a logged-in member, visit `/events/submit` on the web app. Submit an event with site_banner + workspace_chat + twitter_x in the Promote section. Verify in admin `/queue` that the event appears as `in_review` with broadcast channels attached.

- [ ] **Step 3: Smoke #2 — two staff approve; artifact publishes; banner shows; Slack receives; twitter rides the sub-queue**

In the admin app, as a staff user (not the author), approve each broadcast channel, then approve the event. As a second staff user, approve the event. Visit `/` on the web app — the banner should be visible if the event has a published site_banner channel (note: events don't currently show in the banner endpoint because that endpoint joins announcements; the chat post and twitter sub-queue row should still happen).

For an announcement-driven smoke (where the banner endpoint will surface the row), repeat the same flow with an announcement.

- [ ] **Step 4: Smoke #3 — manual handoff**

Visit `/broadcasts` in admin. The twitter_x row should be present. Click "Mark posted", paste a fake URL. The row should disappear, and the nav badge should decrement.

- [ ] **Step 5: Smoke #4 — webhook failure + retry**

Set `WORKSPACE_CHAT_WEBHOOK` to an invalid URL (e.g., `https://hooks.slack.com/services/X/Y/Z` that 404s). Repeat the announcement flow. After publish, the workspace_chat channel should have `status='approved'` and `last_error` set. Toggle "Include errored native channels" in `/broadcasts` — the row should appear. Click Retry with a now-valid webhook URL — channel flips to `posted`.

- [ ] **Step 6: Document outcomes**

If anything in steps 2–5 fails to behave as expected, file an issue or push a fix as a follow-up task. If all four smokes pass, the implementation is done.

---

## Self-review checklist (run after the last commit)

- [ ] `npm run typecheck` from the repo root is clean (use turbo, per the user memory note).
- [ ] `cd packages/api && npm test` is green.
- [ ] `git log --oneline cdcore09/site-redesign..HEAD` shows one commit per task (~25 commits), no accidental destructive operations.
- [ ] No `Co-Authored-By: Claude` lines in any commit message (per user memory).
- [ ] Migration `0023` is in `meta/_journal.json` with `tag: "0023_broadcast_plan5"`.

---

## Spec coverage check

| Spec section | Covered by |
|---|---|
| §1 Data model (slug, observability cols, sub-queue index) | Task 1 |
| §2.1 Dispatcher entry points | Tasks 5, 6 |
| §2.2 Trigger placement | Task 7 |
| §2.3 Chat adapter | Task 4 |
| §2.4 Late-addition fallback | Tasks 11 (approve), 15 (add-channel) |
| §3.1 Public announcement detail + active-banner slug | Tasks 2, 3 |
| §3.2 Author submit broadcast extension | Tasks 8, 9 |
| §3.3 Reviewer per-channel actions | Tasks 10, 11, 12, 13, 14, 15 |
| §3.4 Authorization (staff gate, self-approval) | Tasks 11, 12, 15 |
| §4.1 Public web UI | Tasks 16, 17, 18 |
| §4.2 Admin UI | Tasks 19, 20, 21, 22 |
| §5 Testing | Tasks 4–15 (unit per route/lib) + 23 (integration) |
| §6 Rollout (env var, no flag) | Task 4 (Bindings change), Task 24 (verification) |
| §7 Risks (failure handling, idempotency, banner stacking) | Tasks 6, 14 (retry), 11/15 (idempotent late-addition) |
