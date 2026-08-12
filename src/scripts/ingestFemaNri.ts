/**
 * ingestFemaNri — county natural-hazard risk ratings from FEMA's National
 * Risk Index, frozen into a committed snapshot (founder direction 2026-07-17:
 * disaster-risk context + insurance-rider guidance on the brief).
 *
 * Source: FEMA National Risk Index county layer (public domain), queried from
 * the ArcGIS FeatureServer that backs the official NRI/CMRA distribution —
 * no key required. Ratings are FEMA's published qualitative classes
 * ("Very Low" … "Very High"); we store them verbatim, never recompute.
 *
 * Run: npm run ingest:fema-nri
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/countyHazardRiskGenerated.ts");
const SERVICE =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query";

const FIELDS = [
  "STCOFIPS",
  "RISK_RATNG",
  "HRCN_RISKR", // hurricane
  "WFIR_RISKR", // wildfire
  "TRND_RISKR", // tornado
  "ERQK_RISKR", // earthquake
  "IFLD_RISKR", // inland flooding
  "CFLD_RISKR", // coastal flooding
];

interface Attributes {
  STCOFIPS?: string;
  RISK_RATNG?: string;
  HRCN_RISKR?: string;
  WFIR_RISKR?: string;
  TRND_RISKR?: string;
  ERQK_RISKR?: string;
  IFLD_RISKR?: string;
  CFLD_RISKR?: string;
}

function clean(value: string | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v || /not applicable|insufficient data|no rating/i.test(v)) return null;
  return v;
}

async function fetchPage(offset: number): Promise<Attributes[]> {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: FIELDS.join(","),
    returnGeometry: "false",
    f: "json",
    orderByFields: "STCOFIPS",
    resultOffset: String(offset),
    resultRecordCount: "1000",
  });
  const res = await fetch(`${SERVICE}?${params}`, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`NRI FeatureServer HTTP ${res.status}`);
  const body = (await res.json()) as { features?: { attributes: Attributes }[]; error?: unknown };
  if (body.error) throw new Error(`NRI FeatureServer error: ${JSON.stringify(body.error).slice(0, 200)}`);
  return (body.features ?? []).map((f) => f.attributes);
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:fema-nri ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const rows: Attributes[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await fetchPage(offset);
    rows.push(...page);
    console.log(`  …${rows.length} counties`);
    if (page.length < 1000) break;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const entries: string[] = [];
  for (const row of rows) {
    const fips = (row.STCOFIPS ?? "").trim();
    if (!/^\d{5}$/.test(fips)) continue;
    const entry = {
      overall: clean(row.RISK_RATNG),
      hurricane: clean(row.HRCN_RISKR),
      wildfire: clean(row.WFIR_RISKR),
      tornado: clean(row.TRND_RISKR),
      earthquake: clean(row.ERQK_RISKR),
      floodInland: clean(row.IFLD_RISKR),
      floodCoastal: clean(row.CFLD_RISKR),
    };
    entries.push(`  ${JSON.stringify(fips)}: ${JSON.stringify(entry)},`);
  }
  entries.sort();

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * countyHazardRiskGenerated — GENERATED FILE. Do not edit by hand.
 *
 * County natural-hazard RISK RATINGS from FEMA's National Risk Index —
 * public domain, stored verbatim (FEMA's qualitative classes, "Very Low"
 * through "Very High"). Facts about the place; never a prediction, premium,
 * or insurability determination. Re-run: npm run ingest:fema-nri
 */

export const COUNTY_HAZARD_RISK_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)},
  source: "FEMA National Risk Index (county layer)",
  resolvedCounties: ${entries.length},
} as const;

export interface CountyHazardRisk {
  overall: string | null;
  hurricane: string | null;
  wildfire: string | null;
  tornado: string | null;
  earthquake: string | null;
  floodInland: string | null;
  floodCoastal: string | null;
}

export const COUNTY_HAZARD_RISK: Record<string, CountyHazardRisk> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${entries.length} counties → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:fema-nri FAILED —", error);
  process.exit(1);
});
