# Admin Identity & Members Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first admin subsystem behind the foundation — member directory, detail page, scored duplicate-candidate queue, reversible merge wizard, unmerge — so super-admins and staff can manage US-RSE membership entirely inside `admin.us-rse.org` without dropping to SQL.

**Architecture:** Adds eight endpoints under `/api/admin/users/*` on the existing Worker, gated by `requireAuth → requireActorContext → auditMiddleware`. Merge action runs as one TypeScript `db.transaction(...)` over the neon-http batched API, captured in a new `user_merges` table so unmerge can replay it. Frontend pages render in the editorial-archive vocabulary shipped at `9dcc0a0` (paper-tone background, hairline rules, Roman numerals, marginalia, ribbon accents).

**Tech Stack:** TypeScript everywhere. Backend: Cloudflare Workers + Hono + Drizzle ORM + Neon Postgres. Frontend: React 19 + Vite + React Router 7 + Tailwind + `@us-rse/design-system` + the admin's `editorial.css`. Tests: Vitest for policy + lib units, Playwright for the foundation smoke (extended at the end).

Spec: `docs/superpowers/specs/2026-05-11-admin-identity-design.md`. Tracker: #1957.

---

## Pre-flight

- [ ] **Step 1: Create a feature branch off `cdcore09/site-redesign`.**

```bash
cd /Users/corderocore/Documents/usrse.github.io
git checkout cdcore09/site-redesign
git pull --ff-only
git checkout -b cdcore09/admin-identity
```

- [ ] **Step 2: Open the spec and this plan side-by-side.** Every task references the spec.

- [ ] **Step 3: Confirm clean tree.**

```bash
git status
```

Expected: `nothing to commit, working tree clean` and on `cdcore09/admin-identity`.

---

## Task 1: Migration 0013 — `user_merges` table

**Files:**
- Create: `packages/api/migrations/0013_user_merges.sql`
- Modify: `packages/api/migrations/meta/_journal.json`
- Modify: `packages/api/src/db/schema/users.ts` (add `userMerges` table + relations)

- [ ] **Step 1: Hand-write the migration SQL.**

`packages/api/migrations/0013_user_merges.sql`:

```sql
-- Records each user-merge admin action so it stays reversible.
-- The repointed-rows manifest lets the unmerge endpoint replay the FK
-- moves in reverse; the promoted-fields payload records exactly which
-- canonical fields were overwritten so unmerge can restore them.

CREATE TABLE "user_merges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_user_id" uuid NOT NULL,
  "target_user_id" uuid NOT NULL,
  "merged_by_user_id" uuid NOT NULL,
  "reason" text,
  "repointed_rows" jsonb NOT NULL,
  "promoted_fields" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "reverted_at" timestamp with time zone,
  "reverted_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_source_user_id_users_id_fk"
  FOREIGN KEY ("source_user_id") REFERENCES "public"."users"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_target_user_id_users_id_fk"
  FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_merged_by_user_id_users_id_fk"
  FOREIGN KEY ("merged_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_reverted_by_user_id_users_id_fk"
  FOREIGN KEY ("reverted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null;--> statement-breakpoint

CREATE INDEX "user_merges_source_idx" ON "user_merges" ("source_user_id");--> statement-breakpoint
CREATE INDEX "user_merges_target_idx" ON "user_merges" ("target_user_id");--> statement-breakpoint
CREATE INDEX "user_merges_merged_by_idx" ON "user_merges" ("merged_by_user_id");--> statement-breakpoint
CREATE INDEX "user_merges_created_at_idx" ON "user_merges" ("created_at" DESC);--> statement-breakpoint

-- "Active merges" = not reverted. Partial index speeds the chain-walking
-- "is this user currently merged" check.
CREATE INDEX "user_merges_active_source_idx" ON "user_merges" ("source_user_id")
  WHERE reverted_at IS NULL;
```

- [ ] **Step 2: Append the journal entry.**

Grab a timestamp:

```bash
node -e "console.log(Date.now())"
```

Edit `packages/api/migrations/meta/_journal.json`. Inside the `entries` array, after the `0012_role_staff` entry, append:

```jsonc
    {
      "idx": 13,
      "version": "7",
      "when": <PASTE_TIMESTAMP_HERE>,
      "tag": "0013_user_merges",
      "breakpoints": true
    }
```

- [ ] **Step 3: Add the Drizzle declaration.**

Open `packages/api/src/db/schema/users.ts`. After the `profilesRelations` export at the bottom, add:

```ts
export const userMerges = pgTable(
  "user_merges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceUserId: uuid("source_user_id")
      .notNull()
      .references((): any => users.id, { onDelete: "restrict" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references((): any => users.id, { onDelete: "restrict" }),
    mergedByUserId: uuid("merged_by_user_id")
      .notNull()
      .references((): any => users.id, { onDelete: "restrict" }),
    reason: text("reason"),
    repointedRows: jsonb("repointed_rows").notNull(),
    promotedFields: jsonb("promoted_fields").notNull().default({}),
    revertedAt: timestamp("reverted_at", { withTimezone: true }),
    revertedByUserId: uuid("reverted_by_user_id").references(
      (): any => users.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("user_merges_source_idx").on(t.sourceUserId),
    index("user_merges_target_idx").on(t.targetUserId),
    index("user_merges_merged_by_idx").on(t.mergedByUserId),
    index("user_merges_created_at_idx").on(t.createdAt),
    index("user_merges_active_source_idx")
      .on(t.sourceUserId)
      .where(sql`reverted_at IS NULL`),
  ]
);

export const userMergesRelations = relations(userMerges, ({ one }) => ({
  sourceUser: one(users, {
    fields: [userMerges.sourceUserId],
    references: [users.id],
    relationName: "user_merges_source",
  }),
  targetUser: one(users, {
    fields: [userMerges.targetUserId],
    references: [users.id],
    relationName: "user_merges_target",
  }),
  mergedBy: one(users, {
    fields: [userMerges.mergedByUserId],
    references: [users.id],
    relationName: "user_merges_merged_by",
  }),
  revertedBy: one(users, {
    fields: [userMerges.revertedByUserId],
    references: [users.id],
    relationName: "user_merges_reverted_by",
  }),
}));
```

Ensure `jsonb` is in the imports at the top of the file. The file already imports from `drizzle-orm/pg-core`; add `jsonb` to that import list if not already present.

- [ ] **Step 4: Apply the migration.**

```bash
cd packages/api && npm run db:apply -- migrations/0013_user_merges.sql
```

Expected output: 9 statements, ending with `Done.`

- [ ] **Step 5: Verify the table exists.**

```bash
node -e "
import('@neondatabase/serverless').then(async ({neon}) => {
  const fs = await import('node:fs');
  const url = fs.readFileSync('.dev.vars','utf8').match(/DATABASE_URL=['\"]?([^'\"\\n]+)/)[1];
  const sql = neon(url);
  const r = await sql\`SELECT COUNT(*) AS n FROM user_merges\`;
  console.log('user_merges rows:', r[0].n);
});"
```

Expected: `user_merges rows: 0`.

- [ ] **Step 6: Typecheck.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 5/5 successful.

- [ ] **Step 7: Commit.**

```bash
git add packages/api/migrations/0013_user_merges.sql packages/api/migrations/meta/_journal.json packages/api/src/db/schema/users.ts
git commit -m "feat(db): add user_merges table for reversible admin merges"
```

---

## Task 2: New policies — `canEditMembers` + `canPromoteToRole`

**Files:**
- Create: `packages/api/src/lib/policies/canEditMembers.ts`
- Create: `packages/api/src/lib/policies/canPromoteToRole.ts`
- Modify: `packages/api/src/lib/policies/index.ts`
- Modify: `packages/api/src/lib/policies/policies.test.ts`

- [ ] **Step 1: Write `canEditMembers`.**

`packages/api/src/lib/policies/canEditMembers.ts`:

```ts
import type { ActorContext } from "./types";

/**
 * Edit members in the admin app — list, view detail, edit identity
 * fields, soft-delete, restore. Staff and super_admin only.
 */
export const canEditMembers = (a: ActorContext): boolean =>
  a.systemTier >= 1;
```

- [ ] **Step 2: Write `canPromoteToRole`.**

`packages/api/src/lib/policies/canPromoteToRole.ts`:

```ts
import type { ActorContext } from "./types";

/**
 * Authorize a role change. Staff can set a member's role to `member`
 * or `staff`; only super_admin can grant `super_admin`. Demoting from
 * super_admin (to staff or member) also requires super_admin.
 *
 * Scope is the NEW role being assigned. The current role of the target
 * is checked at the route level — this policy is purely about what the
 * actor is allowed to grant.
 */
export const canPromoteToRole = (
  a: ActorContext,
  scope: { newRole: "member" | "staff" | "super_admin" }
): boolean => {
  if (scope.newRole === "super_admin") return a.systemTier >= 2;
  return a.systemTier >= 1;
};
```

- [ ] **Step 3: Update the barrel.**

`packages/api/src/lib/policies/index.ts` — add two lines next to the existing exports:

```ts
export { canEditMembers } from "./canEditMembers";
export { canPromoteToRole } from "./canPromoteToRole";
```

- [ ] **Step 4: Add tests.**

Append to `packages/api/src/lib/policies/policies.test.ts`:

```ts
import { canEditMembers, canPromoteToRole } from "./index";

describe("canEditMembers", () => {
  it("denies plain members", () => {
    expect(canEditMembers(actor())).toBe(false);
  });
  it("allows staff", () => {
    expect(canEditMembers(actor({ systemTier: 1 }))).toBe(true);
  });
  it("allows super_admin", () => {
    expect(canEditMembers(actor({ systemTier: 2 }))).toBe(true);
  });
});

describe("canPromoteToRole", () => {
  it("staff can grant member", () => {
    expect(
      canPromoteToRole(actor({ systemTier: 1 }), { newRole: "member" })
    ).toBe(true);
  });
  it("staff can grant staff", () => {
    expect(
      canPromoteToRole(actor({ systemTier: 1 }), { newRole: "staff" })
    ).toBe(true);
  });
  it("staff cannot grant super_admin", () => {
    expect(
      canPromoteToRole(actor({ systemTier: 1 }), { newRole: "super_admin" })
    ).toBe(false);
  });
  it("super_admin can grant any role", () => {
    expect(
      canPromoteToRole(actor({ systemTier: 2 }), { newRole: "super_admin" })
    ).toBe(true);
  });
  it("plain members cannot grant any role", () => {
    expect(canPromoteToRole(actor(), { newRole: "member" })).toBe(false);
  });
});
```

- [ ] **Step 5: Run tests.**

```bash
cd packages/api && npm test
```

Expected: existing policy + audit tests pass plus 8 new policy assertions.

- [ ] **Step 6: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
```

Expected: 5/5 successful.

```bash
git add packages/api/src/lib/policies
git commit -m "feat(api): canEditMembers + canPromoteToRole policies"
```

---

## Task 3: Duplicate-detection library

**Files:**
- Create: `packages/api/src/lib/admin/duplicateDetection.ts`
- Create: `packages/api/src/lib/admin/duplicateDetection.test.ts`

- [ ] **Step 1: Write canonicalization helpers + write the failing test first.**

`packages/api/src/lib/admin/duplicateDetection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  normalizeDisplayName,
  canonicalizeEmailLocal,
  rawEmailLocal,
  emailDomain,
  canonicalizeGithub,
  canonicalizeLinkedin,
  scoreCandidatePair,
  type CandidatePairInput,
} from "./duplicateDetection";

describe("normalizeDisplayName", () => {
  it("lowercases and strips whitespace + punctuation", () => {
    expect(normalizeDisplayName("Marina Olhovsky-Mann")).toBe(
      "marinaolhovskymann"
    );
  });
  it("returns empty on empty", () => {
    expect(normalizeDisplayName("")).toBe("");
    expect(normalizeDisplayName(null)).toBe("");
  });
});

describe("canonicalizeEmailLocal", () => {
  it("strips Gmail dots and +tag, case-folds", () => {
    expect(canonicalizeEmailLocal("John.Smith+work@Gmail.com")).toBe(
      "johnsmith"
    );
  });
  it("strips +tag for non-Gmail providers but keeps dots", () => {
    expect(canonicalizeEmailLocal("john.smith+work@example.org")).toBe(
      "john.smith"
    );
  });
  it("returns empty on malformed input", () => {
    expect(canonicalizeEmailLocal("not-an-email")).toBe("");
  });
});

describe("rawEmailLocal", () => {
  it("returns the lowercased local part with no canonicalization", () => {
    expect(rawEmailLocal("John.Smith@Gmail.com")).toBe("john.smith");
  });
});

describe("emailDomain", () => {
  it("returns the lowercased domain", () => {
    expect(emailDomain("foo@BAR.com")).toBe("bar.com");
  });
});

describe("canonicalizeGithub", () => {
  it("extracts the bare username from a URL", () => {
    expect(canonicalizeGithub("https://github.com/CDCore09/")).toBe("cdcore09");
  });
  it("accepts a bare username too", () => {
    expect(canonicalizeGithub("cdcore09")).toBe("cdcore09");
  });
  it("returns empty on garbage", () => {
    expect(canonicalizeGithub(null)).toBe("");
    expect(canonicalizeGithub("https://github.com/")).toBe("");
  });
});

describe("canonicalizeLinkedin", () => {
  it("extracts the /in/<slug> path", () => {
    expect(
      canonicalizeLinkedin("https://www.linkedin.com/in/Cordero-Core/")
    ).toBe("cordero-core");
  });
  it("handles a bare slug", () => {
    expect(canonicalizeLinkedin("cordero-core")).toBe("cordero-core");
  });
});

