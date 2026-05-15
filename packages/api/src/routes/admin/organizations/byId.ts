import { Hono } from "hono";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../../../db";
import {
  auditLog,
  organizationMerges,
  organizations,
  profiles,
  userOrganizations,
  users,
} from "../../../db/schema";
import { canMergeOrganizations } from "../../../lib/policies";
import { requirePolicy } from "../../../middleware/policy";
import {
  deleteOrgLogo,
  isLogoHostingConfigured,
  LOGO_VARIANTS,
  LogoUploadError,
  storeOrgLogo,
  storeOrgLogoFromUrl,
  type LogoVariant,
} from "../../../lib/storage-org-logo";
import {
  buildOrgMergeSnapshot,
  executeOrgMerge,
  executeOrgUnmerge,
  PROMOTABLE_ORG_FIELDS,
  validateOrgMerge,
  type PromotableOrgField,
} from "../../../lib/admin/orgMerge";
import type { AppEnv } from "../../../types";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const URL_MAX = 500;

const orgPatchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(SLUG_PATTERN, "slug must be lowercase alphanumerics with optional hyphens")
      .optional(),
    shortName: z.string().max(60).nullable().optional(),
    url: z.url().max(URL_MAX).nullable().optional(),
    status: z.enum(["pending", "approved"]).optional(),
    /**
     * Free-form text. Empty / null = no consent → public surfaces hide
     * the logo. Any non-empty value = consent granted (typically an ISO
     * timestamp the UI sets via "Record consent today" so we know
     * *when* the admin gave the green light).
     */
    logoUsageConsent: z.string().max(280).nullable().optional(),
    /** Attribution string surfaced next to the logo when required by
     *  the org's policy ("Logo © Org, used with permission."). */
    logoCredit: z.string().max(280).nullable().optional(),
  })
  .strict();

type OrgPatchInput = z.infer<typeof orgPatchSchema>;

/**
 * Lookup: variant → the two column references the storage helper
 * writes to. Keeping the mapping in one place means the logo endpoints
 * stay vary-by-variant without three near-identical handler bodies.
 */
const VARIANT_COLUMNS = {
  main: { url: "logoUrl", key: "logoStorageKey" },
  dark: { url: "logoDarkUrl", key: "logoDarkStorageKey" },
  mark: { url: "logoMarkUrl", key: "logoMarkStorageKey" },
} as const satisfies Record<LogoVariant, { url: string; key: string }>;

function parseVariant(raw: string | undefined): LogoVariant | null {
  if (!raw) return "main";
  return (LOGO_VARIANTS as readonly string[]).includes(raw)
    ? (raw as LogoVariant)
    : null;
}

export const adminOrganizationsByIdRoute = new Hono<AppEnv>();

/**
 * GET /api/admin/organizations/:id
 *
 * Returns the org row plus a small summary of related state: a member
 * count, the most recent affiliations (so admins can sanity-check who
 * this org is attached to before editing), and recent audit entries
 * that name this org as actor or target.
 */
