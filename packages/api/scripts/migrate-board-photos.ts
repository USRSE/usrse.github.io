/**
 * One-shot migration: move the current Board of Directors' (+ ED's)
 * photos from `apps/web/public/images/board-of-directors/` into the
 * usrse-profile-photos R2 bucket, set isPublic=true on each profile,
 * and wire profiles.photoUrl / photoStorageKey to the new R2 objects.
 *
 * Usage:
 *   tsx scripts/migrate-board-photos.ts            # dry-run, no writes
 *   tsx scripts/migrate-board-photos.ts --commit   # do it for real
 *
 * Idempotent in the dry-run sense (re-running --commit creates new R2
 * objects each time because the key is timestamped; the prior R2 object
 * is best-effort deleted via `wrangler r2 object delete` before the new
 * write so we don't leak orphans). The script does NOT delete the
 * source files from public/ — that's a separate frontend commit so the
 * BoardPage swap can be reviewed alongside the deletion.
 *
 * Talks to R2 by shelling out to `wrangler r2 object put` (uses the
 * locally-authenticated wrangler), and to the DB via the existing
 * Drizzle/neon-http client (.dev.vars DATABASE_URL).
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { createDb } from "../src/db";
import { profiles, users } from "../src/db/schema";

// ── Roster ─────────────────────────────────────────────────────────
// Display names must match the values on profiles.display_name. The
// matching is case-insensitive but otherwise exact (no fuzzy logic) —
// if a name is off by one character the script will skip that member
// and you'll see it in the report.

interface RosterEntry {
  displayName: string;
  photoFile: string;
  /** Optional disambiguator when multiple users share a displayName.
   *  E.g., Cordero has two legacy rows (gmail + uw.edu); set email to
   *  pin the migration to the canonical row. */
  email?: string;
}

const ROSTER: readonly RosterEntry[] = [
  { displayName: "Keith Beattie", photoFile: "keith-beattie.jpeg" },
  { displayName: "Jeffrey C. Carver", photoFile: "jeff-carver.jpeg" },
  {
    displayName: "Cordero Core",
    photoFile: "cordero-core.jpeg",
    email: "cdcore09@gmail.com",
  },
  { displayName: "Ian Cosden", photoFile: "ian-cosden.jpeg" },
  { displayName: "Julia Damerow", photoFile: "julia-damerow.jpeg" },
  { displayName: "Alex Koufos", photoFile: "alex-koufos.jpeg" },
  { displayName: "Miranda Mundt", photoFile: "miranda-mundt.jpeg" },
  { displayName: "Abbey Roelofs", photoFile: "abbey-roelofs.jpeg" },
  { displayName: "Pengyin Shan", photoFile: "pengyin-shan.png" },
  { displayName: "Sandra Gesing", photoFile: "sandra-gesing.jpeg" },
] as const;

// ── Constants tied to the deployed worker config ───────────────────

const BUCKET = "usrse-profile-photos";
const PUBLIC_BASE_URL = "https://pub-12a8fe7ab15d4128be3f4867cc11b99f.r2.dev";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = resolve(
  __dirname,
  "../../../apps/web/public/images/board-of-directors"
);

// ── Env wiring (mirrors import-orcid.ts) ───────────────────────────

function loadDevVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const contents = readFileSync(resolve(__dirname, "..", ".dev.vars"), "utf8");
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

// ── Byte sniffing (mirrors lib/storage.ts) ─────────────────────────

type Ext = "jpg" | "png" | "webp";

function sniffExt(bytes: Uint8Array): Ext | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

const MIME: Record<Ext, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function buildKey(userId: string, ext: Ext): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `profiles/${userId}/${ts}-${rand}.${ext}`;
}

// ── Wrangler R2 shell-outs ─────────────────────────────────────────

function r2Put(key: string, filePath: string, mime: string): void {
  // --remote bypasses the local R2 emulator; --content-type sets the
  // object's Content-Type so the public URL is served as an image.
  execSync(
    `wrangler r2 object put '${BUCKET}/${key}' --file '${filePath}' --content-type '${mime}' --remote`,
    { stdio: "pipe", cwd: resolve(__dirname, "..") }
  );
}

