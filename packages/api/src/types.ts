import type { JWTPayload } from "jose";
import type { ActorContext } from "./lib/policies";

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
   * R2 bucket holding hosted organization logo files. Stayed optional
   * even though the binding is now provisioned — keeps the code
   * defensive against preview/test environments that haven't been
   * configured yet. Runtime gate is isLogoHostingConfigured() in
   * lib/storage-org-logo.ts.
   */
  ORGANIZATION_LOGOS?: R2Bucket;
  /**
   * Public base URL for organization-logo bucket reads (r2.dev URL,
   * surfaced through wrangler.jsonc). Empty-string still means "not
   * configured" so the gate logic stays uniform across environments.
   */
  ORGANIZATION_LOGOS_PUBLIC_URL: string;
};

export type Variables = {
  workosUserId: string;
  workosClaims: JWTPayload;
  /** Populated by requireActorContext on /api/admin/* requests. */
  actor?: ActorContext;
  /** Set by handlers that mutate; merged into the audit row's payload field. */
  auditPayload?: Record<string, unknown>;
  /** Set by handlers right after fetching the row about to change. */
  auditCapture?: (priorSnapshot: unknown) => void;
  /** Set by handlers to override the default "method path" action string. */
  auditAction?: string;
  /** Set by handlers when the standard inferred target is wrong. */
  auditTarget?: { type: string; id: string };
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