describe("scoreCandidatePair", () => {
  function pair(overrides: Partial<CandidatePairInput> = {}): CandidatePairInput {
    return {
      a: {
        id: "u1",
        displayName: "Cordero Core",
        email: "cdcore09@gmail.com",
        orcid: null,
        githubUrl: null,
        linkedinUrl: null,
        primaryOrgId: null,
        signedUpAt: new Date("2026-01-01T00:00:00Z"),
        groupIds: new Set(),
      },
      b: {
        id: "u2",
        displayName: "Cordero Core",
        email: "cdcore@uw.edu",
        orcid: null,
        githubUrl: null,
        linkedinUrl: null,
        primaryOrgId: null,
        signedUpAt: new Date("2026-01-15T00:00:00Z"),
        groupIds: new Set(),
      },
      ...overrides,
    };
  }

  it("scores name + signup-proximity for the canonical Cordero case", () => {
    const result = scoreCandidatePair(pair());
    // displayName +30 + signup proximity within 30d +5 = 35
    expect(result.score).toBe(35);
    expect(result.signals).toContain("displayName");
    expect(result.signals).toContain("signupProximity");
  });

  it("scores identical ORCID heavily", () => {
    const result = scoreCandidatePair(
      pair({
        a: {
          ...pair().a,
          orcid: "0000-0001-2345-6789",
        },
        b: {
          ...pair().b,
          orcid: "0000-0001-2345-6789",
        },
      })
    );
    // displayName 30 + orcid 50 + signup 5 = 85
    expect(result.score).toBe(85);
    expect(result.signals).toContain("orcid");
  });

  it("scores canonicalized email match", () => {
    const result = scoreCandidatePair(
      pair({
        a: { ...pair().a, email: "john.smith@gmail.com" },
        b: { ...pair().b, email: "JohnSmith+work@gmail.com" },
      })
    );
    // displayName 30 + same canonicalized email 30 + signup 5 = 65
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.signals).toContain("canonicalEmail");
  });

  it("does not double-count when both raw-local-match and canonical-local-match fire", () => {
    // raw match implies canonical match when local parts are identical; ensure
    // we score the stronger (canonical) and not both.
    const result = scoreCandidatePair(
      pair({
        a: { ...pair().a, email: "jdoe@a.com" },
        b: { ...pair().b, email: "jdoe@b.com" },
      })
    );
    // displayName 30 + canonicalized email 30 + signup 5 = 65, NOT 30+30+25+5=90
    expect(result.score).toBe(65);
  });

  it("scores group overlap", () => {
    const result = scoreCandidatePair(
      pair({
        a: { ...pair().a, groupIds: new Set(["g1", "g2"]) },
        b: { ...pair().b, groupIds: new Set(["g1", "g3"]) },
      })
    );
    // displayName 30 + canonical email match (cdcore09 vs cdcore — NOT a match) +
    // group overlap 10 + signup 5 = 45
    expect(result.signals).toContain("groupOverlap");
  });

  it("tier high when ≥80, medium when 50–79, weak when 30–49", () => {
    expect(scoreCandidatePair(pair()).tier).toBe("weak"); // 35
    expect(
      scoreCandidatePair(
        pair({
          a: { ...pair().a, orcid: "0000-0001-0000-0001" },
          b: { ...pair().b, orcid: "0000-0001-0000-0001" },
        })
      ).tier
    ).toBe("high"); // 85
  });
});
```

- [ ] **Step 2: Run the test, expect compile failure.**

```bash
cd packages/api && npm test -- duplicateDetection
```

Expected: module not found / fail. We haven't written the implementation yet.

- [ ] **Step 3: Write the implementation.**

`packages/api/src/lib/admin/duplicateDetection.ts`:

```ts
/**
 * Multi-signal duplicate detection for the admin members directory.
 *
 * The flow is:
 *   1. Discover candidate pairs via anchor groups (an "anchor" is a key
 *      strong enough that two users sharing it deserve a closer look —
 *      normalized display name, canonicalized email local-part, ORCID,
 *      GitHub username, LinkedIn slug).
 *   2. Score each pair against all signals, additive.
 *   3. Surface pairs whose score >= 30, sorted by score desc.
 *
 * Anchor discovery is one SQL pass per anchor; scoring is pure JS over
 * the user payloads. At <10k members this is cheap enough to recompute
 * per request — no precomputed table needed.
 */

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export function normalizeDisplayName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function rawEmailLocal(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "";
  return email.split("@", 2)[0].toLowerCase();
}

export function emailDomain(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "";
  return email.split("@", 2)[1].toLowerCase();
}

export function canonicalizeEmailLocal(
  email: string | null | undefined
): string {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.toLowerCase().split("@", 2);
  // Strip +tag for everyone.
  const noTag = local.split("+", 1)[0];
  // For Gmail-family domains, dots in the local part are ignored.
  if (GMAIL_DOMAINS.has(domain)) return noTag.replace(/\./g, "");
  return noTag;
}