adminOrganizationsByIdRoute.get("/", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const orgRow = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!orgRow) return c.json({ ok: false, error: "not_found" }, 404);

  const [{ count: memberCount }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userOrganizations)
    .where(eq(userOrganizations.organizationId, id));

  // Recent affiliations — show the 20 most-recently-added members so
  // an admin can eyeball who's attached before they edit / delete.
  // Order: primary first (badge-relevant), then most recently linked.
  const recentAffiliations = await db
    .select({
      userId: users.id,
      memberId: users.memberId,
      displayName: profiles.displayName,
      isPrimary: userOrganizations.isPrimary,
      role: userOrganizations.role,
      startedAt: userOrganizations.startedAt,
      createdAt: userOrganizations.createdAt,
    })
    .from(userOrganizations)
    .innerJoin(users, eq(users.id, userOrganizations.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        eq(userOrganizations.organizationId, id),
        isNull(users.deletedAt),
        isNull(users.mergedIntoUserId)
      )
    )
    .orderBy(desc(userOrganizations.isPrimary), desc(userOrganizations.createdAt))
    .limit(20);

  const recentAudit = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorRole: auditLog.actorRole,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(
      or(
        and(eq(auditLog.targetType, "organizations"), eq(auditLog.targetId, id))
      )!
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  // Inbound merges — this org is the canonical target. Used to render
  // "Folded-in sources" with unmerge buttons on the detail page.
  const inboundMerges = await db
    .select({
      id: organizationMerges.id,
      sourceOrganizationId: organizationMerges.sourceOrganizationId,
      mergedByUserId: organizationMerges.mergedByUserId,
      createdAt: organizationMerges.createdAt,
      revertedAt: organizationMerges.revertedAt,
      reason: organizationMerges.reason,
    })
    .from(organizationMerges)
    .where(eq(organizationMerges.targetOrganizationId, id))
    .orderBy(desc(organizationMerges.createdAt));

  // Outbound merge — this org was folded into another.
  const outboundMerge = orgRow.mergedIntoId
    ? await db
        .select()
        .from(organizationMerges)
        .where(
          and(
            eq(organizationMerges.sourceOrganizationId, id),
            eq(organizationMerges.targetOrganizationId, orgRow.mergedIntoId)
          )
        )
        .orderBy(desc(organizationMerges.createdAt))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  return c.json({
    ok: true,
    organization: {
      ...orgRow,
      createdAt:
        orgRow.createdAt instanceof Date
          ? orgRow.createdAt.toISOString()
          : orgRow.createdAt,
      updatedAt:
        orgRow.updatedAt instanceof Date
          ? orgRow.updatedAt.toISOString()
          : orgRow.updatedAt,
      deletedAt:
        orgRow.deletedAt instanceof Date
          ? orgRow.deletedAt.toISOString()
          : orgRow.deletedAt,
    },
    memberCount,
    recentAffiliations: recentAffiliations.map((a) => ({
      ...a,
      startedAt:
        a.startedAt instanceof Date ? a.startedAt.toISOString() : a.startedAt,
      createdAt:
        a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
    recentAudit: recentAudit.map((a) => ({
      ...a,
      createdAt:
        a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
    merges: {
      inbound: inboundMerges.map((m) => ({
        ...m,
        createdAt:
          m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
        revertedAt:
          m.revertedAt instanceof Date ? m.revertedAt.toISOString() : m.revertedAt,
      })),
      outbound: outboundMerge
        ? {
            id: outboundMerge.id,
            targetOrganizationId: outboundMerge.targetOrganizationId,
            createdAt:
              outboundMerge.createdAt instanceof Date
                ? outboundMerge.createdAt.toISOString()
                : outboundMerge.createdAt,
            revertedAt:
              outboundMerge.revertedAt instanceof Date
                ? outboundMerge.revertedAt.toISOString()
                : outboundMerge.revertedAt,
            reason: outboundMerge.reason,
          }
        : null,
    },
  });
});

/**
 * PATCH /api/admin/organizations/:id
 *
 * Edits name / slug / shortName / url, and flips the vocab status
 * (pending → approved or back). Logo upload + consent gating land in
 * a follow-up slice.
 */
adminOrganizationsByIdRoute.patch(
  "/",
  zValidator("json", orgPatchSchema, (result, c) => {
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
    const id = c.req.param("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return c.json({ ok: false, error: "invalid_input" }, 400);
    }
    if (!c.env.DATABASE_URL)
      return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const input = c.req.valid("json") as OrgPatchInput;

    if (Object.keys(input).length === 0) {
      return c.json({ ok: true, noop: true });
    }

    try {
      const existing = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1)
        .then((r) => r[0]);
      if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

      c.get("auditCapture")?.({ organization: existing });

      try {
        await db
          .update(organizations)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(organizations.id, id));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // The `name` and `slug` columns are unique — a collision should
        // not 500 the request, it should tell the admin which field
        // clashed so they can pick a different value.
        if (/duplicate key value/i.test(msg) || /unique constraint/i.test(msg)) {
          return c.json(
            {
              ok: false,
              error: "conflict",
              message:
                "Another organization already uses that name or slug. Pick a different value.",
            },
            409
          );
        }
        throw e;
      }

      c.set("auditAction", "organizations.update");
      c.set("auditTarget", { type: "organizations", id });

      return c.json({ ok: true });
    } catch (err) {
      // Surface the underlying failure in the response body — this
      // endpoint is gated behind canEditOrganizations (staff+) so an
      // internal SQL error message isn't a security boundary; what IS
      // a problem is an opaque 500 that makes the admin guess.
      //
      // Drizzle wraps Postgres errors as DrizzleQueryError where the
      // outer .message is just "Failed query: <SQL>\nparams: ..." —
      // the actual Postgres error ("column does not exist", "value too
      // long", etc.) is in .cause. Walk the chain so the response
      // includes the real reason.
      const messages: string[] = [];
      let cur: unknown = err;
      let stack: string | undefined;
      while (cur instanceof Error) {
        messages.push(cur.message);
        if (!stack && cur.stack) stack = cur.stack;
        cur = (cur as { cause?: unknown }).cause;
      }
      if (cur !== undefined && cur !== null) messages.push(String(cur));
      const message = messages.join(" | ");
      console.error(
        "[PATCH /admin/organizations/:id]",
        JSON.stringify({ id, inputKeys: Object.keys(input) }),
        message,
        stack
      );
      return c.json(
        {
          ok: false,
          error: "patch_failed",
          message,
          messages,
          ...(stack ? { stack } : {}),
        },
        500
      );
    }
  }
);

/**
 * POST /api/admin/organizations/:id/soft-delete
 *
 * Idempotent — re-deleting a soft-deleted row is a no-op. We do not
 * cascade to user_organizations: a deleted org keeps its membership
 * rows so an admin can review who was attached before the row is
 * eventually hard-deleted or merged.
 */
adminOrganizationsByIdRoute.post("/soft-delete", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

  c.get("auditCapture")?.({ organization: existing });

  if (existing.deletedAt === null) {
    await db
      .update(organizations)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(organizations.id, id));
  }
  c.set("auditAction", "organizations.soft_delete");
  c.set("auditTarget", { type: "organizations", id });
  return c.json({ ok: true });
});

/**
 * POST /api/admin/organizations/:id/restore
 */
adminOrganizationsByIdRoute.post("/restore", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  if (!c.env.DATABASE_URL) return c.json({ ok: false, error: "internal" }, 500);
  const db = createDb(c.env.DATABASE_URL);

  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) return c.json({ ok: false, error: "not_found" }, 404);

  c.get("auditCapture")?.({ organization: existing });

  if (existing.deletedAt !== null) {
    await db
      .update(organizations)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(organizations.id, id));
  }
  c.set("auditAction", "organizations.restore");
  c.set("auditTarget", { type: "organizations", id });
  return c.json({ ok: true });
});

