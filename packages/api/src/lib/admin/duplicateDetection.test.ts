import { describe, expect, it } from "vitest";
import {
  normalizeDisplayName,
  canonicalizeEmailLocal,
  rawEmailLocal,
  emailDomain,
  canonicalizeGithub,
  canonicalizeLinkedin,
  scoreCandidatePair,
  type CandidatePairInput,
} from "./duplicateDetection";

describe("normalizeDisplayName", () => {
  it("lowercases and strips whitespace + punctuation", () => {
    expect(normalizeDisplayName("Marina Olhovsky-Mann")).toBe(
      "marinaolhovskymann"
    );
  });
  it("returns empty on empty", () => {
    expect(normalizeDisplayName("")).toBe("");
    expect(normalizeDisplayName(null)).toBe("");
  });
});

describe("canonicalizeEmailLocal", () => {
  it("strips Gmail dots and +tag, case-folds", () => {
    expect(canonicalizeEmailLocal("John.Smith+work@Gmail.com")).toBe(
      "johnsmith"
    );
  });
  it("strips +tag for non-Gmail providers but keeps dots", () => {
    expect(canonicalizeEmailLocal("john.smith+work@example.org")).toBe(
      "john.smith"
    );
  });
  it("returns empty on malformed input", () => {
    expect(canonicalizeEmailLocal("not-an-email")).toBe("");
  });
});

describe("rawEmailLocal", () => {
  it("returns the lowercased local part with no canonicalization", () => {
    expect(rawEmailLocal("John.Smith@Gmail.com")).toBe("john.smith");
  });
});

describe("emailDomain", () => {
  it("returns the lowercased domain", () => {
    expect(emailDomain("foo@BAR.com")).toBe("bar.com");
  });
});

describe("canonicalizeGithub", () => {
  it("extracts the bare username from a URL", () => {
    expect(canonicalizeGithub("https://github.com/CDCore09/")).toBe("cdcore09");
  });
  it("accepts a bare username too", () => {
    expect(canonicalizeGithub("cdcore09")).toBe("cdcore09");
  });
  it("returns empty on garbage", () => {
    expect(canonicalizeGithub(null)).toBe("");
    expect(canonicalizeGithub("https://github.com/")).toBe("");
  });
});

describe("canonicalizeLinkedin", () => {
  it("extracts the /in/<slug> path", () => {
    expect(
      canonicalizeLinkedin("https://www.linkedin.com/in/Cordero-Core/")
    ).toBe("cordero-core");
  });
  it("handles a bare slug", () => {
    expect(canonicalizeLinkedin("cordero-core")).toBe("cordero-core");
  });
});

describe("scoreCandidatePair", () => {
  function pair(overrides: Partial<CandidatePairInput> = {}): CandidatePairInput {
    return {
      a: {
        id: "u1",
        displayName: "Cordero Core",
        email: "cdcore09@gmail.com",
        orcid: null,
        githubUrl: null,
        linkedinUrl: null,
        primaryOrgId: null,
        signedUpAt: new Date("2026-01-01T00:00:00Z"),
        groupIds: new Set(),
      },
      b: {
        id: "u2",
        displayName: "Cordero Core",
        email: "cordero.core@uw.edu",
        orcid: null,
        githubUrl: null,
        linkedinUrl: null,
        primaryOrgId: null,
        signedUpAt: new Date("2026-01-15T00:00:00Z"),
        groupIds: new Set(),
      },
      ...overrides,
    };
  }

  it("scores name + signup-proximity for the canonical Cordero case", () => {
    const result = scoreCandidatePair(pair());
    // displayName +30 + signup proximity within 30d +5 = 35
    expect(result.score).toBe(35);
    expect(result.signals).toContain("displayName");
    expect(result.signals).toContain("signupProximity");
  });

  it("scores identical ORCID heavily", () => {
    const result = scoreCandidatePair(
      pair({
        a: {
          ...pair().a,
          orcid: "0000-0001-2345-6789",
        },
        b: {
          ...pair().b,
          orcid: "0000-0001-2345-6789",
        },
      })
    );
    // displayName 30 + orcid 50 + signup 5 = 85
    expect(result.score).toBe(85);
    expect(result.signals).toContain("orcid");
  });

  it("scores canonicalized email match", () => {
    const result = scoreCandidatePair(
      pair({
        a: { ...pair().a, email: "john.smith@gmail.com" },
        b: { ...pair().b, email: "JohnSmith+work@gmail.com" },
      })
    );
    // displayName 30 + same canonicalized email 30 + signup 5 = 65
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.signals).toContain("canonicalEmail");
  });

  it("does not double-count when both raw-local-match and canonical-local-match fire", () => {
    // raw match implies canonical match when local parts are identical; ensure
    // we score the stronger (canonical) and not both.
    const result = scoreCandidatePair(
      pair({
        a: { ...pair().a, email: "jdoe@a.com" },
        b: { ...pair().b, email: "jdoe@b.com" },
      })
    );
    // displayName 30 + canonicalized email 30 + signup 5 = 65, NOT 30+30+25+5=90
    expect(result.score).toBe(65);
  });

  it("scores group overlap", () => {
    const result = scoreCandidatePair(
      pair({
        a: { ...pair().a, groupIds: new Set(["g1", "g2"]) },
        b: { ...pair().b, groupIds: new Set(["g1", "g3"]) },
      })
    );
    // displayName 30 + canonical email match (cdcore09 vs cordero.core — NOT a match) +
    // group overlap 10 + signup 5 = 45
    expect(result.signals).toContain("groupOverlap");
  });

  it("scores rawEmailDifferentDomain when canonical forms diverge across providers", () => {
    // Gmail canonicalizes "john.doe" → "johndoe" but yahoo keeps the dot —
    // canonical forms differ, raw locals are identical, domains differ.
    const result = scoreCandidatePair(
      pair({
        a: { ...pair().a, email: "john.doe@gmail.com" },
        b: { ...pair().b, email: "john.doe@yahoo.com" },
      })
    );
    expect(result.signals).toContain("rawEmailDifferentDomain");
    expect(result.signals).not.toContain("canonicalEmail");
  });

  it("tier high when ≥80, medium when 50–79, weak when 30–49", () => {
    expect(scoreCandidatePair(pair()).tier).toBe("weak"); // 35
    expect(
      scoreCandidatePair(
        pair({
          a: { ...pair().a, orcid: "0000-0001-0000-0001" },
          b: { ...pair().b, orcid: "0000-0001-0000-0001" },
        })
      ).tier
    ).toBe("high"); // 85
  });
});
