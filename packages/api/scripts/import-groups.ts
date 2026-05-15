#!/usr/bin/env node --experimental-strip-types
/**
 * Seed-data import for working + affinity groups.
 *
 * Reads the two Google Forms exports in `.data/` and:
 *   - inserts one `groups` row per CSV row (skipping any whose slug already exists)
 *   - looks up chairs/co-chairs by email and inserts `group_memberships` rows
 *   - looks up listed initial members (working groups only) by normalized
 *     display name; only single-match lookups become memberships
 *
 * Two modes:
 *   node --experimental-strip-types packages/api/scripts/import-groups.ts            # dry-run
 *   node --experimental-strip-types packages/api/scripts/import-groups.ts --commit   # write
 *
 * Reads DATABASE_URL from packages/api/.dev.vars.
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Inputs ─────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const WORKING_CSV = path.join(
  REPO_ROOT,
  ".data/US-RSE Working Group Creation Form (Responses) - Form Responses 1.csv",
);
const AFFINITY_CSV = path.join(
  REPO_ROOT,
  ".data/US-RSE Affinity Group Creation Form (Responses) - Form Responses 1.csv",
);

// ─── CLI args ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");

// ─── Tiny CSV parser (handles quoted fields with embedded commas + newlines) ─
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (ch === "\r") {
        /* skip */
      } else cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ─── Helpers ────────────────────────────────────────────────────────
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeDisplayName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

function firstSentence(s: string, maxLen = 200): string {
  const trimmed = s.trim();
  const period = trimmed.indexOf(". ");
  if (period > 0 && period < maxLen) return trimmed.slice(0, period + 1);
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen - 1) + "…";
}

function cleanSlack(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#+/, "").toLowerCase();
  return trimmed || null;
}

function isPlaceholderEmail(email: string): boolean {
  return /tbd@/i.test(email);
}

