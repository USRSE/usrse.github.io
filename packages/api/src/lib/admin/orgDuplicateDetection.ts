/**
 * Multi-signal duplicate detection for the admin organizations
 * register. Parallel in shape to lib/admin/duplicateDetection.ts (the
 * user-side detector) but with org-shaped anchors and signals.
 *
 *   Anchors (groups worth comparing pairwise):
 *     - normalized name             ("MIT" === "M.I.T." === "M I T")
 *     - slug                        (a literal collision is rare but
 *                                    cheap to check)
 *     - normalized short name       ("MIT" anchor catches the long-form
 *                                    name's short-form siblings)
 *     - canonical URL host          ("mit.edu" — strip protocol/www/path)
 *
 *   Scoring (additive, sorted desc, threshold 30):
 *     - exact normalized-name match   50
 *     - exact slug match              50
 *     - canonical URL host match      30
 *     - exact short-name match        30
 *     - Levenshtein-close name (≤2)   10
 *
 * The user-side detector lives at ~15k members and is recomputed per
 * request; the org table is an order of magnitude smaller, so this
 * is even cheaper.
 */

export function normalizeOrgName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Strip protocol + www + path so two URLs that point at the same org
 * compare equal: "https://mit.edu" === "http://www.mit.edu/about".
 * Returns "" for unparseable / non-http inputs.
 */
export function canonicalizeOrgUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  let url: URL;
  try {
    // URL parser is strict — try a leading slash insertion if the
    // input looks like a bare hostname.
    url = /^https?:\/\//i.test(raw) ? new URL(raw) : new URL(`https://${raw}`);
  } catch {
    return "";
  }
  let host = url.hostname.toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  return host;
}

export function nearOrgName(a: string, b: string): boolean {
  if (a === b) return false;
  // Short anchor strings hit Levenshtein false-positives too easily —
  // "ibm" vs "abc" is distance 3 but obviously unrelated; "ibm" vs
  // "iam" is distance 1 but also unrelated. Require ≥6 chars on both
  // sides so the metric is operating on something with structure.
  if (a.length < 6 || b.length < 6) return false;
  if (Math.abs(a.length - b.length) > 2) return false;
  return levenshtein(a, b) <= 2;
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
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export interface CandidateOrg {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  url: string | null;
  /** Mirrors vocab_status enum in DB. */
  status: "pending" | "approved" | "rejected";
  memberCount: number;
}

export interface CandidateOrgPairInput {
  a: CandidateOrg;
  b: CandidateOrg;
}

export type OrgDuplicateSignal =
  | "name"
  | "slug"
  | "shortName"
  | "urlHost"
  | "similarName";

export type OrgTier = "high" | "medium" | "weak";

export interface ScoredOrgPair {
  a: CandidateOrg;
  b: CandidateOrg;
  score: number;
  signals: OrgDuplicateSignal[];
  tier: OrgTier;
}

export function scoreOrgPair(input: CandidateOrgPairInput): ScoredOrgPair {
  const { a, b } = input;
  const signals: OrgDuplicateSignal[] = [];
  let score = 0;

  const na = normalizeOrgName(a.name);
  const nb = normalizeOrgName(b.name);
  if (na && nb && na === nb) {
    score += 50;
    signals.push("name");
  } else if (na && nb && nearOrgName(na, nb)) {
    score += 10;
    signals.push("similarName");
  }

  // Slug match is a strong signal — slugs are unique per-table, so a
  // collision can only happen through case/dash normalization quirks.
  if (a.slug && b.slug && a.slug.toLowerCase() === b.slug.toLowerCase()) {
    score += 50;
    signals.push("slug");
  }

  const sna = normalizeOrgName(a.shortName);
  const snb = normalizeOrgName(b.shortName);
  if (sna && snb && sna === snb) {
    score += 30;
    signals.push("shortName");
  }

  const ua = canonicalizeOrgUrl(a.url);
  const ub = canonicalizeOrgUrl(b.url);
  if (ua && ub && ua === ub) {
    score += 30;
    signals.push("urlHost");
  }

  const tier: OrgTier = score >= 80 ? "high" : score >= 50 ? "medium" : "weak";
  return { a, b, score, signals, tier };
}

/**
 * Anchor + score the org register. Each anchor group must be small —
 * if "tech" matches 50+ orgs via normalized name, it's clearly a false
 * anchor; skip it and rely on URL / slug / shortName anchors to
 * surface the real duplicates inside that bucket.
 */
export function buildAndScoreOrgPairs(
  orgs: CandidateOrg[],
  options: { threshold?: number; limit?: number } = {}
): ScoredOrgPair[] {
  const threshold = options.threshold ?? 30;
  const limit = options.limit ?? 100;

  const byName = new Map<string, CandidateOrg[]>();
  const bySlug = new Map<string, CandidateOrg[]>();
  const byShortName = new Map<string, CandidateOrg[]>();
  const byUrlHost = new Map<string, CandidateOrg[]>();

  for (const o of orgs) {
    const n = normalizeOrgName(o.name);
    if (n) push(byName, n, o);
    if (o.slug) push(bySlug, o.slug.toLowerCase(), o);
    const sn = normalizeOrgName(o.shortName);
    if (sn) push(byShortName, sn, o);
    const uh = canonicalizeOrgUrl(o.url);
    if (uh) push(byUrlHost, uh, o);
  }

  const MAX_ANCHOR_GROUP_SIZE = 50;
  const pairKey = (a: CandidateOrg, b: CandidateOrg) =>
    a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
  const seenPairs = new Map<string, CandidateOrgPairInput>();
  for (const anchor of [byName, bySlug, byShortName, byUrlHost]) {
    for (const group of anchor.values()) {
      if (group.length < 2 || group.length > MAX_ANCHOR_GROUP_SIZE) continue;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i];
          const b = group[j];
          const key = pairKey(a, b);
          if (!seenPairs.has(key)) seenPairs.set(key, { a, b });
        }
      }
    }
  }

  const scored: ScoredOrgPair[] = [];
  for (const p of seenPairs.values()) {
    const s = scoreOrgPair(p);
    if (s.score >= threshold) scored.push(s);
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, limit);
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V): void {
  const list = m.get(k);
  if (list) list.push(v);
  else m.set(k, [v]);
}
