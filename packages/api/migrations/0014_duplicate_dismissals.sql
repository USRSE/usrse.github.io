-- Records admin "not a duplicate" decisions so a pair never resurfaces
-- in /admin/users/duplicates. Pairs are canonical-ordered (user_a_id <
-- user_b_id, lexicographically by UUID string) so the unique index
-- catches both orientations — dismissing (A, B) also covers (B, A).

CREATE TABLE "duplicate_dismissals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_a_id" uuid NOT NULL,
  "user_b_id" uuid NOT NULL,
  "dismissed_by_user_id" uuid,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "duplicate_dismissals_pair_ordering" CHECK (user_a_id < user_b_id)
);--> statement-breakpoint

ALTER TABLE "duplicate_dismissals" ADD CONSTRAINT "duplicate_dismissals_user_a_id_users_id_fk"
  FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "duplicate_dismissals" ADD CONSTRAINT "duplicate_dismissals_user_b_id_users_id_fk"
  FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "duplicate_dismissals" ADD CONSTRAINT "duplicate_dismissals_dismissed_by_user_id_users_id_fk"
  FOREIGN KEY ("dismissed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null;--> statement-breakpoint

CREATE UNIQUE INDEX "duplicate_dismissals_pair_unique" ON "duplicate_dismissals" ("user_a_id", "user_b_id");--> statement-breakpoint
CREATE INDEX "duplicate_dismissals_user_a_idx" ON "duplicate_dismissals" ("user_a_id");--> statement-breakpoint
CREATE INDEX "duplicate_dismissals_user_b_idx" ON "duplicate_dismissals" ("user_b_id");
