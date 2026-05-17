import { describe, expect, it } from "vitest";
import {
  classifyMember,
  shouldIncludeInRoster,
  stripPrivateFields,
  type RosterMember,
  type CallerClass,
} from "./orgVisibility";

const publicMember: RosterMember = {
  userId: "u1",
  memberSlug: "ada",
  displayName: "Ada Lovelace",
  avatarUrl: "https://x/ada.jpg",
  role: "Principal Investigator",
  isPrimary: true,
  isPublic: true,
  isDiscoverable: true,
};

const listedPrivate: RosterMember = {
  ...publicMember,
  userId: "u2",
  memberSlug: "ed",
  displayName: "Edsger Dijkstra",
  isPublic: false,
  isDiscoverable: true,
};

const hidden: RosterMember = {
  ...publicMember,
  userId: "u3",
  memberSlug: "gh",
  displayName: "Grace Hopper",
  isPublic: false,
  isDiscoverable: false,
};

describe("shouldIncludeInRoster", () => {
  it.each<[CallerClass, RosterMember, boolean]>([
    ["anonymous", publicMember, true],
    ["anonymous", listedPrivate, false],
    ["anonymous", hidden, false],
    ["member", publicMember, true],
    ["member", listedPrivate, true],
    ["member", hidden, false],
    ["admin", publicMember, true],
    ["admin", listedPrivate, true],
    ["admin", hidden, false],
  ])("caller=%s, member=%j → %s", (caller, member, expected) => {
    expect(shouldIncludeInRoster(caller, member)).toBe(expected);
  });
});

describe("stripPrivateFields", () => {
  it("nulls avatarUrl + role for listed-private members", () => {
    expect(stripPrivateFields(listedPrivate)).toMatchObject({
      memberSlug: "ed",
      displayName: "Edsger Dijkstra",
      avatarUrl: null,
      role: null,
      isPrimary: true,
    });
  });
  it("passes through fully-public members unchanged", () => {
    expect(stripPrivateFields(publicMember)).toMatchObject({
      avatarUrl: "https://x/ada.jpg",
      role: "Principal Investigator",
    });
  });
});

describe("classifyMember", () => {
  it("returns 'public' for isPublic=true", () => {
    expect(classifyMember(publicMember)).toBe("public");
  });
  it("returns 'listed' for isPublic=false + isDiscoverable=true", () => {
    expect(classifyMember(listedPrivate)).toBe("listed");
  });
  it("returns 'hidden' for both false", () => {
    expect(classifyMember(hidden)).toBe("hidden");
  });
});
