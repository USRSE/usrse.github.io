import { and, eq, sql } from "drizzle-orm";
import type { createDb } from "../../db";
import {
  certifications,
  communityContributions,
  education,
  eventAttendances,
  eventCommitteeAssignments,
  eventSessionPresenters,
  experiences,
  groupMemberships,
  leadershipTerms,
  mentorshipPairings,
  userAwards,
  userDisciplines,
  userEngagementTypes,
  userLanguages,
  userMerges,
  userOrganizations,
  userSkills,
  users,
  works,
  auditLog,
  profiles,
} from "../../db/schema";

type Db = ReturnType<typeof createDb>;

/**
 * Subset of profile/user identity fields that the merge wizard offers
 * for promotion. Email and role are intentionally excluded.
 *
 * Keep in sync with the `users` and `profiles` schemas. When a profile
 * field is added/removed/renamed, audit this list and decide whether the
 * new field should be promotable (most identity fields should; private
 * IDs and timestamps shouldn't).
 */
export const PROMOTABLE_PROFILE_FIELDS = [
  "displayName",
  "headline",
  "bio",
  "photoUrl",
  "jobTitle",
  "githubUrl",
  "linkedinUrl",
  "orcid",
  "websiteUrl",
  "pronounId",
  "careerStageId",
  "countryId",
  "region",
  "city",
  "publicLocation",
] as const;

export type PromotableField = (typeof PROMOTABLE_PROFILE_FIELDS)[number];

export interface MergeRequest {
  sourceUserId: string;
  targetUserId: string;
  mergedByUserId: string;
  promotedFields: PromotableField[];
  reason?: string;
}

export interface MergeValidationError {
  status: 400 | 404 | 409;
  error: string;
  message: string;
}

export interface MergeSnapshot {
  source: typeof users.$inferSelect;
  target: typeof users.$inferSelect;
  sourceProfile: typeof profiles.$inferSelect | null;
  targetProfile: typeof profiles.$inferSelect | null;
  // Per FK-bearing table: the row ids on source that will move to target.
  toRepoint: {
    user_organizations: string[];
    experiences: string[];
    education: string[];
    certifications: string[];
    group_memberships: string[];
    works: string[];
    event_committee_assignments: string[];
    event_attendances: string[];
    event_session_presenters: string[];
    user_disciplines: string[];
    user_skills: string[];
    user_languages: string[];
    user_engagement_types: string[];
    user_awards: string[];
    mentorship_pairings_mentor: string[];
    mentorship_pairings_mentee: string[];
    community_contributions: string[];
    leadership_terms: string[];
    audit_log: string[];
  };
  // Join-table rows where source AND target both have the same X; source's
  // row will be deleted instead of repointed (target wins on conflict).
  // For composite-PK join tables (user_disciplines, user_skills, etc.)
  // the deletedRowId is the attribute id since there is no surrogate row id.
  conflicts: Array<{
    table: string;
    deletedRowId: string;
    snapshot: Record<string, unknown>;
  }>;
}

/**
 * Pre-merge validation. Returns null on success, a MergeValidationError
 * payload otherwise. Pure SQL reads — no writes here.
 */
