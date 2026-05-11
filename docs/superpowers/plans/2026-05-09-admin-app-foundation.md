# Admin App Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the cross-cutting infrastructure that every later admin subsystem inherits — workspace, auth posture, role/permission model, audit infrastructure, and frontend shell — so subsystem work (members, vocab, organizations, …) lands on a stable target. Spec at `docs/superpowers/specs/2026-05-09-admin-app-foundation-design.md`. Tracker: GitHub issue #1956.

**Architecture:** A new `apps/admin` Vite/React SPA served at `admin.us-rse.org`, talking to the same Worker (`@us-rse/api`) under a new `/api/admin/*` sub-app gated by middleware (auth → actor context → audit). A new `@us-rse/auth-shell` package extracts the WorkOS provider and `useApi` wrapper from `apps/web` so both SPAs share one identity surface. Permissions are pure functions in `lib/policies/`; the actor context (system role + relational positions) is loaded once per request.

**Tech Stack:** TypeScript everywhere. Backend: Cloudflare Workers + Hono + Drizzle ORM + Neon Postgres. Frontend: React 19 + Vite + React Router 7 + Tailwind + `@us-rse/design-system` tokens. Auth: WorkOS AuthKit (PKCE, browser-only). Tests: Vitest for unit + middleware integration, Playwright (already not yet in repo — added in Task 17) for the smoke test.

---

## Pre-flight

- [ ] **Step 1: Create a feature branch off the current branch.**

```bash
git checkout -b cdcore09/admin-foundation
```

- [ ] **Step 2: Open the spec in another window** (`docs/superpowers/specs/2026-05-09-admin-app-foundation-design.md`) — every task references it.

- [ ] **Step 3: Confirm clean tree.**

```bash
git status
```

Expected: `nothing to commit, working tree clean` and on `cdcore09/admin-foundation`.

---

## Task 1: Migration 0012 — add `staff` role + backfill

**Why this is first:** Everything downstream (policies, actor context, admin entry gate) types `users.role` as `member | staff | super_admin`. The enum has to carry the new value before the code that reads it can typecheck.

**Files:**
- Create: `packages/api/migrations/0012_role_staff.sql`
- Modify: `packages/api/migrations/meta/_journal.json`
- Modify: `packages/api/src/db/schema/enums.ts`

- [ ] **Step 1: Hand-write the migration SQL.**

Drizzle-kit's interactive prompts ask "rename or add?" when an enum changes — that prompt doesn't run over `apply-migration.ts`'s no-TTY runner, so we write the SQL by hand (same pattern as 0010 and 0011).

`packages/api/migrations/0012_role_staff.sql`:

```sql
-- Phase 2.5 follow-on: rename the legacy `admin` system role to `staff`.
--
-- The brainstorm decision is: keep the system-role enum tiny
-- (`member` / `staff` / `super_admin`) and let distributed admin
-- powers (group chair, board member, event chair) come from the
-- relational tables that already model those positions.
--
-- Postgres enums don't support a literal RENAME VALUE in a
-- transaction without orphaning rows that reference the old value
-- mid-step, so the migration adds the new value, backfills, and
-- leaves the legacy value in place for one rev. A follow-up
-- migration drops it once deploys soak.

ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'staff';--> statement-breakpoint
UPDATE "users" SET "role" = 'staff' WHERE "role" = 'admin';
```

- [ ] **Step 2: Append the journal entry.**

Run this to grab a current timestamp:

```bash
node -e "console.log(Date.now())"
```

Edit `packages/api/migrations/meta/_journal.json` — append after the `0011_user_merging` entry, **inside the `entries` array**, with the timestamp from the previous step:

```jsonc
    {
      "idx": 12,
      "version": "7",
      "when": <PASTE_TIMESTAMP_HERE>,
      "tag": "0012_role_staff",
      "breakpoints": true
    }
```

- [ ] **Step 3: Update the Drizzle enum source.**

Edit `packages/api/src/db/schema/enums.ts` — change the `userRole` declaration to include `staff` and keep `admin` for one rev:

```ts
export const userRole = pgEnum("user_role", [
  "member",
  "staff",
  "admin",        // legacy — backfilled to staff in 0012, dropped in a future migration
  "super_admin",
]);
```

- [ ] **Step 4: Apply the migration.**

```bash
cd packages/api && npm run db:apply -- migrations/0012_role_staff.sql
```

Expected output ends with `Done.`

- [ ] **Step 5: Verify the rows landed.**

```bash
node -e "
import('@neondatabase/serverless').then(async ({neon}) => {
  const fs = await import('node:fs');
  const url = fs.readFileSync('.dev.vars','utf8').match(/DATABASE_URL=['\"]?([^'\"\\n]+)/)[1];
  const sql = neon(url);
  const r = await sql\`SELECT role, COUNT(*)::int AS n FROM users GROUP BY role ORDER BY role\`;
  console.log(r);
});"
```

Expected: a row for `staff` covering whatever was previously `admin`, no rows still on `admin`.

- [ ] **Step 6: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 3/3 tasks successful.

- [ ] **Step 7: Commit.**

```bash
git add packages/api/migrations/0012_role_staff.sql packages/api/migrations/meta/_journal.json packages/api/src/db/schema/enums.ts
git commit -m "feat(db): add staff role, backfill from admin"
```

---

## Task 2: Extract `@us-rse/auth-shell` package

**Why now:** Both SPAs need the AuthKit provider mount and the `useApi` fetch wrapper. Extracting once before `apps/admin` exists keeps us from creating a divergent copy.

**Files:**
- Create: `packages/auth-shell/package.json`
- Create: `packages/auth-shell/tsconfig.json`
- Create: `packages/auth-shell/src/index.ts`
- Create: `packages/auth-shell/src/AuthShell.tsx`
- Create: `packages/auth-shell/src/RootErrorBoundary.tsx`
- Create: `packages/auth-shell/src/useApi.ts`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/lib/api.ts` (becomes a thin re-export)
- Modify: `apps/web/src/components/RootErrorBoundary.tsx` (becomes a thin re-export)
- Modify: `apps/web/package.json`

- [ ] **Step 1: Create the package directory + manifest.**

```bash
mkdir -p packages/auth-shell/src
```

`packages/auth-shell/package.json`:

```json
{
  "name": "@us-rse/auth-shell",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@workos-inc/authkit-react": "^0.16.1"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "typescript": "~6.0.2"
  }
}
```

- [ ] **Step 2: Add a tsconfig for the package.**

`packages/auth-shell/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

- [ ] **Step 3: Move RootErrorBoundary verbatim.**

Copy `apps/web/src/components/RootErrorBoundary.tsx` to `packages/auth-shell/src/RootErrorBoundary.tsx` (same code, no edits — it has no imports outside React).

- [ ] **Step 4: Move `useApi` verbatim.**

Copy `apps/web/src/lib/api.ts` to `packages/auth-shell/src/useApi.ts` (same code, no edits — it imports from `@workos-inc/authkit-react` and uses `import.meta.env.VITE_API_BASE_URL`, both of which work the same in a workspace dep).

- [ ] **Step 5: Build the AuthShell mount component.**

This collapses the env-check + AuthKitProvider boilerplate from `apps/web/src/main.tsx` into one prop-driven component.

`packages/auth-shell/src/AuthShell.tsx`:

```tsx
import { StrictMode, type ReactNode } from "react";
import { AuthKitProvider } from "@workos-inc/authkit-react";
import { RootErrorBoundary } from "./RootErrorBoundary";

interface AuthShellProps {
  /** WorkOS client ID. Pass the env var directly; AuthShell handles the missing case. */
  clientId: string | undefined;
  /** Which app is mounting this — used in the configuration-error message body. */
  appLabel: string;
  /** Where to send the user back after sign-in. Defaults to `${origin}/auth/callback`. */
  redirectUri?: string;
  /** Set to true in dev so AuthKit dev mode features turn on. */
  devMode?: boolean;
  children: ReactNode;
}

export function AuthShell({
  clientId,
  appLabel,
  redirectUri,
  devMode,
  children,
}: AuthShellProps) {
  if (!clientId) {
    return (
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          maxWidth: "32rem",
          margin: "4rem auto",
          padding: "2rem",
          border: "1px solid #eaeced",
          borderRadius: "0.75rem",
          color: "#363c3e",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", marginTop: 0, color: "#741755" }}>
          Configuration error
        </h1>
        <p>
          <code>VITE_WORKOS_CLIENT_ID</code> is not set. {appLabel} can't
          initialize authentication.
        </p>
        <p style={{ fontSize: "0.875rem", color: "#6b7476" }}>
          Local dev: copy <code>.env.example</code> to <code>.env.local</code>
          and fill in the WorkOS values, then restart the dev server.
          Cloudflare Pages: add the variable under Settings → Variables and
          Secrets and redeploy.
        </p>
      </div>
    );
  }

  const effectiveRedirect =
    redirectUri ?? `${window.location.origin}/auth/callback`;

  return (
    <StrictMode>
      <RootErrorBoundary>
        <AuthKitProvider
          clientId={clientId}
          redirectUri={effectiveRedirect}
          devMode={devMode}
        >
          {children}
        </AuthKitProvider>
      </RootErrorBoundary>
    </StrictMode>
  );
}
```

- [ ] **Step 6: Public surface.**

`packages/auth-shell/src/index.ts`:

```ts
export { AuthShell } from "./AuthShell";
export { RootErrorBoundary } from "./RootErrorBoundary";
export { useApi } from "./useApi";
```

- [ ] **Step 7: Wire the package into `apps/web`.**

Edit `apps/web/package.json` — add the dep under `dependencies` (alphabetical):

```jsonc
    "@us-rse/auth-shell": "*",
    "@us-rse/design-system": "*",
```

- [ ] **Step 8: Replace `apps/web/src/main.tsx` to use AuthShell.**

