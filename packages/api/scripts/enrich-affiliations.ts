/**
 * Enrich user_institutions with cross-appointments that the original
 * single-segment importer dropped.
 *
 * Two sources are processed:
 *
 *  1. Legacy CSV multi-affiliation rows. The form's "Primary Institution
 *     Name" cell joins cross-appointments with " / " (most common),
 *     " | ", or ";". The original importer kept only the first segment;
 *     this script restores the rest as secondary affiliations.
 *
 *  2. Database institutions whose canonical name still contains a join
 *     separator (e.g. "University of Louisville; Million Concepts"
 *     slipped past the original splitter because there's no leading
 *     space). For each such row we split the name, ensure each part
 *     exists as a canonical institution, repoint the user_institutions
 *     row to the first fragment as primary, and add the others as
 *     secondaries. The joined-name row is then marked merged_into the
 *     first fragment so it stops appearing in the directory.
 *
 * Idempotent: re-running is safe. Existing (user, institution) pairs
 * are not duplicated.
 *
 * The CSV from .data/ is large and contains a known malformed quote
 * at line 401 that breaks RFC-4180 parsing. We don't try to parse the
 * whole file — we grep for the small set of multi-affiliation rows
 * directly and operate on those.
 *
 * Usage:
 *   tsx scripts/enrich-affiliations.ts [--dry-run]
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq, inArray, isNull, sql as drSql } from "drizzle-orm";
import {
  organizations,
  userOrganizations,
  users,
} from "../src/db/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");

function loadDevVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const contents = readFileSync(
      resolve(__dirname, "..", ".dev.vars"),
      "utf8"
    );
    for (const line of contents.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && m[1] === name) {
        return m[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      }
    }
  } catch {
    /* ok */
  }
  return undefined;
}

const databaseUrl = loadDevVar("DATABASE_URL");
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

function institutionSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "institution"
  );
}

/**
 * Split an institution cell. Conservative — only splits on " / ", " | "
 * surrounded by spaces, or ";" (with optional surrounding space).
 *
 * Some legitimate names contain stylized "|" without being a join (e.g.
 * "Center for Astrophysics | Harvard & Smithsonian"); those are added
 * to a deny-list below so we don't spuriously split them.
 */
const NO_SPLIT_NAMES = new Set([
  "center for astrophysics | harvard & smithsonian",
]);

/**
 * Some fragments aren't real institutions — date-tagged role
 * descriptions ("UC San Diego (2019-2023)"), "self-employed", role
 * phrases like "contractor with X". Keep splits conservative: refuse
 * to split when any fragment looks date-tagged or role-shaped.
 */
