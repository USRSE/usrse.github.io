/**
 * One-shot cleanup for the regional_group type drift surfaced by the
 * reconcile-groups run on 2026-05-19:
 *
 *   - Soft-deletes 3 duplicate inserts that landed during the partial
 *     --commit crash (bay-area-ca, chicago-rse, indiana). Their legacy
 *     affinity_group counterparts are already published with member
 *     history, so we keep those and retype them.
 *   - Retypes 7 legacy affinity_group rows that should have been
 *     regional_group from the start. The reconcile script flagged
 *     these as `type_mismatch` but does not auto-retype.
 *   - Repairs the DMV row's slack_channel value — it was set to an
 *     apologetic note instead of the actual channel ("rg-dmv-rse").
 *
 * Dry-run by default; --commit applies.
 */

import { neon } from "@neondatabase/serverless";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

interface SoftDeleteAction {
  kind: "soft_delete";
  slug: string;
  reason: string;
}

interface RetypeAction {
  kind: "retype";
  slug: string;
  fixSlackChannel?: string;
}

type Action = SoftDeleteAction | RetypeAction;

const ACTIONS: Action[] = [
  // Soft-delete the duplicate auto-generated inserts.
  {
    kind: "soft_delete",
    slug: "bay-area-ca",
    reason: "Duplicate of legacy bay-area-california; legacy kept + retyped.",
  },
  {
    kind: "soft_delete",
    slug: "chicago-rse",
    reason: "Duplicate of legacy regional-group-chicago; legacy kept + retyped.",
  },
  {
    kind: "soft_delete",
    slug: "indiana",
    reason: "Duplicate of legacy indiana-regional-group; legacy kept + retyped.",
  },

  // Retype the 7 legacy affinity_group rows whose CSV channel is rg-*.
  { kind: "retype", slug: "bay-area-california" },
  { kind: "retype", slug: "regional-group-chicago" },
  { kind: "retype", slug: "indiana-regional-group" },
  { kind: "retype", slug: "north-carolina-research-software-engineers-nc-rse" },
  { kind: "retype", slug: "new-york-city-rse-regional-group" },
  { kind: "retype", slug: "st-louis-metro-regional-group" },
  // DMV also needs slack_channel repaired — the legacy value embeds an
  // apologetic admin note rather than a real channel handle.
  { kind: "retype", slug: "dmv-rse", fixSlackChannel: "rg-dmv-rse" },
];

async function main() {
  const commit = process.argv.includes("--commit");
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const sql = neon(conn);

  console.log(`=== ${commit ? "COMMIT" : "DRY-RUN"} mode ===\n`);

  for (const action of ACTIONS) {
    const [row] = await sql`
      SELECT id, slug, name, type, slack_channel, deleted_at
      FROM groups
      WHERE slug = ${action.slug}
    `;
    if (!row) {
      console.log(`SKIP  ${action.slug}: not found`);
      continue;
    }

    if (action.kind === "soft_delete") {
      if (row.deleted_at) {
        console.log(`SKIP  ${action.slug}: already soft-deleted`);
        continue;
      }
      console.log(
        `DEL   ${action.slug} (${row.type}) — ${action.reason}`
      );
      if (commit) {
        await sql`UPDATE groups SET deleted_at = now(), updated_at = now() WHERE id = ${row.id}`;
      }
    } else {
      const updates: string[] = [];
      if (row.type !== "regional_group") updates.push(`type→regional_group`);
      if (action.fixSlackChannel && row.slack_channel !== action.fixSlackChannel) {
        updates.push(`slack_channel→${action.fixSlackChannel}`);
      }
      if (updates.length === 0) {
        console.log(`SKIP  ${action.slug}: already correct`);
        continue;
      }
      console.log(`FIX   ${action.slug} — ${updates.join(", ")}`);
      if (commit) {
        if (action.fixSlackChannel) {
          await sql`
            UPDATE groups
            SET type = 'regional_group',
                slack_channel = ${action.fixSlackChannel},
                updated_at = now()
            WHERE id = ${row.id}
          `;
        } else {
          await sql`
            UPDATE groups
            SET type = 'regional_group',
                updated_at = now()
            WHERE id = ${row.id}
          `;
        }
      }
    }
  }

  if (!commit) console.log("\n=== Re-run with --commit to apply ===");
  else console.log("\n=== Done ===");
}

const isMain =
  process.argv[1] && process.argv[1].endsWith(path.basename(__filename));
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
