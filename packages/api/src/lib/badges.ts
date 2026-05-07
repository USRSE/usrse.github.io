/**
 * Computes the v1 set of profile badges purely from data already
 * present in the dossier — conference attendance, account creation
 * date, legacy-import flag. No badge tables, no curation queue: a
 * member earns a badge automatically the moment the underlying
 * record exists.
 *
 * As leadership_terms and group_memberships get wired into the
 * dossier, add corresponding compute branches below.
 */
import type { ConferenceRow, LeadershipRow } from "./dossier";

export type BadgeTier = "milestone" | "conference" | "service";

/**
 * Color the UI uses to fill the hex stamp. Keep this list aligned
 * with the role taxonomy used in CommunitySection — same vocabulary,
 * same accents, so a "Spoke at USRSE'24" badge reads as the same
 * idea as the purple-filled dot on the conference timeline.
 */
export type BadgeAccent =
  | "neutral"
  | "purple"
  | "teal"
  | "amber"
  | "rose"
  | "graphite";

export interface Badge {
  /** Stable id used as a React key and for click→scroll targets. */
  id: string;
  tier: BadgeTier;
  /** One-word category shown in the small mono caption above the title. */
  kind: string;
  /** Display title shown beneath the hex (e.g. "USRSE'24", "Three-Peat"). */
  title: string;
  /** Sub-label shown in the second mono line (e.g. "Spoke", "5+ conferences"). */
  subtitle: string;
  accent: BadgeAccent;
  /** Earned-on date in ISO. Used for tooltip + sort order within a tier. */
  earnedAt: string;
  /** Tooltip / detail copy. */
  description: string;
  /** Solid border (filled tier weight) vs hairline outline (participation). */
  weight: "solid" | "outline" | "double";
}

const ROLE_ACCENT: Record<string, BadgeAccent> = {
  attendee: "neutral",
  speaker: "purple",
  organizer: "teal",
  sponsor: "amber",
  volunteer: "rose",
};

/**
 * Resolves a conference attendance row to the human-facing badge "kind"
 * (the small mono caption beneath the hex). For speaker-tier roles we
 * read the free-text `notes` field to differentiate poster sessions
 * from oral talks — same recognition tier (purple, "active
 * contribution"), different glyph, different caption.
 *
 * The notes-based heuristic is intentionally permissive: anything
 * containing "poster" (case-insensitive) registers as a poster, the
 * rest defaults to "Talk". When event_session_presenters gets wired
 * into the dossier, replace this with a proper session-type lookup.
 */
function resolveConferenceKind(role: string, notes: string | null): string {
  if (role === "speaker") {
    if (notes && /poster/i.test(notes)) return "Poster";
    return "Talk";
  }
  return ROLE_KIND[role] ?? "Attended";
}

/**
 * Tooltip / description copy for a conference badge. Talks and posters
 * each get their own first sentence, then we append the location when
 * we know it.
 */
function buildConferenceDescription(c: ConferenceRow, kind: string): string {
  let lead: string;
  switch (kind) {
    case "Talk":
      lead = "Gave an oral presentation at this US-RSE conference.";
      break;
    case "Poster":
      lead = "Presented a poster at this US-RSE conference.";
      break;
    case "Organized":
      lead = ROLE_DESCRIPTION.organizer;
      break;
    case "Sponsored":
      lead = ROLE_DESCRIPTION.sponsor;
      break;
    case "Volunteered":
      lead = ROLE_DESCRIPTION.volunteer;
      break;
    default:
      lead = ROLE_DESCRIPTION.attendee;
  }
  return c.location ? `${lead} (${c.location})` : lead;
}

const ROLE_KIND: Record<string, string> = {
  attendee: "Attended",
  speaker: "Talk",
  organizer: "Organized",
  sponsor: "Sponsored",
  volunteer: "Volunteered",
};

const ROLE_DESCRIPTION: Record<string, string> = {
  attendee: "Attended this US-RSE conference.",
  speaker: "Presented at this US-RSE conference.",
  organizer: "Helped organize this US-RSE conference.",
  sponsor: "Sponsored this US-RSE conference.",
  volunteer: "Volunteered at this US-RSE conference.",
};

/**
 * Subset of profile fields that drive identity / completeness badges.
 * Mirrors the columns on `profiles` rather than the dossier shape so
 * the badge layer stays decoupled from the response payload.
 */
