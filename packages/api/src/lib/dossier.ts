/**
 * Builds the full "member dossier" shape used by GET /me and
 * GET /members/:slug — profile basics + career history, education,
 * certifications, skills, disciplines, engagement types, and
 * conference attendance.
 *
 * Performs the queries in parallel so a fully-populated profile is
 * still a single round-trip to Neon's HTTP edge.
 */
import { and, eq, isNull, asc, desc } from "drizzle-orm";
import type { createDb } from "../db";
import { computeBadges, type Badge } from "./badges";
export type { Badge, BadgeAccent, BadgeTier } from "./badges";
import {
  certifications,
  countries,
  careerStages,
  disciplines,
  education,
  engagementTypes,
  eventAttendances,
  events,
  experiences,
  institutions,
  leadershipPositions,
  leadershipTerms,
  pronouns,
  profiles,
  skills,
  userDisciplines,
  userEngagementTypes,
  userSkills,
  users,
  degreeTypes,
} from "../db/schema";

export interface MemberDossier {
  id: string;
  memberId: string;
  email: string;
  role: string;
  marketingConsent: boolean;
  isLegacyImport: boolean;
  createdAt: Date;
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
  } | null;
  experiences: ExperienceRow[];
  education: EducationRow[];
  certifications: CertificationRow[];
  skills: { name: string; slug: string }[];
  disciplines: { name: string }[];
  engagementTypes: { label: string }[];
  conferences: ConferenceRow[];
  leadership: LeadershipRow[];
  badges: Badge[];
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
    engagementRows,
    attendanceRows,
    leadershipRows,
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
      .select({ name: skills.name, slug: skills.slug })
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, u.id))
      .orderBy(asc(skills.name)),
    db
      .select({ name: disciplines.name })
      .from(userDisciplines)
      .innerJoin(disciplines, eq(userDisciplines.disciplineId, disciplines.id))
      .where(eq(userDisciplines.userId, u.id))
      .orderBy(asc(disciplines.name)),
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
  ]);

  return {
    ...u,
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
    disciplines: disciplineRows,
    engagementTypes: engagementRows,
    conferences: attendanceRows,
    leadership: leadershipRows,
    badges: computeBadges({
      createdAt: u.createdAt,
      isLegacyImport: u.isLegacyImport,
      conferences: attendanceRows,
      leadership: leadershipRows,
    }),
  };
}

export async function loadMemberDossierBySlug(
  db: Db,
  slug: string
): Promise<MemberDossier | null> {
  const profileRow = await db
    .select({ userId: profiles.userId, isPublic: profiles.isPublic })
    .from(profiles)
    .where(and(eq(profiles.slug, slug), isNull(profiles.deletedAt)))
    .limit(1);
  if (!profileRow[0]) return null;
  if (!profileRow[0].isPublic) return null;
  return loadMemberDossier(db, profileRow[0].userId);
}
