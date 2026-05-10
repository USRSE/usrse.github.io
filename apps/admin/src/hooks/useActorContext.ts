import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { useApi } from "@us-rse/auth-shell";

export interface LeadershipPosition {
  id: string;
  positionType: "board" | "executive" | "staff" | "advisor";
  label: string;
  startDate: string;
  endDate: string | null;
}

export interface ActorContext {
  user: {
    id: string;
    memberId: string;
    email: string;
    role: "member" | "staff" | "super_admin";
  };
  systemTier: 0 | 1 | 2;
  leadershipPositions: LeadershipPosition[];
  chairedGroupIds: string[];
  chairedEventIds: string[];
}

export type ActorContextStatus =
  | "idle"
  | "loading"
  | "ready"
  | "forbidden"
  | "user_pending"
  | "error";

interface State {
  status: ActorContextStatus;
  actor: ActorContext | null;
  error: Error | null;
}

const INITIAL: State = { status: "idle", actor: null, error: null };

/**
 * Loads /api/admin/me. Mirrors the public-app useCurrentMember pattern.
 * Polls every 60s while signed in so role changes propagate without a
 * full page reload (per the spec's token-doesn't-refresh tradeoff).
 */
export function useActorContext(): State & { refetch: () => void } {
  const { user: workosUser, isLoading: authLoading } = useAuth();
  const apiFetch = useApi();
  const [state, setState] = useState<State>(INITIAL);
  const tokenRef = useRef(0);

  const fetchActor = useCallback(async () => {
    const token = ++tokenRef.current;
    setState({ status: "loading", actor: null, error: null });
    try {
      const res = await apiFetch("/admin/me");
      if (tokenRef.current !== token) return;
      if (res.ok) {
        const body = (await res.json()) as { ok: true; actor: ActorContext };
        setState({ status: "ready", actor: body.actor, error: null });
        return;
      }
      if (res.status === 403) {
        setState({ status: "forbidden", actor: null, error: null });
        return;
      }
      if (res.status === 404) {
        setState({ status: "user_pending", actor: null, error: null });
        return;
      }
      setState({
        status: "error",
        actor: null,
        error: new Error(`/admin/me responded ${res.status}`),
      });
    } catch (e) {
      if (tokenRef.current !== token) return;
      setState({
        status: "error",
        actor: null,
        error: e instanceof Error ? e : new Error(String(e)),
      });
    }
  }, [apiFetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!workosUser) {
      tokenRef.current++;
      setState(INITIAL);
      return;
    }
    void fetchActor();
    const interval = window.setInterval(() => void fetchActor(), 60_000);
    return () => {
      tokenRef.current++;
      window.clearInterval(interval);
    };
  }, [authLoading, workosUser, fetchActor]);

  return { ...state, refetch: fetchActor };
}
