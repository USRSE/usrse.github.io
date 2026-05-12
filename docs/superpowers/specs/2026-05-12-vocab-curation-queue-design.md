# Vocab Curation Queue — Design Spec

**Date:** 2026-05-12
**Tracker:** [#1958](https://github.com/USRSE/usrse.github.io/issues/1958) — `feat(admin): vocab curation queue`
**Adjacent work:** organization curation is owned by a parallel admin subsystem (logos, memberships, sponsorships); orgs are out of scope here.
**Branch (planned):** `cdcore09/admin-vocab`

## Goal

Give staff and super-admins a single workflow for approving, rejecting, and merging the three user-proposable vocabularies — **disciplines**, **skills**, **languages** — so the dossier autocomplete lists stay clean as members propose new terms.

## Non-goals

- **Organizations.** They share the `status` and `suggestedBy` columns but carry logos, URLs, sponsorships, and an existing `mergedIntoId` reversible-merge architecture. Org curation lives in its own subsystem.
- **Pronouns / degree types / engagement types / career stages / countries.** These are staff-maintained reference data, not user-proposable. They don't appear in the queue.
- **Bulk-approve.** Deferred. The queue's per-row similar-term hint makes single-row triage fast enough; we add bulk only if admins ask for it after a week of use.
- **Reversible merge.** Vocab merge is non-reversible from row state alone — the source row is deleted in the same transaction that repoints user join rows. The audit log retains the action; if a mistake happens, the admin re-adds the term and re-suggests it on affected dossiers manually. Vocab is low-stakes, high-volume — this is the right trade.

## Architecture overview

One Hono sub-app at `/api/admin/vocab/*`, gated by a new `canApproveVocab` policy (staff+, parallel to `canEditMembers`). One React route tree at `/vocab/*` in the admin app, replacing the existing `ComingSoon` stub at sidebar section `02 Vocab`. **No new database tables, no migrations** — all three vocab tables already have `status` (`pending | approved | rejected`) and `suggestedBy → users.id` columns.

## Data model

The three tables in scope (`skills`, `disciplines`, `languages`) are structurally identical:

```ts
type VocabRow = {
  id: string;            // uuid pk
  name: string;          // unique
  slug: string;          // unique
  status: "pending" | "approved" | "rejected";
  suggestedByUserId: string | null;
  createdAt: Date;
};

type VocabKind = "disciplines" | "skills" | "languages";
```

A polymorphic helper `vocabTableFor(kind)` returns the right Drizzle table reference, the matching join table (`user_<kind>`), and the FK column name (`<kind>_id`) so endpoints don't have to switch-case repeatedly.

Each of the three join tables (`user_disciplines`, `user_skills`, `user_languages`) has composite PK `(user_id, <kind>_id)` and a FK to the vocab row.

## API surface

All endpoints under `/api/admin/vocab/*`, all gated by `canApproveVocab` (staff+) on the parent router.

### `GET /api/admin/vocab/queue` — unified pending queue

Returns all `status='pending'` rows from disciplines/skills/languages unioned, each row enriched with:

```ts
type QueueRow = VocabRow & {
  kind: VocabKind;
  suggestedBy: { id: string; displayName: string | null; email: string } | null;
  usageCount: number;                    // count of user_<kind> rows pointing at this term
  similarApproved: {                     // best canonical match in the same table
    id: string;
    name: string;
    score: 100 | 80 | 50 | 30;
  } | null;
};
```

Query params:

- `sort` = `newest` (default) | `most-used` | `strongest-match`
- `kind` = `all` (default) | one of the three (filters the union)
- `limit` (default 50, max 200), `cursor`

### `GET /api/admin/vocab/:kind` — per-table list

Same row shape as the unified queue, scoped to one table. Adds:

- `status` filter = `pending` (default) | `approved` | `rejected` | `all`
- search `q` (ILIKE on `name`)

### `GET /api/admin/vocab/:kind/:id` — detail

```ts
{
  ok: true;
  row: QueueRow;
  similarApproved: Array<{ id: string; name: string; score: number }>; // top 10
  recentAudit: AuditRow[];                                              // last 20
}
```

### `PATCH /api/admin/vocab/:kind/:id` — edit before approval

- Body: `{ name?: string; slug?: string }`
- Slug auto-derives from `name` when omitted; explicit `slug` overrides the derivation.
- Allowed only when `status='pending'`.
- 409 `{ error: "name_conflict" | "slug_conflict" }` if either unique index would collide.

### State machine

The four mutations operate on this state machine:

```
       Approve              Reject (only if usageCount = 0)
pending ───────► approved   pending ───────► rejected
                                   ▲
       Approve                     │
rejected ───────► approved         │ (no direct re-open;
                                    re-approve via Approve instead)

       Merge (source: any status; target: approved)
source ─────────► [source row deleted; user joins repointed/dropped]
```

### `POST /api/admin/vocab/:kind/:id/approve`

- Source state: `pending` or `rejected`. Sets `status='approved'`.
- 409 `{ error: "already_approved" }` if already approved (not idempotent — explicit so an admin who re-approves by mistake gets a clear signal).
- Audit: `auditAction: "vocab.approve"`, target type = `kind`, payload = `{ name, slug, fromStatus }`.

### `POST /api/admin/vocab/:kind/:id/reject`

- Source state: `pending` only. Other states return 409 `{ error: "invalid_source_status" }`.
- Refuses with **409 `{ error: "has_usages", usageCount }`** if any `user_<kind>` row references the term. Response message points the admin at the merge action.
- Sets `status='rejected'`.
- Audit: `auditAction: "vocab.reject"`, payload = `{ name, slug }`.

### `POST /api/admin/vocab/:kind/:id/merge`

- Source state: any (`pending`, `approved`, or `rejected`). Merging two approved terms is a real workflow when one turns out to be a duplicate of the other.
- Body: `{ targetId: string }` — must be an approved term in the same table.
- Validates: source ≠ target, target exists with `status='approved'`.
- One `db.transaction(...)`:
  1. `UPDATE user_<kind> SET <kind>_id = target WHERE <kind>_id = source AND NOT EXISTS (SELECT 1 FROM user_<kind> WHERE user_id = THIS.user_id AND <kind>_id = target)` — repoint where no conflict.
  2. `DELETE FROM user_<kind> WHERE <kind>_id = source` — drop rows where the user already had the canonical term.
  3. `DELETE FROM <kind> WHERE id = source` — remove the merged row.
- Audit: `auditAction: "vocab.merge"`, target type = `kind`, target id = `target.id`, payload = `{ sourceId, sourceName, targetName, repointed: N, dropped: M }`.

## Similar-term detection

Mirrors the user-duplicate-detection helper's shape, simpler signal set.

**Normalization** — same `normalizeDisplayName(s)` helper extracted from `duplicateDetection.ts`: NFKD + lowercase + strip non-alphanumerics. `"JavaScript"` → `"javascript"`, `"C++"` → `"c"`, `"  Rust "` → `"rust"`.

**Scoring** — for each pending term P, fetch all approved terms in the same table and rank:

| Condition | Score |
|---|---|
| `normalize(P.name) === normalize(A.name)` | 100 |
| Levenshtein distance ≤ length-scaled threshold | 80 / 50 / 30 |

**Length-scaled distance thresholds:**

- normalized length ≤ 8 chars: only distance ≤ 1 qualifies (score 80)
- 9–15 chars: distance ≤ 2 (80 for d=1, 50 for d=2)
- 16+ chars: distance ≤ 3 (80 for d=1, 50 for d=2, 30 for d=3)

Best match (if score ≥ 30) attached to each queue row's `similarApproved`. Detail page returns the full top-10 sorted list.

**Short-name caveat:** when `normalize(P.name).length ≤ 2`, the detail page renders a warning: "Short term — exact name match recommended over similarity-based merge." Admins handle `C++` / `C#` / `R` / `Go` etc. via exact name search, not the similarity surface.

**Performance:** ~300–500 approved terms per table, scoring is microseconds. Computed on demand per request, no precomputation table.

## Policy

New policy `canApproveVocab(actor): boolean` returns `actor.systemTier >= 1` (staff+). Single policy gates all four mutating endpoints and the queue/list/detail reads. Mirrors the shape of `canEditMembers`.

The full pattern:

```ts
// packages/api/src/lib/policies/canApproveVocab.ts
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

## Frontend

Three React pages under `/vocab/*`, all using the design-system primitives we landed in the identity work (white background, cool-toned palette, rounded purple primaries, two-digit Arabic numerals).

### `/vocab` — unified queue (primary surface)

- Eyebrow: `US-RSE · Admin · Vocab queue`
- Heading: `Pending review.`
- Counts strip: `N pending · M with usages · K with strong similar match`
- Filters row: kind selector (`all` / disciplines / skills / languages), sort selector (`newest` / `most-used` / `strongest-match`)
- Register table, one row per pending term:

  | column | content |
  |---|---|
  | # | queue position (`001`...) |
  | kind | classification tag (`disciplines` / `skills` / `languages`) |
  | name | bold term |
  | usage | usage count (`0` muted, `≥1` highlighted) |
  | similar | similarApproved chip with score, or `—` |
  | suggested by | display name + email (truncated) |
  | proposed | relative date (`3d ago`) |
  | action | `Review →` link |

- Row click → detail page

### `/vocab/disciplines`, `/vocab/skills`, `/vocab/languages` — per-table list

- Same row layout as the unified queue, plus a `status` toggle (default `pending`; can show `approved` / `rejected` / `all`).
- Approved rows expose only the read-only inspector and a `merge into…` action (no approve/reject buttons).
- Rejected rows are fully read-only.

### `/vocab/:kind/:id` — detail page

- Eyebrow: `US-RSE · Admin · Vocab · <kind>`
- Heading: term name (large)
- Status + kind tags below the heading

Three sections:

1. **Identity** — name + slug edit form (`EditorialInput` components). Disabled when status ≠ pending. Save button: `Save changes` (purple primary). Shows the short-name warning when applicable.
2. **Curation** — primary actions:
   - `Approve` (green primary) — disabled when status ≠ pending
   - `Reject` (red ghost) — shows `usageCount` inline; click is blocked with a toast pointing at the merge action when `usageCount > 0`
   - `Merge into…` — opens a search-and-pick combobox prefilled with the similarity-ranked candidates. Single confirm-on-click; no wizard.
3. **Audit** — last 20 audit log rows referencing this row, mirroring the member-detail Audit tab pattern.

### Sidebar wiring

The existing `02 Vocab` ComingSoon stub is replaced by a real route. Sidebar item already exists in `useNavSections.ts`; this work just plugs in the routes.

## Testing

### Vitest

- `normalizeDisplayName` already covered in `duplicateDetection.test.ts`. Re-export and re-use; no new tests needed for normalization.
- New tests in `packages/api/src/lib/admin/vocabMerge.test.ts`:
  - `findSimilarApproved(pending, approved[])` returns sorted candidates with correct scores at each length-scaled threshold.
  - `findSimilarApproved` excludes the pending term itself and excludes non-approved.
- New tests for the merge transaction helper (`executeVocabMerge`): conflict-detection logic (mock the join-table rows, assert repoint vs drop counts).

### Playwright

Extend the existing `admin-foundation.spec.ts` with:

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

## Deliverables

1. New policy: `canApproveVocab`
2. New library: `packages/api/src/lib/admin/vocabSimilarity.ts` (`findSimilarApproved`, score helper)
3. New library: `packages/api/src/lib/admin/vocabMerge.ts` (`executeVocabMerge` transaction helper)
4. New API routes: `packages/api/src/routes/admin/vocab/index.ts` (queue + list endpoints), `packages/api/src/routes/admin/vocab/byKindId.ts` (detail + mutations)
5. New React pages: `apps/admin/src/pages/vocab/VocabQueuePage.tsx`, `apps/admin/src/pages/vocab/VocabListPage.tsx`, `apps/admin/src/pages/vocab/VocabDetailPage.tsx`
6. Replace ComingSoon stub for `02 Vocab` in `apps/admin/src/App.tsx`
7. Extend `apps/admin/tests/admin-foundation.spec.ts` with two new smoke cases
8. No migration; no schema changes

## Risks

- **Short-name false positives.** The normalizer collapses `C++` and `C#` to `c`. The detail-page warning handles this; admins must use exact-name search for these cases. Mitigated; not eliminated.
- **Reject blocked by usageCount creates a workflow stub.** If a pending term has usages but no good canonical to merge into, the admin can't clear it. Mitigation: in v1 the admin can approve the term as canonical, or coordinate manually with the proposer. If this becomes painful, add a "delete user usages and reject" admin action under super_admin gate.
- **Similar-term detection runs on every queue load.** At ~500 approved terms × ~50 pending × 3 tables = ~75k comparisons per load. Each comparison is a Levenshtein over short strings, microseconds. Acceptable; no caching needed.
- **No reversibility means merge mistakes are sticky.** Mitigation: the merge endpoint's audit payload records the source name, target id, and the repoint/drop counts. Recovery is "re-add the term, re-suggest on the affected dossiers" — a manual but tractable workflow.

## Decisions made during brainstorming

1. **Merge architecture: hybrid → simplified.** Originally proposed hybrid (orgs reversible, slim tables simple). Once orgs were excluded from scope, simplified to uniform "delete source + repoint user joins" across all three in-scope tables.
2. **Orgs out of scope.** Parallel org admin subsystem owns org curation.
3. **Reject blocked when `usageCount > 0`.** Forces deliberate handling; prevents silent data loss.
4. **Queue annotates similar terms inline** (not just on detail page) so triage stays in the list view.
5. **Bulk-approve deferred** until per-row triage proves too slow in real use.
6. **Polymorphic queue endpoint** with `kind` discriminator (vs. per-table fan-fetch). Cross-table sort lives in SQL.
7. **No merge wizard.** Vocab merges are low-stakes enough for single confirm-on-click.
8. **No schema migration.** All three tables already carry the needed columns.
