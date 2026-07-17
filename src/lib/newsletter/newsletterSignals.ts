/**
 * newsletterSignals — the REAL, sourced signal pool the newsletter editions
 * draw from (founder direction 2026-07-17: say something people want to read,
 * grounded in authoritative data — never generic rhetoric).
 *
 * Every signal is a dated, sourced fact from a public/authoritative dataset
 * already in the build: USDM drought, NASS crop conditions, Freddie Mac PMMS
 * rates, FHFA price trends, Census county taxes, EIA electricity, NASS cash
 * rents. A signal states the number and, where useful, the plain-language
 * "what it means" — it never characterizes a place or predicts.
 *
 * Two read-lengths draw from the same signal (founder direction 2026-07-17:
 * "people stop reading after 2–5 minutes — say what you need upfront, save
 * the speeches for the digest"):
 *   - `headline` + `takeaway` = the WEEKLY bottom-line-up-front skim (one big
 *     number, one line of so-what).
 *   - `body` = the MONTHLY digest, where the full explanation lives.
 */

import { COMMODITY_PRICES, COMMODITY_PRICES_PROVENANCE } from "@/lib/property/commodityPricesGenerated";
import { INPUT_COSTS, INPUT_COSTS_PROVENANCE } from "@/lib/property/inputCostsGenerated";
import { COUNTY_CASH_RENTS, COUNTY_CASH_RENTS_PROVENANCE } from "@/lib/property/countyCashRentsGenerated";
import { MORTGAGE_RATES } from "@/lib/property/mortgageRatesGenerated";
import { STATE_CROP_CONDITIONS, STATE_CROP_CONDITIONS_PROVENANCE } from "@/lib/property/stateCropConditionsGenerated";
import { STATE_DROUGHT, STATE_DROUGHT_PROVENANCE } from "@/lib/property/stateDroughtGenerated";
import { STATE_ELECTRICITY } from "@/lib/property/stateElectricityGenerated";
import { STATE_FARMLAND, STATE_FARMLAND_PROVENANCE } from "@/lib/property/stateFarmlandGenerated";
import { STATE_GRAIN_BIDS, STATE_GRAIN_BIDS_PROVENANCE } from "@/lib/property/stateGrainBidsGenerated";
import { STATE_HPI } from "@/lib/property/stateHpiGenerated";

export interface NewsletterSignal {
  /** Short bold lead, e.g. "Corn is failing across the Delmarva". */
  headline: string;
  /** BLUF so-what, ≤ ~12 words — the weekly skim reads headline + this. */
  takeaway: string;
  /** The sourced number + full plain-language read (monthly digest). */
  body: string;
  source: string;
  /** "alarm" (bad news the reader must hear), "watch", "neutral", "opportunity". */
  tone: "alarm" | "watch" | "neutral" | "opportunity";
}

const STATE_NAMES: Record<string, string> = {
  DE: "Delaware", MD: "Maryland", VA: "Virginia", KS: "Kansas", TX: "Texas",
  IA: "Iowa", FL: "Florida", AL: "Alabama", PR: "Puerto Rico",
};

/** Named regions → member state codes (lead with the hardest-hit member). */
export const NEWSLETTER_REGIONS: Record<string, { label: string; states: string[] }> = {
  delmarva: { label: "the Delmarva (Delaware · Maryland · Virginia)", states: ["DE", "MD", "VA"] },
  "corn-belt": { label: "the Corn Belt (Iowa · Illinois · Indiana)", states: ["IA", "IL", "IN"] },
  "eastern-cornbelt": { label: "the Eastern Corn Belt (Ohio · Indiana · Kentucky)", states: ["OH", "IN", "KY"] },
  "great-plains": { label: "the Great Plains (Kansas · Nebraska · Oklahoma)", states: ["KS", "NE", "OK"] },
  "northern-plains": { label: "the Northern Plains (North Dakota · South Dakota · Minnesota)", states: ["ND", "SD", "MN"] },
  "mississippi-delta": { label: "the Mississippi Delta (Arkansas · Mississippi · Louisiana)", states: ["AR", "MS", "LA"] },
  southeast: { label: "the Southeast (North Carolina · South Carolina · Georgia)", states: ["NC", "SC", "GA"] },
  "texas-plains": { label: "the Southern Plains (Texas · Oklahoma · Kansas)", states: ["TX", "OK", "KS"] },
  "pacific-northwest": { label: "the Pacific Northwest (Washington · Oregon · Idaho)", states: ["WA", "OR", "ID"] },
};

function stateName(code: string): string {
  return STATE_NAMES[code] ?? code;
}

