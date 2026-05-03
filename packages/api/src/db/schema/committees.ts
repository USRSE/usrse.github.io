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
import { eventCommitteeLevel, vocabStatus } from "./enums";
import { events } from "./events";
import { users } from "./users";

export const eventCommitteeAreas = pgTable(
  "event_committee_areas",
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
    index("event_committee_areas_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
  ]
);

export const eventCommitteeAssignments = pgTable(
  "event_committee_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    areaId: uuid("area_id")
      .notNull()
      .references(() => eventCommitteeAreas.id, { onDelete: "restrict" }),
    level: eventCommitteeLevel("level").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("event_committee_assignments_user_event_area_level_unique").on(
      t.userId,
      t.eventId,
      t.areaId,
      t.level
    ),
    index("event_committee_assignments_event_idx").on(t.eventId),
    index("event_committee_assignments_area_idx").on(t.areaId),
    index("event_committee_assignments_chair_idx")
      .on(t.level)
      .where(sql`level = 'chair'`),
  ]
);

export const eventCommitteeAreasRelations = relations(
  eventCommitteeAreas,
  ({ many }) => ({
    assignments: many(eventCommitteeAssignments),
  })
);

export const eventCommitteeAssignmentsRelations = relations(
  eventCommitteeAssignments,
  ({ one }) => ({
    user: one(users, {
      fields: [eventCommitteeAssignments.userId],
      references: [users.id],
    }),
    event: one(events, {
      fields: [eventCommitteeAssignments.eventId],
      references: [events.id],
    }),
    area: one(eventCommitteeAreas, {
      fields: [eventCommitteeAssignments.areaId],
      references: [eventCommitteeAreas.id],
    }),
  })
);
