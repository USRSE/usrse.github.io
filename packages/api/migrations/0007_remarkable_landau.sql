CREATE TABLE "languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "vocab_status" DEFAULT 'pending' NOT NULL,
	"suggested_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "languages_name_unique" UNIQUE("name"),
	CONSTRAINT "languages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_languages" (
	"user_id" uuid NOT NULL,
	"language_id" uuid NOT NULL,
	CONSTRAINT "user_languages_user_id_language_id_pk" PRIMARY KEY("user_id","language_id")
);
--> statement-breakpoint
ALTER TABLE "languages" ADD CONSTRAINT "languages_suggested_by_users_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_languages" ADD CONSTRAINT "user_languages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_languages" ADD CONSTRAINT "user_languages_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "languages_status_approved_idx" ON "languages" USING btree ("status") WHERE status = 'approved';--> statement-breakpoint
-- Migrate the 13 programming-language entries from `skills` into the new
-- `languages` axis, copying any user_skills links over to user_languages
-- before deleting the source skill rows. Wrapped in CTEs so the whole
-- thing runs as one Postgres statement — the data-modifying CTEs see a
-- single shared snapshot, so the join from user_skills works against the
-- pre-delete state of `skills` even though the DELETE is in the same
-- statement. No ON CONFLICT needed on the language insert because the
-- table is brand new from the CREATE TABLE above.
WITH moved_languages AS (
  INSERT INTO "languages" (name, slug, status)
  SELECT name, slug, status FROM "skills"
  WHERE name IN (
    'Python', 'R', 'Julia', 'C++', 'C', 'Fortran',
    'JavaScript', 'TypeScript', 'Rust', 'Go', 'Java',
    'Bash / Shell', 'MATLAB'
  )
  RETURNING id, slug
),
copied_links AS (
  INSERT INTO "user_languages" (user_id, language_id)
  SELECT us.user_id, ml.id
  FROM "user_skills" us
  JOIN "skills" s ON s.id = us.skill_id
  JOIN moved_languages ml ON ml.slug = s.slug
  ON CONFLICT DO NOTHING
  RETURNING 1
)
DELETE FROM "skills" WHERE name IN (
  'Python', 'R', 'Julia', 'C++', 'C', 'Fortran',
  'JavaScript', 'TypeScript', 'Rust', 'Go', 'Java',
  'Bash / Shell', 'MATLAB'
);