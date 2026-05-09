import { createMiddleware } from "hono/factory";
import { createDb } from "../db";
import { auditLog } from "../db/schema";
import type { AppEnv } from "../types";

/**
 * Afterware that writes one audit_log row per mutating admin request.
 *
 * Reads-only requests are skipped — auditing every GET would balloon
 * the table. For mutating requests, the row captures actor, role,
 * action (defaults to `${method} ${path}`), target (defaults to
 * `{ type: "admin_request", id: actor.user.id }`), durationMs, and
 * any payload the handler stashed via c.var.auditPayload /
 * auditCapture.
 *
 * The middleware tries hard never to break the response: if the
 * insert throws, the failure is logged but not surfaced to the
 * client. Loss of an audit row is preferable to a 500 cascading
 * from observability.
 */
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const auditMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const method = c.req.method.toUpperCase();
  const start = Date.now();

  let priorSnapshot: unknown = null;
  c.set("auditCapture", (snap: unknown) => {
    priorSnapshot = snap;
  });

  await next();

  if (!MUTATING.has(method)) return;

  const actor = c.get("actor");
  if (!actor || !c.env.DATABASE_URL) return;

  const explicitTarget = c.get("auditTarget");
  const action =
    c.get("auditAction") ?? `${method} ${new URL(c.req.url).pathname}`;
  const targetType = explicitTarget?.type ?? "admin_request";
  const targetId = explicitTarget?.id ?? actor.user.id;
  const handlerPayload = c.get("auditPayload") ?? {};
  const ipAddress =
    c.req.header("CF-Connecting-IP") ??
    c.req.header("X-Forwarded-For") ??
    null;

  const payload = {
    method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    durationMs: Date.now() - start,
    before: priorSnapshot,
    ...handlerPayload,
  };

  try {
    const db = createDb(c.env.DATABASE_URL);
    await db.insert(auditLog).values({
      actorId: actor.user.id,
      actorRole: actor.user.role,
      action,
      targetType,
      targetId,
      payload,
      ipAddress,
    });
  } catch (e) {
    console.error("auditMiddleware insert failed", e);
  }
});
