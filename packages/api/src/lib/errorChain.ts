/**
 * Walk an Error's `cause` chain and collect every message in order.
 *
 * Drizzle wraps every Postgres error as a DrizzleQueryError whose outer
 * `.message` is just `Failed query: <SQL>\nparams: ...` — useful for
 * context, but the actual reason ("duplicate key value violates unique
 * constraint", "value too long for type", etc.) lives in `err.cause`.
 * Any code that wants to react to the *cause* — turning a unique-key
 * violation into a clean 409, say — needs to read the whole chain, not
 * just the outermost message.
 */
export function collectErrorMessages(err: unknown): string[] {
  const out: string[] = [];
  let cur: unknown = err;
  while (cur instanceof Error) {
    out.push(cur.message);
    cur = (cur as { cause?: unknown }).cause;
  }
  if (cur !== undefined && cur !== null) out.push(String(cur));
  return out;
}

/**
 * Convenience join — the full chain as one string. Equivalent to
 * `collectErrorMessages(err).join(" | ")`.
 */
export function joinErrorChain(err: unknown): string {
  return collectErrorMessages(err).join(" | ");
}
