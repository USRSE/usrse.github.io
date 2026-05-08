/**
 * Member search query — backs the /members directory + cmd-k palette.
 *
 * Two filtering axes:
 *
 *  - Listable (visibility): a row is listable when isPublic OR
 *    isDiscoverable. Hidden members never appear in any directory
 *    response.
 *
 *  - Match (filters/q): once listable, a row matches the request when
 *    its data lines up with the query and facet filters. Discoverable-
 *    private members participate in matching the same as public ones —
 *    the *response* shape then strips everything but memberId +
 *    displayName for those rows so private fields don't leak through
 *    the wire even when they were used internally to rank/match.
 *
 * Search is plain ILIKE across displayName, jobTitle, headline, and
 * the joined institution name. The community is small enough (~1k
 * members) that trigram or FTS indexes aren't worth the operational
 * cost yet — a sequential scan with leading-wildcard ILIKE is
 * sub-50ms at this scale on Neon.
 */
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import type { createDb } from "../db";
import {
  countries,
  careerStages,
  disciplines,
  institutions,
  profiles,
  users,
  userDisciplines,
  userInstitutions,
} from "../db/schema";

type Db = ReturnType<typeof createDb>;

export interface MemberSearchParams {
  q: string | null;
  disciplineIds: string[];
  careerStageIds: string[];
  countryIds: string[];
  limit: number;
  offset: number;
}

export type MemberSearchResultPublic = {
  kind: "public";
  memberId: string;
  slug: string;
  displayName: string;
  jobTitle: string | null;
  institutionName: string | null;
  careerStageLabel: string | null;
  publicLocation: string | null;
  countryName: string | null;
  photoUrl: string | null;
  disciplines: { name: string; slug: string }[];
};

export type MemberSearchResultPrivate = {
  kind: "private";
  memberId: string;
  slug: string;
  displayName: string;
};

export type MemberSearchResult =
  | MemberSearchResultPublic
  | MemberSearchResultPrivate;

export interface MemberSearchResponse {
  results: MemberSearchResult[];
  total: number;
  hasMore: boolean;
}

export async function searchMembers(
  db: Db,
  params: MemberSearchParams
): Promise<MemberSearchResponse> {
  const { q, disciplineIds, careerStageIds, countryIds, limit, offset } = params;

  // Compose WHERE. A row is listable when isPublic OR isDiscoverable
  // and not soft-deleted on either side of the user/profile join.
  const conditions = [
    isNull(profiles.deletedAt),
    isNull(users.deletedAt),
    or(eq(profiles.isPublic, true), eq(profiles.isDiscoverable, true)),
  ];

  if (q && q.trim()) {
    const needle = `%${q.trim()}%`;
    // Match across the four fields a public card surfaces. For
    // private-discoverable rows the institution/title/headline join
    // values still exist in the DB, so a query like "MIT" can find
    // them — but the response will only echo back the stub shape.
    conditions.push(
      or(
        ilike(profiles.displayName, needle),
        ilike(profiles.jobTitle, needle),
        ilike(profiles.headline, needle),
        ilike(institutions.name, needle)
      )!
    );
  }

  if (careerStageIds.length > 0) {
    conditions.push(inArray(profiles.careerStageId, careerStageIds));
  }
  if (countryIds.length > 0) {
    conditions.push(inArray(profiles.countryId, countryIds));
  }
  if (disciplineIds.length > 0) {
    // EXISTS subquery is cheaper than DISTINCT-on-join when the user
    // has many disciplines — we don't need to materialize the join.
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${userDisciplines}
        WHERE ${userDisciplines.userId} = ${users.id}
          AND ${userDisciplines.disciplineId} IN ${disciplineIds}
      )`
    );
  }

  const whereExpr = and(...conditions);

  // Run count + page in parallel — the count query reuses the same
  // join shape so the planner caches the same plan.
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        userId: users.id,
        memberId: users.memberId,
        slug: profiles.slug,
        displayName: profiles.displayName,
        jobTitle: profiles.jobTitle,
        institutionName: institutions.name,
        careerStageLabel: careerStages.label,
        publicLocation: profiles.publicLocation,
        countryName: countries.name,
        photoUrl: profiles.photoUrl,
        isPublic: profiles.isPublic,
      })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      // Join through user_institutions filtered to is_primary=true. The
      // partial unique index `user_institutions_one_primary_per_user`
      // guarantees at most one match per user, so this leftJoin can't
      // duplicate rows.
      .leftJoin(
        userInstitutions,
        and(eq(userInstitutions.userId, users.id), eq(userInstitutions.isPrimary, true))
      )
      .leftJoin(institutions, eq(institutions.id, userInstitutions.institutionId))
      .leftJoin(careerStages, eq(careerStages.id, profiles.careerStageId))
      .leftJoin(countries, eq(countries.id, profiles.countryId))
      .where(whereExpr)
      // Public rows lead so the listable-but-stub rows don't crowd
      // out the richer cards in the first page of results.
      .orderBy(desc(profiles.isPublic), asc(profiles.displayName))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .leftJoin(
        userInstitutions,
        and(eq(userInstitutions.userId, users.id), eq(userInstitutions.isPrimary, true))
      )
      .leftJoin(institutions, eq(institutions.id, userInstitutions.institutionId))
      .where(whereExpr),
  ]);

  // Hydrate disciplines for the public rows in one batched query.
  // Skipped for private rows since their card never surfaces them.
  const publicUserIds = rows.filter((r) => r.isPublic).map((r) => r.userId);
  const disciplineMap = new Map<string, { name: string; slug: string }[]>();
  if (publicUserIds.length > 0) {
    const disciplineRows = await db
      .select({
        userId: userDisciplines.userId,
        name: disciplines.name,
        slug: disciplines.slug,
      })
      .from(userDisciplines)
      .innerJoin(disciplines, eq(disciplines.id, userDisciplines.disciplineId))
      .where(inArray(userDisciplines.userId, publicUserIds))
      .orderBy(asc(disciplines.name));
    for (const d of disciplineRows) {
      const list = disciplineMap.get(d.userId) ?? [];
      list.push({ name: d.name, slug: d.slug });
      disciplineMap.set(d.userId, list);
    }
  }

  const results: MemberSearchResult[] = rows.map((r) =>
    r.isPublic
      ? {
          kind: "public",
          memberId: r.memberId,
          slug: r.slug,
          displayName: r.displayName,
          jobTitle: r.jobTitle,
          institutionName: r.institutionName,
          careerStageLabel: r.careerStageLabel,
          publicLocation: r.publicLocation,
          countryName: r.countryName,
          photoUrl: r.photoUrl,
          disciplines: disciplineMap.get(r.userId) ?? [],
        }
      : {
          kind: "private",
          memberId: r.memberId,
          slug: r.slug,
          displayName: r.displayName,
        }
  );

  const total = totalRows[0]?.count ?? 0;
  return {
    results,
    total,
    hasMore: offset + results.length < total,
  };
}
