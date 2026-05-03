# Database Schema Amendments — 2026-05-02 (Round 2)

**Issue:** #1917 (feat(db): set up NeonDB + Drizzle ORM with membership schema)
**Parent spec:** [`2026-04-28-db-schema-design.md`](2026-04-28-db-schema-design.md)
**Prior amendment:** [`2026-05-02-db-schema-amendments.md`](2026-05-02-db-schema-amendments.md)
**Date:** 2026-05-02
**Status:** Approved

---

## Summary

Second amendment covering three new domains the parent spec doesn't model:

1. **Events and attendance** — conferences, workshops, and who attended/spoke/sponsored.
2. **Leadership terms** — board members, executive director, and staff with start/end dates so "current" and "former" are both queryable.
3. **Event committees (EPC)** — the conference Executive Planning Committee structure with six areas (general, technical program, communications, logistics, sponsorship, community engagement) and a chair/co-chair level.

**Net change:** 6 new tables, 4 new enums, 0 removals from the parent spec or amendment 1. **Final table count: 25.**

---

## Tables — new

### `events`

Conferences, workshops, and other dated gatherings. Distinct from `groups`, which is for persistent collectives (working/affinity/regional groups).

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `slug` | `text` | unique, not null (e.g. `usrse-26`) |
| `name` | `text` | not null (e.g. `USRSE'26`) |
| `type` | `event_type` enum | not null |
| `start_date` | `date` | not null |
| `end_date` | `date` | nullable (null = single-day) |
| `location` | `text` | nullable |
| `url` | `text` | nullable |
| `description` | `text` | nullable |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |
| `deleted_at` | `timestamptz` | nullable |

**Indexes:** `events.start_date` (standard), `events.type` (standard).

### `event_attendances`

Member ↔ event with role.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `users.id`, not null, `ON DELETE CASCADE` |
| `event_id` | `uuid` | FK → `events.id`, not null, `ON DELETE CASCADE` |
| `role` | `event_attendance_role` enum | not null, default `attendee` |
| `notes` | `text` | nullable (free text — talk title, sponsor tier, etc.) |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

**Constraint:** `UNIQUE(user_id, event_id, role)` — same person can't be recorded twice with the same role on the same event. They can have multiple roles on the same event (e.g., attendee + speaker = two rows).

**Indexes:** `event_attendances.event_id` (standard).

### `leadership_positions`

Vocab table for board / executive / staff positions. Admin-seeded; closed list defined by bylaws and org structure. **No user-suggestion path.**

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `slug` | `text` | unique, not null |
| `label` | `text` | not null |
| `position_type` | `leadership_position_type` enum | not null |
| `description` | `text` | nullable |
| `sort_order` | `integer` | default `0` |
| `status` | `vocab_status` | default `approved` |
| `created_at` | `timestamptz` | default `now()` |

**Indexes:** partial on `status` where `status = 'approved'`.

### `leadership_terms`

Person × position × dates. The same user can hold multiple positions over time, and the same user can hold overlapping positions (e.g., promoted to Treasurer mid-term while their Member-at-Large term continues — this is intentionally allowed).

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `users.id`, not null, `ON DELETE RESTRICT` |
| `position_id` | `uuid` | FK → `leadership_positions.id`, not null, `ON DELETE RESTRICT` |
| `start_date` | `date` | not null |
| `end_date` | `date` | nullable (null = currently serving) |
| `notes` | `text` | nullable |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |
| `deleted_at` | `timestamptz` | nullable |

**Indexes:** `leadership_terms.user_id`, `leadership_terms.position_id`, partial on `end_date` where `end_date IS NULL` (the "current officeholders" hot path).

`ON DELETE RESTRICT` on the FKs is deliberate — soft-deleting a person should *not* destroy their term history. Hard-delete a user only after archiving the terms manually.

### `event_committee_areas`

Vocab table for EPC areas. Six entries, admin-seeded, fixed structure. No user-suggestion path.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `slug` | `text` | unique, not null |
| `label` | `text` | not null |
| `description` | `text` | nullable |
| `sort_order` | `integer` | default `0` |
| `status` | `vocab_status` | default `approved` |
| `created_at` | `timestamptz` | default `now()` |

### `event_committee_assignments`

Person × event × area × level. The vehicle for tracking EPC membership year over year.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `users.id`, not null, `ON DELETE CASCADE` |
| `event_id` | `uuid` | FK → `events.id`, not null, `ON DELETE CASCADE` |
| `area_id` | `uuid` | FK → `event_committee_areas.id`, not null, `ON DELETE RESTRICT` |
| `level` | `event_committee_level` enum | not null |
| `notes` | `text` | nullable |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |
| `deleted_at` | `timestamptz` | nullable |

**Constraint:** `UNIQUE(user_id, event_id, area_id, level)` — prevents duplicate rows for the exact same (person, event, area, level). Allows the same person to hold both `chair` and `co_chair` on the same area of the same event in unusual cases (mid-event role change), and allows two different people to share `co_chair` on the same area.

**Indexes:** `event_committee_assignments.event_id`, `event_committee_assignments.area_id`, partial on `level` where `level = 'chair'` (the "who chaired this" hot path).

---

## Enums — new

| Enum | Values |
| --- | --- |
| `event_type` | `conference`, `workshop`, `meetup`, `webinar`, `community_call`, `other` |
| `event_attendance_role` | `attendee`, `speaker`, `organizer`, `sponsor`, `volunteer` |
| `leadership_position_type` | `board`, `executive`, `staff`, `advisor` |
| `event_committee_level` | `chair`, `co_chair` |

---

## Why these are separate tables (and not extensions of existing ones)

