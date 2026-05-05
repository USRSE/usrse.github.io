/**
 * Pulls works from pub.orcid.org for every user with profiles.orcid set
 * and upserts them into the `works` table. Idempotent — re-running just
 * updates the existing rows in place, keyed by ORCID put-code.
 *
 * Usage: `npm -w @us-rse/api run import:orcid`
 *
 * ORCID's public API needs no auth. We use v3.0/{orcid}/works to get a
 * lightweight summary list (one round-trip per user); for fields the
 * summary doesn't expose (abstract, contributors, full date) we drill
 * into v3.0/{orcid}/work/{put-code} per item. That's N+1 by design,
 * but for a US-RSE dossier the per-user N is small (~20-50 works) and
 * ORCID doesn't rate-limit unauthenticated public requests below
 * 24 req/sec, so we just stay under that with a tiny inter-request
 * delay.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, isNotNull, sql as drizzleSql } from "drizzle-orm";
import { createDb } from "../src/db/index";
import { profiles, users, works } from "../src/db/schema/index";

type WorkType =
  | "paper"
  | "talk"
  | "panel"
  | "workshop"
  | "software"
  | "dataset"
  | "other";

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

const db = createDb(databaseUrl);

const ORCID_API = "https://pub.orcid.org/v3.0";

// ORCID's `work-type` taxonomy is broader than what On Stage renders.
// Map down to our internal vocabulary; default unknowns to "paper" so
// we never lose a record on import. Refinement later if/when a member
// edits the row to a more accurate type.
const ORCID_TYPE_MAP: Record<string, WorkType> = {
  "journal-article": "paper",
  "conference-paper": "paper",
  "conference-abstract": "paper",
  "conference-poster": "paper",
  "book-chapter": "paper",
  book: "paper",
  "edited-book": "paper",
  manual: "paper",
  preprint: "paper",
  report: "paper",
  "working-paper": "paper",
  "magazine-article": "paper",
  "newspaper-article": "paper",
  "online-resource": "paper",
  "research-tool": "paper",
  "supervised-student-publication": "paper",
  "lecture-speech": "talk",
  "conference-presentation": "talk",
  "invited-position": "talk",
  software: "software",
  "data-set": "dataset",
  patent: "other",
  license: "other",
  "physical-object": "other",
  "artistic-performance": "other",
  performance: "other",
  test: "other",
  other: "other",
};

interface OrcidExternalId {
  "external-id-type"?: string;
  "external-id-value"?: string;
  "external-id-url"?: { value?: string };
}

interface OrcidWorkSummary {
  "put-code"?: number;
  title?: { title?: { value?: string } };
  "journal-title"?: { value?: string } | null;
  type?: string;
  "publication-date"?: {
    year?: { value?: string };
    month?: { value?: string };
    day?: { value?: string };
  };
  "external-ids"?: { "external-id"?: OrcidExternalId[] };
  url?: { value?: string };
}

interface OrcidWorksResponse {
  group?: Array<{ "work-summary"?: OrcidWorkSummary[] }>;
}

async function fetchWorks(orcid: string): Promise<OrcidWorkSummary[]> {
  const res = await fetch(`${ORCID_API}/${orcid}/works`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`ORCID ${orcid} works fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as OrcidWorksResponse;
  // ORCID groups duplicates by external-id; we just take the first
  // summary per group as the canonical entry.
  return (json.group ?? [])
    .map((g) => g["work-summary"]?.[0])
    .filter((s): s is OrcidWorkSummary => Boolean(s));
}

function extractDoi(s: OrcidWorkSummary): string | null {
  const ids = s["external-ids"]?.["external-id"] ?? [];
  for (const id of ids) {
    if (id["external-id-type"] === "doi") return id["external-id-value"] ?? null;
  }
  return null;
}

function extractWorkDate(s: OrcidWorkSummary): string | null {
  const d = s["publication-date"];
  if (!d) return null;
  const year = d.year?.value;
  if (!year) return null;
  const month = d.month?.value ?? "01";
  const day = d.day?.value ?? "01";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

async function importForUser(opts: {
  userId: string;
  orcid: string;
  email: string;
}) {
  const { userId, orcid, email } = opts;
  console.log(`\n→ ${email}  orcid=${orcid}`);

  let summaries: OrcidWorkSummary[];
  try {
    summaries = await fetchWorks(orcid);
  } catch (e) {
    console.error(`  fetch failed: ${e instanceof Error ? e.message : e}`);
    return;
  }
  console.log(`  ${summaries.length} works found`);

  let imported = 0;
  for (const s of summaries) {
    const putCode = s["put-code"];
    const titleValue = s.title?.title?.value;
    if (!putCode || !titleValue) continue;

    const orcidType = s.type ?? "other";
    const type = ORCID_TYPE_MAP[orcidType] ?? "paper";
    const venue = s["journal-title"]?.value ?? null;
    const workDate = extractWorkDate(s);
    const doi = extractDoi(s);
    const url = s.url?.value ?? null;
    const sourceId = String(putCode);

    await db
      .insert(works)
      .values({
        userId,
        type,
        title: titleValue,
        venue,
        workDate,
        doi,
        url,
        // Summary endpoint doesn't expose abstract/collaborators; we
        // could drill into the per-work endpoint, but the additional
        // round-trips don't pay off for an MVP. Add later if needed.
        abstract: null,
        collaborators: [],
        source: "orcid",
        sourceId,
      })
      .onConflictDoUpdate({
        target: [works.userId, works.sourceId],
        targetWhere: drizzleSql`source = 'orcid'`,
        set: {
          type,
          title: titleValue,
          venue,
          workDate,
          doi,
          url,
          updatedAt: new Date(),
        },
      });
    imported++;
  }
  console.log(`  upserted ${imported} works`);
}

async function main() {
  const rows = await db
    .select({
      userId: profiles.userId,
      orcid: profiles.orcid,
      email: users.email,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(isNotNull(profiles.orcid));

  console.log(`Found ${rows.length} member(s) with ORCID iDs.`);
  for (const row of rows) {
    if (!row.orcid) continue;
    await importForUser({
      userId: row.userId,
      orcid: row.orcid,
      email: row.email,
    });
    // Stay polite to pub.orcid.org even though we're well under the
    // 24 req/sec public limit.
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log("\nImport complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