```tsx
import { createRoot } from "react-dom/client";
import { AuthShell } from "@us-rse/auth-shell";
import "./index.css";
import { App } from "./App";

const clientId = import.meta.env.VITE_WORKOS_CLIENT_ID;
const root = createRoot(document.getElementById("root")!);

root.render(
  <AuthShell
    clientId={clientId}
    appLabel="The marketing site"
    devMode={import.meta.env.DEV}
  >
    <App />
  </AuthShell>
);
```

- [ ] **Step 9: Replace `apps/web/src/lib/api.ts` with a thin re-export.**

```ts
export { useApi } from "@us-rse/auth-shell";
```

- [ ] **Step 10: Replace `apps/web/src/components/RootErrorBoundary.tsx` with a thin re-export.**

```ts
export { RootErrorBoundary } from "@us-rse/auth-shell";
```

(Keeping the file at the same path means existing imports still resolve. We can delete the file later by codemod once the consumer count is small.)

- [ ] **Step 11: Re-install workspace deps so the new package is symlinked.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm install
```

- [ ] **Step 12: Typecheck.**

```bash
npm run typecheck
```

Expected: 3/3 tasks successful (api, web, design-system). The new auth-shell package gets typechecked as a dependency through web's project graph.

- [ ] **Step 13: Smoke-test the web app locally.**

```bash
npm -w @us-rse/web run dev
```

Open `http://localhost:5173`, click sign-in, verify the WorkOS hosted page comes up, complete sign-in, verify the avatar menu populates. Stop the dev server.

- [ ] **Step 14: Commit.**

```bash
git add packages/auth-shell apps/web/src/main.tsx apps/web/src/lib/api.ts apps/web/src/components/RootErrorBoundary.tsx apps/web/package.json package-lock.json
git commit -m "refactor(auth-shell): extract WorkOS provider into shared package"
```

---

## Task 3: `lib/policies/` module + Vitest tests

**Why this slot:** Policies are pure functions over `ActorContext`. They don't depend on middleware or routes — we write and test them in isolation, then mount them in subsequent tasks.

**Files:**
- Create: `packages/api/src/lib/policies/types.ts`
- Create: `packages/api/src/lib/policies/index.ts`
- Create: `packages/api/src/lib/policies/canEnterAdminApp.ts`
- Create: `packages/api/src/lib/policies/canApproveVocab.ts`
- Create: `packages/api/src/lib/policies/canMergeUsers.ts`
- Create: `packages/api/src/lib/policies/canEditGroup.ts`
- Create: `packages/api/src/lib/policies/canEditEvent.ts`
- Create: `packages/api/src/lib/policies/canViewAuditLog.ts`
- Create: `packages/api/src/lib/policies/policies.test.ts`
- Modify: `packages/api/package.json` (add vitest)

- [ ] **Step 1: Add Vitest to `@us-rse/api`.**

Edit `packages/api/package.json`. Add to `devDependencies`:

```jsonc
    "vitest": "^3.2.5",
```

Add to `scripts`:

```jsonc
    "test": "vitest run",
    "test:watch": "vitest",
```

Then install:

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm install
```

- [ ] **Step 2: Define the ActorContext type.**

`packages/api/src/lib/policies/types.ts`:

```ts
/**
 * Loaded once per admin request by the requireActorContext middleware.
 * All policy functions are pure functions over this object; they do not
 * touch the DB. Adding a new policy means: add a function that consumes
 * this type, add a test for it, and (optionally) mount it via
 * requirePolicy on the routes it gates.
 */
export interface ActorContext {
  user: {
    id: string;
    memberId: string;
    email: string;
    role: "member" | "staff" | "super_admin";
  };
  /** 0=member, 1=staff, 2=super_admin. Pre-computed for fast comparisons. */
  systemTier: 0 | 1 | 2;
  /** Active leadership terms — endDate IS NULL OR endDate >= now(). */
  leadershipPositions: {
    id: string;
    positionType: "board" | "executive" | "staff" | "advisor";
    label: string;
    startDate: string;
    endDate: string | null;
  }[];
  /** Group ids where the actor is chair or co-chair (active row). */
  chairedGroupIds: Set<string>;
  /** Event ids where the actor is committee chair or co-chair. */
  chairedEventIds: Set<string>;
}
```

- [ ] **Step 3: Write each policy file.**

`packages/api/src/lib/policies/canEnterAdminApp.ts`:

```ts
import type { ActorContext } from "./types";

/**
 * Gate for the admin sub-app at large. True when the actor has any
 * admin-shaped position — system tier >= staff, OR an active board /
 * executive / advisor / staff leadership term, OR they chair at least
 * one group, OR they chair at least one event committee.
 */
export const canEnterAdminApp = (a: ActorContext): boolean =>
  a.systemTier >= 1 ||
  a.leadershipPositions.length > 0 ||
  a.chairedGroupIds.size > 0 ||
  a.chairedEventIds.size > 0;
```

`packages/api/src/lib/policies/canApproveVocab.ts`:

```ts
import type { ActorContext } from "./types";

/** Approve / reject pending vocab terms (disciplines, skills, languages, organizations). */
export const canApproveVocab = (a: ActorContext): boolean =>
  a.systemTier >= 1;
```

`packages/api/src/lib/policies/canMergeUsers.ts`:

```ts
import type { ActorContext } from "./types";

/**
 * Merging users is irreversible-feeling and rewrites several tables.
 * Restrict to super_admin until we have a reversal UI.
 */
export const canMergeUsers = (a: ActorContext): boolean =>
  a.systemTier >= 2;
```

`packages/api/src/lib/policies/canEditGroup.ts`:

```ts
import type { ActorContext } from "./types";

export const canEditGroup = (
  a: ActorContext,
  scope: { groupId: string }
): boolean => a.systemTier >= 1 || a.chairedGroupIds.has(scope.groupId);
```

`packages/api/src/lib/policies/canEditEvent.ts`:

```ts
import type { ActorContext } from "./types";

export const canEditEvent = (
  a: ActorContext,
  scope: { eventId: string }
): boolean => a.systemTier >= 1 || a.chairedEventIds.has(scope.eventId);
```

`packages/api/src/lib/policies/canViewAuditLog.ts`:

```ts
import type { ActorContext } from "./types";

/** Reading the audit log is super_admin-only. */
export const canViewAuditLog = (a: ActorContext): boolean =>
  a.systemTier >= 2;
```

- [ ] **Step 4: Public surface.**

`packages/api/src/lib/policies/index.ts`:

```ts
export type { ActorContext } from "./types";
export { canEnterAdminApp } from "./canEnterAdminApp";
export { canApproveVocab } from "./canApproveVocab";
export { canMergeUsers } from "./canMergeUsers";
export { canEditGroup } from "./canEditGroup";
export { canEditEvent } from "./canEditEvent";
export { canViewAuditLog } from "./canViewAuditLog";
```

- [ ] **Step 5: Write the test file.**

`packages/api/src/lib/policies/policies.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  canApproveVocab,
  canEditEvent,
  canEditGroup,
  canEnterAdminApp,
  canMergeUsers,
  canViewAuditLog,
  type ActorContext,
} from "./index";

function actor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    user: { id: "u1", memberId: "m1", email: "u1@x", role: "member" },
    systemTier: 0,
    leadershipPositions: [],
    chairedGroupIds: new Set(),
    chairedEventIds: new Set(),
    ...overrides,
  };
}

describe("canEnterAdminApp", () => {
  it("denies a plain member with no positions", () => {
    expect(canEnterAdminApp(actor())).toBe(false);
  });
  it("allows staff", () => {
    expect(canEnterAdminApp(actor({ systemTier: 1 }))).toBe(true);
  });
  it("allows super_admin", () => {
    expect(canEnterAdminApp(actor({ systemTier: 2 }))).toBe(true);
  });
  it("allows a member who chairs at least one group", () => {
    expect(
      canEnterAdminApp(actor({ chairedGroupIds: new Set(["g1"]) }))
    ).toBe(true);
  });
  it("allows a member who chairs at least one event", () => {
    expect(
      canEnterAdminApp(actor({ chairedEventIds: new Set(["e1"]) }))
    ).toBe(true);
  });
  it("allows a board member", () => {
    expect(
      canEnterAdminApp(
        actor({
          leadershipPositions: [
            {
              id: "lt1",
              positionType: "board",
              label: "Director",
              startDate: "2026-01-01",
              endDate: null,
            },
          ],
        })
      )
    ).toBe(true);
  });
});

describe("canApproveVocab", () => {
  it("denies members", () => {
    expect(canApproveVocab(actor())).toBe(false);
  });
  it("allows staff", () => {
    expect(canApproveVocab(actor({ systemTier: 1 }))).toBe(true);
  });
  it("allows super_admin", () => {
    expect(canApproveVocab(actor({ systemTier: 2 }))).toBe(true);
  });
});

describe("canMergeUsers", () => {
  it("denies staff", () => {
    expect(canMergeUsers(actor({ systemTier: 1 }))).toBe(false);
  });
  it("allows super_admin", () => {
    expect(canMergeUsers(actor({ systemTier: 2 }))).toBe(true);
  });
});

describe("canEditGroup", () => {
  it("allows staff for any group", () => {
    expect(canEditGroup(actor({ systemTier: 1 }), { groupId: "g1" })).toBe(
      true
    );
  });
  it("allows a member who chairs that specific group", () => {
    expect(
      canEditGroup(actor({ chairedGroupIds: new Set(["g1"]) }), {
        groupId: "g1",
      })
    ).toBe(true);
  });
  it("denies a member who chairs a different group", () => {
    expect(
      canEditGroup(actor({ chairedGroupIds: new Set(["g2"]) }), {
        groupId: "g1",
      })
    ).toBe(false);
  });
});