| Tempting shortcut | Why it's wrong |
| --- | --- |
| Fold board service into `experiences` | `experiences` is *external* career history. Board service is *internal* governance of US-RSE itself. Different display surfaces (career section vs. /about/board), different audit trails, different lifecycle. |
| Fold board into `group_memberships` with a "board" group type | Bylaws-defined positions aren't groups. The board has elected positions with terms — `group_membership_role` (member/chair/co_chair) doesn't capture President / VP / Treasurer / Secretary / Member-at-Large. |
| Fold EPC roles into `event_attendance_role` | Attendance is "I was there." Committee work is governance/labor — closer to leadership than attendance. Mixing them clutters the role enum and makes "who was on the program committee" queries noisier. |
| Fold conferences into `groups` | Groups are persistent (working groups exist for years). Events have start/end dates and are point-in-time. Different lifecycle, different queries, different UX. |

---

## Seed data

### `leadership_positions` (proposed starter — confirm against bylaws and `/about/board`, `/about/staff`)

| `slug` | `label` | `position_type` | `sort_order` |
| --- | --- | --- | ---:|
| `president` | President | `board` | 10 |
| `vice_president` | Vice President | `board` | 20 |
| `treasurer` | Treasurer | `board` | 30 |
| `secretary` | Secretary | `board` | 40 |
| `member_at_large` | Member-at-Large | `board` | 50 |
| `executive_director` | Executive Director | `executive` | 100 |

Staff and advisor positions can be seeded once the canonical list is confirmed from current site content. Empty admin-managed lists are also fine — seed only what's stable.

### `event_committee_areas`

| `slug` | `label` | `sort_order` |
| --- | --- | ---:|
| `general` | General | 10 |
| `technical_program` | Technical Program | 20 |
| `communications` | Communications | 30 |
| `logistics` | Logistics | 40 |
| `sponsorship` | Sponsorship | 50 |
| `community_engagement` | Community Engagement | 60 |

### `events` (historical USRSE conferences)

Seed past USRSE conferences so historical attendance and EPC imports work without a manual admin step. Concrete dates and slugs to confirm against past programs:

| `slug` | `name` | `type` | `start_date` | `end_date` |
| --- | --- | --- | --- | --- |
| `usrse-22` | USRSE'22 | `conference` | 2022 dates | 2022 dates |
| `usrse-23` | USRSE'23 | `conference` | 2023 dates | 2023 dates |
| `usrse-24` | USRSE'24 | `conference` | 2024 dates | 2024 dates |
| `usrse-25` | USRSE'25 | `conference` | 2025 dates | 2025 dates |
| `usrse-26` | USRSE'26 | `conference` | from `/events/usrse26` | from `/events/usrse26` |

Other event types (workshops, meetups, community calls) are admin-managed in the dashboard, not seeded.

---

## Indexes

In addition to per-table indexes listed above:

| Index | Type |
| --- | --- |
| `events.start_date` | standard (chronological listing) |
| `events.type` | standard (filter by conference vs. workshop) |
| `event_attendances.event_id` | standard (attendee list lookup) |
| `event_committee_assignments.event_id` | standard (EPC roster lookup) |
| `event_committee_assignments.area_id` | standard ("history of sponsorship leadership") |
| `event_committee_assignments.level_chair_idx` | partial: `WHERE level = 'chair'` |
| `leadership_terms.user_id` | standard (per-person leadership history) |
| `leadership_terms.position_id` | standard (current/former officeholders for a role) |
| `leadership_terms.current_idx` | partial: `WHERE end_date IS NULL` |

---

## Real-world queries this enables

| Question | Query shape |
| --- | --- |
| Who chaired USRSE'25 (general)? | `event_committee_assignments` join `event_committee_areas` where `area.slug='general' AND level='chair' AND event.slug='usrse-25'` |
| Cordero's full leadership + EPC history | union of `leadership_terms` and `event_committee_assignments` filtered by `user_id` |
| Current board roster | `leadership_terms` where `position_type='board' AND end_date IS NULL` |
| Former Executive Directors | `leadership_terms` where `position_type='executive' AND end_date IS NOT NULL` |
| All sponsorship leadership across years | `event_committee_assignments` where `area.slug='sponsorship'` joined to `events` ordered by `start_date` |
| Speakers at any conference | `event_attendances` where `role='speaker'` |
| Attendees of multiple USRSE conferences (loyalty signal) | `event_attendances` joined to `events` of `type='conference'`, group by `user_id` having `count > 1` |

---

## Updated totals (across both amendments)

|  | Parent | Amendment 1 | Amendment 2 | Final |
| ---:| ---:| ---:| ---:| ---:|
| Tables | 15 | +4 | +6 | **25** |
| Enums | 5 | 0 | +4 | **9** |
| Vocab tables | 5 | +3 | +2 | **10** |
| Vocab — user-suggestable | 3 | 0 | 0 | 3 |
| Vocab — admin-seeded only | 2 | +3 | +2 | **7** |
| Join / link tables | 3 | +1 | +2 | **6** |
| Term-style tables (start/end dates) | 1 | 0 | +1 (`leadership_terms`) | **2** |
| Column additions to existing tables | — | +14 | 0 | — |

---

## Migration strategy

This is migration `0001` against the schema in migration `0000`. It only adds — no changes to existing tables.

Order of operations within the migration:

1. New enums (`event_type`, `event_attendance_role`, `leadership_position_type`, `event_committee_level`)
2. Vocab tables: `leadership_positions`, `event_committee_areas`
3. Core: `events`
4. Joins / term tables: `event_attendances`, `leadership_terms`, `event_committee_assignments`

Then the seed script extends to populate the new vocab and the historical events list.
