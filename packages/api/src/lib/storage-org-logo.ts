/**
 * Thin wrapper around the R2 binding for organization logos. Mirrors
 * lib/storage.ts (the profile-photo helper) but with three twists:
 *
 *   1. Three variants per org — main / dark / mark — each with its own
 *      object key. The key path encodes the variant so a swap on one
 *      variant doesn't disturb the others.
 *
 *   2. The bucket binding is optional. ORGANIZATION_LOGOS is commented
 *      out in wrangler.jsonc until the bucket is provisioned in the
 *      Cloudflare dashboard, so calls must guard on the env values
 *      being present and return a structured "not_configured" signal
 *      that the route layer can render as a clear 503 rather than a
 *      runtime crash.
 *
 *   3. SVG is intentionally NOT supported in v1. SVGs can carry inline
 *      JS / CSS and need either sanitization or a strict response CSP
 *      before they're safe to host. Logos uploaded today must be
 *      JPEG / PNG / WebP — the existing brand-mark policy SVGs that
 *      need surfacing can live as external URLs (logoDarkUrl /
 *      logoMarkUrl) without a storage_key.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const URL_FETCH_TIMEOUT_MS = 30_000;

export type LogoVariant = "main" | "dark" | "mark";
export const LOGO_VARIANTS: readonly LogoVariant[] = ["main", "dark", "mark"];

export type LogoMime = "image/jpeg" | "image/png" | "image/webp";

interface SniffedImage {
  mime: LogoMime;
  ext: "jpg" | "png" | "webp";
}

function sniffImage(bytes: Uint8Array): SniffedImage | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

/**
 * Object key layout: `orgs/{orgId}/{variant}-{ts}-{rand}.{ext}`. The
 * variant prefix means a "list keys under orgs/{orgId}/" call can
 * inventory all three variants for an org without parsing filenames.
 */
function buildLogoKey(
  orgId: string,
  variant: LogoVariant,
  ext: string
): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `orgs/${orgId}/${variant}-${ts}-${rand}.${ext}`;
}

export interface LogoStoreResult {
  variant: LogoVariant;
  url: string;
  storageKey: string;
}

export class LogoUploadError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/**
 * Sentinel returned by helpers when the bucket isn't provisioned.
 * Routes turn this into a 503 with a clear "logo hosting not
 * configured" message so the admin UI can render a stable disabled
 * state instead of crashing.
 */
export interface NotConfigured {
  notConfigured: true;
}

export function isLogoHostingConfigured(env: {
  ORGANIZATION_LOGOS?: R2Bucket;
  ORGANIZATION_LOGOS_PUBLIC_URL: string;
}): boolean {
  return Boolean(
    env.ORGANIZATION_LOGOS && env.ORGANIZATION_LOGOS_PUBLIC_URL.trim()
  );
}

export async function storeOrgLogo(opts: {
  bucket: R2Bucket;
  publicBaseUrl: string;
  orgId: string;
  variant: LogoVariant;
  bytes: Uint8Array;
}): Promise<LogoStoreResult> {
  const { bucket, publicBaseUrl, orgId, variant, bytes } = opts;

  if (bytes.length === 0) {
    throw new LogoUploadError("Empty file", 400);
  }
  if (bytes.length > MAX_BYTES) {
    throw new LogoUploadError("File exceeds 5 MB limit", 413);
  }

  const sniffed = sniffImage(bytes);
  if (!sniffed) {
    throw new LogoUploadError(
      "Unsupported format. Use JPEG, PNG, or WebP. (SVG support lands in a follow-up.)",
      415
    );
  }

  const key = buildLogoKey(orgId, variant, sniffed.ext);
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: sniffed.mime },
  });

  return {
    variant,
    url: `${publicBaseUrl}/${key}`,
    storageKey: key,
  };
}

export async function storeOrgLogoFromUrl(opts: {
  bucket: R2Bucket;
  publicBaseUrl: string;
  orgId: string;
  variant: LogoVariant;
  sourceUrl: string;
}): Promise<LogoStoreResult> {
  const { bucket, publicBaseUrl, orgId, variant, sourceUrl } = opts;

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new LogoUploadError("Invalid URL", 400);
  }

  if (parsed.protocol !== "https:") {
    throw new LogoUploadError("Only HTTPS URLs are accepted", 400);
  }

  // SSRF guard — same as storage.ts. Catches accidental misuse; size
  // cap + timeout below limit damage from anything that slips through.
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".internal") ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^127\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw new LogoUploadError("URL is not reachable from this server", 400);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), URL_FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      method: "GET",
      headers: { Accept: "image/*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
  } catch (e) {
    throw new LogoUploadError(
      `Failed to fetch URL: ${e instanceof Error ? e.message : "unknown"}`,
      400
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new LogoUploadError(
      `Source URL responded ${res.status}`,
      res.status >= 500 ? 502 : 400
    );
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    throw new LogoUploadError("Source image exceeds 5 MB limit", 413);
  }
  const bytes = new Uint8Array(buf);

  return storeOrgLogo({ bucket, publicBaseUrl, orgId, variant, bytes });
}

export async function deleteOrgLogo(
  bucket: R2Bucket,
  storageKey: string
): Promise<void> {
  await bucket.delete(storageKey);
}