// ─── Per-CSV import ─────────────────────────────────────────────────
async function importGroups(
  sql: NeonQueryFunction<false, false>,
  type: "working_group" | "affinity_group",
  csvPath: string,
) {
  const text = fs.readFileSync(csvPath, "utf8");
  const [header, ...rows] = parseCsv(text);
  console.log(
    `─── ${type} ──── ${rows.length} CSV rows from ${path.basename(csvPath)} ───`,
  );

  const col = (name: string): number => {
    const idx = header.indexOf(name);
    if (idx < 0) {
      throw new Error(
        `Missing CSV column "${name}" in ${path.basename(csvPath)}. Available columns: ${header.join(" | ")}`,
      );
    }
    return idx;
  };

  const NAME = col(
    type === "working_group" ? "Working Group Name" : "Affinity Group Name",
  );
  const PURPOSE = col(
    type === "working_group" ? "Working Group Purpose" : "One-sentence Description",
  );
  const SLACK = col("Slack channel name");
  const CHAIR_NAME_1 = col(
    type === "working_group" ? "Chair name" : "Coordinator 1 Name",
  );
  // Note: the affinity CSV has a typo — "Coordinate 1 Email" (not "Coordinator 1 Email").
  const CHAIR_EMAIL_1 = col(
    type === "working_group" ? "Chair email" : "Coordinate 1 Email",
  );
  const CHAIR_NAME_2 = col(
    type === "working_group" ? "Co-chair name" : "Coordinator 2 Name",
  );
  const CHAIR_EMAIL_2 = col(
    type === "working_group" ? "Co-chair email" : "Coordinator 2 Email",
  );
  const INITIAL_MEMBERS = type === "working_group" ? col("Initial Members") : -1;

  // Pre-fetch existing groups by slug (cheap).
  const existingGroups = await sql`SELECT slug FROM groups`;
  const existingSlugs = new Set<string>(
    existingGroups.map((r) => r.slug as string),
  );

  let inserted = 0;
  let skipped = 0;
  const chairAssignments: Array<{
    groupName: string;
    email: string;
    role: "chair" | "co_chair";
    matched: boolean;
    userId: string | null;
  }> = [];
  const memberAssignments: Array<{
    groupName: string;
    rawName: string;
    matched: boolean;
    userId: string | null;
  }> = [];

  for (const row of rows) {
    const name = (row[NAME] ?? "").trim();
    if (!name) continue;
    const slug = slugify(name);
    if (!slug) {
      console.log(`  · skipped (no slug-safe chars): ${name}`);
      continue;
    }
    if (existingSlugs.has(slug)) {
      console.log(`  · skipped (slug already exists): ${slug}`);
      skipped++;
      continue;
    }

    const purpose = (row[PURPOSE] ?? "").trim();
    const description =
      type === "working_group" ? firstSentence(purpose, 200) : purpose;
    const charter = type === "working_group" ? purpose : null;
    const slackChannel = cleanSlack(row[SLACK] ?? "");

    let groupId: string | null = null;
    if (COMMIT) {
      const insertResult = await sql`
        INSERT INTO groups (name, slug, type, description, charter, slack_channel, links, is_active, is_published)
        VALUES (${name}, ${slug}, ${type}, ${description || null}, ${charter}, ${slackChannel}, '[]'::jsonb, true, true)
        RETURNING id
      `;
      groupId = insertResult[0].id as string;
    }

    console.log(`  ✓ ${name}  (slug: ${slug}, type: ${type})`);
    inserted++;
    existingSlugs.add(slug);

    // Chair assignments.
    const chairColumns: Array<[number, number, "chair" | "co_chair"]> = [
      [CHAIR_EMAIL_1, CHAIR_NAME_1, "chair"],
      [CHAIR_EMAIL_2, CHAIR_NAME_2, "co_chair"],
    ];
    for (const [emailIdx, _nameIdx, role] of chairColumns) {
      const email = (row[emailIdx] ?? "").trim().toLowerCase();
      if (!email) continue;
      if (isPlaceholderEmail(email)) {
        chairAssignments.push({
          groupName: name,
          email,
          role,
          matched: false,
          userId: null,
        });
        continue;
      }
      const userMatch = await sql`SELECT id FROM users WHERE LOWER(email) = ${email} LIMIT 1`;
      if (userMatch.length > 0) {
        const userId = userMatch[0].id as string;
        if (COMMIT && groupId) {
          await sql`
            INSERT INTO group_memberships (user_id, group_id, role)
            VALUES (${userId}, ${groupId}, ${role})
            ON CONFLICT (user_id, group_id) DO UPDATE SET role = ${role}
          `;
        }
        chairAssignments.push({
          groupName: name,
          email,
          role,
          matched: true,
          userId,
        });
      } else {
        chairAssignments.push({
          groupName: name,
          email,
          role,
          matched: false,
          userId: null,
        });
      }
    }

    // Initial members (working_group only).
    if (INITIAL_MEMBERS >= 0) {
      const raw = (row[INITIAL_MEMBERS] ?? "").trim();
      if (raw) {
        const namesList = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const memberName of namesList) {
          const norm = normalizeDisplayName(memberName);
          if (norm.length < 4) {
            memberAssignments.push({
              groupName: name,
              rawName: memberName,
              matched: false,
              userId: null,
            });
            continue;
          }
          const match = await sql`
            SELECT u.id FROM users u
            INNER JOIN profiles p ON p.user_id = u.id
            WHERE LOWER(REGEXP_REPLACE(p.display_name, '[^a-zA-Z0-9]', '', 'g')) = ${norm}
            LIMIT 2
          `;
          if (match.length === 1) {
            const userId = match[0].id as string;
            if (COMMIT && groupId) {
              await sql`
                INSERT INTO group_memberships (user_id, group_id, role)
                VALUES (${userId}, ${groupId}, 'member')
                ON CONFLICT (user_id, group_id) DO NOTHING
              `;
            }
            memberAssignments.push({
              groupName: name,
              rawName: memberName,
              matched: true,
              userId,
            });
          } else {
            memberAssignments.push({
              groupName: name,
              rawName: memberName,
              matched: false,
              userId: null,
            });
          }
        }
      }
    }
  }

  // Reports.
  console.log(`\n─── Summary for ${type} ───`);
  console.log(`  Inserted: ${inserted}, Skipped (slug exists): ${skipped}`);

  const chairsMatched = chairAssignments.filter((a) => a.matched).length;
  const chairsUnmatched = chairAssignments.filter(
    (a) => !a.matched && !isPlaceholderEmail(a.email),
  ).length;
  const chairsPlaceholder = chairAssignments.filter((a) =>
    isPlaceholderEmail(a.email),
  ).length;
  console.log(
    `  Chair assignments: ${chairsMatched} matched, ${chairsUnmatched} unmatched, ${chairsPlaceholder} placeholder`,
  );
  for (const a of chairAssignments.filter(
    (a) => !a.matched && !isPlaceholderEmail(a.email),
  )) {
    console.log(
      `    × ${a.email} → ${a.role} of ${a.groupName}  (no user with that email)`,
    );
  }

  if (memberAssignments.length) {
    const membersMatched = memberAssignments.filter((m) => m.matched).length;
    console.log(
      `  Initial members: ${membersMatched} matched, ${memberAssignments.length - membersMatched} unmatched/ambiguous`,
    );
  }
  console.log("");
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  const dotEnv = fs.readFileSync(
    path.join(REPO_ROOT, "packages/api/.dev.vars"),
    "utf8",
  );
  const dbUrl = dotEnv.match(/DATABASE_URL=['"]?([^'"\n]+)/)?.[1];
  if (!dbUrl) throw new Error("DATABASE_URL not found in .dev.vars");
  const sql = neon(dbUrl);

  console.log(
    COMMIT
      ? "=== COMMIT mode — writes will land ===\n"
      : "=== DRY-RUN mode (default) — no writes ===\n",
  );

  await importGroups(sql, "working_group", WORKING_CSV);
  await importGroups(sql, "affinity_group", AFFINITY_CSV);

  console.log(
    COMMIT
      ? "=== COMMITTED ==="
      : "=== DRY-RUN — re-run with --commit to apply ===",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
