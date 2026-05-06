import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { createDb } from "../db";
import { careerStages, countries, disciplines } from "../db/schema/vocab";
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

    const [disciplineRows, careerStageRows, countryRows] = await Promise.all([
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
