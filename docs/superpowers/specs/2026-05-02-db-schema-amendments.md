# Database Schema Amendments — 2026-05-02

**Issue:** #1917 (feat(db): set up NeonDB + Drizzle ORM with membership schema)
**Parent spec:** [`2026-04-28-db-schema-design.md`](2026-04-28-db-schema-design.md)
**Date:** 2026-05-02
**Status:** Approved

---

## Summary

This is an amendment to the original schema spec, not a replacement. It captures three things:

1. **New requirements** that surfaced after sampling the legacy membership CSV (3,903 rows) and reviewing the consent / privacy surface area.
2. **Clarifications** to columns mentioned in the issue body that the parent spec correctly omits (e.g. `sessions`, `research_interests` array).
3. **Explicitly deferred items** so future readers don't think they were forgotten.

**Net change:** 4 new tables, 14 column additions, 0 removals from the parent spec. Final table count: **19** (was 15).

---

## Driver — what the legacy CSV told us

Sampling the engagement-type column across all 3,903 rows surfaced **563 distinct strings** that all decompose into combinations of just **7 base options** (the original Google Form is multi-select). This kills the original draft idea of `engagement_type_id` as a single FK on `profiles` — the data shape is many-to-many.

The CSV also has location and primary-engagement data that the parent spec doesn't structure, and we need consent timestamps before any real user signs up.

---

## Tables — additions to existing

### `users` — consent and import-source tracking

| Column | Type | Constraints | Why |
| --- | --- | --- | --- |
| `terms_accepted_at` | `timestamptz` | not null on insert (default `now()`) | Track when consent happened so a future ToS update can prompt re-consent without invalidating existing members. |
| `privacy_accepted_at` | `timestamptz` | not null on insert (default `now()`) | Same reasoning, separate timestamp because privacy policy versions independently. |
| `marketing_consent` | `boolean` | default `false` | Opt-in for non-transactional emails. CAN-SPAM / GDPR hygiene. |
| `is_legacy_import` | `boolean` | default `false` | Marks users imported from the pre-2026 Google Form. Lets the "claim your account" flow find them and lets admins audit forever. |

### `profiles` — location structure and engagement linkage

The earlier proposal of a single `engagement_type_id` FK on `profiles` is **dropped** in favor of the join table below. The remaining additions are all about location.

| Column | Type | Constraints | Why |
| --- | --- | --- | --- |
| `career_stage_id` | `uuid` | FK → `career_stages.id`, nullable | Optional but enables mentor/mentee matching and demographic filtering. |
| `country_id` | `uuid` | FK → `countries.id`, nullable | Structured location for the directory and map. ISO 3166-backed. |
| `region` | `text` | nullable | US states / Canadian provinces / equivalents. Free text because the world's subdivisions aren't worth a vocab. |
| `city` | `text` | nullable | Free text. |
| `latitude` | `numeric(9,6)` | nullable | Geocoded at save time for the homepage map. Omit entirely if `show_on_map = false`. |
| `longitude` | `numeric(9,6)` | nullable | Same. |
| `show_on_map` | `boolean` | default `false` | Map opt-in. Independent of `is_public` — a user can be in the directory but decline a map pin. |
| `public_location` | `text` | nullable | Display string for the map ("Seattle, WA"). User-controlled wording, separate from structured `country_id` / `region` / `city`. |

### `audit_log` — actor role at time of action

| Column | Type | Constraints | Why |
| --- | --- | --- | --- |
| `actor_role` | `user_role` (enum) | not null | Snapshot the actor's role at the moment of action. Without this, an action by someone who later gets demoted from admin becomes ambiguous in retrospect. |

### `institutions` — merge support for cleanup

| Column | Type | Constraints | Why |
| --- | --- | --- | --- |
| `merged_into_id` | `uuid` | FK → `institutions.id` (self), nullable | When the import surfaces "Univ. of Washington" / "University of Washington" / "UW" as separate rows, merging one into another should leave a redirect rather than orphan profile FKs. Queries follow the chain. |

---

## Tables — new

### `engagement_types`

Vocab table for the 7 ways someone can be engaged with research software. Admin-seeded only; **no user-suggestion path** because this is a closed list defined by the membership form.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `slug` | `text` | unique, not null |
| `label` | `text` | not null |
| `description` | `text` | nullable |
| `sort_order` | `integer` | default `0` |
| `status` | `vocab_status` | default `approved` |
| `created_at` | `timestamptz` | default `now()` |

**Seed values** (from CSV analysis):

| `slug` | `label` |
| --- | --- |
| `research_software_engineer` | Research Software Engineer |
| `researcher` | Researcher |
| `writes_code_secondary` | Writes code for research (secondary activity) |
| `uses_research_software` | Uses research software |
| `software_engineer_non_research` | Software engineer (non-research) |
| `manages_rses` | Manages RSEs |
| `rse_ally` | RSE ally |

### `user_engagement_types`

Join table — many-to-many between users and engagement types.