export interface ProfileBadgeInput {
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  jobTitle: string | null;
  institutionName: string | null;
  publicLocation: string | null;
  orcid: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
}

/** One row of group_memberships joined to groups. */
export interface GroupMembershipRow {
  groupName: string;
  groupSlug: string;
  /** "working_group" | "affinity_group" | "regional_group" */
  groupType: string;
  /** "member" | "chair" | "co_chair" */
  role: string;
  joinedAt: string | Date | null;
  leftAt: string | Date | null;
}

/** One row of event_committee_assignments joined to areas + events. */
export interface CommitteeAssignmentRow {
  eventId: string;
  eventSlug: string;
  eventName: string;
  eventStartDate: string;
  /** Slug of the committee area (e.g. "program-committee", "reviewers"). */
  areaSlug: string;
  areaLabel: string;
  /** "chair" | "co_chair" */
  level: string;
}

/** One row of event_session_presenters joined to sessions + types + events. */
export interface SessionPresentationRow {
  sessionId: string;
  eventId: string;
  eventSlug: string;
  eventStartDate: string;
  title: string;
  /** Slug of the session type (e.g. "keynote", "plenary", "lightning-talk"). */
  typeSlug: string;
  typeLabel: string;
  /** "lead" | "contributor" */
  role: string;
}

interface ComputeInput {
  createdAt: Date | string;
  isLegacyImport: boolean;
  conferences: ConferenceRow[];
  leadership: LeadershipRow[];
  /** Null when the user hasn't created a profile yet (still allows account-level badges to compute). */
  profile: ProfileBadgeInput | null;
  /** Counts come pre-aggregated so we don't haul full vocab arrays through this layer. */
  disciplineCount: number;
  skillCount: number;
  languageCount: number;
  /** Phase 2 inputs — empty arrays are safe defaults. */
  groupMemberships: GroupMembershipRow[];
  committeeAssignments: CommitteeAssignmentRow[];
  sessionPresentations: SessionPresentationRow[];
}

/**
 * Charter Member cutoff. Anyone whose account predates this date is
 * recognized as having joined before the membership platform itself
 * existed at scale. Adjust if/when the board picks a formal cutoff.
 */
const CHARTER_CUTOFF_ISO = "2025-09-01";

