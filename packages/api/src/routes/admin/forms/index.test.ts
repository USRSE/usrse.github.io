import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeStaffActor } from "../../../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const TEST_AUTHOR = "00000000-0000-0000-0000-00000000f001";
const TEST_STAFF = "00000000-0000-0000-0000-00000000f002";

const validSchema = {
  fields: [
    { id: "name", type: "text", label: "Your name", required: true },
    { id: "email", type: "email", label: "Email", required: true },
  ],
};

describeIfDb("POST/GET /admin/forms", () => {
  let sql: ReturnType<typeof neon>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM audit_log WHERE actor_id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    for (const [id, role] of [
      [TEST_AUTHOR, "member"],
      [TEST_STAFF, "staff"],
    ] as const) {
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"wos-" + id}, ${"mem-" + id}, ${id + "@test"}, ${role}::user_role)
      `;
    }
  });

  afterAll(async () => {
    if (createdIds.length) {
      await sql`DELETE FROM forms WHERE id = ANY(${createdIds}::uuid[])`;
    }
    await sql`DELETE FROM audit_log WHERE actor_id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
    await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR}::uuid, ${TEST_STAFF}::uuid)`;
  });

  test("requires actor context (rejects unauthenticated)", async () => {
    const res = await testApp.request("/admin/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "x",
        slug: "x",
        schema: validSchema,
      }),
    });
    expect(res.status).toBe(401);
  });

  test("staff creates form with valid schema returns draft", async () => {
    const res = await testApp.request("/admin/forms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({
        title: "Staff form",
        slug: `staff-form-${Date.now()}`,
        description: "A test form",
        schema: validSchema,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      ok: true;
      form: { id: string; status: string; scope: string };
    };
    expect(body.form.status).toBe("draft");
    expect(body.form.scope).toBe("community");
    createdIds.push(body.form.id);
  });

  test("rejects schema with unknown field type", async () => {
    const res = await testApp.request("/admin/forms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({
        title: "Bad schema",
        slug: `bad-schema-${Date.now()}`,
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

  test("rejects entityType set without entityId", async () => {
    const res = await testApp.request("/admin/forms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeStaffActor(TEST_STAFF),
      },
      body: JSON.stringify({
        title: "Partial entity",
        slug: `partial-entity-${Date.now()}`,
        schema: validSchema,
        entityType: "event",
      }),
    });
    expect(res.status).toBe(400);
  });

  test("GET lists forms with status filter", async () => {
    const res = await testApp.request("/admin/forms?status=draft", {
      headers: { Authorization: makeStaffActor(TEST_STAFF) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: Array<{ status: string }> };
    expect(body.rows.every((r) => r.status === "draft")).toBe(true);
  });
});
