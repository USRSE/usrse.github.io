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
};

export type Variables = {
  workosUserId: string;
  workosClaims: JWTPayload;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
