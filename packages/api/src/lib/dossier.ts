/**
 * Builds the full "member dossier" shape used by GET /me and
 * GET /members/:slug — profile basics + career history, education,
 * certifications, skills, disciplines, engagement types, and
 * conference attendance.
 *
 * Performs the queries in parallel so a fully-populated profile is
 * still a single round-trip to Neon's HTTP edge.
 */
import { and, eq, isNull, asc, desc, sql } from "drizzle-orm";
import type { createDb } from "../db";
import { computeBadges, type Badge } from "./badges";
export type { Badge, BadgeAccent, BadgeTier } from "./badges";
import {
  awards,
  certifications,
  communityContributions,
  countries,
  careerStages,
  disciplines,
  education,
  engagementTypes,
  eventAttendances,
  eventCommitteeAreas,
  eventCommitteeAssignments,
  events,
  eventSessions,
  eventSessionPresenters,
  eventSessionTypes,
  experiences,
  groupMemberships,
  groups,
  institutions,
  languages,
  leadershipPositions,
  leadershipTerms,
  mentorshipPairings,
  pronouns,
  profiles,
  skills,
  userAwards,
  userDisciplines,
  userEngagementTypes,
  userLanguages,
  userSkills,
  users,
  degreeTypes,
  works,
} from "../db/schema";

export interface MemberDossier {
  id: string;
  memberId: string;
  email: string;
  role: string;
  marketingConsent: boolean;
  isLegacyImport: boolean;
  // ISO-8601 string. Neon's HTTP driver sometimes returns Postgres
  // timestamps as plain strings in "YYYY-MM-DD HH:MM:SS+00" format
  // (space, not T) — Chrome accepts that but Safari throws on
  // `new Date(s)`. Normalize at the boundary so every consumer gets
  // a parseable ISO string.
  createdAt: string;
  profile: {
    id: string;
    slug: string;
    displayName: string;
    headline: string | null;
    bio: string | null;
    photoUrl: string | null;
    jobTitle: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    orcid: string | null;
    websiteUrl: string | null;
    pronounId: string | null;
    pronounLabel: string | null;
    institutionId: string | null;
    institutionName: string | null;
    careerStageId: string | null;
    careerStageLabel: string | null;
    countryId: string | null;
    countryName: string | null;
    region: string | null;
    city: string | null;
    showOnMap: boolean;
    publicLocation: string | null;
    isPublic: boolean;
    isDiscoverable: boolean;
  } | null;
  experiences: ExperienceRow[];
  education: EducationRow[];
  certifications: CertificationRow[];
  // id + status surface so the dossier editor can call
  // DELETE /me/{disciplines,skills,languages}/:id and render pending
  // chips. Public consumers can still ignore the extra fields.
  skills: { id: string; name: string; slug: string; status: string }[];
  disciplines: { id: string; name: string; slug: string; status: string }[];
  languages: { id: string; name: string; slug: string; status: string }[];
  engagementTypes: { label: string }[];
  conferences: ConferenceRow[];
  leadership: LeadershipRow[];
  works: WorkRow[];
  badges: Badge[];
}

export interface WorkRow {
  id: string;
  type: "paper" | "talk" | "panel" | "workshop" | "software" | "dataset" | "other";
  title: string;
  venue: string | null;
  workDate: string | null;
  doi: string | null;
  url: string | null;
  pdfUrl: string | null;
  slidesUrl: string | null;
  videoUrl: string | null;
  abstract: string | null;
  collaborators: string[];
  source: "orcid" | "manual";
}

