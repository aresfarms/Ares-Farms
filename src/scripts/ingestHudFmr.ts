import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * ingest:hud-fmr — HUD Fair Market Rents per county -> frozen snapshot
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15: rental-context market fact.
 * Presentation is a MARKET FACT with provenance — never a rent guarantee or
 * revenue projection; projections live in paid tiers under forecast labeling).
 *
 * Master Volume Governance:
 * - Vol V (source authority): HUD USER Fair Market Rents — public domain.
 * - Credentialed ingestion doctrine: huduser.gov sits behind an anti-bot wall,
 *   so scripted downloads fail. TWO owner-friendly paths:
 *     (a) FILE mode — the owner downloads the county-level FMR CSV in a browser
 *         (huduser.gov/portal/datasets/fmr.html) and runs:
 *           npx tsx src/scripts/ingestHudFmr.ts --file <path-to-FY_FMRs.csv> --year FY2025
 *     (b) API mode — the owner registers a free HUD USER API token and runs:
 *           HUDUSER_API_TOKEN=<token> npx tsx src/scripts/ingestHudFmr.ts --year FY2025
 *   Tokens/credentials are env-only — never committed, never baked.
 *
 * Output: src/lib/property/countyFmrGenerated.ts — keyed by 5-digit county FIPS
 * (county resolution already derives that per property from its census tract).
 */

interface FmrEntry {
  areaName: string;
  fmr0: number;
  fmr1: number;
  fmr2: number;
  fmr3: number;
  fmr4: number;
}

function parseArgs(argv: string[]): { file: string | null; year: string } {
  const fileIdx = argv.indexOf("--file");
  const yearIdx = argv.indexOf("--year");
  return {
    file: fileIdx >= 0 ? (argv[fileIdx + 1] ?? null) : null,
    year: yearIdx >= 0 ? (argv[yearIdx + 1] ?? "FY2025") : "FY2025",
  };
}

function pickColumn(header: string[], candidates: string[]): number {
  const lowered = header.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const candidate of candidates) {
    const idx = lowered.indexOf(candidate);
    if (idx >= 0) return idx;
  }
  return -1;
}

