/**
 * ingestUsdaResale — Phase 1 property ingestion (USDA Rural Development / FSA).
 *
 * Pulls the OFFICIAL data.gov open dataset (CC0 public domain) — NOT a scrape of
 * the live portal — parses it into the canonical property shape, and writes
 * src/lib/property/usdaResaleGenerated.ts (full canonical array + a public-safe
 * one-per-state map + provenance).
 *
 * Run explicitly — never part of `npm run build`:
 *     npm run ingest:usda-resale
 *     npm run ingest:usda-resale -- --dry
 *
 * Source feeds (CC0 1.0, https://catalog.data.gov/dataset/usda-rural-development-resale-properties-*):
 *   REO: https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt
 *   FCL: https://www.sc.egov.usda.gov/data/files/Property/FSASFHFOREData9-7-18.txt
 * Pipe-delimited, 58 positional fields, no header. Free-text fields can contain
 * newlines, so records are reassembled by field count (not by physical line).
 *
 * The feeds are a periodic snapshot (last refreshed 2022; listings 2014–2018);
 * each record keeps its own listingDate so display shows vintage honestly.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import {
  type CanonicalProperty,
  type PropertyType,
  type PublicSafeProperty,
  type UsdaSourceRecord,
  computeIsCurrent,
  toPublicSafe,
} from "../lib/property/propertyTypes";

const DRY = process.argv.includes("--dry");
const ROOT = process.cwd();
const OUT_FULL = path.join(ROOT, "src/lib/property/usdaResaleGenerated.ts");
const OUT_PUBLIC = path.join(ROOT, "src/lib/property/usdaPublicSafeGenerated.ts");
const UA = "FurlongPropertyIngest/1.0 (USDA RD open-data; contact chudson@aresfarmsinc.com)";
const SCRAPER_VERSION = "usda-resale-ingest-v0.1.0";
const LISTING_PORTAL = "https://www.resales.usda.gov/resales/public/home";

const FEEDS = [
  { kind: "REO", url: "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt" },
] as const;

// The Foreclosure (FCL) feed is fixed-width columnar (no delimiter) and USDA
// publishes no column spec; parsing it blind would corrupt listings, so it is
// deferred until the layout spec is obtained. Recorded in provenance for honesty.
const DEFERRED_FEEDS = [
  {
    kind: "FCL",
    url: "https://www.sc.egov.usda.gov/data/files/Property/FSASFHFOREData9-7-18.txt",
    reason: "fixed-width columnar with no published column spec — deferred to avoid corrupt parsing",
  },
] as const;

const FIELD_COUNT = 58;

// 0-based field indices (derived from the documented 58-field layout).
const F = {
  salePending: 0,
  reoDate: 7,
  photo: 14,
  bedrooms: 15,
  town: 17,
  yearBuilt: 20,
  style: 21,
  address: 22,
  zip: 23,
  price: 25,
  program: 28,
  acreage: 40,
  propertyId: 51,
  squareFeet: 53,
  description: 54,
  state: 55,
  county: 56,
} as const;

function clean(v: string | undefined): string {
  const s = (v ?? "").trim();
  return s === "" || s.toLowerCase() === "null" || s === "N/A" ? "" : s;
}
function num(v: string | undefined): number | null {
  const s = clean(v).replace(/[^0-9.]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
function mapType(style: string): PropertyType {
  const s = style.toLowerCase();
  if (s.includes("multi")) return "multifamily";
  if (s.includes("farm")) return "farm";
  if (s.includes("land") || s.includes("lot")) return "land";
  return "home"; // USDA SFH REO; "Ranch-Frame" etc. are house styles, not ranches
}
function isoDate(v: string): string | null {
  const s = clean(v);
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * Reassemble REO records. Each record begins with three Y/N flag fields
 * (`^[YN]|[YN]|[YN]|`); free-text descriptions overflow onto continuation lines
 * (which do NOT start with that pattern) and can also contain stray `|`. So:
 *   1. Group physical lines into record buffers by the record-start pattern.
 *   2. Split each buffer by `|`; if it overflows 58 fields (stray pipes in the
 *      description), collapse the surplus back into the description field, keeping
 *      the trailing state/county/id positions intact → exactly 58 fields.
 */
const RECORD_START = /^[YN]\|[YN]\|[YN]\|/;

