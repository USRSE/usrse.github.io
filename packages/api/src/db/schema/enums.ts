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

export const eventType = pgEnum("event_type", [
  "conference",
  "workshop",
  "meetup",
  "webinar",
  "community_call",
  "other",
]);

export const eventAttendanceRole = pgEnum("event_attendance_role", [
  "attendee",
  "speaker",
  "organizer",
  "sponsor",
  "volunteer",
]);

export const leadershipPositionType = pgEnum("leadership_position_type", [
  "board",
  "executive",
  "staff",
  "advisor",
]);

export const eventCommitteeLevel = pgEnum("event_committee_level", [
  "chair",
  "co_chair",
]);

export const eventPresenterRole = pgEnum("event_presenter_role", [
  "lead",
  "contributor",
]);
