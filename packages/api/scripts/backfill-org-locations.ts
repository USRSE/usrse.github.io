import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq, isNull } from "drizzle-orm";
import { createDb } from "../src/db";
import { organizations } from "../src/db/schema";
import { searchWikidataOrg } from "./lib/wikidata";
import { fetchWikipediaSummary } from "./lib/wikipedia";
import { geocodeOrg } from "./lib/photon";

const __filename = fileURLToPath(import.meta.url);

export function nameMatchScore(a: string, b: string): number {
  if (!a || !b) return 0;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 100;
  if (al.includes(bl) || bl.includes(al)) return 80;
  const dist = levenshtein(al, bl);
  return Math.max(0, 100 - (dist / Math.max(al.length, bl.length)) * 100);
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const v0 = new Array(b.length + 1).fill(0).map((_, i) => i);
  const v1 = new Array(b.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

function rootDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function domainsMatch(a: string | null, b: string | null): boolean {
  const ra = rootDomain(a);
  const rb = rootDomain(b);
  return !!ra && !!rb && ra === rb;
}

interface BackfillFlags {
  commit: boolean;
}

function parseArgs(argv: string[]): BackfillFlags {
  return { commit: argv.includes("--commit") };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const db = createDb(conn);
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      url: organizations.url,
      country: organizations.country,
      description: organizations.description,
    })
    .from(organizations)
    .where(isNull(organizations.country));

  const csv = [
    "id,name,suggested_country,country_source,suggested_city,city_source,suggested_description,description_source,confidence,needs_rewrite",
  ];
  let updatedCountries = 0;
  for (const r of rows) {
    let country: string | null = null;
    let countrySource: string | null = null;
    let city: string | null = null;
    let citySource: string | null = null;
    let description: string | null = null;
    let descriptionSource: string | null = null;
    let confidence = 0;

    const wd = await searchWikidataOrg(r.name);
    if (wd) {
      const nameScore = nameMatchScore(r.name, wd.label);
      const dMatch = domainsMatch(r.url, wd.officialWebsite);
      const accept = nameScore >= 85 || dMatch;
      if (accept) {
        country = wd.country;
        countrySource = "wikidata";
        city = wd.city;
        citySource = "wikidata";
        confidence = dMatch ? 100 : nameScore;
        if (wd.enwikiTitle) {
          description = await fetchWikipediaSummary(wd.enwikiTitle);
          if (description) descriptionSource = "wikipedia";
        }
      }
    }
    if (!country) {
      const geo = await geocodeOrg(r.name);
      if (geo.country) {
        country = geo.country;
        countrySource = "photon";
        city = geo.city;
        citySource = "photon";
        confidence = 60;
      }
    }

    const needsRewrite = description ? "true" : "false";
    csv.push(
      [
        r.id,
        `"${r.name.replace(/"/g, '""')}"`,
        country ?? "",
        countrySource ?? "",
        city ?? "",
        citySource ?? "",
        description ? `"${description.replace(/"/g, '""')}"` : "",
        descriptionSource ?? "",
        Math.round(confidence),
        needsRewrite,
      ].join(",")
    );

    if (flags.commit && country) {
      await db
        .update(organizations)
        .set({ country })
        .where(eq(organizations.id, r.id));
      updatedCountries++;
      // Description NOT written automatically — strict CC BY-SA path.
      // Admins review CSV, paraphrase, then update via admin UI.
    }

    // Be polite to upstream APIs.
    await new Promise((res) => setTimeout(res, 250));
  }

  const reportPath = `org-locations-${flags.commit ? "applied" : "dry-run"}.csv`;
  fs.writeFileSync(reportPath, csv.join("\n"));
  console.log(
    `${flags.commit ? "Wrote" : "Would write"} ${updatedCountries} countries. Report: ${reportPath}`
  );
}

// Only run main() when invoked directly, not when imported by tests.
const isMain =
  process.argv[1] && process.argv[1].endsWith(path.basename(__filename));
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
