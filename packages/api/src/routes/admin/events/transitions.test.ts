import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-000000000e01";
const REV1 = "00000000-0000-0000-0000-000000000e02";
const REV2 = "00000000-0000-0000-0000-000000000e03";
const EVT = "00000000-0000-0000-0000-000000000e04";

type Sql = NeonQueryFunction<false, false>;

describeIfDb("POST /admin/events/:id/transitions", () => {
  let sql: Sql;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!) as Sql;
    // Clean up any leftover review/audit rows from a previous failed run
    // before deleting users (audit_log.actor_id FK).
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${EVT}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
    for (const [id, role] of [
      [AUTHOR, "member"],
      [REV1, "staff"],
      [REV2, "staff"],
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
        ${EVT}::uuid, ${'trans-' + Date.now()}, 'Transition Test', 'workshop'::event_type,
        '2099-01-01'::date, 'draft'::artifact_status, 1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${EVT}::uuid`;
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
  });

  test("author submits → in_review", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor(AUTHOR) },
      body: JSON.stringify({ action: "submit_for_review" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT status FROM events WHERE id = ${EVT}::uuid`;
    expect(after[0].status).toBe("in_review");
  });

  test("reviewer 1 approves → still in_review", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(REV1) },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT status FROM events WHERE id = ${EVT}::uuid`;
    expect(after[0].status).toBe("in_review");
  });

  test("reviewer 2 approves → published", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(REV2) },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT status FROM events WHERE id = ${EVT}::uuid`;
    expect(after[0].status).toBe("published");
  });

  test("members cannot trigger review actions on someone else's event", async () => {
    const res = await testApp.request(`/admin/events/${EVT}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-000000000e99") },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(403);
  });
});
