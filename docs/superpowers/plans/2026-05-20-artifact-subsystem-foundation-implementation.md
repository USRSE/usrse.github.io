# Artifact Subsystem Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the shared schema, lifecycle library, policies, audit/comment helpers, and unified queue endpoint that all three artifact subsystems (events, announcements, forms) will sit on top of. No user-facing UI in this plan — Plans 2-5 add that.

**Architecture:** Migration 0022 adds 5 new tables + extends `events` with shared columns + adds 6 new pg enums. A new `packages/api/src/lib/lifecycle/` module owns the state machine, approval counting, and atomic transition writes. Two new policies (`canEditArtifact`, `canReviewArtifact`) gate writes; the existing `requirePolicy` middleware wraps them onto routes. A single new admin endpoint (`GET /admin/queue`) returns the unified in-review surface across artifact types via UNION ALL. A stub public endpoint (`GET /api/announcements/active-banner`) returns `null` for now — Plan 3 fills it in when announcements ship.

**Tech Stack:** Drizzle ORM, Hono on Cloudflare Workers, Neon Postgres (HTTP driver), Zod, Vitest. All existing patterns from the groups + orgs subsystems.

**Spec:** [`docs/superpowers/specs/2026-05-20-events-announcements-forms-design.md`](../specs/2026-05-20-events-announcements-forms-design.md)

---

## Pre-flight

- [ ] **Check current branch and clean working tree**

```bash
git status -sb
```

Expected: on `cdcore09/site-redesign`, working tree clean. If not, stash or commit before continuing.

- [ ] **Verify baseline typecheck passes**

```bash
npm run typecheck
```

Expected: `Tasks: 5 successful, 5 total`. Fail = baseline is already broken; stop and fix before continuing.

- [ ] **Create a feature branch**

```bash
git checkout -b cdcore09/artifact-foundation
```

- [ ] **Confirm migration number is 0022**

```bash
ls packages/api/migrations/ | grep -E '^[0-9]{4}_' | tail -3
```

Expected: `0019_groups_publishable.sql`, `0020_organizations_public_profile.sql`, `0021_profile_slack_username.sql`. Next migration index is 0022.

---

## Task 1: Migration SQL — 0022_artifact_subsystem

**Files:**
- Create: `packages/api/migrations/0022_artifact_subsystem.sql`
- Modify: `packages/api/migrations/meta/_journal.json`

- [ ] **Step 1: Create the migration SQL file**

Write `packages/api/migrations/0022_artifact_subsystem.sql`:

```sql
-- Shared enums ---------------------------------------------------------------

CREATE TYPE "artifact_status" AS ENUM (
  'draft',
  'in_review',
  'changes_requested',
  'rejected',
  'published',
  'cancelled',
  'completed',
  'expired',
  'closed',
  'archived'
);--> statement-breakpoint

CREATE TYPE "artifact_scope" AS ENUM (
  'public',
  'community',
  'group',
  'staff_only'
);--> statement-breakpoint

CREATE TYPE "artifact_review_decision" AS ENUM (
  'approve',
  'reject',
  'request_changes'
);--> statement-breakpoint

CREATE TYPE "broadcast_channel" AS ENUM (
  'site_banner',
  'workspace_chat',
  'newsletter',
  'twitter_x',
  'bluesky',
  'mastodon',
  'linkedin'
);--> statement-breakpoint

CREATE TYPE "broadcast_channel_status" AS ENUM (
  'requested',
  'approved',
  'declined',
  'posted'
);--> statement-breakpoint

CREATE TYPE "artifact_entity_type" AS ENUM (
  'event',
  'announcement',
  'form',
  'group'
);--> statement-breakpoint

-- Extend existing events table ----------------------------------------------
-- Existing events are already live on the public site, so they default to
-- status='published' + scope='public'. After backfill we flip the column
-- defaults so new INSERTs default to draft/community.

ALTER TABLE "events"
  ADD COLUMN "status" "artifact_status" NOT NULL DEFAULT 'published',
  ADD COLUMN "revision" integer NOT NULL DEFAULT 1,
  ADD COLUMN "author_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  ADD COLUMN "scope" "artifact_scope" NOT NULL DEFAULT 'public',
  ADD COLUMN "host_group_id" uuid REFERENCES "groups"("id") ON DELETE SET NULL,
  ADD COLUMN "host_org_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL,
  ADD COLUMN "external_url" text,
  ADD COLUMN "thumbnail_key" text;--> statement-breakpoint

ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "scope" SET DEFAULT 'community';--> statement-breakpoint

CREATE INDEX "events_status_idx" ON "events" ("status", "created_at" DESC)
  WHERE "deleted_at" IS NULL;--> statement-breakpoint

-- announcements --------------------------------------------------------------

CREATE TABLE "announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "status" "artifact_status" NOT NULL DEFAULT 'draft',
  "revision" integer NOT NULL DEFAULT 1,
  "author_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "scope" "artifact_scope" NOT NULL DEFAULT 'community',
  "host_group_id" uuid REFERENCES "groups"("id") ON DELETE SET NULL,
  "host_org_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "link_url" text,
  "expires_at" timestamptz,
  "thumbnail_key" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);--> statement-breakpoint

CREATE INDEX "announcements_status_idx" ON "announcements" ("status", "created_at" DESC)
  WHERE "deleted_at" IS NULL;--> statement-breakpoint

-- forms ----------------------------------------------------------------------

CREATE TABLE "forms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "status" "artifact_status" NOT NULL DEFAULT 'draft',
  "revision" integer NOT NULL DEFAULT 1,
  "author_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "scope" "artifact_scope" NOT NULL DEFAULT 'community',
  "host_group_id" uuid REFERENCES "groups"("id") ON DELETE SET NULL,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "description" text,
  "schema" jsonb NOT NULL,
  "entity_type" "artifact_entity_type",
  "entity_id" uuid,
  "accepts_submissions" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  CONSTRAINT "forms_entity_both_or_neither"
    CHECK (("entity_type" IS NULL) = ("entity_id" IS NULL))
);--> statement-breakpoint

CREATE INDEX "forms_status_idx" ON "forms" ("status", "created_at" DESC)
  WHERE "deleted_at" IS NULL;--> statement-breakpoint

CREATE INDEX "forms_entity_idx" ON "forms" ("entity_type", "entity_id")
  WHERE "entity_type" IS NOT NULL;--> statement-breakpoint

-- form_submissions -----------------------------------------------------------

CREATE TABLE "form_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "form_id" uuid NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "form_revision" integer NOT NULL,
  "submitter_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "payload" jsonb NOT NULL,
  "submitted_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX "form_submissions_form_idx" ON "form_submissions" ("form_id", "submitted_at" DESC);--> statement-breakpoint

-- artifact_reviews -----------------------------------------------------------

CREATE TABLE "artifact_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_type" "artifact_entity_type" NOT NULL,
  "entity_id" uuid NOT NULL,
  "entity_revision" integer NOT NULL,
  "reviewer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "decision" "artifact_review_decision" NOT NULL,
  "comment" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX "artifact_reviews_entity_idx"
  ON "artifact_reviews" ("entity_type", "entity_id", "entity_revision");--> statement-breakpoint

-- artifact_comments ----------------------------------------------------------

CREATE TABLE "artifact_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_type" "artifact_entity_type" NOT NULL,
  "entity_id" uuid NOT NULL,
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "body" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX "artifact_comments_entity_idx"
  ON "artifact_comments" ("entity_type", "entity_id", "created_at");--> statement-breakpoint

-- broadcast_requests ---------------------------------------------------------

CREATE TABLE "broadcast_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_type" "artifact_entity_type" NOT NULL,
  "entity_id" uuid NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "broadcast_requests_unique_per_artifact"
    UNIQUE ("entity_type", "entity_id")
);--> statement-breakpoint

-- broadcast_channels ---------------------------------------------------------

CREATE TABLE "broadcast_channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "broadcast_request_id" uuid NOT NULL
    REFERENCES "broadcast_requests"("id") ON DELETE CASCADE,
  "channel" "broadcast_channel" NOT NULL,
  "status" "broadcast_channel_status" NOT NULL DEFAULT 'requested',
  "decided_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "decided_at" timestamptz,
  "posted_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "posted_at" timestamptz,
  "post_url" text,
  "decline_reason" text,
  "prepared_text" text,
  "prepared_image_key" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "broadcast_channels_unique_channel_per_request"
    UNIQUE ("broadcast_request_id", "channel")
);--> statement-breakpoint

CREATE INDEX "broadcast_channels_status_idx"
  ON "broadcast_channels" ("status", "channel")
  WHERE "status" IN ('approved', 'posted');
```

- [ ] **Step 2: Update the migrations journal**

Open `packages/api/migrations/meta/_journal.json`. After the `0019_groups_publishable` entry (the last one), append entries 20, 21, 22. The 0020 and 0021 migrations were applied via prior PRs but their journal entries are missing — add them too.

The final 3 `entries` rows should be:

```json
    {
      "idx": 20,
      "version": "7",
      "when": 1779043200000,
      "tag": "0020_organizations_public_profile",
      "breakpoints": true
    },
    {
      "idx": 21,
      "version": "7",
      "when": 1779129600000,
      "tag": "0021_profile_slack_username",
      "breakpoints": true
    },
    {
      "idx": 22,
      "version": "7",
      "when": 1779216000000,
      "tag": "0022_artifact_subsystem",
      "breakpoints": true
    }
```

(Watch the trailing comma — the existing last entry no longer has a closing-brace-only line; insert before the `]`.)

- [ ] **Step 3: Apply the migration locally**

```bash
cd packages/api
DATABASE_URL="$DATABASE_URL" npm run db:apply -- 0022_artifact_subsystem
cd ../..
```

Expected: `Migration 0022_artifact_subsystem applied`. If `db:apply` doesn't exist for individual migrations, run `npm run db:migrate` from the api workspace and let Drizzle apply pending migrations.

- [ ] **Step 4: Verify all the new tables and columns exist**

