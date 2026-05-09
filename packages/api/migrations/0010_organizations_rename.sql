-- Phase 2: rename institutions → organizations, add org_memberships +
-- event_sponsorships, drop the booleans is_org_member/org_tier (now
-- modelled as org_memberships rows), add logo columns + R2 storage
-- handle.
--
-- The rename is a no-op for the row data — all uuids and FK targets
-- stay valid. Index/constraint names get renamed alongside the table
-- so post-rename schema reads consistently.
--
-- Hand-written instead of drizzle-kit-generated because the rename
-- triggers an interactive enum-rename prompt that doesn't work over
-- the no-TTY apply-migration runner.

-- ── New enums ─────────────────────────────────────────────────────────
CREATE TYPE "org_membership_tier" AS ENUM('premier', 'standard', 'basic');--> statement-breakpoint
CREATE TYPE "sponsor_tier" AS ENUM('platinum', 'gold', 'silver', 'bronze', 'supporter', 'in_kind');--> statement-breakpoint

-- ── Drop the booleans + the org_tier enum that fed them ──────────────
-- A check at write time confirmed there are 0 rows with is_org_member =
-- true today, so no data migration into org_memberships is needed.
-- Future memberships will be authored through the new table.
ALTER TABLE "institutions" DROP COLUMN "is_org_member";--> statement-breakpoint
ALTER TABLE "institutions" DROP COLUMN "org_tier";--> statement-breakpoint
DROP TYPE "org_tier";--> statement-breakpoint

-- ── Add logo columns ─────────────────────────────────────────────────
ALTER TABLE "institutions" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "logo_storage_key" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "logo_dark_url" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "logo_mark_url" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "logo_usage_consent" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "logo_credit" text;--> statement-breakpoint

-- ── Rename institutions → organizations ──────────────────────────────
ALTER TABLE "institutions" RENAME TO "organizations";--> statement-breakpoint
ALTER INDEX "institutions_status_approved_idx" RENAME TO "organizations_status_approved_idx";--> statement-breakpoint
ALTER INDEX "institutions_merged_into_idx" RENAME TO "organizations_merged_into_idx";--> statement-breakpoint
ALTER TABLE "organizations" RENAME CONSTRAINT "institutions_pkey" TO "organizations_pkey";--> statement-breakpoint
ALTER TABLE "organizations" RENAME CONSTRAINT "institutions_name_unique" TO "organizations_name_unique";--> statement-breakpoint
ALTER TABLE "organizations" RENAME CONSTRAINT "institutions_slug_unique" TO "organizations_slug_unique";--> statement-breakpoint
ALTER TABLE "organizations" RENAME CONSTRAINT "institutions_suggested_by_users_id_fk" TO "organizations_suggested_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "organizations" RENAME CONSTRAINT "institutions_merged_into_id_institutions_id_fk" TO "organizations_merged_into_id_organizations_id_fk";--> statement-breakpoint

-- ── Rename user_institutions → user_organizations + column ───────────
ALTER TABLE "user_institutions" RENAME TO "user_organizations";--> statement-breakpoint
ALTER TABLE "user_organizations" RENAME COLUMN "institution_id" TO "organization_id";--> statement-breakpoint
ALTER INDEX "user_institutions_user_institution_unique" RENAME TO "user_organizations_user_org_unique";--> statement-breakpoint
ALTER INDEX "user_institutions_user_idx" RENAME TO "user_organizations_user_idx";--> statement-breakpoint
ALTER INDEX "user_institutions_institution_idx" RENAME TO "user_organizations_org_idx";--> statement-breakpoint
ALTER INDEX "user_institutions_one_primary_per_user" RENAME TO "user_organizations_one_primary_per_user";--> statement-breakpoint
ALTER TABLE "user_organizations" RENAME CONSTRAINT "user_institutions_pkey" TO "user_organizations_pkey";--> statement-breakpoint
ALTER TABLE "user_organizations" RENAME CONSTRAINT "user_institutions_user_id_users_id_fk" TO "user_organizations_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "user_organizations" RENAME CONSTRAINT "user_institutions_institution_id_institutions_id_fk" TO "user_organizations_organization_id_organizations_id_fk";--> statement-breakpoint

-- ── New table: org_memberships ───────────────────────────────────────
CREATE TABLE "org_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tier" "org_membership_tier" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"renewal_due_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_memberships_org_idx" ON "org_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_memberships_one_active_per_org" ON "org_memberships" USING btree ("organization_id") WHERE ended_at IS NULL;--> statement-breakpoint

-- ── New table: event_sponsorships ────────────────────────────────────
CREATE TABLE "event_sponsorships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"tier" "sponsor_tier" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "event_sponsorships" ADD CONSTRAINT "event_sponsorships_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsorships" ADD CONSTRAINT "event_sponsorships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_sponsorships_event_org_unique" ON "event_sponsorships" USING btree ("event_id","organization_id");--> statement-breakpoint
CREATE INDEX "event_sponsorships_event_idx" ON "event_sponsorships" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sponsorships_org_idx" ON "event_sponsorships" USING btree ("organization_id");
