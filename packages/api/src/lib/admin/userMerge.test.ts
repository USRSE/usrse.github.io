import { describe, expect, it } from "vitest";
import { PROMOTABLE_PROFILE_FIELDS } from "./userMerge";

describe("PROMOTABLE_PROFILE_FIELDS", () => {
  it("excludes email and role", () => {
    expect(PROMOTABLE_PROFILE_FIELDS).not.toContain("email" as never);
    expect(PROMOTABLE_PROFILE_FIELDS).not.toContain("role" as never);
  });
  it("includes the common profile fields", () => {
    expect(PROMOTABLE_PROFILE_FIELDS).toContain("displayName");
    expect(PROMOTABLE_PROFILE_FIELDS).toContain("photoUrl");
    expect(PROMOTABLE_PROFILE_FIELDS).toContain("bio");
  });
});
