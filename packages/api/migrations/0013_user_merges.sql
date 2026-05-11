-- Records each user-merge admin action so it stays reversible.
-- The repointed-rows manifest lets the unmerge endpoint replay the FK
-- moves in reverse; the promoted-fields payload records exactly which
-- canonical fields were overwritten so unmerge can restore them.

CREATE TABLE "user_merges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_user_id" uuid NOT NULL,
  "target_user_id" uuid NOT NULL,
  "merged_by_user_id" uuid,
  "reason" text,
  "repointed_rows" jsonb NOT NULL,
  "promoted_fields" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "reverted_at" timestamp with time zone,
  "reverted_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_source_user_id_users_id_fk"
  FOREIGN KEY ("source_user_id") REFERENCES "public"."users"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_target_user_id_users_id_fk"
  FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_merged_by_user_id_users_id_fk"
  FOREIGN KEY ("merged_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_reverted_by_user_id_users_id_fk"
  FOREIGN KEY ("reverted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null;--> statement-breakpoint

CREATE INDEX "user_merges_source_idx" ON "user_merges" ("source_user_id");--> statement-breakpoint
CREATE INDEX "user_merges_target_idx" ON "user_merges" ("target_user_id");--> statement-breakpoint
CREATE INDEX "user_merges_merged_by_idx" ON "user_merges" ("merged_by_user_id");--> statement-breakpoint
CREATE INDEX "user_merges_created_at_idx" ON "user_merges" ("created_at" DESC);--> statement-breakpoint

-- "Active merges" = not reverted. Partial index speeds the chain-walking
-- "is this user currently merged" check.
CREATE INDEX "user_merges_active_source_idx" ON "user_merges" ("source_user_id")
  WHERE reverted_at IS NULL;
