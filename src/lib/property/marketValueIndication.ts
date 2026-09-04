/**
 * marketValueIndication — property-type-aware Furlong value screening.
 *
 * IMPORTANT: there is no universal "property estimate" formula. Residential,
 * farm/acreage, and income-producing commercial property are valued from
 * different evidence. This runtime therefore selects a method by canonical
 * property profile and refuses to publish a number when the required evidence
 * is missing.
 *
 * - Residential: jurisdiction assessment (only when its vintage is known)
 *   reconciled to the jurisdiction's published assessment ratio and walked
 *   forward on the FHFA SINGLE-FAMILY house-price index from the exact quarter.
 * - Farm/agricultural: USDA NASS state farm-real-estate $/acre as a deliberately
 *   broad state-level screening anchor.
 * - Commercial/hospitality/mobile-home-park: direct capitalization ONLY when
 *   verified/project NOI and a market-supported cap-rate range are supplied.
 * - Bare non-agricultural land: no value indication without closed-sale land
 *   comparables or another parcel-specific market basis.
 *
 * A known asking/contract price is displayed as market evidence, but asking
 * price is never silently converted into Furlong's opinion of value.
 */

import { STATE_HPI, STATE_HPI_PROVENANCE } from "@/lib/property/stateHpiGenerated";
import { STATE_FARMLAND, STATE_FARMLAND_PROVENANCE } from "@/lib/property/stateFarmlandGenerated";
import { classifyPropertyProfile, type PropertyProfileId } from "@/lib/property/propertyProfile";

export interface AssessmentBasis {
  /** Fraction of market value the jurisdiction assesses to. 1.0 = 100%. */
  ratioOfMarket: number;
  note: string;
  sourceUrl: string;
}

export const ASSESSMENT_BASES: Record<string, AssessmentBasis> = {
  "DE-Sussex": {
    ratioOfMarket: 1.0,
    note:
      "Sussex County's countywide reassessment states new assessments are at 100% of fair market value; " +
      "the parcel feed must still supply/verify the assessment vintage before Furlong indexes a specific parcel.",
    sourceUrl: "https://sussexcountyde.gov/reassessment",
  },
  MD: {
    ratioOfMarket: 1.0,
    note:
      "Maryland SDAT assesses real property at 100% of full cash/market value on its reassessment cycle.",
    sourceUrl: "https://dat.maryland.gov/realproperty/",
  },
};

export function assessmentBasisFor(stateCode?: string | null, county?: string | null): AssessmentBasis | null {
  const state = (stateCode ?? "").trim().toUpperCase();
  if (!state) return null;
  const countyName = (county ?? "").replace(/\s+county\b/i, "").trim();
  if (countyName) {
    const keyed = ASSESSMENT_BASES[`${state}-${countyName}`];
    if (keyed) return keyed;
  }
  return ASSESSMENT_BASES[state] ?? null;
}

export type IndicationStatus =
  | "indicated"
  | "needs-property-evidence"
  | "no-registered-basis"
  | "no-assessed-value";

export type ValuationMethodCode =
  | "residential-assessment-hpi"
  | "farm-state-acreage"
  | "commercial-income-capitalization"
  | "none";

export interface MarketValueIndication {
  status: IndicationStatus;
  profileId: PropertyProfileId;
  methodCode: ValuationMethodCode;
  confidence: "screening-low" | "screening-medium" | "not-produced";
  lowUsd: number | null;
  midUsd: number | null;
  highUsd: number | null;
  method: string;
  cautions: string[];
  sources: string[];
  requiredInputs: string[];
  divergence: {
    knownPriceUsd: number;
    knownPriceLabel: string;
    multipleOfMid: number;
    verdict: string;
  } | null;
}

const RESIDENTIAL_SCREENING_BAND = 0.20;
const FARM_SCREENING_BAND = 0.40;
const DIVERGENCE_MULTIPLE = 1.35;

const roundThousand = (value: number) => Math.round(value / 1000) * 1000;