export function canonicalizeGithub(
  raw: string | null | undefined
): string {
  if (!raw) return "";
  // Match the path component after github.com/ or accept a bare username.
  const urlMatch = raw.match(/github\.com\/([^/?#]+)/i);
  const username = (urlMatch ? urlMatch[1] : raw).trim();
  if (!username || username === "/") return "";
  return username.replace(/[/]+$/, "").toLowerCase();
}

export function canonicalizeLinkedin(
  raw: string | null | undefined
): string {
  if (!raw) return "";
  // /in/<slug> path on linkedin.com, or a bare slug.
  const urlMatch = raw.match(/linkedin\.com\/in\/([^/?#]+)/i);
  const slug = (urlMatch ? urlMatch[1] : raw).trim();
  if (!slug || slug === "/") return "";
  return slug.replace(/[/]+$/, "").toLowerCase();
}

/** Damerau-Levenshtein-like distance — adjacent transposition aware. */
export function nearLocalPart(a: string, b: string): boolean {
  if (a === b) return false; // same string is not "similar", it's identical
  if (Math.abs(a.length - b.length) > 2) return false;
  return levenshtein(a, b) <= 2;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1).fill(0);
  const curr = new Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export interface CandidateUser {
  id: string;
  displayName: string | null;
  email: string;
  orcid: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  primaryOrgId: string | null;
  signedUpAt: Date;
  groupIds: Set<string>;
}

export interface CandidatePairInput {
  a: CandidateUser;
  b: CandidateUser;
}

export type Tier = "high" | "medium" | "weak";

export interface ScoredPair {
  a: CandidateUser;
  b: CandidateUser;
  score: number;
  signals: string[];
  tier: Tier;
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function scoreCandidatePair(input: CandidatePairInput): ScoredPair {
  const { a, b } = input;
  const signals: string[] = [];
  let score = 0;

  if (a.orcid && b.orcid && a.orcid === b.orcid) {
    score += 50;
    signals.push("orcid");
  }
  const gha = canonicalizeGithub(a.githubUrl);
  const ghb = canonicalizeGithub(b.githubUrl);
  if (gha && ghb && gha === ghb) {
    score += 50;
    signals.push("github");
  }
  const lia = canonicalizeLinkedin(a.linkedinUrl);
  const lib = canonicalizeLinkedin(b.linkedinUrl);
  if (lia && lib && lia === lib) {
    score += 50;
    signals.push("linkedin");
  }
  const na = normalizeDisplayName(a.displayName);
  const nb = normalizeDisplayName(b.displayName);
  if (na && nb && na === nb) {
    score += 30;
    signals.push("displayName");
  }
  const ca = canonicalizeEmailLocal(a.email);
  const cb = canonicalizeEmailLocal(b.email);
  const da = emailDomain(a.email);
  const db = emailDomain(b.email);
  const ra = rawEmailLocal(a.email);
  const rb = rawEmailLocal(b.email);

  if (ca && cb && ca === cb) {
    // Canonical match (covers Gmail-dot equivalence and +tag stripping).
    score += 30;
    signals.push("canonicalEmail");
  } else if (ra && rb && ra === rb && da !== db) {
    // Raw same, different domains — not canonical-equivalent (e.g.,
    // `jdoe@a.com` vs `jdoe@b.com`); still a moderate signal.
    score += 25;
    signals.push("rawEmailDifferentDomain");
  } else if (ra && rb && nearLocalPart(ra, rb)) {
    // Typo-distance match.
    score += 10;
    signals.push("similarEmailLocal");
  }

  if (a.primaryOrgId && b.primaryOrgId && a.primaryOrgId === b.primaryOrgId) {
    score += 15;
    signals.push("primaryOrg");
  }

  // Group overlap — true if any group id is shared.
  for (const g of a.groupIds) {
    if (b.groupIds.has(g)) {
      score += 10;
      signals.push("groupOverlap");
      break;
    }
  }

  const aT = a.signedUpAt.getTime();
  const bT = b.signedUpAt.getTime();
  if (Math.abs(aT - bT) <= ONE_MONTH_MS) {
    score += 5;
    signals.push("signupProximity");
  }

  const tier: Tier = score >= 80 ? "high" : score >= 50 ? "medium" : "weak";
  return { a, b, score, signals, tier };
}
```

- [ ] **Step 4: Run tests, expect pass.**

```bash
cd packages/api && npm test -- duplicateDetection
```

Expected: all assertions pass.

- [ ] **Step 5: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/admin
git commit -m "feat(api): multi-signal duplicate-detection library + tests"
```

---

## Task 4: Anchor-driven candidate discovery query

**Files:**
- Modify: `packages/api/src/lib/admin/duplicateDetection.ts` (add `findCandidates`)
- Modify: `packages/api/src/lib/admin/duplicateDetection.test.ts` (smoke against the live DB or mocked rows — we'll keep this as an in-memory function unit test and validate against the real DB in the route smoke later)

- [ ] **Step 1: Add the candidate-pair builder.**

In `duplicateDetection.ts`, append:

```ts
/**
 * Given a flat list of CandidateUser rows fetched from the DB, builds
 * the deduplicated set of pairs surfaced by any anchor. Each pair is
 * scored once; pairs that don't meet the threshold are dropped.
 */
export function buildAndScorePairs(
  users: CandidateUser[],
  options: { threshold?: number; limit?: number } = {}
): ScoredPair[] {
  const threshold = options.threshold ?? 30;
  const limit = options.limit ?? 100;

  // Build anchor groups in one pass.
  const byName = new Map<string, CandidateUser[]>();
  const byCanonEmail = new Map<string, CandidateUser[]>();
  const byOrcid = new Map<string, CandidateUser[]>();
  const byGithub = new Map<string, CandidateUser[]>();
  const byLinkedin = new Map<string, CandidateUser[]>();

  for (const u of users) {
    const n = normalizeDisplayName(u.displayName);
    if (n) push(byName, n, u);
    const ce = canonicalizeEmailLocal(u.email);
    if (ce) push(byCanonEmail, ce, u);
    if (u.orcid) push(byOrcid, u.orcid, u);
    const gh = canonicalizeGithub(u.githubUrl);
    if (gh) push(byGithub, gh, u);
    const li = canonicalizeLinkedin(u.linkedinUrl);
    if (li) push(byLinkedin, li, u);
  }

  // Collect candidate pairs from each anchor (groups of 2+), deduplicated.
  const pairKey = (a: CandidateUser, b: CandidateUser) =>
    a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
  const seenPairs = new Map<string, CandidatePairInput>();
  for (const anchor of [byName, byCanonEmail, byOrcid, byGithub, byLinkedin]) {
    for (const group of anchor.values()) {
      if (group.length < 2) continue;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i];
          const b = group[j];
          const key = pairKey(a, b);
          if (!seenPairs.has(key)) seenPairs.set(key, { a, b });
        }
      }
    }
  }

  // Score and filter.
  const scored: ScoredPair[] = [];
  for (const p of seenPairs.values()) {
    const s = scoreCandidatePair(p);
    if (s.score >= threshold) scored.push(s);
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, limit);
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V): void {
  const list = m.get(k);
  if (list) list.push(v);
  else m.set(k, [v]);
}
```

- [ ] **Step 2: Add a test exercising `buildAndScorePairs`.**

Append to `duplicateDetection.test.ts`:

```ts
import { buildAndScorePairs } from "./duplicateDetection";
import type { CandidateUser } from "./duplicateDetection";

function u(overrides: Partial<CandidateUser> & { id: string }): CandidateUser {
  return {
    displayName: null,
    email: `${overrides.id}@example.com`,
    orcid: null,
    githubUrl: null,
    linkedinUrl: null,
    primaryOrgId: null,
    signedUpAt: new Date("2026-01-01T00:00:00Z"),
    groupIds: new Set(),
    ...overrides,
  };
}

describe("buildAndScorePairs", () => {
  it("returns no pairs below threshold", () => {
    const rows = [
      u({ id: "u1", displayName: "Alice", email: "alice@x.com" }),
      u({ id: "u2", displayName: "Bob", email: "bob@x.com" }),
    ];
    expect(buildAndScorePairs(rows)).toEqual([]);
  });

  it("surfaces a name-anchor pair above threshold", () => {
    const rows = [
      u({ id: "u1", displayName: "Cordero Core", email: "cdcore09@gmail.com" }),
      u({ id: "u2", displayName: "Cordero Core", email: "cdcore@uw.edu" }),
    ];
    const results = buildAndScorePairs(rows);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBeGreaterThanOrEqual(30);
  });

  it("dedupes pairs surfaced from multiple anchors", () => {
    // Two users matching on BOTH normalized name AND orcid — should
    // produce ONE pair, scored with both signals.
    const rows = [
      u({
        id: "u1",
        displayName: "John Smith",
        email: "j@a.com",
        orcid: "0000-0001-0000-0001",
      }),
      u({
        id: "u2",
        displayName: "John Smith",
        email: "j@b.com",
        orcid: "0000-0001-0000-0001",
      }),
    ];
    const results = buildAndScorePairs(rows);
    expect(results).toHaveLength(1);
    expect(results[0].signals).toContain("orcid");
    expect(results[0].signals).toContain("displayName");
  });

  it("caps to the requested limit, sorted by score desc", () => {
    const rows: CandidateUser[] = [];
    for (let i = 0; i < 5; i++) {
      // Five pairs of identically-named users with varying ORCID matches.
      rows.push(
        u({
          id: `a${i}`,
          displayName: `User ${i}`,
          email: `a${i}@x.com`,
          orcid: i === 0 ? "0000-0001-0000-0001" : null,
        })
      );
      rows.push(
        u({
          id: `b${i}`,
          displayName: `User ${i}`,
          email: `b${i}@x.com`,
          orcid: i === 0 ? "0000-0001-0000-0001" : null,
        })
      );
    }
    const results = buildAndScorePairs(rows, { limit: 3 });
    expect(results).toHaveLength(3);
    // First should be the ORCID-matched pair (highest score).
    expect(results[0].signals).toContain("orcid");
    // Sorted desc.
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
  });
});
```

- [ ] **Step 3: Run tests + commit.**

```bash
cd packages/api && npm test -- duplicateDetection
```

Expected: all existing + new tests pass.

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/admin
git commit -m "feat(api): anchor-driven candidate-pair discovery"
```

---

## Task 5: Merge transaction — snapshot phase

**Files:**
- Create: `packages/api/src/lib/admin/userMerge.ts`
- Create: `packages/api/src/lib/admin/userMerge.test.ts`

- [ ] **Step 1: Define the public surface + types in `userMerge.ts`.**

```ts
import { and, eq, isNull } from "drizzle-orm";
import type { createDb } from "../../db";
import {
  certifications,
  communityContributions,
  education,
  eventAttendances,
  eventCommitteeAssignments,
  eventSessionPresenters,
  experiences,
  groupMemberships,
  leadershipTerms,
  mentorshipPairings,
  userAwards,
  userDisciplines,
  userEngagementTypes,
  userLanguages,
  userMerges,
  userOrganizations,
  userSkills,
  users,
  works,
  auditLog,
  profiles,
} from "../../db/schema";

type Db = ReturnType<typeof createDb>;

/**
 * Subset of profile/user identity fields that the merge wizard offers
 * for promotion. Email and role are intentionally excluded.
 */
export const PROMOTABLE_PROFILE_FIELDS = [
  "displayName",
  "headline",
  "bio",
  "photoUrl",
  "jobTitle",
  "githubUrl",
  "linkedinUrl",
  "orcid",
  "websiteUrl",
  "pronounId",
  "careerStageId",
  "countryId",
  "region",
  "city",
  "publicLocation",
] as const;

export type PromotableField = (typeof PROMOTABLE_PROFILE_FIELDS)[number];

export interface MergeRequest {
  sourceUserId: string;
  targetUserId: string;
  mergedByUserId: string;
  promotedFields: PromotableField[];
  reason?: string;
}

export interface MergeValidationError {
  status: 400 | 404 | 409;
  error: string;
  message: string;
}

export interface MergeSnapshot {
  source: typeof users.$inferSelect;
  target: typeof users.$inferSelect;
  sourceProfile: typeof profiles.$inferSelect | null;
  targetProfile: typeof profiles.$inferSelect | null;
  // Per FK-bearing table: the row ids on source that will move to target.
  toRepoint: {
    user_organizations: string[];
    experiences: string[];
    education: string[];
    certifications: string[];
    group_memberships: string[];
    works: string[];
    event_committee_assignments: string[];
    event_attendances: string[];
    event_session_presenters: string[];
    user_disciplines: string[];
    user_skills: string[];
    user_languages: string[];
    user_engagement_types: string[];
    user_awards: string[];
    mentorship_pairings_mentor: string[];
    mentorship_pairings_mentee: string[];
    community_contributions: string[];
    leadership_terms: string[];
    audit_log: string[];
  };
  // Join-table rows where source AND target both have the same X; source's
  // row will be deleted instead of repointed (target wins on conflict).
  conflicts: Array<{
    table: string;
    deletedRowId: string;
    snapshot: Record<string, unknown>;
  }>;
}
```

- [ ] **Step 2: Implement the validation helper.**

Append to `userMerge.ts`:

```ts
/**
 * Pre-merge validation. Returns null on success, a MergeValidationError
 * payload otherwise. Pure SQL reads — no writes here.
 */
export async function validateMerge(
  db: Db,
  req: MergeRequest
): Promise<MergeValidationError | null> {
  if (req.sourceUserId === req.targetUserId) {
    return {
      status: 400,
      error: "invalid_input",
      message: "Source and target must be different users.",
    };
  }

  const [src, tgt] = await Promise.all([
    db
      .select()
      .from(users)
      .where(eq(users.id, req.sourceUserId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(users)
      .where(eq(users.id, req.targetUserId))
      .limit(1)
      .then((r) => r[0]),
  ]);

  if (!src) {
    return {
      status: 404,
      error: "not_found",
      message: `Source user ${req.sourceUserId} not found.`,
    };
  }
  if (!tgt) {
    return {
      status: 404,
      error: "not_found",
      message: `Target user ${req.targetUserId} not found.`,
    };
  }
  if (src.mergedIntoUserId !== null) {
    return {
      status: 409,
      error: "already_merged",
      message: `Source is already merged into ${src.mergedIntoUserId}. Unmerge first.`,
    };
  }
  if (src.role === "super_admin") {
    return {
      status: 409,
      error: "forbidden_role",
      message:
        "Merging a super_admin source via this endpoint is blocked. Use direct SQL.",
    };
  }
  if (tgt.deletedAt !== null) {
    return {
      status: 409,
      error: "target_deleted",
      message: "Cannot merge into a soft-deleted user. Restore first.",
    };
  }
  return null;
}
```

- [ ] **Step 3: Implement the snapshot builder.**

Append to `userMerge.ts`:

```ts
/**
 * Reads source + target rows and walks every FK-bearing table to build
 * the to-repoint manifest and conflict list. Pure reads — no writes.
 */
export async function buildMergeSnapshot(
  db: Db,
  req: MergeRequest
): Promise<MergeSnapshot> {
  const [src, tgt] = await Promise.all([
    db.select().from(users).where(eq(users.id, req.sourceUserId)).limit(1).then((r) => r[0]),
    db.select().from(users).where(eq(users.id, req.targetUserId)).limit(1).then((r) => r[0]),
  ]);
  const [srcProfile, tgtProfile] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.userId, req.sourceUserId)).limit(1).then((r) => r[0] ?? null),
    db.select().from(profiles).where(eq(profiles.userId, req.targetUserId)).limit(1).then((r) => r[0] ?? null),
  ]);

  // Tables without (user_id, X) unique constraints — straight repoint.
  const [
    expRows, eduRows, certRows, worksRows, leadershipRows,
    attendanceRows, presenterRows, awardRows,
    mentorMentorRows, mentorMenteeRows, contribRows, auditRows,
  ] = await Promise.all([
    db.select({ id: experiences.id }).from(experiences).where(eq(experiences.userId, req.sourceUserId)),
    db.select({ id: education.id }).from(education).where(eq(education.userId, req.sourceUserId)),
    db.select({ id: certifications.id }).from(certifications).where(eq(certifications.userId, req.sourceUserId)),
    db.select({ id: works.id }).from(works).where(eq(works.userId, req.sourceUserId)),
    db.select({ id: leadershipTerms.id }).from(leadershipTerms).where(eq(leadershipTerms.userId, req.sourceUserId)),
    db.select({ id: eventAttendances.id }).from(eventAttendances).where(eq(eventAttendances.userId, req.sourceUserId)),
    db.select({ id: eventSessionPresenters.id }).from(eventSessionPresenters).where(eq(eventSessionPresenters.userId, req.sourceUserId)),
    db.select({ id: userAwards.id }).from(userAwards).where(eq(userAwards.userId, req.sourceUserId)),
    db.select({ id: mentorshipPairings.id }).from(mentorshipPairings).where(eq(mentorshipPairings.mentorUserId, req.sourceUserId)),
    db.select({ id: mentorshipPairings.id }).from(mentorshipPairings).where(eq(mentorshipPairings.menteeUserId, req.sourceUserId)),
    db.select({ id: communityContributions.id }).from(communityContributions).where(eq(communityContributions.contributorId, req.sourceUserId)),
    db.select({ id: auditLog.id }).from(auditLog).where(eq(auditLog.actorId, req.sourceUserId)),
  ]);

  // Join tables WITH (user_id, X) unique constraints — must dedupe conflicts.
  // For each: fetch source's rows + target's rows, compute conflicts.
  const conflicts: MergeSnapshot["conflicts"] = [];
  const toRepointUserOrgs: string[] = [];

  const [srcUserOrgs, tgtUserOrgs] = await Promise.all([
    db.select().from(userOrganizations).where(eq(userOrganizations.userId, req.sourceUserId)),
    db.select().from(userOrganizations).where(eq(userOrganizations.userId, req.targetUserId)),
  ]);
  const tgtOrgIds = new Set(tgtUserOrgs.map((r) => r.organizationId));
  for (const r of srcUserOrgs) {
    if (tgtOrgIds.has(r.organizationId)) {
      conflicts.push({ table: "user_organizations", deletedRowId: r.id, snapshot: r as unknown as Record<string, unknown> });
    } else {
      toRepointUserOrgs.push(r.id);
    }
  }

  const toRepointUserDisc: string[] = [];
  const [srcDisc, tgtDisc] = await Promise.all([
    db.select().from(userDisciplines).where(eq(userDisciplines.userId, req.sourceUserId)),
    db.select().from(userDisciplines).where(eq(userDisciplines.userId, req.targetUserId)),
  ]);
  const tgtDiscIds = new Set(tgtDisc.map((r) => r.disciplineId));
  for (const r of srcDisc) {
    if (tgtDiscIds.has(r.disciplineId)) {
      conflicts.push({ table: "user_disciplines", deletedRowId: r.disciplineId, snapshot: r as unknown as Record<string, unknown> });
    } else {
      toRepointUserDisc.push(r.disciplineId);
    }
  }

  const toRepointUserSkills: string[] = [];
  const [srcSk, tgtSk] = await Promise.all([
    db.select().from(userSkills).where(eq(userSkills.userId, req.sourceUserId)),
    db.select().from(userSkills).where(eq(userSkills.userId, req.targetUserId)),
  ]);
  const tgtSkIds = new Set(tgtSk.map((r) => r.skillId));
  for (const r of srcSk) {
    if (tgtSkIds.has(r.skillId)) {
      conflicts.push({ table: "user_skills", deletedRowId: r.skillId, snapshot: r as unknown as Record<string, unknown> });
    } else {
      toRepointUserSkills.push(r.skillId);
    }
  }

  const toRepointUserLangs: string[] = [];
  const [srcLng, tgtLng] = await Promise.all([
    db.select().from(userLanguages).where(eq(userLanguages.userId, req.sourceUserId)),
    db.select().from(userLanguages).where(eq(userLanguages.userId, req.targetUserId)),
  ]);
  const tgtLngIds = new Set(tgtLng.map((r) => r.languageId));
  for (const r of srcLng) {
    if (tgtLngIds.has(r.languageId)) {
      conflicts.push({ table: "user_languages", deletedRowId: r.languageId, snapshot: r as unknown as Record<string, unknown> });
    } else {
      toRepointUserLangs.push(r.languageId);
    }
  }

  const toRepointUserEng: string[] = [];
  const [srcEng, tgtEng] = await Promise.all([
    db.select().from(userEngagementTypes).where(eq(userEngagementTypes.userId, req.sourceUserId)),
    db.select().from(userEngagementTypes).where(eq(userEngagementTypes.userId, req.targetUserId)),
  ]);
  const tgtEngIds = new Set(tgtEng.map((r) => r.engagementTypeId));
  for (const r of srcEng) {
    if (tgtEngIds.has(r.engagementTypeId)) {
      conflicts.push({ table: "user_engagement_types", deletedRowId: r.engagementTypeId, snapshot: r as unknown as Record<string, unknown> });
    } else {
      toRepointUserEng.push(r.engagementTypeId);
    }
  }

  const toRepointGroup: string[] = [];
  const [srcGM, tgtGM] = await Promise.all([
    db.select().from(groupMemberships).where(eq(groupMemberships.userId, req.sourceUserId)),
    db.select().from(groupMemberships).where(eq(groupMemberships.userId, req.targetUserId)),
  ]);
  const tgtGroupIds = new Set(tgtGM.map((r) => r.groupId));
  for (const r of srcGM) {
    if (tgtGroupIds.has(r.groupId)) {
      conflicts.push({ table: "group_memberships", deletedRowId: r.id, snapshot: r as unknown as Record<string, unknown> });
    } else {
      toRepointGroup.push(r.id);
    }
  }

  const toRepointEvComm: string[] = [];
  const [srcECA, tgtECA] = await Promise.all([
    db.select().from(eventCommitteeAssignments).where(eq(eventCommitteeAssignments.userId, req.sourceUserId)),
    db.select().from(eventCommitteeAssignments).where(eq(eventCommitteeAssignments.userId, req.targetUserId)),
  ]);
  const tgtECAKeys = new Set(tgtECA.map((r) => `${r.eventId}:${r.areaId}`));
  for (const r of srcECA) {
    if (tgtECAKeys.has(`${r.eventId}:${r.areaId}`)) {
      conflicts.push({ table: "event_committee_assignments", deletedRowId: r.id, snapshot: r as unknown as Record<string, unknown> });
    } else {
      toRepointEvComm.push(r.id);
    }
  }

  return {
    source: src,
    target: tgt,
    sourceProfile: srcProfile,
    targetProfile: tgtProfile,
    toRepoint: {
      user_organizations: toRepointUserOrgs,
      experiences: expRows.map((r) => r.id),
      education: eduRows.map((r) => r.id),
      certifications: certRows.map((r) => r.id),
      group_memberships: toRepointGroup,
      works: worksRows.map((r) => r.id),
      event_committee_assignments: toRepointEvComm,
      event_attendances: attendanceRows.map((r) => r.id),
      event_session_presenters: presenterRows.map((r) => r.id),
      user_disciplines: toRepointUserDisc,
      user_skills: toRepointUserSkills,
      user_languages: toRepointUserLangs,
      user_engagement_types: toRepointUserEng,
      user_awards: awardRows.map((r) => r.id),
      mentorship_pairings_mentor: mentorMentorRows.map((r) => r.id),
      mentorship_pairings_mentee: mentorMenteeRows.map((r) => r.id),
      community_contributions: contribRows.map((r) => r.id),
      leadership_terms: leadershipRows.map((r) => r.id),
      audit_log: auditRows.map((r) => r.id),
    },
    conflicts,
  };
}
```

- [ ] **Step 4: Write minimal snapshot tests.**

`packages/api/src/lib/admin/userMerge.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PROMOTABLE_PROFILE_FIELDS } from "./userMerge";

describe("PROMOTABLE_PROFILE_FIELDS", () => {
  it("excludes email and role", () => {
    expect(PROMOTABLE_PROFILE_FIELDS).not.toContain("email" as never);
    expect(PROMOTABLE_PROFILE_FIELDS).not.toContain("role" as never);
  });
  it("includes the common profile fields", () => {
    expect(PROMOTABLE_PROFILE_FIELDS).toContain("displayName");
    expect(PROMOTABLE_PROFILE_FIELDS).toContain("photoUrl");
    expect(PROMOTABLE_PROFILE_FIELDS).toContain("bio");
  });
});
```

Validation + snapshot are exercised against a real DB in the route smoke test (Task 19); writing a full mocked-db harness here is high-effort for low signal.

- [ ] **Step 5: Run tests + typecheck + commit.**

```bash
cd packages/api && npm test
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/admin
git commit -m "feat(api): user merge snapshot + validation"
```

---

## Task 6: Merge transaction — write phase + audit payload

**Files:**
- Modify: `packages/api/src/lib/admin/userMerge.ts`

- [ ] **Step 1: Add `executeMerge`.**

Append to `userMerge.ts`:

```ts
import { sql } from "drizzle-orm";

export interface MergeResult {
  mergeId: string;
  repointedRows: MergeSnapshot["toRepoint"];
  conflicts: MergeSnapshot["conflicts"];
  promotedFields: Record<string, unknown>;
}

/**
 * Run the merge as one batched neon-http transaction. Snapshot must be
 * pre-computed (see buildMergeSnapshot). Caller is responsible for
 * pre-merge validation.
 *
 * Returns the merge_history row id + the manifests so the caller can
 * audit-capture without re-querying.
 */
export async function executeMerge(
  db: Db,
  snapshot: MergeSnapshot,
  req: MergeRequest
): Promise<MergeResult> {
  const promotedRecord: Record<string, unknown> = {};

  // Capture pre-merge target values for fields being promoted.
  for (const f of req.promotedFields) {
    if (snapshot.targetProfile) {
      // @ts-expect-error — dynamic field index by the validated string union
      promotedRecord[f] = snapshot.targetProfile[f] ?? null;
    } else {
      promotedRecord[f] = null;
    }
  }

  // Build the batched transaction. Each step is its own SQL statement;
  // neon-http groups them and runs as one round-trip atomic batch.
  await db.transaction(async (tx) => {
    // 1. Promote fields from source onto target's profile.
    if (req.promotedFields.length > 0 && snapshot.targetProfile && snapshot.sourceProfile) {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      for (const f of req.promotedFields) {
        // @ts-expect-error — dynamic field copy
        updates[f] = snapshot.sourceProfile[f];
      }
      await tx
        .update(profiles)
        .set(updates)
        .where(eq(profiles.userId, snapshot.target.id));
    }

    // 2. Straight FK repoints (no join-table conflict to handle).
    const straightTables = [
      { t: experiences, ids: snapshot.toRepoint.experiences },
      { t: education, ids: snapshot.toRepoint.education },
      { t: certifications, ids: snapshot.toRepoint.certifications },
      { t: works, ids: snapshot.toRepoint.works },
      { t: leadershipTerms, ids: snapshot.toRepoint.leadership_terms },
      { t: eventAttendances, ids: snapshot.toRepoint.event_attendances },
      { t: eventSessionPresenters, ids: snapshot.toRepoint.event_session_presenters },
      { t: userAwards, ids: snapshot.toRepoint.user_awards },
      { t: communityContributions, ids: snapshot.toRepoint.community_contributions },
    ] as const;
    for (const { t, ids } of straightTables) {
      if (ids.length === 0) continue;
      // @ts-expect-error — t.userId exists on each of these tables
      await tx.update(t).set({ userId: snapshot.target.id }).where(sql`${t}.id = ANY(${ids})`);
    }

    // Mentorship pairings have two FKs to users — handle each side.
    if (snapshot.toRepoint.mentorship_pairings_mentor.length > 0) {
      await tx
        .update(mentorshipPairings)
        .set({ mentorUserId: snapshot.target.id })
        .where(sql`${mentorshipPairings.id} = ANY(${snapshot.toRepoint.mentorship_pairings_mentor})`);
    }
    if (snapshot.toRepoint.mentorship_pairings_mentee.length > 0) {
      await tx
        .update(mentorshipPairings)
        .set({ menteeUserId: snapshot.target.id })
        .where(sql`${mentorshipPairings.id} = ANY(${snapshot.toRepoint.mentorship_pairings_mentee})`);
    }

    // audit_log has actor_id (not user_id).
    if (snapshot.toRepoint.audit_log.length > 0) {
      await tx
        .update(auditLog)
        .set({ actorId: snapshot.target.id })
        .where(sql`${auditLog.id} = ANY(${snapshot.toRepoint.audit_log})`);
    }

    // 3. Join tables WITH (user_id, X) unique constraints.
    if (snapshot.toRepoint.user_organizations.length > 0) {
      await tx
        .update(userOrganizations)
        .set({ userId: snapshot.target.id })
        .where(sql`${userOrganizations.id} = ANY(${snapshot.toRepoint.user_organizations})`);
    }
    if (snapshot.toRepoint.group_memberships.length > 0) {
      await tx
        .update(groupMemberships)
        .set({ userId: snapshot.target.id })
        .where(sql`${groupMemberships.id} = ANY(${snapshot.toRepoint.group_memberships})`);
    }
    if (snapshot.toRepoint.event_committee_assignments.length > 0) {
      await tx
        .update(eventCommitteeAssignments)
        .set({ userId: snapshot.target.id })
        .where(sql`${eventCommitteeAssignments.id} = ANY(${snapshot.toRepoint.event_committee_assignments})`);
    }
    // Composite-PK join tables (user_disciplines etc.) — these have (user_id, X) PKs.
    // Need to repoint by updating the user_id where it matches source AND the X
    // is in the to-repoint list.
    if (snapshot.toRepoint.user_disciplines.length > 0) {
      await tx
        .update(userDisciplines)
        .set({ userId: snapshot.target.id })
        .where(
          and(
            eq(userDisciplines.userId, snapshot.source.id),
            sql`${userDisciplines.disciplineId} = ANY(${snapshot.toRepoint.user_disciplines})`
          )
        );
    }
    if (snapshot.toRepoint.user_skills.length > 0) {
      await tx
        .update(userSkills)
        .set({ userId: snapshot.target.id })
        .where(
          and(
            eq(userSkills.userId, snapshot.source.id),
            sql`${userSkills.skillId} = ANY(${snapshot.toRepoint.user_skills})`
          )
        );
    }
    if (snapshot.toRepoint.user_languages.length > 0) {
      await tx
        .update(userLanguages)
        .set({ userId: snapshot.target.id })
        .where(
          and(
            eq(userLanguages.userId, snapshot.source.id),
            sql`${userLanguages.languageId} = ANY(${snapshot.toRepoint.user_languages})`
          )
        );
    }
    if (snapshot.toRepoint.user_engagement_types.length > 0) {
      await tx
        .update(userEngagementTypes)
        .set({ userId: snapshot.target.id })
        .where(
          and(
            eq(userEngagementTypes.userId, snapshot.source.id),
            sql`${userEngagementTypes.engagementTypeId} = ANY(${snapshot.toRepoint.user_engagement_types})`
          )
        );
    }

    // 4. Delete the conflict rows on the source side. Their snapshots
    //    are already captured for the user_merges manifest.
    for (const c of snapshot.conflicts) {
      switch (c.table) {
        case "user_organizations":
          await tx.delete(userOrganizations).where(eq(userOrganizations.id, c.deletedRowId));
          break;
        case "group_memberships":
          await tx.delete(groupMemberships).where(eq(groupMemberships.id, c.deletedRowId));
          break;
        case "event_committee_assignments":
          await tx.delete(eventCommitteeAssignments).where(eq(eventCommitteeAssignments.id, c.deletedRowId));
          break;
        case "user_disciplines":
          await tx.delete(userDisciplines).where(
            and(eq(userDisciplines.userId, snapshot.source.id), eq(userDisciplines.disciplineId, c.deletedRowId))
          );
          break;
        case "user_skills":
          await tx.delete(userSkills).where(
            and(eq(userSkills.userId, snapshot.source.id), eq(userSkills.skillId, c.deletedRowId))
          );
          break;
        case "user_languages":
          await tx.delete(userLanguages).where(
            and(eq(userLanguages.userId, snapshot.source.id), eq(userLanguages.languageId, c.deletedRowId))
          );
          break;
        case "user_engagement_types":
          await tx.delete(userEngagementTypes).where(
            and(eq(userEngagementTypes.userId, snapshot.source.id), eq(userEngagementTypes.engagementTypeId, c.deletedRowId))
          );
          break;
      }
    }

    // 5. Mark source as merged.
    await tx
      .update(users)
      .set({
        mergedIntoUserId: snapshot.target.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, snapshot.source.id));
  });

  // 6. Insert the user_merges row (outside the batched transaction; the
  //    merge state on `users` is already committed at this point — this
  //    INSERT is durable record-keeping for unmerge).
  const inserted = await db
    .insert(userMerges)
    .values({
      sourceUserId: snapshot.source.id,
      targetUserId: snapshot.target.id,
      mergedByUserId: req.mergedByUserId,
      reason: req.reason ?? null,
      repointedRows: snapshot.toRepoint as unknown as Record<string, unknown>,
      promotedFields: promotedRecord,
    })
    .returning({ id: userMerges.id });

  return {
    mergeId: inserted[0].id,
    repointedRows: snapshot.toRepoint,
    conflicts: snapshot.conflicts,
    promotedFields: promotedRecord,
  };
}
```

- [ ] **Step 2: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/admin/userMerge.ts
git commit -m "feat(api): user merge transaction write phase"
```

---

## Task 7: Unmerge transaction

**Files:**
- Modify: `packages/api/src/lib/admin/userMerge.ts`

- [ ] **Step 1: Add `executeUnmerge`.**

Append to `userMerge.ts`:

```ts
export interface UnmergeRequest {
  mergeId: string;
  revertedByUserId: string;
}

export interface UnmergeValidationError {
  status: 400 | 404 | 409;
  error: string;
  message: string;
}

export async function executeUnmerge(
  db: Db,
  req: UnmergeRequest
): Promise<UnmergeValidationError | { mergeId: string }> {
  const mergeRow = await db
    .select()
    .from(userMerges)
    .where(eq(userMerges.id, req.mergeId))
    .limit(1)
    .then((r) => r[0]);
  if (!mergeRow) {
    return {
      status: 404,
      error: "not_found",
      message: `merge ${req.mergeId} not found.`,
    };
  }
  if (mergeRow.revertedAt !== null) {
    return {
      status: 409,
      error: "already_reverted",
      message: "This merge has already been reverted.",
    };
  }

  const sourceCurrent = await db
    .select({ mergedIntoUserId: users.mergedIntoUserId })
    .from(users)
    .where(eq(users.id, mergeRow.sourceUserId))
    .limit(1)
    .then((r) => r[0]);
  if (!sourceCurrent || sourceCurrent.mergedIntoUserId !== mergeRow.targetUserId) {
    return {
      status: 409,
      error: "stale_merge",
      message:
        "Source's merge target no longer matches this merge record. Manual review required.",
    };
  }

  const repointedRows = mergeRow.repointedRows as MergeSnapshot["toRepoint"];
  const promotedFields = mergeRow.promotedFields as Record<string, unknown>;
  const conflicts = (repointedRows as unknown as { conflicts?: MergeSnapshot["conflicts"] }).conflicts ?? [];

  await db.transaction(async (tx) => {
    // 1. Move every previously-repointed row back to source.
    const straightTables = [
      { t: experiences, ids: repointedRows.experiences },
      { t: education, ids: repointedRows.education },
      { t: certifications, ids: repointedRows.certifications },
      { t: works, ids: repointedRows.works },
      { t: leadershipTerms, ids: repointedRows.leadership_terms },
      { t: eventAttendances, ids: repointedRows.event_attendances },
      { t: eventSessionPresenters, ids: repointedRows.event_session_presenters },
      { t: userAwards, ids: repointedRows.user_awards },
      { t: communityContributions, ids: repointedRows.community_contributions },
    ] as const;
    for (const { t, ids } of straightTables) {
      if (ids.length === 0) continue;
      // @ts-expect-error — t.userId exists
      await tx.update(t).set({ userId: mergeRow.sourceUserId }).where(sql`${t}.id = ANY(${ids})`);
    }
    if (repointedRows.mentorship_pairings_mentor.length > 0) {
      await tx
        .update(mentorshipPairings)
        .set({ mentorUserId: mergeRow.sourceUserId })
        .where(sql`${mentorshipPairings.id} = ANY(${repointedRows.mentorship_pairings_mentor})`);
    }
    if (repointedRows.mentorship_pairings_mentee.length > 0) {
      await tx
        .update(mentorshipPairings)
        .set({ menteeUserId: mergeRow.sourceUserId })
        .where(sql`${mentorshipPairings.id} = ANY(${repointedRows.mentorship_pairings_mentee})`);
    }
    if (repointedRows.audit_log.length > 0) {
      await tx
        .update(auditLog)
        .set({ actorId: mergeRow.sourceUserId })
        .where(sql`${auditLog.id} = ANY(${repointedRows.audit_log})`);
    }
    if (repointedRows.user_organizations.length > 0) {
      await tx
        .update(userOrganizations)
        .set({ userId: mergeRow.sourceUserId })
        .where(sql`${userOrganizations.id} = ANY(${repointedRows.user_organizations})`);
    }
    if (repointedRows.group_memberships.length > 0) {
      await tx
        .update(groupMemberships)
        .set({ userId: mergeRow.sourceUserId })
        .where(sql`${groupMemberships.id} = ANY(${repointedRows.group_memberships})`);
    }
    if (repointedRows.event_committee_assignments.length > 0) {
      await tx
        .update(eventCommitteeAssignments)
        .set({ userId: mergeRow.sourceUserId })
        .where(sql`${eventCommitteeAssignments.id} = ANY(${repointedRows.event_committee_assignments})`);
    }
    if (repointedRows.user_disciplines.length > 0) {
      await tx
        .update(userDisciplines)
        .set({ userId: mergeRow.sourceUserId })
        .where(
          and(
            eq(userDisciplines.userId, mergeRow.targetUserId),
            sql`${userDisciplines.disciplineId} = ANY(${repointedRows.user_disciplines})`
          )
        );
    }
    if (repointedRows.user_skills.length > 0) {
      await tx
        .update(userSkills)
        .set({ userId: mergeRow.sourceUserId })
        .where(
          and(
            eq(userSkills.userId, mergeRow.targetUserId),
            sql`${userSkills.skillId} = ANY(${repointedRows.user_skills})`
          )
        );
    }
    if (repointedRows.user_languages.length > 0) {
      await tx
        .update(userLanguages)
        .set({ userId: mergeRow.sourceUserId })
        .where(
          and(
            eq(userLanguages.userId, mergeRow.targetUserId),
            sql`${userLanguages.languageId} = ANY(${repointedRows.user_languages})`
          )
        );
    }
    if (repointedRows.user_engagement_types.length > 0) {
      await tx
        .update(userEngagementTypes)
        .set({ userId: mergeRow.sourceUserId })
        .where(
          and(
            eq(userEngagementTypes.userId, mergeRow.targetUserId),
            sql`${userEngagementTypes.engagementTypeId} = ANY(${repointedRows.user_engagement_types})`
          )
        );
    }

    // 2. Re-insert conflict-deleted rows back onto source.
    for (const c of conflicts) {
      switch (c.table) {
        case "user_organizations":
          await tx.insert(userOrganizations).values(c.snapshot as never);
          break;
        case "group_memberships":
          await tx.insert(groupMemberships).values(c.snapshot as never);
          break;
        case "event_committee_assignments":
          await tx.insert(eventCommitteeAssignments).values(c.snapshot as never);
          break;
        case "user_disciplines":
          await tx.insert(userDisciplines).values(c.snapshot as never);
          break;
        case "user_skills":
          await tx.insert(userSkills).values(c.snapshot as never);
          break;
        case "user_languages":
          await tx.insert(userLanguages).values(c.snapshot as never);
          break;
        case "user_engagement_types":
          await tx.insert(userEngagementTypes).values(c.snapshot as never);
          break;
      }
    }

    // 3. Restore promoted fields on target.
    if (Object.keys(promotedFields).length > 0) {
      const restoreUpdates: Record<string, unknown> = { updatedAt: new Date() };
      for (const [k, v] of Object.entries(promotedFields)) {
        restoreUpdates[k] = v;
      }
      await tx
        .update(profiles)
        .set(restoreUpdates)
        .where(eq(profiles.userId, mergeRow.targetUserId));
    }

    // 4. Clear merged_into on the source user.
    await tx
      .update(users)
      .set({ mergedIntoUserId: null, updatedAt: new Date() })
      .where(eq(users.id, mergeRow.sourceUserId));

    // 5. Mark the merge_history row as reverted.
    await tx
      .update(userMerges)
      .set({
        revertedAt: new Date(),
        revertedByUserId: req.revertedByUserId,
      })
      .where(eq(userMerges.id, req.mergeId));
  });

  return { mergeId: req.mergeId };
}
```

- [ ] **Step 2: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/lib/admin/userMerge.ts
git commit -m "feat(api): user unmerge transaction"
```

---

## Task 8: API route — list users + duplicates

**Files:**
- Create: `packages/api/src/routes/admin/users/index.ts`
- Modify: `packages/api/src/routes/admin/index.ts` (mount the new sub-app)

- [ ] **Step 1: Build the list handler.**

`packages/api/src/routes/admin/users/index.ts`:

```ts
import { Hono } from "hono";
import { and, asc, desc, eq, ilike, isNull, isNotNull, or, sql } from "drizzle-orm";
import { createDb } from "../../../db";
import {
  organizations,
  profiles,
  userOrganizations,
  users,
} from "../../../db/schema";
import { canEditMembers, canMergeUsers } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import { buildAndScorePairs, type CandidateUser } from "../../../lib/admin/duplicateDetection";
import type { AppEnv } from "../../../types";

export const adminUsersRoute = new Hono<AppEnv>();

adminUsersRoute.use("*", requirePolicy(canEditMembers, () => undefined));

/**
 * GET /api/admin/users
 *
 * Cursor-paginated list. Filters: role, status (active|merged|deleted),
 * hasProfile, search query (matches displayName, email, memberId).
 */
adminUsersRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const q = c.req.query("q") ?? "";
  const role = c.req.query("role");
  const status = c.req.query("status") ?? "active";
  const hasProfile = c.req.query("hasProfile");
  const cursor = c.req.query("cursor");
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") ?? "50", 10) || 50, 1),
    200
  );

  const conditions = [] as ReturnType<typeof eq>[];

  if (status === "active") {
    conditions.push(isNull(users.deletedAt));
    conditions.push(isNull(users.mergedIntoUserId));
  } else if (status === "merged") {
    conditions.push(isNotNull(users.mergedIntoUserId));
  } else if (status === "deleted") {
    conditions.push(isNotNull(users.deletedAt));
  }

  if (role && (role === "member" || role === "staff" || role === "super_admin")) {
    conditions.push(eq(users.role, role));
  }
  if (hasProfile === "true") {
    conditions.push(isNotNull(profiles.id));
  } else if (hasProfile === "false") {
    conditions.push(isNull(profiles.id));
  }
  if (q.trim()) {
    const needle = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(profiles.displayName, needle),
        ilike(users.email, needle),
        ilike(users.memberId, needle)
      )!
    );
  }
  if (cursor) {
    // Cursor is the last user's id; we paginate alphabetically by id for
    // a stable order.
    conditions.push(sql`${users.id} > ${cursor}`);
  }

  const rows = await db
    .select({
      id: users.id,
      memberId: users.memberId,
      email: users.email,
      role: users.role,
      mergedIntoUserId: users.mergedIntoUserId,
      deletedAt: users.deletedAt,
      isLegacyImport: users.isLegacyImport,
      createdAt: users.createdAt,
      displayName: profiles.displayName,
      photoUrl: profiles.photoUrl,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(users.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return c.json({
    ok: true,
    rows: page.map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      deletedAt: r.deletedAt instanceof Date ? r.deletedAt.toISOString() : r.deletedAt,
    })),
    nextCursor,
  });
});

