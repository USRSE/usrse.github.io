import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-00000000af01";
const STAFF = "00000000-0000-0000-0000-00000000af02";
const OUTSIDER = "00000000-0000-0000-0000-00000000af03";
const FORM = "00000000-0000-0000-0000-00000000af04";
const SUB1 = "00000000-0000-0000-0000-00000000af11";
const SUB2 = "00000000-0000-0000-0000-00000000af12";
const SUB3 = "00000000-0000-0000-0000-00000000af13";
const MISSING_FORM = "00000000-0000-0000-0000-00000000af99";

const schema = {
  fields: [
    { id: "name", type: "text", label: "Name", required: true },
    { id: "color", type: "text", label: "Favorite color", required: false },
  ],
};

describeIfDb("/admin/forms/:id/submissions", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM form_submissions WHERE form_id = ${FORM}::uuid`;
    await sql`DELETE FROM forms WHERE id = ${FORM}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid, ${OUTSIDER}::uuid)`;

    for (const [id, role] of [
      [AUTHOR, "member"],
      [STAFF, "staff"],
      [OUTSIDER, "member"],
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
        'Submissions Test',
        ${"submissions-test-" + Date.now()},
        ${JSON.stringify(schema)}::jsonb,
        'published'::artifact_status,
        1,
        ${AUTHOR}::uuid,
        'public'::artifact_scope
      )
    `;

    await sql`
      INSERT INTO form_submissions (id, form_id, form_revision, submitter_user_id, payload)
      VALUES (
        ${SUB1}::uuid, ${FORM}::uuid, 1, ${AUTHOR}::uuid,
        ${JSON.stringify({ name: "Alice", color: "red" })}::jsonb
      )
    `;
    await sql`
      INSERT INTO form_submissions (id, form_id, form_revision, submitter_user_id, payload)
      VALUES (
        ${SUB2}::uuid, ${FORM}::uuid, 1, NULL,
        ${JSON.stringify({ name: "Bob, the Builder", color: "blue" })}::jsonb
      )
    `;
    await sql`
      INSERT INTO form_submissions (id, form_id, form_revision, submitter_user_id, payload)
      VALUES (
        ${SUB3}::uuid, ${FORM}::uuid, 1, NULL,
        ${JSON.stringify({ name: "Carol" })}::jsonb
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM form_submissions WHERE form_id = ${FORM}::uuid`;
    await sql`DELETE FROM forms WHERE id = ${FORM}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid, ${OUTSIDER}::uuid)`;
  });

  test("staff GET returns paginated JSON list", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/submissions`, {
      headers: { Authorization: makeStaffActor(STAFF) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; rows: unknown[] };
    expect(body.ok).toBe(true);
    expect(body.rows.length).toBe(3);
  });

  test("CSV export returns text/csv with field-id columns", async () => {
    const res = await testApp.request(
      `/admin/forms/${FORM}/submissions?format=csv`,
      { headers: { Authorization: makeStaffActor(STAFF) } }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/text\/csv/);
    const text = await res.text();
    const [header, ...rest] = text.split("\n");
    expect(header).toBe("submitted_at,submitter_user_id,form_revision,name,color");
    expect(rest.length).toBe(3);
    expect(text).toContain("Alice");
    expect(text).toContain("red");
    // Comma-bearing value must be quoted
    expect(text).toContain('"Bob, the Builder"');
  });

  test("non-author non-staff is forbidden", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}/submissions`, {
      headers: { Authorization: makeMemberActor(OUTSIDER) },
    });
    expect(res.status).toBe(403);
  });

  test("unknown form id returns 404", async () => {
    const res = await testApp.request(
      `/admin/forms/${MISSING_FORM}/submissions`,
      { headers: { Authorization: makeStaffActor(STAFF) } }
    );
    expect(res.status).toBe(404);
  });
});