```bash
DATABASE_URL="$DATABASE_URL" node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const tables = await sql\`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND table_name IN ('announcements','forms','form_submissions',
                         'artifact_reviews','artifact_comments',
                         'broadcast_requests','broadcast_channels')
    ORDER BY table_name
  \`;
  console.log('new tables:', tables.map(t => t.table_name));
  const eventCols = await sql\`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='events'
      AND column_name IN ('status','revision','author_id','scope','host_group_id','host_org_id','external_url','thumbnail_key')
    ORDER BY column_name
  \`;
  console.log('new events columns:', eventCols.map(c => c.column_name));
})();
"
```

Expected output:
```
new tables: [ 'announcements', 'artifact_comments', 'artifact_reviews', 'broadcast_channels', 'broadcast_requests', 'form_submissions', 'forms' ]
new events columns: [ 'author_id', 'external_url', 'host_group_id', 'host_org_id', 'revision', 'scope', 'status', 'thumbnail_key' ]
```

- [ ] **Step 5: Commit**

```bash
git add packages/api/migrations/0022_artifact_subsystem.sql packages/api/migrations/meta/_journal.json
git commit -m "feat(db): add artifact subsystem schema (events extension + announcements + forms + polymorphic tables)"
```

---

## Task 2: Drizzle schema — shared enums

**Files:**
- Modify: `packages/api/src/db/schema/enums.ts`

- [ ] **Step 1: Add the new pg enums**

Open `packages/api/src/db/schema/enums.ts`. After the existing enums (eventType, eventAttendanceRole, leadershipPositionType, eventCommitteeLevel, etc.), append:

```ts
export const artifactStatus = pgEnum("artifact_status", [
  "draft",
  "in_review",
  "changes_requested",
  "rejected",
  "published",
  "cancelled",
  "completed",
  "expired",
  "closed",
  "archived",
]);

export const artifactScope = pgEnum("artifact_scope", [
  "public",
  "community",
  "group",
  "staff_only",
]);

export const artifactReviewDecision = pgEnum("artifact_review_decision", [
  "approve",
  "reject",
  "request_changes",
]);

export const broadcastChannelEnum = pgEnum("broadcast_channel", [
  "site_banner",
  "workspace_chat",
  "newsletter",
  "twitter_x",
  "bluesky",
  "mastodon",
  "linkedin",
]);

export const broadcastChannelStatus = pgEnum("broadcast_channel_status", [
  "requested",
  "approved",
  "declined",
  "posted",
]);

export const artifactEntityType = pgEnum("artifact_entity_type", [
  "event",
  "announcement",
  "form",
  "group",
]);
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS. (The enums are isolated additions; nothing else needs to change yet.)

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/db/schema/enums.ts
git commit -m "feat(db): add Drizzle enums for artifact subsystem"
```

---

## Task 3: Drizzle schema — extend events

**Files:**
- Modify: `packages/api/src/db/schema/events.ts`

- [ ] **Step 1: Add the new columns to the events table definition**

Open `packages/api/src/db/schema/events.ts`. Update the imports:

```ts
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  artifactScope,
  artifactStatus,
  eventAttendanceRole,
  eventType,
} from "./enums";
import { groups } from "./groups";
import { organizations } from "./vocab";
import { users } from "./users";
```

Replace the `events` table definition with:

```ts
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: eventType("type").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    location: text("location"),
    url: text("url"),
    description: text("description"),
    // Artifact-subsystem columns (added in migration 0022)
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
    externalUrl: text("external_url"),
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
    index("events_start_date_idx").on(t.startDate),
    index("events_type_idx").on(t.type),
    index("events_status_idx").on(t.status, t.createdAt),
  ]
);
```

(The `boolean` import is not used in this file but added for consistency with sibling schema modules — remove if your linter objects.)

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/db/schema/events.ts
git commit -m "feat(db): extend events schema with artifact columns"
```

---

## Task 4: Drizzle schema — announcements

**Files:**
- Create: `packages/api/src/db/schema/announcements.ts`

- [ ] **Step 1: Create the announcements schema module**

Write `packages/api/src/db/schema/announcements.ts`:

```ts
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { artifactScope, artifactStatus } from "./enums";
import { groups } from "./groups";
import { organizations } from "./vocab";
import { users } from "./users";

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
  (t) => [index("announcements_status_idx").on(t.status, t.createdAt)]
);

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  hostGroup: one(groups, {
    fields: [announcements.hostGroupId],
    references: [groups.id],
  }),
  hostOrg: one(organizations, {
    fields: [announcements.hostOrgId],
    references: [organizations.id],
  }),
}));
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/db/schema/announcements.ts
git commit -m "feat(db): add announcements Drizzle schema"
```

---

## Task 5: Drizzle schema — forms + form_submissions

**Files:**
- Create: `packages/api/src/db/schema/forms.ts`

- [ ] **Step 1: Create the forms schema module**

Write `packages/api/src/db/schema/forms.ts`:

```ts
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  artifactEntityType,
  artifactScope,
  artifactStatus,
} from "./enums";
import { groups } from "./groups";
import { users } from "./users";

export const forms = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: artifactStatus("status").notNull().default("draft"),
    revision: integer("revision").notNull().default(1),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    scope: artifactScope("scope").notNull().default("community"),
    hostGroupId: uuid("host_group_id").references(() => groups.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    schema: jsonb("schema").notNull(),
    entityType: artifactEntityType("entity_type"),
    entityId: uuid("entity_id"),
    acceptsSubmissions: boolean("accepts_submissions").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("forms_status_idx").on(t.status, t.createdAt),
    index("forms_entity_idx").on(t.entityType, t.entityId),
    check(
      "forms_entity_both_or_neither",
      sql`(${t.entityType} IS NULL) = (${t.entityId} IS NULL)`
    ),
  ]
);

export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    formRevision: integer("form_revision").notNull(),
    submitterUserId: uuid("submitter_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    payload: jsonb("payload").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("form_submissions_form_idx").on(t.formId, t.submittedAt)]
);

export const formsRelations = relations(forms, ({ many, one }) => ({
  submissions: many(formSubmissions),
  author: one(users, {
    fields: [forms.authorId],
    references: [users.id],
  }),
}));

export const formSubmissionsRelations = relations(formSubmissions, ({ one }) => ({
  form: one(forms, {
    fields: [formSubmissions.formId],
    references: [forms.id],
  }),
}));
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/db/schema/forms.ts
git commit -m "feat(db): add forms + form_submissions Drizzle schema"
```

---

## Task 6: Drizzle schema — polymorphic artifact tables

**Files:**
- Create: `packages/api/src/db/schema/artifacts.ts`

- [ ] **Step 1: Create the artifacts schema module**

Write `packages/api/src/db/schema/artifacts.ts`:

```ts
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  artifactEntityType,
  artifactReviewDecision,
  broadcastChannelEnum,
  broadcastChannelStatus,
} from "./enums";
import { users } from "./users";

export const artifactReviews = pgTable(
  "artifact_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: artifactEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    entityRevision: integer("entity_revision").notNull(),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    decision: artifactReviewDecision("decision").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("artifact_reviews_entity_idx").on(
      t.entityType,
      t.entityId,
      t.entityRevision
    ),
  ]
);

export const artifactComments = pgTable(
  "artifact_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: artifactEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("artifact_comments_entity_idx").on(
      t.entityType,
      t.entityId,
      t.createdAt
    ),
  ]
);

export const broadcastRequests = pgTable(
  "broadcast_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: artifactEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("broadcast_requests_unique_per_artifact").on(t.entityType, t.entityId),
  ]
);

export const broadcastChannels = pgTable(
  "broadcast_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    broadcastRequestId: uuid("broadcast_request_id")
      .notNull()
      .references(() => broadcastRequests.id, { onDelete: "cascade" }),
    channel: broadcastChannelEnum("channel").notNull(),
    status: broadcastChannelStatus("status").notNull().default("requested"),
    decidedBy: uuid("decided_by").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    postedBy: uuid("posted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postUrl: text("post_url"),
    declineReason: text("decline_reason"),
    preparedText: text("prepared_text"),
    preparedImageKey: text("prepared_image_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("broadcast_channels_unique_channel_per_request").on(
      t.broadcastRequestId,
      t.channel
    ),
    index("broadcast_channels_status_idx").on(t.status, t.channel),
  ]
);
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/db/schema/artifacts.ts
git commit -m "feat(db): add polymorphic artifact tables (reviews, comments, broadcasts)"
```

---

## Task 7: Register schema modules in the barrel file

**Files:**
- Modify: `packages/api/src/db/schema/index.ts`

- [ ] **Step 1: Add the new module exports**

Open `packages/api/src/db/schema/index.ts`. Add lines for the three new modules. The file already re-exports the existing modules; append:

```ts
export * from "./announcements";
export * from "./forms";
export * from "./artifacts";
```

(Order doesn't matter for re-exports; place them next to similarly-shaped modules.)

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/db/schema/index.ts
git commit -m "feat(db): register new schema modules in barrel"
```

---

## Task 8: Lifecycle library — types module

**Files:**
- Create: `packages/api/src/lib/lifecycle/types.ts`

- [ ] **Step 1: Create the types module**

Write `packages/api/src/lib/lifecycle/types.ts`:

```ts
/**
 * Shared types for the artifact lifecycle library.
 *
 * Three artifact types share a status machine; each only uses the subset
 * of states that makes sense. See spec §2.
 */

export type ArtifactStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "rejected"
  | "published"
  | "cancelled"
  | "completed"
  | "expired"
  | "closed"
  | "archived";

export type ArtifactScope = "public" | "community" | "group" | "staff_only";

export type ArtifactEntityType = "event" | "announcement" | "form" | "group";

export type ReviewDecision = "approve" | "reject" | "request_changes";

/**
 * Transitions an actor can request via the API. Internal-only transitions
 * (the system-driven ones like auto-`completed` / auto-`expired`) are
 * intentionally not in this set; they're computed by `effectiveStatus`.
 */
export type LifecycleAction =
  | "submit_for_review"
  | "request_changes"
  | "reject"
  | "approve"
  | "cancel"
  | "archive"
  | "close"
  | "publish"; // synthetic — emitted by applyTransition when the 2nd approval lands

/**
 * Inputs an applyTransition call needs at the row level. The lifecycle
 * library doesn't know which concrete table the artifact lives in; the
 * caller passes the resolved row + the entity_type.
 */
export interface ArtifactSnapshot {
  id: string;
  entityType: ArtifactEntityType;
  status: ArtifactStatus;
  revision: number;
  authorId: string | null;
  /** end_date for events, expires_at for announcements, undefined for forms */
  effectiveStatusInputs?: {
    endDate?: string | null;
    expiresAt?: Date | null;
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/lib/lifecycle/types.ts
git commit -m "feat(api): add lifecycle library types"
```

