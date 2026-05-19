const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

export interface WikidataHit {
  qid: string;
  label: string;
  country: string | null;
  city: string | null;
  officialWebsite: string | null;
  enwikiTitle: string | null;
}

export async function searchWikidataOrg(
  name: string
): Promise<WikidataHit | null> {
  const query = `
    SELECT ?item ?itemLabel ?countryLabel ?hqLabel ?website ?article WHERE {
      ?item rdfs:label "${name.replace(/"/g, '\\"')}"@en .
      ?item wdt:P31/wdt:P279* wd:Q43229 . # instance of organization (or subclass)
      OPTIONAL { ?item wdt:P17 ?country . }
      OPTIONAL { ?item wdt:P159 ?hq . }
      OPTIONAL { ?item wdt:P856 ?website . }
      OPTIONAL {
        ?article schema:about ?item ;
                 schema:isPartOf <https://en.wikipedia.org/> .
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 1
  `;
  const res = await fetch(
    `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`,
    { headers: { "User-Agent": "us-rse-backfill/1.0" } }
  );
  if (!res.ok) return null;
  const body = (await res.json()) as any;
  const b = body.results?.bindings?.[0];
  if (!b) return null;
  const article = b.article?.value as string | undefined;
  const enwikiTitle = article
    ? decodeURIComponent(article.split("/wiki/")[1] ?? "").replace(/_/g, " ")
    : null;
  return {
    qid: b.item.value.split("/").pop(),
    label: b.itemLabel?.value ?? name,
    country: b.countryLabel?.value ?? null,
    city: b.hqLabel?.value ?? null,
    officialWebsite: b.website?.value ?? null,
    enwikiTitle,
  };
}
