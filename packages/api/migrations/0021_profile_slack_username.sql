-- Adds slack_username to profiles for member→Slack identity mapping.
-- Used by the groups-slack reconciliation script to backfill from
-- the .data/us-rse-groups.csv export and to surface a "Slack:
-- @handle" affordance on the public member profile.

ALTER TABLE profiles
  ADD COLUMN slack_username text;--> statement-breakpoint

-- Partial unique index — null/empty values don't collide. Postgres
-- already treats NULLs as distinct in standard UNIQUE constraints,
-- but the partial form makes the intent explicit and means future
-- "(NULL = NULL handling) NULLS NOT DISTINCT" changes won't surprise us.
CREATE UNIQUE INDEX profiles_slack_username_idx
  ON profiles (lower(slack_username))
  WHERE slack_username IS NOT NULL;
