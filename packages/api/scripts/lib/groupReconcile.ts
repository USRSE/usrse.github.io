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

/**
 * Match a CSV channel to an existing DB group. Priority:
 *   1. Exact (normalized) slack_channel match
 *   2. Normalized type-suffix of channel matches normalized group slug
 *
 * Type mismatch (e.g. channel is rg-* but DB group is working_group) → return null.
 */
export function matchExistingGroup(
  channel: { name: string; type: CsvType },
  groupsByType: Record<GroupType, ExistingGroup[]>
): ExistingGroup | null {
  const expectedType = channelTypeToGroupType(channel.type);
  const candidates = groupsByType[expectedType];
  if (!candidates) return null;

  const normalizedChannel = normalizeForMatch(channel.name);
  const normalizedSuffix = normalizeForMatch(stripTypePrefix(channel.name));

  return (
    candidates.find(
      (g) => g.slackChannel && normalizeForMatch(g.slackChannel) === normalizedChannel
    ) ??
    candidates.find((g) => normalizeForMatch(g.slug) === normalizedSuffix) ??
    null
  );
}
