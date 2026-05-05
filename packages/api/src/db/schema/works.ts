import { relations, sql } from "drizzle-orm";
import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { workSource, workType } from "./enums";
import { users } from "./users";

/**
 * Member-attached scholarly and editorial works: papers, talks, panels,
 * workshops, software releases, datasets. Two source paths:
 *
 *  - orcid: pulled from pub.orcid.org for any user with profiles.orcid set.
 *           The (user_id, source_id) unique index keys upserts so re-running
 *           the importer is idempotent. ORCID put-code goes into source_id.
 *
 *  - manual: member-entered through the UI. Useful for talks, panels, and
 *           workshops that ORCID doesn't track.
 *
 * `collaborators` is a free-text array (not a join to users) because most
 * co-authors aren't US-RSE members; promoting select co-authors to
 * member-links is a future enhancement.
 */
export const works = pgTable(
  "works",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: workType("type").notNull(),
    title: text("title").notNull(),
    venue: text("venue"),
    workDate: date("work_date"),
    doi: text("doi"),
    url: text("url"),
    pdfUrl: text("pdf_url"),
    slidesUrl: text("slides_url"),
    videoUrl: text("video_url"),
    abstract: text("abstract"),
    collaborators: text("collaborators")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    source: workSource("source").notNull(),
    sourceId: text("source_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("works_user_date_idx").on(t.userId, t.workDate),
    // One row per (user, ORCID put-code) so re-imports upsert cleanly.
    // Manual rows skip this constraint via the partial-index where clause.
    uniqueIndex("works_orcid_unique")
      .on(t.userId, t.sourceId)
      .where(sql`source = 'orcid'`),
  ]
);

export const worksRelations = relations(works, ({ one }) => ({
  user: one(users, {
    fields: [works.userId],
    references: [users.id],
  }),
}));
