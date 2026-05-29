import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-00000000f021";
const REV1 = "00000000-0000-0000-0000-00000000f022";
const REV2 = "00000000-0000-0000-0000-00000000f023";
const FORM = "00000000-0000-0000-0000-00000000f024";

const validSchema = {
  fields: [
    { id: "name", type: "text", label: "Your name", required: true },
  ],
};

describeIfDb("POST /admin/forms/:id/transitions", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${FORM}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
    await sql`DELETE FROM audit_log WHERE target_id = ${FORM}::uuid`;
    await sql`DELETE FROM forms WHERE id = ${FORM}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
    for (const [id, role] of [
      [AUTHOR, "member"],
      [REV1, "staff"],
      [REV2, "staff"],
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
        'Transition Test',
        ${"transition-test-" + Date.now()},
        ${JSON.stringify(validSchema)}::jsonb,
        'draft'::artifact_status,
        1,
        ${AUTHOR}::uuid,
        'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${FORM}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${FORM}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
    await sql`DELETE FROM forms WHERE id = ${FORM}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${REV1}::uuid, ${REV2}::uuid)`;
  });

  test("author submits → in_review", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/transitions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor(AUTHOR),
      },
      body: JSON.stringify({ action: "submit_for_review" }),
    });
    expect(res.status).toBe(200);
    const after = (await sql`SELECT status FROM forms WHERE id = ${FORM}::uuid`) as Array<{
      status: string;
    }>;
    expect(after[0].status).toBe("in_review");
  });

  test("reviewer 1 approves → still in_review", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/transitions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(REV1),
      },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const after = (await sql`SELECT status FROM forms WHERE id = ${FORM}::uuid`) as Array<{
      status: string;
    }>;
    expect(after[0].status).toBe("in_review");
  });

  test("reviewer 2 approves → published", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/transitions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(REV2),
      },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const after = (await sql`SELECT status FROM forms WHERE id = ${FORM}::uuid`) as Array<{
      status: string;
    }>;
    expect(after[0].status).toBe("published");
  });

  test("non-staff non-author cannot approve", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/transitions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor("00000000-0000-0000-0000-00000000f029"),
      },
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(403);
  });
});
