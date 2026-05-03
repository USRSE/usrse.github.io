CREATE TYPE "public"."event_presenter_role" AS ENUM('lead', 'contributor');--> statement-breakpoint
CREATE TABLE "event_session_presenters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "event_presenter_role" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event_session_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "vocab_status" DEFAULT 'approved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_session_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"type_id" uuid NOT NULL,
	"title" text NOT NULL,
	"abstract" text,
	"url" text,
	"recording_url" text,
	"doi" text,
	"presented_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "event_session_presenters" ADD CONSTRAINT "event_session_presenters_session_id_event_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."event_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_session_presenters" ADD CONSTRAINT "event_session_presenters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_type_id_event_session_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."event_session_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_session_presenters_session_user_unique" ON "event_session_presenters" USING btree ("session_id","user_id");--> statement-breakpoint
CREATE INDEX "event_session_presenters_user_idx" ON "event_session_presenters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_session_presenters_lead_idx" ON "event_session_presenters" USING btree ("role") WHERE role = 'lead';--> statement-breakpoint
CREATE INDEX "event_session_types_status_approved_idx" ON "event_session_types" USING btree ("status") WHERE status = 'approved';--> statement-breakpoint
CREATE INDEX "event_sessions_event_idx" ON "event_sessions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sessions_type_idx" ON "event_sessions" USING btree ("type_id");