import { useEffect, useState } from "react";
import { useApi } from "../lib/api";
import type { CurrentMember } from "./useCurrentMember";

type Status = "loading" | "ready" | "not_found" | "error";

interface State {
  status: Status;
  member: PublicMember | null;
  error: Error | null;
}

export type PublicMember = Omit<
  CurrentMember,
  "email" | "marketingConsent" | "isLegacyImport"
>;

const INITIAL: State = { status: "loading", member: null, error: null };

export function usePublicMember(slug: string | undefined): State {
  const apiFetch = useApi();
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    if (!slug) {
      setState({
        status: "not_found",
        member: null,
        error: new Error("No slug provided"),
      });
      return;
    }

    let cancelled = false;
    setState(INITIAL);

    void (async () => {
      try {
        const res = await apiFetch(`/members/${encodeURIComponent(slug)}`);
        if (cancelled) return;

        if (res.status === 404) {
          setState({ status: "not_found", member: null, error: null });
          return;
        }
        if (!res.ok) {
          setState({
            status: "error",
            member: null,
            error: new Error(`/api/members responded ${res.status}`),
          });
          return;
        }

        const body = (await res.json()) as { ok: true; member: PublicMember };
        setState({ status: "ready", member: body.member, error: null });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          member: null,
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, apiFetch]);

  return state;
}
