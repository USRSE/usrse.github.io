import { describe, expect, it } from "vitest";
import { truncateAtSentence } from "./lib/wikipedia";
import { nameMatchScore, domainsMatch } from "./backfill-org-locations";

describe("truncateAtSentence", () => {
  it("returns text unchanged if under limit", () => {
    expect(truncateAtSentence("Short.", 280)).toBe("Short.");
  });
  it("cuts at the last sentence boundary within limit", () => {
    const t = "Alpha sentence. Beta sentence. Gamma sentence keeps going forever and ever.";
    expect(truncateAtSentence(t, 20)).toBe("Alpha sentence.");
  });
});

describe("nameMatchScore", () => {
  it("scores exact match 100", () => {
    expect(nameMatchScore("Princeton University", "Princeton University")).toBeGreaterThanOrEqual(99);
  });
  it("scores substring match high", () => {
    expect(nameMatchScore("Princeton University", "Princeton")).toBeGreaterThan(70);
  });
  it("scores unrelated names low", () => {
    expect(nameMatchScore("Acme Corp", "Princeton University")).toBeLessThan(50);
  });
});

describe("domainsMatch", () => {
  it("true when registrable domains match", () => {
    expect(
      domainsMatch("https://www.princeton.edu", "https://princeton.edu/")
    ).toBe(true);
  });
  it("false when different domains", () => {
    expect(
      domainsMatch("https://princeton.edu", "https://mit.edu")
    ).toBe(false);
  });
  it("false when either is null", () => {
    expect(domainsMatch(null, "https://x.edu")).toBe(false);
  });
});
