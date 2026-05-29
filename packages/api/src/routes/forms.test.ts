import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp } from "../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const AUTHOR = "00000000-0000-0000-0000-00000000bf01";
const MEMBER = "00000000-0000-0000-0000-00000000bf02";
const FORM_PUBLIC = "00000000-0000-0000-0000-00000000bf11";
const FORM_COMMUNITY = "00000000-0000-0000-0000-00000000bf12";
const FORM_DRAFT = "00000000-0000-0000-0000-00000000bf13";
const FORM_CLOSED = "00000000-0000-0000-0000-00000000bf14";

const SLUG_PUBLIC = "public-test-" + Date.now();
const SLUG_COMMUNITY = "community-test-" + Date.now();
const SLUG_DRAFT = "draft-test-" + Date.now();
const SLUG_CLOSED = "closed-test-" + Date.now();

const schema = {
  fields: [
    { id: "name", type: "text", label: "Name", required: true },
    { id: "comments", type: "textarea", label: "Comments", required: false },
  ],
};

describeIfDb("public /forms routes", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    const ids = [FORM_PUBLIC, FORM_COMMUNITY, FORM_DRAFT, FORM_CLOSED];
    await sql`DELETE FROM form_submissions WHERE form_id = ANY(${ids}::uuid[])`;
    await sql`DELETE FROM forms WHERE id = ANY(${ids}::uuid[])`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${MEMBER}::uuid)`;

    for (const [id, role] of [
      [AUTHOR, "member"],
      [MEMBER, "member"],
    ] as const) {
      await sql`
        INSERT INTO users (id, workos_id, member_id, email, role)
        VALUES (${id}::uuid, ${"w-" + id}, ${"m-" + id}, ${id + "@t"}, ${role}::user_role)
      `;
    }

    // Published + public — open to anonymous
    await sql`
      INSERT INTO forms (id, title, slug, schema, status, revision, author_id, scope)
      VALUES (
        ${FORM_PUBLIC}::uuid,
        'Public Form',
        ${SLUG_PUBLIC},
        ${JSON.stringify(schema)}::jsonb,
        'published'::artifact_status,
        1,
        ${AUTHOR}::uuid,
        'public'::artifact_scope
      )
    `;
    // Published + community — signed-in only
    await sql`
      INSERT INTO forms (id, title, slug, schema, status, revision, author_id, scope)
      VALUES (
        ${FORM_COMMUNITY}::uuid,
        'Community Form',
        ${SLUG_COMMUNITY},
        ${JSON.stringify(schema)}::jsonb,
        'published'::artifact_status,
        1,
        ${AUTHOR}::uuid,
        'community'::artifact_scope
      )
    `;
    // Draft + public — invisible
    await sql`
      INSERT INTO forms (id, title, slug, schema, status, revision, author_id, scope)
      VALUES (
        ${FORM_DRAFT}::uuid,
        'Draft Form',
        ${SLUG_DRAFT},
        ${JSON.stringify(schema)}::jsonb,
        'draft'::artifact_status,
        1,
        ${AUTHOR}::uuid,
        'public'::artifact_scope
      )
    `;
    // Published + public but closed (accepts_submissions=false)
    await sql`
      INSERT INTO forms (id, title, slug, schema, status, revision, author_id, scope, accepts_submissions)
      VALUES (
        ${FORM_CLOSED}::uuid,
        'Closed Form',
        ${SLUG_CLOSED},
        ${JSON.stringify(schema)}::jsonb,
        'published'::artifact_status,
        1,
        ${AUTHOR}::uuid,
        'public'::artifact_scope,
        FALSE
      )
    `;
    await sql`UPDATE forms SET accepts_submissions = FALSE WHERE id = ${FORM_CLOSED}::uuid`;
  });

  afterAll(async () => {
    const ids = [FORM_PUBLIC, FORM_COMMUNITY, FORM_DRAFT, FORM_CLOSED];
    await sql`DELETE FROM form_submissions WHERE form_id = ANY(${ids}::uuid[])`;
    await sql`DELETE FROM forms WHERE id = ANY(${ids}::uuid[])`;
    await sql`DELETE FROM users WHERE id IN (${AUTHOR}::uuid, ${MEMBER}::uuid)`;
  });

  test("GET 200 returns public published form to anonymous", async () => {
    const res = await testApp.request(`/forms/${SLUG_PUBLIC}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; form: { slug: string; schema: unknown } };
    expect(body.ok).toBe(true);
    expect(body.form.slug).toBe(SLUG_PUBLIC);
    expect(body.form.schema).toBeDefined();
  });

  test("GET 404 for draft form", async () => {
    const res = await testApp.request(`/forms/${SLUG_DRAFT}`);
    expect(res.status).toBe(404);
  });

  test("GET 404 for community-scoped form when anonymous", async () => {
    const res = await testApp.request(`/forms/${SLUG_COMMUNITY}`);
    expect(res.status).toBe(404);
  });

  test("POST 201 valid submission on public form (anonymous)", async () => {
    const res = await testApp.request(`/forms/${SLUG_PUBLIC}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Anon Visitor", comments: "Hi!" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; submissionId: string };
    expect(body.ok).toBe(true);
    expect(body.submissionId).toBeTruthy();
  });

  test("POST 400 missing required field", async () => {
    const res = await testApp.request(`/forms/${SLUG_PUBLIC}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: "no name supplied" }),
    });
    expect(res.status).toBe(400);
  });

  test("POST 401 community-scoped form when anonymous", async () => {
    const res = await testApp.request(`/forms/${SLUG_COMMUNITY}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Anon" }),
    });
    expect(res.status).toBe(401);
  });

  test("POST 410 when form is closed (accepts_submissions=false)", async () => {
    const res = await testApp.request(`/forms/${SLUG_CLOSED}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Anon" }),
    });
    expect(res.status).toBe(410);
  });
});