---

## Task 9: Lifecycle library — valid transitions table

**Files:**
- Create: `packages/api/src/lib/lifecycle/transitions.ts`
- Create: `packages/api/src/lib/lifecycle/transitions.test.ts`

- [ ] **Step 1: Write the failing test**

Write `packages/api/src/lib/lifecycle/transitions.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { isValidTransition } from "./transitions";

describe("isValidTransition", () => {
  test("draft → submit_for_review is valid for all artifact types", () => {
    for (const t of ["event", "announcement", "form"] as const) {
      expect(isValidTransition(t, "draft", "submit_for_review")).toBe(true);
    }
  });

  test("draft → approve is invalid (must submit_for_review first)", () => {
    expect(isValidTransition("event", "draft", "approve")).toBe(false);
  });

  test("in_review → approve / reject / request_changes are valid", () => {
    expect(isValidTransition("event", "in_review", "approve")).toBe(true);
    expect(isValidTransition("event", "in_review", "reject")).toBe(true);
    expect(isValidTransition("event", "in_review", "request_changes")).toBe(true);
  });

  test("changes_requested → submit_for_review (resubmit) is valid", () => {
    expect(isValidTransition("event", "changes_requested", "submit_for_review")).toBe(true);
  });

  test("rejected is terminal", () => {
    expect(isValidTransition("event", "rejected", "submit_for_review")).toBe(false);
    expect(isValidTransition("event", "rejected", "approve")).toBe(false);
  });

  test("published → cancel valid for events only", () => {
    expect(isValidTransition("event", "published", "cancel")).toBe(true);
    expect(isValidTransition("announcement", "published", "cancel")).toBe(false);
    expect(isValidTransition("form", "published", "cancel")).toBe(false);
  });

  test("published → close valid for forms only", () => {
    expect(isValidTransition("form", "published", "close")).toBe(true);
    expect(isValidTransition("event", "published", "close")).toBe(false);
    expect(isValidTransition("announcement", "published", "close")).toBe(false);
  });

  test("published → archive valid for all types", () => {
    expect(isValidTransition("event", "published", "archive")).toBe(true);
    expect(isValidTransition("announcement", "published", "archive")).toBe(true);
    expect(isValidTransition("form", "published", "archive")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails with "transitions not defined"**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/transitions.test.ts
```

Expected: FAIL with "Cannot find module './transitions'" or similar.

- [ ] **Step 3: Implement transitions.ts**

Write `packages/api/src/lib/lifecycle/transitions.ts`:

```ts
import type { ArtifactEntityType, ArtifactStatus, LifecycleAction } from "./types";

/**
 * Valid transitions: (entity type, current status) → set of allowed actions.
 *
 * Reject and request_changes are single-reviewer; approve is the only
 * action that requires the 2-vote tally to actually move state to
 * `published`. Cancel/archive/close are post-publish administrative
 * actions and only valid from `published`.
 */
type TransitionMap = Partial<Record<ArtifactStatus, ReadonlyArray<LifecycleAction>>>;

const SHARED_TRANSITIONS: TransitionMap = {
  draft: ["submit_for_review"],
  in_review: ["approve", "reject", "request_changes"],
  changes_requested: ["submit_for_review"],
  // rejected: terminal
  published: ["archive"],
  // archived: terminal
};

const TYPE_OVERRIDES: Record<ArtifactEntityType, TransitionMap> = {
  event: {
    published: ["cancel", "archive"],
    // completed: auto, terminal
    // cancelled: terminal
  },
  announcement: {
    // expired: auto, terminal
  },
  form: {
    published: ["close", "archive"],
    closed: ["archive"],
  },
  group: {
    // groups aren't a real artifact type for lifecycle purposes — included
    // in the entity-type enum because comments/reviews can attach to them
    // in future. No transitions defined here.
  },
};

export function isValidTransition(
  entityType: ArtifactEntityType,
  currentStatus: ArtifactStatus,
  action: LifecycleAction
): boolean {
  const typeOverride = TYPE_OVERRIDES[entityType][currentStatus];
  if (typeOverride !== undefined) {
    return typeOverride.includes(action);
  }
  const shared = SHARED_TRANSITIONS[currentStatus];
  return shared !== undefined && shared.includes(action);
}

export function allowedActionsFor(
  entityType: ArtifactEntityType,
  currentStatus: ArtifactStatus
): ReadonlyArray<LifecycleAction> {
  return (
    TYPE_OVERRIDES[entityType][currentStatus] ??
    SHARED_TRANSITIONS[currentStatus] ??
    []
  );
}
```

- [ ] **Step 4: Run the test, verify it passes**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/transitions.test.ts
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/lib/lifecycle/transitions.ts packages/api/src/lib/lifecycle/transitions.test.ts
git commit -m "feat(api): lifecycle library — valid transitions table"
```

---

## Task 10: Lifecycle library — effectiveStatus (auto-completed / auto-expired)

**Files:**
- Create: `packages/api/src/lib/lifecycle/effectiveStatus.ts`
- Create: `packages/api/src/lib/lifecycle/effectiveStatus.test.ts`

- [ ] **Step 1: Write the failing test**

Write `packages/api/src/lib/lifecycle/effectiveStatus.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { effectiveStatus } from "./effectiveStatus";

describe("effectiveStatus", () => {
  test("returns stored status for draft / in_review (no auto-transition)", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "event",
        status: "draft",
        revision: 1,
        authorId: null,
        effectiveStatusInputs: { endDate: "2020-01-01" },
      })
    ).toBe("draft");
  });

  test("published event past end_date auto-transitions to completed", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "event",
        status: "published",
        revision: 1,
        authorId: null,
        effectiveStatusInputs: { endDate: "2020-01-01" },
      })
    ).toBe("completed");
  });

  test("published event with future end_date stays published", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "event",
        status: "published",
        revision: 1,
        authorId: null,
        effectiveStatusInputs: { endDate: "2099-12-31" },
      })
    ).toBe("published");
  });

  test("published announcement past expires_at auto-transitions to expired", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "announcement",
        status: "published",
        revision: 1,
        authorId: null,
        effectiveStatusInputs: { expiresAt: new Date("2020-01-01") },
      })
    ).toBe("expired");
  });

  test("published announcement with no expires_at stays published", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "announcement",
        status: "published",
        revision: 1,
        authorId: null,
      })
    ).toBe("published");
  });

  test("forms never auto-transition", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "form",
        status: "published",
        revision: 1,
        authorId: null,
      })
    ).toBe("published");
  });

  test("terminal states pass through unchanged", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "event",
        status: "cancelled",
        revision: 1,
        authorId: null,
      })
    ).toBe("cancelled");
  });
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/effectiveStatus.test.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement effectiveStatus.ts**

Write `packages/api/src/lib/lifecycle/effectiveStatus.ts`:

```ts
import type { ArtifactSnapshot, ArtifactStatus } from "./types";

/**
 * Compute the effective status for an artifact at read time.
 *
 * Only `published` rows are subject to auto-transition:
 *   - events past `end_date` → `completed`
 *   - announcements past `expires_at` → `expired`
 *
 * Forms never auto-transition. The stored `status` is returned in every
 * other case.
 */
export function effectiveStatus(snap: ArtifactSnapshot): ArtifactStatus {
  if (snap.status !== "published") return snap.status;
  const now = new Date();
  if (snap.entityType === "event") {
    const endDate = snap.effectiveStatusInputs?.endDate;
    if (endDate && new Date(endDate) < now) return "completed";
  }
  if (snap.entityType === "announcement") {
    const expiresAt = snap.effectiveStatusInputs?.expiresAt;
    if (expiresAt && expiresAt < now) return "expired";
  }
  return "published";
}
```

- [ ] **Step 4: Run, verify it passes**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/effectiveStatus.test.ts
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/lib/lifecycle/effectiveStatus.ts packages/api/src/lib/lifecycle/effectiveStatus.test.ts
git commit -m "feat(api): lifecycle library — effectiveStatus read-time auto-transitions"
```

---

## Task 11: Lifecycle library — approval counter

**Files:**
- Create: `packages/api/src/lib/lifecycle/approvals.ts`
- Create: `packages/api/src/lib/lifecycle/approvals.test.ts`

- [ ] **Step 1: Write the failing test (uses an in-memory DB stub)**

Write `packages/api/src/lib/lifecycle/approvals.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { countValidApprovals } from "./approvals";

type Review = {
  entityType: "event" | "announcement" | "form" | "group";
  entityId: string;
  entityRevision: number;
  reviewerId: string;
  decision: "approve" | "reject" | "request_changes";
};

/**
 * Test helper: a fake DB that filters in-memory rows. Lets us test
 * approval logic without spinning up Postgres.
 */
function fakeDb(reviews: Review[]) {
  return {
    async listApprovalsForRevision(
      entityType: Review["entityType"],
      entityId: string,
      revision: number
    ): Promise<{ reviewerId: string }[]> {
      return reviews
        .filter(
          (r) =>
            r.entityType === entityType &&
            r.entityId === entityId &&
            r.entityRevision === revision &&
            r.decision === "approve"
        )
        .map((r) => ({ reviewerId: r.reviewerId }));
    },
  };
}

