import type { ActorContext } from "./types";

/** Approve / reject pending vocab terms (disciplines, skills, languages, organizations). */
export const canApproveVocab = (a: ActorContext): boolean =>
  a.systemTier >= 1;
