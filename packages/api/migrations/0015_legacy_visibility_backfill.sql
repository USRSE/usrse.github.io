-- Flip legacy-imported profiles from "Hidden" to "Listed (private)" so
-- the imported roster surfaces in the member directory and cmd+K
-- command palette as discoverable stubs. The directory response strips
-- everything but memberId + slug + displayName for non-public rows, so
-- no imported job-title / institution / contact data leaks — members
-- can still find each other, and once a legacy member signs in they
-- can promote themselves to fully public (or opt back out).
--
-- Matches the new default in scripts/import-csv.ts so re-imports
-- preserve the policy.

UPDATE "profiles" p
SET "is_discoverable" = true,
    "updated_at" = now()
FROM "users" u
WHERE u."id" = p."user_id"
  AND u."is_legacy_import" = true
  AND p."is_public" = false
  AND p."is_discoverable" = false
  AND p."deleted_at" IS NULL
  AND u."deleted_at" IS NULL
  AND u."merged_into_user_id" IS NULL;