export async function validateMerge(
  db: Db,
  req: MergeRequest
): Promise<MergeValidationError | null> {
  if (req.sourceUserId === req.targetUserId) {
    return {
      status: 400,
      error: "invalid_input",
      message: "Source and target must be different users.",
    };
  }

  const [src, tgt] = await Promise.all([
    db
      .select()
      .from(users)
      .where(eq(users.id, req.sourceUserId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(users)
      .where(eq(users.id, req.targetUserId))
      .limit(1)
      .then((r) => r[0]),
  ]);

  if (!src) {
    return {
      status: 404,
      error: "not_found",
      message: `Source user ${req.sourceUserId} not found.`,
    };
  }
  if (!tgt) {
    return {
      status: 404,
      error: "not_found",
      message: `Target user ${req.targetUserId} not found.`,
    };
  }
  if (src.mergedIntoUserId !== null) {
    return {
      status: 409,
      error: "already_merged",
      message: `Source is already merged into ${src.mergedIntoUserId}. Unmerge first.`,
    };
  }
  if (src.role === "super_admin") {
    return {
      status: 409,
      error: "forbidden_role",
      message:
        "Merging a super_admin source via this endpoint is blocked. Use direct SQL.",
    };
  }
  // Source.deletedAt is intentionally NOT checked: merging a soft-deleted
  // duplicate INTO a healthy canonical user is a valid cleanup workflow
  // (e.g., the dupe was already retired but discovered later to share an
  // ORCID with the primary). Only the target must be alive — you can't
  // merge into a tombstoned user.
  if (tgt.deletedAt !== null) {
    return {
      status: 409,
      error: "target_deleted",
      message: "Cannot merge into a soft-deleted user. Restore first.",
    };
  }
  if (req.promotedFields.length > 0) {
    const tgtProfile = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, req.targetUserId))
      .limit(1);
    if (tgtProfile.length === 0) {
      return {
        status: 409,
        error: "target_no_profile",
        message:
          "Target user has no profile row; cannot promote fields. Create the target profile first.",
      };
    }
  }
  return null;
}

/**
 * Reads source + target rows and walks every FK-bearing table to build
 * the to-repoint manifest and conflict list. Pure reads — no writes.
 *
 * Note: this function re-fetches source/target rows that `validateMerge`
 * already read. We accept the extra two round-trips because the admin app
 * is single-operator at low call rate — the alternative would reshape the
 * `validateMerge` return type. Revisit if the admin grows multi-operator.
 *
 * Note: snapshot is not transactional with the write phase. Between this
 * call and `executeMerge`, another admin (or background job) could modify
 * the source. Single-operator workflow makes this acceptable; if the admin
 * grows multi-operator, either lock source rows in executeMerge's
 * transaction and re-validate counts, or include `source.updatedAt` in the
 * snapshot and reject `executeMerge` if it has advanced.
 */
