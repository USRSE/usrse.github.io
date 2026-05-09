import { createMiddleware } from "hono/factory";
import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import { createDb } from "../db";
import {
  eventCommitteeAssignments,
  groupMemberships,
  leadershipPositions,
  leadershipTerms,
  users,
} from "../db/schema";
import { canEnterAdminApp } from "../lib/policies";
import type { ActorContext } from "../lib/policies";
import type { AppEnv } from "../types";

/**
 * Walks the merge chain from the WorkOS-authenticated user to the
 * canonical row, then loads everything the policy module needs:
 *
 *   - basic user fields (id, memberId, email, role) on the canonical user
 *   - active leadership_terms (endDate IS NULL OR >= now()), joined to
 *     leadership_positions for positionType and label
 *   - groups the user chairs or co-chairs (active rows)
 *   - events the user chairs or co-chairs on the committee
 *
 * Stashes the resulting ActorContext on c.var.actor and short-circuits
 * with 403 when canEnterAdminApp is false. Returns 404 with
 * `error: "user_pending"` when the WorkOS user has no canonical row yet.
 *
 * One DB round trip — three SELECTs run in parallel after the canonical
 * lookup. Cheap; no caching needed at v1 volumes.
 *
 * Schema deviation from plan: leadershipTerms does not carry positionType
 * or label directly — those live on the leadershipPositions vocab table.
 * The terms query joins leadershipPositions to retrieve them.
 */
export const requireActorContext = createMiddleware<AppEnv>(
  async (c, next) => {
    const workosId = c.get("workosUserId");
    if (!c.env.DATABASE_URL) {
      return c.json({ ok: false, error: "internal" }, 500);
    }

    const db = createDb(c.env.DATABASE_URL);

    // Walk merge chain to canonical user, bounded depth 5.
    const head = await db
      .select({
        id: users.id,
        memberId: users.memberId,
        email: users.email,
        role: users.role,
        mergedIntoUserId: users.mergedIntoUserId,
      })
      .from(users)
      .where(and(eq(users.workosId, workosId), isNull(users.deletedAt)))
      .limit(1);
    let row = head[0];
    if (!row) {
      return c.json({ ok: false, error: "user_pending" }, 404);
    }
    for (let depth = 0; depth < 5 && row.mergedIntoUserId; depth++) {
      const nextRows = await db
        .select({
          id: users.id,
          memberId: users.memberId,
          email: users.email,
          role: users.role,
          mergedIntoUserId: users.mergedIntoUserId,
        })
        .from(users)
        .where(
          and(eq(users.id, row.mergedIntoUserId), isNull(users.deletedAt))
        )
        .limit(1);
      if (!nextRows[0]) {
        return c.json({ ok: false, error: "user_pending" }, 404);
      }
      row = nextRows[0];
    }

    // Load relational positions in parallel.
    // Note: leadershipTerms does not carry positionType/label directly —
    // they live on the leadershipPositions vocab table, so we inner-join.
    const now = new Date();
    // leadershipTerms.endDate and leadershipTerms.startDate are PgDateString
    // columns (ISO date strings, not timestamps). gte() requires a matching
    // type, so we pass the ISO date portion of now as a string.
    const nowDateStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const [terms, chairedGroups, chairedEvents] = await Promise.all([
      db
        .select({
          id: leadershipTerms.id,
          positionType: leadershipPositions.positionType,
          label: leadershipPositions.label,
          startDate: leadershipTerms.startDate,
          endDate: leadershipTerms.endDate,
        })
        .from(leadershipTerms)
        .innerJoin(
          leadershipPositions,
          eq(leadershipTerms.positionId, leadershipPositions.id)
        )
        .where(
          and(
            eq(leadershipTerms.userId, row.id),
            isNull(leadershipTerms.deletedAt),
            or(
              isNull(leadershipTerms.endDate),
              gte(leadershipTerms.endDate, nowDateStr)
            )
          )
        ),
      db
        .select({ groupId: groupMemberships.groupId })
        .from(groupMemberships)
        .where(
          and(
            eq(groupMemberships.userId, row.id),
            sql`${groupMemberships.role} IN ('chair', 'co_chair')`,
            or(
              isNull(groupMemberships.leftAt),
              gte(groupMemberships.leftAt, now)
            )
          )
        ),
      db
        .select({ eventId: eventCommitteeAssignments.eventId })
        .from(eventCommitteeAssignments)
        .where(
          and(
            eq(eventCommitteeAssignments.userId, row.id),
            sql`${eventCommitteeAssignments.level} IN ('chair', 'co_chair')`,
            isNull(eventCommitteeAssignments.deletedAt)
          )
        ),
    ]);

    // Map the legacy "admin" enum value to staff for the policy layer.
    // (The 0012 backfill clears existing rows; this guard catches any
    // racing inserts that arrived via the webhook before deploy.)
    const role = row.role === "admin" ? "staff" : row.role;
    const tier =
      role === "super_admin" ? 2 : role === "staff" ? 1 : 0;

    const actor: ActorContext = {
      user: {
        id: row.id,
        memberId: row.memberId,
        email: row.email,
        role: role as "member" | "staff" | "super_admin",
      },
      systemTier: tier as 0 | 1 | 2,
      // startDate and endDate come back as ISO date strings ("YYYY-MM-DD")
      // from the PgDateString column type — no Date conversion needed.
      leadershipPositions: terms.map((t) => ({
        ...t,
        startDate: t.startDate,
        endDate: t.endDate,
      })),
      chairedGroupIds: new Set(chairedGroups.map((r) => r.groupId)),
      chairedEventIds: new Set(chairedEvents.map((r) => r.eventId)),
    };

    if (!canEnterAdminApp(actor)) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }

    c.set("actor", actor);
    await next();
  }
);
