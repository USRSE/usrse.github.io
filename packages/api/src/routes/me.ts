import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "../db";
import {
  countries,
  disciplines,
  profiles,
  skills,
  userDisciplines,
  userSkills,
  users,
} from "../db/schema";
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
    // ISO 3166-1 alpha-2 alternative to countryId. The frontend's
    // location combobox returns ISO codes (Photon GeoJSON gives a
    // `properties.countrycode`), and resolving them to our internal
    // UUID server-side spares the client from round-tripping the
    // countries vocab on every profile save.
    countryIso2: z
      .string()
      .regex(/^[A-Za-z]{2}$/, "ISO alpha-2 must be two letters")
      .nullable()
      .optional(),
    region: z.string().max(100).nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    // Coordinates from a geocoded place pick. Numeric column on the
    // DB side is numeric(9,6) so it stores ~1cm precision and any
    // valid lat/long fits.
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    showOnMap: z.boolean().optional(),
    publicLocation: z.string().max(140).nullable().optional(),
    isPublic: z.boolean().optional(),
    isDiscoverable: z.boolean().optional(),
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

    // Resolve countryIso2 → countryId before the DB write. Done
    // here rather than in the zod schema because it requires a DB
    // lookup. If both are present, the explicit countryId wins.
    const { countryIso2, ...rest } = input;
    const patch: Record<string, unknown> = { ...rest };
    if (countryIso2 != null && patch.countryId === undefined) {
      const iso = countryIso2.toUpperCase();
      const match = await db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.isoAlpha2, iso))
        .limit(1);
      patch.countryId = match[0]?.id ?? null;
    }

    // Drizzle's numeric column wants strings. Convert lat/lng if
    // present; null stays null.
    if (patch.latitude !== undefined) {
      patch.latitude =
        patch.latitude == null ? null : String(patch.latitude);
    }
    if (patch.longitude !== undefined) {
      patch.longitude =
        patch.longitude == null ? null : String(patch.longitude);
    }

    try {
      if (user.profile) {
        // Slug stays put once set — renaming yourself doesn't move
        // your URL, which keeps existing links to the profile alive.
        await db
          .update(profiles)
          .set({ ...patch, updatedAt: new Date() })
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
          ...patch,
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

// ── Vocab edit (disciplines + skills) ────────────────────────────────
//
// Owners curate their Craft chips by linking to existing approved
// vocab rows or proposing new ones. Proposed rows are inserted with
// status=pending and surface in the dossier with a "pending" mark
// for the owner; admin approval flips them to status=approved later.
//
// Disciplines and skills share identical mechanics — only the vocab
// + join tables differ — so the resolver helper is generic over the
// table and the route bodies are short.

const vocabAddSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().min(1).max(80).optional(),
  })
  .strict()
  .refine((v) => Boolean(v.id) !== Boolean(v.name), {
    message: "Provide exactly one of `id` or `name`.",
  });

type VocabAddInput = z.infer<typeof vocabAddSchema>;

interface VocabResolved {
  id: string;
  name: string;
  slug: string;
  status: "pending" | "approved";
}

/**
 * Slugify a free-text name into the kebab-case form used by the
 * vocab tables. Strips anything outside [a-z0-9], collapses runs
 * of separators, and caps at 80 chars to fit the unique index.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Resolve an "existing or proposed" vocab pick into a concrete row.
 *
 * - When `id` is supplied, validate it exists and is approved.
 * - When `name` is supplied, slugify and look up by slug. If a row
 *   with that slug already exists (any status), reuse it — this
 *   auto-deduplicates simultaneous proposals of the same term.
 *   Otherwise insert a new pending row attributed to the suggester.
 */
async function resolveVocabPick(
  db: ReturnType<typeof createDb>,
  table: typeof disciplines | typeof skills,
  suggesterId: string,
  input: VocabAddInput
): Promise<
  | { ok: true; row: VocabResolved }
  | { ok: false; status: 400 | 404; message: string }
