# Admin Vocab Curation Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an admin queue that lets staff and super-admins approve, reject, and merge user-proposed vocab terms across `disciplines`, `skills`, and `languages` — replacing the `02 Vocab` ComingSoon stub with a real workflow.

**Architecture:** One Hono sub-app at `/api/admin/vocab/*`, gated by a new `canApproveVocab` (staff+) policy. One React route tree at `/vocab/*` in the admin app: unified queue + per-table list + polymorphic detail. The three vocab tables share the same shape (`name`, `slug`, `status`, `suggestedBy`, `createdAt`), so each endpoint switches on a `kind: "disciplines" | "skills" | "languages"` discriminator. No new database tables, no migrations. Similar-term hints in the queue use a new `vocabSimilarity.ts` library that mirrors the user-duplicate detection shape with one anchor (normalized name) and length-scaled Levenshtein. Merges run as one `db.transaction(...)` that repoints user join-table rows, drops conflicting joins, and deletes the source row.

**Tech Stack:** TypeScript everywhere. Backend: Cloudflare Workers + Hono + Drizzle ORM + Neon Postgres. Frontend: React 19 + Vite + React Router 7 + Tailwind + `@us-rse/design-system` + the admin's `editorial.css`. Tests: Vitest for policy + lib units, Playwright for the foundation smoke (extended at the end).

Spec: `docs/superpowers/specs/2026-05-12-vocab-curation-queue-design.md`. Tracker: #1958.

---

## Pre-flight

- [ ] **Step 1: Create a feature branch off `cdcore09/site-redesign`.**

```bash
cd /Users/corderocore/Documents/usrse.github.io
git checkout cdcore09/site-redesign
git pull --ff-only
git checkout -b cdcore09/admin-vocab
```

- [ ] **Step 2: Open the spec and this plan side-by-side.** Every task references the spec.

- [ ] **Step 3: Confirm clean tree.**

```bash
git status
```

Expected: `nothing to commit, working tree clean` and on `cdcore09/admin-vocab`.

---

## Task 1: `canApproveVocab` policy

**Files:**
- Create: `packages/api/src/lib/policies/canApproveVocab.ts`
- Modify: `packages/api/src/lib/policies/index.ts`
- Modify: `packages/api/src/lib/policies/policies.test.ts`

- [ ] **Step 1: Write the policy.**

`packages/api/src/lib/policies/canApproveVocab.ts`:

```ts
import type { ActorContext } from "./types";

/**
 * Curate the user-proposable vocabularies — approve, reject, merge,
 * or edit pending terms in disciplines / skills / languages. Staff
 * and super_admin only. Mirrors the canEditMembers gate; merge is
 * gated by the same policy because vocab merges are low-stakes
 * compared to user merges (no reversibility required).
 */
export const canApproveVocab = (a: ActorContext): boolean =>
  a.systemTier >= 1;
```

- [ ] **Step 2: Re-export from the barrel.**

In `packages/api/src/lib/policies/index.ts`, add the line alongside the other policy exports:

```ts
export { canApproveVocab } from "./canApproveVocab";
```

- [ ] **Step 3: Add tests.**

Append to `packages/api/src/lib/policies/policies.test.ts`. Extend the existing import block from `./index` to include `canApproveVocab` (do not add a duplicate import statement). Then append:

```ts
describe("canApproveVocab", () => {
  it("denies plain members", () => {
    expect(canApproveVocab(actor())).toBe(false);
  });
  it("allows staff", () => {
    expect(canApproveVocab(actor({ systemTier: 1 }))).toBe(true);
  });
  it("allows super_admin", () => {
    expect(canApproveVocab(actor({ systemTier: 2 }))).toBe(true);
  });
});
```

- [ ] **Step 4: Run tests.**

```bash
cd packages/api && npm test
```

Expected: existing tests pass plus 3 new assertions for `canApproveVocab`.

- [ ] **Step 5: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/policies
git commit -m "feat(api): canApproveVocab policy"
```

Expected typecheck: 5/5 successful.

---

## Task 2: Vocab similarity library

**Files:**
- Create: `packages/api/src/lib/admin/vocabSimilarity.ts`
- Create: `packages/api/src/lib/admin/vocabSimilarity.test.ts`

- [ ] **Step 1: Write the failing test first.**

`packages/api/src/lib/admin/vocabSimilarity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findSimilarApproved, type SimilarTerm } from "./vocabSimilarity";

// Re-uses the normalizeDisplayName helper from duplicateDetection; do not
// re-import it here — we only test the public surface of vocabSimilarity.

function approved(name: string, id = name): { id: string; name: string } {
  return { id, name };
}

