/**
 * Map Source Registry — Build 47 / 47-A
 * Volume III §Map Asset Governance
 * Doctrines: AUTHORITATIVE_MAP_ASSET_INGESTION_V1 · MAP_LAYER_GOVERNANCE_V1
 *
 * Canonical registry of every approved source for U.S. geographic,
 * historical, and environmental data. No source not listed here may be used
 * to generate map assets. No live fetch from these sources may occur during
 * visitor page load.
 *
 * Sources are organized by authority tier:
 *   tier-1-federal  — U.S. federal agency, public domain, highest authority
 *   tier-2-federal  — Federal partnership or derived federal dataset
 *   tier-3-public-domain — Volunteer / NGO, public domain, cartographic quality
 */

export type AuthorityTier = "tier-1-federal" | "tier-2-federal" | "tier-3-public-domain";

export type UpdateFrequency =
  | "annual"
  | "decennial"
  | "continuous"
  | "historical-static"
  | "varies";

export type MapSource = {
  id: string;
  source_name: string;
  source_authority_tier: AuthorityTier;
  base_url: string;
  update_frequency: UpdateFrequency;
  public_domain: boolean;
  license_or_public_domain_note: string;
  data_types: string[];
  historical_capability: boolean;
  notes: string;
};

export type AssetSpec = {
  asset_id: string;
  description: string;
  primary_source_id: string;
  fallback_source_id: string | null;
  output_filename: string;
  required_feature_property: string;
  minimum_valid_feature_count: number;
};

// ── Source Registry ──────────────────────────────────────────────────────────

