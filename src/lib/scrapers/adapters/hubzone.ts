/**
 * HUBZone Place-Facts Adapter (SBA Historically Underutilized Business Zone).
 *
 * Mirrors the proven Opportunity Zone adapter. A HUBZone designation is a
 * published government boundary fact (same class as OZ / FEMA / Census overlays).
 *
 * Governing authority:
 * - Designation authority: SBA, 13 CFR §126 / 15 U.S.C. §657a — HUBZone areas.
 * - Layer: public ArcGIS FeatureServer carrying the SBA HUBZone designation
 *   CATEGORIES as separate sublayers (Qualified Census Tract, Qualified
 *   Non-Metropolitan County, Redesignated, Governor-Designated, Indian Land,
 *   Disaster Area), effective 2023-07-01. Authoritative LIVE status is the SBA
 *   HUBZone Map (maps.certify.sba.gov) — always "verify current designation".
 * - Geocoder: shared U.S. Census public geocoder (censusGeocoder.ts).
 *
 * CRITICAL freshness honesty (unlike OZ, which is locked 2018–2028): HUBZone
 * areas change. Redesignated, Governor-Designated, and Disaster areas carry
 * EXPIRATION dates. A designation past its expiration is reported isCurrent:false
 * — historical/expired, "verify current status with SBA" — never asserted as
 * currently designated. Same honesty rule that fixed the stale HUD listings.
 *
 * Pure leaf: global fetch + the shared core geocoder only — imports no domain
 * unit (stays core substrate).
 *
 * Lookup flow:
 *   address → Census geocoder → lat/lon
 *           → SBA HUBZone layer point-intersect across the type sublayers
 *           → { designated, hubzoneType, effective, expiration, isCurrent }
 */

import {
  geocodeToCensusTract,
  type CensusGeocodeResult,
} from "./censusGeocoder";

export { geocodeToCensusTract, type CensusGeocodeResult };

export const HUBZONE_FEATURE_BASE =
  "https://services6.arcgis.com/BAJNi3EgCdtQ1BCG/arcgis/rest/services/HUB_Zone_2023/FeatureServer";

export const HUBZONE_ADAPTER_VERSION = "sba-hubzone-adapter-v0.1.0";

/** Dataset effective date for the standard (non-governor) sublayers. */
export const HUBZONE_DATASET_EFFECTIVE = "2023-07-01";

export const HUBZONE_SOURCE_LABEL =
  "SBA HUBZone designation layer (public ArcGIS FeatureServer; effective 2023-07-01) · authoritative live status: SBA HUBZone Map (maps.certify.sba.gov)";

/**
 * The SBA HUBZone type sublayers. `timeLimited` marks the categories that carry
 * an expiration (Redesignated / Governor-Designated / Disaster). For Governor
 * sublayers the per-feature effective + expiration come from the mvw_gov fields;
 * for Redesignated counties the expiration is parsed from the status string
 * ("Redesignated through <date>").
 */
type LayerCfg = {
  id: number;
  type: string;
  timeLimited: boolean;
  effectiveField?: string; // governor layers carry per-feature effective
  expirationField?: string; // governor layers carry per-feature expiration
  statusField?: string; // redesignated counties encode "Redesignated through <date>"
  outFields: string;
};

const LAYERS: LayerCfg[] = [
  { id: 0, type: "Qualified Census Tract", timeLimited: false, outFields: "GEOID,NAMELSAD,F20230701_q,F20230701_1" },
  { id: 1, type: "Qualified Non-Metropolitan County", timeLimited: false, outFields: "GEOID,NAMELSAD,F20230701_q,F20230701_1" },
  { id: 2, type: "Redesignated Non-Metropolitan County", timeLimited: true, statusField: "F20230701_q", outFields: "GEOID,NAMELSAD,F20230701_q,F20230701_1" },
  { id: 3, type: "Redesignated Census Tract", timeLimited: true, outFields: "GEOID,NAMELSAD,F20230701_q,F20230701_2" },
  { id: 4, type: "Governor-Designated County", timeLimited: true, effectiveField: "mvw_gov_ar", expirationField: "mvw_gov__3", outFields: "GEOID,NAMELSAD,mvw_gov_ar,mvw_gov__3,mvw_gov__1" },
  { id: 5, type: "Qualified Indian Land", timeLimited: false, outFields: "GEOID,NAMELSAD" },
  { id: 6, type: "Qualified Disaster Area", timeLimited: true, outFields: "GEOID,NAMELSAD" },
  { id: 7, type: "Governor-Designated Census Tract", timeLimited: true, effectiveField: "mvw_gov_ar", expirationField: "mvw_gov__3", outFields: "GEOID,NAMELSAD,mvw_gov_ar,mvw_gov__3,mvw_gov__1" },
];

export type HubzoneMatch = {
  hubzoneType: string;
  geoid: string;
  area: string;
  effective: string;
  expiration: string | null;
  timeLimited: boolean;
};

export type HubzoneLookupResult = {
  adapterVersion: string;
  fetchedAt: string;
  address: string;
  geocodeSource: "census-geocoder-public-ar-current";
  hubzoneSource: string;
  designated: boolean;
  hubzoneType: string | null;
  geoid: string | null;
  area: string | null;
  effective: string | null;
  expiration: string | null;
  /** false when the designation is past its expiration (historical/expired). */
  isCurrent: boolean;
  timeLimited: boolean;
  geocodeLat: string | null;
  geocodeLon: string | null;
  error: string | null;
};

