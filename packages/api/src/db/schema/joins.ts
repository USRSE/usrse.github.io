import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { disciplines, engagementTypes, languages, skills } from "./vocab";

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
