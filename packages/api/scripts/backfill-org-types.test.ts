import { describe, expect, it } from "vitest";
import { classifyOrgByName } from "./backfill-org-types";

describe("classifyOrgByName", () => {
  it.each<[string, string]>([
    ["Princeton University", "university"],
    ["MIT", "other"], // not matched by simple regex; needs the abbreviation list
    ["Massachusetts Institute of Technology", "university"],
    ["Lawrence Berkeley National Laboratory", "national_lab"],
    ["ORNL", "national_lab"],
    ["NSF", "agency"],
    ["National Science Foundation", "agency"],
    ["BSSw", "external_resource"],
    ["Better Scientific Software (BSSw)", "external_resource"],
    ["Software Sustainability Institute (SSI)", "external_resource"],
    ["Acme Corp", "other"],
  ])("'%s' → %s", (name, expected) => {
    expect(classifyOrgByName(name)).toBe(expected);
  });
});
