-- Bring `organizations` in line with `users`/`profiles` by adding the
-- updated_at + deleted_at audit columns the admin app's edit-tracking
-- and soft-delete/restore flows require. Also adds an "active" partial
-- index mirroring users_active_idx so the org register's default query
-- (not deleted, not merged) stays index-served.

ALTER TABLE "organizations"
  ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint

ALTER TABLE "organizations"
  ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint

CREATE INDEX "organizations_active_idx" ON "organizations" ("id")
  WHERE deleted_at IS NULL AND merged_into_id IS NULL;
