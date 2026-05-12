import { Hono } from "hono";
import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  profiles,
  userDisciplines,
  userLanguages,
  userSkills,
  users,
} from "../../../db/schema";
import { canApproveVocab } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import { findSimilarApproved } from "../../../lib/admin/vocabSimilarity";
import { isVocabKind, vocabTableFor, type VocabKind } from "../../../lib/admin/vocabTables";
import type { AppEnv } from "../../../types";

export const adminVocabRoute = new Hono<AppEnv>();

adminVocabRoute.use("*", requirePolicy(canApproveVocab, () => undefined));

const KINDS: VocabKind[] = ["disciplines", "skills", "languages"];

interface QueueRow {
  kind: VocabKind;
  id: string;
  name: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  suggestedBy: {
    id: string;
    displayName: string | null;
    email: string;
  } | null;
  usageCount: number;
  similarApproved: { id: string; name: string; score: number } | null;
}

/**
 * GET /api/admin/vocab/queue
 *
 * Unified pending queue across the three vocab tables. Annotates
 * each row with usageCount and a best-match similar approved term.
 */
adminVocabRoute.get("/queue", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const kindFilter = c.req.query("kind");
  const sortMode = (c.req.query("sort") ?? "newest") as
    | "newest"
    | "most-used"
    | "strongest-match";
  const kinds = kindFilter && isVocabKind(kindFilter) ? [kindFilter] : KINDS;

  // Load all pending rows + their suggester profile data, per-kind.
  const pendingByKind = await Promise.all(
    kinds.map((kind) => loadPendingWithSuggester(db, kind))
  );

  // Load all approved rows per kind (small — ~hundreds per table) so
  // we can run the similarity scorer in JS without N+1 queries.
  const approvedByKind = await Promise.all(
    kinds.map((kind) => loadApprovedNames(db, kind))
  );

  // Load usage counts for the union of pending ids per kind.
  const usageByKind = await Promise.all(
    kinds.map((kind, i) =>
      loadUsageCounts(db, kind, pendingByKind[i].map((r) => r.id))
    )
  );

  // Assemble.
  const rows: QueueRow[] = [];
  for (let i = 0; i < kinds.length; i++) {
    const kind = kinds[i];
    const pending = pendingByKind[i];
    const approved = approvedByKind[i];
    const usage = usageByKind[i];
    for (const p of pending) {
      const matches = findSimilarApproved(p.name, approved);
      rows.push({
        kind,
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: "pending",
        createdAt:
          p.createdAt instanceof Date
            ? p.createdAt.toISOString()
            : (p.createdAt as unknown as string),
        suggestedBy: p.suggester,
        usageCount: usage.get(p.id) ?? 0,
        similarApproved: matches[0]
          ? { id: matches[0].id, name: matches[0].name, score: matches[0].score }
          : null,
      });
    }
  }

  // Sort across the union.
  rows.sort((a, b) => {
    if (sortMode === "most-used") return b.usageCount - a.usageCount;
    if (sortMode === "strongest-match") {
      return (b.similarApproved?.score ?? 0) - (a.similarApproved?.score ?? 0);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  return c.json({
    ok: true,
    rows,
    counts: {
      total: rows.length,
      withUsages: rows.filter((r) => r.usageCount > 0).length,
      withStrongMatch: rows.filter(
        (r) => (r.similarApproved?.score ?? 0) >= 80
      ).length,
    },
  });
});

/**
 * GET /api/admin/vocab/:kind
 *
 * Per-table list filterable by status + search.
 */
adminVocabRoute.get("/:kind", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const kind = c.req.param("kind");
  if (!isVocabKind(kind))
    return c.json({ ok: false, error: "invalid_kind" }, 400);
  const db = createDb(c.env.DATABASE_URL);

  const status = (c.req.query("status") ?? "pending") as
    | "pending"
    | "approved"
    | "rejected"
    | "all";
  const q = c.req.query("q") ?? "";

  const conditions: SQL[] = [];
  const t = vocabTableFor(kind).vocab;
  if (status !== "all") {
    conditions.push(eq(t.status, status));
  }
  if (q.trim()) {
    conditions.push(ilike(t.name, `%${q.trim()}%`));
  }

  const rawRows = await db
    .select({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      createdAt: t.createdAt,
      suggestedByUserId: t.suggestedBy,
    })
    .from(t)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(t.name));

  const suggesterIds = Array.from(
    new Set(rawRows.map((r) => r.suggestedByUserId).filter((v): v is string => !!v))
  );
  const suggesters = suggesterIds.length
    ? await loadSuggesters(db, suggesterIds)
    : new Map();

  const ids = rawRows.map((r) => r.id);
  const usage = ids.length ? await loadUsageCounts(db, kind, ids) : new Map<string, number>();

  return c.json({
    ok: true,
    rows: rawRows.map((r) => ({
      kind,
      id: r.id,
      name: r.name,
      slug: r.slug,
      status: r.status,
      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : (r.createdAt as unknown as string),
      suggestedBy: r.suggestedByUserId
        ? suggesters.get(r.suggestedByUserId) ?? null
        : null,
      usageCount: usage.get(r.id) ?? 0,
    })),
  });
});

