import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";

export interface MemberSearchPublicResult {
  kind: "public";
  memberId: string;
  slug: string;
  displayName: string;
  jobTitle: string | null;
  institutionName: string | null;
  careerStageLabel: string | null;
  publicLocation: string | null;
  countryName: string | null;
  photoUrl: string | null;
  disciplines: { name: string; slug: string }[];
}

export interface MemberSearchPrivateResult {
  kind: "private";
  memberId: string;
  slug: string;
  displayName: string;
}

export type MemberSearchResult =
  | MemberSearchPublicResult
  | MemberSearchPrivateResult;

export interface MemberSearchParams {
  q: string;
  disciplineIds: string[];
  careerStageIds: string[];
  countryIds: string[];
  limit?: number;
  offset?: number;
}

interface State {
  status: "idle" | "loading" | "ready" | "error";
  results: MemberSearchResult[];
  total: number;
  hasMore: boolean;
  error: Error | null;
}

const INITIAL: State = {
  status: "idle",
  results: [],
  total: 0,
  hasMore: false,
  error: null,
};

/**
 * Debounced member directory search. Re-fires on parameter changes
 * after 200ms of quiet — fast enough that typing feels live, slow
 * enough to coalesce a phrase into one request.
 *
 * Cancellation is handled via a token ref so a slow earlier request
 * never overwrites a fresher one. The deps array intentionally
 * stringifies the array filters — referential equality on those
 * arrays is unreliable across re-renders, and JSON.stringify is
 * cheap at this size.
 */
export function useMemberSearch(params: MemberSearchParams): State {
  const apiFetch = useApi();
  const [state, setState] = useState<State>(INITIAL);

  const { q, disciplineIds, careerStageIds, countryIds, limit, offset } =
    params;
  const filtersKey = JSON.stringify({
    q,
    disciplineIds,
    careerStageIds,
    countryIds,
    limit,
    offset,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));

    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const search = new URLSearchParams();
          if (q) search.set("q", q);
          if (disciplineIds.length)
            search.set("discipline", disciplineIds.join(","));
          if (careerStageIds.length)
            search.set("careerStage", careerStageIds.join(","));
          if (countryIds.length) search.set("country", countryIds.join(","));
          if (limit != null) search.set("limit", String(limit));
          if (offset != null) search.set("offset", String(offset));

          const res = await apiFetch(`/members?${search.toString()}`);
          if (cancelled) return;
          if (!res.ok) {
            setState({
              status: "error",
              results: [],
              total: 0,
              hasMore: false,
              error: new Error(`/members responded ${res.status}`),
            });
            return;
          }
          const body = (await res.json()) as {
            ok: true;
            results: MemberSearchResult[];
            total: number;
            hasMore: boolean;
          };
          setState({
            status: "ready",
            results: body.results,
            total: body.total,
            hasMore: body.hasMore,
            error: null,
          });
        } catch (e) {
          if (cancelled) return;
          setState({
            status: "error",
            results: [],
            total: 0,
            hasMore: false,
            error: e instanceof Error ? e : new Error(String(e)),
          });
        }
      })();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, apiFetch]);

  return state;
}
