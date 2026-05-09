/**
 * Loaded once per admin request by the requireActorContext middleware.
 * All policy functions are pure functions over this object; they do not
 * touch the DB. Adding a new policy means: add a function that consumes
 * this type, add a test for it, and (optionally) mount it via
 * requirePolicy on the routes it gates.
 */
export interface ActorContext {
  user: {
    id: string;
    memberId: string;
    email: string;
    role: "member" | "staff" | "super_admin";
  };
  /** 0=member, 1=staff, 2=super_admin. Pre-computed for fast comparisons. */
  systemTier: 0 | 1 | 2;
  /** Active leadership terms — endDate IS NULL OR endDate >= now(). */
  leadershipPositions: {
    id: string;
    positionType: "board" | "executive" | "staff" | "advisor";
    label: string;
    startDate: string;
    endDate: string | null;
  }[];
  /** Group ids where the actor is chair or co-chair (active row). */
  chairedGroupIds: Set<string>;
  /** Event ids where the actor is committee chair or co-chair. */
  chairedEventIds: Set<string>;
}
