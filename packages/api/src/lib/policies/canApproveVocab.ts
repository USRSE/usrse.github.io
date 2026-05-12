import type { ActorContext } from "./types";

/**
 * Curate the user-proposable vocabularies — approve, reject, merge,
 * or edit pending terms in disciplines / skills / languages. Staff
 * and super_admin only. Mirrors the canEditMembers gate; merge is
 * gated by the same policy because vocab merges are low-stakes
 * compared to user merges (no reversibility required).
 */
export const canApproveVocab = (a: ActorContext): boolean =>
  a.systemTier >= 1;
