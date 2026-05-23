import type { ActorContext } from "./types";

export const canReviewArtifact = (
  a: ActorContext,
  scope: { authorId: string | null }
): boolean => a.systemTier >= 1 && a.user.id !== scope.authorId;