> {
  if (input.id) {
    const rows = await db
      .select({
        id: table.id,
        name: table.name,
        slug: table.slug,
        status: table.status,
      })
      .from(table)
      .where(eq(table.id, input.id))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return { ok: false, status: 404, message: "Vocab id not found." };
    }
    if (row.status !== "approved") {
      return {
        ok: false,
        status: 400,
        message: "Vocab id refers to a pending row — propose by name instead.",
      };
    }
    return { ok: true, row: row as VocabResolved };
  }

  const name = input.name!.trim();
  if (!name) return { ok: false, status: 400, message: "Name is empty." };
  const slug = slugify(name);
  if (!slug) {
    return {
      ok: false,
      status: 400,
      message: "Name has no slug-safe characters.",
    };
  }

  // Reuse an existing slug if present — handles two users proposing
  // the same term concurrently and avoids unique-constraint races.
  const existing = await db
    .select({
      id: table.id,
      name: table.name,
      slug: table.slug,
      status: table.status,
    })
    .from(table)
    .where(eq(table.slug, slug))
    .limit(1);
  if (existing[0]) {
    return { ok: true, row: existing[0] as VocabResolved };
  }

  const inserted = await db
    .insert(table)
    .values({
      name,
      slug,
      status: "pending",
      suggestedBy: suggesterId,
    })
    .returning({
      id: table.id,
      name: table.name,
      slug: table.slug,
      status: table.status,
    });
  return { ok: true, row: inserted[0] as VocabResolved };
}

// ── Disciplines ───────────────────────────────────────────────────────

meRoute.post(
  "/disciplines",
  zValidator("json", vocabAddSchema, (result, c) => {
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
    const input = c.req.valid("json") as VocabAddInput;

    const user = await db.query.users.findFirst({
      where: and(eq(users.workosId, workosId), isNull(users.deletedAt)),
      columns: { id: true },
    });
    if (!user) {
      return c.json(
        { ok: false, error: "user_pending", message: "Account not provisioned." },
        404
      );
    }

    const resolved = await resolveVocabPick(db, disciplines, user.id, input);
    if (!resolved.ok) {
      return c.json(
        { ok: false, error: "invalid_input", message: resolved.message },
        resolved.status
      );
    }

    // Idempotent link — primary key on (userId, disciplineId) means
    // re-adding is a silent no-op rather than a 409.
    await db
      .insert(userDisciplines)
      .values({ userId: user.id, disciplineId: resolved.row.id })
      .onConflictDoNothing();

    const updated = await loadMemberDossier(db, user.id);
    if (!updated) return c.json({ ok: false, error: "internal" }, 500);
    return c.json({ ok: true, user: updated, discipline: resolved.row });
  }
);

meRoute.delete("/disciplines/:id", async (c) => {
  const workosId = c.get("workosUserId");
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  const db = createDb(c.env.DATABASE_URL);
  const user = await db.query.users.findFirst({
    where: and(eq(users.workosId, workosId), isNull(users.deletedAt)),
    columns: { id: true },
  });
  if (!user) {
    return c.json(
      { ok: false, error: "user_pending", message: "Account not provisioned." },
      404
    );
  }

  await db
    .delete(userDisciplines)
    .where(
      and(
        eq(userDisciplines.userId, user.id),
        eq(userDisciplines.disciplineId, id)
      )
    );

  const updated = await loadMemberDossier(db, user.id);
  if (!updated) return c.json({ ok: false, error: "internal" }, 500);
  return c.json({ ok: true, user: updated });
});

// ── Skills ────────────────────────────────────────────────────────────

meRoute.post(
  "/skills",
  zValidator("json", vocabAddSchema, (result, c) => {
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
    const input = c.req.valid("json") as VocabAddInput;

    const user = await db.query.users.findFirst({
      where: and(eq(users.workosId, workosId), isNull(users.deletedAt)),
      columns: { id: true },
    });
    if (!user) {
      return c.json(
        { ok: false, error: "user_pending", message: "Account not provisioned." },
        404
      );
    }

    const resolved = await resolveVocabPick(db, skills, user.id, input);
    if (!resolved.ok) {
      return c.json(
        { ok: false, error: "invalid_input", message: resolved.message },
        resolved.status
      );
    }

    await db
      .insert(userSkills)
      .values({ userId: user.id, skillId: resolved.row.id })
      .onConflictDoNothing();

    const updated = await loadMemberDossier(db, user.id);
    if (!updated) return c.json({ ok: false, error: "internal" }, 500);
    return c.json({ ok: true, user: updated, skill: resolved.row });
  }
);

meRoute.delete("/skills/:id", async (c) => {
  const workosId = c.get("workosUserId");
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  const db = createDb(c.env.DATABASE_URL);
  const user = await db.query.users.findFirst({
    where: and(eq(users.workosId, workosId), isNull(users.deletedAt)),
    columns: { id: true },
  });
  if (!user) {
    return c.json(
      { ok: false, error: "user_pending", message: "Account not provisioned." },
      404
    );
  }

  await db
    .delete(userSkills)
    .where(and(eq(userSkills.userId, user.id), eq(userSkills.skillId, id)));

  const updated = await loadMemberDossier(db, user.id);
  if (!updated) return c.json({ ok: false, error: "internal" }, 500);
  return c.json({ ok: true, user: updated });
});