/** Parse "Redesignated through June 30, 2026" → "2026-06-30" (or null). */
export function parseRedesignatedThrough(status: string | null | undefined): string | null {
  if (!status) return null;
  const m = /through\s+([A-Za-z]+ \d{1,2},? \d{4})/i.exec(status);
  if (!m) return null;
  const d = new Date(m[1]);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Normalize an ISO-ish date string to YYYY-MM-DD (or null). */
function normDate(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Query one SBA HUBZone sublayer for a point. Returns the match (with type +
 * dates) or null. Point order is lon,lat.
 */
export async function querySbaHubzoneLayer(
  lon: string,
  lat: string,
  cfg: LayerCfg,
): Promise<HubzoneMatch | null> {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: cfg.outFields,
    returnGeometry: "false",
    f: "pjson",
  });
  const res = await fetch(`${HUBZONE_FEATURE_BASE}/${cfg.id}/query?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`SBA HUBZone layer ${cfg.id} HTTP ${res.status}`);
  const body = await res.json();
  const feat = (body?.features ?? [])[0];
  if (!feat) return null;
  const a = feat.attributes as Record<string, string>;

  let effective = HUBZONE_DATASET_EFFECTIVE;
  let expiration: string | null = null;
  if (cfg.effectiveField) effective = normDate(a[cfg.effectiveField]) ?? HUBZONE_DATASET_EFFECTIVE;
  if (cfg.expirationField) expiration = normDate(a[cfg.expirationField]);
  if (cfg.statusField) expiration = parseRedesignatedThrough(a[cfg.statusField]);

  return {
    hubzoneType: cfg.type,
    geoid: a.GEOID ?? "",
    area: a.NAMELSAD ?? a.GEOID ?? "",
    effective,
    expiration,
    timeLimited: cfg.timeLimited,
  };
}

/**
 * Full HUBZone place-fact lookup. Geocodes, then point-intersects the SBA type
 * sublayers; returns a structured result. Never throws to caller.
 */
export async function lookupHubzone(
  street: string,
  city: string,
  state: string,
  zip?: string,
  now: Date = new Date(),
): Promise<HubzoneLookupResult> {
  const fetchedAt = now.toISOString();
  const address = [street, city, state, zip].filter(Boolean).join(", ");
  const base = {
    adapterVersion: HUBZONE_ADAPTER_VERSION,
    fetchedAt,
    address,
    geocodeSource: "census-geocoder-public-ar-current" as const,
    hubzoneSource: HUBZONE_SOURCE_LABEL,
  };

  try {
    const geo: CensusGeocodeResult | null = await geocodeToCensusTract(street, city, state, zip);
    if (!geo || !geo.lat || !geo.lon) {
      return { ...base, designated: false, hubzoneType: null, geoid: null, area: null, effective: null, expiration: null, isCurrent: false, timeLimited: false, geocodeLat: null, geocodeLon: null, error: "address-no-geocode-match" };
    }

    // Query the type sublayers; a point falls in at most one type.
    const matches = await Promise.all(
      LAYERS.map((cfg) => querySbaHubzoneLayer(geo.lon, geo.lat, cfg).catch(() => null)),
    );
    const match = matches.find((m): m is HubzoneMatch => m !== null) ?? null;

    if (!match) {
      return { ...base, designated: false, hubzoneType: null, geoid: null, area: null, effective: null, expiration: null, isCurrent: false, timeLimited: false, geocodeLat: geo.lat, geocodeLon: geo.lon, error: null };
    }

    const isCurrent = isDesignationCurrent(match.expiration, now);
    return {
      ...base,
      designated: true,
      hubzoneType: match.hubzoneType,
      geoid: match.geoid,
      area: match.area,
      effective: match.effective,
      expiration: match.expiration,
      isCurrent,
      timeLimited: match.timeLimited,
      geocodeLat: geo.lat,
      geocodeLon: geo.lon,
      error: null,
    };
  } catch (err) {
    return { ...base, designated: false, hubzoneType: null, geoid: null, area: null, effective: null, expiration: null, isCurrent: false, timeLimited: false, geocodeLat: null, geocodeLon: null, error: err instanceof Error ? err.message : "unknown-fetch-error" };
  }
}

/** A designation is current unless it carries an expiration already in the past. */
export function isDesignationCurrent(expiration: string | null, now: Date = new Date()): boolean {
  if (!expiration) return true;
  const exp = new Date(`${expiration}T23:59:59Z`);
  return exp.getTime() >= now.getTime();
}

/**
 * Governance posture (see placeFactActivation.ts). lookupHubzone performs a LIVE
 * external fetch; per the Module 22/23 decision it ships GATED
 * (liveFetchAllowed:false). The verified frozen snapshot is what renders.
 */
export const hubzoneAdapter = {
  adapterId: "sba-hubzone-adapter",
  sourceId: "sba-hubzone",
  adapterVersion: HUBZONE_ADAPTER_VERSION,
  liveFetchAllowed: false,
  posture: "governed-place-facts-lookup-live-fetch-gated",
  geocoderEndpoint: "census-geocoder",
  hubzoneEndpoint: HUBZONE_FEATURE_BASE,
  lookup: lookupHubzone,
};
