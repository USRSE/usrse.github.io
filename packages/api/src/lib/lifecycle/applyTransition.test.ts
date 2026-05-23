import { describe, expect, test } from "vitest";
import { applyTransition, type LifecycleDb } from "./applyTransition";

type ArtifactRow = {
  id: string;
  status: import("./types").ArtifactStatus;
  revision: number;
  authorId: string | null;
};

type AuditRow = { action: string; targetType: string; targetId: string; payload: unknown };

function makeDb(initial: ArtifactRow): LifecycleDb & {
  events: Record<string, ArtifactRow>;
  reviews: Array<{ entityRevision: number; reviewerId: string; decision: "approve" | "reject" | "request_changes" }>;
  audits: AuditRow[];
} {
  const events: Record<string, ArtifactRow> = { [initial.id]: { ...initial } };
  const reviews: Array<{ entityRevision: number; reviewerId: string; decision: "approve" | "reject" | "request_changes" }> = [];
  const audits: AuditRow[] = [];
  return {
    events,
    reviews,
    audits,
    async fetchArtifact(entityType, id) {
      const row = events[id];
      if (!row) return null;
      return {
        id: row.id,
        entityType,
        status: row.status,
        revision: row.revision,
        authorId: row.authorId,
      };
    },
    async insertReview({ entityRevision, reviewerId, decision }) {
      reviews.push({ entityRevision, reviewerId, decision });
    },
    async listApprovalsForRevision(_entityType, _entityId, revision) {
      return reviews
        .filter((r) => r.entityRevision === revision && r.decision === "approve")
        .map((r) => ({ reviewerId: r.reviewerId }));
    },
    async updateArtifactStatus({ entityId, status, bumpRevision }) {
      const row = events[entityId];
      if (!row) throw new Error("artifact missing");
      row.status = status;
      if (bumpRevision) row.revision += 1;
    },
    async insertAudit({ action, targetType, targetId, payload }) {
      audits.push({ action, targetType, targetId, payload });
    },
  };
}

describe("applyTransition", () => {
  test("draft → submit_for_review moves to in_review and emits audit", async () => {
    const db = makeDb({ id: "e1", status: "draft", revision: 1, authorId: "author-1" });
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "submit_for_review",
      actorId: "author-1",
    });
    expect(result.ok).toBe(true);
    expect(db.events["e1"].status).toBe("in_review");
    expect(db.audits[0].action).toBe("events.submit_for_review");
  });

  test("rejecting a draft is invalid (must be in_review)", async () => {
    const db = makeDb({ id: "e1", status: "draft", revision: 1, authorId: "author-1" });
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "reject",
      actorId: "reviewer-1",
      comment: "no",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_transition");
  });

  test("first approval keeps status at in_review (1 of 2)", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    expect(result.ok).toBe(true);
    expect(db.events["e1"].status).toBe("in_review");
    expect(db.reviews).toHaveLength(1);
  });

  test("second distinct approval publishes the artifact and audits 'publish'", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    const second = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-2",
    });
    expect(second.ok).toBe(true);
    expect(db.events["e1"].status).toBe("published");
    expect(db.audits.map((a) => a.action)).toContain("events.publish");
  });

  test("author cannot approve their own artifact", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "author-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("self_approval_forbidden");
  });

  test("same reviewer approving twice does not publish", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    expect(db.events["e1"].status).toBe("in_review");
  });

  test("request_changes moves to changes_requested and requires comment", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    const noComment = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "request_changes",
      actorId: "reviewer-1",
    });
    expect(noComment.ok).toBe(false);
    if (!noComment.ok) expect(noComment.error).toBe("comment_required");

    const withComment = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "request_changes",
      actorId: "reviewer-1",
      comment: "Please tighten the title",
    });
    expect(withComment.ok).toBe(true);
    expect(db.events["e1"].status).toBe("changes_requested");
  });

  test("resubmit from changes_requested bumps revision and invalidates prior approvals", async () => {
    const db = makeDb({ id: "e1", status: "in_review", revision: 1, authorId: "author-1" });
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "request_changes",
      actorId: "reviewer-2",
      comment: "edit",
    });
    await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "submit_for_review",
      actorId: "author-1",
    });
    expect(db.events["e1"].revision).toBe(2);
    expect(db.events["e1"].status).toBe("in_review");
    const result = await applyTransition(db, {
      entityType: "event",
      entityId: "e1",
      action: "approve",
      actorId: "reviewer-1",
    });
    expect(result.ok).toBe(true);
    expect(db.events["e1"].status).toBe("in_review");
  });
});