function numericAcreage(value?: number | null, acreageText?: string | null): number | null {
  if (value != null && Number.isFinite(value) && value > 0) return value;
  const match = (acreageText ?? "").replace(/,/g, "").match(/([0-9]+(?:\.[0-9]+)?)\s*(?:acres?|ac\b)/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function quarterFromDate(raw?: string | null): string | null {
  const text = (raw ?? "").trim();
  if (!text) return null;

  if (/^\d{12,13}$/.test(text)) {
    const epoch = Number(text);
    const date = new Date(text.length === 13 ? epoch : epoch * 1000);
    if (!Number.isNaN(date.getTime())) {
      return `${date.getUTCFullYear()}Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
    }
  }

  let year: number | null = null;
  let month: number | null = null;
  let compact = text.match(/^(\d{4})(\d{2})$/);
  if (compact) {
    year = Number(compact[1]);
    month = Number(compact[2]);
  }
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]);
  } else if (!compact) {
    match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      month = Number(match[1]);
      year = Number(match[3]);
    }
  }
  if (!year || !month || month < 1 || month > 12) return null;
  return `${year}Q${Math.floor((month - 1) / 3) + 1}`;
}

function exactResidentialIndexFactor(stateCode: string, assessmentAsOf?: string | null): { factor: number; fromQuarter: string; toQuarter: string } | null {
  const hpi = STATE_HPI[stateCode.toUpperCase()];
  const fromQuarter = quarterFromDate(assessmentAsOf);
  if (!hpi || !fromQuarter) return null;
  const fromIndex = hpi.recentQuarterly[fromQuarter];
  if (!(fromIndex > 0) || !(hpi.latestIndex > 0)) return null;
  return {
    factor: hpi.latestIndex / fromIndex,
    fromQuarter,
    toQuarter: hpi.latestQuarter,
  };
}

function knownPriceDivergence(args: {
  knownPriceUsd?: number | null;
  knownPriceLabel?: string | null;
  mid: number;
  methodCode: ValuationMethodCode;
}): MarketValueIndication["divergence"] {
  const known = args.knownPriceUsd;
  if (known == null || known <= 0 || args.mid <= 0) return null;
  const multiple = known / args.mid;
  if (multiple < DIVERGENCE_MULTIPLE && multiple > 1 / DIVERGENCE_MULTIPLE) return null;

  const label = args.knownPriceLabel ?? "Known market price";
  const transactionLevel = /under contract|contract|closed|sold/i.test(label);
  const methodDescription =
    args.methodCode === "commercial-income-capitalization"
      ? "income-capitalization screen"
      : args.methodCode === "farm-state-acreage"
        ? "state agricultural acreage screen"
        : "assessment/index screen";

  const above = multiple > 1;
  const verdict = transactionLevel
    ? `The transaction-level price is materially ${above ? "above" : "below"} the ${methodDescription}. Treat that gap as evidence that the model is missing property-specific market facts; reconcile the contract/sale evidence, condition, income, entitlements and comparable sales before relying on the screen.`
    : `The asking/list price is materially ${above ? "above" : "below"} the ${methodDescription}. Asking price is a seller signal, not proof of market value. Reconcile it against closed-sale or income evidence before treating either number as authoritative.`;

  return {
    knownPriceUsd: known,
    knownPriceLabel: label,
    multipleOfMid: Math.round(multiple * 100) / 100,
    verdict,
  };
}

function commercialIncomeIndication(args: {
  profileId: PropertyProfileId;
  noiAnnual?: number | null;
  capRateLowPct?: number | null;
  capRateHighPct?: number | null;
  knownPriceUsd?: number | null;
  knownPriceLabel?: string | null;
}): MarketValueIndication {
  const noi = args.noiAnnual ?? null;
  const capA = args.capRateLowPct ?? null;
  const capB = args.capRateHighPct ?? null;
  const valid = noi != null && noi > 0 && capA != null && capA > 0 && capB != null && capB > 0;
  if (!valid) {
    return {
      status: "needs-property-evidence",
      profileId: args.profileId,
      methodCode: "none",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      divergence: null,
      method:
        "Furlong does not apply a residential house-price index to commercial or hospitality property. " +
        "A defensible screen here needs property/project NOI and a market-supported capitalization-rate range (or closed-sale comparables).",
      cautions: [
        "The county assessment is a tax/assessment fact, not a substitute for an income-property valuation.",
        "For hotels and other operating businesses, real-estate value can differ from going-concern/business value; an appraisal may require allocations and additional methods.",
      ],
      sources: [],
      requiredInputs: ["verified or modeled property/project NOI", "market-supported cap-rate range or closed-sale comparable evidence"],
    };
  }

  const capLow = Math.min(capA, capB);
  const capHigh = Math.max(capA, capB);
  const midCap = (capLow + capHigh) / 2;
  const low = roundThousand(noi / (capHigh / 100));
  const mid = roundThousand(noi / (midCap / 100));
  const high = roundThousand(noi / (capLow / 100));
  return {
    status: "indicated",
    profileId: args.profileId,
    methodCode: "commercial-income-capitalization",
    confidence: "screening-medium",
    lowUsd: low,
    midUsd: mid,
    highUsd: high,
    divergence: knownPriceDivergence({ knownPriceUsd: args.knownPriceUsd, knownPriceLabel: args.knownPriceLabel, mid, methodCode: "commercial-income-capitalization" }),
    method:
      `Income-capitalization screen: property/project NOI $${Math.round(noi).toLocaleString("en-US")}/yr divided by a ${capLow.toFixed(2)}%–${capHigh.toFixed(2)}% market cap-rate range produces an indicated ${low.toLocaleString("en-US")}–${high.toLocaleString("en-US")} range (midpoint ${mid.toLocaleString("en-US")}).`,
    cautions: [
      "The cap-rate range must come from current market evidence; Furlong does not invent it from a generic national property-type average.",
      "This is a direct-capitalization screen, not an appraisal. Lease quality, reserves, deferred maintenance, capex, franchise/management terms, intangibles and stabilized-vs-current operations can materially change value.",
    ],
    sources: ["Appraisal Institute — income capitalization/direct capitalization methodology; market-derived capitalization rates are required."],
    requiredInputs: [],
  };
}

export function indicateMarketValue(args: {
  assessedTotalValue?: number | null;
  assessmentAsOf?: string | null;
  stateCode?: string | null;
  county?: string | null;
  knownPriceUsd?: number | null;
  knownPriceLabel?: string | null;
  propertyType?: string | null;
  landUse?: string | null;
  acreage?: number | null;
  acreageText?: string | null;
  noiAnnual?: number | null;
  capRateLowPct?: number | null;
  capRateHighPct?: number | null;
}): MarketValueIndication {
  const profile = classifyPropertyProfile({
    propertyType: args.propertyType ?? args.landUse ?? null,
    description: args.landUse ?? null,
    acreageText: args.acreageText ?? null,
  });
  const state = (args.stateCode ?? "").trim().toUpperCase();

  if (profile.id === "commercial" || profile.id === "hospitality" || profile.id === "mobile-home-park") {
    return commercialIncomeIndication({
      profileId: profile.id,
      noiAnnual: args.noiAnnual,
      capRateLowPct: args.capRateLowPct,
      capRateHighPct: args.capRateHighPct,
      knownPriceUsd: args.knownPriceUsd,
      knownPriceLabel: args.knownPriceLabel,
    });
  }

  if (profile.id === "farm") {
    const acres = numericAcreage(args.acreage, args.acreageText);
    const farmland = STATE_FARMLAND[state];
    if (!acres || !farmland) {
      return {
        status: "needs-property-evidence",
        profileId: profile.id,
        methodCode: "none",
        confidence: "not-produced",
        lowUsd: null,
        midUsd: null,
        highUsd: null,
        divergence: null,
        method: "A farm-value screen needs acreage plus a current agricultural market anchor. Furlong will not use the residential FHFA HPI for a farm.",
        cautions: ["USDA state averages are context, not parcel-specific appraisals; productivity, improvements, development pressure, soils, water, easements and location can move value sharply."],
        sources: [],
        requiredInputs: [!acres ? "verified acreage" : "", !farmland ? "USDA/state agricultural land-value benchmark" : ""].filter(Boolean),
      };
    }
    const rawMid = acres * farmland.dollarsPerAcre;
    const mid = roundThousand(rawMid);
    const low = roundThousand(rawMid * (1 - FARM_SCREENING_BAND));
    const high = roundThousand(rawMid * (1 + FARM_SCREENING_BAND));
    return {
      status: "indicated",
      profileId: profile.id,
      methodCode: "farm-state-acreage",
      confidence: "screening-low",
      lowUsd: low,
      midUsd: mid,
      highUsd: high,
      divergence: knownPriceDivergence({ knownPriceUsd: args.knownPriceUsd, knownPriceLabel: args.knownPriceLabel, mid, methodCode: "farm-state-acreage" }),
      method:
        `Agricultural acreage screen: ${acres.toLocaleString("en-US", { maximumFractionDigits: 2 })} acres × USDA NASS ${farmland.year} ${state} average farm real-estate value ($${farmland.dollarsPerAcre.toLocaleString("en-US")}/acre) = about $${mid.toLocaleString("en-US")}, shown with a deliberately wide ±${Math.round(FARM_SCREENING_BAND * 100)}% state-average screening band.`,
      cautions: [
        "USDA NASS farm real-estate value is a STATE average for land and buildings, not a comparable-sale appraisal of this parcel.",
        "Soils, productive acres, irrigation/water, buildings, easements, development pressure, conservation restrictions, access and local closed sales can move an individual farm far outside this band.",
      ],
      sources: [`${STATE_FARMLAND_PROVENANCE.source}, ${farmland.year}; snapshot ${STATE_FARMLAND_PROVENANCE.asOf ?? "date not stated"}.`],
      requiredInputs: [],
    };
  }

  if (profile.id === "land") {
    return {
      status: "needs-property-evidence",
      profileId: profile.id,
      methodCode: "none",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      divergence: null,
      method: "Furlong will not apply a residential HPI to bare land. A land-value indication needs closed land-sale comparables or another parcel-specific market basis.",
      cautions: ["Entitlements, utilities, access, frontage, soils, wetlands, floodplain and development potential can dominate land value."],
      sources: [],
      requiredInputs: ["recent closed comparable land sales or appraiser-supported land-value evidence"],
    };
  }

  // Residential only from here down.
  if (args.assessedTotalValue == null || args.assessedTotalValue <= 0) {
    return {
      status: "no-assessed-value",
      profileId: profile.id,
      methodCode: "none",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      divergence: null,
      method: "No residential estimate could be produced because no jurisdiction assessed value was returned for this address.",
      cautions: ["Furlong currently has no closed-sale residential comparable feed for this address, so it will not manufacture a replacement number."],
      sources: [],
      requiredInputs: ["jurisdiction assessed value with known vintage, or recent closed comparable sales"],
    };
  }

  const basis = assessmentBasisFor(args.stateCode, args.county);
  if (!basis) {
    return {
      status: "no-registered-basis",
      profileId: profile.id,
      methodCode: "none",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      divergence: null,
      method:
        `An assessed value of $${args.assessedTotalValue.toLocaleString("en-US")} was returned, but this jurisdiction's assessment-to-market ratio is not registered. Furlong will not guess the conversion.`,
      cautions: ["The assessed figure remains a tax/assessment fact, not Furlong's market-value opinion."],
      sources: [],
      requiredInputs: ["verified jurisdiction assessment basis"],
    };
  }

  if (!args.assessmentAsOf) {
    return {
      status: "needs-property-evidence",
      profileId: profile.id,
      methodCode: "none",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      divergence: null,
      method:
        `The jurisdiction returned a $${args.assessedTotalValue.toLocaleString("en-US")} assessment but did not publish the assessment vintage with this parcel record. Furlong will not pretend the fetch date is the valuation date or walk an undated assessment forward on a price index.`,
      cautions: [basis.note, "Verify the assessment's effective date or use current closed-sale evidence before producing a residential estimate."],
      sources: [basis.sourceUrl],
      requiredInputs: ["source-verified assessment effective date or recent closed residential comparable sales"],
    };
  }

  const indexed = exactResidentialIndexFactor(state, args.assessmentAsOf);
  if (!indexed) {
    return {
      status: "needs-property-evidence",
      profileId: profile.id,
      methodCode: "none",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      divergence: null,
      method:
        `The assessment vintage (${args.assessmentAsOf}) could not be aligned to an exact FHFA quarterly index for ${state}. Furlong will not substitute a long-run appreciation rate for missing date-aligned market data.`,
      cautions: ["Use a date-aligned FHFA index or recent closed-sale comparables."],
      sources: [basis.sourceUrl, STATE_HPI_PROVENANCE.source],
      requiredInputs: ["date-aligned residential price index or recent closed comparables"],
    };
  }

  const atAssessmentDate = args.assessedTotalValue / basis.ratioOfMarket;
  const mid = roundThousand(atAssessmentDate * indexed.factor);
  const low = roundThousand(mid * (1 - RESIDENTIAL_SCREENING_BAND));
  const high = roundThousand(mid * (1 + RESIDENTIAL_SCREENING_BAND));
  return {
    status: "indicated",
    profileId: profile.id,
    methodCode: "residential-assessment-hpi",
    confidence: "screening-medium",
    lowUsd: low,
    midUsd: mid,
    highUsd: high,
    divergence: knownPriceDivergence({ knownPriceUsd: args.knownPriceUsd, knownPriceLabel: args.knownPriceLabel, mid, methodCode: "residential-assessment-hpi" }),
    method:
      `Residential assessment reconciliation: the jurisdiction assessment of $${args.assessedTotalValue.toLocaleString("en-US")} at ${Math.round(basis.ratioOfMarket * 100)}% of market value is dated ${args.assessmentAsOf}. The exact ${state} FHFA single-family HPI movement from ${indexed.fromQuarter} to ${indexed.toQuarter} is ×${indexed.factor.toFixed(4)}, producing an indicated midpoint of $${mid.toLocaleString("en-US")} and a ±${Math.round(RESIDENTIAL_SCREENING_BAND * 100)}% screening band.`,
    cautions: [
      "Residential screening indication only — not an appraisal or broker price opinion.",
      "FHFA HPI measures SINGLE-FAMILY house-price movement. Furlong uses it only in the residential profile and never to value commercial, hospitality, farm or bare-land assets.",
      "Condition, renovations, micro-location, lot attributes and recent nearby closed sales can move an individual home outside a state-level index screen.",
    ],
    sources: [
      `${basis.note} (${basis.sourceUrl})`,
      `${STATE_HPI_PROVENANCE.source}; ${indexed.fromQuarter}→${indexed.toQuarter}; snapshot ${STATE_HPI_PROVENANCE.asOf ?? "date not stated"}.`,
    ],
    requiredInputs: [],
  };
}
