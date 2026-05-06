import { Hono } from "hono";
import { createDb } from "../db";
import { loadMemberDossierBySlug } from "../lib/dossier";
import type { AppEnv } from "../types";

export const membersRoute = new Hono<AppEnv>();

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
