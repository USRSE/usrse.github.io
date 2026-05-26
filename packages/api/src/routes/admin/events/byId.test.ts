import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-000000000d01";
const STAFF = "00000000-0000-0000-0000-000000000d02";
const EVT = "00000000-0000-0000-0000-000000000d03";

// Narrow `sql` to the same generic shape that `neon(url)` picks at top-level
// so result rows index as `Record<string, any>` and not the union type.
type Sql = NeonQueryFunction<false, false>;

describeIfDb("/admin/events/:id", () => {
  let sql: Sql;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!) as Sql;
    for (const [id, role] of [
      [AUTHOR, "member"],
      [STAFF, "staff"],
    ] as const) {
      // audit_log.actor_id references users; clear before deleting the user.
      await sql`DELETE FROM audit_log WHERE actor_id = ${id}::uuid`;
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
        ${EVT}::uuid, ${'detail-test-' + Date.now()}, 'Detail Test', 'workshop'::event_type,
        '2099-01-01'::date, 'draft'::artifact_status, 1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${EVT}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${EVT}::uuid`;
    await sql`DELETE FROM events WHERE id = ${EVT}::uuid`;
    // PATCH handler writes audit rows actor=STAFF; clear before user delete.
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
  });

  test("GET 200 returns event detail for staff", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      headers: { Authorization: makeStaffActor(STAFF) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: true; event: { id: string; name: string }; reviews: unknown[]; comments: unknown[] };
    expect(body.event.id).toBe(EVT);
    expect(Array.isArray(body.reviews)).toBe(true);
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test("GET 200 returns event detail for the author", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      headers: { Authorization: makeMemberActor(AUTHOR) },
    });
    expect(res.status).toBe(200);
  });

  test("GET 403 for non-author non-staff", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      headers: { Authorization: makeMemberActor("00000000-0000-0000-0000-000000000d99") },
    });
    expect(res.status).toBe(403);
  });

  test("PATCH 200 staff can update any field on any state", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(STAFF) },
      body: JSON.stringify({ name: "Updated by staff" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT name FROM events WHERE id = ${EVT}::uuid`;
    expect(after[0].name).toBe("Updated by staff");
  });

  test("PATCH 403 non-author non-staff", async () => {
    const res = await testApp.request(`/admin/events/${EVT}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-000000000d99") },
      body: JSON.stringify({ name: "Nope" }),
    });
    expect(res.status).toBe(403);
  });
});
