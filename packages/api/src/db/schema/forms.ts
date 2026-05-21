import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  artifactEntityType,
  artifactScope,
  artifactStatus,
} from "./enums";
import { groups } from "./groups";
import { users } from "./users";

export const forms = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: artifactStatus("status").notNull().default("draft"),
    revision: integer("revision").notNull().default(1),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    scope: artifactScope("scope").notNull().default("community"),
    hostGroupId: uuid("host_group_id").references(() => groups.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    schema: jsonb("schema").notNull(),
    entityType: artifactEntityType("entity_type"),
    entityId: uuid("entity_id"),
    acceptsSubmissions: boolean("accepts_submissions").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("forms_status_idx")
      .on(t.status, t.createdAt)
      .where(sql`deleted_at IS NULL`),
    index("forms_entity_idx")
      .on(t.entityType, t.entityId)
      .where(sql`entity_type IS NOT NULL`),
    check(
      "forms_entity_both_or_neither",
      sql`(${t.entityType} IS NULL) = (${t.entityId} IS NULL)`
    ),
  ]
);

export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    formRevision: integer("form_revision").notNull(),
    submitterUserId: uuid("submitter_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    payload: jsonb("payload").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("form_submissions_form_idx").on(t.formId, t.submittedAt)]
);

export const formsRelations = relations(forms, ({ many, one }) => ({
  submissions: many(formSubmissions),
  author: one(users, {
    fields: [forms.authorId],
    references: [users.id],
  }),
}));

export const formSubmissionsRelations = relations(formSubmissions, ({ one }) => ({
  form: one(forms, {
    fields: [formSubmissions.formId],
    references: [forms.id],
  }),
}));
