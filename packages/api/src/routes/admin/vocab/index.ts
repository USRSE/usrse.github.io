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
import { adminVocabByKindIdRoute } from "./byKindId";

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
  const statusFilter = (c.req.query("status") ?? "pending") as
    | "pending"
    | "approved"
    | "rejected"
    | "all";
  const kinds = kindFilter && isVocabKind(kindFilter) ? [kindFilter] : KINDS;

  try {
    // Load rows matching the status filter + their suggester profile data,
    // per-kind. Similar-term hints + sort-by-match are only meaningful for
    // pending rows, so we conditionally skip that work when status is set
    // to something else.
    const rowsByKind = await Promise.all(
      kinds.map((kind) => loadVocabRowsWithSuggester(db, kind, statusFilter))
    );

    // Load approved-pool ONLY when we'll actually score against it (pending
    // rows benefit from the similar-match hint; other statuses don't).
    const approvedByKind =
      statusFilter === "pending"
        ? await Promise.all(kinds.map((kind) => loadApprovedNames(db, kind)))
        : kinds.map(() => [] as Array<{ id: string; name: string }>);

    // Usage counts for every row we're about to return.
    const usageByKind = await Promise.all(
      kinds.map((kind, i) =>
        loadUsageCounts(db, kind, rowsByKind[i].map((r) => r.id))
      )
    );

    // Assemble.
    const rows: QueueRow[] = [];
    for (let i = 0; i < kinds.length; i++) {
      const kind = kinds[i];
      const rowsForKind = rowsByKind[i];
      const approved = approvedByKind[i];
      const usage = usageByKind[i];
      for (const r of rowsForKind) {
        const matches =
          r.status === "pending"
            ? findSimilarApproved(r.name, approved)
            : [];
        rows.push({
          kind,
          id: r.id,
          name: r.name,
          slug: r.slug,
          status: r.status,
          createdAt:
            r.createdAt instanceof Date
              ? r.createdAt.toISOString()
              : (r.createdAt as unknown as string),
          suggestedBy: r.suggester,
          usageCount: usage.get(r.id) ?? 0,
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
        pending: rows.filter((r) => r.status === "pending").length,
        approved: rows.filter((r) => r.status === "approved").length,
        rejected: rows.filter((r) => r.status === "rejected").length,
        withUsages: rows.filter((r) => r.usageCount > 0).length,
        withStrongMatch: rows.filter(
          (r) => (r.similarApproved?.score ?? 0) >= 80
        ).length,
      },
    });
  } catch (err) {
    // Surface the underlying failure to the dev console + response body so
    // /vocab/queue 500s stop being opaque. Mirrors the pattern used by
    // /admin/users/duplicates — GIT_SHA="dev" means local wrangler dev.
    const isDev = (c.env.GIT_SHA ?? "dev") === "dev";
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(
      "[/admin/vocab/queue]",
      JSON.stringify({ statusFilter, kindFilter, sortMode }),
      message,
      stack
    );
    return c.json(
      {
        ok: false,
        error: "queue_failed",
        message: isDev ? message : "internal",
        ...(isDev && stack ? { stack } : {}),
      },
      500
    );
  }
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

async function loadVocabRowsWithSuggester(
  db: ReturnType<typeof createDb>,
  kind: VocabKind,
  statusFilter: "pending" | "approved" | "rejected" | "all"
): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    suggester: { id: string; displayName: string | null; email: string } | null;
  }>
> {
  const t = vocabTableFor(kind).vocab;
  const where = statusFilter === "all" ? undefined : eq(t.status, statusFilter);
  const rows = await db
    .select({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      createdAt: t.createdAt,
      suggestedById: t.suggestedBy,
      suggesterEmail: users.email,
      suggesterDisplayName: profiles.displayName,
    })
    .from(t)
    .leftJoin(users, eq(users.id, t.suggestedBy))
    .leftJoin(profiles, eq(profiles.userId, t.suggestedBy))
    .where(where)
    .orderBy(desc(t.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    status: r.status,
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

adminVocabRoute.route("/:kind/:id", adminVocabByKindIdRoute);
