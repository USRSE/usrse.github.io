import { useEffect, useState } from "react";
import { useApi } from "../lib/api";
import type { CurrentMember } from "./useCurrentMember";

type Status = "loading" | "ready" | "private" | "not_found" | "error";

export interface PrivateStub {
  memberId: string;
  displayName: string;
}

interface State {
  status: Status;
  member: PublicMember | null;
  privateStub: PrivateStub | null;
  error: Error | null;
}

export type PublicMember = Omit<
  CurrentMember,
  "email" | "marketingConsent" | "isLegacyImport"
>;

const INITIAL: State = {
  status: "loading",
  member: null,
  privateStub: null,
  error: null,
};

export function usePublicMember(slug: string | undefined): State {
  const apiFetch = useApi();
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    if (!slug) {
      setState({
        status: "not_found",
        member: null,
        privateStub: null,
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
          setState({
            status: "not_found",
            member: null,
            privateStub: null,
            error: null,
          });
          return;
        }
        if (!res.ok) {
          setState({
            status: "error",
            member: null,
            privateStub: null,
            error: new Error(`/api/members responded ${res.status}`),
          });
          return;
        }

        // The endpoint returns either { ok, member } for public
        // profiles or { ok, private: { memberId, displayName } } for
        // members who toggled their profile private. Either way the
        // status is 200 — privacy is signaled in the body shape, not
        // the HTTP status, so shared links keep working.
        const body = (await res.json()) as
          | { ok: true; member: PublicMember }
          | { ok: true; private: PrivateStub };

        if ("private" in body) {
          setState({
            status: "private",
            member: null,
            privateStub: body.private,
            error: null,
          });
          return;
        }

        setState({
          status: "ready",
          member: body.member,
          privateStub: null,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          member: null,
          privateStub: null,
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