describe("findSimilarApproved", () => {
  it("returns null when no approved terms are close", () => {
    const result = findSimilarApproved("JavaScript", [
      approved("Rust"),
      approved("Go"),
    ]);
    expect(result).toEqual<SimilarTerm[]>([]);
  });

  it("scores normalized exact match as 100", () => {
    const result = findSimilarApproved("JavaScript", [
      approved("JavaScript"),
      approved("javascript"),
      approved("JAVA SCRIPT"),
    ]);
    // All three normalize to "javascript" → all score 100. Output is
    // sorted by score desc; ties preserve input order.
    expect(result.map((r) => r.score)).toEqual([100, 100, 100]);
  });

  it("scores length-scaled Levenshtein matches", () => {
    // 10-char string: distance ≤ 2 qualifies.
    // "JavaScript" vs "JavScript"   → distance 1 → score 80
    // "JavaScript" vs "JavScrpt"   → distance 2 → score 50
    // "JavaScript" vs "Pythn"      → too short and too far → not in results
    const result = findSimilarApproved("JavaScript", [
      approved("JavScript"),
      approved("JavScrpt"),
      approved("Python"),
    ]);
    expect(result.map((r) => ({ name: r.name, score: r.score }))).toEqual([
      { name: "JavScript", score: 80 },
      { name: "JavScrpt", score: 50 },
    ]);
  });

  it("requires tighter distance for short normalized names", () => {
    // 4-char "rust": only distance ≤ 1 qualifies.
    // "rust" vs "rest" → distance 1 → score 80
    // "rust" vs "rost" → distance 1 → score 80
    // "rust" vs "rose" → distance 2 → NOT in results
    const result = findSimilarApproved("rust", [
      approved("rest"),
      approved("rost"),
      approved("rose"),
    ]);
    expect(result.map((r) => r.name).sort()).toEqual(["rest", "rost"]);
  });

  it("admits distance ≤ 3 only for long names", () => {
    // 17-char normalized name: distance ≤ 3 qualifies.
    const result = findSimilarApproved("Differential Equations", [
      approved("Diferential Equations"),  // d=1 → score 80
      approved("Diferensial Equations"),  // d=2 → score 50
      approved("Diferantsial Equation"),  // d=3 → score 30
      approved("Distinguished Equations"), // d=4 → not in results
    ]);
    expect(result.map((r) => r.score)).toEqual([80, 50, 30]);
  });

  it("excludes the pending term itself by id when given", () => {
    const result = findSimilarApproved("JavaScript", [
      approved("JavaScript", "p1"), // same id as pending — should be excluded
      approved("JavaScript", "a1"),
    ], "p1");
    expect(result.map((r) => r.id)).toEqual(["a1"]);
  });
});
```

- [ ] **Step 2: Run test, expect failure.**

```bash
cd packages/api && npm test -- vocabSimilarity
```

Expected: module not found / fail. We haven't written the implementation yet.

- [ ] **Step 3: Write the implementation.**

`packages/api/src/lib/admin/vocabSimilarity.ts`:

```ts
import { normalizeDisplayName } from "./duplicateDetection";

export interface SimilarTerm {
  id: string;
  name: string;
  score: 100 | 80 | 50 | 30;
}

export interface ApprovedRow {
  id: string;
  name: string;
}

/**
 * Score every approved term in `pool` against `pendingName` and
 * return matches with score >= 30, sorted by score desc.
 *
 * Scoring matrix:
 *   normalized exact match                         → 100
 *   Levenshtein distance within length-scaled bound:
 *     normalized length ≤ 8:    d ≤ 1               → 80
 *     9 ≤ normalized length ≤ 15:
 *       d == 1                                       → 80
 *       d == 2                                       → 50
 *     normalized length ≥ 16:
 *       d == 1                                       → 80
 *       d == 2                                       → 50
 *       d == 3                                       → 30
 *
 * `excludeId` is the id of the pending term itself when iterating
 * over a list that includes both pending and approved rows — used
 * by the queue endpoint when the approved pool comes from the same
 * SELECT. Defaults to undefined.
 */
export function findSimilarApproved(
  pendingName: string,
  pool: ApprovedRow[],
  excludeId?: string
): SimilarTerm[] {
  const pn = normalizeDisplayName(pendingName);
  if (!pn) return [];
  const results: SimilarTerm[] = [];
  for (const a of pool) {
    if (excludeId && a.id === excludeId) continue;
    const an = normalizeDisplayName(a.name);
    if (!an) continue;
    if (an === pn) {
      results.push({ id: a.id, name: a.name, score: 100 });
      continue;
    }
    const d = levenshtein(pn, an);
    const score = scoreForDistance(pn.length, d);
    if (score !== null) {
      results.push({ id: a.id, name: a.name, score });
    }
  }
  results.sort((x, y) => y.score - x.score);
  return results;
}

function scoreForDistance(len: number, d: number): 80 | 50 | 30 | null {
  if (d <= 0) return null; // identical, handled separately
  if (len <= 8) return d <= 1 ? 80 : null;
  if (len <= 15) {
    if (d === 1) return 80;
    if (d === 2) return 50;
    return null;
  }
  // len >= 16
  if (d === 1) return 80;
  if (d === 2) return 50;
  if (d === 3) return 30;
  return null;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1).fill(0);
  const curr = new Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}
```

Note: `normalizeDisplayName` is already exported from `duplicateDetection.ts` (verified via `grep -n "export function normalizeDisplayName" packages/api/src/lib/admin/duplicateDetection.ts`). We import and reuse rather than duplicate.

- [ ] **Step 4: Run tests, expect pass.**

```bash
cd packages/api && npm test -- vocabSimilarity
```

Expected: 6/6 passed.

- [ ] **Step 5: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/admin/vocabSimilarity.ts packages/api/src/lib/admin/vocabSimilarity.test.ts
git commit -m "feat(api): vocab similarity scoring with length-scaled distance"
```

---

## Task 3: Vocab table dispatch helper

**Files:**
- Create: `packages/api/src/lib/admin/vocabTables.ts`
- Create: `packages/api/src/lib/admin/vocabTables.test.ts`

A polymorphic helper that maps a `kind` discriminator to the right Drizzle tables. Used by every endpoint so we don't switch-case repeatedly. The endpoints still switch internally when they need to read/write specific columns, but most reads can use the shared shape.

- [ ] **Step 1: Write the failing test first.**

