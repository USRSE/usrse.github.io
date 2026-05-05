import { useAuth } from "@workos-inc/authkit-react";
import { useCallback, useRef } from "react";

// Worker is hit cross-origin from the SPA; the worker's CORS middleware
// allows any origin, and we authenticate with a Bearer token rather than
// cookies, so no preflight surprises. The URL is already public via
// _redirects, so hardcoding it here doesn't widen the attack surface.
const API_BASE_URL = "https://us-rse-api.leadership-28b.workers.dev";

/**
 * Returns a stable fetch function that targets the @us-rse/api Worker
 * directly and attaches the WorkOS access token in the Authorization
 * header for authenticated routes.
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

    const normalizedPath = path.startsWith("/api/") ? path.slice(4) : path;
    const url = `${API_BASE_URL}${normalizedPath}`;
    return fetch(url, { ...init, headers });
  }, []);
}
