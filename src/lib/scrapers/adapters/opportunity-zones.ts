/**
 * Opportunity Zone Place-Facts Adapter
 *
 * Governing authority:
 * - Source: HUD GIS / CDFI Fund — official Treasury-designated OZ tracts
 *   (IRC §1400Z-1), published as ArcGIS FeatureServer layer 13 at
 *   services.arcgis.com/VTyQ9soqVukalItT/.../Opportunity_Zones
 * - Geocoder: US Census Bureau Geocoding Services (public, no key required)
 *   benchmark=Public_AR_Current, vintage=Current_Current
 * - Vol III §place-facts: place-fact matching requires authoritative government
 *   dataset + deterministic geocoder; result is a factual tract designation,
 *   not a scored recommendation.
 *
 * Lookup flow:
 *   address → Census geocoder → GEOID (11-digit census tract)
 *             → HUD OZ layer query WHERE GEOID10 = GEOID
 *             → {designated: boolean, tractId: string, rural: boolean}
 *
 * Total designated tracts: 8,765 (as of 2026-06-09)
 * GEOID format: 2-digit state + 3-digit county + 6-digit tract = 11 chars
 */

// Census geocoder is now a shared core leaf (censusGeocoder.ts). Re-exported
// here so existing importers of `geocodeToCensusTract` / `CENSUS_GEOCODER_URL` /
// `CensusGeocodeResult` from this module keep working unchanged.
import {
  CENSUS_GEOCODER_URL,
  geocodeToCensusTract,
  type CensusGeocodeResult,
} from "./censusGeocoder";

export {
  CENSUS_GEOCODER_URL,
  geocodeToCensusTract,
  type CensusGeocodeResult,
};

export const HUD_OZ_FEATURE_URL =
  "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Opportunity_Zones/FeatureServer/13/query";

export const OZ_ADAPTER_VERSION = "hud-oz-adapter-v0.1.0";

export type OZLookupResult = {
  adapterVersion: string;
  fetchedAt: string;
  address: string;
  geocodeSource: "census-geocoder-public-ar-current";
  ozSource: "hud-gis-opportunity-zones-fs13";
  geoid: string | null;
  designated: boolean;
  tractId: string | null;
  stateAbbr: string | null;
  stateName: string | null;
  rural: boolean;
  geocodeMatchedAddress: string | null;
  geocodeLat: string | null;
  geocodeLon: string | null;
  error: string | null;
};

/**
 * Query HUD OZ layer to check if a given GEOID10 is a designated OZ tract.
 * Returns null if the tract is not designated (absence = not designated).
 */
export async function queryHudOzByGeoid(geoid: string): Promise<{
  geoid10: string;
  stateAbbr: string;
  stateName: string;
  rural: boolean;
} | null> {
  const params = new URLSearchParams({
    where: `GEOID10='${geoid}'`,
    outFields: "GEOID10,STUSAB,STATE_NAME,Rural",
    returnGeometry: "false",
    f: "pjson",
  });

  const res = await fetch(`${HUD_OZ_FEATURE_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`HUD OZ query HTTP ${res.status}`);
  const body = await res.json();

  const features: unknown[] = body?.features ?? [];
  if (features.length === 0) return null;

  const attrs = (features[0] as Record<string, unknown>)
    .attributes as Record<string, string>;
  return {
    geoid10: attrs.GEOID10,
    stateAbbr: attrs.STUSAB,
    stateName: attrs.STATE_NAME,
    rural: attrs.Rural === "Y",
  };
}

/**
 * Full OZ place-facts lookup for a US address.
 * Chains Census geocoder → HUD OZ layer.
 * Always returns a structured result; never throws to caller.
 */
export async function lookupOpportunityZone(
  street: string,
  city: string,
  state: string,
  zip?: string
): Promise<OZLookupResult> {
  const fetchedAt = new Date().toISOString();
  const address = [street, city, state, zip].filter(Boolean).join(", ");

  try {
    const geocode = await geocodeToCensusTract(street, city, state, zip);
    if (!geocode) {
      return {
        adapterVersion: OZ_ADAPTER_VERSION,
        fetchedAt,
        address,
        geocodeSource: "census-geocoder-public-ar-current",
        ozSource: "hud-gis-opportunity-zones-fs13",
        geoid: null,
        designated: false,
        tractId: null,
        stateAbbr: null,
        stateName: null,
        rural: false,
        geocodeMatchedAddress: null,
        geocodeLat: null,
        geocodeLon: null,
        error: "address-no-census-tract-match",
      };
    }

    const oz = await queryHudOzByGeoid(geocode.geoid);

    return {
      adapterVersion: OZ_ADAPTER_VERSION,
      fetchedAt,
      address,
      geocodeSource: "census-geocoder-public-ar-current",
      ozSource: "hud-gis-opportunity-zones-fs13",
      geoid: geocode.geoid,
      designated: oz !== null,
      tractId: oz?.geoid10 ?? null,
      stateAbbr: oz?.stateAbbr ?? null,
      stateName: oz?.stateName ?? null,
      rural: oz?.rural ?? false,
      geocodeMatchedAddress: geocode.matchedAddress,
      geocodeLat: geocode.lat,
      geocodeLon: geocode.lon,
      error: null,
    };
  } catch (err) {
    return {
      adapterVersion: OZ_ADAPTER_VERSION,
      fetchedAt,
      address,
      geocodeSource: "census-geocoder-public-ar-current",
      ozSource: "hud-gis-opportunity-zones-fs13",
      geoid: null,
      designated: false,
      tractId: null,
      stateAbbr: null,
      stateName: null,
      rural: false,
      geocodeMatchedAddress: null,
      geocodeLat: null,
      geocodeLon: null,
      error: err instanceof Error ? err.message : "unknown-fetch-error",
    };
  }
}

/**
 * Governance posture (see placeFactActivation.ts for the recorded decision):
 * `lookupOpportunityZone` performs a LIVE external fetch at request time. Per the
 * Module 22/23 decision it ships GATED — `liveFetchAllowed: false` — until a
 * human operator approves live activation. The verified, frozen snapshot in
 * opportunityZoneSnapshot.ts is what renders publicly (published public-domain
 * government designation, with provenance + vintage), NOT this live call.
 */
export const opportunityZonesAdapter = {
  adapterId: "hud-opportunity-zones-adapter",
  sourceId: "hud-opportunity-zones",
  adapterVersion: OZ_ADAPTER_VERSION,
  liveFetchAllowed: false,
  posture: "governed-place-facts-lookup-live-fetch-gated",
  geocoderEndpoint: CENSUS_GEOCODER_URL,
  ozEndpoint: HUD_OZ_FEATURE_URL,
  lookup: lookupOpportunityZone,
};