export function computeBadges(input: ComputeInput): Badge[] {
  const out: Badge[] = [];

  // ── Per-conference participation ───────────────────────────────
  // A member can hold several roles for the same event (e.g. attendee
  // + speaker + organizer). When a contribution role exists, the
  // implicit attendance becomes redundant — drop it so we don't emit
  // three USRSE'24 hexes when one of them is "you also showed up".
  // Contribution roles still stack, so a year with both "Spoke" and
  // "Organized" earns two distinct badges.
  const eventsWithContribution = new Set(
    input.conferences
      .filter((c) => c.role !== "attendee")
      .map((c) => c.eventId)
  );
  // Phase 2: when a session presentation is on file for an event, the
  // session-type badge below is more specific than the generic Talk
  // or Poster the notes-regex would emit. Suppress the speaker-role
  // chip for events covered by richer session data so we don't render
  // two badges for the same session.
  const eventsWithSessionPresentation = new Set(
    input.sessionPresentations.map((p) => p.eventId)
  );
  const filteredConferences = input.conferences.filter((c) => {
    if (c.role === "attendee" && eventsWithContribution.has(c.eventId))
      return false;
    if (c.role === "speaker" && eventsWithSessionPresentation.has(c.eventId))
      return false;
    return true;
  });
  const sortedConferences = [...filteredConferences].sort((a, b) =>
    a.startDate < b.startDate ? -1 : 1
  );
  for (const c of sortedConferences) {
    const yy = c.startDate.slice(2, 4);
    const accent = ROLE_ACCENT[c.role] ?? "neutral";
    const kind = resolveConferenceKind(c.role, c.notes);
    const description = buildConferenceDescription(c, kind);
    out.push({
      // Suffix the id with kind (not just role) so a single event
      // could in principle hold both "Talk" and "Poster" as distinct
      // badges if someone gave both at the same conference.
      id: `conf-${c.eventId}-${kind.toLowerCase()}`,
      tier: "conference",
      kind,
      title: `USRSE'${yy}`,
      subtitle: kind,
      accent,
      earnedAt: c.startDate,
      description,
      // Past attendance is earned — solid fill, neutral palette.
      // Contribution roles inherit their saturated palette through
      // ROLE_ACCENT above. The outline weight is reserved for any
      // future "locked / aspirational" badges (not used today).
      weight: "solid",
    });
  }

  // ── Phase 2: session-type conference badges ────────────────────
  // Richer conference roles via event_sessions: keynote, plenary,
  // tutorial lead, etc. Replaces the generic Talk badge for events
  // that have session data on file (the suppression above keeps
  // them from double-emitting). For events without session rows,
  // the existing notes-regex Talk path still fires.
  for (const p of input.sessionPresentations) {
    const meta = SESSION_TYPE_BADGE[p.typeSlug];
    if (!meta) continue; // Unknown type — don't emit a custom badge.
    // Tutorial / Workshop / BoF "Lead" badges are reserved for the
    // primary presenter; co-presenters earn a less-prominent variant.
    const isLead = p.role === "lead";
    if (meta.requiresLead && !isLead) continue;
    const yy = p.eventStartDate.slice(2, 4);
    const kind = isLead ? meta.leadKind : (meta.contributorKind ?? meta.leadKind);
    out.push({
      id: `session-${p.sessionId}-${p.role}`,
      tier: "conference",
      kind,
      title: `USRSE'${yy}`,
      subtitle: kind,
      accent: meta.accent,
      earnedAt: p.eventStartDate,
      description: `${meta.descriptionPrefix} "${p.title}" at this US-RSE conference.`,
      weight: meta.weight,
    });
  }

  // ── Phase 2: committee-leadership badges ──────────────────────
  // Each chair / co-chair assignment is a service-tier credential.
  // Title carries the year so the same person chairing the Program
  // Committee in two different years gets two distinct badges.
  for (const a of input.committeeAssignments) {
    const yy = a.eventStartDate.slice(2, 4);
    const isChair = a.level === "chair";
    const subtitle = isChair ? "Chair" : "Co-Chair";
    out.push({
      id: `committee-${a.eventId}-${a.areaSlug}-${a.level}`,
      tier: "service",
      kind: a.areaLabel,
      title: `${a.areaLabel} · '${yy}`,
      subtitle,
      accent: COMMITTEE_AREA_ACCENT[a.areaSlug] ?? "purple",
      earnedAt: a.eventStartDate,
      description: `${subtitle} of the ${a.areaLabel} for ${a.eventName}.`,
      weight: "double",
    });
  }

  // ── Phase 2: working / affinity / regional group badges ───────
  for (const m of input.groupMemberships) {
    const meta = GROUP_TYPE_BADGE[m.groupType];
    if (!meta) continue;
    const isCurrent = isMembershipCurrent(m);
    const isLead = m.role === "chair" || m.role === "co_chair";
    const kind = isLead ? meta.leadKind : meta.memberKind;
    const subtitle = roleSubtitle(m.role, isCurrent);
    out.push({
      id: `group-${m.groupSlug}-${m.role}`,
      tier: isLead ? "service" : "milestone",
      kind,
      title: m.groupName,
      subtitle,
      accent: meta.accent,
      earnedAt: toIso(m.joinedAt ?? new Date()),
      description: isLead
        ? `${isCurrent ? "Currently leads" : "Previously led"} the ${m.groupName} ${meta.label.toLowerCase()}.`
        : `${isCurrent ? "Active in" : "Previously active in"} the ${m.groupName} ${meta.label.toLowerCase()}.`,
      weight: isLead ? "double" : "solid",
    });
  }

  // ── Multi-conference milestones ───────────────────────────────
  // Count distinct events (not badge rows) — a year with both a
  // speaker and an organizer role is still one conference attended.
  const distinctEvents = new Map<string, ConferenceRow>();
  for (const c of [...input.conferences].sort((a, b) =>
    a.startDate < b.startDate ? -1 : 1
  )) {
    if (!distinctEvents.has(c.eventId)) distinctEvents.set(c.eventId, c);
  }
  const distinctConferences = [...distinctEvents.values()];
  const conferenceCount = distinctConferences.length;
  if (conferenceCount >= 3) {
    const third = distinctConferences[2];
    out.push({
      id: "milestone-three-peat",
      tier: "milestone",
      kind: "Milestone",
      title: "Three-Peat",
      subtitle: "3+ conferences",
      accent: "amber",
      earnedAt: third.startDate,
      description:
        "Attended three or more US-RSE conferences. Showing up matters.",
      weight: "double",
    });
  }
  if (conferenceCount >= 5) {
    const fifth = distinctConferences[4];
    out.push({
      id: "milestone-five-peat",
      tier: "milestone",
      kind: "Milestone",
      title: "Five-Peat",
      subtitle: "5+ conferences",
      accent: "rose",
      earnedAt: fifth.startDate,
      description:
        "Attended five or more US-RSE conferences. A pillar of the community.",
      weight: "double",
    });
  }

  // ── First Stage (first speaker engagement) ─────────────────────
  const firstSpeaker = sortedConferences.find((c) => c.role === "speaker");
  if (firstSpeaker) {
    const yy = firstSpeaker.startDate.slice(2, 4);
    out.push({
      id: "milestone-first-stage",
      tier: "milestone",
      kind: "Milestone",
      title: "First Stage",
      subtitle: `Debut · USRSE'${yy}`,
      accent: "purple",
      earnedAt: firstSpeaker.startDate,
      description:
        "Presented at a US-RSE conference for the first time. Putting the work out there.",
      weight: "double",
    });
  }

  // ── Service tier (board, executive) ────────────────────────────
  // One badge per positionType, regardless of how many distinct
  // positions or non-consecutive terms a member holds. Current state
  // (any open term) gets a double-ring "premium ongoing" treatment;
  // otherwise the badge is the single-ring Alumni form. The full term
  // history lives in the tooltip description.
  const boardBadge = buildServiceBadge({
    positionType: "board",
    title: "Board",
    glyphKey: "board",
    accent: "purple",
    leadership: input.leadership,
  });
  if (boardBadge) out.push(boardBadge);

  const executiveBadge = buildServiceBadge({
    positionType: "executive",
    title: "Executive",
    glyphKey: "executive",
    accent: "purple",
    leadership: input.leadership,
  });
  if (executiveBadge) out.push(executiveBadge);

  // ── Membership origin ──────────────────────────────────────────
  if (input.isLegacyImport) {
    out.push({
      id: "milestone-founding-roster",
      tier: "milestone",
      kind: "Milestone",
      title: "Founding Roster",
      subtitle: "Legacy import",
      accent: "graphite",
      earnedAt: toIso(input.createdAt),
      description:
        "Member of US-RSE before the membership platform launched. On the original roster.",
      weight: "double",
    });
  }

  const created = toIso(input.createdAt);
  if (!input.isLegacyImport && created < CHARTER_CUTOFF_ISO) {
    out.push({
      id: "milestone-charter-member",
      tier: "milestone",
      kind: "Milestone",
      title: "Charter Member",
      subtitle: "Joined early",
      accent: "teal",
      earnedAt: created,
      description:
        "Joined US-RSE before the membership platform was widely announced.",
      weight: "double",
    });
  }

  // ── Anniversary milestones ─────────────────────────────────────
  // Emit at most one — the highest tier the user qualifies for —
  // so a 12-year member doesn't carry 1, 5, and 10 simultaneously.
  // Earned-on date is the anniversary itself, not the original
  // signup, so the badge sorts to the top of the milestone tier
  // when a member just crossed the threshold.
  const yearsSinceJoin = yearsBetween(input.createdAt, new Date());
  if (yearsSinceJoin >= 10) {
    out.push(anniversaryBadge(input.createdAt, 10));
  } else if (yearsSinceJoin >= 5) {
    out.push(anniversaryBadge(input.createdAt, 5));
  } else if (yearsSinceJoin >= 1) {
    out.push(anniversaryBadge(input.createdAt, 1));
  }

  // ── Identity verifications ─────────────────────────────────────
  // ORCID / GitHub / LinkedIn don't celebrate work the way other
  // badges do — they certify "this person is who they say they
  // are" on a third-party surface. Render with the outline weight
  // (visually thinner) so they read as verification marks rather
  // than achievements.
  const profile = input.profile;
  if (profile?.orcid) {
    out.push({
      id: "identity-orcid",
      tier: "milestone",
      kind: "ORCID",
      title: "ORCID Linked",
      subtitle: "Verified",
      accent: "graphite",
      earnedAt: created,
      description: `Linked an ORCID iD (${profile.orcid}) to their dossier — research output is unambiguously attributable.`,
      weight: "outline",
    });
  }
  if (profile?.githubUrl) {
    out.push({
      id: "identity-github",
      tier: "milestone",
      kind: "GitHub",
      title: "GitHub Linked",
      subtitle: "Verified",
      accent: "graphite",
      earnedAt: created,
      description: "Linked a GitHub profile — open-source work is one click away.",
      weight: "outline",
    });
  }
  if (profile?.linkedinUrl) {
    out.push({
      id: "identity-linkedin",
      tier: "milestone",
      kind: "LinkedIn",
      title: "LinkedIn Linked",
      subtitle: "Verified",
      accent: "graphite",
      earnedAt: created,
      description: "Linked a LinkedIn profile to their dossier.",
      weight: "outline",
    });
  }

  // ── Profile Complete ───────────────────────────────────────────
  // Earns when every dossier identity field carries content. Doesn't
  // require any specific *quality*, just the act of filling things
  // out — matches the "you finished the form" framing.
  if (profile && isProfileComplete(profile)) {
    out.push({
      id: "milestone-profile-complete",
      tier: "milestone",
      kind: "Milestone",
      title: "Profile Complete",
      subtitle: "Every field filled",
      accent: "teal",
      earnedAt: created,
      description:
        "Filled in every required field on the dossier — name, headline, bio, role, institution, and location are all set.",
      weight: "solid",
    });
  }

  // ── Breadth-of-craft milestones ────────────────────────────────
  if (input.languageCount >= 5) {
    out.push({
      id: "milestone-polyglot",
      tier: "milestone",
      kind: "Milestone",
      title: "Polyglot",
      subtitle: `${input.languageCount} languages`,
      accent: "purple",
      earnedAt: created,
      description: `Lists ${input.languageCount} programming languages on their dossier. Reaches across paradigms.`,
      weight: "double",
    });
  }
  if (input.skillCount >= 10) {
    out.push({
      id: "milestone-polymath",
      tier: "milestone",
      kind: "Milestone",
      title: "Polymath",
      subtitle: `${input.skillCount} skills`,
      accent: "amber",
      earnedAt: created,
      description: `Lists ${input.skillCount} skills on their dossier. A wide-band toolkit.`,
      weight: "double",
    });
  }
  if (input.disciplineCount >= 3) {
    out.push({
      id: "milestone-cross-disciplinary",
      tier: "milestone",
      kind: "Milestone",
      title: "Cross-Disciplinary",
      subtitle: `${input.disciplineCount} disciplines`,
      accent: "teal",
      earnedAt: created,
      description: `Works across ${input.disciplineCount} research disciplines. Bridges fields by trade.`,
      weight: "double",
    });
  }

  // ── Decade Roster (10+ event participations) ───────────────────
  if (conferenceCount >= 10) {
    const tenth = distinctConferences[9];
    out.push({
      id: "milestone-decade-roster",
      tier: "milestone",
      kind: "Milestone",
      title: "Decade Roster",
      subtitle: "10+ conferences",
      accent: "graphite",
      earnedAt: tenth.startDate,
      description:
        "Attended ten or more US-RSE conferences. Foundational presence.",
      weight: "double",
    });
  }

  // ── Speaker Streak (10+ / 25+ talks) ───────────────────────────
  // Count distinct events with role=speaker; suppress the lower
  // tier when the higher one is earned so the chip count stays
  // tight on prolific speakers.
  const speakerEvents = new Set<string>();
  let earliestSpeaker: ConferenceRow | undefined;
  let latestSpeaker: ConferenceRow | undefined;
  for (const c of input.conferences) {
    if (c.role !== "speaker") continue;
    if (!speakerEvents.has(c.eventId)) speakerEvents.add(c.eventId);
    if (!earliestSpeaker || c.startDate < earliestSpeaker.startDate)
      earliestSpeaker = c;
    if (!latestSpeaker || c.startDate > latestSpeaker.startDate)
      latestSpeaker = c;
  }
  const talkCount = speakerEvents.size;
  if (talkCount >= 25 && latestSpeaker) {
    out.push({
      id: "milestone-speaker-quarter",
      tier: "milestone",
      kind: "Milestone",
      title: "Speaker · 25",
      subtitle: `${talkCount} talks`,
      accent: "rose",
      earnedAt: latestSpeaker.startDate,
      description: `Has presented at ${talkCount} US-RSE conferences. A defining voice.`,
      weight: "double",
    });
  } else if (talkCount >= 10 && latestSpeaker) {
    out.push({
      id: "milestone-speaker-decade",
      tier: "milestone",
      kind: "Milestone",
      title: "Speaker · 10",
      subtitle: `${talkCount} talks`,
      accent: "purple",
      earnedAt: latestSpeaker.startDate,
      description: `Has presented at ${talkCount} US-RSE conferences. A repeat contributor.`,
      weight: "double",
    });
  }
  void earliestSpeaker;

  return out;
}