export const MAP_SOURCES: Record<string, MapSource> = {

  // ── U.S. Census Bureau ────────────────────────────────────────────────────

  census_tiger_rest: {
    id: "census_tiger_rest",
    source_name: "U.S. Census Bureau TIGER Web Services (GeoJSON REST API)",
    source_authority_tier: "tier-1-federal",
    base_url:
      "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer",
    update_frequency: "annual",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: U.S. Census Bureau, TIGER/Line Shapefiles and Cartographic Boundary Files. " +
      "See https://www.census.gov/about/policies/open-gov/copyright-intellectual-property.html",
    data_types: ["state-boundaries", "county-boundaries", "roads", "water"],
    historical_capability: false,
    notes: "Preferred source for current boundaries. Returns GeoJSON directly from Census REST API.",
  },

  census_cartographic: {
    id: "census_cartographic",
    source_name: "U.S. Census Bureau Cartographic Boundary Files (GENZ2023)",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www2.census.gov/geo/tiger/GENZ2023/shp/",
    update_frequency: "annual",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: U.S. Census Bureau Cartographic Boundary Files, 2023. " +
      "See https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html",
    data_types: ["state-boundaries", "county-boundaries", "congressional-districts"],
    historical_capability: false,
    notes:
      "Tier-1 fallback. Shapefiles require format conversion. " +
      "Use census_tiger_rest for direct GeoJSON output.",
  },

  // ── U.S. Geological Survey (USGS) ────────────────────────────────────────

  usgs_national_map: {
    id: "usgs_national_map",
    source_name: "USGS National Map (The National Map TNM)",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www.usgs.gov/programs/national-geospatial-program/national-map",
    update_frequency: "continuous",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: U.S. Geological Survey, National Geospatial Program. " +
      "See https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits",
    data_types: [
      "elevation",
      "hydrography",
      "transportation",
      "land-cover",
      "geographic-names",
      "structures",
    ],
    historical_capability: false,
    notes:
      "Primary source for terrain, hydrography, and infrastructure overlays. " +
      "TNM Download API: https://tnmaccess.nationalmap.gov/api/v1/",
  },

  usgs_htmc: {
    id: "usgs_htmc",
    source_name: "USGS Historical Topographic Map Collection (HTMC)",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www.usgs.gov/programs/national-geospatial-program/historical-topographic-maps-preserving-past",
    update_frequency: "historical-static",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "HTMC contains scanned historical USGS topographic maps from 1882 to 2006. " +
      "See https://ngmdb.usgs.gov/topoview/",
    data_types: ["historical-topographic-maps", "land-use-history", "infrastructure-history"],
    historical_capability: true,
    notes:
      "Primary source for historical map overlays. Contains 180,000+ scanned maps. " +
      "topoView API: https://ngmdb.usgs.gov/topoview/ " +
      "Coverage: 1882–2006, organized by decade and region.",
  },

  usgs_gnis: {
    id: "usgs_gnis",
    source_name: "USGS Geographic Names Information System (GNIS)",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www.usgs.gov/tools/geographic-names-information-system-gnis",
    update_frequency: "continuous",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "GNIS is the official repository of domestic geographic names data. " +
      "See https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits",
    data_types: ["geographic-names", "place-names", "feature-types", "coordinates"],
    historical_capability: true,
    notes:
      "Used for authoritative place name verification and historical name lookup. " +
      "Query API: https://geonames.usgs.gov/apex/f?p=138:1",
  },

  // ── USDA ─────────────────────────────────────────────────────────────────

  usda_nrcs: {
    id: "usda_nrcs",
    source_name: "USDA Natural Resources Conservation Service (NRCS) — Web Soil Survey",
    source_authority_tier: "tier-1-federal",
    base_url: "https://websoilsurvey.nrcs.usda.gov/",
    update_frequency: "continuous",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: USDA Natural Resources Conservation Service. " +
      "See https://www.nrcs.usda.gov/about/policies-and-links/non-discrimination-statement",
    data_types: ["soils", "land-capability", "conservation-programs", "agricultural-history"],
    historical_capability: true,
    notes:
      "Primary source for soil classification, agricultural suitability, and conservation history. " +
      "Soil Survey Geographic Database (SSURGO) available for download.",
  },

  usda_fsa: {
    id: "usda_fsa",
    source_name: "USDA Farm Service Agency (FSA) — Common Land Unit (CLU)",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/index",
    update_frequency: "annual",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: USDA Farm Service Agency. " +
      "NAIP imagery is unrestricted public domain.",
    data_types: ["aerial-imagery", "agricultural-fields", "cropland-data-layer", "farm-tracts"],
    historical_capability: true,
    notes:
      "NAIP aerial imagery provides year-over-year agricultural land use documentation. " +
      "Cropland Data Layer (CDL) tracks crop type by year back to 1997.",
  },

  // ── Bureau of Land Management ─────────────────────────────────────────────

  blm_glro: {
    id: "blm_glro",
    source_name: "Bureau of Land Management (BLM) — General Land Records Office",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www.blm.gov/programs/lands-and-realty/land-records",
    update_frequency: "varies",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: Bureau of Land Management, General Land Records Office. " +
      "Historical survey plats and field notes from original public land surveys are public domain.",
    data_types: [
      "public-land-survey",
      "cadastral-survey",
      "land-patents",
      "historical-surveys",
      "public-lands",
    ],
    historical_capability: true,
    notes:
      "GLO Records include original land patents and historical survey plats back to the 1780s. " +
      "BLM GeoCommunicator API provides cadastral survey spatial data. " +
      "Essential for historical land ownership and original settlement pattern research.",
  },

  blm_national_surface: {
    id: "blm_national_surface",
    source_name: "BLM National Surface Management Agency Area Polygons",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www.blm.gov/about/data/gis-data-resources",
    update_frequency: "continuous",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required.",
    data_types: ["public-lands", "land-ownership", "conservation-areas", "grazing-districts"],
    historical_capability: false,
    notes: "Current surface management boundaries for federal lands. Used for opportunity overlays.",
  },

  // ── NOAA ─────────────────────────────────────────────────────────────────

  noaa_climate: {
    id: "noaa_climate",
    source_name: "NOAA National Centers for Environmental Information (NCEI)",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www.ncei.noaa.gov/",
    update_frequency: "continuous",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: National Oceanic and Atmospheric Administration, NCEI. " +
      "See https://www.ncei.noaa.gov/pub/data/license/",
    data_types: [
      "climate-normals",
      "historical-weather",
      "flood-history",
      "drought-history",
      "weather-patterns",
    ],
    historical_capability: true,
    notes:
      "Historical climate data from 1895 onward. Essential for watershed history, " +
      "flood risk context, and agricultural climate patterns.",
  },

  noaa_coast: {
    id: "noaa_coast",
    source_name: "NOAA Office for Coastal Management — Digital Coast",
    source_authority_tier: "tier-1-federal",
    base_url: "https://coast.noaa.gov/digitalcoast/",
    update_frequency: "continuous",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: NOAA Office for Coastal Management.",
    data_types: ["coastal-shorelines", "land-cover-change", "sea-level-change", "wetlands"],
    historical_capability: true,
    notes: "Historical coastal and watershed boundary change data. Used for conservation history layers.",
  },

  // ── National Park Service ─────────────────────────────────────────────────

  nps_boundaries: {
    id: "nps_boundaries",
    source_name: "National Park Service — NPS Lands Administrative Boundaries",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www.nps.gov/gis/",
    update_frequency: "annual",
    public_domain: true,
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: National Park Service, Land Resources Division. " +
      "See https://irma.nps.gov/DataStore/Reference/Profile/2224545",
    data_types: [
      "national-parks",
      "protected-lands",
      "wilderness-areas",
      "historic-sites",
      "conservation-boundaries",
    ],
    historical_capability: true,
    notes:
      "NPS Lands dataset includes designation dates, enabling historical conservation timeline. " +
      "Used for conservation history and stewardship opportunity overlays.",
  },

  // ── Natural Earth (public domain fallback) ────────────────────────────────

  natural_earth: {
    id: "natural_earth",
    source_name: "Natural Earth (admin-1-states-provinces)",
    source_authority_tier: "tier-3-public-domain",
    base_url: "https://www.naturalearthdata.com/",
    update_frequency: "varies",
    public_domain: true,
    license_or_public_domain_note:
      "Public domain. No license required. " +
      "Natural Earth data is built by volunteers and licensed into the public domain. " +
      "See https://www.naturalearthdata.com/about/terms-of-use/",
    data_types: ["state-boundaries", "country-boundaries", "coastlines", "rivers"],
    historical_capability: false,
    notes:
      "Acceptable public-domain cartographic fallback. Use only when Census sources unavailable. " +
      "Do not use as primary source when Census data is accessible.",
  },
};

