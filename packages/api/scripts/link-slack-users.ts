import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import {
  emailLocal,
  normalizeName,
  pickBestMatch,
  type Confidence,
  type SlackUser,
  type RseUser,
} from "./lib/slackMatch";

const __filename = fileURLToPath(import.meta.url);

// ─── CSV parser ──────────────────────────────────────────────────────────────

function parseCsv(raw: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuote = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inQuote) {
      if (c === '"') {
        if (raw[i + 1] === '"') { field += '"'; i++; }
        else inQuote = false;
      } else field += c;
    } else {
      if (c === '"') inQuote = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") {
        row.push(field); field = "";
        if (row.some((x) => x.length > 0)) rows.push(row);
        row = [];
      } else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field || row.length) { row.push(field); if (row.some((x) => x.length > 0)) rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = r[i] ?? ""; });
    return obj;
  });
}

// ─── Flags ───────────────────────────────────────────────────────────────────

interface Flags {
  commit: boolean;
  membershipsOnly: boolean; // skip the slack_username write pass
}
function parseArgs(argv: string[]): Flags {
  return {
    commit: argv.includes("--commit"),
    membershipsOnly: argv.includes("--memberships-only"),
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const conn = process.env.DATABASE_URL;
  if (!conn) { console.error("DATABASE_URL not set"); process.exit(1); }

  const sql = neon(conn);

  // Locate the CSV.
  const csvPath = path.resolve(
    path.dirname(__filename),
    "..", "..", "..",  // → repo root
    ".data/us-rse-groups.csv"
  );
  const csvRaw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(csvRaw);

  // 1. Collect unique slack users (and the channels they appear in).
  const slackUserMap = new Map<string, { user: SlackUser; channels: Set<string> }>();
  for (const r of rows) {
    const username = r.member_username;
    if (!username) continue;
    const channel = r.channel_name;
    const entry = slackUserMap.get(username) ?? {
      user: { username, displayName: r.member_display_name ?? "" },
      channels: new Set<string>(),
    };
    // Update display name if previously empty.
    if (!entry.user.displayName && r.member_display_name) {
      entry.user.displayName = r.member_display_name;
    }
    if (channel) entry.channels.add(channel);
    slackUserMap.set(username, entry);
  }
  console.log(`Slack users in CSV: ${slackUserMap.size}`);

  // 2. Load all US-RSE users (active, not merged/deleted).
  // Note: profiles does not have given_name / family_name columns; we omit them.
  const dbUsers = (await sql`
    SELECT
      u.id,
      u.email,
      p.display_name  AS "displayName",
      p.slack_username AS "slackUsername"
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.deleted_at IS NULL AND u.merged_into_user_id IS NULL
  `) as Array<RseUser & { slackUsername: string | null }>;
  console.log(`Active US-RSE users: ${dbUsers.length}`);

  // 3. Match pass — build slackUsername → userId map.
  type Decision = {
    slackUser: SlackUser;
    rseUserId: string | null;
    confidence: Confidence;
    reasons: string[];
    skippedAlreadySet: boolean;
  };
  const decisions: Decision[] = [];
  const alreadySet = new Map<string, string>(); // slackUsername → userId
  for (const u of dbUsers) {
    if (u.slackUsername) alreadySet.set(u.slackUsername.toLowerCase(), u.id);
  }

  for (const [, entry] of slackUserMap) {
    const slack = entry.user;
    if (alreadySet.has(slack.username.toLowerCase())) {
      decisions.push({
        slackUser: slack,
        rseUserId: alreadySet.get(slack.username.toLowerCase())!,
        confidence: "high",
        reasons: ["already_set"],
        skippedAlreadySet: true,
      });
      continue;
    }

    // Build candidate set: any user where displayName fuzz-matches OR
    // email local part overlaps with the slack username. Cheaper than
    // scoring every user × every slack user.
    const slackNorm = normalizeName(slack.username);
    const slackDispNorm = slack.displayName ? normalizeName(slack.displayName) : "";

    const candidates = dbUsers.filter((u) => {
      const dispNorm = u.displayName ? normalizeName(u.displayName) : "";
      const emailLocalNorm = u.email ? normalizeName(emailLocal(u.email)) : "";

      return (
        (slackDispNorm && dispNorm && (dispNorm === slackDispNorm || dispNorm.includes(slackDispNorm))) ||
        (emailLocalNorm && (emailLocalNorm === slackNorm || emailLocalNorm.includes(slackNorm)))
      );
    });

    const decision = pickBestMatch(slack, candidates);
    decisions.push({
      slackUser: slack,
      rseUserId: decision.rseUserId,
      confidence: decision.confidence,
      reasons: decision.reasons,
      skippedAlreadySet: false,
    });
  }

  // 4. Write a CSV report regardless of --commit (always useful).
  const reviewCsv: string[] = ["slack_username,slack_display_name,confidence,rse_user_id,reasons,channels"];
  let highCount = 0, medCount = 0, lowCount = 0, noneCount = 0, alreadyCount = 0;
  const matchedUserIds = new Map<string, string>(); // slackUsername → userId (for memberships pass)
  for (const d of decisions) {
    const slack = d.slackUser;
    const channels = [...(slackUserMap.get(slack.username)?.channels ?? [])].join("|");
    reviewCsv.push([
      slack.username,
      `"${(slack.displayName ?? "").replace(/"/g, '""')}"`,
      d.confidence,
      d.rseUserId ?? "",
      `"${d.reasons.join("+")}"`,
      `"${channels}"`,
    ].join(","));
    if (d.skippedAlreadySet) alreadyCount++;
    else if (d.confidence === "high") highCount++;
    else if (d.confidence === "medium") medCount++;
    else if (d.confidence === "low") lowCount++;
    else noneCount++;
    if (d.rseUserId && (d.confidence === "high" || d.confidence === "medium" || d.skippedAlreadySet)) {
      matchedUserIds.set(slack.username, d.rseUserId);
    }
  }
  const reviewPath = path.resolve(
    path.dirname(__filename),
    `slack-link-${flags.commit ? "applied" : "dry-run"}.csv`
  );
  fs.writeFileSync(reviewPath, reviewCsv.join("\n") + "\n");

  console.log(`\nMatch breakdown:`);
  console.log(`  already_set: ${alreadyCount}`);
  console.log(`  high:        ${highCount} (auto-write)`);
  console.log(`  medium:      ${medCount} (auto-write, admin review)`);
  console.log(`  low:         ${lowCount} (admin review)`);
  console.log(`  none:        ${noneCount}`);
  console.log(`Review CSV: ${reviewPath}`);

  // 5. Slack-username write pass (high + medium).
  if (!flags.membershipsOnly) {
    let writes = 0;
    for (const d of decisions) {
      if (d.skippedAlreadySet) continue;
      if (!d.rseUserId) continue;
      if (d.confidence !== "high" && d.confidence !== "medium") continue;
      writes++;
      if (flags.commit) {
        try {
          await sql`
            UPDATE profiles
            SET slack_username = ${d.slackUser.username}, updated_at = now()
            WHERE user_id = ${d.rseUserId} AND (slack_username IS NULL OR slack_username = '')
          `;
        } catch (e) {
          console.error(`  fail ${d.slackUser.username} → ${d.rseUserId}: ${(e as Error).message}`);
        }
      }
    }
    console.log(`Slack-username writes: ${writes}`);
  }

  // 6. Group memberships pass.
  // Build channelName → group id map.
  const groupsByChannel = await sql`
    SELECT id, slack_channel FROM groups
    WHERE deleted_at IS NULL AND slack_channel IS NOT NULL
  `;
  const groupIdByChannel = new Map<string, string>();
  for (const g of groupsByChannel as Array<{ id: string; slack_channel: string }>) {
    groupIdByChannel.set(g.slack_channel.toLowerCase(), g.id);
  }

  let membershipsToInsert = 0;
  let membershipsInserted = 0;
  let membershipsSkipped = 0;
  for (const r of rows) {
    const username = r.member_username;
    const channel = r.channel_name;
    if (!username || !channel) continue;
    const userId = matchedUserIds.get(username);
    if (!userId) { membershipsSkipped++; continue; }
    const groupId = groupIdByChannel.get(channel.toLowerCase());
    if (!groupId) { membershipsSkipped++; continue; }
    membershipsToInsert++;
    if (flags.commit) {
      try {
        // group_memberships has no is_active column; active membership is
        // inferred by left_at IS NULL. joined_at defaults to now() on insert.
        await sql`
          INSERT INTO group_memberships (user_id, group_id, role)
          VALUES (${userId}, ${groupId}, 'member')
          ON CONFLICT (user_id, group_id) DO NOTHING
        `;
        membershipsInserted++;
      } catch (e) {
        console.error(`  membership fail: ${(e as Error).message}`);
      }
    }
  }
  console.log(`\nGroup memberships:`);
  console.log(`  candidates: ${membershipsToInsert}`);
  console.log(`  inserted:   ${flags.commit ? membershipsInserted : "(dry-run)"}`);
  console.log(`  skipped:    ${membershipsSkipped} (unmatched slack user or unknown channel)`);

  if (!flags.commit) console.log("\n=== Re-run with --commit to apply ===");
}

const isMain = process.argv[1] && process.argv[1].endsWith(path.basename(__filename));
if (isMain) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
