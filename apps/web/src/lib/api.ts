import { useAuth } from "@workos-inc/authkit-react";
import { useCallback, useRef } from "react";

/**
 * Returns a stable fetch function that targets the @us-rse/api Worker via
 * the same-origin /api/* proxy and attaches the WorkOS access token in the
 * Authorization header for authenticated routes.
 *
 * The returned function is referentially stable across renders so it can be
 * safely used as a dependency in useEffect / useCallback without triggering
 * re-fetch loops.
 */
export function useApi() {
  const { getAccessToken } = useAuth();
  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;

  return useCallback(async function apiFetch(
    path: string,
    init?: RequestInit
  ): Promise<Response> {
    const token = await getAccessTokenRef.current().catch(() => null);

    const headers = new Headers(init?.headers);
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const url = path.startsWith("/api/") ? path : `/api${path}`;
    return fetch(url, { ...init, headers });
  }, []);
}
