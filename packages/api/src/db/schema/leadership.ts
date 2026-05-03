import { relations, sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { leadershipPositionType, vocabStatus } from "./enums";
import { users } from "./users";

export const leadershipPositions = pgTable(
  "leadership_positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    positionType: leadershipPositionType("position_type").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: vocabStatus("status").notNull().default("approved"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("leadership_positions_status_approved_idx")
      .on(t.status)
      .where(sql`status = 'approved'`),
    index("leadership_positions_type_idx").on(t.positionType),
  ]
);

export const leadershipTerms = pgTable(
  "leadership_terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    positionId: uuid("position_id")
      .notNull()
      .references(() => leadershipPositions.id, { onDelete: "restrict" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
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
    index("leadership_terms_user_idx").on(t.userId),
    index("leadership_terms_position_idx").on(t.positionId),
    index("leadership_terms_current_idx")
      .on(t.endDate)
      .where(sql`end_date IS NULL`),
  ]
);

export const leadershipPositionsRelations = relations(
  leadershipPositions,
  ({ many }) => ({
    terms: many(leadershipTerms),
  })
);

export const leadershipTermsRelations = relations(
  leadershipTerms,
  ({ one }) => ({
    user: one(users, {
      fields: [leadershipTerms.userId],
      references: [users.id],
    }),
    position: one(leadershipPositions, {
      fields: [leadershipTerms.positionId],
      references: [leadershipPositions.id],
    }),
  })
);