describe("countValidApprovals", () => {
  test("returns 0 when no approvals exist", async () => {
    const db = fakeDb([]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 1,
      authorId: "author-1",
    });
    expect(n).toBe(0);
  });

  test("counts distinct reviewers, excluding author", async () => {
    const db = fakeDb([
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "approve" },
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r2", decision: "approve" },
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "author-1", decision: "approve" }, // self-approve, excluded
    ]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 1,
      authorId: "author-1",
    });
    expect(n).toBe(2);
  });

  test("a single reviewer approving twice still counts as 1", async () => {
    const db = fakeDb([
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "approve" },
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "approve" },
    ]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 1,
      authorId: "author-1",
    });
    expect(n).toBe(1);
  });

  test("approvals on a different revision do not count", async () => {
    const db = fakeDb([
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "approve" },
      { entityType: "event", entityId: "e1", entityRevision: 2, reviewerId: "r2", decision: "approve" },
    ]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 2,
      authorId: "author-1",
    });
    expect(n).toBe(1);
  });

  test("reject and request_changes decisions are not approvals", async () => {
    const db = fakeDb([
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "reject" },
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r2", decision: "request_changes" },
    ]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 1,
      authorId: "author-1",
    });
    expect(n).toBe(0);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/approvals.test.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement approvals.ts**

Write `packages/api/src/lib/lifecycle/approvals.ts`:

```ts
import type { ArtifactEntityType } from "./types";

/**
 * The minimal DB surface this module needs. Production callers pass a
 * Drizzle-backed implementation; tests pass an in-memory fake.
 */
export interface ApprovalDb {
  listApprovalsForRevision(
    entityType: ArtifactEntityType,
    entityId: string,
    revision: number
  ): Promise<{ reviewerId: string }[]>;
}

export interface CountValidApprovalsInput {
  entityType: ArtifactEntityType;
  entityId: string;
  revision: number;
  /** Author id is excluded from the approval tally (self-promotion guard). */
  authorId: string | null;
}

/**
 * Count distinct reviewers (excluding the author) who have approved the
 * current revision of the artifact. Publish requires count >= 2.
 *
 * Resubmits bump the artifact's revision, so this function is naturally
 * scoped to the active revision via the revision parameter — older
 * approvals are silently ignored.
 */
export async function countValidApprovals(
  db: ApprovalDb,
  input: CountValidApprovalsInput
): Promise<number> {
  const approvals = await db.listApprovalsForRevision(
    input.entityType,
    input.entityId,
    input.revision
  );
  const distinct = new Set<string>();
  for (const row of approvals) {
    if (row.reviewerId === input.authorId) continue;
    distinct.add(row.reviewerId);
  }
  return distinct.size;
}

export const PUBLISH_APPROVAL_THRESHOLD = 2;
```

- [ ] **Step 4: Run, verify it passes**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/approvals.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/lib/lifecycle/approvals.ts packages/api/src/lib/lifecycle/approvals.test.ts
git commit -m "feat(api): lifecycle library — approval counter with self-promotion guard"
```

---

## Task 12: Lifecycle library — applyTransition orchestrator

**Files:**
- Create: `packages/api/src/lib/lifecycle/applyTransition.ts`
- Create: `packages/api/src/lib/lifecycle/applyTransition.test.ts`

This is the atomic-action piece. It validates the requested transition, writes the review row when applicable, counts approvals to decide if the publish threshold is reached, and emits the appropriate audit verb.

- [ ] **Step 1: Write the failing test**

Write `packages/api/src/lib/lifecycle/applyTransition.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { applyTransition, type LifecycleDb } from "./applyTransition";

type ArtifactRow = {
  id: string;
  status: import("./types").ArtifactStatus;
  revision: number;
  authorId: string | null;
};

type AuditRow = { action: string; targetType: string; targetId: string; payload: unknown };

function makeDb(initial: ArtifactRow): LifecycleDb & {
  events: Record<string, ArtifactRow>;
  reviews: import("./approvals").ApprovalDb["listApprovalsForRevision"] extends infer F
    ? F extends (...args: infer A) => Promise<infer R>
      ? Array<{ entityRevision: number; reviewerId: string; decision: "approve" | "reject" | "request_changes" }>
      : never
    : never;
  audits: AuditRow[];
} {
  const events: Record<string, ArtifactRow> = { [initial.id]: { ...initial } };
  const reviews: Array<{ entityRevision: number; reviewerId: string; decision: "approve" | "reject" | "request_changes" }> = [];
  const audits: AuditRow[] = [];
  return {
    events,
    reviews,
    audits,
    async fetchArtifact(entityType, id) {
      const row = events[id];
      if (!row) return null;
      return {
        id: row.id,
        entityType,
        status: row.status,
        revision: row.revision,
        authorId: row.authorId,
      };
    },
    async insertReview({ entityType, entityId, entityRevision, reviewerId, decision, comment }) {
      reviews.push({ entityRevision, reviewerId, decision });
    },
    async listApprovalsForRevision(entityType, entityId, revision) {
      return reviews
        .filter((r) => r.entityRevision === revision && r.decision === "approve")
        .map((r) => ({ reviewerId: r.reviewerId }));
    },
    async updateArtifactStatus({ entityType, entityId, status, bumpRevision }) {
      const row = events[entityId];
      if (!row) throw new Error("artifact missing");
      row.status = status;
      if (bumpRevision) row.revision += 1;
    },
    async insertAudit({ action, targetType, targetId, payload }) {
      audits.push({ action, targetType, targetId, payload });
    },
  };
}

describe("applyTransition", () => {
  test("draft → submit_for_review moves to in_review and emits audit", async () => {
    const db = makeDb({ id: "e1", status: "draft", revision: 1, authorId: "author-1" });
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "submit_for_review",
      actorId: "author-1",
    });
    expect(result.ok).toBe(true);
    expect(db.events["e1"].status).toBe("in_review");
    expect(db.audits[0].action).toBe("events.submit_for_review");
  });

  test("rejecting a draft is invalid (must be in_review)", async () => {
    const db = makeDb({ id: "e1", status: "draft", revision: 1, authorId: "author-1" });
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "reject",
      actorId: "reviewer-1",
      comment: "no",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_transition");
  });

  test("first approval keeps status at in_review (1 of 2)", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    expect(result.ok).toBe(true);
    expect(db.events["e1"].status).toBe("in_review");
    expect(db.reviews).toHaveLength(1);
  });

  test("second distinct approval publishes the artifact and audits 'publish'", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    const second = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-2",
    });
    expect(second.ok).toBe(true);
    expect(db.events["e1"].status).toBe("published");
    expect(db.audits.map((a) => a.action)).toContain("events.publish");
  });

  test("author cannot approve their own artifact", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "author-1",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("self_approval_forbidden");
  });

  test("same reviewer approving twice does not publish", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    expect(db.events["e1"].status).toBe("in_review");
  });

  test("request_changes moves to changes_requested and requires comment", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    const noComment = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "request_changes",
      actorId: "reviewer-1",
    });
    expect(noComment.ok).toBe(false);
    expect(noComment.error).toBe("comment_required");

    const withComment = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "request_changes",
      actorId: "reviewer-1",
      comment: "Please tighten the title",
    });
    expect(withComment.ok).toBe(true);
    expect(db.events["e1"].status).toBe("changes_requested");
  });

  test("resubmit from changes_requested bumps revision and invalidates prior approvals", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    // First approval on revision 1
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    // Send back
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "request_changes",
      actorId: "reviewer-2",
      comment: "edit",
    });
    // Resubmit
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "submit_for_review",
      actorId: "author-1",
    });
    expect(db.events["e1"].revision).toBe(2);
    expect(db.events["e1"].status).toBe("in_review");
    // A single approval on revision 2 should not publish (prior approval was on rev 1)
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    expect(result.ok).toBe(true);
    expect(db.events["e1"].status).toBe("in_review"); // only 1 approval on rev 2
  });
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/applyTransition.test.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement applyTransition.ts**

Write `packages/api/src/lib/lifecycle/applyTransition.ts`:

