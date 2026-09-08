/**
 * marketValueIndication — property-type-aware Furlong value screening.
 *
 * IMPORTANT: there is no universal "property estimate" formula. Residential,
 * farm/acreage, and income-producing commercial property are valued from
 * different evidence. This runtime therefore selects a method by canonical
 * property profile and refuses to publish a number when the required evidence
 * is missing.
 *
 * Valuation & Appraisal Integrity (2026-09-05):
 * - "Appraisal" is reserved for a qualified professional appraisal supplied as
 *   external evidence. Furlong does not self-issue appraisals.
 * - Recent closed-sale comparables can support a sales-comparison SCREEN only
 *   when at least three verified comps carry property-specific adjusted value
 *   indications and an adjustment basis. Furlong never invents comp adjustments.
 * - Residential assessment + FHFA HPI is CONTEXT only. It may update a dated tax
 *   record to a broad benchmark point, but without closed-sale comps it does not
 *   become a market-value estimate or an arbitrary +/- range.
 * - Farm USDA NASS state $/acre is CONTEXT only. It is not turned into a parcel
 *   value range by applying an invented percentage band.
 * - Commercial/hospitality/mobile-home-park direct capitalization is a market
 *   screen only when property/project NOI and a market-supported cap-rate range
 *   are supplied. Furlong does not invent cap rates.
 * - Bare land remains no-number until property-specific market evidence exists.
 *
 * Asking/contract/customer-offer values remain transaction evidence, never
 * silently converted into Furlong's opinion of market value.
 */

import { STATE_HPI, STATE_HPI_PROVENANCE } from "@/lib/property/stateHpiGenerated";
import { STATE_FARMLAND, STATE_FARMLAND_PROVENANCE } from "@/lib/property/stateFarmlandGenerated";
import { classifyPropertyProfile, type PropertyProfileId } from "@/lib/property/propertyProfile";

export const VALUATION_INTEGRITY_VERSION = "valuation-appraisal-integrity-v1.1.0";

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
  | "context-only"
  | "needs-property-evidence"
  | "no-registered-basis"
  | "no-assessed-value";

export type ValuationMethodCode =
  | "sales-comparison-screen"
  | "residential-assessment-hpi-context"
  | "farm-state-acreage-context"
  | "commercial-income-capitalization"
  | "none";

export type ValuationEvidenceClass =
  | "TAX_ASSESSMENT"
  | "SELLER_ASK"
  | "CUSTOMER_OFFER"
  | "CLOSED_SALE_COMP"
  | "INCOME_CAP_INPUT"
  | "COST_INPUT"
  | "AG_BENCHMARK"
  | "LICENSED_APPRAISAL";

export type ValuationRole =
  | "property-market-screen"
  | "contextual-benchmark"
  | "no-number";

export interface ClosedSaleComparable {
  id: string;
  salePriceUsd: number;
  saleDate: string;
  adjustedIndicationUsd: number;
  adjustmentBasis: string;
  sourceName: string;
  verified: boolean;
  sourceUrl?: string;
  subjectId?: string;
  transactionId?: string;
  armLengthVerified?: boolean;
}


