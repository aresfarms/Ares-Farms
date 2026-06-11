/**
 * ingestHudReo — Phase 1 property ingestion (HUD FHA Single Family REO).
 *
 * One-shot CLI that pulls the OFFICIAL HUD open dataset and writes the committed
 * snapshot files. The fetch + parse + canonicalization live in the shared
 * source-intelligence adapter (src/lib/property/hudAdapter.ts) — the SAME code
 * the daily auto-refresh uses, so there is no parsing drift between the snapshot
 * and the live refresh.
 *
 *   - src/lib/property/hudReoGenerated.ts        (server-only; address + coords)
 *   - src/lib/property/hudPublicSafeGenerated.ts (client-safe; no address/coords)
 *
 * Run explicitly — never part of `npm run build`:
 *     npm run ingest:hud-reo            (download + write)
 *     npm run ingest:hud-reo -- --dry
 *
 * Coordinates (lat/long) are captured for provenance but NEVER projected to any
 * public surface. Dataset: public domain (U.S. Government work).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { type PublicSafeProperty, toPublicSafe } from "../lib/property/propertyTypes";
import {
  fetchHudReoRecords,
  HUD_FEED_URL,
  HUD_DATASET_ID,
  HUD_SCRAPER_VERSION,
} from "../lib/property/hudAdapter";

const DRY = process.argv.includes("--dry");
const ROOT = process.cwd();
const OUT_FULL = path.join(ROOT, "src/lib/property/hudReoGenerated.ts");
const OUT_PUBLIC = path.join(ROOT, "src/lib/property/hudPublicSafeGenerated.ts");

async function main(): Promise<void> {
  console.log("\n━━━ ingest:hud-reo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const { records: all, fetchedAt, rows, excludedSold } = await fetchHudReoRecords();
  console.log(`  fetched ${rows} rows`);

  const byState: Record<string, PublicSafeProperty> = {};
  for (const c of all) {
    const st = c.source_records[0].state;
    if (!byState[st]) byState[st] = toPublicSafe(c);
  }

  console.log(`  current for-sale: ${all.length}  ·  states: ${Object.keys(byState).length}  ·  excluded (sold): ${excludedSold}`);
  if (DRY) { console.log("  DRY RUN — no files written.\n"); return; }

  const prov = JSON.stringify({ fetchedAt, feedUrl: HUD_FEED_URL, datasetId: HUD_DATASET_ID, rows, current: all.length, license: "Public domain (U.S. Government work)", scraperVersion: HUD_SCRAPER_VERSION }, null, 2);

  fs.writeFileSync(OUT_FULL, `/**
 * hudReoGenerated — GENERATED FILE. Do not edit by hand.
 *
 * SERVER-ONLY: contains exact addresses AND coordinates. Import only from server
 * code. Coordinates are captured for provenance and must NEVER be projected to a
 * public surface. The homepage map imports hudPublicSafeGenerated.ts.
 *
 * Written by src/scripts/ingestHudReo.ts from the official HUD FHA REO open
 * dataset (public domain). Re-run \`npm run ingest:hud-reo\` to refresh.
 *
 * Ingested at: ${fetchedAt}
 * NOT shown publicly until Module 22 + 23 are APPROVED (sourceActivation.ts).
 */

import type { CanonicalProperty } from "./propertyTypes";

export const HUD_INGEST_PROVENANCE = ${prov} as const;

export const HUD_REO_PROPERTIES: CanonicalProperty[] = ${JSON.stringify(all, null, 2)};
`, "utf-8");

  fs.writeFileSync(OUT_PUBLIC, `/**
 * hudPublicSafeGenerated — GENERATED FILE. Do not edit by hand.
 *
 * CLIENT-SAFE: public-safe projection only — NO exact address, NO lat/long.
 * Safe to bundle into the homepage map. Written by src/scripts/ingestHudReo.ts.
 *
 * Ingested at: ${fetchedAt}
 */

import type { PublicSafeProperty } from "./propertyTypes";

export const HUD_PUBLIC_SAFE_BY_STATE: Record<string, PublicSafeProperty> = ${JSON.stringify(byState, null, 2)};
`, "utf-8");

  console.log(`\n  Wrote ${OUT_FULL}`);
  console.log(`  Wrote ${OUT_PUBLIC}`);
  console.log("  Next: npx tsc --noEmit && npm run verify:property\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