// ---- Helpers ----

async function loadPendingWithSuggester(
  db: ReturnType<typeof createDb>,
  kind: VocabKind
): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    suggester: { id: string; displayName: string | null; email: string } | null;
  }>
> {
  const t = vocabTableFor(kind).vocab;
  const rows = await db
    .select({
      id: t.id,
      name: t.name,
      slug: t.slug,
      createdAt: t.createdAt,
      suggestedById: t.suggestedBy,
      suggesterEmail: users.email,
      suggesterDisplayName: profiles.displayName,
    })
    .from(t)
    .leftJoin(users, eq(users.id, t.suggestedBy))
    .leftJoin(profiles, eq(profiles.userId, t.suggestedBy))
    .where(eq(t.status, "pending"))
    .orderBy(desc(t.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    createdAt: r.createdAt as Date,
    suggester: r.suggestedById
      ? {
          id: r.suggestedById,
          displayName: r.suggesterDisplayName,
          email: r.suggesterEmail ?? "",
        }
      : null,
  }));
}

async function loadApprovedNames(
  db: ReturnType<typeof createDb>,
  kind: VocabKind
): Promise<Array<{ id: string; name: string }>> {
  const t = vocabTableFor(kind).vocab;
  return db
    .select({ id: t.id, name: t.name })
    .from(t)
    .where(eq(t.status, "approved"));
}

async function loadUsageCounts(
  db: ReturnType<typeof createDb>,
  kind: VocabKind,
  ids: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (ids.length === 0) return out;
  switch (kind) {
    case "disciplines": {
      const rows = await db
        .select({
          id: userDisciplines.disciplineId,
          n: count(userDisciplines.userId),
        })
        .from(userDisciplines)
        .where(sql`${userDisciplines.disciplineId} = ANY(${ids}::uuid[])`)
        .groupBy(userDisciplines.disciplineId);
      for (const r of rows) out.set(r.id, Number(r.n));
      break;
    }
    case "skills": {
      const rows = await db
        .select({
          id: userSkills.skillId,
          n: count(userSkills.userId),
        })
        .from(userSkills)
        .where(sql`${userSkills.skillId} = ANY(${ids}::uuid[])`)
        .groupBy(userSkills.skillId);
      for (const r of rows) out.set(r.id, Number(r.n));
      break;
    }
    case "languages": {
      const rows = await db
        .select({
          id: userLanguages.languageId,
          n: count(userLanguages.userId),
        })
        .from(userLanguages)
        .where(sql`${userLanguages.languageId} = ANY(${ids}::uuid[])`)
        .groupBy(userLanguages.languageId);
      for (const r of rows) out.set(r.id, Number(r.n));
      break;
    }
  }
  return out;
}

async function loadSuggesters(
  db: ReturnType<typeof createDb>,
  userIds: string[]
): Promise<Map<string, { id: string; displayName: string | null; email: string }>> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: profiles.displayName,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(sql`${users.id} = ANY(${userIds}::uuid[])`);
  const out = new Map<
    string,
    { id: string; displayName: string | null; email: string }
  >();
  for (const r of rows) {
    out.set(r.id, { id: r.id, displayName: r.displayName, email: r.email });
  }
  return out;
}
