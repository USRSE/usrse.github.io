/**
 * Pure helpers for matching Slack usernames to US-RSE user accounts.
 * Kept DB-free so tests can run without a connection.
 */

export type Confidence = "high" | "medium" | "low" | "none";

export interface SlackUser {
  username: string;     // e.g. "lparsons" or "d.katz"
  displayName: string;  // may be empty
}

export interface RseUser {
  id: string;
  email: string;
  displayName: string | null; // from profiles.display_name
}

export interface MatchResult {
  rseUserId: string | null; // null when no plausible match
  confidence: Confidence;
  reasons: string[];        // human-readable signals that fed the score
}

/**
 * Normalize a name or username for comparison:
 *   - lowercase
 *   - strip dots, dashes, underscores, spaces
 */
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[.\-_\s]+/g, "");
}

/**
 * Extract the local part of an email (before the @).
 */
export function emailLocal(email: string): string {
  const i = email.indexOf("@");
  return i === -1 ? email : email.slice(0, i);
}

/**
 * Score how well a candidate RseUser matches a SlackUser.
 * Multiple signals add up; the highest combination becomes the
 * confidence level.
 *
 * Signals (in order of strength):
 *   - exact email-local match to slack username (very strong)
 *   - exact normalized displayName match to slack display name (very strong)
 *   - exact normalized displayName match to slack username (strong)
 *   - normalized email-local contains the slack username (weak)
 */
export function scoreCandidate(slack: SlackUser, candidate: RseUser): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  const slackUserNorm = normalizeName(slack.username);
  const slackDisplayNorm = slack.displayName ? normalizeName(slack.displayName) : "";

  const candEmailLocal = normalizeName(emailLocal(candidate.email));
  const candDisplayNorm = candidate.displayName ? normalizeName(candidate.displayName) : "";

  // Strong signals.
  if (candEmailLocal && candEmailLocal === slackUserNorm) {
    score += 100; reasons.push("email_local==slack_username");
  }
  if (candDisplayNorm && slackDisplayNorm && candDisplayNorm === slackDisplayNorm) {
    score += 90; reasons.push("display_name==slack_display");
  }
  if (candDisplayNorm && slackUserNorm && candDisplayNorm === slackUserNorm) {
    score += 70; reasons.push("display_name==slack_username");
  }

  // Weak signals.
  if (candEmailLocal && slackUserNorm.length >= 4 && candEmailLocal.includes(slackUserNorm)) {
    score += 10; reasons.push("email_local_contains_slack_username");
  }

  let confidence: Confidence;
  if (score >= 100) confidence = "high";
  else if (score >= 50) confidence = "medium";
  else if (score >= 10) confidence = "low";
  else confidence = "none";

  return { rseUserId: candidate.id, confidence, reasons };
}

/**
 * Pick the best candidate for a Slack user. Returns the highest-confidence
 * match. When two candidates tie at the top, the function returns the
 * winner but marks confidence one level lower to flag the ambiguity.
 */
export function pickBestMatch(slack: SlackUser, candidates: RseUser[]): MatchResult {
  if (candidates.length === 0) {
    return { rseUserId: null, confidence: "none", reasons: ["no_candidates"] };
  }

  const scored = candidates.map((c) => ({
    candidate: c,
    result: scoreCandidate(slack, c),
  }));

  const ranks: Record<Confidence, number> = { high: 3, medium: 2, low: 1, none: 0 };
  scored.sort((a, b) => ranks[b.result.confidence] - ranks[a.result.confidence]);

  const best = scored[0];
  const second = scored[1];

  if (
    second &&
    ranks[second.result.confidence] === ranks[best.result.confidence] &&
    ranks[best.result.confidence] > 0
  ) {
    // Ambiguous tie at the top → downgrade.
    const downgraded: Confidence =
      best.result.confidence === "high" ? "medium" :
      best.result.confidence === "medium" ? "low" :
      "none";
    return {
      rseUserId: best.result.rseUserId,
      confidence: downgraded,
      reasons: [...best.result.reasons, `tie_with(${second.candidate.id})`],
    };
  }

  return best.result;
}
