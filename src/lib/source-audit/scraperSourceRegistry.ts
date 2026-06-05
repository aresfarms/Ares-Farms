/**
 * Scraper Source Registry (Build 42 — Scraper Coverage & Source
 * Freshness Audit)
 *
 * The canonical declaration of which scrapers Furlong is REQUIRED to
 * carry for Public Alpha, what fields each must extract, the source's
 * authority tier, its freshness window, the routes that depend on it,
 * and whether live fetch is permitted.
 *
 * Constitutional posture (Vol III source connectors; Vol V live-fetch
 * doctrine): Build 42 does NOT activate live scraping. This registry
 * is a readiness declaration that the audit runtime checks for
 * coverage, schema expectations, source authority, freshness rules,
 * held status, and provenance requirements. `liveFetchAllowed` is
 * false for every Alpha source; live fetch remains disabled unless a
 * later governance decision explicitly authorizes a specific scraper
 * (see LIVE_FETCH_AUTHORIZED_SCRAPER_IDS).
 */

export type ScraperAuthorityTier =
  | "OFFICIAL"
  | "LICENSED_THIRD_PARTY"
  | "DISCOVERY"
  | "INTERNAL_REFERENCE";

export type ScraperFreshnessWindow =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "ON_DEMAND"
  | "HELD_FOR_ALPHA";

export type ScraperCoverageStatus =
  | "PASS"
  | "WARN"
  | "FAIL"
  | "BLOCKED_BY_DESIGN"
  | "N_A";

export type ScraperSourceFamily =
  | "USDA_PROGRAMS"
  | "SBA_PROGRAMS"
  | "PROPERTY_DISCOVERY"
  | "COUNTY_RECORDS"
  | "STATE_REGISTRY"
  | "GRANTS"
  | "CUSTOMER_TYPE"
  | "FINANCING_PATHWAY"
  | "READINESS_DOCUMENTS"
  | "ENVIRONMENTAL"
  | "MARKET_INTELLIGENCE";

export interface RequiredScraperSource {
  scraperId: string;
  sourceFamily: ScraperSourceFamily;
  alphaRequired: boolean;
  authorityTier: ScraperAuthorityTier;
  freshnessWindow: ScraperFreshnessWindow;
  expectedFields: string[];
  requiredForRoutes: string[];
  liveFetchAllowed: boolean;
  heldReason?: string;
}

export const REQUIRED_SCRAPER_SOURCES: RequiredScraperSource[] = [
  {
    scraperId: "usda-program-reference-alpha",
    sourceFamily: "USDA_PROGRAMS",
    alphaRequired: true,
    authorityTier: "OFFICIAL",
    freshnessWindow: "MONTHLY",
    expectedFields: [
      "program_id",
      "program_name",
      "eligible_customer_types",
      "eligible_asset_types",
      "geographic_scope",
      "source_url",
      "last_verified_at",
      "provenance_ref",
    ],
    requiredForRoutes: ["/financing-pathways", "/readiness"],
    liveFetchAllowed: false,
  },
  {
    scraperId: "sba-program-reference-alpha",
    sourceFamily: "SBA_PROGRAMS",
    alphaRequired: true,
    authorityTier: "OFFICIAL",
    freshnessWindow: "MONTHLY",
    expectedFields: [
      "program_id",
      "program_name",
      "eligible_customer_types",
      "eligible_asset_types",
      "source_url",
      "last_verified_at",
      "provenance_ref",
    ],
    requiredForRoutes: ["/financing-pathways", "/readiness"],
    liveFetchAllowed: false,
  },
  {
    scraperId: "property-discovery-alpha",
    sourceFamily: "PROPERTY_DISCOVERY",
    alphaRequired: true,
    authorityTier: "DISCOVERY",
    freshnessWindow: "WEEKLY",
    expectedFields: [
      "property_id",
      "property_type",
      "location",
      "asking_price",
      "source_url",
      "discovered_at",
      "provenance_ref",
    ],
    requiredForRoutes: ["/financing-pathways"],
    liveFetchAllowed: false,
  },
  {
    scraperId: "county-records-alpha",
    sourceFamily: "COUNTY_RECORDS",
    alphaRequired: false,
    authorityTier: "OFFICIAL",
    freshnessWindow: "HELD_FOR_ALPHA",
    expectedFields: [],
    requiredForRoutes: [],
    liveFetchAllowed: false,
    heldReason: "County/title verification is not active during Public Alpha.",
  },
  {
    scraperId: "environmental-source-alpha",
    sourceFamily: "ENVIRONMENTAL",
    alphaRequired: false,
    authorityTier: "OFFICIAL",
    freshnessWindow: "HELD_FOR_ALPHA",
    expectedFields: [],
    requiredForRoutes: [],
    liveFetchAllowed: false,
    heldReason: "Environmental engineering review is deferred from Public Alpha.",
  },
];

/**
 * The source families that MUST have at least one registered scraper
 * for Public Alpha. Declared independently of REQUIRED_SCRAPER_SOURCES
 * so that REMOVING a scraper surfaces a coverage gap (rather than the
 * requirement silently vanishing with it).
 */
export const ALPHA_REQUIRED_SOURCE_FAMILIES: ScraperSourceFamily[] = [
  "USDA_PROGRAMS",
  "SBA_PROGRAMS",
  "PROPERTY_DISCOVERY",
];

/**
 * The customer-facing routes that must each be served by at least one
 * registered, non-held alpha-required scraper. If the only scraper(s)
 * serving a route are removed or held, the route's data dependency is
 * unmet and the audit fails closed.
 */
export const ALPHA_REQUIRED_ROUTES: string[] = [
  "/financing-pathways",
  "/readiness",
];

/**
 * Provenance fields every alpha-required scraper MUST declare. A
 * source with no provenance cannot be traced or replayed, so an
 * alpha-required scraper missing any of these is a schema failure.
 */
export const REQUIRED_PROVENANCE_FIELDS: string[] = [
  "source_url",
  "provenance_ref",
];

/**
 * Scrapers explicitly authorized by governance to perform live fetch.
 * Empty during Public Alpha — live fetch remains disabled. A scraper
 * with `liveFetchAllowed: true` whose id is NOT in this list (and that
 * carries no per-run governance authorization) is a live-fetch
 * violation.
 */
export const LIVE_FETCH_AUTHORIZED_SCRAPER_IDS: string[] = [];

/**
 * A scraper is a "static reference" source when it serves a slowly
 * changing reference corpus (program references), as opposed to a
 * "runtime/dynamic" source that discovers fresh records each run. The
 * distinction governs the severity of a missing last_successful_run:
 * WARN for a static reference (the corpus is still valid), FAIL for a
 * runtime source (no run means no current data).
 */
export function isStaticReferenceSource(source: RequiredScraperSource): boolean {
  return (
    source.authorityTier === "INTERNAL_REFERENCE" ||
    /reference/i.test(source.scraperId) ||
    source.sourceFamily === "USDA_PROGRAMS" ||
    source.sourceFamily === "SBA_PROGRAMS"
  );
}

export function isHeldForAlpha(source: RequiredScraperSource): boolean {
  return source.freshnessWindow === "HELD_FOR_ALPHA";
}
