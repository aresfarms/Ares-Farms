/**
 * newsletterDispatch — "The Dispatch": the weekly Furlong Compass as a short
 * note from someone who knows your ground, NOT a card stack (founder direction
 * 2026-07-17, after two rejected card layouts: "figure out a new format
 * altogether" — the format that reads least like content-marketing wins).
 *
 * Two short prose paragraphs that weave the week's real numbers, one thing to
 * do, and a sign-off that hands the depth to the monthly digest. Same sourced,
 * dated public facts as the signal pool — woven, not bulleted. Deterministic:
 * same asOf + same snapshots → same words (no clock, no randomness).
 *
 * The opening of the farm dispatch is also what leads the front page (the
 * Compass hero), so it has to stand on its own in one or two sentences.
 *
 * Scanned by verify:brief-copy.
 */

import { COMMODITY_PRICES, COMMODITY_PRICES_PROVENANCE } from "@/lib/property/commodityPricesGenerated";
import { INPUT_COSTS, INPUT_COSTS_PROVENANCE } from "@/lib/property/inputCostsGenerated";
import { MORTGAGE_RATES } from "@/lib/property/mortgageRatesGenerated";
import { STATE_CROP_CONDITIONS, STATE_CROP_CONDITIONS_PROVENANCE } from "@/lib/property/stateCropConditionsGenerated";
import { STATE_DROUGHT, STATE_DROUGHT_PROVENANCE } from "@/lib/property/stateDroughtGenerated";
import { STATE_FARMLAND, STATE_FARMLAND_PROVENANCE } from "@/lib/property/stateFarmlandGenerated";
import { STATE_GRAIN_BIDS, STATE_GRAIN_BIDS_PROVENANCE } from "@/lib/property/stateGrainBidsGenerated";

import {
  FARM_MARGINS_PROVENANCE,
  POULTRY_GROWER_NOTE,
  truckloadLine,
  truckloadMargin,
  type CropCommodity,
  type TruckloadMargin,
} from "@/lib/property/farmMarginsCurated";

import { landFinanceSignal, NEWSLETTER_REGIONS, stateName } from "./newsletterSignals";
import type { NewsletterAudience } from "./newsletterEditions";

export interface CompassDispatch {
  audience: NewsletterAudience;
  audienceLabel: string;
  regionKey: string;
  regionLabel: string;
  /** Bare region name for a sentence opener, e.g. "Delmarva". */
  regionShort: string;
  asOf: string;
  /** "The Furlong Compass · the Delmarva · July 17, 2026". */
  stamp: string;
  /** ~2 short prose paragraphs — the note itself. */
  paragraphs: string[];
  /** The one thing to do this week. */
  move: string;
  /** What the prices actually MEAN — per-truckload margins (farm only). */
  economics?: {
    heading: string;
    crops: Array<TruckloadMargin & { line: string }>;
    poultryNote: string;
    provenanceNote: string;
  };
  /** Hands the depth to the monthly digest. */
  signoff: string;
  /** One tight sourcing/disclaimer line. */
  disclaimer: string;
}

const AUDIENCE_LABEL: Record<NewsletterAudience, string> = {
  mixed: "The Full Read",
  farm: "Farms & Ranches",
  residential: "Home Buyers",
  commercial: "Commercial Property",
  hospitality: "Lodging & Hospitality",
  "mobile-home-park": "Mobile Home Park Owners",
  land: "Land Buyers",
  finance: "Lenders & Capital Partners",
};

