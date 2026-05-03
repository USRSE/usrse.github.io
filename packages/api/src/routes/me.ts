import { Hono } from "hono";
import { and, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "../db";
import { profiles, users } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

export const meRoute = new Hono<AppEnv>();

meRoute.use("*", requireAuth);

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

const profilePatchSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(50)
      .regex(SLUG_PATTERN, "slug must be lowercase kebab-case")
      .optional(),
    displayName: z.string().min(1).max(100).optional(),
    headline: z.string().max(140).nullable().optional(),
    bio: z.string().max(5000).nullable().optional(),
    photoUrl: z.url().max(500).nullable().optional(),
    jobTitle: z.string().max(100).nullable().optional(),
    githubUrl: z.url().max(200).nullable().optional(),
    linkedinUrl: z.url().max(200).nullable().optional(),
    orcid: z
      .string()
      .regex(ORCID_PATTERN, "orcid must match 0000-0000-0000-000X")
      .nullable()
      .optional(),
    websiteUrl: z.url().max(200).nullable().optional(),
    pronounId: z.uuid().nullable().optional(),
    institutionId: z.uuid().nullable().optional(),
    careerStageId: z.uuid().nullable().optional(),
    countryId: z.uuid().nullable().optional(),
    region: z.string().max(100).nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    showOnMap: z.boolean().optional(),
    publicLocation: z.string().max(140).nullable().optional(),
    isPublic: z.boolean().optional(),
  })
  .strict();

type ProfilePatch = z.infer<typeof profilePatchSchema>;

interface UserRow {
  id: string;
  email: string;
  role: string;
  marketingConsent: boolean;
  isLegacyImport: boolean;
  createdAt: Date;
  profile: typeof profiles.$inferSelect | null;
}

function shapeUser(user: UserRow) {
  return {
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
          pronounId: user.profile.pronounId,
          institutionId: user.profile.institutionId,
          careerStageId: user.profile.careerStageId,
          countryId: user.profile.countryId,
          region: user.profile.region,
          city: user.profile.city,
          showOnMap: user.profile.showOnMap,
          publicLocation: user.profile.publicLocation,
          isPublic: user.profile.isPublic,
        }
      : null,
  };
}

meRoute.get("/", async (c) => {
  const workosId = c.get("workosUserId");
  const db = createDb(c.env.DATABASE_URL);

  const user = await db.query.users.findFirst({
    where: and(eq(users.workosId, workosId), isNull(users.deletedAt)),
    with: { profile: true },
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

  return c.json({ ok: true, user: shapeUser(user) });
});

meRoute.patch(
  "/profile",
  zValidator("json", profilePatchSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          error: "invalid_input",
          issues: result.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        400
      );
    }
  }),
  async (c) => {
    const workosId = c.get("workosUserId");
    const db = createDb(c.env.DATABASE_URL);
    const input = c.req.valid("json") as ProfilePatch;

    const user = await db.query.users.findFirst({
      where: and(eq(users.workosId, workosId), isNull(users.deletedAt)),
      with: { profile: true },
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

    if (input.slug) {
      const collision = await db.query.profiles.findFirst({
        where: and(
          eq(profiles.slug, input.slug),
          ne(profiles.userId, user.id)
        ),
        columns: { id: true },
      });
      if (collision) {
        return c.json(
          {
            ok: false,
            error: "slug_conflict",
            message: "That slug is already in use by another member.",
          },
          409
        );
      }
    }

    try {
      if (user.profile) {
        await db
          .update(profiles)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(profiles.userId, user.id));
      } else {
        if (!input.slug || !input.displayName) {
          return c.json(
            {
              ok: false,
              error: "missing_fields",
              message:
                "slug and displayName are required when creating a profile.",
            },
            400
          );
        }
        await db.insert(profiles).values({
          userId: user.id,
          slug: input.slug,
          displayName: input.displayName,
          ...input,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/violates foreign key constraint/i.test(msg)) {
        return c.json(
          {
            ok: false,
            error: "invalid_reference",
            message:
              "One of the referenced ids (pronoun, institution, country, career stage) does not exist.",
          },
          400
        );
      }
      throw e;
    }

    const updated = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      with: { profile: true },
    });
    if (!updated) {
      return c.json({ ok: false, error: "internal" }, 500);
    }
    return c.json({ ok: true, user: shapeUser(updated) });
  }
);
