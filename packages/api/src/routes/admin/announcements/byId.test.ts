import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor, makeMemberActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-00000000ab01";
const STAFF = "00000000-0000-0000-0000-00000000ab02";
const ANN = "00000000-0000-0000-0000-00000000ab03";

describeIfDb("/admin/announcements/:id", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM announcements WHERE id = ${ANN}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    for (const [id, role] of [
      [AUTHOR, "member"],
      [STAFF, "staff"],
    ] as const) {
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"w-" + id}, ${"m-" + id}, ${id + "@t"}, ${role}::user_role)
      `;
    }
    await sql`
      INSERT INTO announcements (id, title, body, status, revision, author_id, scope)
      VALUES (
        ${ANN}::uuid, 'Detail Test', 'Body text', 'draft'::artifact_status,
        1, ${AUTHOR}::uuid, 'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${ANN}::uuid`;
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${ANN}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${ANN}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM announcements WHERE id = ${ANN}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
  });

  test("GET 200 for staff", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      headers: { Authorization: makeStaffActor(STAFF) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { announcement: { id: string }; reviews: unknown[]; comments: unknown[] };
    expect(body.announcement.id).toBe(ANN);
  });

  test("GET 200 for the author", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      headers: { Authorization: makeMemberActor(AUTHOR) },
    });
    expect(res.status).toBe(200);
  });

  test("GET 403 for non-author non-staff", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      headers: { Authorization: makeMemberActor("00000000-0000-0000-0000-00000000ab99") },
    });
    expect(res.status).toBe(403);
  });

  test("PATCH 200 staff updates title", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: makeStaffActor(STAFF) },
      body: JSON.stringify({ title: "Updated by staff" }),
    });
    expect(res.status).toBe(200);
    const after = await sql`SELECT title FROM announcements WHERE id = ${ANN}::uuid` as Array<{ title: string }>;
    expect(after[0].title).toBe("Updated by staff");
  });

  test("PATCH 403 non-author non-staff", async () => {
    const res = await testApp.request(`/admin/announcements/${ANN}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: makeMemberActor("00000000-0000-0000-0000-00000000ab99") },
      body: JSON.stringify({ title: "Nope" }),
    });
    expect(res.status).toBe(403);
  });
});
