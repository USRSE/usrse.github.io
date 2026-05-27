import type { ActorContext } from "./useActorContext";

export interface NavSection {
  id: string;
  number: string;
  label: string;
  to: string;
}

/**
 * Builds the sidebar list from the actor's positions. Each gate
 * mirrors the corresponding server policy. Server is still the gate
 * — this is just UI conditioning.
 */
export function useNavSections(actor: ActorContext): NavSection[] {
  const out: NavSection[] = [
    { id: "dashboard", number: "00", label: "Dashboard", to: "/" },
  ];

  const isStaff = actor.systemTier >= 1;
  const isSuper = actor.systemTier >= 2;

  if (isStaff) {
    out.push({ id: "members", number: "01", label: "Members", to: "/members" });
    out.push({
      id: "organizations",
      number: "02",
      label: "Organizations",
      to: "/organizations",
    });
    out.push({ id: "vocab", number: "03", label: "Vocab", to: "/vocab" });
  }
  if (isStaff || actor.chairedGroupIds.length > 0) {
    out.push({ id: "groups", number: "04", label: "Groups", to: "/groups" });
  }
  if (isStaff || actor.chairedEventIds.length > 0) {
    out.push({ id: "events", number: "05", label: "Events", to: "/events" });
  }
  if (isStaff) {
    out.push({
      id: "announcements",
      number: "06",
      label: "Announcements",
      to: "/announcements",
    });
    out.push({
      id: "recognition",
      number: "07",
      label: "Recognition",
      to: "/recognition",
    });
  }
  if (isSuper) {
    out.push({
      id: "settings",
      number: "08",
      label: "Settings",
      to: "/settings",
    });
    out.push({ id: "audit", number: "09", label: "Audit", to: "/audit" });
  }
  return out;
}
