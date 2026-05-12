import { describe, expect, it } from "vitest";
import { findSimilarApproved, type SimilarTerm } from "./vocabSimilarity";

// Re-uses the normalizeDisplayName helper from duplicateDetection; do not
// re-import it here — we only test the public surface of vocabSimilarity.

function approved(name: string, id = name): { id: string; name: string } {
  return { id, name };
}

describe("findSimilarApproved", () => {
  it("returns null when no approved terms are close", () => {
    const result = findSimilarApproved("JavaScript", [
      approved("Rust"),
      approved("Go"),
    ]);
    expect(result).toEqual<SimilarTerm[]>([]);
  });

  it("scores normalized exact match as 100", () => {
    const result = findSimilarApproved("JavaScript", [
      approved("JavaScript"),
      approved("javascript"),
      approved("JAVA SCRIPT"),
    ]);
    // All three normalize to "javascript" → all score 100. Output is
    // sorted by score desc; ties preserve input order.
    expect(result.map((r) => r.score)).toEqual([100, 100, 100]);
  });

  it("scores length-scaled Levenshtein matches", () => {
    // 10-char string: distance ≤ 2 qualifies.
    // "JavaScript" vs "JavScript"   → distance 1 → score 80
    // "JavaScript" vs "JavScrpt"   → distance 2 → score 50
    // "JavaScript" vs "Pythn"      → too short and too far → not in results
    const result = findSimilarApproved("JavaScript", [
      approved("JavScript"),
      approved("JavScrpt"),
      approved("Python"),
    ]);
    expect(result.map((r) => ({ name: r.name, score: r.score }))).toEqual([
      { name: "JavScript", score: 80 },
      { name: "JavScrpt", score: 50 },
    ]);
  });

  it("requires tighter distance for short normalized names", () => {
    // 4-char "rust": only distance ≤ 1 qualifies.
    // "rust" vs "rest" → distance 1 → score 80
    // "rust" vs "rost" → distance 1 → score 80
    // "rust" vs "rose" → distance 2 → NOT in results
    const result = findSimilarApproved("rust", [
      approved("rest"),
      approved("rost"),
      approved("rose"),
    ]);
    expect(result.map((r) => r.name).sort()).toEqual(["rest", "rost"]);
  });

  it("admits distance ≤ 3 only for long names", () => {
    // 20-char normalized source "differentialequations" — distance ≤ 3 qualifies.
    // Candidates verified by manual decomposition + your levenshtein helper:
    //   "Diferential Equations"  → drop one f                       → d=1 → score 80
    //   "Diferential Equation"   → drop one f, drop trailing s      → d=2 → score 50
    //   "Diferential Equatio"    → drop one f, drop n, drop s       → d=3 → score 30
    //   "Distinguished Equations" → much further                    → excluded
    const result = findSimilarApproved("Differential Equations", [
      approved("Diferential Equations"),  // d=1 → score 80
      approved("Diferential Equation"),   // d=2 → score 50
      approved("Diferential Equatio"),    // d=3 → score 30
      approved("Distinguished Equations"), // d≫3 → not in results
    ]);
    expect(result.map((r) => r.score)).toEqual([80, 50, 30]);
  });

  it("excludes the pending term itself by id when given", () => {
    const result = findSimilarApproved("JavaScript", [
      approved("JavaScript", "p1"), // same id as pending — should be excluded
      approved("JavaScript", "a1"),
    ], "p1");
    expect(result.map((r) => r.id)).toEqual(["a1"]);
  });
});
