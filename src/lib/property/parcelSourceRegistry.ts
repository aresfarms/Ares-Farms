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
  /** Human label for what this source ACTUALLY covers, used verbatim in
   *  customer-facing coverage disclosure. Set it whenever `${county} County`
   *  would overstate or misname the real extent — a single city inside a
   *  larger county, an Alaska borough, a Louisiana parish, an independent
   *  city, or a multi-county region. */
  coverageArea?: string;
  /** Set "partial" on a source with NO `county` that is nevertheless not
   *  truly statewide — a regional compilation, or a state-published layer
   *  whose own publisher documents missing counties. Without this, a
   *  county-less source is reported as full statewide coverage. */
  coverageScope?: "statewide" | "partial";
  sourceName: string;
  /** Human-facing catalog/landing page for provenance. */
  sourceUrl: string;
  /** The ArcGIS REST layer `/query` endpoint. */
  queryUrl: string;
  /** Field carrying the street NUMBER (for the address WHERE clause). Used with
   *  streetNameField when the source splits address into number + name (e.g. NY). */
  streetNumberField?: string;
  /** streetNumberField's actual ArcGIS field type. Matters because the WHERE
   *  clause quotes the number as a string literal by default (works on NY's
   *  and Arkansas's text-typed number fields) — set "numeric" when the
   *  source's field is a genuine integer/double (confirmed on Hennepin
   *  County, MN's HOUSE_NO: a quoted literal against that field errors with
   *  HTTP 400, unquoted succeeds). Defaults to "text". */
  streetNumberFieldType?: "text" | "numeric";
  /** Field carrying the street NAME. */
  streetNameField?: string;
  /** A SINGLE combined address-string field (E911 / site-location, e.g. VT, CT),
   *  used instead of the number+name pair. WHERE becomes:
   *  UPPER(field) LIKE '<num> %' AND UPPER(field) LIKE '%<name>%'. */
  addressMatchField?: string;
  /** Some sources store addressMatchField as "STREET NAME, NUMBER" instead of
   *  the usual "NUMBER STREET NAME" (confirmed on Tennessee's statewide
   *  layer, e.g. "DUNCAN LN 419") — set "trailing" so the WHERE clause
   *  matches the number at the END of the field instead of the start.
   *  Defaults to "leading" (the standard US order). */
  addressNumberPosition?: "leading" | "trailing";
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
  /** Point mode only: use this jurisdiction's own address-point (NG911/E911)
   *  layer for precise rooftop coordinates instead of the Census geocoder's
   *  street-interpolated estimate. Matters for parcel layers with no address
   *  field at all (e.g. a cadastral/PLSS layer) — Census interpolation can
   *  land just outside the correct polygon; a rooftop-precise address point
   *  intersects it directly. Falls back to Census geocoding if no match. */
  addressPointsSource?: {
    /** The address-point layer's `/query` endpoint. */
    queryUrl: string;
    /** Single combined address-string field on the address-point layer. */
    addressMatchField: string;
    /** Latitude/longitude field names on the address-point layer (already
     *  WGS84 decimal degrees — no reprojection performed). */
    latField: string;
    lonField: string;
  };
  /** Some parcel layers carry NO usable address field at all, but the
   *  jurisdiction publishes a separate address → parcel-key CROSSWALK. Look
   *  the key up by address there first, then fetch the parcel by that key.
   *  This is the REVERSE direction from assessJoin below (which finds the
   *  parcel first, then joins values onto it).
   *
   *  Confirmed on Fairbanks North Star Borough, AK: the taxroll parcel layer
   *  publishes only the OWNER's mailing address (not the property's own
   *  location), while a separate `address_pan` layer maps street address →
   *  PAN parcel number. Strictly better than a spatial guess here — a
   *  Census-geocoded point on this same layer landed on a road
   *  right-of-way parcel (PAN 9999999, all values null), not the home. */
  addressKeyJoin?: {
    /** The address→key crosswalk layer's `/query` endpoint. */
    queryUrl: string;
    /** Combined address-string field on the crosswalk layer. */
    addressMatchField: string;
    /** The parcel-key field on the CROSSWALK layer. */
    keyField: string;
    /** The matching key field on the PARCEL layer. */
    parcelKeyField: string;
    /** Whether parcelKeyField is a genuine numeric type (unquoted in the
     *  WHERE clause) or text. Same quoting concern as
     *  streetNumberFieldType. Defaults to "text". */
    parcelKeyFieldType?: "text" | "numeric";
    /** Optional: keep only this many LEADING characters of the crosswalk's
     *  key before matching the parcel layer, for jurisdictions that publish
     *  the same parcel key at two different precisions.
     *
     *  Confirmed on Maui County, HI: the address-point layer publishes a
     *  12-digit TMK while the parcel layer's cty_tmk is that same parcel's
     *  first 8 digits (the trailing 4 encode a unit/CPR suffix). Verified
     *  systematic across 6 sampled addresses, each resolving to a distinct
     *  parcel with distinct values — not a coincidental single match. */
    keyTruncateLength?: number;
  };
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
  /** Override the per-query timeout for a source that is reliably slow.
   *  Default is 12s. New York's statewide layer measured 6.9-13.4s on
   *  consecutive identical queries, so the default silently dropped real
   *  lookups. Raise this only with a measurement, not a guess. */
  queryTimeoutMs?: number;
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
    // Measured 6.9s / 8.4s / 13.4s on identical consecutive queries.
    queryTimeoutMs: 25_000,
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
  // Delaware, county-by-county to complete the state (Sussex is a bespoke
  // resolver; these finish New Castle + Kent — founder direction 2026-08-15).
  {
    state: "DE",
    county: "New Castle",
    sourceName: "New Castle County, Delaware — Parcels + Assessment",
    sourceUrl: "https://apps-nccde.hub.arcgis.com/",
    queryUrl: "https://services.arcgis.com/G4S1dGvn7PIgYd6Y/arcgis/rest/services/Parcels_owners/FeatureServer/0/query",
    addressMatchField: "LOC_ADDRESS",
    fields: {
      parcelId: "PIN_COMMON",
      address: "LOC_ADDRESS",
      acres: "ACRE_PLAN_TOT",
      assessedLand: "LOT_ASSESS",
      assessedImprovement: "PROP_ASSESS",
      assessedTotal: "TOT_ASSESS",
    },
    assessmentAsOf: null,
  },
  // ── Metro-county entries for states with no clean public statewide layer
  // (founder direction 2026-08-15: biggest counties first). ──────────────────
  {
    state: "GA",
    county: "Fulton",
    sourceName: "Fulton County, Georgia (Atlanta) — Tax Parcels + CAMA appraised value",
    sourceUrl: "https://gisdata.fultoncountyga.gov/",
    queryUrl: "https://gismaps.fultoncountyga.gov/arcgispub2/rest/services/PropertyMapViewer/PropertyMapViewer/MapServer/11/query",
    addressMatchField: "Address",
    fields: {
      parcelId: "ParcelID",
      address: "Address",
      acres: "LandAcres",
      assessedLand: "LandAppr",
      assessedImprovement: "ImprAppr",
      assessedTotal: "TotAppr", // Georgia FAIR MARKET (appraised) value
    },
    assessmentAsOf: null,
  },
  {
    state: "PA",
    county: "Philadelphia",
    sourceName: "City of Philadelphia OPA — Property Assessments (market value)",
    sourceUrl: "https://opendataphilly.org/datasets/opa-properties-public/",
    queryUrl: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/OPA_Properties_Public/FeatureServer/0/query",
    addressMatchField: "location",
    fields: {
      parcelId: "parcel_number",
      address: "location",
      assessedTotal: "market_value",
      yearBuilt: "year_built",
      landUse: "category_code_description",
    },
    assessmentAsOf: null,
  },
  {
    // Supersedes the earlier Wake-County-only entry: NC OneMap (the state GIS
    // consortium) compiles ALL 100 counties into one layer (verified: 7712 Bill
    // Love Rd, Wake -> $619,967 total assessed, 4.81 ac).
    state: "NC",
    sourceName: "NC OneMap — Statewide Parcels (all 100 counties, county-sourced CAMA)",
    sourceUrl: "https://www.nconemap.gov/pages/parcels",
    queryUrl: "https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/MapServer/1/query",
    addressMatchField: "siteadd",
    cityField: "scity",
    fields: {
      parcelId: "parno",
      address: "siteadd",
      county: "cntyname",
      acres: "gisacres",
      assessedLand: "landval",
      assessedImprovement: "improvval",
      assessedTotal: "parval",
      landUse: "parusedesc",
      legal: "legdecfull",
    },
    assessmentAsOf: null,
  },
  {
    state: "CO",
    sourceName: "Colorado OIT — Statewide Public Parcels (county appraised values)",
    sourceUrl: "https://geodata.colorado.gov/datasets/colorado-public-parcels",
    queryUrl: "https://gis.colorado.gov/public/rest/services/Address_and_Parcel/Colorado_Public_Parcels/FeatureServer/0/query",
    addressMatchField: "situsAdd",
    cityField: "sitAddCty",
    fields: {
      parcelId: "parcel_id",
      address: "situsAdd",
      acres: "landAcres",
      assessedTotal: "apprValTot", // county APPRAISED (actual/market) value
      landUse: "landUseDsc",
      zoning: "zoningDesc",
    },
    assessmentAsOf: null,
  },
  {
    // Full statewide CAMA — Wisconsin DOA compiles ALL counties into one layer
    // with real assessed values (verified: Dane County, 9572 Overland Rd ->
    // $650,700 total assessed, 2025 tax roll).
    state: "WI",
    sourceName: "Wisconsin Department of Administration — Statewide Parcels (V1200, CAMA-joined)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=2386813b23ea4e51a009f7d1d6b76e02",
    queryUrl: "https://services3.arcgis.com/n6uYoouQZW75n5WI/arcgis/rest/services/Wisconsin_Statewide_Parcels_DB/FeatureServer/0/query",
    addressMatchField: "SITEADRESS",
    cityField: "PLACENAME",
    fields: {
      parcelId: "PARCELID",
      address: "SITEADRESS",
      county: "CONAME",
      acres: "DEEDACRES",
      assessedLand: "LNDVALUE",
      assessedImprovement: "IMPVALUE",
      assessedTotal: "CNTASSDVALUE",
      marketValue: "ESTFMKVALUE",
      landUse: "PROPCLASS",
    },
    assessmentAsOf: null,
  },
  {
    // Full statewide CAMA (verified: 1245 N 15th Ave, Broken Bow, Custer
    // County -> $916,850 total assessed).
    state: "NE",
    sourceName: "Nebraska Dept of Revenue / gis.ne.gov — Statewide Parcels (CAMA-joined)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=ba7dda0642cd4c0c9660a35081fee517",
    queryUrl: "https://gis.ne.gov/Enterprise/rest/services/StatewideParcelsExternal/FeatureServer/0/query",
    addressMatchField: "Ph_Full_Address",
    cityField: "Ph_City",
    fields: {
      parcelId: "Parcel_ID",
      address: "Ph_Full_Address",
      acres: "Acres_Deeded",
      assessedLand: "Land_Value",
      assessedImprovement: "Improvements_Value",
      assessedTotal: "Total_Assessed_Value",
      yearBuilt: "BuildingYear",
      buildingSqft: "ImpSF",
      zoning: "Zoning",
      landUse: "Classification_Code",
      legal: "Legal_Description",
    },
    // County_ID on this source is a numeric county code, not a name — omitted
    // from fields.county rather than surface a code as if it were a name.
    assessmentAsOf: null,
  },
  {
    // Full statewide values (verified live: King County parcel, $111,100+
    // land value; many parcels lack a site address — vacant/unaddressed
    // land — resolver returns null address rather than fabricate one).
    state: "WA",
    sourceName: "Washington State Dept of Revenue — Statewide Parcels (county-sourced CAMA)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=2b603a599a0842a3b2284c04c8927f35",
    queryUrl: "https://services.arcgis.com/jsIt88o09Q0r1j8h/arcgis/rest/services/Current_Parcels/FeatureServer/0/query",
    addressMatchField: "SITUS_ADDRESS",
    cityField: "SITUS_CITY_NM",
    fields: {
      parcelId: "PARCEL_ID_NR",
      address: "SITUS_ADDRESS",
      assessedLand: "VALUE_LAND",
      assessedImprovement: "VALUE_BLDG",
      landUse: "LANDUSE_CD",
    },
    // COUNTY_NM on this source is a numeric code, not a name — omitted from
    // fields.county rather than surface a code as if it were a name.
    assessmentAsOf: null,
  },
  {
    // Full statewide CAMA (verified: parcel RP04S16E350T09, Lincoln County ->
    // 111.58 ac, $306,230 total assessed).
    state: "ID",
    sourceName: "Idaho State Tax Commission / INSIDE Idaho — Public Idaho Parcels (statewide CAMA)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=65a3f7c6d4ca404ba6ab677913953b35",
    queryUrl: "https://services1.arcgis.com/CNPdEkvnGl65jCX8/arcgis/rest/services/Public_Idaho_Parcels_/FeatureServer/0/query",
    addressMatchField: "SITE_ADD",
    cityField: "SITE_CITY",
    fields: {
      parcelId: "PARCEL_ID",
      address: "SITE_ADD",
      county: "County",
      acres: "ASR_ACRES",
      assessedLand: "VAL_LAND",
      assessedImprovement: "VAL_IMPVTS",
      assessedTotal: "VAL_TOTAL",
      legal: "LGL_DESCR",
    },
    assessmentAsOf: null,
  },
  {
    // Full statewide CAMA, hosted on the state's own gis.arkansas.gov domain
    // (verified: 19 Oak Forest Loop, Maumelle, Pulaski County -> $150,870
    // total assessed).
    state: "AR",
    sourceName: "Arkansas GIS Office — County Assessor Mapping Program (CAMP), statewide parcels",
    sourceUrl: "https://gis.arkansas.gov/product/parcel-boundaries/",
    queryUrl: "https://gis.arkansas.gov/arcgis/rest/services/FEATURESERVICES/Planning_Cadastre/FeatureServer/6/query",
    // adrnum is typed as an integer on this service; a quoted-string number
    // match (streetNumberField) silently returns zero rows on this backend,
    // so match on the single pre-built text label instead (verified fix).
    addressMatchField: "adrlabel",
    cityField: "adrcity",
    fields: {
      parcelId: "parcelid",
      address: "adrlabel",
      county: "county",
      assessedLand: "landvalue",
      assessedImprovement: "impvalue",
      assessedTotal: "totalvalue",
      legal: "parcellgl",
    },
    assessmentAsOf: null,
  },
  {
    // Full statewide CAMA with farm-specific acreage breakdowns (irrigated,
    // grazing, crop, forest) — strong fit for Furlong's land focus. Verified:
    // Bozeman-area parcel, Gallatin County, 40 ac, $2,430 assessed.
    state: "MT",
    sourceName: "Montana State Library / Dept of Revenue — Montana Cadastral Framework (statewide CAMA)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=f161a98b347b4cf29d371a6d7697912a",
    queryUrl: "https://services.arcgis.com/qnjIrwR8z5Izc0ij/arcgis/rest/services/Montana_Cadastral_Framework/FeatureServer/1/query",
    addressMatchField: "AddressLine1",
    cityField: "CountyName",
    fields: {
      parcelId: "PARCELID",
      address: "AddressLine1",
      county: "CountyName",
      acres: "TotalAcres",
      assessedLand: "TotalLandValue",
      assessedImprovement: "TotalBuildingValue",
      assessedTotal: "TotalValue",
      legal: "LegalDescriptionShort",
    },
    assessmentAsOf: null,
  },
  {
    // Full statewide CAMA (verified: 3110 MacCorkle Ave SE, Charleston,
    // Kanawha County -> $38,800 total appraisal).
    state: "WV",
    sourceName: "WV GIS Technical Center (WVU) — Statewide Tax Parcel Info (CAMA-joined)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=ac91069462b24c50b54612ed70c5435c",
    queryUrl: "https://services9.arcgis.com/oBiZycLxRnTJhJER/arcgis/rest/services/WVU_TaxParcel_Info_WVGISTC_2021/FeatureServer/81/query",
    addressMatchField: "SAMSAddress",
    cityField: "SAMSCity",
    fields: {
      parcelId: "ParcelID",
      address: "SAMSAddress",
      county: "CountyName",
      acres: "DeededAcres",
      assessedLand: "LandAppraisal",
      assessedImprovement: "BuildingAppraisal",
      assessedTotal: "TotalAppraisal",
      yearBuilt: "YearBuilt",
      buildingSqft: "StructureArea",
      landUse: "PropertyClassDescription",
      legal: "FullLegalDescription",
    },
    assessmentAsOf: null,
  },
  {
    // Full statewide CAMA with cultivated/uncultivated acreage split (good
    // fit for farmland). Verified: Old Canton Rd, Jackson, Hinds County ->
    // $120,480 assessed.
    state: "MS",
    sourceName: "Mississippi statewide parcel compilation (county-sourced CAMA)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=399921dbc1e646b49ab7b7b7cd26c80e",
    queryUrl: "https://gis.waggonereng.com/server/rest/services/Hosted/Mississippi_Parcels_Staewide/FeatureServer/3/query",
    addressMatchField: "siteadd",
    cityField: "scity",
    fields: {
      parcelId: "parno",
      address: "siteadd",
      county: "cntyname",
      acres: "total_ac",
      assessedLand: "landval",
      assessedTotal: "totval",
      zoning: "zoning",
      legal: "legldesc",
    },
    assessmentAsOf: null,
  },
  {
    // Metro-county entry (no clean LA statewide layer). Verified: 18815 E
    // Arcadian Shores Dr, EBR Parish -> $61,562 assessed.
    state: "LA",
    county: "East Baton Rouge",
    sourceName: "East Baton Rouge Parish GIS — Tax Parcel (CAMA)",
    coverageArea: "East Baton Rouge Parish",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=b961ea0510d04a2b86fa0ca55a79e8a7",
    queryUrl: "https://maps.brla.gov/gis/rest/services/Cadastral/Tax_Parcel/MapServer/0/query",
    addressMatchField: "PHYSICAL_ADDRESS",
    fields: {
      parcelId: "ASSESSMENT_NUM",
      address: "PHYSICAL_ADDRESS",
      assessedLand: "SUM_LAND_VALUE",
      assessedImprovement: "SUM_IMPROVEMENT_VALUE",
      assessedTotal: "SUM_ASSESSED_VALUE",
      marketValue: "SUM_FAIR_MARKET_VALUE",
      legal: "LEGAL_DESCRIPTION",
    },
    assessmentAsOf: null,
  },
  {
    // NM's Office of the State Engineer hosts ALL 33 NM counties as
    // separate layers on ONE service (County_Parcels_2026) — real
    // structural coverage for the whole state, not just a lead. Bernalillo
    // (Albuquerque, NM's dominant metro) wired in here; the other 32
    // counties share this exact schema/host, just a different layer index —
    // a cheap, high-value follow-up for full NM coverage. No dollar values
    // on this layer (LocalCamaId/StateCamaId fields suggest values live in a
    // separate, unpublished CAMA table this service doesn't expose).
    // Verified: 1209 Scotty Ct SW, Albuquerque -> 0.2497 ac.
    state: "NM",
    county: "Bernalillo",
    sourceName: "New Mexico OSE — Bernalillo County Parcels (Albuquerque, boundary + acreage, no values)",
    sourceUrl: "https://gis.ose.nm.gov/server_s/rest/services/Parcels/County_Parcels_2026/MapServer/0",
    queryUrl: "https://gis.ose.nm.gov/server_s/rest/services/Parcels/County_Parcels_2026/MapServer/0/query",
    addressMatchField: "SitusAddressAll",
    cityField: "SitusCity",
    fields: {
      parcelId: "UPC",
      address: "SitusAddressAll",
      acres: "LandArea",
      landUse: "LandUseDescription",
      legal: "LegalDescription",
    },
    assessmentAsOf: null,
  },
  {
    // Metro-county entry (no clean NM statewide layer; Doña Ana is NM's
    // 2nd-largest county). Verified: 701 Two Counties Rd, Garfield ->
    // $82,327 total assessed.
    state: "NM",
    county: "Doña Ana",
    sourceName: "Doña Ana County, New Mexico — Assessed Parcels (CAMA)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=0bc04c9f958e47c0bc3096cd1b32828c",
    queryUrl: "https://services7.arcgis.com/JMIoqakAkedEx0oU/arcgis/rest/services/DAC_Parcels/FeatureServer/0/query",
    addressMatchField: "SITUSADDRS",
    cityField: "CITY",
    fields: {
      parcelId: "PARCELNUMBER",
      address: "SITUSADDRS",
      acres: "TOTALACRES",
      assessedLand: "LANDVALUE",
      assessedImprovement: "BLDGVALUE",
      // No assessedTotal / yearBuilt: this layer publishes neither. It was
      // previously mapped to TOTALVALUE and RES_YEAR_BUILT, which DO NOT
      // EXIST on the service — and because every mapped field goes into
      // outFields, that made the whole query 400 and the source return null
      // for every address. The resolver derives the total from land +
      // improvement, so nothing is lost by dropping it.
      lotSqft: "TOTALSQFT",
    },
    assessmentAsOf: null,
  },
  {
    // Metro-county entry (no clean WY statewide layer; Laramie is WY's
    // most-populous county, Cheyenne). totallandv/totalimpsv are the
    // full-value components; Wyoming's separate ratio-discounted tax-billing
    // figure (assessedv, ~9.5% of value) is intentionally NOT used here to
    // avoid understating value — assessedTotal is left null so the resolver
    // sums land+improvement instead (verified: Road 206, Buford -> 106.35 ac,
    // $117,516 land value).
    state: "WY",
    county: "Laramie",
    sourceName: "Laramie County, Wyoming (Cheyenne) — Assessor Parcels",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=d051f2ef8f7141cf8cd049a521c02b06",
    queryUrl: "https://maps.laramiecounty.com/arcgis/rest/services/features/CountyBaseMapFeatures/MapServer/2/query",
    streetNumberField: "streetno",
    streetNameField: "streetname",
    cityField: "city",
    fields: {
      parcelId: "accountno",
      acres: "netacres",
      assessedLand: "totallandv",
      assessedImprovement: "totalimpsv",
      legal: "legal",
    },
    assessmentAsOf: null,
  },
  {
    // Metro-county entry (no clean SC statewide layer; York is Rock
    // Hill/Charlotte-metro). Apr* fields are market/appraised value; SC's
    // separate ratio-discounted Asd* billing figures are not used here for
    // the same reason as Wyoming above (verified: 5741 Morris Hunt Dr ->
    // $785,400 appraised land+building).
    state: "SC",
    county: "York",
    sourceName: "York County, South Carolina (Rock Hill) — Parcels + Appraisal",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=c27c00901daa4f0484c47a3719a8f03b",
    queryUrl: "https://services1.arcgis.com/2AGLxyiJoNiVHKwq/arcgis/rest/services/Parcels/FeatureServer/0/query",
    addressMatchField: "PropertyAddress",
    fields: {
      parcelId: "TAXMAPID",
      address: "PropertyAddress",
      acres: "deededacres",
      assessedLand: "AprLandVal",
      assessedImprovement: "AprBldgVal",
      assessedTotal: "AprTotVal",
      yearBuilt: "YearBuilt",
      buildingSqft: "FinishedSQFT",
      landUse: "LandUseDesc",
      legal: "LegalDescription",
    },
    assessmentAsOf: null,
  },
  {
    // Metro-county entry (no clean OK statewide layer; Canadian County is
    // OKC-metro). Verified: 21851 E Second St, unincorporated Canadian
    // County -> $2,352 total assessed (rural parcel).
    state: "OK",
    county: "Canadian",
    sourceName: "Canadian County, Oklahoma (OKC metro) — Parcel Data (CAMA)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=7bbc6322290241a891f237dc43ed16bd",
    queryUrl: "https://services2.arcgis.com/0NjdXxmJp53hZWPd/arcgis/rest/services/ParcelDataService_2_view/FeatureServer/3/query",
    addressMatchField: "situs",
    cityField: "situs_city",
    fields: {
      parcelId: "parcel_id",
      address: "situs",
      assessedLand: "land_val",
      assessedImprovement: "bldg_val",
      assessedTotal: "total_val",
      landUse: "prop_class",
      legal: "legal",
    },
    assessmentAsOf: null,
  },
  {
    // Oklahoma County (Oklahoma City itself, not just the metro exurb like
    // Canadian above) — full CAMA. currentmarket used for assessedTotal
    // rather than currentassessed/currenttaxable, which run much lower
    // under OK's assessment ratio — same "don't understate" reasoning as
    // WY/SC/MI/AZ above. Verified: 19325 NE 164th St, Luther -> $345,500
    // market value, 1.53 ac.
    state: "OK",
    county: "Oklahoma",
    sourceName: "Oklahoma County, Oklahoma (OKC) — Assessor Parcels (CAMA)",
    sourceUrl: "https://ok-county-gis-hub-ok-co.hub.arcgis.com/datasets/tax-parcels-public",
    queryUrl: "https://services8.arcgis.com/euhkr1dAJeQBIjV0/arcgis/rest/services/TaxParcelsPublics_view/FeatureServer/0/query",
    addressMatchField: "location",
    cityField: "city",
    fields: {
      parcelId: "pin",
      address: "location",
      acres: "acres",
      assessedLand: "landvalue",
      assessedTotal: "currentmarket",
      legal: "legal",
    },
    assessmentAsOf: null,
  },
  {
    // Multi-county entry: Metro (Portland regional government) compiles
    // Multnomah, Washington, and Clackamas counties into ONE layer — three
    // counties from a single source (verified: 15651 NW Ridgeline St,
    // Portland (Washington Co.) -> $601,280 assessed).
    state: "OR",
    sourceName: "Metro (Portland regional govt) RLIS — Taxlots for Multnomah/Washington/Clackamas Counties",
    coverageScope: "partial",
    coverageArea: "the Portland metro area (Multnomah, Washington and Clackamas Counties)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=b3cabe5845ec47eab61c54e0c631313c",
    queryUrl: "https://services2.arcgis.com/McQ0OlIABe29rJJy/arcgis/rest/services/Taxlots_(Public)/FeatureServer/3/query",
    addressMatchField: "SITEADDR",
    cityField: "SITECITY",
    fields: {
      // COUNTY on this source is a single-letter code (M/W/C), not a name —
      // omitted from fields.county rather than surface a code as a name.
      parcelId: "PRIMACCNUM",
      address: "SITEADDR",
      acres: "A_T_ACRES",
      assessedLand: "LANDVAL",
      assessedImprovement: "BLDGVAL",
      assessedTotal: "ASSESSVAL",
      marketValue: "TOTALVAL",
      yearBuilt: "YEARBUILT",
      buildingSqft: "BLDGSQFT",
      landUse: "LANDUSE",
    },
    assessmentAsOf: null,
  },
  {
    // No address field at all on the parcel layer (a PLSS/plat-based
    // cadastral layer — Lot/Block/Section/Township/Range, not street
    // addressing). Unlocked via addressPointsSource: ND's own statewide
    // NG911 address-point layer gives a rooftop-precise lat/lon (unlike
    // Census's street-interpolated estimate, which this exact layer showed
    // could miss the correct polygon), then a zero-buffer point intersect —
    // this IS a polygon layer, so no buffer is needed once the point itself
    // is accurate. Verified end to end: 301 Broadway St, Logan County ->
    // 159.17 ac. No value fields (ND has no statewide CAMA layer).
    state: "ND",
    sourceName: "North Dakota GIS Hub — Statewide Parcels (boundary + acreage via NG911 address-point join, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=ac6da1176038457db16e8debe3f1abaf",
    queryUrl: "https://services1.arcgis.com/GOcSXpzwBHyk2nog/arcgis/rest/services/NDGISHUB_Parcels/FeatureServer/0/query",
    queryMode: "point",
    addressPointsSource: {
      queryUrl: "https://services1.arcgis.com/GOcSXpzwBHyk2nog/arcgis/rest/services/NDGISHUBSiteStructureAddressPoints/FeatureServer/0/query",
      addressMatchField: "ADDRESS",
      latField: "Lat",
      lonField: "Long",
    },
    fields: {
      parcelId: "UniqueGISID",
      county: "CountyName",
      acres: "CalculatedAcres",
    },
    assessmentAsOf: null,
  },
  // NOT added: Douglas County, KS (gis.dgcoks.gov/Tax_Parcel) has real
  // address/acreage/legal data, but its Cloudflare protection returns a
  // JavaScript challenge page (not a plain 403) after the first flagged
  // request — confirmed it's bot/rate-limit detection, not a fixable query
  // pattern: a follow-up request with a SIMPLER query (single LIKE, no
  // UPPER()) got blocked too, once the IP had been flagged. A server-side
  // integration has no browser to solve that challenge with, so this isn't
  // a "tune the WHERE clause" problem — genuinely out of reach this way.
  {
    // City of Manchester's own GIS (ags.manchesternh.gov) — NH's largest
    // city, full CAMA. Full name searches for "townofmanchester.org" find a
    // DIFFERENT Manchester (a town in Connecticut, already covered
    // statewide) — confirmed this is the correct NH one via the city's own
    // manchesternh.gov domain and MANCHESTER city values in the data.
    // Verified: 130 President Rd -> $292,400 total valuation, built 1975.
    state: "NH",
    county: "Hillsborough",
    sourceName: "City of Manchester, New Hampshire — Assessor Parcels (CAMA)",
    coverageArea: "the City of Manchester",
    sourceUrl: "https://www.manchesternh.gov/Departments/Assessors",
    queryUrl: "https://ags.manchesternh.gov/agsgis7/rest/services/Community/Parcels/MapServer/0/query",
    addressMatchField: "StreetAddress",
    cityField: "City",
    fields: {
      parcelId: "ParcelID",
      address: "StreetAddress",
      lotSqft: "TotalLandAreaSqFt",
      assessedLand: "LandValuation",
      assessedImprovement: "BuildingsImprovementsValuation",
      assessedTotal: "TotalValuation",
      yearBuilt: "YearBuilt",
      buildingSqft: "TotalLivingAreaSqFt",
      landUse: "LandUse",
      buildingStyle: "BuildingStyle",
    },
    assessmentAsOf: null,
  },
  {
    // NRPC (Nashua Regional Planning Commission)-hosted, NH's 2nd-largest
    // city. No acreage or value fields on this layer. Verified: 133 Colgate
    // Rd; fast (though the first live call ran 1.5s, likely cold-start —
    // well under any usable timeout).
    state: "NH",
    county: "Hillsborough",
    sourceName: "Nashua Regional Planning Commission — Nashua Parcels (boundary + address only, no values)",
    coverageArea: "the City of Nashua",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=59ffa3bb9e464c46ba572722e5d3d5b2",
    queryUrl: "https://services6.arcgis.com/2ZriDy2NFXltCIFR/arcgis/rest/services/NRPC_Open_Data_Nashua_v2/FeatureServer/2/query",
    addressMatchField: "LOCATION",
    fields: {
      parcelId: "LAB_PID",
      address: "LOCATION",
    },
    assessmentAsOf: null,
  },
  {
    // City of Detroit (not all of Wayne County) — hosted by Detroit Water &
    // Sewerage Dept for stormwater billing, so it carries acreage but no
    // assessed values. MI's dominant metro; Wayne County itself has no
    // county-wide open parcel service found. Verified: 1302 Crawford St ->
    // 0.084 ac.
    state: "MI",
    county: "Wayne",
    sourceName: "City of Detroit (DWSD) — Parcels (boundary + acreage, no values)",
    coverageArea: "the City of Detroit (not the rest of Wayne County)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=7e22885870124b69b0b76c83e3412412",
    queryUrl: "https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/Detroit_Parcels_2025_(Impervious_Surfaces_Viewer)/FeatureServer/2/query",
    addressMatchField: "address",
    fields: {
      parcelId: "parcel_id",
      address: "address",
      acres: "TOTALACREAGEFINAL",
    },
    assessmentAsOf: null,
  },
  {
    // Full CAMA, hosted on the county's own gis.miottawa.org domain
    // (Michigan's western-Michigan lakeshore county). AssessedValue is
    // Michigan's own field name; TaxableValue is capped under Michigan's
    // Prop A and usually runs lower — not used here to avoid understating
    // value, same reasoning as Wyoming/South Carolina above. Verified:
    // 12714 Rich St, Grand Haven -> $140,600 assessed, 2.88 ac.
    state: "MI",
    county: "Ottawa",
    sourceName: "Ottawa County, Michigan (Grand Haven/Holland) — Parcels (CAMA)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=2821d458e93e4c95a43279ef6a164172",
    queryUrl: "https://gis.miottawa.org/arcgis/rest/services/HostedServices/ParcelsPublic/FeatureServer/0/query",
    addressMatchField: "PropertyAddress",
    cityField: "PropertyCity",
    fields: {
      parcelId: "FinalPIN",
      address: "PropertyAddress",
      acres: "Acreage",
      assessedTotal: "AssessedValue",
      landUse: "PropertyClassDescription",
      legal: "LegalDesc",
    },
    assessmentAsOf: null,
  },
  {
    // City of Sioux Falls-hosted parcel layer covering Minnehaha County (SD's
    // most populous). Verified: 1910 E Robur Dr -> 4.41 ac; fast (0.44s). No
    // value fields.
    state: "SD",
    county: "Minnehaha",
    sourceName: "City of Sioux Falls / Minnehaha County, South Dakota — Property Parcels (boundary + acreage, no values)",
    coverageArea: "the Sioux Falls area (Minnehaha County)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=d57efdf717064169a21c70b8b380e387",
    queryUrl: "https://gis.siouxfalls.gov/arcgis/rest/services/Data/Property/MapServer/1/query",
    addressMatchField: "ADDRESS",
    fields: {
      parcelId: "TAG",
      address: "ADDRESS",
      county: "COUNTY",
      acres: "ACREAGE",
    },
    assessmentAsOf: null,
  },
  {
    // Kentucky's own state GIS server (kygisserver.ky.gov) hosts only ONE
    // county's PVA parcels — Webster (rural, small) — confirmed by listing
    // every service on that server; KY's other 119 counties host their PVA
    // data independently (LOJIC/Jefferson checked separately, thin — no
    // address/values). Verified: 70 Honeysuckle Ln, Henderson -> 6.13 ac. No
    // value fields.
    state: "KY",
    county: "Webster",
    sourceName: "Webster County, Kentucky PVA — Parcels (boundary + acreage, no values)",
    sourceUrl: "https://kygisserver.ky.gov/arcgis/rest/services/WGS84WM_Services/Ky_PVA_Webster_Parcels_WGS84WM/MapServer",
    queryUrl: "https://kygisserver.ky.gov/arcgis/rest/services/WGS84WM_Services/Ky_PVA_Webster_Parcels_WGS84WM/MapServer/1/query",
    addressMatchField: "LOCATION",
    cityField: "CITY",
    fields: {
      parcelId: "PARCEL_ID",
      address: "LOCATION",
      acres: "ACRES",
    },
    assessmentAsOf: null,
  },
  {
    // Hennepin County (Minneapolis) — MN's dominant metro, hosted on the
    // county's own gis.hennepin.us domain. Full CAMA with up to 4 separate
    // property-type value segments per parcel (PR_TYP1-4/LAND_MV1-4/etc,
    // for split-use parcels); segment 1's values used as the canonical
    // figures. No single combined address field — HOUSE_NO/STREET_NM are
    // separate, same pattern as NY. Verified: 2901 78th St E, Bloomington
    // -> $3,444,700 market value, built 1965.
    state: "MN",
    county: "Hennepin",
    sourceName: "Hennepin County, Minnesota (Minneapolis) — Parcels (CAMA)",
    sourceUrl: "https://gis-hennepin.hub.arcgis.com/datasets/county-parcels/explore",
    queryUrl: "https://gis.hennepin.us/arcgis/rest/services/HennepinData/LAND_PROPERTY/MapServer/1/query",
    streetNumberField: "HOUSE_NO",
    streetNumberFieldType: "numeric",
    streetNameField: "STREET_NM",
    cityField: "MUNIC_NM",
    fields: {
      parcelId: "PID_TEXT",
      // PARCEL_AREA is square feet, not acres (confirmed against sampled
      // values) — mapped to lotSqft, NOT acres, so acreageText never labels
      // a sqft number as acres.
      lotSqft: "PARCEL_AREA",
      assessedLand: "LAND_MV1",
      assessedImprovement: "BLDG_MV1",
      assessedTotal: "MKT_VAL_TOT",
      yearBuilt: "BUILD_YR",
      landUse: "PR_TYP_NM1",
    },
    assessmentAsOf: null,
  },
  {
    // MN's own "opt-in" state tracker (plan_parcels_open) is NOT a parcel
    // source itself — confirmed it's only a per-county participation index
    // (rundate/notes/data_url), not parcel records — but its data_url/
    // viewer_url fields are a real lead-generation directory: Olmsted County
    // (Rochester) is one of the participating counties with its own live,
    // full-CAMA ArcGIS service. Verified: 6314 29th Ave, Rochester ->
    // $242,600 estimated market value.
    state: "MN",
    county: "Olmsted",
    sourceName: "Olmsted County, Minnesota (Rochester) — Parcels Composite (CAMA)",
    sourceUrl: "https://gis.data.mn.gov/datasets/minnesota::olmsted-county-parcels/about",
    queryUrl: "https://public.gis.olmstedcounty.gov/arcgis/rest/services/AGOL_Open_Data/Parcels/FeatureServer/0/query",
    streetNumberField: "SiteAddrNo",
    streetNameField: "SiteStName",
    cityField: "SiteCity",
    fields: {
      parcelId: "PARID",
      acres: "DeedAcres",
      assessedLand: "EMVLand",
      assessedImprovement: "EMVBldg",
      assessedTotal: "EMVTotal",
      landUse: "LandUseDes",
    },
    assessmentAsOf: null,
  },
  {
    // Full CAMA (no MO statewide layer or county-level GIS found in the
    // remaining 114 counties; St. Louis City is its own independent
    // county-equivalent). Verified: 1110 Childress Ave -> $44,470 assessed
    // total, built 1940. LandArea field returned 0 on every sampled row
    // (same unreliable-acreage pattern seen on Ohio's layer), so left
    // unmapped rather than surface a wrong figure.
    state: "MO",
    county: "St. Louis City",
    sourceName: "City of St. Louis Assessor — Public Parcels (CAMA)",
    coverageArea: "the City of St. Louis (not St. Louis County)",
    sourceUrl: "https://www.stlouis-mo.gov/data/datasets/distribution.cfm?id=119",
    queryUrl: "https://maps8.stlouis-mo.gov/arcgis/rest/services/ASSESSOR/Assessor_Public_Parcels/MapServer/11/query",
    addressMatchField: "SITEADDR",
    fields: {
      parcelId: "ParcelId",
      address: "SITEADDR",
      assessedLand: "AsdLand",
      assessedImprovement: "AsdImprove",
      assessedTotal: "AsdTotal",
      yearBuilt: "FirstYearBuilt",
      zoning: "Zoning",
      legal: "LegalDesc1",
    },
    assessmentAsOf: null,
  },
  {
    // REJECTED: a Nevada DOT-hosted "statewide" compilation was found first,
    // but its own SourceDate field showed the snapshot frozen at 2017-09-15
    // — nine years stale, unacceptable for a system meant to serve current
    // data. Pulled rather than shipped. This entry instead uses Washoe
    // County's (Reno) own live ArcGIS org, served directly by the county
    // assessor's mapping system — current, not a historical mirror.
    // Metro-county entry (no live NV statewide layer found). Verified: 1680
    // Alamo Dr, Washoe County. No acreage or value fields on this layer
    // (values live at the county's separate DATALINK-referenced assessor
    // site).
    state: "NV",
    county: "Washoe",
    sourceName: "Washoe County, Nevada (Reno) — Parcels (boundary + address only, no values)",
    sourceUrl: "https://www.washoecounty.gov/assessor/Mapping/index.php",
    queryUrl: "https://services5.arcgis.com/RjM4BJrv5ZkqP4XC/ArcGIS/rest/services/Parcels/FeatureServer/3/query",
    addressMatchField: "SITEADDR",
    fields: {
      parcelId: "PIN",
      address: "SITEADDR",
    },
    assessmentAsOf: null,
  },
  {
    // The known AGRC item (arcgis.com "Parcels - Statewide Utah (AGRC)")
    // points to a dead mapserv.utah.gov URL (confirmed 404). Found the
    // current live service via opendata.gis.utah.gov's Hub page → its
    // backing item id → this URL, owned by UtahAGRC. Verified: 1505 S Birch
    // Creek Rd, Daggett County; fast (0.44s). No value fields, no acreage.
    state: "UT",
    sourceName: "Utah Geospatial Resource Center (UGRC/AGRC) — Statewide Parcels (boundary + address only, no values)",
    sourceUrl: "https://opendata.gis.utah.gov/datasets/utah-statewide-parcels/explore",
    queryUrl: "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahStatewideParcels/FeatureServer/0/query",
    addressMatchField: "PARCEL_ADD",
    cityField: "PARCEL_CITY",
    fields: {
      parcelId: "PARCEL_ID",
      address: "PARCEL_ADD",
      county: "County",
    },
    assessmentAsOf: null,
  },
  // ── Boundary/address-only sources (founder-approved partial coverage,
  // 2026-08-23): these states route their actual CAMA dollar values to each
  // county's own separate portal rather than a shared statewide layer, so
  // the fields below are honestly limited to what the shared layer itself
  // publishes — parcel ID, address, acreage, land use. assessedTotal and
  // friends are left unset rather than approximated, and simply resolve to
  // null downstream. Full CAMA values for these states require going to each
  // county individually, same as the full-value entries above.
  // Ohio and Texas below WERE unusable in address mode (55+ second unindexed
  // text scans; Texas also errored outright) but ARE usable via queryMode:
  // "point" — a fast indexed spatial pre-filter, then addressMatchField
  // narrows the candidates client-side (see findByPoint in
  // genericArcgisParcelResolver.ts). All entries here were caught failing by
  // an end-to-end resolver test with a real address AFTER the health check
  // passed clean — the health check only proves an endpoint answers
  // `where=1=1`, not that a real query is usable.
  {
    // Verified via point-mode: 419 Duncan Ln, Anderson County -> 1.42 deeded
    // acres (address-mode also timed out at 55s+ here, same OGRIP-style
    // pathology as Ohio/Texas). Every address on this layer is ALSO stored
    // "STREET NAME, NUMBER" (e.g. "DUNCAN LN 419") — reversed from the usual
    // US order — so addressNumberPosition: "trailing" matches the number at
    // the end of the candidate address instead of the start, same fix
    // findByAddress uses, applied in findByPoint's client-side filter. No
    // value fields (TN routes CAMA $ to each county's separate TPAD portal).
    state: "TN",
    sourceName: "Tennessee Comptroller (tnmap.tn.gov) — Statewide Property Boundaries Public Use (boundary + address only, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=e356f1a241844d6f9025f2fa4e977df3",
    queryUrl: "https://services1.arcgis.com/YuVBSS7Y1of2Qud1/arcgis/rest/services/Tennessee_Property_Boundaries_Public_Use/FeatureServer/0/query",
    queryMode: "point",
    pointBufferMeters: 300,
    addressMatchField: "ADDRESS",
    addressNumberPosition: "trailing",
    fields: {
      parcelId: "PARCELID",
      address: "ADDRESS",
      county: "COUNTY_NAME",
      acres: "DEEDAC",
    },
    assessmentAsOf: null,
  },
  {
    // Verified via point-mode: 84 W Dodridge St, Franklin County (Columbus)
    // resolves correctly (0.5s) where address-mode timed out at 55s+. No
    // value fields on this "public view" (LandArea also proved unreliable —
    // 0 on an improved residential parcel — so left unmapped).
    state: "OH",
    sourceName: "OGRIP (Ohio Geographically Referenced Information Program) — Statewide Parcels (boundary + address only, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=26ab5fad8d5d4258a7492a14de83bc0e",
    queryUrl: "https://services2.arcgis.com/MlJ0G8iWUyC7jAmu/arcgis/rest/services/OhioStatewidePacels_full_view/FeatureServer/0/query",
    queryMode: "point",
    pointBufferMeters: 100,
    addressMatchField: "SitusAddressAll",
    fields: {
      parcelId: "LocalParcelID",
      address: "SitusAddressAll",
      county: "County",
      landUse: "StateLUC",
    },
    assessmentAsOf: null,
  },
  {
    // Maricopa County (Phoenix) — AZ's dominant metro, ~4.5M people, hosted
    // on the Assessor's own domain (gis.mcassessor.maricopa.gov). Full CAMA:
    // FCV_CUR (Full Cash Value, market basis) used for assessedTotal rather
    // than LPV_CUR (Limited Property Value, AZ's capped/taxable figure,
    // usually lower) — same "don't understate" reasoning as WY/SC/MI above.
    // Value fields are comma-formatted TEXT ("  29,514,527") — this is what
    // motivated stripping commas/whitespace in the resolver's num() helper.
    // Verified: 100 E Tempe Townlake, Tempe -> $1,672,544 FCV, built 2001.
    state: "AZ",
    county: "Maricopa",
    sourceName: "Maricopa County, Arizona (Phoenix) — Assessor Parcels (CAMA)",
    sourceUrl: "https://maps.mcassessor.maricopa.gov/help/g_rest.html",
    queryUrl: "https://gis.mcassessor.maricopa.gov/arcgis/rest/services/MaricopaDynamicQueryService/MapServer/3/query",
    addressMatchField: "PHYSICAL_ADDRESS",
    cityField: "PHYSICAL_CITY",
    fields: {
      parcelId: "APN",
      address: "PHYSICAL_ADDRESS",
      lotSqft: "LAND_SIZE",
      assessedTotal: "FCV_CUR",
      yearBuilt: "CONST_YEAR",
      zoning: "CITY_ZONING",
    },
    assessmentAsOf: null,
  },
  {
    // Metro-county entry — one ArcGIS service actually covers 12 of AZ's 15
    // counties as separate layers (Apache, Cochise, Coconino, Gila, Graham,
    // Greenlee, LaPaz, Navajo, Pima, Pinal, SantaCruz, Yuma — Maricopa/
    // Mohave/Yavapai not included). Pima (Tucson, AZ's 2nd-largest) wired in
    // here; the other 11 share this exact schema/host, just a different
    // layer index — cheap follow-up if broader AZ coverage is wanted.
    // Verified: 11 E Orange Grove Rd, unincorporated Pima County -> 21.83 ac.
    // No value fields on this layer.
    state: "AZ",
    county: "Pima",
    sourceName: "Pima County, Arizona (Tucson) — Parcels (boundary + acreage, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=c33b63281f80430f89db6f3401154674",
    queryUrl: "https://services.arcgis.com/C34zQ7veRS0V1t04/arcgis/rest/services/Parcels/FeatureServer/10/query",
    addressMatchField: "SITE_ADDRESS",
    cityField: "SITE_CITY",
    fields: {
      parcelId: "APN",
      address: "SITE_ADDRESS",
      acres: "ACRES_US",
    },
    assessmentAsOf: null,
  },
  {
    // Same shared AZ multi-county service as Pima above, layer 2. Verified:
    // 1300 Green Ridge Dr, Happy Jack -> 1.13 ac.
    state: "AZ",
    county: "Coconino",
    sourceName: "Coconino County, Arizona (Flagstaff) — Parcels (boundary + acreage, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=c33b63281f80430f89db6f3401154674",
    queryUrl: "https://services.arcgis.com/C34zQ7veRS0V1t04/arcgis/rest/services/Parcels/FeatureServer/2/query",
    addressMatchField: "SITE_ADDRESS",
    cityField: "SITE_CITY",
    fields: {
      parcelId: "APN",
      address: "SITE_ADDRESS",
      acres: "ACRES_US",
    },
    assessmentAsOf: null,
  },
  {
    // Same shared AZ multi-county service as Pima above, layer 13. Verified:
    // 11380 S Tucson Dr, Yuma -> 0.025 ac.
    state: "AZ",
    county: "Yuma",
    sourceName: "Yuma County, Arizona — Parcels (boundary + acreage, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=c33b63281f80430f89db6f3401154674",
    queryUrl: "https://services.arcgis.com/C34zQ7veRS0V1t04/arcgis/rest/services/Parcels/FeatureServer/13/query",
    addressMatchField: "SITE_ADDRESS",
    cityField: "SITE_CITY",
    fields: {
      parcelId: "APN",
      address: "SITE_ADDRESS",
      acres: "ACRES_US",
    },
    assessmentAsOf: null,
  },
  {
    // Verified via point-mode: 1815 Treadwell St, Austin resolves correctly
    // where address-mode both timed out at 55s+ AND errored outright. 300m
    // buffer (wider than Ohio's 100m) — this layer's address interpolation
    // needed the extra margin to catch the exact house number. GIS_AREA
    // values looked unreliable for urban parcels sampled, so acreage is left
    // unmapped; no county field on this layer.
    state: "TX",
    sourceName: "Texas Geographic Information Office (TxGIO) — StratMap Statewide Land Parcels (boundary + address only, partial county coverage, no values)",
    coverageScope: "partial",
    coverageArea: "most of Texas (the state compilation omits some counties)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=03956e7e3fb84df587a54f1ee9e1091f",
    queryUrl: "https://services1.arcgis.com/1mtXwieMId59thmg/arcgis/rest/services/2019_Texas_Parcels_StratMap/FeatureServer/0/query",
    queryMode: "point",
    pointBufferMeters: 300,
    addressMatchField: "SITUS_ADDR",
    fields: {
      parcelId: "Prop_ID",
      address: "SITUS_ADDR",
    },
    assessmentAsOf: null,
  },
  {
    // Verified: Garden Hwy, Sacramento County — real address, no acreage or
    // value fields on this public view.
    state: "CA",
    sourceName: "CAL FIRE — California Statewide Parcels Public View (boundary + address only, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=2061fbc963464c5198ec064100802624",
    queryUrl: "https://bz1uwWPKUInZBK94.svcs5.arcgis.com/bz1uwWPKUInZBK94/arcgis/rest/services/CA_Statewide_Parcels_Public_view/FeatureServer/0/query",
    addressMatchField: "FullStreetAddress",
    cityField: "SITE_CITY",
    fields: {
      parcelId: "PARCEL_APN",
      address: "FullStreetAddress",
      county: "COUNTYNAME",
    },
    assessmentAsOf: null,
  },
  {
    // Verified: 5755 Catawba Creek Rd, Roanoke County -> 378.08 deeded acres,
    // no value fields.
    state: "VA",
    sourceName: "Virginia Tech-hosted statewide parcel compilation (county-sourced boundaries, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=a7eafe99849d4dd99b86325bc4d05720",
    queryUrl: "https://arcgis-central.gis.vt.edu/arcgis/rest/services/facilities/VABuildingandParcel/FeatureServer/1/query",
    addressMatchField: "site_addr",
    fields: {
      parcelId: "parcel_id",
      address: "site_addr",
      county: "county",
      acres: "deed_acres",
    },
    assessmentAsOf: null,
  },
  {
    // Verified: 4404 W Co Rd 700 S, Greensburg — real address. tax_county is
    // null on most records (data-quality gap on the source), so county is
    // left unmapped; cityField (prop_city) is populated and used instead. No
    // acreage or value fields on this layer.
    state: "IN",
    sourceName: "IndianaMap (gisdata.in.gov) — Parcel Boundaries of Indiana Current (boundary + address only, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=70565d886f1e4528a43a86be6ce5c2f3",
    queryUrl: "https://gisdata.in.gov/server/rest/services/Hosted/Parcel_Boundaries_of_Indiana_Current/FeatureServer/0/query",
    addressMatchField: "prop_add",
    cityField: "prop_city",
    fields: {
      parcelId: "parcel_id",
      address: "prop_add",
    },
    assessmentAsOf: null,
  },
  {
    // Cook County (Chicago) — IL's dominant metro, ~5.1M people, full CAMA
    // values. All three value fields are STRING-typed on this service (not
    // numeric — confirmed via field metadata), which is why a numeric WHERE
    // filter like TotalValue>0 errors; the resolver never builds that kind
    // of filter (only address-text LIKE clauses), so this doesn't affect
    // real lookups — Number() coercion downstream handles numeric strings
    // fine. Verified: 231 W Main St, Barrington -> $65,253 total (2024);
    // 231 W Main St, Glenwood -> $13,000 total (same address string, two
    // different suburbs — confirms the resolver's per-row match, not a
    // guess). BldgSqft returned 0 on a sampled record so treated as
    // unreliable like Ohio's LandArea — left unmapped.
    state: "IL",
    county: "Cook",
    sourceName: "Cook County, Illinois (Chicago) — Assessor Parcels (CAMA)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=f22d4d1f587447969d6363a36ad1cf31",
    queryUrl: "https://gis.cookcountyil.gov/traditional/rest/services/cookVwrDynmc/MapServer/44/query",
    addressMatchField: "Address",
    cityField: "City",
    fields: {
      parcelId: "Pin10",
      address: "Address",
      // No county field mapped: TownNum/Town are township codes/names WITHIN
      // Cook County, not the county name itself — leaving fields.county
      // unset here rather than surface a township code as if it were "the
      // county."
      assessedLand: "LandValue",
      assessedImprovement: "BldgValue",
      assessedTotal: "TotalValue",
    },
    assessmentAsOf: null,
  },
  {
    // Metro-county entry (no clean IL statewide layer; Lake County is
    // Chicago-exurb, IL's 3rd most populous). Verified: 1063 W IL Route 173,
    // Antioch — real address; fast query (0.48s). No acreage or value fields
    // on this layer.
    state: "IL",
    county: "Lake",
    sourceName: "Lake County, Illinois GIS — Parcel Polygons (boundary + address only, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=318e616ff0d14efe83927d8dd3bc1e12",
    queryUrl: "https://services3.arcgis.com/HESxeTbDliKKvec2/arcgis/rest/services/OpenData_ParcelPolygons/FeatureServer/0/query",
    addressMatchField: "situs_addr_line_1_First",
    cityField: "situs_addr_city_First",
    fields: {
      parcelId: "PIN",
      address: "situs_addr_line_1_First",
    },
    assessmentAsOf: null,
  },
  {
    // ALASKA — first AK coverage. The taxroll layer publishes current (2026)
    // land/improvement/total values but NO property address, only the
    // OWNER's mailing address, so neither address-mode nor point-mode works:
    // a Census-geocoded point landed on a road right-of-way parcel (PAN
    // 9999999, all values null) rather than the home. The borough publishes
    // a separate address→PAN crosswalk (43,380 addresses), so this uses
    // addressKeyJoin — a published key match, not a spatial guess. PAN is a
    // genuine integer on both layers. Verified end to end: 2091 Flight St ->
    // PAN 327778 -> $24,968 land + $400,349 improvements = $425,317 total,
    // tax year 2026, Residential.
    state: "AK",
    county: "Fairbanks North Star",
    sourceName: "Fairbanks North Star Borough, Alaska — Parcels with Taxroll (CAMA, address→PAN crosswalk)",
    coverageArea: "the Fairbanks North Star Borough",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=4af1635b48c1490784c5f9cb1e0a8a49",
    queryUrl: "https://services.arcgis.com/f4rR7WnIfGBdVYFd/arcgis/rest/services/FNSB_Parcels_with_Taxroll_Information/FeatureServer/0/query",
    addressKeyJoin: {
      queryUrl: "https://services.arcgis.com/f4rR7WnIfGBdVYFd/arcgis/rest/services/address_pan/FeatureServer/0/query",
      addressMatchField: "Address",
      keyField: "PAN",
      parcelKeyField: "PAN",
      parcelKeyFieldType: "numeric",
    },
    fields: {
      parcelId: "PAN",
      assessedLand: "Land_Value",
      assessedImprovement: "Improvements",
      assessedTotal: "Total_Value",
      landUse: "Assessing_Primary_Use",
      legal: "PARCEL_SUB",
    },
    // The layer stamps its own Tax_Year (2026 on sampled rows), but the
    // registry's assessmentAsOf is a static string and this value is
    // per-record — left null rather than hardcode a year that could drift.
    assessmentAsOf: null,
  },
  {
    // IOWA — first IA coverage. Woodbury County (Sioux City, IA's 4th most
    // populous). Address is split across addr_num + addr_stname, same shape
    // as NY/Hennepin; both are text-typed here (no numeric-quoting issue).
    // Polk County (Des Moines) was checked first and rejected: its layer
    // carries a house number but NO street name at all, so an address match
    // is impossible there. No value fields on this layer (net_tax/con_tax
    // are tax billed, not assessed value — deliberately not mapped to a
    // value field). Verified: 4765 340th St, Danbury -> 39 ac, Ag_Dwelling.
    state: "IA",
    county: "Woodbury",
    sourceName: "Woodbury County, Iowa (Sioux City) — Parcel Data (boundary + acreage, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=e0c2830cf2a74fd39d3875434d756fb4",
    queryUrl: "https://services.arcgis.com/kd1jFI4TM5bZHeP8/arcgis/rest/services/Woodbury_County_IA_Parcel_Data_Feature/FeatureServer/0/query",
    streetNumberField: "addr_num",
    streetNameField: "addr_stname",
    cityField: "addr_city",
    fields: {
      parcelId: "PIN",
      acres: "land_acres",
      lotSqft: "land_sq_ft",
      landUse: "land_class_descr",
      zoning: "ZONING",
      legal: "legal",
    },
    assessmentAsOf: null,
  },
  {
    // RHODE ISLAND — first RI coverage, and honestly a SMALL one: the town
    // of Middletown only (~16k people), not Providence. RI has no statewide
    // parcel service and most towns route through vendor portals; this is
    // the one town found publishing a real queryable layer with a situs
    // address. AValPerSF (assessed value per square foot) is deliberately
    // NOT mapped to a value field — deriving a total from it would be a
    // computation this source does not publish. Verified: 331 Wolcott Ave
    // -> 0.28 ac.
    state: "RI",
    county: "Newport",
    sourceName: "Town of Middletown, Rhode Island — Parcels (Middletown only, boundary + acreage, no values)",
    coverageArea: "the Town of Middletown",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=c99ab6d06a4943ff984e26abffb68c36",
    queryUrl: "https://services5.arcgis.com/h6RSw6HV2SnVSCaN/arcgis/rest/services/MiddletownParcelsAssess1/FeatureServer/0/query",
    addressMatchField: "Location",
    fields: {
      parcelId: "PIN",
      address: "Location",
      acres: "GIS_AC",
      lotSqft: "GIS_SF",
      zoning: "DominantZo",
    },
    assessmentAsOf: null,
  },
  {
    // MAINE — first ME coverage, statewide (all "organized towns"; Maine's
    // unorganized territories are a separate layer not wired in). Address is
    // split across PROPLOCNUM + PROP_LOC, and PROPLOCNUM is a genuine
    // Double, so it needs the numeric quoting path. Maine GeoLibrary's own
    // caveat applies and is worth honoring downstream: towns submit updates
    // voluntarily and on no fixed schedule, so some towns' data is
    // materially older than others. No value or acreage fields on this
    // layer. Verified: 17 Ellsworth Rd, Aurora (Hancock County).
    state: "ME",
    sourceName: "Maine GeoLibrary — Statewide Parcels, Organized Towns (boundary + address only, no values; town update cadence varies)",
    coverageScope: "partial",
    coverageArea: "Maine's organized towns (unorganized territories are not included)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=346131b710a645ffb624f448a9cba6d4",
    queryUrl: "https://services1.arcgis.com/RbMX0mRVOFNTdLzd/arcgis/rest/services/Maine_Parcels_Organized_Towns/FeatureServer/10/query",
    streetNumberField: "PROPLOCNUM",
    streetNumberFieldType: "numeric",
    streetNameField: "PROP_LOC",
    cityField: "TOWN",
    fields: {
      parcelId: "STATE_ID",
      address: "PROP_LOC",
      county: "COUNTY",
    },
    assessmentAsOf: null,
  },
  {
    // HAWAII — first HI coverage, and it carries REAL VALUES. Hawaii's
    // statewide TMK layer has no address field at all (only a TMK parcel
    // key), and its per-county parcel layers likewise carry values but no
    // address — which is why earlier attempts here failed. Maui County
    // publishes a Site_Address_Point layer with both a street address AND
    // the parcel's TMK, so this uses addressKeyJoin with keyTruncateLength:
    // the address points' 12-digit TMK truncates to the parcel layer's
    // 8-digit cty_tmk (trailing 4 digits are a unit/CPR suffix). Verified
    // systematic across 6 sampled addresses, each resolving to a distinct
    // parcel: 10600 Hana Hwy -> $629,100 land + $205,300 building, 27.96
    // tax acres.
    //
    // Deliberately NOT used for Hawaii: the qpublic.schneidercorp.com links
    // embedded in the state's own layers point at a private vendor's
    // (Schneider Geospatial) hosted portal, not a government API. The data
    // there is public record, but scraping that portal would put a vendor's
    // page structure between us and the source of record — exactly what
    // this registry exists to avoid.
    state: "HI",
    county: "Maui",
    sourceName: "Maui County, Hawaii — Parcels + Assessment (CAMA, address→TMK crosswalk)",
    coverageArea: "Maui County",
    sourceUrl: "https://geodata.hawaii.gov/arcgis/rest/services/ParcelsZoning/MapServer/30",
    queryUrl: "https://geodata.hawaii.gov/arcgis/rest/services/ParcelsZoning/MapServer/30/query",
    addressKeyJoin: {
      queryUrl: "https://services3.arcgis.com/fsrDo0QMPlK9CkZD/arcgis/rest/services/Site_Address_Point/FeatureServer/0/query",
      addressMatchField: "FULLADDR",
      keyField: "TMK",
      parcelKeyField: "cty_tmk",
      keyTruncateLength: 8,
    },
    fields: {
      parcelId: "tmk_txt",
      acres: "taxacres",
      assessedLand: "landvalue",
      assessedImprovement: "bldgvalue",
      zoning: "zone",
    },
    assessmentAsOf: null,
  },
  {
    // Metro-county entry (no clean AL statewide layer; Mobile County is AL's
    // 3rd most populous). Verified: 19975 Shepard Lake Rd, Mt Vernon -> 1.0
    // ac; fast query (0.56s). No value fields on this layer.
    state: "AL",
    county: "Mobile",
    sourceName: "Mobile County, Alabama Revenue Commission — Public Parcels (boundary + acreage, no values)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=07c93ca64bbf4fb8a8d49b7ea80ef067",
    queryUrl: "https://services8.arcgis.com/HND1NcQt6vgOGn1z/arcgis/rest/services/MCRC_Public_Parcels/FeatureServer/0/query",
    addressMatchField: "PropAddr1",
    cityField: "PropCity",
    fields: {
      parcelId: "Parcel_Number",
      address: "PropAddr1",
      acres: "Acreage",
    },
    assessmentAsOf: null,
  },
  {
    state: "DE",
    county: "Kent",
    sourceName: "Kent County, Delaware — Parcels + Assessment",
    sourceUrl: "https://gis-kentcountyde.hub.arcgis.com/",
    queryUrl: "https://gis.kentcountyde.gov/server/rest/services/Parcels/Parcels/MapServer/0/query",
    addressMatchField: "LOCATION",
    fields: {
      parcelId: "Name",
      address: "LOCATION",
      acres: "DEEDACREAGE",
      assessedLand: "LANDASSESSMENT",
      assessedImprovement: "IMPROVE",
      assessedTotal: "TOTALASSESSMENT",
      yearBuilt: "YearBuilt",
      landUse: "PropertyUse",
      buildingStyle: "StructureType",
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
    // EVERY outbound URL a source can reach must be listed here, not just the
    // primary parcel layer — addressPointsSource and addressKeyJoin each hit
    // their own endpoint, and a source whose helper layer lives on a
    // different host than its parcel layer would otherwise be rejected by
    // governedFetch at runtime (they happen to be same-host today, which is
    // exactly why this is easy to miss).
    ARCGIS_PARCEL_SOURCES.flatMap((s) => {
      const urls = [
        s.queryUrl,
        ...(s.assessJoin ? [s.assessJoin.tableUrl] : []),
        ...(s.addressPointsSource ? [s.addressPointsSource.queryUrl] : []),
        ...(s.addressKeyJoin ? [s.addressKeyJoin.queryUrl] : []),
      ];
      return urls.map((u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ""; } });
    }).filter(Boolean),
  ),
];