/** Minimal CSV parse (handles quoted fields with commas). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i += 1; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

async function loadCsv(filePath: string): Promise<Map<string, FmrEntry>> {
  const text = await readFile(filePath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);

  // County-level FMR files carry a 10-digit fips (state+county+99999) or
  // separate state/county columns; FMR columns are fmr_0..fmr_4 (or fmr0..).
  const fipsCol = pickColumn(header, ["fips", "fips2010", "fips2020", "fipscode"]);
  const stateCol = pickColumn(header, ["state", "statefp", "stusps"]);
  const countyCol = pickColumn(header, ["county", "countyfp", "cntyidfp"]);
  const nameCol = pickColumn(header, ["areaname", "countyname", "hudareaname", "hudname"]);
  const fmrCols = [0, 1, 2, 3, 4].map((n) =>
    pickColumn(header, [`fmr${n}`, `fmr_${n}`, `fy${n}`, `safmr${n}`])
  );
  if (fmrCols.some((c) => c < 0) || (fipsCol < 0 && (stateCol < 0 || countyCol < 0))) {
    throw new Error(
      `Could not locate FIPS/FMR columns in the CSV header: ${header.join(", ")}`
    );
  }

  const out = new Map<string, FmrEntry>();
  for (const line of lines.slice(1)) {
    const row = parseCsvLine(line);
    let fips5: string | null = null;
    if (fipsCol >= 0) {
      const raw = row[fipsCol]?.replace(/[^0-9]/g, "") ?? "";
      if (raw.length >= 5) fips5 = raw.slice(0, 5);
    } else {
      const state = row[stateCol]?.replace(/[^0-9]/g, "").padStart(2, "0");
      const county = row[countyCol]?.replace(/[^0-9]/g, "").padStart(3, "0");
      if (state?.length === 2 && county?.length === 3) fips5 = `${state}${county}`;
    }
    if (!fips5) continue;
    const fmrs = fmrCols.map((c) => Number(row[c]));
    if (fmrs.some((n) => !Number.isFinite(n) || n <= 0)) continue;
    out.set(fips5, {
      areaName: nameCol >= 0 ? (row[nameCol] ?? "").trim() : "",
      fmr0: fmrs[0], fmr1: fmrs[1], fmr2: fmrs[2], fmr3: fmrs[3], fmr4: fmrs[4],
    });
  }
  return out;
}

async function loadApi(token: string): Promise<Map<string, FmrEntry>> {
  // HUD USER API: statedata endpoint returns county FMRs per state.
  const states = ["01","02","04","05","06","08","09","10","11","12","13","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","44","45","46","47","48","49","50","51","53","54","55","56"];
  const out = new Map<string, FmrEntry>();
  for (const state of states) {
    const res = await fetch(`https://www.huduser.gov/hudapi/public/fmr/statedata/${state}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      console.warn(`  skip state ${state}: HTTP ${res.status}`);
      continue;
    }
    const data = (await res.json()) as {
      data?: { counties?: Array<Record<string, unknown>> };
    };
    for (const county of data.data?.counties ?? []) {
      const fipsRaw = String(county.fips_code ?? "").replace(/[^0-9]/g, "");
      if (fipsRaw.length < 5) continue;
      const entry: FmrEntry = {
        areaName: String(county.county_name ?? county.countyname ?? ""),
        fmr0: Number(county["Efficiency"] ?? county.efficiency ?? 0),
        fmr1: Number(county["One-Bedroom"] ?? county.onebedroom ?? 0),
        fmr2: Number(county["Two-Bedroom"] ?? county.twobedroom ?? 0),
        fmr3: Number(county["Three-Bedroom"] ?? county.threebedroom ?? 0),
        fmr4: Number(county["Four-Bedroom"] ?? county.fourbedroom ?? 0),
      };
      if (entry.fmr2 > 0) out.set(fipsRaw.slice(0, 5), entry);
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return out;
}

async function main(): Promise<void> {
  const { file, year } = parseArgs(process.argv.slice(2));
  const token = process.env.HUDUSER_API_TOKEN?.trim();

  let entries: Map<string, FmrEntry>;
  if (file) {
    console.log(`FILE mode: parsing ${file} (${year})`);
    entries = await loadCsv(file);
  } else if (token) {
    console.log(`API mode: HUD USER API, all states (${year})`);
    entries = await loadApi(token);
  } else {
    throw new Error(
      "Provide --file <FY_FMRs.csv downloaded in a browser> or set HUDUSER_API_TOKEN " +
        "(owner-registered, free: huduser.gov/portal/dataset/fmr-api.html). Credentials are env-only."
    );
  }
  if (entries.size < 100) {
    throw new Error(`Suspiciously few FMR rows parsed (${entries.size}) — aborting.`);
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const body = [...entries.entries()]
    .map(
      ([fips, entry]) =>
        `  "${fips}": { areaName: ${JSON.stringify(entry.areaName)}, fmr0: ${entry.fmr0}, fmr1: ${entry.fmr1}, fmr2: ${entry.fmr2}, fmr3: ${entry.fmr3}, fmr4: ${entry.fmr4} },`
    )
    .join("\n");

  const out = `/**
 * countyFmrGenerated — GENERATED FILE. Do not edit by hand.
 *
 * HUD Fair Market Rents by 5-digit county FIPS (${year}). Source: HUD USER
 * (huduser.gov) — public domain. FMRs are gross-rent standards HUD publishes for
 * program administration; presented as MARKET CONTEXT with provenance, never a
 * rent guarantee. Re-run: npx tsx src/scripts/ingestHudFmr.ts --file <csv> --year ${year}
 */

export const COUNTY_FMR_PROVENANCE = {
  asOf: "${asOf}",
  fmrYear: "${year}",
  source: "HUD USER Fair Market Rents (huduser.gov)",
  license: "Public domain (U.S. Government work)",
  counties: ${entries.size},
} as const;

export interface CountyFmrEntry {
  areaName: string;
  /** Monthly gross-rent FMRs by bedroom count (0 = efficiency). */
  fmr0: number;
  fmr1: number;
  fmr2: number;
  fmr3: number;
  fmr4: number;
}

export const COUNTY_FMR: Record<string, CountyFmrEntry> = {
${body}
};
`;

  const outPath = path.join(process.cwd(), "src", "lib", "property", "countyFmrGenerated.ts");
  await writeFile(outPath, out, "utf8");
  console.log(`Wrote FMRs for ${entries.size} counties -> ${path.relative(process.cwd(), outPath)}`);
}

main().catch((error: unknown) => {
  console.error("ingest:hud-fmr FAILED —", error instanceof Error ? error.message : error);
  process.exit(1);
});
