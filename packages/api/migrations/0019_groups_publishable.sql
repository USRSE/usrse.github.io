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