/**
 * GET /api/admin/users/duplicates
 *
 * Computes on-demand. Loads all active users + their identity-relevant
 * fields, runs anchor-driven discovery + multi-signal scoring, returns
 * top 100 scored pairs.
 *
 * super_admin only — canMergeUsers gate.
 */
adminUsersRoute.get(
  "/duplicates",
  requirePolicy(canMergeUsers, () => undefined),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);

    // Fetch every active user with the fields the scorer needs. Primary
    // org via the user_organizations + primary flag join.
    const baseRows = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        displayName: profiles.displayName,
        orcid: profiles.orcid,
        githubUrl: profiles.githubUrl,
        linkedinUrl: profiles.linkedinUrl,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(
        and(
          isNull(users.deletedAt),
          isNull(users.mergedIntoUserId)
        )
      );

    // Pull each user's primary org id in one query.
    const primaryRows = await db
      .select({
        userId: userOrganizations.userId,
        organizationId: userOrganizations.organizationId,
      })
      .from(userOrganizations)
      .where(eq(userOrganizations.isPrimary, true));
    const primaryByUser = new Map<string, string>();
    for (const r of primaryRows) primaryByUser.set(r.userId, r.organizationId);

    // groupIds — empty for now; the group subsystem isn't shipped yet.
    // The scorer treats an empty set as "no overlap signal."
    const candidates: CandidateUser[] = baseRows.map((r) => ({
      id: r.id,
      displayName: r.displayName,
      email: r.email,
      orcid: r.orcid,
      githubUrl: r.githubUrl,
      linkedinUrl: r.linkedinUrl,
      primaryOrgId: primaryByUser.get(r.id) ?? null,
      signedUpAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt as unknown as string),
      groupIds: new Set(),
    }));

    const pairs = buildAndScorePairs(candidates, { limit: 100 });

    // Hydrate compact card payloads with org name + photo.
    const userIdsInPairs = new Set<string>();
    for (const p of pairs) {
      userIdsInPairs.add(p.a.id);
      userIdsInPairs.add(p.b.id);
    }
    const orgIds = new Set<string>();
    for (const u of candidates) {
      if (userIdsInPairs.has(u.id) && u.primaryOrgId) orgIds.add(u.primaryOrgId);
    }
    const orgRows = orgIds.size > 0
      ? await db.select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(sql`${organizations.id} = ANY(${[...orgIds]})`)
      : [];
    const orgNameById = new Map(orgRows.map((o) => [o.id, o.name] as const));

    const photoByUser = new Map<string, string | null>();
    for (const r of baseRows) {
      photoByUser.set(r.id, null); // photo fetched separately below
    }
    const photoRows = userIdsInPairs.size > 0
      ? await db.select({ userId: profiles.userId, photoUrl: profiles.photoUrl })
          .from(profiles)
          .where(sql`${profiles.userId} = ANY(${[...userIdsInPairs]})`)
      : [];
    for (const r of photoRows) photoByUser.set(r.userId, r.photoUrl);

    return c.json({
      ok: true,
      pairs: pairs.map((p) => ({
        score: p.score,
        tier: p.tier,
        signals: p.signals,
        users: [
          {
            id: p.a.id,
            displayName: p.a.displayName,
            email: p.a.email,
            orcid: p.a.orcid,
            githubUrl: p.a.githubUrl,
            linkedinUrl: p.a.linkedinUrl,
            photoUrl: photoByUser.get(p.a.id) ?? null,
            primaryOrgId: p.a.primaryOrgId,
            primaryOrgName: p.a.primaryOrgId ? orgNameById.get(p.a.primaryOrgId) ?? null : null,
            signedUpAt: p.a.signedUpAt.toISOString(),
          },
          {
            id: p.b.id,
            displayName: p.b.displayName,
            email: p.b.email,
            orcid: p.b.orcid,
            githubUrl: p.b.githubUrl,
            linkedinUrl: p.b.linkedinUrl,
            photoUrl: photoByUser.get(p.b.id) ?? null,
            primaryOrgId: p.b.primaryOrgId,
            primaryOrgName: p.b.primaryOrgId ? orgNameById.get(p.b.primaryOrgId) ?? null : null,
            signedUpAt: p.b.signedUpAt.toISOString(),
          },
        ],
      })),
    });
  }
);
```

- [ ] **Step 2: Mount the sub-app.**

Edit `packages/api/src/routes/admin/index.ts`. Add the import:

```ts
import { adminUsersRoute } from "./users";
```

Mount after the existing `/audit` route:

```ts
adminApi.route("/users", adminUsersRoute);
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin
git commit -m "feat(api): /admin/users list + /duplicates endpoints"
```

---

## Task 9: API route — user detail + PATCH

**Files:**
- Create: `packages/api/src/routes/admin/users/byId.ts`
- Modify: `packages/api/src/routes/admin/users/index.ts` (mount the byId sub-router)

- [ ] **Step 1: Write `byId.ts` with GET + PATCH.**

`packages/api/src/routes/admin/users/byId.ts`:

```ts
import { Hono } from "hono";
import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../../../db";
import {
  auditLog,
  organizations,
  profiles,
  userMerges,
  userOrganizations,
  users,
} from "../../../db/schema";
import {
  canEditMembers,
  canPromoteToRole,
} from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import type { AppEnv } from "../../../types";

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

