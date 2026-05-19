const SUMMARY_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary/";

export async function fetchWikipediaSummary(
  title: string
): Promise<string | null> {
  const url = `${SUMMARY_BASE}${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "us-rse-backfill/1.0" },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as any;
  if (body.type === "disambiguation") return null;
  return truncateAtSentence(body.extract ?? "", 280);
}

export function truncateAtSentence(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastPeriod = slice.lastIndexOf(". ");
  if (lastPeriod > 0) return slice.slice(0, lastPeriod + 1);
  return slice;
}
