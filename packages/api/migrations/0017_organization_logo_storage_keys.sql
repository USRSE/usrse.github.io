-- Bring the dark and mark logo variants in line with the main variant:
-- give each its own R2 object key so the upload pipeline can swap and
-- delete bytes per-variant without ambiguity. Pre-existing rows that
-- only have logo_url / logo_dark_url / logo_mark_url stay valid — the
-- new columns are nullable, and the storage helper falls back to
-- external-URL semantics when no key is set.

ALTER TABLE "organizations"
  ADD COLUMN "logo_dark_storage_key" text;--> statement-breakpoint

ALTER TABLE "organizations"
  ADD COLUMN "logo_mark_storage_key" text;
