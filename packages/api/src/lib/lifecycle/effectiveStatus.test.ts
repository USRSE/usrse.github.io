import { describe, expect, test } from "vitest";
import { effectiveStatus } from "./effectiveStatus";

describe("effectiveStatus", () => {
  test("returns stored status for draft / in_review (no auto-transition)", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "event",
        status: "draft",
        revision: 1,
        authorId: null,
        effectiveStatusInputs: { endDate: "2020-01-01" },
      })
    ).toBe("draft");
  });

  test("published event past end_date auto-transitions to completed", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "event",
        status: "published",
        revision: 1,
        authorId: null,
        effectiveStatusInputs: { endDate: "2020-01-01" },
      })
    ).toBe("completed");
  });

  test("published event with future end_date stays published", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "event",
        status: "published",
        revision: 1,
        authorId: null,
        effectiveStatusInputs: { endDate: "2099-12-31" },
      })
    ).toBe("published");
  });

  test("published announcement past expires_at auto-transitions to expired", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "announcement",
        status: "published",
        revision: 1,
        authorId: null,
        effectiveStatusInputs: { expiresAt: new Date("2020-01-01") },
      })
    ).toBe("expired");
  });

  test("published announcement with no expires_at stays published", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "announcement",
        status: "published",
        revision: 1,
        authorId: null,
      })
    ).toBe("published");
  });

  test("forms never auto-transition", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "form",
        status: "published",
        revision: 1,
        authorId: null,
      })
    ).toBe("published");
  });

  test("terminal states pass through unchanged", () => {
    expect(
      effectiveStatus({
        id: "x",
        entityType: "event",
        status: "cancelled",
        revision: 1,
        authorId: null,
      })
    ).toBe("cancelled");
  });
});