/**
 * Years between two timestamps as a whole number, floored — so an
 * account 11.9 years old reports 11, not 12. Lets the
 * highest-anniversary-only logic above pick a stable tier without
 * straddling the boundary.
 */
function yearsBetween(from: Date | string, to: Date | string): number {
  const a = typeof from === "string" ? new Date(from.replace(" ", "T")) : from;
  const b = typeof to === "string" ? new Date(to.replace(" ", "T")) : to;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
}

function anniversaryBadge(createdAt: Date | string, years: 1 | 5 | 10): Badge {
  const created = toIso(createdAt);
  const accent: BadgeAccent =
    years >= 10 ? "rose" : years >= 5 ? "amber" : "teal";
  return {
    id: `milestone-anniversary-${years}`,
    tier: "milestone",
    kind: "Anniversary",
    title: years === 1 ? "1 Year" : `${years} Years`,
    subtitle: years === 1 ? "First anniversary" : `${years}th anniversary`,
    accent,
    earnedAt: created,
    description:
      years === 1
        ? "One year of US-RSE membership."
        : `${years} years of US-RSE membership. The long arc shows up.`,
    weight: years >= 10 ? "double" : "solid",
  };
}

// ── Phase 2 lookup tables ────────────────────────────────────────────

interface SessionBadgeMeta {
  /** Badge `kind` for the lead presenter (e.g. "Keynote"). */
  leadKind: string;
  /** Badge `kind` for contributors when applicable. Null = no contributor variant. */
  contributorKind?: string;
  accent: BadgeAccent;
  weight: Badge["weight"];
  descriptionPrefix: string;
  /** Some badges (Tutorial Lead, Workshop Lead) only fire for `role === "lead"`. */
  requiresLead?: boolean;
}