/** Coverage the two BESPOKE resolvers add on top of the registry array
 *  (jurisdictionParcelResolver runs these before the generic engine): Maryland
 *  statewide via SDAT, and Delaware's Sussex County. Declared here so coverage
 *  reporting reflects what the resolver actually answers, not just what this
 *  file's array happens to list. */
const BESPOKE_COVERAGE: Array<{ state: string; county?: string; coverageArea?: string; hasValues: boolean }> = [
  { state: "MD", hasValues: true },
  { state: "DE", county: "Sussex", hasValues: true },
];

/** States with governed parcel coverage today (bespoke + registry).
 *
 *  CAUTION: state-level presence in this list does NOT mean statewide
 *  coverage — 22 of these states are currently one or a few counties only.
 *  Use parcelCoverageForState() for anything customer-facing; this flat list
 *  is for internal inventory and would overstate coverage if rendered
 *  directly. */
export const COVERED_PARCEL_STATES: string[] = [
  ...new Set([
    ...BESPOKE_COVERAGE.map((b) => b.state),
    ...ARCGIS_PARCEL_SOURCES.map((s) => s.state.toUpperCase()),
  ]),
];

/** Total county count for states we assemble county-by-county and could
 *  plausibly complete, so "all N counties covered" reports as statewide
 *  rather than claiming gaps that don't exist. Add a state here only with a
 *  verified count. */
