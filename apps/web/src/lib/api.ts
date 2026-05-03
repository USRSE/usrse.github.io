import { useAuth } from "@workos-inc/authkit-react";

/**
 * Returns a fetch function that targets the @us-rse/api Worker via the
 * same-origin /api/* proxy and attaches the WorkOS access token in the
 * Authorization header for authenticated routes.
 *
 * Usage:
 *
 *   const apiFetch = useApi();
 *   const res = await apiFetch("/me");
 *   const data = await res.json();
 */
export function useApi() {
  const { getAccessToken } = useAuth();

  return async function apiFetch(
    path: string,
    init?: RequestInit
  ): Promise<Response> {
    const token = await getAccessToken().catch(() => null);

    const headers = new Headers(init?.headers);
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const url = path.startsWith("/api/") ? path : `/api${path}`;
    return fetch(url, { ...init, headers });
  };
}
