/**
 * ingestFsaFarmInventory — USDA FSA Farm & Ranch inventory-property monitor
 * (founder direction 2026-07-17: fill the farms gap; source research confirmed
 * the FSA farm inventory lives ONLY in the official USDA eGov resales portal —
 * data.gov publishes no farm data file, just the SFH feeds we already ingest).
 *
 * Source: the official USDA-RD/FSA public property search
 * (properties.sc.egov.usda.gov/resales/public/searchFSA) — the same portal
 * data.gov lists as a resource of the CC0 1.0 resale dataset. U.S. government
 * work; queried respectfully (one GET + one POST per active state, 1s apart,
 * identified User-Agent with contact).
 *
 * FSA farm inventory is EPISODIC — properties surface from farm-loan defaults
 * and sell down to zero. As of 2026-07-17 the national count is 0, so this runs
 * as a monitor: it records the per-state counts every run and captures full
 * records whenever inventory appears. NOT wired into the property SOURCES until
 * first live inventory + Module 22/23 activation review.
 *
 *     npm run ingest:fsa-farm-inventory
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/fsaFarmInventoryGenerated.ts");
const BASE = "https://properties.sc.egov.usda.gov/resales/public/searchFSA";
const UA = "FurlongPropertyIngest/1.0 (USDA open-data; contact chudson@aresfarmsinc.com)";

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface StateResult {
  stateCode: string;
  found: number;
  /** propertyId refs seen on the results page (detail parse comes with first live inventory). */
  propertyIds: string[];
}

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

async function getSearchPage(): Promise<{ html: string; cookie: string | null }> {
  const res = await fetch(BASE, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw new Error(`GET searchFSA HTTP ${res.status}`);
  return { html: await res.text(), cookie: res.headers.get("set-cookie")?.split(";")[0] ?? null };
}

/** Active-state FIPS options from the stateCode select (portal lists only states with active properties). */
function activeStates(html: string): string[] {
  const sel = html.match(/<select[^>]*name="stateCode"[^>]*>([\s\S]*?)<\/select>/i);
  if (!sel) return [];
  return [...sel[1].matchAll(/<option[^>]*value="(\d{2})"/g)].map((m) => m[1]);
}

async function searchState(stateCode: string, cookie: string | null): Promise<StateResult> {
  const body = new URLSearchParams({
    searchFormName: "fsaSearchForm",
    propertyType: "Farm & Ranch",
    listingType: "All Types",
    stateCode,
    countyCode: "All",
    city: "", zipCode: "", minPrice: "", maxPrice: "", totalAcreage: "",
    cropland: "", rangeland: "", propertyUsage: "",
    Search: "Search",
  });
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body.toString(),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`POST searchFSA(${stateCode}) HTTP ${res.status}`);
  const html = await res.text();
  const text = stripTags(html);
  const found = Number((text.match(/Properties Found:\s*(\d+)/) ?? [])[1] ?? 0);
  const propertyIds = [...new Set([...html.matchAll(/propertyId=([0-9A-Za-z]+)/g)].map((m) => m[1]))];
  return { stateCode, found, propertyIds };
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:fsa-farm-inventory ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const checkedAt = new Date().toISOString();
  const { html, cookie } = await getSearchPage();
  const states = activeStates(html);
  console.log(`  portal lists ${states.length} active-state option(s): ${states.join(", ") || "(none)"}`);

  const results: StateResult[] = [];
  // National query first (stateCode empty), then each active state.
  for (const st of ["", ...states]) {
    const r = await searchState(st, cookie);
    results.push({ ...r, stateCode: st || "ALL" });
    console.log(`  ${st || "ALL"}: ${r.found} found${r.propertyIds.length ? ` · ids ${r.propertyIds.join(",")}` : ""}`);
    await sleep(1000);
  }

  const totalFound = Math.max(...results.map((r) => r.found));
  if (totalFound > 0) {
    console.log("\n  ⚠ INVENTORY APPEARED — extend this ingest with the detail-record parser,");
    console.log("    then take the source through Module 23 + Module 22 before any display.");
  }

  fs.writeFileSync(
    OUT,
    `/**
 * fsaFarmInventoryGenerated — GENERATED FILE. Do not edit by hand.
 *
 * USDA FSA Farm & Ranch inventory-property monitor snapshot (official USDA
 * eGov resales portal; U.S. government work). FSA farm inventory is episodic —
 * loan-default properties surface and sell down to zero — so this records the
 * live counts each run. Re-run: npm run ingest:fsa-farm-inventory
 *
 * NOT displayed anywhere until inventory exists AND the source clears
 * Module 23 (legal) + Module 22 (activation) review.
 */

export const FSA_FARM_INVENTORY_PROVENANCE = {
  checkedAt: ${JSON.stringify(checkedAt)},
  source: "USDA-RD/FSA property search (properties.sc.egov.usda.gov), Farm & Ranch",
  license: "U.S. government work; portal listed on data.gov under the CC0 1.0 resale dataset",
} as const;

export interface FsaFarmStateCount {
  stateCode: string;
  found: number;
  propertyIds: string[];
}

export const FSA_FARM_INVENTORY: FsaFarmStateCount[] = ${JSON.stringify(results, null, 2)};

/** Highest count seen this run (0 = no farm inventory nationally). */
export const FSA_FARM_INVENTORY_TOTAL = ${totalFound};
`,
    "utf8",
  );
  console.log(`\n  wrote → ${path.relative(ROOT, OUT)} (total: ${totalFound})\n`);
}

main().catch((error) => { console.error("ingest:fsa-farm-inventory FAILED —", error); process.exit(1); });
