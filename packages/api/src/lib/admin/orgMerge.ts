import { eq, sql } from "drizzle-orm";
import type { createDb } from "../../db";
import {
  eventSponsorships,
  organizationMerges,
  orgMemberships,
  organizations,
  userOrganizations,
} from "../../db/schema";

type Db = ReturnType<typeof createDb>;

/**
 * Fields on the target organization that the merge wizard can promote
 * from the source's row. Name and slug are intentionally NOT in this
 * list — both carry uniqueness constraints, and promoting them in-
 * transaction would require a temporary scrub on the source row that
 * complicates unmerge. The admin can rename source manually before
 * merging if a name-swap is wanted.
 *
 * Logo fields are virtual: each one stands for the url+storageKey
 * pair so promotion stays consistent (you can't end up with a target
 * pointing at the source's R2 object via the URL but lacking the
 * storage key needed to swap it later).
 */
export const PROMOTABLE_ORG_FIELDS = [
  "shortName",
  "url",
  "logoUsageConsent",
  "logoCredit",
  "logoMain", // virtual: logoUrl + logoStorageKey
  "logoDark", // virtual: logoDarkUrl + logoDarkStorageKey
  "logoMark", // virtual: logoMarkUrl + logoMarkStorageKey
] as const;

export type PromotableOrgField = (typeof PROMOTABLE_ORG_FIELDS)[number];

/**
 * Virtual logo fields fan out to two columns each. Keeping this map
 * in one place means executeMerge / executeUnmerge can iterate
 * uniformly over the union of real + virtual names.
 */
const VIRTUAL_LOGO_FIELDS: Record<
  "logoMain" | "logoDark" | "logoMark",
  { url: "logoUrl" | "logoDarkUrl" | "logoMarkUrl"; key: "logoStorageKey" | "logoDarkStorageKey" | "logoMarkStorageKey" }
> = {
  logoMain: { url: "logoUrl", key: "logoStorageKey" },
  logoDark: { url: "logoDarkUrl", key: "logoDarkStorageKey" },
  logoMark: { url: "logoMarkUrl", key: "logoMarkStorageKey" },
};

export interface OrgMergeRequest {
  sourceOrganizationId: string;
  targetOrganizationId: string;
  mergedByUserId: string;
  updatedByUserId: string;
  promotedFields: PromotableOrgField[];
  reason?: string;
}

export interface OrgMergeValidationError {
  status: 400 | 404 | 409;
  error: string;
  message: string;
}

export interface OrgMergeSnapshot {
  source: typeof organizations.$inferSelect;
  target: typeof organizations.$inferSelect;
  toRepoint: {
    user_organizations: string[];
    org_memberships: string[];
    event_sponsorships: string[];
  };
  /**
   * Join-table rows that exist on both sides and would violate a
   * unique index if both were repointed. Source's row is deleted
   * instead; the full row is preserved here so unmerge can re-insert.
   */
  conflicts: Array<{
    table: string;
    deletedRowId: string;
    snapshot: Record<string, unknown>;
  }>;
}

