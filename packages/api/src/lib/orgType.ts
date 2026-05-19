/**
 * The seven values of the `org_type` enum. Keep in sync with the
 * Drizzle enum declaration in db/schema/enums.ts and the SQL ENUM
 * defined by migration 0020.
 */
export const ORG_TYPES = [
  "university",
  "national_lab",
  "agency",
  "company",
  "nonprofit",
  "external_resource",
  "other",
] as const;

export type OrgType = (typeof ORG_TYPES)[number];
