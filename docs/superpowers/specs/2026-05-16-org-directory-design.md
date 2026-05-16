# Public Organizations Directory & Profile Design

**Status:** Approved
**Date:** 2026-05-16
**Related:** PR #1968 (identity), #1976 (vocab queue), #1981 (groups)
**Issue:** Filed during implementation kickoff in the same PR as the migration

---

## Goal

Replace the hardcoded `/resources/directory` page with a DB-driven public organizations directory at `/orgs`, and add UUID-keyed profile pages at `/orgs/:id` that respect each member's visibility settings. This completes the org chapter of admin-curated data by exposing it publicly.

## Architecture summary

- New public route file `packages/api/src/routes/organizations.ts` mounted at `/organizations`, exposing list + profile endpoints. No auth required; member rollup honors per-member visibility.
- New migration `0020_organizations_public_profile.sql` adds `type`, `country`, `description`, `created_by`, `updated_by` columns + a directory-serving partial index.
- New web pages under `apps/web/src/pages/orgs/` with a single `useOrganizations` hook for both list and profile data.
- Backfill via two new TS scripts: `backfill-org-types.ts` (heuristic classifier) and `backfill-org-locations.ts` (Wikidata + Photon + Wikipedia).
- Existing admin routes (`POST /admin/organizations`, `PATCH /admin/organizations/:id`) gain three optional fields and write `created_by`/`updated_by` from the actor.

## 1. Route layout

| Path | Before | After |
|---|---|---|
| `/orgs` | — | New directory (DB-driven, type/country/search filters) |
| `/orgs/:id` | — | New profile (UUID-keyed) |
| `/resources/directory` | Hardcoded directory | 301 redirect to `/orgs` |

**Nav placement:** Add **Organizations** as a sibling entry under the existing "Community" menu, after Regional Groups. The legacy "Resources → Directory" entry is removed. The rest of `/resources/*` is unchanged.

