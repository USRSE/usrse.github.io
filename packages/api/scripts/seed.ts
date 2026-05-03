/**
 * Seeds admin-curated vocabulary tables. Idempotent: uses ON CONFLICT DO
 * NOTHING so it's safe to re-run as the seed lists grow.
 *
 * Usage: `npm -w @us-rse/api run db:seed`
 *
 * Reads DATABASE_URL from packages/api/.dev.vars or the environment.
 *
 * Does NOT seed groups or institutions — those will be populated through
 * admin tooling once #1917 successors land. Seeding them with stale
 * placeholders would just create cleanup work.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createDb } from "../src/db/index";
import {
  careerStages,
  countries,
  degreeTypes,
  disciplines,
  engagementTypes,
  eventCommitteeAreas,
  leadershipPositions,
  pronouns,
  skills,
} from "../src/db/schema/index";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDevVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const contents = readFileSync(resolve(__dirname, "..", ".dev.vars"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && m[1] === name) return m[2].replace(/^"(.*)"$/, "$1");
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

function loadJson<T>(name: string): T {
  const path = resolve(__dirname, "data", name);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

const pronounsSeed = [
  { label: "he/him", sortOrder: 10 },
  { label: "she/her", sortOrder: 20 },
  { label: "they/them", sortOrder: 30 },
  { label: "he/they", sortOrder: 40 },
  { label: "she/they", sortOrder: 50 },
  { label: "ze/hir", sortOrder: 60 },
  { label: "any pronouns", sortOrder: 70 },
  { label: "prefer not to say", sortOrder: 80 },
];

const degreeTypesSeed = [
  { label: "PhD", sortOrder: 10 },
  { label: "MS", sortOrder: 20 },
  { label: "MA", sortOrder: 30 },
  { label: "BS", sortOrder: 40 },
  { label: "BA", sortOrder: 50 },
  { label: "MBA", sortOrder: 60 },
  { label: "MD", sortOrder: 70 },
  { label: "JD", sortOrder: 80 },
  { label: "Other", sortOrder: 99 },
];

const engagementTypesSeed = [
  {
    slug: "research_software_engineer",
    label: "Research Software Engineer",
    description: "Primary role is building research software.",
    sortOrder: 10,
  },
  {
    slug: "researcher",
    label: "Researcher",
    description:
      "Graduate student, postdoc, faculty, or other research role using software.",
    sortOrder: 20,
  },
  {
    slug: "writes_code_secondary",
    label: "Writes code for research (secondary activity)",
    description: "Writes software for research as a non-primary activity.",
    sortOrder: 30,
  },
  {
    slug: "uses_research_software",
    label: "Uses research software",
    description: "Uses research software but does not develop it.",
    sortOrder: 40,
  },
  {
    slug: "software_engineer_non_research",
    label: "Software engineer (non-research)",
    description: "Software engineer outside of research.",
    sortOrder: 50,
  },
  {
    slug: "manages_rses",
    label: "Manages RSEs",
    description: "Manages research software engineers or RSE teams.",
    sortOrder: 60,
  },
  {
    slug: "rse_ally",
    label: "RSE ally",
    description: "Supports the RSE community without primarily being an RSE.",
    sortOrder: 70,
  },
];

const careerStagesSeed = [
  { slug: "student", label: "Student", sortOrder: 10 },
  { slug: "early_career", label: "Early-career", sortOrder: 20 },
  { slug: "mid_career", label: "Mid-career", sortOrder: 30 },
  { slug: "senior", label: "Senior", sortOrder: 40 },
  { slug: "faculty", label: "Faculty", sortOrder: 50 },
  { slug: "industry", label: "Industry", sortOrder: 60 },
  { slug: "retired", label: "Retired", sortOrder: 70 },
];

const leadershipPositionsSeed = [
  {
    slug: "president",
    label: "President",
    positionType: "board" as const,
    sortOrder: 10,
  },
  {
    slug: "vice_president",
    label: "Vice President",
    positionType: "board" as const,
    sortOrder: 20,
  },
  {
    slug: "treasurer",
    label: "Treasurer",
    positionType: "board" as const,
    sortOrder: 30,
  },
  {
    slug: "secretary",
    label: "Secretary",
    positionType: "board" as const,
    sortOrder: 40,
  },
  {
    slug: "member_at_large",
    label: "Member-at-Large",
    positionType: "board" as const,
    sortOrder: 50,
  },
  {
    slug: "executive_director",
    label: "Executive Director",
    positionType: "executive" as const,
    sortOrder: 100,
  },
];

const eventCommitteeAreasSeed = [
  { slug: "general", label: "General", sortOrder: 10 },
  {
    slug: "technical_program",
    label: "Technical Program",
    sortOrder: 20,
  },
  { slug: "communications", label: "Communications", sortOrder: 30 },
  { slug: "logistics", label: "Logistics", sortOrder: 40 },
  { slug: "sponsorship", label: "Sponsorship", sortOrder: 50 },
  {
    slug: "community_engagement",
    label: "Community Engagement",
    sortOrder: 60,
  },
];

type CountrySeed = { isoAlpha2: string; isoAlpha3: string; name: string };
type SkillSeed = { name: string; slug: string };
type DisciplineSeed = { name: string; slug: string };

async function seed() {
  console.log("Seeding pronouns…");
  await db.insert(pronouns).values(pronounsSeed).onConflictDoNothing();

  console.log("Seeding degree types…");
  await db.insert(degreeTypes).values(degreeTypesSeed).onConflictDoNothing();

  console.log("Seeding engagement types…");
  await db
    .insert(engagementTypes)
    .values(engagementTypesSeed)
    .onConflictDoNothing();

  console.log("Seeding career stages…");
  await db.insert(careerStages).values(careerStagesSeed).onConflictDoNothing();

  console.log("Seeding leadership positions…");
  await db
    .insert(leadershipPositions)
    .values(leadershipPositionsSeed)
    .onConflictDoNothing();

  console.log("Seeding event committee areas…");
  await db
    .insert(eventCommitteeAreas)
    .values(eventCommitteeAreasSeed)
    .onConflictDoNothing();

  console.log("Seeding countries…");
  const countriesData = loadJson<CountrySeed[]>("countries.json").map(
    (c, i) => ({ ...c, sortOrder: i * 10 })
  );
  await db.insert(countries).values(countriesData).onConflictDoNothing();

  console.log("Seeding skills…");
  const skillsData = loadJson<SkillSeed[]>("skills.json").map((s) => ({
    ...s,
    status: "approved" as const,
  }));
  await db.insert(skills).values(skillsData).onConflictDoNothing();

  console.log("Seeding disciplines…");
  const disciplinesData = loadJson<DisciplineSeed[]>("disciplines.json").map(
    (d) => ({ ...d, status: "approved" as const })
  );
  await db.insert(disciplines).values(disciplinesData).onConflictDoNothing();

  console.log("\nDone. Seed list sizes:");
  console.log(`  pronouns:                 ${pronounsSeed.length}`);
  console.log(`  degree_types:             ${degreeTypesSeed.length}`);
  console.log(`  engagement_types:         ${engagementTypesSeed.length}`);
  console.log(`  career_stages:            ${careerStagesSeed.length}`);
  console.log(`  leadership_positions:     ${leadershipPositionsSeed.length}`);
  console.log(
    `  event_committee_areas:    ${eventCommitteeAreasSeed.length}`
  );
  console.log(`  countries:                ${countriesData.length}`);
  console.log(`  skills:                   ${skillsData.length}`);
  console.log(`  disciplines:              ${disciplinesData.length}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