function r2Delete(key: string): void {
  try {
    execSync(`wrangler r2 object delete '${BUCKET}/${key}' --remote`, {
      stdio: "pipe",
      cwd: resolve(__dirname, ".."),
    });
  } catch (e) {
    // Don't fail on prior-object cleanup — orphan is recoverable, a
    // failed migration is not.
    console.warn(
      `  prior R2 object cleanup failed for ${key}: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }
}

// ── Main ────────────────────────────────────────────────────────────

interface MatchedMember {
  roster: RosterEntry;
  userId: string;
  memberId: string;
  slug: string;
  currentPhotoStorageKey: string | null;
  filePath: string;
  bytes: Uint8Array;
  ext: Ext;
  projectedKey: string;
  projectedUrl: string;
}

type Skip = { roster: RosterEntry; reason: string };

async function main() {
  const commit = process.argv.includes("--commit");
  const db = createDb(databaseUrl!);

  // Print which DB host we're targeting so the operator can sanity-
  // check before pulling the trigger.
  const hostMatch = databaseUrl!.match(/@([^/]+)/);
  console.log(`Target DB host : ${hostMatch?.[1] ?? "(unknown)"}`);
  console.log(`R2 bucket      : ${BUCKET}`);
  console.log(`Public base    : ${PUBLIC_BASE_URL}`);
  console.log(`Mode           : ${commit ? "COMMIT (will mutate!)" : "dry-run"}`);
  console.log();

  const matched: MatchedMember[] = [];
  const skipped: Skip[] = [];

  for (const r of ROSTER) {
    // Case-insensitive exact-name match against profiles.display_name,
    // optionally narrowed by email when the roster supplies one
    // (disambiguates legacy-import duplicate rows).
    const rows = await db
      .select({
        userId: users.id,
        memberId: users.memberId,
        email: users.email,
        slug: profiles.slug,
        photoStorageKey: profiles.photoStorageKey,
      })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(sql`LOWER(${profiles.displayName}) = LOWER(${r.displayName})`)
      .limit(5);

    let candidates = rows;
    if (r.email && rows.length > 1) {
      candidates = rows.filter(
        (row) => row.email.toLowerCase() === r.email!.toLowerCase()
      );
    }

    if (candidates.length === 0) {
      skipped.push({
        roster: r,
        reason: r.email
          ? `no profile row with displayName=${r.displayName} AND email=${r.email}`
          : "no profile row with that displayName",
      });
      continue;
    }
    if (candidates.length > 1) {
      skipped.push({
        roster: r,
        reason: `${candidates.length} matches — ambiguous, refusing to guess (consider adding email to ROSTER)`,
      });
      continue;
    }

    const filePath = resolve(PHOTO_DIR, r.photoFile);
    if (!existsSync(filePath)) {
      skipped.push({ roster: r, reason: `photo file missing: ${filePath}` });
      continue;
    }
    const bytes = new Uint8Array(readFileSync(filePath));
    const ext = sniffExt(bytes);
    if (!ext) {
      skipped.push({
        roster: r,
        reason: `bytes don't sniff as JPEG/PNG/WebP (${filePath})`,
      });
      continue;
    }

    const projectedKey = buildKey(candidates[0].userId, ext);
    matched.push({
      roster: r,
      userId: candidates[0].userId,
      memberId: candidates[0].memberId,
      slug: candidates[0].slug,
      currentPhotoStorageKey: candidates[0].photoStorageKey,
      filePath,
      bytes,
      ext,
      projectedKey,
      projectedUrl: `${PUBLIC_BASE_URL}/${projectedKey}`,
    });
  }

  // ── Recon report ────────────────────────────────────────────────
  console.log(`Matched ${matched.length} / ${ROSTER.length}`);
  for (const m of matched) {
    console.log(
      `  ✓ ${m.roster.displayName.padEnd(22)} | memberId=${m.memberId.padEnd(8)} slug=${m.slug.padEnd(30)} ext=${m.ext} bytes=${m.bytes.length}` +
        (m.currentPhotoStorageKey
          ? ` (replaces ${m.currentPhotoStorageKey})`
          : "")
    );
  }
  if (skipped.length > 0) {
    console.log();
    console.log(`Skipped ${skipped.length}:`);
    for (const s of skipped) {
      console.log(`  ✗ ${s.roster.displayName.padEnd(22)} | ${s.reason}`);
    }
  }
  console.log();

  if (!commit) {
    console.log("dry-run — no R2 writes, no DB updates. Re-run with --commit when ready.");
    console.log();
    console.log("Projected output (for hardcoding into BoardPage / StaffPage):");
    console.log("```ts");
    for (const m of matched) {
      console.log(
        `  { name: ${JSON.stringify(m.roster.displayName)}, slug: ${JSON.stringify(m.slug)}, photoUrl: ${JSON.stringify(m.projectedUrl)} },`
      );
    }
    console.log("```");
    return;
  }

  // ── Commit phase ────────────────────────────────────────────────
  console.log(`Committing ${matched.length} migrations...`);
  for (const m of matched) {
    console.log(`→ ${m.roster.displayName}`);
    // 1. Upload new R2 object.
    r2Put(m.projectedKey, m.filePath, MIME[m.ext]);
    console.log(`  R2 put OK: ${m.projectedKey}`);

    // 2. UPDATE profile row.
    await db
      .update(profiles)
      .set({
        photoUrl: m.projectedUrl,
        photoStorageKey: m.projectedKey,
        isPublic: true,
        isDiscoverable: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, m.userId));
    console.log(`  DB update OK`);

    // 3. Best-effort prior-object cleanup. Runs LAST so a failure
    //    here doesn't strand the profile with a missing photo.
    if (
      m.currentPhotoStorageKey &&
      m.currentPhotoStorageKey !== m.projectedKey
    ) {
      r2Delete(m.currentPhotoStorageKey);
      console.log(`  R2 cleanup: deleted ${m.currentPhotoStorageKey}`);
    }
  }

  console.log();
  console.log("All migrations applied.");
  console.log();
  console.log("Snippet for BoardPage / StaffPage:");
  console.log("```ts");
  for (const m of matched) {
    console.log(
      `  { name: ${JSON.stringify(m.roster.displayName)}, slug: ${JSON.stringify(m.slug)}, photoUrl: ${JSON.stringify(m.projectedUrl)} },`
    );
  }
  console.log("```");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