export async function buildMergeSnapshot(
  db: Db,
  req: MergeRequest
): Promise<MergeSnapshot> {
  const [src, tgt] = await Promise.all([
    db
      .select()
      .from(users)
      .where(eq(users.id, req.sourceUserId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(users)
      .where(eq(users.id, req.targetUserId))
      .limit(1)
      .then((r) => r[0]),
  ]);
  const [srcProfile, tgtProfile] = await Promise.all([
    db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, req.sourceUserId))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, req.targetUserId))
      .limit(1)
      .then((r) => r[0] ?? null),
  ]);

  // Tables without (user_id, X) unique constraints — straight repoint.
  const [
    expRows,
    eduRows,
    certRows,
    worksRows,
    leadershipRows,
    attendanceRows,
    presenterRows,
    awardRows,
    mentorMentorRows,
    mentorMenteeRows,
    contribRows,
    auditRows,
  ] = await Promise.all([
    db
      .select({ id: experiences.id })
      .from(experiences)
      .where(eq(experiences.userId, req.sourceUserId)),
    db
      .select({ id: education.id })
      .from(education)
      .where(eq(education.userId, req.sourceUserId)),
    db
      .select({ id: certifications.id })
      .from(certifications)
      .where(eq(certifications.userId, req.sourceUserId)),
    db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.userId, req.sourceUserId)),
    db
      .select({ id: leadershipTerms.id })
      .from(leadershipTerms)
      .where(eq(leadershipTerms.userId, req.sourceUserId)),
    db
      .select({ id: eventAttendances.id })
      .from(eventAttendances)
      .where(eq(eventAttendances.userId, req.sourceUserId)),
    db
      .select({ id: eventSessionPresenters.id })
      .from(eventSessionPresenters)
      .where(eq(eventSessionPresenters.userId, req.sourceUserId)),
    db
      .select({ id: userAwards.id })
      .from(userAwards)
      .where(eq(userAwards.userId, req.sourceUserId)),
    db
      .select({ id: mentorshipPairings.id })
      .from(mentorshipPairings)
      .where(eq(mentorshipPairings.mentorId, req.sourceUserId)),
    db
      .select({ id: mentorshipPairings.id })
      .from(mentorshipPairings)
      .where(eq(mentorshipPairings.menteeId, req.sourceUserId)),
    db
      .select({ id: communityContributions.id })
      .from(communityContributions)
      .where(eq(communityContributions.contributorId, req.sourceUserId)),
    db
      .select({ id: auditLog.id })
      .from(auditLog)
      .where(eq(auditLog.actorId, req.sourceUserId)),
  ]);

  // Join tables WITH (user_id, X) unique constraints — must dedupe conflicts.
  // For each: fetch source's rows + target's rows, compute conflicts.
  const conflicts: MergeSnapshot["conflicts"] = [];
  const toRepointUserOrgs: string[] = [];

  const [srcUserOrgs, tgtUserOrgs] = await Promise.all([
    db
      .select()
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, req.sourceUserId)),
    db
      .select()
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, req.targetUserId)),
  ]);
  const tgtOrgIds = new Set(tgtUserOrgs.map((r) => r.organizationId));
  for (const r of srcUserOrgs) {
    if (tgtOrgIds.has(r.organizationId)) {
      conflicts.push({
        table: "user_organizations",
        deletedRowId: r.id,
        snapshot: r as unknown as Record<string, unknown>,
      });
    } else {
      toRepointUserOrgs.push(r.id);
    }
  }

  const toRepointUserDisc: string[] = [];
  const [srcDisc, tgtDisc] = await Promise.all([
    db
      .select()
      .from(userDisciplines)
      .where(eq(userDisciplines.userId, req.sourceUserId)),
    db
      .select()
      .from(userDisciplines)
      .where(eq(userDisciplines.userId, req.targetUserId)),
  ]);
  const tgtDiscIds = new Set(tgtDisc.map((r) => r.disciplineId));
  for (const r of srcDisc) {
    if (tgtDiscIds.has(r.disciplineId)) {
      conflicts.push({
        table: "user_disciplines",
        deletedRowId: r.disciplineId,
        snapshot: r as unknown as Record<string, unknown>,
      });
    } else {
      toRepointUserDisc.push(r.disciplineId);
    }
  }

  const toRepointUserSkills: string[] = [];
  const [srcSk, tgtSk] = await Promise.all([
    db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, req.sourceUserId)),
    db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, req.targetUserId)),
  ]);
  const tgtSkIds = new Set(tgtSk.map((r) => r.skillId));
  for (const r of srcSk) {
    if (tgtSkIds.has(r.skillId)) {
      conflicts.push({
        table: "user_skills",
        deletedRowId: r.skillId,
        snapshot: r as unknown as Record<string, unknown>,
      });
    } else {
      toRepointUserSkills.push(r.skillId);
    }
  }

  const toRepointUserLangs: string[] = [];
  const [srcLng, tgtLng] = await Promise.all([
    db
      .select()
      .from(userLanguages)
      .where(eq(userLanguages.userId, req.sourceUserId)),
    db
      .select()
      .from(userLanguages)
      .where(eq(userLanguages.userId, req.targetUserId)),
  ]);
  const tgtLngIds = new Set(tgtLng.map((r) => r.languageId));
  for (const r of srcLng) {
    if (tgtLngIds.has(r.languageId)) {
      conflicts.push({
        table: "user_languages",
        deletedRowId: r.languageId,
        snapshot: r as unknown as Record<string, unknown>,
      });
    } else {
      toRepointUserLangs.push(r.languageId);
    }
  }

  const toRepointUserEng: string[] = [];
  const [srcEng, tgtEng] = await Promise.all([
    db
      .select()
      .from(userEngagementTypes)
      .where(eq(userEngagementTypes.userId, req.sourceUserId)),
    db
      .select()
      .from(userEngagementTypes)
      .where(eq(userEngagementTypes.userId, req.targetUserId)),
  ]);
  const tgtEngIds = new Set(tgtEng.map((r) => r.engagementTypeId));
  for (const r of srcEng) {
    if (tgtEngIds.has(r.engagementTypeId)) {
      conflicts.push({
        table: "user_engagement_types",
        deletedRowId: r.engagementTypeId,
        snapshot: r as unknown as Record<string, unknown>,
      });
    } else {
      toRepointUserEng.push(r.engagementTypeId);
    }
  }

  const toRepointGroup: string[] = [];
  const [srcGM, tgtGM] = await Promise.all([
    db
      .select()
      .from(groupMemberships)
      .where(eq(groupMemberships.userId, req.sourceUserId)),
    db
      .select()
      .from(groupMemberships)
      .where(eq(groupMemberships.userId, req.targetUserId)),
  ]);
  const tgtGroupIds = new Set(tgtGM.map((r) => r.groupId));
  for (const r of srcGM) {
    if (tgtGroupIds.has(r.groupId)) {
      conflicts.push({
        table: "group_memberships",
        deletedRowId: r.id,
        snapshot: r as unknown as Record<string, unknown>,
      });
    } else {
      toRepointGroup.push(r.id);
    }
  }

  const toRepointEvComm: string[] = [];
  const [srcECA, tgtECA] = await Promise.all([
    db
      .select()
      .from(eventCommitteeAssignments)
      .where(eq(eventCommitteeAssignments.userId, req.sourceUserId)),
    db
      .select()
      .from(eventCommitteeAssignments)
      .where(eq(eventCommitteeAssignments.userId, req.targetUserId)),
  ]);
  const tgtECAKeys = new Set(tgtECA.map((r) => `${r.eventId}:${r.areaId}`));
  for (const r of srcECA) {
    if (tgtECAKeys.has(`${r.eventId}:${r.areaId}`)) {
      conflicts.push({
        table: "event_committee_assignments",
        deletedRowId: r.id,
        snapshot: r as unknown as Record<string, unknown>,
      });
    } else {
      toRepointEvComm.push(r.id);
    }
  }

  return {
    source: src,
    target: tgt,
    sourceProfile: srcProfile,
    targetProfile: tgtProfile,
    toRepoint: {
      user_organizations: toRepointUserOrgs,
      experiences: expRows.map((r) => r.id),
      education: eduRows.map((r) => r.id),
      certifications: certRows.map((r) => r.id),
      group_memberships: toRepointGroup,
      works: worksRows.map((r) => r.id),
      event_committee_assignments: toRepointEvComm,
      event_attendances: attendanceRows.map((r) => r.id),
      event_session_presenters: presenterRows.map((r) => r.id),
      user_disciplines: toRepointUserDisc,
      user_skills: toRepointUserSkills,
      user_languages: toRepointUserLangs,
      user_engagement_types: toRepointUserEng,
      user_awards: awardRows.map((r) => r.id),
      mentorship_pairings_mentor: mentorMentorRows.map((r) => r.id),
      mentorship_pairings_mentee: mentorMenteeRows.map((r) => r.id),
      community_contributions: contribRows.map((r) => r.id),
      leadership_terms: leadershipRows.map((r) => r.id),
      audit_log: auditRows.map((r) => r.id),
    },
    conflicts,
  };
}

