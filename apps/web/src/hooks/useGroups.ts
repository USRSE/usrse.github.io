import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://us-rse-api.leadership-28b.workers.dev";

export type GroupType = "working_group" | "affinity_group" | "regional_group";

export interface PublicGroupCard {
  id: string;
  name: string;
  slug: string;
  type: GroupType;
  description: string | null;
  slackChannel: string | null;
}

interface UseGroupsState {
  rows: PublicGroupCard[] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Public hook for the /community/working-groups, affinity-groups,
 * regional-groups list pages. Fetches once per type.
 *
 * The worker mounts the public route at /groups (no /api/ prefix);
 * this hook fetches directly via fetch() since useApi is for
 * authenticated admin calls only.
 */
export function useGroups(type: GroupType): UseGroupsState {
  const [state, setState] = useState<UseGroupsState>({
    rows: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ rows: null, loading: true, error: null });
    void (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/groups?type=${type}`);
        if (cancelled) return;
        if (!res.ok) {
          setState({
            rows: null,
            loading: false,
            error: `/groups responded ${res.status}`,
          });
          return;
        }
        const body = (await res.json()) as { ok: true; rows: PublicGroupCard[] };
        setState({ rows: body.rows, loading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        setState({
          rows: null,
          loading: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  return state;
}
