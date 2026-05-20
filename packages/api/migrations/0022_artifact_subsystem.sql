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
