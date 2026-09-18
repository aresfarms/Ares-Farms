/**
 * weeklyAgRefresh — scheduled drought + crop-condition refresh (server-only).
 *
 * Runs inside refreshAllSources (the daily source-refresh job) and writes the
 * weekly-ag overlay (weeklyAgLive.ts). Mirrors the hand-run ingests exactly:
 *   - Drought: U.S. Drought Monitor state statistics — keyless, public domain,
 *     statisticsType=2 (non-overlapping percent area), newest map date wins.
 *   - Crop conditions: USDA NASS Crop Progress CONDITION by state for corn +
 *     soybeans — needs NASS_API_KEY (same key the commodity refresh uses).
 *
 * HARD GUARANTEES (same doctrine as commodityPricesRefresh):
 *   - The overlay is written ONLY when drought resolves ≥40 states (the ingest
 *     guard). Fewer → the committed snapshot keeps serving; nothing fabricated.
 *   - Crop conditions are best-effort on top: no key or a thin season → the
 *     overlay carries an empty map and the snapshot serves that half.
 */

import type { StateDrought } from "./stateDroughtGenerated";
import type { StateCropConditions } from "./stateCropConditionsGenerated";
import { writeWeeklyAgLive, type WeeklyAgLive } from "./weeklyAgLive";

const USDM_API =
  "https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent";
const NASS_API = "https://quickstats.nass.usda.gov/api/api_GET/";

// State FIPS → USPS (DC included; territories have no USDM product).
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

const fmtUsdmDate = (d: Date): string => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

async function fetchDrought(): Promise<{ drought: Record<string, StateDrought>; mapDate: string | null }> {
  const end = new Date();
  const start = new Date(end.getTime() - 21 * 86_400_000);
  const drought: Record<string, StateDrought> = {};
  let latestMapDate = "";
  for (const [fips, usps] of Object.entries(STATE_FIPS)) {
    const url = `${USDM_API}?aoi=${fips}&startdate=${fmtUsdmDate(start)}&enddate=${fmtUsdmDate(end)}&statisticsType=2`;
    const rows = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "FurlongPlaceBrief/1.0" },
      signal: AbortSignal.timeout(30000),
    })
      .then((r) => (r.ok ? (r.json() as Promise<UsdmRow[]>) : []))
      .catch(() => [] as UsdmRow[]);
    if (rows.length === 0) continue;
    const row = rows.reduce((a, b) => ((a.mapDate ?? "") >= (b.mapDate ?? "") ? a : b));
    const mapDate = (row.mapDate ?? "").slice(0, 10);
    if (mapDate > latestMapDate) latestMapDate = mapDate;
    const d0 = Number(row.d0 ?? 0), d1 = Number(row.d1 ?? 0), d2 = Number(row.d2 ?? 0),
      d3 = Number(row.d3 ?? 0), d4 = Number(row.d4 ?? 0);
    drought[usps] = {
      mapDate,
      d0: Number(d0.toFixed(1)), d1: Number(d1.toFixed(1)), d2: Number(d2.toFixed(1)),
      d3: Number(d3.toFixed(1)), d4: Number(d4.toFixed(1)),
      severePlus: Number((d2 + d3 + d4).toFixed(1)),
      extremePlus: Number((d3 + d4).toFixed(1)),
    };
    await new Promise((r) => setTimeout(r, 120)); // be a polite public-API citizen
  }
  return { drought, mapDate: latestMapDate || null };
}

interface NassRow {
  state_alpha?: string;
  reference_period_desc?: string;
  short_desc?: string;
  Value?: string;
}

const CATEGORY = (short: string): string | null => {
  if (/PCT VERY POOR/.test(short)) return "veryPoor";
  if (/PCT POOR/.test(short)) return "poor";
  if (/PCT FAIR/.test(short)) return "fair";
  if (/PCT GOOD/.test(short)) return "good";
  if (/PCT EXCELLENT/.test(short)) return "excellent";
  return null;
};

