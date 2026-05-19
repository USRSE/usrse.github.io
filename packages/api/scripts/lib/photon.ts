const PHOTON_BASE = "https://photon.komoot.io/api";

export async function geocodeOrg(
  name: string
): Promise<{ country: string | null; city: string | null }> {
  const url = `${PHOTON_BASE}?q=${encodeURIComponent(name)}&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "us-rse-backfill/1.0" },
  });
  if (!res.ok) return { country: null, city: null };
  const body = (await res.json()) as any;
  const feature = body.features?.[0];
  if (!feature) return { country: null, city: null };
  const props = feature.properties ?? {};
  return {
    country: props.country ?? null,
    city: props.city ?? props.locality ?? props.name ?? null,
  };
}
