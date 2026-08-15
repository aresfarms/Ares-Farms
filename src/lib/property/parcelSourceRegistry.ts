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
  /** Field carrying the street NUMBER (for the address WHERE clause). Used with
   *  streetNameField when the source splits address into number + name (e.g. NY). */
  streetNumberField?: string;
  /** Field carrying the street NAME. */
  streetNameField?: string;
  /** A SINGLE combined address-string field (E911 / site-location, e.g. VT, CT),
   *  used instead of the number+name pair. WHERE becomes:
   *  UPPER(field) LIKE '<num> %' AND UPPER(field) LIKE '%<name>%'. */
  addressMatchField?: string;
  /** Optional municipality/city/town field to disambiguate common street names. */
  cityField?: string;
  fields: ArcgisFieldMap;
  /** How to find the parcel:
   *  - "address" (default): WHERE on the address field(s) above.
   *  - "point": geocode the address (Census), then an INDEXED spatial point query
   *    — for huge layers where a text scan times out (e.g. FL, 10.8M parcels), or
   *    geometry-only layers with no address field (join the values via assessJoin). */
  queryMode?: "address" | "point";
  /** Point mode only: buffer (meters) to catch a nearby CENTROID on a point-
   *  geometry layer. Polygon layers intersect the point directly (omit / 0). */
  pointBufferMeters?: number;
  /** Optional related assessor TABLE joined on a shared parcel key (e.g. MassGIS
   *  L3: a geometry parcel layer + an ASSESS table joined on LOC_ID). When set, the
   *  resolver looks up this table after finding the parcel and its fields take
   *  precedence for the canonical values. */
  assessJoin?: {
    /** The assessor table's `/query` endpoint. */
    tableUrl: string;
    /** Key field on the PARCEL layer. */
    parcelKeyField: string;
    /** Matching key field on the assessor TABLE. */
    tableKeyField: string;
    /** Assessor-table field map (address, values, acres, year built, …). */
    fields: ArcgisFieldMap;
  };
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
  {
    state: "VT",
    sourceName: "Vermont Center for Geographic Information (VCGI) — Statewide Parcels + Grand List",
    sourceUrl: "https://vcgi.vermont.gov/data-and-programs/parcel-program",
    queryUrl: "https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/FS_VCGI_VTPARCELS_WM_NOCACHE_v2/FeatureServer/1/query",
    addressMatchField: "E911ADDR",
    cityField: "TNAME",
    fields: {
      parcelId: "SPAN",
      address: "E911ADDR",
      acres: "ACRESGL",
      assessedLand: "LAND_LV",
      assessedImprovement: "IMPRV_LV",
      assessedTotal: "REAL_FLV",
      landUse: "DESCPROP",
    },
    assessmentAsOf: null,
  },
  {
    state: "CT",
    sourceName: "Connecticut (CT OPM/CTMaps) — Statewide CAMA & Parcel Layer 2024",
    sourceUrl: "https://geodata.ct.gov/maps/ctmaps::connecticut-cama-and-parcel-layer",
    queryUrl: "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/Connecticut_CAMA_and_Parcel_Layer_2024/FeatureServer/0/query",
    addressMatchField: "Location_1",
    cityField: "Property_City",
    fields: {
      parcelId: "Parcel_ID",
      address: "Location_1",
      acres: "Land_Acres",
      buildingSqft: "Living_Area",
      yearBuilt: "ayb",
      assessedLand: "Assessed_Land",
      assessedImprovement: "Assessed_Building",
      assessedTotal: "Assessed_Total",
      landUse: "State_Use_Description",
    },
    assessmentAsOf: "2024 grand list",
  },
  {
    state: "NJ",
    sourceName: "New Jersey NJGIN — Statewide Parcels + MOD-IV assessment composite",
    sourceUrl: "https://nj.gov/njgin/edata/parcels/",
    queryUrl: "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_Composite_NJ_WM/FeatureServer/0/query",
    addressMatchField: "PROP_LOC",
    cityField: "MUN_NAME",
    fields: {
      parcelId: "PAMS_PIN",
      address: "PROP_LOC",
      acres: "CALC_ACRE",
      yearBuilt: "YR_CONSTR",
      assessedLand: "LAND_VAL",
      assessedImprovement: "IMPRVT_VAL",
      assessedTotal: "NET_VALUE",
      landUse: "PROP_USE",
      buildingStyle: "BLDG_DESC",
    },
    assessmentAsOf: null,
  },
  {
    // FL is 10.8M parcels — an address text-scan times out, so we geocode and do
    // an INDEXED spatial point query instead (verified: ~8s, well-formed result).
    state: "FL",
    sourceName: "Florida DOR — Statewide Cadastral (NAL tax roll, 2025)",
    sourceUrl: "https://geodata.floridagio.gov/datasets/FGIO::florida-statewide-parcels",
    queryUrl: "https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query",
    queryMode: "point",
    fields: {
      parcelId: "PARCEL_ID",
      address: "PHY_ADDR1",
      assessedLand: "LND_VAL",
      assessedTotal: "JV", // DOR "just value" (market-value basis)
      buildingSqft: "TOT_LVG_AR",
      yearBuilt: "ACT_YR_BLT",
      lotSqft: "LND_SQFOOT",
    },
    assessmentAsOf: "DOR 2025 roll",
  },
  {
    // MassGIS L3: the standardized ASSESS table carries site address AND values,
    // so it's a direct address query on the table (no geometry/join needed).
    state: "MA",
    sourceName: "MassGIS — Standardized Assessors' Parcels (Level 3 ASSESS)",
    sourceUrl: "https://www.mass.gov/info-details/massgis-data-property-tax-parcels",
    queryUrl: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/MassachusettsPropertyTaxParcels/FeatureServer/4/query",
    addressMatchField: "SITE_ADDR",
    cityField: "CITY",
    fields: {
      parcelId: "LOC_ID",
      address: "SITE_ADDR",
      assessedLand: "LAND_VAL",
      assessedImprovement: "BLDG_VAL",
      assessedTotal: "TOTAL_VAL",
      buildingSqft: "RES_AREA",
      yearBuilt: "YEAR_BUILT",
      zoning: "ZONING",
    },
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
    ARCGIS_PARCEL_SOURCES.flatMap((s) => {
      const urls = [s.queryUrl, ...(s.assessJoin ? [s.assessJoin.tableUrl] : [])];
      return urls.map((u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ""; } });
    }).filter(Boolean),
  ),
];

/** States with governed parcel coverage today (bespoke + registry), for honest
 *  "we don't cover [state] yet" messaging. */
export const COVERED_PARCEL_STATES: string[] = [
  ...new Set(["MD", "DE", ...ARCGIS_PARCEL_SOURCES.map((s) => s.state.toUpperCase())]),
];
