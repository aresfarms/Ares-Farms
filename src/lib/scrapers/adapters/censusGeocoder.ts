/**
 * Census geocoder — shared CORE leaf (global fetch only, imports nothing).
 *
 * The U.S. Census Bureau Geocoding Services (public, no API key) resolve a US
 * address to a census tract + coordinates. Shared by every place-fact adapter
 * (Opportunity Zones, HUBZone, …) so the geocode logic lives in exactly one
 * place — no duplication, no drift.
 *
 * benchmark=Public_AR_Current · vintage=Current_Current · U.S. Government work.
 */

export const CENSUS_GEOCODER_URL =
  "https://geocoding.geo.census.gov/geocoder/geographies/address";

export type CensusGeocodeResult = {
  geoid: string;
  tractName: string;
  stateFips: string;
  countyFips: string;
  tractFips: string;
  matchedAddress: string;
  lat: string;
  lon: string;
};

/**
 * Geocode a US address to a Census tract GEOID + coordinates.
 * Returns null on no-match (unmatched address, rural gap, etc.); throws only on
 * an HTTP failure.
 */
export async function geocodeToCensusTract(
  street: string,
  city: string,
  state: string,
  zip?: string,
): Promise<CensusGeocodeResult | null> {
  const params = new URLSearchParams({
    street,
    city,
    state,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "Census Tracts",
    format: "json",
  });
  if (zip) params.set("zip", zip);

  const res = await fetch(`${CENSUS_GEOCODER_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`Census geocoder HTTP ${res.status}`);
  const body = await res.json();

  const matches: unknown[] = body?.result?.addressMatches ?? [];
  if (matches.length === 0) return null;

  const match = matches[0] as Record<string, unknown>;
  const tracts = ((match.geographies as Record<string, unknown[]> | undefined)?.[
    "Census Tracts"
  ] ?? []) as Array<Record<string, string>>;
  if (tracts.length === 0) return null;

  const tract = tracts[0];
  const coords = match.coordinates as Record<string, string> | undefined;
  return {
    geoid: tract.GEOID,
    tractName: tract.NAME,
    stateFips: tract.STATE,
    countyFips: tract.COUNTY,
    tractFips: tract.TRACT,
    matchedAddress: (match.matchedAddress as string) ?? "",
    lat: coords?.y ?? "",
    lon: coords?.x ?? "",
  };
}
