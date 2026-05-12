-- Org merging audit + false-positive persistence, parallel to the
-- user_merges + duplicate_dismissals pair on the member side.
--
-- organization_merges captures: who merged source into target, when,
-- which rows on which tables got repointed (jsonb manifest), and
-- which fields on the target org were promoted from the source. The
-- repointedRows shape mirrors what userMerges stores so the unmerge
-- path can walk a unified manifest format.
--
-- organization_duplicate_dismissals records "not a duplicate" decisions
-- so a pair never resurfaces in /admin/organizations/duplicates. Pairs
-- are canonical-ordered (organization_a_id < organization_b_id by UUID
-- string compare) so the unique index catches both orientations.

CREATE TABLE "organization_merges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_organization_id" uuid NOT NULL,
  "target_organization_id" uuid NOT NULL,
  "merged_by_user_id" uuid,
  "reason" text,
  "repointed_rows" jsonb NOT NULL,
  "promoted_fields" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "reverted_at" timestamp with time zone,
  "reverted_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "organization_merges" ADD CONSTRAINT "organization_merges_source_fk"
  FOREIGN KEY ("source_organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "organization_merges" ADD CONSTRAINT "organization_merges_target_fk"
  FOREIGN KEY ("target_organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "organization_merges" ADD CONSTRAINT "organization_merges_merged_by_fk"
  FOREIGN KEY ("merged_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "organization_merges" ADD CONSTRAINT "organization_merges_reverted_by_fk"
  FOREIGN KEY ("reverted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null;--> statement-breakpoint

CREATE INDEX "organization_merges_source_idx" ON "organization_merges" ("source_organization_id");--> statement-breakpoint
CREATE INDEX "organization_merges_target_idx" ON "organization_merges" ("target_organization_id");--> statement-breakpoint
CREATE INDEX "organization_merges_merged_by_idx" ON "organization_merges" ("merged_by_user_id");--> statement-breakpoint
CREATE INDEX "organization_merges_created_at_idx" ON "organization_merges" ("created_at");--> statement-breakpoint
CREATE INDEX "organization_merges_active_source_idx" ON "organization_merges" ("source_organization_id")
  WHERE reverted_at IS NULL;--> statement-breakpoint

CREATE TABLE "organization_duplicate_dismissals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_a_id" uuid NOT NULL,
  "organization_b_id" uuid NOT NULL,
  "dismissed_by_user_id" uuid,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "organization_duplicate_dismissals_pair_ordering" CHECK (organization_a_id < organization_b_id)
);--> statement-breakpoint

ALTER TABLE "organization_duplicate_dismissals" ADD CONSTRAINT "organization_duplicate_dismissals_a_fk"
  FOREIGN KEY ("organization_a_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "organization_duplicate_dismissals" ADD CONSTRAINT "organization_duplicate_dismissals_b_fk"
  FOREIGN KEY ("organization_b_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "organization_duplicate_dismissals" ADD CONSTRAINT "organization_duplicate_dismissals_dismissed_by_fk"
  FOREIGN KEY ("dismissed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null;--> statement-breakpoint

CREATE UNIQUE INDEX "organization_duplicate_dismissals_pair_unique" ON "organization_duplicate_dismissals" ("organization_a_id", "organization_b_id");--> statement-breakpoint
CREATE INDEX "organization_duplicate_dismissals_a_idx" ON "organization_duplicate_dismissals" ("organization_a_id");--> statement-breakpoint
CREATE INDEX "organization_duplicate_dismissals_b_idx" ON "organization_duplicate_dismissals" ("organization_b_id");
