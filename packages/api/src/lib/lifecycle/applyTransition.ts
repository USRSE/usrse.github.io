import {
  PUBLISH_APPROVAL_THRESHOLD,
  countValidApprovals,
  type ApprovalDb,
} from "./approvals";
import { isValidTransition } from "./transitions";
import type {
  ArtifactEntityType,
  ArtifactSnapshot,
  ArtifactStatus,
  LifecycleAction,
  ReviewDecision,
} from "./types";

export interface LifecycleDb extends ApprovalDb {
  fetchArtifact(
    entityType: ArtifactEntityType,
    id: string
  ): Promise<ArtifactSnapshot | null>;
  insertReview(args: {
    entityType: ArtifactEntityType;
    entityId: string;
    entityRevision: number;
    reviewerId: string;
    decision: ReviewDecision;
    comment: string | null;
  }): Promise<void>;
  updateArtifactStatus(args: {
    entityType: ArtifactEntityType;
    entityId: string;
    status: ArtifactStatus;
    bumpRevision: boolean;
  }): Promise<void>;
  insertAudit(args: {
    action: string;
    targetType: string;
    targetId: string;
    payload: Record<string, unknown> | null;
  }): Promise<void>;
}

export interface ApplyTransitionInput {
  entityType: ArtifactEntityType;
  entityId: string;
  action: LifecycleAction;
  actorId: string;
  comment?: string;
}

export type ApplyTransitionResult =
  | { ok: true; newStatus: ArtifactStatus }
  | {
      ok: false;
      error:
        | "not_found"
        | "invalid_transition"
        | "comment_required"
        | "self_approval_forbidden"
        | "self_review_forbidden";
    };

/**
 * Atomic transition: validates, persists, and audits in one call.
 *
 * Map of action → review-decision-side-effect:
 *   submit_for_review → no review row; sets in_review (bumps revision if from changes_requested)
 *   approve           → review row (approve); status flips to published when threshold met
 *   reject            → review row (reject); status flips to rejected immediately
 *   request_changes   → review row (request_changes); status flips to changes_requested
 *   cancel            → no review row; status flips to cancelled
 *   archive           → no review row; status flips to archived
 *   close             → no review row; status flips to closed
 */
export async function applyTransition(
  db: LifecycleDb,
  input: ApplyTransitionInput
): Promise<ApplyTransitionResult> {
  const artifact = await db.fetchArtifact(input.entityType, input.entityId);
  if (!artifact) return { ok: false, error: "not_found" };

  if (!isValidTransition(input.entityType, artifact.status, input.action)) {
    return { ok: false, error: "invalid_transition" };
  }

  if (
    (input.action === "approve" ||
      input.action === "reject" ||
      input.action === "request_changes") &&
    artifact.authorId === input.actorId
  ) {
    return {
      ok: false,
      error:
        input.action === "approve"
          ? "self_approval_forbidden"
          : "self_review_forbidden",
    };
  }

  if (
    (input.action === "request_changes" || input.action === "reject") &&
    !input.comment?.trim()
  ) {
    return { ok: false, error: "comment_required" };
  }

  let newStatus: ArtifactStatus = artifact.status;
  let bumpRevision = false;
  let auditAction = "";
  let writeReview = false;
  let reviewDecision: ReviewDecision | null = null;

  switch (input.action) {
    case "submit_for_review": {
      newStatus = "in_review";
      bumpRevision = artifact.status === "changes_requested";
      auditAction = verb(input.entityType, "submit_for_review");
      break;
    }
    case "request_changes": {
      newStatus = "changes_requested";
      auditAction = verb(input.entityType, "request_changes");
      writeReview = true;
      reviewDecision = "request_changes";
      break;
    }
    case "reject": {
      newStatus = "rejected";
      auditAction = verb(input.entityType, "reject");
      writeReview = true;
      reviewDecision = "reject";
      break;
    }
    case "approve": {
      await db.insertReview({
        entityType: input.entityType,
        entityId: input.entityId,
        entityRevision: artifact.revision,
        reviewerId: input.actorId,
        decision: "approve",
        comment: input.comment?.trim() || null,
      });
      const count = await countValidApprovals(db, {
        entityType: input.entityType,
        entityId: input.entityId,
        revision: artifact.revision,
        authorId: artifact.authorId,
      });
      if (count >= PUBLISH_APPROVAL_THRESHOLD) {
        await db.updateArtifactStatus({
          entityType: input.entityType,
          entityId: input.entityId,
          status: "published",
          bumpRevision: false,
        });
        await db.insertAudit({
          action: verb(input.entityType, "publish"),
          targetType: tableName(input.entityType),
          targetId: input.entityId,
          payload: { approvalCount: count, revision: artifact.revision },
        });
        return { ok: true, newStatus: "published" };
      }
      await db.insertAudit({
        action: verb(input.entityType, "approve"),
        targetType: tableName(input.entityType),
        targetId: input.entityId,
        payload: { approvalCount: count, revision: artifact.revision },
      });
      return { ok: true, newStatus: artifact.status };
    }
    case "cancel": {
      newStatus = "cancelled";
      auditAction = verb(input.entityType, "cancel");
      break;
    }
    case "archive": {
      newStatus = "archived";
      auditAction = verb(input.entityType, "archive");
      break;
    }
    case "close": {
      newStatus = "closed";
      auditAction = verb(input.entityType, "close");
      break;
    }
    case "publish": {
      return { ok: false, error: "invalid_transition" };
    }
  }

  if (writeReview && reviewDecision) {
    await db.insertReview({
      entityType: input.entityType,
      entityId: input.entityId,
      entityRevision: artifact.revision,
      reviewerId: input.actorId,
      decision: reviewDecision,
      comment: input.comment?.trim() || null,
    });
  }

  await db.updateArtifactStatus({
    entityType: input.entityType,
    entityId: input.entityId,
    status: newStatus,
    bumpRevision,
  });
  await db.insertAudit({
    action: auditAction,
    targetType: tableName(input.entityType),
    targetId: input.entityId,
    payload: input.comment ? { comment: input.comment.trim() } : null,
  });

  return { ok: true, newStatus };
}

function verb(entityType: ArtifactEntityType, action: string): string {
  return `${tableName(entityType)}.${action}`;
}

function tableName(entityType: ArtifactEntityType): string {
  switch (entityType) {
    case "event":
      return "events";
    case "announcement":
      return "announcements";
    case "form":
      return "forms";
    case "group":
      return "groups";
  }
}
