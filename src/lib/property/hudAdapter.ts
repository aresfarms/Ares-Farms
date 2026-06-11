/**
 * HUD FHA Single-Family REO adapter — SERVER-ONLY (source-intelligence unit).
 *
 * The OFFICIAL HUD open dataset ("FHA Single Family REO Properties For Sale",
 * ArcGIS open data / data.gov, U.S. Government work = public domain) — NOT a
 * scrape of the HUD Home Store portal. `fetchHudReoRecords()` pulls + parses the
 * feed into canonical records. Used by BOTH the one-shot ingest CLI and the
 * daily auto-refresh (single source of truth — no parsing drift).
 *
 * Official feed only; current for-sale REO (DATE_CLOSED/sold excluded).
 * Coordinates captured for provenance, NEVER projected to a public surface.
 */

import { createHash } from "node:crypto";

import type { CanonicalProperty, PropertySourceRecord } from "./propertyTypes";

export const HUD_DATASET_ID = "a54aff75cc0a42de8456cc36a7335663_3";
export const HUD_FEED_URL =
  `https://opendata.arcgis.com/api/v3/datasets/${HUD_DATASET_ID}/downloads/data?format=csv&spatialRefId=4326&where=1%3D1`;
export const HUD_UA = "FurlongPropertyIngest/1.0 (HUD open-data; contact chudson@aresfarmsinc.com)";
export const HUD_SCRAPER_VERSION = "hud-reo-ingest-v0.1.0";
const LISTING_PORTAL = "https://www.hudhomestore.gov/";

// ── Minimal RFC4180 CSV parser (quoted fields/commas/newlines) ───────────────
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch === "\r") { /* skip */ }
    else field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const clean = (v: string | undefined): string => (v ?? "").trim();
const numOrNull = (v: string | undefined): number | null => {
  const n = Number(clean(v));
  return Number.isFinite(n) && n !== 0 ? n : null;
};
const titleCase = (s: string): string => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();

export function hudRowToCanonical(rec: Record<string, string>, fetchedAt: string): CanonicalProperty | null {
  const state = clean(rec.STATE_CODE).toUpperCase();
  if (!/^[A-Z]{2}$/.test(state)) return null;
  if (clean(rec.DATE_CLOSED)) return null; // sold/closed — exclude

  const caseNum = clean(rec.CASE_NUM) || createHash("sha1").update(JSON.stringify(rec)).digest("hex").slice(0, 12);
  const address = clean(rec.ADDRESS) || [clean(rec.STREET_NUM), clean(rec.DIRECTION_PREFIX), clean(rec.STREET_NAME)].filter(Boolean).join(" ").trim();

  const source: PropertySourceRecord = {
    sourceId: "hud",
    listingId: caseNum,
    listingDate: null,
    state,
    county: "Unknown",
    town: titleCase(clean(rec.CITY)) || "Unknown",
    propertyType: "home",
    rawPropertyStyle: "Single-family home",
    exactAddress: address || null,
    zip: clean(rec.DISPLAY_ZIP_CODE) || null,
    price: null,
    bedrooms: null,
    yearBuilt: null,
    squareFeet: null,
    acreageText: null,
    program: null,
    description: clean(rec.REVITE_NAME) ? `Revitalization area: ${clean(rec.REVITE_NAME)}` : null,
    photoFile: null,
    listingUrl: LISTING_PORTAL,
    isCurrent: true,
    latitude: numOrNull(rec.MAP_LATITUDE ?? rec.Y),
    longitude: numOrNull(rec.MAP_LONGITUDE ?? rec.X),
  };

  const keys = [source.state, source.town, source.exactAddress, source.zip, source.listingId];
  const present = keys.filter((v) => v != null && v !== "" && v !== "Unknown").length;
  const confidence = Math.round((present / keys.length) * 100);
  const contentHash = createHash("sha256").update(JSON.stringify(rec)).digest("hex");

  return {
    canonical_property_id: `hud-${caseNum}`,
    source_records: [source],
    parcel_refs: [],
    geospatial_refs: [],
    provenance_chain: [{ source_id: "hud", source_url: HUD_FEED_URL, fetched_at: fetchedAt, content_hash: contentHash }],
    listing_status: "FOR_SALE",
    listing_history: [`HUD REO feed ${fetchedAt.slice(0, 10)}`],
    confidence_score: confidence,
    source_id: "hud",
    source_name: "U.S. HUD — FHA (HUD Home Store)",
    source_url: HUD_FEED_URL,
    fetched_at: fetchedAt,
    content_hash: contentHash,
    classification_level: "PUBLIC",
    replay_ref: `hud-${caseNum}`,
    connector_id: "hud-connector",
    jurisdiction_scope: "federal,state",
    scraper_version: HUD_SCRAPER_VERSION,
  };
}

export interface HudFetchResult {
  records: CanonicalProperty[];
  fetchedAt: string;
  rows: number;
  excludedSold: number;
}

/** Pull + parse the official HUD REO feed into canonical records. Throws on HTTP error. */
export async function fetchHudReoRecords(): Promise<HudFetchResult> {
  const fetchedAt = new Date().toISOString();
  const res = await fetch(HUD_FEED_URL, { headers: { "User-Agent": HUD_UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for HUD feed`);
  const rows = parseCsv(await res.text());
  const header = rows.shift() ?? [];
  const records: CanonicalProperty[] = [];
  const seen = new Set<string>();
  let excludedSold = 0;
  for (const r of rows) {
    if (r.length < 2) continue;
    const rec: Record<string, string> = {};
    header.forEach((h, i) => { rec[h.trim()] = r[i] ?? ""; });
    if (clean(rec.DATE_CLOSED)) { excludedSold++; continue; }
    const c = hudRowToCanonical(rec, fetchedAt);
    if (!c || seen.has(c.canonical_property_id)) continue;
    seen.add(c.canonical_property_id);
    records.push(c);
  }
  records.sort((a, b) => a.source_records[0].state.localeCompare(b.source_records[0].state));
  return { records, fetchedAt, rows: rows.length, excludedSold };
}
