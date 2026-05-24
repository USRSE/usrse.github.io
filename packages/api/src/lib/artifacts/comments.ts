export const COMMENT_MAX_LEN = 4000;

export type SanitizedComment =
  | { ok: true; body: string }
  | { ok: false; error: "empty" | "too_long" };

/**
 * Normalize a comment body before insertion. Trims whitespace, rejects
 * empties, enforces the max-length cap. Doesn't touch HTML — comments
 * are rendered as plain text on the admin UI.
 */
export function sanitizeCommentBody(raw: string): SanitizedComment {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  if (trimmed.length > COMMENT_MAX_LEN) return { ok: false, error: "too_long" };
  return { ok: true, body: trimmed };
}
