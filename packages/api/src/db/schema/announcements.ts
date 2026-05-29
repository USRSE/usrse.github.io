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
import { artifactScope, artifactStatus } from "./enums";
import { groups } from "./groups";
import { organizations } from "./vocab";
import { users } from "./users";

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
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
    title: text("title").notNull(),
    body: text("body").notNull(),
    linkUrl: text("link_url"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
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
    index("announcements_status_idx")
      .on(t.status, t.createdAt)
      .where(sql`deleted_at IS NULL`),
    uniqueIndex("announcements_slug_unique").on(t.slug),
  ]
);

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  hostGroup: one(groups, {
    fields: [announcements.hostGroupId],
    references: [groups.id],
  }),
  hostOrg: one(organizations, {
    fields: [announcements.hostOrgId],
    references: [organizations.id],
  }),
}));
