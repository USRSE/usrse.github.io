import { describe, expect, it, test } from "vitest";
import {
  canApproveVocab,
  canCreateGroup,
  canEditEvent,
  canEditGroup,
  canEditMembers,
  canEnterAdminApp,
  canMergeUsers,
  canPromoteToRole,
  canViewAuditLog,
  type ActorContext,
} from "./index";

function actor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    user: { id: "u1", memberId: "m1", email: "u1@x", role: "member" },
    systemTier: 0,
    leadershipPositions: [],
    chairedGroupIds: new Set(),
    chairedEventIds: new Set(),
    ...overrides,
  };
}

describe("canEnterAdminApp", () => {
  it("denies a plain member with no positions", () => {
    expect(canEnterAdminApp(actor())).toBe(false);
  });
  it("allows staff", () => {
    expect(canEnterAdminApp(actor({ systemTier: 1 }))).toBe(true);
  });
  it("allows super_admin", () => {
    expect(canEnterAdminApp(actor({ systemTier: 2 }))).toBe(true);
  });
  it("allows a member who chairs at least one group", () => {
    expect(
      canEnterAdminApp(actor({ chairedGroupIds: new Set(["g1"]) }))
    ).toBe(true);
  });
  it("allows a member who chairs at least one event", () => {
    expect(
      canEnterAdminApp(actor({ chairedEventIds: new Set(["e1"]) }))
    ).toBe(true);
  });
  it("allows a board member", () => {
    expect(
      canEnterAdminApp(
        actor({
          leadershipPositions: [
            {
              id: "lt1",
              positionType: "board",
              label: "Director",
              startDate: "2026-01-01",
              endDate: null,
            },
          ],
        })
      )
    ).toBe(true);
  });
});

describe("canApproveVocab", () => {
  it("denies plain members", () => {
    expect(canApproveVocab(actor())).toBe(false);
  });
  it("allows staff", () => {
    expect(canApproveVocab(actor({ systemTier: 1 }))).toBe(true);
  });
  it("allows super_admin", () => {
    expect(canApproveVocab(actor({ systemTier: 2 }))).toBe(true);
  });
});

describe("canMergeUsers", () => {
  it("denies staff", () => {
    expect(canMergeUsers(actor({ systemTier: 1 }))).toBe(false);
  });
  it("allows super_admin", () => {
    expect(canMergeUsers(actor({ systemTier: 2 }))).toBe(true);
  });
});

describe("canEditGroup", () => {
  it("allows staff for any group", () => {
    expect(canEditGroup(actor({ systemTier: 1 }), { groupId: "g1" })).toBe(
      true
    );
  });
  it("allows a member who chairs that specific group", () => {
    expect(
      canEditGroup(actor({ chairedGroupIds: new Set(["g1"]) }), {
        groupId: "g1",
      })
    ).toBe(true);
  });
  it("denies a member who chairs a different group", () => {
    expect(
      canEditGroup(actor({ chairedGroupIds: new Set(["g2"]) }), {
        groupId: "g1",
      })
    ).toBe(false);
  });
});

describe("canEditEvent", () => {
  it("allows staff for any event", () => {
    expect(canEditEvent(actor({ systemTier: 1 }), { eventId: "e1" })).toBe(
      true
    );
  });
  it("allows a chair of that specific event", () => {
    expect(
      canEditEvent(actor({ chairedEventIds: new Set(["e1"]) }), {
        eventId: "e1",
      })
    ).toBe(true);
  });
  it("denies a chair of a different event", () => {
    expect(
      canEditEvent(actor({ chairedEventIds: new Set(["e2"]) }), {
        eventId: "e1",
      })
    ).toBe(false);
  });
});

describe("canViewAuditLog", () => {
  it("denies staff", () => {
    expect(canViewAuditLog(actor({ systemTier: 1 }))).toBe(false);
  });
  it("allows super_admin", () => {
    expect(canViewAuditLog(actor({ systemTier: 2 }))).toBe(true);
  });
});

describe("canEditMembers", () => {
  it("denies plain members", () => {
    expect(canEditMembers(actor())).toBe(false);
  });
  it("allows staff", () => {
    expect(canEditMembers(actor({ systemTier: 1 }))).toBe(true);
  });
  it("allows super_admin", () => {
    expect(canEditMembers(actor({ systemTier: 2 }))).toBe(true);
  });
});

