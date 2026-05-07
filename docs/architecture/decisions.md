# Architecture Decisions

Key decisions made during the US-RSE website redesign, in reverse chronological order.

---

### 2026-05-07: Badges remain computed, not stored (Approved)

- **Decision:** Badge state is a pure function of underlying transactional rows (`event_attendances`, `leadership_terms`, `user_awards`, `mentorship_pairings`, `community_contributions`, `group_memberships`, `user_skills`/`disciplines`/`languages`, plus profile fields and account age). No `badges` table, no grant flow, no admin sweep. `computeBadges` runs on every `/me` and `/members/:slug` load. See [Badges & Recognition](./badges.md).
- **Why:** A separate badges table would require backfill scripts for every new kind, an admin grant UI, and two sources of truth that can drift. Computing on read keeps the badge layer honest — if the underlying row exists, the chip exists. Cost is single-digit milliseconds of extra work over rows we're already loading. The model only becomes painful if the badge logic gets expensive; Phase 3 added three new tables and recompute is still well within the existing dossier-load budget.
- **Result:** ~700 lines of pure-function logic in `packages/api/src/lib/badges.ts` covering ~50+ badge kinds across service / milestone / conference tiers. Easy to test with fixture inputs. New badges land via additive PRs to `computeBadges` and `HexStamp.tsx`; no migrations except where new data sources require new tables (Phase 3).

### 2026-05-07: Phase 3 schema for awards / mentorship / contributions (Approved)

- **Decision:** Add three new tables (`awards` + `user_awards`, `mentorship_pairings`, `community_contributions`) to support recognition signals beyond conference attendance. Migration `0008_stormy_penance.sql`. Mentorship pairings carry a privacy gate at the badge layer: partner display name in tooltip iff `partnerIsPublic`.
- **Why:** Phases 1 and 2 of the badge rollout exhausted what could be derived from existing data. Awards (Lifetime Achievement, Mentor of the Year, etc.) are a class of credential US-RSE has run for years but never recorded in the platform. Mentorship pairings are a community program that earns both sides a credential. Contributions (newsletter, tutorial, guide) are sustained volunteer work the dossier should celebrate. Each maps cleanly to a small additive table; none coupled to existing tables in ways that risk the data model.
- **Result:** 8 named awards seeded (Lifetime Achievement, USRSE Pioneer, Excellence in Service, Mentor of the Year, Rising Star, Community Builder, Best Conference Talk/Poster). The dossier now joins `user_awards` × `awards`, two-sided `mentorship_pairings` with the partner's profile for the privacy gate, and `community_contributions` filtered by kind. ~15 new badges available the moment a row lands in any of the three tables. Admin tooling to populate them is intentionally out of scope — backfill via SQL until that arrives.

### 2026-05-06: Programming languages as a separate axis from skills (Approved)

- **Decision:** Move programming languages out of the `skills` table into a dedicated `languages` axis. Migration `0007_remarkable_landau.sql` creates `languages` + `user_languages` and atomically moves the 13 existing language entries (Python, R, Julia, C/C++, Fortran, JS/TS, Rust, Go, Java, Bash/Shell, MATLAB) along with their user→skill links. Wrapped in a single CTE chain so partial failure rolls the schema change back too.
- **Why:** Members have a small finite set of programming languages but a sprawling tool inventory. Mixing the two on one axis blunts both. The Polyglot milestone (5+ languages) doesn't make sense if "Snakemake" or "Docker" can count as languages. The Craft section's `§05.b Languages` slot existed structurally but had no backend; making it work meant a new vocab table.
- **Result:** 68 languages seeded covering mainstream, niche, shells, domain-specific scientific, shaders, HDL, query (SQL/Cypher/SPARQL/GraphQL), and older ecosystems. HTML/CSS/JSON/YAML/Markdown intentionally excluded — they're markup or data formats, and the "I know HTML" signal is too universal to be useful. Skills.json drops the 13 migrated entries so the next `db:seed` doesn't recreate them under skills. The dossier's editor uses the same `EditableChipList` + `VocabCombobox` machinery for all three axes.

### 2026-05-06: Vocab edits use propose-then-approve, not free text (Approved)

