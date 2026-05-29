import { describe, it, expect, beforeAll } from "vitest";
import { testApp } from "../test/helpers";
import { neon } from "@neondatabase/serverless";

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

describeIfDb("GET /announcements/:slug", () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(() => {
    sql = neon(process.env.DATABASE_URL!);
  });

  async function insertAnnouncement(args: {
    slug: string;
    title: string;
    body: string;
    status: string;
    scope: string;
  }): Promise<string> {
    const rows = await sql/* sql */`
      INSERT INTO announcements (slug, title, body, status, scope)
      VALUES (${args.slug}, ${args.title}, ${args.body}, ${args.status}::artifact_status, ${args.scope}::artifact_scope)
      RETURNING id
    `;
    return rows[0].id as string;
  }

  it("returns a published, public announcement to an anonymous viewer", async () => {
    const slug = `pub-${Date.now()}`;
    await insertAnnouncement({
      slug,
      title: "Public announcement",
      body: "Body text",
      status: "published",
      scope: "public",
    });

    const res = await testApp.request(`/announcements/${slug}`);
    expect(res.status).toBe(200);
    const json = await res.json() as { ok: boolean; announcement: { slug: string; title: string } };
    expect(json.ok).toBe(true);
    expect(json.announcement.slug).toBe(slug);
    expect(json.announcement.title).toBe("Public announcement");
  });

  it("returns 404 for a draft", async () => {
    const slug = `draft-${Date.now()}`;
    await insertAnnouncement({
      slug,
      title: "Draft",
      body: "Body",
      status: "draft",
      scope: "public",
    });
    const res = await testApp.request(`/announcements/${slug}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 to anonymous when scope is community", async () => {
    const slug = `comm-${Date.now()}`;
    await insertAnnouncement({
      slug,
      title: "Community",
      body: "Body",
      status: "published",
      scope: "community",
    });
    const res = await testApp.request(`/announcements/${slug}`);
    expect(res.status).toBe(404);
  });
});
