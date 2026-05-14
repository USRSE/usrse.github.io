# Admin Groups Subsystem — Design Spec

**Date:** 2026-05-14
**Tracker:** [#1960](https://github.com/USRSE/usrse.github.io/issues/1960) — `feat(admin): groups — working, affinity, regional`
**Adjacent work:** the org subsystem (#1959) is already shipped; this work mirrors its admin-list / detail-editor shape but adds the public-side refactor since the existing group pages are hardcoded.
**Branch (planned):** `cdcore09/admin-groups`

## Goal

Ship lifecycle management for the three group flavors — working, affinity, regional — across both the admin app and the public site. Staff and super-admins get a global list + editor; group chairs get a scoped surface for the group(s) they chair; everyone else sees the public list and per-group pages. Group edits flow through to the public site immediately via DB-driven public pages, replacing the current hardcoded group lists.

## Non-goals

- **Self-service group membership.** The "join this group" affordance for regular members is its own future workflow (likely on the public site, not the admin). This work surfaces the data the future flow will write against, but doesn't build the join UX.
- **Per-row drafts.** No parallel `_draft` column scheme. Edits land on the live row immediately; `is_published` is the single visibility gate. Admins who want to stage major changes can flip `is_published=false`, edit, then publish — the brief flicker is acceptable.
- **Per-group nested role hierarchy.** Working groups don't have sub-groups, project leads, etc. Just `member` / `chair` / `co_chair`.
- **Notification when chair role changes.** Out of scope for v1. Audit log captures the change; people can find out the normal way.
- **Member roster management beyond chairs.** Adding/removing regular members is not in v1. The CSV seeds initial members; future growth happens via the (yet-to-be-built) self-service join flow.

## Architecture overview

One Hono sub-app at `/api/admin/groups/*` for the staff-facing surface, plus a **public** `GET /api/groups/*` endpoint with no auth that the refactored public pages consume. The admin sub-app applies `canEditGroup(actor, { groupId })` at the route level (existing policy, scopes to chairs and staff). Group creation gets a new `canCreateGroup(actor)` policy (super_admin only).

Frontend additions:
- Admin app: `/groups` (list) + `/groups/:id` (detail/editor with four tabs) — replaces the existing `04 Groups` ComingSoon stub
- Public app: refactor `WorkingGroupsPage` and `AffinityGroupsPage` to fetch from `/api/groups`; new `/community/groups/:id` per-group page; new `RegionalGroupsPage` stub (zero rows expected at first)
- 301 redirect from the existing `/community/calls` route to the Community Calls group's permalink (`/community/groups/<id>`)

One migration adds four columns to the existing `groups` table; no new tables. One standalone TypeScript script handles the seed ingest with `--dry-run` (default) and `--commit` flags.

## Schema additions

Migration on the existing `groups` table:

```sql
ALTER TABLE "groups" ADD COLUMN "slack_channel" text;
ALTER TABLE "groups" ADD COLUMN "charter" text;
ALTER TABLE "groups" ADD COLUMN "links" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "groups" ADD COLUMN "is_published" boolean NOT NULL DEFAULT false;

CREATE INDEX "groups_published_idx"
  ON "groups" ("id")
  WHERE is_active = true AND is_published = true AND deleted_at IS NULL;
```

Column semantics:

| Column | Type | Purpose |
|---|---|---|
| `slack_channel` | `text` (nullable) | Bare channel name, no `#`. Surfaced on the public group page and admin detail. |
| `charter` | `text` (nullable, markdown) | Long-form purpose/governance text. Maps from CSV "Purpose" for working groups. Rendered on the public per-group page. |
| `links` | `jsonb` (default `[]`) | Array of `{label: string, url: string}`. Empty after ingest; admins curate. Rendered on public per-group page. |
| `is_published` | `boolean` (default `false`) | Independent of `is_active`. Default `false` so future admin-created groups start hidden; the CSV ingest INSERTs with `true` since the imported groups already exist publicly. |

Convention enforced by the public API + admin UI:

- `description` = short one-sentence summary, used on public list cards
- `charter` = long-form markdown, used on public per-group page

The partial index `groups_published_idx` covers the hot path for the public `GET /api/groups` endpoint (`WHERE is_active AND is_published AND deleted_at IS NULL`). Cheap to maintain (low write rate, small table).

Drizzle declarations in `packages/api/src/db/schema/groups.ts` mirror the migration with matching types and defaults.

No other tables touched. `group_memberships` already models chair / co-chair / member roles correctly via the `groupMembershipRole` enum.

## Policies

Two policies cover this subsystem:

```ts
// packages/api/src/lib/policies/canCreateGroup.ts (new)
export const canCreateGroup = (a: ActorContext): boolean =>
  a.systemTier >= 2;

// packages/api/src/lib/policies/canEditGroup.ts (existing — already in place)
export const canEditGroup = (
  a: ActorContext,
  scope: { groupId: string }
): boolean => a.systemTier >= 1 || a.chairedGroupIds.has(scope.groupId);
```

- `canCreateGroup` is super_admin-only — creating a new group is a governance decision, not a chair decision.
- `canEditGroup` is staff+ OR chair of the specific group — already exercised by the actor-context infrastructure; this subsystem is the first one that gates writes by it at scope.

## Audit trail

Every mutating handler emits an entry to the existing `audit_log` table via the standard audit middleware. No new audit infrastructure; the contract:

- `c.set("auditAction", "groups.X")`
- `c.set("auditTarget", { type: "groups", id })`
- `c.set("auditPayload", {...})` with before/after where applicable
- `c.get("auditCapture")?.({ group: existingRow })` before the mutation when the audit wants the prior state

Action names emitted by this subsystem:

| Action | Endpoint | Payload |
|---|---|---|
| `groups.create` | `POST /admin/groups` | new row fields |
| `groups.update` | `PATCH /admin/groups/:id` | `{before, after}` for each changed field |
| `groups.publish` | `POST /admin/groups/:id/publish` | `{name}` |
| `groups.unpublish` | `POST /admin/groups/:id/unpublish` | `{name}` |
| `groups.archive` | `POST /admin/groups/:id/archive` | `{name}` |
| `groups.reopen` | `POST /admin/groups/:id/reopen` | `{name}` |
| `groups.chair_assign` | `POST /admin/groups/:id/chairs` | `{userId, role}` |
| `groups.chair_remove` | `DELETE /admin/groups/:id/chairs/:userId` | `{userId, previousRole}` |

Chair-assignment changes the actor-context's `chairedGroupIds` on the affected user's next request — meaning a chair-assign immediately grants `canEditGroup` to the assigned user, and a chair-remove revokes it. Both transitions are audited.

The admin detail page Audit tab queries `audit_log WHERE targetId = :groupId ORDER BY createdAt DESC LIMIT 20`, same shape as the member-detail Audit tab.

## API surface

### Public (no auth)

- `GET /api/groups?type=<type>` — list of `is_active AND is_published AND deleted_at IS NULL` groups, optionally filtered by `type`. Returns minimal card shape:
  ```ts
  { id, name, slug, type, description, slackChannel }
  ```
  Used by `WorkingGroupsPage`, `AffinityGroupsPage`, `RegionalGroupsPage`. No charter, no links, no member roster — kept lean for the list view.

- `GET /api/groups/:id` — single group with full public fields:
  ```ts
  {
    ...card shape,
    charter,
    links,                                    // array of { label, url }
    chairs: Array<{ displayName, photoUrl }>  // no emails on the public side
  }
  ```
  Used by `/community/groups/:id`. Chairs returned by display name + photo only — no emails, no member counts.

Both public endpoints intentionally omit chair emails. Admin endpoints return them.

### Admin sub-app (all gated by `canEditGroup` scope-check at route level)

- `GET /api/admin/groups` — list. Staff sees all groups (including unpublished, archived, soft-deleted). Chairs see only the groups they chair (`actor.chairedGroupIds` filter applied scope-side in the handler). Admin-shape rows include `isPublished`, `isActive`, `deletedAt`, member count, chair count.

- `POST /api/admin/groups` — create. Additionally gated by `canCreateGroup` (super_admin only). Body:
  ```ts
  { name: string, type: "working_group" | "affinity_group" | "regional_group", description?: string, slackChannel?: string }
  ```
  Slug auto-generated from `name` via the shared `slugify` helper. Slug collision → 409 `slug_conflict`. Returns the new row with `isPublished=false`.

- `GET /api/admin/groups/:id` — detail. Returns the full group row + members array (each with `id`, `displayName`, `email`, `role`, `joinedAt`) + last 20 audit rows. Members sorted by role (chairs first) then `joinedAt` desc.

- `PATCH /api/admin/groups/:id` — edit. Body: any of `{ name, description, charter, slackChannel, links }`. **Slug NOT editable** post-create (the permalink uses ID, but internal queries by slug and the admin URL display rely on it being stable). The `links` field is replaced wholesale (not patched per-entry) — the admin UI manages the array client-side.

- `POST /api/admin/groups/:id/publish` — sets `is_published=true`. Idempotent (re-publishing a published row no-ops with `ok: true`).

- `POST /api/admin/groups/:id/unpublish` — sets `is_published=false`. Idempotent.

- `POST /api/admin/groups/:id/archive` — sets `is_active=false`. Returns 409 if already archived.

- `POST /api/admin/groups/:id/reopen` — sets `is_active=true`. Returns 409 if already active.

- `POST /api/admin/groups/:id/chairs` — body:
  ```ts
  { userId: string, role: "chair" | "co_chair" }
  ```
  Inserts a `group_memberships` row OR updates an existing membership's `role`. Audit row emitted. Implicit: a `member` who gets assigned `chair` is upgraded; if no membership exists, one is created.

- `DELETE /api/admin/groups/:id/chairs/:userId` — demotes a chair to `member` (UPDATE on the existing `group_memberships` row). Does NOT remove the membership entirely. Audit records `previousRole`. If the user wasn't a chair, returns 404 `not_chair`.

## Frontend — admin pages

Three routes under `/groups/*` in the admin app:

### `/groups` — `GroupsListPage.tsx`

- Eyebrow: `US-RSE · Admin · Groups`
- Heading: `Groups.`
- `+ New group` button top-right, super_admin only (hidden when `actor.systemTier < 2`). Opens a modal with name, type, short description, slack channel → `POST /admin/groups` → navigate to `/groups/:newId`.
- Filter bar: kind (`all` / working / affinity / regional), status (`active` / `archived` / `all`), visibility (`published` / `draft` / `all`)
- Count strip: `N active · M draft · K archived` adapts based on filters
- Register table: `# · name · type · chair(s) · members · visibility · last activity · Open →`
- Chairs see ONLY their chaired groups — the endpoint filters by `actor.chairedGroupIds` server-side

### `/groups/:id` — `GroupDetailPage.tsx`

Four-tab layout, mirroring the member-detail pattern:

1. **01 Identity** — read-only `name` (post-create), read-only `type`, editable `description` (short), read-only `slug`, editable `slackChannel`. Save → `PATCH`.
2. **02 Content** — `charter` (markdown textarea, full-width), `links` editor with add/remove rows of `{label, url}`. Save → `PATCH`.
3. **03 Roster + chairs** — read-only member list (display name, joined date, role badge). Above the list: chair-assignment combobox (search by name/email across all users, mirrors the manual-merge picker from the identity work) with `Add as chair` / `Add as co-chair` buttons. Current chairs display with `Demote to member ✕`.
4. **04 Lifecycle + audit** — Publish/Unpublish toggle, Archive/Reopen action, "View public page →" link to `/community/groups/:id` (disabled when not published), Audit log (last 20 entries).

Tab numerals are two-digit Arabic (`01`, `02`, `03`, `04`) matching the convention established in the identity + vocab work.

### Modal: `+ New group`

Super_admin only. Form fields: name, type (select), short description, slack channel (optional). On submit → `POST /admin/groups` → on success, navigates to the new group's detail page with `isPublished=false`. The admin then fills in `charter` and `links` on the Content tab, assigns chairs on the Roster tab, and clicks Publish on the Lifecycle tab when ready.

## Frontend — public refactor

Four changes to `apps/web`:

### `WorkingGroupsPage.tsx` and `AffinityGroupsPage.tsx` — DB-driven

The hardcoded `workingGroups: WorkingGroup[]` const array is deleted. The page fetches `GET /api/groups?type=working_group` (or `affinity_group`) on mount via a new small hook (`useGroups(type)` in `apps/web/src/hooks/useGroups.ts`). Loading state reuses the existing card skeleton style; error state shows a graceful "Group list temporarily unavailable" with a retry button. Each card's "View →" link points at `/community/groups/:id`.

### New `/community/groups/:id` — `GroupPage.tsx`

Layout: `CommunityLayout` wrapper. Sections:

- Hero: group name, type chip, one-sentence description
- Charter: rendered from markdown (re-use the dossier-bio renderer if it exists, otherwise a minimal markdown parser is acceptable for v1)
- Slack channel: chip showing `#wg-outreach`-style label (linked to the workspace only if a workspace URL is configurable; defer to text-only display otherwise)
- Chairs: card row showing `displayName + photoUrl` for each chair/co-chair, no emails
- Links: list of `{label, url}` rendered as simple links
- Footer note: "Express interest in this group" → defers to a follow-up flow; not implemented in v1

The page lives at `/community/groups/:id` (UUID). Bookmarks stay stable across renames and type reorgs.

### New `RegionalGroupsPage.tsx`

`/community/regional-groups`. Fetches `?type=regional_group`. Renders the same card grid. Empty-state copy when zero rows: "Regional groups are coming soon — interested in starting one? [contact link]". No navigation entry added by this work; can be linked into the community nav whenever the first regional group is ready.

### `/community/calls` → 301 redirect

The standalone Community Calls page becomes redundant once the Community Calls group has a permalink. Replace the existing `/community/calls` route with a `<Navigate>` to `/community/groups/<community-calls-id>`. The Community Calls group's existing dedicated-page content gets folded into its `charter` field manually post-ingest (not by the import script — see "Community Calls special-case" below).

## Seed-data import script

New file: `packages/api/scripts/import-groups.ts`. Two modes:

```bash
# Dry-run (default) — parse, match, print report. NO writes.
node packages/api/scripts/import-groups.ts

# Commit — write to the dev DB inside a single Drizzle transaction.
node packages/api/scripts/import-groups.ts --commit
```

### Inputs

- `/.data/US-RSE Working Group Creation Form (Responses) - Form Responses 1.csv`
- `/.data/US-RSE Affinity Group Creation Form (Responses) - Form Responses 1.csv`

### Per-group mapping

| Target column | Working group source | Affinity group source |
|---|---|---|
| `name` | "Working Group Name" | "Affinity Group Name" |
| `slug` | `slugify(name)` | `slugify(name)` |
| `type` | `working_group` | `affinity_group` |
| `description` | first sentence of "Purpose" (split on `. `, take first chunk, max 200 chars) | "One-sentence Description" |
| `charter` | full "Purpose" text | null |
| `slack_channel` | "Slack channel name" (lower-cased, leading `#` stripped) | "Slack channel name" (same normalization) |
| `links` | `[]` | `[]` |
| `is_active` | `true` | `true` |
| `is_published` | `true` | `true` |

### Chair matching

For each chair / co-chair / coordinator email in the row:

1. Skip if email matches `/tbd@/i` — placeholder.
2. Look up `users WHERE LOWER(email) = LOWER(chair_email)`.
3. If found: queue an INSERT for `group_memberships(user_id, group_id, role)` with role `chair` or `co_chair`.
4. If not found: log to the unmatched-chairs report (name, email, group). Admin re-runs after creating the missing user or fixing typos.

### Initial members (working groups only)

For each name in the comma-separated "Initial Members" cell:

1. Normalize (lowercase, strip whitespace + punctuation).
2. Look up `profiles JOIN users` where the normalized `display_name` matches the normalized search term.
3. If exactly one match: queue an INSERT for `group_memberships(user_id, group_id, role='member')`.
4. Skip already-queued users from the chair list (the chair queue includes them via the chair flow; double-INSERT would trip the unique constraint anyway).
5. Zero matches OR multiple matches: log to the ambiguous-members report.

### Dry-run output shape

```
─── Groups to insert (45 total) ────────────────
working_group  Outreach                                slug: outreach
working_group  Diversity, Equity, and Inclusion         slug: diversity-equity-and-inclusion
…

─── Chair memberships (38 matched, 3 unmatched, 12 placeholders) ───
Miranda Mundt <mmundt@sandia.gov>                       → chair    of Outreach          ✓
TBD <TBD@tbd.com>                                        → co_chair of Outreach          · placeholder
…

─── Unmatched chairs (manual follow-up) ────────
Sandra Gesing <sgesing@nd.edu>                          → chair of Education & Training
…

─── Initial-member memberships (54 matched, 12 ambiguous, 8 unmatched) ──
Ian Cosden                                              → member of Outreach            ✓
"etc., etc."                                            → member of Outreach            · ambiguous (no real name)
…

DRY-RUN — no writes. Re-run with --commit to apply.
```

### Commit mode

- Wraps all inserts in a single `db.transaction(...)`. Mid-import failure rolls back cleanly.
- Slug-collision protection: SELECT existing groups by slug first; skip (don't error, don't update) any group whose slug already exists.
- `ON CONFLICT DO NOTHING` on `group_memberships` inserts so re-running on partial successes is safe.
- Final report swaps `DRY-RUN` for `COMMITTED`.
- Exit non-zero on any unexpected error.

### Community Calls special-case (not in the script)

The hardcoded `/community/calls` page contains hand-curated content that doesn't appear in the CSV. After the ingest, an admin manually copies that content into the Community Calls group's `charter` field via the admin UI. The redirect doesn't activate until the content is in place.

## Testing

### Vitest

- `canCreateGroup` policy — 3 assertions (member denied, staff denied, super_admin allowed). Mirrors `canApproveVocab` test shape.
- `canEditGroup` already has tests from earlier work; re-run to verify the scope check still passes after this subsystem starts exercising it.
- Helper-level tests for any shared logic extracted from `import-groups.ts` (e.g., name-normalization for the initial-members matcher). If the script remains self-contained, no unit tests there — dry-run mode is the test.

### Playwright

Extend `apps/admin/tests/admin-foundation.spec.ts` with two cases:

```ts
test("unauthenticated visit to /groups triggers sign-in flow", async ({ page }) => {
  await page.goto("/groups");
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});

test("unauthenticated visit to /groups/<uuid> triggers sign-in flow", async ({ page }) => {
  await page.goto("/groups/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});
```

Public-side Playwright tests are deferred unless `apps/web` already has a Playwright harness configured. The admin smoke is the load-bearing test.

## Deliverables

1. Migration `0019_groups_publishable.sql` (number may shift — pick next available at plan time)
2. Drizzle schema update in `packages/api/src/db/schema/groups.ts` matching the migration
3. New policy `canCreateGroup` at `packages/api/src/lib/policies/canCreateGroup.ts`
4. New API sub-app `packages/api/src/routes/admin/groups/index.ts` (list + create + per-id sub-router)
5. New API sub-router `packages/api/src/routes/admin/groups/byId.ts` (detail, PATCH, lifecycle, chair management)
6. New public API routes `packages/api/src/routes/groups.ts` (`GET /api/groups`, `GET /api/groups/:id`)
7. Wire sub-apps in `packages/api/src/routes/admin/index.ts` and `packages/api/src/index.ts`
8. New admin React pages `apps/admin/src/pages/groups/GroupsListPage.tsx`, `GroupDetailPage.tsx`, plus the `+ New group` modal component
9. Refactored public pages `apps/web/src/pages/community/WorkingGroupsPage.tsx`, `AffinityGroupsPage.tsx`; new `apps/web/src/pages/community/GroupPage.tsx` (per-group); new `apps/web/src/pages/community/RegionalGroupsPage.tsx`
10. Redirect at `/community/calls` (React Router `<Navigate>` or a small wrapper component) → `/community/groups/<community-calls-id>`
11. Wire admin routes in `apps/admin/src/App.tsx` (replace the ComingSoon stub); wire public routes in `apps/web/src/App.tsx` (or wherever the route tree lives)
12. Public-side hook `apps/web/src/hooks/useGroups.ts` + per-group `useGroup(id)` hook
13. New script `packages/api/scripts/import-groups.ts` (dry-run default, `--commit` flag)
14. Extend Playwright smoke at `apps/admin/tests/admin-foundation.spec.ts` with two new cases

## Risks

- **Slug collisions between manually-renamed groups and CSV ingest.** The CSV has "Diversity, Equity, and Inclusion" (slug `diversity-equity-and-inclusion`); if a working group named "DEI" already exists in the DB with a slug that doesn't match, the ingest will create a duplicate. Mitigation: the dry-run report surfaces every slug that already exists, and the admin reviews before `--commit`.
- **Public site flicker on un-publish + republish.** Accepted tradeoff (rejected the parallel-draft-columns model as YAGNI). If admins find themselves making a lot of cross-cutting edits to high-traffic groups, the parallel-draft model becomes a follow-up.
- **Chair-assignment doesn't immediately propagate.** The actor-context recompute happens on each request; a freshly-assigned chair won't see their new group in `/groups` until their browser re-issues a request. They're already signed in, so a refresh is enough — but the admin doing the assignment may need to tell them. Worth a one-line note in the post-assign toast.
- **No SSR / OG tags for `/community/groups/:id`.** The public per-group page is client-rendered React. Social previews + search engines see the loading state. Acceptable for v1; if SEO becomes important, prerendering or SSR is a separate work item.

## Decisions made during brainstorming

1. **Single-PR scope: admin + public refactor land together.** The hardcoded public group lists become DB-driven in the same PR; otherwise the admin edits ship without delivering visible value.
2. **Maximum schema additions: `slack_channel`, `charter`, `links`, `is_published`.** Future-friendly; the migration is cheap. `is_published` separates visibility from `is_active` so admins can stage new-group content before going live.
3. **Two policies: `canCreateGroup` (super_admin only) + `canEditGroup` (existing, chairs+staff).** Creating a new group is a governance decision; editing is operational.
4. **Roster scope: view + chair management only.** No general member add/remove in v1; self-service join is its own future workflow.
5. **Per-group public route uses ID, not slug.** Stable across renames and type reorgs. The `slug` column stays on the row for display purposes but isn't load-bearing for the URL.
6. **List + per-group public pages.** Every group automatically has a permalink; charter content has somewhere to render. `/community/calls` becomes a 301 redirect.
7. **Standalone TS import script with `--dry-run` default + `--commit`.** Re-runnable, transactional, no data writes without explicit `--commit`. Best-effort chair + initial-member matching; ambiguous matches surface in the report.
8. **Audit trail explicit on every mutation.** Eight distinct action names cover the lifecycle.