function isSuspiciousFragment(s: string): boolean {
  // Any year-paren pattern → assume the user is encoding tenure dates
  // rather than naming an organization.
  if (/\(\s*\d{4}/.test(s)) return true;
  // "self-employed" alone isn't an institution.
  if (/^self[- ]employed$/i.test(s.trim())) return true;
  // "contractor with X", "consultant for X" — role phrases, not orgs.
  if (/^(contractor|consultant)\s+(with|for|at)\b/i.test(s.trim())) return true;
  return false;
}

function splitInstitutions(raw: string): string[] {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return [];
  if (NO_SPLIT_NAMES.has(t.toLowerCase())) return [t];
  const parts = t
    .split(/\s+\/\s+|\s+\|\s+|\s*;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.some(isSuspiciousFragment)) return [t]; // keep as single
  return parts;
}

/** Extract email + institution-column from a single CSV row line. */
function extractEmailAndInstitution(
  line: string
): { email: string; institution: string } | null {
  // Columns 1..4 are: timestamp, name, email, institution. None of
  // these contain commas in our data, so a simple split on the first
  // four commas is reliable for the columns we care about.
  const parts: string[] = [];
  let cur = "";
  let count = 0;
  for (let i = 0; i < line.length && count < 4; i++) {
    if (line[i] === ",") {
      parts.push(cur);
      cur = "";
      count++;
    } else {
      cur += line[i];
    }
  }
  if (count < 4) return null;
  parts.push(cur); // institution col remains until we stop, may have unread tail
  const email = parts[2]?.trim().toLowerCase();
  const institution = parts[3]?.trim();
  if (!email || !institution) return null;
  return { email, institution };
}

async function main() {
  const csvPath = resolve(
    __dirname,
    "..",
    "..",
    "..",
    ".data",
    "us-rse-membership-2026-05-02.csv"
  );
  const csvText = readFileSync(csvPath, "utf8");
  const lines = csvText.split(/\r?\n/);
  console.log(`CSV: ${lines.length} lines`);

  const sqlClient = neon(databaseUrl!);
  const db = drizzle(sqlClient);

  // ── Source 1: CSV rows whose institution column has a separator ───
  // Match on the combined column-4 pattern. We grep with a strict
  // shape so we don't pick up separators in later columns.
  const TIMESTAMP_RE = /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2},/;
  const candidates: { line: string; email: string; institution: string }[] = [];
  for (const line of lines) {
    if (!TIMESTAMP_RE.test(line)) continue;
    // Cheap pre-filter: the institution column needs a separator pattern.
    if (!/ \/ | \| |;/.test(line)) continue;
    const ext = extractEmailAndInstitution(line);
    if (!ext) continue;
    if (!/ \/ | \| |;/.test(ext.institution)) continue;
    candidates.push({ line, email: ext.email, institution: ext.institution });
  }
  console.log(`  CSV multi-affiliation candidates: ${candidates.length}`);

  // Filter out single-result splits (legitimate stylized names).
  const csvPlans = candidates
    .map((c) => ({
      email: c.email,
      institution: c.institution,
      fragments: splitInstitutions(c.institution),
    }))
    .filter((p) => p.fragments.length > 1);
  console.log(`  CSV plans after filter: ${csvPlans.length}`);
  for (const p of csvPlans) {
    console.log(`    ${p.email}: ${JSON.stringify(p.fragments)}`);
  }

  // ── Source 2: DB institutions with joined names ───────────────────
  // Anything matching " / ", " | ", or ";" patterns in the canonical
  // name is a candidate to split.
  const joined = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      mergedIntoId: organizations.mergedIntoId,
    })
    .from(organizations)
    .where(drSql`name ~ ' / | \\| |;'`);
  // Filter out names already merged and stylized-pipe names.
  const dbPlans = joined
    .filter((i) => !i.mergedIntoId)
    .map((i) => ({
      id: i.id,
      name: i.name,
      fragments: splitInstitutions(i.name),
    }))
    .filter((p) => p.fragments.length > 1);
  console.log(`  DB joined-name plans: ${dbPlans.length}`);
  for (const p of dbPlans) {
    console.log(`    [${p.id.slice(0, 8)}] ${p.name} → ${JSON.stringify(p.fragments)}`);
  }

  // ── Build email → user.id and name → institution.id maps ──────────
  const allInst = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
    })
    .from(organizations);
  const instByName = new Map<string, string>();
  const instBySlug = new Map<string, string>();
  for (const i of allInst) {
    instByName.set(i.name.toLowerCase(), i.id);
    instBySlug.set(i.slug, i.id);
  }

  const emailsNeeded = new Set(csvPlans.map((p) => p.email));
  const userRows = emailsNeeded.size
    ? await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(
          and(
            isNull(users.deletedAt),
            inArray(users.email, [...emailsNeeded])
          )
        )
    : [];
  const userByEmail = new Map<string, string>();
  for (const u of userRows) userByEmail.set(u.email.toLowerCase(), u.id);
  const csvUnmatched = csvPlans
    .map((p) => p.email)
    .filter((e) => !userByEmail.has(e));
  if (csvUnmatched.length) {
    console.log(`  CSV emails not matching DB users: ${csvUnmatched.join(", ")}`);
  }

  // ── Resolve all required institution names to ids; insert pending
  //    rows for any that don't exist yet ─────────────────────────────
  const allFragments = new Set<string>();
  for (const p of csvPlans) for (const f of p.fragments) allFragments.add(f);
  for (const p of dbPlans) for (const f of p.fragments) allFragments.add(f);
  const newNames: string[] = [];
  for (const name of allFragments) {
    if (instByName.has(name.toLowerCase())) continue;
    if (instBySlug.has(institutionSlug(name))) continue;
    newNames.push(name);
  }
  console.log(`  ${newNames.length} new institutions to propose`);
  if (!dryRun && newNames.length > 0) {
    const inserted = await db
      .insert(organizations)
      .values(
        newNames.map((name) => ({
          name,
          slug: institutionSlug(name),
          status: "pending" as const,
        }))
      )
      .onConflictDoNothing()
      .returning({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
      });
    for (const r of inserted) {
      instByName.set(r.name.toLowerCase(), r.id);
      instBySlug.set(r.slug, r.id);
    }
    console.log(`  Inserted ${inserted.length} pending institutions`);
  }

  function resolveInstId(name: string): string | null {
    return (
      instByName.get(name.toLowerCase()) ??
      instBySlug.get(institutionSlug(name)) ??
      null
    );
  }

  // ── Apply CSV plans ────────────────────────────────────────────────
  let csvRowsAdded = 0;
  for (const p of csvPlans) {
    const userId = userByEmail.get(p.email);
    if (!userId) continue;
    // Skip the first fragment — the original importer already
    // attached it as primary. Only add fragments 2..N as secondaries.
    const tail = p.fragments.slice(1);
    for (const frag of tail) {
      const instId = resolveInstId(frag);
      if (!instId) continue;
      if (dryRun) {
        csvRowsAdded++;
        continue;
      }
      const res = await db
        .insert(userOrganizations)
        .values({ userId, organizationId: instId, isPrimary: false })
        .onConflictDoNothing()
        .returning({ id: userOrganizations.id });
      csvRowsAdded += res.length;
    }
  }
  console.log(`  CSV: added ${csvRowsAdded} secondary affiliations`);

  // ── Apply DB joined-name plans ─────────────────────────────────────
  // For each joined-name institution:
  //   1. Resolve canonical id for fragment 0 (primary) and 1..N (secondaries)
  //   2. Find every user_institutions row pointing at the joined-name id
  //   3. Repoint that row at fragment-0's id (still primary), and add
  //      one row per remaining fragment for the same user.
  //   4. Mark the joined-name institution merged_into fragment-0.
  let dbRowsAdded = 0;
  let dbRowsRepointed = 0;
  for (const p of dbPlans) {
    const fragIds = p.fragments
      .map((f) => ({ name: f, id: resolveInstId(f) }))
      .filter((x): x is { name: string; id: string } => x.id !== null);
    if (fragIds.length < 2) continue;
    const primaryId = fragIds[0].id;
    const secondaryIds = fragIds.slice(1).map((x) => x.id);

    const linked = await db
      .select({
        id: userOrganizations.id,
        userId: userOrganizations.userId,
        isPrimary: userOrganizations.isPrimary,
      })
      .from(userOrganizations)
      .where(eq(userOrganizations.organizationId, p.id));

    for (const link of linked) {
      if (!dryRun) {
        // Repoint to canonical primary. The (user, institution) unique
        // index would block if the user already has a row for primaryId
        // — fall back to deleting the joined-name row in that case.
        const existing = await db
          .select({ id: userOrganizations.id })
          .from(userOrganizations)
          .where(
            and(
              eq(userOrganizations.userId, link.userId),
              eq(userOrganizations.organizationId, primaryId)
            )
          )
          .limit(1);
        if (existing[0]) {
          // Already has a row for the canonical primary — drop the
          // joined-name one. Don't downgrade isPrimary on the existing
          // row; if it was secondary the user's mental model was the
          // joined-name was primary, so leave it for them to re-pick.
          await db
            .delete(userOrganizations)
            .where(eq(userOrganizations.id, link.id));
        } else {
          await db
            .update(userOrganizations)
            .set({ organizationId: primaryId, updatedAt: new Date() })
            .where(eq(userOrganizations.id, link.id));
          dbRowsRepointed++;
        }
        // Add secondary affiliations.
        for (const sId of secondaryIds) {
          const res = await db
            .insert(userOrganizations)
            .values({
              userId: link.userId,
              organizationId: sId,
              isPrimary: false,
            })
            .onConflictDoNothing()
            .returning({ id: userOrganizations.id });
          dbRowsAdded += res.length;
        }
      } else {
        dbRowsRepointed++;
        dbRowsAdded += secondaryIds.length;
      }
    }

    if (!dryRun) {
      // Mark the joined-name row merged_into the canonical primary so
      // it no longer appears as an affiliation choice.
      await db
        .update(organizations)
        .set({ mergedIntoId: primaryId, status: "rejected" })
        .where(eq(organizations.id, p.id));
    }
  }
  console.log(
    `  DB: repointed ${dbRowsRepointed} joined-name rows, added ${dbRowsAdded} secondary affiliations`
  );

  if (dryRun) {
    console.log("Dry run — no writes performed.");
    return;
  }

  // Sanity counts.
  const finalCounts = await sqlClient.query(
    "SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_primary) AS primaries, COUNT(DISTINCT user_id) AS users FROM user_institutions"
  );
  console.log("Final user_institutions:", finalCounts);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
