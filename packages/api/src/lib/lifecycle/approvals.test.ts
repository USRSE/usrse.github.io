import { describe, expect, test } from "vitest";
import { countValidApprovals } from "./approvals";

type Review = {
  entityType: "event" | "announcement" | "form" | "group";
  entityId: string;
  entityRevision: number;
  reviewerId: string;
  decision: "approve" | "reject" | "request_changes";
};

/**
 * Test helper: a fake DB that filters in-memory rows. Lets us test
 * approval logic without spinning up Postgres.
 */
function fakeDb(reviews: Review[]) {
  return {
    async listApprovalsForRevision(
      entityType: Review["entityType"],
      entityId: string,
      revision: number
    ): Promise<{ reviewerId: string }[]> {
      return reviews
        .filter(
          (r) =>
            r.entityType === entityType &&
            r.entityId === entityId &&
            r.entityRevision === revision &&
            r.decision === "approve"
        )
        .map((r) => ({ reviewerId: r.reviewerId }));
    },
  };
}

describe("countValidApprovals", () => {
  test("returns 0 when no approvals exist", async () => {
    const db = fakeDb([]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 1,
      authorId: "author-1",
    });
    expect(n).toBe(0);
  });

  test("counts distinct reviewers, excluding author", async () => {
    const db = fakeDb([
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "approve" },
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r2", decision: "approve" },
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "author-1", decision: "approve" },
    ]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 1,
      authorId: "author-1",
    });
    expect(n).toBe(2);
  });

  test("a single reviewer approving twice still counts as 1", async () => {
    const db = fakeDb([
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "approve" },
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "approve" },
    ]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 1,
      authorId: "author-1",
    });
    expect(n).toBe(1);
  });

  test("approvals on a different revision do not count", async () => {
    const db = fakeDb([
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "approve" },
      { entityType: "event", entityId: "e1", entityRevision: 2, reviewerId: "r2", decision: "approve" },
    ]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 2,
      authorId: "author-1",
    });
    expect(n).toBe(1);
  });

  test("reject and request_changes decisions are not approvals", async () => {
    const db = fakeDb([
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r1", decision: "reject" },
      { entityType: "event", entityId: "e1", entityRevision: 1, reviewerId: "r2", decision: "request_changes" },
    ]);
    const n = await countValidApprovals(db, {
      entityType: "event",
      entityId: "e1",
      revision: 1,
      authorId: "author-1",
    });
    expect(n).toBe(0);
  });
});
