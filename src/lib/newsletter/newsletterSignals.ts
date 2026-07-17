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
 */

import { COMMODITY_PRICES, COMMODITY_PRICES_PROVENANCE } from "@/lib/property/commodityPricesGenerated";
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
  /** The sourced number + plain-language read. */
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

export function cashRentSignal(states: string[]): NewsletterSignal | null {
  if (COUNTY_CASH_RENTS_PROVENANCE.asOf === null) return null;
  // Region-average cropland cash rent across resolved counties in-state.
  const rents: number[] = [];
  for (const fips of Object.keys(COUNTY_CASH_RENTS)) {
    // County FIPS state prefix → USPS via a minimal map is overkill here; the
    // cash-rent snapshot is county-keyed, so we sample all and let the edition
    // note it's context. Guard to plausible cropland values.
    const r = COUNTY_CASH_RENTS[fips];
    if (r?.cropland && r.cropland > 20 && r.cropland < 600) rents.push(r.cropland);
  }
  if (rents.length < 20) return null;
  const avg = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
  return {
    headline: `Ground rent context: cropland averages about $${avg}/acre`,
    body:
      `USDA NASS county cash-rent averages run about $${avg}/acre for cropland nationally — the negotiation ` +
      `baseline when a drought year pressures both operators and landowners. A failed crop is exactly when ` +
      `rent terms and land ownership get reconsidered.`,
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
  const pick = states.map((s) => ({ s, f: STATE_FARMLAND[s] })).find((x) => x.f);
  if (!pick) return null;
  const yoy = pick.f.yoyPct;
  return {
    headline: `${stateName(pick.s)} farmland: $${pick.f.dollarsPerAcre.toLocaleString("en-US")}/acre` + (yoy != null ? `, ${yoy >= 0 ? "+" : ""}${yoy}% year-over-year` : ""),
    body:
      `USDA's ${pick.f.year} farm real-estate value for ${stateName(pick.s)} is $${pick.f.dollarsPerAcre.toLocaleString("en-US")} per acre (land and buildings)` +
      (yoy != null ? `, ${yoy >= 0 ? "up" : "down"} ${Math.abs(yoy)}% from the prior year` : "") +
      `. The collateral and equity benchmark for ground in this state — not home prices.`,
    source: `USDA NASS Ag Land Asset Value, ${pick.f.year}`,
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

export function priceTrendSignal(states: string[]): NewsletterSignal | null {
  const withHpi = states.map((c) => ({ c, h: STATE_HPI[c] })).filter((x) => x.h);
  if (withHpi.length === 0) return null;
  const pick = withHpi[0];
  return {
    headline: `${stateName(pick.c)} home prices: ${pick.h.longRunAnnualPct}%/yr over ${pick.h.longRunSpanYears} years`,
    body:
      `FHFA's index puts ${stateName(pick.c)}'s long-run home-price change at about ${pick.h.longRunAnnualPct}% a year ` +
      `(${pick.h.longRunSpanYears}-year average), latest data ${pick.h.latestQuarter}. History, not a forecast — but ` +
      `the baseline for any equity or hold-versus-sell conversation.`,
    source: `FHFA House Price Index, ${pick.h.latestQuarter}`,
    tone: "neutral",
  };
}

export function electricitySignal(states: string[]): NewsletterSignal | null {
  const pick = states.map((c) => ({ c, e: STATE_ELECTRICITY[c] })).find((x) => x.e?.resAvgMonthlyBill);
  if (!pick) return null;
  return {
    headline: `${stateName(pick.c)} power: ~$${pick.e.resAvgMonthlyBill}/mo residential`,
    body:
      `EIA's state average residential electric bill in ${stateName(pick.c)} runs about $${pick.e.resAvgMonthlyBill}/month ` +
      `at ${pick.e.resPriceCentsKwh}¢/kWh — a fixed cost of ownership worth naming alongside the mortgage.`,
    source: "U.S. EIA state averages",
    tone: "neutral",
  };
}

export { stateName };
