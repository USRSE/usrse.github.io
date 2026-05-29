import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-00000000f031";
const STAFF = "00000000-0000-0000-0000-00000000f032";
const FORM = "00000000-0000-0000-0000-00000000f033";

const validSchema = {
  fields: [
    { id: "name", type: "text", label: "Your name", required: true },
  ],
};

describeIfDb("/admin/forms/:id/comments", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${FORM}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM forms WHERE id = ${FORM}::uuid`;
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
      INSERT INTO forms (id, title, slug, schema, status, revision, author_id, scope)
      VALUES (
        ${FORM}::uuid,
        'Comments Test',
        ${"comments-test-" + Date.now()},
        ${JSON.stringify(validSchema)}::jsonb,
        'in_review'::artifact_status,
        1,
        ${AUTHOR}::uuid,
        'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${FORM}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM forms WHERE id = ${FORM}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
  });

  test("staff posts a comment", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(STAFF),
      },
      body: JSON.stringify({ body: "Looks good." }),
    });
    expect(res.status).toBe(201);
  });

  test("author posts a comment", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor(AUTHOR),
      },
      body: JSON.stringify({ body: "Thanks, updating." }),
    });
    expect(res.status).toBe(201);
  });

  test("non-author non-staff blocked", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor("00000000-0000-0000-0000-00000000f039"),
      },
      body: JSON.stringify({ body: "should be blocked" }),
    });
    expect(res.status).toBe(403);
  });

  test("empty body rejected", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(STAFF),
      },
      body: JSON.stringify({ body: "   " }),
    });
    expect(res.status).toBe(400);
  });
});
