import { useEffect, useState, useRef } from "react";
import { useAuth } from "@workos-inc/authkit-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://us-rse-api.leadership-28b.workers.dev";

export type OrgType =
  | "university"
  | "national_lab"
  | "agency"
  | "company"
  | "nonprofit"
  | "external_resource"
  | "other";

export interface OrgRow {
  id: string;
  name: string;
  shortName: string | null;
  url: string | null;
  type: OrgType;
  country: string | null;
  logoUrl: string | null;
  logoMarkUrl: string | null;
  memberCount: number;
  isOrgMember: boolean;
}

export interface OrgsListResponse {
  ok: true;
  rows: OrgRow[];
  total: number;
  nextCursor: string | null;
  facets: {
    types: Record<OrgType, number>;
    countries: Record<string, number>;
  };
}

export interface OrgProfileMember {
  userId: string;
  memberSlug: string;
  displayName: string;
  avatarUrl: string | null;
  role: string | null;
  isPrimary: boolean;
}

export interface OrgProfileResponse {
  ok: true;
  organization: {
    id: string;
    name: string;
    shortName: string | null;
    url: string | null;
    type: OrgType;
    country: string | null;
    description: string | null;
    logoUrl: string | null;
    logoDarkUrl: string | null;
    logoMarkUrl: string | null;
    logoCredit: string | null;
    isOrgMember: boolean;
    membershipTier: string | null;
    sponsoredEvents: Array<{
      eventId: string;
      eventName: string;
      tier: string;
      eventDate: string;
    }>;
  };
  members: {
    totalCount: number;
    visibleCount: number;
    hiddenCount: number;
    rows: OrgProfileMember[];
  };
}

export interface OrgsFilters {
  q?: string;
  type?: OrgType | "all";
  country?: string;
  member?: boolean;
  cursor?: string | null;
  limit?: number;
}

function buildQs(f: OrgsFilters): string {
  const params = new URLSearchParams();
  if (f.q?.trim()) params.set("q", f.q.trim());
  if (f.type && f.type !== "all") params.set("type", f.type);
  if (f.country) params.set("country", f.country);
  if (f.member) params.set("member", "true");
  if (f.cursor) params.set("cursor", f.cursor);
  if (f.limit) params.set("limit", String(f.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

interface UseOrganizationsState {
  data: OrgsListResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Public hook for the organization directory list page. Fetches
 * organizations with optional filters (search, type, country, membership).
 *
 * The worker mounts the public route at /organizations (no /api/ prefix);
 * this hook fetches directly via fetch() since the endpoint is public.
 */
export function useOrganizations(filters: OrgsFilters): UseOrganizationsState {
  const [state, setState] = useState<UseOrganizationsState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const key = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, isLoading: true, error: null });
    void (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/organizations${buildQs(filters)}`);
        if (cancelled) return;
        if (!res.ok) {
          setState({
            data: null,
            isLoading: false,
            error: `/organizations responded ${res.status}`,
          });
          return;
        }
        const body = (await res.json()) as OrgsListResponse;
        setState({ data: body, isLoading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        setState({
          data: null,
          isLoading: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

interface UseOrganizationState {
  data: OrgProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
}

/**
 * Public hook for the organization detail page. Fetches a single
 * organization's full profile including members and sponsored events.
 * Returns `notFound: true` for 404 so the page can render a
 * dedicated empty state.
 *
 * Includes the WorkOS access token in the Authorization header when
 * the user is signed in. The API endpoint uses optionalActor middleware;
 * without the token, signed-in users are classified as anonymous and
 * only see public members in the roster. With the token, they see
 * listed-private stubs in addition to public members.
 */
export function useOrganization(id: string | undefined): UseOrganizationState {
  const { getAccessToken, user: workosUser } = useAuth();
  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;

  const [state, setState] = useState<UseOrganizationState>({
    data: null,
    isLoading: true,
    error: null,
    notFound: false,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, isLoading: false, error: null, notFound: true });
      return;
    }
    let cancelled = false;
    setState({ data: null, isLoading: true, error: null, notFound: false });
    void (async () => {
      try {
        const token = await getAccessTokenRef.current().catch(() => null);
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        });
        if (cancelled) return;
        if (res.status === 404) {
          setState({ data: null, isLoading: false, error: null, notFound: true });
          return;
        }
        if (!res.ok) {
          setState({
            data: null,
            isLoading: false,
            error: `/organizations/${id} responded ${res.status}`,
            notFound: false,
          });
          return;
        }
        const body = (await res.json()) as OrgProfileResponse;
        setState({ data: body, isLoading: false, error: null, notFound: false });
      } catch (e) {
        if (cancelled) return;
        setState({
          data: null,
          isLoading: false,
          error: e instanceof Error ? e.message : String(e),
          notFound: false,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, workosUser]);

  return state;
}
