const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const MEMBER_ID_LENGTH = 8;

export function generateMemberId(): string {
  const bytes = new Uint8Array(MEMBER_ID_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < MEMBER_ID_LENGTH; i++) {
    out += CROCKFORD_ALPHABET[bytes[i] % CROCKFORD_ALPHABET.length];
  }
  return out;
}

export function formatMemberId(id: string): string {
  if (id.length !== MEMBER_ID_LENGTH) return id;
  return `${id.slice(0, 4)}-${id.slice(4)}`;
}

/**
 * Builds the canonical public profile slug. Format:
 *   {kebab-display-name}-{lowercase-member-id}
 *
 * The member ID suffix guarantees uniqueness without forcing
 * collision handling — two members named "Alex Lee" can coexist as
 * `/members/alex-lee-fcmt2v08` and `/members/alex-lee-r3f0w3k9`.
 *
 * Slugs are derived server-side and treated as immutable once set,
 * so a member who renames themselves keeps the same URL (no link
 * rot). The display name in the URL is purely cosmetic — the member
 * ID is the actual identifier.
 */
export function buildProfileSlug(
  displayName: string,
  memberId: string
): string {
  const namePart = slugify(displayName);
  const idPart = memberId.toLowerCase();
  return namePart ? `${namePart}-${idPart}` : idPart;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD") // split accented chars into base + combining mark
    .replace(/[̀-ͯ]/g, "") // strip combining marks
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
