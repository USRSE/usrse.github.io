import type { ArtifactEntityType } from "./types";

/**
 * The minimal DB surface this module needs. Production callers pass a
 * Drizzle-backed implementation; tests pass an in-memory fake.
 */
export interface ApprovalDb {
  listApprovalsForRevision(
    entityType: ArtifactEntityType,
    entityId: string,
    revision: number
  ): Promise<{ reviewerId: string }[]>;
}

export interface CountValidApprovalsInput {
  entityType: ArtifactEntityType;
  entityId: string;
  revision: number;
  /** Author id is excluded from the approval tally (self-promotion guard). */
  authorId: string | null;
}

/**
 * Count distinct reviewers (excluding the author) who have approved the
 * current revision of the artifact. Publish requires count >= 2.
 *
 * Resubmits bump the artifact's revision, so this function is naturally
 * scoped to the active revision via the revision parameter — older
 * approvals are silently ignored.
 */
export async function countValidApprovals(
  db: ApprovalDb,
  input: CountValidApprovalsInput
): Promise<number> {
  const approvals = await db.listApprovalsForRevision(
    input.entityType,
    input.entityId,
    input.revision
  );
  const distinct = new Set<string>();
  for (const row of approvals) {
    if (row.reviewerId === input.authorId) continue;
    distinct.add(row.reviewerId);
  }
  return distinct.size;
}

export const PUBLISH_APPROVAL_THRESHOLD = 2;
