# Events, Announcements & Forms Subsystem Design

**Status:** Approved
**Date:** 2026-05-20
**Related issues:** #1961 (events & sessions), #1963 (forms & surveys), #1965 (communications), #1974 (form builder), #1975 (form approval workflow), #1925 (n8n automation), #1924 (Zulip transition)
**Predecessors:** #1981 (groups subsystem — informs `host_group_id` + chair-scoped admin pattern), #1984 (orgs directory — informs `host_org_id` + visibility predicate)

---

## Goal

Add a unified events + announcements + forms subsystem to the admin app, with member-submitted content, multi-channel broadcast requests, and a two-approver gate before anything publishes. Sessions, committees, and sponsors stay out of v1 (their own brainstorm).

## Architecture summary

- **Three concrete artifact tables** — `events`, `announcements`, `forms` — each with type-specific columns and a shared `status` enum.
- **Six polymorphic cross-cutting tables** keyed on `(entity_type, entity_id)` — `artifact_reviews`, `artifact_comments`, `broadcast_requests`, `broadcast_channels`, `artifact_revisions`, `form_submissions`. (`audit_log` is reused, not duplicated.)
- **Tier-flat authoring + two-approver publish gate.** Anyone signed-in can author any artifact type as a draft. Publish requires two distinct staff approvals on the current revision; the author cannot self-approve.
- **Per-channel broadcast approval.** Author requests channels; approvers approve, decline, or add channels. Posting strategy is per-channel (`site_banner` + `workspace_chat` native; external social manual until n8n; newsletter blocked on #1965).
- **Coltorapps form builder** under the existing admin design system; schemas stored as `jsonb` we own.
- **Unified `/admin/queue`** as the canonical triage surface across artifact types.

## Glossary

- **Artifact** — generic term for an event, announcement, or form row. Used in shared column names and the queue.
- **Revision** — integer on each artifact, bumped when an author resubmits after `changes_requested`. Approvals are valid only for `revision = artifact.revision`.
- **Author class** — the role of the artifact's creator at submit time. Three classes: member, group lead, staff/super_admin. Drives defaults, not gates.
- **Reviewer** — any staff user (`systemTier ≥ 1`) other than the artifact's author. Can approve, reject, or request changes.
- **Channel** — a delivery destination for a broadcast request (`site_banner`, `workspace_chat`, `newsletter`, `twitter_x`, `bluesky`, `mastodon`, `linkedin`).

---

## 1. Data model

### 1.1 Migration (single migration file)

`packages/api/migrations/0022_events_announcements_forms.sql`:

```sql
-- Shared enums
CREATE TYPE artifact_status AS ENUM (
  'draft', 'in_review', 'changes_requested', 'rejected', 'published',
  'cancelled', 'completed', 'expired', 'closed', 'archived'
);
CREATE TYPE artifact_scope AS ENUM ('public', 'community', 'group', 'staff_only');
CREATE TYPE artifact_review_decision AS ENUM ('approve', 'reject', 'request_changes');
CREATE TYPE broadcast_channel AS ENUM (
  'site_banner', 'workspace_chat', 'newsletter',
  'twitter_x', 'bluesky', 'mastodon', 'linkedin'
);
CREATE TYPE broadcast_channel_status AS ENUM ('requested', 'approved', 'declined', 'posted');
CREATE TYPE artifact_entity_type AS ENUM ('event', 'announcement', 'form', 'group');

-- Extend existing events table
-- IMPORTANT backfill: existing events are already live on the public site, so they default
-- to 'published' + 'public' and migrate forward. New rows default to 'draft' + 'community'.
ALTER TABLE events
  ADD COLUMN status artifact_status NOT NULL DEFAULT 'published',
  ADD COLUMN revision int NOT NULL DEFAULT 1,
  ADD COLUMN author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN scope artifact_scope NOT NULL DEFAULT 'public',
  ADD COLUMN host_group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  ADD COLUMN host_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN external_url text,
  ADD COLUMN thumbnail_key text;

-- Flip the column defaults so new inserts behave correctly
ALTER TABLE events ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE events ALTER COLUMN scope SET DEFAULT 'community';

-- New announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status artifact_status NOT NULL DEFAULT 'draft',
  revision int NOT NULL DEFAULT 1,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  scope artifact_scope NOT NULL DEFAULT 'community',
  host_group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  host_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  link_url text,
  expires_at timestamptz,
  thumbnail_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- New forms table
CREATE TABLE forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status artifact_status NOT NULL DEFAULT 'draft',
  revision int NOT NULL DEFAULT 1,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  scope artifact_scope NOT NULL DEFAULT 'community',
  host_group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  schema jsonb NOT NULL,
  entity_type artifact_entity_type,
  entity_id uuid,
  accepts_submissions boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK ((entity_type IS NULL) = (entity_id IS NULL))
);

-- Polymorphic cross-cutting tables
CREATE TABLE artifact_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type artifact_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  entity_revision int NOT NULL,
  reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decision artifact_review_decision NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX artifact_reviews_entity_idx
  ON artifact_reviews (entity_type, entity_id, entity_revision);

CREATE TABLE artifact_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type artifact_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX artifact_comments_entity_idx
  ON artifact_comments (entity_type, entity_id, created_at);

CREATE TABLE broadcast_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type artifact_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)  -- one broadcast_request per artifact lifetime
);

CREATE TABLE broadcast_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_request_id uuid NOT NULL REFERENCES broadcast_requests(id) ON DELETE CASCADE,
  channel broadcast_channel NOT NULL,
  status broadcast_channel_status NOT NULL DEFAULT 'requested',
  decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  posted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  posted_at timestamptz,
  post_url text,
  decline_reason text,
  prepared_text text,
  prepared_image_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broadcast_request_id, channel)
);
CREATE INDEX broadcast_channels_status_idx
  ON broadcast_channels (status, channel)
  WHERE status IN ('approved', 'posted');

CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  form_revision int NOT NULL,
  submitter_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX form_submissions_form_idx ON form_submissions (form_id, submitted_at DESC);

-- Status-filtered queue indexes
CREATE INDEX events_status_idx ON events (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX announcements_status_idx ON announcements (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX forms_status_idx ON forms (status, created_at DESC) WHERE deleted_at IS NULL;
```

### 1.2 Drizzle schema

- New file `packages/api/src/db/schema/announcements.ts` declares `announcements` + the four shared enums.
- New file `packages/api/src/db/schema/forms.ts` declares `forms` + `formSubmissions`.
- New file `packages/api/src/db/schema/artifacts.ts` declares all polymorphic cross-cutting tables (`artifactReviews`, `artifactComments`, `broadcastRequests`, `broadcastChannels`) + shared enums (`artifactEntityType`, `broadcastChannel`, `broadcastChannelStatus`).
- Existing `packages/api/src/db/schema/events.ts` extended with the new columns + `status` / `revision` / `author_id` etc.
- All registered in `packages/api/src/db/schema/index.ts`.

### 1.3 Polymorphic FK consistency

Postgres can't enforce referential integrity on `(entity_type, entity_id)` at the DB level. Two mitigations:

1. **Code-level guards.** Helpers in `packages/api/src/lib/artifacts/` resolve `(entity_type, entity_id)` to a typed artifact row and return 404 if not found; all polymorphic-table writes go through these helpers.
2. **Nightly orphan scan.** A scheduled Worker queries each polymorphic table for rows whose target artifact no longer exists and logs them. Same pattern as the existing `audit_log.target_*` columns.

---

## 2. Lifecycle state machine

### 2.1 States and transitions

```
draft
  ↓ submit_for_review (author)
in_review
  ↓ approve (reviewer != author, count valid approvals)
  ├─ 1 approval on revision     → stays in_review (UI shows "1 of 2 approvals")
  ├─ 2 approvals on revision    → published
  ↓ request_changes (reviewer)  → changes_requested
  ↓ reject (reviewer)           → rejected (terminal)
changes_requested
  ↓ resubmit (author)           → revision++; in_review with 0 approvals on new revision
rejected (terminal)
published
  ├─ cancel (events, staff)     → cancelled
  ├─ archive (staff)            → archived
  ├─ close (forms, staff)       → closed
  ├─ auto past end_date         → completed (events)
  └─ auto past expires_at       → expired (announcements)
```

### 2.2 Per-artifact subset of states

| State | Events | Announcements | Forms |
|---|---|---|---|
| `draft`, `in_review`, `changes_requested`, `rejected`, `published`, `archived` | ✓ | ✓ | ✓ |
| `cancelled` | ✓ | — | — |
| `completed` (auto) | ✓ | — | — |
| `expired` (auto) | — | ✓ | — |
| `closed` | — | — | ✓ |

### 2.3 Approval validity and revision invalidation

Stored: `artifact_reviews(entity_type, entity_id, entity_revision, reviewer_id, decision)`.

Counting valid approvals to publish:

```sql
SELECT COUNT(DISTINCT reviewer_id)
FROM artifact_reviews
WHERE entity_type = ?
  AND entity_id = ?
  AND entity_revision = (SELECT revision FROM <table> WHERE id = ?)
  AND decision = 'approve'
  AND reviewer_id != (SELECT author_id FROM <table> WHERE id = ?);
-- Publish when count >= 2
```

`COUNT(DISTINCT reviewer_id)` enforces "two distinct approvers" mechanically. The author-id exclusion enforces the self-promotion guard. `entity_revision` equality means resubmits implicitly invalidate prior approvals — no UPDATE-cascading needed.

### 2.4 Single-reviewer transitions

- `request_changes` — any single reviewer can send the artifact back. Their comment is required.
- `reject` — any single reviewer can terminate the artifact. Reason comment required.

Both write a row to `artifact_reviews` with the appropriate `decision` and a row to `audit_log`.

### 2.5 Auto-transitions (`completed`, `expired`)

Computed at **read time** for the artifact's effective status, the same pattern badges use:

```ts
function effectiveStatus(a: Event | Announcement): ArtifactStatus {
  if (a.status === "published") {
    if (a.type === "event" && a.endDate && a.endDate < today) return "completed";
    if (a.type === "announcement" && a.expiresAt && a.expiresAt < now) return "expired";
  }
  return a.status;
}
```

A **nightly cron** also UPDATEs the stored `status` for queue accuracy and audit cleanliness — but every read still applies the function so a race window doesn't surface stale "published" to the public site.

---

## 3. Authoring & permissions

### 3.1 Default-by-author-class

| Author class | Event scope | Announcement scope | Form scope | host_group_id | host_org_id |
|---|---|---|---|---|---|
| Member | `community` | `community` | `community` | none | editable |
| Group lead | `group` | `group` | `group` | their group | none |
| Staff / super_admin | `community` | `community` | `community` | none | none |

All defaults are editable by the author and by any approver during review.

### 3.2 Policies (new)

```ts
// packages/api/src/lib/policies/canEditArtifact.ts
export const canEditArtifact = (
  a: ActorContext,
  scope: { entityType: ArtifactEntityType; entityId: string; status: ArtifactStatus; authorId: string }
): boolean => {
  if (a.systemTier >= 1) return true;
  // Authors can edit their own drafts and changes_requested
  return a.id === scope.authorId
    && (scope.status === "draft" || scope.status === "changes_requested");
};

// packages/api/src/lib/policies/canReviewArtifact.ts
export const canReviewArtifact = (
  a: ActorContext,
  scope: { authorId: string }
): boolean => a.systemTier >= 1 && a.id !== scope.authorId;

// canPublishArtifact = canReviewArtifact; the 2-approval count is checked at the call site
// canBroadcastDecide = staff-only on broadcast_channels writes
```

### 3.3 Existing policies extended

- `canEnterAdminApp` is unchanged — author members reach the admin app through their existing membership tier (any signed-in `systemTier ≥ 0` member can hit the admin app, with most routes guarded individually). Members can reach `/admin/events/new` etc. because creating drafts is permitted; they cannot reach `/admin/queue` (staff-only).
- Group-lead identification reuses the existing `chairedGroupIds` set already on `ActorContext`.

---

## 4. Broadcast subsystem

### 4.1 Posting strategies per channel

A dispatcher in `packages/api/src/lib/broadcast/dispatcher.ts` maps each channel kind to one of three strategies:

| Channel | Strategy | v1 behavior |
|---|---|---|
| `site_banner` | **native** | Approving channel + artifact `published` flips a read predicate; the public site reads the banner via `GET /api/announcements/active-banner` |
| `workspace_chat` | **native via webhook** | Approval triggers a POST to `WORKSPACE_CHAT_WEBHOOK` env (currently a Slack incoming webhook URL; swappable to Zulip per #1924 by changing the env value and request body shape in one adapter file) |
| `newsletter` | **blocked** | Channel exists in the queue with a "blocked on #1965 Communications" indicator; status stays `requested` |
| `twitter_x`, `bluesky`, `mastodon`, `linkedin` | **manual handoff** | Approval moves channel row to `/admin/broadcasts` sub-queue with prepared text + image; staff posts externally and pastes the `post_url` back to mark `posted` |

The dispatcher signature:

```ts
type ChannelPoster = (
  artifact: ArtifactRow,
  channel: BroadcastChannelRow
) => Promise<{ posted: true; postUrl?: string } | { posted: false; reason: "blocked" | "manual" }>;
```

When n8n lands (#1925), the four manual entries become n8n webhook calls — single file change in `dispatcher.ts`. The schema is unchanged.

### 4.2 Channel data flow

```
Author submits artifact (status=in_review) + broadcast_request with N broadcast_channels rows (status=requested).
  ↓
On the Broadcast tab of the artifact detail page, reviewers can:
  - approve / decline each channel independently
  - ADD a channel the author didn't request (INSERT broadcast_channels row directly approved by the reviewer)
  - leave decline_reason on declined channels
  ↓
When artifact transitions to published:
  - native channels (site_banner, workspace_chat) auto-fire via dispatcher
  - manual channels move to /admin/broadcasts sub-queue
  - newsletter rows show blocked indicator
  ↓
Manual channel rows close when staff pastes a post_url back (channel.status = 'posted', posted_at = now())
```

### 4.3 `/admin/broadcasts` sub-queue

A filtered view of `broadcast_channels` with `status = 'approved' AND posted_at IS NULL AND channel IN (manual-strategy channels)`. Columns: artifact title, channel, prepared text, prepared image thumbnail, "Mark posted" action (modal taking `post_url`).

### 4.4 Thumbnails / prepared image storage

- New R2 binding `ARTIFACT_THUMBNAILS` paralleling `ORGANIZATION_LOGOS`.
- Each artifact has at most one thumbnail (`thumbnail_key` on the artifact row).
- Broadcast channels can carry a per-channel `prepared_image_key` for platform-specific crops (e.g., square for one, wide for another); when null, the channel uses the artifact's thumbnail.
- Upload endpoint mirrors the existing org-logo upload pattern (signed URL → R2 PUT → server-side validate).

---

## 5. Forms subsystem

### 5.1 Library choice — Coltorapps Builder (MIT, headless)

`apps/admin/src/lib/form-builder/` wraps Coltorapps primitives with the admin design system (`EditorialInput`, `EditorialTextarea`, `EditorialSelect`, `EditorialCheckbox`). The vendor never reaches CSS for builder UI.

### 5.2 Schema persistence

The Coltorapps schema is stored as `forms.schema jsonb`. The format is plain JSON we own; if Coltorapps is unmaintained, the renderer survives a builder rewrite.

Server-side normalization in `packages/api/src/lib/forms/schemaParser.ts`:

- Cap field count at 50.
- Cap option count per choice field at 30.
- Reject unknown field types (whitelist: `text`, `textarea`, `email`, `url`, `number`, `date`, `single_choice`, `multi_choice`, `checkbox`).
- Strip any fields not on the whitelist before persisting; log the strip in audit.

### 5.3 Submission storage

`form_submissions(form_id, form_revision, submitter_user_id, payload, submitted_at)`. The submitted `payload` is the raw map of field-id → value. `form_revision` records which schema revision was answered, so an admin's CSV export against an old schema stays interpretable.

Anonymous submissions allowed when `forms.scope = 'public'`. Otherwise the public route requires auth.

### 5.4 Public renderer

`apps/web/src/pages/forms/FormPage.tsx` at `/forms/:slug`:

- Reads `GET /api/forms/:slug` (returns schema + metadata, only if `status='published'` and `accepts_submissions=true`).
- Renders schema via the same design-system primitives.
- POSTs to `/api/forms/:slug/submissions` with payload.
- Returns a thank-you state on success.

File uploads explicitly **out of scope for v1**.

### 5.5 Form ↔ entity attachment

`forms.entity_type` + `forms.entity_id` polymorphic columns attach a form to one event / announcement / group. Constraint `CHECK ((entity_type IS NULL) = (entity_id IS NULL))` enforces both-or-neither.

When the parent artifact transitions to `cancelled` or `archived`, the form is auto-`closed` (`accepts_submissions = false`); submission history is retained.

Reusing a single form across multiple entities is **out of scope** (would require a join table; v2).

---

## 6. Admin UI surfaces

### 6.1 Routes

```
/admin/queue                              -- unified triage (filterable by type, scope, age, submitter role)
/admin/events                             -- list (filter by status, scope, host, author role)
/admin/events/new                         -- compose modal/page
/admin/events/:id                         -- detail editor (tabs: Identity / Content / Broadcast / Review / Audit)
/admin/announcements                      -- list
/admin/announcements/new
/admin/announcements/:id                  -- detail (same tab pattern)
/admin/forms                              -- list
/admin/forms/new                          -- Coltorapps builder surface
/admin/forms/:id                          -- detail + inline builder + attach-to-entity + status controls
/admin/forms/:id/submissions              -- paginated submission table + CSV export
/admin/broadcasts                         -- manual-handoff sub-queue
```

### 6.2 Sidebar nav

New top-level **Queue** entry with a live badge count of `in_review` artifacts (sum across types, scoped to artifacts the actor `canReviewArtifact` of). Beneath:

- Queue (badge: count of reviewable in_review artifacts)
- Events
- Announcements
- Forms
- Broadcasts (badge: count of approved + unposted manual channels)

### 6.3 Artifact detail tab pattern (consistent across event / announcement / form)

| Tab | Contents |
|---|---|
| **Identity** | Title, type (events), scope, host_group, host_org, dates (events) or expires_at (announcements), slug (forms), author attribution chip |
| **Content** | Description / body (markdown), thumbnail upload, external_url (events), inline form builder (forms only) |
| **Broadcast** | Channels requested + per-channel state, "add channel" affordance for reviewers, prepared text + per-channel image |
| **Review** | Approval state ("1 of 2 approvals on revision 3"), approver list, action affordances (Submit for review / Approve / Reject / Request changes), inline comment thread |
| **Audit** | Last 50 `audit_log` rows for this artifact, formatted |

### 6.4 `/admin/queue` columns

| Column | Notes |
|---|---|
| Type chip | event / announcement / form |
| Title | links to detail page |
| Submitter | display name + role chip (member / group-lead / staff) |
| Scope | scope chip |
| Revision | "rev 3" |
| Approvals | "0 of 2" / "1 of 2" |
| Age | time-since-submit |
| Action | quick approve / open detail |

Default sort: oldest-submitted first. Filters: type, scope, submitter role, age bucket.

---

## 7. Public surfaces

### 7.1 Existing routes extended

| Path | Change |
|---|---|
| `/events` | Filter by `scope = 'public'` always; add `scope = 'community'` and `scope = 'group'` rows when the viewer matches. Render "Submitted by @member" chip on member-authored events. Add an auth-gated "Submit an event" CTA |
| `/events/:slug` | Render `external_url` CTA when set ("Register at {host name}"). Render attached form (if `forms.entity_type='event'` matches) inline. Render `host_group` / `host_org` attribution |

### 7.2 New public routes

| Path | Purpose |
|---|---|
| `/events/submit` | Auth-gated event submission form. Composes a `draft` event and transitions it to `in_review`. Renders the broadcast-channel multi-select |
| `/forms/:slug` | Public form renderer |

### 7.3 Banner rendering

`<SiteBanner />` mounted in `apps/web/src/App.tsx` shell:

- Calls `GET /api/announcements/active-banner` once on app mount.
- Endpoint returns **at most one** announcement: the most-recently-published row whose effective status is `published` (not auto-`expired`) and which has at least one `broadcast_channels` row with `channel='site_banner' AND status='posted'`. Single active banner is intentional — stacking competing banners is dismiss-fatigue we don't want in v1.
- The response is independent of dismissal state; dismissal is enforced client-side via `localStorage` key `dismissed_banner_<announcement_id>`.
- Renders as a dismissible strip at the top of every public page. Dismiss button writes the localStorage key.

### 7.4 No public `/announcements` index in v1

Past announcements live in admin only. If a public archive is needed later, add `/announcements` as a standalone list page reading `status IN ('published', 'expired')`.

---

## 8. Audit & comments

### 8.1 Audit verbs

Reuse the existing `audit_log` table. Verbs scoped per artifact type:

- `events.create | events.update | events.submit_for_review | events.approve | events.reject | events.request_changes | events.cancel | events.archive | events.publish`
- Mirror set for `announcements.*` and `forms.*`.
- `broadcast_channels.approve | broadcast_channels.decline | broadcast_channels.mark_posted | broadcast_channels.add_by_reviewer`
- `form_submissions.create` (for admin visibility).

Each row captures actor, target_type, target_id, before/after JSON.

### 8.2 Comments

`artifact_comments(entity_type, entity_id, author_id, body, created_at)` — flat thread keyed on artifact, **not** revision-bound (comments persist across resubmits). Visible to:
- The artifact author
- All staff (`systemTier ≥ 1`)

Never surfaced publicly after publish. No threading, mentions, or rich text in v1.

---

## 9. Testing strategy

### 9.1 API (vitest)

- **Lifecycle library** (`packages/api/src/lib/lifecycle/`) — one test file per artifact type. Cover every transition, every guard:
  - Self-approve rejection
  - Two-distinct-reviewers enforcement
  - Revision-invalidation of prior approvals
  - Single-reviewer reject/request-changes
  - Auto-transitions (completed, expired)
- **Policies** — extend the existing `policies.test.ts` with `canEditArtifact` + `canReviewArtifact`.
- **Routes** — one suite per route file (`events.ts`, `announcements.ts`, `forms.ts`, admin counterparts). Hit happy path + the 5 most-likely-broken edge cases per route.
- **Broadcast dispatcher** — unit tests with mocked webhook calls; assert correct payload shape for native channels, correct queue placement for manual channels.
- **Form schema parser** — independent unit tests covering caps, unknown-type rejection, payload-vs-schema validation.

### 9.2 Admin frontend (Playwright)

Smoke tests under existing Playwright setup:

1. Staff login → create event → submit for review → second staff approves → channels post (mock webhook).
2. Member login → submit external event → staff sees in queue → reject → audit row written.
3. Staff create form → publish → public submit → admin sees submission.
4. Staff request changes → author resubmits → first approval invalidated.

### 9.3 Public frontend (vitest + Testing Library)

- `<SiteBanner />` — renders when active, hides when dismissed, hides on expired.
- `/events/submit` — auth-redirect, scope defaults match author class.
- `<FormPage />` — schema renders, anonymous vs auth-gated, submit success state.

---

## 10. Out of scope (v2+)

| Item | Why deferred |
|---|---|
| **Sessions** (event agenda + presenter assignment) | Own brainstorm — separate state machine for sessions, presenter privacy considerations |
| **Committees** (chair/co-chair/area-lead assignment) | Internal coordination; large UI surface |
| **Sponsors** (event_sponsorships) | Blocks on organization sponsor-tier model |
| **n8n autoposting** for external social | Blocks on #1925 (n8n deploy); v1 uses manual handoff |
| **Newsletter channel sending** | Blocks on #1965 Communications |
| **Form file uploads** | Requires new R2 binding + virus-scan path; text-only in v1 |
| **Form analytics** | Counts only in v1; no funnel/dropoff |
| **One form attached to many entities** | Polymorphic columns enforce 1:1; v2 schema change |
| **Public `/announcements` index** | YAGNI; only via channels in v1 |
| **Mentions / threaded comments** | Flat list only |
| **Per-channel approver roles** | Single `staff+` gate on all channel decisions |
| **Cancellation broadcast** ("X was cancelled" banner) | Useful affordance, not v1 |

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Polymorphic FK has no DB-level integrity | Code-level resolver helpers + nightly orphan scan; same pattern as existing `audit_log.target_*` |
| UNION ALL queue query slow at scale | Microseconds at current scale; if grows past hundreds of in-review rows, add a `queue_index` materialized table via app-side dual-write |
| Coltorapps maintenance risk | We own the stored schemas (jsonb); renderer is built on our own primitives; only the builder UI would need a rewrite if the lib is abandoned |
| Slack webhook leak | Webhook URL stored as Worker secret; rotated like any other secret |
| Two-approver bottleneck when only one staff online | Documented as expected workflow constraint; no fallback path in v1 (revisit if it becomes painful) |
| Member-submission noise floods the queue | Triage filter by submitter role; `reject` exists as a terminal close-out so the queue stays clean |
| Banner annoyance / dismiss fatigue | One active banner at a time; dismissal persists per banner-id in localStorage; banner only renders on `posted` site_banner channels (not every published announcement) |

---

## 12. Open questions tagged for the implementation plan

- Whether the unified queue's badge count should reflect **all** in_review artifacts or only **reviewable-by-me** (excluding ones the actor authored). Leaning toward reviewable-by-me; finalize during implementation.
- Whether `cancelled` events still appear in `/events` (struck through) or are hidden entirely. Leaning struck-through with explicit "Cancelled" marker for the day-of refresher case.
- Whether `archived` is reachable from `cancelled`/`completed`/`expired`, or only from `published`. Leaning yes — any non-terminal-but-finished state can be archived for queue cleanliness.

---

## Approval

Brainstormed with the user 2026-05-20. Approved across three section reviews (data architecture, workflow subsystems, UI surfaces). Implementation plan to follow.
