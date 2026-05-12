import { describe, expect, it } from "vitest";
import {
  disciplines,
  languages,
  skills,
  userDisciplines,
  userLanguages,
  userSkills,
} from "../../db/schema";
import { isVocabKind, vocabTableFor } from "./vocabTables";

describe("isVocabKind", () => {
  it("accepts the three valid kinds", () => {
    expect(isVocabKind("disciplines")).toBe(true);
    expect(isVocabKind("skills")).toBe(true);
    expect(isVocabKind("languages")).toBe(true);
  });
  it("rejects other strings", () => {
    expect(isVocabKind("organizations")).toBe(false);
    expect(isVocabKind("Skills")).toBe(false);
    expect(isVocabKind("")).toBe(false);
    expect(isVocabKind(undefined)).toBe(false);
  });
});

describe("vocabTableFor", () => {
  it("disciplines → disciplines + user_disciplines", () => {
    const t = vocabTableFor("disciplines");
    expect(t.vocab).toBe(disciplines);
    expect(t.join).toBe(userDisciplines);
  });
  it("skills → skills + user_skills", () => {
    const t = vocabTableFor("skills");
    expect(t.vocab).toBe(skills);
    expect(t.join).toBe(userSkills);
  });
  it("languages → languages + user_languages", () => {
    const t = vocabTableFor("languages");
    expect(t.vocab).toBe(languages);
    expect(t.join).toBe(userLanguages);
  });
});
