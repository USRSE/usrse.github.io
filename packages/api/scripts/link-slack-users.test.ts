import { describe, expect, it } from "vitest";
import {
  normalizeName,
  emailLocal,
  scoreCandidate,
  pickBestMatch,
  type RseUser,
  type SlackUser,
} from "./lib/slackMatch";

// ─── normalizeName ────────────────────────────────────────────────────────────

describe("normalizeName", () => {
  it("lowercases input", () => {
    expect(normalizeName("Daniel")).toBe("daniel");
  });

  it("strips dots", () => {
    expect(normalizeName("d.katz")).toBe("dkatz");
  });

  it("strips dashes", () => {
    expect(normalizeName("smith-jones")).toBe("smithjones");
  });

  it("strips underscores", () => {
    expect(normalizeName("jane_doe")).toBe("janedoe");
  });

  it("strips spaces", () => {
    expect(normalizeName("Jane Doe")).toBe("janedoe");
  });

  it("handles already-normalized string", () => {
    expect(normalizeName("lparsons")).toBe("lparsons");
  });
});

// ─── emailLocal ───────────────────────────────────────────────────────────────

describe("emailLocal", () => {
  it("extracts local part of a standard email", () => {
    expect(emailLocal("lparsons@example.com")).toBe("lparsons");
  });

  it("returns the full string when there is no @", () => {
    expect(emailLocal("notanemail")).toBe("notanemail");
  });

  it("handles multiple @ by splitting on the first", () => {
    // indexOf finds the first @; everything before it is the local part
    expect(emailLocal("a@b@c")).toBe("a");
  });

  it("handles empty string", () => {
    expect(emailLocal("")).toBe("");
  });
});

// ─── scoreCandidate ───────────────────────────────────────────────────────────

function makeUser(overrides: Partial<RseUser> = {}): RseUser {
  return {
    id: "u1",
    email: "fallback@test.edu",
    displayName: null,
    ...overrides,
  };
}

describe("scoreCandidate — email_local==slack_username (high)", () => {
  it("produces high confidence when email local equals slack username", () => {
    const slack: SlackUser = { username: "lparsons", displayName: "" };
    const candidate = makeUser({ email: "lparsons@university.edu" });
    const result = scoreCandidate(slack, candidate);
    expect(result.confidence).toBe("high");
    expect(result.reasons).toContain("email_local==slack_username");
  });

  it("normalizes dots before comparing email local to slack username", () => {
    const slack: SlackUser = { username: "dkatz", displayName: "" };
    const candidate = makeUser({ email: "d.katz@example.com" });
    const result = scoreCandidate(slack, candidate);
    // d.katz → dkatz == dkatz → high
    expect(result.confidence).toBe("high");
  });
});

describe("scoreCandidate — display_name==slack_display (medium/high)", () => {
  it("produces high confidence when both signals fire (email + display)", () => {
    const slack: SlackUser = { username: "lparsons", displayName: "Lou Parsons" };
    const candidate = makeUser({
      email: "lparsons@uni.edu",
      displayName: "Lou Parsons",
    });
    const result = scoreCandidate(slack, candidate);
    expect(result.confidence).toBe("high");
    expect(result.reasons).toContain("email_local==slack_username");
    expect(result.reasons).toContain("display_name==slack_display");
  });

  it("produces medium confidence on display_name==slack_display alone", () => {
    const slack: SlackUser = { username: "xyz999", displayName: "Daniel Katz" };
    const candidate = makeUser({
      email: "unrelated@other.org",
      displayName: "Daniel Katz",
    });
    const result = scoreCandidate(slack, candidate);
    expect(result.confidence).toBe("medium");
    expect(result.reasons).toContain("display_name==slack_display");
  });
});

describe("scoreCandidate — display_name==slack_username", () => {
  it("produces medium confidence when display name matches the slack username", () => {
    const slack: SlackUser = { username: "jdoe", displayName: "" };
    const candidate = makeUser({ email: "unrelated@foo.com", displayName: "jdoe" });
    const result = scoreCandidate(slack, candidate);
    expect(result.confidence).toBe("medium");
    expect(result.reasons).toContain("display_name==slack_username");
  });
});

describe("scoreCandidate — email_local_contains_slack_username (low)", () => {
  it("produces low confidence when email local contains the slack username (>=4 chars)", () => {
    const slack: SlackUser = { username: "katz", displayName: "" };
    const candidate = makeUser({ email: "daniel.katz@school.edu", displayName: null });
    const result = scoreCandidate(slack, candidate);
    expect(result.confidence).toBe("low");
    expect(result.reasons).toContain("email_local_contains_slack_username");
  });

  it("does NOT fire when slack username is shorter than 4 chars", () => {
    const slack: SlackUser = { username: "dk", displayName: "" };
    const candidate = makeUser({ email: "dksmith@school.edu" });
    const result = scoreCandidate(slack, candidate);
    expect(result.confidence).toBe("none");
  });
});

describe("scoreCandidate — no match", () => {
  it("produces none when nothing overlaps", () => {
    const slack: SlackUser = { username: "zzz000", displayName: "" };
    const candidate = makeUser({ email: "alice@other.edu", displayName: "Alice Smith" });
    const result = scoreCandidate(slack, candidate);
    expect(result.confidence).toBe("none");
    expect(result.reasons).toHaveLength(0);
  });
});

// ─── pickBestMatch ────────────────────────────────────────────────────────────

describe("pickBestMatch", () => {
  it("returns none with no_candidates when candidates array is empty", () => {
    const slack: SlackUser = { username: "lparsons", displayName: "" };
    const result = pickBestMatch(slack, []);
    expect(result.confidence).toBe("none");
    expect(result.reasons).toContain("no_candidates");
  });

  it("returns high confidence for a single exact match", () => {
    const slack: SlackUser = { username: "lparsons", displayName: "" };
    const candidates: RseUser[] = [
      makeUser({ id: "u1", email: "lparsons@uni.edu" }),
    ];
    const result = pickBestMatch(slack, candidates);
    expect(result.confidence).toBe("high");
    expect(result.rseUserId).toBe("u1");
  });

  it("downgrades tied highs to medium and includes tie_with in reasons", () => {
    const slack: SlackUser = { username: "lparsons", displayName: "" };
    const candidates: RseUser[] = [
      makeUser({ id: "u1", email: "lparsons@uni.edu" }),
      makeUser({ id: "u2", email: "lparsons@other.org" }),
    ];
    const result = pickBestMatch(slack, candidates);
    expect(result.confidence).toBe("medium");
    expect(result.reasons.some((r) => r.startsWith("tie_with("))).toBe(true);
  });

  it("picks the higher-scored candidate over a lower one", () => {
    const slack: SlackUser = { username: "dkatz", displayName: "Daniel Katz" };
    const candidates: RseUser[] = [
      // high: email local + display
      makeUser({ id: "u1", email: "dkatz@uni.edu", displayName: "Daniel Katz" }),
      // low: email contains
      makeUser({ id: "u2", email: "daniel.katz.jr@uni.edu", displayName: null }),
    ];
    const result = pickBestMatch(slack, candidates);
    expect(result.rseUserId).toBe("u1");
    expect(result.confidence).toBe("high");
  });
});
