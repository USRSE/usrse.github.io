import type { JWTPayload } from "jose";

export type Bindings = {
  DATABASE_URL: string;
  WORKOS_CLIENT_ID: string;
  WORKOS_WEBHOOK_SECRET: string;
  /**
   * Full git SHA of the commit that produced this build. Injected
   * at deploy time by the CI workflow via
   * `wrangler deploy --var GIT_SHA:$GITHUB_SHA`. Surfaced through
   * /health so the deploy step can confirm the live worker matches
   * the just-pushed commit. Empty during local `wrangler dev`.
   */
  GIT_SHA?: string;
  /** R2 bucket holding member profile photos. */
  PROFILE_PHOTOS: R2Bucket;
  /** Public base URL for profile-photo bucket reads (r2.dev today). */
  PROFILE_PHOTOS_PUBLIC_URL: string;
  /**
   * R2 bucket holding hosted organization logo files. Optional
   * because the binding is commented out in wrangler.jsonc until the
   * bucket is provisioned in the Cloudflare dashboard — code reading
   * this must guard on `env.ORGANIZATION_LOGOS` being defined and
   * fall back to the InitialsHex stamp when it isn't.
   */
  ORGANIZATION_LOGOS?: R2Bucket;
  /**
   * Public base URL for organization-logo bucket reads. Empty until
   * the bucket is provisioned and the URL is filled in via wrangler.
   * Code that surfaces logos must treat empty-string as "not yet
   * configured" and fall back to InitialsHex.
   */
  ORGANIZATION_LOGOS_PUBLIC_URL: string;
};

export type Variables = {
  workosUserId: string;
  workosClaims: JWTPayload;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
