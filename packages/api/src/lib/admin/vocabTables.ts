import {
  disciplines,
  languages,
  skills,
  userDisciplines,
  userLanguages,
  userSkills,
} from "../../db/schema";

export type VocabKind = "disciplines" | "skills" | "languages";

const VOCAB_KINDS: readonly VocabKind[] = [
  "disciplines",
  "skills",
  "languages",
] as const;

export function isVocabKind(v: unknown): v is VocabKind {
  return typeof v === "string" && (VOCAB_KINDS as readonly string[]).includes(v);
}

/**
 * Maps a vocab kind to its tables. The join table's FK column to the
 * vocab table is intentionally NOT exposed here as a Drizzle reference
 * because the column names differ (`discipline_id` / `skill_id` /
 * `language_id`) and the Drizzle column types don't unify cleanly.
 * Endpoints that need the FK column switch on `kind` directly — the
 * switch lives once per operation, in the place where the column is
 * used, rather than smeared through a generic helper.
 */
export function vocabTableFor(kind: VocabKind): {
  vocab: typeof disciplines | typeof skills | typeof languages;
  join: typeof userDisciplines | typeof userSkills | typeof userLanguages;
} {
  switch (kind) {
    case "disciplines":
      return { vocab: disciplines, join: userDisciplines };
    case "skills":
      return { vocab: skills, join: userSkills };
    case "languages":
      return { vocab: languages, join: userLanguages };
  }
}
