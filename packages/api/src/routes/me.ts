import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "../db";
import { profiles, users } from "../db/schema";
import { loadMemberDossier } from "../lib/dossier";
import { buildProfileSlug } from "../lib/member-id";
import { requireAuth } from "../middleware/auth";
import {
  PhotoUploadError,
  deleteProfilePhoto,
  storeProfilePhoto,
  storeProfilePhotoFromUrl,
} from "../lib/storage";
import type { AppEnv } from "../types";

export const meRoute = new Hono<AppEnv>();

meRoute.use("*", requireAuth);

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

// Slug is derived server-side from displayName + memberId — clients
// don't supply it. See buildProfileSlug for the format.
const profilePatchSchema = z
  .object({
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

meRoute.get("/", async (c) => {
  const workosId = c.get("workosUserId");

  if (!c.env.DATABASE_URL) {
    console.error("/me: DATABASE_URL is not configured");
    return c.json(
      { ok: false, error: "internal", message: "Database is not configured" },
      500
    );
  }

  try {
    const db = createDb(c.env.DATABASE_URL);

    const user = await db.query.users.findFirst({
      where: and(eq(users.workosId, workosId), isNull(users.deletedAt)),
      columns: { id: true },
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

    const dossier = await loadMemberDossier(db, user.id);
    if (!dossier) {
      return c.json({ ok: false, error: "internal" }, 500);
    }
    return c.json({ ok: true, user: dossier });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("/me handler failed", JSON.stringify({ message, stack }));
    return c.json(
      { ok: false, error: "internal", message },
      500
    );
  }
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

    try {
      if (user.profile) {
        // Slug stays put once set — renaming yourself doesn't move
        // your URL, which keeps existing links to the profile alive.
        await db
          .update(profiles)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(profiles.userId, user.id));
      } else {
        if (!input.displayName) {
          return c.json(
            {
              ok: false,
              error: "missing_fields",
              message: "displayName is required when creating a profile.",
            },
            400
          );
        }
        const slug = buildProfileSlug(input.displayName, user.memberId);
        await db.insert(profiles).values({
          userId: user.id,
          slug,
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

    const updated = await loadMemberDossier(db, user.id);
    if (!updated) {
      return c.json({ ok: false, error: "internal" }, 500);
    }
    return c.json({ ok: true, user: updated });
  }
);

// ── Profile photo ────────────────────────────────────────────────────
//
// Three endpoints share one shape: resolve the requesting user, run
// the storage op (upload from bytes / fetch from URL / delete),
// persist the resulting (photoUrl, photoStorageKey) pair, and return
// the refreshed dossier so the client can re-render without a second
// GET. Replacing a photo always deletes the prior R2 object so we
// never accumulate orphans — one photo per member at any moment.

async function resolveOwnerWithProfile(
  db: ReturnType<typeof createDb>,
  workosId: string
) {
  return db.query.users.findFirst({
    where: and(eq(users.workosId, workosId), isNull(users.deletedAt)),
    with: { profile: true },
  });
}

async function persistPhotoChange(
  db: ReturnType<typeof createDb>,
  userId: string,
  hasProfile: boolean,
  next: { photoUrl: string | null; photoStorageKey: string | null }
) {
  if (hasProfile) {
    await db
      .update(profiles)
      .set({ ...next, updatedAt: new Date() })
      .where(eq(profiles.userId, userId));
    return;
  }
  // Profile rows are usually created in PATCH /profile before a photo
  // makes sense, but fall back gracefully — minimal row, slug derived
  // later when the member adds their displayName.
  // No-op here; the caller should reject this case at the API level.
}

meRoute.post("/profile/photo", async (c) => {
  const workosId = c.get("workosUserId");
  const db = createDb(c.env.DATABASE_URL);
  const user = await resolveOwnerWithProfile(db, workosId);
  if (!user) {
    return c.json({ ok: false, error: "user_pending" }, 404);
  }
  if (!user.profile) {
    return c.json(
      {
        ok: false,
        error: "no_profile",
        message: "Create your profile (PATCH /me/profile) before uploading a photo.",
      },
      409
    );
  }

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json(
      { ok: false, error: "invalid_input", message: "Expected multipart/form-data" },
      400
    );
  }

  const file = form.get("file");
  // FormData entries are either string (text fields) or Blob (files).
  // We need a Blob — anything else is malformed input. The cast is
  // safe in the Workers runtime; the `never` narrowing in tsc is an
  // artifact of the declaration files not modeling File explicitly.
  if (file === null || typeof file === "string") {
    return c.json(
      { ok: false, error: "invalid_input", message: "Missing 'file' field" },
      400
    );
  }

  const blob = file as unknown as Blob;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let stored;
  try {
    stored = await storeProfilePhoto({
      bucket: c.env.PROFILE_PHOTOS,
      publicBaseUrl: c.env.PROFILE_PHOTOS_PUBLIC_URL,
      userId: user.id,
      bytes,
    });
  } catch (e) {
    if (e instanceof PhotoUploadError) {
      return c.json({ ok: false, error: "invalid_input", message: e.message }, e.status as 400 | 413 | 415);
    }
    throw e;
  }

  // Best-effort cleanup of the prior object — failing here doesn't
  // block the new photo from going live; an orphan is recoverable
  // via a future sweep, but a failed user save isn't.
  if (user.profile.photoStorageKey) {
    try {
      await deleteProfilePhoto(c.env.PROFILE_PHOTOS, user.profile.photoStorageKey);
    } catch (e) {
      console.warn("photo cleanup failed", { key: user.profile.photoStorageKey, e });
    }
  }

  await persistPhotoChange(db, user.id, true, stored);

  const updated = await loadMemberDossier(db, user.id);
  if (!updated) return c.json({ ok: false, error: "internal" }, 500);
  return c.json({ ok: true, user: updated });
});

const photoFromUrlSchema = z
  .object({ url: z.url().max(2000) })
  .strict();

meRoute.post(
  "/profile/photo/from-url",
  zValidator("json", photoFromUrlSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          error: "invalid_input",
          issues: result.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        400
      );
    }
  }),
  async (c) => {
    const workosId = c.get("workosUserId");
    const db = createDb(c.env.DATABASE_URL);
    const user = await resolveOwnerWithProfile(db, workosId);
    if (!user) {
      return c.json({ ok: false, error: "user_pending" }, 404);
    }
    if (!user.profile) {
      return c.json(
        {
          ok: false,
          error: "no_profile",
          message: "Create your profile (PATCH /me/profile) before uploading a photo.",
        },
        409
      );
    }
    const { url } = c.req.valid("json");

    let stored;
    try {
      stored = await storeProfilePhotoFromUrl({
        bucket: c.env.PROFILE_PHOTOS,
        publicBaseUrl: c.env.PROFILE_PHOTOS_PUBLIC_URL,
        userId: user.id,
        sourceUrl: url,
      });
    } catch (e) {
      if (e instanceof PhotoUploadError) {
        return c.json({ ok: false, error: "invalid_input", message: e.message }, e.status as 400 | 413 | 415 | 502);
      }
      throw e;
    }

    if (user.profile.photoStorageKey) {
      try {
        await deleteProfilePhoto(
          c.env.PROFILE_PHOTOS,
          user.profile.photoStorageKey
        );
      } catch (e) {
        console.warn("photo cleanup failed", { key: user.profile.photoStorageKey, e });
      }
    }

    await persistPhotoChange(db, user.id, true, stored);

    const updated = await loadMemberDossier(db, user.id);
    if (!updated) return c.json({ ok: false, error: "internal" }, 500);
    return c.json({ ok: true, user: updated });
  }
);

meRoute.delete("/profile/photo", async (c) => {
  const workosId = c.get("workosUserId");
  const db = createDb(c.env.DATABASE_URL);
  const user = await resolveOwnerWithProfile(db, workosId);
  if (!user) {
    return c.json({ ok: false, error: "user_pending" }, 404);
  }
  if (!user.profile) {
    return c.json({ ok: false, error: "no_profile" }, 409);
  }

  // Only delete from R2 if we own the object — externally-pasted
  // URLs (no storage key) just have their row reference cleared.
  if (user.profile.photoStorageKey) {
    try {
      await deleteProfilePhoto(c.env.PROFILE_PHOTOS, user.profile.photoStorageKey);
    } catch (e) {
      console.warn("photo delete failed", { key: user.profile.photoStorageKey, e });
    }
  }

  await persistPhotoChange(db, user.id, true, {
    photoUrl: null,
    photoStorageKey: null,
  });

  const updated = await loadMemberDossier(db, user.id);
  if (!updated) return c.json({ ok: false, error: "internal" }, 500);
  return c.json({ ok: true, user: updated });
});
