/**
 * ingestPropertyOpportunityZones — resolve the Opportunity Zone place-fact for
 * every LIVE public property, frozen into a committed snapshot.
 *
 * This is the build-time / offline resolution that lets the PUBLIC property card
 * render an OZ badge WITHOUT a request-time live fetch (which stays Module 22/23
 * gated, liveFetchAllowed:false). Mirrors the ingestHudReo pattern: pull the
 * official government data offline, freeze the result with provenance + as-of
 * date, and let the surface read the frozen snapshot.
 *
 * Chain (both sources are public-domain U.S. Government work):
 *   property address → U.S. Census batch geocoder (Public_AR_Current) → tract GEOID
 *               → HUD GIS Opportunity_Zones layer (FeatureServer/13) → designated?
 *
 * Writes: src/lib/property/propertyOpportunityZonesGenerated.ts
 *   A map canonical_property_id → { designated, tractId, rural }. Only COARSE
 *   tract geography is stored — never the exact address (that stays in the
 *   server-only property snapshot; the badge surfaces tract-level facts only).
 *
 * Run explicitly — NEVER part of `npm run build`:
 *     npm run ingest:property-oz
 *     npm run ingest:property-oz -- --dry
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { recordsForReview, PROPERTY_SOURCE_IDS } from "../lib/property/propertyData";
import { isSourceLiveRuntime } from "../lib/property/sourceActivationStore";
import {
  CENSUS_GEOCODER_URL,
  HUD_OZ_FEATURE_URL,
  OZ_ADAPTER_VERSION,
} from "../lib/scrapers/adapters/opportunity-zones";

const DRY = process.argv.includes("--dry");
const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/propertyOpportunityZonesGenerated.ts");
const CENSUS_BATCH_URL =
  "https://geocoding.geo.census.gov/geocoder/geographies/addressbatch";

type Row = { id: string; street: string; city: string; state: string; zip: string };
type Resolved = { id: string; geoid: string };

/** Gather every LIVE property with an exact address (server-side). */
function gatherLiveRows(): Row[] {
  const rows: Row[] = [];
  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      const r = c.source_records[0];
      if (!r.exactAddress || !r.town || !r.state) continue;
      rows.push({
        id: c.canonical_property_id,
        street: r.exactAddress,
        city: r.town,
        state: r.state,
        zip: r.zip ?? "",
      });
    }
  }
  return rows;
}

/** CSV line for the Census batch geocoder: id,street,city,state,zip (no header). */
function toCsv(rows: Row[]): string {
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, "'")}"`;
  return rows
    .map((r) => [r.id, esc(r.street), esc(r.city), r.state, r.zip].join(","))
    .join("\n");
}

