/**
 * U.S. Treasury Seized Real Property auctions adapter — SERVER-ONLY
 * (source-intelligence unit).
 *
 * Parses the OFFICIAL Treasury (TEOAF) upcoming-auctions page
 * (treasury.gov/auctions/treasury/rp/realprop.shtml) — a U.S. Government work
 * (public domain). NOT the commercial contractor (CWS) site. Covers commercial
 * buildings, warehouses, operating businesses, land, and residences sold at
 * public auction. Used by the ingest CLI and (once approved) the daily refresh.
 *
 * These are AUCTION listings — no fixed list price; the card labels them
 * "Auction" / "starting bid at listing", never "list price".
 */

import { createHash } from "node:crypto";

import { stripHtmlMarkup } from "@/lib/security/htmlText";
import type { CanonicalProperty, PropertySourceRecord, PropertyType } from "./propertyTypes";
import { computeAuctionCurrent } from "./propertyTypes";
import { STATE_NAMES } from "./stateNames";
import { governedFetch } from "@/lib/security/outboundRequestPolicy";

export const TREASURY_FEED_URL = "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml";
export const TREASURY_UA =
  "FurlongPropertyIngest/1.0 (Treasury TEOAF real-property auctions, official .gov; contact chudson@aresfarmsinc.com)";
export const TREASURY_SCRAPER_VERSION = "treasury-rp-ingest-v0.1.0";

const NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([abbr, name]) => [name.toLowerCase(), abbr]),
);

/**
 * Parse Treasury's free-text auction date (e.g. "Thursday, July 30, 2026") to an
 * ISO date "YYYY-MM-DD", or null if not parseable. This date drives auction-date
 * freshness — past it (beyond grace) the listing is relabeled historical.
 */
export function parseTreasuryAuctionDate(text: string | null | undefined): string | null {
  if (!text) return null;
  // Take the "Month DD, YYYY" portion if a weekday prefix is present.
  const m = text.match(/([A-Za-z]+ \d{1,2},? \d{4})/);
  const candidate = m ? m[1] : text;
  const t = Date.parse(candidate);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

/** Treasury's free-text category label → canonical property type. Order matters. */
export function mapTreasuryType(label: string): PropertyType {
  const s = label.toLowerCase();
  if (/hotel|motel|\binn\b|lodg|hospitality/.test(s)) return "hospitality";
  if (/business/.test(s)) return "business";
  if (/commercial|retail|warehouse|office|industrial/.test(s)) return "commercial";
  if (/farm|ranch|agricul/.test(s)) return "farm";
  if (/\bland\b|\blot\b|acre|vacant/.test(s) && !/dwelling|home|building/.test(s)) return "land";
  if (/dwelling|home|condo|single ?family|multi|residence|residential/.test(s)) return "home";
  return "other";
}

function stateAbbr(name: string): string {
  return NAME_TO_ABBR[name.trim().toLowerCase()] ?? "";
}

function stripTags(html: string): string {
  return stripHtmlMarkup(html)
    .replace(/&nbsp;/g, " ")
    .replace(/&plusmn;/g, "+/-")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ");
}

function toCanonical(
  label: string,
  address: string,
  auctionDate: string,
  description: string,
  sale: string,
  fetchedAt: string,
): CanonicalProperty | null {
  // address: "429 Paradise Blvd, Panama City Beach, Florida 32413"
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1]; // "Florida 32413"
  const m = last.match(/^(.+?)\s+(\d{5})(?:-\d{4})?$/);
  const state = stateAbbr(m ? m[1] : last);
  if (!/^[A-Z]{2}$/.test(state)) return null;
  const zip = m ? m[2] : null;
  const town = parts.length >= 3 ? parts[parts.length - 2] : "Unknown";
  const street = parts.slice(0, parts.length - 2).join(", ") || parts[0];
  const id = sale || createHash("sha1").update(address).digest("hex").slice(0, 12);
  const contentHash = createHash("sha256").update(`${label}|${address}|${auctionDate}|${sale}`).digest("hex");
  const auctionIso = parseTreasuryAuctionDate(auctionDate);
  // Auction-date freshness: upcoming/within grace → current; past → historical.
  const auctionCurrent = computeAuctionCurrent(auctionIso, new Date(fetchedAt));

  const source: PropertySourceRecord = {
    sourceId: "treasury",
    listingId: id,
    listingDate: null, // auction date kept in description; freshness uses fetched_at
    auctionDate: auctionIso, // ISO; drives auction-date freshness
    state,
    county: "Unknown",
    town: town || "Unknown",
    propertyType: mapTreasuryType(label),
    rawPropertyStyle: label,
    exactAddress: street || null,
    zip,
    price: null, // auction — no fixed list price
    bedrooms: null,
    yearBuilt: null,
    squareFeet: null,
    acreageText: null,
    program: null,
    description: [description.trim(), auctionDate ? `Online auction: ${auctionDate}` : "", sale ? `Sale #${sale}` : ""]
      .filter(Boolean)
      .join(" · "),
    photoFile: null,
    listingUrl: TREASURY_FEED_URL,
    isCurrent: auctionCurrent ?? true, // auction-date freshness; default current if undated
    latitude: null,
    longitude: null,
  };

  return {
    canonical_property_id: `treasury-${id}`,
    source_records: [source],
    parcel_refs: [],
    geospatial_refs: [],
    provenance_chain: [{ source_id: "treasury", source_url: TREASURY_FEED_URL, fetched_at: fetchedAt, content_hash: contentHash }],
    listing_status: "AUCTION",
    listing_history: [`Treasury TEOAF auctions ${fetchedAt.slice(0, 10)}`],
    confidence_score: 80,
    source_id: "treasury",
    source_name: "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    source_url: TREASURY_FEED_URL,
    fetched_at: fetchedAt,
    content_hash: contentHash,
    classification_level: "PUBLIC",
    replay_ref: `treasury-${id}`,
    connector_id: "treasury-rp-connector",
    jurisdiction_scope: "federal",
    scraper_version: TREASURY_SCRAPER_VERSION,
  };
}

export interface TreasuryFetchResult {
  records: CanonicalProperty[];
  fetchedAt: string;
  listed: number;
}

/** Pull + parse the official Treasury upcoming-auctions page into canonical records. */
export async function fetchTreasuryRealProperty(): Promise<TreasuryFetchResult> {
  const fetchedAt = new Date().toISOString();
  const res = await governedFetch(TREASURY_FEED_URL, {
    headers: { "User-Agent": TREASURY_UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for Treasury auctions feed`);
  const text = stripTags(await res.text());

  // Listing block: CATEGORY : ADDRESS  ONLINE AUCTION DATE: DATE  …desc…  Sale # NUM
  const re =
    /([A-Z][A-Z \/-]{2,40}?)\s*:\s*([^:]+?,\s*[A-Za-z .]+?\s*\d{5})\s+ONLINE AUCTION DAT\s?E:\s*([A-Za-z]+,\s*[A-Za-z]+ \d{1,2},\s*\d{4})([\s\S]*?)(?:Sale\s*#\s*([0-9-]+))/g;
  const records: CanonicalProperty[] = [];
  const seen = new Set<string>();
  let listed = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    listed += 1;
    const c = toCanonical(m[1].trim(), m[2].trim(), m[3].trim(), (m[4] || "").trim(), (m[5] || "").trim(), fetchedAt);
    if (!c || seen.has(c.canonical_property_id)) continue;
    seen.add(c.canonical_property_id);
    records.push(c);
  }
  records.sort((a, b) => a.source_records[0].state.localeCompare(b.source_records[0].state));
  return { records, fetchedAt, listed };
}
