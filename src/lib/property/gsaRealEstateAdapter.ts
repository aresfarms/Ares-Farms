/**
 * GSA federal surplus Real Property adapter — SERVER-ONLY (source-intelligence).
 *
 * Parses the OFFICIAL GSA realestatesales.gov listings page — a U.S. Government
 * source (public domain). Federal surplus real property sold at public auction:
 * commercial buildings, land/lots, residential. Each card carries an explicit
 * type label (Commercial / Land/Lots / Residential), a starting/current bid, an
 * address (state + zip), and the auction method.
 *
 * AUCTION listings WITH a starting bid → labeled "Starting bid: $X".
 */

import { createHash } from "node:crypto";

import type { CanonicalProperty, PropertySourceRecord, PropertyType } from "./propertyTypes";

export const GSA_RE_FEED_URL = "https://realestatesales.gov/our-listing/";
export const GSA_RE_UA =
  "FurlongPropertyIngest/1.0 (GSA realestatesales.gov, official .gov; contact chudson@aresfarmsinc.com)";
export const GSA_RE_SCRAPER_VERSION = "gsa-realestate-ingest-v0.1.0";

/** GSA's explicit type label → canonical property type. */
export function mapGsaType(label: string): PropertyType {
  const s = label.toLowerCase();
  if (/commercial|office|warehouse|industrial|retail/.test(s)) return "commercial";
  if (/land|lot|acre|vacant|parcel/.test(s)) return "land";
  if (/residential|home|condo|dwelling/.test(s)) return "home";
  return "other";
}

function strip(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/[ \t\r\n]+/g, " ")
    .trim();
}

function cardToCanonical(block: string, fetchedAt: string): CanonicalProperty | null {
  const idM = block.match(/property_id=(\d+)/);
  if (!idM) return null;
  const id = idM[1];
  const text = strip(block);

  const addrM = text.match(/([^,<>|]{3,80}),\s*([A-Z]{2})\s+(\d{5})/);
  if (!addrM) return null;
  const blob = addrM[1].trim().replace(/\s+/g, " ");
  const state = addrM[2];
  const zip = addrM[3];
  // City ≈ the last 1–2 Title-Case words of the street+city blob, with a leading
  // street suffix / direction stripped (the blob runs street and city together).
  const cityM = blob.match(/([A-Z][a-zA-Z.'-]+)(?:\s([A-Z][a-zA-Z.'-]+))?$/);
  let town = cityM ? [cityM[1], cityM[2]].filter(Boolean).join(" ") : "Unknown";
  town = town.replace(
    /^(N|S|E|W|NE|NW|SE|SW|North|South|East|West|St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Lane|Ln|Way|Ct|Court|Pl|Place|Cir|Circle|Trail|Hwy|Highway)\.?\s+/i,
    "",
  ).trim() || "Unknown";

  const typeM = text.match(/\b(Commercial|Land\/Lots|Land|Residential)\b/);
  const gsaType = typeM ? typeM[1] : "";
  const bidM = text.match(/(?:Starting|Current) Bid\s*\$([\d,]+)/i);
  const price = bidM ? Number(bidM[1].replace(/,/g, "")) : null;
  const auctionM = text.match(/(Online Auction|Sealed Bid Auction)/i);
  const contentHash = createHash("sha256").update(`${id}|${blob}|${state}|${price}|${gsaType}`).digest("hex");

  const source: PropertySourceRecord = {
    sourceId: "gsa-realestate",
    listingId: id,
    listingDate: null, // auction; freshness uses fetched_at (snapshot)
    // GSA's listing page exposes no auction/close DATE (only the auction method),
    // so date-based relabeling isn't possible here — freshness for GSA relies on
    // the daily re-pull: concluded auctions drop off the official feed.
    auctionDate: null,
    state,
    county: "Unknown",
    town: town || "Unknown",
    propertyType: mapGsaType(gsaType),
    rawPropertyStyle: gsaType || "GSA real property",
    exactAddress: blob || null,
    zip,
    price: price && price > 0 ? price : null, // starting/current bid
    bedrooms: null,
    yearBuilt: null,
    squareFeet: null,
    acreageText: null,
    program: null,
    description: [gsaType, auctionM ? auctionM[1] : "", `GSA listing #${id}`].filter(Boolean).join(" · "),
    photoFile: null,
    listingUrl: `https://realestatesales.gov/asset-details/?property_id=${id}`,
    isCurrent: true,
    latitude: null,
    longitude: null,
  };

  return {
    canonical_property_id: `gsa-re-${id}`,
    source_records: [source],
    parcel_refs: [],
    geospatial_refs: [],
    provenance_chain: [{ source_id: "gsa-realestate", source_url: GSA_RE_FEED_URL, fetched_at: fetchedAt, content_hash: contentHash }],
    listing_status: "AUCTION",
    listing_history: [`GSA realestatesales.gov ${fetchedAt.slice(0, 10)}`],
    confidence_score: 80,
    source_id: "gsa-realestate",
    source_name: "GSA — Federal surplus real property (realestatesales.gov)",
    source_url: GSA_RE_FEED_URL,
    fetched_at: fetchedAt,
    content_hash: contentHash,
    classification_level: "PUBLIC",
    replay_ref: `gsa-re-${id}`,
    connector_id: "gsa-realestate-connector",
    jurisdiction_scope: "federal",
    scraper_version: GSA_RE_SCRAPER_VERSION,
  };
}

export interface GsaReFetchResult {
  records: CanonicalProperty[];
  fetchedAt: string;
  listed: number;
}

/** Pull + parse the official GSA realestatesales.gov listings into canonical records. */
export async function fetchGsaRealEstate(): Promise<GsaReFetchResult> {
  const fetchedAt = new Date().toISOString();
  const res = await fetch(GSA_RE_FEED_URL, { headers: { "User-Agent": GSA_RE_UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for GSA realestatesales feed`);
  const html = await res.text();

  // Slice into per-listing card blocks at each property_id anchor.
  const anchors: number[] = [];
  const re = /asset-details\/\?property_id=\d+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) anchors.push(m.index);

  const records: CanonicalProperty[] = [];
  const seen = new Set<string>();
  let listed = 0;
  for (let i = 0; i < anchors.length; i++) {
    const block = html.slice(anchors[i], anchors[i + 1] ?? anchors[i] + 4000);
    listed += 1;
    const c = cardToCanonical(block, fetchedAt);
    if (!c || seen.has(c.canonical_property_id)) continue;
    seen.add(c.canonical_property_id);
    records.push(c);
  }
  records.sort((a, b) => a.source_records[0].state.localeCompare(b.source_records[0].state));
  return { records, fetchedAt, listed };
}
