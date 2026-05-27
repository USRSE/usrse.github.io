import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const TEST_AUTHOR = "00000000-0000-0000-0000-000000000c01";
const TEST_STAFF = "00000000-0000-0000-0000-000000000c02";

describeIfDb("POST /admin/events", () => {
  let sql: ReturnType<typeof neon>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    for (const [id, role] of [
      [TEST_AUTHOR, "member"],
      [TEST_STAFF, "staff"],
    ] as const) {
      // audit_log.actor_id references users; clear before deleting the user.
      await sql`DELETE FROM audit_log WHERE actor_id = ${id}::uuid`;
      await sql`DELETE FROM users WHERE id = ${id}::uuid`;
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"wos-" + id}, ${"mem-" + id}, ${id + "@test"}, ${role}::user_role)
      `;
    }
  });

  afterAll(async () => {
    if (createdIds.length) {
      await sql`DELETE FROM events WHERE id = ANY(${createdIds}::uuid[])`;
    }
    await sql`DELETE FROM audit_log WHERE actor_id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
  });

  test("requires actor context (rejects unauthenticated)", async () => {
    const res = await testApp.request("/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", type: "workshop", startDate: "2099-01-01" }),
    });
    expect(res.status).toBe(401);
  });

  test("any signed-in actor can create a draft", async () => {
    const res = await testApp.request("/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor(TEST_AUTHOR),
      },
      body: JSON.stringify({
        name: "Member-submitted draft",
        type: "meetup",
        startDate: "2099-06-01",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: true; event: { id: string; status: string; scope: string } };
    expect(body.event.status).toBe("draft");
    expect(body.event.scope).toBe("community");
    createdIds.push(body.event.id);
  });

  test("rejects invalid input", async () => {
    const res = await testApp.request("/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });

  test("auto-generates slug from name", async () => {
    const res = await testApp.request("/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({
        name: "Awesome Workshop 2099!",
        type: "workshop",
        startDate: "2099-09-15",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: true; event: { id: string; slug: string } };
    expect(body.event.slug).toMatch(/^awesome-workshop-2099-[a-z0-9]{4,}$/);
    createdIds.push(body.event.id);
  });
});
