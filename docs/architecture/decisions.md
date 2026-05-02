# Architecture Decisions

Key decisions made during the US-RSE website redesign, in reverse chronological order.

---

### 2026-05-02: Turborepo monorepo with npm workspaces (Approved)

- **Decision:** Restructure the repo into a Turborepo monorepo. `apps/*` for runnable apps (`apps/web`), `packages/*` for shared libraries (`packages/design-system`). One root `package.json` with `workspaces: ["apps/*", "packages/*"]`, one root `package-lock.json`, one `turbo.json` orchestrating `build`/`dev`/`lint`/`typecheck`/`test`. Pixi is retained for token tooling and continues to live at the repo root.
- **Why:** Issue [#1933](../../../../issues/1933) calls for an upcoming elections app to live alongside the marketing site. Two sibling top-level dirs (`web/` + `design-system/`) had no contract between them — every consumer would have used relative paths. Workspaces make `@us-rse/design-system` an installable package, so future apps depend on it the same way (and we never reach for `../../packages/...`). Turbo gives us shared task pipelines and remote-cache-ready builds without coupling to a specific framework. npm workspaces (over pnpm) was chosen because it matches the existing lockfile and adds zero install-time tooling.
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
