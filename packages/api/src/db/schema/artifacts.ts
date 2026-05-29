import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  artifactEntityType,
  artifactReviewDecision,
  broadcastChannel,
  broadcastChannelStatus,
} from "./enums";
import { users } from "./users";

export const artifactReviews = pgTable(
  "artifact_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: artifactEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    entityRevision: integer("entity_revision").notNull(),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    decision: artifactReviewDecision("decision").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("artifact_reviews_entity_idx").on(
      t.entityType,
      t.entityId,
      t.entityRevision
    ),
  ]
);

export const artifactComments = pgTable(
  "artifact_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: artifactEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("artifact_comments_entity_idx").on(
      t.entityType,
      t.entityId,
      t.createdAt
    ),
  ]
);

export const broadcastRequests = pgTable(
  "broadcast_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: artifactEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("broadcast_requests_unique_per_artifact").on(t.entityType, t.entityId),
  ]
);

export const broadcastChannels = pgTable(
  "broadcast_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    broadcastRequestId: uuid("broadcast_request_id")
      .notNull()
      .references(() => broadcastRequests.id, { onDelete: "cascade" }),
    channel: broadcastChannel("channel").notNull(),
    status: broadcastChannelStatus("status").notNull().default("requested"),
    decidedBy: uuid("decided_by").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    postedBy: uuid("posted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postUrl: text("post_url"),
    declineReason: text("decline_reason"),
    preparedText: text("prepared_text"),
    preparedImageKey: text("prepared_image_key"),
    lastError: text("last_error"),
    lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
    attemptCount: integer("attempt_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("broadcast_channels_unique_channel_per_request").on(
      t.broadcastRequestId,
      t.channel
    ),
    index("broadcast_channels_status_idx")
      .on(t.status, t.channel)
      .where(sql`status IN ('approved', 'posted')`),
  ]
);
