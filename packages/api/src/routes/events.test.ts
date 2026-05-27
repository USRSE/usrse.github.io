import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { testApp, makeMemberActor } from "../test/helpers";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

const PUBLIC_EVT = "00000000-0000-0000-0000-00000000ee01";
const COMMUNITY_EVT = "00000000-0000-0000-0000-00000000ee02";
const DRAFT_EVT = "00000000-0000-0000-0000-00000000ee03";
const MEMBER = "00000000-0000-0000-0000-00000000ee04";

describeIfDb("public events routes", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL!);
    // Defensive cleanup in case a prior run left state behind.
    await sql`DELETE FROM events WHERE id IN (${PUBLIC_EVT}::uuid, ${COMMUNITY_EVT}::uuid, ${DRAFT_EVT}::uuid)`;
    await sql`DELETE FROM audit_log WHERE actor_id = ${MEMBER}::uuid`;
    await sql`DELETE FROM users WHERE id = ${MEMBER}::uuid`;
    await sql`
      INSERT INTO users (id, workos_id, member_id, email, role)
      VALUES (${MEMBER}::uuid, ${"w-" + MEMBER}, ${"m-" + MEMBER}, ${MEMBER + "@t"}, 'member'::user_role)
    `;
    await sql`
      INSERT INTO events (id, slug, name, type, start_date, status, revision, scope)
      VALUES
        (${PUBLIC_EVT}::uuid, ${"pub-" + Date.now()}, 'Public Event', 'workshop'::event_type, '2099-06-01'::date, 'published'::artifact_status, 1, 'public'::artifact_scope),
        (${COMMUNITY_EVT}::uuid, ${"com-" + Date.now()}, 'Community Event', 'meetup'::event_type, '2099-06-02'::date, 'published'::artifact_status, 1, 'community'::artifact_scope),
        (${DRAFT_EVT}::uuid, ${"drf-" + Date.now()}, 'Draft Event', 'webinar'::event_type, '2099-06-03'::date, 'draft'::artifact_status, 1, 'public'::artifact_scope)
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM events WHERE id IN (${PUBLIC_EVT}::uuid, ${COMMUNITY_EVT}::uuid, ${DRAFT_EVT}::uuid)`;
    await sql`DELETE FROM audit_log WHERE actor_id = ${MEMBER}::uuid`;
    await sql`DELETE FROM users WHERE id = ${MEMBER}::uuid`;
  });

  test("anonymous: only public published events", async () => {
    const res = await testApp.request("/events");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { events: { id: string; scope: string }[] };
    const ids = body.events.map((e) => e.id);
    expect(ids).toContain(PUBLIC_EVT);
    expect(ids).not.toContain(COMMUNITY_EVT);
    expect(ids).not.toContain(DRAFT_EVT);
  });

  test("authenticated: public + community published events", async () => {
    const res = await testApp.request("/events", {
      headers: { Authorization: makeMemberActor(MEMBER) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { events: { id: string }[] };
    const ids = body.events.map((e) => e.id);
    expect(ids).toContain(PUBLIC_EVT);
    expect(ids).toContain(COMMUNITY_EVT);
    expect(ids).not.toContain(DRAFT_EVT);
  });

  test("GET /events/:slug returns published event detail", async () => {
    const row = (await sql`SELECT slug FROM events WHERE id = ${PUBLIC_EVT}::uuid`) as Array<{ slug: string }>;
    const slug = row[0].slug;
    const res = await testApp.request(`/events/${slug}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { event: { id: string; scope: string } };
    expect(body.event.id).toBe(PUBLIC_EVT);
  });

  test("GET /events/:slug 404 on non-published", async () => {
    const row = (await sql`SELECT slug FROM events WHERE id = ${DRAFT_EVT}::uuid`) as Array<{ slug: string }>;
    const slug = row[0].slug;
    const res = await testApp.request(`/events/${slug}`);
    expect(res.status).toBe(404);
  });
});
