/**
 * marketValueIndication — Furlong's own indicated market value for a property.
 *
 * WHY THIS EXISTS (founder direction 2026-08-06): the platform must publish
 * what a property is worth or might appraise at. It previously published the
 * county's tax assessment and nothing else, which meant the tax figure became
 * the number readers took away as "what Furlong thinks it's worth" — on a
 * property under contract at $2,500,000 against a $629,000 assessment.
 *
 * THE METHOD — assessment reconciliation, which is standard practice and not
 * a guess. Every assessing jurisdiction values to a DECLARED basis: a ratio of
 * market value, and an as-of valuation date. Given both, an assessed value
 * converts to an indicated market value:
 *
 *     indicated = (assessedTotal ÷ ratioOfMarket) × priceIndexFromValuationDate
 *
 * Sussex County, Delaware is the worked example: court-ordered reassessment by
 * Tyler Technologies, new values set at 100% of fair market value as of
 * 1 July 2023 (sussexcountyde.gov/reassessment). Its assessment is therefore
 * the county's own market-value OPINION, not a stale base-year artifact — it
 * just needs walking forward three years.
 *
 * WHAT THIS IS NOT: an appraisal, a broker price opinion, or a commitment.
 * It is a screening indication carrying the assessor's own opinion forward on
 * a published price index. A licensed appraiser outranks it the moment one
 * exists, and so does an actual arm's-length contract price.
 *
 * WHY THE DIVERGENCE LINE MATTERS MOST: when a known asking or contract price
 * sits far from the indication, that gap is the single most decision-relevant
 * output here. Assessors systematically miss development potential, assemblage
 * value, entitlement changes, and income-producing improvements. A real buyer
 * paying a real price outranks every model on this page, and the brief must
 * say so rather than leaving a reader to trust the smaller number.
 *
 * Master Volume Governance: Vol II (no fabricated certainty, sources declared),
 * Vol V (versioned, evidence-preserved, replay-safe — every input named).
 */

import { STATE_HPI, STATE_HPI_PROVENANCE } from "@/lib/property/stateHpiGenerated";

/**
 * Assessment-basis registry — DATA, not logic, exactly like the jurisdiction
 * parcel registry. Adding a jurisdiction must never require new code: it is
 * always the same four published facts, and every one of them is a matter of
 * public record the assessor declares.
 *
 * KEYED BY `<STATE>` or `<STATE>-<County>` — the more specific key wins, so a
 * state-wide rule can be stated once and a county that differs can override.
 *
 * NEVER GUESS A RATIO. An unregistered jurisdiction returns no indication and
 * says so; a wrong ratio silently mis-values every property in a county.
 */
export interface AssessmentBasis {
  /** Fraction of market value the jurisdiction assesses to. 1.0 = 100%. */
  ratioOfMarket: number;
  /** The as-of date the jurisdiction valued to (ISO). */
  valuationDate: string;
  /** Published, verifiable statement of the basis. */
  note: string;
  sourceUrl: string;
}

export const ASSESSMENT_BASES: Record<string, AssessmentBasis> = {
  "DE-Sussex": {
    ratioOfMarket: 1.0,
    valuationDate: "2023-07-01",
    note:
      "Court-ordered countywide reassessment completed by Tyler Technologies. New assessed values " +
      "are set at 100% of fair market value as of 1 July 2023, replacing the prior basis of 50% of " +
      "1974 market values.",
    sourceUrl: "https://sussexcountyde.gov/reassessment",
  },
  MD: {
    ratioOfMarket: 1.0,
    valuationDate: "2023-01-01",
    note:
      "Maryland SDAT assesses at 100% of full cash (market) value on a rolling three-year cycle; " +
      "one third of the state is revalued each year, so the effective valuation date for a given " +
      "property may be up to three years before the date shown.",
    sourceUrl: "https://dat.maryland.gov/realproperty/",
  },
};

/** Most specific basis first: county, then state. */
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