`packages/api/src/lib/admin/vocabTables.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  disciplines,
  languages,
  skills,
  userDisciplines,
  userLanguages,
  userSkills,
} from "../../db/schema";
import { isVocabKind, vocabTableFor, type VocabKind } from "./vocabTables";

describe("isVocabKind", () => {
  it("accepts the three valid kinds", () => {
    expect(isVocabKind("disciplines")).toBe(true);
    expect(isVocabKind("skills")).toBe(true);
    expect(isVocabKind("languages")).toBe(true);
  });
  it("rejects other strings", () => {
    expect(isVocabKind("organizations")).toBe(false);
    expect(isVocabKind("Skills")).toBe(false);
    expect(isVocabKind("")).toBe(false);
    expect(isVocabKind(undefined)).toBe(false);
  });
});

describe("vocabTableFor", () => {
  it("disciplines → disciplines + user_disciplines", () => {
    const t = vocabTableFor("disciplines");
    expect(t.vocab).toBe(disciplines);
    expect(t.join).toBe(userDisciplines);
  });
  it("skills → skills + user_skills", () => {
    const t = vocabTableFor("skills");
    expect(t.vocab).toBe(skills);
    expect(t.join).toBe(userSkills);
  });
  it("languages → languages + user_languages", () => {
    const t = vocabTableFor("languages");
    expect(t.vocab).toBe(languages);
    expect(t.join).toBe(userLanguages);
  });
});
```

- [ ] **Step 2: Run test, expect failure (module not found).**

```bash
cd packages/api && npm test -- vocabTables
```

- [ ] **Step 3: Write the implementation.**

`packages/api/src/lib/admin/vocabTables.ts`:

```ts
import {
  disciplines,
  languages,
  skills,
  userDisciplines,
  userLanguages,
  userSkills,
} from "../../db/schema";

export type VocabKind = "disciplines" | "skills" | "languages";

const VOCAB_KINDS: readonly VocabKind[] = [
  "disciplines",
  "skills",
  "languages",
] as const;

export function isVocabKind(v: unknown): v is VocabKind {
  return typeof v === "string" && (VOCAB_KINDS as readonly string[]).includes(v);
}

/**
 * Maps a vocab kind to its tables. The join table's FK column to the
 * vocab table is intentionally NOT exposed here as a Drizzle reference
 * because the column names differ (`discipline_id` / `skill_id` /
 * `language_id`) and the Drizzle column types don't unify cleanly.
 * Endpoints that need the FK column switch on `kind` directly — the
 * switch lives once per operation, in the place where the column is
 * used, rather than smeared through a generic helper.
 */
export function vocabTableFor(kind: VocabKind): {
  vocab: typeof disciplines | typeof skills | typeof languages;
  join: typeof userDisciplines | typeof userSkills | typeof userLanguages;
} {
  switch (kind) {
    case "disciplines":
      return { vocab: disciplines, join: userDisciplines };
    case "skills":
      return { vocab: skills, join: userSkills };
    case "languages":
      return { vocab: languages, join: userLanguages };
  }
}
```

- [ ] **Step 4: Run tests, expect pass.**

```bash
cd packages/api && npm test -- vocabTables
```

Expected: 5/5 passed.

- [ ] **Step 5: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/admin/vocabTables.ts packages/api/src/lib/admin/vocabTables.test.ts
git commit -m "feat(api): vocab table dispatch helper"
```

---

## Task 4: Vocab merge transaction library

**Files:**
- Create: `packages/api/src/lib/admin/vocabMerge.ts`

The merge transaction is the most consequential write in this subsystem. The conflict-detection SQL differs per table because the join-table column names differ. We keep the switch local to the merge function.

- [ ] **Step 1: Write the implementation.**

`packages/api/src/lib/admin/vocabMerge.ts`:

```ts
import { and, eq, sql } from "drizzle-orm";
import type { createDb } from "../../db";
import {
  disciplines,
  languages,
  skills,
  userDisciplines,
  userLanguages,
  userSkills,
} from "../../db/schema";
import type { VocabKind } from "./vocabTables";

type Db = ReturnType<typeof createDb>;

export interface VocabMergeRequest {
  kind: VocabKind;
  sourceId: string;
  targetId: string;
}

export interface VocabMergeError {
  status: 400 | 404 | 409;
  error: string;
  message: string;
}

export interface VocabMergeResult {
  repointed: number;
  dropped: number;
  sourceName: string;
  targetName: string;
}

/**
 * Validate inputs, then in one db.transaction:
 *   1. Repoint user_<kind> rows from source to target where the
 *      (user_id, target_id) row does not already exist.
 *   2. Delete remaining user_<kind> rows pointing at source (the user
 *      already had the canonical term — drop the duplicate).
 *   3. Delete the source row.
 *
 * Returns `{ repointed, dropped, sourceName, targetName }` so the
 * audit payload can record exact counts.
 *
 * Validation:
 *   - source ≠ target
 *   - source exists (404 if not)
 *   - target exists AND status='approved' (409 if not)
 */