export async function validateOrgMerge(
  db: Db,
  req: OrgMergeRequest
): Promise<OrgMergeValidationError | null> {
  if (req.sourceOrganizationId === req.targetOrganizationId) {
    return {
      status: 400,
      error: "invalid_input",
      message: "Source and target must be different organizations.",
    };
  }

  const [src, tgt] = await Promise.all([
    db
      .select()
      .from(organizations)
      .where(eq(organizations.id, req.sourceOrganizationId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(organizations)
      .where(eq(organizations.id, req.targetOrganizationId))
      .limit(1)
      .then((r) => r[0]),
  ]);

  if (!src) {
    return {
      status: 404,
      error: "not_found",
      message: `Source organization ${req.sourceOrganizationId} not found.`,
    };
  }
  if (!tgt) {
    return {
      status: 404,
      error: "not_found",
      message: `Target organization ${req.targetOrganizationId} not found.`,
    };
  }
  if (src.mergedIntoId !== null) {
    return {
      status: 409,
      error: "already_merged",
      message: `Source is already merged into ${src.mergedIntoId}. Unmerge first.`,
    };
  }
  // Like users, source.deletedAt isn't checked — merging a soft-deleted
  // duplicate INTO a healthy canonical org is valid cleanup. Target
  // must be alive.
  if (tgt.deletedAt !== null) {
    return {
      status: 409,
      error: "target_deleted",
      message: "Cannot merge into a soft-deleted organization. Restore first.",
    };
  }
  return null;
}

export async function buildOrgMergeSnapshot(
  db: Db,
  req: OrgMergeRequest
): Promise<OrgMergeSnapshot> {
  const [src, tgt] = await Promise.all([
    db
      .select()
      .from(organizations)
      .where(eq(organizations.id, req.sourceOrganizationId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(organizations)
      .where(eq(organizations.id, req.targetOrganizationId))
      .limit(1)
      .then((r) => r[0]),
  ]);

  const conflicts: OrgMergeSnapshot["conflicts"] = [];

  // user_organizations: unique on (user_id, organization_id). For each
  // source row, if target already has that user, conflict (drop source);
  // else repoint.
  const [srcUserOrgs, tgtUserOrgs] = await Promise.all([
    db
      .select()
      .from(userOrganizations)
      .where(eq(userOrganizations.organizationId, req.sourceOrganizationId)),
    db
      .select()
      .from(userOrganizations)
      .where(eq(userOrganizations.organizationId, req.targetOrganizationId)),
  ]);
  const tgtUserIds = new Set(tgtUserOrgs.map((r) => r.userId));
  const toRepointUserOrgs: string[] = [];
  for (const r of srcUserOrgs) {
    if (tgtUserIds.has(r.userId)) {
      conflicts.push({
        table: "user_organizations",
        deletedRowId: r.id,
        snapshot: r as unknown as Record<string, unknown>,
      });
    } else {
      toRepointUserOrgs.push(r.id);
    }
  }

  // org_memberships: partial unique on (organization_id) WHERE
  // ended_at IS NULL. If both source and target have an active
  // membership, source's loses (target's already canonical). Closed
  // memberships always repoint cleanly.
  const [srcMemberships, tgtMemberships] = await Promise.all([
    db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.organizationId, req.sourceOrganizationId)),
    db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.organizationId, req.targetOrganizationId)),
  ]);
  const tgtHasActive = tgtMemberships.some((m) => m.endedAt === null);
  const toRepointMemberships: string[] = [];
  for (const m of srcMemberships) {
    if (m.endedAt === null && tgtHasActive) {
      conflicts.push({
        table: "org_memberships",
        deletedRowId: m.id,
        snapshot: m as unknown as Record<string, unknown>,
      });
    } else {
      toRepointMemberships.push(m.id);
    }
  }

  // event_sponsorships: unique on (event_id, organization_id). For
  // each source row, if target already sponsored that event, conflict.
  const [srcSponsorships, tgtSponsorships] = await Promise.all([
    db
      .select()
      .from(eventSponsorships)
      .where(eq(eventSponsorships.organizationId, req.sourceOrganizationId)),
    db
      .select()
      .from(eventSponsorships)
      .where(eq(eventSponsorships.organizationId, req.targetOrganizationId)),
  ]);
  const tgtEventIds = new Set(tgtSponsorships.map((s) => s.eventId));
  const toRepointSponsorships: string[] = [];
  for (const s of srcSponsorships) {
    if (tgtEventIds.has(s.eventId)) {
      conflicts.push({
        table: "event_sponsorships",
        deletedRowId: s.id,
        snapshot: s as unknown as Record<string, unknown>,
      });
    } else {
      toRepointSponsorships.push(s.id);
    }
  }

  return {
    source: src,
    target: tgt,
    toRepoint: {
      user_organizations: toRepointUserOrgs,
      org_memberships: toRepointMemberships,
      event_sponsorships: toRepointSponsorships,
    },
    conflicts,
  };
}

export interface OrgMergeResult {
  mergeId: string;
  repointedRows: OrgMergeSnapshot["toRepoint"];
  conflicts: OrgMergeSnapshot["conflicts"];
  promotedFields: Record<string, unknown>;
}