/** The worst-drought member of a region (leads the story). */
function hardestDrought(states: string[]): { code: string; severePlus: number; extremePlus: number; mapDate: string } | null {
  let worst: { code: string; severePlus: number; extremePlus: number; mapDate: string } | null = null;
  for (const code of states) {
    const d = STATE_DROUGHT[code];
    if (!d) continue;
    if (!worst || d.severePlus > worst.severePlus) {
      worst = { code, severePlus: d.severePlus, extremePlus: d.extremePlus, mapDate: d.mapDate };
    }
  }
  return worst;
}

// ── Signal builders ─────────────────────────────────────────────────────────

export function droughtSignal(states: string[]): NewsletterSignal | null {
  if (STATE_DROUGHT_PROVENANCE.mapDate === null) return null;
  const worst = hardestDrought(states);
  if (!worst || worst.severePlus < 5) return null;
  const others = states
    .filter((c) => c !== worst.code && STATE_DROUGHT[c])
    .map((c) => `${stateName(c)} ${STATE_DROUGHT[c].severePlus}%`)
    .join(", ");
  return {
    headline: `${stateName(worst.code)} is ${worst.severePlus}% in severe drought or worse`,
    takeaway: "The water reality behind every number below.",
    body:
      `As of the ${worst.mapDate} U.S. Drought Monitor, ${worst.severePlus}% of ${stateName(worst.code)} sits in ` +
      `severe drought or worse (D2–D4), ${worst.extremePlus}% in extreme drought (D3+).` +
      (others ? ` Across the region: ${others} severe-or-worse.` : "") +
      ` This is the water reality behind everything below.`,
    source: `U.S. Drought Monitor (USDA/NOAA/NDMC), map ${worst.mapDate}`,
    tone: worst.severePlus >= 40 ? "alarm" : "watch",
  };
}

export function cropConditionSignal(states: string[]): NewsletterSignal | null {
  if (STATE_CROP_CONDITIONS_PROVENANCE.asOf === null) return null;
  // Lead with the hardest-hit corn crop in the region.
  let worst: { code: string; ge: number; pvp: number } | null = null;
  for (const code of states) {
    const c = STATE_CROP_CONDITIONS[code]?.corn;
    if (!c) continue;
    if (!worst || c.poorVeryPoor > worst.pvp) worst = { code, ge: c.goodExcellent, pvp: c.poorVeryPoor };
  }
  if (!worst) return null;
  const soy = STATE_CROP_CONDITIONS[worst.code]?.soybeans;
  return {
    headline: `${stateName(worst.code)} corn: only ${worst.ge}% good-or-excellent, ${worst.pvp}% poor-or-worse`,
    takeaway: "A failing crop, in the government's own survey.",
    body:
      `USDA's week-${STATE_CROP_CONDITIONS_PROVENANCE.latestWeek} Crop Progress rates ${stateName(worst.code)} corn ` +
      `${worst.ge}% good-or-excellent and ${worst.pvp}% poor-or-very-poor` +
      (soy ? `; soybeans ${soy.goodExcellent}% good-or-excellent, ${soy.poorVeryPoor}% poor-or-worse` : "") +
      `. A rating this low this late in the season is what a failing crop looks like in the official numbers — ` +
      `not opinion, the government's own survey.`,
    source: `USDA NASS Crop Progress ${STATE_CROP_CONDITIONS_PROVENANCE.year}, week ${STATE_CROP_CONDITIONS_PROVENANCE.latestWeek}`,
    tone: worst.pvp >= 25 || worst.ge <= 35 ? "alarm" : "watch",
  };
}

// County FIPS state prefixes for the regional cash-rent average.
const STATE_FIPS_PREFIX: Record<string, string> = {
  DE: "10", MD: "24", VA: "51", IA: "19", IL: "17", IN: "18", KS: "20", NE: "31",
  OK: "40", OH: "39", KY: "21", ND: "38", SD: "46", MN: "27", AR: "05", MS: "28",
  LA: "22", NC: "37", SC: "45", GA: "13", TX: "48", WA: "53", OR: "41", ID: "16",
};