// ── Logo upload ──────────────────────────────────────────────────────
//
// Three variants per org — main / dark / mark — driven by a ?variant=
// query param. Each variant has its own url + storage_key column pair,
// so a swap on one variant doesn't touch the other two. All three
// endpoints below are no-ops until ORGANIZATION_LOGOS is provisioned;
// they return a structured 503 the admin UI can render as a clear
// "logo hosting not configured" state.

function notConfiguredResponse() {
  return {
    ok: false as const,
    error: "not_configured" as const,
    message:
      "Logo hosting isn't configured yet. The ORGANIZATION_LOGOS R2 bucket needs to be provisioned in the Cloudflare dashboard and its public URL set in wrangler.jsonc before uploads can land.",
  };
}

async function loadOrgOr404(c: import("hono").Context<AppEnv>, id: string) {
  if (!c.env.DATABASE_URL) {
    return { error: c.json({ ok: false, error: "internal" }, 500) } as const;
  }
  const db = createDb(c.env.DATABASE_URL);
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!existing) {
    return { error: c.json({ ok: false, error: "not_found" }, 404) } as const;
  }
  return { db, existing } as const;
}

async function persistLogoChange(
  db: ReturnType<typeof createDb>,
  orgId: string,
  variant: LogoVariant,
  next: { url: string | null; storageKey: string | null }
): Promise<void> {
  const cols = VARIANT_COLUMNS[variant];
  await db
    .update(organizations)
    .set({
      [cols.url]: next.url,
      [cols.key]: next.storageKey,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

/**
 * POST /api/admin/organizations/:id/logo?variant=main|dark|mark
 *
 * Multipart upload. The `file` field carries the bytes; the variant
 * defaults to "main" so callers that only ever upload the primary
 * logo don't need to think about the query string.
 */
adminOrganizationsByIdRoute.post("/logo", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  const variant = parseVariant(c.req.query("variant"));
  if (!variant) {
    return c.json(
      {
        ok: false,
        error: "invalid_input",
        message: `variant must be one of ${LOGO_VARIANTS.join(", ")}`,
      },
      400
    );
  }
  if (!isLogoHostingConfigured(c.env)) {
    return c.json(notConfiguredResponse(), 503);
  }

  const loaded = await loadOrgOr404(c, id);
  if ("error" in loaded) return loaded.error;
  const { db, existing } = loaded;
  c.get("auditCapture")?.({ organization: existing });

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json(
      {
        ok: false,
        error: "invalid_input",
        message: "Expected multipart/form-data",
      },
      400
    );
  }
  const file = form.get("file");
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
    stored = await storeOrgLogo({
      bucket: c.env.ORGANIZATION_LOGOS!,
      publicBaseUrl: c.env.ORGANIZATION_LOGOS_PUBLIC_URL,
      orgId: id,
      variant,
      bytes,
    });
  } catch (e) {
    if (e instanceof LogoUploadError) {
      return c.json(
        { ok: false, error: "invalid_input", message: e.message },
        e.status as 400 | 413 | 415
      );
    }
    throw e;
  }

  // Best-effort cleanup of the prior object for this variant only.
  const priorKey = existing[VARIANT_COLUMNS[variant].key as keyof typeof existing] as
    | string
    | null;
  if (priorKey) {
    try {
      await deleteOrgLogo(c.env.ORGANIZATION_LOGOS!, priorKey);
    } catch (e) {
      console.warn("org logo cleanup failed", { key: priorKey, e });
    }
  }

  await persistLogoChange(db, id, variant, {
    url: stored.url,
    storageKey: stored.storageKey,
  });

  c.set("auditAction", "organizations.logo_upload");
  c.set("auditTarget", { type: "organizations", id });
  c.set("auditPayload", { variant });

  return c.json({ ok: true, variant, url: stored.url });
});

