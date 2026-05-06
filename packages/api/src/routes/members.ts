import { Hono } from "hono";
import { createDb } from "../db";
import { loadMemberDossierBySlug } from "../lib/dossier";
import { searchMembers } from "../lib/member-search";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

export const membersRoute = new Hono<AppEnv>();

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 24;

function parseUuidList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
}

function parseInt32(raw: string | undefined, fallback: number, max: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, max);
}

/**
 * Authenticated member directory search. Returns a paginated list of
 * listable members (public + discoverable-private) matching the
 * provided text query and facet filters. Discoverable-private rows
 * are echoed as a minimal stub so the directory can show "this
 * person exists" without leaking private fields.
 *
 * Auth-gated because this is the closest thing the site has to a
 * member roster — gating it behind WorkOS reduces the surface for
 * scraping and aligns with the "members can find each other"
 * positioning of the feature.
 */
membersRoute.get("/", requireAuth, async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json(
      { ok: false, error: "internal", message: "Database is not configured" },
      500
    );
  }

  try {
    const url = new URL(c.req.url);
    const params = url.searchParams;
    const db = createDb(c.env.DATABASE_URL);

    const response = await searchMembers(db, {
      q: params.get("q"),
      disciplineIds: parseUuidList(params.get("discipline") ?? undefined),
      careerStageIds: parseUuidList(params.get("careerStage") ?? undefined),
      countryIds: parseUuidList(params.get("country") ?? undefined),
      limit: parseInt32(params.get("limit") ?? undefined, DEFAULT_LIMIT, MAX_LIMIT),
      offset: parseInt32(params.get("offset") ?? undefined, 0, 10_000),
    });

    return c.json({ ok: true, ...response });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("/members search failed", message);
    return c.json({ ok: false, error: "internal", message }, 500);
  }
});

/**
 * Public read of a member by slug. Same dossier shape as /me, minus
 * email/marketing/legacy-import fields, and only when isPublic is true.
 */
membersRoute.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  if (!c.env.DATABASE_URL) {
    return c.json(
      { ok: false, error: "internal", message: "Database is not configured" },
      500
    );
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const result = await loadMemberDossierBySlug(db, slug);

    if (!result) {
      return c.json(
        { ok: false, error: "not_found", message: "Member not found." },
        404
      );
    }

    // Private profile: surface just enough so the page can confirm
    // the member exists without exposing any other field. The web
    // app renders a stub for this shape.
    if (result.kind === "private") {
      return c.json({
        ok: true,
        private: {
          memberId: result.memberId,
          displayName: result.displayName,
        },
      });
    }

    // Strip account-private fields for public surface.
    const { email, marketingConsent, isLegacyImport, ...publicShape } =
      result.dossier;
    void email;
    void marketingConsent;
    void isLegacyImport;

    return c.json({ ok: true, member: publicShape });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("/members/:slug failed", message);
    return c.json({ ok: false, error: "internal", message }, 500);
  }
});
