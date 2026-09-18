/**
 * ingestVedpProperties — Virginia Economic Development Partnership "Available
 * Properties" + "Available Sites" open-data ingest (founder direction
 * 2026-07-17: fill the commercial/land gap with legal sources; VEDP publishes a
 * genuine ArcGIS open-data service, unlike most states' vendor-locked
 * site-selector tools).
 *
 * Source: VEDP OpenData ArcGIS service (maps.vedp.org — layer 0 = buildings,
 * layer 1 = sites), listed on gis.vedp.org with a disclaimer-style license
 * ("general information purposes", no warranty). No reuse restriction stated;
 * VEDP publishes contacts for custom data. COUNSEL FLAG: confirm reuse with
 * VEDP (ssanders@vedp.org / mmende@vedp.org) as part of Module 23 before any
 * display — this ingest writes the snapshot only.
 *
 * We keep ONLY for-sale records (Sale=1; founder: for-sale focus), and only a
 * compact projection of the 136 published fields.
 *
 *     npm run ingest:vedp-properties
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/vedpPropertiesGenerated.ts");
const UA = "FurlongPropertyIngest/1.0 (VEDP open data; contact chudson@aresfarmsinc.com)";
const SERVICE = "https://maps.vedp.org/arcgis/rest/services/OpenData/PropertiesSites/MapServer";

const LAYERS = [
  { id: 0, kind: "building" as const, label: "Available Properties (buildings)" },
  { id: 1, kind: "site" as const, label: "Available Sites (land)" },
];

const PAGE = 500;

export interface VedpRecord {
  id: string;
  kind: "building" | "site";
  name: string | null;
  propertyType: string | null;
  address: string | null;
  city: string | null;
  /** County/city FIPS as published (Virginia localities). */
  fips: string | null;
  zip: string | null;
  state: "VA";
  acreage: number | null;
  zoning: string | null;
  sale: boolean;
  lease: boolean;
  dateModified: string | null;
  latitude: number | null;
  longitude: number | null;
}

type ArcFeature = { attributes: Record<string, unknown>; geometry?: { x?: number; y?: number } };

const s = (v: unknown): string | null => {
  const t = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  return t === "" || t.toLowerCase() === "none" || t.toLowerCase() === "null" ? null : t;
};
const n = (v: unknown): number | null => {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) && x > 0 ? x : null;
};

async function fetchLayer(layerId: number): Promise<ArcFeature[]> {
  const out: ArcFeature[] = [];
  let offset = 0;
  for (;;) {
    const url =
      `${SERVICE}/${layerId}/query?where=${encodeURIComponent("Sale=1")}` +
      `&outFields=*&outSR=4326&f=json&resultOffset=${offset}&resultRecordCount=${PAGE}`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`VEDP layer ${layerId} HTTP ${res.status}`);
    const json = (await res.json()) as { features?: ArcFeature[]; exceededTransferLimit?: boolean; error?: unknown };
    if (json.error) throw new Error(`VEDP layer ${layerId} error: ${JSON.stringify(json.error)}`);
    const feats = json.features ?? [];
    out.push(...feats);
    if (feats.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

function toRecord(f: ArcFeature, kind: "building" | "site", index: number): VedpRecord {
  const a = f.attributes;
  const objectId = s(a.OBJECTID) ?? s(a.ObjectId) ?? String(index);
  return {
    id: `vedp-${kind}-${objectId}`,
    kind,
    name: s(a.Name),
    propertyType: s(a.PropertyType) ?? (kind === "site" ? "Site (land)" : null),
    address: s(a.Address),
    city: s(a.City) ?? s(a.LocalityName),
    fips: s(a.FIPS),
    zip: s(a.Zip),
    state: "VA",
    acreage: n(a.BuildingSiteAcreage) ?? n(a.TotalAcreage) ?? n(a.Acreage),
    zoning: s(a.ZoningClassification),
    sale: true, // query filters Sale=1
    lease: a.Lease === 1 || a.Lease === "1",
    dateModified: s(a.DateModified),
    latitude: typeof f.geometry?.y === "number" ? f.geometry.y : null,
    longitude: typeof f.geometry?.x === "number" ? f.geometry.x : null,
  };
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:vedp-properties ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const fetchedAt = new Date().toISOString();
  const all: VedpRecord[] = [];
  const provenance: Array<{ layer: string; forSale: number }> = [];

  for (const layer of LAYERS) {
    process.stdout.write(`  ${layer.label} … `);
    const feats = await fetchLayer(layer.id);
    const records = feats.map((f, i) => toRecord(f, layer.kind, i));
    all.push(...records);
    provenance.push({ layer: layer.label, forSale: records.length });
    console.log(`${records.length} for-sale records`);
  }

  all.sort((a, b) => a.id.localeCompare(b.id));

  fs.writeFileSync(
    OUT,
    `/**
 * vedpPropertiesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Virginia Economic Development Partnership "Available Properties" (buildings)
 * + "Available Sites" (land) — FOR-SALE records only (Sale=1), compact
 * projection. Official VEDP ArcGIS open-data service.
 * Re-run: npm run ingest:vedp-properties
 *
 * NOT displayed anywhere until Module 23 (legal — includes a reuse confirm
 * with VEDP) + Module 22 (activation) clear. Snapshot only.
 */

export const VEDP_INGEST_PROVENANCE = {
  fetchedAt: ${JSON.stringify(fetchedAt)},
  source: "VEDP OpenData ArcGIS (maps.vedp.org PropertiesSites MapServer)",
  license: "VEDP open-data portal, disclaimer-style terms; reuse confirmation with VEDP pending (Module 23)",
  layers: ${JSON.stringify(provenance)},
} as const;

export interface VedpRecord {
  id: string;
  kind: "building" | "site";
  name: string | null;
  propertyType: string | null;
  address: string | null;
  city: string | null;
  fips: string | null;
  zip: string | null;
  state: "VA";
  acreage: number | null;
  zoning: string | null;
  sale: boolean;
  lease: boolean;
  dateModified: string | null;
  latitude: number | null;
  longitude: number | null;
}

// JSON.parse of a string literal — 1,700+ object literals exceed tsc's union
// inference (TS2590); parsing at module load keeps the type simple and fast.
export const VEDP_PROPERTIES: VedpRecord[] = JSON.parse(${JSON.stringify(JSON.stringify(all))});
`,
    "utf8",
  );
  console.log(`\n  total for-sale: ${all.length} → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => { console.error("ingest:vedp-properties FAILED —", error); process.exit(1); });