export async function executeOrgMerge(
  db: Db,
  snapshot: OrgMergeSnapshot,
  req: OrgMergeRequest
): Promise<OrgMergeResult> {
  // Build the pre-promotion target snapshot for unmerge. For virtual
  // logo fields we capture both halves so unmerge can restore both
  // columns even if the wizard only checked the logical pair.
  const promotedRecord: Record<string, unknown> = {};
  for (const f of req.promotedFields) {
    if (f === "logoMain" || f === "logoDark" || f === "logoMark") {
      const { url, key } = VIRTUAL_LOGO_FIELDS[f];
      promotedRecord[url] = snapshot.target[url] ?? null;
      promotedRecord[key] = snapshot.target[key] ?? null;
    } else {
      promotedRecord[f] = snapshot.target[f as keyof typeof snapshot.target] ?? null;
    }
  }

  const mergeId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    // 1. Promote fields from source onto target and stamp updatedBy.
    //    Always update the target so updated_by is written even when
    //    no fields are promoted. Virtual logo fields expand into two
    //    columns each.
    {
      const updates: Record<string, unknown> = { updatedBy: req.updatedByUserId, updatedAt: new Date() };
      for (const f of req.promotedFields) {
        if (f === "logoMain" || f === "logoDark" || f === "logoMark") {
          const { url, key } = VIRTUAL_LOGO_FIELDS[f];
          updates[url] = snapshot.source[url] ?? null;
          updates[key] = snapshot.source[key] ?? null;
        } else {
          updates[f] = snapshot.source[f as keyof typeof snapshot.source] ?? null;
        }
      }
      await tx
        .update(organizations)
        .set(updates)
        .where(eq(organizations.id, snapshot.target.id));
    }

    // 2. Repoint user_organizations rows that don't conflict.
    if (snapshot.toRepoint.user_organizations.length > 0) {
      await tx
        .update(userOrganizations)
        .set({ organizationId: snapshot.target.id })
        .where(
          sql`${userOrganizations.id} = ANY(${snapshot.toRepoint.user_organizations})`
        );
    }

    // 3. Repoint org_memberships.
    if (snapshot.toRepoint.org_memberships.length > 0) {
      await tx
        .update(orgMemberships)
        .set({ organizationId: snapshot.target.id })
        .where(
          sql`${orgMemberships.id} = ANY(${snapshot.toRepoint.org_memberships})`
        );
    }

    // 4. Repoint event_sponsorships.
    if (snapshot.toRepoint.event_sponsorships.length > 0) {
      await tx
        .update(eventSponsorships)
        .set({ organizationId: snapshot.target.id })
        .where(
          sql`${eventSponsorships.id} = ANY(${snapshot.toRepoint.event_sponsorships})`
        );
    }

    // 5. Delete conflict rows on the source side.
    for (const c of snapshot.conflicts) {
      switch (c.table) {
        case "user_organizations":
          await tx
            .delete(userOrganizations)
            .where(eq(userOrganizations.id, c.deletedRowId));
          break;
        case "org_memberships":
          await tx
            .delete(orgMemberships)
            .where(eq(orgMemberships.id, c.deletedRowId));
          break;
        case "event_sponsorships":
          await tx
            .delete(eventSponsorships)
            .where(eq(eventSponsorships.id, c.deletedRowId));
          break;
      }
    }

    // 6. Mark source as merged.
    await tx
      .update(organizations)
      .set({
        mergedIntoId: snapshot.target.id,
        updatedBy: req.updatedByUserId,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, snapshot.source.id));

    // 7. Insert the manifest INSIDE the transaction — see the parallel
    //    rationale in userMerge.ts: a crash between mark-merged and
    //    manifest-insert would leave a source that can't be unmerged.
    await tx.insert(organizationMerges).values({
      id: mergeId,
      sourceOrganizationId: snapshot.source.id,
      targetOrganizationId: snapshot.target.id,
      mergedByUserId: req.mergedByUserId,
      reason: req.reason ?? null,
      repointedRows: {
        toRepoint: snapshot.toRepoint,
        conflicts: snapshot.conflicts,
      } as unknown as Record<string, unknown>,
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

export interface OrgUnmergeRequest {
  mergeId: string;
  revertedByUserId: string;
}

export interface OrgUnmergeValidationError {
  status: 400 | 404 | 409;
  error: string;
  message: string;
}

/**
 * Reverse a previously-executed org merge. Mirrors executeUnmerge
 * shape. R2 objects referenced by promoted logo fields are NOT
 * touched — if logoMain was promoted from source to target, the
 * target's pre-merge object key (recorded in promotedFields) is
 * restored, but the source's bytes remain in R2 untouched, available
 * to be re-promoted or cleaned up by a future sweep.
 */
export async function executeOrgUnmerge(
  db: Db,
  req: OrgUnmergeRequest
): Promise<OrgUnmergeValidationError | { mergeId: string }> {
  const mergeRow = await db
    .select()
    .from(organizationMerges)
    .where(eq(organizationMerges.id, req.mergeId))
    .limit(1)
    .then((r) => r[0]);
  if (!mergeRow) {
    return {
      status: 404,
      error: "not_found",
      message: `merge ${req.mergeId} not found.`,
    };
  }
  if (mergeRow.revertedAt !== null) {
    return {
      status: 409,
      error: "already_reverted",
      message: "This merge has already been reverted.",
    };
  }

  const sourceCurrent = await db
    .select({ mergedIntoId: organizations.mergedIntoId })
    .from(organizations)
    .where(eq(organizations.id, mergeRow.sourceOrganizationId))
    .limit(1)
    .then((r) => r[0]);
  if (
    !sourceCurrent ||
    sourceCurrent.mergedIntoId !== mergeRow.targetOrganizationId
  ) {
    return {
      status: 409,
      error: "stale_merge",
      message:
        "Source's merge target no longer matches this merge record. Manual review required.",
    };
  }

  const manifest = mergeRow.repointedRows as unknown as {
    toRepoint: OrgMergeSnapshot["toRepoint"];
    conflicts: OrgMergeSnapshot["conflicts"];
  };
  const repointedRows = manifest.toRepoint;
  const conflicts = manifest.conflicts;
  const promotedFields = mergeRow.promotedFields as Record<string, unknown>;

  await db.transaction(async (tx) => {
    // 1. Reverse-repoint user_organizations.
    if (repointedRows.user_organizations.length > 0) {
      await tx
        .update(userOrganizations)
        .set({ organizationId: mergeRow.sourceOrganizationId })
        .where(
          sql`${userOrganizations.id} = ANY(${repointedRows.user_organizations})`
        );
    }
    // 2. Reverse-repoint org_memberships.
    if (repointedRows.org_memberships.length > 0) {
      await tx
        .update(orgMemberships)
        .set({ organizationId: mergeRow.sourceOrganizationId })
        .where(
          sql`${orgMemberships.id} = ANY(${repointedRows.org_memberships})`
        );
    }
    // 3. Reverse-repoint event_sponsorships.
    if (repointedRows.event_sponsorships.length > 0) {
      await tx
        .update(eventSponsorships)
        .set({ organizationId: mergeRow.sourceOrganizationId })
        .where(
          sql`${eventSponsorships.id} = ANY(${repointedRows.event_sponsorships})`
        );
    }

    // 4. Re-insert conflict-deleted rows back onto source.
    for (const c of conflicts) {
      switch (c.table) {
        case "user_organizations":
          await tx.insert(userOrganizations).values(c.snapshot as never);
          break;
        case "org_memberships":
          await tx.insert(orgMemberships).values(c.snapshot as never);
          break;
        case "event_sponsorships":
          await tx.insert(eventSponsorships).values(c.snapshot as never);
          break;
      }
    }

    // 5. Restore promoted fields on target.
    if (Object.keys(promotedFields).length > 0) {
      const restoreUpdates: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      for (const [k, v] of Object.entries(promotedFields)) {
        restoreUpdates[k] = v;
      }
      await tx
        .update(organizations)
        .set(restoreUpdates)
        .where(eq(organizations.id, mergeRow.targetOrganizationId));
    }

    // 6. Clear merged_into_id on source.
    await tx
      .update(organizations)
      .set({ mergedIntoId: null, updatedAt: new Date() })
      .where(eq(organizations.id, mergeRow.sourceOrganizationId));

    // 7. Stamp the manifest row reverted.
    await tx
      .update(organizationMerges)
      .set({
        revertedAt: new Date(),
        revertedByUserId: req.revertedByUserId,
      })
      .where(eq(organizationMerges.id, req.mergeId));
  });

  return { mergeId: req.mergeId };
}
