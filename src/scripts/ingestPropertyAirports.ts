/**
 * ingestPropertyAirports — nearest airports per property, frozen into
 * committed snapshots (founder direction 2026-07-17: "under the flight path
 * of major airlines" or an airport next door matters BEFORE you visit —
 * convenience and noise both, commercial or residential).
 *
 * Source: OurAirports open dataset (davidmegginson.github.io/ourairports-data)
 * — public domain (CC0), no key. US large + medium airports.
 *
 *   npm run ingest:property-airports
 *
 * Emits TWO files:
 *   - usAirportsGenerated: the airport table (~900 rows) so imported-address
 *     briefs can compute nearest airports live from a geocode;
 *   - propertyAirportsGenerated: precomputed nearest-airport facts for the
 *     canonical inventory (coords from HUD records; Census geocode fallback).
 *
 * Distances are straight-line miles — drive time is a map-app check.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { parseCsv } from "../lib/property/hudAdapter";
import { PROPERTY_SOURCE_IDS, recordsForReview } from "../lib/property/propertyData";
import { isSourceLiveRuntime } from "../lib/property/sourceActivationStore";
import { geocodeToCensusTract } from "../lib/scrapers/adapters/censusGeocoder";

const ROOT = process.cwd();
const OUT_TABLE = path.join(ROOT, "src/lib/property/usAirportsGenerated.ts");
const OUT_PROPS = path.join(ROOT, "src/lib/property/propertyAirportsGenerated.ts");
const CSV_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";

interface Airport {
  name: string;
  lat: number;
  lon: number;
  /** "major" (large_airport) | "regional" (medium_airport). */
  size: string;
}

function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function nearest(airports: Airport[], lat: number, lon: number, filter?: (a: Airport) => boolean) {
  let best: { airport: Airport; miles: number } | null = null;
  for (const airport of airports) {
    if (filter && !filter(airport)) continue;
    const miles = haversineMiles(lat, lon, airport.lat, airport.lon);
    if (!best || miles < best.miles) best = { airport, miles };
  }
  return best;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:property-airports ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const res = await fetch(CSV_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (FurlongDataIngest)" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`OurAirports HTTP ${res.status}`);
  const rows = parseCsv(await res.text());
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const [typeC, nameC, latC, lonC, countryC] = [
    col("type"), col("name"), col("latitude_deg"), col("longitude_deg"), col("iso_country"),
  ];
  const airports: Airport[] = [];
  for (const row of rows.slice(1)) {
    if (row[countryC] !== "US") continue;
    const type = row[typeC];
    if (type !== "large_airport" && type !== "medium_airport") continue;
    const lat = Number(row[latC]);
    const lon = Number(row[lonC]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    airports.push({
      name: row[nameC],
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      size: type === "large_airport" ? "major" : "regional",
    });
  }
  if (airports.length < 500) throw new Error(`Only ${airports.length} airports parsed — NOT overwritten.`);
  console.log(`  ${airports.length} US large/medium airports`);

  // Property coordinates: stored (HUD) or geocoded (others).
  const points: { id: string; lat: number; lon: number }[] = [];
  const needGeocode: { id: string; street: string; city: string; state: string; zip: string }[] = [];
  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      const r = c.source_records[0];
      if (typeof r.latitude === "number" && typeof r.longitude === "number") {
        points.push({ id: c.canonical_property_id, lat: r.latitude, lon: r.longitude });
      } else if (r.exactAddress && r.town && r.state) {
        needGeocode.push({ id: c.canonical_property_id, street: r.exactAddress, city: r.town, state: r.state, zip: r.zip ?? "" });
      }
    }
  }
  console.log(`  stored coords: ${points.length} · need geocode: ${needGeocode.length}`);
  for (const g of needGeocode) {
    const geo = await geocodeToCensusTract(g.street, g.city, g.state, g.zip).catch(() => null);
    if (geo?.lat && geo?.lon) points.push({ id: g.id, lat: Number(geo.lat), lon: Number(geo.lon) });
  }

  const propEntries: string[] = [];
  for (const p of points) {
    const nearestAny = nearest(airports, p.lat, p.lon);
    const nearestMajor = nearest(airports, p.lat, p.lon, (a) => a.size === "major");
    if (!nearestAny || !nearestMajor) continue;
    propEntries.push(
      `  ${JSON.stringify(p.id)}: ${JSON.stringify({
        nearestName: nearestAny.airport.name,
        nearestMiles: Math.round(nearestAny.miles),
        nearestSize: nearestAny.airport.size,
        majorName: nearestMajor.airport.name,
        majorMiles: Math.round(nearestMajor.miles),
      })},`
    );
  }

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT_TABLE,
    `/**
 * usAirportsGenerated — GENERATED FILE. Do not edit by hand.
 * US large/medium airports from the OurAirports open dataset (CC0/public
 * domain). Re-run: npm run ingest:property-airports
 */

export const US_AIRPORTS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "OurAirports open data (ourairports.com), public domain",
  airports: ${airports.length},
} as const;

export interface UsAirport {
  name: string;
  lat: number;
  lon: number;
  /** "major" | "regional" */
  size: string;
}

export const US_AIRPORTS: UsAirport[] = ${JSON.stringify(airports)};
`,
    "utf8"
  );
  fs.writeFileSync(
    OUT_PROPS,
    `/**
 * propertyAirportsGenerated — GENERATED FILE. Do not edit by hand.
 * Nearest airports per canonical property (straight-line miles), from the
 * OurAirports open dataset. Re-run: npm run ingest:property-airports
 */

export const PROPERTY_AIRPORTS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "OurAirports open data (ourairports.com), public domain",
  resolvedProperties: ${propEntries.length},
} as const;

export interface PropertyAirportFact {
  nearestName: string;
  nearestMiles: number;
  /** "major" | "regional" */
  nearestSize: string;
  majorName: string;
  majorMiles: number;
}

export const PROPERTY_AIRPORTS: Record<string, PropertyAirportFact> = {
${propEntries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${airports.length} airports + ${propEntries.length} properties\n`);
}

main().catch((error) => {
  console.error("ingest:property-airports FAILED —", error);
  process.exit(1);
});
