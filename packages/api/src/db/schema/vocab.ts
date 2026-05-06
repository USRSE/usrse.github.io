import { relations, sql } from "drizzle-orm";
import {
  boolean,
  char,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { orgTier, vocabStatus } from "./enums";
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

export const institutions = pgTable(
  "institutions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    shortName: text("short_name"),
    url: text("url"),
    isOrgMember: boolean("is_org_member").notNull().default(false),
    orgTier: orgTier("org_tier"),
    status: vocabStatus("status").notNull().default("pending"),
    suggestedBy: uuid("suggested_by").references((): any => users.id, {
      onDelete: "set null",
    }),
    mergedIntoId: uuid("merged_into_id").references((): any => institutions.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("institutions_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
    index("institutions_merged_into_idx").on(t.mergedIntoId),
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

export const institutionsRelations = relations(institutions, ({ one }) => ({
  suggestedByUser: one(users, {
    fields: [institutions.suggestedBy],
    references: [users.id],
  }),
  mergedInto: one(institutions, {
    fields: [institutions.mergedIntoId],
    references: [institutions.id],
    relationName: "institution_merge",
  }),
}));
