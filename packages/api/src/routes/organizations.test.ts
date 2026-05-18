import { describe, expect, it } from "vitest";
import { buildListFilters, computeFacets } from "./organizations";

describe("buildListFilters", () => {
  it("always applies the base predicate", () => {
    const { sqlFragments } = buildListFilters({});
    expect(sqlFragments).toContain("status = 'approved'");
    expect(sqlFragments).toContain("deleted_at IS NULL");
    expect(sqlFragments).toContain("merged_into_id IS NULL");
  });

  it("adds type filter when type !== 'all'", () => {
    const { sqlFragments } = buildListFilters({ type: "university" });
    expect(sqlFragments.some((s) => s.includes("type = 'university'"))).toBe(true);
  });

  it("does not add type filter when type === 'all'", () => {
    const { sqlFragments } = buildListFilters({ type: "all" });
    expect(sqlFragments.every((s) => !s.includes("type ="))).toBe(true);
  });

  it("adds country filter when country present", () => {
    const { sqlFragments } = buildListFilters({ country: "US" });
    expect(sqlFragments.some((s) => s.includes("country = 'US'"))).toBe(true);
  });

  it("adds member-join clause when member=true", () => {
    const { joins } = buildListFilters({ member: true });
    expect(joins).toContain("org_memberships");
  });

  it("substring-searches name/shortName/url for q", () => {
    const { sqlFragments } = buildListFilters({ q: "MIT" });
    const joined = sqlFragments.join(" ");
    expect(joined).toMatch(/name.*ilike.*%MIT%/i);
    expect(joined).toMatch(/short_name.*ilike/i);
    expect(joined).toMatch(/url.*ilike/i);
  });
});

describe("computeFacets", () => {
  it("counts orgs by type and country, taking top 20 countries", () => {
    const rows = [
      { type: "university", country: "US" },
      { type: "university", country: "UK" },
      { type: "national_lab", country: "US" },
      { type: "company", country: null },
    ];
    const facets = computeFacets(rows as any);
    expect(facets.types.university).toBe(2);
    expect(facets.types.national_lab).toBe(1);
    expect(facets.types.company).toBe(1);
    expect(facets.countries.US).toBe(2);
    expect(facets.countries.UK).toBe(1);
    expect(facets.countries).not.toHaveProperty("null");
  });
});