const userPatchSchema = z
  .object({
    displayName: z.string().min(1).max(100).optional(),
    headline: z.string().max(140).nullable().optional(),
    bio: z.string().max(5000).nullable().optional(),
    photoUrl: z.url().max(500).nullable().optional(),
    jobTitle: z.string().max(100).nullable().optional(),
    githubUrl: z.url().max(200).nullable().optional(),
    linkedinUrl: z.url().max(200).nullable().optional(),
    orcid: z.string().regex(ORCID_PATTERN).nullable().optional(),
    websiteUrl: z.url().max(200).nullable().optional(),
    pronounId: z.uuid().nullable().optional(),
    careerStageId: z.uuid().nullable().optional(),
    countryId: z.uuid().nullable().optional(),
    region: z.string().max(100).nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    publicLocation: z.string().max(140).nullable().optional(),
    role: z.enum(["member", "staff", "super_admin"]).optional(),
  })
  .strict();

type UserPatchInput = z.infer<typeof userPatchSchema>;

export const adminUsersByIdRoute = new Hono<AppEnv>();

/**
 * GET /api/admin/users/:id
 */
adminUsersByIdRoute.get("/", async (c) => {
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!userRow) return c.json({ ok: false, error: "not_found" }, 404);

  const profileRow = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  // Affiliations summary.
  const affiliations = await db
    .select({
      id: userOrganizations.id,
      organizationId: organizations.id,
      organizationName: organizations.name,
      isPrimary: userOrganizations.isPrimary,
      role: userOrganizations.role,
    })
    .from(userOrganizations)
    .innerJoin(organizations, eq(organizations.id, userOrganizations.organizationId))
    .where(eq(userOrganizations.userId, id))
    .orderBy(desc(userOrganizations.isPrimary), organizations.name);

  // Source merges into this user (this user is target).
  const inboundMerges = await db
    .select({
      id: userMerges.id,
      sourceUserId: userMerges.sourceUserId,
      mergedByUserId: userMerges.mergedByUserId,
      createdAt: userMerges.createdAt,
      revertedAt: userMerges.revertedAt,
      reason: userMerges.reason,
    })
    .from(userMerges)
    .where(eq(userMerges.targetUserId, id))
    .orderBy(desc(userMerges.createdAt));

  // Outbound merge if this user is a source.
  const outboundMerge = userRow.mergedIntoUserId
    ? await db
        .select()
        .from(userMerges)
        .where(and(eq(userMerges.sourceUserId, id), eq(userMerges.targetUserId, userRow.mergedIntoUserId)))
        .orderBy(desc(userMerges.createdAt))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  // Recent audit (last 20 rows touching this user).
  const recentAudit = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorRole: auditLog.actorRole,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(or(eq(auditLog.actorId, id), eq(auditLog.targetId, id))!)
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  return c.json({
    ok: true,
    user: {
      ...userRow,
      createdAt: userRow.createdAt instanceof Date ? userRow.createdAt.toISOString() : userRow.createdAt,
      updatedAt: userRow.updatedAt instanceof Date ? userRow.updatedAt.toISOString() : userRow.updatedAt,
      deletedAt: userRow.deletedAt instanceof Date ? userRow.deletedAt.toISOString() : userRow.deletedAt,
    },
    profile: profileRow,
    affiliations,
    merges: { inbound: inboundMerges, outbound: outboundMerge },
    recentAudit: recentAudit.map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
  });
});

/**
 * PATCH /api/admin/users/:id
 */
adminUsersByIdRoute.patch(
  "/",
  zValidator("json", userPatchSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        ok: false, error: "invalid_input",
        issues: result.error.issues.map((i) => ({ path: i.path, message: i.message })),
      }, 400);
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const input = c.req.valid("json") as UserPatchInput;
    const actor = c.get("actor")!;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

    // Role gating
    if (input.role && input.role !== existing.role) {
      if (!canPromoteToRole(actor, { newRole: input.role })) {
        return c.json({
          ok: false, error: "forbidden",
          message: "You cannot grant that role.",
        }, 403);
      }
      // Demotion FROM super_admin requires super_admin.
      if (existing.role === "super_admin" && actor.systemTier < 2) {
        return c.json({
          ok: false, error: "forbidden",
          message: "Demoting a super_admin requires super_admin.",
        }, 403);
      }
    }

    c.var.auditCapture?.({ user: existing });

    // Split into profile vs user fields.
    const { role, ...profileFields } = input;

    if (Object.keys(profileFields).length > 0) {
      const existingProfile = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, id))
        .limit(1);
      if (existingProfile[0]) {
        await db
          .update(profiles)
          .set({ ...profileFields, updatedAt: new Date() })
          .where(eq(profiles.userId, id));
      } else if (input.displayName) {
        // Build slug + insert profile if it doesn't exist.
        const { buildProfileSlug } = await import("../../../lib/member-id");
        await db.insert(profiles).values({
          userId: id,
          slug: buildProfileSlug(input.displayName, existing.memberId),
          displayName: input.displayName,
          ...profileFields,
        });
      }
    }

    if (role && role !== existing.role) {
      await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id));
    }

    c.var.auditAction = "users.update";
    c.var.auditTarget = { type: "users", id };

    return c.json({ ok: true });
  }
);
```

- [ ] **Step 2: Mount the sub-router on `/users`.**

Edit `packages/api/src/routes/admin/users/index.ts`. After the GET handlers, add at the bottom:

```ts
import { adminUsersByIdRoute } from "./byId";