const TOTAL_COUNTIES_BY_STATE: Record<string, number> = {
  DE: 3, // Kent, New Castle, Sussex — all three covered today.
};

export type ParcelCoverageScope = "STATEWIDE" | "PARTIAL_COUNTIES" | "NONE";

export interface ParcelCoverage {
  state: string;
  scope: ParcelCoverageScope;
  /** Named counties/jurisdictions when scope is PARTIAL_COUNTIES. Empty for
   *  STATEWIDE and NONE. */
  counties: string[];
  /** Whether ANY covering source for this state publishes assessed or market
   *  dollar values. False means we can locate the parcel but must state that
   *  no valuation is available from the source — never imply one. */
  hasAssessedValues: boolean;
  /** Plain-language sentence safe to show a customer as-is. States the limit
   *  rather than implying coverage we don't have. */
  disclosure: string;
}

/**
 * What we can HONESTLY say about parcel coverage for one state.
 *
 * Exists because "we cover 49 states" is true only at the loosest reading —
 * many states are a single county, and a customer searching Providence RI or
 * Louisville KY would get nothing while a naive state-level check claimed
 * coverage. This reports at the granularity the resolver actually answers at.
 */
export function parcelCoverageForState(stateCode: string): ParcelCoverage {
  const st = stateCode.trim().toUpperCase();
  const registry = ARCGIS_PARCEL_SOURCES.filter((s) => s.state.toUpperCase() === st);
  const bespoke = BESPOKE_COVERAGE.filter((b) => b.state === st);
  const all = [
    ...bespoke.map((b) => ({
      county: b.county, coverageArea: b.coverageArea,
      statewide: !b.county, hasValues: b.hasValues,
    })),
    ...registry.map((s) => ({
      county: s.county, coverageArea: s.coverageArea,
      // A source is statewide only if it names no county AND isn't flagged
      // partial by its own publisher's documented gaps.
      statewide: !s.county && s.coverageScope !== "partial",
      hasValues: Boolean(s.fields.assessedTotal || s.fields.assessedLand),
    })),
  ];

  if (all.length === 0) {
    return {
      state: st, scope: "NONE", counties: [], hasAssessedValues: false,
      disclosure: `We do not have parcel records for ${st} yet.`,
    };
  }

  const hasAssessedValues = all.some((a) => a.hasValues);
  const valueNote = hasAssessedValues
    ? ""
    : " Parcel boundaries and identifiers only — this source publishes no assessed value.";

  if (all.some((a) => a.statewide)) {
    return {
      state: st, scope: "STATEWIDE", counties: [], hasAssessedValues,
      disclosure: `We have statewide parcel records for ${st}.${valueNote}`,
    };
  }

  // A state whose every county is covered IS statewide, even though it was
  // assembled county by county (Delaware: all 3 counties).
  const covered = [...new Set(all.map((a) => a.county).filter(Boolean) as string[])];
  const totalCounties = TOTAL_COUNTIES_BY_STATE[st];
  if (totalCounties && covered.length >= totalCounties) {
    return {
      state: st, scope: "STATEWIDE", counties: covered.sort(), hasAssessedValues,
      disclosure: `We have statewide parcel records for ${st} (all ${totalCounties} counties).${valueNote}`,
    };
  }

  // Sources with no county but flagged partial are broad-but-gapped state
  // layers, not a short list of counties — "only, not the rest of the state"
  // would misdescribe them.
  if (all.every((a) => !a.county)) {
    const caveat = all.map((a) => a.coverageArea).filter(Boolean).join("; ");
    return {
      state: st, scope: "PARTIAL_COUNTIES", counties: [], hasAssessedValues,
      disclosure: `Our ${st} parcel records cover ${caveat || "most of the state, with some gaps"}.${valueNote}`,
    };
  }

  // Prefer each source's own honest coverageArea label; fall back to
  // "<county> County" only where that is actually correct.
  const areas = [...new Set(all.map((a) => a.coverageArea ?? `${a.county} County`))].sort();
  const counties = [...new Set(all.map((a) => a.county).filter(Boolean) as string[])].sort();
  const list = areas.length === 1
    ? areas[0]
    : `${areas.slice(0, -1).join(", ")} and ${areas[areas.length - 1]}`;
  return {
    state: st, scope: "PARTIAL_COUNTIES", counties, hasAssessedValues,
    disclosure: `In ${st} we currently have parcel records for ${list} only — not the rest of the state.${valueNote}`,
  };
}
