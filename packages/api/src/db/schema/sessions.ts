import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { eventPresenterRole, vocabStatus } from "./enums";
import { events } from "./events";
import { users } from "./users";

export const eventSessionTypes = pgTable(
  "event_session_types",
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
    index("event_session_types_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
  ]
);

export const eventSessions = pgTable(
  "event_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    typeId: uuid("type_id")
      .notNull()
      .references(() => eventSessionTypes.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    abstract: text("abstract"),
    url: text("url"),
    recordingUrl: text("recording_url"),
    doi: text("doi"),
    presentedAt: timestamp("presented_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("event_sessions_event_idx").on(t.eventId),
    index("event_sessions_type_idx").on(t.typeId),
  ]
);

export const eventSessionPresenters = pgTable(
  "event_session_presenters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => eventSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: eventPresenterRole("role").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("event_session_presenters_session_user_unique").on(
      t.sessionId,
      t.userId
    ),
    index("event_session_presenters_user_idx").on(t.userId),
    index("event_session_presenters_lead_idx")
      .on(t.role)
      .where(sql`role = 'lead'`),
  ]
);

export const eventSessionTypesRelations = relations(
  eventSessionTypes,
  ({ many }) => ({
    sessions: many(eventSessions),
  })
);

export const eventSessionsRelations = relations(
  eventSessions,
  ({ one, many }) => ({
    event: one(events, {
      fields: [eventSessions.eventId],
      references: [events.id],
    }),
    type: one(eventSessionTypes, {
      fields: [eventSessions.typeId],
      references: [eventSessionTypes.id],
    }),
    presenters: many(eventSessionPresenters),
  })
);

export const eventSessionPresentersRelations = relations(
  eventSessionPresenters,
  ({ one }) => ({
    session: one(eventSessions, {
      fields: [eventSessionPresenters.sessionId],
      references: [eventSessions.id],
    }),
    user: one(users, {
      fields: [eventSessionPresenters.userId],
      references: [users.id],
    }),
  })
);