export type IndicationStatus = "indicated" | "no-registered-basis" | "no-assessed-value";

export interface MarketValueIndication {
  status: IndicationStatus;
  /** Screening band, dollars. Null unless status is "indicated". */
  lowUsd: number | null;
  midUsd: number | null;
  highUsd: number | null;
  /** Plain-English statement of how the number was reached. */
  method: string;
  /** Why this is only a screen. Always non-empty. */
  cautions: string[];
  sources: string[];
  /** Set when a known market price diverges materially from the indication. */
  divergence: {
    knownPriceUsd: number;
    knownPriceLabel: string;
    multipleOfMid: number;
    verdict: string;
  } | null;
}

/**
 * Screening band width. This is a STATED SCREENING BAND, deliberately not
 * presented as a statistical confidence interval — the inputs (a mass-appraisal
 * assessment plus a statewide price index) do not support one, and dressing it
 * up as ±σ would be exactly the false precision this platform exists to avoid.
 * ±20% reflects the ordinary spread between mass-appraisal value and realised
 * sale price on an individual property.
 */
const SCREENING_BAND = 0.2;
/** Beyond this multiple, the gap is the story and must be stated outright. */
const DIVERGENCE_MULTIPLE = 1.35;

function indexFactor(stateCode: string, valuationDate: string): { factor: number; precise: boolean } | null {
  const hpi = STATE_HPI[stateCode.toUpperCase()];
  if (!hpi) return null;
  const valuationYear = Number(valuationDate.slice(0, 4));
  if (!Number.isFinite(valuationYear)) return null;
  // The published factor walks a value from the index base year to the latest
  // quarter. When the jurisdiction's valuation date IS the base year, that
  // factor applies directly and precisely.
  if (valuationYear === STATE_HPI_PROVENANCE.baseYear) return { factor: hpi.factorSinceBase, precise: true };
  // Otherwise bridge the gap on the state's own published long-run annual rate.
  // Honest, but coarser — and flagged as such rather than presented as equal.
  const bridgeYears = STATE_HPI_PROVENANCE.baseYear - valuationYear;
  const bridge = Math.pow(1 + hpi.longRunAnnualPct / 100, bridgeYears);
  return { factor: hpi.factorSinceBase * bridge, precise: false };
}