export function cashRentSignal(states: string[]): NewsletterSignal | null {
  if (COUNTY_CASH_RENTS_PROVENANCE.asOf === null) return null;
  // Region cropland cash-rent average — counties whose FIPS prefix is a member state.
  const prefixes = new Set(states.map((s) => STATE_FIPS_PREFIX[s]).filter(Boolean));
  const rents: number[] = [];
  for (const [fips, r] of Object.entries(COUNTY_CASH_RENTS)) {
    if (!prefixes.has(fips.slice(0, 2))) continue;
    if (r?.cropland && r.cropland > 20 && r.cropland < 2000) rents.push(r.cropland);
  }
  if (rents.length < 5) return null;
  const avg = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
  return {
    headline: `Cropland cash rent across the region: about $${avg}/acre`,
    takeaway: "The baseline when a dry year reopens rent talks.",
    body:
      `USDA NASS county cash-rent averages run about $${avg}/acre for cropland across the region's counties — ` +
      `the negotiation baseline when a drought year pressures both operators and landowners. A failed crop is ` +
      `exactly when rent terms and land ownership get reconsidered; document conditions before you renegotiate.`,
    source: `USDA NASS cash rents, ${COUNTY_CASH_RENTS_PROVENANCE.year} survey`,
    tone: "neutral",
  };
}

export function grainBidSignal(states: string[]): NewsletterSignal | null {
  if (STATE_GRAIN_BIDS_PROVENANCE.asOf === null) return null;
  // Lead with the region's own buyer board (falls back to the first member
  // state with a report).
  const pick = states.map((s) => ({ s, g: STATE_GRAIN_BIDS[s] })).find((x) => x.g);
  if (!pick) return null;
  const arrow = (d: string | null) => (d === "UP" ? "▲" : d === "DOWN" ? "▼" : "");
  const parts: string[] = [];
  for (const [key, lbl] of [["corn", "Corn"], ["soybeans", "Soybeans"], ["wheat", "Wheat"]] as const) {
    const b = pick.g.bids[key];
    if (b) parts.push(`${lbl} $${b.avg.toFixed(2)}${arrow(b.direction)}`);
  }
  if (parts.length === 0) return null;
  return {
    headline: `${stateName(pick.s)} elevator cash bids: ${parts.join(" · ")}`,
    takeaway: "What your local elevator is actually paying now.",
    body:
      `The average local grain-buyer bid in ${stateName(pick.s)} (USDA Market News, ${pick.g.reportDate}): ` +
      `${parts.join(", ")} per bushel — the public record of what the region's elevators are actually paying, ` +
      `arrows showing the day-over-day move. This is the price a short crop has to meet.`,
    source: `USDA AMS Market News grain bids, ${pick.g.reportDate}`,
    tone: "neutral",
  };
}

export function commodityPriceSignal(): NewsletterSignal | null {
  if (COMMODITY_PRICES_PROVENANCE.asOf === null) return null;
  const parts: string[] = [];
  const label: Record<string, string> = { corn: "Corn", soybeans: "Soybeans", wheat: "Wheat" };
  let stamp = "";
  for (const key of ["corn", "soybeans", "wheat"]) {
    const p = COMMODITY_PRICES[key];
    if (p) {
      parts.push(`${label[key]} $${p.pricePerBushel.toFixed(2)}/bu`);
      stamp = `${p.month} ${p.year}`;
    }
  }
  if (parts.length === 0) return null;
  return {
    headline: `Grain prices: ${parts.join(" · ")}`,
    takeaway: "The national benchmark your short crop has to beat.",
    body:
      `USDA's national average price received (${stamp}): ${parts.join(", ")}. This is the revenue side ` +
      `of the drought story — a short crop meets these prices to decide whether an operation clears its ` +
      `costs. Daily local elevator bids move around this benchmark; your buyer's board is the exact number.`,
    source: `USDA NASS Price Received, ${stamp}`,
    tone: "neutral",
  };
}

export function mortgageRateSignal(): NewsletterSignal {
  return {
    headline: `30-year mortgage: ${MORTGAGE_RATES.rate30}% (week of ${MORTGAGE_RATES.weekOf})`,
    takeaway: "The number under every home purchase this month.",
    body:
      `Freddie Mac's national average 30-year fixed is ${MORTGAGE_RATES.rate30}%` +
      (MORTGAGE_RATES.rate15 ? `, 15-year ${MORTGAGE_RATES.rate15}%` : "") +
      `, week of ${MORTGAGE_RATES.weekOf}. Every quarter-point moves the monthly payment and the income it ` +
      `takes to carry it — the number under every purchase decision this month.`,
    source: `Freddie Mac PMMS, week of ${MORTGAGE_RATES.weekOf}`,
    tone: "neutral",
  };
}

/**
 * Farmland VALUE benchmark (founder correction 2026-07-17: farmers read the
 * USDA ag-land survey, not home-price indexes). $/acre + year-over-year.
 */
