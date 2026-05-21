import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  artifactScope,
  artifactStatus,
  eventAttendanceRole,
  eventType,
} from "./enums";
import { groups } from "./groups";
import { organizations } from "./vocab";
import { users } from "./users";

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: eventType("type").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    location: text("location"),
    url: text("url"),
    description: text("description"),
    // Artifact-subsystem columns (added in migration 0022)
    status: artifactStatus("status").notNull().default("draft"),
    revision: integer("revision").notNull().default(1),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    scope: artifactScope("scope").notNull().default("community"),
    hostGroupId: uuid("host_group_id").references(() => groups.id, {
      onDelete: "set null",
    }),
    hostOrgId: uuid("host_org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    externalUrl: text("external_url"),
    thumbnailKey: text("thumbnail_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("events_start_date_idx").on(t.startDate),
    index("events_type_idx").on(t.type),
    index("events_status_idx").on(t.status, t.createdAt),
  ]
);

export const eventAttendances = pgTable(
  "event_attendances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    role: eventAttendanceRole("role").notNull().default("attendee"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("event_attendances_user_event_role_unique").on(
      t.userId,
      t.eventId,
      t.role
    ),
    index("event_attendances_event_idx").on(t.eventId),
  ]
);

export const eventsRelations = relations(events, ({ many }) => ({
  attendances: many(eventAttendances),
}));

export const eventAttendancesRelations = relations(
  eventAttendances,
  ({ one }) => ({
    user: one(users, {
      fields: [eventAttendances.userId],
      references: [users.id],
    }),
    event: one(events, {
      fields: [eventAttendances.eventId],
      references: [events.id],
    }),
  })
);
