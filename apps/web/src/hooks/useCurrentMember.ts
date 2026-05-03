import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { useApi } from "../lib/api";

export type CurrentMemberStatus =
  | "idle"
  | "loading"
  | "provisioning"
  | "ready"
  | "error";

export interface CurrentMemberProfile {
  id: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  jobTitle: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  orcid: string | null;
  websiteUrl: string | null;
  isPublic: boolean;
  showOnMap: boolean;
  publicLocation: string | null;
}

export interface CurrentMember {
  id: string;
  email: string;
  role: string;
  marketingConsent: boolean;
  isLegacyImport: boolean;
  createdAt: string;
  profile: CurrentMemberProfile | null;
}

interface State {
  status: CurrentMemberStatus;
  member: CurrentMember | null;
  error: Error | null;
}

interface Options {
  /** Delay between poll attempts while the API reports user_pending. */
  pollIntervalMs?: number;
  /** Total time to keep polling before giving up with a timeout error. */
  pollTimeoutMs?: number;
}

const IDLE_STATE: State = { status: "idle", member: null, error: null };

/**
 * Resolves the signed-in WorkOS user to the matching row in our users table
 * via GET /api/me. Handles the brief race between sign-up completion and
 * webhook delivery: if the API replies 404 user_pending, the hook keeps
 * polling on `pollIntervalMs` until either a 200 lands or `pollTimeoutMs`
 * elapses.
 *
 * Returns:
 *   status: "idle"          — no WorkOS user signed in
 *   status: "loading"       — initial /me request in flight
 *   status: "provisioning"  — webhook hasn't fired yet, polling
 *   status: "ready"         — member is `member`
 *   status: "error"         — `error` describes what failed
 *
 * Components calling this hook receive a stable `refetch` to re-run the
 * fetch, e.g. after the user updates their profile.
 */
export function useCurrentMember(opts: Options = {}): State & {
  refetch: () => void;
} {
  const { user: workosUser, isLoading: authLoading } = useAuth();
  const apiFetch = useApi();

  const pollIntervalMs = opts.pollIntervalMs ?? 1000;
  const pollTimeoutMs = opts.pollTimeoutMs ?? 15_000;

  const [state, setState] = useState<State>(IDLE_STATE);
  const tokenRef = useRef(0);

  const fetchMember = useCallback(async () => {
    const token = ++tokenRef.current;
    setState({ status: "loading", member: null, error: null });

    const deadline = Date.now() + pollTimeoutMs;
    let switchedToProvisioning = false;

    while (tokenRef.current === token) {
      let res: Response;
      try {
        res = await apiFetch("/me");
      } catch (e) {
        if (tokenRef.current !== token) return;
        setState({
          status: "error",
          member: null,
          error: e instanceof Error ? e : new Error(String(e)),
        });
        return;
      }
      if (tokenRef.current !== token) return;

      if (res.ok) {
        const body = (await res.json()) as {
          ok: true;
          user: CurrentMember;
        };
        setState({ status: "ready", member: body.user, error: null });
        return;
      }

      if (res.status === 404) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (body?.error === "user_pending") {
          if (!switchedToProvisioning) {
            switchedToProvisioning = true;
            setState((s) => ({ ...s, status: "provisioning" }));
          }
          if (Date.now() >= deadline) {
            setState({
              status: "error",
              member: null,
              error: new Error(
                "Account provisioning timed out. Please refresh the page."
              ),
            });
            return;
          }
          await sleep(pollIntervalMs);
          continue;
        }
      }

      setState({
        status: "error",
        member: null,
        error: new Error(`/api/me responded ${res.status}`),
      });
      return;
    }
  }, [apiFetch, pollIntervalMs, pollTimeoutMs]);

  useEffect(() => {
    if (authLoading) return;
    if (!workosUser) {
      tokenRef.current++;
      setState(IDLE_STATE);
      return;
    }
    void fetchMember();
    return () => {
      tokenRef.current++;
    };
  }, [authLoading, workosUser, fetchMember]);

  return { ...state, refetch: fetchMember };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