const MOVE: Record<NewsletterAudience, string> = {
  mixed: "Pick the edition that fits your work — each goes deep on its own board.",
  farm: "Get out and photograph your fields. A dry-year photo in July is the disaster claim you'll want this fall.",
  finance: "Take a fresh look at renewal terms and reserve posture on your row-crop borrowers.",
  residential: "Buying on a private well? Confirm depth and condition before you make an offer.",
  commercial: "Underwrite on debt-service coverage, and watch demand tied to farm income.",
  hospitality: "Confirm occupancy and ADR history against the local tourism draw before you underwrite.",
  "mobile-home-park": "Read the lot-rent roll against the region's conditions before you commit.",
  land: "Water and cash rent set the value here — check both before you bid.",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Deterministic "July 17, 2026" from a YYYY-MM-DD string (no clock). */
function longDate(asOf: string): string {
  const [y, m, d] = asOf.split("-").map(Number);
  if (!y || !m || !d) return asOf;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "the Delmarva (Delaware · Maryland · Virginia)" → "Delmarva". */
function regionShortName(label: string): string {
  return label.replace(/^the\s+/i, "").replace(/\s*\(.*$/, "").trim();
}

// ── Structured fact accessors (same selection logic as the signal pool) ──────

function droughtFact(states: string[]): { name: string; severePlus: number } | null {
  if (STATE_DROUGHT_PROVENANCE.mapDate === null) return null;
  let worst: { code: string; severePlus: number } | null = null;
  for (const c of states) {
    const d = STATE_DROUGHT[c];
    if (!d) continue;
    if (!worst || d.severePlus > worst.severePlus) worst = { code: c, severePlus: d.severePlus };
  }
  return worst && worst.severePlus >= 5 ? { name: stateName(worst.code), severePlus: Math.round(worst.severePlus) } : null;
}

function cornFact(states: string[]): { name: string; ge: number; pvp: number } | null {
  if (STATE_CROP_CONDITIONS_PROVENANCE.asOf === null) return null;
  let worst: { code: string; ge: number; pvp: number } | null = null;
  for (const c of states) {
    const x = STATE_CROP_CONDITIONS[c]?.corn;
    if (!x) continue;
    if (!worst || x.poorVeryPoor > worst.pvp) worst = { code: c, ge: x.goodExcellent, pvp: x.poorVeryPoor };
  }
  return worst ? { name: stateName(worst.code), ge: worst.ge, pvp: worst.pvp } : null;
}

function cornBidFact(states: string[]): number | null {
  return localBid(states, "corn");
}

/** Region's local elevator bid for a commodity (first member with a report). */
function localBid(states: string[], commodity: CropCommodity): number | null {
  if (STATE_GRAIN_BIDS_PROVENANCE.asOf === null) return null;
  for (const c of states) {
    const bid = STATE_GRAIN_BIDS[c]?.bids?.[commodity];
    if (bid) return bid.avg;
  }
  return null;
}

/** Per-truckload economics for the region's crops — what the prices MEAN. */
function farmEconomics(states: string[]): NonNullable<CompassDispatch["economics"]> {
  const commodities: CropCommodity[] = ["corn", "soybeans", "wheat"];
  const crops = commodities.map((c) => {
    const m = truckloadMargin(c, localBid(states, c));
    return { ...m, line: truckloadLine(m) };
  });
  return {
    heading: "What that means, by the truckload",
    crops,
    poultryNote: POULTRY_GROWER_NOTE.text,
    provenanceNote: `${FARM_MARGINS_PROVENANCE.costSource}. ${FARM_MARGINS_PROVENANCE.note}`,
  };
}

function cornPriceFact(): number | null {
  if (COMMODITY_PRICES_PROVENANCE.asOf === null) return null;
  return COMMODITY_PRICES.corn?.pricePerBushel ?? null;
}

function inputFact(): { fert: number | null; fuel: number | null } {
  if (INPUT_COSTS_PROVENANCE.asOf === null) return { fert: null, fuel: null };
  return { fert: INPUT_COSTS.fertilizer?.yoyPct ?? null, fuel: INPUT_COSTS.fuel?.yoyPct ?? null };
}

function farmlandLead(states: string[]): { name: string; perAcre: number } | null {
  if (STATE_FARMLAND_PROVENANCE.asOf === null) return null;
  const row = states.map((c) => ({ c, f: STATE_FARMLAND[c] })).find((x) => x.f);
  return row?.f ? { name: stateName(row.c), perAcre: row.f.dollarsPerAcre } : null;
}

const pct = (n: number): string => `${n >= 0 ? "up " : "down "}${Math.round(Math.abs(n))}%`;
const money = (n: number): string => `$${n.toFixed(2)}`;
const acre = (n: number): string => `$${n.toLocaleString("en-US")}`;

// ── Per-audience prose ───────────────────────────────────────────────────────

function farmParagraphs(short: string, states: string[]): string[] {
  const corn = cornFact(states);
  const drought = droughtFact(states);
  const bid = cornBidFact(states) ?? cornPriceFact();
  const inputs = inputFact();

  // Paragraph 1 — the crop and the water.
  const p1: string[] = [];
  if (corn && corn.pvp >= 15) {
    p1.push(`${short} — it's a hard week for the crop.`);
    p1.push(
      `${corn.name}'s corn is ${corn.ge}% good-to-excellent, ${corn.pvp}% already poor or worse` +
        (drought ? `, and ${drought.name} is ${drought.severePlus}% in severe drought or worse.` : ".")
    );
  } else if (drought) {
    p1.push(`${short} — the dry stretch is the story this week.`);
    p1.push(
      `${drought.name} is ${drought.severePlus}% in severe drought or worse` +
        (corn ? `, and it's showing in the corn — ${corn.ge}% good-to-excellent in ${corn.name}.` : ", the water reality behind everything else.")
    );
  } else {
    p1.push(`${short} — a steadier week, but the numbers still move the plan.`);
  }

  // Paragraph 2 — prices and the cost squeeze.
  const p2: string[] = [];
  if (bid != null) p2.push(`Elevators are paying about ${money(bid)} for corn`);
  if (inputs.fert != null || inputs.fuel != null) {
    const costs = [
      inputs.fert != null ? `fertilizer's ${pct(inputs.fert)}` : null,
      inputs.fuel != null ? `fuel ${pct(inputs.fuel)}` : null,
    ].filter(Boolean).join(", ");
    p2.push(`${bid != null ? ", and your costs aren't helping" : "Your costs aren't helping"} — ${costs} over last year.`);
  } else if (bid != null) {
    p2.push(".");
  }

  const paragraphs = [p1.join(" ")];
  if (p2.length) paragraphs.push(p2.join("").replace(/\s\./g, "."));
  return paragraphs;
}

/** Non-farm dispatches: the regional condition, then their capital reality. */
function genericParagraphs(
  short: string,
  states: string[],
  capitalLine: string,
  extra?: string
): string[] {
  const drought = droughtFact(states);
  const corn = cornFact(states);
  const p1 =
    drought
      ? `${short} — the farm economy sets the tone here, and it's a dry, stressed one this week: ${drought.name} is ${drought.severePlus}% in severe drought or worse${corn ? `, corn ${corn.ge}% good-to-excellent` : ""}.`
      : `${short} — a steadier week across the region.`;
  const p2 = extra ? `${capitalLine} ${extra}` : capitalLine;
  return [p1, p2];
}

/**
 * Compose the weekly Dispatch for an audience + region, or null if the region
 * is unknown. `asOf` is passed in (deterministic; no clock here).
 */
export function buildCompassDispatch(
  audience: NewsletterAudience,
  regionKey: string,
  asOf: string
): CompassDispatch | null {
  const region = NEWSLETTER_REGIONS[regionKey];
  if (!region) return null;
  const short = regionShortName(region.label);
  const states = region.states;

  let paragraphs: string[];
  switch (audience) {
    case "farm":
    case "mixed":
      paragraphs = farmParagraphs(short, states);
      break;
    case "residential": {
      paragraphs = genericParagraphs(
        short,
        states,
        `The 30-year mortgage sits at ${MORTGAGE_RATES.rate30}% this week — the number under every purchase.`,
        `On a private well, a dry year is felt first, so it's worth a hard look before you commit.`
      );
      break;
    }
    case "commercial":
      paragraphs = genericParagraphs(short, states,
        "Commercial money here is SBA 504/7(a) for owner-users, underwritten on debt-service coverage — not a home mortgage.");
      break;
    case "hospitality":
      paragraphs = genericParagraphs(short, states,
        "Lodging finances on occupancy, ADR, and RevPAR through the SBA and hotel-experienced lenders — not a consumer mortgage.");
      break;
    case "mobile-home-park":
      paragraphs = genericParagraphs(short, states,
        "Parks run on agency and SBA capital, underwritten on the lot-rent roll — not a consumer mortgage.");
      break;
    case "land": {
      const farmland = farmlandLead(states);
      paragraphs = genericParagraphs(short, states, landFinanceSignal().takeaway,
        farmland ? `Ground in ${farmland.name} runs about ${acre(farmland.perAcre)}/acre — but each parcel turns on its own water and access.` : undefined);
      break;
    }
    case "finance":
      paragraphs = genericParagraphs(short, states,
        "For a lender, a weak crop and rising inputs thin operator cash flow and pressure ag operating lines;",
        "farmland values hold the collateral side up. Row-crop-concentrated books warrant a closer look at renewals and reserves.");
      break;
    default:
      paragraphs = farmParagraphs(short, states);
  }

  return {
    audience,
    audienceLabel: AUDIENCE_LABEL[audience],
    regionKey,
    regionLabel: region.label,
    regionShort: short,
    asOf,
    stamp: `The Furlong Compass · the ${short} · ${longDate(asOf)}`,
    paragraphs,
    move: MOVE[audience],
    economics: audience === "farm" || audience === "mixed" ? farmEconomics(states) : undefined,
    signoff: "The full numbers and the month's deeper reads are in the monthly digest. — Furlong",
    disclaimer:
      "Every number here is a sourced, dated public fact (U.S. Drought Monitor, USDA, Freddie Mac, FHFA, EIA). Furlong reports them — it does not predict prices, yields, or markets, and it is not a lender.",
  };
}
