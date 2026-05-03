import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "member",
  "admin",
  "super_admin",
]);

export const groupType = pgEnum("group_type", [
  "working_group",
  "affinity_group",
  "regional_group",
]);

export const groupMembershipRole = pgEnum("group_membership_role", [
  "member",
  "chair",
  "co_chair",
]);

export const vocabStatus = pgEnum("vocab_status", [
  "approved",
  "pending",
  "rejected",
]);

export const orgTier = pgEnum("org_tier", ["premier", "standard", "basic"]);