- **Decision:** When a member adds a discipline / skill / language that doesn't exist in the approved vocabulary, the system inserts a row with `status='pending'` and `suggested_by=user_id`, then links it. Pending chips render with a dashed border and a small mono `pending` mark for the owner. Visitors see them as normal chips.
- **Why:** A pure-controlled vocabulary forces every new term through admin review before any member can use it — high-friction for legitimate cases (a new research area, a niche tool) and a bottleneck on the founding curve. Free-text would dilute the catalog with typos and synonyms. Propose-then-approve is the middle path: members get immediate value, admins curate the canonical list asynchronously, the dossier surfaces the pending state to the proposer without leaking it as authoritative to others. Slugify-and-dedupe handles the race when two users propose the same term concurrently.
- **Result:** ~440 approved skills, 263 disciplines, 68 languages seeded; pending entries accumulate as members propose. Admin approval flow is tracked separately — until it lands, "approve" is a SQL `UPDATE awards SET status='approved' WHERE …`.

### 2026-05-06: Three-state visibility (Public / Listed / Hidden) (Approved)

- **Decision:** Replace the binary `isPublic` toggle with a three-up radio: `Public` (full dossier, listed), `Listed (private)` (in directory by name only, full dossier hidden), `Hidden` (not listed, full dossier hidden, link still works as a stub). Driven by two booleans: `isPublic` + `isDiscoverable`. The control lives on `/account#02`, *not* in the dossier editor.
- **Why:** The binary toggle forced members to choose between findable and private. Members who wanted "I'm reachable for collaboration but my full work isn't indexable" had no path. Splitting into three states adds the half-measure without changing the maximalist (Public) or minimalist (Hidden) ends. Moving the control to the account ledger (separate from the dossier editor) is a UX statement: visibility is an account-level decision, not a content-level one — bio edits shouldn't be able to flip it accidentally. See [Dossier — visibility model](./dossier.md#visibility-model).
- **Result:** Two booleans on `profiles` + a 3-up radio in the account ledger. The dossier editor shows a small read-only chip ("Currently · Listed (private) · change in account →") so the owner keeps context while editing without holding the lever. Private profiles return a stub (name + member ID) instead of 404 — shared links don't break when a member toggles privacy.

### 2026-05-06: Member discovery via `/members` index + global cmd-K (Approved)

- **Decision:** Two surfaces, one search backend. `/members` is an authenticated archival-index page with text search + faceted filters (discipline / career stage / country) for *recall* — "show me people who match these criteria." A global ⌘K / Ctrl+K palette mounted in `App.tsx` is for *recognition* — "I know who I want, get me there in two keystrokes." Both hit `GET /members?q=&…`.
- **Why:** Single-surface designs force the browse-vs-jump tradeoff into one UI. Index pages reward filters and dwelling; command palettes reward muscle memory. Splitting the two means each surface optimizes for its job without compromise. Same-backend means we don't carry two search code paths. The directory lives at `/members` rather than `/resources/directory` (the existing institutional groups page) because members are the community, not a resource.
- **Result:** `MembersIndexPage` with hero, sticky search bar (`/` keyboard focus matching the existing institutions index), sidebar filters with α/β/γ marker eyebrows, paginated stream of `MemberCard` rows. `CommandPalette` is portaled to `<body>` (escapes `RevealOnView` transform stacking contexts), keyboard-navigable, dark editorial surface. Listed-private profiles appear as stub cards in both surfaces — the privacy axis flows through to discovery without leaking anything else. Auth-gated keyboard listener so the shortcut is a no-op for visitors.

### 2026-05-06: Account ledger over stacked cards (Approved)

- **Decision:** Reimagine `/account` away from the conventional stack-of-cards settings layout into a typographic ledger document. White masthead with a single tri-color hairline accent at the top, asymmetric layout with a colophon-style "Member · Issued · Holder" registry block on the right, mono section markers (`§01 Identity`, `§02 Visibility`, …), hairline rules between rows, no card chrome anywhere. The visibility chooser is a triptych of three columns separated by `gap-px` gradient seams — quoting the dossier's Affiliation pillar pattern.
- **Why:** The dossier already owns the purple gradient drama; the account page shouldn't compete. Settings pages overwhelmingly default to a stack of bordered cards because that's what the framework documentation shows — but cards add chrome that fights the page's actual rhythm. A ledger metaphor signals "back-office document" through restraint rather than ornament. The visibility triptych quotes the dossier specifically to tell the user "this lever controls how the dossier renders" without explaining it in copy.
- **Result:** `apps/web/src/pages/account/AccountPage.tsx` rewritten end-to-end. Inline saves on the visibility radio (no Save button — picking is the action). Hairline-only rows with a teal hover bar that bleeds in from the left edge, same family of motion as `MemberCard` and `LedgerRow` elsewhere.

### 2026-05-06: Photon (OSM) for location autocomplete (Approved)

