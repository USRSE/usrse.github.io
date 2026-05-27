import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const TEST_AUTHOR = "00000000-0000-0000-0000-00000000aa01";
const TEST_STAFF = "00000000-0000-0000-0000-00000000aa02";

describeIfDb("POST/GET /admin/announcements", () => {
  let sql: ReturnType<typeof neon>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    // Defensive cleanup from prior runs
    await sql`DELETE FROM audit_log WHERE actor_id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    for (const [id, role] of [
      [TEST_AUTHOR, "member"],
      [TEST_STAFF, "staff"],
    ] as const) {
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"wos-" + id}, ${"mem-" + id}, ${id + "@test"}, ${role}::user_role)
      `;
    }
  });

  afterAll(async () => {
    if (createdIds.length) {
      await sql`DELETE FROM announcements WHERE id = ANY(${createdIds}::uuid[])`;
    }
    await sql`DELETE FROM audit_log WHERE actor_id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
  });

  test("requires actor context (rejects unauthenticated)", async () => {
    const res = await testApp.request("/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x", body: "y" }),
    });
    expect(res.status).toBe(401);
  });

  test("any signed-in actor can create a draft", async () => {
    const res = await testApp.request("/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor(TEST_AUTHOR),
      },
      body: JSON.stringify({
        title: "Member-authored announcement",
        body: "Body text here",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      ok: true;
      announcement: { id: string; status: string; scope: string };
    };
    expect(body.announcement.status).toBe("draft");
    expect(body.announcement.scope).toBe("community");
    createdIds.push(body.announcement.id);
  });

  test("staff with explicit scope='public' accepted", async () => {
    const res = await testApp.request("/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({
        title: "Public announcement",
        body: "Visible to all",
        scope: "public",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      ok: true;
      announcement: { id: string; scope: string };
    };
    expect(body.announcement.scope).toBe("public");
    createdIds.push(body.announcement.id);
  });

  test("rejects invalid input (missing body)", async () => {
    const res = await testApp.request("/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({ title: "no body" }),
    });
    expect(res.status).toBe(400);
  });

  test("GET lists announcements with status filter", async () => {
    const res = await testApp.request("/admin/announcements?status=draft", {
      headers: { Authorization: makeStaffActor(TEST_STAFF) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: Array<{ status: string }> };
    expect(body.rows.every((r) => r.status === "draft")).toBe(true);
  });
});
