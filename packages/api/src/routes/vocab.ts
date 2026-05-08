import { Hono } from "hono";
import { and, asc, eq, ilike, isNull } from "drizzle-orm";
import { createDb } from "../db";
import {
  careerStages,
  countries,
  disciplines,
  institutions,
  languages,
  skills,
} from "../db/schema/vocab";
import type { AppEnv } from "../types";

/**
 * Filter-dimension reference data used by the member directory's
 * faceted sidebar. Bundled into a single response so the index page
 * doesn't pay three round-trips on mount; each dimension is small
 * enough that the combined payload is still well under 50KB.
 *
 * Only `approved` rows are returned — pending vocab (user-suggested
 * disciplines awaiting review) shouldn't appear as a filter facet
 * since selecting it would match nobody.
 *
 * Public, no auth required: these are reference taxonomies with no
 * user data, and the directory page will eventually be reachable to
 * signed-out visitors browsing the community surface.
 */
export const vocabRoute = new Hono<AppEnv>();

vocabRoute.get("/", async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json(
      { ok: false, error: "internal", message: "Database is not configured" },
      500
    );
  }

  try {
    const db = createDb(c.env.DATABASE_URL);

    const [
      disciplineRows,
      skillRows,
      languageRows,
      careerStageRows,
      countryRows,
    ] = await Promise.all([
      db
        .select({
          id: disciplines.id,
          name: disciplines.name,
          slug: disciplines.slug,
        })
        .from(disciplines)
        .where(eq(disciplines.status, "approved"))
        .orderBy(asc(disciplines.name)),
      db
        .select({
          id: skills.id,
          name: skills.name,
          slug: skills.slug,
        })
        .from(skills)
        .where(eq(skills.status, "approved"))
        .orderBy(asc(skills.name)),
      db
        .select({
          id: languages.id,
          name: languages.name,
          slug: languages.slug,
        })
        .from(languages)
        .where(eq(languages.status, "approved"))
        .orderBy(asc(languages.name)),
      db
        .select({
          id: careerStages.id,
          slug: careerStages.slug,
          label: careerStages.label,
        })
        .from(careerStages)
        .where(eq(careerStages.status, "approved"))
        .orderBy(asc(careerStages.sortOrder), asc(careerStages.label)),
      db
        .select({
          id: countries.id,
          isoAlpha2: countries.isoAlpha2,
          name: countries.name,
        })
        .from(countries)
        .orderBy(asc(countries.sortOrder), asc(countries.name)),
    ]);

    return c.json({
      ok: true,
      vocab: {
        disciplines: disciplineRows,
        skills: skillRows,
        languages: languageRows,
        careerStages: careerStageRows,
        countries: countryRows,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("/vocab failed", message);
    return c.json({ ok: false, error: "internal", message }, 500);
  }
});

/**
 * Institution name search for the affiliation editor. Institutions are
 * too numerous (~1,400+) to bundle into the main /vocab response, so
 * the editor calls this on each keystroke (debounced client-side) and
 * gets back a small set of approved-and-not-merged candidates ordered
 * by leading-substring match, then alphabetically.
 *
 * No auth — the institution names themselves are non-sensitive
 * vocabulary, and the directory's filter sidebar will eventually use
 * the same endpoint.
 */
vocabRoute.get("/institutions/search", async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json({ ok: false, error: "internal" }, 500);
  }
  const q = (c.req.query("q") ?? "").trim();
  if (q.length < 2) {
    return c.json({ ok: true, results: [] });
  }
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") ?? "20", 10) || 20, 1),
    50
  );
  try {
    const db = createDb(c.env.DATABASE_URL);
    const rows = await db
      .select({
        id: institutions.id,
        name: institutions.name,
        slug: institutions.slug,
      })
      .from(institutions)
      .where(
        and(
          eq(institutions.status, "approved"),
          isNull(institutions.mergedIntoId),
          ilike(institutions.name, `%${q}%`)
        )
      )
      .orderBy(asc(institutions.name))
      .limit(limit);
    return c.json({ ok: true, results: rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("/vocab/institutions/search failed", message);
    return c.json({ ok: false, error: "internal", message }, 500);
  }
});
