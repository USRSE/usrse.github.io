# US-RSE Engineering Docs

Internal engineering documentation for the US-RSE membership platform — the marketing site, the member dossier, the badge system, and the infrastructure that runs them.

## Architecture

The platform is a Cloudflare-hosted SPA on Pages, an authenticated API on Workers, and a Postgres database on Neon. WorkOS handles authentication; OpenStreetMap (via Photon) handles location autocomplete; R2 holds member-uploaded photos.

| Surface | Stack |
| --- | --- |
| Marketing site + member SPA | Vite + React 19 + React Router 7, deployed to Cloudflare Pages |
| API | Hono on Cloudflare Workers, `@neondatabase/serverless` HTTP driver |
| Database | Neon Postgres (us-east-1), Drizzle schema |
| Auth | WorkOS AuthKit (PKCE, hosted UI) |
| Object storage | Cloudflare R2 (profile photos; future badge artwork) |

## Where to start

- **[Monorepo layout](./architecture/monorepo.md)** — workspace structure (`apps/web`, `packages/api`, `packages/design-system`).
- **[Frontend architecture](./architecture/frontend.md)** — the SPA, routing, and the marketing surface.
- **[API & database](./architecture/api.md)** — Worker runtime, deploy pipeline, and the SPA-to-Worker hop.
- **[Authentication](./architecture/auth.md)** — WorkOS AuthKit integration.
- **[Dossier — profile, directory, search](./architecture/dossier.md)** — the member-facing surface: visibility model, vocab editing, location autocomplete, member directory, and the global ⌘K palette.
- **[Badges & Recognition](./architecture/badges.md)** — the computed-on-read badge system that ships with every dossier response.
- **[Architecture decisions](./architecture/decisions.md)** — ADR log of major choices.

## Strategy & specs

- **[Site visual audit (2026-04-29)](./strategy/2026-04-29-site-visual-audit.md)** — the design assessment that drove the redesign.
- **DB schema specs** in `superpowers/specs/` — the shape of the data model as it landed and was amended.

## Editing docs

Run the docs site locally:

```bash
pixi run docs        # serve on http://127.0.0.1:8000 with hot reload
pixi run docs-build  # render into site/ (strict mode — fails on broken links)
```

Add new pages under `docs/`, then list them in `mkdocs.yml`'s `nav:` section. Strict-mode `docs-build` will fail if a Markdown file exists but isn't in the nav, which keeps the index honest.

## Conventions

- **Architecture decisions** follow `### YYYY-MM-DD: Title (Status)` with `Decision / Why / Result` bullets. Append new entries at the top of [`decisions.md`](./architecture/decisions.md) so the log reads newest-first.
- **Mermaid diagrams** for runtime topology, sequence flows, and ER models — Material's superfences extension renders them inline.
- **Admonitions** (`!!! note`, `!!! info`, `!!! warning`, `!!! tip`) for callouts that don't belong in body prose.
- **Code blocks** carry a language tag for syntax highlighting and the copy-button affordance.