describe("canEditEvent", () => {
  it("allows staff for any event", () => {
    expect(canEditEvent(actor({ systemTier: 1 }), { eventId: "e1" })).toBe(
      true
    );
  });
  it("allows a chair of that specific event", () => {
    expect(
      canEditEvent(actor({ chairedEventIds: new Set(["e1"]) }), {
        eventId: "e1",
      })
    ).toBe(true);
  });
  it("denies a chair of a different event", () => {
    expect(
      canEditEvent(actor({ chairedEventIds: new Set(["e2"]) }), {
        eventId: "e1",
      })
    ).toBe(false);
  });
});

describe("canViewAuditLog", () => {
  it("denies staff", () => {
    expect(canViewAuditLog(actor({ systemTier: 1 }))).toBe(false);
  });
  it("allows super_admin", () => {
    expect(canViewAuditLog(actor({ systemTier: 2 }))).toBe(true);
  });
});
```

- [ ] **Step 6: Run tests, expect them to fail until vitest finds the files.**

```bash
cd packages/api && npm test
```

Expected: all tests pass on first run since both impl and tests landed together. If imports fail, fix paths and re-run.

- [ ] **Step 7: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 3/3 tasks successful.

- [ ] **Step 8: Commit.**

```bash
git add packages/api/src/lib/policies packages/api/package.json package-lock.json
git commit -m "feat(api): policy module for admin permission checks"
```

---

## Task 4: `requireActorContext` middleware

**Why now:** Policies need an `ActorContext` to operate on. This middleware loads it once per admin request.

**Files:**
- Create: `packages/api/src/middleware/actorContext.ts`
- Modify: `packages/api/src/types.ts`

- [ ] **Step 1: Extend the Hono Variables type.**

Edit `packages/api/src/types.ts`. Add to `Variables`:

```ts
import type { ActorContext } from "./lib/policies";

export type Variables = {
  workosUserId: string;
  workosClaims: JWTPayload;
  /** Populated by requireActorContext on /api/admin/* requests. */
  actor?: ActorContext;
};
```

- [ ] **Step 2: Build the middleware.**

`packages/api/src/middleware/actorContext.ts`:

```ts
import { createMiddleware } from "hono/factory";
import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import { createDb } from "../db";
import {
  eventCommitteeAssignments,
  groupMemberships,
  leadershipTerms,
  users,
} from "../db/schema";
import { canEnterAdminApp } from "../lib/policies";
import type { ActorContext } from "../lib/policies";
import type { AppEnv } from "../types";

/**
 * Walks the merge chain from the WorkOS-authenticated user to the
 * canonical row, then loads everything the policy module needs:
 *
 *   - basic user fields (id, memberId, email, role) on the canonical user
 *   - active leadership_terms (endDate IS NULL OR >= now())
 *   - groups the user chairs or co-chairs (active rows)
 *   - events the user chairs or co-chairs on the committee
 *
 * Stashes the resulting ActorContext on c.var.actor and short-circuits
 * with 403 when canEnterAdminApp is false. Returns 404 with
 * `error: "user_pending"` when the WorkOS user has no canonical row yet.
 *
 * One DB round trip — three SELECTs run in parallel after the canonical
 * lookup. Cheap; no caching needed at v1 volumes.
 */
export const requireActorContext = createMiddleware<AppEnv>(
  async (c, next) => {
    const workosId = c.get("workosUserId");
    if (!c.env.DATABASE_URL) {
      return c.json({ ok: false, error: "internal" }, 500);
    }

    const db = createDb(c.env.DATABASE_URL);

    // Walk merge chain to canonical user, bounded depth 5.
    const head = await db
      .select({
        id: users.id,
        memberId: users.memberId,
        email: users.email,
        role: users.role,
        mergedIntoUserId: users.mergedIntoUserId,
      })
      .from(users)
      .where(and(eq(users.workosId, workosId), isNull(users.deletedAt)))
      .limit(1);
    let row = head[0];
    if (!row) {
      return c.json({ ok: false, error: "user_pending" }, 404);
    }
    for (let depth = 0; depth < 5 && row.mergedIntoUserId; depth++) {
      const next = await db
        .select({
          id: users.id,
          memberId: users.memberId,
          email: users.email,
          role: users.role,
          mergedIntoUserId: users.mergedIntoUserId,
        })
        .from(users)
        .where(
          and(eq(users.id, row.mergedIntoUserId), isNull(users.deletedAt))
        )
        .limit(1);
      if (!next[0]) {
        return c.json({ ok: false, error: "user_pending" }, 404);
      }
      row = next[0];
    }

    // Load relational positions in parallel.
    const now = new Date();
    const [terms, chairedGroups, chairedEvents] = await Promise.all([
      db
        .select({
          id: leadershipTerms.id,
          positionType: leadershipTerms.positionType,
          label: leadershipTerms.label,
          startDate: leadershipTerms.startDate,
          endDate: leadershipTerms.endDate,
        })
        .from(leadershipTerms)
        .where(
          and(
            eq(leadershipTerms.userId, row.id),
            isNull(leadershipTerms.deletedAt),
            or(
              isNull(leadershipTerms.endDate),
              gte(leadershipTerms.endDate, now)
            )
          )
        ),
      db
        .select({ groupId: groupMemberships.groupId })
        .from(groupMemberships)
        .where(
          and(
            eq(groupMemberships.userId, row.id),
            sql`${groupMemberships.role} IN ('chair', 'co_chair')`,
            or(
              isNull(groupMemberships.leftAt),
              gte(groupMemberships.leftAt, now)
            )
          )
        ),
      db
        .select({ eventId: eventCommitteeAssignments.eventId })
        .from(eventCommitteeAssignments)
        .where(
          and(
            eq(eventCommitteeAssignments.userId, row.id),
            sql`${eventCommitteeAssignments.level} IN ('chair', 'co_chair')`,
            isNull(eventCommitteeAssignments.deletedAt)
          )
        ),
    ]);

    // Map the legacy "admin" enum value to staff for the policy layer.
    // (The 0012 backfill clears existing rows; this guard catches any
    // racing inserts that arrived via the webhook before deploy.)
    const role = row.role === "admin" ? "staff" : row.role;
    const tier =
      role === "super_admin" ? 2 : role === "staff" ? 1 : 0;

    const actor: ActorContext = {
      user: {
        id: row.id,
        memberId: row.memberId,
        email: row.email,
        role: role as "member" | "staff" | "super_admin",
      },
      systemTier: tier as 0 | 1 | 2,
      leadershipPositions: terms.map((t) => ({
        ...t,
        startDate:
          t.startDate instanceof Date
            ? t.startDate.toISOString()
            : (t.startDate as string),
        endDate:
          t.endDate instanceof Date
            ? t.endDate.toISOString()
            : (t.endDate as string | null),
      })),
      chairedGroupIds: new Set(chairedGroups.map((r) => r.groupId)),
      chairedEventIds: new Set(chairedEvents.map((r) => r.eventId)),
    };

    if (!canEnterAdminApp(actor)) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }

    c.set("actor", actor);
    await next();
  }
);
```

- [ ] **Step 3: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 3/3 successful. If `groupMemberships.leftAt` or `eventCommitteeAssignments.deletedAt` field names differ from your schema, fix the references — the schema files at `packages/api/src/db/schema/groups.ts` and `committees.ts` are the source of truth.

- [ ] **Step 4: Commit.**

```bash
git add packages/api/src/middleware/actorContext.ts packages/api/src/types.ts
git commit -m "feat(api): requireActorContext middleware loads admin actor + positions"
```

---

## Task 5: Admin sub-app + entry gate + `GET /api/admin/me`

**Why now:** With policies and actor context in place, we can mount a Hono sub-app for `/api/admin/*` and ship the first endpoint the SPA will call.

**Files:**
- Create: `packages/api/src/middleware/policy.ts`
- Create: `packages/api/src/routes/admin/index.ts`
- Create: `packages/api/src/routes/admin/me.ts`
- Modify: `packages/api/src/index.ts`

- [ ] **Step 1: Build the `requirePolicy` middleware factory.**

`packages/api/src/middleware/policy.ts`:

```ts
import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";
import type { ActorContext } from "../lib/policies";

/**
 * Wraps a policy fn into Hono middleware. Use this on routes (or a
 * sub-app's entire surface) to gate by a single named policy. For
 * mid-handler checks where multiple resources are touched, call the
 * policy fn directly — c.var.actor is already populated.
 *
 *   requirePolicy(canEditGroup, c => ({ groupId: c.req.param("id") }))
 */
export function requirePolicy<S>(
  policy: (a: ActorContext, scope: S) => boolean,
  scopeFn: (c: Context<AppEnv>) => S
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const actor = c.get("actor");
    if (!actor) {
      // requireActorContext should have run first. If we got here
      // without an actor it's a wiring bug, not a 403.
      return c.json({ ok: false, error: "internal" }, 500);
    }
    if (!policy(actor, scopeFn(c))) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }
    await next();
  };
}
```

- [ ] **Step 2: Build the `GET /api/admin/me` handler.**

`packages/api/src/routes/admin/me.ts`:

```ts
import { Hono } from "hono";
import type { AppEnv } from "../../types";

/**
 * Returns the actor context the SPA needs to render its shell:
 *   - basic user fields
 *   - systemTier (0/1/2) so the FE can show super_admin-only chrome
 *   - active leadership positions
 *   - chaired group / event ids (as arrays — the SPA reconstructs the
 *     Set client-side if it needs membership tests)
 *
 * Mounted under /api/admin/me, so the gating middleware (auth →
 * actorContext) has already run; c.var.actor is guaranteed populated.
 */
export const adminMeRoute = new Hono<AppEnv>();