```ts
import {
  PUBLISH_APPROVAL_THRESHOLD,
  countValidApprovals,
  type ApprovalDb,
} from "./approvals";
import { isValidTransition } from "./transitions";
import type {
  ArtifactEntityType,
  ArtifactSnapshot,
  ArtifactStatus,
  LifecycleAction,
  ReviewDecision,
} from "./types";

export interface LifecycleDb extends ApprovalDb {
  fetchArtifact(
    entityType: ArtifactEntityType,
    id: string
  ): Promise<ArtifactSnapshot | null>;
  insertReview(args: {
    entityType: ArtifactEntityType;
    entityId: string;
    entityRevision: number;
    reviewerId: string;
    decision: ReviewDecision;
    comment: string | null;
  }): Promise<void>;
  updateArtifactStatus(args: {
    entityType: ArtifactEntityType;
    entityId: string;
    status: ArtifactStatus;
    bumpRevision: boolean;
  }): Promise<void>;
  insertAudit(args: {
    action: string;
    targetType: string;
    targetId: string;
    payload: Record<string, unknown> | null;
  }): Promise<void>;
}

export interface ApplyTransitionInput {
  entityType: ArtifactEntityType;
  entityId: string;
  action: LifecycleAction;
  actorId: string;
  /** Required for request_changes and reject; optional for approve. */
  comment?: string;
}

export type ApplyTransitionResult =
  | { ok: true; newStatus: ArtifactStatus }
  | {
      ok: false;
      error:
        | "not_found"
        | "invalid_transition"
        | "comment_required"
        | "self_approval_forbidden"
        | "self_review_forbidden";
    };

/**
 * Atomic transition: validates, persists, and audits in one call.
 *
 * Map of action → review-decision-side-effect:
 *   submit_for_review → no review row; sets in_review (bumps revision if from changes_requested)
 *   approve           → review row (approve); status flips to published when threshold met
 *   reject            → review row (reject); status flips to rejected immediately
 *   request_changes   → review row (request_changes); status flips to changes_requested
 *   cancel            → no review row; status flips to cancelled
 *   archive           → no review row; status flips to archived
 *   close             → no review row; status flips to closed
 */
export async function applyTransition(
  db: LifecycleDb,
  input: ApplyTransitionInput
): Promise<ApplyTransitionResult> {
  const artifact = await db.fetchArtifact(input.entityType, input.entityId);
  if (!artifact) return { ok: false, error: "not_found" };

  if (!isValidTransition(input.entityType, artifact.status, input.action)) {
    return { ok: false, error: "invalid_transition" };
  }

  // Review-decision actions guarded against self-review
  if (
    (input.action === "approve" ||
      input.action === "reject" ||
      input.action === "request_changes") &&
    artifact.authorId === input.actorId
  ) {
    return {
      ok: false,
      error:
        input.action === "approve"
          ? "self_approval_forbidden"
          : "self_review_forbidden",
    };
  }

  if (
    (input.action === "request_changes" || input.action === "reject") &&
    !input.comment?.trim()
  ) {
    return { ok: false, error: "comment_required" };
  }

  // Resolve target status and side-effects
  let newStatus: ArtifactStatus = artifact.status;
  let bumpRevision = false;
  let auditAction = "";
  let writeReview = false;
  let reviewDecision: ReviewDecision | null = null;

  switch (input.action) {
    case "submit_for_review": {
      newStatus = "in_review";
      bumpRevision = artifact.status === "changes_requested";
      auditAction = verb(input.entityType, "submit_for_review");
      break;
    }
    case "request_changes": {
      newStatus = "changes_requested";
      auditAction = verb(input.entityType, "request_changes");
      writeReview = true;
      reviewDecision = "request_changes";
      break;
    }
    case "reject": {
      newStatus = "rejected";
      auditAction = verb(input.entityType, "reject");
      writeReview = true;
      reviewDecision = "reject";
      break;
    }
    case "approve": {
      writeReview = true;
      reviewDecision = "approve";
      // Insert the approval first, then count.
      await db.insertReview({
        entityType: input.entityType,
        entityId: input.entityId,
        entityRevision: artifact.revision,
        reviewerId: input.actorId,
        decision: "approve",
        comment: input.comment?.trim() || null,
      });
      const count = await countValidApprovals(db, {
        entityType: input.entityType,
        entityId: input.entityId,
        revision: artifact.revision,
        authorId: artifact.authorId,
      });
      if (count >= PUBLISH_APPROVAL_THRESHOLD) {
        await db.updateArtifactStatus({
          entityType: input.entityType,
          entityId: input.entityId,
          status: "published",
          bumpRevision: false,
        });
        await db.insertAudit({
          action: verb(input.entityType, "publish"),
          targetType: tableName(input.entityType),
          targetId: input.entityId,
          payload: { approvalCount: count, revision: artifact.revision },
        });
        return { ok: true, newStatus: "published" };
      }
      // First approval: status unchanged, audit only
      await db.insertAudit({
        action: verb(input.entityType, "approve"),
        targetType: tableName(input.entityType),
        targetId: input.entityId,
        payload: { approvalCount: count, revision: artifact.revision },
      });
      return { ok: true, newStatus: artifact.status };
    }
    case "cancel": {
      newStatus = "cancelled";
      auditAction = verb(input.entityType, "cancel");
      break;
    }
    case "archive": {
      newStatus = "archived";
      auditAction = verb(input.entityType, "archive");
      break;
    }
    case "close": {
      newStatus = "closed";
      auditAction = verb(input.entityType, "close");
      break;
    }
    case "publish": {
      // Not directly addressable — `applyTransition` emits publish itself
      // when 2 approvals land. Treat as invalid if called explicitly.
      return { ok: false, error: "invalid_transition" };
    }
  }

  if (writeReview && reviewDecision) {
    await db.insertReview({
      entityType: input.entityType,
      entityId: input.entityId,
      entityRevision: artifact.revision,
      reviewerId: input.actorId,
      decision: reviewDecision,
      comment: input.comment?.trim() || null,
    });
  }

  await db.updateArtifactStatus({
    entityType: input.entityType,
    entityId: input.entityId,
    status: newStatus,
    bumpRevision,
  });
  await db.insertAudit({
    action: auditAction,
    targetType: tableName(input.entityType),
    targetId: input.entityId,
    payload: input.comment ? { comment: input.comment.trim() } : null,
  });

  return { ok: true, newStatus };
}

function verb(entityType: ArtifactEntityType, action: string): string {
  return `${tableName(entityType)}.${action}`;
}

function tableName(entityType: ArtifactEntityType): string {
  switch (entityType) {
    case "event":
      return "events";
    case "announcement":
      return "announcements";
    case "form":
      return "forms";
    case "group":
      return "groups";
  }
}
```

- [ ] **Step 4: Run, verify it passes**

```bash
cd packages/api && npx vitest run src/lib/lifecycle/applyTransition.test.ts
```

Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/lib/lifecycle/applyTransition.ts packages/api/src/lib/lifecycle/applyTransition.test.ts
git commit -m "feat(api): lifecycle library — applyTransition orchestrator"
```

---

## Task 13: Lifecycle library — barrel export

**Files:**
- Create: `packages/api/src/lib/lifecycle/index.ts`

- [ ] **Step 1: Create the barrel**

Write `packages/api/src/lib/lifecycle/index.ts`:

```ts
export * from "./types";
export * from "./transitions";
export * from "./effectiveStatus";
export * from "./approvals";
export * from "./applyTransition";
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/lib/lifecycle/index.ts
git commit -m "feat(api): lifecycle library — barrel export"
```

---

## Task 14: Policy — canEditArtifact

**Files:**
- Create: `packages/api/src/lib/policies/canEditArtifact.ts`
- Modify: `packages/api/src/lib/policies/index.ts`
- Modify: `packages/api/src/lib/policies/policies.test.ts`

- [ ] **Step 1: Append failing tests to the existing policies test file**

Open `packages/api/src/lib/policies/policies.test.ts` and append:

```ts
import { canEditArtifact } from "./canEditArtifact";

const memberActor = (id = "u-member") => ({
  user: { id, memberId: "m", email: "e", role: "member" as const },
  systemTier: 0 as const,
  leadershipPositions: [],
  chairedGroupIds: new Set<string>(),
  chairedEventIds: new Set<string>(),
});

const staffActor = (id = "u-staff") => ({
  ...memberActor(id),
  user: { ...memberActor(id).user, role: "staff" as const },
  systemTier: 1 as const,
});

