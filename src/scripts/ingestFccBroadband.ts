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

import { execFile, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as readline from "node:readline";

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

type DownloadedArchive = { dir: string; zipPath: string; csvEntry: string };

async function downloadValidatedArchive(fileId: number): Promise<DownloadedArchive> {
  if (!Number.isInteger(fileId) || fileId <= 0) throw new Error("FCC file identifier is invalid.");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-bdc-"));
  fs.chmodSync(dir, 0o700);
  const zipPath = path.join(dir, `availability-${fileId}.zip`);
  const response = await fetch(`${API}/downloads/downloadFile/availability/${fileId}`, { headers: headers(), signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`FCC download failed with HTTP ${response.status}.`);
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > 1_000_000_000) throw new Error("FCC archive exceeds the 1 GB ingest bound.");
  const archive = Buffer.from(await response.arrayBuffer());
  if (archive.byteLength < 4 || archive.byteLength > 1_000_000_000 || archive[0] !== 0x50 || archive[1] !== 0x4b) {
    throw new Error("FCC response is not a bounded ZIP archive.");
  }
  fs.writeFileSync(zipPath, archive, { mode: 0o600 });

  const csvEntry = await new Promise<string>((resolve, reject) => {
    execFile("unzip", ["-Z1", zipPath], { maxBuffer: 2 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      const entries = stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
      const csv = entries.filter((name) => name.toLowerCase().endsWith(".csv"));
      if (csv.length !== 1) return reject(new Error("FCC archive must contain exactly one CSV member."));
      const name = csv[0];
      if (name.length > 180 || name.includes("/") || name.includes("\\") || name.includes("..")) {
        return reject(new Error("FCC archive contains an unsafe member name."));
      }
      resolve(name);
    });
  });
  return { dir, zipPath, csvEntry };
}

async function aggregateCounty(archive: DownloadedArchive, counties: Map<string, CountyAgg>): Promise<void> {
  const child = spawn("unzip", ["-p", archive.zipPath, archive.csvEntry], { stdio: ["ignore", "pipe", "pipe"] });
  if (!child.stdout) throw new Error("FCC archive stream could not be opened.");
  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
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
  const exitCode = await new Promise<number | null>((resolve) => child.once("close", resolve));
  fs.rmSync(archive.dir, { recursive: true, force: true });
  if (exitCode !== 0) throw new Error(`FCC archive extraction failed with exit code ${exitCode ?? "unknown"}.`);
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
      const archive = await downloadValidatedArchive(Number(f.file_id));
      await aggregateCounty(archive, counties);
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
    { encoding: "utf8", mode: 0o600 }
  );
  console.log(`  ${entries.length} counties (BDC ${asOf}) → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:fcc-broadband FAILED —", error);
  process.exit(1);
});
