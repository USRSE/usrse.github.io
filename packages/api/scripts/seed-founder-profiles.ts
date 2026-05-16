/**
 * One-shot: create user + profile rows for the three founding board /
 * ED members who pre-date the membership-form era (Jeffrey C. Carver,
 * Julia Damerow, Sandra Gesing). Inserts mirror the legacy CSV
 * importer's shape (workosId="legacy:<email>" sentinel, isLegacyImport
 * = true) but populate the richer identity fields the operator has
 * supplied directly: ORCID, website, public location, primary org.
 *
 * Marks each profile isPublic=true + isDiscoverable=true at creation
 * because these are board members whose public identity has always
 * been part of the org's surface (board page, governance docs, etc.) —
 * the standard "legacy default = hidden" doesn't fit.
 *
 * Usage:
 *   tsx scripts/seed-founder-profiles.ts            # dry-run
 *   tsx scripts/seed-founder-profiles.ts --commit   # do it
 *
 * Idempotent: re-running --commit on a founder whose email already
 * exists in `users` is a no-op (skipped with a notice). To rewrite a
 * specific founder, delete their row first via admin.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ilike } from "drizzle-orm";
import { createDb } from "../src/db";
import { organizations, profiles, userOrganizations, users } from "../src/db/schema";
import { buildProfileSlug, generateMemberId } from "../src/lib/member-id";

interface Founder {
  displayName: string;
  email: string;
  orcid: string;
  websiteUrl: string;
  publicLocation: string;
  /** Exact organizations.name to look up for the primary affiliation,
   *  or null if no DB org exists yet (e.g., US-RSE for Sandra). */
  primaryOrgName: string | null;
}

const FOUNDERS: readonly Founder[] = [
  {
    displayName: "Jeffrey C. Carver",
    // Placeholder email under the us-rse.org domain. When the real
    // member signs in via WorkOS with their actual address, an admin
    // merges that account into this sentinel row.
    email: "carver+founder@us-rse.org",
    orcid: "0000-0002-7824-9151",
    websiteUrl: "https://eng.ua.edu/eng-directory/dr-jeffrey-carver/",
    publicLocation: "Hoover, AL",
    primaryOrgName: "The University of Alabama",
  },
  {
    displayName: "Julia Damerow",
    email: "damerow+founder@us-rse.org",
    orcid: "0000-0002-0874-0092",
    websiteUrl: "https://search.asu.edu/profile/1393893",
    publicLocation: "Tempe, AZ",
    primaryOrgName: "Arizona State University",
  },
  {
    displayName: "Sandra Gesing",
    email: "sandra@us-rse.org",
    orcid: "0000-0002-6051-0673",
    websiteUrl: "https://sandra-gesing.com",
    publicLocation: "Chicago, IL",
    // US-RSE isn't in the organizations table — skip the primary
    // affiliation. Sandra's role as ED is captured on the staff page,
    // not via a member-org row.
    primaryOrgName: null,
  },
] as const;

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    /* fine */
  }
  return undefined;
}

const databaseUrl = loadDevVar("DATABASE_URL");
if (!databaseUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const commit = process.argv.includes("--commit");
  const db = createDb(databaseUrl!);

  console.log(`Target DB host : ${databaseUrl!.match(/@([^/]+)/)?.[1] ?? "?"}`);
  console.log(`Mode           : ${commit ? "COMMIT" : "dry-run"}`);
  console.log();

  for (const f of FOUNDERS) {
    console.log(`→ ${f.displayName}`);

    // Check existing state. neon-http doesn't support db.transaction
    // from a local script, so we do the three inserts sequentially and
    // recover gracefully when a prior run left things half-done:
    //
    //   - users exists, profiles missing → finish (insert profile +
    //     optionally affiliation), reusing the existing user.
    //   - users exists, profiles exists → fully seeded, skip.
    //   - users missing → fresh insert chain.
    const existingUser = await db
      .select({ id: users.id, memberId: users.memberId })
      .from(users)
      .where(eq(users.email, f.email))
      .limit(1)
      .then((r) => r[0] ?? null);
    let existingProfile: { slug: string } | null = null;
    if (existingUser) {
      existingProfile = await db
        .select({ slug: profiles.slug })
        .from(profiles)
        .where(eq(profiles.userId, existingUser.id))
        .limit(1)
        .then((r) => r[0] ?? null);
    }

    // Resolve primary org if requested.
    let primaryOrgId: string | null = null;
    if (f.primaryOrgName) {
      const orgRows = await db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(ilike(organizations.name, f.primaryOrgName));
      // Prefer an exact-name match if any (so "University of Alabama"
      // doesn't snap to "The University of Alabama" unless that's the
      // request). ILIKE is for case-insensitivity, not fuzziness.
      const match =
        orgRows.find((r) => r.name === f.primaryOrgName) ?? orgRows[0];
      if (!match) {
        console.log(
          `  WARN: primary org "${f.primaryOrgName}" not found — proceeding without affiliation`
        );
      } else {
        primaryOrgId = match.id;
        console.log(
          `  primary org: ${match.name} (${match.id.slice(0, 8)})`
        );
      }
    }

    if (existingUser && existingProfile) {
      console.log(
        `  fully seeded already (userId=${existingUser.id.slice(0, 8)} memberId=${existingUser.memberId} slug=${existingProfile.slug}) — skipping`
      );
      continue;
    }

    const memberId = existingUser?.memberId ?? generateMemberId();
    const slug = buildProfileSlug(f.displayName, memberId);
    console.log(
      `  memberId=${memberId} slug=${slug} orcid=${f.orcid} location=${JSON.stringify(f.publicLocation)}`
    );

    if (!commit) continue;

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      console.log(`  reusing existing users row (id=${userId.slice(0, 8)})`);
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          workosId: `legacy:${f.email}`,
          memberId,
          email: f.email,
          isLegacyImport: true,
        })
        .returning({ id: users.id });
      userId = inserted.id;
      console.log(`  users row inserted (id=${userId.slice(0, 8)})`);
    }

    if (!existingProfile) {
      await db.insert(profiles).values({
        userId,
        slug,
        displayName: f.displayName,
        orcid: f.orcid,
        websiteUrl: f.websiteUrl,
        publicLocation: f.publicLocation,
        isPublic: true,
        isDiscoverable: true,
      });
      console.log(`  profile row inserted`);
    }

    if (primaryOrgId) {
      // Idempotent: user_organizations has a unique index on
      // (userId, organizationId), so onConflictDoNothing prevents a
      // duplicate row on rerun.
      await db
        .insert(userOrganizations)
        .values({
          userId,
          organizationId: primaryOrgId,
          isPrimary: true,
        })
        .onConflictDoNothing();
      console.log(`  user_organizations link inserted`);
    }
  }

  if (!commit) {
    console.log();
    console.log("dry-run — re-run with --commit to apply.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
