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
