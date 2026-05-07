# API and Database

The `@us-rse/api` workspace is a Cloudflare Worker that fronts the Neon Postgres database. This document covers the runtime architecture, the deploy pipeline, and how the SPA on Cloudflare Pages reaches the Worker without crossing origin boundaries.

!!! info "Endpoint-level documentation"
    The full API surface and its data model is covered in dedicated docs:

    - [Dossier — profile, directory, search](./dossier.md) — `/me`, `/members`, `/members/:slug`, `/vocab`, vocab editing, location autocomplete, visibility model.
    - [Badges & Recognition](./badges.md) — the computed-on-read badge system that ships in every dossier response.

    What follows here is the runtime / deploy / hosting layer beneath those endpoints.

## Runtime topology

```mermaid
graph TD
  Browser[Browser]
  Pages["Cloudflare Pages<br/>usrse-github-io.pages.dev<br/>(static SPA)"]
  Worker["Cloudflare Worker<br/>us-rse-api.leadership-28b.workers.dev<br/>@us-rse/api"]
  Neon["Neon Postgres<br/>(us-east-1)"]
  WorkOS["WorkOS AuthKit<br/>(hosted UI)"]

  Browser -->|GET /| Pages
  Pages -->|/api/* rewrite, status 200| Worker
  Worker -->|HTTP driver<br/>@neondatabase/serverless| Neon
  Browser -.->|sign-in redirect| WorkOS
  WorkOS -.->|callback| Browser
```

The browser only ever talks to one origin — `usrse-github-io.pages.dev`. The `/api/*` rewrite happens at Cloudflare's edge; from the browser's point of view there is no separate API origin, no CORS preflight, and no third-party cookie ceremony.

## The `@us-rse/api` workspace

| File | Role |
| --- | --- |
| `packages/api/package.json` | Workspace name `@us-rse/api`. Deps: `hono`, `@neondatabase/serverless`. Dev deps: `wrangler`, `@cloudflare/workers-types` |
| `packages/api/src/index.ts` | Hono app entry; registers `GET /` (sanity check) and `GET /health` (Neon round-trip) |
| `packages/api/wrangler.jsonc` | Worker config: name `us-rse-api`, compatibility date, `nodejs_compat` flag, observability on |
| `packages/api/tsconfig.json` | TS config scoped to Worker types (`@cloudflare/workers-types`) |
| `packages/api/.dev.vars.example` | Template — copy to `.dev.vars` (gitignored) for local `DATABASE_URL` |

## Endpoints today

| Method | Path | Description | Response |
| --- | --- | --- | --- |
| GET | `/` | Sanity check, no DB | `{ "name": "@us-rse/api", "ok": true }` |
| GET | `/health` | `SELECT 1` against Neon, reports latency | `{ "ok": true, "db": "neon", "result": { "one": 1 }, "latencyMs": <n> }` |

All endpoints are unauthenticated for now. JWT verification middleware lands when we add the first user-data endpoint.

## Local development

Two terminals, in repo root:

```bash
npm -w @us-rse/api run dev      # wrangler dev → http://localhost:8787
npm -w @us-rse/web run dev      # vite          → http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:8787` so the SPA can call `fetch('/api/health')` from the browser without CORS gymnastics. The proxy is configured in `apps/web/vite.config.ts`:

```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8787",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
    },
  },
}
```

The `rewrite` strips `/api` so Wrangler sees `GET /health`, not `GET /api/health`. The same logical mapping happens in production via Pages `_redirects` (see below).

`packages/api/.dev.vars` (gitignored) holds the local `DATABASE_URL`:

```sh
DATABASE_URL=postgres://user:password@host.neon.tech/dbname?sslmode=require
```

Wrangler reads this automatically on `dev` and binds it as a Worker env variable.

## Production deployment

The Worker deploys via Wrangler from the developer's machine — it's not part of the Pages Git pipeline. Three commands cover the full setup:

```bash
npx wrangler login                                          # one-time browser OAuth
npx wrangler secret put DATABASE_URL --cwd packages/api     # paste prod connection string
npm -w @us-rse/api run deploy                               # publishes the Worker
```

The deploy emits a URL of the form `https://us-rse-api.<account>.workers.dev`. Hitting `/health` on that URL returns the same JSON as local dev, with significantly lower latency once the Worker warms up (~50-150ms vs ~500ms on a cold local-to-cloud round-trip).

!!! warning "Secrets are write-only"
    `wrangler secret put` encrypts the value into Cloudflare's secret store. You can rotate it (re-run the command) or delete it (`wrangler secret delete`), but you cannot read it back from the dashboard. Keep the canonical value in a password manager.

## Pages → Worker proxy

`apps/web/public/_redirects` carries the Pages routing rules. Order matters — the `/api/*` rule must come **before** the SPA catch-all so it matches first:

```
/api/*  https://us-rse-api.leadership-28b.workers.dev/:splat  200
/*      /index.html                                           200
```

| Rule | Effect |
| --- | --- |
| `/api/*` → Worker URL with `:splat`, status 200 | Edge **rewrite** (not redirect): the browser sees `/api/health` in its URL bar but receives the Worker's response. Same-origin from the browser's perspective. |
| `/*` → `/index.html`, status 200 | SPA fallback: any path that doesn't match a real static file in `apps/web/dist` serves `index.html` so React Router can take over. |

The Worker's Hono `cors()` middleware is permissive for now; once the production origin is stable we should lock it down to `https://usrse-github-io.pages.dev` (and the eventual custom domain).

## Environment and secrets summary

| Variable | Local home | Production home | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | `packages/api/.dev.vars` | Worker secret (`wrangler secret put`) | Neon connection string |
| `VITE_WORKOS_CLIENT_ID` | `apps/web/.env.local` | Cloudflare Pages → Variables and Secrets | Public WorkOS Client ID |
| `VITE_WORKOS_REDIRECT_URI` | `apps/web/.env.local` | Cloudflare Pages → Variables and Secrets | Origin-specific callback URL |
| `NODE_VERSION` | (system) | Cloudflare Pages → Variables and Secrets | Pin Node 24 for builds |

The Neon credential never lives in the SPA's env (browser bundle) — only in the Worker's secrets.

## What's not built yet

- **Schema, migrations, queries.** No tables exist yet. Issue [#2](https://github.com/USRSE/usrse.github.io/issues/2) covers `users`, `profiles`, career history, vocab tables, and migration tooling.
- **Drizzle ORM integration.** Recommended pairing with `@neondatabase/serverless` for typed queries. Not yet adopted.
- **JWT verification middleware.** Endpoints past `/health` need to verify the WorkOS access token, extract the `sub` claim, and resolve it to a `users.id`.
- **CORS lockdown.** Hono's `cors()` is currently `origin: (o) => o ?? "*"`. Should pin to the Pages origin (and later the production custom domain) before the API surface grows.
- **CI deploy.** The Worker deploys from a developer machine via `wrangler deploy`. A GitHub Action would automate this on push to `main`.
