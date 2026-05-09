import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { orgMembershipTier, sponsorTier } from "./enums";
import { events } from "./events";
import { users } from "./users";
import {
  disciplines,
  engagementTypes,
  languages,
  organizations,
  skills,
} from "./vocab";

export const userSkills = pgTable(
  "user_skills",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] })]
);

export const userDisciplines = pgTable(
  "user_disciplines",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    disciplineId: uuid("discipline_id")
      .notNull()
      .references(() => disciplines.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.disciplineId] })]
);

export const userLanguages = pgTable(
  "user_languages",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    languageId: uuid("language_id")
      .notNull()
      .references(() => languages.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.languageId] })]
);

/**
 * Member ↔ organization affiliations. Many-to-many because most
 * members have either cross-appointments or a career arc that spans
 * multiple organizations over time. The partial unique index enforces
 * "at most one is_primary=true row per user" at the database level —
 * the badge / dossier layers can rely on that invariant without
 * defensive code.
 */
export const userOrganizations = pgTable(
  "user_organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    /** Drives the dossier's "based at" pillar and the directory facet. */
    isPrimary: boolean("is_primary").notNull().default(false),
    /** Optional human role within the organization ("Graduate Student", "Postdoc"). */
    role: text("role"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("user_organizations_user_org_unique").on(
      t.userId,
      t.organizationId
    ),
    index("user_organizations_user_idx").on(t.userId),
    index("user_organizations_org_idx").on(t.organizationId),
    uniqueIndex("user_organizations_one_primary_per_user")
      .on(t.userId)
      .where(sql`is_primary = true`),
  ]
);

/**
 * Recurring annual support tier paid by an organization. Replaces
 * the booleans `is_org_member` + `org_tier` that lived on
 * organizations directly; modelling memberships as rows lets a single
 * org carry a multi-year history (with start/end dates) and lets us
 * record the next renewal date without column sprawl.
 *
 * Active membership is "any row with started_at <= now() AND
 * (ended_at IS NULL OR ended_at >= now())". The directory's
 * "Org member" facet and the public sponsors page derive from that
 * predicate.
 */
export const orgMemberships = pgTable(
  "org_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    tier: orgMembershipTier("tier").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    /** Optional next-renewal hint surfaced to admins. */
    renewalDueAt: timestamp("renewal_due_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("org_memberships_org_idx").on(t.organizationId),
    /** Active rows surface twice — once per tier, but the partial
        unique on (org_id) WHERE ended_at IS NULL keeps an org from
        having two simultaneously open memberships. */
    uniqueIndex("org_memberships_one_active_per_org")
      .on(t.organizationId)
      .where(sql`ended_at IS NULL`),
  ]
);

/**
 * Per-event sponsorship from an organization. Independent of
 * org_memberships — an organization can sponsor an event without
 * being a recurring member, and vice versa. Drives the data-driven
 * sponsors strip on each event page and the historical sponsors
 * roster on /about/sponsors.
 */
export const eventSponsorships = pgTable(
  "event_sponsorships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    tier: sponsorTier("tier").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("event_sponsorships_event_org_unique").on(
      t.eventId,
      t.organizationId
    ),
    index("event_sponsorships_event_idx").on(t.eventId),
    index("event_sponsorships_org_idx").on(t.organizationId),
  ]
);

export const userEngagementTypes = pgTable(
  "user_engagement_types",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    engagementTypeId: uuid("engagement_type_id")
      .notNull()
      .references(() => engagementTypes.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.engagementTypeId] }),
    index("user_engagement_types_engagement_idx").on(t.engagementTypeId),
  ]
);

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, { fields: [userSkills.userId], references: [users.id] }),
  skill: one(skills, {
    fields: [userSkills.skillId],
    references: [skills.id],
  }),
}));

export const userDisciplinesRelations = relations(
  userDisciplines,
  ({ one }) => ({
    user: one(users, {
      fields: [userDisciplines.userId],
      references: [users.id],
    }),
    discipline: one(disciplines, {
      fields: [userDisciplines.disciplineId],
      references: [disciplines.id],
    }),
  })
);

export const userLanguagesRelations = relations(userLanguages, ({ one }) => ({
  user: one(users, { fields: [userLanguages.userId], references: [users.id] }),
  language: one(languages, {
    fields: [userLanguages.languageId],
    references: [languages.id],
  }),
}));

export const userEngagementTypesRelations = relations(
  userEngagementTypes,
  ({ one }) => ({
    user: one(users, {
      fields: [userEngagementTypes.userId],
      references: [users.id],
    }),
    engagementType: one(engagementTypes, {
      fields: [userEngagementTypes.engagementTypeId],
      references: [engagementTypes.id],
    }),
  })
);

export const userOrganizationsRelations = relations(
  userOrganizations,
  ({ one }) => ({
    user: one(users, {
      fields: [userOrganizations.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [userOrganizations.organizationId],
      references: [organizations.id],
    }),
  })
);

export const orgMembershipsRelations = relations(
  orgMemberships,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [orgMemberships.organizationId],
      references: [organizations.id],
    }),
  })
);

export const eventSponsorshipsRelations = relations(
  eventSponsorships,
  ({ one }) => ({
    event: one(events, {
      fields: [eventSponsorships.eventId],
      references: [events.id],
    }),
    organization: one(organizations, {
      fields: [eventSponsorships.organizationId],
      references: [organizations.id],
    }),
  })
);