URL strategy: UUID-keyed (same call as Groups subsystem in PR #1981). Stable across renames, type changes, mergers; no slug-history table needed. The redirect from `/resources/directory` is unconditional — no slug-based deep links existed on the legacy page, so no per-org redirects are required.

## 2. Schema migration

`packages/api/migrations/0020_organizations_public_profile.sql`:

```sql
CREATE TYPE org_type AS ENUM (
  'university',
  'national_lab',
  'agency',
  'company',
  'nonprofit',
  'external_resource',
  'other'
);

ALTER TABLE organizations
  ADD COLUMN type org_type NOT NULL DEFAULT 'other',
  ADD COLUMN country text,
  ADD COLUMN description text,
  ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX organizations_directory_idx
  ON organizations (type, name)
  WHERE deleted_at IS NULL
    AND merged_into_id IS NULL
    AND status = 'approved';
```

Notes:
- `description` is `text` with a 280-char limit enforced at the API + UI layer (no DB `CHECK` — keeps flexibility for admin overrides without a migration).
- `country` is `text`, not enum (avoids the UK/United Kingdom edge cases and lets admins type any value). Admin form uses an autocomplete list of ISO country names but accepts free input.
- `type` defaults to `'other'` so the migration applies cleanly to existing rows; the type backfill script reclassifies after.
- `created_by` / `updated_by` are `ON DELETE SET NULL` — deleting an admin user must not cascade-delete or block the org.

Drizzle schema in `packages/api/src/db/schema/vocab.ts` is updated to declare the new columns and the `orgType` enum.

## 3. API endpoints

### `GET /organizations` (public)

Directory list. No auth.

**Query params:**
- `q` — substring search across `name`, `shortName`, `url` (case-insensitive)
- `type` — `university | national_lab | agency | company | nonprofit | external_resource | other | all` (default `all`)
- `country` — exact match against `country` column; omitted = all
- `member` — `true` to filter to active US-RSE member orgs (joins `org_memberships` where `started_at <= now() AND (ended_at IS NULL OR ended_at >= now())`)
- `cursor` — UUID cursor for pagination (last `id` from previous page)
- `limit` — default 50, max 200

**Base filter (always applied):**
```sql
status = 'approved' AND deleted_at IS NULL AND merged_into_id IS NULL
```

**Response shape:**

```ts
{
  ok: true,
  rows: Array<{
    id: string;                    // uuid
    name: string;
    shortName: string | null;
    url: string | null;
    type: OrgType;
    country: string | null;
    logoUrl: string | null;
    logoMarkUrl: string | null;
    memberCount: number;           // total user_organizations rows (current only)
    isOrgMember: boolean;          // active org_memberships row?
  }>;
  total: number;
  nextCursor: string | null;
  facets: {
    types: Record<OrgType, number>;
    countries: Record<string, number>;  // top 20 by count
  };
}
```

`memberCount` is the total of current `user_organizations` rows (`endedAt IS NULL`), regardless of any member's visibility. The roster-filter logic runs on the profile endpoint, not the list endpoint.

### `GET /organizations/:id` (public)

Profile. No auth required; reads `c.get("actor")` via the existing optional-auth middleware to decide which roster to return.

**404 conditions:**
- `status != 'approved'`
- `deleted_at IS NOT NULL`
- `merged_into_id IS NOT NULL`

These apply identically to anonymous, member, and admin callers. Admins use `/admin/organizations/:id` for the unfiltered case.

**Response shape:**

```ts
{
  ok: true,
  organization: {
    id: string;
    name: string;
    shortName: string | null;
    url: string | null;
    type: OrgType;
    country: string | null;
    description: string | null;
    logoUrl: string | null;
    logoDarkUrl: string | null;
    logoMarkUrl: string | null;
    logoCredit: string | null;
    isOrgMember: boolean;
    membershipTier: OrgMembershipTier | null;   // active row only
    sponsoredEvents: Array<{
      eventId: string;
      eventName: string;
      tier: SponsorTier;
      eventDate: string;          // ISO
    }>;
  };
  members: {
    totalCount: number;            // every current user_organizations row
    visibleCount: number;          // members visible to caller
    hiddenCount: number;           // totalCount - visibleCount
    rows: Array<{
      userId: string;              // for React keys only
      memberSlug: string;          // public route at /members/:slug
      displayName: string;
      avatarUrl: string | null;
      role: string | null;         // user_organizations.role
      isPrimary: boolean;
    }>;
  };
}
```

**Visibility predicate by caller:**

| Caller | Roster includes | Counted in `hiddenCount` |
|---|---|---|
| Anonymous | `users.visibility = 'public'` | `members_only` + `private` |
| Signed-in member | `users.visibility IN ('public', 'members_only')` | `private` |
| Signed-in admin | same as member | `private` |

Additional roster exclusions (counted in `hiddenCount`):
- Users with no completed profile (no `profiles` row)
- Users who are soft-deleted or merged

**Roster ordering:** `(isPrimary DESC, role IS NOT NULL DESC, displayName ASC)`.

### Admin extensions (existing routes)

No new admin endpoints. The following gain three optional fields each:

- `POST /api/admin/organizations` — accepts `type`, `country`, `description` in the JSON body. Writes `created_by = actor.id`.
- `PATCH /api/admin/organizations/:id` — accepts the same three fields. Writes `updated_by = actor.id`.
- `POST /api/admin/organizations/:id/logo` and the other admin mutations — write `updated_by = actor.id`.

The audit-log middleware continues to capture before/after snapshots as today; the new columns are the lightweight "who touched this last" indicator, not a replacement for `audit_log`.

## 4. Frontend pages

### File structure

```
apps/web/src/
├── hooks/
│   └── useOrganizations.ts          (new)
├── pages/
│   └── orgs/
│       ├── OrgsDirectoryPage.tsx    (new)
│       └── OrgProfilePage.tsx       (new)
└── App.tsx                          (modify – add routes + redirect)
```

The legacy `apps/web/src/pages/resources/DirectoryPage.tsx` is deleted in the same task that ships the redirect. The `DirectoryPage.tsx` `rawRseGroups` array is preserved as a one-time seed input for the type-heuristic backfill (Section 6) before deletion.

### `useOrganizations` hook

```ts
function useOrganizations(filters: {
  q?: string;
  type?: OrgType | "all";
  country?: string;
  member?: boolean;
  cursor?: string | null;
  limit?: number;
}): {
  data: OrgsListResponse | null;
  isLoading: boolean;
  error: Error | null;
};

function useOrganization(id: string | undefined): {
  data: OrgProfileResponse | null;
  isLoading: boolean;
  error: Error | null;
};
```

Both use the existing `useApi` from `@us-rse/auth-shell` so anonymous + signed-in callers transparently get the right token (none vs bearer).

### `OrgsDirectoryPage` content

**Header band:**
- Title: "Organizations"
- Subtitle: "The organizations where RSE work happens."
- Stats strip from `facets`: e.g. "84 universities · 17 national labs · 6 agencies · 12 member orgs"

**Filter bar (sticky):**
- Search input with `/` keyboard focus and `Esc` clear (preserved from legacy page)
- Type chips: `All · University · National Lab · Agency · Company · Nonprofit · External Resource`
- Country dropdown (top 20 from `facets.countries` + "More…" expander)
- Toggle: "US-RSE member orgs only" → `?member=true`

**Results grid:** 3-col desktop, 1-col mobile. `OrgCard` per row, showing: logo (`OrgLogo` or `InitialsHex` fallback), name, short name eyebrow, type badge, country line, member count chip, "Member" pip if `isOrgMember`. Card is a `Link` to `/orgs/:id`.

**Pagination:** "Load more" button at bottom, cursor-based (same pattern as `/members`).

**Empty state:** "No organizations match those filters." + "Clear filters" button.

### `OrgProfilePage` content

**Header band (full-width):**
- Logo: `OrgLogo` for primary, falls back to `InitialsHex`
- `h1` name, short name as eyebrow
- Type badge + country line: "University · Princeton, NJ" (city only present if backfilled; otherwise just country, then just type)
- External URL link, opens in new tab with `rel="noopener noreferrer"`
- "Member · Tier" pip if `isOrgMember`
- Logo credit footnote at bottom of header if `logoCredit` set

**Description block:** if `description` set, render below header as `<p>` in a `max-w-prose` container. Skipped entirely if null.

**Members section:**
- Heading: "**{totalCount} members**"
- Grid of `MemberCard` (reused from `/members` page) for each row in `members.rows`
- If `hiddenCount > 0` and caller is anonymous: dashed-border affordance card at end of grid — "**+{hiddenCount} more members** · Sign in to see the full roster" linking to `/sign-in?next=/orgs/:id`
- If `hiddenCount > 0` and caller is signed-in: footnote under the grid: "{hiddenCount} members have private profiles."
- If `totalCount === 0`: "No US-RSE members are affiliated with this org yet."

**Sponsorship strip:** only rendered if `sponsoredEvents.length > 0`. Heading "Sponsorships". Each row: event name (linked to event page), tier pip, ISO date. Reverse chronological.

**Footer band:** "**Information out of date?** Members can update their org affiliation from their profile. Org admins can request changes by emailing the contact email."

### Component reuse

All visual primitives already exist in the codebase: `OrgLogo`, `InitialsHex`, `MemberCard`, `LoadMore` button, filter chip styles. No new shared components introduced.

## 5. Privacy & member rollup

The visibility predicate is shared with the `/members` page (single source of truth — both pages query against `users.visibility`). The rule per caller:

| Caller | `users.visibility` values in roster |
|---|---|
| Anonymous | `'public'` only |
| Signed-in member | `'public'`, `'members_only'` |
| Signed-in admin | `'public'`, `'members_only'` (admin uses `/admin` for the unfiltered case) |

**Counts:**
- `totalCount` = every `user_organizations` row with `endedAt IS NULL` for this org. Past affiliations are excluded.
- `visibleCount` = subset of `totalCount` whose `users.visibility` matches the caller's class AND whose user has a completed `profiles` row AND who is not soft-deleted/merged.
- `hiddenCount` = `totalCount - visibleCount`.

**Anti-leak guarantees:**
1. Users with `visibility = 'private'` are never serialized in `members.rows` — no name, slug, avatar, or role appears under any caller class.
2. `userId` in `members.rows` is included for React keys only; consumers route via `memberSlug`. The roster never exposes raw UUIDs of members the caller can't see.
3. `hiddenCount` is intentionally exposed — it reveals the magnitude of the hidden set but no member-specific information. This is consistent with `/members`.
4. Merged orgs 404, not redirect — preventing leaks of "this org used to exist" via membership data.
5. Users with no `profiles` row are counted in `hiddenCount`, never in `rows`. Prevents placeholder cards.

## 6. Backfill strategy

### Pass 1 — Type heuristic

Script: `packages/api/scripts/backfill-org-types.ts`. `--dry-run` default, `--commit` to write.

Classification rules (first match wins):
1. Name matches `/\b(university|college|institute of technology)\b/i` → `university`
2. Name matches `/\b(national lab(oratory)?)\b/i` OR matches canonical list (LANL, ORNL, LBNL, ANL, NREL, PNNL, SNL, INL, BNL, FNAL, SLAC, Ames) → `national_lab`
3. Name matches `/\b(NSF|NIH|DOE|NASA|NOAA|USDA|DARPA|NIST)\b/` → `agency`
4. Name in legacy `externalOrgs` set (BSSw, SSI, URSSI, ReSA, IDEAS, SWEBOK, Software Engineering for Science, Ask Cyberinfrastructure) → `external_resource`
5. Default → `other`

Writes CSV report: `id, name, current_type, suggested_type, confidence`. `--commit` updates rows where current type is `other` and suggestion differs.

### Pass 2 — External resources seed

Same script ensures the 8 legacy `externalOrgs` entries exist as `organizations` rows. Inserts with `type='external_resource'`, `status='approved'`, `url` from the legacy array, `description` null (filled in pass 3 if Wikipedia summary is found). Idempotent on name match.

### Pass 3 — Location + description lookup

Script: `packages/api/scripts/backfill-org-locations.ts`. Same `--dry-run` / `--commit` pattern.

For each org with `country IS NULL`:

1. **Wikidata SPARQL** (`https://query.wikidata.org/sparql`): search by name. For each candidate, fetch `P17` (country), `P159` (HQ), `P856` (official website).
2. **Match-score** Wikidata candidate vs the org's `name` + `url`:
   - Levenshtein name match ≥ 85%, OR
   - Website domain match (strip subdomain + TLD comparison)
   - Records below threshold: skip (don't write).
3. For matched Wikidata hits, also fetch Wikipedia summary via `https://en.wikipedia.org/api/rest_v1/page/summary/{title}` — `title` is the English Wikipedia article title resolved from the Wikidata entity's `sitelinks.enwiki` field. Take the `extract` field, truncate at sentence boundary ≤ 280 chars.
4. **Photon fallback** for Wikidata misses: `https://photon.komoot.io/api?q={name}&limit=1` → if result is type `country`/`state`/`city`, write the country.
5. Writes CSV with per-field source columns: `id, name, suggested_country, country_source ('wikidata'|'photon'), suggested_city, city_source ('wikidata'), suggested_description, description_source ('wikipedia'), confidence, needs_rewrite`.

**Strict licensing path:** descriptions sourced from Wikipedia are flagged in the CSV with a `needs_rewrite=true` column. The `--commit` mode writes `country` and `city` automatically but **does NOT** write `description` until the CSV has been edited and the `needs_rewrite` flag cleared. Admins paraphrase before `--commit` runs the description pass. This keeps US-RSE in compliance with CC BY-SA without requiring per-profile attribution badges.

### Pass 4 — Manual admin sweep

Admins open the org list (with the new type filter) and reclassify the remaining `other` rows. The admin form gains `type`, `country`, `description` inputs in the same task.

### Backfill rerun-safety

All scripts are idempotent: each pass reads current DB state and only writes when a field is null or marked for update. Re-running is safe and won't clobber admin edits.

## 7. Testing, out-of-scope, follow-ups

### Testing

| Layer | Coverage |
|---|---|
| Migration | Drizzle `npm run typecheck` + manual apply against dev DB before commit |
| API list endpoint | Unit tests for filter SQL assembly; integration test for cursor pagination + facets shape |
| API profile endpoint | Three integration tests (one per caller class) verifying visibility predicate; dedicated privacy invariant test |
| Backfill scripts | Snapshot tests against 20-org fixture; mocked Wikidata + Wikipedia + Photon responses |
| Frontend | Manual exercise against `wrangler dev` + Vite at three viewport widths |

### Out of scope for v1

- Admin-side "claim this org" flow for org reps
- Logo upload from org reps (currently admin-only)
- Org-level analytics
- Per-org news/blog content type
- ISO country code normalization (free text suffices for v1)
- Map view on directory
- Removing legacy `/resources/directory` page during transition window (deleted in the same task that ships the redirect)

### Follow-ups (post-launch)

- Wikidata-pulled `foundedYear` if directory adds a "founded" facet later
- Wikipedia `image` field as auto-suggested logo for orgs without one (admin-approved)
- City field surfaced on profile header once enough orgs have it backfilled

## Open questions

None. All decisions resolved in brainstorming (sections 1-6 confirmed).