export interface ExperienceRow {
  id: string;
  title: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface EducationRow {
  id: string;
  institution: string;
  degreeLabel: string;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  description: string | null;
}

export interface CertificationRow {
  id: string;
  name: string;
  issuingOrg: string;
  issueDate: string | null;
  expiryDate: string | null;
  credentialUrl: string | null;
}

export interface LeadershipRow {
  id: string;
  positionType: "board" | "executive" | "staff" | "advisor";
  label: string;
  startDate: string;
  endDate: string | null;
}

export interface ConferenceRow {
  eventId: string;
  slug: string;
  name: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  role: string;
  notes: string | null;
}

type Db = ReturnType<typeof createDb>;

export async function loadMemberDossier(
  db: Db,
  userId: string
): Promise<MemberDossier | null> {
  const userRows = await db
    .select({
      id: users.id,
      memberId: users.memberId,
      email: users.email,
      role: users.role,
      marketingConsent: users.marketingConsent,
      isLegacyImport: users.isLegacyImport,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  const u = userRows[0];
  if (!u) return null;

  const [
    profileRows,
    experienceRows,
    educationRows,
    certificationRows,
    skillRows,
    disciplineRows,
    languageRows,
    engagementRows,
    attendanceRows,
    leadershipRows,
    workRows,
    groupMembershipRows,
    committeeAssignmentRows,
    sessionPresentationRows,
    awardRows,
    mentorPairingRows,
    menteePairingRows,
    contributionRows,
  ] = await Promise.all([
    db
      .select({
        id: profiles.id,
        slug: profiles.slug,
        displayName: profiles.displayName,
        headline: profiles.headline,
        bio: profiles.bio,
        photoUrl: profiles.photoUrl,
        jobTitle: profiles.jobTitle,
        githubUrl: profiles.githubUrl,
        linkedinUrl: profiles.linkedinUrl,
        orcid: profiles.orcid,
        websiteUrl: profiles.websiteUrl,
        pronounId: profiles.pronounId,
        pronounLabel: pronouns.label,
        institutionId: profiles.institutionId,
        institutionName: institutions.name,
        careerStageId: profiles.careerStageId,
        careerStageLabel: careerStages.label,
        countryId: profiles.countryId,
        countryName: countries.name,
        region: profiles.region,
        city: profiles.city,
        showOnMap: profiles.showOnMap,
        publicLocation: profiles.publicLocation,
        isPublic: profiles.isPublic,
        isDiscoverable: profiles.isDiscoverable,
      })
      .from(profiles)
      .leftJoin(pronouns, eq(profiles.pronounId, pronouns.id))
      .leftJoin(institutions, eq(profiles.institutionId, institutions.id))
      .leftJoin(careerStages, eq(profiles.careerStageId, careerStages.id))
      .leftJoin(countries, eq(profiles.countryId, countries.id))
      .where(eq(profiles.userId, u.id))
      .limit(1),
    db
      .select()
      .from(experiences)
      .where(
        and(eq(experiences.userId, u.id), isNull(experiences.deletedAt))
      )
      .orderBy(asc(experiences.sortOrder), desc(experiences.startDate)),
    db
      .select({
        id: education.id,
        institution: education.institution,
        degreeLabel: degreeTypes.label,
        fieldOfStudy: education.fieldOfStudy,
        startYear: education.startYear,
        endYear: education.endYear,
        description: education.description,
        sortOrder: education.sortOrder,
      })
      .from(education)
      .innerJoin(degreeTypes, eq(education.degreeTypeId, degreeTypes.id))
      .where(and(eq(education.userId, u.id), isNull(education.deletedAt)))
      .orderBy(asc(education.sortOrder)),
    db
      .select()
      .from(certifications)
      .where(
        and(eq(certifications.userId, u.id), isNull(certifications.deletedAt))
      )
      .orderBy(asc(certifications.sortOrder)),
    db
      .select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        status: skills.status,
      })
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, u.id))
      .orderBy(asc(skills.name)),
    db
      .select({
        id: disciplines.id,
        name: disciplines.name,
        slug: disciplines.slug,
        status: disciplines.status,
      })
      .from(userDisciplines)
      .innerJoin(disciplines, eq(userDisciplines.disciplineId, disciplines.id))
      .where(eq(userDisciplines.userId, u.id))
      .orderBy(asc(disciplines.name)),
    db
      .select({
        id: languages.id,
        name: languages.name,
        slug: languages.slug,
        status: languages.status,
      })
      .from(userLanguages)
      .innerJoin(languages, eq(userLanguages.languageId, languages.id))
      .where(eq(userLanguages.userId, u.id))
      .orderBy(asc(languages.name)),
    db
      .select({ label: engagementTypes.label })
      .from(userEngagementTypes)
      .innerJoin(
        engagementTypes,
        eq(userEngagementTypes.engagementTypeId, engagementTypes.id)
      )
      .where(eq(userEngagementTypes.userId, u.id))
      .orderBy(asc(engagementTypes.sortOrder)),
    db
      .select({
        eventId: events.id,
        slug: events.slug,
        name: events.name,
        location: events.location,
        startDate: events.startDate,
        endDate: events.endDate,
        role: eventAttendances.role,
        notes: eventAttendances.notes,
      })
      .from(eventAttendances)
      .innerJoin(events, eq(eventAttendances.eventId, events.id))
      .where(eq(eventAttendances.userId, u.id))
      .orderBy(asc(events.startDate)),
    db
      .select({
        id: leadershipTerms.id,
        positionType: leadershipPositions.positionType,
        label: leadershipPositions.label,
        startDate: leadershipTerms.startDate,
        endDate: leadershipTerms.endDate,
      })
      .from(leadershipTerms)
      .innerJoin(
        leadershipPositions,
        eq(leadershipTerms.positionId, leadershipPositions.id)
      )
      .where(
        and(
          eq(leadershipTerms.userId, u.id),
          isNull(leadershipTerms.deletedAt)
        )
      )
      .orderBy(desc(leadershipTerms.startDate)),
    db
      .select({
        id: works.id,
        type: works.type,
        title: works.title,
        venue: works.venue,
        workDate: works.workDate,
        doi: works.doi,
        url: works.url,
        pdfUrl: works.pdfUrl,
        slidesUrl: works.slidesUrl,
        videoUrl: works.videoUrl,
        abstract: works.abstract,
        collaborators: works.collaborators,
        source: works.source,
      })
      .from(works)
      .where(and(eq(works.userId, u.id), isNull(works.deletedAt)))
      // Newest first; null dates fall to the bottom.
      .orderBy(desc(works.workDate)),
    // Group memberships drive working/affinity/regional group badges.
    // We pull active and historical rows alike — leftAt distinguishes
    // current vs alumni at compute time.
    db
      .select({
        groupName: groups.name,
        groupSlug: groups.slug,
        groupType: groups.type,
        role: groupMemberships.role,
        joinedAt: groupMemberships.joinedAt,
        leftAt: groupMemberships.leftAt,
      })
      .from(groupMemberships)
      .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
      .where(
        and(
          eq(groupMemberships.userId, u.id),
          isNull(groups.deletedAt)
        )
      )
      .orderBy(desc(groupMemberships.joinedAt)),
    // Conference committee leadership (chair / co-chair of an area like
    // Program Committee). Each row is a service-tier credential.
    db
      .select({
        eventId: events.id,
        eventSlug: events.slug,
        eventName: events.name,
        eventStartDate: events.startDate,
        areaSlug: eventCommitteeAreas.slug,
        areaLabel: eventCommitteeAreas.label,
        level: eventCommitteeAssignments.level,
      })
      .from(eventCommitteeAssignments)
      .innerJoin(
        events,
        eq(eventCommitteeAssignments.eventId, events.id)
      )
      .innerJoin(
        eventCommitteeAreas,
        eq(eventCommitteeAssignments.areaId, eventCommitteeAreas.id)
      )
      .where(
        and(
          eq(eventCommitteeAssignments.userId, u.id),
          isNull(eventCommitteeAssignments.deletedAt)
        )
      )
      .orderBy(desc(events.startDate)),
    // Session presentations let us emit specific kinds (Keynote,
    // Plenary, Tutorial Lead, etc.) instead of the generic Talk badge
    // that the event_attendances loop produces from a notes regex.
    db
      .select({
        sessionId: eventSessions.id,
        eventId: events.id,
        eventSlug: events.slug,
        eventStartDate: events.startDate,
        title: eventSessions.title,
        typeSlug: eventSessionTypes.slug,
        typeLabel: eventSessionTypes.label,
        role: eventSessionPresenters.role,
      })
      .from(eventSessionPresenters)
      .innerJoin(
        eventSessions,
        eq(eventSessionPresenters.sessionId, eventSessions.id)
      )
      .innerJoin(events, eq(eventSessions.eventId, events.id))
      .innerJoin(
        eventSessionTypes,
        eq(eventSessions.typeId, eventSessionTypes.id)
      )
      .where(
        and(
          eq(eventSessionPresenters.userId, u.id),
          isNull(eventSessionPresenters.deletedAt),
          isNull(eventSessions.deletedAt)
        )
      )
      .orderBy(desc(events.startDate)),
    // Awards held by this user. Joined to the awards vocab for tier
    // and accent — and optionally to the awarding event for a
    // year-stamp on the badge title.
    db
      .select({
        userAwardId: userAwards.id,
        awardSlug: awards.slug,
        awardName: awards.name,
        awardTier: awards.tier,
        awardAccent: awards.accent,
        awardDescription: awards.description,
        awardedAt: userAwards.awardedAt,
        citation: userAwards.citation,
        eventStartDate: events.startDate,
        eventName: events.name,
      })
      .from(userAwards)
      .innerJoin(awards, eq(userAwards.awardId, awards.id))
      .leftJoin(events, eq(userAwards.awardingEventId, events.id))
      .where(eq(userAwards.userId, u.id))
      .orderBy(desc(userAwards.awardedAt)),
    // Mentorship pairings — two queries (one for each side the user
    // could be on) so each row can left-join the partner's profile
    // without alias gymnastics. Privacy gating happens in the
    // emitter via partnerIsPublic.
    db
      .select({
        pairingId: mentorshipPairings.id,
        side: sql<"mentor">`'mentor'`,
        programSlug: mentorshipPairings.programSlug,
        startedAt: mentorshipPairings.startedAt,
        endedAt: mentorshipPairings.endedAt,
        partnerId: mentorshipPairings.menteeId,
        partnerDisplayName: profiles.displayName,
        partnerSlug: profiles.slug,
        partnerIsPublic: profiles.isPublic,
      })
      .from(mentorshipPairings)
      .leftJoin(profiles, eq(profiles.userId, mentorshipPairings.menteeId))
      .where(eq(mentorshipPairings.mentorId, u.id)),
    db
      .select({
        pairingId: mentorshipPairings.id,
        side: sql<"mentee">`'mentee'`,
        programSlug: mentorshipPairings.programSlug,
        startedAt: mentorshipPairings.startedAt,
        endedAt: mentorshipPairings.endedAt,
        partnerId: mentorshipPairings.mentorId,
        partnerDisplayName: profiles.displayName,
        partnerSlug: profiles.slug,
        partnerIsPublic: profiles.isPublic,
      })
      .from(mentorshipPairings)
      .leftJoin(profiles, eq(profiles.userId, mentorshipPairings.mentorId))
      .where(eq(mentorshipPairings.menteeId, u.id)),
    // Community contributions — newsletter / tutorial / guide / etc.
    db
      .select({
        id: communityContributions.id,
        kind: communityContributions.kind,
        title: communityContributions.title,
        url: communityContributions.url,
        publishedAt: communityContributions.publishedAt,
      })
      .from(communityContributions)
      .where(eq(communityContributions.contributorId, u.id))
      .orderBy(desc(communityContributions.publishedAt)),
  ]);

  return {
    ...u,
    createdAt: toIso(u.createdAt),
    profile: profileRows[0] ?? null,
    experiences: experienceRows.map((e) => ({
      id: e.id,
      title: e.title,
      organization: e.organization,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      description: e.description,
    })),
    education: educationRows,
    certifications: certificationRows.map((c) => ({
      id: c.id,
      name: c.name,
      issuingOrg: c.issuingOrg,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      credentialUrl: c.credentialUrl,
    })),
    skills: skillRows,
    languages: languageRows,
    disciplines: disciplineRows,
    engagementTypes: engagementRows,
    conferences: attendanceRows,
    leadership: leadershipRows,
    works: workRows,
    badges: computeBadges({
      createdAt: u.createdAt,
      isLegacyImport: u.isLegacyImport,
      conferences: attendanceRows,
      leadership: leadershipRows,
      profile: profileRows[0]
        ? {
            displayName: profileRows[0].displayName,
            headline: profileRows[0].headline,
            bio: profileRows[0].bio,
            jobTitle: profileRows[0].jobTitle,
            institutionName: profileRows[0].institutionName,
            publicLocation: profileRows[0].publicLocation,
            orcid: profileRows[0].orcid,
            githubUrl: profileRows[0].githubUrl,
            linkedinUrl: profileRows[0].linkedinUrl,
          }
        : null,
      disciplineCount: disciplineRows.length,
      skillCount: skillRows.length,
      languageCount: languageRows.length,
      groupMemberships: groupMembershipRows.map((g) => ({
        groupName: g.groupName,
        groupSlug: g.groupSlug,
        groupType: g.groupType,
        role: g.role,
        joinedAt:
          g.joinedAt instanceof Date
            ? g.joinedAt.toISOString()
            : (g.joinedAt as string | null),
        leftAt:
          g.leftAt instanceof Date
            ? g.leftAt.toISOString()
            : (g.leftAt as string | null),
      })),
      committeeAssignments: committeeAssignmentRows.map((c) => ({
        eventId: c.eventId,
        eventSlug: c.eventSlug,
        eventName: c.eventName,
        eventStartDate: c.eventStartDate,
        areaSlug: c.areaSlug,
        areaLabel: c.areaLabel,
        level: c.level,
      })),
      sessionPresentations: sessionPresentationRows.map((p) => ({
        sessionId: p.sessionId,
        eventId: p.eventId,
        eventSlug: p.eventSlug,
        eventStartDate: p.eventStartDate,
        title: p.title,
        typeSlug: p.typeSlug,
        typeLabel: p.typeLabel,
        role: p.role,
      })),
      awards: awardRows.map((a) => ({
        userAwardId: a.userAwardId,
        awardSlug: a.awardSlug,
        awardName: a.awardName,
        awardTier: a.awardTier,
        awardAccent: a.awardAccent,
        awardDescription: a.awardDescription,
        awardedAt:
          a.awardedAt instanceof Date
            ? a.awardedAt.toISOString()
            : (a.awardedAt as string),
        citation: a.citation,
        eventStartDate: a.eventStartDate,
        eventName: a.eventName,
      })),
      mentorshipPairings: [...mentorPairingRows, ...menteePairingRows].map(
        (p) => ({
          pairingId: p.pairingId,
          side: p.side,
          programSlug: p.programSlug,
          startedAt:
            p.startedAt instanceof Date
              ? p.startedAt.toISOString()
              : (p.startedAt as string),
          endedAt:
            p.endedAt instanceof Date
              ? p.endedAt.toISOString()
              : (p.endedAt as string | null),
          partnerId: p.partnerId,
          partnerDisplayName: p.partnerDisplayName,
          partnerSlug: p.partnerSlug,
          partnerIsPublic: p.partnerIsPublic,
        })
      ),
      contributions: contributionRows.map((c) => ({
        id: c.id,
        kind: c.kind,
        title: c.title,
        url: c.url,
        publishedAt:
          c.publishedAt instanceof Date
            ? c.publishedAt.toISOString()
            : (c.publishedAt as string),
      })),
    }),
  };
}

