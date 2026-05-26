import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor } from "../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const MEMBER = "00000000-0000-0000-0000-00000000fa01";

describeIfDb("POST /events/submit", () => {
  let sql: ReturnType<typeof neon>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM audit_log WHERE actor_id = ${MEMBER}::uuid`;
    await sql`DELETE FROM users WHERE id = ${MEMBER}::uuid`;
    await sql`
      INSERT INTO users (id, workos_id, member_id, email, role)
      VALUES (${MEMBER}::uuid, ${"w-" + MEMBER}, ${"m-" + MEMBER}, ${MEMBER + "@t"}, 'member'::user_role)
    `;
  });

  afterAll(async () => {
    if (createdIds.length) {
      await sql`DELETE FROM artifact_reviews WHERE entity_id = ANY(${createdIds}::uuid[])`;
      await sql`DELETE FROM audit_log WHERE target_id = ANY(${createdIds}::uuid[])`;
      await sql`DELETE FROM events WHERE id = ANY(${createdIds}::uuid[])`;
    }
    await sql`DELETE FROM audit_log WHERE actor_id = ${MEMBER}::uuid`;
    await sql`DELETE FROM users WHERE id = ${MEMBER}::uuid`;
  });

  test("requires auth (401 unauthenticated)", async () => {
    const res = await testApp.request("/events/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", type: "workshop", startDate: "2099-01-01" }),
    });
    expect(res.status).toBe(401);
  });

  test("auth'd member submits → lands as in_review with author=member", async () => {
    const res = await testApp.request("/events/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor(MEMBER),
      },
      body: JSON.stringify({
        name: "Member-submitted from another community",
        type: "conference",
        startDate: "2099-10-15",
        externalUrl: "https://example.org/conf",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      ok: true;
      event: { id: string; status: string; authorId: string };
    };
    expect(body.event.status).toBe("in_review");
    expect(body.event.authorId).toBe(MEMBER);
    createdIds.push(body.event.id);
  });
});