export async function executeVocabMerge(
  db: Db,
  req: VocabMergeRequest
): Promise<VocabMergeError | VocabMergeResult> {
  if (req.sourceId === req.targetId) {
    return {
      status: 400,
      error: "invalid_input",
      message: "Source and target must be different.",
    };
  }

  const [src, tgt] = await Promise.all([
    loadVocabRow(db, req.kind, req.sourceId),
    loadVocabRow(db, req.kind, req.targetId),
  ]);

  if (!src) {
    return {
      status: 404,
      error: "not_found",
      message: `Source ${req.kind} ${req.sourceId} not found.`,
    };
  }
  if (!tgt) {
    return {
      status: 404,
      error: "not_found",
      message: `Target ${req.kind} ${req.targetId} not found.`,
    };
  }
  if (tgt.status !== "approved") {
    return {
      status: 409,
      error: "target_not_approved",
      message: "Merge target must be an approved term.",
    };
  }

  let repointed = 0;
  let dropped = 0;

  await db.transaction(async (tx) => {
    switch (req.kind) {
      case "disciplines": {
        // Repoint where no conflict (user does not yet have target).
        const moved = await tx
          .update(userDisciplines)
          .set({ disciplineId: req.targetId })
          .where(
            and(
              eq(userDisciplines.disciplineId, req.sourceId),
              sql`NOT EXISTS (SELECT 1 FROM user_disciplines AS conflict WHERE conflict.user_id = ${userDisciplines.userId} AND conflict.discipline_id = ${req.targetId})`
            )
          )
          .returning({ userId: userDisciplines.userId });
        repointed = moved.length;
        // Drop remaining source-pointing rows — these are users who
        // already had the target term.
        const cleared = await tx
          .delete(userDisciplines)
          .where(eq(userDisciplines.disciplineId, req.sourceId))
          .returning({ userId: userDisciplines.userId });
        dropped = cleared.length;
        await tx.delete(disciplines).where(eq(disciplines.id, req.sourceId));
        break;
      }
      case "skills": {
        const moved = await tx
          .update(userSkills)
          .set({ skillId: req.targetId })
          .where(
            and(
              eq(userSkills.skillId, req.sourceId),
              sql`NOT EXISTS (SELECT 1 FROM user_skills AS conflict WHERE conflict.user_id = ${userSkills.userId} AND conflict.skill_id = ${req.targetId})`
            )
          )
          .returning({ userId: userSkills.userId });
        repointed = moved.length;
        const cleared = await tx
          .delete(userSkills)
          .where(eq(userSkills.skillId, req.sourceId))
          .returning({ userId: userSkills.userId });
        dropped = cleared.length;
        await tx.delete(skills).where(eq(skills.id, req.sourceId));
        break;
      }
      case "languages": {
        const moved = await tx
          .update(userLanguages)
          .set({ languageId: req.targetId })
          .where(
            and(
              eq(userLanguages.languageId, req.sourceId),
              sql`NOT EXISTS (SELECT 1 FROM user_languages AS conflict WHERE conflict.user_id = ${userLanguages.userId} AND conflict.language_id = ${req.targetId})`
            )
          )
          .returning({ userId: userLanguages.userId });
        repointed = moved.length;
        const cleared = await tx
          .delete(userLanguages)
          .where(eq(userLanguages.languageId, req.sourceId))
          .returning({ userId: userLanguages.userId });
        dropped = cleared.length;
        await tx.delete(languages).where(eq(languages.id, req.sourceId));
        break;
      }
    }
  });

  return {
    repointed,
    dropped,
    sourceName: src.name,
    targetName: tgt.name,
  };
}

async function loadVocabRow(
  db: Db,
  kind: VocabKind,
  id: string
): Promise<{ id: string; name: string; status: string } | null> {
  switch (kind) {
    case "disciplines": {
      const rows = await db
        .select({ id: disciplines.id, name: disciplines.name, status: disciplines.status })
        .from(disciplines)
        .where(eq(disciplines.id, id))
        .limit(1);
      return rows[0] ?? null;
    }
    case "skills": {
      const rows = await db
        .select({ id: skills.id, name: skills.name, status: skills.status })
        .from(skills)
        .where(eq(skills.id, id))
        .limit(1);
      return rows[0] ?? null;
    }
    case "languages": {
      const rows = await db
        .select({ id: languages.id, name: languages.name, status: languages.status })
        .from(languages)
        .where(eq(languages.id, id))
        .limit(1);
      return rows[0] ?? null;
    }
  }
}
```

- [ ] **Step 2: Typecheck + commit.**

The merge transaction's correctness is exercised against the real DB in the route smoke step (Task 11). A unit test here would mock too much of the Drizzle surface to be useful.

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/admin/vocabMerge.ts
git commit -m "feat(api): vocab merge transaction with conflict-detection"
```

Expected typecheck: 5/5 successful.

---

## Task 5: API — queue + per-table list endpoints

**Files:**
- Create: `packages/api/src/routes/admin/vocab/index.ts`
- Modify: `packages/api/src/routes/admin/index.ts` (mount the sub-app)

- [ ] **Step 1: Write the sub-app shell with the queue + list endpoints.**

`packages/api/src/routes/admin/vocab/index.ts`:

```ts
import { Hono } from "hono";
import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  disciplines,
  languages,
  profiles,
  skills,
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
```

Note on `= ANY(${ids}::uuid[])`: drizzle's array-param binding does NOT wrap the JS array into a single param when used inside the `sql` template — without the `::uuid[]` cast Postgres rejects the resulting tuple. (We hit this exact bug in the user-duplicates endpoint and replaced it with `inArray()` there.) Here we keep the cast form because `count(...).groupBy(...)` doesn't compose cleanly with `inArray()`'s where-builder; the cast works because each id was already validated as a UUID at insert time by Drizzle.

- [ ] **Step 2: Mount the sub-app.**

In `packages/api/src/routes/admin/index.ts`, add the import:

```ts
import { adminVocabRoute } from "./vocab";
```

Then mount after the existing `/users` route:

```ts
adminApi.route("/vocab", adminVocabRoute);
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin
git commit -m "feat(api): /admin/vocab queue + per-table list endpoints"
```

Expected: 5/5 successful.

---

## Task 6: API — detail endpoint

**Files:**
- Create: `packages/api/src/routes/admin/vocab/byKindId.ts`
- Modify: `packages/api/src/routes/admin/vocab/index.ts` (mount the sub-router)

- [ ] **Step 1: Build the detail handler.**

`packages/api/src/routes/admin/vocab/byKindId.ts`:

```ts
import { Hono } from "hono";
import { and, count, desc, eq, or, sql } from "drizzle-orm";
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
    loadSimilarApproved(db, kind as VocabKind, row),
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
```

- [ ] **Step 2: Mount the sub-router on `:kind/:id`.**

Edit `packages/api/src/routes/admin/vocab/index.ts`. Add the import near the top:

```ts
import { adminVocabByKindIdRoute } from "./byKindId";
```

And at the very bottom of the file, after the queue + list handlers:

```ts
adminVocabRoute.route("/:kind/:id", adminVocabByKindIdRoute);
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin/vocab
git commit -m "feat(api): /admin/vocab/:kind/:id detail endpoint"
```

---

## Task 7: API — PATCH + approve + reject endpoints

**Files:**
- Modify: `packages/api/src/routes/admin/vocab/byKindId.ts`

The PATCH (edit name/slug pre-approval) + approve + reject endpoints all live on the same `:kind/:id` sub-router. Reject is the only one with a non-trivial check (refuse when `usageCount > 0`); PATCH re-derives the slug from the name when the body omits it.

- [ ] **Step 1: Add the PATCH endpoint.**

Append to the imports at the top of `packages/api/src/routes/admin/vocab/byKindId.ts`:

```ts
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { buildSlug } from "../../../lib/slug";
```

(Confirm `buildSlug` exists at `packages/api/src/lib/slug.ts`. If not, the closest helper is the one used by member-id generation — re-use whatever the rest of the codebase uses for slugification. Acceptable fallback: simple inline `name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")`.)

Append at the bottom of `byKindId.ts`:

```ts
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
      // Catch Postgres unique-violation surfaced by Drizzle.
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("unique") || message.includes("duplicate")) {
        const which = message.includes("slug") ? "slug_conflict" : "name_conflict";
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
```

- [ ] **Step 2: Add the approve endpoint.**

Append:

```ts
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
```

- [ ] **Step 3: Add the reject endpoint.**

Append:

```ts
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
```

- [ ] **Step 4: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin/vocab/byKindId.ts
git commit -m "feat(api): vocab edit/approve/reject endpoints"
```

---

## Task 8: API — merge endpoint

**Files:**
- Modify: `packages/api/src/routes/admin/vocab/byKindId.ts`

- [ ] **Step 1: Add the merge endpoint.**

Append to the imports at the top:

```ts
import { executeVocabMerge } from "../../../lib/admin/vocabMerge";
```

Append at the bottom:

```ts
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
```

- [ ] **Step 2: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin/vocab/byKindId.ts
git commit -m "feat(api): vocab merge endpoint"
```

---

## Task 9: Frontend — unified queue page

**Files:**
- Create: `apps/admin/src/pages/vocab/VocabQueuePage.tsx`

- [ ] **Step 1: Write the queue page.**

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

type VocabKind = "disciplines" | "skills" | "languages";
type SortMode = "newest" | "most-used" | "strongest-match";

interface QueueRow {
  kind: VocabKind;
  id: string;
  name: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  suggestedBy: { id: string; displayName: string | null; email: string } | null;
  usageCount: number;
  similarApproved: { id: string; name: string; score: number } | null;
}

interface QueueResponse {
  ok: true;
  rows: QueueRow[];
  counts: { total: number; withUsages: number; withStrongMatch: number };
}

