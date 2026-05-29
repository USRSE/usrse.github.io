import { neon } from "@neondatabase/serverless";
import app from "../index";

/**
 * Test helpers for integration tests that touch the real DB.
 *
 * Auth: actors are stubbed via Authorization header values of the form
 * `test:<role>:<userId>`. Requires TEST_BYPASS_AUTH=1 in the env;
 * the middleware bypass in actorContext.ts and auth.ts will recognize
 * these and synthesize an actor directly.
 *
 * Seeding: the artifact INSERTs deliberately omit `author_id`. The FK
 * is ON DELETE SET NULL on a nullable column, so leaving it NULL keeps
 * tests independent from seeded users. (Option B from the Task 20 plan.)
 */

/**
 * Wraps `app.request()` and supplies a Bindings object derived from
 * `process.env` (Hono's Workers entrypoint receives env per-request,
 * so under Node we have to thread it through manually). Always sets
 * TEST_BYPASS_AUTH=1 so the middleware bypass kicks in regardless of
 * what was on the parent shell.
 */
export const testApp = {
  request(input: string, init?: RequestInit): Promise<Response> {
    const env = {
      ...process.env,
      TEST_BYPASS_AUTH: "1",
    };
    return Promise.resolve(app.request(input, init, env));
  },
};

export function makeStaffActor(userId: string): string {
  return `test:staff:${userId}`;
}

export function makeMemberActor(userId: string): string {
  return `test:member:${userId}`;
}

export function makeSuperAdminActor(userId: string): string {
  return `test:super_admin:${userId}`;
}

interface SeedInput {
  events?: Array<{
    id: string;
    status: string;
    revision: number;
    authorId: string;
    name: string;
    scope: string;
    startDate: string;
    endDate?: string;
  }>;
  announcements?: Array<{
    id: string;
    status: string;
    revision: number;
    authorId: string;
    slug: string;
    title: string;
    body: string;
    expiresAt?: string;
  }>;
  forms?: Array<{
    id: string;
    status: string;
    revision: number;
    authorId: string;
    slug: string;
    title: string;
    schema: unknown;
  }>;
}

export async function seedArtifacts(
  input: SeedInput
): Promise<() => Promise<void>> {
  const sql = neon(process.env.DATABASE_URL!);
  const insertedEventIds = (input.events ?? []).map((e) => e.id);
  const insertedAnnouncementIds = (input.announcements ?? []).map((a) => a.id);
  const insertedFormIds = (input.forms ?? []).map((f) => f.id);

  for (const e of input.events ?? []) {
    // author_id deliberately omitted (see file header).
    await sql`
      INSERT INTO events (id, slug, name, type, start_date, end_date, status, revision, scope)
      VALUES (
        ${e.id}::uuid, ${e.id + "-slug"}, ${e.name}, 'other'::event_type,
        ${e.startDate}::date, ${e.endDate ?? null}::date,
        ${e.status}::artifact_status, ${e.revision}, ${e.scope}::artifact_scope
      )
    `;
  }
  for (const a of input.announcements ?? []) {
    await sql`
      INSERT INTO announcements (id, slug, status, revision, title, body, expires_at)
      VALUES (
        ${a.id}::uuid, ${a.slug}, ${a.status}::artifact_status, ${a.revision},
        ${a.title}, ${a.body}, ${a.expiresAt ?? null}
      )
    `;
  }
  for (const f of input.forms ?? []) {
    await sql`
      INSERT INTO forms (id, slug, title, schema, status, revision)
      VALUES (
        ${f.id}::uuid, ${f.slug}, ${f.title}, ${JSON.stringify(f.schema)}::jsonb,
        ${f.status}::artifact_status, ${f.revision}
      )
    `;
  }

  return async () => {
    if (insertedEventIds.length) {
      await sql`DELETE FROM events WHERE id = ANY(${insertedEventIds}::uuid[])`;
    }
    if (insertedAnnouncementIds.length) {
      await sql`DELETE FROM announcements WHERE id = ANY(${insertedAnnouncementIds}::uuid[])`;
    }
    if (insertedFormIds.length) {
      await sql`DELETE FROM forms WHERE id = ANY(${insertedFormIds}::uuid[])`;
    }
  };
}