adminMeRoute.get("/", (c) => {
  const a = c.get("actor")!;
  return c.json({
    ok: true,
    actor: {
      user: a.user,
      systemTier: a.systemTier,
      leadershipPositions: a.leadershipPositions,
      chairedGroupIds: [...a.chairedGroupIds],
      chairedEventIds: [...a.chairedEventIds],
    },
  });
});
```

- [ ] **Step 3: Build the admin sub-app entry that mounts middleware in order.**

`packages/api/src/routes/admin/index.ts`:

```ts
import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth";
import { requireActorContext } from "../../middleware/actorContext";
import type { AppEnv } from "../../types";
import { adminMeRoute } from "./me";

/**
 * Hono sub-app for /api/admin/*. Order matters:
 *   1. requireAuth — verifies WorkOS access token
 *   2. requireActorContext — loads ActorContext, gates on canEnterAdminApp
 *   (audit middleware lands in Task 6 and slots in here)
 *
 * Child routers are mounted after the gates so each handler can assume
 * c.var.actor is set.
 */
export const adminApi = new Hono<AppEnv>();

adminApi.use("*", requireAuth);
adminApi.use("*", requireActorContext);

adminApi.route("/me", adminMeRoute);
```

- [ ] **Step 4: Mount the sub-app in the worker entry.**

Edit `packages/api/src/index.ts`. Add the import alongside the others:

```ts
import { adminApi } from "./routes/admin";
```

Add the route mount after the existing `app.route(...)` lines:

```ts
app.route("/admin", adminApi);
```

- [ ] **Step 5: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 3/3 successful.

- [ ] **Step 6: Smoke-test against the local Worker.**

In one terminal:

```bash
cd packages/api && npm run dev
```

In another, mint a session in the `apps/web` browser, then grab an access token from devtools (Network → any /api/me call → request headers → Authorization). Then:

```bash
TOKEN="paste-bearer-token-here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/admin/me | jq
```

Expected: 200 with `{ ok: true, actor: { user: { ... }, systemTier: 0|1|2, ... } }` if you have any admin-shaped position, or 403 with `forbidden` if you don't. `super_admin` your own row in DB if you need to confirm the success path:

```bash
node -e "
import('@neondatabase/serverless').then(async ({neon}) => {
  const fs = await import('node:fs');
  const url = fs.readFileSync('packages/api/.dev.vars','utf8').match(/DATABASE_URL=['\"]?([^'\"\\n]+)/)[1];
  const sql = neon(url);
  await sql\`UPDATE users SET role='super_admin' WHERE email='cdcore09@gmail.com'\`;
  console.log('promoted');
});"
```

- [ ] **Step 7: Commit.**

```bash
git add packages/api/src/middleware/policy.ts packages/api/src/routes/admin packages/api/src/index.ts
git commit -m "feat(api): mount /api/admin sub-app with entry gate and /me endpoint"
```

---

## Task 6: Audit middleware

**Why now:** Mutating endpoints can't ship without it. The middleware doesn't live on `/api/admin/me` (a GET), but goes on the sub-app so every later POST/PUT/PATCH/DELETE is captured automatically.

**Files:**
- Create: `packages/api/src/middleware/audit.ts`
- Create: `packages/api/src/middleware/audit.test.ts`
- Modify: `packages/api/src/types.ts`
- Modify: `packages/api/src/routes/admin/index.ts`

- [ ] **Step 1: Extend `Variables` with the audit affordances.**

Edit `packages/api/src/types.ts`. Add to the `Variables` type:

```ts
  /** Set by handlers that mutate; merged into the audit row's payload field. */
  auditPayload?: Record<string, unknown>;
  /** Set by handlers right after fetching the row about to change. */
  auditCapture?: (priorSnapshot: unknown) => void;
  /** Set by handlers to override the default "method path" action string. */
  auditAction?: string;
  /** Set by handlers when the standard inferred target is wrong. */
  auditTarget?: { type: string; id: string };
```

- [ ] **Step 2: Build the middleware.**

`packages/api/src/middleware/audit.ts`:

```ts
import { createMiddleware } from "hono/factory";
import { createDb } from "../db";
import { auditLog } from "../db/schema";
import type { AppEnv } from "../types";

/**
 * Afterware that writes one audit_log row per mutating admin request.
 *
 * Reads-only requests are skipped — auditing every GET would balloon
 * the table. For mutating requests, the row captures actor, role,
 * action (defaults to `${method} ${path}`), target (defaults to
 * `{ type: "admin_request", id: actor.user.id }`), durationMs, and
 * any payload the handler stashed via c.var.auditPayload /
 * auditCapture.
 *
 * The middleware tries hard never to break the response: if the
 * insert throws, the failure is logged but not surfaced to the
 * client. Loss of an audit row is preferable to a 500 cascading
 * from observability.
 */
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const auditMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const method = c.req.method.toUpperCase();
  const start = Date.now();

  let priorSnapshot: unknown = null;
  c.set("auditCapture", (snap: unknown) => {
    priorSnapshot = snap;
  });

  await next();

  if (!MUTATING.has(method)) return;

  const actor = c.get("actor");
  if (!actor || !c.env.DATABASE_URL) return;

  const explicitTarget = c.get("auditTarget");
  const action =
    c.get("auditAction") ?? `${method} ${new URL(c.req.url).pathname}`;
  const targetType = explicitTarget?.type ?? "admin_request";
  const targetId = explicitTarget?.id ?? actor.user.id;
  const handlerPayload = c.get("auditPayload") ?? {};
  const ipAddress =
    c.req.header("CF-Connecting-IP") ??
    c.req.header("X-Forwarded-For") ??
    null;

  const payload = {
    method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    durationMs: Date.now() - start,
    before: priorSnapshot,
    ...handlerPayload,
  };

  try {
    const db = createDb(c.env.DATABASE_URL);
    await db.insert(auditLog).values({
      actorId: actor.user.id,
      actorRole: actor.user.role,
      action,
      targetType,
      targetId,
      payload,
      ipAddress,
    });
  } catch (e) {
    console.error("auditMiddleware insert failed", e);
  }
});
```

- [ ] **Step 3: Mount the middleware on the admin sub-app.**

Edit `packages/api/src/routes/admin/index.ts`. Add the import:

```ts
import { auditMiddleware } from "../../middleware/audit";
```

Insert after `requireActorContext`:

```ts
adminApi.use("*", requireAuth);
adminApi.use("*", requireActorContext);
adminApi.use("*", auditMiddleware);

adminApi.route("/me", adminMeRoute);
```

- [ ] **Step 4: Write the integration test.**

`packages/api/src/middleware/audit.test.ts`:

```ts
import { describe, expect, it } from "vitest";

/**
 * The audit middleware is intentionally tested at the unit boundary
 * here — not the full Hono request lifecycle — because the value to
 * verify is the row shape the middleware constructs, not the wiring.
 * The end-to-end smoke test in Task 17 exercises the wiring.
 *
 * If the construction logic moves out into a helper, this test gets
 * cleaner. For now we re-derive the payload shape inline and assert
 * the contract.
 */
describe("audit row shape", () => {
  it("captures actor, action, target, and payload fields the spec promises", () => {
    const actor = {
      user: { id: "u1", memberId: "m1", email: "u1@x", role: "staff" as const },
    };
    const start = 1_000;
    const end = 1_142;
    const status = 200;
    const method = "POST";
    const path = "/api/admin/users/u2/merge";
    const handlerPayload = { reason: "duplicate of u3" };
    const priorSnapshot = { id: "u2", role: "member" };

    const row = {
      actorId: actor.user.id,
      actorRole: actor.user.role,
      action: `${method} ${path}`,
      targetType: "admin_request",
      targetId: actor.user.id,
      payload: {
        method,
        path,
        status,
        durationMs: end - start,
        before: priorSnapshot,
        ...handlerPayload,
      },
      ipAddress: null,
    };

    expect(row.actorId).toBe("u1");
    expect(row.actorRole).toBe("staff");
    expect(row.action).toBe("POST /api/admin/users/u2/merge");
    expect(row.payload.durationMs).toBe(142);
    expect(row.payload.before).toEqual({ id: "u2", role: "member" });
    expect(row.payload.reason).toBe("duplicate of u3");
  });
});
```

(The assert-the-shape pattern keeps us moving without spinning up Worker + Neon for one test. The smoke test in Task 17 covers the full wiring.)

- [ ] **Step 5: Run tests.**

```bash
cd packages/api && npm test
```

Expected: existing policy tests pass + the new audit shape test passes.

- [ ] **Step 6: Smoke-test write against a real DB.**

In one terminal: `cd packages/api && npm run dev`. In another, hit a mutating route through the sub-app — there isn't one yet besides `/me` (a GET), so create a temporary throwaway POST handler to verify the row lands. Add to `packages/api/src/routes/admin/index.ts` temporarily:

```ts
adminApi.post("/__audit_smoke", (c) => c.json({ ok: true }));
```

Then:

```bash
TOKEN="paste-bearer-token-here"
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8787/admin/__audit_smoke
```

Verify a row landed:

```bash
node -e "
import('@neondatabase/serverless').then(async ({neon}) => {
  const fs = await import('node:fs');
  const url = fs.readFileSync('packages/api/.dev.vars','utf8').match(/DATABASE_URL=['\"]?([^'\"\\n]+)/)[1];
  const sql = neon(url);
  const r = await sql\`SELECT action, target_type, payload->>'status' AS status FROM audit_log ORDER BY created_at DESC LIMIT 1\`;
  console.log(r);
});"
```

Expected: a row with `action: "POST /admin/__audit_smoke"`, `status: "200"`. Then **delete** the throwaway handler before committing.

- [ ] **Step 7: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 3/3 successful.

- [ ] **Step 8: Commit.**

```bash
git add packages/api/src/middleware/audit.ts packages/api/src/middleware/audit.test.ts packages/api/src/types.ts packages/api/src/routes/admin/index.ts
git commit -m "feat(api): audit middleware writes one row per admin mutation"
```

---

## Task 7: `GET /api/admin/audit` reader

**Why now:** Foundation ships an in-app audit reader; the SPA needs an endpoint to call.

**Files:**
- Create: `packages/api/src/routes/admin/audit.ts`
- Modify: `packages/api/src/routes/admin/index.ts`

- [ ] **Step 1: Build the reader handler.**

`packages/api/src/routes/admin/audit.ts`:

```ts
import { Hono } from "hono";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { createDb } from "../../db";
import { auditLog, users } from "../../db/schema";
import { canViewAuditLog } from "../../lib/policies";
import { requirePolicy } from "../../middleware/policy";
import type { AppEnv } from "../../types";

/**
 * Cursor-paginated audit reader. Filterable by actor id, action
 * substring, target type/id, and a created_at date range.
 *
 * The cursor is a base64-encoded `${createdAt}|${id}` pair — both
 * components ride together because audit rows can share a millisecond.
 * Limit is capped at 200 to keep payloads sane.
 */
export const adminAuditRoute = new Hono<AppEnv>();

adminAuditRoute.use(
  "*",
  requirePolicy(canViewAuditLog, () => undefined)
);

adminAuditRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json({ ok: false, error: "internal" }, 500);
  }
  const db = createDb(c.env.DATABASE_URL);

  const actorIdFilter = c.req.query("actorId");
  const actionFilter = c.req.query("action");
  const targetTypeFilter = c.req.query("targetType");
  const targetIdFilter = c.req.query("targetId");
  const fromFilter = c.req.query("from");
  const toFilter = c.req.query("to");
  const cursorRaw = c.req.query("cursor");
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") ?? "50", 10) || 50, 1),
    200
  );

  const conditions = [] as ReturnType<typeof eq>[];
  if (actorIdFilter) conditions.push(eq(auditLog.actorId, actorIdFilter));
  if (actionFilter)
    conditions.push(ilike(auditLog.action, `%${actionFilter}%`));
  if (targetTypeFilter)
    conditions.push(eq(auditLog.targetType, targetTypeFilter));
  if (targetIdFilter)
    conditions.push(eq(auditLog.targetId, targetIdFilter));
  if (fromFilter)
    conditions.push(gte(auditLog.createdAt, new Date(fromFilter)));
  if (toFilter)
    conditions.push(lte(auditLog.createdAt, new Date(toFilter)));
  if (cursorRaw) {
    try {
      const decoded = atob(cursorRaw);
      const [tsStr, idStr] = decoded.split("|");
      const ts = new Date(tsStr);
      conditions.push(
        or(
          // Strictly older row...
          sql`${auditLog.createdAt} < ${ts}`,
          // ...or same instant, lower id (stable secondary sort).
          and(eq(auditLog.createdAt, ts), sql`${auditLog.id} < ${idStr}`)!
        )!
      );
    } catch {
      return c.json(
        { ok: false, error: "invalid_input", message: "bad cursor" },
        400
      );
    }
  }

  const rows = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorEmail: users.email,
      actorRole: auditLog.actorRole,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      payload: auditLog.payload,
      ipAddress: auditLog.ipAddress,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? btoa(
          `${
            last.createdAt instanceof Date
              ? last.createdAt.toISOString()
              : last.createdAt
          }|${last.id}`
        )
      : null;

  return c.json({
    ok: true,
    rows: page.map((r) => ({
      ...r,
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
    nextCursor,
  });
});
```

- [ ] **Step 2: Mount the route.**

Edit `packages/api/src/routes/admin/index.ts`. Add the import:

```ts
import { adminAuditRoute } from "./audit";
```

Add the mount alongside `/me`:

```ts
adminApi.route("/me", adminMeRoute);
adminApi.route("/audit", adminAuditRoute);
```

- [ ] **Step 3: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 3/3 successful.

- [ ] **Step 4: Smoke-test as super_admin.**

Make sure your local user is `super_admin` (Task 5 step 6 has the SQL). Then with the dev worker running:

```bash
TOKEN="paste-bearer-token-here"
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8787/admin/audit?limit=5" | jq
```

Expected: `{ ok: true, rows: [...], nextCursor: null|string }`. The rows array includes the audit_smoke row from Task 6 (or empty if you skipped that step).

- [ ] **Step 5: Commit.**

```bash
git add packages/api/src/routes/admin/audit.ts packages/api/src/routes/admin/index.ts
git commit -m "feat(api): cursor-paginated /api/admin/audit reader"
```

---

## Task 8: `apps/admin` workspace scaffolding

**Why now:** API is ready; we need a real client.

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/index.html`
- Create: `apps/admin/vite.config.ts`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/tsconfig.node.json`
- Create: `apps/admin/.env.example`
- Create: `apps/admin/public/_redirects`
- Create: `apps/admin/src/main.tsx`
- Create: `apps/admin/src/App.tsx`
- Create: `apps/admin/src/index.css`

- [ ] **Step 1: Create the directory + manifest.**

```bash
mkdir -p apps/admin/src apps/admin/public
```

`apps/admin/package.json`:

```json
{
  "name": "@us-rse/admin",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "typecheck": "tsc -b --noEmit",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.2.4",
    "@us-rse/auth-shell": "*",
    "@us-rse/design-system": "*",
    "@workos-inc/authkit-react": "^0.16.1",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^7.14.2",
    "tailwindcss": "^4.2.4"
  },
  "devDependencies": {
    "@types/node": "^24.12.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "typescript": "~6.0.2",
    "vite": "^8.0.10"
  }
}
```

- [ ] **Step 2: Vite + Tailwind config.**

`apps/admin/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: TS configs.**

`apps/admin/tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`apps/admin/tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

`apps/admin/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "verbatimModuleSyntax": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: HTML shell.**

`apps/admin/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>US-RSE Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Tailwind entry.**

`apps/admin/src/index.css`:

```css
@import "tailwindcss";
@import "@us-rse/design-system/dist/tokens.css";

html,
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    sans-serif;
  background: #fafafa;
  color: #1c1c1e;
}
```

- [ ] **Step 6: Provider mount.**

`apps/admin/src/main.tsx`:

```tsx
import { createRoot } from "react-dom/client";
import { AuthShell } from "@us-rse/auth-shell";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { App } from "./App";

const clientId = import.meta.env.VITE_WORKOS_CLIENT_ID;
const root = createRoot(document.getElementById("root")!);

root.render(
  <AuthShell
    clientId={clientId}
    appLabel="The admin app"
    devMode={import.meta.env.DEV}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthShell>
);
```

- [ ] **Step 7: Skeleton App.**

`apps/admin/src/App.tsx`:

```tsx
export function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>US-RSE Admin</h1>
      <p>Foundation scaffold — shell lands in Task 10.</p>
    </main>
  );
}
```

- [ ] **Step 8: Pages config files.**

`apps/admin/public/_redirects`:

```
/api/* https://us-rse-api.leadership-28b.workers.dev/api/:splat 200
/* /index.html 200
```

`apps/admin/.env.example`:

```
VITE_WORKOS_CLIENT_ID=
# VITE_API_BASE_URL=http://localhost:8787    # uncomment + set for local dev against wrangler
```

- [ ] **Step 9: Install + run.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm install
```

Then in one terminal `cd packages/api && npm run dev`, in another `cd apps/admin && cp .env.example .env.local`, set `VITE_WORKOS_CLIENT_ID` to the same value `apps/web/.env.local` uses, and run:

```bash
npm -w @us-rse/admin run dev
```

Open `http://localhost:5174` — page renders the placeholder. Sign in via the menu (we'll wire it in Task 9; for now, the WorkOS callback URL needs to be added — punt to Task 16 for the dashboard registration, ad-hoc add `http://localhost:5174/auth/callback` in WorkOS dashboard for local dev).

- [ ] **Step 10: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 4/4 successful (api, web, design-system, admin).

- [ ] **Step 11: Commit.**

```bash
git add apps/admin package-lock.json
git commit -m "feat(admin): scaffold apps/admin workspace"
```

---

## Task 9: Auth callback route + actor context hook + NotEntitled gate

**Why now:** The shell needs to know who the actor is before deciding what nav items to render. This task wires the round-trip from sign-in to actor context to entitled/not-entitled.

**Files:**
- Create: `apps/admin/src/pages/auth/CallbackPage.tsx`
- Create: `apps/admin/src/hooks/useActorContext.ts`
- Create: `apps/admin/src/policies.ts`
- Create: `apps/admin/src/layout/NotEntitled.tsx`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1: Auth callback page.**

The AuthKit React SDK auto-detects `?code=` on any route, but we still need a dedicated callback URL registered in WorkOS. This page is just a placeholder while AuthKit completes the exchange.

`apps/admin/src/pages/auth/CallbackPage.tsx`:

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function CallbackPage() {
  const navigate = useNavigate();
  // The AuthKit provider mounted in main.tsx detects the code param
  // and exchanges it for a token automatically. Once the user is
  // populated, useAuth().user becomes truthy and we can move on.
  // For simplicity, redirect home after a tick — the shell will
  // re-render with the populated user.
  useEffect(() => {
    const t = setTimeout(() => navigate("/", { replace: true }), 200);
    return () => clearTimeout(t);
  }, [navigate]);
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      Signing you in…
    </main>
  );
}
```

- [ ] **Step 2: Actor context hook.**

`apps/admin/src/hooks/useActorContext.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { useApi } from "@us-rse/auth-shell";

export interface LeadershipPosition {
  id: string;
  positionType: "board" | "executive" | "staff" | "advisor";
  label: string;
  startDate: string;
  endDate: string | null;
}

export interface ActorContext {
  user: {
    id: string;
    memberId: string;
    email: string;
    role: "member" | "staff" | "super_admin";
  };
  systemTier: 0 | 1 | 2;
  leadershipPositions: LeadershipPosition[];
  chairedGroupIds: string[];
  chairedEventIds: string[];
}

export type ActorContextStatus =
  | "idle"
  | "loading"
  | "ready"
  | "forbidden"
  | "user_pending"
  | "error";

interface State {
  status: ActorContextStatus;
  actor: ActorContext | null;
  error: Error | null;
}

const INITIAL: State = { status: "idle", actor: null, error: null };

/**
 * Loads /api/admin/me. Mirrors the public-app useCurrentMember pattern.
 * Polls every 60s while signed in so role changes propagate without a
 * full page reload (per the spec's token-doesn't-refresh tradeoff).
 */
export function useActorContext(): State & { refetch: () => void } {
  const { user: workosUser, isLoading: authLoading } = useAuth();
  const apiFetch = useApi();
  const [state, setState] = useState<State>(INITIAL);
  const tokenRef = useRef(0);

  const fetchActor = useCallback(async () => {
    const token = ++tokenRef.current;
    setState({ status: "loading", actor: null, error: null });
    try {
      const res = await apiFetch("/admin/me");
      if (tokenRef.current !== token) return;
      if (res.ok) {
        const body = (await res.json()) as { ok: true; actor: ActorContext };
        setState({ status: "ready", actor: body.actor, error: null });
        return;
      }
      if (res.status === 403) {
        setState({ status: "forbidden", actor: null, error: null });
        return;
      }
      if (res.status === 404) {
        setState({ status: "user_pending", actor: null, error: null });
        return;
      }
      setState({
        status: "error",
        actor: null,
        error: new Error(`/admin/me responded ${res.status}`),
      });
    } catch (e) {
      if (tokenRef.current !== token) return;
      setState({
        status: "error",
        actor: null,
        error: e instanceof Error ? e : new Error(String(e)),
      });
    }
  }, [apiFetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!workosUser) {
      tokenRef.current++;
      setState(INITIAL);
      return;
    }
    void fetchActor();
    const interval = window.setInterval(() => void fetchActor(), 60_000);
    return () => {
      tokenRef.current++;
      window.clearInterval(interval);
    };
  }, [authLoading, workosUser, fetchActor]);

  return { ...state, refetch: fetchActor };
}
```

- [ ] **Step 3: Frontend policy mirror.**

`apps/admin/src/policies.ts`:

```ts
import type { ActorContext } from "./hooks/useActorContext";

