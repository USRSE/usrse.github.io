import { describe, expect, it } from "vitest";
import {
  channelTypeToGroupType,
  deriveDisplayName,
  deriveSlug,
  matchExistingGroup,
  normalizeForMatch,
  stripTypePrefix,
} from "./lib/groupReconcile";

describe("channelTypeToGroupType", () => {
  it("maps wg/ag/rg to enum values", () => {
    expect(channelTypeToGroupType("wg")).toBe("working_group");
    expect(channelTypeToGroupType("ag")).toBe("affinity_group");
    expect(channelTypeToGroupType("rg")).toBe("regional_group");
  });
});

describe("stripTypePrefix", () => {
  it("removes wg-/ag-/rg- prefixes", () => {
    expect(stripTypePrefix("wg-code-review")).toBe("code-review");
    expect(stripTypePrefix("ag-aiml")).toBe("aiml");
    expect(stripTypePrefix("rg-bay-area-ca")).toBe("bay-area-ca");
  });
  it("returns unchanged when no prefix", () => {
    expect(stripTypePrefix("plain")).toBe("plain");
  });
});

describe("normalizeForMatch", () => {
  it("strips dashes/underscores and lowercases", () => {
    expect(normalizeForMatch("Bay-Area-CA")).toBe("bayareaca");
    expect(normalizeForMatch("rg_nyc")).toBe("rgnyc");
  });
  it("strips multiple consecutive separators", () => {
    expect(normalizeForMatch("foo--bar")).toBe("foobar");
  });
});

describe("deriveDisplayName", () => {
  it("title-cases a slug suffix", () => {
    expect(deriveDisplayName("code-review")).toBe("Code Review");
    expect(deriveDisplayName("bay-area-ca")).toBe("Bay Area Ca");
  });
  it("handles single-word suffix", () => {
    expect(deriveDisplayName("aiml")).toBe("Aiml");
  });
});

describe("deriveSlug", () => {
  it("strips type prefix only", () => {
    expect(deriveSlug("rg-new-england")).toBe("new-england");
  });
  it("strips wg prefix", () => {
    expect(deriveSlug("wg-testing")).toBe("testing");
  });
});

describe("matchExistingGroup", () => {
  const groupsByType = {
    working_group: [
      {
        id: "g1",
        slug: "code-review",
        type: "working_group" as const,
        slackChannel: "wg-code-review",
        description: null,
      },
      {
        id: "g2",
        slug: "user-experience-ux",
        type: "working_group" as const,
        slackChannel: "wg-ux",
        description: "Existing.",
      },
    ],
    affinity_group: [
      {
        id: "g3",
        slug: "neuro-rse",
        type: "affinity_group" as const,
        slackChannel: null,
        description: null,
      },
    ],
    regional_group: [
      {
        id: "g4",
        slug: "bay-area-california",
        type: "regional_group" as const,
        slackChannel: "rg-bayareaca",
        description: null,
      },
    ],
  };

  it("matches by exact normalized slack_channel", () => {
    const m = matchExistingGroup({ name: "wg-code-review", type: "wg" }, groupsByType);
    expect(m?.id).toBe("g1");
  });

  it("matches rg-bay-area-ca against drifted DB value rg-bayareaca via normalization", () => {
    const m = matchExistingGroup({ name: "rg-bay-area-ca", type: "rg" }, groupsByType);
    expect(m?.id).toBe("g4");
  });

  it("matches by slug when slack_channel is null", () => {
    const m = matchExistingGroup({ name: "ag-neuro-rse", type: "ag" }, groupsByType);
    expect(m?.id).toBe("g3");
  });

  it("returns null when no candidate exists", () => {
    const m = matchExistingGroup({ name: "rg-nowhere", type: "rg" }, groupsByType);
    expect(m).toBeNull();
  });

  it("does not match across types (wg-* must not match affinity_group)", () => {
    const m = matchExistingGroup({ name: "wg-neuro-rse", type: "wg" }, groupsByType);
    expect(m).toBeNull();
  });

  it("prefers slack_channel match over slug match", () => {
    // g2 has slack_channel "wg-ux" — a channel named "wg-ux" should hit it via
    // slack_channel before trying slug.
    const m = matchExistingGroup({ name: "wg-ux", type: "wg" }, groupsByType);
    expect(m?.id).toBe("g2");
  });
});
