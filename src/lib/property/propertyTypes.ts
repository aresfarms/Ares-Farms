/**
 * Property data contract — canonical shape + the two public projections.
 *
 * Sources (each gated by its own Module 22/23 in sourceActivation.ts):
 *   - "usda" — USDA Rural Development / FSA resale (data.gov open dataset, CC0).
 *              Historical snapshot (listings 2014–2018): illustrative examples.
 *   - "hud"  — FHA Single Family REO "For Sale" (HUD open data, public domain).
 *              CURRENT for-sale inventory; carries exact address AND lat/long.
 *
 * TWO PROJECTIONS from the SAME record (hard guardrails #1, #2):
 *   - public-safe   → map "Possible" card. State/county/town, type, BANDS only,
 *                     "why it may fit," citation. NO exact address, NO lat/long.
 *   - explore-detail → no-account Property hub. Full detail + exact address +
 *                     listing link + pathway rationale. NEVER lat/long (coords
 *                     are stripped from BOTH projections — more precise than an
 *                     address, and never shown to users).
 *
 * FRAMING (guardrail #1): a property "may fit a USDA/FHA pathway" / is an
 * "illustrative example." It is NEVER "qualified / approved / eligible /
 * guaranteed" — Furlong does not determine buyer eligibility.
 *
 * Edge-safe: types + pure functions only.
 */

export type PropertyType =
  | "home"
  | "farm"
  | "ranch"
  | "multifamily"
  | "land"
  | "commercial"
  | "hospitality"
  | "business"
  | "other";
export type PropertySourceId = "usda" | "hud" | "treasury" | "gsa-realestate" | "vedp";

export const USDA_SOURCE_LABEL =
  "USDA RD resale data — historical snapshot, listings 2014–2018.";
export const HUD_SOURCE_LABEL =
  "FHA Single Family REO — current for-sale inventory (HUD open data).";
export const FRESHNESS_WINDOW_DAYS = 545; // ~18 months

export const SOURCE_CITATION: Record<PropertySourceId, string> = {
  usda: "Source: USDA Rural Development / FSA",
  hud: "Source: U.S. HUD — FHA (HUD Home Store)",
  treasury: "Source: U.S. Treasury — Seized Real Property Auctions (TEOAF)",
  "gsa-realestate": "Source: GSA — Federal surplus real property (realestatesales.gov)",
  vedp: "Source: VEDP — Virginia Economic Development Partnership (vedp.org)",
};

/**
 * GENERIC source portal (the public search site, NOT a listing-specific URL) —
 * safe to surface on the public map "Possible" card because it reveals no exact
 * address. The per-listing URL stays in explore-detail only.
 */
export const SOURCE_PORTAL: Record<PropertySourceId, { url: string; label: string }> = {
  usda: { url: "https://www.resales.usda.gov/resales/public/home", label: "View on USDA resales portal ↗" },
  hud: { url: "https://www.hudhomestore.gov/", label: "View on HUD Home Store ↗" },
  treasury: { url: "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml", label: "View on Treasury auctions ↗" },
  "gsa-realestate": { url: "https://realestatesales.gov/our-listing/", label: "View on GSA realestatesales.gov ↗" },
  vedp: { url: "https://www.vedp.org/site-selection", label: "View on VEDP Site Selection ↗" },
};

export function computeIsCurrent(listingDate: string | null, asOfNow: Date = new Date()): boolean {
  if (!listingDate) return false;
  const t = Date.parse(listingDate);
  if (!Number.isFinite(t)) return false;
  const ageDays = (asOfNow.getTime() - t) / 86_400_000;
  return ageDays >= 0 && ageDays <= FRESHNESS_WINDOW_DAYS;
}

/**
 * Auction sources — their listings are time-bound public auctions, not standing
 * inventory. Freshness is driven by the AUCTION DATE, not a trailing window: an
 * upcoming/just-passed auction is current; once the auction date is past (beyond
 * a short grace) the listing is historical — "verify current availability" —
 * even if it still lingers on the feed or the feed went stale.
 */
export const AUCTION_SOURCES: ReadonlySet<PropertySourceId> = new Set<PropertySourceId>([
  "treasury",
  "gsa-realestate",
]);

/** Days after the auction date a listing is still treated as current (settlement lag). */
export const AUCTION_GRACE_DAYS = 2;

/**
 * Is an auction still current given its auction date? Upcoming or within the
 * grace window → current; past the grace → historical. Returns null when there
 * is no parseable auction date (caller falls back to the snapshot-window rule).
 */