adminUsersRoute.route("/:id", adminUsersByIdRoute);
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin
git commit -m "feat(api): admin user detail + PATCH with role gate"
```

---

## Task 10: API routes — soft-delete + restore + merge + unmerge

**Files:**
- Modify: `packages/api/src/routes/admin/users/byId.ts`

- [ ] **Step 1: Append the four endpoints.**

Add to the bottom of `byId.ts`:

```ts
import { canMergeUsers } from "../../../lib/policies";
import {
  buildMergeSnapshot,
  executeMerge,
  executeUnmerge,
  PROMOTABLE_PROFILE_FIELDS,
  validateMerge,
  type PromotableField,
} from "../../../lib/admin/userMerge";

adminUsersByIdRoute.post("/soft-delete", async (c) => {
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

  c.var.auditCapture?.({ user: existing });

  if (existing.deletedAt === null) {
    await db.update(users).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
  }
  c.var.auditAction = "users.soft_delete";
  c.var.auditTarget = { type: "users", id };
  return c.json({ ok: true });
});

adminUsersByIdRoute.post("/restore", async (c) => {
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

  c.var.auditCapture?.({ user: existing });

  if (existing.deletedAt !== null) {
    await db.update(users).set({ deletedAt: null, updatedAt: new Date() }).where(eq(users.id, id));
  }
  c.var.auditAction = "users.restore";
  c.var.auditTarget = { type: "users", id };
  return c.json({ ok: true });
});

const mergeBodySchema = z.object({
  targetUserId: z.uuid(),
  promotedFields: z.array(z.enum(PROMOTABLE_PROFILE_FIELDS as unknown as readonly [PromotableField, ...PromotableField[]])).default([]),
  reason: z.string().max(280).optional(),
});

adminUsersByIdRoute.post(
  "/merge",
  requirePolicy(canMergeUsers, () => undefined),
  zValidator("json", mergeBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: "invalid_input", issues: result.error.issues }, 400);
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return c.json({ ok: false, error: "invalid_input" }, 400);
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const actor = c.get("actor")!;
    const body = c.req.valid("json");

    const req = {
      sourceUserId: id,
      targetUserId: body.targetUserId,
      mergedByUserId: actor.user.id,
      promotedFields: body.promotedFields,
      reason: body.reason,
    };

    const err = await validateMerge(db, req);
    if (err) return c.json({ ok: false, error: err.error, message: err.message }, err.status);

    const snapshot = await buildMergeSnapshot(db, req);
    c.var.auditCapture?.({ source: snapshot.source, target: snapshot.target });

    const result = await executeMerge(db, snapshot, req);

    c.var.auditAction = "users.merge";
    c.var.auditTarget = { type: "users", id: req.targetUserId };
    c.var.auditPayload = {
      mergeId: result.mergeId,
      sourceUserId: req.sourceUserId,
      targetUserId: req.targetUserId,
      promotedFieldCount: req.promotedFields.length,
      conflictCount: result.conflicts.length,
      reason: req.reason ?? null,
    };

    return c.json({ ok: true, mergeId: result.mergeId });
  }
);

const unmergeBodySchema = z.object({
  mergeId: z.uuid(),
});

adminUsersByIdRoute.post(
  "/unmerge",
  requirePolicy(canMergeUsers, () => undefined),
  zValidator("json", unmergeBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: "invalid_input", issues: result.error.issues }, 400);
    }
  }),
  async (c) => {
    if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const actor = c.get("actor")!;
    const body = c.req.valid("json");

    const result = await executeUnmerge(db, {
      mergeId: body.mergeId,
      revertedByUserId: actor.user.id,
    });
    if ("error" in result) {
      return c.json({ ok: false, error: result.error, message: result.message }, result.status);
    }

    c.var.auditAction = "users.unmerge";
    c.var.auditTarget = { type: "user_merges", id: result.mergeId };
    c.var.auditPayload = { mergeId: result.mergeId };

    return c.json({ ok: true, mergeId: result.mergeId });
  }
);
```

- [ ] **Step 2: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add packages/api/src/routes/admin
git commit -m "feat(api): soft-delete + restore + merge + unmerge endpoints"
```

---

## Task 11: Frontend shared components — EditorialInput, EditorialTextarea, RoleTag

**Files:**
- Create: `apps/admin/src/components/EditorialInput.tsx`
- Create: `apps/admin/src/components/EditorialTextarea.tsx`
- Create: `apps/admin/src/components/RoleTag.tsx`
- Create: `apps/admin/src/components/StatusTag.tsx`

- [ ] **Step 1: Write the editorial form controls.**

`apps/admin/src/components/EditorialInput.tsx`:

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";

export interface EditorialInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | null;
}