describe("canPromoteToRole", () => {
  it("staff can grant member", () => {
    expect(
      canPromoteToRole(actor({ systemTier: 1 }), { newRole: "member" })
    ).toBe(true);
  });
  it("staff can grant staff", () => {
    expect(
      canPromoteToRole(actor({ systemTier: 1 }), { newRole: "staff" })
    ).toBe(true);
  });
  it("staff cannot grant super_admin", () => {
    expect(
      canPromoteToRole(actor({ systemTier: 1 }), { newRole: "super_admin" })
    ).toBe(false);
  });
  it("super_admin can grant any role", () => {
    expect(
      canPromoteToRole(actor({ systemTier: 2 }), { newRole: "super_admin" })
    ).toBe(true);
  });
  it("plain members cannot grant any role", () => {
    expect(canPromoteToRole(actor(), { newRole: "member" })).toBe(false);
  });
});

describe("canCreateGroup", () => {
  it("denies plain members", () => {
    expect(canCreateGroup(actor())).toBe(false);
  });
  it("denies staff", () => {
    expect(canCreateGroup(actor({ systemTier: 1 }))).toBe(false);
  });
  it("allows super_admin", () => {
    expect(canCreateGroup(actor({ systemTier: 2 }))).toBe(true);
  });
});

import { canEditArtifact } from "./canEditArtifact";

const memberActor = (id = "u-member") => ({
  user: { id, memberId: "m", email: "e", role: "member" as const },
  systemTier: 0 as const,
  leadershipPositions: [],
  chairedGroupIds: new Set<string>(),
  chairedEventIds: new Set<string>(),
});

const staffActor = (id = "u-staff") => ({
  ...memberActor(id),
  user: { ...memberActor(id).user, role: "staff" as const },
  systemTier: 1 as const,
});

describe("canEditArtifact", () => {
  test("staff can edit any artifact in any state", () => {
    expect(
      canEditArtifact(staffActor(), {
        entityType: "event",
        entityId: "e",
        status: "in_review",
        authorId: "someone-else",
      })
    ).toBe(true);
    expect(
      canEditArtifact(staffActor(), {
        entityType: "event",
        entityId: "e",
        status: "published",
        authorId: "someone-else",
      })
    ).toBe(true);
  });

  test("author can edit their own draft", () => {
    const a = memberActor("author-1");
    expect(
      canEditArtifact(a, {
        entityType: "event",
        entityId: "e",
        status: "draft",
        authorId: "author-1",
      })
    ).toBe(true);
  });

  test("author can edit their own changes_requested", () => {
    const a = memberActor("author-1");
    expect(
      canEditArtifact(a, {
        entityType: "event",
        entityId: "e",
        status: "changes_requested",
        authorId: "author-1",
      })
    ).toBe(true);
  });

  test("author cannot edit their own in_review (locked while reviewers look)", () => {
    const a = memberActor("author-1");
    expect(
      canEditArtifact(a, {
        entityType: "event",
        entityId: "e",
        status: "in_review",
        authorId: "author-1",
      })
    ).toBe(false);
  });

  test("non-author non-staff member cannot edit someone else's artifact", () => {
    const a = memberActor("u-1");
    expect(
      canEditArtifact(a, {
        entityType: "event",
        entityId: "e",
        status: "draft",
        authorId: "author-2",
      })
    ).toBe(false);
  });
});

import { canReviewArtifact } from "./canReviewArtifact";

describe("canReviewArtifact", () => {
  test("staff can review any artifact they didn't author", () => {
    expect(
      canReviewArtifact(staffActor("staff-1"), { authorId: "author-1" })
    ).toBe(true);
  });

  test("staff cannot review their own artifact (self-promotion guard)", () => {
    expect(
      canReviewArtifact(staffActor("staff-1"), { authorId: "staff-1" })
    ).toBe(false);
  });

  test("member cannot review (insufficient tier)", () => {
    expect(
      canReviewArtifact(memberActor("m-1"), { authorId: "author-1" })
    ).toBe(false);
  });
});
