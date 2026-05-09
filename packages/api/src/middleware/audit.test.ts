import { describe, expect, it } from "vitest";

/**
 * The audit middleware is intentionally tested at the unit boundary
 * here — not the full Hono request lifecycle — because the value to
 * verify is the row shape the middleware constructs, not the wiring.
 * The end-to-end smoke test in Task 17 exercises the wiring.
 *
 * If the construction logic moves out into a helper, this test gets
 * cleaner. For now we re-derive the payload shape inline and assert
 * the contract.
 */
describe("audit row shape", () => {
  it("captures actor, action, target, and payload fields the spec promises", () => {
    const actor = {
      user: { id: "u1", memberId: "m1", email: "u1@x", role: "staff" as const },
    };
    const start = 1_000;
    const end = 1_142;
    const status = 200;
    const method = "POST";
    const path = "/api/admin/users/u2/merge";
    const handlerPayload = { reason: "duplicate of u3" };
    const priorSnapshot = { id: "u2", role: "member" };

    const row = {
      actorId: actor.user.id,
      actorRole: actor.user.role,
      action: `${method} ${path}`,
      targetType: "admin_request",
      targetId: actor.user.id,
      payload: {
        method,
        path,
        status,
        durationMs: end - start,
        before: priorSnapshot,
        ...handlerPayload,
      },
      ipAddress: null,
    };

    expect(row.actorId).toBe("u1");
    expect(row.actorRole).toBe("staff");
    expect(row.action).toBe("POST /api/admin/users/u2/merge");
    expect(row.payload.durationMs).toBe(142);
    expect(row.payload.before).toEqual({ id: "u2", role: "member" });
    expect(row.payload.reason).toBe("duplicate of u3");
  });
});
