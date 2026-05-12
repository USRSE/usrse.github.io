import { relations, sql } from "drizzle-orm";
import {
  char,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { vocabStatus } from "./enums";
import { users } from "./users";

export const pronouns = pgTable("pronouns", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  status: vocabStatus("status").notNull().default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const degreeTypes = pgTable("degree_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  status: vocabStatus("status").notNull().default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const engagementTypes = pgTable(
  "engagement_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: vocabStatus("status").notNull().default("approved"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("engagement_types_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
  ]
);

export const careerStages = pgTable(
  "career_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: vocabStatus("status").notNull().default("approved"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("career_stages_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
  ]
);

export const countries = pgTable(
  "countries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    isoAlpha2: char("iso_alpha2", { length: 2 }).notNull().unique(),
    isoAlpha3: char("iso_alpha3", { length: 3 }).notNull().unique(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("countries_name_unique").on(t.name)]
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    status: vocabStatus("status").notNull().default("pending"),
    suggestedBy: uuid("suggested_by").references((): any => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("skills_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
  ]
);

export const disciplines = pgTable(
  "disciplines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    status: vocabStatus("status").notNull().default("pending"),
    suggestedBy: uuid("suggested_by").references((): any => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("disciplines_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
  ]
);

// Programming languages used in research software. Distinct axis from
// `skills` because (a) most members have a small finite set rather
// than a sprawling tool inventory and (b) "I write Fortran" is a
// different kind of self-description than "I use Snakemake." Mirror
// shape with disciplines/skills so the editor and resolver helpers
// stay generic.
export const languages = pgTable(
  "languages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    status: vocabStatus("status").notNull().default("pending"),
    suggestedBy: uuid("suggested_by").references((): any => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("languages_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
  ]
);

/**
 * Master directory of organizations referenced anywhere in the app —
 * member affiliations, recurring memberships, event sponsors,
 * employer history. Originally `institutions` and limited to the
 * academic/research case; renamed in 0010 once we needed to model
 * vendors, sponsors, and conference hosts in the same row space.
 *
 * `org_memberships` (recurring tier paid by the org) and
 * `event_sponsorships` (per-event tier) live in joins so a single
 * org can carry several relationships over time without column
 * sprawl on this table.
 *
 * Logo columns:
 *   - `logoUrl`        public URL for the primary mark; null when not
 *                      uploaded (consumer falls back to InitialsHex).
 *   - `logoStorageKey` R2 object key for the file we host. Distinct
 *                      from `logoUrl` so we can rotate the public URL
 *                      prefix (custom domain) without losing the
 *                      storage handle, and so we can cleanly delete
 *                      the old object on replacement.
 *   - `logoDarkUrl`    optional dark-mode variant.
 *   - `logoMarkUrl`    optional symbol-only variant for tight rows
 *                      (cmd-K results, breadcrumbs).
 *   - `logoUsageConsent` true when the org has signed off on us
 *                      hosting/displaying the mark. Required before
 *                      surfacing the logo publicly — admin tools gate
 *                      on this flag.
 *   - `logoCredit`     attribution string when the consent terms
 *                      require it ("Logo © Org, used with permission").
 */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    shortName: text("short_name"),
    url: text("url"),
    logoUrl: text("logo_url"),
    logoStorageKey: text("logo_storage_key"),
    logoDarkUrl: text("logo_dark_url"),
    logoDarkStorageKey: text("logo_dark_storage_key"),
    logoMarkUrl: text("logo_mark_url"),
    logoMarkStorageKey: text("logo_mark_storage_key"),
    logoUsageConsent: text("logo_usage_consent"),
    logoCredit: text("logo_credit"),
    status: vocabStatus("status").notNull().default("pending"),
    suggestedBy: uuid("suggested_by").references((): any => users.id, {
      onDelete: "set null",
    }),
    mergedIntoId: uuid("merged_into_id").references(
      (): any => organizations.id,
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
    index("organizations_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
    index("organizations_merged_into_idx").on(t.mergedIntoId),
    /**
     * Mirrors users_active_idx — "active" = not soft-deleted AND not
     * merged into a canonical org. This is the predicate the org
     * register's default query joins against.
     */
    index("organizations_active_idx")
      .on(t.id)
      .where(sql`deleted_at IS NULL AND merged_into_id IS NULL`),
  ]
);

// Relations
export const skillsRelations = relations(skills, ({ one }) => ({
  suggestedByUser: one(users, {
    fields: [skills.suggestedBy],
    references: [users.id],
  }),
}));

export const disciplinesRelations = relations(disciplines, ({ one }) => ({
  suggestedByUser: one(users, {
    fields: [disciplines.suggestedBy],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ one }) => ({
  suggestedByUser: one(users, {
    fields: [organizations.suggestedBy],
    references: [users.id],
  }),
  mergedInto: one(organizations, {
    fields: [organizations.mergedIntoId],
    references: [organizations.id],
    relationName: "organization_merge",
  }),
}));
