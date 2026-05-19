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
    expect(m?.group.id).toBe("g1");
    expect(m?.typeMismatch).toBe(false);
  });

  it("matches rg-bay-area-ca against drifted DB value rg-bayareaca via normalization", () => {
    const m = matchExistingGroup({ name: "rg-bay-area-ca", type: "rg" }, groupsByType);
    expect(m?.group.id).toBe("g4");
    expect(m?.typeMismatch).toBe(false);
  });

  it("matches by slug when slack_channel is null", () => {
    const m = matchExistingGroup({ name: "ag-neuro-rse", type: "ag" }, groupsByType);
    expect(m?.group.id).toBe("g3");
    expect(m?.typeMismatch).toBe(false);
  });

  it("returns null when no candidate exists", () => {
    const m = matchExistingGroup({ name: "rg-nowhere", type: "rg" }, groupsByType);
    expect(m).toBeNull();
  });

  it("flags cross-type slack_channel match as typeMismatch", () => {
    // A legacy affinity_group row has slack_channel 'rg-dmv-rse' but a
    // CSV rg-* channel arrives — should match via slack_channel and flag.
    const withLegacy = {
      ...groupsByType,
      affinity_group: [
        ...groupsByType.affinity_group,
        {
          id: "g5",
          slug: "dmv-rse",
          type: "affinity_group" as const,
          slackChannel: "rg-dmv-rse",
          description: null,
        },
      ],
    };
    const m = matchExistingGroup({ name: "rg-dmv-rse", type: "rg" }, withLegacy);
    expect(m?.group.id).toBe("g5");
    expect(m?.typeMismatch).toBe(true);
  });

  it("slug match is type-scoped (wg-* must not match affinity_group via slug)", () => {
    // g3 is an affinity_group with slug 'neuro-rse'. A wg-neuro-rse channel
    // should not match it via slug (only via slack_channel if it were equal,
    // which it isn't here).
    const m = matchExistingGroup({ name: "wg-neuro-rse", type: "wg" }, groupsByType);
    expect(m).toBeNull();
  });

  it("prefers slack_channel match over slug match", () => {
    const m = matchExistingGroup({ name: "wg-ux", type: "wg" }, groupsByType);
    expect(m?.group.id).toBe("g2");
  });
});
