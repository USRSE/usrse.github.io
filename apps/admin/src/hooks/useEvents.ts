import { useCallback, useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

export interface EventRow {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  revision: number;
  scope: string;
  authorId: string | null;
  hostGroupId: string | null;
  hostOrgId: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export function useEventsList(filters?: {
  status?: string;
  type?: string;
  scope?: string;
  q?: string;
}) {
  const apiFetch = useApi();
  const [data, setData] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.type) params.set("type", filters.type);
      if (filters?.scope) params.set("scope", filters.scope);
      if (filters?.q) params.set("q", filters.q);
      const res = await apiFetch(`/admin/events?${params}`);
      if (!res.ok) {
        setError(`/admin/events responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as { rows: EventRow[] };
      setData(body.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [apiFetch, filters?.status, filters?.type, filters?.scope, filters?.q]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, refetch: load };
}