// ── Asset Specifications ─────────────────────────────────────────────────────

export const ASSET_SPECS: Record<string, AssetSpec> = {
  us_states: {
    asset_id: "us_states",
    description: "U.S. state boundaries (50 states + DC)",
    primary_source_id: "census_tiger_rest",
    fallback_source_id: "natural_earth",
    output_filename: "us-states.geojson",
    required_feature_property: "NAME",
    minimum_valid_feature_count: 50,
  },
  us_counties: {
    asset_id: "us_counties",
    description: "U.S. county boundaries for featured explorations",
    primary_source_id: "census_tiger_rest",
    fallback_source_id: null,
    output_filename: "us-counties.geojson",
    required_feature_property: "NAME",
    minimum_valid_feature_count: 1,
  },
};

// ── Census TIGER Query URLs ───────────────────────────────────────────────────

export const CENSUS_TIGER_STATES_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/12/query" +
  "?where=1%3D1" +
  "&outFields=NAME%2CSTUSAB%2CGEOID%2CSTATE" +
  "&geometryPrecision=4" +
  "&f=geojson" +
  "&resultRecordCount=60";

export function censusTigerCountyUrl(stateFips: string, countyName: string): string {
  const where = encodeURIComponent(
    `STATE='${stateFips}' AND NAME='${countyName}'`
  );
  return (
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/13/query" +
    `?where=${where}` +
    "&outFields=NAME%2CGEOID%2CSTATE%2CCOUNTY" +
    "&geometryPrecision=4" +
    "&f=geojson" +
    "&resultRecordCount=5"
  );
}

// ── Featured County Queries ───────────────────────────────────────────────────
// All counties referenced by CURATED_EXPLORATION_STORIES must be listed here.
// When adding a new story with a new county, add its entry here and re-run
// `npm run ingest:map-assets` followed by `npm run verify:map-assets`.

export const FEATURED_COUNTY_QUERIES: Array<{
  state: string;
  stateFips: string;
  county: string;
}> = [
  // Modern opportunity stories (Build 47)
  { state: "Tennessee",      stateFips: "47", county: "Maury County" },
  { state: "Iowa",           stateFips: "19", county: "Story County" },
  { state: "Pennsylvania",   stateFips: "42", county: "Lancaster County" },
  { state: "Missouri",       stateFips: "29", county: "Boone County" },
  { state: "North Carolina", stateFips: "37", county: "Catawba County" },
  // Historical discovery stories (Build 47-A)
  { state: "Illinois",       stateFips: "17", county: "McLean County" },
  { state: "Kansas",         stateFips: "20", county: "Harvey County" },
  { state: "Oregon",         stateFips: "41", county: "Linn County" },
];
