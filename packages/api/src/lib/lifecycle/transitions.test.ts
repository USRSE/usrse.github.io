import { describe, expect, test } from "vitest";
import { isValidTransition } from "./transitions";

describe("isValidTransition", () => {
  test("draft → submit_for_review is valid for all artifact types", () => {
    for (const t of ["event", "announcement", "form"] as const) {
      expect(isValidTransition(t, "draft", "submit_for_review")).toBe(true);
    }
  });

  test("draft → approve is invalid (must submit_for_review first)", () => {
    expect(isValidTransition("event", "draft", "approve")).toBe(false);
  });

  test("in_review → approve / reject / request_changes are valid", () => {
    expect(isValidTransition("event", "in_review", "approve")).toBe(true);
    expect(isValidTransition("event", "in_review", "reject")).toBe(true);
    expect(isValidTransition("event", "in_review", "request_changes")).toBe(true);
  });

  test("changes_requested → submit_for_review (resubmit) is valid", () => {
    expect(isValidTransition("event", "changes_requested", "submit_for_review")).toBe(true);
  });

  test("rejected is terminal", () => {
    expect(isValidTransition("event", "rejected", "submit_for_review")).toBe(false);
    expect(isValidTransition("event", "rejected", "approve")).toBe(false);
  });

  test("published → cancel valid for events only", () => {
    expect(isValidTransition("event", "published", "cancel")).toBe(true);
    expect(isValidTransition("announcement", "published", "cancel")).toBe(false);
    expect(isValidTransition("form", "published", "cancel")).toBe(false);
  });

  test("published → close valid for forms only", () => {
    expect(isValidTransition("form", "published", "close")).toBe(true);
    expect(isValidTransition("event", "published", "close")).toBe(false);
    expect(isValidTransition("announcement", "published", "close")).toBe(false);
  });

  test("published → archive valid for all types", () => {
    expect(isValidTransition("event", "published", "archive")).toBe(true);
    expect(isValidTransition("announcement", "published", "archive")).toBe(true);
    expect(isValidTransition("form", "published", "archive")).toBe(true);
  });
});