export const EditorialInput = forwardRef<HTMLInputElement, EditorialInputProps>(
  function EditorialInput({ label, hint, error, className, ...rest }, ref) {
    return (
      <label className="block">
        <span className="admin-classification block mb-2">{label}</span>
        <input
          ref={ref}
          className="w-full bg-transparent border-0 py-1.5 outline-none transition-colors"
          style={{
            borderBottom: "1px solid var(--admin-rule)",
            color: "var(--admin-ink)",
            fontSize: "15px",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderBottomColor = "var(--admin-ribbon)";
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = "var(--admin-rule)";
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {hint && !error && (
          <span className="block mt-1.5 text-[11px]" style={{ color: "var(--admin-marginalia)" }}>
            {hint}
          </span>
        )}
        {error && (
          <span className="block mt-1.5 text-[11px]" style={{ color: "var(--color-danger-700)" }}>
            {error}
          </span>
        )}
      </label>
    );
  }
);
```

`apps/admin/src/components/EditorialTextarea.tsx`:

```tsx
import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface EditorialTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string | null;
}

export const EditorialTextarea = forwardRef<HTMLTextAreaElement, EditorialTextareaProps>(
  function EditorialTextarea({ label, hint, error, className, rows = 4, ...rest }, ref) {
    return (
      <label className="block">
        <span className="admin-classification block mb-2">{label}</span>
        <textarea
          ref={ref}
          rows={rows}
          className="w-full bg-transparent border-0 py-2 outline-none resize-vertical leading-[1.6]"
          style={{
            borderBottom: "1px solid var(--admin-rule)",
            color: "var(--admin-ink)",
            fontSize: "15px",
            minHeight: "5rem",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderBottomColor = "var(--admin-ribbon)";
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = "var(--admin-rule)";
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {hint && !error && (
          <span className="block mt-1.5 text-[11px]" style={{ color: "var(--admin-marginalia)" }}>
            {hint}
          </span>
        )}
        {error && (
          <span className="block mt-1.5 text-[11px]" style={{ color: "var(--color-danger-700)" }}>
            {error}
          </span>
        )}
      </label>
    );
  }
);
```

`apps/admin/src/components/RoleTag.tsx`:

```tsx
export function RoleTag({ role }: { role: "member" | "staff" | "super_admin" | "admin" }) {
  if (role === "super_admin") {
    return (
      <span className="admin-classification" style={{ color: "var(--admin-ribbon)" }}>
        Super admin
      </span>
    );
  }
  if (role === "staff" || role === "admin") {
    return (
      <span className="admin-classification" style={{ color: "var(--admin-mark)" }}>
        Staff
      </span>
    );
  }
  return <span className="admin-classification">Member</span>;
}
```

`apps/admin/src/components/StatusTag.tsx`:

```tsx
interface StatusTagProps {
  deletedAt?: string | null;
  mergedIntoUserId?: string | null;
  isLegacyImport?: boolean;
}

export function StatusTag({ deletedAt, mergedIntoUserId, isLegacyImport }: StatusTagProps) {
  if (deletedAt) {
    return (
      <span className="admin-classification" style={{ color: "var(--color-danger-700)", textDecoration: "line-through" }}>
        Deleted
      </span>
    );
  }
  if (mergedIntoUserId) {
    return (
      <span className="admin-classification italic" style={{ color: "var(--admin-marginalia)" }}>
        Merged
      </span>
    );
  }
  if (isLegacyImport) {
    return (
      <span className="admin-classification italic" style={{ color: "var(--admin-marginalia)" }}>
        Legacy
      </span>
    );
  }
  return null;
}
```

- [ ] **Step 2: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add apps/admin/src/components
git commit -m "feat(admin): editorial form + tag components"
```

---

## Task 12: Members list page

**Files:**
- Create: `apps/admin/src/pages/members/MembersListPage.tsx`
- Modify: `apps/admin/src/App.tsx` (route + remove the Members ComingSoon stub)

- [ ] **Step 1: Build the page.**

`apps/admin/src/pages/members/MembersListPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { RoleTag } from "../../components/RoleTag";
import { StatusTag } from "../../components/StatusTag";

interface MemberRow {
  id: string;
  memberId: string;
  email: string;
  role: "member" | "staff" | "super_admin" | "admin";
  mergedIntoUserId: string | null;
  deletedAt: string | null;
  isLegacyImport: boolean;
  createdAt: string;
  displayName: string | null;
  photoUrl: string | null;
}

type StatusFilter = "active" | "merged" | "deleted";
type RoleFilter = "" | "member" | "staff" | "super_admin";

export function MembersListPage() {
  const apiFetch = useApi();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = params.get("q") ?? "";
  const status = (params.get("status") ?? "active") as StatusFilter;
  const role = (params.get("role") ?? "") as RoleFilter;

  const load = useCallback(async (nextCursor: string | null) => {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams({ limit: "50", status });
    if (q) sp.set("q", q);
    if (role) sp.set("role", role);
    if (nextCursor) sp.set("cursor", nextCursor);
    try {
      const res = await apiFetch(`/admin/users?${sp}`);
      if (!res.ok) { setError(`/admin/users responded ${res.status}`); return; }
      const body = (await res.json()) as { ok: true; rows: MemberRow[]; nextCursor: string | null };
      setRows((prev) => (nextCursor ? [...prev, ...body.rows] : body.rows));
      setCursor(body.nextCursor);
      setHasMore(Boolean(body.nextCursor));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, [apiFetch, q, role, status]);

  useEffect(() => { void load(null); }, [load]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value); else next.delete(name);
    setParams(next, { replace: true });
  }

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-8">US-RSE · Admin · Register I</p>
      <div className="flex items-baseline justify-between gap-6 mb-6">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          Members.
        </h2>
        <Link to="/members/duplicates" className="admin-classification" style={{ color: "var(--admin-ribbon)" }}>
          Find duplicates →
        </Link>
      </div>

      <div className="flex items-baseline gap-6 mb-6">
        <input
          type="text"
          placeholder="Search displayName, email, member id…"
          value={q}
          onChange={(e) => setParam("q", e.target.value)}
          className="font-mono text-xs px-3 py-1.5 flex-1 max-w-md"
          style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)", outline: "none" }}
        />
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="active">Active</option>
          <option value="merged">Merged</option>
          <option value="deleted">Deleted</option>
        </select>
        <select
          value={role}
          onChange={(e) => setParam("role", e.target.value)}
          className="admin-classification bg-transparent border-0 outline-none"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="">All roles</option>
          <option value="member">Member</option>
          <option value="staff">Staff</option>
          <option value="super_admin">Super admin</option>
        </select>
      </div>

      {error && <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>{error}</p>}

      <div style={{ borderTop: "1px solid var(--admin-ink)" }}>
        {rows.map((r, i) => (
          <Link
            key={r.id}
            to={`/members/${r.id}`}
            className="grid grid-cols-[3rem_8rem_1fr_1fr_8rem_auto] gap-6 items-baseline py-3 text-[14px] transition-colors hover:bg-[var(--admin-paper-edge)]"
            style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}
          >
            <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            <span className="font-mono text-[11px] admin-marginalia tabular-nums">
              {r.memberId}
            </span>
            <span style={{ color: "var(--admin-ink)" }}>
              {r.displayName ?? <em style={{ color: "var(--admin-marginalia)" }}>no name</em>}{" "}
              <StatusTag deletedAt={r.deletedAt} mergedIntoUserId={r.mergedIntoUserId} isLegacyImport={r.isLegacyImport} />
            </span>
            <span className="font-mono text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
              {r.email}
            </span>
            <RoleTag role={r.role} />
            <span className="admin-marginalia text-right whitespace-nowrap">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </Link>
        ))}
        {rows.length === 0 && !loading && (
          <p className="py-6 text-center italic" style={{ color: "var(--admin-marginalia)" }}>No entries found.</p>
        )}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void load(cursor)}
            disabled={loading}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--admin-ribbon)" }}
          >
            {loading ? "Loading…" : "Load more entries →"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire the route + remove the stub.**

In `apps/admin/src/App.tsx`:

```tsx
import { MembersListPage } from "./pages/members/MembersListPage";
```

Replace `<Route path="members" element={<ComingSoon ... />} />` with:

```tsx
<Route path="members" element={<MembersListPage />} />
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add apps/admin/src
git commit -m "feat(admin): members register list page"
```

---

## Task 13: Member detail page

**Files:**
- Create: `apps/admin/src/pages/members/MemberDetailPage.tsx`
- Modify: `apps/admin/src/App.tsx` (add `:id` route)

- [ ] **Step 1: Build the detail page.**

`apps/admin/src/pages/members/MemberDetailPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";
import { RoleTag } from "../../components/RoleTag";
import { StatusTag } from "../../components/StatusTag";

interface DetailResponse {
  ok: true;
  user: {
    id: string;
    memberId: string;
    email: string;
    role: "member" | "staff" | "super_admin" | "admin";
    mergedIntoUserId: string | null;
    deletedAt: string | null;
    isLegacyImport: boolean;
    createdAt: string;
  };
  profile: {
    id: string;
    displayName: string;
    headline: string | null;
    bio: string | null;
    photoUrl: string | null;
    jobTitle: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    orcid: string | null;
    websiteUrl: string | null;
  } | null;
  affiliations: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    isPrimary: boolean;
    role: string | null;
  }>;
  merges: {
    inbound: Array<{ id: string; sourceUserId: string; createdAt: string; revertedAt: string | null; reason: string | null }>;
    outbound: { id: string; targetUserId: string; createdAt: string } | null;
  };
  recentAudit: Array<{
    id: string;
    actorId: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }>;
}

type Tab = "identity" | "affiliations" | "status" | "audit";

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const actor = useShellActor();
  const apiFetch = useApi();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/users/${id}`);
      if (!res.ok) { setError(`/admin/users/${id} responded ${res.status}`); return; }
      const body = (await res.json()) as DetailResponse;
      setData(body);
      setDraft({
        displayName: body.profile?.displayName ?? "",
        headline: body.profile?.headline ?? "",
        bio: body.profile?.bio ?? "",
        jobTitle: body.profile?.jobTitle ?? "",
        githubUrl: body.profile?.githubUrl ?? "",
        linkedinUrl: body.profile?.linkedinUrl ?? "",
        orcid: body.profile?.orcid ?? "",
        websiteUrl: body.profile?.websiteUrl ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => { void fetchUser(); }, [fetchUser]);

  async function saveIdentity() {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, string | null> = {};
      for (const k of ["displayName", "headline", "bio", "jobTitle", "githubUrl", "linkedinUrl", "orcid", "websiteUrl"] as const) {
        body[k] = draft[k]?.trim() === "" ? null : draft[k];
      }
      const res = await apiFetch(`/admin/users/${data.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setSaveError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await fetchUser();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  async function setRole(newRole: "member" | "staff" | "super_admin") {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiFetch(`/admin/users/${data.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setSaveError(err?.message ?? `PATCH responded ${res.status}`);
        return;
      }
      await fetchUser();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  async function toggleSoftDelete(deleted: boolean) {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const url = `/admin/users/${data.user.id}/${deleted ? "soft-delete" : "restore"}`;
      const res = await apiFetch(url, { method: "POST" });
      if (!res.ok) {
        setSaveError(`POST ${url} responded ${res.status}`);
        return;
      }
      await fetchUser();
    } finally { setSaving(false); }
  }

  async function unmerge(mergeId: string) {
    if (!data) return;
    if (!window.confirm("Unmerge this user?")) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiFetch(`/admin/users/${data.user.id}/unmerge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mergeId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setSaveError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      await fetchUser();
    } finally { setSaving(false); }
  }

  if (error) return <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>{error}</p>;
  if (!data) return <p className="admin-marginalia">Loading…</p>;

  const canEditRole = actor.systemTier >= 1;
  const canPromoteToSuperAdmin = actor.systemTier >= 2;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">
        US-RSE · Admin · Member · {data.user.memberId}
      </p>
      <div className="flex items-baseline justify-between gap-6 mb-2">
        <h2 className="admin-display" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
          {data.profile?.displayName ?? <em style={{ color: "var(--admin-marginalia)" }}>No display name</em>}
        </h2>
      </div>
      <div className="flex items-center gap-4 mb-10">
        <RoleTag role={data.user.role} />
        <StatusTag
          deletedAt={data.user.deletedAt}
          mergedIntoUserId={data.user.mergedIntoUserId}
          isLegacyImport={data.user.isLegacyImport}
        />
      </div>

      <nav className="flex items-baseline gap-8 mb-8" style={{ borderBottom: "1px solid var(--admin-rule)" }}>
        {(["identity", "affiliations", "status", "audit"] as Tab[]).map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="pb-3 admin-classification transition-colors"
            style={{
              color: tab === t ? "var(--admin-ribbon)" : "var(--admin-ink-medium)",
              borderBottom: tab === t ? "2px solid var(--admin-ribbon)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            <span className="tabular-nums mr-2">{["I", "II", "III", "IV"][i]}</span>
            <span>{t === "identity" ? "Identity" : t === "affiliations" ? "Affiliations" : t === "status" ? "Status" : "Audit"}</span>
          </button>
        ))}
      </nav>

      {saveError && (
        <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>{saveError}</p>
      )}

      {tab === "identity" && (
        <div className="space-y-6 max-w-2xl">
          <EditorialInput
            label="Display name"
            value={draft.displayName ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
          />
          <EditorialInput
            label="Email"
            value={data.user.email}
            readOnly
            hint="Managed by WorkOS"
            style={{ color: "var(--admin-ink-medium)" }}
          />
          <EditorialInput
            label="Job title"
            value={draft.jobTitle ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, jobTitle: e.target.value }))}
          />
          <EditorialInput
            label="Headline"
            value={draft.headline ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
          />
          <EditorialTextarea
            label="Bio"
            value={draft.bio ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
            rows={6}
          />
          <EditorialInput
            label="ORCID"
            value={draft.orcid ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, orcid: e.target.value }))}
            hint="0000-0000-0000-000X"
          />
          <EditorialInput
            label="GitHub URL"
            value={draft.githubUrl ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, githubUrl: e.target.value }))}
          />
          <EditorialInput
            label="LinkedIn URL"
            value={draft.linkedinUrl ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, linkedinUrl: e.target.value }))}
          />
          <EditorialInput
            label="Website URL"
            value={draft.websiteUrl ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, websiteUrl: e.target.value }))}
          />

          {canEditRole && (
            <div>
              <p className="admin-classification block mb-2">Role</p>
              <select
                value={data.user.role === "admin" ? "staff" : data.user.role}
                onChange={(e) => void setRole(e.target.value as "member" | "staff" | "super_admin")}
                className="bg-transparent border-0 outline-none py-1.5"
                style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)", fontSize: "15px" }}
                disabled={saving}
              >
                <option value="member">Member</option>
                <option value="staff">Staff</option>
                <option value="super_admin" disabled={!canPromoteToSuperAdmin}>
                  Super admin
                </option>
              </select>
            </div>
          )}

          <div className="pt-4">
            <button
              type="button"
              onClick={() => void saveIdentity()}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 disabled:opacity-50"
              style={{ background: "var(--admin-ink)", color: "var(--admin-paper)", fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              {saving ? "Saving…" : "Save identity"}
            </button>
          </div>
        </div>
      )}

      {tab === "affiliations" && (
        <div>
          {data.affiliations.length === 0 ? (
            <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No affiliations on file.</p>
          ) : (
            <ul style={{ borderTop: "1px solid var(--admin-rule)" }}>
              {data.affiliations.map((a) => (
                <li key={a.id} className="py-3 grid grid-cols-[1fr_8rem_8rem] gap-6 items-baseline" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                  <span style={{ color: "var(--admin-ink)" }}>{a.organizationName}</span>
                  <span className="admin-marginalia">{a.role ?? "—"}</span>
                  <span className="admin-marginalia">{a.isPrimary ? "Primary" : "Secondary"}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-[13px]" style={{ color: "var(--admin-marginalia)" }}>
            Edit affiliations from the member's dossier on the public site.
          </p>
        </div>
      )}

      {tab === "status" && (
        <div className="space-y-8">
          <div>
            <p className="admin-classification mb-3">Lifecycle</p>
            {data.user.deletedAt ? (
              <div className="flex items-center gap-4">
                <p className="text-[14px]" style={{ color: "var(--admin-ink-medium)" }}>
                  Soft-deleted at {new Date(data.user.deletedAt).toLocaleString()}.
                </p>
                <button
                  type="button"
                  onClick={() => void toggleSoftDelete(false)}
                  disabled={saving}
                  className="admin-classification disabled:opacity-50"
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  Restore
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void toggleSoftDelete(true)}
                disabled={saving}
                className="admin-classification disabled:opacity-50"
                style={{ color: "var(--color-danger-700)" }}
              >
                Soft-delete this member
              </button>
            )}
          </div>

          {data.merges.outbound && (
            <div>
              <p className="admin-classification mb-3">Merged into</p>
              <p className="text-[14px]" style={{ color: "var(--admin-ink-medium)" }}>
                Folded into <Link to={`/members/${data.merges.outbound.targetUserId}`} style={{ color: "var(--admin-ribbon)" }}>{data.merges.outbound.targetUserId.slice(0, 8)}…</Link> on {new Date(data.merges.outbound.createdAt).toLocaleString()}.
              </p>
            </div>
          )}

          {data.merges.inbound.length > 0 && (
            <div>
              <p className="admin-classification mb-3">Folded-in sources</p>
              <ul style={{ borderTop: "1px solid var(--admin-rule)" }}>
                {data.merges.inbound.map((m) => (
                  <li key={m.id} className="py-3 flex items-baseline justify-between" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                    <span className="font-mono text-[13px]" style={{ color: "var(--admin-ink-medium)" }}>
                      {m.sourceUserId.slice(0, 8)}… · {new Date(m.createdAt).toLocaleString()}
                      {m.reason && <span className="admin-marginalia ml-3">{m.reason}</span>}
                      {m.revertedAt && <span className="admin-marginalia ml-3 italic">reverted</span>}
                    </span>
                    {!m.revertedAt && actor.systemTier >= 2 && (
                      <button
                        type="button"
                        onClick={() => void unmerge(m.id)}
                        disabled={saving}
                        className="admin-classification disabled:opacity-50"
                        style={{ color: "var(--admin-ribbon)" }}
                      >
                        Unmerge →
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div>
          {data.recentAudit.length === 0 ? (
            <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No audit entries.</p>
          ) : (
            <ol style={{ borderTop: "1px solid var(--admin-ink)" }}>
              {data.recentAudit.map((a, i) => (
                <li key={a.id} className="py-3 grid grid-cols-[3rem_minmax(8rem,auto)_minmax(0,1fr)_minmax(7rem,auto)] gap-6 items-baseline text-[13px]" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                  <span className="admin-marginalia tabular-nums">{String(i + 1).padStart(3, "0")}</span>
                  <span className="font-mono whitespace-nowrap" style={{ color: "var(--admin-ink-medium)" }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                  <span className="font-mono" style={{ color: "var(--admin-ink)" }}>{a.action}</span>
                  <span className="admin-marginalia text-right">{a.targetType} · {a.targetId.slice(0, 8)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire the route.**

In `apps/admin/src/App.tsx`:

```tsx
import { MemberDetailPage } from "./pages/members/MemberDetailPage";
```

Add inside the `<Route element={<AdminShell ... />}>` block, after the members list route:

```tsx
<Route path="members/:id" element={<MemberDetailPage />} />
```

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add apps/admin/src
git commit -m "feat(admin): member detail page with identity edits + role + status + audit"
```

---

## Task 14: Duplicates page

**Files:**
- Create: `apps/admin/src/pages/members/DuplicatesPage.tsx`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1: Build the duplicates page.**

`apps/admin/src/pages/members/DuplicatesPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

interface PairUser {
  id: string;
  displayName: string | null;
  email: string;
  orcid: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  photoUrl: string | null;
  primaryOrgId: string | null;
  primaryOrgName: string | null;
  signedUpAt: string;
}

interface ScoredPair {
  score: number;
  tier: "high" | "medium" | "weak";
  signals: string[];
  users: [PairUser, PairUser];
}

export function DuplicatesPage() {
  const apiFetch = useApi();
  const [pairs, setPairs] = useState<ScoredPair[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch("/admin/users/duplicates");
        if (cancelled) return;
        if (!res.ok) { setError(`/admin/users/duplicates responded ${res.status}`); return; }
        const body = (await res.json()) as { ok: true; pairs: ScoredPair[] };
        setPairs(body.pairs);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [apiFetch]);

  if (error) return <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>{error}</p>;
  if (!pairs) return <p className="admin-marginalia">Computing candidates…</p>;

  const counts = {
    total: pairs.length,
    high: pairs.filter((p) => p.tier === "high").length,
    medium: pairs.filter((p) => p.tier === "medium").length,
    weak: pairs.filter((p) => p.tier === "weak").length,
  };

  const filtered = pairs.filter((p) => {
    if (filter === "all") return true;
    if (filter === "high") return p.tier === "high";
    if (filter === "medium") return p.tier === "high" || p.tier === "medium";
    return true;
  });

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-8">US-RSE · Admin · Members · Duplicates queue</p>
      <h2 className="admin-display mb-6" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        Candidate duplicates.
      </h2>

      <div className="flex items-baseline gap-6 mb-10">
        <span className="admin-classification">
          {counts.total} candidates · {counts.high} high · {counts.medium} medium · {counts.weak} weak
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="admin-classification bg-transparent border-0 outline-none ml-auto"
          style={{ color: "var(--admin-ink-medium)" }}
        >
          <option value="all">Show all</option>
          <option value="medium">Show ≥ medium</option>
          <option value="high">Show only high</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="italic" style={{ color: "var(--admin-marginalia)" }}>No candidates at this tier.</p>
      ) : (
        <ul className="space-y-12">
          {filtered.map((p, i) => (
            <li key={`${p.users[0].id}-${p.users[1].id}`}>
              <div className="flex items-baseline justify-between mb-3">
                <p className="admin-classification tabular-nums">No. {String(i + 1).padStart(3, "0")}</p>
                <p className="admin-classification" style={{ color: p.tier === "high" ? "var(--admin-ribbon)" : p.tier === "medium" ? "var(--admin-mark)" : "var(--admin-marginalia)" }}>
                  Score {p.score} · {p.tier} · {p.signals.join(" · ")}
                </p>
              </div>
              <div className="grid grid-cols-[1fr_4rem_1fr] gap-8 items-stretch" style={{ borderTop: "1px solid var(--admin-rule)", paddingTop: "1.5rem" }}>
                <PairCard user={p.users[0]} />
                <div className="flex items-center justify-center">
                  <span className="admin-classification" style={{ color: "var(--admin-marginalia)" }}>↔</span>
                </div>
                <PairCard user={p.users[1]} />
              </div>
              <div className="mt-6 flex justify-end">
                <Link
                  to={`/members/duplicates/merge?a=${p.users[0].id}&b=${p.users[1].id}`}
                  className="admin-classification"
                  style={{ color: "var(--admin-ribbon)" }}
                >
                  Review →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PairCard({ user }: { user: PairUser }) {
  return (
    <div>
      <p className="font-display text-xl font-semibold mb-1" style={{ color: "var(--admin-ink)" }}>
        {user.displayName ?? <em style={{ color: "var(--admin-marginalia)" }}>no name</em>}
      </p>
      <p className="font-mono text-[12px] mb-3" style={{ color: "var(--admin-ink-medium)" }}>{user.email}</p>
      <dl className="space-y-1 text-[13px]">
        {user.primaryOrgName && <DL k="Org" v={user.primaryOrgName} />}
        {user.orcid && <DL k="ORCID" v={user.orcid} />}
        {user.githubUrl && <DL k="GitHub" v={user.githubUrl} />}
        {user.linkedinUrl && <DL k="LinkedIn" v={user.linkedinUrl} />}
        <DL k="Joined" v={new Date(user.signedUpAt).toLocaleDateString()} />
      </dl>
    </div>
  );
}

function DL({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-3">
      <dt className="admin-marginalia">{k}</dt>
      <dd className="font-mono text-[12px]" style={{ color: "var(--admin-ink)" }}>{v}</dd>
    </div>
  );
}
```

- [ ] **Step 2: Wire the route.**

In `apps/admin/src/App.tsx`:

```tsx
import { DuplicatesPage } from "./pages/members/DuplicatesPage";
```

Add inside `<Route element={<AdminShell ... />}>`:

```tsx
<Route path="members/duplicates" element={<DuplicatesPage />} />
```

(Place it BEFORE the `members/:id` route or use route ordering so `duplicates` doesn't match the dynamic id pattern. React Router matches in declaration order; static paths win when listed first.)

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add apps/admin/src
git commit -m "feat(admin): duplicate-candidates review queue"
```

---

## Task 15: Merge wizard

**Files:**
- Create: `apps/admin/src/pages/members/MergeWizardPage.tsx`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1: Build the wizard.**

`apps/admin/src/pages/members/MergeWizardPage.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";

const PROMOTABLE_FIELDS = [
  "displayName", "headline", "bio", "photoUrl", "jobTitle",
  "githubUrl", "linkedinUrl", "orcid", "websiteUrl",
  "pronounId", "careerStageId", "countryId",
  "region", "city", "publicLocation",
] as const;
type PromotableField = (typeof PROMOTABLE_FIELDS)[number];

interface UserDetail {
  ok: true;
  user: {
    id: string;
    memberId: string;
    email: string;
    role: string;
    mergedIntoUserId: string | null;
    deletedAt: string | null;
    isLegacyImport: boolean;
    createdAt: string;
  };
  profile: Record<string, unknown> | null;
  affiliations: Array<{ id: string }>;
  recentAudit: Array<{ id: string }>;
}

export function MergeWizardPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const aId = params.get("a");
  const bId = params.get("b");

  const [a, setA] = useState<UserDetail | null>(null);
  const [b, setB] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [canonicalId, setCanonicalId] = useState<string | null>(null);
  const [promote, setPromote] = useState<Set<PromotableField>>(new Set());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!aId || !bId) {
      setError("Missing user ids in URL");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [ra, rb] = await Promise.all([
          apiFetch(`/admin/users/${aId}`).then((r) => r.json()),
          apiFetch(`/admin/users/${bId}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setA(ra as UserDetail);
        setB(rb as UserDetail);
        // Default canonical = the one with more populated fields.
        const aCount = countPopulated(ra.profile);
        const bCount = countPopulated(rb.profile);
        if (aCount > bCount) setCanonicalId(aId);
        else if (bCount > aCount) setCanonicalId(bId);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [apiFetch, aId, bId]);

  const promotable = useMemo(() => {
    if (!a || !b || !canonicalId) return [];
    const sourceProfile = (canonicalId === aId ? b : a).profile;
    const targetProfile = (canonicalId === aId ? a : b).profile;
    if (!sourceProfile) return [];
    return PROMOTABLE_FIELDS.filter((f) => {
      const sv = (sourceProfile as Record<string, unknown>)[f];
      const tv = targetProfile ? (targetProfile as Record<string, unknown>)[f] : null;
      if (sv === null || sv === undefined || sv === "") return false;
      if (tv === null || tv === undefined || tv === "") return true;
      if (typeof sv === "string" && typeof tv === "string" && sv.length > tv.length) return true;
      return false;
    });
  }, [a, b, canonicalId, aId]);

  async function submitMerge() {
    if (!a || !b || !canonicalId) return;
    setSubmitting(true);
    setSubmitError(null);
    const targetId = canonicalId;
    const sourceId = canonicalId === aId ? bId : aId;
    try {
      const res = await apiFetch(`/admin/users/${sourceId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: targetId,
          promotedFields: [...promote],
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setSubmitError(body?.message ?? `POST responded ${res.status}`);
        return;
      }
      navigate(`/members/${targetId}`, { replace: true });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally { setSubmitting(false); }
  }

  if (error) return <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>{error}</p>;
  if (!a || !b) return <p className="admin-marginalia">Loading…</p>;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Members · Merge · Step {["I", "II", "III"][step - 1]}</p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {step === 1 ? "Pick canonical." : step === 2 ? "Promote fields." : "Confirm."}
      </h2>
      <div className="h-[2px] mb-10" style={{ background: "var(--admin-rule-subtle)" }}>
        <div className="h-full" style={{ width: `${(step / 3) * 100}%`, background: "var(--admin-ribbon)", transition: "width 250ms" }} />
      </div>

      {step === 1 && (
        <div>
          <div className="grid grid-cols-2 gap-8 mb-8">
            {[a, b].map((u) => (
              <label key={u.user.id} className="cursor-pointer block p-6" style={{ border: canonicalId === u.user.id ? "2px solid var(--admin-ribbon)" : "1px solid var(--admin-rule)" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-display text-xl font-semibold" style={{ color: "var(--admin-ink)" }}>
                    {(u.profile as { displayName?: string } | null)?.displayName ?? <em>no name</em>}
                  </p>
                  <input
                    type="radio"
                    checked={canonicalId === u.user.id}
                    onChange={() => setCanonicalId(u.user.id)}
                  />
                </div>
                <p className="font-mono text-[12px] mb-2" style={{ color: "var(--admin-ink-medium)" }}>{u.user.email}</p>
                <p className="admin-marginalia">Member {u.user.memberId} · Joined {new Date(u.user.createdAt).toLocaleDateString()}</p>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={!canonicalId}
            onClick={() => setStep(2)}
            className="inline-flex items-center gap-2 px-6 py-3 disabled:opacity-50"
            style={{ background: "var(--admin-ink)", color: "var(--admin-paper)", fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Next → Step II
          </button>
        </div>
      )}

      {step === 2 && canonicalId && (
        <div>
          {promotable.length === 0 ? (
            <p className="italic mb-8" style={{ color: "var(--admin-marginalia)" }}>
              No fields to promote — target's profile is fuller or equal across the board.
            </p>
          ) : (
            <ul className="space-y-3 mb-8" style={{ borderTop: "1px solid var(--admin-rule)" }}>
              {promotable.map((f) => (
                <li key={f} className="py-3 grid grid-cols-[1.5rem_8rem_1fr_1fr] gap-4 items-baseline" style={{ borderBottom: "1px solid var(--admin-rule-subtle)" }}>
                  <input
                    type="checkbox"
                    checked={promote.has(f)}
                    onChange={(e) => {
                      const next = new Set(promote);
                      if (e.target.checked) next.add(f); else next.delete(f);
                      setPromote(next);
                    }}
                  />
                  <span className="admin-classification">{f}</span>
                  <span className="font-mono text-[12px]" style={{ color: "var(--admin-ink-medium)" }}>
                    src: {String((canonicalId === aId ? b : a).profile?.[f as keyof object] ?? "—").slice(0, 60)}
                  </span>
                  <span className="font-mono text-[12px]" style={{ color: "var(--admin-marginalia)" }}>
                    tgt: {String((canonicalId === aId ? a : b).profile?.[f as keyof object] ?? "—").slice(0, 60)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="admin-classification">← Back</button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="ml-auto inline-flex items-center gap-2 px-6 py-3"
              style={{ background: "var(--admin-ink)", color: "var(--admin-paper)", fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Next → Step III
            </button>
          </div>
        </div>
      )}

      {step === 3 && canonicalId && (
        <div>
          <div className="mb-6 p-6" style={{ border: "1px solid var(--admin-rule)" }}>
            <p className="text-[14px] leading-[1.7]" style={{ color: "var(--admin-ink)" }}>
              Merging{" "}
              <strong>{(canonicalId === aId ? b : a).profile?.["displayName" as keyof object] as string ?? "(no name)"}</strong>{" "}
              ({(canonicalId === aId ? b : a).user.email}) into{" "}
              <strong>{(canonicalId === aId ? a : b).profile?.["displayName" as keyof object] as string ?? "(no name)"}</strong>{" "}
              ({(canonicalId === aId ? a : b).user.email}).
            </p>
            <p className="mt-4 admin-marginalia">
              Will move {(canonicalId === aId ? b : a).affiliations.length} affiliations and audit history to the target.
              Promoting {promote.size} field{promote.size === 1 ? "" : "s"}.
            </p>
          </div>

          <label className="block mb-6">
            <span className="admin-classification block mb-2">Reason (optional)</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={280}
              className="w-full bg-transparent border-0 py-1.5 outline-none"
              style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)" }}
            />
          </label>

          {submitError && (
            <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>{submitError}</p>
          )}

          <div className="flex gap-3">
            <Link to="/members/duplicates" className="admin-classification">Cancel</Link>
            <button
              type="button"
              onClick={() => void submitMerge()}
              disabled={submitting}
              className="ml-auto inline-flex items-center gap-2 px-8 py-3 disabled:opacity-50"
              style={{ background: "var(--admin-ink)", color: "var(--admin-paper)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "16px" }}
            >
              {submitting ? "Merging…" : "Confirm merge"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function countPopulated(profile: unknown): number {
  if (!profile || typeof profile !== "object") return 0;
  let n = 0;
  for (const v of Object.values(profile as Record<string, unknown>)) {
    if (v !== null && v !== undefined && v !== "") n++;
  }
  return n;
}
```

- [ ] **Step 2: Wire the route.**

In `apps/admin/src/App.tsx`:

```tsx
import { MergeWizardPage } from "./pages/members/MergeWizardPage";
```

```tsx
<Route path="members/duplicates/merge" element={<MergeWizardPage />} />
```

Place this BEFORE `members/duplicates` route OR after, doesn't matter — different paths.

- [ ] **Step 3: Typecheck + commit.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck
git add apps/admin/src
git commit -m "feat(admin): merge wizard with three-step ceremony"
```

---

## Task 16: Final wiring + smoke test

**Files:**
- Modify: `apps/admin/tests/admin-foundation.spec.ts` (rename or extend → admin-identity)

- [ ] **Step 1: Add a smoke test for the members surface.**

Append to `apps/admin/tests/admin-foundation.spec.ts`:

```ts
test("unauthenticated visit to /members triggers sign-in flow", async ({ page }) => {
  await page.goto("/members");
  // Auto-redirect kicks in; expect Connecting to WorkOS text (or sign-in card).
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});

test("the duplicates page renders its sign-in surface unauthenticated", async ({ page }) => {
  await page.goto("/members/duplicates");
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});
```

- [ ] **Step 2: Run smoke locally.**

In one terminal: `npm -w @us-rse/api run dev`. In another: `npm -w @us-rse/admin run dev`. In a third:

```bash
cd apps/admin && ADMIN_URL=http://localhost:5174 npm run e2e
```

Expected: 4 tests passing (the 2 from foundation + 2 new).

- [ ] **Step 3: Commit.**

```bash
git add apps/admin/tests
git commit -m "test(admin): smoke for /members + /members/duplicates routes"
```

---

## Wrap

- [ ] **Step 1: Final typecheck + tests.**

```bash
cd /Users/corderocore/Documents/usrse.github.io && npm run typecheck && (cd packages/api && npm test)
```

Expected: 5/5 typecheck successful + all vitest tests pass.

- [ ] **Step 2: Push and open PR.**

```bash
git push -u origin cdcore09/admin-identity
gh pr create --base cdcore09/site-redesign --title "feat(admin): identity & members subsystem" --body "$(cat <<'EOF'
Closes #1957.

Spec: docs/superpowers/specs/2026-05-11-admin-identity-design.md
Plan: docs/superpowers/plans/2026-05-11-admin-identity-implementation.md

## Summary

- Migration 0013_user_merges (reversible merge history)
- canEditMembers + canPromoteToRole policies
- duplicate-detection lib (anchor discovery + multi-signal scoring)
- userMerge.ts (validate, snapshot, executeMerge, executeUnmerge)
- 8 new admin API endpoints under /api/admin/users/*
- 4 new admin pages: list, detail, duplicates queue, merge wizard
- EditorialInput / EditorialTextarea / RoleTag / StatusTag shared components
- Playwright smoke extended

## Test plan
- [ ] Sign in as super_admin
- [ ] Browse /admin/members, search, paginate
- [ ] Open a member detail page, edit identity, save
- [ ] Promote a member to staff
- [ ] Browse /admin/members/duplicates, see scored pairs
- [ ] Walk through merge wizard on a test pair (low-stakes target)
- [ ] Verify the audit log records merge + unmerge
- [ ] Unmerge → verify source is restored
EOF
)"
```

- [ ] **Step 3: Update the issue.**

After merge, comment on #1957 with the merge commit SHA and check off the requirements.

---

## Self-review notes

Each spec section maps to at least one task:
- Architecture overview → all backend + FE tasks
- Schema additions → Task 1
- API surface → Tasks 8 + 9 + 10
- Merge transaction → Tasks 5 + 6
- Duplicate detection → Tasks 3 + 4
- Merge wizard UX → Task 15
- Directory list / detail / dupes queue → Tasks 12 + 13 + 14
- Unmerge → Task 7 + 10 (endpoint) + 13 (UI integration)
- Visual specification → Tasks 11 (shared components in editorial vocab) + 12-15 (each page applies the vocab)
- Deliverables list (14 items in the spec) → covered across tasks 1-16

Type / signature consistency check:
- `CandidateUser` / `ScoredPair` types are referenced consistently in Tasks 3, 4, and 8.
- `PROMOTABLE_PROFILE_FIELDS` defined in Task 5 (userMerge.ts), imported by Task 10 (merge endpoint) and used by Task 15 (merge wizard via a separate local `PROMOTABLE_FIELDS` const — kept duplicated rather than imported across the workspace boundary).
- `MergeSnapshot.toRepoint` keys are consistent between Tasks 5 (definition), 6 (executeMerge), 7 (executeUnmerge).
- API endpoint paths consistent between Tasks 8/9/10 (backend) and Tasks 12-15 (frontend `apiFetch` calls).

No placeholders.
