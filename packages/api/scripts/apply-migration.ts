/**
 * Applies a single migration SQL file via the neon-http driver.
 * Drizzle-kit's `migrate` command uses websockets which hang in some
 * headless environments; this runner uses the same HTTP path the
 * worker uses at runtime, so it always works where the app does.
 *
 * Usage:
 *   tsx scripts/apply-migration.ts migrations/0004_damp_katie_power.sql
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDevVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const contents = readFileSync(
      resolve(__dirname, "..", ".dev.vars"),
      "utf8"
    );
    for (const line of contents.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && m[1] === name)
        return m[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    }
  } catch {
    /* missing .dev.vars in CI is fine */
  }
  return undefined;
}

const databaseUrl = loadDevVar("DATABASE_URL");
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Add it to packages/api/.dev.vars.");
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: tsx scripts/apply-migration.ts <migration-file>");
  process.exit(1);
}

const path = resolve(__dirname, "..", arg);
const raw = readFileSync(path, "utf8");

// Drizzle splits statements with `--> statement-breakpoint` markers.
// Run each one independently — the neon-http driver doesn't accept
// multiple statements per call.
const statements = raw
  .split(/-->\s*statement-breakpoint/g)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const sql = neon(databaseUrl);

console.log(`Applying ${arg}: ${statements.length} statement(s)`);
for (const [i, stmt] of statements.entries()) {
  const preview = stmt.slice(0, 80).replace(/\s+/g, " ");
  console.log(`  ${i + 1}. ${preview}${stmt.length > 80 ? "…" : ""}`);
  try {
    await sql.query(stmt);
  } catch (e) {
    console.error(`Failed on statement ${i + 1}:`, e);
    process.exit(1);
  }
}
console.log("Done.");
