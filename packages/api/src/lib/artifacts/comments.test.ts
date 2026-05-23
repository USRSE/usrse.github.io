import { describe, expect, test } from "vitest";
import { sanitizeCommentBody, COMMENT_MAX_LEN } from "./comments";

describe("sanitizeCommentBody", () => {
  test("trims whitespace", () => {
    const r = sanitizeCommentBody("  hello  ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.body).toBe("hello");
  });

  test("rejects empty bodies", () => {
    expect(sanitizeCommentBody("").ok).toBe(false);
    expect(sanitizeCommentBody("   ").ok).toBe(false);
  });

  test("rejects bodies over the max length", () => {
    const long = "x".repeat(COMMENT_MAX_LEN + 1);
    expect(sanitizeCommentBody(long).ok).toBe(false);
  });

  test("accepts a normal comment", () => {
    const r = sanitizeCommentBody("This needs a clearer title.");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.body).toBe("This needs a clearer title.");
  });
});