const logoFromUrlSchema = z
  .object({ url: z.url().max(2000) })
  .strict();

/**
 * POST /api/admin/organizations/:id/logo/from-url?variant=...
 *
 * Fetch + persist mirror of the upload endpoint. Defensive on the
 * outbound fetch: HTTPS only, hard size cap, hard timeout, basic SSRF
 * guard (lib/storage-org-logo.ts).
 */
adminOrganizationsByIdRoute.post(
  "/logo/from-url",
  zValidator("json", logoFromUrlSchema, (result, c) => {
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
    const id = c.req.param("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return c.json({ ok: false, error: "invalid_input" }, 400);
    }
    const variant = parseVariant(c.req.query("variant"));
    if (!variant) {
      return c.json(
        {
          ok: false,
          error: "invalid_input",
          message: `variant must be one of ${LOGO_VARIANTS.join(", ")}`,
        },
        400
      );
    }
    if (!isLogoHostingConfigured(c.env)) {
      return c.json(notConfiguredResponse(), 503);
    }

    const loaded = await loadOrgOr404(c, id);
    if ("error" in loaded) return loaded.error;
    const { db, existing } = loaded;
    c.get("auditCapture")?.({ organization: existing });

    const { url } = c.req.valid("json");
    let stored;
    try {
      stored = await storeOrgLogoFromUrl({
        bucket: c.env.ORGANIZATION_LOGOS!,
        publicBaseUrl: c.env.ORGANIZATION_LOGOS_PUBLIC_URL,
        orgId: id,
        variant,
        sourceUrl: url,
      });
    } catch (e) {
      if (e instanceof LogoUploadError) {
        return c.json(
          { ok: false, error: "invalid_input", message: e.message },
          e.status as 400 | 413 | 415 | 502
        );
      }
      throw e;
    }

    const priorKey = existing[
      VARIANT_COLUMNS[variant].key as keyof typeof existing
    ] as string | null;
    if (priorKey) {
      try {
        await deleteOrgLogo(c.env.ORGANIZATION_LOGOS!, priorKey);
      } catch (e) {
        console.warn("org logo cleanup failed", { key: priorKey, e });
      }
    }

    await persistLogoChange(db, id, variant, {
      url: stored.url,
      storageKey: stored.storageKey,
    });

    c.set("auditAction", "organizations.logo_upload_from_url");
    c.set("auditTarget", { type: "organizations", id });
    c.set("auditPayload", { variant, sourceUrl: url });

    return c.json({ ok: true, variant, url: stored.url });
  }
);

/**
 * DELETE /api/admin/organizations/:id/logo?variant=...
 *
 * Clears one variant. Only deletes the R2 object when we own it (the
 * storage_key column is non-null) — externally-pasted URLs just have
 * their row reference nulled out.
 */
adminOrganizationsByIdRoute.delete("/logo", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ ok: false, error: "invalid_input" }, 400);
  }
  const variant = parseVariant(c.req.query("variant"));
  if (!variant) {
    return c.json(
      {
        ok: false,
        error: "invalid_input",
        message: `variant must be one of ${LOGO_VARIANTS.join(", ")}`,
      },
      400
    );
  }

  const loaded = await loadOrgOr404(c, id);
  if ("error" in loaded) return loaded.error;
  const { db, existing } = loaded;
  c.get("auditCapture")?.({ organization: existing });

  const priorKey = existing[
    VARIANT_COLUMNS[variant].key as keyof typeof existing
  ] as string | null;
  if (priorKey && isLogoHostingConfigured(c.env)) {
    try {
      await deleteOrgLogo(c.env.ORGANIZATION_LOGOS!, priorKey);
    } catch (e) {
      console.warn("org logo delete failed", { key: priorKey, e });
    }
  }

  await persistLogoChange(db, id, variant, { url: null, storageKey: null });

  c.set("auditAction", "organizations.logo_delete");
  c.set("auditTarget", { type: "organizations", id });
  c.set("auditPayload", { variant });

  return c.json({ ok: true, variant });
});