- **Decision:** Use [Photon](https://photon.komoot.io/) (Apache 2.0, OSM-backed, Komoot's hosted instance) for the public-location field on the dossier editor. No API key, no signup, free public endpoint. OSM ODbL attribution shown in the dropdown footer when results are visible. Free-text fallback: pressing Enter without selecting saves the typed string as `publicLocation` with no coordinates.
- **Why:** Mapbox/Google offer better commercial geocoders but cost money, require API keys with URL-restricted public tokens, and lock the project into a paid vendor. Photon is the open-source path that aligns with the RSE community's values; it's built specifically for autocomplete (unlike Nominatim, which forbids typeahead in its usage policy); coverage is good enough for the directory's purposes. The ODbL requires visible attribution wherever OSM data is shown — putting the credit in the dropdown footer (not as a permanent fixture under the input) keeps the form quiet when dormant and compliant when active.
- **Result:** `LocationCombobox` component with debounced (220ms) fetch, keyboard nav (↑/↓/⏎/esc), suggestion menu portaled to `<body>` via `useLayoutEffect`-measured coords (escapes the RevealOnView stacking-context trap that LocationCombobox shares with CommandPalette and VocabCombobox). PATCH `/me/profile` accepts `latitude`, `longitude`, and `countryIso2`; the server resolves the ISO code to internal `countryId` UUID via the `countries` table so the frontend doesn't need to round-trip our UUIDs. Saved `publicLocation` strips the country (it's stored separately and re-appended at render time) — defensive de-dupe handles legacy data that already has the country baked in.

---

### 2026-05-02: Pages → Worker via `_redirects` rewrite, not direct calls + CORS (Approved)

- **Decision:** The SPA reaches the API by calling `/api/*` on its own origin. Cloudflare Pages rewrites those requests to the Worker URL via a `_redirects` rule with status 200. The browser never sees a cross-origin call to `*.workers.dev`.
- **Why:** Same-origin removes a whole category of problems before they happen — no CORS preflights, no `SameSite` cookie surprises if we later add session cookies, no third-party-origin tracking-protection breakage in Safari, and the SPA code stays portable (`fetch('/api/health')` works the same in dev via Vite proxy and in prod via Pages rewrite). The cost is a single line in `_redirects`. Direct calls to the Worker URL would have required permissive CORS and would couple the SPA to the Worker's account-scoped `*.workers.dev` hostname.
- **Result:** `apps/web/public/_redirects` has two rules in order: `/api/*` → Worker URL with `:splat`, then `/*` → `/index.html` for the SPA fallback. The Worker's Hono `cors()` is currently permissive but should be tightened to the Pages origin once the prod surface is stable.

### 2026-05-02: Hono on Cloudflare Workers for the API (Approved)

