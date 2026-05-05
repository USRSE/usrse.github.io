CREATE TYPE "public"."work_source" AS ENUM('orcid', 'manual');--> statement-breakpoint
CREATE TYPE "public"."work_type" AS ENUM('paper', 'talk', 'panel', 'workshop', 'software', 'dataset', 'other');--> statement-breakpoint
CREATE TABLE "works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "work_type" NOT NULL,
	"title" text NOT NULL,
	"venue" text,
	"work_date" date,
	"doi" text,
	"url" text,
	"pdf_url" text,
	"slides_url" text,
	"video_url" text,
	"abstract" text,
	"collaborators" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"source" "work_source" NOT NULL,
	"source_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "works_user_date_idx" ON "works" USING btree ("user_id","work_date");--> statement-breakpoint
CREATE UNIQUE INDEX "works_orcid_unique" ON "works" USING btree ("user_id","source_id") WHERE source = 'orcid';