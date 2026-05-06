import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";

export interface VocabDiscipline {
  id: string;
  name: string;
  slug: string;
}

export interface VocabSkill {
  id: string;
  name: string;
  slug: string;
}

export interface VocabLanguage {
  id: string;
  name: string;
  slug: string;
}

export interface VocabCareerStage {
  id: string;
  slug: string;
  label: string;
}

export interface VocabCountry {
  id: string;
  isoAlpha2: string;
  name: string;
}

export interface Vocab {
  disciplines: VocabDiscipline[];
  skills: VocabSkill[];
  languages: VocabLanguage[];
  careerStages: VocabCareerStage[];
  countries: VocabCountry[];
}

interface State {
  status: "loading" | "ready" | "error";
  vocab: Vocab | null;
  error: Error | null;
}

const INITIAL: State = { status: "loading", vocab: null, error: null };

/**
 * Loads filter-dimension reference data once per session. The
 * payload is small (~20KB) and the values change rarely (vocabulary
 * tables are admin-curated), so a single fetch on mount with no
 * cache layer is fine for v1. Promote to TanStack Query if multiple
 * surfaces need this data and we want shared revalidation.
 */
export function useVocab(): State {
  const apiFetch = useApi();
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch("/vocab");
        if (cancelled) return;
        if (!res.ok) {
          setState({
            status: "error",
            vocab: null,
            error: new Error(`/vocab responded ${res.status}`),
          });
          return;
        }
        const body = (await res.json()) as { ok: true; vocab: Vocab };
        setState({ status: "ready", vocab: body.vocab, error: null });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          vocab: null,
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  return state;
}
