/**
 * parcelSourceRegistry — Furlong's OWN, sovereign national parcel-data map
 * (founder direction 2026-08-14: "build our own, no outside vendor controlling
 * our code or data").
 *
 * WHY A REGISTRY: US parcel/assessment data is fragmented across ~3,000 counties
 * with no free national database. But the vast majority of that data is served
 * over ONE protocol — Esri ArcGIS REST (`/query?f=json&where=…&outFields=…`) —
 * and many states publish a SINGLE statewide service covering all their counties.
 * So national coverage is a GENERIC ArcGIS resolver + this registry of per-
 * jurisdiction configs (endpoint + field-name map). Coverage grows by adding a
 * DATA entry here, not by writing new code. Each entry is a verified government
 * endpoint; no third-party vendor sits between us and the source of record.
 *
 * Two bespoke resolvers pre-date this registry and stay as-is (Maryland SDAT,
 * Delaware Sussex) because their multi-parcel/point logic is hand-tuned; every
 * NEW jurisdiction goes through the registry.
 *
 * The hosts here are the ONLY new outbound destinations the parcel layer reaches;
 * outboundRequestPolicy imports PARCEL_SOURCE_HOSTS so the allowlist stays
 * governed centrally and a new source can't silently open a new egress path.
 *
 * Master Volume: Vol II (every source named + dated), Vol III (governed egress),
 * Vol V (deterministic, replay-safe, versioned).
 */

/** Canonical output-field map — source field name → what it means. Only the
 *  fields a given service actually publishes are set. */
export interface ArcgisFieldMap {
  parcelId?: string;
  address?: string;
  county?: string;
  acres?: string;
  lotSqft?: string;
  buildingSqft?: string;
  yearBuilt?: string;
  assessedLand?: string;
  assessedImprovement?: string;
  assessedTotal?: string;
  /** A published full-market value (distinct from assessed) when the source has one. */
  marketValue?: string;
  landUse?: string;
  zoning?: string;
  buildingStyle?: string;
  legal?: string;
}

export interface ArcgisParcelSource {
  /** USPS state code this source covers (statewide unless `county` is set). */
  state: string;
  /** Optional county name when the source is county-scoped, not statewide. */
  county?: string;
  sourceName: string;
  /** Human-facing catalog/landing page for provenance. */
  sourceUrl: string;
  /** The ArcGIS REST layer `/query` endpoint. */
  queryUrl: string;
  /** Field carrying the street NUMBER (for the address WHERE clause). */
  streetNumberField: string;
  /** Field carrying the street NAME. */
  streetNameField: string;
  /** Optional municipality/city field to disambiguate common street names. */
  cityField?: string;
  fields: ArcgisFieldMap;
  /** The assessment-roll vintage the SOURCE itself publishes, when known. Null
   *  means the source states none — which must be said, never faked. */
  assessmentAsOf?: string | null;
  /** Building square footage here is living/structure area (still treated as an
   *  UNVERIFIED estimate downstream, never a measured footprint). */
  buildingSqftIsLotArea?: boolean;
}

/**
 * Verified statewide/government parcel services. Each was confirmed to respond to
 * a public ArcGIS query with the field names below. GROW THIS LIST to expand
 * national coverage — one entry per statewide service (or per county where a
 * state has no statewide layer).
 */
export const ARCGIS_PARCEL_SOURCES: ArcgisParcelSource[] = [
  {
    state: "NY",
    sourceName: "New York State ITS GIS — Statewide Tax Parcel Centroids (ORPTS assessment roll)",
    sourceUrl: "https://gis.ny.gov/parcels",
    queryUrl: "https://gisservices.its.ny.gov/arcgis/rest/services/NYS_Tax_Parcel_Centroid_Points/MapServer/0/query",
    streetNumberField: "LOC_ST_NBR",
    streetNameField: "LOC_STREET",
    cityField: "CITYTOWN_NAME",
    fields: {
      parcelId: "PRINT_KEY",
      address: "PARCEL_ADDR",
      county: "COUNTY_NAME",
      acres: "ACRES",
      lotSqft: "SQ_FT",
      buildingSqft: "SQFT_LIVING",
      yearBuilt: "YR_BLT",
      assessedLand: "LAND_AV",
      assessedTotal: "TOTAL_AV",
      marketValue: "FULL_MARKET_VAL",
      landUse: "PROP_CLASS",
      buildingStyle: "BLDG_STYLE_DESC",
    },
    // Statewide roll is refreshed annually (2024–2025 roll at time of wiring);
    // the service itself does not stamp a per-parcel roll date, so this stays null
    // rather than assert a vintage the source doesn't publish per record.
    assessmentAsOf: null,
  },
];

/** Look up the parcel source(s) for a state (statewide entries first). */
export function parcelSourcesForState(stateCode: string): ArcgisParcelSource[] {
  const st = stateCode.trim().toUpperCase();
  return ARCGIS_PARCEL_SOURCES.filter((s) => s.state.toUpperCase() === st)
    .sort((a, b) => (a.county ? 1 : 0) - (b.county ? 1 : 0));
}

/** Distinct outbound hosts across the registry — consumed by the governed
 *  outbound allowlist so adding a source can't open an ungoverned egress path. */
export const PARCEL_SOURCE_HOSTS: string[] = [
  ...new Set(
    ARCGIS_PARCEL_SOURCES.map((s) => {
      try { return new URL(s.queryUrl).hostname.toLowerCase(); } catch { return ""; }
    }).filter(Boolean),
  ),
];

/** States with governed parcel coverage today (bespoke + registry), for honest
 *  "we don't cover [state] yet" messaging. */
export const COVERED_PARCEL_STATES: string[] = [
  ...new Set(["MD", "DE", ...ARCGIS_PARCEL_SOURCES.map((s) => s.state.toUpperCase())]),
];
