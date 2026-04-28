# Database Schema Design — US-RSE Membership System

**Issue:** #2 (feat(db): set up NeonDB + Drizzle ORM with membership schema)
**Parent:** #1 (Membership management system)
**Date:** 2026-04-28
**Status:** Approved

---

## Overview

The database for the US-RSE membership management system. Individual members only (organizational membership is a future concern). WorkOS owns identity and auth; our DB owns profile data, career history, group memberships, and admin audit trails.

**Tech stack:** NeonDB (serverless Postgres) + Drizzle ORM + Drizzle Kit migrations.

**15 tables total:**
- 2 core (users, profiles)
- 3 career (experiences, education, certifications)
- 2 groups (groups, group_memberships)
- 5 vocabulary (skills, disciplines, institutions, pronouns, degree_types)
- 2 vocabulary joins (user_skills, user_disciplines)
- 1 system (audit_log)

---

## Auth Boundary

WorkOS is the source of truth for identity (email, password, SSO tokens, sessions). Our DB stores extended profile data linked via `workos_id`. We sync `email` into our `users` table for query convenience, but WorkOS is authoritative for auth.

## Deletion Strategy

Soft deletes via `deleted_at` timestamp on users, profiles, experiences, education, certifications, and groups. Queries filter on `deleted_at IS NULL` by default. Audit log entries are permanent (never deleted).

## Vocabulary Strategy

Controlled vocabulary tables (skills, disciplines, institutions, pronouns, degree_types) use a `status` enum (`approved`, `pending`, `rejected`). Members can suggest new entries (status = `pending`). Pending entries are visible only to the suggesting member until an admin approves them. Pronouns and degree_types are admin-seeded and default to `approved`.

---

## Tables

### users

The auth bridge. Thin by design — links to WorkOS, stores role and timestamps.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default `gen_random_uuid()` |
| workos_id | text | unique, not null |
| email | text | unique, not null (synced from WorkOS) |
| role | enum(`member`, `admin`, `super_admin`) | default `member` |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | default `now()` |
| deleted_at | timestamptz | nullable (soft delete) |

### profiles

All human-facing member data. 1:1 with users.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users.id, unique, not null |
| slug | text | unique (URL: `/members/cordero-core`) |
| display_name | text | not null |
| headline | text | nullable ("Senior RSE at UW") |
| pronoun_id | uuid | FK → pronouns.id, nullable |
| bio | text | nullable |
| photo_url | text | nullable |
| institution_id | uuid | FK → institutions.id, nullable |
| job_title | text | nullable |
| github_url | text | nullable |
| linkedin_url | text | nullable |
| orcid | text | nullable |
| website_url | text | nullable |
| is_public | boolean | default `true` |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | default `now()` |
| deleted_at | timestamptz | nullable |

### experiences

Work history entries. 1:N with users.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users.id, not null |
| title | text | not null |
| organization | text | not null (free text) |
| start_date | date | not null |
| end_date | date | nullable (null = current) |
| is_current | boolean | default `false` |
| description | text | nullable |
| sort_order | integer | default `0` |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | default `now()` |
| deleted_at | timestamptz | nullable |

### education

Academic history entries. 1:N with users.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users.id, not null |
| institution | text | not null (free text) |
| degree_type_id | uuid | FK → degree_types.id, not null |
| field_of_study | text | nullable |
| start_year | integer | nullable |
| end_year | integer | nullable (null = in progress) |
| description | text | nullable |
| sort_order | integer | default `0` |
| created_at | timestamptz | default `now()` |
| deleted_at | timestamptz | nullable |

### certifications

Professional certifications and licenses. 1:N with users.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users.id, not null |
| name | text | not null |
| issuing_org | text | not null |
| issue_date | date | nullable |
| expiry_date | date | nullable |
| credential_url | text | nullable |
| sort_order | integer | default `0` |
| created_at | timestamptz | default `now()` |
| deleted_at | timestamptz | nullable |

### groups

Working Groups, Affinity Groups, and Regional Groups.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| name | text | not null |
| slug | text | unique |
| type | enum(`working_group`, `affinity_group`, `regional_group`) | not null |
| description | text | nullable |
| is_active | boolean | default `true` |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | default `now()` |
| deleted_at | timestamptz | nullable |

### group_memberships

Join table: users ↔ groups with role tracking.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users.id, not null |
| group_id | uuid | FK → groups.id, not null |
| role | enum(`member`, `chair`, `co_chair`) | default `member` |
| joined_at | timestamptz | default `now()` |
| left_at | timestamptz | nullable (null = active) |

Constraint: `UNIQUE(user_id, group_id)`

### skills

