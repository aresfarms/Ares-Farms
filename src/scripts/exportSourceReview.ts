/**
 * exportSourceReview — Deliverable A: quick review export for a PENDING source.
 *
 * Writes the ingested records of a pending property source to CSV + JSON review
 * files under review-exports/ so an authorized human reviewer
 * can eyeball the data in minutes — you can't approve data you can't inspect.
 *
 *   npm run review:export-source              (USDA, default)
 *   npm run review:export-source -- --source=hud
 *
 * INTERNAL ARTIFACT — review-exports/ is not under /public and is never served
 * on a public route. Re-run any time after an ingest.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import type { CanonicalProperty } from "../lib/property/propertyTypes";
import { getSourceActivation } from "../lib/property/sourceActivation";
import { USDA_INGEST_PROVENANCE, USDA_RESALE_PROPERTIES } from "../lib/property/usdaResaleGenerated";
import { HUD_INGEST_PROVENANCE, HUD_REO_PROPERTIES } from "../lib/property/hudReoGenerated";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "review-exports");

const SOURCES: Record<string, { records: CanonicalProperty[]; fetchedAt: string }> = {
  usda: { records: USDA_RESALE_PROPERTIES, fetchedAt: USDA_INGEST_PROVENANCE.fetchedAt },
  hud: { records: HUD_REO_PROPERTIES, fetchedAt: HUD_INGEST_PROVENANCE.fetchedAt },
};

const COLUMNS = [
  "state", "county", "town", "property_type", "acreage", "price", "year_built",
  "sqft", "listing_date", "is_current", "exact_address", "photo_filename",
  "listing_id", "program", "description", "source_url", "content_hash",
] as const;

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowFor(c: CanonicalProperty): Record<(typeof COLUMNS)[number], unknown> {
  const r = c.source_records[0];
  return {
    state: r.state,
    county: r.county,
    town: r.town,
    property_type: r.propertyType,
    acreage: r.acreageText ?? "",
    price: r.price ?? "",
    year_built: r.yearBuilt ?? "",
    sqft: r.squareFeet ?? "",
    listing_date: r.listingDate ?? "",
    is_current: r.isCurrent,
    exact_address: r.exactAddress ?? "",
    photo_filename: r.photoFile ?? "",
    listing_id: r.listingId,
    program: r.program ?? "",
    description: r.description ?? "",
    source_url: c.source_url,
    content_hash: c.content_hash,
  };
}

function main(): void {
  const sourceArg = (process.argv.find((a) => a.startsWith("--source="))?.split("=")[1] ?? "usda").toLowerCase();
  const src = SOURCES[sourceArg];
  if (!src) {
    console.error(`Unknown source "${sourceArg}". Known: ${Object.keys(SOURCES).join(", ")}.`);
    process.exit(1);
  }
  const activation = getSourceActivation(sourceArg);
  const records = src.records;
  const date = new Date().toISOString().slice(0, 10);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const base = path.join(OUT_DIR, `${sourceArg}-pending-${date}`);

  // CSV
  const header = COLUMNS.join(",");
  const lines = records.map((c) => {
    const row = rowFor(c);
    return COLUMNS.map((col) => csvCell(row[col])).join(",");
  });
  fs.writeFileSync(`${base}.csv`, [header, ...lines].join("\n") + "\n", "utf8");

  // JSON
  fs.writeFileSync(`${base}.json`, JSON.stringify({
    source: sourceArg,
    sourceName: activation?.sourceName ?? sourceArg,
    activation: activation
      ? { module22: activation.module22.status, module23: activation.module23.status, sourceLive: activation.sourceLive }
      : null,
    fetchedAt: src.fetchedAt,
    count: records.length,
    records: records.map(rowFor),
  }, null, 2) + "\n", "utf8");

  // Summary
  const years = records
    .map((c) => c.source_records[0].listingDate)
    .filter((d): d is string => !!d)
    .map((d) => d.slice(0, 4))
    .sort();
  const states = new Set(records.map((c) => c.source_records[0].state));
  const withPhoto = records.filter((c) => c.source_records[0].photoFile).length;
  const missingRequired = records.filter((c) => {
    const r = c.source_records[0];
    return !r.state || !r.town || r.town === "Unknown" || !r.exactAddress;
  }).length;
  const pct = records.length ? Math.round((withPhoto / records.length) * 100) : 0;
  const dateRange = years.length ? `${years[0]}–${years[years.length - 1]}` : "n/a (no listing dates)";

  console.log(`\nReview export written: ${base}.csv  +  ${base}.json`);
  console.log(
    `  ${activation?.sourceName ?? sourceArg}: ${records.length} records · listing dates ${dateRange} · ` +
    `${states.size} states · ${pct}% with photos · ${missingRequired} rows missing a required field · ` +
    `Module 23: ${activation?.module23.status ?? "?"} · Module 22: ${activation?.module22.status ?? "?"} · ` +
    `SOURCE_LIVE: ${activation?.sourceLive ?? "?"}`,
  );
  console.log("  (internal artifact — review-exports/ is never served publicly)\n");
}

main();
