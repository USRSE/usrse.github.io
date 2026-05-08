CREATE TABLE "user_institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"role" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_institution_id_institutions_id_fk";
--> statement-breakpoint
DROP INDEX "profiles_institution_idx";--> statement-breakpoint
ALTER TABLE "user_institutions" ADD CONSTRAINT "user_institutions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_institutions" ADD CONSTRAINT "user_institutions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_institutions_user_institution_unique" ON "user_institutions" USING btree ("user_id","institution_id");--> statement-breakpoint
CREATE INDEX "user_institutions_user_idx" ON "user_institutions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_institutions_institution_idx" ON "user_institutions" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_institutions_one_primary_per_user" ON "user_institutions" USING btree ("user_id") WHERE is_primary = true;--> statement-breakpoint
-- Data move: copy every existing profiles.institution_id into the new
-- join table as the member's primary affiliation. Done before the
-- column drop so no information is lost. The partial unique index
-- enforces "one primary per user" — there's at most one row per user
-- in profiles, so no duplicates can arise here.
INSERT INTO "user_institutions" ("user_id", "institution_id", "is_primary")
SELECT "user_id", "institution_id", true
FROM "profiles"
WHERE "institution_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "institution_id";