export function farmlandValueSignal(states: string[]): NewsletterSignal | null {
  if (STATE_FARMLAND_PROVENANCE.asOf === null) return null;
  const rows = states.map((s) => ({ s, f: STATE_FARMLAND[s] })).filter((x) => x.f);
  if (rows.length === 0) return null;
  const parts = rows.map((x) => `${stateName(x.s)} $${x.f.dollarsPerAcre.toLocaleString("en-US")}${x.f.yoyPct != null ? ` (${x.f.yoyPct >= 0 ? "+" : ""}${x.f.yoyPct}%)` : ""}`);
  const year = rows[0].f.year;
  return {
    headline: `Farmland across the region: ${parts.join(" · ")}/acre`,
    takeaway: "Your collateral and equity benchmark for ground.",
    body:
      `USDA's ${year} farm real-estate values (land and buildings), year-over-year change in parentheses: ` +
      `${parts.join(", ")} per acre. The collateral and equity benchmark for ground in the region — your parcel ` +
      `turns on its own soil, water, and improvements. Not home prices.`,
    source: `USDA NASS Ag Land Asset Value, ${year}`,
    tone: "neutral",
  };
}

/**
 * Farm CAPITAL context (founder correction 2026-07-17: farms and ranches use
 * USDA/FSA/SBA/Farm Credit programs, not the consumer 30-year mortgage). A
 * program-context signal — the rates live on the FSA site and move monthly.
 */
export function farmFinanceSignal(): NewsletterSignal {
  return {
    headline: "Farm capital: FSA, USDA Rural Development, Farm Credit, SBA",
    takeaway: "Farm ground uses FSA/USDA/Farm Credit — not a mortgage.",
    body:
      "The ground-buying and operating lanes for a farm or ranch are not consumer mortgages: USDA Farm " +
      "Service Agency Farm Ownership and Operating loans (direct and guaranteed, including microloans and " +
      "beginning-farmer terms), USDA Rural Development (Business & Industry, Community Facilities, and REAP " +
      "for on-farm energy), the Farm Credit System, and SBA where a farm business qualifies. FSA sets and " +
      "publishes its direct-loan rates monthly; a lender or the county FSA office quotes the current number.",
    source: "USDA FSA / Rural Development program terms (fsa.usda.gov, rd.usda.gov)",
    tone: "neutral",
  };
}

/** Commercial capital — SBA + commercial mortgage, not consumer FHA/conventional. */
export function commercialFinanceSignal(): NewsletterSignal {
  return {
    headline: "Commercial capital: SBA 504/7(a), bank commercial mortgage",
    takeaway: "Owner-users buy on SBA 504/7(a) — not FHA.",
    body:
      "Owner-occupied commercial property is financed very differently from a home: SBA 504 (long-term, " +
      "fixed, for owner-users buying real estate) and SBA 7(a), conventional commercial mortgages from a " +
      "bank or credit union (typically 20–30% down, shorter terms, periodic balloons/resets), and " +
      "life-company or CMBS debt on larger deals. No FHA, no 30-year consumer fixed. Debt-service coverage, " +
      "not a personal income ratio, drives the underwriting.",
    source: "SBA 504/7(a) program terms (sba.gov); commercial lending norms",
    tone: "neutral",
  };
}

/** Hospitality capital — SBA 504 is the classic owner-operated-hotel lane. */
export function hospitalityFinanceSignal(): NewsletterSignal {
  return {
    headline: "Lodging capital: SBA 504/7(a), hotel-experienced commercial lenders",
    takeaway: "Hotels finance on RevPAR through SBA and hotel lenders.",
    body:
      "Hotels and inns are a specialized commercial asset: SBA 504 and 7(a) are the workhorse lanes for " +
      "owner-operated lodging (the SBA finances a large share of independent hotels), alongside conventional " +
      "hospitality lenders, franchise-affiliated financing, and CMBS on larger flags. Underwriting turns on " +
      "occupancy, ADR, and RevPAR history — not a consumer mortgage rate, which does not apply here.",
    source: "SBA 504/7(a) program terms (sba.gov); hospitality lending norms",
    tone: "neutral",
  };
}

/** Mobile-home-park capital — agency + commercial, not consumer mortgage. */
export function mhpFinanceSignal(): NewsletterSignal {
  return {
    headline: "Park capital: agency (Fannie/Freddie MHC), bank, SBA",
    takeaway: "Parks run on agency + SBA, underwriting the rent roll.",
    body:
      "Manufactured-housing communities have their own capital stack: Fannie Mae and Freddie Mac both run " +
      "dedicated MHC loan programs (often the best terms for stabilized parks), plus commercial bank debt " +
      "and SBA for smaller or value-add deals. Lenders underwrite the lot-rent roll, occupancy, and " +
      "utility structure — a consumer home mortgage does not apply to a park.",
    source: "Fannie Mae / Freddie Mac MHC programs; commercial lending norms",
    tone: "neutral",
  };
}

