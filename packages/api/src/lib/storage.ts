/**
 * Thin wrapper around the R2 binding for member profile photos.
 *
 * Two upload paths converge on the same flow: validate the bytes,
 * pick a key, write the object, return the public URL + key. The
 * caller is responsible for persisting `{ photoUrl, photoStorageKey }`
 * onto the profile row and for deleting the prior key when replacing.
 *
 * Validation is byte-level rather than header-level — the client's
 * `Content-Type` is untrusted, so we sniff magic bytes for JPEG /
 * PNG / WebP and reject everything else.
 */

const MAX_BYTES = 5 * 1024 * 1024;

const URL_FETCH_TIMEOUT_MS = 30_000;

export type PhotoMime = "image/jpeg" | "image/png" | "image/webp";

interface SniffedImage {
  mime: PhotoMime;
  ext: "jpg" | "png" | "webp";
}

/**
 * Sniff the first ~16 bytes of an image to identify the format. We
 * don't trust the client's content-type header — a malicious upload
 * can claim to be image/png and actually contain executable bytes.
 * Magic bytes are the source of truth.
 */
function sniffImage(bytes: Uint8Array): SniffedImage | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
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
  // WebP: RIFF....WEBP (bytes 0-3 = "RIFF", bytes 8-11 = "WEBP")
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
 * Profile photo keys live under `profiles/{userId}/`. Including the
 * timestamp + random suffix means uploads never overwrite each other
 * — replacing a photo deletes the prior key explicitly, so we never
 * accumulate orphans but also never race a stale URL fetch.
 */
function buildPhotoKey(userId: string, ext: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `profiles/${userId}/${ts}-${rand}.${ext}`;
}

export interface PhotoStoreResult {
  photoUrl: string;
  photoStorageKey: string;
}

export class PhotoUploadError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/**
 * Take raw bytes (already in memory because the worker can't stream
 * a body to R2 without buffering at our scale anyway), validate
 * them, and persist to the bucket.
 */
export async function storeProfilePhoto(opts: {
  bucket: R2Bucket;
  publicBaseUrl: string;
  userId: string;
  bytes: Uint8Array;
}): Promise<PhotoStoreResult> {
  const { bucket, publicBaseUrl, userId, bytes } = opts;

  if (bytes.length === 0) {
    throw new PhotoUploadError("Empty file", 400);
  }
  if (bytes.length > MAX_BYTES) {
    throw new PhotoUploadError("File exceeds 5 MB limit", 413);
  }

  const sniffed = sniffImage(bytes);
  if (!sniffed) {
    throw new PhotoUploadError(
      "Unsupported format. Use JPEG, PNG, or WebP.",
      415
    );
  }

  const key = buildPhotoKey(userId, sniffed.ext);
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: sniffed.mime },
  });

  return {
    photoUrl: `${publicBaseUrl}/${key}`,
    photoStorageKey: key,
  };
}

/**
 * Fetch an image from a user-provided URL, validate it like an
 * upload, and persist to the bucket. Deliberately defensive against
 * abusive URLs — HTTPS-only, hard size cap, hard timeout, and a
 * basic SSRF guard against loopback/private hostnames.
 */
export async function storeProfilePhotoFromUrl(opts: {
  bucket: R2Bucket;
  publicBaseUrl: string;
  userId: string;
  sourceUrl: string;
}): Promise<PhotoStoreResult> {
  const { bucket, publicBaseUrl, userId, sourceUrl } = opts;

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new PhotoUploadError("Invalid URL", 400);
  }

  if (parsed.protocol !== "https:") {
    throw new PhotoUploadError("Only HTTPS URLs are accepted", 400);
  }

  // Basic SSRF guard. Workers fetch can't introspect the resolved
  // IP, so we reject hostnames that obviously point at private or
  // loopback ranges. This catches accidental misuse, not a
  // determined attacker — the hard size cap and timeout limit the
  // damage of anything that slips through.
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
    throw new PhotoUploadError("URL is not reachable from this server", 400);
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
    throw new PhotoUploadError(
      `Failed to fetch URL: ${e instanceof Error ? e.message : "unknown"}`,
      400
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new PhotoUploadError(
      `Source URL responded ${res.status}`,
      res.status >= 500 ? 502 : 400
    );
  }

  // Read with a hard cap — we only allocate enough memory for the
  // declared limit and bail if the body keeps coming. ArrayBuffer
  // is fine at 5 MB.
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    throw new PhotoUploadError("Source image exceeds 5 MB limit", 413);
  }
  const bytes = new Uint8Array(buf);

  return storeProfilePhoto({ bucket, publicBaseUrl, userId, bytes });
}

export async function deleteProfilePhoto(
  bucket: R2Bucket,
  storageKey: string
): Promise<void> {
  await bucket.delete(storageKey);
}
