/**
 * ingestGsaRealEstate — ingest GSA federal surplus Real Property from the OFFICIAL
 * realestatesales.gov listings page (public domain), via the shared adapter.
 *
 *   npm run ingest:gsa-realestate
 *   npm run ingest:gsa-realestate -- --dry
 *
 * Ships PENDING (Module 22/23) — not shown until approved on Source Review.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { type PublicSafeProperty, toPublicSafe } from "../lib/property/propertyTypes";
import { fetchGsaRealEstate, GSA_RE_FEED_URL, GSA_RE_SCRAPER_VERSION } from "../lib/property/gsaRealEstateAdapter";

const DRY = process.argv.includes("--dry");
const ROOT = process.cwd();
const OUT_FULL = path.join(ROOT, "src/lib/property/gsaRealEstateGenerated.ts");
const OUT_PUBLIC = path.join(ROOT, "src/lib/property/gsaRealEstatePublicSafeGenerated.ts");

async function main(): Promise<void> {
  console.log("\n━━━ ingest:gsa-realestate (federal surplus real property) ━━━━━━");
  const { records: all, fetchedAt, listed } = await fetchGsaRealEstate();
  const byType: Record<string, number> = {};
  for (const c of all) byType[c.source_records[0].propertyType] = (byType[c.source_records[0].propertyType] ?? 0) + 1;
  console.log(`  parsed ${listed} listings → ${all.length} canonical · types: ${JSON.stringify(byType)}`);

  const byState: Record<string, PublicSafeProperty> = {};
  for (const c of all) {
    const st = c.source_records[0].state;
    if (!byState[st]) byState[st] = toPublicSafe(c);
  }

  if (DRY) { console.log("  DRY RUN — no files written.\n"); return; }

  const prov = JSON.stringify({ fetchedAt, feedUrl: GSA_RE_FEED_URL, listed, current: all.length, license: "Public domain (U.S. Government work) — GSA realestatesales.gov", scraperVersion: GSA_RE_SCRAPER_VERSION }, null, 2);

  fs.writeFileSync(OUT_FULL, `/**
 * gsaRealEstateGenerated — GENERATED FILE. Do not edit by hand.
 *
 * SERVER-ONLY: GSA federal surplus real-property AUCTION listings, parsed from
 * the official realestatesales.gov page (public domain). PENDING Module 22/23.
 *
 * Written by src/scripts/ingestGsaRealEstate.ts. Re-run \`npm run ingest:gsa-realestate\`.
 * Ingested at: ${fetchedAt}
 */

import type { CanonicalProperty } from "./propertyTypes";

export const GSA_RE_INGEST_PROVENANCE = ${prov} as const;

export const GSA_RE_PROPERTIES: CanonicalProperty[] = ${JSON.stringify(all, null, 2)};
`, "utf-8");

  fs.writeFileSync(OUT_PUBLIC, `/**
 * gsaRealEstatePublicSafeGenerated — GENERATED FILE. Do not edit by hand.
 * CLIENT-SAFE projection (no exact address, no lat/long).
 * Ingested at: ${fetchedAt}
 */

import type { PublicSafeProperty } from "./propertyTypes";

export const GSA_RE_PUBLIC_SAFE_BY_STATE: Record<string, PublicSafeProperty> = ${JSON.stringify(byState, null, 2)};
`, "utf-8");

  console.log(`\n  Wrote ${OUT_FULL}`);
  console.log("  Source ships PENDING — approve on /source-review to display.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
