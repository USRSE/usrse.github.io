-- Phase 2.5 follow-on: rename the legacy `admin` system role to `staff`.
--
-- The brainstorm decision is: keep the system-role enum tiny
-- (`member` / `staff` / `super_admin`) and let distributed admin
-- powers (group chair, board member, event chair) come from the
-- relational tables that already model those positions.
--
-- Postgres enums don't support a literal RENAME VALUE in a
-- transaction without orphaning rows that reference the old value
-- mid-step, so the migration adds the new value, backfills, and
-- leaves the legacy value in place for one rev. A follow-up
-- migration drops it once deploys soak.

ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'staff';--> statement-breakpoint
UPDATE "users" SET "role" = 'staff' WHERE "role" = 'admin';