- **Decision:** Build the API as a Cloudflare Worker using [Hono](https://hono.dev/) for routing and `@neondatabase/serverless` (HTTP driver) to talk to Neon. The Worker lives at `packages/api` in the monorepo as workspace `@us-rse/api`. Deploy via Wrangler from a developer machine.
- **Why:** The Neon HTTP driver was built for edge runtimes and avoids the connection-pool problems classic Postgres clients have on serverless. Hono is small (no Express baggage), TypeScript-first, and has a routing model that scales from 1 endpoint to 100. Cloudflare Workers ship with `nodejs_compat`, `wrangler secret`, and observability — every operational concern we'd otherwise solve ourselves. The repo is already on Cloudflare for Pages, so staying in one provider keeps DNS and account permissions simple.
- **Result:** `packages/api` is a working workspace with `GET /health` returning `{ ok: true, db: "neon", result: { one: 1 }, latencyMs: <n> }` from a real `SELECT 1` against Neon. Cold-call latency in prod is ~360ms; warm calls are under 200ms. CI deploy from `main` is a follow-up; for now `wrangler deploy` runs from a developer terminal.

### 2026-05-02: AuthKit React SPA via PKCE, no backend mediator (Approved)

- **Decision:** Use `@workos-inc/authkit-react` with PKCE entirely in the SPA. The WorkOS-hosted sign-in page handles every auth method (Google, Microsoft, GitHub, Apple, email link, password); the browser carries the access token in memory; no backend session server.
- **Why:** A v1 marketing site doesn't need server-side session management — the only thing protected is the future member portal, and we can add a backend session layer when we add the portal. PKCE keeps the access token short-lived and scoped to a single browser, which is acceptable for the read-light surface area we'll have through issue #2. Building a backend session layer just to forward auth to a hosted UI would have been weeks of work for negative value at this stage. The fallback path — adding a session backend later — doesn't require ripping out AuthKit React; it requires adding a server that exchanges the SDK's token for an HTTP-only cookie.
- **Result:** Sign-in works end-to-end in production: Nav button → AuthKit hosted page → provider auth → callback → home page with avatar menu. Implementation is `apps/web/src/main.tsx` (provider mount), `apps/web/src/pages/auth/*` (3 routes), and `apps/web/src/components/Nav.tsx` (auth-aware menu). Redirect URI in WorkOS dashboard, Pages env, and code are byte-identical at `https://usrse-github-io.pages.dev/auth/callback`. Currently using WorkOS's staging environment; production WorkOS env is a launch-checklist item.

### 2026-05-02: Render-time errors must be visible, not silent (Approved)

- **Decision:** Wrap the React root in a class-based `RootErrorBoundary` and add a pre-render env check in `main.tsx` that bypasses `AuthKitProvider` entirely when `VITE_WORKOS_CLIENT_ID` is missing.
- **Why:** A misconfigured `AuthKitProvider` throws synchronously during render. With React 19's strict-mode commit semantics and no error boundary, the result is a fully blank page — `<div id="root">` empty, no console errors visible without DevTools, no clue what broke. We lost real time on a Cloudflare deploy debugging session that turned out to be unrelated to auth (wrong build output dir) but was indistinguishable from an auth init failure because the symptom was identical: blank page. Visible error states are non-negotiable for any deploy that can hit production.
- **Result:** Two layers of defense. Layer 1 — `main.tsx` checks for `clientId`; if absent, renders a styled "Configuration error" page directly without ever calling `AuthKitProvider`. Layer 2 — `RootErrorBoundary` (`apps/web/src/components/RootErrorBoundary.tsx`) catches anything that throws during initial render and displays the error name, message, and stack on the page, also logging to console. Future deploys with config drift fail visibly.

### 2026-05-02: Turborepo monorepo with npm workspaces (Approved)

- **Decision:** Restructure the repo into a Turborepo monorepo. `apps/*` for runnable apps (`apps/web`), `packages/*` for shared libraries (`packages/design-system`). One root `package.json` with `workspaces: ["apps/*", "packages/*"]`, one root `package-lock.json`, one `turbo.json` orchestrating `build`/`dev`/`lint`/`typecheck`/`test`. Pixi is retained for token tooling and continues to live at the repo root.
- **Why:** Issue [#1933](https://github.com/USRSE/usrse.github.io/issues/1933) calls for an upcoming elections app to live alongside the marketing site. Two sibling top-level dirs (`web/` + `design-system/`) had no contract between them — every consumer would have used relative paths. Workspaces make `@us-rse/design-system` an installable package, so future apps depend on it the same way (and we never reach for `../../packages/...`). Turbo gives us shared task pipelines and remote-cache-ready builds without coupling to a specific framework. npm workspaces (over pnpm) was chosen because it matches the existing lockfile and adds zero install-time tooling.
- **Result:** `web/` → `apps/web/`, `design-system/` → `packages/design-system/` with a new `package.json` exporting `dist/tokens.css`. `scripts/` and `dist/` moved inside the package. `pixi.toml` paths repointed. `apps/web` declares `"@us-rse/design-system": "*"` even though its current Tailwind theme is inline — the edge exists so future workspaces consume tokens via the package boundary, not relative paths. `pixi run check` and `npx turbo run build` both pass.

### 2026-05-02: Pixi stays at the repo root, owns token tooling (Approved)

- **Decision:** Keep `pixi.toml` at the repo root rather than moving it inside `packages/design-system/`. Turbo handles JS/TS task graphs; pixi handles Node + Python tooling (stylelint, prettier, contrast, validator, watcher).
- **Why:** Pixi installs a managed environment with conda-forge tools that aren't easy to express as devDependencies (stylelint version pin, prettier version pin, deterministic Node). Pulling those into `packages/design-system/package.json` would require two mental models (npm-managed in some places, pixi-managed in others) and double-install on every fresh clone. Keeping pixi at root means `pixi run check` works from one canonical place regardless of which workspace someone is in.
- **Result:** `pixi.toml` tasks invoke scripts at `packages/design-system/scripts/*.mjs`. The watcher's child `pixi run` calls `cd` back to `repoRoot` so pixi finds its config. Two systems, side-by-side, no overlap.

---

### 2026-04-28: MapLibre GL for community map (Approved)

- **Decision:** Use MapLibre GL with CartoDB dark-matter basemap for the homepage community map, matching the SSEC project's approach.
- **Why:** MapLibre is open-source, performant via WebGL, and the dark-matter style creates dramatic visual impact. The existing SSEC implementation at UW proved the pattern works well in a React context.
- **Result:** Full-bleed map section with US/International toggle. Empty by design — data points will be added when the membership database (#2) is live.

### 2026-04-28: Board of Directors as separate page (Approved)

- **Decision:** Split the Board of Directors into its own page (`/about/board`) rather than embedding it in the Governance page.
- **Why:** The Governance page was doing double duty — org structure AND 19 board member photos. Splitting gives the board its own editorial photo grid and lets Governance focus on process/structure. Also resolves the mega-menu having "Board of Directors" and "Governance" both linking to the same URL.
- **Result:** Governance page is clean with the org chart + links. Board page has the full staggered portrait grid.

### 2026-04-28: Mega-menu navigation (Approved)

- **Decision:** Replace simple dropdowns with multi-column mega-menus for About and Community sections.
- **Why:** The existing US-RSE site has 47+ links across nav dropdowns — overwhelming. Mega-menus group links into columns with descriptions, making 10+ items scannable. Simple dropdowns remain for sections with 3-4 items.
- **Result:** About mega-menu has "Organization" + "Leadership" columns with a "Contact Us" callout. Community has "Working Groups" + "Connect" with a "Join" callout.

### 2026-04-28: Controlled vocabulary with approval workflow (Approved)

- **Decision:** Skills, disciplines, institutions, pronouns, and degree types are controlled vocabulary tables with a `status` enum (approved/pending/rejected). Members can suggest new entries.
- **Why:** Free-text fields create inconsistency ("ML" vs "Machine Learning"). Controlled vocab enables filtering and analytics. The approval workflow balances flexibility (members can suggest) with data quality (admins approve).
- **Result:** Documented in the DB schema spec. 5 vocab tables + 2 join tables.

### 2026-04-28: WorkOS for auth, NeonDB for data (Approved)

- **Decision:** WorkOS owns identity and auth credentials. Our NeonDB database stores only profile data, career history, and community data.
- **Why:** WorkOS provides institutional SSO/SAML (valuable for university members), handles password management and social login, and reduces our security surface. NeonDB serverless Postgres with Drizzle ORM gives type-safe queries with minimal infrastructure.
- **Result:** Clean boundary — `users` table has a `workos_id` foreign key. Profile data is ours, auth is theirs.

### 2026-04-27: Purple hero (from teal) (Approved)

- **Decision:** Switch the homepage hero from teal gradient to purple gradient.
- **Why:** Purple (#741755) is the dominant brand identity color — it's the logo, the nav accent, and the CTA buttons. Having the hero in the secondary color (teal) fought the brand hierarchy. Purple hero with teal accents correctly establishes the color pecking order.
- **Result:** Hero uses `purple-950 → purple-700 → purple-500`. Network canvas recolored to purple base with teal highlights. CTA button is teal on purple.

### 2026-04-27: White navbar with original logo (Approved)

- **Decision:** Switch from purple navbar to white navbar so the original purple logo (001) can be used.
- **Why:** The purple navbar required the alternate white logo (002), meaning the original brand mark was hidden. White nav + purple accent bar + purple CTA gives the nav brand presence while showcasing the original logo.
- **Result:** Thin purple top accent bar, white body, original logo, purple "Join Us" CTA.

### 2026-04-27: Three-tier CSS token system (Approved)

- **Decision:** Build a three-tier CSS custom properties system: global → semantic → component tokens.
- **Why:** Components should never reference raw values. The semantic layer enables dark mode by overriding one layer. Component tokens scope decisions to where they're consumed. This matches modern design system best practices (Salesforce Lightning, GitHub Primer).
- **Result:** 209 global + 178 semantic + 387 component tokens = 774 total. Dark mode works by overriding ~60 semantic tokens.

### 2026-04-27: Editorial typography over card UI (Approved)

- **Decision:** Use typographic hierarchy (numbered prose blocks, horizontal rules, pull quotes) instead of card-based layouts for content pages.
- **Why:** Card grids with icon-in-colored-box patterns are the default AI-generated aesthetic. For a technical community site, editorial typography communicates more credibility. The content IS the design — cards are containers that add visual noise without information.
- **Result:** All About, Community, Events, Jobs, News, and Resources pages use the editorial pattern. Cards are reserved for genuinely interactive elements (job listings, not static content).