/**
 * Maps session-type slugs to badge metadata. Slugs are admin-curated
 * vocabulary — see `event_session_types`. Unknown slugs intentionally
 * don't emit anything; the badge layer doesn't try to invent kinds
 * for arbitrary new session formats.
 */
const SESSION_TYPE_BADGE: Record<string, SessionBadgeMeta> = {
  keynote: {
    leadKind: "Keynote",
    accent: "rose",
    weight: "double",
    descriptionPrefix: "Delivered the keynote",
  },
  plenary: {
    leadKind: "Plenary",
    accent: "purple",
    weight: "double",
    descriptionPrefix: "Delivered a plenary",
  },
  "lightning-talk": {
    leadKind: "Lightning Talk",
    accent: "amber",
    weight: "solid",
    descriptionPrefix: "Gave a lightning talk",
  },
  tutorial: {
    leadKind: "Tutorial Lead",
    contributorKind: "Tutorial",
    accent: "teal",
    weight: "double",
    descriptionPrefix: "Led the tutorial",
    requiresLead: false,
  },
  workshop: {
    leadKind: "Workshop Lead",
    contributorKind: "Workshop",
    accent: "teal",
    weight: "double",
    descriptionPrefix: "Led the workshop",
    requiresLead: false,
  },
  bof: {
    leadKind: "BoF Lead",
    contributorKind: "BoF",
    accent: "amber",
    weight: "solid",
    descriptionPrefix: "Led the Birds of a Feather session",
  },
  panel: {
    leadKind: "Panel Chair",
    contributorKind: "Panelist",
    accent: "purple",
    weight: "solid",
    descriptionPrefix: "Joined the panel",
  },
};

