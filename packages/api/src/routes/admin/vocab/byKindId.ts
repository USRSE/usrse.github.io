import { Hono } from "hono";
import { count, desc, eq } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  auditLog,
  profiles,
  userDisciplines,
  userLanguages,
  userSkills,
  users,
} from "../../../db/schema";
import { findSimilarApproved } from "../../../lib/admin/vocabSimilarity";
import { isVocabKind, vocabTableFor, type VocabKind } from "../../../lib/admin/vocabTables";
import type { AppEnv } from "../../../types";

export const adminVocabByKindIdRoute = new Hono<AppEnv>();

/**
 * GET /api/admin/vocab/:kind/:id
 */
adminVocabByKindIdRoute.get("/", async (c) => {
  const kind = c.req.param("kind");
  const id = c.req.param("id");
  if (!isVocabKind(kind)) return c.json({ ok: false, error: "invalid_kind" }, 400);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const t = vocabTableFor(kind as VocabKind).vocab;
  const row = await db
    .select({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      createdAt: t.createdAt,
      suggestedByUserId: t.suggestedBy,
    })
    .from(t)
    .where(eq(t.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);
  if (!row) return c.json({ ok: false, error: "not_found" }, 404);

  // Suggester profile, usage count, similar approved list (top 10),
  // recent audit (last 20 rows where targetId matches this row).
  const [suggester, usageCount, similar, recentAudit] = await Promise.all([
    row.suggestedByUserId
      ? db
          .select({
            id: users.id,
            email: users.email,
            displayName: profiles.displayName,
          })
          .from(users)
          .leftJoin(profiles, eq(profiles.userId, users.id))
          .where(eq(users.id, row.suggestedByUserId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    countUsages(db, kind as VocabKind, id),
    loadSimilarApproved(db, kind as VocabKind, { id: row.id, name: row.name }),
    db
      .select({
        id: auditLog.id,
        actorId: auditLog.actorId,
        actorRole: auditLog.actorRole,
        action: auditLog.action,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(eq(auditLog.targetId, id))
      .orderBy(desc(auditLog.createdAt))
      .limit(20),
  ]);

  return c.json({
    ok: true,
    row: {
      kind,
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : (row.createdAt as unknown as string),
      suggestedBy: suggester,
      usageCount,
    },
    similarApproved: similar.slice(0, 10),
    recentAudit: recentAudit.map((r) => ({
      ...r,
      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : (r.createdAt as unknown as string),
    })),
  });
});

async function countUsages(
  db: ReturnType<typeof createDb>,
  kind: VocabKind,
  id: string
): Promise<number> {
  switch (kind) {
    case "disciplines": {
      const r = await db
        .select({ n: count() })
        .from(userDisciplines)
        .where(eq(userDisciplines.disciplineId, id));
      return Number(r[0]?.n ?? 0);
    }
    case "skills": {
      const r = await db
        .select({ n: count() })
        .from(userSkills)
        .where(eq(userSkills.skillId, id));
      return Number(r[0]?.n ?? 0);
    }
    case "languages": {
      const r = await db
        .select({ n: count() })
        .from(userLanguages)
        .where(eq(userLanguages.languageId, id));
      return Number(r[0]?.n ?? 0);
    }
  }
}

async function loadSimilarApproved(
  db: ReturnType<typeof createDb>,
  kind: VocabKind,
  row: { id: string; name: string }
): Promise<Array<{ id: string; name: string; score: number }>> {
  const t = vocabTableFor(kind).vocab;
  const approved = await db
    .select({ id: t.id, name: t.name })
    .from(t)
    .where(eq(t.status, "approved"));
  return findSimilarApproved(row.name, approved, row.id);
}