export function computeAuctionCurrent(
  auctionDate: string | null | undefined,
  asOfNow: Date = new Date(),
): boolean | null {
  if (!auctionDate) return null;
  const t = Date.parse(auctionDate);
  if (!Number.isFinite(t)) return null;
  const ageDays = (asOfNow.getTime() - t) / 86_400_000;
  return ageDays <= AUCTION_GRACE_DAYS; // future (negative age) or within grace → current
}

/**
 * The single freshness authority for a canonical record. Auction sources with a
 * known auction date use auction-date freshness; everything else uses the
 * snapshot-window rule against the freshness anchor. Used by BOTH the render
 * projections and the daily refresh so they never disagree.
 */
export function recordIsCurrent(c: CanonicalProperty, asOfNow: Date = new Date()): boolean {
  const r = c.source_records[0];
  if (AUCTION_SOURCES.has(r.sourceId)) {
    const byAuction = computeAuctionCurrent(r.auctionDate, asOfNow);
    if (byAuction !== null) return byAuction;
  }
  return computeIsCurrent(freshnessAnchor(c), asOfNow);
}

/** Short stamp for framing, e.g. "current listing" or "2018 record · historical snapshot". */
export function vintageStamp(asOf: string | null, isCurrent: boolean): string {
  if (isCurrent) return "current listing";
  const year = asOf?.match(/^(\d{4})/)?.[1];
  return year ? `${year} record · historical snapshot` : "historical snapshot";
}

/** One parsed source listing record. Fields a given source lacks are null. */
export interface PropertySourceRecord {
  sourceId: PropertySourceId;
  listingId: string;
  listingDate: string | null; // ISO; for HUD this is the dataset currency anchor
  // ISO auction date for auction sources (Treasury/GSA). Drives auction-date
  // freshness (recordIsCurrent): past this date (beyond grace) → historical.
  // null/absent when the source has no parseable auction date.
  auctionDate?: string | null;
  state: string; // 2-letter
  county: string;
  town: string;
  propertyType: PropertyType;
  rawPropertyStyle: string;
  exactAddress: string | null; // CAPTURED but gated to explore-detail only
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  yearBuilt: number | null;
  squareFeet: number | null;
  acreageText: string | null;
  program: string | null;
  description: string | null;
  photoFile: string | null;
  listingUrl: string;
  isCurrent: boolean; // true → may show as "for sale"; false → historical example
  // Coordinates are CAPTURED for provenance (server-only) and NEVER projected to
  // any public surface. Present for HUD; null for USDA.
  latitude: number | null;
  longitude: number | null;
}

/** Back-compat alias (USDA code referenced this name). */
export type UsdaSourceRecord = PropertySourceRecord;

/** Canonical property — mirrors sourceIntelligenceRuntime.canonicalProperty(). */
export interface CanonicalProperty {
  canonical_property_id: string;
  source_records: PropertySourceRecord[];
  parcel_refs: string[];
  geospatial_refs: string[];
  provenance_chain: Array<{
    source_id: string;
    source_url: string;
    fetched_at: string;
    content_hash: string;
  }>;
  listing_status: string;
  listing_history: string[];
  confidence_score: number;
  source_id: PropertySourceId;
  source_name: string;
  source_url: string;
  fetched_at: string;
  content_hash: string;
  classification_level: "PUBLIC";
  replay_ref: string;
  connector_id: string;
  jurisdiction_scope: string;
  scraper_version: string;
}

/** public-safe projection — safe for the homepage map (no address, no lat/long). */
export interface PublicSafeProperty {
  id: string;
  sourceId: PropertySourceId;
  state: string;
  county: string;
  town: string;
  propertyType: PropertyType;
  acreageBand: string;
  priceBand: string;
  whyMayFit: string;
  sourceCitation: string;
  asOf: string | null;
  isCurrent: boolean;
  vintageStamp: string;
}

/** explore-detail projection — for the no-account Property hub only (no lat/long). */
export interface ExploreDetailProperty extends PublicSafeProperty {
  exactAddress: string | null; // renders ONLY in the explore hub
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  yearBuilt: number | null;
  squareFeet: number | null;
  acreageText: string | null;
  program: string | null;
  description: string | null;
  listingUrl: string;
  pathwayRationale: string;
}

// ── Band helpers ────────────────────────────────────────────────────────────

export function priceBand(price: number | null): string {
  if (price == null || !Number.isFinite(price) || price <= 0) return "Price on request";
  if (price < 100_000) return "Under $100k";
  if (price < 250_000) return "$100k–$250k";
  if (price < 500_000) return "$250k–$500k";
  return "$500k+";
}