export interface MergeResult {
  mergeId: string;
  repointedRows: MergeSnapshot["toRepoint"];
  conflicts: MergeSnapshot["conflicts"];
  promotedFields: Record<string, unknown>;
}

/**
 * Run the merge as one batched neon-http transaction. Snapshot must be
 * pre-computed (see buildMergeSnapshot). Caller is responsible for
 * pre-merge validation.
 *
 * Returns the merge_history row id + the manifests so the caller can
 * audit-capture without re-querying.
 */
export async function executeMerge(
  db: Db,
  snapshot: MergeSnapshot,
  req: MergeRequest
): Promise<MergeResult> {
  const promotedRecord: Record<string, unknown> = {};

  // Capture pre-merge target values for fields being promoted so unmerge
  // can restore them.
  for (const f of req.promotedFields) {
    if (snapshot.targetProfile) {
      promotedRecord[f] = snapshot.targetProfile[f] ?? null;
    } else {
      promotedRecord[f] = null;
    }
  }

  const mergeId = crypto.randomUUID();

  // Build the batched transaction. Each step is its own SQL statement;
  // neon-http groups them and runs as one round-trip atomic batch.
  await db.transaction(async (tx) => {
    // TODO: defensive concurrency guard — re-assert source.mergedIntoUserId
    // is still null at transaction open (see buildMergeSnapshot docstring on
    // the snapshot/write race). Single-operator admin makes this optional
    // for now; if the admin grows multi-operator, add:
    //   const claimed = await tx.update(users)
    //     .set({ mergedIntoUserId: snapshot.target.id, ... })
    //     .where(and(eq(users.id, snapshot.source.id), isNull(users.mergedIntoUserId)))
    //     .returning({ id: users.id });
    //   if (claimed.length === 0) throw new MergeRaceError();
    // and move the final step-5 update to be predicated on isNull.

    // 1. Promote fields from source onto target's profile.
    if (
      req.promotedFields.length > 0 &&
      snapshot.targetProfile &&
      snapshot.sourceProfile
    ) {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      for (const f of req.promotedFields) {
        updates[f] = snapshot.sourceProfile[f];
      }
      await tx
        .update(profiles)
        .set(updates)
        .where(eq(profiles.userId, snapshot.target.id));
    }

    // 2. Straight FK repoints (no join-table conflict to handle).
    //    communityContributions is handled separately because its user FK
    //    is contributorId, not userId.
    const straightTables = [
      { t: experiences, ids: snapshot.toRepoint.experiences },
      { t: education, ids: snapshot.toRepoint.education },
      { t: certifications, ids: snapshot.toRepoint.certifications },
      { t: works, ids: snapshot.toRepoint.works },
      { t: leadershipTerms, ids: snapshot.toRepoint.leadership_terms },
      { t: eventAttendances, ids: snapshot.toRepoint.event_attendances },
      {
        t: eventSessionPresenters,
        ids: snapshot.toRepoint.event_session_presenters,
      },
      { t: userAwards, ids: snapshot.toRepoint.user_awards },
    ] as const;
    for (const { t, ids } of straightTables) {
      if (ids.length === 0) continue;
      await tx
        .update(t)
        .set({ userId: snapshot.target.id })
        .where(sql`${t}.id = ANY(${ids})`);
    }

    // communityContributions uses contributorId (not userId).
    if (snapshot.toRepoint.community_contributions.length > 0) {
      await tx
        .update(communityContributions)
        .set({ contributorId: snapshot.target.id })
        .where(
          sql`${communityContributions.id} = ANY(${snapshot.toRepoint.community_contributions})`
        );
    }

    // Mentorship pairings have two FKs to users — handle each side.
    if (snapshot.toRepoint.mentorship_pairings_mentor.length > 0) {
      await tx
        .update(mentorshipPairings)
        .set({ mentorId: snapshot.target.id })
        .where(
          sql`${mentorshipPairings.id} = ANY(${snapshot.toRepoint.mentorship_pairings_mentor})`
        );
    }
    if (snapshot.toRepoint.mentorship_pairings_mentee.length > 0) {
      await tx
        .update(mentorshipPairings)
        .set({ menteeId: snapshot.target.id })
        .where(
          sql`${mentorshipPairings.id} = ANY(${snapshot.toRepoint.mentorship_pairings_mentee})`
        );
    }

    // audit_log has actor_id (not user_id).
    if (snapshot.toRepoint.audit_log.length > 0) {
      await tx
        .update(auditLog)
        .set({ actorId: snapshot.target.id })
        .where(sql`${auditLog.id} = ANY(${snapshot.toRepoint.audit_log})`);
    }

    // 3. Join tables WITH (user_id, X) unique constraints.
    if (snapshot.toRepoint.user_organizations.length > 0) {
      await tx
        .update(userOrganizations)
        .set({ userId: snapshot.target.id })
        .where(
          sql`${userOrganizations.id} = ANY(${snapshot.toRepoint.user_organizations})`
        );
    }
    if (snapshot.toRepoint.group_memberships.length > 0) {
      await tx
        .update(groupMemberships)
        .set({ userId: snapshot.target.id })
        .where(
          sql`${groupMemberships.id} = ANY(${snapshot.toRepoint.group_memberships})`
        );
    }
    if (snapshot.toRepoint.event_committee_assignments.length > 0) {
      await tx
        .update(eventCommitteeAssignments)
        .set({ userId: snapshot.target.id })
        .where(
          sql`${eventCommitteeAssignments.id} = ANY(${snapshot.toRepoint.event_committee_assignments})`
        );
    }
    // Composite-PK join tables (user_disciplines etc.) — (user_id, X) PKs.
    if (snapshot.toRepoint.user_disciplines.length > 0) {
      await tx
        .update(userDisciplines)
        .set({ userId: snapshot.target.id })
        .where(
          and(
            eq(userDisciplines.userId, snapshot.source.id),
            sql`${userDisciplines.disciplineId} = ANY(${snapshot.toRepoint.user_disciplines})`
          )
        );
    }
    if (snapshot.toRepoint.user_skills.length > 0) {
      await tx
        .update(userSkills)
        .set({ userId: snapshot.target.id })
        .where(
          and(
            eq(userSkills.userId, snapshot.source.id),
            sql`${userSkills.skillId} = ANY(${snapshot.toRepoint.user_skills})`
          )
        );
    }
    if (snapshot.toRepoint.user_languages.length > 0) {
      await tx
        .update(userLanguages)
        .set({ userId: snapshot.target.id })
        .where(
          and(
            eq(userLanguages.userId, snapshot.source.id),
            sql`${userLanguages.languageId} = ANY(${snapshot.toRepoint.user_languages})`
          )
        );
    }
    if (snapshot.toRepoint.user_engagement_types.length > 0) {
      await tx
        .update(userEngagementTypes)
        .set({ userId: snapshot.target.id })
        .where(
          and(
            eq(userEngagementTypes.userId, snapshot.source.id),
            sql`${userEngagementTypes.engagementTypeId} = ANY(${snapshot.toRepoint.user_engagement_types})`
          )
        );
    }

    // 4. Delete the conflict rows on the source side. Their snapshots
    //    are already captured for the user_merges manifest.
    for (const c of snapshot.conflicts) {
      switch (c.table) {
        case "user_organizations":
          await tx
            .delete(userOrganizations)
            .where(eq(userOrganizations.id, c.deletedRowId));
          break;
        case "group_memberships":
          await tx
            .delete(groupMemberships)
            .where(eq(groupMemberships.id, c.deletedRowId));
          break;
        case "event_committee_assignments":
          await tx
            .delete(eventCommitteeAssignments)
            .where(eq(eventCommitteeAssignments.id, c.deletedRowId));
          break;
        case "user_disciplines":
          await tx
            .delete(userDisciplines)
            .where(
              and(
                eq(userDisciplines.userId, snapshot.source.id),
                eq(userDisciplines.disciplineId, c.deletedRowId)
              )
            );
          break;
        case "user_skills":
          await tx
            .delete(userSkills)
            .where(
              and(
                eq(userSkills.userId, snapshot.source.id),
                eq(userSkills.skillId, c.deletedRowId)
              )
            );
          break;
        case "user_languages":
          await tx
            .delete(userLanguages)
            .where(
              and(
                eq(userLanguages.userId, snapshot.source.id),
                eq(userLanguages.languageId, c.deletedRowId)
              )
            );
          break;
        case "user_engagement_types":
          await tx
            .delete(userEngagementTypes)
            .where(
              and(
                eq(userEngagementTypes.userId, snapshot.source.id),
                eq(userEngagementTypes.engagementTypeId, c.deletedRowId)
              )
            );
          break;
      }
    }

    // 5. Mark source as merged.
    await tx
      .update(users)
      .set({
        mergedIntoUserId: snapshot.target.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, snapshot.source.id));

    // 6. Insert the user_merges manifest row INSIDE the transaction so that
    //    if the worker crashes between batch commit and audit insert, we
    //    never end up with a soft-merged source that has no manifest.
    await tx
      .insert(userMerges)
      .values({
        id: mergeId,
        sourceUserId: snapshot.source.id,
        targetUserId: snapshot.target.id,
        mergedByUserId: req.mergedByUserId,
        reason: req.reason ?? null,
        repointedRows: snapshot.toRepoint as unknown as Record<string, unknown>,
        promotedFields: promotedRecord,
      });
  });

  return {
    mergeId,
    repointedRows: snapshot.toRepoint,
    conflicts: snapshot.conflicts,
    promotedFields: promotedRecord,
  };
}
