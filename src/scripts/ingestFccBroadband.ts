/**
 * ingestFccBroadband — county-level broadband availability, frozen into a
 * committed snapshot (founder direction 2026-07-17: "can I even get WiFi here,
 * or do I need Starlink?" — answered from the FCC's own data).
 *
 * Source: FCC National Broadband Map — Broadband Data Collection (BDC) public
 * data API. Validated 2026-07-17: the public API is a BULK-DOWNLOAD service
 * (whole-state coverage files), NOT a per-address endpoint — so we download
 * each state's "Served-Unserved · Fixed Broadband" file, aggregate to county
 * (% of locations with 100/20 Mbps service, and the wired share), and commit
 * the small county summary. Per-address pinpoint stays on the FCC-map link.
 *
 * Requires the OWNER's FCC credential (Manage API Access on
 * broadbandmap.fcc.gov): FCC_BROADBAND_API_USERNAME + FCC_BROADBAND_API_TOKEN.
 *
 *   npm run ingest:fcc-broadband
 *
 * Provider CLAIMS, aggregated — never a guarantee of service at a given home.
 */

import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as readline from "node:readline";
import { createReadStream } from "node:fs";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/countyBroadbandGenerated.ts");
const API = "https://broadbandmap.fcc.gov/api/public/map";
const USER = process.env.FCC_BROADBAND_API_USERNAME?.trim();
const TOKEN = process.env.FCC_BROADBAND_API_TOKEN?.trim();
const headers = () => ({ username: USER as string, hash_value: TOKEN as string });

interface CountyAgg { locations: number; served: number; wired: number }

async function listLatestAvailability(): Promise<{ asOf: string; files: any[] }> {
  const dates = (await (await fetch(`${API}/listAsOfDates`, { headers: headers() })).json()).data as Array<{ data_type: string; as_of_date: string }>;
  const asOf = dates.filter((d) => d.data_type === "availability").map((d) => d.as_of_date).sort().pop() as string;
  const files = (await (await fetch(`${API}/downloads/listAvailabilityData/${asOf}`, { headers: headers() })).json()).data as any[];
  return { asOf, files };
}

function downloadUnzipCsv(fileId: number): Promise<string> {
  const zipPath = path.join(os.tmpdir(), `furlong-bdc-${fileId}.zip`);
  const dir = path.join(os.tmpdir(), `furlong-bdc-${fileId}`);
  return fetch(`${API}/downloads/downloadFile/availability/${fileId}`, { headers: headers(), signal: AbortSignal.timeout(120000) })
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      fs.writeFileSync(zipPath, Buffer.from(buf));
      fs.mkdirSync(dir, { recursive: true });
      return new Promise<string>((resolve, reject) => {
        execFile("unzip", ["-o", zipPath, "-d", dir], (err) => {
          fs.unlinkSync(zipPath);
          if (err) return reject(err);
          const csv = fs.readdirSync(dir).find((f) => f.endsWith(".csv"));
          resolve(csv ? path.join(dir, csv) : "");
        });
      });
    });
}

async function aggregateCounty(csvPath: string, counties: Map<string, CountyAgg>): Promise<void> {
  const rl = readline.createInterface({ input: createReadStream(csvPath), crlfDelay: Infinity });
  let header: string[] | null = null;
  let iBlock = 1, iAny = 3, iWired = 4;
  for await (const line of rl) {
    if (!header) {
      header = line.split(",");
      iBlock = header.indexOf("block_geoid");
      iAny = header.indexOf("any_dl100_ul20");
      iWired = header.indexOf("wired_dl100_ul20");
      continue;
    }
    const c = line.split(",");
    const fips = (c[iBlock] ?? "").slice(0, 5);
    if (!/^\d{5}$/.test(fips)) continue;
    const agg = counties.get(fips) ?? { locations: 0, served: 0, wired: 0 };
    agg.locations += 1;
    if (c[iAny] === "1") agg.served += 1;
    if (c[iWired] === "1") agg.wired += 1;
    counties.set(fips, agg);
  }
  fs.rmSync(path.dirname(csvPath), { recursive: true, force: true });
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:fcc-broadband ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!USER || !TOKEN) {
    console.error("  FCC_BROADBAND_API_USERNAME + FCC_BROADBAND_API_TOKEN required (broadbandmap.fcc.gov → Manage API Access).\n");
    process.exit(1);
  }
  const { asOf, files } = await listLatestAvailability();
  const stateFiles = files.filter(
    (f) => f.category === "State" && f.subcategory === "Served-Unserved" && f.technology_type === "Fixed Broadband"
  );
  console.log(`  as-of ${asOf} · ${stateFiles.length} state files`);

  const counties = new Map<string, CountyAgg>();
  let done = 0;
  for (const f of stateFiles) {
    try {
      const csv = await downloadUnzipCsv(f.file_id);
      if (csv) await aggregateCounty(csv, counties);
    } catch (error) {
      console.error(`  ${f.state_name}: ${error instanceof Error ? error.message : "failed"}`);
    }
    done += 1;
    if (done % 5 === 0) console.log(`  ${done}/${stateFiles.length} states · ${counties.size} counties`);
  }
  if (counties.size < 1000) throw new Error(`Only ${counties.size} counties — snapshot NOT overwritten.`);

  const entries = [...counties.entries()]
    .filter(([, a]) => a.locations >= 20)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fips, a]) => {
      const pctServed = Math.round((a.served / a.locations) * 100);
      const pctWired = Math.round((a.wired / a.locations) * 100);
      return `  ${JSON.stringify(fips)}: ${JSON.stringify({ pctServed, pctWired, locations: a.locations })},`;
    });

  const asOfStamp = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * countyBroadbandGenerated — GENERATED FILE. Do not edit by hand.
 *
 * County broadband availability from the FCC National Broadband Map (BDC):
 * share of locations with 100/20 Mbps fixed service, and the wired share.
 * Aggregated from the FCC's own served-unserved data. Provider claims;
 * per-address truth lives on the FCC map. Re-run: npm run ingest:fcc-broadband
 */

export const COUNTY_BROADBAND_PROVENANCE = {
  asOf: ${JSON.stringify(asOfStamp)} as string | null,
  bdcAsOf: ${JSON.stringify(asOf)} as string | null,
  source: "FCC National Broadband Map (Broadband Data Collection)",
  resolvedCounties: ${entries.length},
} as const;

export interface CountyBroadband {
  /** Percent of locations with any 100/20 Mbps fixed broadband. */
  pctServed: number;
  /** Percent of locations with WIRED 100/20 (fiber/cable, not fixed-wireless). */
  pctWired: number;
  /** Locations assessed in the county. */
  locations: number;
}

/** Keyed by 5-digit county FIPS. */
export const COUNTY_BROADBAND: Record<string, CountyBroadband> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  ${entries.length} counties (BDC ${asOf}) → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:fcc-broadband FAILED —", error);
  process.exit(1);
});
