/**
 * ingestPropertyFloodHistoric — resolve FEMA flood-zone + National Register
 * place-facts for every LIVE property, frozen into a committed snapshot.
 *
 * Coordinates: HUD records carry server-only lat/long (provenance fields, never
 * projected publicly); other sources are batch-geocoded once via the shared
 * Census geocoder. Each point is then queried against:
 *   - FEMA NFHL layer 28 (flood zone; SFHA flag) — informational fact
 *   - NPS National Register polygons — rehab-credit property-side gate
 *
 * Writes src/lib/property/propertyFloodHistoricGenerated.ts. Snapshot-only
 * render (same rule as OZ/HUBZone). Run: npm run ingest:property-flood-historic
 * [-- --limit N] (point queries are sequential; default cap keeps runs short —
 * remaining properties resolve on subsequent runs; coverage is reported).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { PROPERTY_SOURCE_IDS, recordsForReview } from "../lib/property/propertyData";
import { isSourceLiveRuntime } from "../lib/property/sourceActivationStore";
import { geocodeToCensusTract } from "../lib/scrapers/adapters/censusGeocoder";
import {
  queryFloodZone, queryNationalRegister, FEMA_HISTORIC_ADAPTER_VERSION,
} from "../lib/scrapers/adapters/femaHistoric";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/propertyFloodHistoricGenerated.ts");
const limitArg = process.argv.find((a) => a.startsWith("--limit"));
const LIMIT = limitArg ? Number(process.argv[process.argv.indexOf(limitArg) + 1] ?? "150") : 150;

interface Fact {
  floodZone: string | null;
  isSfha: boolean;
  inNationalRegisterArea: boolean;
  historicName: string | null;
}

/** Existing snapshot (resumable — already-resolved ids are skipped). */
function readExisting(): Record<string, Fact> {
  try {
    const src = fs.readFileSync(OUT, "utf8");
    const m = src.match(/PROPERTY_FLOOD_HISTORIC_FACTS[^=]*=\s*(\{[\s\S]*?\n\});/);
    if (m) return Function(`return ${m[1]}`)() as Record<string, Fact>;
  } catch {}
  return {};
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:property-flood-historic ━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const existing = readExisting();
  const points: { id: string; lon: number; lat: number }[] = [];
  let needGeocode: { id: string; street: string; city: string; state: string; zip: string }[] = [];

  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      if (existing[c.canonical_property_id]) continue; // resumable
      const r = c.source_records[0];
      if (typeof r.latitude === "number" && typeof r.longitude === "number") {
        points.push({ id: c.canonical_property_id, lon: r.longitude, lat: r.latitude });
      } else if (r.exactAddress && r.town && r.state) {
        needGeocode.push({ id: c.canonical_property_id, street: r.exactAddress, city: r.town, state: r.state, zip: r.zip ?? "" });
      }
    }
  }
  console.log(`  already resolved: ${Object.keys(existing).length} · with stored coords: ${points.length} · need geocode: ${needGeocode.length} · this run cap: ${LIMIT}`);

  // Geocode the coordless ones (single lookups; bounded by LIMIT budget).
  needGeocode = needGeocode.slice(0, Math.max(0, LIMIT - Math.min(points.length, LIMIT)));
  for (const g of needGeocode) {
    const geo = await geocodeToCensusTract(g.street, g.city, g.state, g.zip).catch(() => null);
    if (geo?.lat && geo?.lon) points.push({ id: g.id, lon: Number(geo.lon), lat: Number(geo.lat) });
  }

  const batch = points.slice(0, LIMIT);
  const facts: Record<string, Fact> = { ...existing };
  let sfha = 0, historic = 0, done = 0;
  for (const p of batch) {
    const [flood, nr] = await Promise.all([
      queryFloodZone(p.lon, p.lat).catch(() => null),
      queryNationalRegister(p.lon, p.lat).catch(() => null),
    ]);
    facts[p.id] = {
      floodZone: flood?.floodZone ?? null,
      isSfha: flood?.isSfha ?? false,
      inNationalRegisterArea: nr?.inNationalRegisterArea ?? false,
      historicName: nr?.resourceName ?? null,
    };
    if (facts[p.id].isSfha) sfha += 1;
    if (facts[p.id].inNationalRegisterArea) historic += 1;
    done += 1;
    if (done % 25 === 0) console.log(`  …${done}/${batch.length}`);
  }
  console.log(`  resolved this run: ${done} · SFHA: ${sfha} · National Register: ${historic} · total now: ${Object.keys(facts).length}`);

  const asOf = new Date().toISOString().slice(0, 10);
  const entries = Object.entries(facts).sort(([a], [b]) => a.localeCompare(b))
    .map(([id, f]) => `  ${JSON.stringify(id)}: { floodZone: ${f.floodZone ? JSON.stringify(f.floodZone) : "null"}, isSfha: ${f.isSfha}, inNationalRegisterArea: ${f.inNationalRegisterArea}, historicName: ${f.historicName ? JSON.stringify(f.historicName) : "null"} },`)
    .join("\n");

  fs.writeFileSync(OUT, `/**
 * propertyFloodHistoricGenerated — GENERATED FILE. Do not edit by hand.
 *
 * FEMA flood-zone + National Register place-facts per LIVE property, resolved
 * offline (FEMA NFHL layer 28; NPS NRHP polygons; Census geocoder for points).
 * Public render reads THIS snapshot. Re-run \`npm run ingest:property-flood-historic\`
 * to extend coverage (resumable; presence = checked).
 */

export const PROPERTY_FLOOD_HISTORIC_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)},
  floodSource: "FEMA National Flood Hazard Layer (hazards.fema.gov, layer 28)",
  historicSource: "NPS National Register of Historic Places (mapservices.nps.gov)",
  license: "Public domain (U.S. Government work)",
  adapterVersion: ${JSON.stringify(FEMA_HISTORIC_ADAPTER_VERSION)},
  resolvedProperties: ${Object.keys(facts).length},
  sfhaCount: ${Object.values(facts).filter((f) => f.isSfha).length},
  nationalRegisterCount: ${Object.values(facts).filter((f) => f.inNationalRegisterArea).length},
} as const;

export interface PropertyFloodHistoricFact {
  floodZone: string | null;
  isSfha: boolean;
  inNationalRegisterArea: boolean;
  historicName: string | null;
}

export const PROPERTY_FLOOD_HISTORIC_FACTS: Record<string, PropertyFloodHistoricFact> = {
${entries}
};
`, "utf8");
  console.log(`  wrote ${path.relative(ROOT, OUT)} (as of ${asOf})\n`);
}

main().catch((e) => { console.error("ingest:property-flood-historic FAILED —", e); process.exit(1); });