export interface MarketValueIndication {
  status: IndicationStatus;
  profileId: PropertyProfileId;
  methodCode: ValuationMethodCode;
  valuationRole: ValuationRole;
  displayLabel: "Furlong Value Screen" | "Valuation context" | "Valuation evidence needed";
  confidence: "screening-low" | "screening-medium" | "not-produced";
  lowUsd: number | null;
  midUsd: number | null;
  highUsd: number | null;
  /** Context benchmark that must NOT be consumed as transaction/acquisition value. */
  contextBenchmarkUsd: number | null;
  evidenceClasses: ValuationEvidenceClass[];
  appraisalStatus: "NOT_AN_APPRAISAL";
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
      : args.methodCode === "farm-state-acreage-context"
        ? "state agricultural acreage screen"
        : args.methodCode === "sales-comparison-screen" ? "adjusted closed-sale comparison" : "assessment/index screen";

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

function salesComparisonIndication(args: {
  profileId: PropertyProfileId;
  comparables?: ClosedSaleComparable[] | null;
  asOf?: string;
  subjectId?: string;
  knownPriceUsd?: number | null;
  knownPriceLabel?: string | null;
}): MarketValueIndication | null {
  const asOf = Date.parse(args.asOf ?? "");
  const cutoff = asOf - 548 * 86400000; // governed 18-month screening window
  const dateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s).toISOString().slice(0,10) === s;
  const candidates = (args.comparables ?? []).filter(comp => {
    const date = Date.parse(comp.saleDate);
    return comp.verified === true && comp.armLengthVerified === true &&
      Number.isFinite(comp.salePriceUsd) && comp.salePriceUsd > 0 &&
      Number.isFinite(comp.adjustedIndicationUsd) && comp.adjustedIndicationUsd > 0 &&
      Number.isFinite(date) && Number.isFinite(asOf) && dateOnly(comp.saleDate) && date <= asOf && date >= cutoff &&
      Boolean(args.subjectId && comp.subjectId === args.subjectId && comp.transactionId?.trim()) &&
      Boolean(comp.adjustmentBasis?.trim() && comp.sourceName?.trim() && /^https:\/\//.test(comp.sourceUrl ?? ""));
  });
  // Conflicting copies cannot be counted as separate sales or silently selected.
  const groups = new Map<string, ClosedSaleComparable[]>();
  for (const comp of candidates) groups.set(comp.transactionId!, [...(groups.get(comp.transactionId!) ?? []), comp]);
  const comps = [...groups.values()].filter(group => group.every(c =>
    c.salePriceUsd === group[0].salePriceUsd && c.adjustedIndicationUsd === group[0].adjustedIndicationUsd &&
    c.saleDate === group[0].saleDate && c.adjustmentBasis === group[0].adjustmentBasis)).map(group => group[0]);
  if (comps.length < 3) return null;
  const indications = comps.map((comp) => Math.round(comp.adjustedIndicationUsd)).sort((a, b) => a - b);
  const low = indications[0];
  const high = indications[indications.length - 1];
  const mid = indications.length % 2 === 1
    ? indications[Math.floor(indications.length / 2)]
    : Math.round((indications[indications.length / 2 - 1] + indications[indications.length / 2]) / 2);
  return {
    status: "indicated",
    profileId: args.profileId,
    methodCode: "sales-comparison-screen",
    valuationRole: "property-market-screen",
    displayLabel: "Furlong Value Screen",
    confidence: "screening-medium",
    lowUsd: low,
    midUsd: mid,
    highUsd: high,
    contextBenchmarkUsd: null,
    evidenceClasses: ["CLOSED_SALE_COMP"],
    appraisalStatus: "NOT_AN_APPRAISAL",
    divergence: knownPriceDivergence({ knownPriceUsd: args.knownPriceUsd, knownPriceLabel: args.knownPriceLabel, mid, methodCode: "sales-comparison-screen" }),
    method: `Sales-comparison screen from ${comps.length} verified closed-sale comparables carrying property-specific adjusted indications. The displayed low/high are the observed adjusted indication span; the midpoint is the median adjusted indication, not an automated appraisal reconciliation.`,
    cautions: [
      "Furlong does not invent comparable-sale adjustments. Each comp must carry a source and an explicit property-specific adjustment basis before it enters this screen.",
      "A qualified appraiser may select different comparables, make different adjustments, reconcile methods differently, or conclude a value outside this screening span.",
    ],
    sources: comps.map((comp) => `${comp.sourceName} · ${comp.id} · closed ${comp.saleDate} · adjustment basis: ${comp.adjustmentBasis}`),
    requiredInputs: [],
  };
}

function commercialIncomeIndication(args: {
  profileId: PropertyProfileId;
  noiAnnual?: number | null;
  incomeEvidenceRef?: string;
  capRateEvidenceRef?: string;
  capRateLowPct?: number | null;
  capRateHighPct?: number | null;
  knownPriceUsd?: number | null;
  knownPriceLabel?: string | null;
}): MarketValueIndication {
  const noi = args.noiAnnual ?? null;
  const capA = args.capRateLowPct ?? null;
  const capB = args.capRateHighPct ?? null;
  const valid = Number.isFinite(noi) && noi != null && noi > 0 && Number.isFinite(capA) && capA != null && capA > 0 && capA <= 100 && Number.isFinite(capB) && capB != null && capB > 0 && capB <= 100 && Boolean(args.incomeEvidenceRef?.trim() && args.capRateEvidenceRef?.trim());
  if (!valid) {
    return {
      status: "needs-property-evidence",
      profileId: args.profileId,
      methodCode: "none",
      valuationRole: "no-number",
      displayLabel: "Valuation evidence needed",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      contextBenchmarkUsd: null,
      evidenceClasses: [],
      appraisalStatus: "NOT_AN_APPRAISAL",
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
    valuationRole: "property-market-screen",
    displayLabel: "Furlong Value Screen",
    confidence: "screening-medium",
    lowUsd: low,
    midUsd: mid,
    highUsd: high,
    contextBenchmarkUsd: null,
    evidenceClasses: ["INCOME_CAP_INPUT"],
    appraisalStatus: "NOT_AN_APPRAISAL",
    divergence: knownPriceDivergence({ knownPriceUsd: args.knownPriceUsd, knownPriceLabel: args.knownPriceLabel, mid, methodCode: "commercial-income-capitalization" }),
    method:
      `Income-capitalization screen: property/project NOI $${Math.round(noi).toLocaleString("en-US")}/yr divided by a ${capLow.toFixed(2)}%–${capHigh.toFixed(2)}% market cap-rate range produces an indicated ${low.toLocaleString("en-US")}–${high.toLocaleString("en-US")} range (midpoint ${mid.toLocaleString("en-US")}).`,
    cautions: [
      "The cap-rate range must come from current market evidence; Furlong does not invent it from a generic national property-type average.",
      "This is a direct-capitalization screen, not an appraisal. Lease quality, reserves, deferred maintenance, capex, franchise/management terms, intangibles and stabilized-vs-current operations can materially change value.",
    ],
    sources: [`Income evidence: ${args.incomeEvidenceRef}`, `Cap-rate evidence: ${args.capRateEvidenceRef}`],
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
  closedSaleComparables?: ClosedSaleComparable[] | null;
  asOf?: string;
  subjectId?: string;
  incomeEvidenceRef?: string;
  capRateEvidenceRef?: string;
}): MarketValueIndication {
  const profile = classifyPropertyProfile({
    propertyType: args.propertyType ?? args.landUse ?? null,
    description: args.landUse ?? null,
    acreageText: args.acreageText ?? null,
  });
  const state = (args.stateCode ?? "").trim().toUpperCase();

  const compScreen = salesComparisonIndication({
    profileId: profile.id,
    comparables: args.closedSaleComparables,
    asOf: args.asOf,
    subjectId: args.subjectId,
    knownPriceUsd: args.knownPriceUsd,
    knownPriceLabel: args.knownPriceLabel,
  });
  if (compScreen) return compScreen;

  if (profile.id === "commercial" || profile.id === "hospitality" || profile.id === "mobile-home-park") {
    return commercialIncomeIndication({
      profileId: profile.id,
      noiAnnual: args.noiAnnual,
      incomeEvidenceRef: args.incomeEvidenceRef,
      capRateEvidenceRef: args.capRateEvidenceRef,
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
        valuationRole: "no-number",
        displayLabel: "Valuation evidence needed",
        confidence: "not-produced",
        lowUsd: null,
        midUsd: null,
        highUsd: null,
        contextBenchmarkUsd: null,
        evidenceClasses: [],
        appraisalStatus: "NOT_AN_APPRAISAL",
        divergence: null,
        method: "A farm-value screen needs acreage plus a current agricultural market anchor. Furlong will not use the residential FHFA HPI for a farm.",
        cautions: ["USDA state averages are context, not parcel-specific appraisals; productivity, improvements, development pressure, soils, water, easements and location can move value sharply."],
        sources: [],
        requiredInputs: [!acres ? "verified acreage" : "", !farmland ? "USDA/state agricultural land-value benchmark" : ""].filter(Boolean),
      };
    }
    const benchmark = roundThousand(acres * farmland.dollarsPerAcre);
    return {
      status: "context-only",
      profileId: profile.id,
      methodCode: "farm-state-acreage-context",
      valuationRole: "contextual-benchmark",
      displayLabel: "Valuation context",
      confidence: "screening-low",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      contextBenchmarkUsd: benchmark,
      evidenceClasses: ["AG_BENCHMARK"],
      appraisalStatus: "NOT_AN_APPRAISAL",
      divergence: null,
      method:
        `Agricultural context benchmark: ${acres.toLocaleString("en-US", { maximumFractionDigits: 2 })} acres × USDA NASS ${farmland.year} ${state} average farm real-estate value ($${farmland.dollarsPerAcre.toLocaleString("en-US")}/acre) = about $${benchmark.toLocaleString("en-US")}. Furlong does not wrap that state average in an invented percentage band or call it this parcel's market value.`,
      cautions: [
        "USDA NASS farm real-estate value is a STATE average for land and buildings, not a comparable-sale appraisal of this parcel.",
        "A parcel-level value screen needs verified recent closed farm/land comparables with property-specific adjustments, or a qualified professional appraisal.",
        "Soils, productive acres, irrigation/water, buildings, easements, development pressure, conservation restrictions, access and local closed sales can move an individual farm materially away from the state benchmark.",
      ],
      sources: [`${STATE_FARMLAND_PROVENANCE.source}, ${farmland.year}; snapshot ${STATE_FARMLAND_PROVENANCE.asOf ?? "date not stated"}.`],
      requiredInputs: ["at least three verified recent closed farm/land comparables with property-specific adjustment bases, or a qualified professional appraisal"],
    };
  }

  if (profile.id === "land") {
    return {
      status: "needs-property-evidence",
      profileId: profile.id,
      methodCode: "none",
      valuationRole: "no-number",
      displayLabel: "Valuation evidence needed",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      contextBenchmarkUsd: null,
      evidenceClasses: [],
      appraisalStatus: "NOT_AN_APPRAISAL",
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
      valuationRole: "no-number",
      displayLabel: "Valuation evidence needed",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      contextBenchmarkUsd: null,
      evidenceClasses: [],
      appraisalStatus: "NOT_AN_APPRAISAL",
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
      valuationRole: "no-number",
      displayLabel: "Valuation evidence needed",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      contextBenchmarkUsd: null,
      evidenceClasses: [],
      appraisalStatus: "NOT_AN_APPRAISAL",
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
      valuationRole: "no-number",
      displayLabel: "Valuation evidence needed",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      contextBenchmarkUsd: null,
      evidenceClasses: [],
      appraisalStatus: "NOT_AN_APPRAISAL",
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
      valuationRole: "no-number",
      displayLabel: "Valuation evidence needed",
      confidence: "not-produced",
      lowUsd: null,
      midUsd: null,
      highUsd: null,
      contextBenchmarkUsd: null,
      evidenceClasses: [],
      appraisalStatus: "NOT_AN_APPRAISAL",
      divergence: null,
      method:
        `The assessment vintage (${args.assessmentAsOf}) could not be aligned to an exact FHFA quarterly index for ${state}. Furlong will not substitute a long-run appreciation rate for missing date-aligned market data.`,
      cautions: ["Use a date-aligned FHFA index or recent closed-sale comparables."],
      sources: [basis.sourceUrl, STATE_HPI_PROVENANCE.source],
      requiredInputs: ["date-aligned residential price index or recent closed comparables"],
    };
  }

  const atAssessmentDate = args.assessedTotalValue / basis.ratioOfMarket;
  const benchmark = roundThousand(atAssessmentDate * indexed.factor);
  return {
    status: "context-only",
    profileId: profile.id,
    methodCode: "residential-assessment-hpi-context",
    valuationRole: "contextual-benchmark",
    displayLabel: "Valuation context",
    confidence: "screening-low",
    lowUsd: null,
    midUsd: null,
    highUsd: null,
    contextBenchmarkUsd: benchmark,
    evidenceClasses: ["TAX_ASSESSMENT"],
    appraisalStatus: "NOT_AN_APPRAISAL",
    divergence: null,
    method:
      `Residential context benchmark: the jurisdiction assessment of $${args.assessedTotalValue.toLocaleString("en-US")} at ${Math.round(basis.ratioOfMarket * 100)}% of market value is dated ${args.assessmentAsOf}. The exact ${state} FHFA single-family HPI movement from ${indexed.fromQuarter} to ${indexed.toQuarter} is ×${indexed.factor.toFixed(4)}, producing a broad context point of about $${benchmark.toLocaleString("en-US")}. Furlong does not create an arbitrary percentage range around that point or call it a market-value estimate.`,
    cautions: [
      "Tax-assessment/HPI context only — not an appraisal, broker price opinion, or closed-sale comparison.",
      "FHFA HPI measures SINGLE-FAMILY house-price movement. Furlong uses it only in the residential profile and never to value commercial, hospitality, farm or bare-land assets.",
      "A property-level value screen needs verified recent closed comparable sales with property-specific adjustments; condition, renovations, micro-location and lot attributes cannot be inferred from a state index.",
    ],
    sources: [
      `${basis.note} (${basis.sourceUrl})`,
      `${STATE_HPI_PROVENANCE.source}; ${indexed.fromQuarter}→${indexed.toQuarter}; snapshot ${STATE_HPI_PROVENANCE.asOf ?? "date not stated"}.`,
    ],
    requiredInputs: ["at least three verified recent closed residential comparables with property-specific adjustment bases, or a qualified professional appraisal"],
  };
}