export function parseAcres(acreageText: string | null): number | null {
  if (!acreageText) return null;
  const t = acreageText.toLowerCase();
  const m = t.match(/([\d.]+)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  if (t.includes("acre")) return n;
  return null;
}

export function acreageBand(acreageText: string | null): string {
  const acres = parseAcres(acreageText);
  if (acres == null) return "Acreage not specified";
  if (acres < 1) return "Under 1 acre";
  if (acres < 5) return "1–5 acres";
  if (acres < 20) return "5–20 acres";
  return "20+ acres";
}

// NEUTRAL source-description line (2026-06-10 verified-only sweep): states WHAT
// the listing is and routes to a provider — never an illustrative program claim
// ("may fit / may qualify" is banned on every public surface).
function whyMayFit(r: PropertySourceRecord): string {
  if (r.sourceId === "hud") {
    return `HUD-owned (FHA) home in ${r.town}, ${r.state} — a current government listing; providers can help you explore financing.`;
  }
  if (r.sourceId === "treasury") {
    return `U.S. Treasury seized-property auction in ${r.town}, ${r.state} — providers can help you explore financing options.`;
  }
  if (r.sourceId === "gsa-realestate") {
    return `GSA federal surplus property auction in ${r.town}, ${r.state} — providers can help you explore financing options.`;
  }
  return `USDA Rural Development resale property in ${r.county} County, ${r.state} — a historical example; providers can help you explore financing.`;
}

function pathwayRationale(r: PropertySourceRecord): string {
  if (r.sourceId === "hud") {
    return (
      "HUD real-estate-owned (REO) home offered through HUD Home Store. FHA financing (e.g. 203(b) / " +
      "203(k)) may apply to eligible buyers and properties. Buyer eligibility is not determined here — " +
      "confirm with HUD and your lender."
    );
  }
  if (r.sourceId === "treasury") {
    return (
      "Seized/forfeited property sold at public auction by the U.S. Treasury (TEOAF). Sold by online or " +
      "on-site auction to the public; financing depends on the property and use (conventional / SBA for " +
      "commercial). Buyer eligibility and terms are not determined here — confirm at the auction listing."
    );
  }
  if (r.sourceId === "gsa-realestate") {
    return (
      "Federal surplus real property sold by GSA (realestatesales.gov) at public auction to the highest " +
      "bidder. Financing depends on the property and use (conventional / SBA for commercial). Buyer " +
      "eligibility and terms are not determined here — confirm at the auction listing."
    );
  }
  const program = r.program && r.program.trim() ? ` (USDA ${r.program.trim()} program)` : "";
  return (
    `Listed by USDA Rural Development${program}. USDA RD single-family housing programs (e.g. Section 502) ` +
    `serve eligible rural areas; this location may fall within a USDA-eligible zone. Buyer eligibility is ` +
    `not determined here — confirm with USDA.`
  );
}

// ── Projections (NEVER emit latitude/longitude) ──────────────────────────────

/**
 * The date currency is judged against — the per-listing listingDate when the
 * source provides one (USDA), otherwise the SNAPSHOT date (HUD has no per-listing
 * date; its REO feed is current-for-sale inventory captured at fetch time). This
 * makes "current" SELF-CORRECTING: once a snapshot ages past the freshness window
 * without a refresh, currency flips to historical automatically — the site can
 * never keep asserting "current for-sale" over a stale snapshot.
 */
export function freshnessAnchor(c: CanonicalProperty): string | null {
  return c.source_records[0].listingDate ?? c.fetched_at ?? null;
}

export function toPublicSafe(c: CanonicalProperty): PublicSafeProperty {
  const r = c.source_records[0];
  const anchor = freshnessAnchor(c);
  const currentNow = recordIsCurrent(c); // auction-aware; computed live, not the baked flag
  return {
    id: c.canonical_property_id,
    sourceId: r.sourceId,
    state: r.state,
    county: r.county,
    town: r.town,
    propertyType: r.propertyType,
    acreageBand: acreageBand(r.acreageText),
    priceBand: priceBand(r.price),
    whyMayFit: whyMayFit(r),
    sourceCitation: SOURCE_CITATION[r.sourceId],
    asOf: anchor,
    isCurrent: currentNow,
    vintageStamp: vintageStamp(anchor, currentNow),
  };
}

export function toExploreDetail(c: CanonicalProperty): ExploreDetailProperty {
  const r = c.source_records[0];
  return {
    ...toPublicSafe(c),
    exactAddress: r.exactAddress,
    zip: r.zip,
    price: r.price,
    bedrooms: r.bedrooms,
    yearBuilt: r.yearBuilt,
    squareFeet: r.squareFeet,
    acreageText: r.acreageText,
    program: r.program,
    description: r.description,
    listingUrl: r.listingUrl,
    pathwayRationale: pathwayRationale(r),
  };
}
