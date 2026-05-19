export type CallerClass = "anonymous" | "member" | "admin";

export type MemberVisibility = "public" | "listed" | "hidden";

export interface RosterMember {
  userId: string;
  memberSlug: string;
  displayName: string;
  avatarUrl: string | null;
  role: string | null;
  isPrimary: boolean;
  isPublic: boolean;
  isDiscoverable: boolean;
}

export interface PublicRosterMember {
  userId: string;
  memberSlug: string;
  displayName: string;
  avatarUrl: string | null;
  role: string | null;
  isPrimary: boolean;
}

/**
 * Returns the effective visibility class of a member based on the
 * two-boolean `users.isPublic` + `users.isDiscoverable` model.
 *
 *   public  — isPublic=true (renders full card everywhere)
 *   listed  — isPublic=false, isDiscoverable=true (stub only, signed-in only)
 *   hidden  — isPublic=false, isDiscoverable=false (never rendered)
 */
export function classifyMember(m: RosterMember): MemberVisibility {
  if (m.isPublic) return "public";
  return m.isDiscoverable ? "listed" : "hidden";
}

/**
 * Whether a member appears in the org-profile roster for the given
 * caller class. See spec section 5 for the rationale behind each row.
 */
export function shouldIncludeInRoster(
  caller: CallerClass,
  member: RosterMember
): boolean {
  const v = classifyMember(member);
  if (v === "hidden") return false;
  if (v === "listed") return caller !== "anonymous";
  return true; // public
}

/**
 * Serialization-time projection. Listed-private members appear in the
 * signed-in roster but with avatar + role nulled, matching the stub
 * behavior of /members. Public members pass through unchanged.
 *
 * Hidden members must be filtered upstream — this function does not
 * defend against being called with one.
 */
export function stripPrivateFields(m: RosterMember): PublicRosterMember {
  const v = classifyMember(m);
  return {
    userId: m.userId,
    memberSlug: m.memberSlug,
    displayName: m.displayName,
    avatarUrl: v === "public" ? m.avatarUrl : null,
    role: v === "public" ? m.role : null,
    isPrimary: m.isPrimary,
  };
}