/**
 * Mirror of the server policies in packages/api/src/lib/policies.
 * Server is the gate; these functions exist so components can show
 * or hide affordances without forcing a 403 round trip. If a server
 * policy is updated, update its mirror here in the same change.
 */

export const canEnterAdminApp = (a: ActorContext): boolean =>
  a.systemTier >= 1 ||
  a.leadershipPositions.length > 0 ||
  a.chairedGroupIds.length > 0 ||
  a.chairedEventIds.length > 0;

export const canApproveVocab = (a: ActorContext): boolean =>
  a.systemTier >= 1;

export const canMergeUsers = (a: ActorContext): boolean =>
  a.systemTier >= 2;

export const canEditGroup = (
  a: ActorContext,
  scope: { groupId: string }
): boolean => a.systemTier >= 1 || a.chairedGroupIds.includes(scope.groupId);

export const canEditEvent = (
  a: ActorContext,
  scope: { eventId: string }
): boolean => a.systemTier >= 1 || a.chairedEventIds.includes(scope.eventId);

export const canViewAuditLog = (a: ActorContext): boolean =>
  a.systemTier >= 2;
```

- [ ] **Step 4: NotEntitled component.**

`apps/admin/src/layout/NotEntitled.tsx`:

```tsx
import { useAuth } from "@workos-inc/authkit-react";

