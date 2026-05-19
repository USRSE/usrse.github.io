-- Adds the columns the public org directory + profile pages depend on,
-- plus a directory-serving partial index. `type` defaults to 'other'
-- so the migration applies cleanly; the type backfill script
-- reclassifies after.

CREATE TYPE org_type AS ENUM (
  'university',
  'national_lab',
  'agency',
  'company',
  'nonprofit',
  'external_resource',
  'other'
);--> statement-breakpoint

ALTER TABLE organizations
  ADD COLUMN type org_type NOT NULL DEFAULT 'other',
  ADD COLUMN country text,
  ADD COLUMN description text,
  ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;--> statement-breakpoint

CREATE INDEX organizations_directory_idx
  ON organizations (type, name)
  WHERE deleted_at IS NULL
    AND merged_into_id IS NULL
    AND status = 'approved';
