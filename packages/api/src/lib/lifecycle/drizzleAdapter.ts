import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../../db";
import {
  announcements,
  artifactReviews,
  auditLog,
  events,
  forms,
} from "../../db/schema";
import type { LifecycleDb } from "./applyTransition";

/**
 * Roles that can appear in the audit_log.actor_role column.
 * Mirrors the user_role enum in schema/enums.ts. "admin" is the
 * legacy value retained for migration compatibility.
 */
export type ActorRole = "member" | "staff" | "admin" | "super_admin";

/**
 * Production implementation of LifecycleDb backed by Drizzle.
 *
 * The actor's id + role are bound at construction time and used
 * exclusively for audit_log inserts; the lifecycle library itself
 * has no concept of actors beyond the actorId on a transition.
 */
export function drizzleLifecycleDb(
  db: Database,
  actor: { id: string; role: ActorRole }
): LifecycleDb {
  return {
    async fetchArtifact(entityType, id) {
      switch (entityType) {
        case "event": {
          const row = await db
            .select({
              id: events.id,
              status: events.status,
              revision: events.revision,
              authorId: events.authorId,
              endDate: events.endDate,
            })
            .from(events)
            .where(eq(events.id, id))
            .limit(1)
            .then((r) => r[0]);
          if (!row) return null;
          return {
            id: row.id,
            entityType: "event",
            status: row.status,
            revision: row.revision,
            authorId: row.authorId,
            effectiveStatusInputs: { endDate: row.endDate ?? null },
          };
        }
        case "announcement": {
          const row = await db
            .select({
              id: announcements.id,
              status: announcements.status,
              revision: announcements.revision,
              authorId: announcements.authorId,
              expiresAt: announcements.expiresAt,
            })
            .from(announcements)
            .where(eq(announcements.id, id))
            .limit(1)
            .then((r) => r[0]);
          if (!row) return null;
          return {
            id: row.id,
            entityType: "announcement",
            status: row.status,
            revision: row.revision,
            authorId: row.authorId,
            effectiveStatusInputs: { expiresAt: row.expiresAt ?? null },
          };
        }
        case "form": {
          const row = await db
            .select({
              id: forms.id,
              status: forms.status,
              revision: forms.revision,
              authorId: forms.authorId,
            })
            .from(forms)
            .where(eq(forms.id, id))
            .limit(1)
            .then((r) => r[0]);
          if (!row) return null;
          return {
            id: row.id,
            entityType: "form",
            status: row.status,
            revision: row.revision,
            authorId: row.authorId,
          };
        }
        case "group":
          // Groups participate in the artifact_entity_type enum (for
          // reviews/comments) but don't carry a lifecycle of their own.
          return null;
      }
    },

    async insertReview({
      entityType,
      entityId,
      entityRevision,
      reviewerId,
      decision,
      comment,
    }) {
      await db.insert(artifactReviews).values({
        entityType,
        entityId,
        entityRevision,
        reviewerId,
        decision,
        comment,
      });
    },

    async listApprovalsForRevision(entityType, entityId, revision) {
      const rows = await db
        .select({ reviewerId: artifactReviews.reviewerId })
        .from(artifactReviews)
        .where(
          and(
            eq(artifactReviews.entityType, entityType),
            eq(artifactReviews.entityId, entityId),
            eq(artifactReviews.entityRevision, revision),
            eq(artifactReviews.decision, "approve")
          )
        );
      return rows;
    },

    async updateArtifactStatus({ entityType, entityId, status, bumpRevision }) {
      const now = new Date();
      switch (entityType) {
        case "event": {
          if (bumpRevision) {
            await db
              .update(events)
              .set({
                status,
                updatedAt: now,
                revision: sql`${events.revision} + 1`,
              })
              .where(eq(events.id, entityId));
          } else {
            await db
              .update(events)
              .set({ status, updatedAt: now })
              .where(eq(events.id, entityId));
          }
          return;
        }
        case "announcement": {
          if (bumpRevision) {
            await db
              .update(announcements)
              .set({
                status,
                updatedAt: now,
                revision: sql`${announcements.revision} + 1`,
              })
              .where(eq(announcements.id, entityId));
          } else {
            await db
              .update(announcements)
              .set({ status, updatedAt: now })
              .where(eq(announcements.id, entityId));
          }
          return;
        }
        case "form": {
          if (bumpRevision) {
            await db
              .update(forms)
              .set({
                status,
                updatedAt: now,
                revision: sql`${forms.revision} + 1`,
              })
              .where(eq(forms.id, entityId));
          } else {
            await db
              .update(forms)
              .set({ status, updatedAt: now })
              .where(eq(forms.id, entityId));
          }
          return;
        }
        case "group":
          throw new Error("group is not a lifecycle entity type");
      }
    },

    async insertAudit({ action, targetType, targetId, payload }) {
      await db.insert(auditLog).values({
        actorId: actor.id,
        actorRole: actor.role,
        action,
        targetType,
        targetId,
        payload,
      });
    },
  };
}