/**
 * Per-area accent for committee badges. Explicit handling for the
 * common areas (Program Committee, Reviewers, Steering) gives them
 * recognizable colors; everything else falls back to purple via the
 * lookup default.
 */
const COMMITTEE_AREA_ACCENT: Record<string, BadgeAccent> = {
  "program-committee": "purple",
  reviewers: "teal",
  "review-committee": "teal",
  "steering-committee": "rose",
  "local-organizing": "amber",
};

interface GroupTypeBadgeMeta {
  label: string;
  /** Kind shown when the user is chair/co-chair. */
  leadKind: string;
  /** Kind shown for ordinary members. */
  memberKind: string;
  accent: BadgeAccent;
}

const GROUP_TYPE_BADGE: Record<string, GroupTypeBadgeMeta> = {
  working_group: {
    label: "Working Group",
    leadKind: "WG Chair",
    memberKind: "WG Member",
    accent: "teal",
  },
  affinity_group: {
    label: "Affinity Group",
    leadKind: "AG Coordinator",
    memberKind: "AG Member",
    accent: "purple",
  },
  regional_group: {
    label: "Regional Group",
    leadKind: "Regional Coordinator",
    memberKind: "Regional Member",
    accent: "amber",
  },
};

function isMembershipCurrent(m: GroupMembershipRow): boolean {
  if (m.leftAt == null) return true;
  const left = m.leftAt instanceof Date ? m.leftAt : new Date(m.leftAt);
  return left.getTime() > Date.now();
}

