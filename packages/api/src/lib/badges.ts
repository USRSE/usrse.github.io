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

interface ComputeInput {
  createdAt: Date | string;
  isLegacyImport: boolean;
  conferences: ConferenceRow[];
  leadership: LeadershipRow[];
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
  const filteredConferences = input.conferences.filter(
    (c) => !(c.role === "attendee" && eventsWithContribution.has(c.eventId))
  );
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

  return out;
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