export function indicateMarketValue(args: {
  assessedTotalValue?: number | null;
  stateCode?: string | null;
  county?: string | null;
  /** Asking or contract price, when any source carries one. */
  knownPriceUsd?: number | null;
  knownPriceLabel?: string | null;
}): MarketValueIndication {
  const base = {
    lowUsd: null, midUsd: null, highUsd: null,
    divergence: null,
    sources: [] as string[],
  };

  if (args.assessedTotalValue == null || args.assessedTotalValue <= 0) {
    return {
      ...base,
      status: "no-assessed-value",
      method:
        "No indication could be produced: no jurisdiction assessed value was returned for this " +
        "address, and the assessment is the anchor this method reconciles from.",
      cautions: ["Furlong holds no closed-sale comparable feed, so it cannot fall back to a sales-comparison approach."],
    };
  }

  const basis = assessmentBasisFor(args.stateCode, args.county);
  if (!basis) {
    return {
      ...base,
      status: "no-registered-basis",
      method:
        `An assessed value of $${args.assessedTotalValue.toLocaleString("en-US")} was returned, but the ` +
        "assessing jurisdiction's published basis — what fraction of market value it assesses to, and " +
        "the date it valued to — is not yet registered here. Converting an assessment without that " +
        "basis would be a guess, and a wrong ratio mis-values every property in the county.",
      cautions: ["The assessed figure above is a tax figure. Do not read it as market value."],
    };
  }

  const state = (args.stateCode ?? "").toUpperCase();
  const indexed = indexFactor(state, basis.valuationDate);
  if (!indexed) {
    return {
      ...base,
      status: "no-registered-basis",
      method: `No published price index is loaded for ${state || "this state"}, so the assessment cannot be walked forward from ${basis.valuationDate}.`,
      cautions: ["The assessed figure above is a tax figure. Do not read it as market value."],
    };
  }

  const atValuationDate = args.assessedTotalValue / basis.ratioOfMarket;
  const mid = Math.round((atValuationDate * indexed.factor) / 1000) * 1000;
  const low = Math.round((mid * (1 - SCREENING_BAND)) / 1000) * 1000;
  const high = Math.round((mid * (1 + SCREENING_BAND)) / 1000) * 1000;

  const cautions = [
    "This is a screening indication, not an appraisal and not a broker price opinion. A licensed appraisal outranks it.",
    "It carries the assessor's mass-appraisal opinion forward on a STATEWIDE price index. It knows nothing about this building's condition, its rent roll, its entitlements, or what the block next door has been trading for.",
    "Assessors systematically miss development potential, assemblage value, and recent income-producing improvements — the exact things that make a property sell far above its assessment.",
  ];
  if (!indexed.precise) {
    cautions.push(
      `The jurisdiction values to ${basis.valuationDate}, which is not the price index's ${STATE_HPI_PROVENANCE.baseYear} base year, so the two were bridged on the state's published long-run rate. Treat this indication as coarser than one drawn on the base year.`
    );
  }
  if (basis.ratioOfMarket !== 1.0) {
    cautions.push(`Converted from an assessed value at ${Math.round(basis.ratioOfMarket * 100)}% of market value, per the jurisdiction's published basis.`);
  }

  let divergence: MarketValueIndication["divergence"] = null;
  const known = args.knownPriceUsd;
  if (known != null && known > 0 && mid > 0) {
    const multiple = known / mid;
    if (multiple >= DIVERGENCE_MULTIPLE || multiple <= 1 / DIVERGENCE_MULTIPLE) {
      const above = multiple > 1;
      divergence = {
        knownPriceUsd: known,
        knownPriceLabel: args.knownPriceLabel ?? "Known market price",
        multipleOfMid: Math.round(multiple * 100) / 100,
        verdict: above
          ? `The market price is about ${(Math.round(multiple * 10) / 10).toLocaleString("en-US")}× this indication. TRUST THE MARKET PRICE, not this model. A real buyer paying a real number outranks any assessment-derived figure, and a gap this size usually means the property is being bought for something the assessor never valued — development rights, an assemblage, an entitlement already granted, or income the county has not caught up to. Treat the indication below as the floor of a tax-record view, and find out what the buyer knows.`
          : `The market price sits well BELOW this indication — about ${(Math.round(multiple * 100) / 100).toLocaleString("en-US")}× it. That usually signals condition, access, environmental, title, or tenancy problems the assessment does not reflect, or a distressed or non-arm's-length sale. Find out which before treating the lower price as a bargain.`,
      };
    }
  }

  return {
    status: "indicated",
    lowUsd: low,
    midUsd: mid,
    highUsd: high,
    divergence,
    method:
      `Assessment reconciliation. The jurisdiction assesses at ${Math.round(basis.ratioOfMarket * 100)}% of market value ` +
      `as of ${basis.valuationDate}, so its $${args.assessedTotalValue.toLocaleString("en-US")} assessment implies ` +
      `$${Math.round(atValuationDate).toLocaleString("en-US")} of market value on that date. Walking that forward on the ` +
      `FHFA house-price index for ${state} (×${indexed.factor.toFixed(4)}, through ${STATE_HPI[state]?.latestQuarter ?? "the latest quarter"}) ` +
      `gives an indicated $${mid.toLocaleString("en-US")}, shown as a ±${Math.round(SCREENING_BAND * 100)}% screening band.`,
    cautions,
    sources: [
      `${basis.note} (${basis.sourceUrl})`,
      `${STATE_HPI_PROVENANCE.source}, base year ${STATE_HPI_PROVENANCE.baseYear}, as of ${STATE_HPI_PROVENANCE.asOf ?? "ingest date"}`,
    ],
  };
}