const weekNum = (desc: string): number => {
  const m = desc.match(/#\s*(\d+)/);
  return m ? Number(m[1]) : 0;
};

async function fetchCondition(key: string, commodity: string, year: number): Promise<NassRow[]> {
  const params = new URLSearchParams({
    key, commodity_desc: commodity, statisticcat_desc: "CONDITION",
    agg_level_desc: "STATE", year: String(year), format: "JSON",
  });
  const res = await fetch(`${NASS_API}?${params}`, { signal: AbortSignal.timeout(90000) }).catch(() => null);
  if (!res || !res.ok) return [];
  return (((await res.json()) as { data?: NassRow[] }).data ?? []);
}

function reduceLatest(rows: NassRow[]) {
  const byState = new Map<string, { week: number; cats: Record<string, number> }>();
  for (const r of rows) {
    const st = (r.state_alpha ?? "").toUpperCase();
    const cat = CATEGORY(r.short_desc ?? "");
    const val = Number((r.Value ?? "").replace(/,/g, ""));
    const wk = weekNum(r.reference_period_desc ?? "");
    if (!/^[A-Z]{2}$/.test(st) || !cat || !Number.isFinite(val) || wk === 0) continue;
    const cur = byState.get(st);
    if (!cur || wk > cur.week) byState.set(st, { week: wk, cats: { [cat]: val } });
    else if (wk === cur.week) cur.cats[cat] = val;
  }
  return byState;
}

async function fetchCropConditions(): Promise<{
  cropConditions: Record<string, StateCropConditions>;
  year: number | null;
  latestWeek: number | null;
}> {
  const key = process.env.NASS_API_KEY?.trim();
  if (!key) return { cropConditions: {}, year: null, latestWeek: null };
  const year = new Date().getUTCFullYear();
  const [corn, soy] = await Promise.all([
    fetchCondition(key, "CORN", year),
    fetchCondition(key, "SOYBEANS", year),
  ]);
  const cornByState = reduceLatest(corn);
  const soyByState = reduceLatest(soy);
  const shape = (entry?: { week: number; cats: Record<string, number> }) => {
    if (!entry) return null;
    const c = entry.cats;
    return {
      week: entry.week,
      goodExcellent: Math.round((c.good ?? 0) + (c.excellent ?? 0)),
      poorVeryPoor: Math.round((c.veryPoor ?? 0) + (c.poor ?? 0)),
    };
  };
  const cropConditions: Record<string, StateCropConditions> = {};
  for (const st of new Set([...cornByState.keys(), ...soyByState.keys()])) {
    const cornShaped = shape(cornByState.get(st));
    const soyShaped = shape(soyByState.get(st));
    if (cornShaped || soyShaped) cropConditions[st] = { corn: cornShaped, soybeans: soyShaped };
  }
  const latestWeek = Math.max(
    ...[...cornByState.values(), ...soyByState.values()].map((e) => e.week),
    0
  );
  return {
    cropConditions,
    year: Object.keys(cropConditions).length > 0 ? year : null,
    latestWeek: latestWeek > 0 ? latestWeek : null,
  };
}

export interface WeeklyAgRefreshResult {
  status: "REFRESHED" | "PARTIAL" | "FAILED";
  droughtStates: number;
  cropStates: number;
}

export async function refreshWeeklyAg(): Promise<WeeklyAgRefreshResult> {
  const { drought, mapDate } = await fetchDrought();
  const droughtStates = Object.keys(drought).length;
  if (droughtStates < 40) {
    // Ingest guard: a thin drought pull never overwrites the served picture.
    return { status: "FAILED", droughtStates, cropStates: 0 };
  }
  const crops = await fetchCropConditions();
  const overlay: WeeklyAgLive = {
    drought,
    droughtMapDate: mapDate,
    cropConditions: crops.cropConditions,
    cropYear: crops.year,
    cropLatestWeek: crops.latestWeek,
    fetchedAt: new Date().toISOString(),
    sources: {
      drought: "U.S. Drought Monitor (droughtmonitor.unl.edu) — USDA/NOAA/NDMC",
      cropConditions: "USDA NASS Crop Progress (quickstats.nass.usda.gov)",
    },
  };
  writeWeeklyAgLive(overlay);
  const cropStates = Object.keys(crops.cropConditions).length;
  return { status: cropStates >= 30 ? "REFRESHED" : "PARTIAL", droughtStates, cropStates };
}
