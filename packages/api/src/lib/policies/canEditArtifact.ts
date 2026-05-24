import type { ArtifactEntityType, ArtifactStatus } from "../lifecycle/types";
import type { ActorContext } from "./types";

export const canEditArtifact = (
  a: ActorContext,
  scope: {
    entityType: ArtifactEntityType;
    entityId: string;
    status: ArtifactStatus;
    authorId: string | null;
  }
): boolean => {
  if (a.systemTier >= 1) return true;
  if (scope.authorId !== a.user.id) return false;
  return scope.status === "draft" || scope.status === "changes_requested";
};
