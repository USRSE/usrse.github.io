import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AppEnv } from "../types";

type JWKS = ReturnType<typeof createRemoteJWKSet>;
const jwksCache = new Map<string, JWKS>();

export function getJwks(clientId: string): JWKS {
  let jwks = jwksCache.get(clientId);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://api.workos.com/sso/jwks/${clientId}`)
    );
    jwksCache.set(clientId, jwks);
  }
  return jwks;
}

/**
 * Verifies a WorkOS-issued access token from the `Authorization: Bearer ...`
 * header. On success, attaches the WorkOS user id (sub claim) and the full
 * verified claims to Hono context. On failure, throws 401.
 *
 * Currently verifies signature and expiration via the WorkOS JWKS only. Issuer
 * and audience checks are intentionally lax for v1 — tighten once the token
 * shape is stable in production.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  // Test escape hatch: when TEST_BYPASS_AUTH=1, accept any Authorization
  // header of the form `test:<role>:<userId>` and stash the userId in
  // workosUserId so requireActorContext can pick it up.
  if (c.env.TEST_BYPASS_AUTH === "1") {
    const header = c.req.header("Authorization") ?? "";
    const match = header.match(/^test:(staff|member|super_admin):(.+)$/);
    if (match) {
      c.set("workosUserId", match[2]);
      await next();
      return;
    }
  }

  const header = c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: "Missing or malformed Authorization header",
    });
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw new HTTPException(401, { message: "Empty bearer token" });
  }

  if (!c.env.WORKOS_CLIENT_ID) {
    throw new HTTPException(500, {
      message: "WORKOS_CLIENT_ID is not configured on the Worker",
    });
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(c.env.WORKOS_CLIENT_ID));
    if (!payload.sub) {
      throw new HTTPException(401, { message: "Token has no sub claim" });
    }
    c.set("workosUserId", payload.sub);
    c.set("workosClaims", payload);
  } catch (e) {
    if (e instanceof HTTPException) throw e;
    throw new HTTPException(401, { message: "Invalid token" });
  }

  await next();
});
