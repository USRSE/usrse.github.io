import { zValidator } from "@hono/zod-validator";
import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../../../db";
import {
  auditLog,
  profiles,
  userDisciplines,
  userLanguages,
  userSkills,
  users,
} from "../../../db/schema";
import { executeVocabMerge } from "../../../lib/admin/vocabMerge";
import { findSimilarApproved } from "../../../lib/admin/vocabSimilarity";
import { isVocabKind, vocabTableFor, type VocabKind } from "../../../lib/admin/vocabTables";
import { joinErrorChain } from "../../../lib/errorChain";
import { buildSlug } from "../../../lib/slug";
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

const patchBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    slug: z.string().min(1).max(120).optional(),
  })
  .strict();

/**
 * PATCH /api/admin/vocab/:kind/:id
 *
 * Edit name and/or slug pre-approval. Slug auto-derives from a
 * changed name unless an explicit slug override is in the body.
 * Allowed only when status='pending'.
 */
adminVocabByKindIdRoute.patch(
  "/",
  zValidator("json", patchBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    const kind = c.req.param("kind");
    const id = c.req.param("id");
    if (!isVocabKind(kind))
      return c.json({ ok: false, error: "invalid_kind" }, 400);
    if (!id || !/^[0-9a-f-]{36}$/i.test(id))
      return c.json({ ok: false, error: "invalid_input" }, 400);
    if (!c.env.DATABASE_URL)
      return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");
    const t = vocabTableFor(kind as VocabKind).vocab;

    const existing = await db
      .select({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
      })
      .from(t)
      .where(eq(t.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);
    if (existing.status !== "pending") {
      return c.json(
        {
          ok: false,
          error: "invalid_source_status",
          message: "Only pending terms can be edited.",
        },
        409
      );
    }

    c.get("auditCapture")?.({ vocab: existing });

    const next: Partial<{ name: string; slug: string }> = {};
    if (body.name !== undefined && body.name !== existing.name) {
      next.name = body.name;
    }
    if (body.slug !== undefined) {
      next.slug = body.slug;
    } else if (next.name !== undefined) {
      next.slug = buildSlug(next.name);
    }

    if (Object.keys(next).length === 0) {
      return c.json({ ok: true, noChange: true });
    }

    try {
      await db.update(t).set(next).where(eq(t.id, id));
    } catch (err) {
      // Catch Postgres unique-violation surfaced by Drizzle. The
      // duplicate-key signal lives in err.cause.message (Drizzle's
      // outer .message is just the "Failed query: ..." preamble), so
      // walk the chain — checking only err.message would miss it and
      // surface as a generic 500.
      const chain = joinErrorChain(err);
      if (chain.includes("unique") || chain.includes("duplicate")) {
        const which = chain.includes("slug") ? "slug_conflict" : "name_conflict";
        return c.json(
          { ok: false, error: which, message: "Another term already has that value." },
          409
        );
      }
      throw err;
    }

    c.set("auditAction", "vocab.edit");
    c.set("auditTarget", { type: kind, id });
    c.set("auditPayload", {
      before: { name: existing.name, slug: existing.slug },
      after: next,
    });
    return c.json({ ok: true });
  }
);

/**
 * POST /api/admin/vocab/:kind/:id/approve
 *
 * Sets status='approved' from pending or rejected. Errors with 409
 * when called on an already-approved row (not idempotent — the
 * explicit error gives the admin a clear signal if they double-clicked).
 */
adminVocabByKindIdRoute.post("/approve", async (c) => {
  const kind = c.req.param("kind");
  const id = c.req.param("id");
  if (!isVocabKind(kind))
    return c.json({ ok: false, error: "invalid_kind" }, 400);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);
  const t = vocabTableFor(kind as VocabKind).vocab;

  const existing = await db
    .select({ id: t.id, name: t.name, slug: t.slug, status: t.status })
    .from(t)
    .where(eq(t.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);
  if (existing.status === "approved") {
    return c.json(
      { ok: false, error: "already_approved", message: "Term is already approved." },
      409
    );
  }

  c.get("auditCapture")?.({ vocab: existing });
  await db.update(t).set({ status: "approved" }).where(eq(t.id, id));

  c.set("auditAction", "vocab.approve");
  c.set("auditTarget", { type: kind, id });
  c.set("auditPayload", {
    name: existing.name,
    slug: existing.slug,
    fromStatus: existing.status,
  });
  return c.json({ ok: true });
});

/**
 * POST /api/admin/vocab/:kind/:id/reject
 *
 * Sets status='rejected'. Refuses with 409 has_usages if any
 * user_<kind> row points at this term — admin must merge first.
 * Only allowed from pending.
 */
adminVocabByKindIdRoute.post("/reject", async (c) => {
  const kind = c.req.param("kind");
  const id = c.req.param("id");
  if (!isVocabKind(kind))
    return c.json({ ok: false, error: "invalid_kind" }, 400);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);
  const t = vocabTableFor(kind as VocabKind).vocab;

  const existing = await db
    .select({ id: t.id, name: t.name, slug: t.slug, status: t.status })
    .from(t)
    .where(eq(t.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);
  if (existing.status !== "pending") {
    return c.json(
      {
        ok: false,
        error: "invalid_source_status",
        message: "Only pending terms can be rejected.",
      },
      409
    );
  }

  const usageCount = await countUsages(db, kind as VocabKind, id);
  if (usageCount > 0) {
    return c.json(
      {
        ok: false,
        error: "has_usages",
        usageCount,
        message:
          "This term is in use. Merge it into a canonical term instead of rejecting.",
      },
      409
    );
  }

  c.get("auditCapture")?.({ vocab: existing });
  await db.update(t).set({ status: "rejected" }).where(eq(t.id, id));

  c.set("auditAction", "vocab.reject");
  c.set("auditTarget", { type: kind, id });
  c.set("auditPayload", { name: existing.name, slug: existing.slug });
  return c.json({ ok: true });
});

const mergeBodySchema = z.object({
  targetId: z.uuid(),
});

/**
 * POST /api/admin/vocab/:kind/:id/merge
 *
 * Repoint user_<kind> rows from source to target, drop conflicts,
 * delete source row. Source can be any status; target must be
 * approved. One db.transaction.
 */
adminVocabByKindIdRoute.post(
  "/merge",
  zValidator("json", mergeBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    const kind = c.req.param("kind");
    const id = c.req.param("id");
    if (!isVocabKind(kind))
      return c.json({ ok: false, error: "invalid_kind" }, 400);
    if (!id || !/^[0-9a-f-]{36}$/i.test(id))
      return c.json({ ok: false, error: "invalid_input" }, 400);
    if (!c.env.DATABASE_URL)
      return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    const result = await executeVocabMerge(db, {
      kind: kind as VocabKind,
      sourceId: id,
      targetId: body.targetId,
    });
    if ("error" in result) {
      return c.json(
        { ok: false, error: result.error, message: result.message },
        result.status
      );
    }

    c.set("auditAction", "vocab.merge");
    c.set("auditTarget", { type: kind, id: body.targetId });
    c.set("auditPayload", {
      sourceId: id,
      sourceName: result.sourceName,
      targetName: result.targetName,
      repointed: result.repointed,
      dropped: result.dropped,
    });
    return c.json({ ok: true, repointed: result.repointed, dropped: result.dropped });
  }
);

