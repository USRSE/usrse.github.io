import { useEffect, useState } from "react";
import { useApi } from "@us-rse/auth-shell";

export interface PublicEvent {
  id: string;
  slug: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  description: string | null;
  scope: string;
  externalUrl: string | null;
  authorId: string | null;
}

export function useEvents() {
  const apiFetch = useApi();
  const [events, setEvents] = useState<PublicEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/events");
        if (cancelled) return;
        if (!res.ok) {
          setError(`/events responded ${res.status}`);
          return;
        }
        const body = (await res.json()) as { events: PublicEvent[] };
        setEvents(body.events);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  return { events, error };
}
