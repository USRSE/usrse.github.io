/**
 * Verifies a WorkOS webhook signature using HMAC-SHA256 against the shared
 * webhook secret. WorkOS signs the timestamped body and sends the signature
 * in the `WorkOS-Signature` header as `t=<unix>, v1=<hex>`.
 *
 * Implementation uses the Web Crypto API so it runs natively on Cloudflare
 * Workers without any Node-only dependencies.
 */
export async function verifyWorkosWebhookSignature(opts: {
  signatureHeader: string;
  body: string;
  secret: string;
  toleranceSeconds?: number;
}): Promise<boolean> {
  const { signatureHeader, body, secret } = opts;
  const tolerance = opts.toleranceSeconds ?? 300;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const eq = part.indexOf("=");
      if (eq === -1) return [part.trim(), ""];
      return [part.slice(0, eq).trim(), part.slice(eq + 1).trim()];
    })
  );

  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  const tsRaw = Number(timestamp);
  if (!Number.isFinite(tsRaw)) return false;
  // WorkOS sends the timestamp in milliseconds (13 digits at the time of
  // writing). Older docs and SDKs assume seconds. Accept either by treating
  // anything >= 1e12 as ms and normalizing to seconds for the freshness
  // check. The HMAC payload still uses the original string so it doesn't
  // matter which unit is on the wire.
  const tsSec = tsRaw >= 1e12 ? tsRaw / 1000 : tsRaw;
  const skew = Math.abs(Date.now() / 1000 - tsSec);
  if (skew > tolerance) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`${timestamp}.${body}`)
  );

  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