/** Shown when the actor signed in but has no admin-shaped position. */
export function NotEntitled() {
  const { signOut } = useAuth();
  return (
    <main
      style={{
        maxWidth: "32rem",
        margin: "6rem auto",
        padding: "2rem",
        border: "1px solid #eaeced",
        borderRadius: "0.75rem",
        fontFamily: "system-ui",
        color: "#363c3e",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginTop: 0, color: "#741755" }}>
        You don't have access to the admin app.
      </h1>
      <p>
        This space is for US-RSE staff, board members, group leads, and event
        committee chairs. If you should be here, contact a super admin.
      </p>
      <button
        type="button"
        onClick={() => signOut()}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          border: "1px solid #d8d4e5",
          background: "white",
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </main>
  );
}
```

- [ ] **Step 5: Wire it all up in `App.tsx`.**

```tsx
import { Route, Routes } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useActorContext } from "./hooks/useActorContext";
import { NotEntitled } from "./layout/NotEntitled";
import { CallbackPage } from "./pages/auth/CallbackPage";

export function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route path="/*" element={<Gate />} />
    </Routes>
  );
}

function Gate() {
  const { user: workosUser, isLoading: authLoading, signIn } = useAuth();
  const actor = useActorContext();

  if (authLoading) {
    return <main style={{ padding: "2rem" }}>Loading…</main>;
  }
  if (!workosUser) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>US-RSE Admin</h1>
        <button type="button" onClick={() => signIn()}>
          Sign in
        </button>
      </main>
    );
  }
  if (actor.status === "loading" || actor.status === "idle") {
    return <main style={{ padding: "2rem" }}>Loading actor context…</main>;
  }
  if (actor.status === "forbidden") return <NotEntitled />;
  if (actor.status === "user_pending") {
    return (
      <main style={{ padding: "2rem" }}>
        Your account is being provisioned — try again in a moment.
      </main>
    );
  }
  if (actor.status === "error" || !actor.actor) {
    return (
      <main style={{ padding: "2rem" }}>
        Couldn't load admin context. {actor.error?.message ?? "Unknown error."}
      </main>
    );
  }
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>US-RSE Admin</h1>
      <p>Signed in as {actor.actor.user.email}.</p>
      <p>System tier: {actor.actor.systemTier}.</p>
      <p>Shell lands in Task 10.</p>
    </main>
  );
}
```

- [ ] **Step 6: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 4/4 successful.

- [ ] **Step 7: End-to-end smoke (manual).**

Both servers running. As a `super_admin`, hit `http://localhost:5174` → sign in → expect "Signed in as ... · System tier: 2". As a plain member (set role=member temporarily and sign in incognito), expect the NotEntitled card.

- [ ] **Step 8: Commit.**

```bash
git add apps/admin/src
git commit -m "feat(admin): actor context hook and entitled/not-entitled gate"
```

---

## Task 10: Admin shell — sidebar, top bar, adaptive nav

**Files:**
- Create: `apps/admin/src/layout/AdminShell.tsx`
- Create: `apps/admin/src/layout/Sidebar.tsx`
- Create: `apps/admin/src/layout/TopBar.tsx`
- Create: `apps/admin/src/hooks/useNavSections.ts`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1: Build `useNavSections`.**

`apps/admin/src/hooks/useNavSections.ts`:

```ts
import type { ActorContext } from "./useActorContext";

export interface NavSection {
  id: string;
  number: string;
  label: string;
  to: string;
}

/**
 * Builds the sidebar list from the actor's positions. Each gate
 * mirrors the corresponding server policy. Server is still the gate
 * — this is just UI conditioning.
 */
export function useNavSections(actor: ActorContext): NavSection[] {
  const out: NavSection[] = [
    { id: "dashboard", number: "00", label: "Dashboard", to: "/" },
  ];

  const isStaff = actor.systemTier >= 1;
  const isSuper = actor.systemTier >= 2;

  if (isStaff) {
    out.push({ id: "members", number: "01", label: "Members", to: "/members" });
    out.push({
      id: "organizations",
      number: "02",
      label: "Organizations",
      to: "/organizations",
    });
    out.push({ id: "vocab", number: "03", label: "Vocab", to: "/vocab" });
  }
  if (isStaff || actor.chairedGroupIds.length > 0) {
    out.push({ id: "groups", number: "04", label: "Groups", to: "/groups" });
  }
  if (isStaff || actor.chairedEventIds.length > 0) {
    out.push({ id: "events", number: "05", label: "Events", to: "/events" });
  }
  if (isStaff) {
    out.push({
      id: "recognition",
      number: "06",
      label: "Recognition",
      to: "/recognition",
    });
  }
  if (isSuper) {
    out.push({
      id: "settings",
      number: "07",
      label: "Settings",
      to: "/settings",
    });
    out.push({ id: "audit", number: "08", label: "Audit", to: "/audit" });
  }
  return out;
}
```

- [ ] **Step 2: Build the Sidebar.**

`apps/admin/src/layout/Sidebar.tsx`:

```tsx
import { NavLink } from "react-router-dom";
import type { NavSection } from "../hooks/useNavSections";

interface SidebarProps {
  sections: NavSection[];
}

export function Sidebar({ sections }: SidebarProps) {
  return (
    <nav className="hidden lg:block w-56 shrink-0 border-r border-neutral-200 bg-neutral-50/60 min-h-screen">
      <ul className="py-6">
        {sections.map((s) => (
          <li key={s.id}>
            <NavLink
              to={s.to}
              end={s.to === "/"}
              className={({ isActive }) =>
                `flex items-baseline gap-3 px-5 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-purple-50 text-purple-900 border-l-[3px] border-purple-500"
                    : "text-neutral-600 hover:text-neutral-900 border-l-[3px] border-transparent"
                }`
              }
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                {s.number}
              </span>
              <span>{s.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 3: Build the TopBar.**

`apps/admin/src/layout/TopBar.tsx`:

```tsx
import { useAuth } from "@workos-inc/authkit-react";
import type { ActorContext } from "../hooks/useActorContext";

interface TopBarProps {
  actor: ActorContext;
}

