/**
 * ingestUsdmDrought — current drought severity by state, frozen into a
 * committed snapshot (founder direction 2026-07-17: the regional newsletter
 * must LEAD with the local truth — e.g. Delmarva's crop-killing drought —
 * that generic industry newsletters bury).
 *
 * Source: U.S. Drought Monitor (droughtmonitor.unl.edu) — a joint product of
 * USDA, NOAA, and the National Drought Mitigation Center. Public domain,
 * keyless, updated every Thursday. Categories D0 (abnormally dry) → D4
 * (exceptional drought); statisticsType=2 gives NON-overlapping percent area.
 *
 *   npm run ingest:usdm-drought
 *
 * Distance facts, never characterizations — the reader draws the conclusion.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/stateDroughtGenerated.ts");
const API = "https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent";

// State/territory FIPS → USPS. DC included; territories skipped (no USDM).
const STATE_FIPS: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "16": "ID",
  "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA",
  "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ",
  "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK",
  "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN",
  "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY",
};

interface UsdmRow {
  mapDate?: string;
  none?: number; d0?: number; d1?: number; d2?: number; d3?: number; d4?: number;
}

function fmtDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:usdm-drought ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const end = new Date(process.env.USDM_AS_OF ? Date.parse(process.env.USDM_AS_OF) : Date.now());
  const start = new Date(end.getTime() - 21 * 86_400_000); // last 3 weeks; take newest row
  const entries: string[] = [];
  let latestMapDate = "";

  for (const [fips, usps] of Object.entries(STATE_FIPS)) {
    const url = `${API}?aoi=${fips}&startdate=${fmtDate(start)}&enddate=${fmtDate(end)}&statisticsType=2`;
    const rows = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "FurlongPlaceBrief/1.0" },
      signal: AbortSignal.timeout(30000),
    })
      .then((r) => (r.ok ? (r.json() as Promise<UsdmRow[]>) : []))
      .catch(() => [] as UsdmRow[]);
    if (rows.length === 0) continue;
    // Newest mapDate wins.
    const row = rows.reduce((a, b) => ((a.mapDate ?? "") >= (b.mapDate ?? "") ? a : b));
    const mapDate = (row.mapDate ?? "").slice(0, 10);
    if (mapDate > latestMapDate) latestMapDate = mapDate;
    const d = {
      d0: Number(row.d0 ?? 0), d1: Number(row.d1 ?? 0), d2: Number(row.d2 ?? 0),
      d3: Number(row.d3 ?? 0), d4: Number(row.d4 ?? 0),
    };
    entries.push(
      `  ${JSON.stringify(usps)}: ${JSON.stringify({
        mapDate,
        d0: Number(d.d0.toFixed(1)), d1: Number(d.d1.toFixed(1)), d2: Number(d.d2.toFixed(1)),
        d3: Number(d.d3.toFixed(1)), d4: Number(d.d4.toFixed(1)),
        severePlus: Number((d.d2 + d.d3 + d.d4).toFixed(1)),
        extremePlus: Number((d.d3 + d.d4).toFixed(1)),
      })},`
    );
    await new Promise((r) => setTimeout(r, 120));
  }
  if (entries.length < 40) throw new Error(`Only ${entries.length} states resolved — snapshot NOT overwritten.`);

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * stateDroughtGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Current drought severity by state from the U.S. Drought Monitor
 * (USDA/NOAA/NDMC), public domain, updated weekly. Percent of state area in
 * each non-overlapping category. Re-run: npm run ingest:usdm-drought
 */

export const STATE_DROUGHT_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  mapDate: ${JSON.stringify(latestMapDate)} as string | null,
  source: "U.S. Drought Monitor (droughtmonitor.unl.edu) — USDA/NOAA/NDMC",
  resolvedStates: ${entries.length},
} as const;

export interface StateDrought {
  /** Weekly map date, YYYY-MM-DD. */
  mapDate: string;
  /** Percent area, non-overlapping: D0 abnormally dry … D4 exceptional. */
  d0: number; d1: number; d2: number; d3: number; d4: number;
  /** Severe drought or worse (D2+D3+D4), percent of state. */
  severePlus: number;
  /** Extreme drought or worse (D3+D4), percent of state. */
  extremePlus: number;
}

export const STATE_DROUGHT: Record<string, StateDrought> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  ${entries.length} states, latest map ${latestMapDate} → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:usdm-drought FAILED —", error);
  process.exit(1);
});
