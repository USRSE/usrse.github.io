import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { createDb } from "../src/db";
import { organizations } from "../src/db/schema";
import { buildSlug } from "../src/lib/slug";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Classifier tables ────────────────────────────────────────────────────────

const NATIONAL_LAB_ABBREVIATIONS = new Set([
  "LANL",
  "ORNL",
  "LBNL",
  "ANL",
  "NREL",
  "PNNL",
  "SNL",
  "INL",
  "BNL",
  "FNAL",
  "SLAC",
  "Ames",
]);

const AGENCY_TOKENS = new Set([
  "NSF",
  "NIH",
  "DOE",
  "NASA",
  "NOAA",
  "USDA",
  "DARPA",
  "NIST",
]);

const EXTERNAL_RESOURCE_PATTERNS: Array<RegExp> = [
  /\bBSSw\b/,
  /Better Scientific Software/,
  /\bSSI\b/,
  /Software Sustainability Institute/,
  /\bURSSI\b/,
  /\bReSA\b/,
  /Research Software Alliance/,
  /IDEAS Productivity/,
  /SWEBOK/,
  /Software Engineering for Science/,
  /Ask Cyberinfrastructure/,
];

// ─── Exported classifier (also used by tests) ─────────────────────────────────

export function classifyOrgByName(name: string): string {
  // External-resource set takes highest priority.
  if (EXTERNAL_RESOURCE_PATTERNS.some((re) => re.test(name))) {
    return "external_resource";
  }

  // National-lab long-form name.
  if (/\b(national\s+lab(oratory)?)\b/i.test(name)) return "national_lab";

  // National-lab abbreviations.
  for (const abbr of NATIONAL_LAB_ABBREVIATIONS) {
    if (new RegExp(`\\b${abbr}\\b`).test(name)) return "national_lab";
  }

  // Federal-agency token matches.
  for (const tok of AGENCY_TOKENS) {
    if (new RegExp(`\\b${tok}\\b`).test(name)) return "agency";
  }

  // Agency long-form names.
  if (
    /\b(National\s+(Science|Institutes?)\s+Foundation|of\s+Health)\b/i.test(
      name,
    )
  ) {
    return "agency";
  }

  // Academic institutions.
  if (/\b(university|college|institute of technology)\b/i.test(name)) {
    return "university";
  }

  return "other";
}

// ─── CLI flags ────────────────────────────────────────────────────────────────

interface CliFlags {
  commit: boolean;
  seedExternal: boolean;
}

function parseArgs(argv: string[]): CliFlags {
  return {
    commit: argv.includes("--commit"),
    seedExternal: !argv.includes("--no-seed"),
  };
}

// ─── External-resource fixture shape ─────────────────────────────────────────

interface ExternalResourceEntry {
  primary: string;
  url?: string;
  desc?: string;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = createDb(connStr);

  console.log(
    flags.commit
      ? "=== COMMIT mode — writes will land ===\n"
      : "=== DRY-RUN mode (default) — no writes ===\n",
  );

  const csvLines = ["id,name,current_type,suggested_type,action"];
  let toUpdate = 0;

  // ── Pass 1: reclassify existing rows whose type is 'other' ───────────────
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      type: organizations.type,
    })
    .from(organizations);

  for (const r of rows) {
    const suggested = classifyOrgByName(r.name);
    const action =
      r.type === "other" && suggested !== "other" ? "update" : "skip";
    if (action === "update") toUpdate++;

    csvLines.push(
      `${r.id},"${r.name.replace(/"/g, '""')}",${r.type},${suggested},${action}`,
    );

    if (flags.commit && action === "update") {
      await db
        .update(organizations)
        .set({ type: suggested as any })
        .where(eq(organizations.id, r.id));
    }
  }

  console.log(
    `Pass 1 — ${rows.length} rows scanned, ${toUpdate} would be updated.`,
  );

  // ── Pass 2: seed external-resource entries from the JSON fixture ──────────
  if (flags.seedExternal) {
    const fixturePath = path.join(__dirname, "data", "external-resources.json");
    const fixture = JSON.parse(
      fs.readFileSync(fixturePath, "utf8"),
    ) as ExternalResourceEntry[];

    let inserted = 0;
    let skipped = 0;

    for (const e of fixture) {
      const slug = buildSlug(e.primary);

      const [existing] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);

      if (existing) {
        skipped++;
        continue;
      }

      csvLines.push(
        `(new),"${e.primary.replace(/"/g, '""')}",none,external_resource,insert`,
      );
      inserted++;

      if (flags.commit) {
        await db.insert(organizations).values({
          name: e.primary,
          slug,
          url: e.url ?? null,
          type: "external_resource",
          status: "approved",
        } as any);
      }
    }

    console.log(
      `Pass 2 — ${inserted} external-resource entries would be inserted, ${skipped} already present.`,
    );
  }

  // ── Write report ──────────────────────────────────────────────────────────
  const reportPath = `org-types-${flags.commit ? "applied" : "dry-run"}.csv`;
  fs.writeFileSync(reportPath, csvLines.join("\n"));

  console.log(
    `\n${flags.commit ? "Wrote" : "Would update"} ${toUpdate} rows. Report: ${reportPath}`,
  );
  console.log(
    flags.commit
      ? "=== COMMITTED ==="
      : "=== DRY-RUN — re-run with --commit to apply ===",
  );
}

// Only run when executed directly (not when imported by tests).
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).endsWith(
    path.basename(process.argv[1]),
  );

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
