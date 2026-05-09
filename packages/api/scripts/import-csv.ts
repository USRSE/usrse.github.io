/**
 * One-shot legacy member import.
 *
 * Reads .data/us-rse-membership-2026-05-02.csv (Google Forms export)
 * and lands every row into `users` + `profiles`, plus auto-proposes
 * pending `organizations` rows for every unique institution name.
 *
 * Idempotent: re-runs upsert on email so the script can be retried
 * if it fails partway through. createdAt is sourced from the CSV
 * timestamp on every run, so an existing user with a wrong createdAt
 * (e.g., Miranda Mundt at the time of writing) gets corrected.
 *
 * Usage:
 *   npx tsx packages/api/scripts/import-csv.ts
 *
 * Reads DATABASE_URL from packages/api/.dev.vars or the environment.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sql, inArray } from "drizzle-orm";
import { createDb } from "../src/db/index";
import {
  countries,
  engagementTypes,
  organizations,
  profiles,
  userEngagementTypes,
  users,
} from "../src/db/schema/index";
import {
  buildProfileSlug,
  generateMemberId,
} from "../src/lib/member-id";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Env ─────────────────────────────────────────────────────────────

function loadDevVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const contents = readFileSync(resolve(__dirname, "..", ".dev.vars"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && m[1] === name) {
        return m[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      }
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

// ── CSV parser (RFC 4180-ish) ──────────────────────────────────────

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  // Flush any trailing row that lacks a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ── CSV row → typed record ──────────────────────────────────────────

interface CsvRow {
  timestamp: string;
  fullName: string;
  email: string;
  institutionRaw: string;
  groupOrgName: string;
  countryRaw: string;
  engagementRaw: string;
  locationPin: string;
}

function rowToRecord(row: string[]): CsvRow {
  return {
    timestamp: row[0] ?? "",
    fullName: row[1] ?? "",
    email: row[2] ?? "",
    institutionRaw: row[3] ?? "",
    groupOrgName: row[4] ?? "",
    countryRaw: row[5] ?? "",
    engagementRaw: row[6] ?? "",
    locationPin: row[7] ?? "",
  };
}

// ── Field normalizers ───────────────────────────────────────────────

/** Parse "M/D/YYYY H:MM:SS" (US-format, 24-hour) → ISO Date. */
function parseTimestamp(s: string): Date | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const m = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
  );
  if (!m) return null;
  const [, mo, d, y, h, mi, se] = m;
  const date = new Date(
    Date.UTC(
      parseInt(y, 10),
      parseInt(mo, 10) - 1,
      parseInt(d, 10),
      parseInt(h, 10),
      parseInt(mi, 10),
      parseInt(se, 10)
    )
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Lowercase + trim. Returns null on empty. */
function normalizeEmail(s: string): string | null {
  const e = s.trim().toLowerCase();
  if (!e) return null;
  // Permissive — let the unique index reject malformed addresses.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

/** Trim + collapse internal whitespace. Returns null on empty. */
function normalizeWhitespace(s: string): string | null {
  const t = s.trim().replace(/\s+/g, " ");
  return t || null;
}

/**
 * Extract the *primary* institution name when the CSV cell joins
 * multiple with " / " or "; ". Form responses commonly do this when
 * a member has cross-appointments. Take the first segment.
 */
function primaryInstitution(s: string): string | null {
  const trimmed = normalizeWhitespace(s);
  if (!trimmed) return null;
  // Split on " / " or "; " or " | " — but NOT on "&" or commas, because
  // those legitimately appear in single names ("Lawrence Berkeley Lab,
  // Computational Research Division").
  const parts = trimmed.split(/\s+[/|;]\s+/);
  return parts[0]?.trim() || null;
}

/** Slug for institution proposals. */
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
 * Map the CSV's freeform engagement string to a set of vocab slugs.
 * The CSV joins multiple selections with ", " — and one of the
 * selections itself contains commas ("graduate student, postdoc,
 * faculty, etc."). Pure substring matching is more reliable than
 * splitting on commas.
 */
function mapEngagement(s: string): string[] {
  if (!s) return [];
  const lower = s.toLowerCase();
  const out = new Set<string>();
  if (lower.includes("research software engineer") && !lower.startsWith("i manage")) {
    // The "I'm a research software engineer" selection — distinct
    // from "I manage research software engineers" which has its own
    // map below.
    out.add("research_software_engineer");
  }
  if (lower.includes("manage research software engineer") || lower.includes("manage rse")) {
    out.add("manages_rses");
  }
  if (lower.includes("software engineer outside") || lower.includes("software engineer non") || lower.includes("non-research")) {
    out.add("software_engineer_non_research");
  }
  if (lower.includes("use research software")) {
    out.add("uses_research_software");
  }
  if (
    lower.includes("write code for my research") ||
    lower.includes("not as my primary") ||
    lower.includes("secondary activity")
  ) {
    out.add("writes_code_secondary");
  }
  if (
    lower.includes("graduate student") ||
    lower.includes("postdoc") ||
    /\bresearcher\b/.test(lower) ||
    lower.includes("faculty")
  ) {
    out.add("researcher");
  }
  if (lower.includes("ally") || lower.includes("supporter")) {
    out.add("rse_ally");
  }
  return [...out];
}

// ── Country alias map ───────────────────────────────────────────────
//
// CSV uses "United States of America"; vocab uses "United States".
// Add other known aliases as they show up in the data.
const COUNTRY_ALIASES: Record<string, string> = {
  "united states of america": "United States",
  usa: "United States",
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  "south korea": "Korea, Republic of",
  "russia": "Russian Federation",
  "iran": "Iran, Islamic Republic of",
  "vietnam": "Viet Nam",
  "czech republic": "Czechia",
};

function resolveCountryName(raw: string): string | null {
  const trimmed = normalizeWhitespace(raw);
  if (!trimmed) return null;
  const aliased = COUNTRY_ALIASES[trimmed.toLowerCase()];
  return aliased ?? trimmed;
}

// ── Main ────────────────────────────────────────────────────────────

async function importCsv() {
  const csvPath = resolve(__dirname, "..", "..", "..", ".data", "us-rse-membership-2026-05-02.csv");
  const csvText = readFileSync(csvPath, "utf8");
  const rawRows = parseCsv(csvText);
  if (rawRows.length === 0) {
    console.error("Empty CSV.");
    process.exit(1);
  }
  const header = rawRows[0];
  const dataRows = rawRows.slice(1).filter((r) => r.some((c) => c.trim()));
  console.log(`Loaded ${dataRows.length} data rows (header: ${header.length} columns).`);

  const db = createDb(databaseUrl!);

  // ── Pre-load lookups ──────────────────────────────────────────────
  console.log("Loading vocab lookups…");
  const [countryRows, engagementRows, institutionRows] = await Promise.all([
    db.select({ id: countries.id, name: countries.name }).from(countries),
    db.select({ id: engagementTypes.id, slug: engagementTypes.slug }).from(engagementTypes),
    db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations),
  ]);
  const countryByName = new Map<string, string>(
    countryRows.map((c) => [c.name.toLowerCase(), c.id])
  );
  const engagementBySlug = new Map<string, string>(
    engagementRows.map((e) => [e.slug, e.id])
  );
  const institutionByName = new Map<string, string>(
    institutionRows.map((i) => [i.name.toLowerCase(), i.id])
  );
  console.log(
    `  ${countryByName.size} countries, ${engagementBySlug.size} engagement types, ${institutionByName.size} organizations.`
  );

  // ── First pass: collect unique organizations to propose ────────────
  const newInstitutionsByLower = new Map<string, string>(); // lower → canonical (first-seen) form
  for (const r of dataRows) {
    const rec = rowToRecord(r);
    const inst = primaryInstitution(rec.institutionRaw);
    if (!inst) continue;
    const lower = inst.toLowerCase();
    if (institutionByName.has(lower)) continue;
    if (!newInstitutionsByLower.has(lower)) newInstitutionsByLower.set(lower, inst);
  }
  console.log(`Identified ${newInstitutionsByLower.size} new organizations to propose.`);

  if (newInstitutionsByLower.size > 0) {
    // Insert in chunks to stay under any single-statement size limit.
    const toInsert = [...newInstitutionsByLower.entries()].map(([, name]) => ({
      name,
      slug: institutionSlug(name),
      status: "pending" as const,
    }));
    // Slug uniqueness collisions: if two distinct names slugify to the
    // same string ("Penn State" and "PennState" both → "penn-state"),
    // the second insert collides. Suffix collisions with a counter.
    const seenSlugs = new Set<string>(institutionRows.map((i) => i.id /* dummy */));
    void seenSlugs; // not actually used — onConflictDoNothing handles slug collisions
    const chunkSize = 200;
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const result = await db
        .insert(organizations)
        .values(chunk)
        .onConflictDoNothing()
        .returning({ id: organizations.id, name: organizations.name });
      for (const r of result) institutionByName.set(r.name.toLowerCase(), r.id);
      inserted += result.length;
    }
    // Some inserts may have been skipped due to slug collision — pick
    // those up by re-querying by name.
    if (inserted < toInsert.length) {
      const missing = toInsert
        .filter((t) => !institutionByName.has(t.name.toLowerCase()))
        .map((t) => t.name);
      if (missing.length > 0) {
        const refetched = await db
          .select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(inArray(organizations.name, missing));
        for (const r of refetched) institutionByName.set(r.name.toLowerCase(), r.id);
      }
    }
    console.log(`Inserted ${inserted} pending organizations (cache size now ${institutionByName.size}).`);
  }

  // ── Second pass: build user + profile + engagement payloads ───────
  interface PendingUser {
    record: CsvRow;
    email: string;
    fullName: string;
    createdAt: Date;
    memberId: string;
    workosId: string;
    institutionId: string | null;
    countryId: string | null;
    engagementSlugs: string[];
  }

  const pending: PendingUser[] = [];
  let skippedNoEmail = 0;
  let skippedNoName = 0;
  let skippedBadTimestamp = 0;
  let unresolvedCountries = new Map<string, number>();
  let unresolvedEngagement = 0;

  for (const r of dataRows) {
    const rec = rowToRecord(r);
    const email = normalizeEmail(rec.email);
    if (!email) {
      skippedNoEmail++;
      continue;
    }
    const fullName = normalizeWhitespace(rec.fullName);
    if (!fullName) {
      skippedNoName++;
      continue;
    }
    const createdAt = parseTimestamp(rec.timestamp);
    if (!createdAt) {
      skippedBadTimestamp++;
      continue;
    }

    const inst = primaryInstitution(rec.institutionRaw);
    const institutionId = inst ? institutionByName.get(inst.toLowerCase()) ?? null : null;

    const countryName = resolveCountryName(rec.countryRaw);
    const countryId = countryName
      ? countryByName.get(countryName.toLowerCase()) ?? null
      : null;
    if (countryName && !countryId) {
      unresolvedCountries.set(
        countryName,
        (unresolvedCountries.get(countryName) ?? 0) + 1
      );
    }

    const engagementSlugs = mapEngagement(rec.engagementRaw);
    if (rec.engagementRaw.trim() && engagementSlugs.length === 0) {
      unresolvedEngagement++;
    }

    pending.push({
      record: rec,
      email,
      fullName,
      createdAt,
      memberId: generateMemberId(),
      workosId: `legacy:${email}`,
      institutionId,
      countryId,
      engagementSlugs,
    });
  }

  // ── Deduplicate by email ──────────────────────────────────────────
  // Some members filled out the form more than once (early-2019 row +
  // re-registration after a job change). Postgres' single-statement
  // ON CONFLICT DO UPDATE refuses to touch the same row twice, so we
  // collapse duplicates here. Keep the *earliest* timestamp — that's
  // the member's actual founding date for badge purposes — and merge
  // the engagement slug sets so a re-registration doesn't lose any
  // role they checked the second time.
  const dedupedByEmail = new Map<string, PendingUser>();
  let duplicateRowsCollapsed = 0;
  for (const p of pending) {
    const existing = dedupedByEmail.get(p.email);
    if (!existing) {
      dedupedByEmail.set(p.email, p);
      continue;
    }
    duplicateRowsCollapsed++;
    // Keep the row with the earlier createdAt as the base.
    const earlier = p.createdAt < existing.createdAt ? p : existing;
    const later = p.createdAt < existing.createdAt ? existing : p;
    // Prefer non-empty institution / country from whichever side has
    // them; later registrations often have richer data.
    const merged: PendingUser = {
      ...earlier,
      institutionId: earlier.institutionId ?? later.institutionId,
      countryId: earlier.countryId ?? later.countryId,
      engagementSlugs: [
        ...new Set([...earlier.engagementSlugs, ...later.engagementSlugs]),
      ],
    };
    dedupedByEmail.set(p.email, merged);
  }
  const dedupedPending = [...dedupedByEmail.values()];

  console.log(
    `Prepared ${pending.length} pending users; collapsed ${duplicateRowsCollapsed} duplicate-email rows → ${dedupedPending.length} unique. Skipped: ${skippedNoEmail} no-email, ${skippedNoName} no-name, ${skippedBadTimestamp} bad-timestamp.`
  );
  if (unresolvedCountries.size > 0) {
    console.log(`Unresolved countries: ${unresolvedCountries.size} distinct values:`);
    for (const [name, count] of [...unresolvedCountries.entries()].sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`  - "${name}" × ${count}`);
    }
  }
  if (unresolvedEngagement > 0) {
    console.log(`${unresolvedEngagement} rows had engagement strings that didn't match any vocab slug.`);
  }

  // ── Upsert users in chunks ────────────────────────────────────────
  console.log("Upserting users…");
  const chunkSize = 250;
  const userIdByEmail = new Map<string, string>();
  let upserted = 0;
  for (let i = 0; i < dedupedPending.length; i += chunkSize) {
    const chunk = dedupedPending.slice(i, i + chunkSize);
    const result = await db
      .insert(users)
      .values(
        chunk.map((p) => ({
          workosId: p.workosId,
          memberId: p.memberId,
          email: p.email,
          isLegacyImport: true,
          createdAt: p.createdAt,
        }))
      )
      .onConflictDoUpdate({
        target: users.email,
        set: {
          // Existing rows (Cordero / Miranda / Ian / future re-runs)
          // get their createdAt corrected to the CSV value and the
          // legacy flag set. We deliberately do NOT touch workos_id —
          // members who have signed in via WorkOS keep their real sub
          // claim; only fresh-inserted rows carry the legacy: sentinel.
          createdAt: sql`EXCLUDED.created_at`,
          isLegacyImport: sql`true`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: users.id, email: users.email });
    for (const r of result) userIdByEmail.set(r.email, r.id);
    upserted += result.length;
    if ((i / chunkSize) % 4 === 0) {
      console.log(`  …${upserted}/${dedupedPending.length} users`);
    }
  }
  console.log(`Upserted ${upserted} users.`);

  // ── Upsert profiles in chunks ─────────────────────────────────────
  console.log("Upserting profiles…");
  let profilesUpserted = 0;
  for (let i = 0; i < dedupedPending.length; i += chunkSize) {
    const chunk = dedupedPending.slice(i, i + chunkSize);
    const values = chunk
      .map((p) => {
        const userId = userIdByEmail.get(p.email);
        if (!userId) return null;
        const slug = buildProfileSlug(p.fullName, p.memberId);
        return {
          userId,
          slug,
          displayName: p.fullName,
          institutionId: p.institutionId,
          countryId: p.countryId,
          publicLocation: normalizeWhitespace(p.record.locationPin),
          isPublic: false,
          isDiscoverable: false,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    if (values.length === 0) continue;
    const result = await db
      .insert(profiles)
      .values(values)
      .onConflictDoNothing({ target: profiles.userId })
      .returning({ id: profiles.id });
    profilesUpserted += result.length;
  }
  console.log(`Inserted ${profilesUpserted} profiles (existing rows preserved).`);

  // ── Engagement type links ─────────────────────────────────────────
  console.log("Linking engagement types…");
  const engagementValues: { userId: string; engagementTypeId: string }[] = [];
  for (const p of dedupedPending) {
    const userId = userIdByEmail.get(p.email);
    if (!userId) continue;
    for (const slug of p.engagementSlugs) {
      const typeId = engagementBySlug.get(slug);
      if (!typeId) continue;
      engagementValues.push({ userId, engagementTypeId: typeId });
    }
  }
  if (engagementValues.length > 0) {
    let linked = 0;
    for (let i = 0; i < engagementValues.length; i += chunkSize) {
      const chunk = engagementValues.slice(i, i + chunkSize);
      const result = await db
        .insert(userEngagementTypes)
        .values(chunk)
        .onConflictDoNothing()
        .returning({ userId: userEngagementTypes.userId });
      linked += result.length;
    }
    console.log(`Linked ${linked} engagement-type rows (existing links preserved).`);
  }

  console.log("\nImport complete.");
}

importCsv().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