export function VocabQueuePage() {
  const apiFetch = useApi();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const kind = (params.get("kind") ?? "all") as VocabKind | "all";
  const sort = (params.get("sort") ?? "newest") as SortMode;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams({ sort });
    if (kind !== "all") sp.set("kind", kind);
    try {
      const res = await apiFetch(`/admin/vocab/queue?${sp}`);
      if (!res.ok) {
        setError(`/admin/vocab/queue responded ${res.status}`);
        return;
      }
      setData((await res.json()) as QueueResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [apiFetch, kind, sort]);

  useEffect(() => { void load(); }, [load]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "all" && value !== "newest") next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Vocab queue</p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        Pending review.
      </h2>
      {data && (
        <p className="admin-classification mb-8">
          {data.counts.total} pending · {data.counts.withUsages} with usages ·{" "}
          {data.counts.withStrongMatch} with strong match
        </p>
      )}

      <div className="flex items-baseline gap-6 mb-6">
        <select
          value={kind}
          onChange={(e) => setParam("kind", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="all">All kinds</option>
          <option value="disciplines">Disciplines</option>
          <option value="skills">Skills</option>
          <option value="languages">Languages</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none ml-auto"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="newest">Newest first</option>
          <option value="most-used">Most used first</option>
          <option value="strongest-match">Strongest match first</option>
        </select>
      </div>

      <div>
        <div
          className="grid grid-cols-[3rem_8rem_minmax(0,1fr)_5rem_minmax(0,1fr)_minmax(0,1fr)_6rem_auto] gap-6 items-baseline py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--admin-ink)", borderBottom: "1px solid var(--admin-rule)" }}
        >
          <span className="admin-classification">#</span>
          <span className="admin-classification">Kind</span>
          <span className="admin-classification">Name</span>
          <span className="admin-classification text-right">Usage</span>
          <span className="admin-classification">Similar</span>
          <span className="admin-classification">Suggested by</span>
          <span className="admin-classification text-right">Proposed</span>
          <span className="admin-classification text-right">Action</span>
        </div>
        {data?.rows.map((r, i) => (
          <Link
            key={`${r.kind}-${r.id}`}
            to={`/vocab/${r.kind}/${r.id}`}
            className="grid grid-cols-[3rem_8rem_minmax(0,1fr)_5rem_minmax(0,1fr)_minmax(0,1fr)_6rem_auto] gap-6 items-baseline py-3 text-[14px] transition-colors hover:bg-[var(--admin-paper-edge)]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            <span className="admin-marginalia truncate">{r.kind}</span>
            <span className="truncate" style={{ color: "var(--admin-ink)" }}>{r.name}</span>
            <span
              className="text-right tabular-nums"
              style={{
                color:
                  r.usageCount > 0
                    ? "var(--admin-ink)"
                    : "var(--admin-marginalia)",
              }}
            >
              {r.usageCount}
            </span>
            <span className="truncate text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
              {r.similarApproved ? (
                <>
                  <span style={{ color: r.similarApproved.score >= 80 ? "var(--admin-ribbon)" : "var(--admin-ink-medium)" }}>
                    {r.similarApproved.name}
                  </span>
                  <span className="admin-marginalia ml-2 tabular-nums">{r.similarApproved.score}</span>
                </>
              ) : (
                "—"
              )}
            </span>
            <span className="truncate text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
              {r.suggestedBy?.displayName ?? r.suggestedBy?.email ?? "—"}
            </span>
            <span className="admin-marginalia text-right whitespace-nowrap tabular-nums">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
            <span className="admin-classification text-right" style={{ color: "var(--admin-ribbon)" }}>
              Review →
            </span>
          </Link>
        ))}
        {data && data.rows.length === 0 && !loading && (
          <p className="py-6 text-center italic" style={{ color: "var(--admin-marginalia)" }}>
            Nothing pending. Curation queue is clear.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add apps/admin/src/pages/vocab/VocabQueuePage.tsx
git commit -m "feat(admin): unified vocab queue page"
```

---

## Task 10: Frontend — per-table list page

**Files:**
- Create: `apps/admin/src/pages/vocab/VocabListPage.tsx`

- [ ] **Step 1: Write the list page.**

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

type VocabKind = "disciplines" | "skills" | "languages";
type StatusFilter = "pending" | "approved" | "rejected" | "all";

interface ListRow {
  kind: VocabKind;
  id: string;
  name: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  suggestedBy: { id: string; displayName: string | null; email: string } | null;
  usageCount: number;
}

interface ListResponse {
  ok: true;
  rows: ListRow[];
}

const KIND_LABELS: Record<VocabKind, string> = {
  disciplines: "Disciplines",
  skills: "Skills",
  languages: "Languages",
};

export function VocabListPage() {
  const apiFetch = useApi();
  const { kind } = useParams<{ kind: VocabKind }>();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = (params.get("status") ?? "pending") as StatusFilter;
  const q = params.get("q") ?? "";

  const load = useCallback(async () => {
    if (!kind) return;
    setError(null);
    const sp = new URLSearchParams({ status });
    if (q) sp.set("q", q);
    try {
      const res = await apiFetch(`/admin/vocab/${kind}?${sp}`);
      if (!res.ok) {
        setError(`/admin/vocab/${kind} responded ${res.status}`);
        return;
      }
      setData((await res.json()) as ListResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, kind, status, q]);

  useEffect(() => { void load(); }, [load]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "pending") next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  if (!kind || !["disciplines", "skills", "languages"].includes(kind))
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        Unknown vocab kind.
      </p>
    );
  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Vocab · {KIND_LABELS[kind]}</p>
      <h2 className="admin-display mb-6" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {KIND_LABELS[kind]}.
      </h2>

      <div className="flex items-baseline gap-6 mb-6">
        <input
          type="text"
          placeholder="Search by name…"
          value={q}
          onChange={(e) => setParam("q", e.target.value)}
          className="font-mono text-xs px-3 py-1.5 flex-1 max-w-md"
          style={{
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--admin-rule)",
            color: "var(--admin-ink)",
            outline: "none",
          }}
        />
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div>
        <div
          className="grid grid-cols-[3rem_minmax(0,1fr)_5rem_8rem_minmax(0,1fr)_6rem_auto] gap-6 items-baseline py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--admin-ink)", borderBottom: "1px solid var(--admin-rule)" }}
        >
          <span className="admin-classification">#</span>
          <span className="admin-classification">Name</span>
          <span className="admin-classification text-right">Usage</span>
          <span className="admin-classification">Status</span>
          <span className="admin-classification">Suggested by</span>
          <span className="admin-classification text-right">Proposed</span>
          <span className="admin-classification text-right">Action</span>
        </div>
        {data?.rows.map((r, i) => (
          <Link
            key={r.id}
            to={`/vocab/${r.kind}/${r.id}`}
            className="grid grid-cols-[3rem_minmax(0,1fr)_5rem_8rem_minmax(0,1fr)_6rem_auto] gap-6 items-baseline py-3 text-[14px] transition-colors hover:bg-[var(--admin-paper-edge)]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            <span className="truncate" style={{ color: "var(--admin-ink)" }}>{r.name}</span>
            <span
              className="text-right tabular-nums"
              style={{ color: r.usageCount > 0 ? "var(--admin-ink)" : "var(--admin-marginalia)" }}
            >
              {r.usageCount}
            </span>
            <span className="admin-marginalia">{r.status}</span>
            <span className="truncate text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
              {r.suggestedBy?.displayName ?? r.suggestedBy?.email ?? "—"}
            </span>
            <span className="admin-marginalia text-right whitespace-nowrap tabular-nums">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
            <span className="admin-classification text-right" style={{ color: "var(--admin-ribbon)" }}>
              Open →
            </span>
          </Link>
        ))}
        {data && data.rows.length === 0 && (
          <p className="py-6 text-center italic" style={{ color: "var(--admin-marginalia)" }}>
            No entries.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add apps/admin/src/pages/vocab/VocabListPage.tsx
git commit -m "feat(admin): per-table vocab list page"
```

---

## Task 11: Frontend — detail page

**Files:**
- Create: `apps/admin/src/pages/vocab/VocabDetailPage.tsx`

The detail page is the page that gets clicked into from the queue. It has three sections — Identity (editable name+slug when pending), Curation (approve/reject/merge buttons), and Audit (recent rows). Merge is a single confirm-on-click — no wizard. Merge picker is a combobox prefilled with the similarity-ranked candidates.

- [ ] **Step 1: Write the detail page.**

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";

type VocabKind = "disciplines" | "skills" | "languages";

interface DetailResponse {
  ok: true;
  row: {
    kind: VocabKind;
    id: string;
    name: string;
    slug: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    suggestedBy: { id: string; displayName: string | null; email: string } | null;
    usageCount: number;
  };
  similarApproved: Array<{ id: string; name: string; score: number }>;
  recentAudit: Array<{
    id: string;
    actorId: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }>;
}

export function VocabDetailPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const { kind, id } = useParams<{ kind: VocabKind; id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [mergeTarget, setMergeTarget] = useState<string>("");

  const load = useCallback(async () => {
    if (!kind || !id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/vocab/${kind}/${id}`);
      if (!res.ok) {
        setError(`/admin/vocab/${kind}/${id} responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as DetailResponse;
      setData(body);
      setDraftName(body.row.name);
      setDraftSlug(body.row.slug);
      setMergeTarget(body.similarApproved[0]?.id ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, kind, id]);

  useEffect(() => { void load(); }, [load]);

  async function saveIdentity() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const body: Record<string, string> = {};
      if (draftName !== data.row.name) body.name = draftName;
      if (draftSlug !== data.row.slug) body.slug = draftSlug;
      if (Object.keys(body).length === 0) {
        setActing(false);
        return;
      }
      const res = await apiFetch(`/admin/vocab/${data.row.kind}/${data.row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function approve() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(
        `/admin/vocab/${data.row.kind}/${data.row.id}/approve`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function reject() {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(
        `/admin/vocab/${data.row.kind}/${data.row.id}/reject`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          message?: string;
          error?: string;
          usageCount?: number;
        } | null;
        setActionError(
          err?.error === "has_usages"
            ? `Cannot reject: ${err.usageCount} usage(s). Use merge instead.`
            : err?.message ?? `POST responded ${res.status}`
        );
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function merge() {
    if (!data || !mergeTarget) return;
    if (!window.confirm(`Merge "${data.row.name}" into the canonical term?`)) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(
        `/admin/vocab/${data.row.kind}/${data.row.id}/merge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId: mergeTarget }),
        }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setActionError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      // Source row is now gone — navigate back to the queue.
      navigate("/vocab", { replace: true });
    } finally {
      setActing(false);
    }
  }

  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );
  if (!data) return <p className="admin-marginalia">Loading…</p>;

  const isPending = data.row.status === "pending";
  const shortName = data.row.name.replace(/[^a-zA-Z0-9]+/g, "").length <= 2;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">
        US-RSE · Admin · Vocab · {data.row.kind}
      </p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {data.row.name}
      </h2>
      <div className="flex items-center gap-4 mb-10">
        <span className="admin-classification">{data.row.status}</span>
        <span className="admin-classification" style={{ color: "var(--admin-marginalia)" }}>
          {data.row.kind}
        </span>
        <span className="admin-classification" style={{ color: "var(--admin-marginalia)" }}>
          {data.row.usageCount} usage{data.row.usageCount === 1 ? "" : "s"}
        </span>
      </div>

      {actionError && (
        <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {actionError}
        </p>
      )}

      {/* Identity */}
      <section className="mb-10 max-w-2xl">
        <p className="admin-classification mb-4">Identity</p>
        <div className="space-y-6">
          <EditorialInput
            label="Name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            readOnly={!isPending}
            hint={shortName ? "Short term — exact name match recommended over similarity-based merge." : undefined}
          />
          <EditorialInput
            label="Slug"
            value={draftSlug}
            onChange={(e) => setDraftSlug(e.target.value)}
            readOnly={!isPending}
            hint="Auto-derives from name when left empty in PATCH."
          />
          {isPending && (
            <button
              type="button"
              onClick={() => void saveIdentity()}
              disabled={acting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
            >
              {acting ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
      </section>

      {/* Curation */}
      <section className="mb-10 max-w-2xl">
        <p className="admin-classification mb-4">Curation</p>
        <div className="flex flex-wrap items-baseline gap-6">
          <button
            type="button"
            onClick={() => void approve()}
            disabled={acting || data.row.status === "approved"}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--color-success-700)" }}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => void reject()}
            disabled={acting || !isPending}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--color-danger-700)" }}
          >
            Reject
          </button>
        </div>
        <div className="mt-6">
          <label className="block mb-2">
            <span className="admin-classification">Merge into…</span>
          </label>
          <div className="flex items-baseline gap-4">
            <select
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
              className="bg-transparent border-0 outline-none py-1.5 flex-1 max-w-md"
              style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)", fontSize: "15px" }}
            >
              <option value="">— select a target —</option>
              {data.similarApproved.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (score {s.score})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void merge()}
              disabled={acting || !mergeTarget}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
            >
              {acting ? "Merging…" : "Merge →"}
            </button>
          </div>
          {data.similarApproved.length === 0 && (
            <p className="mt-3 text-[13px] italic" style={{ color: "var(--admin-marginalia)" }}>
              No similar approved terms found. Use search on the per-table page if you know the canonical name.
            </p>
          )}
        </div>
      </section>

      {/* Audit */}
      <section className="max-w-3xl">
        <p className="admin-classification mb-4">Audit</p>
        {data.recentAudit.length === 0 ? (
          <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No audit entries.</p>
        ) : (
          <ol style={{ borderTop: "1px solid var(--admin-ink)" }}>
            {data.recentAudit.map((a, i) => (
              <li
                key={a.id}
                className="py-3 grid grid-cols-[3rem_minmax(8rem,auto)_minmax(0,1fr)_minmax(7rem,auto)] gap-6 items-baseline text-[13px]"
                style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
              >
                <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
                <span className="font-mono whitespace-nowrap" style={{ color: "var(--admin-ink-medium)" }}>
                  {new Date(a.createdAt).toLocaleString()}
                </span>
                <span className="font-mono" style={{ color: "var(--admin-ink)" }}>{a.action}</span>
                <span className="admin-marginalia text-right">{a.targetType}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="mt-10">
        <Link to="/vocab" className="admin-classification" style={{ color: "var(--admin-ribbon)" }}>
          ← Back to queue
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + build smoke.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
npm run build --workspace=@us-rse/admin
```

Both must pass.

- [ ] **Step 3: Commit.**

```bash
git add apps/admin/src/pages/vocab/VocabDetailPage.tsx
git commit -m "feat(admin): vocab detail page with approve/reject/merge actions"
```

---

## Task 12: Route wiring + Playwright smoke

**Files:**
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/tests/admin-foundation.spec.ts`

- [ ] **Step 1: Wire the routes.**

In `apps/admin/src/App.tsx`, add the imports near the other page imports:

```tsx
import { VocabDetailPage } from "./pages/vocab/VocabDetailPage";
import { VocabListPage } from "./pages/vocab/VocabListPage";
import { VocabQueuePage } from "./pages/vocab/VocabQueuePage";
```

Inside the `<Route element={<AdminShell ... />}>` block, find the existing `<Route path="vocab" element={<ComingSoon ... />} />` line. Replace it with the three new routes — order matters: the most specific (`vocab/:kind/:id`) first, then the kind list, then the queue last:

```tsx
<Route path="vocab/:kind/:id" element={<VocabDetailPage />} />
<Route path="vocab/:kind" element={<VocabListPage />} />
<Route path="vocab" element={<VocabQueuePage />} />
```

- [ ] **Step 2: Extend the Playwright smoke.**

Append to `apps/admin/tests/admin-foundation.spec.ts`:

```ts
test("unauthenticated visit to /vocab triggers sign-in flow", async ({ page }) => {
  await page.goto("/vocab");
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});

test("unauthenticated visit to /vocab/skills triggers sign-in flow", async ({ page }) => {
  await page.goto("/vocab/skills");
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});
```

- [ ] **Step 3: Typecheck + build + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
npm run build --workspace=@us-rse/admin
git add apps/admin/src/App.tsx apps/admin/tests/admin-foundation.spec.ts
git commit -m "feat(admin): wire vocab routes + Playwright smoke for /vocab"
```

Expected typecheck: 5/5 successful. Expected build: clean.

Optional sanity-check that Playwright sees both new tests:

```bash
cd apps/admin && npx playwright test --list 2>&1 | tail -10
```

Should show 6 tests total (4 from prior identity work + 2 new).

---

## Wrap

- [ ] **Step 1: Final typecheck + tests.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck && (cd packages/api && npm test)
```

Expected: 5/5 typecheck successful + vitest green (existing 53 tests + ~14 new across vocabSimilarity, vocabTables, policies).

- [ ] **Step 2: Push and open PR.**

```bash
git push -u origin cdcore09/admin-vocab
gh pr create --base cdcore09/site-redesign --title "feat(admin): vocab curation queue" --body "$(cat <<'EOF'
Closes #1958.

Spec: docs/superpowers/specs/2026-05-12-vocab-curation-queue-design.md
Plan: docs/superpowers/plans/2026-05-12-vocab-curation-queue-implementation.md

## Summary

- New canApproveVocab policy (staff+)
- Vocab similarity library (length-scaled Levenshtein, single anchor)
- Vocab merge transaction library (one-shot repoint + drop + delete)
- /api/admin/vocab/* sub-app: queue, per-table list, detail, edit, approve, reject, merge
- /vocab/* admin pages: unified queue, per-table list, polymorphic detail
- Playwright smoke extended (4 → 6 cases)

No migration — all three vocab tables already carried the needed
columns. No reversibility — vocab merge is non-reversible from row
state alone; audit log retains the action.

## Test plan
- [ ] Sign in as super_admin
- [ ] Browse /vocab — see pending pairs, similar-match hints
- [ ] Filter by kind, sort by usage / strongest match
- [ ] Open a pending discipline, edit name + slug, save
- [ ] Approve a pending term — verify audit row
- [ ] Reject a pending term with zero usages — verify audit row
- [ ] Try to reject a pending term with usages — confirm 409
- [ ] Merge a pending typo into the canonical term — verify user join rows repointed + audit row
EOF
)"
```

**IMPORTANT:** No `Co-Authored-By: Claude` or any AI attribution trailer/footer in the commit messages OR the PR body.

- [ ] **Step 3: Update the issue.**

After merge, comment on #1958 with the merge commit SHA and check off the requirements.

---

## Summary

| Phase | Tasks |
|---|---|
| Backend libraries | 1–4 (policy, similarity, dispatch helper, merge transaction) |
| Backend routes | 5–8 (queue, list, detail, edit/approve/reject, merge) |
| Frontend | 9–11 (queue page, list page, detail page) |
| Wiring + tests | 12 (App.tsx routes, Playwright smoke) |
| Wrap | typecheck, push, PR |

12 tasks. No migration. Reuses `normalizeDisplayName` from the user-duplicate work. Reuses the editorial-aligned design primitives (rounded purple buttons, white background, Arabic numerals).

## Self-review notes

Spec coverage:

- Unified queue across the three tables → Task 5
- Per-table list views → Task 5 (`GET /:kind`) + Task 10 (page)
- Detail view with accept/reject/merge → Tasks 6, 7, 8 (API) + Task 11 (page)
- Name + slug edit before approval → Task 7 (PATCH)
- Merge action repoints user join-table rows → Task 4 (library) + Task 8 (route)
- canApproveVocab (staff+) → Task 1
- Near-duplicate hints inline on the queue → Tasks 2 (library) + 5 (route) + 9 (page)
- No new schema; no migration → confirmed (verified Drizzle tables have all needed columns)
- Playwright smoke extension → Task 12

Bulk-approve intentionally not implemented (per spec, deferred).

Reversibility intentionally not implemented (per spec, vocab merge is non-reversible).

No placeholders remain. All endpoint shapes, all SQL queries, all React components are spelled out concretely.
