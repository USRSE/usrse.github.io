/**
 * Multi-signal duplicate detection for the admin members directory.
 *
 * The flow is:
 *   1. Discover candidate pairs via anchor groups (an "anchor" is a key
 *      strong enough that two users sharing it deserve a closer look —
 *      normalized display name, canonicalized email local-part, ORCID,
 *      GitHub username, LinkedIn slug).
 *   2. Score each pair against all signals, additive.
 *   3. Surface pairs whose score >= 30, sorted by score desc.
 *
 * Anchor discovery is one SQL pass per anchor; scoring is pure JS over
 * the user payloads. At <10k members this is cheap enough to recompute
 * per request — no precomputed table needed.
 */

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export function normalizeDisplayName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function rawEmailLocal(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "";
  return email.split("@", 2)[0].toLowerCase();
}

export function emailDomain(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "";
  return email.split("@", 2)[1].toLowerCase();
}

export function canonicalizeEmailLocal(
  email: string | null | undefined
): string {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.toLowerCase().split("@", 2);
  // Strip +tag for everyone.
  const noTag = local.split("+", 1)[0];
  // For Gmail-family domains, dots in the local part are ignored.
  if (GMAIL_DOMAINS.has(domain)) return noTag.replace(/\./g, "");
  return noTag;
}

export function canonicalizeGithub(
  raw: string | null | undefined
): string {
  if (!raw) return "";
  // Match the path component after github.com/ or accept a bare username.
  const urlMatch = raw.match(/github\.com\/([^/?#]+)/i);
  // If the input looks like a URL but had no extractable username, give up.
  if (!urlMatch && /https?:\/\//i.test(raw)) return "";
  const username = (urlMatch ? urlMatch[1] : raw).trim();
  if (!username || username === "/") return "";
  return username.replace(/[/]+$/, "").toLowerCase();
}

export function canonicalizeLinkedin(
  raw: string | null | undefined
): string {
  if (!raw) return "";
  // /in/<slug> path on linkedin.com, or a bare slug.
  const urlMatch = raw.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (!urlMatch && /https?:\/\//i.test(raw)) return "";
  const slug = (urlMatch ? urlMatch[1] : raw).trim();
  if (!slug || slug === "/") return "";
  return slug.replace(/[/]+$/, "").toLowerCase();
}

/** Levenshtein distance ≤ 2 between two non-identical, length-similar local parts. */
export function nearLocalPart(a: string, b: string): boolean {
  if (a === b) return false; // same string is not "similar", it's identical
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

export interface CandidateUser {
  id: string;
  displayName: string | null;
  email: string;
  orcid: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  primaryOrgId: string | null;
  signedUpAt: Date;
  groupIds: Set<string>;
}

export interface CandidatePairInput {
  a: CandidateUser;
  b: CandidateUser;
}

export type Tier = "high" | "medium" | "weak";

export type DuplicateSignal =
  | "orcid"
  | "github"
  | "linkedin"
  | "displayName"
  | "canonicalEmail"
  | "rawEmailDifferentDomain"
  | "similarEmailLocal"
  | "primaryOrg"
  | "groupOverlap"
  | "signupProximity";

export interface ScoredPair {
  a: CandidateUser;
  b: CandidateUser;
  score: number;
  signals: DuplicateSignal[];
  tier: Tier;
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function scoreCandidatePair(input: CandidatePairInput): ScoredPair {
  const { a, b } = input;
  const signals: DuplicateSignal[] = [];
  let score = 0;

  if (a.orcid && b.orcid && a.orcid === b.orcid) {
    score += 50;
    signals.push("orcid");
  }
  const gha = canonicalizeGithub(a.githubUrl);
  const ghb = canonicalizeGithub(b.githubUrl);
  if (gha && ghb && gha === ghb) {
    score += 50;
    signals.push("github");
  }
  const lia = canonicalizeLinkedin(a.linkedinUrl);
  const lib = canonicalizeLinkedin(b.linkedinUrl);
  if (lia && lib && lia === lib) {
    score += 50;
    signals.push("linkedin");
  }
  const na = normalizeDisplayName(a.displayName);
  const nb = normalizeDisplayName(b.displayName);
  if (na && nb && na === nb) {
    score += 30;
    signals.push("displayName");
  }
  const ca = canonicalizeEmailLocal(a.email);
  const cb = canonicalizeEmailLocal(b.email);
  const da = emailDomain(a.email);
  const db = emailDomain(b.email);
  const ra = rawEmailLocal(a.email);
  const rb = rawEmailLocal(b.email);

  if (ca && cb && ca === cb) {
    // Canonical match (covers Gmail-dot equivalence and +tag stripping).
    score += 30;
    signals.push("canonicalEmail");
  } else if (ra && rb && ra === rb && da !== db) {
    // Raw same, different domains — not canonical-equivalent (e.g.,
    // `jdoe@a.com` vs `jdoe@b.com`); still a moderate signal.
    score += 25;
    signals.push("rawEmailDifferentDomain");
  } else if (ra && rb && nearLocalPart(ra, rb)) {
    // Typo-distance match.
    score += 10;
    signals.push("similarEmailLocal");
  }

  if (a.primaryOrgId && b.primaryOrgId && a.primaryOrgId === b.primaryOrgId) {
    score += 15;
    signals.push("primaryOrg");
  }

  // Group overlap — true if any group id is shared.
  for (const g of a.groupIds) {
    if (b.groupIds.has(g)) {
      score += 10;
      signals.push("groupOverlap");
      break;
    }
  }

  const aT = a.signedUpAt.getTime();
  const bT = b.signedUpAt.getTime();
  if (Math.abs(aT - bT) <= ONE_MONTH_MS) {
    score += 5;
    signals.push("signupProximity");
  }

  const tier: Tier = score >= 80 ? "high" : score >= 50 ? "medium" : "weak";
  return { a, b, score, signals, tier };
}
