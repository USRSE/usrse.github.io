/**
 * Phase 3 of the badge rollout — recognition tables.
 *
 * Three tables, all keyed off `users`:
 *   - `awards` (vocab) + `user_awards` (instances)
 *   - `mentorship_pairings` (paired mentor/mentee assignments)
 *   - `community_contributions` (newsletter / tutorial / guide rows)
 *
 * Each table is small and additive. The badge layer reads them
 * during `loadMemberDossier` and emits chips for each row.
 */
import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  awardAccent,
  awardTier,
  contributionKind,
  vocabStatus,
} from "./enums";
import { events } from "./events";
import { users } from "./users";

export const awards = pgTable("awards", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  tier: awardTier("tier").notNull(),
  /** Visual accent the resulting badge renders with. */
  accent: awardAccent("accent").notNull().default("amber"),
  status: vocabStatus("status").notNull().default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userAwards = pgTable(
  "user_awards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    awardId: uuid("award_id")
      .notNull()
      .references(() => awards.id, { onDelete: "restrict" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull(),
    /** Optional event the award was presented at — links the award to a year/conference. */
    awardingEventId: uuid("awarding_event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    /** Citation text published with the award. Surfaced in the badge tooltip. */
    citation: text("citation"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("user_awards_user_idx").on(t.userId),
    index("user_awards_award_idx").on(t.awardId),
  ]
);

export const mentorshipPairings = pgTable(
  "mentorship_pairings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    menteeId: uuid("mentee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Slug of the mentorship program (e.g. "annual-mentorship-2024"). */
    programSlug: text("program_slug").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("mentorship_pairings_mentor_idx").on(t.mentorId),
    index("mentorship_pairings_mentee_idx").on(t.menteeId),
  ]
);

export const communityContributions = pgTable(
  "community_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contributorId: uuid("contributor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: contributionKind("kind").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_contributions_contributor_idx").on(t.contributorId),
    index("community_contributions_kind_idx").on(t.kind),
  ]
);

export const awardsRelations = relations(awards, ({ many }) => ({
  recipients: many(userAwards),
}));

export const userAwardsRelations = relations(userAwards, ({ one }) => ({
  user: one(users, { fields: [userAwards.userId], references: [users.id] }),
  award: one(awards, {
    fields: [userAwards.awardId],
    references: [awards.id],
  }),
  awardingEvent: one(events, {
    fields: [userAwards.awardingEventId],
    references: [events.id],
  }),
}));

export const mentorshipPairingsRelations = relations(
  mentorshipPairings,
  ({ one }) => ({
    mentor: one(users, {
      fields: [mentorshipPairings.mentorId],
      references: [users.id],
      relationName: "mentor",
    }),
    mentee: one(users, {
      fields: [mentorshipPairings.menteeId],
      references: [users.id],
      relationName: "mentee",
    }),
  })
);

export const communityContributionsRelations = relations(
  communityContributions,
  ({ one }) => ({
    contributor: one(users, {
      fields: [communityContributions.contributorId],
      references: [users.id],
    }),
  })
);
