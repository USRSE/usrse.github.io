-- Phase 2.5: schema for reversible user merges.
--
-- Adds a self-referencing `merged_into_user_id` on users so duplicate
-- accounts (same person registered with two emails over time) can be
-- folded into a single canonical row without losing the audit trail.
-- The merge action itself isn't here — that ships with the upcoming
-- admin app (admin.us-rse.org) — but the column + indexes need to
-- land first so app code can write the read-side filters and chain
-- walks against a stable schema.
--
-- The existing users_active_idx predicate is widened to include the
-- merged check so listing/search queries get the same plan whether
-- they filter by deleted_at, merged_into_user_id, or both.

ALTER TABLE "users" ADD COLUMN "merged_into_user_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_merged_into_user_id_users_id_fk" FOREIGN KEY ("merged_into_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Replace users_active_idx — old predicate didn't know about merges.
DROP INDEX "users_active_idx";--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("id") WHERE deleted_at IS NULL AND merged_into_user_id IS NULL;--> statement-breakpoint

-- Targeted lookup for "what was this row merged into" — admin tooling
-- and the /me chain walker hit this when they need to follow.
CREATE INDEX "users_merged_into_idx" ON "users" USING btree ("merged_into_user_id") WHERE merged_into_user_id IS NOT NULL;
