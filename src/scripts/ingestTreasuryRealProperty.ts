/**
 * ingestTreasuryRealProperty — ingest U.S. Treasury (TEOAF) seized Real Property
 * auctions from the OFFICIAL Treasury .gov page (public domain), via the shared
 * source-intelligence adapter (treasuryAdapter.ts).
 *
 *   npm run ingest:treasury           (download + write)
 *   npm run ingest:treasury -- --dry
 *
 * Writes the committed snapshot. The source ships PENDING (Module 22/23) and is
 * NOT shown until a human approves it on the Source Review screen.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { type PublicSafeProperty, toPublicSafe } from "../lib/property/propertyTypes";
import { fetchTreasuryRealProperty, TREASURY_FEED_URL, TREASURY_SCRAPER_VERSION } from "../lib/property/treasuryAdapter";

const DRY = process.argv.includes("--dry");
const ROOT = process.cwd();
const OUT_FULL = path.join(ROOT, "src/lib/property/treasuryGenerated.ts");
const OUT_PUBLIC = path.join(ROOT, "src/lib/property/treasuryPublicSafeGenerated.ts");

async function main(): Promise<void> {
  console.log("\n━━━ ingest:treasury (TEOAF seized real property) ━━━━━━━━━━━━━━━");
  const { records: all, fetchedAt, listed } = await fetchTreasuryRealProperty();
  const byType: Record<string, number> = {};
  for (const c of all) byType[c.source_records[0].propertyType] = (byType[c.source_records[0].propertyType] ?? 0) + 1;
  console.log(`  parsed ${listed} listings → ${all.length} canonical · types: ${JSON.stringify(byType)}`);

  const byState: Record<string, PublicSafeProperty> = {};
  for (const c of all) {
    const st = c.source_records[0].state;
    if (!byState[st]) byState[st] = toPublicSafe(c);
  }

  if (DRY) { console.log("  DRY RUN — no files written.\n"); return; }

  const prov = JSON.stringify({ fetchedAt, feedUrl: TREASURY_FEED_URL, listed, current: all.length, license: "Public domain (U.S. Government work) — U.S. Treasury TEOAF", scraperVersion: TREASURY_SCRAPER_VERSION }, null, 2);

  fs.writeFileSync(OUT_FULL, `/**
 * treasuryGenerated — GENERATED FILE. Do not edit by hand.
 *
 * SERVER-ONLY: U.S. Treasury (TEOAF) seized real-property AUCTION listings,
 * parsed from the official treasury.gov page (public domain). PENDING Module
 * 22/23 — not shown until a human approves it (sourceActivation.ts).
 *
 * Written by src/scripts/ingestTreasuryRealProperty.ts. Re-run \`npm run ingest:treasury\`.
 * Ingested at: ${fetchedAt}
 */

import type { CanonicalProperty } from "./propertyTypes";

export const TREASURY_INGEST_PROVENANCE = ${prov} as const;

export const TREASURY_PROPERTIES: CanonicalProperty[] = ${JSON.stringify(all, null, 2)};
`, "utf-8");

  fs.writeFileSync(OUT_PUBLIC, `/**
 * treasuryPublicSafeGenerated — GENERATED FILE. Do not edit by hand.
 * CLIENT-SAFE projection (no exact address, no lat/long).
 * Ingested at: ${fetchedAt}
 */

import type { PublicSafeProperty } from "./propertyTypes";

export const TREASURY_PUBLIC_SAFE_BY_STATE: Record<string, PublicSafeProperty> = ${JSON.stringify(byState, null, 2)};
`, "utf-8");

  console.log(`\n  Wrote ${OUT_FULL}`);
  console.log(`  Wrote ${OUT_PUBLIC}`);
  console.log("  Source ships PENDING — approve on /source-review to display.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