function parseFeed(content: string): string[][] {
  const lines = content.replace(/^﻿/, "").split(/\r?\n/);
  const buffers: string[] = [];
  for (const line of lines) {
    if (RECORD_START.test(line)) buffers.push(line);
    else if (buffers.length > 0) buffers[buffers.length - 1] += `\n${line}`;
  }
  const records: string[][] = [];
  for (const buf of buffers) {
    const arr = buf.split("|");
    if (arr.length === FIELD_COUNT) {
      records.push(arr);
    } else if (arr.length > FIELD_COUNT) {
      // Collapse stray pipes inside the description (index 54) back together,
      // keeping the last 3 positional fields (state, county, internal id).
      const head = arr.slice(0, F.description);
      const tail = arr.slice(arr.length - 3);
      const description = arr.slice(F.description, arr.length - 3).join("|");
      records.push([...head, description, ...tail]);
    }
    // arr.length < FIELD_COUNT → truncated record; dropped (state-check would fail anyway).
  }
  return records;
}

function toCanonical(
  fields: string[],
  feedKind: string,
  feedUrl: string,
  fetchedAt: string,
): CanonicalProperty | null {
  const state = clean(fields[F.state]).toUpperCase();
  // Misalignment guard: a valid record ends with a 2-letter state code.
  if (!/^[A-Z]{2}$/.test(state)) return null;

  const propertyId = clean(fields[F.propertyId]) || createHash("sha1").update(fields.join("|")).digest("hex").slice(0, 12);
  const rawStyle = clean(fields[F.style]);
  const salePending = clean(fields[F.salePending]).toUpperCase() === "Y";
  const description = clean(fields[F.description]);

  const source: UsdaSourceRecord = {
    sourceId: "usda",
    listingId: propertyId,
    listingDate: isoDate(fields[F.reoDate]),
    state,
    county: titleCase(clean(fields[F.county])) || "Unknown",
    town: titleCase(clean(fields[F.town])) || "Unknown",
    propertyType: mapType(rawStyle),
    rawPropertyStyle: rawStyle || "Single-family home",
    exactAddress: clean(fields[F.address]) || null,
    zip: clean(fields[F.zip]) || null,
    price: num(fields[F.price]),
    bedrooms: num(fields[F.bedrooms]),
    yearBuilt: num(fields[F.yearBuilt]),
    squareFeet: num(fields[F.squareFeet]),
    acreageText: clean(fields[F.acreage]) || null,
    program: clean(fields[F.program]) || null,
    description: description || null,
    photoFile: clean(fields[F.photo]) || null,
    listingUrl: LISTING_PORTAL,
    isCurrent: computeIsCurrent(isoDate(fields[F.reoDate])),
    latitude: null, // USDA feed carries no coordinates
    longitude: null,
  };

  const completenessKeys = [
    source.state, source.county, source.town, source.rawPropertyStyle,
    source.exactAddress, source.zip, source.price, source.listingId,
  ];
  const present = completenessKeys.filter((v) => v != null && v !== "" && v !== "Unknown").length;
  const confidence = Math.round((present / completenessKeys.length) * 100);

  const contentHash = createHash("sha256").update(fields.join("|")).digest("hex");
  const replayRef = `usda-${propertyId}`;

  return {
    canonical_property_id: `usda-${propertyId}`,
    source_records: [source],
    parcel_refs: [],
    geospatial_refs: [], // USDA feed carries no lat/long
    provenance_chain: [
      { source_id: "usda", source_url: feedUrl, fetched_at: fetchedAt, content_hash: contentHash },
    ],
    listing_status: salePending || /sale pending/i.test(description) ? "SALE_PENDING" : "FOR_SALE",
    listing_history: [`${feedKind} snapshot ${source.listingDate ?? "date unknown"}`],
    confidence_score: confidence,
    source_id: "usda",
    source_name: "USDA Rural Development / FSA",
    source_url: feedUrl,
    fetched_at: fetchedAt,
    content_hash: contentHash,
    classification_level: "PUBLIC",
    replay_ref: replayRef,
    connector_id: "usda-connector",
    jurisdiction_scope: "federal,state,county",
    scraper_version: SCRAPER_VERSION,
  };
}