describe("canEditArtifact", () => {
  test("staff can edit any artifact in any state", () => {
    expect(
      canEditArtifact(staffActor(), {
        entityType: "event",
        entityId: "e",
        status: "in_review",
        authorId: "someone-else",
      })
    ).toBe(true);
    expect(
      canEditArtifact(staffActor(), {
        entityType: "event",
        entityId: "e",
        status: "published",
        authorId: "someone-else",
      })
    ).toBe(true);
  });

  test("author can edit their own draft", () => {
    const a = memberActor("author-1");
    expect(
      canEditArtifact(a, {
        entityType: "event",
        entityId: "e",
        status: "draft",
        authorId: "author-1",
      })
    ).toBe(true);
  });

  test("author can edit their own changes_requested", () => {
    const a = memberActor("author-1");
    expect(
      canEditArtifact(a, {
        entityType: "event",
        entityId: "e",
        status: "changes_requested",
        authorId: "author-1",
      })
    ).toBe(true);
  });

  test("author cannot edit their own in_review (locked while reviewers look)", () => {
    const a = memberActor("author-1");
    expect(
      canEditArtifact(a, {
        entityType: "event",
        entityId: "e",
        status: "in_review",
        authorId: "author-1",
      })
    ).toBe(false);
  });

  test("non-author non-staff member cannot edit someone else's artifact", () => {
    const a = memberActor("u-1");
    expect(
      canEditArtifact(a, {
        entityType: "event",
        entityId: "e",
        status: "draft",
        authorId: "author-2",
      })
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
cd packages/api && npx vitest run src/lib/policies/policies.test.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement canEditArtifact.ts**

Write `packages/api/src/lib/policies/canEditArtifact.ts`:

```ts
import type { ArtifactEntityType, ArtifactStatus } from "../lifecycle/types";
import type { ActorContext } from "./types";

export const canEditArtifact = (
  a: ActorContext,
  scope: {
    entityType: ArtifactEntityType;
    entityId: string;
    status: ArtifactStatus;
    authorId: string | null;
  }
): boolean => {
  if (a.systemTier >= 1) return true;
  if (scope.authorId !== a.user.id) return false;
  return scope.status === "draft" || scope.status === "changes_requested";
};
```

- [ ] **Step 4: Run, verify it passes**

```bash
cd packages/api && npx vitest run src/lib/policies/policies.test.ts
```

Expected: PASS, including 5 new canEditArtifact tests.

- [ ] **Step 5: Add to policies barrel**

Open `packages/api/src/lib/policies/index.ts` and add the export line:

```ts
export { canEditArtifact } from "./canEditArtifact";
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/lib/policies/canEditArtifact.ts packages/api/src/lib/policies/index.ts packages/api/src/lib/policies/policies.test.ts
git commit -m "feat(api): canEditArtifact policy (staff or author-on-draft/changes_requested)"
```

---

## Task 15: Policy — canReviewArtifact

**Files:**
- Create: `packages/api/src/lib/policies/canReviewArtifact.ts`
- Modify: `packages/api/src/lib/policies/index.ts`
- Modify: `packages/api/src/lib/policies/policies.test.ts`

- [ ] **Step 1: Append failing test to policies.test.ts**

Append to `packages/api/src/lib/policies/policies.test.ts`:

```ts
import { canReviewArtifact } from "./canReviewArtifact";

describe("canReviewArtifact", () => {
  test("staff can review any artifact they didn't author", () => {
    expect(
      canReviewArtifact(staffActor("staff-1"), { authorId: "author-1" })
    ).toBe(true);
  });

  test("staff cannot review their own artifact (self-promotion guard)", () => {
    expect(
      canReviewArtifact(staffActor("staff-1"), { authorId: "staff-1" })
    ).toBe(false);
  });

  test("member cannot review (insufficient tier)", () => {
    expect(
      canReviewArtifact(memberActor("m-1"), { authorId: "author-1" })
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
cd packages/api && npx vitest run src/lib/policies/policies.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement canReviewArtifact.ts**

Write `packages/api/src/lib/policies/canReviewArtifact.ts`:

```ts
import type { ActorContext } from "./types";

export const canReviewArtifact = (
  a: ActorContext,
  scope: { authorId: string | null }
): boolean => a.systemTier >= 1 && a.user.id !== scope.authorId;
```

- [ ] **Step 4: Run, verify it passes**

```bash
cd packages/api && npx vitest run src/lib/policies/policies.test.ts
```

Expected: PASS — 3 new tests for canReviewArtifact.

- [ ] **Step 5: Add to barrel**

Open `packages/api/src/lib/policies/index.ts` and add:

```ts
export { canReviewArtifact } from "./canReviewArtifact";
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/lib/policies/canReviewArtifact.ts packages/api/src/lib/policies/index.ts packages/api/src/lib/policies/policies.test.ts
git commit -m "feat(api): canReviewArtifact policy (staff + not-the-author)"
```

---

## Task 16: Drizzle adapter for the LifecycleDb interface

**Files:**
- Create: `packages/api/src/lib/lifecycle/drizzleAdapter.ts`

This adapts the in-memory `LifecycleDb` interface to actual Drizzle queries. Routes use this adapter; tests use the in-memory fake.

- [ ] **Step 1: Create the adapter**

Write `packages/api/src/lib/lifecycle/drizzleAdapter.ts`:

```ts
import { and, desc, eq } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { announcements, artifactReviews, auditLog, events, forms } from "../../db/schema";
import type * as schema from "../../db/schema";
import type {
  ApplyTransitionInput,
  LifecycleDb,
} from "./applyTransition";
import type { ArtifactEntityType, ArtifactStatus, ReviewDecision } from "./types";

type Db = NeonHttpDatabase<typeof schema>;

/**
 * Production implementation of LifecycleDb backed by Drizzle.
 * Each row-touching method maps to one or two SQL statements.
 *
 * The actor's role is needed when writing audit rows; we pass it
 * separately because the lifecycle layer doesn't know about actor contexts.
 */
export function drizzleLifecycleDb(
  db: Db,
  actor: { id: string; role: "member" | "staff" | "super_admin" }
): LifecycleDb {
  return {
    async fetchArtifact(entityType, id) {
      const table = artifactTable(entityType);
      if (!table) return null;
      const row = await db
        .select({
          id: table.id,
          status: table.status,
          revision: table.revision,
          authorId: table.authorId,
          endDate: "endDate" in table ? table.endDate : undefined,
          expiresAt: "expiresAt" in table ? table.expiresAt : undefined,
        } as Record<string, unknown>)
        .from(table)
        .where(eq(table.id, id))
        .limit(1)
        .then((r) => r[0]);
      if (!row) return null;
      return {
        id: row.id as string,
        entityType,
        status: row.status as ArtifactStatus,
        revision: row.revision as number,
        authorId: (row.authorId as string | null) ?? null,
        effectiveStatusInputs: {
          endDate: (row.endDate as string | null) ?? null,
          expiresAt: (row.expiresAt as Date | null) ?? null,
        },
      };
    },

    async insertReview({
      entityType,
      entityId,
      entityRevision,
      reviewerId,
      decision,
      comment,
    }) {
      await db.insert(artifactReviews).values({
        entityType,
        entityId,
        entityRevision,
        reviewerId,
        decision: decision as ReviewDecision,
        comment,
      });
    },

    async listApprovalsForRevision(entityType, entityId, revision) {
      const rows = await db
        .select({ reviewerId: artifactReviews.reviewerId })
        .from(artifactReviews)
        .where(
          and(
            eq(artifactReviews.entityType, entityType),
            eq(artifactReviews.entityId, entityId),
            eq(artifactReviews.entityRevision, revision),
            eq(artifactReviews.decision, "approve")
          )
        );
      return rows;
    },

    async updateArtifactStatus({ entityType, entityId, status, bumpRevision }) {
      const table = artifactTable(entityType);
      if (!table) throw new Error(`unsupported entity type: ${entityType}`);
      const patch: Record<string, unknown> = {
        status,
        updatedAt: new Date(),
      };
      if (bumpRevision) {
        // We do revision = revision + 1 in a follow-up update to keep
        // this method's signature simple. Two updates in one logical
        // transition is fine — the route layer wraps the whole call in
        // an outer transaction.
        const current = await db
          .select({ revision: table.revision })
          .from(table)
          .where(eq(table.id, entityId))
          .limit(1)
          .then((r) => r[0]);
        if (current) patch.revision = current.revision + 1;
      }
      await db.update(table).set(patch).where(eq(table.id, entityId));
    },

    async insertAudit({ action, targetType, targetId, payload }) {
      await db.insert(auditLog).values({
        actorId: actor.id,
        actorRole: actor.role,
        action,
        targetType,
        targetId,
        payload,
      });
    },
  };
}

function artifactTable(entityType: ArtifactEntityType) {
  switch (entityType) {
    case "event":
      return events;
    case "announcement":
      return announcements;
    case "form":
      return forms;
    case "group":
      return null;
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS. (The strict types on `select()` may need a small adjustment; if Drizzle complains about the dynamic table selection, fall back to a union return type or one branch per entity type.)

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/lib/lifecycle/drizzleAdapter.ts
git commit -m "feat(api): Drizzle adapter for LifecycleDb interface"
```

---

## Task 17: Comment helpers

**Files:**
- Create: `packages/api/src/lib/artifacts/comments.ts`
- Create: `packages/api/src/lib/artifacts/comments.test.ts`

- [ ] **Step 1: Write the failing test**

Write `packages/api/src/lib/artifacts/comments.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { sanitizeCommentBody, COMMENT_MAX_LEN } from "./comments";

describe("sanitizeCommentBody", () => {
  test("trims whitespace", () => {
    expect(sanitizeCommentBody("  hello  ").body).toBe("hello");
  });

  test("rejects empty bodies", () => {
    expect(sanitizeCommentBody("").ok).toBe(false);
    expect(sanitizeCommentBody("   ").ok).toBe(false);
  });

  test("rejects bodies over the max length", () => {
    const long = "x".repeat(COMMENT_MAX_LEN + 1);
    expect(sanitizeCommentBody(long).ok).toBe(false);
  });

  test("accepts a normal comment", () => {
    const r = sanitizeCommentBody("This needs a clearer title.");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.body).toBe("This needs a clearer title.");
  });
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
cd packages/api && npx vitest run src/lib/artifacts/comments.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement comments.ts**

Write `packages/api/src/lib/artifacts/comments.ts`:

```ts
export const COMMENT_MAX_LEN = 4000;

export type SanitizedComment =
  | { ok: true; body: string }
  | { ok: false; error: "empty" | "too_long" };

/**
 * Normalize a comment body before insertion. Trims whitespace, rejects
 * empties, enforces the max-length cap. Doesn't touch HTML — comments
 * are rendered as plain text on the admin UI.
 */
export function sanitizeCommentBody(raw: string): SanitizedComment {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  if (trimmed.length > COMMENT_MAX_LEN) return { ok: false, error: "too_long" };
  return { ok: true, body: trimmed };
}
```

- [ ] **Step 4: Run, verify it passes**

```bash
cd packages/api && npx vitest run src/lib/artifacts/comments.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/lib/artifacts/comments.ts packages/api/src/lib/artifacts/comments.test.ts
git commit -m "feat(api): artifact comments sanitizer"
```

---

## Task 18: Unified queue endpoint — `GET /admin/queue`

**Files:**
- Create: `packages/api/src/routes/admin/queue/index.ts`
- Create: `packages/api/src/routes/admin/queue/index.test.ts`
- Modify: `packages/api/src/routes/admin/index.ts` (mount the sub-app)

- [ ] **Step 1: Write the failing test**

Write `packages/api/src/routes/admin/queue/index.test.ts`:

```ts
import { describe, expect, test, beforeAll, afterAll } from "vitest";
import { testApp, makeStaffActor, makeMemberActor, seedArtifacts } from "../../../test/helpers";

let cleanup: () => Promise<void>;

beforeAll(async () => {
  cleanup = await seedArtifacts({
    events: [
      { id: "ev-1", status: "in_review", revision: 1, authorId: "u-author", name: "Test Event", scope: "community", startDate: "2026-06-01" },
      { id: "ev-2", status: "published", revision: 1, authorId: "u-author", name: "Already Published", scope: "public", startDate: "2026-07-01" },
    ],
    announcements: [
      { id: "an-1", status: "in_review", revision: 1, authorId: "u-author", title: "Heads up", body: "..." },
    ],
    forms: [
      { id: "f-1", status: "draft", revision: 1, authorId: "u-author", slug: "x", title: "x", schema: {} },
    ],
  });
});

afterAll(async () => {
  await cleanup();
});

describe("GET /admin/queue", () => {
  test("requires staff actor", async () => {
    const res = await testApp.request("/admin/queue", {
      headers: { Authorization: makeMemberActor("u-member") },
    });
    expect(res.status).toBe(403);
  });

  test("returns in_review artifacts across all three types", async () => {
    const res = await testApp.request("/admin/queue", {
      headers: { Authorization: makeStaffActor("u-staff") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: Array<{ id: string; entityType: string; status: string }> };
    const ids = body.rows.map((r) => `${r.entityType}:${r.id}`).sort();
    expect(ids).toEqual(["announcement:an-1", "event:ev-1"]);
  });

  test("supports filtering by entity type", async () => {
    const res = await testApp.request("/admin/queue?type=event", {
      headers: { Authorization: makeStaffActor("u-staff") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: Array<{ entityType: string }> };
    expect(body.rows.every((r) => r.entityType === "event")).toBe(true);
  });
});
```

**Note:** the `packages/api/src/test/helpers.ts` referenced here is created in Task 20. If your local test runner picks this file up early, that's fine — vitest collects but doesn't execute until the explicit run.

- [ ] **Step 2: Implement the queue route**

Write `packages/api/src/routes/admin/queue/index.ts`:

```ts
import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { createDb } from "../../../db";
import type { AppEnv } from "../../../types";

export const adminQueueRoute = new Hono<AppEnv>();

/**
 * GET /admin/queue
 *
 * Returns all in_review artifacts across events, announcements, forms
 * via UNION ALL. Filters: type, scope, age_days, author_role.
 */
adminQueueRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json({ ok: false, error: "internal" }, 500);
  }
  const actor = c.get("actor");
  if (!actor || actor.systemTier < 1) {
    return c.json({ ok: false, error: "forbidden" }, 403);
  }
  const db = createDb(c.env.DATABASE_URL);

  const typeFilter = c.req.query("type");
  const scopeFilter = c.req.query("scope");

  // UNION ALL across the three artifact tables; cast columns to a common
  // shape with a literal entity_type tag.
  const rows = await db.execute(sql`
    SELECT entity_type, id, title, status, revision, scope, author_id, host_group_id, host_org_id, created_at
    FROM (
      SELECT 'event'::text AS entity_type, id, name AS title, status::text, revision, scope::text, author_id, host_group_id, host_org_id, created_at
      FROM events WHERE deleted_at IS NULL AND status = 'in_review'
      UNION ALL
      SELECT 'announcement'::text, id, title, status::text, revision, scope::text, author_id, host_group_id, NULL::uuid AS host_org_id, created_at
      FROM announcements WHERE deleted_at IS NULL AND status = 'in_review'
      UNION ALL
      SELECT 'form'::text, id, title, status::text, revision, scope::text, author_id, host_group_id, NULL::uuid, created_at
      FROM forms WHERE deleted_at IS NULL AND status = 'in_review'
    ) q
    WHERE (${typeFilter ?? null}::text IS NULL OR entity_type = ${typeFilter ?? null}::text)
      AND (${scopeFilter ?? null}::text IS NULL OR scope = ${scopeFilter ?? null}::text)
    ORDER BY created_at ASC
    LIMIT 200
  `);

  return c.json({
    ok: true,
    rows: rows.rows.map((r: Record<string, unknown>) => ({
      entityType: r.entity_type,
      id: r.id,
      title: r.title,
      status: r.status,
      revision: r.revision,
      scope: r.scope,
      authorId: r.author_id,
      hostGroupId: r.host_group_id,
      hostOrgId: r.host_org_id,
      createdAt: r.created_at,
    })),
  });
});
```

- [ ] **Step 3: Mount the route in the admin sub-app**

Open `packages/api/src/routes/admin/index.ts`. After the existing route mounts (groups, users, organizations, vocab), add:

```ts
import { adminQueueRoute } from "./queue";

adminApp.route("/queue", adminQueueRoute);
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Defer running the test until Task 20 lands the helpers**

The vitest run for this test is part of Task 20. For now, just commit.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/routes/admin/queue/index.ts packages/api/src/routes/admin/queue/index.test.ts packages/api/src/routes/admin/index.ts
git commit -m "feat(api): GET /admin/queue (UNION ALL across in_review artifacts)"
```

---

## Task 19: Active-banner endpoint stub — `GET /announcements/active-banner`

**Files:**
- Create: `packages/api/src/routes/announcements.ts`
- Modify: `packages/api/src/index.ts` (mount the route)

- [ ] **Step 1: Create the route file**

Write `packages/api/src/routes/announcements.ts`:

```ts
import { Hono } from "hono";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { createDb } from "../db";
import { announcements, broadcastChannels, broadcastRequests } from "../db/schema";
import type { AppEnv } from "../types";

export const announcementsRoute = new Hono<AppEnv>();

/**
 * GET /announcements/active-banner
 *
 * Returns at most one announcement: the most-recently-published row whose
 * effective status is `published` (not expired) AND which has at least one
 * broadcast_channels row with channel='site_banner' AND status='posted'.
 *
 * In v1, no announcements exist yet — the endpoint exists so the SPA's
 * <SiteBanner /> can mount without conditional code. Plan 3 wires the
 * real query when announcements ship.
 */
announcementsRoute.get("/active-banner", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ banner: null });
  const db = createDb(c.env.DATABASE_URL);

  const now = new Date();
  const row = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      linkUrl: announcements.linkUrl,
      expiresAt: announcements.expiresAt,
    })
    .from(announcements)
    .innerJoin(
      broadcastRequests,
      and(
        eq(broadcastRequests.entityType, "announcement"),
        eq(broadcastRequests.entityId, announcements.id)
      )
    )
    .innerJoin(
      broadcastChannels,
      and(
        eq(broadcastChannels.broadcastRequestId, broadcastRequests.id),
        eq(broadcastChannels.channel, "site_banner"),
        eq(broadcastChannels.status, "posted")
      )
    )
    .where(
      and(
        eq(announcements.status, "published"),
        isNull(announcements.deletedAt),
        or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now))
      )
    )
    .orderBy(desc(announcements.createdAt))
    .limit(1)
    .then((r) => r[0]);

  if (!row) return c.json({ banner: null });
  return c.json({
    banner: {
      id: row.id,
      title: row.title,
      body: row.body,
      linkUrl: row.linkUrl,
    },
  });
});
```

- [ ] **Step 2: Mount the route**

Open `packages/api/src/index.ts` and add the mount alongside the other public routes:

```ts
import { announcementsRoute } from "./routes/announcements";

app.route("/announcements", announcementsRoute);
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Smoke test against the dev worker**

Start the worker and curl the endpoint:

```bash
cd packages/api && npm run dev &
sleep 2
curl -s http://localhost:8787/announcements/active-banner
```

Expected: `{"banner":null}` (no announcements seeded yet). Kill the worker after verifying.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/routes/announcements.ts packages/api/src/index.ts
git commit -m "feat(api): GET /announcements/active-banner stub (returns null until Plan 3)"
```

---

## Task 20: Test helpers (db-touching integration tests)

**Files:**
- Create: `packages/api/src/test/helpers.ts`

- [ ] **Step 1: Create test helpers**

Write `packages/api/src/test/helpers.ts`:

```ts
import { neon } from "@neondatabase/serverless";
import app from "../index";

/**
 * Test helpers for integration tests that touch the real DB.
 *
 * Usage requires DATABASE_URL pointed at a test branch (a Neon branch
 * cut from main is recommended; truncate-on-teardown is faster than
 * recreate). The `seedArtifacts` helper returns a cleanup function
 * that DELETEs the inserted rows.
 *
 * Auth: actors are stubbed via the same WorkOS-token-shaped Authorization
 * header the production middleware expects. In tests we set an env flag
 * (TEST_BYPASS_AUTH=1) that the middleware honors and parses the header
 * value directly as the actor id.
 */

export const testApp = app;

export function makeStaffActor(userId: string): string {
  return `test:staff:${userId}`;
}

export function makeMemberActor(userId: string): string {
  return `test:member:${userId}`;
}

interface SeedInput {
  events?: Array<{
    id: string;
    status: string;
    revision: number;
    authorId: string;
    name: string;
    scope: string;
    startDate: string;
    endDate?: string;
  }>;
  announcements?: Array<{
    id: string;
    status: string;
    revision: number;
    authorId: string;
    title: string;
    body: string;
    expiresAt?: string;
  }>;
  forms?: Array<{
    id: string;
    status: string;
    revision: number;
    authorId: string;
    slug: string;
    title: string;
    schema: unknown;
  }>;
}

export async function seedArtifacts(input: SeedInput): Promise<() => Promise<void>> {
  const sql = neon(process.env.DATABASE_URL!);
  const insertedEventIds = (input.events ?? []).map((e) => e.id);
  const insertedAnnouncementIds = (input.announcements ?? []).map((a) => a.id);
  const insertedFormIds = (input.forms ?? []).map((f) => f.id);

  for (const e of input.events ?? []) {
    await sql`
      INSERT INTO events (id, slug, name, type, start_date, end_date, status, revision, author_id, scope)
      VALUES (
        ${e.id}, ${e.id + "-slug"}, ${e.name}, 'other', ${e.startDate}::date, ${e.endDate ?? null}::date,
        ${e.status}::artifact_status, ${e.revision}, ${e.authorId}, ${e.scope}::artifact_scope
      )
    `;
  }
  for (const a of input.announcements ?? []) {
    await sql`
      INSERT INTO announcements (id, status, revision, author_id, title, body, expires_at)
      VALUES (
        ${a.id}, ${a.status}::artifact_status, ${a.revision}, ${a.authorId},
        ${a.title}, ${a.body}, ${a.expiresAt ?? null}
      )
    `;
  }
  for (const f of input.forms ?? []) {
    await sql`
      INSERT INTO forms (id, slug, title, schema, status, revision, author_id)
      VALUES (
        ${f.id}, ${f.slug}, ${f.title}, ${JSON.stringify(f.schema)}::jsonb,
        ${f.status}::artifact_status, ${f.revision}, ${f.authorId}
      )
    `;
  }

  return async () => {
    if (insertedEventIds.length) {
      await sql`DELETE FROM events WHERE id = ANY(${insertedEventIds}::uuid[])`;
    }
    if (insertedAnnouncementIds.length) {
      await sql`DELETE FROM announcements WHERE id = ANY(${insertedAnnouncementIds}::uuid[])`;
    }
    if (insertedFormIds.length) {
      await sql`DELETE FROM forms WHERE id = ANY(${insertedFormIds}::uuid[])`;
    }
  };
}
```

- [ ] **Step 2: Add a TEST_BYPASS_AUTH branch to the actor middleware**

Open `packages/api/src/middleware/requireActorContext.ts` (or whichever file resolves the actor from the Authorization header — find it via `grep -rn "requireActorContext\|set('actor'" packages/api/src/middleware/`). Add at the very top of the resolver:

```ts
// Test escape hatch: when TEST_BYPASS_AUTH=1, parse the Authorization
// header as `test:<role>:<userId>` and synthesize an actor directly.
if (c.env.TEST_BYPASS_AUTH === "1") {
  const header = c.req.header("Authorization") ?? "";
  const match = header.match(/^test:(staff|member|super_admin):(.+)$/);
  if (match) {
    const role = match[1] as "staff" | "member" | "super_admin";
    const userId = match[2];
    c.set("actor", {
      user: { id: userId, memberId: userId, email: `${userId}@test`, role },
      systemTier: role === "member" ? 0 : role === "staff" ? 1 : 2,
      leadershipPositions: [],
      chairedGroupIds: new Set(),
      chairedEventIds: new Set(),
    });
    await next();
    return;
  }
}
```

- [ ] **Step 3: Run the queue route test**

```bash
cd packages/api && DATABASE_URL="$DATABASE_URL" TEST_BYPASS_AUTH=1 npx vitest run src/routes/admin/queue/index.test.ts
```

Expected: PASS — 3 tests.

If FAIL with auth issues, double-check the middleware bypass.
If FAIL with seed errors, verify the test DB has the migration applied.

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/test/helpers.ts packages/api/src/middleware/requireActorContext.ts
git commit -m "test(api): integration test helpers + TEST_BYPASS_AUTH escape hatch"
```

---

## Task 21: Integration smoke test — full state machine happy path

**Files:**
- Create: `packages/api/src/lib/lifecycle/integration.test.ts`

This is a single end-to-end smoke against the real DB that goes member-submit → 1st staff approve → 2nd staff approve → published. It exercises the Drizzle adapter rather than the in-memory fake.

- [ ] **Step 1: Write the integration test**

Write `packages/api/src/lib/lifecycle/integration.test.ts`:

```ts
import { beforeAll, afterAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../db/schema";
import { applyTransition } from "./applyTransition";
import { drizzleLifecycleDb } from "./drizzleAdapter";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const TEST_EVENT_ID = "00000000-0000-0000-0000-000000000a01";
const TEST_AUTHOR_ID = "00000000-0000-0000-0000-000000000a02";
const TEST_REVIEWER_1 = "00000000-0000-0000-0000-000000000a03";
const TEST_REVIEWER_2 = "00000000-0000-0000-0000-000000000a04";

beforeAll(async () => {
  // Cleanup any prior runs
  await sql`DELETE FROM events WHERE id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR_ID}::uuid, ${TEST_REVIEWER_1}::uuid, ${TEST_REVIEWER_2}::uuid)`;

  // Seed three users (we need them to satisfy author_id + reviewer_id FKs)
  for (const [id, role] of [
    [TEST_AUTHOR_ID, "member"],
    [TEST_REVIEWER_1, "staff"],
    [TEST_REVIEWER_2, "staff"],
  ] as const) {
    await sql`
      INSERT INTO users (id, email, role, status)
      VALUES (${id}::uuid, ${id + "@test"}, ${role}::user_role, 'active')
    `;
  }

  // Seed a draft event
  await sql`
    INSERT INTO events (id, slug, name, type, start_date, status, revision, author_id, scope)
    VALUES (
      ${TEST_EVENT_ID}::uuid, 'integration-test-event', 'Integration Test Event',
      'workshop', '2099-12-31'::date, 'draft', 1, ${TEST_AUTHOR_ID}::uuid, 'community'
    )
  `;
});

afterAll(async () => {
  await sql`DELETE FROM artifact_reviews WHERE entity_id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM audit_log WHERE target_id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM events WHERE id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR_ID}::uuid, ${TEST_REVIEWER_1}::uuid, ${TEST_REVIEWER_2}::uuid)`;
});

describe("artifact lifecycle integration", () => {
  test("member submits, two staff approve, event publishes", async () => {
    // 1. Author submits
    {
      const lifecycleDb = drizzleLifecycleDb(db, { id: TEST_AUTHOR_ID, role: "member" });
      const result = await applyTransition(lifecycleDb, {
        entityType: "event",
        entityId: TEST_EVENT_ID,
        action: "submit_for_review",
        actorId: TEST_AUTHOR_ID,
      });
      expect(result.ok).toBe(true);
    }

    // 2. First reviewer approves
    {
      const lifecycleDb = drizzleLifecycleDb(db, { id: TEST_REVIEWER_1, role: "staff" });
      const result = await applyTransition(lifecycleDb, {
        entityType: "event",
        entityId: TEST_EVENT_ID,
        action: "approve",
        actorId: TEST_REVIEWER_1,
      });
      expect(result.ok).toBe(true);
    }

    // Status should still be in_review
    const afterFirst = await sql`SELECT status FROM events WHERE id = ${TEST_EVENT_ID}::uuid`;
    expect(afterFirst[0].status).toBe("in_review");

    // 3. Second reviewer approves — should publish
    {
      const lifecycleDb = drizzleLifecycleDb(db, { id: TEST_REVIEWER_2, role: "staff" });
      const result = await applyTransition(lifecycleDb, {
        entityType: "event",
        entityId: TEST_EVENT_ID,
        action: "approve",
        actorId: TEST_REVIEWER_2,
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.newStatus).toBe("published");
    }

    const afterSecond = await sql`SELECT status FROM events WHERE id = ${TEST_EVENT_ID}::uuid`;
    expect(afterSecond[0].status).toBe("published");

    // Audit log should contain 4 entries: submit, approve, publish (no separate "approve" emitted for the 2nd because publish supersedes), submit_for_review
    const audits = await sql`
      SELECT action FROM audit_log WHERE target_id = ${TEST_EVENT_ID}::uuid ORDER BY created_at
    `;
    const actions = audits.map((a) => a.action);
    expect(actions).toContain("events.submit_for_review");
    expect(actions).toContain("events.approve");
    expect(actions).toContain("events.publish");
  });
});
```

- [ ] **Step 2: Run the integration test**

```bash
cd packages/api && DATABASE_URL="$DATABASE_URL" npx vitest run src/lib/lifecycle/integration.test.ts
```

Expected: PASS — 1 test, includes 3 internal applyTransition calls + a status query + audit assertion.

If FAIL with FK errors, the users table may have additional NOT NULL columns the seed missed; inspect `\d users` and add the needed columns to the seed.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/lib/lifecycle/integration.test.ts
git commit -m "test(api): integration smoke for lifecycle happy path (submit → 2x approve → publish)"
```

---

## Task 22: Run full test suite + typecheck

- [ ] **Step 1: Run all vitest tests**

```bash
cd packages/api && DATABASE_URL="$DATABASE_URL" TEST_BYPASS_AUTH=1 npm test
cd ../..
```

Expected: all green. Fix any regressions before continuing.

- [ ] **Step 2: Run full repo typecheck**

```bash
npm run typecheck
```

Expected: `Tasks: 5 successful, 5 total`.

- [ ] **Step 3: If anything failed, fix and re-run**

The most likely failures:
- Drizzle adapter type strictness on the dynamic `artifactTable()` return — split into one branch per entity type if needed.
- Test fixtures missing required columns — inspect `\d events`, `\d users` and add columns to the seed inserts.

---

## Task 23: Open the PR

- [ ] **Step 1: Push the branch**

```bash
git push -u origin cdcore09/artifact-foundation
```

- [ ] **Step 2: Open the PR against `cdcore09/site-redesign`**

```bash
gh pr create --base cdcore09/site-redesign --title "feat(api): artifact subsystem foundation (schema + lifecycle + queue)" --body "$(cat <<'EOF'
## Summary

Plan 1 of 5 from the events / announcements / forms brainstorm. Lands the shared substrate that the next four plans (events, announcements, forms, broadcast) all sit on top of.

- Migration 0022: extends `events` with `status`/`revision`/`author_id`/`scope`/`host_group_id`/`host_org_id`/`external_url`/`thumbnail_key`; adds `announcements`, `forms`, `form_submissions`, `artifact_reviews`, `artifact_comments`, `broadcast_requests`, `broadcast_channels`; six new pg enums.
- Lifecycle library at `packages/api/src/lib/lifecycle/`: valid transitions table, approval counter with self-promotion guard, effectiveStatus read-time auto-transitions, and applyTransition orchestrator (validates, persists review row, counts approvals, publishes on threshold, emits audit).
- Policies: `canEditArtifact` (staff or author-on-draft/changes_requested), `canReviewArtifact` (staff + not-the-author).
- New endpoints: `GET /admin/queue` (UNION ALL across in_review artifacts) and `GET /announcements/active-banner` (returns null until Plan 3).
- Test infrastructure: integration helpers + a TEST_BYPASS_AUTH escape hatch for header-shaped actor stubs.

No user-facing UI in this PR. Plans 2-5 add events, announcements, forms, and broadcast surfaces on top of this foundation.

## Test plan

- [ ] CI is green (typecheck + vitest)
- [ ] `curl https://<staging>/api/announcements/active-banner` returns `{"banner":null}`
- [ ] `curl -H 'Authorization: <staff token>' https://<staging>/api/admin/queue` returns `{"ok":true,"rows":[]}`
- [ ] Integration test verifies the submit → 2x approve → publish path against the staging DB
EOF
)"
```

- [ ] **Step 3: Verify CI**

```bash
gh pr checks
```

Expected: Cloudflare Pages preview both succeed; CircleCI may report a non-blocking error on legacy CI (expected on site-redesign-base PRs, per session memory).

---

## Wrap

Plan 1 (Foundation) is done when:

1. Migration 0022 applied to staging without errors.
2. All vitest suites pass (lifecycle unit tests + integration smoke + policy tests + queue route tests).
3. Full repo typecheck passes.
4. PR opened against `cdcore09/site-redesign` with the test plan checked off.

**Next:** Plan 2 (Events) — admin events list/detail/new, member submit, public `/events` extension, `/events/submit`, `/events/:slug` extension. Builds on the schema + lifecycle in this PR.

---

## Summary

This plan lands the schema migration, lifecycle library, policies, audit verbs, comment sanitizer, queue endpoint, and active-banner stub — everything that the three artifact subsystems (events, announcements, forms) need before their UI work can begin. The lifecycle library is independently tested with an in-memory DB stub and end-to-end against the real DB via an integration smoke test. Plans 2-5 sit on this foundation and add the user-facing surfaces.

## Test plan

- [ ] All vitest unit tests pass (transitions, effectiveStatus, approvals, applyTransition, comments, policies)
- [ ] Integration test passes against the test DB (submit → approve x2 → publish, with audit_log entries)
- [ ] Queue endpoint returns expected rows when seeded with mixed-type in_review artifacts
- [ ] `GET /announcements/active-banner` returns `{"banner":null}` against a clean DB
- [ ] Full repo typecheck passes (`npm run typecheck`)
- [ ] PR CI green on the Cloudflare Pages checks