Controlled vocabulary for member skills and research interests.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| name | text | unique, not null |
| slug | text | unique |
| status | enum(`approved`, `pending`, `rejected`) | default `pending` |
| suggested_by | uuid | FK → users.id, nullable |
| created_at | timestamptz | default `now()` |

### disciplines

Controlled vocabulary for research domains.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| name | text | unique, not null |
| slug | text | unique |
| status | enum(`approved`, `pending`, `rejected`) | default `pending` |
| suggested_by | uuid | FK → users.id, nullable |
| created_at | timestamptz | default `now()` |

### institutions

Controlled vocabulary for member affiliations. Also tracks organizational membership status.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| name | text | unique, not null |
| slug | text | unique |
| short_name | text | nullable ("Princeton") |
| url | text | nullable |
| is_org_member | boolean | default `false` |
| org_tier | enum(`premier`, `standard`, `basic`) | nullable |
| status | enum(`approved`, `pending`, `rejected`) | default `pending` |
| suggested_by | uuid | FK → users.id, nullable |
| created_at | timestamptz | default `now()` |

### pronouns

Controlled vocabulary for pronoun options.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| label | text | unique, not null |
| sort_order | integer | default `0` |
| status | enum(`approved`, `pending`, `rejected`) | default `approved` |
| created_at | timestamptz | default `now()` |

### degree_types

Controlled vocabulary for academic degree types.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| label | text | unique, not null |
| sort_order | integer | default `0` |
| status | enum(`approved`, `pending`, `rejected`) | default `approved` |
| created_at | timestamptz | default `now()` |

### user_skills

Join table: users ↔ skills (many-to-many).

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | FK → users.id |
| skill_id | uuid | FK → skills.id |

PK: `(user_id, skill_id)`

### user_disciplines

Join table: users ↔ disciplines (many-to-many).

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | FK → users.id |
| discipline_id | uuid | FK → disciplines.id |

PK: `(user_id, discipline_id)`

### audit_log

Admin action history. Permanent — never soft-deleted.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| actor_id | uuid | FK → users.id, not null |
| action | text | not null (dot notation: `member.deleted`) |
| target_type | text | not null (`user`, `group`, `skill`, etc.) |
| target_id | uuid | not null |
| payload | jsonb | nullable (before/after snapshots, context) |
| ip_address | text | nullable |
| created_at | timestamptz | default `now()` |

---

## Indexes

### Primary lookups
- `users.workos_id` — unique (from constraint)
- `users.email` — unique (from constraint)
- `users.deleted_at` — partial index `WHERE deleted_at IS NULL`
- `profiles.slug` — unique (from constraint)
- `profiles.user_id` — unique (from constraint)
- `profiles.institution_id` — standard index

### Career data
- `experiences.user_id` — standard index
- `education.user_id` — standard index
- `certifications.user_id` — standard index

### Groups
- `group_memberships(user_id, group_id)` — unique (from constraint)
- `group_memberships.group_id` — standard index

### Vocabulary
- `skills.status` — partial index `WHERE status = 'approved'`
- `disciplines.status` — partial index `WHERE status = 'approved'`
- `institutions.status` — partial index `WHERE status = 'approved'`

### Audit
- `audit_log.actor_id` — standard index
- `audit_log.target_type` — standard index
- `audit_log.created_at` — standard index

---

## Enums

Defined as Postgres enum types:

- `user_role`: `member`, `admin`, `super_admin`
- `group_type`: `working_group`, `affinity_group`, `regional_group`
- `group_membership_role`: `member`, `chair`, `co_chair`
- `vocab_status`: `approved`, `pending`, `rejected`
- `org_tier`: `premier`, `standard`, `basic`

---

## Seed Data

The seed script populates:

- **Pronouns**: he/him, she/her, they/them, he/they, she/they, ze/hir, any pronouns, prefer not to say
- **Degree types**: PhD, MS, MA, BS, BA, MBA, MD, JD, Other
- **Groups**: All 10 working groups, 7 affinity/regional groups (from current site data)
- **Institutions**: All 23 organizational members (from current site data), marked with `is_org_member = true` and appropriate `org_tier`
- **Skills**: Initial set of ~30 common RSE skills (Python, R, HPC, CI/CD, testing, containers, etc.)
- **Disciplines**: Initial set of ~20 research domains (climate science, bioinformatics, astrophysics, genomics, etc.)

---

## Infrastructure

- **NeonDB**: Serverless Postgres, connection via `@neondatabase/serverless` driver
- **Drizzle ORM**: Schema defined in TypeScript, type-safe queries, relations API
- **Drizzle Kit**: Migration generation (`drizzle-kit generate`), migration application (`drizzle-kit migrate`)
- **Connection**: Use `drizzle-orm/neon-http` adapter for serverless/edge compatibility
- **Environment**: `DATABASE_URL` env var for connection string
