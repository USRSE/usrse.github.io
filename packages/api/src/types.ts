import type { JWTPayload } from "jose";

export type Bindings = {
  DATABASE_URL: string;
  WORKOS_CLIENT_ID: string;
  WORKOS_WEBHOOK_SECRET: string;
};

export type Variables = {
  workosUserId: string;
  workosClaims: JWTPayload;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