| Column | Type | Constraints |
| --- | --- | --- |
| `user_id` | `uuid` | FK → `users.id`, not null |
| `engagement_type_id` | `uuid` | FK → `engagement_types.id`, not null |

**PK:** `(user_id, engagement_type_id)`.

### `career_stages`

Vocab table for career stage. Admin-seeded only; no user-suggestion path.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `slug` | `text` | unique, not null |
| `label` | `text` | not null |
| `sort_order` | `integer` | default `0` |
| `status` | `vocab_status` | default `approved` |
| `created_at` | `timestamptz` | default `now()` |

**Seed values:** `student`, `early_career`, `mid_career`, `senior`, `faculty`, `industry`, `retired`.

### `countries`

Vocab table for country, seeded from ISO 3166-1.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `iso_alpha2` | `char(2)` | unique, not null (e.g. `US`, `GB`, `DE`) |
| `iso_alpha3` | `char(3)` | unique, not null (e.g. `USA`, `GBR`, `DEU`) |
| `name` | `text` | not null |
| `sort_order` | `integer` | default `0` |
| `created_at` | `timestamptz` | default `now()` |

Admin-seeded from the canonical ISO list. **No `status` column** — the world's countries aren't approved/rejected. **No `suggested_by`** — users can't invent countries.

---

## Indexes — additions

| Index | Type |
| --- | --- |
| `users.is_legacy_import` | partial: `WHERE is_legacy_import = true` |
| `profiles.country_id` | standard |
| `profiles.show_on_map` | partial: `WHERE show_on_map = true` |
| `user_engagement_types.engagement_type_id` | standard (the user-side is covered by the PK) |
| `engagement_types.status` | partial: `WHERE status = 'approved'` |
| `career_stages.status` | partial: `WHERE status = 'approved'` |
| `audit_log.actor_role` | standard |

No spatial index on `(latitude, longitude)` for v1 — at <10k members brute-force scans are fine; revisit if the homepage map gets slow.

---

## Clarifications — what's NOT being added

The issue body for #1917 mentions some columns that the parent spec correctly omits. Recording the rationale here so they don't get re-added by accident.

| Mentioned in issue | Why it's not in the schema |
| --- | --- |
| `sessions` table | WorkOS owns sessions. AuthKit + PKCE keeps tokens in the browser. We do not run a session server. |
| `research_interests` array on `profiles` | Replaced by the `disciplines` vocab + `user_disciplines` join table. Same data, normalized, filterable. |
| `working_groups` / `affinity_groups` array on `profiles` | Replaced by the `groups` table + `group_memberships` join table. Adds role tracking (`chair`, `co_chair`) the array form can't express. |

---

## Deferred — explicitly out of scope for #1917

| Item | Why deferred |
| --- | --- |
| `awards` table | The site's awards content is currently hand-authored. No use case for the table yet; adding it without one is premature. Revisit when admin tooling lands. |
| `notification_preferences` (granular per-category) | `users.marketing_consent` covers the legal opt-in for v1. Per-category preferences (newsletter / governance / CFP / mentions) wait until those email streams actually exist. |
| File upload (CV PDFs, profile photos hosted by us) | Today `photo_url` references an external CDN. Cloudflare R2 + virus scanning can be a separate spec when we want hosted uploads. |
| Mentorship matching / direct messages | Member-system v2 territory. |
| Slug-history table for profiles | Nice-to-have when slug changes start breaking shared URLs. Not v1. |

---

## Migration strategy

This is a single Drizzle migration that lays down all 19 tables fresh. There's no schema to migrate *from* — `@us-rse/api` is greenfield against an empty Neon DB.

Order of operations:

1. Enums: `user_role`, `group_type`, `group_membership_role`, `vocab_status`, `org_tier`
2. Vocab tables: `pronouns`, `degree_types`, `engagement_types`, `career_stages`, `countries`, `skills`, `disciplines`, `institutions`
3. Core: `users`, `profiles`
4. Career: `experiences`, `education`, `certifications`
5. Groups: `groups`, `group_memberships`
6. Joins: `user_skills`, `user_disciplines`, `user_engagement_types`
7. System: `audit_log`

Then the seed script populates: pronouns, degree_types, engagement_types, career_stages, countries, groups (working/affinity/regional), institutions (org members), and the initial skills/disciplines starter sets.

---

## Updated totals

|  | Parent spec | This amendment | Final |
| --- | ---:| ---:| ---:|
| Tables | 15 | +4 | **19** |
| Vocab tables | 5 | +3 | 8 |
| Vocab tables that allow user suggestions | 3 (skills, disciplines, institutions) | 0 | 3 |
| Vocab tables admin-seeded only | 2 (pronouns, degree_types) | +3 (engagement_types, career_stages, countries) | 5 |
| Join tables | 2 (user_skills, user_disciplines) | +1 (user_engagement_types) | 3 |
| Column additions to existing tables | — | +14 | — |
