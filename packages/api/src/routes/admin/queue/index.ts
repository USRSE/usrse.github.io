import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { createDb } from "../../../db";
import type { AppEnv } from "../../../types";

export const adminQueueRoute = new Hono<AppEnv>();

/**
 * GET /admin/queue
 *
 * Returns all in_review artifacts across events, announcements, forms
 * via UNION ALL. Filters: type, scope.
 */
adminQueueRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json({ ok: false, error: "internal" }, 500);
  }
  const actor = c.get("actor");
  if (!actor || actor.systemTier < 1) {
    return c.json({ ok: false, error: "forbidden" }, 403);
  }
  const db = createDb(c.env.DATABASE_URL);

  const typeFilter = c.req.query("type");
  const scopeFilter = c.req.query("scope");

  const rows = await db.execute(sql`
    SELECT entity_type, id, title, status, revision, scope, author_id, host_group_id, host_org_id, created_at
    FROM (
      SELECT 'event'::text AS entity_type, id, name AS title, status::text, revision, scope::text, author_id, host_group_id, host_org_id, created_at
      FROM events WHERE deleted_at IS NULL AND status = 'in_review'
      UNION ALL
      SELECT 'announcement'::text, id, title, status::text, revision, scope::text, author_id, host_group_id, NULL::uuid AS host_org_id, created_at
      FROM announcements WHERE deleted_at IS NULL AND status = 'in_review'
      UNION ALL
      SELECT 'form'::text, id, title, status::text, revision, scope::text, author_id, host_group_id, NULL::uuid, created_at
      FROM forms WHERE deleted_at IS NULL AND status = 'in_review'
    ) q
    WHERE (${typeFilter ?? null}::text IS NULL OR entity_type = ${typeFilter ?? null}::text)
      AND (${scopeFilter ?? null}::text IS NULL OR scope = ${scopeFilter ?? null}::text)
    ORDER BY created_at ASC
    LIMIT 200
  `);

  const list = Array.isArray(rows) ? rows : (rows as { rows: Record<string, unknown>[] }).rows;

  return c.json({
    ok: true,
    rows: list.map((r: Record<string, unknown>) => ({
      entityType: r.entity_type,
      id: r.id,
      title: r.title,
      status: r.status,
      revision: r.revision,
      scope: r.scope,
      authorId: r.author_id,
      hostGroupId: r.host_group_id,
      hostOrgId: r.host_org_id,
      createdAt: r.created_at,
    })),
  });
});
