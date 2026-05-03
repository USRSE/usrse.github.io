import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { createDb } from "../db";
import { users } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

export const meRoute = new Hono<AppEnv>();

meRoute.use("*", requireAuth);

meRoute.get("/", async (c) => {
  const workosId = c.get("workosUserId");
  const db = createDb(c.env.DATABASE_URL);

  const user = await db.query.users.findFirst({
    where: and(eq(users.workosId, workosId), isNull(users.deletedAt)),
    with: {
      profile: true,
    },
  });

  if (!user) {
    return c.json(
      {
        ok: false,
        error: "user_pending",
        message:
          "Your account is being provisioned. Please retry in a moment.",
      },
      404
    );
  }

  return c.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      marketingConsent: user.marketingConsent,
      isLegacyImport: user.isLegacyImport,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            id: user.profile.id,
            slug: user.profile.slug,
            displayName: user.profile.displayName,
            headline: user.profile.headline,
            bio: user.profile.bio,
            photoUrl: user.profile.photoUrl,
            jobTitle: user.profile.jobTitle,
            githubUrl: user.profile.githubUrl,
            linkedinUrl: user.profile.linkedinUrl,
            orcid: user.profile.orcid,
            websiteUrl: user.profile.websiteUrl,
            isPublic: user.profile.isPublic,
            showOnMap: user.profile.showOnMap,
            publicLocation: user.profile.publicLocation,
          }
        : null,
    },
  });
});
