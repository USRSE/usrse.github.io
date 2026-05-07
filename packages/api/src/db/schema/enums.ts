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

// External / scholarly works carried in the `works` table. ORCID's own
// taxonomy has ~30 work-types; we collapse them into this smaller set
// at import time so the On Stage UI has a stable vocabulary to render
// against. "other" catches the long tail (patents, datasets we choose
// not to surface, etc.) and lets the importer never reject a record.
export const workType = pgEnum("work_type", [
  "paper",
  "talk",
  "panel",
  "workshop",
  "software",
  "dataset",
  "other",
]);

// "orcid" rows are re-fetched from pub.orcid.org and keyed by their
// ORCID put-code; they should not be hand-edited (edits would be
// clobbered on the next import). "manual" rows are member-entered and
// the member is the source of truth.
export const workSource = pgEnum("work_source", ["orcid", "manual"]);

// Award rarity tier — drives badge accent and weight. "lifetime" is
// the rarest (one-and-done), "special" covers ad-hoc community
// recognition (Pioneer, Honorary), "annual" is the recurring slate
// (Excellence in Service, Mentor of the Year, etc.).
export const awardTier = pgEnum("award_tier", [
  "lifetime",
  "special",
  "annual",
]);

// Visual accent stored on the awards vocab so admins can recolor a
// new award without redeploying. Keep aligned with BadgeAccent on
// the frontend.
export const awardAccent = pgEnum("award_accent", [
  "purple",
  "teal",
  "amber",
  "rose",
  "graphite",
  "neutral",
]);

// Kinds of community contribution that earn a badge. Open enough to
// cover most volunteer output without inviting one-off "kind=other"
// rows that bypass the badge logic.
export const contributionKind = pgEnum("contribution_kind", [
  "newsletter",
  "tutorial",
  "guide",
  "resource",
  "translation",
  "community_call_host",
  "blog_post",
  "podcast",
  "other",
]);