/** Land capital — land loans / seller finance / Farm Credit for rural ground. */
export function landFinanceSignal(): NewsletterSignal {
  return {
    headline: "Land capital: land loans, seller financing, Farm Credit for rural ground",
    takeaway: "Land loans want more down and a shorter term.",
    body:
      "Raw and unimproved land is financed on its own terms — land loans carry higher down payments (often " +
      "20–50%) and shorter terms than a home mortgage, seller financing is common, and for agricultural or " +
      "rural acreage the Farm Credit System and USDA/FSA programs apply. A conventional home mortgage " +
      "generally does not finance vacant land.",
    source: "Farm Credit System; USDA/FSA; land-lending norms",
    tone: "neutral",
  };
}

export function priceTrendSignal(states: string[]): NewsletterSignal | null {
  const withHpi = states.map((c) => ({ c, h: STATE_HPI[c] })).filter((x) => x.h);
  if (withHpi.length === 0) return null;
  const pick = withHpi[0];
  return {
    headline: `${stateName(pick.c)} home prices: ${pick.h.longRunAnnualPct}%/yr over ${pick.h.longRunSpanYears} years`,
    takeaway: "Long-run history — the baseline, not a forecast.",
    body:
      `FHFA's index puts ${stateName(pick.c)}'s long-run home-price change at about ${pick.h.longRunAnnualPct}% a year ` +
      `(${pick.h.longRunSpanYears}-year average), latest data ${pick.h.latestQuarter}. History, not a forecast — but ` +
      `the baseline for any equity or hold-versus-sell conversation.`,
    source: `FHFA House Price Index, ${pick.h.latestQuarter}`,
    tone: "neutral",
  };
}

export function electricitySignal(states: string[]): NewsletterSignal | null {
  const rows = states.map((c) => ({ c, e: STATE_ELECTRICITY[c] })).filter((x) => x.e?.resAvgMonthlyBill);
  if (rows.length === 0) return null;
  const parts = rows.map((x) => `${stateName(x.c)} ~$${x.e.resAvgMonthlyBill} (${x.e.resPriceCentsKwh}¢)`);
  return {
    headline: `Power across the region: ${parts.map((p) => p.split(" ~")[0] + " $" + p.split("~$")[1].split(" ")[0]).join(" · ")}`,
    takeaway: "A fixed cost of ownership — and an irrigation input.",
    body:
      `EIA state-average residential electric bills across the region: ${parts.join(", ")} per month. ` +
      `A fixed cost of ownership — and, for irrigation and poultry-house operations, a real input line when the ` +
      `grid runs hot in a dry summer.`,
    source: "U.S. EIA state averages",
    tone: "neutral",
  };
}

/**
 * Input costs (founder direction 2026-07-17: seed and fertilizer costs for
 * next year). USDA Prices Paid indexes with year-over-year — the direction of
 * next season's input budget.
 */
export function inputCostSignal(): NewsletterSignal | null {
  if (INPUT_COSTS_PROVENANCE.asOf === null) return null;
  const label: Record<string, string> = { fertilizer: "Fertilizer", seed: "Seed", fuel: "Fuel", feed: "Feed", chemicals: "Chemicals" };
  const parts: string[] = [];
  let stamp = "";
  for (const key of ["fertilizer", "seed", "fuel", "feed"]) {
    const c = INPUT_COSTS[key];
    if (c && c.yoyPct != null) {
      parts.push(`${label[key]} ${c.yoyPct >= 0 ? "+" : ""}${c.yoyPct}%`);
      stamp = `${c.period} ${c.year}`;
    }
  }
  if (parts.length === 0) return null;
  const worst = Math.max(...["fertilizer", "seed", "fuel", "feed"].map((k) => INPUT_COSTS[k]?.yoyPct ?? 0));
  return {
    headline: `Input costs year-over-year: ${parts.join(" · ")}`,
    takeaway: "Run these against next year's plan now.",
    body:
      `USDA Prices Paid, ${stamp}, year-over-year: ${parts.join(", ")}. These are the numbers to run against next ` +
      `year's plan now — a short crop meeting rising fuel and fertilizer is exactly the squeeze that decides ` +
      `acreage, inputs, and whether to lock prices early.`,
    source: `USDA NASS Prices Paid, ${stamp}`,
    tone: worst >= 20 ? "watch" : "neutral",
  };
}

export { stateName };
