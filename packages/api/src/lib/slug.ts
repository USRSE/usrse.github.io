/**
 * Slugify an arbitrary string into a URL-safe identifier:
 *   - lowercase
 *   - NFD normalize + strip combining marks (handles accented chars)
 *   - replace non-[a-z0-9] runs with single hyphens
 *   - trim leading/trailing hyphens
 *   - cap at 80 chars
 *
 * Returns an empty string when the input has no slug-safe characters
 * (e.g. "++" or pure punctuation).
 */
export function buildSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
