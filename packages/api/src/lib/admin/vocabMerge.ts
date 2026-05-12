import { and, eq, sql } from "drizzle-orm";
import type { createDb } from "../../db";
import {
  disciplines,
  languages,
  skills,
  userDisciplines,
  userLanguages,
  userSkills,
} from "../../db/schema";
import type { VocabKind } from "./vocabTables";

type Db = ReturnType<typeof createDb>;

export interface VocabMergeRequest {
  kind: VocabKind;
  sourceId: string;
  targetId: string;
}

export interface VocabMergeError {
  status: 400 | 404 | 409;
  error: string;
  message: string;
}

export interface VocabMergeResult {
  repointed: number;
  dropped: number;
  sourceName: string;
  targetName: string;
}

/**
 * Validate inputs, then in one db.transaction:
 *   1. Repoint user_<kind> rows from source to target where the
 *      (user_id, target_id) row does not already exist.
 *   2. Delete remaining user_<kind> rows pointing at source (the user
 *      already had the canonical term — drop the duplicate).
 *   3. Delete the source row.
 *
 * Returns `{ repointed, dropped, sourceName, targetName }` so the
 * audit payload can record exact counts.
 *
 * Validation:
 *   - source ≠ target
 *   - source exists (404 if not)
 *   - target exists AND status='approved' (409 if not)
 */
export async function executeVocabMerge(
  db: Db,
  req: VocabMergeRequest
): Promise<VocabMergeError | VocabMergeResult> {
  if (req.sourceId === req.targetId) {
    return {
      status: 400,
      error: "invalid_input",
      message: "Source and target must be different.",
    };
  }

  const [src, tgt] = await Promise.all([
    loadVocabRow(db, req.kind, req.sourceId),
    loadVocabRow(db, req.kind, req.targetId),
  ]);

  if (!src) {
    return {
      status: 404,
      error: "not_found",
      message: `Source ${req.kind} ${req.sourceId} not found.`,
    };
  }
  if (!tgt) {
    return {
      status: 404,
      error: "not_found",
      message: `Target ${req.kind} ${req.targetId} not found.`,
    };
  }
  if (tgt.status !== "approved") {
    return {
      status: 409,
      error: "target_not_approved",
      message: "Merge target must be an approved term.",
    };
  }

  let repointed = 0;
  let dropped = 0;

  await db.transaction(async (tx) => {
    switch (req.kind) {
      case "disciplines": {
        // Repoint where no conflict (user does not yet have target).
        const moved = await tx
          .update(userDisciplines)
          .set({ disciplineId: req.targetId })
          .where(
            and(
              eq(userDisciplines.disciplineId, req.sourceId),
              sql`NOT EXISTS (SELECT 1 FROM user_disciplines AS conflict WHERE conflict.user_id = ${userDisciplines.userId} AND conflict.discipline_id = ${req.targetId})`
            )
          )
          .returning({ userId: userDisciplines.userId });
        repointed = moved.length;
        // Drop remaining source-pointing rows — these are users who
        // already had the target term.
        const cleared = await tx
          .delete(userDisciplines)
          .where(eq(userDisciplines.disciplineId, req.sourceId))
          .returning({ userId: userDisciplines.userId });
        dropped = cleared.length;
        await tx.delete(disciplines).where(eq(disciplines.id, req.sourceId));
        break;
      }
      case "skills": {
        const moved = await tx
          .update(userSkills)
          .set({ skillId: req.targetId })
          .where(
            and(
              eq(userSkills.skillId, req.sourceId),
              sql`NOT EXISTS (SELECT 1 FROM user_skills AS conflict WHERE conflict.user_id = ${userSkills.userId} AND conflict.skill_id = ${req.targetId})`
            )
          )
          .returning({ userId: userSkills.userId });
        repointed = moved.length;
        const cleared = await tx
          .delete(userSkills)
          .where(eq(userSkills.skillId, req.sourceId))
          .returning({ userId: userSkills.userId });
        dropped = cleared.length;
        await tx.delete(skills).where(eq(skills.id, req.sourceId));
        break;
      }
      case "languages": {
        const moved = await tx
          .update(userLanguages)
          .set({ languageId: req.targetId })
          .where(
            and(
              eq(userLanguages.languageId, req.sourceId),
              sql`NOT EXISTS (SELECT 1 FROM user_languages AS conflict WHERE conflict.user_id = ${userLanguages.userId} AND conflict.language_id = ${req.targetId})`
            )
          )
          .returning({ userId: userLanguages.userId });
        repointed = moved.length;
        const cleared = await tx
          .delete(userLanguages)
          .where(eq(userLanguages.languageId, req.sourceId))
          .returning({ userId: userLanguages.userId });
        dropped = cleared.length;
        await tx.delete(languages).where(eq(languages.id, req.sourceId));
        break;
      }
    }
  });

  return {
    repointed,
    dropped,
    sourceName: src.name,
    targetName: tgt.name,
  };
}

async function loadVocabRow(
  db: Db,
  kind: VocabKind,
  id: string
): Promise<{ id: string; name: string; status: string } | null> {
  switch (kind) {
    case "disciplines": {
      const rows = await db
        .select({ id: disciplines.id, name: disciplines.name, status: disciplines.status })
        .from(disciplines)
        .where(eq(disciplines.id, id))
        .limit(1);
      return rows[0] ?? null;
    }
    case "skills": {
      const rows = await db
        .select({ id: skills.id, name: skills.name, status: skills.status })
        .from(skills)
        .where(eq(skills.id, id))
        .limit(1);
      return rows[0] ?? null;
    }
    case "languages": {
      const rows = await db
        .select({ id: languages.id, name: languages.name, status: languages.status })
        .from(languages)
        .where(eq(languages.id, id))
        .limit(1);
      return rows[0] ?? null;
    }
  }
}
