import { beforeAll, afterAll, describe, expect, test } from "vitest";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../db/schema";
import { applyTransition } from "./applyTransition";
import { drizzleLifecycleDb } from "./drizzleAdapter";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const TEST_EVENT_ID = "00000000-0000-0000-0000-000000000a01";
const TEST_AUTHOR_ID = "00000000-0000-0000-0000-000000000a02";
const TEST_REVIEWER_1 = "00000000-0000-0000-0000-000000000a03";
const TEST_REVIEWER_2 = "00000000-0000-0000-0000-000000000a04";

beforeAll(async () => {
  // Cleanup any prior runs
  await sql`DELETE FROM artifact_reviews WHERE entity_id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM audit_log WHERE target_id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM events WHERE id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR_ID}::uuid, ${TEST_REVIEWER_1}::uuid, ${TEST_REVIEWER_2}::uuid)`;

  // Seed three users — workos_id and member_id are NOT NULL UNIQUE; reuse the user id as a unique value for both.
  for (const [id, role] of [
    [TEST_AUTHOR_ID, "member"],
    [TEST_REVIEWER_1, "staff"],
    [TEST_REVIEWER_2, "staff"],
  ] as const) {
    await sql`
      INSERT INTO users (id, workos_id, member_id, email, role)
      VALUES (
        ${id}::uuid,
        ${"test-workos-" + id},
        ${"test-member-" + id},
        ${id + "@test.local"},
        ${role}::user_role
      )
    `;
  }

  // Seed a draft event
  await sql`
    INSERT INTO events (id, slug, name, type, start_date, status, revision, author_id, scope)
    VALUES (
      ${TEST_EVENT_ID}::uuid, ${'integration-test-event-' + Date.now()}, 'Integration Test Event',
      'workshop'::event_type, '2099-12-31'::date,
      'draft'::artifact_status, 1, ${TEST_AUTHOR_ID}::uuid, 'community'::artifact_scope
    )
  `;
});

afterAll(async () => {
  await sql`DELETE FROM artifact_reviews WHERE entity_id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM audit_log WHERE target_id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM events WHERE id = ${TEST_EVENT_ID}::uuid`;
  await sql`DELETE FROM users WHERE id IN (${TEST_AUTHOR_ID}::uuid, ${TEST_REVIEWER_1}::uuid, ${TEST_REVIEWER_2}::uuid)`;
});

describe("artifact lifecycle integration", () => {
  test("member submits, two staff approve, event publishes", async () => {
    // 1. Author submits
    {
      const lifecycleDb = drizzleLifecycleDb(db, { id: TEST_AUTHOR_ID, role: "member" });
      const result = await applyTransition(lifecycleDb, {
        entityType: "event",
        entityId: TEST_EVENT_ID,
        action: "submit_for_review",
        actorId: TEST_AUTHOR_ID,
      });
      expect(result.ok).toBe(true);
    }

    // 2. First reviewer approves
    {
      const lifecycleDb = drizzleLifecycleDb(db, { id: TEST_REVIEWER_1, role: "staff" });
      const result = await applyTransition(lifecycleDb, {
        entityType: "event",
        entityId: TEST_EVENT_ID,
        action: "approve",
        actorId: TEST_REVIEWER_1,
      });
      expect(result.ok).toBe(true);
    }

    // Status should still be in_review
    const afterFirst = await sql`SELECT status FROM events WHERE id = ${TEST_EVENT_ID}::uuid`;
    expect(afterFirst[0].status).toBe("in_review");

    // 3. Second reviewer approves — should publish
    {
      const lifecycleDb = drizzleLifecycleDb(db, { id: TEST_REVIEWER_2, role: "staff" });
      const result = await applyTransition(lifecycleDb, {
        entityType: "event",
        entityId: TEST_EVENT_ID,
        action: "approve",
        actorId: TEST_REVIEWER_2,
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.newStatus).toBe("published");
    }

    const afterSecond = await sql`SELECT status FROM events WHERE id = ${TEST_EVENT_ID}::uuid`;
    expect(afterSecond[0].status).toBe("published");

    // Audit assertions
    const audits = await sql`
      SELECT action FROM audit_log WHERE target_id = ${TEST_EVENT_ID}::uuid ORDER BY created_at
    `;
    const actions = audits.map((a) => a.action);
    expect(actions).toContain("events.submit_for_review");
    expect(actions).toContain("events.approve");
    expect(actions).toContain("events.publish");
  });
});