/** POST one batch (≤10k rows) to the Census geographies batch endpoint. */
async function geocodeBatch(rows: Row[]): Promise<Resolved[]> {
  const csv = toCsv(rows);
  const form = new FormData();
  form.set("benchmark", "Public_AR_Current");
  form.set("vintage", "Current_Current");
  form.set("addressFile", new Blob([csv], { type: "text/csv" }), "addresses.csv");

  const res = await fetch(CENSUS_BATCH_URL, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Census batch HTTP ${res.status}`);
  const text = await res.text();

  // Output CSV columns:
  // id, input, match, matchtype, matched_address, lon,lat, tigerline, side,
  // STATEFP, COUNTYFP, TRACT, BLOCK
  const out: Resolved[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const id = cols[0];
    const matched = cols[2] === "Match" || cols[2] === "Tie";
    if (!matched) continue;
    const state = cols[cols.length - 4];
    const county = cols[cols.length - 3];
    const tract = cols[cols.length - 2];
    if (!state || !county || !tract) continue;
    const geoid = `${state}${county}${tract}`;
    if (geoid.length === 11) out.push({ id, geoid });
  }
  return out;
}

/** Minimal CSV line parser (handles quoted fields with commas). */
function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { cols.push(cur); cur = ""; }
    else cur += ch;
  }
  cols.push(cur);
  return cols;
}

/** Query the HUD OZ layer for which of these GEOIDs are designated (+rural). */
async function lookupDesignated(
  geoids: string[],
): Promise<Map<string, { rural: boolean }>> {
  const designated = new Map<string, { rural: boolean }>();
  const CHUNK = 200;
  for (let i = 0; i < geoids.length; i += CHUNK) {
    const slice = geoids.slice(i, i + CHUNK);
    const inList = slice.map((g) => `'${g}'`).join(",");
    const params = new URLSearchParams({
      where: `GEOID10 IN (${inList})`,
      outFields: "GEOID10,Rural",
      returnGeometry: "false",
      f: "pjson",
    });
    // POST (form-encoded) — a 200-GEOID IN clause overflows the GET URL length.
    const res = await fetch(HUD_OZ_FEATURE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(`HUD OZ batch HTTP ${res.status}`);
    const body = await res.json();
    for (const f of body?.features ?? []) {
      const a = f.attributes as Record<string, string>;
      designated.set(a.GEOID10, { rural: a.Rural === "Y" });
    }
  }
  return designated;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:property-oz ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const rows = gatherLiveRows();
  console.log(`  live properties with an address: ${rows.length}`);
  if (rows.length === 0) {
    console.log("  No live properties — nothing to resolve. (Is a source approved?)\n");
    return;
  }

  // Geocode in batches of 10k (Census limit).
  const resolved: Resolved[] = [];
  for (let i = 0; i < rows.length; i += 10_000) {
    const batch = rows.slice(i, i + 10_000);
    console.log(`  geocoding ${batch.length} addresses (batch ${i / 10_000 + 1})…`);
    resolved.push(...(await geocodeBatch(batch)));
  }
  console.log(`  geocoded to a tract: ${resolved.length} / ${rows.length}`);

  const uniqueGeoids = [...new Set(resolved.map((r) => r.geoid))];
  console.log(`  unique tracts: ${uniqueGeoids.length} — checking OZ designation…`);
  const designated = await lookupDesignated(uniqueGeoids);
  console.log(`  designated tracts among them: ${designated.size}`);

  // Build per-property snapshot. Record EVERY attempted live property so presence
  // = "checked". Geocoded → designation; not-geocoded → checked-but-undetermined
  // (tractId null). A missing badge therefore always means "checked, not
  // designated (or address unresolvable)", never "not checked".
  const byId = new Map<string, { designated: boolean; tractId: string | null; rural: boolean }>();
  for (const r of resolved) {
    const d = designated.get(r.geoid);
    byId.set(r.id, { designated: !!d, tractId: r.geoid, rural: d?.rural ?? false });
  }
  let ungeocoded = 0;
  for (const row of rows) {
    if (byId.has(row.id)) continue;
    byId.set(row.id, { designated: false, tractId: null, rural: false }); // checked; address did not geocode
    ungeocoded += 1;
  }
  const designatedCount = [...byId.values()].filter((v) => v.designated).length;
  console.log(`  properties designated: ${designatedCount} / ${byId.size} (checked: ${byId.size}, of which ${ungeocoded} address-unresolvable)`);

  if (DRY) { console.log("  DRY RUN — no file written.\n"); return; }

  const asOf = new Date().toISOString().slice(0, 10);
  const entries = [...byId.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([id, v]) =>
        `  ${JSON.stringify(id)}: { designated: ${v.designated}, tractId: ${JSON.stringify(v.tractId)}, rural: ${v.rural} },`,
    )
    .join("\n");

  const file = `/**
 * propertyOpportunityZonesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Written by src/scripts/ingestPropertyOpportunityZones.ts. Each entry is the
 * frozen Opportunity Zone place-fact for a LIVE public property, resolved
 * offline through the U.S. Census geocoder + HUD GIS OZ layer (both public
 * domain). The public property card reads THIS snapshot — the request-time live
 * fetch stays Module 22/23 gated (liveFetchAllowed:false).
 *
 * Only COARSE tract geography is stored (tract GEOID), never the exact address.
 * Re-run \`npm run ingest:property-oz\` to refresh.
 */

export const PROPERTY_OZ_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)},
  designationAuthority: "IRC §1400Z-1 (Treasury/IRS-certified Qualified Opportunity Zones)",
  ozSource: "HUD GIS — Opportunity_Zones FeatureServer/13 (GEOID10)",
  geocodeSource: "U.S. Census Bureau batch geocoder (Public_AR_Current / Current_Current)",
  license: "Public domain (U.S. Government work)",
  adapterVersion: ${JSON.stringify(OZ_ADAPTER_VERSION)},
  resolvedProperties: ${byId.size},
  designatedProperties: ${designatedCount},
} as const;

export interface PropertyOzFact {
  designated: boolean;
  tractId: string | null; // null = address did not geocode (checked, undetermined)
  rural: boolean;
}

/**
 * canonical_property_id → frozen OZ place-fact. EVERY live property with an
 * address is present here (presence = checked). tractId null = the address did
 * not geocode, so the tract is undetermined; treated as not-designated for
 * display. A missing id means the property had no usable address at ingest.
 */
export const PROPERTY_OZ_FACTS: Record<string, PropertyOzFact> = {
${entries}
};
`;

  fs.writeFileSync(OUT, file);
  console.log(`  wrote ${path.relative(ROOT, OUT)} (${byId.size} properties, ${designatedCount} designated, as of ${asOf})\n`);
}

main().catch((e) => {
  console.error("ingest:property-oz FAILED —", e);
  process.exit(1);
});
