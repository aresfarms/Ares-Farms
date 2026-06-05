/**
 * Map Source Registry — Build 47
 * Volume III §Map Asset Governance · Doctrine: AUTHORITATIVE_MAP_ASSET_INGESTION_V1
 *
 * Defines the canonical, approved sources for U.S. geographic boundary data.
 * No source not listed here may be used to generate homepage map assets.
 * No live fetch from these sources may occur during visitor page load —
 * all assets must be cached locally in public/maps/ before deployment.
 */

export type AuthorityTier = "tier-1-federal" | "tier-2-federal" | "tier-3-public-domain";

export type MapSource = {
  id: string;
  source_name: string;
  source_authority_tier: AuthorityTier;
  base_url: string;
  license_or_public_domain_note: string;
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

export const MAP_SOURCES: Record<string, MapSource> = {
  census_tiger_rest: {
    id: "census_tiger_rest",
    source_name: "U.S. Census Bureau TIGER Web Services (GeoJSON REST API)",
    source_authority_tier: "tier-1-federal",
    base_url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer",
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: U.S. Census Bureau, TIGER/Line Shapefiles and Cartographic Boundary Files. " +
      "See https://www.census.gov/about/policies/open-gov/copyright-intellectual-property.html",
    notes: "Preferred source. Returns GeoJSON directly from Census TIGER REST API.",
  },
  census_cartographic: {
    id: "census_cartographic",
    source_name: "U.S. Census Bureau Cartographic Boundary Files (GENZ2023)",
    source_authority_tier: "tier-1-federal",
    base_url: "https://www2.census.gov/geo/tiger/GENZ2023/shp/",
    license_or_public_domain_note:
      "U.S. federal government data in the public domain. No license required. " +
      "Source: U.S. Census Bureau Cartographic Boundary Files, 2023. " +
      "See https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html",
    notes:
      "Tier-1 fallback. Shapefiles require format conversion. " +
      "Use census_tiger_rest for direct GeoJSON output.",
  },
  natural_earth: {
    id: "natural_earth",
    source_name: "Natural Earth (admin-1-states-provinces)",
    source_authority_tier: "tier-3-public-domain",
    base_url: "https://www.naturalearthdata.com/",
    license_or_public_domain_note:
      "Public domain. No license required. " +
      "Natural Earth data is built by volunteers and licensed into the public domain. " +
      "See https://www.naturalearthdata.com/about/terms-of-use/",
    notes:
      "Acceptable public-domain cartographic fallback. Use only when Census sources unavailable.",
  },
};

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

export const FEATURED_COUNTY_QUERIES: Array<{
  state: string;
  stateFips: string;
  county: string;
}> = [
  { state: "Tennessee", stateFips: "47", county: "Maury County" },
  { state: "Iowa", stateFips: "19", county: "Story County" },
  { state: "Pennsylvania", stateFips: "42", county: "Lancaster County" },
  { state: "Missouri", stateFips: "29", county: "Boone County" },
  { state: "North Carolina", stateFips: "37", county: "Catawba County" },
];