/**
 * Result of resolving a public profile by slug. Discriminated by
 * `kind` so callers can either render the full dossier (public) or a
 * minimal stub (private) without the API leaking private fields.
 *
 *   - "public":  dossier is safe to surface to anyone.
 *   - "private": only memberId + displayName are surfaced. Lets us
 *                show "this member exists but is private" instead of
 *                pretending the slug doesn't exist (which would 404
 *                shared links every time a member toggles privacy).
 *   - null:      no row matches the slug at all.
 */
export type DossierBySlugResult =
  | { kind: "public"; dossier: MemberDossier }
  | { kind: "private"; memberId: string; displayName: string };

export async function loadMemberDossierBySlug(
  db: Db,
  slug: string
): Promise<DossierBySlugResult | null> {
  const row = await db
    .select({
      userId: profiles.userId,
      isPublic: profiles.isPublic,
      displayName: profiles.displayName,
      memberId: users.memberId,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.slug, slug), isNull(profiles.deletedAt)))
    .limit(1);
  if (!row[0]) return null;
  if (!row[0].isPublic) {
    return {
      kind: "private",
      memberId: row[0].memberId,
      displayName: row[0].displayName,
    };
  }
  const dossier = await loadMemberDossier(db, row[0].userId);
  if (!dossier) return null;
  return { kind: "public", dossier };
}

/**
 * Normalize whatever the driver hands back for a timestamp column
 * into a Safari-parseable ISO-8601 string. Neon's HTTP driver returns
 * Postgres timestamps as raw strings in "YYYY-MM-DD HH:MM:SS+00"
 * format (with a space, not a T) — Chrome accepts that but Safari
 * throws on `new Date(s)`. Routing through Date guarantees the wire
 * format is always proper ISO regardless of what the driver returns.
 */
function toIso(v: Date | string): string {
  if (v instanceof Date) return v.toISOString();
  // Replace the space separator with T before parsing so Safari
  // doesn't choke on the input itself; the resulting Date is then
  // serialized back out via toISOString.
  return new Date(v.replace(" ", "T")).toISOString();
}
