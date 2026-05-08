/**
 * Stage 2 institution dedupe — collapse normalized-form duplicates.
 *
 * Examples in scope:
 *   - "Argonne National Lab." → "Argonne National Laboratory"
 *   - "The University of Washington" → "University of Washington"
 *   - "Sandia National Labs" → "Sandia National Laboratories"
 *
 * Strategy:
 *   1. Normalize each canonical name (lowercase, strip "the", expand
 *      lab→laboratory, strip punctuation).
 *   2. Group rows that share a normalized form. Skip rows already
 *      merged.
 *   3. Within a group, pick canonical = (highest user_count, tie-break
 *      by longest name).
 *   4. For each non-canonical row:
 *      - Repoint user_institutions.institution_id to canonical, ON
 *        CONFLICT (user, canonical) preserve existing — drop the dupe.
 *      - Set institutions.merged_into_id = canonical, status='rejected'.
 *   5. Make sure canonical has status='approved'.
 *
 * Idempotent: re-running is safe — already-merged rows are skipped.
 *
 * Usage:
 *   tsx scripts/merge-stage2-dupes.ts [--dry-run]
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

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

function normalize(s: string): string {
  let t = s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  t = t.replace(/^the\s+/, "");
  t = t.replace(/\b(laboratory|laboratories|labs)\b/g, "lab");
  t = t.replace(/\b(university)\b/g, "univ");
  t = t.replace(/\b(institute|institut)\b/g, "inst");
  t = t.replace(/[.,'()\-–—]/g, " ");
  t = t.replace(/[^a-z0-9 ]/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

interface Row {
  id: string;
  name: string;
  status: string;
  user_count: number;
}

async function main() {
  const sql = neon(databaseUrl!);

  const rows = (await sql.query(
    `SELECT i.id, i.name, i.status,
       (SELECT COUNT(*)::int FROM user_institutions ui WHERE ui.institution_id = i.id) AS user_count
     FROM institutions i
     WHERE i.merged_into_id IS NULL`
  )) as Row[];
  console.log(`${rows.length} unmerged institutions`);

  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const k = normalize(r.name);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }
  const dupeGroups = [...groups.entries()].filter(([, rs]) => rs.length >= 2);
  console.log(`${dupeGroups.length} dupe groups, ${dupeGroups.reduce((a, [, rs]) => a + rs.length, 0)} rows in dupe groups`);

  let mergedCount = 0;
  let repointedRows = 0;
  let droppedConflicts = 0;
  let canonicalApproved = 0;

  for (const [norm, members] of dupeGroups) {
    // Pick canonical: highest user_count, tie-break longest name (more
    // formal versions win — "Laboratory" over "Lab").
    const sorted = [...members].sort((a, b) => {
      if (b.user_count !== a.user_count) return b.user_count - a.user_count;
      return b.name.length - a.name.length;
    });
    const canonical = sorted[0];
    const dupes = sorted.slice(1);

    console.log(
      `[${norm}] canonical: "${canonical.name}" (${canonical.user_count} users), merging ${dupes.length}: ${dupes.map((d) => `"${d.name}"`).join(", ")}`
    );

    if (dryRun) {
      mergedCount += dupes.length;
      repointedRows += dupes.reduce((a, d) => a + d.user_count, 0);
      continue;
    }

    if (canonical.status !== "approved") {
      await sql.query(
        `UPDATE institutions SET status = 'approved' WHERE id = $1`,
        [canonical.id]
      );
      canonicalApproved++;
    }

    for (const dupe of dupes) {
      // Repoint user_institutions rows. Some users may already have
      // an affiliation with the canonical — those updates would
      // violate the (user, institution) unique index, so we resolve
      // the collision first by deleting the dupe-side row.
      const dupeLinks = (await sql.query(
        `SELECT id, user_id FROM user_institutions WHERE institution_id = $1`,
        [dupe.id]
      )) as { id: string; user_id: string }[];
      for (const link of dupeLinks) {
        const collide = (await sql.query(
          `SELECT id FROM user_institutions
           WHERE user_id = $1 AND institution_id = $2`,
          [link.user_id, canonical.id]
        )) as { id: string }[];
        if (collide.length > 0) {
          await sql.query(
            `DELETE FROM user_institutions WHERE id = $1`,
            [link.id]
          );
          droppedConflicts++;
        } else {
          await sql.query(
            `UPDATE user_institutions
             SET institution_id = $1, updated_at = now()
             WHERE id = $2`,
            [canonical.id, link.id]
          );
          repointedRows++;
        }
      }

      // Mark dupe merged + rejected so it stops appearing as a
      // pickable vocab option.
      await sql.query(
        `UPDATE institutions
         SET merged_into_id = $1, status = 'rejected'
         WHERE id = $2`,
        [canonical.id, dupe.id]
      );
      mergedCount++;
    }
  }

  console.log(
    `Merged ${mergedCount} institutions ` +
      `(approved ${canonicalApproved} canonicals; ` +
      `repointed ${repointedRows} user_institutions rows, ` +
      `dropped ${droppedConflicts} conflicts).`
  );

  if (dryRun) {
    console.log("Dry run — no writes performed.");
    return;
  }

  const finalCounts = await sql.query(
    `SELECT
       (SELECT COUNT(*) FROM institutions WHERE merged_into_id IS NULL) AS active,
       (SELECT COUNT(*) FROM institutions WHERE merged_into_id IS NOT NULL) AS merged,
       (SELECT COUNT(*) FROM user_institutions) AS affil_total,
       (SELECT COUNT(*) FILTER (WHERE is_primary) FROM user_institutions) AS primaries`
  );
  console.log("Final counts:", finalCounts);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
