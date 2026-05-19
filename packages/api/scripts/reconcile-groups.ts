#!/usr/bin/env tsx
/**
 * Reconcile the Slack channel export (.data/us-rse-groups.csv) against the
 * groups table.
 *
 * For each channel in the CSV the script will:
 *   - Find a matching DB group (by normalized slack_channel or slug).
 *   - If matched:
 *       • Normalize slack_channel to the canonical CSV form if it has drifted.
 *       • Backfill description from the channel purpose when the DB column is
 *         null/empty and the CSV has content.
 *   - If unmatched: insert a new group row (is_published=false so admins
 *     review before the group appears publicly).
 *
 * Runs in dry-run mode by default.
 * Pass --commit to write changes to the database.
 *
 * Usage:
 *   npx tsx scripts/reconcile-groups.ts           # dry-run
 *   npx tsx scripts/reconcile-groups.ts --commit  # apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { createDb } from "../src/db";
import { groups } from "../src/db/schema";
import { buildSlug } from "../src/lib/slug";
import {
  channelTypeToGroupType,
  deriveDisplayName,
  matchExistingGroup,
  stripTypePrefix,
  type CsvType,
  type GroupType,
} from "./lib/groupReconcile";

const __filename = fileURLToPath(import.meta.url);

// ─── CSV parser ──────────────────────────────────────────────────────────────
// Minimal RFC 4180 parser: handles quoted fields with embedded commas/newlines
// and escaped double-quotes (""). The `purpose` column commonly contains commas.
function parseCsv(raw: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuote = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inQuote) {
      if (c === '"') {
        if (raw[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuote = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        field = "";
        if (row.some((x) => x.length > 0)) rows.push(row);
        row = [];
      } else if (c === "\r") {
        /* skip */
      } else {
        field += c;
      }
    }
  }
  // Flush final row.
  if (field || row.length) {
    row.push(field);
    if (row.some((x) => x.length > 0)) rows.push(row);
  }

  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h] = r[i] ?? "";
    });
    return obj;
  });
}

// ─── Channel snapshot ────────────────────────────────────────────────────────
interface ChannelSnapshot {
  type: CsvType;
  name: string;
  channelId: string;
  purpose: string;
  memberCount: number;
}

/**
 * Collapse the per-member rows into one snapshot per unique channel_name.
 */
function summarizeChannels(rows: Array<Record<string, string>>): ChannelSnapshot[] {
  const map = new Map<string, ChannelSnapshot>();
  for (const r of rows) {
    const name = r.channel_name;
    if (!name) continue;
    const existing = map.get(name);
    if (existing) {
      existing.memberCount++;
    } else {
      map.set(name, {
        type: r.channel_type as CsvType,
        name,
        channelId: r.channel_id ?? "",
        purpose: r.purpose ?? "",
        memberCount: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ─── CLI flags ───────────────────────────────────────────────────────────────
interface Flags {
  commit: boolean;
}

function parseArgs(argv: string[]): Flags {
  return { commit: argv.includes("--commit") };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const flags = parseArgs(process.argv.slice(2));

  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  // Locate the canonical CSV relative to the repo root.
  const csvPath = path.resolve(
    path.dirname(__filename),
    "..",  // packages/api/
    "..",  // packages/
    "..",  // repo root
    ".data/us-rse-groups.csv"
  );
  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(raw);
  const channels = summarizeChannels(rows);

  const db = createDb(conn);
  const existing = await db
    .select({
      id: groups.id,
      slug: groups.slug,
      type: groups.type,
      slackChannel: groups.slackChannel,
      description: groups.description,
    })
    .from(groups);

  const groupsByType: Record<GroupType, typeof existing> = {
    working_group: [],
    affinity_group: [],
    regional_group: [],
  };
  for (const g of existing) {
    groupsByType[g.type as GroupType].push(g);
  }

  console.log(`=== ${flags.commit ? "COMMIT" : "DRY-RUN"} mode ===`);
  console.log(`Channels in CSV: ${channels.length}`);
  console.log(`Existing DB groups: ${existing.length}`);
  console.log("");

  const csvOut: string[] = ["channel,group_slug,action,detail"];
  let updated = 0;
  let inserted = 0;
  let unchanged = 0;

  for (const ch of channels) {
    const match = matchExistingGroup(ch, groupsByType);

    if (match) {
      const updates: Record<string, unknown> = {};

      // Normalize slack_channel to the CSV canonical form when it has drifted.
      if (match.slackChannel !== ch.name) {
        updates.slackChannel = ch.name;
      }

      // Backfill description only when the DB is null/empty and CSV has content.
      if (
        (!match.description || match.description.trim() === "") &&
        ch.purpose.trim() !== ""
      ) {
        updates.description = ch.purpose.trim();
      }

      if (Object.keys(updates).length === 0) {
        unchanged++;
        csvOut.push(`${ch.name},${match.slug},unchanged,`);
      } else {
        updated++;
        const detail = Object.keys(updates).join("+");
        csvOut.push(`${ch.name},${match.slug},update,"${detail}"`);
        if (flags.commit) {
          await db
            .update(groups)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(groups.id, match.id));
        }
      }
    } else {
      // No matching group — insert a new one.
      const groupType = channelTypeToGroupType(ch.type);
      const suffix = stripTypePrefix(ch.name);
      const baseSlug = buildSlug(suffix);
      const displaySuffix = deriveDisplayName(suffix);
      const label =
        groupType === "working_group"
          ? "Working Group"
          : groupType === "affinity_group"
          ? "Affinity Group"
          : "Regional Group";
      const name = `${displaySuffix} ${label}`;

      inserted++;
      csvOut.push(`${ch.name},${baseSlug},insert,"type=${groupType}"`);

      if (flags.commit) {
        await db.insert(groups).values({
          name,
          slug: baseSlug,
          type: groupType,
          slackChannel: ch.name,
          description: ch.purpose.trim() || null,
          isActive: true,
          isPublished: false, // admin reviews before publishing
        } as Parameters<typeof db.insert>[0] extends never ? never : any);
      }
    }
  }

  // Write the report CSV alongside the runner.
  const reportName = `group-reconcile-${flags.commit ? "applied" : "dry-run"}.csv`;
  const reportPath = path.resolve(path.dirname(__filename), reportName);
  fs.writeFileSync(reportPath, csvOut.join("\n") + "\n");

  console.log(`Summary:`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Inserted:  ${inserted}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`\nReport written to: ${reportPath}`);

  if (!flags.commit) {
    console.log("\n=== Re-run with --commit to apply ===");
  }
}

// ─── Entry point guard ───────────────────────────────────────────────────────
// Prevents main() from firing when this module is imported by tests.
const isMain =
  process.argv[1] && process.argv[1].endsWith(path.basename(__filename));
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
