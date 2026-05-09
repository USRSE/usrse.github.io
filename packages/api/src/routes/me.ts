import { Hono } from "hono";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "../db";
import {
  countries,
  disciplines,
  languages,
  organizations,
  profiles,
  skills,
  userDisciplines,
  userLanguages,
  userOrganizations,
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

/**
 * Resolve a WorkOS-authenticated user to the canonical row, walking
 * the merge chain when applicable. Returns null when no user is
 * provisioned yet, when the user is soft-deleted, or when the merge
 * chain is broken (a merged_into target that no longer exists).
 *
 * Bounded chain depth — merges shouldn't cascade more than once or
 * twice in practice, but a small cap protects against accidental
 * loops a future admin tool might create.
 */
async function findCanonicalUser(
  db: ReturnType<typeof createDb>,
  workosId: string
): Promise<{ id: string; memberId: string } | null> {
  const head = await db
    .select({
      id: users.id,
      memberId: users.memberId,
      mergedIntoUserId: users.mergedIntoUserId,
    })
    .from(users)
    .where(and(eq(users.workosId, workosId), isNull(users.deletedAt)))
    .limit(1);
  let row = head[0];
  if (!row) return null;
  for (let depth = 0; depth < 5 && row.mergedIntoUserId; depth++) {
    const next = await db
      .select({
        id: users.id,
        memberId: users.memberId,
        mergedIntoUserId: users.mergedIntoUserId,
      })
      .from(users)
      .where(and(eq(users.id, row.mergedIntoUserId), isNull(users.deletedAt)))
      .limit(1);
    if (!next[0]) return null;
    row = next[0];
  }
  return { id: row.id, memberId: row.memberId };
}

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
    // organizationId removed — affiliations are now managed via the
    // POST/DELETE /me/organizations endpoints since a member can have
    // multiple. See packages/api/src/db/schema/joins.ts.
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

    const user = await findCanonicalUser(db, workosId);

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

    const user = await findCanonicalUser(db, workosId);
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
    // Profile presence drives whether we PATCH or INSERT below.
    // Pulled separately because findCanonicalUser doesn't carry the
    // related profile through the chain walk.
    const existingProfile = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

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
      if (existingProfile[0]) {
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
              "One of the referenced ids (pronoun, country, career stage) does not exist.",
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
): Promise<{
  id: string;
  memberId: string;
  profile: { id: string; photoStorageKey: string | null } | null;
} | null> {
  // Walk the merge chain first — photo writes belong on the canonical
  // user, not the merged tombstone.
  const canonical = await findCanonicalUser(db, workosId);
  if (!canonical) return null;
  const profile = await db
    .select({
      id: profiles.id,
      photoStorageKey: profiles.photoStorageKey,
    })
    .from(profiles)
    .where(eq(profiles.userId, canonical.id))
    .limit(1);
  return {
    id: canonical.id,
    memberId: canonical.memberId,
    profile: profile[0] ?? null,
  };
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

// ── Vocab edit (disciplines + skills + languages) ────────────────────
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
  status: "pending" | "approved" | "rejected";
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
  table: typeof disciplines | typeof skills | typeof languages,
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

    const user = await findCanonicalUser(db, workosId);
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
  const user = await findCanonicalUser(db, workosId);
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

    const user = await findCanonicalUser(db, workosId);
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
  const user = await findCanonicalUser(db, workosId);
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

// ── Languages ─────────────────────────────────────────────────────────

meRoute.post(
  "/languages",
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

    const user = await findCanonicalUser(db, workosId);
    if (!user) {
      return c.json(
        { ok: false, error: "user_pending", message: "Account not provisioned." },
        404
      );
    }

    const resolved = await resolveVocabPick(db, languages, user.id, input);
    if (!resolved.ok) {
      return c.json(
        { ok: false, error: "invalid_input", message: resolved.message },
        resolved.status
      );
    }

    await db
      .insert(userLanguages)
      .values({ userId: user.id, languageId: resolved.row.id })
      .onConflictDoNothing();

    const updated = await loadMemberDossier(db, user.id);
    if (!updated) return c.json({ ok: false, error: "internal" }, 500);
    return c.json({ ok: true, user: updated, language: resolved.row });
  }
);

meRoute.delete("/languages/:id", async (c) => {
  const workosId = c.get("workosUserId");
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  const db = createDb(c.env.DATABASE_URL);
  const user = await findCanonicalUser(db, workosId);
  if (!user) {
    return c.json(
      { ok: false, error: "user_pending", message: "Account not provisioned." },
      404
    );
  }

  await db
    .delete(userLanguages)
    .where(
      and(eq(userLanguages.userId, user.id), eq(userLanguages.languageId, id))
    );

  const updated = await loadMemberDossier(db, user.id);
  if (!updated) return c.json({ ok: false, error: "internal" }, 500);
  return c.json({ ok: true, user: updated });
});

// ── Organizations (affiliations) ──────────────────────────────────────
//
// A member can have many affiliations now. Adds either reference an
// existing approved organization by id or propose a new one by name
// (status=pending, awaiting admin approval). The join row carries
// per-affiliation metadata: is_primary (drives the dossier "based at"
// pillar), role, and start/end dates.

/**
 * Resolve an "existing or proposed" organization pick. Mirrors
 * resolveVocabPick but follows the `merged_into_id` chain so members
 * who add a deprecated/duplicate row land on the canonical organization
 * automatically.
 */
async function resolveOrganizationPick(
  db: ReturnType<typeof createDb>,
  suggesterId: string,
  input: { id?: string; name?: string }
): Promise<
  | { ok: true; row: VocabResolved }
  | { ok: false; status: 400 | 404; message: string }
> {
  // Walk a possible merged_into chain to the canonical row. Bounded
  // depth — organizations don't deep-chain, but a small cap protects
  // against accidental loops.
  type OrganizationLookup = {
    id: string;
    name: string;
    slug: string;
    status: "pending" | "approved" | "rejected";
    mergedIntoId: string | null;
  };
  const resolveCanonical = async (
    startId: string
  ): Promise<VocabResolved | null> => {
    let cursor: string | null = startId;
    for (let depth = 0; depth < 5 && cursor; depth++) {
      const rows: OrganizationLookup[] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          status: organizations.status,
          mergedIntoId: organizations.mergedIntoId,
        })
        .from(organizations)
        .where(eq(organizations.id, cursor))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      if (!row.mergedIntoId) {
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          status: row.status,
        };
      }
      cursor = row.mergedIntoId;
    }
    return null;
  };

  if (input.id) {
    const resolved = await resolveCanonical(input.id);
    if (!resolved) {
      return { ok: false, status: 404, message: "Organization id not found." };
    }
    if (resolved.status !== "approved") {
      return {
        ok: false,
        status: 400,
        message:
          "Organization id refers to a pending row — propose by name instead.",
      };
    }
    return { ok: true, row: resolved };
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

  const existingBySlug = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      status: organizations.status,
      mergedIntoId: organizations.mergedIntoId,
    })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (existingBySlug[0]) {
    const e = existingBySlug[0];
    if (e.mergedIntoId) {
      const canonical = await resolveCanonical(e.mergedIntoId);
      if (canonical) return { ok: true, row: canonical };
    }
    return {
      ok: true,
      row: { id: e.id, name: e.name, slug: e.slug, status: e.status },
    };
  }

  const inserted = await db
    .insert(organizations)
    .values({
      name,
      slug,
      status: "pending",
      suggestedBy: suggesterId,
    })
    .returning({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      status: organizations.status,
    });
  return { ok: true, row: inserted[0] as VocabResolved };
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

const organizationAddSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().min(1).max(200).optional(),
    isPrimary: z.boolean().optional(),
    role: z.string().max(140).nullable().optional(),
    startedAt: z.string().regex(ISO_DATE_PATTERN).nullable().optional(),
    endedAt: z.string().regex(ISO_DATE_PATTERN).nullable().optional(),
  })
  .strict()
  .refine((v) => Boolean(v.id) !== Boolean(v.name), {
    message: "Provide exactly one of `id` or `name`.",
  });

type OrganizationAddInput = z.infer<typeof organizationAddSchema>;

const organizationPatchSchema = z
  .object({
    isPrimary: z.boolean().optional(),
    role: z.string().max(140).nullable().optional(),
    startedAt: z.string().regex(ISO_DATE_PATTERN).nullable().optional(),
    endedAt: z.string().regex(ISO_DATE_PATTERN).nullable().optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.isPrimary !== undefined ||
      v.role !== undefined ||
      v.startedAt !== undefined ||
      v.endedAt !== undefined,
    { message: "At least one field must be provided." }
  );

type OrganizationPatchInput = z.infer<typeof organizationPatchSchema>;

/**
 * Demote any other primary affiliation for the user. Called before
 * setting a new primary. The partial unique index on (user_id) WHERE
 * is_primary = true would otherwise reject a second primary.
 */
async function demoteOtherPrimaries(
  db: ReturnType<typeof createDb>,
  userId: string,
  exceptJoinId?: string
) {
  const conditions = [
    eq(userOrganizations.userId, userId),
    eq(userOrganizations.isPrimary, true),
  ];
  if (exceptJoinId) {
    conditions.push(sql`${userOrganizations.id} <> ${exceptJoinId}`);
  }
  await db
    .update(userOrganizations)
    .set({ isPrimary: false, updatedAt: new Date() })
    .where(and(...conditions));
}

meRoute.post(
  "/organizations",
  zValidator("json", organizationAddSchema, (result, c) => {
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
    const input = c.req.valid("json") as OrganizationAddInput;

    const user = await findCanonicalUser(db, workosId);
    if (!user) {
      return c.json(
        { ok: false, error: "user_pending", message: "Account not provisioned." },
        404
      );
    }

    const resolved = await resolveOrganizationPick(db, user.id, {
      id: input.id,
      name: input.name,
    });
    if (!resolved.ok) {
      return c.json(
        { ok: false, error: "invalid_input", message: resolved.message },
        resolved.status
      );
    }

    // If this is the user's first affiliation, default to primary
    // unless they explicitly said otherwise. Saves a click on the
    // common case.
    let isPrimary = input.isPrimary;
    if (isPrimary === undefined) {
      const existing = await db
        .select({ id: userOrganizations.id })
        .from(userOrganizations)
        .where(eq(userOrganizations.userId, user.id))
        .limit(1);
      isPrimary = existing.length === 0;
    }

    if (isPrimary) {
      await demoteOtherPrimaries(db, user.id);
    }

    // (user_id, organization_id) is unique — re-adding upgrades the
    // metadata on the existing row instead of duplicating it.
    await db
      .insert(userOrganizations)
      .values({
        userId: user.id,
        organizationId: resolved.row.id,
        isPrimary,
        role: input.role ?? null,
        startedAt: input.startedAt ? new Date(input.startedAt) : null,
        endedAt: input.endedAt ? new Date(input.endedAt) : null,
      })
      .onConflictDoUpdate({
        target: [userOrganizations.userId, userOrganizations.organizationId],
        set: {
          isPrimary,
          role: input.role ?? null,
          startedAt: input.startedAt ? new Date(input.startedAt) : null,
          endedAt: input.endedAt ? new Date(input.endedAt) : null,
          updatedAt: new Date(),
        },
      });

    const updated = await loadMemberDossier(db, user.id);
    if (!updated) return c.json({ ok: false, error: "internal" }, 500);
    return c.json({ ok: true, user: updated, organization: resolved.row });
  }
);

meRoute.patch(
  "/organizations/:joinId",
  zValidator("json", organizationPatchSchema, (result, c) => {
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
    const joinId = c.req.param("joinId");
    if (!/^[0-9a-f-]{36}$/i.test(joinId)) {
      return c.json({ ok: false, error: "invalid_input" }, 400);
    }
    const db = createDb(c.env.DATABASE_URL);
    const input = c.req.valid("json") as OrganizationPatchInput;

    const user = await findCanonicalUser(db, workosId);
    if (!user) {
      return c.json(
        { ok: false, error: "user_pending", message: "Account not provisioned." },
        404
      );
    }

    // Verify the join row belongs to this user before any writes.
    const existing = await db
      .select({ id: userOrganizations.id })
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.id, joinId),
          eq(userOrganizations.userId, user.id)
        )
      )
      .limit(1);
    if (!existing[0]) {
      return c.json({ ok: false, error: "not_found" }, 404);
    }

    if (input.isPrimary === true) {
      await demoteOtherPrimaries(db, user.id, joinId);
    }

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.isPrimary !== undefined) patch.isPrimary = input.isPrimary;
    if (input.role !== undefined) patch.role = input.role;
    if (input.startedAt !== undefined) {
      patch.startedAt = input.startedAt ? new Date(input.startedAt) : null;
    }
    if (input.endedAt !== undefined) {
      patch.endedAt = input.endedAt ? new Date(input.endedAt) : null;
    }

    await db
      .update(userOrganizations)
      .set(patch)
      .where(eq(userOrganizations.id, joinId));

    const updated = await loadMemberDossier(db, user.id);
    if (!updated) return c.json({ ok: false, error: "internal" }, 500);
    return c.json({ ok: true, user: updated });
  }
);

meRoute.delete("/organizations/:joinId", async (c) => {
  const workosId = c.get("workosUserId");
  const joinId = c.req.param("joinId");
  if (!/^[0-9a-f-]{36}$/i.test(joinId)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  const db = createDb(c.env.DATABASE_URL);
  const user = await findCanonicalUser(db, workosId);
  if (!user) {
    return c.json(
      { ok: false, error: "user_pending", message: "Account not provisioned." },
      404
    );
  }

  // Scoped delete — deleting another user's join id is a silent no-op
  // (returns the user's current dossier unchanged), no information leak.
  await db
    .delete(userOrganizations)
    .where(
      and(
        eq(userOrganizations.id, joinId),
        eq(userOrganizations.userId, user.id)
      )
    );

  const updated = await loadMemberDossier(db, user.id);
  if (!updated) return c.json({ ok: false, error: "internal" }, 500);
  return c.json({ ok: true, user: updated });
});
