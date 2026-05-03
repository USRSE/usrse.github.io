# Database Schema Amendments — 2026-05-02 (Round 3)

**Issue:** #1917 (feat(db): set up NeonDB + Drizzle ORM with membership schema)
**Parent spec:** [`2026-04-28-db-schema-design.md`](2026-04-28-db-schema-design.md)
**Prior amendments:** [`2026-05-02-db-schema-amendments.md`](2026-05-02-db-schema-amendments.md), [`2026-05-02-db-schema-amendments-2.md`](2026-05-02-db-schema-amendments-2.md)
**Date:** 2026-05-02
**Status:** Approved

---

## Summary

Third amendment, scoped narrowly to one new domain: **conference sessions and their presenters/authors.** This covers Birds of a Feather sessions, posters, talks, workshops, notebooks, and papers — anything a member presented or contributed to at an event.

**Net change:** 3 new tables, 1 new enum, 0 removals. **Final table count: 28.**

---

## Driver

Amendment 2 added `event_attendances` with a role enum that includes `speaker`, but a `speaker` row can't model:

- Multi-author papers where co-authors share authorship of a single artifact
- Workshops with co-instructors
- BoFs with co-leads
- Author ordering (first author vs. third author)
- Session-level metadata (title, abstract, DOI, recording URL)

The fix is to model **sessions as first-class entities** that exist within an event, with presenters joined many-to-many. `event_attendances` continues to track straightforward roles (attendee, sponsor, volunteer, organizer) — sessions live in their own tables.

---

## Tables — new

### `event_session_types`

Vocab table for the kinds of session a member can lead or contribute to. Admin-seeded; no user-suggestion path.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `slug` | `text` | unique, not null |
| `label` | `text` | not null |
| `description` | `text` | nullable |
| `sort_order` | `integer` | default `0` |
| `status` | `vocab_status` | default `approved` |
| `created_at` | `timestamptz` | default `now()` |

**Indexes:** partial on `status` where `status = 'approved'`.

### `event_sessions`

One row per session at an event. The session itself owns the title, abstract, and links — presenters attach via the join table below.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `event_id` | `uuid` | FK → `events.id`, not null, `ON DELETE CASCADE` |
| `type_id` | `uuid` | FK → `event_session_types.id`, not null, `ON DELETE RESTRICT` |
| `title` | `text` | not null |
| `abstract` | `text` | nullable |
| `url` | `text` | nullable (slides, repo, paper landing) |
| `recording_url` | `text` | nullable |
| `doi` | `text` | nullable (papers, notebooks) |
| `presented_at` | `timestamptz` | nullable (specific time within multi-day events) |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |
| `deleted_at` | `timestamptz` | nullable |

**Indexes:** `event_sessions.event_id`, `event_sessions.type_id`.

### `event_session_presenters`

Join: session × user × role + ordering.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `session_id` | `uuid` | FK → `event_sessions.id`, not null, `ON DELETE CASCADE` |
| `user_id` | `uuid` | FK → `users.id`, not null, `ON DELETE RESTRICT` |
| `role` | `event_presenter_role` enum | not null |
| `sort_order` | `integer` | not null, default `0` |
| `notes` | `text` | nullable |
| `created_at` | `timestamptz` | default `now()` |
| `deleted_at` | `timestamptz` | nullable |

**Constraint:** `UNIQUE(session_id, user_id)` — a person can't appear twice on the same session.

**Indexes:** `event_session_presenters.user_id` (per-person history hot path), partial on `role` where `role = 'lead'`.

`ON DELETE RESTRICT` on `user_id` is deliberate — soft-deleting a person should not destroy their authorship record. Hard-delete a user only after archiving their sessions manually.

---

## Enum — new

| Enum | Values |
| --- | --- |
| `event_presenter_role` | `lead`, `contributor` |

`lead` is the primary author / lead presenter / workshop organizer. `contributor` covers co-authors, co-presenters, mentors, panelists. `sort_order` within a session captures author ordering (first author = lowest sort_order among `lead`s, then contributors).

---

## API-layer invariants (not enforced at the DB)

- **Every session must have at least one `lead`.** Validate this in the route handlers when inserting/updating sessions. A DB CHECK against a subquery is technically possible but expensive and tangles deletion semantics; doing it in the API keeps the model simple.
- **Author ordering is per-session.** `sort_order` is unique only within a single `session_id`; no DB constraint enforces this either, but the API should renumber on insert/move and warn on collisions.

---

## Seed values for `event_session_types`

| `slug` | `label` | `sort_order` |
| --- | --- | ---:|
| `talk` | Talk / Presentation | 10 |
| `poster` | Poster | 20 |
| `bof` | Birds of a Feather | 30 |
| `workshop` | Workshop | 40 |
| `paper` | Paper / Proceedings | 50 |
| `notebook` | Notebook | 60 |

Other types (tutorial, lightning_talk, panel) can be added by admins as the EPC formalizes the program structure. Easier to add than to retire.

---

## Real-world queries this enables

| Question | Query shape |
| --- | --- |
| All papers Cordero co-authored at USRSE conferences | `event_sessions` join `presenters` where `user_id=?` and `type.slug='paper'` and event type=conference |
| Lead of the "Open Science" BoF at USRSE'25 | `presenters where role='lead'` joined to sessions where `type.slug='bof' AND title ILIKE '%open science%'` and `event.slug='usrse-25'` |
| Cordero's full session history, newest first | `presenters` where `user_id=?` joined to sessions and events ordered by `events.start_date DESC, sessions.presented_at DESC` |
| Authors of a specific paper, in canonical order | `presenters` where `session_id=?` ordered by `role` (lead first), then `sort_order` |
| All sessions led by current board members at USRSE'26 | `presenters where role='lead'` joined to `leadership_terms` (current board) joined to sessions at `event.slug='usrse-26'` |

---

## What this does NOT model (deferred)

| Concept | Why deferred |
| --- | --- |
| Session ratings / feedback | Out of scope — no audience-feedback tooling planned for v1 |
| Talk track / room / scheduling | Conference scheduling is event-management software territory; only `presented_at` is captured here |
| Submission and review workflow | Papers/posters that are reviewed before acceptance need a review pipeline (submissions, reviewers, decisions) — separate spec when needed |
| Funding sources / acknowledgments per session | Free-text `notes` covers this for now |

---

## Updated totals (across all amendments)

|  | Parent | Amendment 1 | Amendment 2 | Amendment 3 | Final |
| ---:| ---:| ---:| ---:| ---:| ---:|
| Tables | 15 | +4 | +6 | +3 | **28** |
| Enums | 5 | 0 | +4 | +1 | **10** |
| Vocab tables | 5 | +3 | +2 | +1 | **11** |
| Join / link tables | 3 | +1 | +2 | +1 | **7** |

---

## Migration strategy

This is migration `0002` against the schema in migrations 0000 + 0001. Pure additions — no changes to existing tables.

Order within the migration:

1. New enum: `event_presenter_role`
2. Vocab table: `event_session_types`
3. Core: `event_sessions`
4. Join: `event_session_presenters`

The seed script extends to populate the 6 starter session types.
