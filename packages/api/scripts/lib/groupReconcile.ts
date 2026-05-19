/**
 * Pure helpers for group-reconciliation logic.
 * Kept free of any DB imports so unit tests run without a connection.
 */

export type CsvType = "wg" | "ag" | "rg";
export type GroupType = "working_group" | "affinity_group" | "regional_group";

export function channelTypeToGroupType(t: CsvType): GroupType {
  return t === "wg" ? "working_group" : t === "ag" ? "affinity_group" : "regional_group";
}

/**
 * Strip the type prefix from a channel name.
 * "wg-code-review" → "code-review"
 */
export function stripTypePrefix(name: string): string {
  return name.replace(/^(wg|ag|rg)-/, "");
}

/**
 * Normalize for fuzzy comparison: remove dashes/underscores/spaces, lowercase.
 * Used to match CSV "rg-bay-area-ca" against DB "rg-bayareaca".
 */
export function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[-_\s]+/g, "");
}

/**
 * Title-case a slug suffix.
 * "code-review" → "Code Review"
 */
export function deriveDisplayName(suffix: string): string {
  return suffix
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Derive the URL slug for a new group from the CSV channel name.
 * Strips the type prefix; buildSlug is called by the runner for final normalization.
 * "rg-bay-area-ca" → "bay-area-ca"
 */
export function deriveSlug(channelName: string): string {
  return stripTypePrefix(channelName);
}

export interface ExistingGroup {
  id: string;
  slug: string;
  type: GroupType;
  slackChannel: string | null;
  description: string | null;
}

export interface GroupMatch {
  group: ExistingGroup;
  typeMismatch: boolean;
}

/**
 * Match a CSV channel to an existing DB group. Priority:
 *   1. Exact (normalized) slack_channel match — checked across ALL types,
 *      since slack_channel is globally unique. A cross-type match returns
 *      `typeMismatch: true` so the runner can flag it for admin review
 *      without silently retyping the row.
 *   2. Type-scoped slug match (no cross-type slug match — slugs can repeat).
 */
export function matchExistingGroup(
  channel: { name: string; type: CsvType },
  groupsByType: Record<GroupType, ExistingGroup[]>
): GroupMatch | null {
  const expectedType = channelTypeToGroupType(channel.type);
  const normalizedChannel = normalizeForMatch(channel.name);
  const normalizedSuffix = normalizeForMatch(stripTypePrefix(channel.name));

  // Pass 1: slack_channel match across all types.
  const allGroups = ([] as ExistingGroup[]).concat(
    groupsByType.working_group,
    groupsByType.affinity_group,
    groupsByType.regional_group
  );
  const bySlack = allGroups.find(
    (g) => g.slackChannel && normalizeForMatch(g.slackChannel) === normalizedChannel
  );
  if (bySlack) {
    return { group: bySlack, typeMismatch: bySlack.type !== expectedType };
  }

  // Pass 2: type-scoped slug match.
  const candidates = groupsByType[expectedType];
  if (!candidates) return null;
  const bySlug = candidates.find((g) => normalizeForMatch(g.slug) === normalizedSuffix);
  if (bySlug) return { group: bySlug, typeMismatch: false };

  return null;
}
