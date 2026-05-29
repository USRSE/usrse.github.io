import { useCallback, useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

export interface FormRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  revision: number;
  scope: string;
  authorId: string | null;
  hostGroupId: string | null;
  entityType: string | null;
  entityId: string | null;
  acceptsSubmissions: boolean;
  createdAt: string;
}

export function useFormsList(filters?: {
  status?: string;
  scope?: string;
  entityType?: string;
  q?: string;
}) {
  const apiFetch = useApi();
  const [data, setData] = useState<FormRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.scope) params.set("scope", filters.scope);
      if (filters?.entityType) params.set("entityType", filters.entityType);
      if (filters?.q) params.set("q", filters.q);
      const res = await apiFetch(`/admin/forms?${params}`);
      if (!res.ok) {
        setError(`/admin/forms responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as { rows: FormRow[] };
      setData(body.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [apiFetch, filters?.status, filters?.scope, filters?.entityType, filters?.q]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, refetch: load };
}
