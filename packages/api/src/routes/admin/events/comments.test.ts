import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-000000000f01";
const STAFF = "00000000-0000-0000-0000-000000000f02";
const EVT = "00000000-0000-0000-0000-000000000f03";

describeIfDb("/admin/events/:id/comments", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    for (const [id, role] of [
      [AUTHOR, "member"], [STAFF, "staff"],
    ] as const) {
      await sql`DELETE FROM users WHERE id = ${id}::uuid`;
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"w-" + id}, ${"m-" + id}, ${id + "@t"}, ${role}::user_role)
      `;
    }
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    await sql`
      INSERT INTO events (id, slug, name, type, start_date, status, revision, author_id, scope)
      VALUES (
        ${EVT}::uuid, ${'cmt-' + Date.now()}, 'Comments Test', 'workshop'::event_type,
        '2099-01-01'::date, 'in_review'::artifact_status, 1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
  });

  test("staff posts a comment", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(STAFF) },
      body: JSON.stringify({ body: "Looks good but title needs work." }),
    });
    expect(res.status).toBe(201);
  });

  test("author posts a comment", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor(AUTHOR) },
      body: JSON.stringify({ body: "Updated, please re-review." }),
    });
    expect(res.status).toBe(201);
  });

  test("non-author non-staff cannot comment", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-000000000f99") },
      body: JSON.stringify({ body: "should be blocked" }),
    });
    expect(res.status).toBe(403);
  });

  test("empty body rejected", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(STAFF) },
      body: JSON.stringify({ body: "   " }),
    });
    expect(res.status).toBe(400);
  });
});
