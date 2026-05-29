import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-00000000f011";
const STAFF = "00000000-0000-0000-0000-00000000f012";
const FORM = "00000000-0000-0000-0000-00000000f013";

const validSchema = {
  fields: [
    { id: "name", type: "text", label: "Your name", required: true },
    { id: "email", type: "email", label: "Email", required: true },
  ],
};

describeIfDb("/admin/forms/:id", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM form_submissions WHERE form_id = ${FORM}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM audit_log WHERE target_id = ${FORM}::uuid`;
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
        'Detail Test',
        ${"detail-test-" + Date.now()},
        ${JSON.stringify(validSchema)}::jsonb,
        'draft'::artifact_status,
        1,
        ${AUTHOR}::uuid,
        'community'::artifact_scope
      )
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM form_submissions WHERE form_id = ${FORM}::uuid`;
    await sql`DELETE FROM artifact_comments WHERE entity_id = ${FORM}::uuid`;
    await sql`DELETE FROM artifact_reviews WHERE entity_id = ${FORM}::uuid`;
    await sql`DELETE FROM audit_log WHERE target_id = ${FORM}::uuid`;
    await sql`DELETE FROM audit_log WHERE actor_id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
    await sql`DELETE FROM forms WHERE id = ${FORM}::uuid`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${STAFF}::uuid)`;
  });

  test("GET 200 for staff", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}`, {
      headers: { Authorization: makeStaffActor(STAFF) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      form: { id: string };
      reviews: unknown[];
      comments: unknown[];
      submissionCount: number;
    };
    expect(body.form.id).toBe(FORM);
    expect(body.submissionCount).toBe(0);
  });

  test("GET 200 for the author", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}`, {
      headers: { Authorization: makeMemberActor(AUTHOR) },
    });
    expect(res.status).toBe(200);
  });

  test("GET 403 for non-author non-staff", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}`, {
      headers: {
        Authorization: makeMemberActor("00000000-0000-0000-0000-00000000f019"),
      },
    });
    expect(res.status).toBe(403);
  });

  test("PATCH 200 staff updates title", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(STAFF),
      },
      body: JSON.stringify({ title: "Updated by staff" }),
    });
    expect(res.status).toBe(200);
    const after = (await sql`SELECT title FROM forms WHERE id = ${FORM}::uuid`) as Array<{
      title: string;
    }>;
    expect(after[0].title).toBe("Updated by staff");
  });

  test("PATCH 403 non-author non-staff", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeMemberActor("00000000-0000-0000-0000-00000000f019"),
      },
      body: JSON.stringify({ title: "Nope" }),
    });
    expect(res.status).toBe(403);
  });

  test("PATCH 400 when schema becomes invalid", async () => {
    const res = await testApp.request(`/admin/forms/${FORM}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(STAFF),
      },
      body: JSON.stringify({
        schema: {
          fields: [
            { id: "x", type: "bogus_type", label: "X", required: false },
          ],
        },
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("invalid_schema");
  });
});
