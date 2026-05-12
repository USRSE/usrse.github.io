import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { userRole } from "./enums";
import { careerStages, countries, pronouns } from "./vocab";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workosId: text("workos_id").notNull().unique(),
    memberId: text("member_id").notNull().unique(),
    email: text("email").notNull().unique(),
    role: userRole("role").notNull().default("member"),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    isLegacyImport: boolean("is_legacy_import").notNull().default(false),
    /**
     * When set, this user has been merged into the referenced canonical
     * user. The row stays for audit (who merged what, when), but
     * downstream queries — directory listing, public profile lookups —
     * treat a merged user as not-active. The /me handler walks the
     * chain so a member whose account got merged still lands on their
     * canonical dossier when they sign in.
     *
     * Mirrors `organizations.merged_into_id`. Reversible because the
     * source row is preserved.
     */
    mergedIntoUserId: uuid("merged_into_user_id").references(
      (): any => users.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    /**
     * "Active" now means not soft-deleted AND not merged into another
     * canonical user. Both conditions hide the row from directory /
     * public-profile surfaces. The composite predicate is what every
     * read-side query joins against — making it part of the partial
     * index keeps the planner happy without a second filter step.
     */
    index("users_active_idx")
      .on(t.id)
      .where(sql`deleted_at IS NULL AND merged_into_user_id IS NULL`),
    index("users_legacy_import_idx")
      .on(t.isLegacyImport)
      .where(sql`is_legacy_import = true`),
    /** Fast lookup of "what did this row merge into" — used by /me's
        chain walker and any future audit tooling. */
    index("users_merged_into_idx")
      .on(t.mergedIntoUserId)
      .where(sql`merged_into_user_id IS NOT NULL`),
  ]
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    displayName: text("display_name").notNull(),
    headline: text("headline"),
    pronounId: uuid("pronoun_id").references(() => pronouns.id, {
      onDelete: "set null",
    }),
    bio: text("bio"),
    photoUrl: text("photo_url"),
    // R2 object key for the photo we host (when source is an upload
    // or url-import). Null when photoUrl points at an external host
    // or there's no photo. Distinct from photoUrl so we can swap the
    // public URL prefix later (custom domain) without losing the
    // storage handle, and so we can clean up the old object on
    // replacement.
    photoStorageKey: text("photo_storage_key"),
    // organizationId moved to user_organizations join table — a member
    // can have multiple affiliations now, with one is_primary=true
    // driving the dossier's "based at" pillar.
    jobTitle: text("job_title"),
    careerStageId: uuid("career_stage_id").references(() => careerStages.id, {
      onDelete: "set null",
    }),
    githubUrl: text("github_url"),
    linkedinUrl: text("linkedin_url"),
    orcid: text("orcid"),
    websiteUrl: text("website_url"),
    countryId: uuid("country_id").references(() => countries.id, {
      onDelete: "set null",
    }),
    region: text("region"),
    city: text("city"),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    showOnMap: boolean("show_on_map").notNull().default(false),
    publicLocation: text("public_location"),
    isPublic: boolean("is_public").notNull().default(true),
    // When isPublic is false, isDiscoverable controls whether the
    // member still appears in the directory/search as a stub. Three
    // privacy states are derived from these two booleans:
    //   isPublic=true                          → "Public" (full profile, listed)
    //   isPublic=false, isDiscoverable=true    → "Listed (private)" (stub-only)
    //   isPublic=false, isDiscoverable=false   → "Hidden" (not listed)
    // Defaults to false so opting *out* of public visibility is a
    // single decision — opting *back in* to discovery is a separate
    // affirmative choice.
    isDiscoverable: boolean("is_discoverable").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("profiles_country_idx").on(t.countryId),
    index("profiles_show_on_map_idx")
      .on(t.showOnMap)
      .where(sql`show_on_map = true`),
  ]
);

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  pronoun: one(pronouns, {
    fields: [profiles.pronounId],
    references: [pronouns.id],
  }),
  careerStage: one(careerStages, {
    fields: [profiles.careerStageId],
    references: [careerStages.id],
  }),
  country: one(countries, {
    fields: [profiles.countryId],
    references: [countries.id],
  }),
}));

export const userMerges = pgTable(
  "user_merges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceUserId: uuid("source_user_id")
      .notNull()
      .references((): any => users.id, { onDelete: "restrict" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references((): any => users.id, { onDelete: "restrict" }),
    mergedByUserId: uuid("merged_by_user_id").references(
      (): any => users.id,
      { onDelete: "set null" }
    ),
    reason: text("reason"),
    repointedRows: jsonb("repointed_rows").notNull(),
    promotedFields: jsonb("promoted_fields")
      .notNull()
      .default(sql`'{}'::jsonb`),
    revertedAt: timestamp("reverted_at", { withTimezone: true }),
    revertedByUserId: uuid("reverted_by_user_id").references(
      (): any => users.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("user_merges_source_idx").on(t.sourceUserId),
    index("user_merges_target_idx").on(t.targetUserId),
    index("user_merges_merged_by_idx").on(t.mergedByUserId),
    index("user_merges_created_at_idx").on(t.createdAt),
    index("user_merges_active_source_idx")
      .on(t.sourceUserId)
      .where(sql`reverted_at IS NULL`),
  ]
);

export const userMergesRelations = relations(userMerges, ({ one }) => ({
  sourceUser: one(users, {
    fields: [userMerges.sourceUserId],
    references: [users.id],
    relationName: "merge_source",
  }),
  targetUser: one(users, {
    fields: [userMerges.targetUserId],
    references: [users.id],
    relationName: "merge_target",
  }),
  mergedBy: one(users, {
    fields: [userMerges.mergedByUserId],
    references: [users.id],
    relationName: "merged_by",
  }),
  revertedBy: one(users, {
    fields: [userMerges.revertedByUserId],
    references: [users.id],
    relationName: "reverted_by",
  }),
}));

/**
 * Admin "not a duplicate" decisions. The candidate-pair scorer is
 * on-demand, so without persistence the same false-positive pair
 * would resurface on every load. Pairs are canonical-ordered
 * (user_a_id < user_b_id by UUID string compare) — enforced both by
 * a CHECK constraint in the migration and by the dismiss endpoint —
 * so the unique index catches both orientations.
 */
export const duplicateDismissals = pgTable(
  "duplicate_dismissals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAId: uuid("user_a_id")
      .notNull()
      .references((): any => users.id, { onDelete: "cascade" }),
    userBId: uuid("user_b_id")
      .notNull()
      .references((): any => users.id, { onDelete: "cascade" }),
    dismissedByUserId: uuid("dismissed_by_user_id").references(
      (): any => users.id,
      { onDelete: "set null" }
    ),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("duplicate_dismissals_pair_unique").on(t.userAId, t.userBId),
    index("duplicate_dismissals_user_a_idx").on(t.userAId),
    index("duplicate_dismissals_user_b_idx").on(t.userBId),
  ]
);