// ── Merge / Unmerge ──────────────────────────────────────────────────
//
// Source = :id (URL), target = body.targetOrganizationId. Source is
// folded into target. super_admin only via canMergeOrganizations.

const orgMergeBodySchema = z.object({
  targetOrganizationId: z.uuid(),
  promotedFields: z
    .array(
      z.enum(
        PROMOTABLE_ORG_FIELDS as unknown as readonly [
          PromotableOrgField,
          ...PromotableOrgField[]
        ]
      )
    )
    .default([]),
  reason: z.string().max(280).optional(),
});

adminOrganizationsByIdRoute.post(
  "/merge",
  requirePolicy(canMergeOrganizations, () => undefined),
  zValidator("json", orgMergeBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return c.json({ ok: false, error: "invalid_input" }, 400);
    }
    if (!c.env.DATABASE_URL)
      return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const actor = c.get("actor")!;
    const body = c.req.valid("json");

    const req = {
      sourceOrganizationId: id,
      targetOrganizationId: body.targetOrganizationId,
      mergedByUserId: actor.user.id,
      promotedFields: body.promotedFields,
      reason: body.reason,
    };

    const err = await validateOrgMerge(db, req);
    if (err)
      return c.json(
        { ok: false, error: err.error, message: err.message },
        err.status
      );

    const snapshot = await buildOrgMergeSnapshot(db, req);
    c.get("auditCapture")?.({ source: snapshot.source, target: snapshot.target });

    const result = await executeOrgMerge(db, snapshot, req);

    c.set("auditAction", "organizations.merge");
    c.set("auditTarget", {
      type: "organizations",
      id: req.targetOrganizationId,
    });
    c.set("auditPayload", {
      mergeId: result.mergeId,
      sourceOrganizationId: req.sourceOrganizationId,
      targetOrganizationId: req.targetOrganizationId,
      promotedFieldCount: req.promotedFields.length,
      conflictCount: result.conflicts.length,
      reason: req.reason ?? null,
    });

    return c.json({ ok: true, mergeId: result.mergeId });
  }
);

const orgUnmergeBodySchema = z.object({
  mergeId: z.uuid(),
});

adminOrganizationsByIdRoute.post(
  "/unmerge",
  requirePolicy(canMergeOrganizations, () => undefined),
  zValidator("json", orgUnmergeBodySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: "invalid_input", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    if (!c.env.DATABASE_URL)
      return c.json({ ok: false, error: "internal" }, 500);
    const db = createDb(c.env.DATABASE_URL);
    const actor = c.get("actor")!;
    const body = c.req.valid("json");

    const result = await executeOrgUnmerge(db, {
      mergeId: body.mergeId,
      revertedByUserId: actor.user.id,
    });
    if ("error" in result) {
      return c.json(
        { ok: false, error: result.error, message: result.message },
        result.status
      );
    }

    c.set("auditAction", "organizations.unmerge");
    c.set("auditTarget", { type: "organization_merges", id: result.mergeId });
    c.set("auditPayload", { mergeId: result.mergeId });

    return c.json({ ok: true, mergeId: result.mergeId });
  }
);
