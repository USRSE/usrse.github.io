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
import { users } from "./users";
import {
  disciplines,
  engagementTypes,
  institutions,
  languages,
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
 * Member ↔ institution affiliations. Many-to-many because most
 * members have either cross-appointments or a career arc that spans
 * multiple institutions over time. The partial unique index enforces
 * "at most one is_primary=true row per user" at the database level —
 * the badge / dossier layers can rely on that invariant without
 * defensive code.
 */
export const userInstitutions = pgTable(
  "user_institutions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "restrict" }),
    /** Drives the dossier's "based at" pillar and the directory facet. */
    isPrimary: boolean("is_primary").notNull().default(false),
    /** Optional human role within the institution ("Graduate Student", "Postdoc"). */
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
    uniqueIndex("user_institutions_user_institution_unique").on(
      t.userId,
      t.institutionId
    ),
    index("user_institutions_user_idx").on(t.userId),
    index("user_institutions_institution_idx").on(t.institutionId),
    uniqueIndex("user_institutions_one_primary_per_user")
      .on(t.userId)
      .where(sql`is_primary = true`),
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

export const userInstitutionsRelations = relations(
  userInstitutions,
  ({ one }) => ({
    user: one(users, {
      fields: [userInstitutions.userId],
      references: [users.id],
    }),
    institution: one(institutions, {
      fields: [userInstitutions.institutionId],
      references: [institutions.id],
    }),
  })
);
