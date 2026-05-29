import { describe, expect, test, beforeAll, afterAll } from "vitest";
import { testApp, makeStaffActor, makeMemberActor, seedArtifacts } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

let cleanup: (() => Promise<void>) | undefined;

beforeAll(async () => {
  if (!HAS_DB) return;
  cleanup = await seedArtifacts({
    events: [
      { id: "00000000-0000-0000-0000-0000000000a1", status: "in_review", revision: 1, authorId: "00000000-0000-0000-0000-0000000000b1", name: "Test Event", scope: "community", startDate: "2026-06-01" },
      { id: "00000000-0000-0000-0000-0000000000a2", status: "published", revision: 1, authorId: "00000000-0000-0000-0000-0000000000b1", name: "Already Published", scope: "public", startDate: "2026-07-01" },
    ],
    announcements: [
      { id: "00000000-0000-0000-0000-0000000000a3", status: "in_review", revision: 1, authorId: "00000000-0000-0000-0000-0000000000b1", slug: "heads-up-test", title: "Heads up", body: "..." },
    ],
    forms: [
      { id: "00000000-0000-0000-0000-0000000000a4", status: "draft", revision: 1, authorId: "00000000-0000-0000-0000-0000000000b1", slug: "test-form", title: "Test Form", schema: {} },
    ],
  });
});

afterAll(async () => {
  if (cleanup) await cleanup();
});

describeIfDb("GET /admin/queue", () => {
  test("requires staff actor", async () => {
    const res = await testApp.request("/admin/queue", {
      headers: { Authorization: makeMemberActor("00000000-0000-0000-0000-0000000000b2") },
    });
    expect(res.status).toBe(403);
  });

  test("returns in_review artifacts across all three types", async () => {
    const res = await testApp.request("/admin/queue", {
      headers: { Authorization: makeStaffActor("00000000-0000-0000-0000-0000000000b3") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: Array<{ id: string; entityType: string; status: string }> };
    const seededInReview = body.rows.filter((r) =>
      [
        "00000000-0000-0000-0000-0000000000a1",
        "00000000-0000-0000-0000-0000000000a3",
      ].includes(r.id)
    );
    expect(seededInReview).toHaveLength(2);
  });

  test("supports filtering by entity type", async () => {
    const res = await testApp.request("/admin/queue?type=event", {
      headers: { Authorization: makeStaffActor("00000000-0000-0000-0000-0000000000b3") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: Array<{ entityType: string }> };
    expect(body.rows.every((r) => r.entityType === "event")).toBe(true);
  });
});
