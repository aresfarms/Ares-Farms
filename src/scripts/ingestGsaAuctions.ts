/**
 * ingestGsaAuctions — equipment source: GSA Auctions (federal personal property).
 *
 * Pulls the OFFICIAL GSA Auctions API (api.gsa.gov, U.S. Government work = public
 * domain). The API 303-redirects to a signed S3 active-auctions.json; node fetch
 * follows it. Parses into the equipment canonical shape and writes
 * src/lib/equipment/gsaAuctionsGenerated.ts + a review-exports CSV.
 *
 *   npm run ingest:gsa-auctions
 *   GSA_API_KEY=<key> npm run ingest:gsa-auctions   (production: real api.data.gov key)
 *
 * Default api_key is DEMO_KEY (rate-limited; fine for one fetch). NOT shown
 * publicly — the equipment lane is deferred and the source ships SOURCE_LIVE off
 * pending Module 22/23 approval.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { categorize, type GsaAuctionItem } from "../lib/equipment/equipmentTypes";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/equipment/gsaAuctionsGenerated.ts");
const REVIEW_DIR = path.join(ROOT, "review-exports");
const UA = "FurlongEquipmentIngest/1.0 (GSA Auctions open API; contact chudson@aresfarmsinc.com)";
const API_KEY = process.env.GSA_API_KEY || "DEMO_KEY";
const ENDPOINT = `https://api.gsa.gov/assets/gsaauctions/v2/auctions?api_key=${API_KEY}&format=JSON`;
const SCRAPER_VERSION = "gsa-auctions-ingest-v0.1.0";

function clean(v: unknown): string {
  return v == null ? "" : String(v).trim();
}
function num(v: unknown): number | null {
  const n = Number(clean(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
function zip5(v: unknown): string | null {
  const m = clean(v).match(/\d{5}/);
  return m ? m[0] : null;
}
function isoDate(v: unknown): string | null {
  const m = clean(v).match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}
function stripHtml(v: unknown): string {
  return clean(v).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:gsa-auctions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const fetchedAt = new Date().toISOString();
  const res = await fetch(ENDPOINT, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from GSA Auctions API (key=${API_KEY === "DEMO_KEY" ? "DEMO_KEY (rate-limited)" : "custom"})`);
  const data = (await res.json()) as { Results?: Record<string, unknown>[] };
  const rows = Array.isArray(data.Results) ? data.Results : [];
  console.log(`  fetched ${rows.length} auction lots`);

  const today = fetchedAt.slice(0, 10);
  const items: GsaAuctionItem[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const saleNo = clean(r.saleNo);
    const lotNo = clean(r.lotNo) || "0";
    if (!saleNo) continue;
    const id = `${saleNo}-${lotNo}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const itemName = clean(r.itemName) || "Federal surplus item";
    const auctionEnd = isoDate(r.aucEndDt);
    const status = clean(r.auctionStatus) || null;
    const contentHash = createHash("sha256").update(JSON.stringify(r)).digest("hex");
    items.push({
      sourceId: "gsa-auctions",
      saleNo,
      lotNo,
      itemName,
      category: categorize(itemName),
      agencyName: clean(r.agencyName) || null,
      bureauName: clean(r.bureauName) || null,
      city: clean(r.propertyCity) || null,
      state: (clean(r.propertyState).toUpperCase().match(/^[A-Z]{2}$/) ? clean(r.propertyState).toUpperCase() : null),
      zip: zip5(r.propertyZip),
      auctionStart: isoDate(r.aucStartDt),
      auctionEnd,
      auctionStatus: status,
      highBid: num(r.highBidAmount),
      reserve: num(r.reserve),
      itemUrl: clean(r.itemDescURL) || null,
      imageUrl: clean(r.imageURL) || null,
      isCurrent: status === "active" || status === "preview" || (!!auctionEnd && auctionEnd >= today),
      contentHash,
      fetchedAt,
      sourceUrl: "https://api.gsa.gov/assets/gsaauctions/v2/auctions",
    });
  }

  // Generated file (server-side; not displayed yet).
  fs.writeFileSync(OUT, `/**
 * gsaAuctionsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Written by src/scripts/ingestGsaAuctions.ts from the official GSA Auctions API
 * (public domain, U.S. Government work). Federal PERSONAL property (equipment,
 * vehicles, vessels, machinery) — for a FUTURE Farms/Equipment lane. Ships gated
 * (SOURCE_LIVE off) pending Module 22/23 approval; not displayed publicly.
 *
 * Ingested at: ${fetchedAt}
 */

import type { GsaAuctionItem } from "./equipmentTypes";

export const GSA_AUCTIONS_PROVENANCE = ${JSON.stringify({ fetchedAt, endpoint: "https://api.gsa.gov/assets/gsaauctions/v2/auctions", license: "Public domain (U.S. Government work)", scraperVersion: SCRAPER_VERSION, count: items.length }, null, 2)} as const;

export const GSA_AUCTIONS_ITEMS: GsaAuctionItem[] = ${JSON.stringify(items, null, 2)};
`, "utf8");

  // Review CSV (internal artifact).
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  const cols = ["sale_no", "lot_no", "item_name", "category", "agency", "city", "state", "zip", "auction_start", "auction_end", "status", "high_bid", "is_current", "item_url"];
  const csvCell = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = items.map((i) => [i.saleNo, i.lotNo, i.itemName, i.category, i.agencyName, i.city, i.state, i.zip, i.auctionStart, i.auctionEnd, i.auctionStatus, i.highBid, i.isCurrent, i.itemUrl].map(csvCell).join(","));
  fs.writeFileSync(path.join(REVIEW_DIR, `gsa-auctions-pending-${today}.csv`), [cols.join(","), ...lines].join("\n") + "\n", "utf8");

  // Summary.
  const states = new Set(items.map((i) => i.state).filter(Boolean));
  const current = items.filter((i) => i.isCurrent).length;
  const byCat = items.reduce<Record<string, number>>((m, i) => ((m[i.category] = (m[i.category] ?? 0) + 1), m), {});
  console.log(`\n  Wrote ${OUT}`);
  console.log(`  Wrote review-exports/gsa-auctions-pending-${today}.csv`);
  console.log(`  ${items.length} lots · ${current} current · ${states.size} states · categories: ${Object.entries(byCat).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  console.log("  (equipment source — SOURCE_LIVE off pending Module 22/23; no lane displayed yet)\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
