CREATE TYPE "public"."event_attendance_role" AS ENUM('attendee', 'speaker', 'organizer', 'sponsor', 'volunteer');--> statement-breakpoint
CREATE TYPE "public"."event_committee_level" AS ENUM('chair', 'co_chair');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('conference', 'workshop', 'meetup', 'webinar', 'community_call', 'other');--> statement-breakpoint
CREATE TYPE "public"."leadership_position_type" AS ENUM('board', 'executive', 'staff', 'advisor');--> statement-breakpoint
CREATE TABLE "event_attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"role" "event_attendance_role" DEFAULT 'attendee' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" "event_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"location" text,
	"url" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_committee_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "vocab_status" DEFAULT 'approved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_committee_areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_committee_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"level" "event_committee_level" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "leadership_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"position_type" "leadership_position_type" NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "vocab_status" DEFAULT 'approved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leadership_positions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leadership_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_committee_assignments" ADD CONSTRAINT "event_committee_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_committee_assignments" ADD CONSTRAINT "event_committee_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_committee_assignments" ADD CONSTRAINT "event_committee_assignments_area_id_event_committee_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."event_committee_areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadership_terms" ADD CONSTRAINT "leadership_terms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadership_terms" ADD CONSTRAINT "leadership_terms_position_id_leadership_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."leadership_positions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_attendances_user_event_role_unique" ON "event_attendances" USING btree ("user_id","event_id","role");--> statement-breakpoint
CREATE INDEX "event_attendances_event_idx" ON "event_attendances" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_start_date_idx" ON "events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "event_committee_areas_status_approved_idx" ON "event_committee_areas" USING btree ("status") WHERE status = 'approved';--> statement-breakpoint
CREATE UNIQUE INDEX "event_committee_assignments_user_event_area_level_unique" ON "event_committee_assignments" USING btree ("user_id","event_id","area_id","level");--> statement-breakpoint
CREATE INDEX "event_committee_assignments_event_idx" ON "event_committee_assignments" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_committee_assignments_area_idx" ON "event_committee_assignments" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "event_committee_assignments_chair_idx" ON "event_committee_assignments" USING btree ("level") WHERE level = 'chair';--> statement-breakpoint
CREATE INDEX "leadership_positions_status_approved_idx" ON "leadership_positions" USING btree ("status") WHERE status = 'approved';--> statement-breakpoint
CREATE INDEX "leadership_positions_type_idx" ON "leadership_positions" USING btree ("position_type");--> statement-breakpoint
CREATE INDEX "leadership_terms_user_idx" ON "leadership_terms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leadership_terms_position_idx" ON "leadership_terms" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "leadership_terms_current_idx" ON "leadership_terms" USING btree ("end_date") WHERE end_date IS NULL;