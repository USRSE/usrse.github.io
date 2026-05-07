CREATE TYPE "public"."award_accent" AS ENUM('purple', 'teal', 'amber', 'rose', 'graphite', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."award_tier" AS ENUM('lifetime', 'special', 'annual');--> statement-breakpoint
CREATE TYPE "public"."contribution_kind" AS ENUM('newsletter', 'tutorial', 'guide', 'resource', 'translation', 'community_call_host', 'blog_post', 'podcast', 'other');--> statement-breakpoint
CREATE TABLE "awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"tier" "award_tier" NOT NULL,
	"accent" "award_accent" DEFAULT 'amber' NOT NULL,
	"status" "vocab_status" DEFAULT 'approved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "awards_name_unique" UNIQUE("name"),
	CONSTRAINT "awards_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "community_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contributor_id" uuid NOT NULL,
	"kind" "contribution_kind" NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"published_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_pairings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"mentee_id" uuid NOT NULL,
	"program_slug" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"award_id" uuid NOT NULL,
	"awarded_at" timestamp with time zone NOT NULL,
	"awarding_event_id" uuid,
	"citation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_contributions" ADD CONSTRAINT "community_contributions_contributor_id_users_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_pairings" ADD CONSTRAINT "mentorship_pairings_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_pairings" ADD CONSTRAINT "mentorship_pairings_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_awards" ADD CONSTRAINT "user_awards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_awards" ADD CONSTRAINT "user_awards_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_awards" ADD CONSTRAINT "user_awards_awarding_event_id_events_id_fk" FOREIGN KEY ("awarding_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_contributions_contributor_idx" ON "community_contributions" USING btree ("contributor_id");--> statement-breakpoint
CREATE INDEX "community_contributions_kind_idx" ON "community_contributions" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "mentorship_pairings_mentor_idx" ON "mentorship_pairings" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "mentorship_pairings_mentee_idx" ON "mentorship_pairings" USING btree ("mentee_id");--> statement-breakpoint
CREATE INDEX "user_awards_user_idx" ON "user_awards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_awards_award_idx" ON "user_awards" USING btree ("award_id");