function roleSubtitle(role: string, isCurrent: boolean): string {
  const base =
    role === "chair" ? "Chair" : role === "co_chair" ? "Co-Chair" : "Member";
  return isCurrent ? base : `${base} · alumni`;
}

function isProfileComplete(p: ProfileBadgeInput): boolean {
  // "Complete" = the six identity fields any visitor expects to see
  // on a dossier are populated. Optional links (orcid/github/linkedin)
  // get their own identity badges and aren't required here.
  return Boolean(
    p.displayName &&
      p.headline &&
      p.bio &&
      p.jobTitle &&
      p.institutionName &&
      p.publicLocation
  );
}

function toIso(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  // Neon's HTTP driver hands timestamp columns back as plain strings
  // in "YYYY-MM-DD HH:MM:SS+00" format. Convert to true ISO-8601 so
  // Safari's stricter Date parser doesn't choke downstream.
  return new Date(d.replace(" ", "T")).toISOString();
}

/**
 * Builds a single Board or Executive service badge from a member's
 * full leadership history. Returns null when no terms of the given
 * type exist. Subtitle is just "Current" or "Alumni" — the full term
 * record (positions, year ranges) lives in the description tooltip.
 */
function buildServiceBadge(args: {
  positionType: LeadershipRow["positionType"];
  title: string;
  glyphKey: "board" | "executive";
  accent: BadgeAccent;
  leadership: LeadershipRow[];
}): Badge | null {
  const terms = args.leadership.filter(
    (t) => t.positionType === args.positionType
  );
  if (terms.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isOpen = (t: LeadershipRow) => t.endDate === null || t.endDate >= today;
  const open = terms.filter(isOpen);
  const isCurrent = open.length > 0;

  // earnedAt = most-recent term start (drives sort within the tier).
  const earnedAt = [...terms].sort((a, b) =>
    a.startDate < b.startDate ? 1 : -1
  )[0].startDate;

  // Description lists each term as "Position · YYYY–YY" or
  // "Position · YYYY–Present" so the tooltip carries the full record
  // even when the subtitle stays terse.
  const lines = terms
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
    .map((t) => {
      const start = t.startDate.slice(0, 4);
      const end = isOpen(t) ? "Present" : (t.endDate ?? "").slice(0, 4);
      return `${t.label} · ${start}–${end}`;
    });
  const description = `${
    isCurrent ? "Currently serving" : "Previously served"
  } on the US-RSE ${args.positionType === "board" ? "Board of Directors" : "Executive team"}. ${lines.join(
    "; "
  )}.`;

  return {
    id: `service-${args.positionType}`,
    tier: "service",
    kind: args.glyphKey === "board" ? "Board" : "Executive",
    title: args.title,
    subtitle: isCurrent ? "Current" : "Alumni",
    accent: args.accent,
    earnedAt,
    description,
    weight: isCurrent ? "double" : "solid",
  };
}