async function fetchFeed(url: string): Promise<{ body: string; lastModified: string | null }> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return { body: await res.text(), lastModified: res.headers.get("last-modified") };
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:usda-resale ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const fetchedAt = new Date().toISOString();
  const all: CanonicalProperty[] = [];
  const seen = new Set<string>();
  const provenance: Array<{ feed: string; url: string; lastModified: string | null; rows: number; parsed: number }> = [];
  let skipped = 0;

  for (const feed of FEEDS) {
    process.stdout.write(`fetching ${feed.kind} … `);
    const { body, lastModified } = await fetchFeed(feed.url);
    const records = parseFeed(body);
    let parsed = 0;
    for (const fields of records) {
      const c = toCanonical(fields, feed.kind, feed.url, fetchedAt);
      if (!c) { skipped++; continue; }
      if (seen.has(c.canonical_property_id)) continue;
      seen.add(c.canonical_property_id);
      all.push(c);
      parsed++;
    }
    provenance.push({ feed: feed.kind, url: feed.url, lastModified, rows: records.length, parsed });
    console.log(`${records.length} records → ${parsed} canonical (lastModified ${lastModified ?? "?"})`);
  }

  all.sort((a, b) => {
    const ar = a.source_records[0], br = b.source_records[0];
    return ar.state === br.state ? b.confidence_score - a.confidence_score : ar.state.localeCompare(br.state);
  });

  // public-safe one-per-state (highest confidence) for the homepage map card.
  const byState: Record<string, PublicSafeProperty> = {};
  for (const c of all) {
    const st = c.source_records[0].state;
    if (!byState[st]) byState[st] = toPublicSafe(c);
  }

  console.log(`\nTotal canonical: ${all.length}  ·  states: ${Object.keys(byState).length}  ·  skipped(malformed): ${skipped}`);

  if (DRY) { console.log("DRY RUN — no file written.\n"); return; }

  const provenanceLiteral = `${JSON.stringify({ fetchedAt, feeds: provenance, deferredFeeds: DEFERRED_FEEDS, license: "CC0 1.0", scraperVersion: SCRAPER_VERSION }, null, 2)} as const`;

  // FULL canonical file (server-only — contains exact addresses; never imported
  // by client components).
  const fullFile = `/**
 * usdaResaleGenerated — GENERATED FILE. Do not edit by hand.
 *
 * SERVER-ONLY: contains exact addresses. Import only from server code (the
 * Property hub detail view). The homepage map imports usdaPublicSafeGenerated.ts.
 *
 * Written by src/scripts/ingestUsdaResale.ts from the official USDA Rural
 * Development resale open dataset on data.gov (CC0 1.0 public domain). The live
 * HTML portal is NOT scraped. Re-run \`npm run ingest:usda-resale\` to refresh.
 *
 * Ingested at: ${fetchedAt}
 * Vintage: USDA last refreshed these feeds in 2022 (listings dated 2014–2018);
 * each record keeps its own listingDate so display shows vintage honestly.
 *
 * NOT shown publicly until Module 22 + Module 23 are APPROVED
 * (src/lib/property/sourceActivation.ts). Until then sourceLive=false.
 */

import type { CanonicalProperty } from "./propertyTypes";

export const USDA_INGEST_PROVENANCE = ${provenanceLiteral};

export const USDA_RESALE_PROPERTIES: CanonicalProperty[] = ${JSON.stringify(all, null, 2)};
`;

  // PUBLIC-SAFE file (client-safe — NO addresses, NO lat/long). One per state.
  const publicFile = `/**
 * usdaPublicSafeGenerated — GENERATED FILE. Do not edit by hand.
 *
 * CLIENT-SAFE: public-safe projection only (state/county/town, type, bands,
 * "why it may fit," citation, vintage). Contains NO exact address and NO
 * lat/long, so it is safe to bundle into the client (homepage map "Possible"
 * card). Written by src/scripts/ingestUsdaResale.ts.
 *
 * Ingested at: ${fetchedAt}
 */

import type { PublicSafeProperty } from "./propertyTypes";

export const USDA_PUBLIC_SAFE_BY_STATE: Record<string, PublicSafeProperty> = ${JSON.stringify(byState, null, 2)};
`;

  fs.writeFileSync(OUT_FULL, fullFile, "utf-8");
  fs.writeFileSync(OUT_PUBLIC, publicFile, "utf-8");
  console.log(`\nWrote ${OUT_FULL}`);
  console.log(`Wrote ${OUT_PUBLIC}`);
  console.log("Next: npx tsc --noEmit && npm run verify:property\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
