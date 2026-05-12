import { normalizeDisplayName } from "./duplicateDetection";

export interface SimilarTerm {
  id: string;
  name: string;
  score: 100 | 80 | 50 | 30;
}

export interface ApprovedRow {
  id: string;
  name: string;
}

/**
 * Score every approved term in `pool` against `pendingName` and
 * return matches with score >= 30, sorted by score desc.
 *
 * Scoring matrix:
 *   normalized exact match                         → 100
 *   Levenshtein distance within length-scaled bound:
 *     normalized length ≤ 8:    d ≤ 1               → 80
 *     9 ≤ normalized length ≤ 15:
 *       d == 1                                       → 80
 *       d == 2                                       → 50
 *     normalized length ≥ 16:
 *       d == 1                                       → 80
 *       d == 2                                       → 50
 *       d == 3                                       → 30
 *
 * `excludeId` is the id of the pending term itself when iterating
 * over a list that includes both pending and approved rows — used
 * by the queue endpoint when the approved pool comes from the same
 * SELECT. Defaults to undefined.
 */
export function findSimilarApproved(
  pendingName: string,
  pool: ApprovedRow[],
  excludeId?: string
): SimilarTerm[] {
  const pn = normalizeDisplayName(pendingName);
  if (!pn) return [];
  const results: SimilarTerm[] = [];
  for (const a of pool) {
    if (excludeId && a.id === excludeId) continue;
    const an = normalizeDisplayName(a.name);
    if (!an) continue;
    if (an === pn) {
      results.push({ id: a.id, name: a.name, score: 100 });
      continue;
    }
    const d = levenshtein(pn, an);
    const score = scoreForDistance(pn.length, d);
    if (score !== null) {
      results.push({ id: a.id, name: a.name, score });
    }
  }
  results.sort((x, y) => y.score - x.score);
  return results;
}

function scoreForDistance(len: number, d: number): 80 | 50 | 30 | null {
  if (d <= 0) return null; // identical, handled separately
  if (len <= 8) return d <= 1 ? 80 : null;
  if (len <= 15) {
    if (d === 1) return 80;
    if (d === 2) return 50;
    return null;
  }
  // len >= 16
  if (d === 1) return 80;
  if (d === 2) return 50;
  if (d === 3) return 30;
  return null;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1).fill(0);
  const curr = new Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}