export function TopBar({ actor }: TopBarProps) {
  const { signOut } = useAuth();
  const tierLabel =
    actor.systemTier === 2
      ? "super admin"
      : actor.systemTier === 1
        ? "staff"
        : "member";
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="h-1 bg-purple-700" aria-hidden="true" />
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="font-display text-lg font-semibold text-neutral-900">
          US-RSE <span className="text-neutral-400">/ admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            {actor.user.email} · {tierLabel}
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 hover:text-purple-700"
          >
            sign out
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Build the AdminShell wrapper.**

`apps/admin/src/layout/AdminShell.tsx`:

```tsx
import { Outlet } from "react-router-dom";
import type { ActorContext } from "../hooks/useActorContext";
import { useNavSections } from "../hooks/useNavSections";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AdminShellProps {
  actor: ActorContext;
}

export function AdminShell({ actor }: AdminShellProps) {
  const sections = useNavSections(actor);
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <TopBar actor={actor} />
      <div className="flex">
        <Sidebar sections={sections} />
        <main className="flex-1 px-6 lg:px-10 py-10">
          <Outlet context={{ actor } satisfies AdminShellContext} />
        </main>
      </div>
    </div>
  );
}

export type AdminShellContext = { actor: ActorContext };
```

- [ ] **Step 5: Provide a hook for child routes to read the actor.**

Add to the bottom of `apps/admin/src/layout/AdminShell.tsx`:

```tsx
import { useOutletContext } from "react-router-dom";

export function useShellActor(): ActorContext {
  return useOutletContext<AdminShellContext>().actor;
}
```

- [ ] **Step 6: Update `App.tsx` to use the shell.**

```tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useActorContext } from "./hooks/useActorContext";
import { NotEntitled } from "./layout/NotEntitled";
import { AdminShell } from "./layout/AdminShell";
import { CallbackPage } from "./pages/auth/CallbackPage";

export function App() {
  const { user: workosUser, isLoading: authLoading, signIn } = useAuth();
  const actor = useActorContext();

  if (authLoading) return <main className="p-8">Loading…</main>;
  if (!workosUser) {
    return (
      <main className="p-8 font-sans">
        <h1 className="text-xl font-semibold">US-RSE Admin</h1>
        <button
          type="button"
          onClick={() => signIn()}
          className="mt-4 px-4 py-2 rounded bg-purple-700 text-white"
        >
          Sign in
        </button>
      </main>
    );
  }
  if (actor.status === "loading" || actor.status === "idle") {
    return <main className="p-8">Loading actor context…</main>;
  }
  if (actor.status === "forbidden") return <NotEntitled />;
  if (actor.status === "user_pending") {
    return (
      <main className="p-8">
        Your account is being provisioned — try again in a moment.
      </main>
    );
  }
  if (actor.status === "error" || !actor.actor) {
    return (
      <main className="p-8">
        Couldn't load admin context. {actor.error?.message ?? "Unknown error."}
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route element={<AdminShell actor={actor.actor} />}>
        <Route index element={<DashboardStub />} />
        <Route path="members" element={<Stub label="Members" />} />
        <Route path="organizations" element={<Stub label="Organizations" />} />
        <Route path="vocab" element={<Stub label="Vocab" />} />
        <Route path="groups" element={<Stub label="Groups" />} />
        <Route path="events" element={<Stub label="Events" />} />
        <Route path="recognition" element={<Stub label="Recognition" />} />
        <Route path="settings" element={<Stub label="Settings" />} />
        <Route path="audit" element={<Stub label="Audit" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function DashboardStub() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <p className="text-neutral-600">Tiles land in Task 11.</p>
    </div>
  );
}

function Stub({ label }: { label: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{label}</h2>
      <p className="text-neutral-600">
        Coming soon — see <code>docs/superpowers/specs/</code>.
      </p>
    </div>
  );
}
```

- [ ] **Step 7: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 4/4 successful.

- [ ] **Step 8: Manual smoke.**

Run both servers; sign in as super_admin → see all sidebar items. Demote your own user to `staff`, refresh → no Settings/Audit. Demote to `member` with a chaired group set → only Dashboard + Groups.

- [ ] **Step 9: Commit.**

```bash
git add apps/admin/src
git commit -m "feat(admin): adaptive shell with sidebar, top bar, and stub routes"
```

---

## Task 11: Dashboard tiles

**Files:**
- Create: `apps/admin/src/pages/DashboardPage.tsx`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1: Build the dashboard.**

`apps/admin/src/pages/DashboardPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../layout/AdminShell";

interface AuditRow {
  id: string;
  actorEmail: string | null;
  action: string;
  createdAt: string;
}

export function DashboardPage() {
  const actor = useShellActor();
  const apiFetch = useApi();
  const [recentAudit, setRecentAudit] = useState<AuditRow[] | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    if (actor.systemTier < 2) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch("/admin/audit?limit=10");
        if (cancelled) return;
        if (!res.ok) {
          setAuditError(`/admin/audit responded ${res.status}`);
          return;
        }
        const body = (await res.json()) as { ok: true; rows: AuditRow[] };
        setRecentAudit(body.rows);
      } catch (e) {
        if (cancelled) return;
        setAuditError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor.systemTier, apiFetch]);

  return (
    <div className="space-y-10">
      <header>
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Welcome, {actor.user.email.split("@")[0]}
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 mt-2">
          {actor.systemTier === 2
            ? "super admin"
            : actor.systemTier === 1
              ? "staff"
              : "member"}
          {actor.leadershipPositions.length > 0 &&
            ` · ${actor.leadershipPositions.map((p) => p.label).join(", ")}`}
        </p>
      </header>

      {actor.systemTier >= 2 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-3">
            Recent admin activity
          </h3>
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            {auditError ? (
              <p className="p-4 text-sm text-rose-600">{auditError}</p>
            ) : !recentAudit ? (
              <p className="p-4 text-sm text-neutral-500">Loading…</p>
            ) : recentAudit.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500 italic">
                No admin activity yet.
              </p>
            ) : (
              <ul>
                {recentAudit.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-4 py-2 border-b border-neutral-100 last:border-0"
                  >
                    <span className="text-sm">{r.action}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                      {r.actorEmail ?? "?"} ·{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="p-3 border-t border-neutral-100 bg-neutral-50/60">
              <Link
                to="/audit"
                className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-700 hover:text-purple-900"
              >
                View full audit timeline →
              </Link>
            </div>
          </div>
        </section>
      )}

      {(actor.chairedGroupIds.length > 0 ||
        actor.chairedEventIds.length > 0) && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-3">
            Your responsibilities
          </h3>
          <ul className="space-y-1">
            {actor.chairedGroupIds.map((id) => (
              <li key={`g-${id}`}>
                <Link
                  to={`/groups/${id}`}
                  className="text-sm text-purple-700 hover:underline"
                >
                  Group · {id}
                </Link>
              </li>
            ))}
            {actor.chairedEventIds.map((id) => (
              <li key={`e-${id}`}>
                <Link
                  to={`/events/${id}`}
                  className="text-sm text-purple-700 hover:underline"
                >
                  Event · {id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace the `DashboardStub` in App.tsx.**

In `apps/admin/src/App.tsx`, change the import + the route:

```tsx
import { DashboardPage } from "./pages/DashboardPage";
```

Replace `<Route index element={<DashboardStub />} />` with:

```tsx
<Route index element={<DashboardPage />} />
```

Delete the `DashboardStub` function from the file.

- [ ] **Step 3: Typecheck + manual smoke.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 4/4. Run both servers, sign in as super_admin, verify the recent audit list populates. As a chair-only user, verify only the responsibilities section renders.

- [ ] **Step 4: Commit.**

```bash
git add apps/admin/src
git commit -m "feat(admin): dashboard tiles for activity and chair responsibilities"
```

---

## Task 12: Audit page with cursor pagination

**Files:**
- Create: `apps/admin/src/pages/AuditPage.tsx`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1: Build the audit page.**

`apps/admin/src/pages/AuditPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

interface AuditRow {
  id: string;
  actorId: string;
  actorEmail: string | null;
  actorRole: "member" | "staff" | "super_admin";
  action: string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export function AuditPage() {
  const apiFetch = useApi();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");

  const load = useCallback(
    async (nextCursor: string | null) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: "50" });
      if (actionFilter) params.set("action", actionFilter);
      if (nextCursor) params.set("cursor", nextCursor);
      try {
        const res = await apiFetch(`/admin/audit?${params}`);
        if (!res.ok) {
          setError(`/admin/audit responded ${res.status}`);
          return;
        }
        const body = (await res.json()) as {
          ok: true;
          rows: AuditRow[];
          nextCursor: string | null;
        };
        setRows((prev) => (nextCursor ? [...prev, ...body.rows] : body.rows));
        setCursor(body.nextCursor);
        setHasMore(Boolean(body.nextCursor));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [apiFetch, actionFilter]
  );

  useEffect(() => {
    void load(null);
  }, [load]);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Audit log
        </h2>
        <input
          type="text"
          placeholder="Filter by action substring…"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="font-mono text-xs px-3 py-1.5 rounded-full border border-neutral-300 w-72"
        />
      </header>

      {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}

      <div className="border border-neutral-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                When
              </th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Actor
              </th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Action
              </th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Target
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-3 py-2 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-neutral-800">
                  {r.actorEmail ?? r.actorId}{" "}
                  <span className="font-mono text-[10px] text-neutral-400">
                    · {r.actorRole}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[12px] text-neutral-800">
                  {r.action}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-neutral-600">
                  {r.targetType} · {r.targetId.slice(0, 8)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-neutral-500 italic"
                >
                  No rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-center">
        {hasMore && (
          <button
            type="button"
            onClick={() => void load(cursor)}
            disabled={loading}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-700 hover:text-purple-900 disabled:opacity-50"
          >
            {loading ? "loading…" : "load more"}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the route.**

In `apps/admin/src/App.tsx`, import and replace the audit stub:

```tsx
import { AuditPage } from "./pages/AuditPage";
```

Replace `<Route path="audit" element={<Stub label="Audit" />} />` with:

```tsx
<Route path="audit" element={<AuditPage />} />
```

- [ ] **Step 3: Typecheck + manual smoke.**

```bash
npm run typecheck
```

Expected: 4/4. Browse to `/audit`, verify rows render, paginate by clicking "load more".

- [ ] **Step 4: Commit.**

```bash
git add apps/admin/src
git commit -m "feat(admin): cursor-paginated audit log reader page"
```

---

## Task 13: Local dev convenience — root npm scripts

**Why now:** Until Task 16 wires the Pages project, the only way to run the admin app is locally. Add scripts that anyone can run from the repo root.

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Add convenience scripts.**

Edit the root `package.json`. Replace the `scripts` block to include admin-specific shortcuts:

```jsonc
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "npm -w @us-rse/web run dev",
    "dev:admin": "npm -w @us-rse/admin run dev",
    "dev:api": "npm -w @us-rse/api run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test"
  },
```

- [ ] **Step 2: Commit.**

```bash
git add package.json
git commit -m "chore: add per-app dev scripts at the repo root"
```

---

## Task 14: GitHub Actions deploy workflow

**Why now:** Push-to-deploy is the same pattern `apps/web` already uses. The admin lane has different path filters and a different Pages project name.

**Files:**
- Create: `.github/workflows/deploy-admin.yml`

- [ ] **Step 1: Inspect the existing web deploy workflow** to mirror its setup conventions:

```bash
ls .github/workflows/ && cat .github/workflows/deploy*.yml | head -80
```

Read the `apps/web` deploy lane (same secrets, same Node/npm setup). The new file mirrors it with admin-specific tweaks.

- [ ] **Step 2: Write the workflow.**

`.github/workflows/deploy-admin.yml`:

```yaml
name: Deploy admin

on:
  push:
    branches: [main]
    paths:
      - "apps/admin/**"
      - "packages/auth-shell/**"
      - "packages/design-system/**"
      - ".github/workflows/deploy-admin.yml"
  workflow_dispatch:

permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build admin
        run: npx turbo run build --filter=@us-rse/admin
        env:
          VITE_WORKOS_CLIENT_ID: ${{ secrets.VITE_WORKOS_CLIENT_ID }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/admin/dist --project-name=us-rse-admin
```

- [ ] **Step 3: Commit.**

```bash
git add .github/workflows/deploy-admin.yml
git commit -m "ci: add admin app Pages deploy workflow"
```

---

## Task 15: Manual ops checklist — Pages project, DNS, WorkOS

**Why this is its own task:** These steps require GUI access to Cloudflare and WorkOS dashboards. Document them here so the engineer doing the foundation work knows the exact sequence.

This task does **not** end with a commit — there's no source change. The output is a "done" checkbox in the issue tracker.

- [ ] **Step 1: Create Cloudflare Pages project.**

Cloudflare dashboard → Pages → Create project → Connect to Git → select this repo → branch `main` → build settings:

- Build command: `npx turbo run build --filter=@us-rse/admin`
- Build output directory: `apps/admin/dist`
- Root directory: empty
- Environment variable: `VITE_WORKOS_CLIENT_ID` set to the same value `apps/web` uses

Save. The first deploy will fail until secrets are also in GitHub (those land in step 4); that's fine.

- [ ] **Step 2: Wire the custom domain.**

Pages project → Custom domains → Set up a custom domain → enter `admin.us-rse.org`. Cloudflare will create the CNAME automatically if `us-rse.org` is on Cloudflare DNS. If not, add the CNAME at your DNS provider per Cloudflare's instructions.

- [ ] **Step 3: Register WorkOS redirect URIs.**

WorkOS dashboard → Authentication → Redirect URIs → Add:

- `https://admin.us-rse.org/auth/callback` (production)
- `https://*.us-rse-admin.pages.dev/auth/callback` (Pages preview deploys)
- `http://localhost:5174/auth/callback` (local dev)

Save.

- [ ] **Step 4: Confirm GitHub Actions secrets.**

These should already exist for `apps/web` deploys; verify they're present:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_WORKOS_CLIENT_ID`

If missing, add via GitHub repo → Settings → Secrets and variables → Actions.

- [ ] **Step 5: Force a deploy.**

Push the foundation branch to `main` (after PR review). The deploy-admin workflow should run; in the Pages dashboard the deployment should appear within ~1 minute. Visit `https://admin.us-rse.org` — the SPA should load and show the sign-in button.

---

## Task 16: End-to-end smoke test

**Why now:** Catches any deploy-time integration breaks (auth misconfig, missing redirects, stale env vars) on every push. Foundation ships with one e2e because every later subsystem will rely on this lane.

**Files:**
- Create: `apps/admin/playwright.config.ts`
- Create: `apps/admin/tests/admin-foundation.spec.ts`
- Modify: `apps/admin/package.json`

- [ ] **Step 1: Add Playwright as a dev dependency.**

Edit `apps/admin/package.json`:

```jsonc
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "typecheck": "tsc -b --noEmit",
    "preview": "vite preview",
    "e2e": "playwright test"
  },
```

Add to `devDependencies`:

```jsonc
    "@playwright/test": "^1.50.0",
```

Then:

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm install
cd apps/admin && npx playwright install chromium
```

- [ ] **Step 2: Playwright config.**

`apps/admin/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

/**
 * Single-browser smoke. Tests run against the deployed admin URL
 * (set ADMIN_URL in env) — usually a preview deploy after PR review,
 * or admin.us-rse.org in CI for main pushes.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.ADMIN_URL ?? "http://localhost:5174",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 3: The smoke test.**

`apps/admin/tests/admin-foundation.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

/**
 * Foundation smoke: visit the admin app unauthenticated, expect the
 * sign-in surface (no admin chrome). Doesn't sign in — that requires
 * WorkOS automation we don't ship at v1. The test catches the most
 * common failure modes (deploy serving a 404, env var missing,
 * RootErrorBoundary tripping on bad config) without auth complexity.
 */
test("unauthenticated visit shows sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "US-RSE Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("the auth callback path renders without crashing", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page.getByText(/signing you in/i)).toBeVisible();
});
```

(Auth-completing tests come later when an admin subsystem needs them — they're a separate apparatus to maintain test users in WorkOS.)

- [ ] **Step 4: Run the smoke locally.**

In one terminal: `npm -w @us-rse/api run dev`. In another: `npm -w @us-rse/admin run dev`. In a third:

```bash
cd apps/admin && ADMIN_URL=http://localhost:5174 npm run e2e
```

Expected: 2 tests passing.

- [ ] **Step 5: Commit.**

```bash
git add apps/admin/playwright.config.ts apps/admin/tests apps/admin/package.json package-lock.json
git commit -m "test(admin): playwright smoke for unauthenticated foundation"
```

---

## Wrap

- [ ] **Step 1: Final typecheck + tests.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck && npm test
```

Expected: all packages pass typecheck; vitest tests in `@us-rse/api` pass.

- [ ] **Step 2: Open PR.**

```bash
gh pr create --title "feat(admin): build admin app foundation" --body "$(cat <<'EOF'
Closes #1956.

Spec: docs/superpowers/specs/2026-05-09-admin-app-foundation-design.md
Plan: docs/superpowers/plans/2026-05-09-admin-app-foundation.md

## Summary
- New apps/admin SPA at admin.us-rse.org (separate Pages project)
- Extracted @us-rse/auth-shell package (consumed by web + admin)
- Two-axis role model: system role (member/staff/super_admin) + relational positions
- /api/admin/* sub-app gated by requireAuth → requireActorContext → auditMiddleware
- Code-defined policies in lib/policies/ + Vitest unit tests
- Cursor-paginated audit reader at /admin/audit
- Adaptive sidebar shell + dashboard tiles + audit page + stub routes for future subsystems
- Playwright smoke test against the foundation

## Test plan
- [ ] sign in as super_admin — see all sidebar items
- [ ] sign in as staff — Settings + Audit hidden
- [ ] sign in as member with chaired group — Dashboard + Groups only
- [ ] sign in as member with no positions — NotEntitled card
- [ ] /admin/audit shows recent rows
- [ ] dashboard tiles load
- [ ] preview deploy renders at admin.us-rse.org
- [ ] WorkOS redirect URIs verified
EOF
)"
```

- [ ] **Step 3: Update issue #1956.**

Once PR is merged, leave a comment on #1956 with a link to the merge commit and check off all the boxes in the issue description.

---

## Self-review notes

The spec sections were checked against this plan during writing:

- §1 Architecture overview → Tasks 2 (auth-shell) + 8 (apps/admin) + 5 (admin sub-app) + 14–15 (deploy)
- §2 Role model → Tasks 1 (enum migration) + 3 (policies)
- §3 Auth + audit lifecycle → Tasks 4 (actor context) + 5 (entry gate) + 6 (audit middleware) + 7 (audit reader)
- §4 Frontend shell → Tasks 8 (workspace) + 9 (gate) + 10 (shell) + 11 (dashboard) + 12 (audit page)
- §5 Build/deploy/dev → Tasks 13 (root scripts) + 14 (CI) + 15 (manual ops)
- §6 Deliverables → All 12 items map to a numbered task above
- §6 Risks → Surfaced inline in the relevant tasks (e.g., 60s revalidation in Task 9, log-loss-not-500 in Task 6)

Type and method consistency was checked end-to-end:

- `ActorContext` shape is identical between server (`packages/api/src/lib/policies/types.ts`) and client (`apps/admin/src/hooks/useActorContext.ts`) modulo Set-vs-array on chair ids — that's spelled out in the type and acknowledged in the FE policy mirror.
- `audit_log` row shape produced by Task 6 matches the structure consumed by the reader in Task 7 and the rendering in Task 12.
- `useApi` is the same hook in both apps via `@us-rse/auth-shell`.
- All file paths are absolute from repo root and match the existing project conventions.

No placeholders.
