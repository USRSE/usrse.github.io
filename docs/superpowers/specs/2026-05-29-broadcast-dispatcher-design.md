# Broadcast Dispatcher (Plan 5) Design

**Status:** Approved
**Date:** 2026-05-29
**Related issues:** #1965 (communications), #1924 (Zulip transition), #1925 (n8n automation)
**Predecessors:**
- Plan 1 — Artifact subsystem foundation (#1994) — schema for `broadcast_requests` / `broadcast_channels`, lifecycle engine, `/announcements/active-banner` endpoint.
- Plan 2 — Events subsystem (#1998) — admin CRUD + lifecycle + comments, public `/events/:slug`, member `/events/submit`.
- Plan 3 — Announcements subsystem (#1999) — admin CRUD + lifecycle + comments, `<SiteBanner />` mounted in `apps/web` (returns null today).
- Plan 4 — Forms subsystem (#2011) — admin CRUD + Coltorapps builder + public renderer.

---

## Goal

Wire the broadcast flow for events and announcements on top of the schema and lifecycle that Plans 1–4 already shipped. Authors request channels at submit; reviewers approve per-channel; on publish, a dispatcher fires native channels (`site_banner`, `workspace_chat`) and external social rows land in a manual-handoff sub-queue. Forms broadcast is deferred — forms are typically promoted via a separate announcement.

## Scope

**In scope**

- New public `/announcements/:slug` detail page and a `slug` column on `announcements`.
- Author broadcast-request UI inline on:
  - `apps/web` event submit (member-facing).
  - `apps/admin` announcement create (staff-facing).
- Reviewer per-channel approve / decline / edit-prepared-text / add-channel UI on the admin event and announcement detail pages.
- `packages/api/src/lib/broadcast/dispatcher.ts` called inline from `applyTransition` on publish.
- Native channels:
  - `site_banner` — DB-only flip to `posted`.
  - `workspace_chat` — Slack incoming webhook now, single-file adapter swap to Zulip when #1924 lands.
- Manual-handoff sub-queue at `/admin/broadcasts` for `twitter_x` / `bluesky` / `mastodon` / `linkedin` with prepared text/image, "Mark posted", and retry.
- Forward-only: artifacts published before this plan ships have no broadcast surface.

**Deferred / out of scope**

- Forms broadcast (announcements wrap them).
- n8n automation of external social (#1925) — manual until then.
- Newsletter channel (#1965 communications).
- Cancellation banner ("X was cancelled").
- Retroactive broadcast on already-published artifacts.
- Per-channel approver roles (single `staff+` gate remains).

---

## 1. Data model

Single migration `packages/api/migrations/0023_broadcast_plan5.sql`. No new tables. Three deltas, forward-only.

```sql
-- 1. announcements gain a public slug for the new detail page
ALTER TABLE announcements
  ADD COLUMN slug text;

-- Backfill from title; staff can rename later via admin edit
UPDATE announcements
  SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(id::text, 1, 4)
  WHERE slug IS NULL;

ALTER TABLE announcements
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT announcements_slug_unique UNIQUE (slug);

-- 2. broadcast_channels gain delivery observability
ALTER TABLE broadcast_channels
  ADD COLUMN last_error text,
  ADD COLUMN last_attempted_at timestamptz,
  ADD COLUMN attempt_count int NOT NULL DEFAULT 0;

-- 3. Drive the /admin/broadcasts manual-handoff sub-queue
CREATE INDEX broadcast_channels_manual_queue_idx
  ON broadcast_channels (status, channel, decided_at DESC)
  WHERE status = 'approved'
    AND posted_at IS NULL
    AND channel IN ('twitter_x', 'bluesky', 'mastodon', 'linkedin');
```

Drizzle work:
- Extend `packages/api/src/db/schema/announcements.ts` with the `slug` column + unique index.
- Extend `packages/api/src/db/schema/artifacts.ts` with `lastError`, `lastAttemptedAt`, `attemptCount` on `broadcastChannels`.

Already present from Plan 1 (no change needed):
- `broadcast_requests.entity_type / entity_id / created_by` with `UNIQUE (entity_type, entity_id)`.
- `broadcast_channels.prepared_text`, `prepared_image_key`, `decided_by`, `decided_at`, `posted_by`, `posted_at`, `post_url`, `decline_reason`.
- The `broadcastChannel` enum (`site_banner`, `workspace_chat`, `newsletter`, `twitter_x`, `bluesky`, `mastodon`, `linkedin`) and `broadcastChannelStatus` enum (`requested`, `approved`, `declined`, `posted`).

---

## 2. Lifecycle integration & dispatcher

### 2.1 Dispatcher entry point

The codebase uses Neon's HTTP driver, which does not support `db.transaction()`; `applyTransition` is documented as sequential, not transactional, with `audit_log` providing forensic reconstruction. The dispatcher follows the same convention: it sequences DB-only effects before outbound network calls, but does not — and cannot — hold a real transaction.

`packages/api/src/lib/broadcast/dispatcher.ts` exposes two functions whose split matches that of `applyTransition`:

```ts
// Phase 1: DB-only effects, run sequentially with the publish status flip.
// Flips approved site_banner channels to posted. Idempotent.
export async function dispatchDbEffects(
  db: Db,
  entity: { type: 'event' | 'announcement'; id: string },
  actorId: string,
): Promise<{ siteBannerPosted: number }>;

// Phase 2: outbound network calls, run after phase 1.
// Posts workspace_chat channels; on failure records last_error and leaves
// status='approved' for sub-queue retry. Idempotent.
export async function dispatchOutbound(
  db: Db,
  entity: { type: 'event' | 'announcement'; id: string },
  env: Env,
  actorId: string,
): Promise<DispatchSummary>;
```

`DispatchSummary` describes which channels were posted and which failed, used for audit logging and as the response shape of late-addition approvals (see 2.4). Both functions are idempotent — already-`posted` channels are skipped.

### 2.2 Trigger placement

`applyTransition` runs sequentially: it writes the review row, optionally flips the artifact `status`, and writes the lifecycle audit entry as three separate statements. The dispatcher is called from `applyTransition` immediately after a status flip to `published` succeeds and before the publish audit row is written, in two phases:

1. **Phase 1 — `dispatchDbEffects`:** select all `broadcast_channels` rows for the artifact with `status = 'approved'`. For each `site_banner` row, flip `status='posted'`, `posted_at=now()`, `posted_by=actorId`. No network call — `GET /announcements/active-banner` already reads this state.
2. **Phase 2 — `dispatchOutbound`:** for each `workspace_chat` row, call the chat adapter (see 2.3). On success, run a small follow-up update to set `status='posted'`. On failure, run a small follow-up update setting `last_error`, `last_attempted_at=now()`, `attempt_count = attempt_count + 1`, leaving `status='approved'` so the sub-queue can pick it up.
3. Manual channels (`twitter_x`, `bluesky`, `mastodon`, `linkedin`) are not touched in either phase — they remain `approved AND posted_at IS NULL` and surface in the sub-queue.

There is no actual transaction, but the ordering matters: the artifact must be `published` before the dispatcher runs (so the active-banner predicate is consistent), and outbound calls must run after DB effects (so a webhook failure cannot prevent the banner from going live). A crash between phase 1 and phase 2 leaves an in-flight `workspace_chat` row stuck at `approved` — visible in the sub-queue under "Include errored native channels" and retryable. This is the same forensic-recoverability tradeoff `applyTransition` already accepts.

The publish never "rolls back" on outbound failure (no tx to roll back). The artifact is the system of record; channel delivery is observability.

### 2.3 Chat adapter

`packages/api/src/lib/broadcast/chatAdapter.ts`:

```ts
export async function postToWorkspaceChat(
  payload: { title: string; preparedText: string; linkUrl: string },
  env: Env,
): Promise<
  | { ok: true; postUrl?: string }
  | { ok: false; error: string }
>
```

v1 body shape: Slack `blocks` JSON to `env.WORKSPACE_CHAT_WEBHOOK`. Slack incoming webhooks don't return a permalink, so `post_url` stays null for chat in v1. When #1924 (Zulip) lands, swap the body builder and the env value in this single file — `dispatcher.ts` is unchanged. If `WORKSPACE_CHAT_WEBHOOK` is unset (dev environments), the adapter no-ops with `{ ok: false, error: 'webhook_unset' }` and the channel row records this; it does not throw.

### 2.4 Late-addition fallback

When a reviewer approves a channel on an artifact already in `published` state (e.g., adds `workspace_chat` after publish), the channel-approval handler runs `dispatchDbEffects` then `dispatchOutbound` against the same artifact. Both are idempotent — already-`posted` channels are skipped, requested-but-not-approved are skipped, and only the newly-approved channel takes the post path.

---

## 3. API surface

All new endpoints; nothing replaces or breaks existing routes.

### 3.1 Public

| Endpoint | Purpose |
|---|---|
| `GET /announcements/:slug` | New. Visibility-filtered detail (published + scope check). Returns title, body, link_url, host_group, host_org, scope, expires_at. 404 for draft / in_review / out-of-scope. |

`GET /announcements/active-banner` is mostly unchanged — already shipped in Plan 1 and starts returning rows once the dispatcher flips `site_banner` channels to `posted`. The response shape gains one field, `slug`, so `<SiteBanner />` can compose the default `/announcements/:slug` link when `link_url` is null.

### 3.2 Author submit / create

| Endpoint | Change |
|---|---|
| `POST /events/submit` | Extended with optional `broadcast: { channels: BroadcastChannel[]; preparedText?: string }`. Inside the same tx that creates the event and transitions it to `in_review`, insert one `broadcast_requests` row and N `broadcast_channels` rows with `status='requested'`. Empty `channels` array creates nothing. Field absent = no broadcast. |
| `POST /admin/announcements` | Extended with the same `broadcast` field, same semantics. Author is staff in this case. |

Forms creation is untouched.

### 3.3 Reviewer per-channel actions

New nested group `/admin/broadcasts/`:

| Endpoint | Purpose |
|---|---|
| `GET /admin/broadcasts/queue` | Manual-handoff sub-queue. Filter: `status='approved' AND posted_at IS NULL AND channel IN (twitter_x, bluesky, mastodon, linkedin)`. Joins to parent artifact for title, type, host. Optional `?include_errored_native=1` flag adds native channels with `attempt_count > 0` and `status='approved'`. |
| `POST /admin/broadcasts/channels/:channelId/approve` | Approve a channel. Optional body `{ preparedText? }` overrides the inherited text. If parent artifact is already `published`, calls `dispatchOnPublish` (late-addition fallback). |
| `POST /admin/broadcasts/channels/:channelId/decline` | Decline a channel. Required body `{ reason }`. |
| `POST /admin/broadcasts/channels/:channelId/mark-posted` | Manual-channel close. Required body `{ postUrl }`. |
| `POST /admin/broadcasts/channels/:channelId/retry` | Re-attempt a native channel. Calls dispatcher logic for just this channel; clears `last_error` on success. |
| `POST /admin/broadcasts/requests/:requestId/channels` | Reviewer add-channel. Inserts a `broadcast_channels` row with `status='approved'`, `decided_by=actor`, `decided_at=now()`. Late-addition fallback applies. Audit action `broadcast_channels.add_by_reviewer`. |

### 3.4 Authorization

All `/admin/broadcasts/*` write endpoints:
- Require `systemTier >= 1` (staff).
- Forbid self-approval — actor cannot be `broadcast_requests.created_by`. Same predicate the artifact review actions already use.

### 3.5 Audit

Every channel write logs to `audit_log` with target `(broadcast_channels, channelId)` and one of: `broadcast_channels.approve`, `broadcast_channels.decline`, `broadcast_channels.mark_posted`, `broadcast_channels.add_by_reviewer`, `broadcast_channels.retry`. Failed native deliveries log a separate entry with the truncated error for traceability.

---

## 4. UI surfaces

### 4.1 Public (`apps/web`)

| File | Change |
|---|---|
| `apps/web/src/pages/announcements/AnnouncementDetailPage.tsx` (new) | Route `/announcements/:slug`. Mirrors `EventDetailPage` shape: title, body (sanitized HTML/markdown — same renderer the admin preview uses), host badge (group or org chip linking to that page), expires_at notice, back link to `/news`. 404 falls through to root 404. |
| `apps/web/src/components/SiteBanner.tsx` (extend) | When the API response's `linkUrl` is null, default to `/announcements/:slug`. Existing dismiss + localStorage logic unchanged. Active-banner endpoint response shape gains `slug` so the component can compose the URL. |
| `apps/web/src/pages/events/SubmitEventPage.tsx` (extend) | New "Promote this event" section: multi-select chip group of channels (defaults: `site_banner` + `workspace_chat` checked, external social unchecked); single `prepared_text` textarea (default filled from `name + ' — ' + location`). All optional; skipping creates no broadcast_request. |

### 4.2 Admin (`apps/admin`)

| File | Change |
|---|---|
| `apps/admin/src/pages/announcements/NewAnnouncementPage.tsx` (extend) | Same "Promote this announcement" section. Default prepared_text from `title + ' — ' + body.slice(0, 140)`. |
| `apps/admin/src/pages/events/EventDetailPage.tsx` and `apps/admin/src/pages/announcements/AnnouncementDetailPage.tsx` (extend) | New "Broadcast" panel beside existing Reviews / Comments tabs. Per requested channel: channel name, status chip, inline prepared_text editor, prepared_image preview, action buttons (approve / decline / mark-posted / retry / remove-while-requested). "Add channel" button at the bottom. Self-approval is disabled with a tooltip explaining why. Failed native channels show a red error chip with truncated `last_error`. |
| `apps/admin/src/pages/broadcasts/BroadcastsQueuePage.tsx` (new) | `/admin/broadcasts` sub-queue. Table: artifact title (link to parent detail), channel chip, decided_at, prepared_text excerpt, prepared_image thumbnail, action buttons. Default filter: approved & unposted manual. Toggle: "Include errored native channels". |
| `apps/admin/src/layout/AdminNav.tsx` (extend) | Add "Broadcasts" nav item with badge: count of `approved AND posted_at IS NULL` across manual channels + errored native. Same badge pattern Groups uses. |

No changes to events/announcements list pages, comments UI, vocab, organizations, or the forms subsystem.

---

## 5. Testing

### 5.1 Unit (`packages/api/src/test/` and colocated)

- `lib/broadcast/dispatcher.test.ts` — site_banner publishes within tx; workspace_chat success flips to posted; webhook 5xx leaves status=approved + records last_error + increments attempt_count; manual channels are left alone; already-posted channels are skipped (idempotency); late-addition fallback fires on channel approval when artifact already published.
- `lib/broadcast/chatAdapter.test.ts` — Slack `blocks` payload snapshot; unset webhook env returns typed error without throwing.
- `routes/admin/broadcasts/*.test.ts` — auth gate (non-staff 403); self-approval forbidden; decline-without-reason 400; retry on already-posted channel no-ops; add-channel duplicate rejected by existing unique constraint.
- `routes/announcements.test.ts` (extend) — `GET /announcements/:slug` 200 published+in-scope, 404 draft, 404 out-of-scope.
- `routes/eventsSubmit.test.ts` (extend) — submit-without-broadcast unchanged; submit-with-broadcast creates request + N channels atomically; submit with empty channels array creates no broadcast_request.
- `lib/lifecycle/applyTransition.test.ts` (extend) — approve-to-published calls dispatcher; dispatcher network failure does not roll back the publish.

### 5.2 Integration (`packages/api/src/test/integration.test.ts`)

Full path: member submits event with `site_banner` + `workspace_chat` + `twitter_x` requested → first staff approves channels + artifact → second staff approves → assert:
- Event status = `published`.
- `site_banner` channel = `posted` with posted_at set.
- Chat adapter mock received expected payload.
- `twitter_x` row sits in `GET /admin/broadcasts/queue`.
- `GET /announcements/active-banner` would return null for this entity (it's an event, not an announcement) — included only as negative-case clarity.

Parallel announcement path: same flow against an announcement asserts `active-banner` returns the row.

### 5.3 Manual smoke (local dev server)

1. Member submits an event with all three native + one social channel; appears in `/admin/queue` as `in_review`.
2. Two staff approve; artifact publishes; banner appears on `/`; configured Slack channel receives the message; twitter row appears in `/admin/broadcasts`.
3. Staff marks the twitter row posted with a fake URL; row disappears from queue; audit log shows `mark_posted`.
4. Force `WORKSPACE_CHAT_WEBHOOK` to an invalid value; redo the flow; banner still publishes, workspace_chat row shows a red error chip; retry from the sub-queue clears it.

---

## 6. Rollout

- Single migration `0023_broadcast_plan5.sql` applies cleanly in one shot. Backfilled slug guarantees `/announcements/:slug` doesn't 404 for pre-existing rows.
- New env var `WORKSPACE_CHAT_WEBHOOK`. Required in production; optional in dev — adapter no-ops with a typed error if missing.
- No feature flag. The flow is gated by author opt-in (no broadcast section filled = no broadcast_request) and the existing two-approver publish gate. Spam blast radius is bounded by approvers + manual-handoff for external social.

---

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Slack webhook flap blocks publish UX | Dispatcher runs outbound calls outside the publish tx; failures leave channel `approved`, never roll back the artifact. Retry from sub-queue. |
| Zulip migration (#1924) churn | Confined to `chatAdapter.ts` body builder + env value. `dispatcher.ts` and routes unchanged. |
| Banner stacking after multiple publishes | Plan 1 contract already enforces a single active banner (most-recent published with posted site_banner channel). Plan 5 doesn't change this. |
| Author forgets to request channels at submit | Reviewer add-channel affordance covers it without a round-trip. |
| External social sub-queue grows stale | Sub-queue is sorted by `decided_at DESC` and badged in nav; staleness is visible. n8n (#1925) eliminates it later. |
| Late-addition firing twice | `dispatchOnPublish` is idempotent — already-posted channels skip the post path. |

---

## 8. Successor work

- #1924 — swap `chatAdapter.ts` body builder + env to Zulip.
- #1925 — n8n channel adapter for the four external-social channels; `/admin/broadcasts` becomes a monitoring surface rather than a workflow surface.
- #1965 — newsletter channel adapter (separate plan; not implied here).
- Forms broadcast — only when a use case appears that isn't already served by an announcement.
