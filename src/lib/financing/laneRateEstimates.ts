/**
 * laneRateEstimates — illustrative pricing for residential financing lanes
 * (founder direction 2026-07-29: "We can't give them an estimated cost here
 * instead?" — replace bare "Lender quote required" with an honest estimate).
 *
 * Every figure derives from the PUBLISHED national 30-year average the
 * platform already carries (with its week-of date) plus curated, clearly
 * labeled typical spreads for the non-agency lanes. Estimates are
 * illustrative screening context, never a quote — the boundary language
 * rides with every consumer of this module.
 *
 * Master Volume Governance: FACILITATION-001 — screening context, no credit
 * determination; deterministic and versioned; benchmark provenance carried
 * in the rendered text.
 */

export interface LaneRateContext {
  mortgage30Pct: number | null;
  mortgageWeekOf: string | null;
}

export interface LanePricingEstimate {
  /** Compact pricing text, e.g. "≈6.60% (30-yr avg) · est. $1,987/mo P&I at 20% down". */
  pricing: string;
  /** True when a real benchmark backed the estimate (false = fallback copy). */
  estimated: boolean;
}

function monthlyPandI(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  return principal * (r / (1 - Math.pow(1 + r, -n)));
}

function dollars(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** Est. monthly P&I clause for a down-payment share, or "" without a price. */
function monthlyClause(price: number | null, ratePct: number, downShare: number, label: string): string {
  if (price == null || price <= 0) return "";
  const monthly = monthlyPandI(price * (1 - downShare), ratePct, 30);
  return ` · est. ${dollars(monthly)}/mo P&I at ${label}`;
}

/**
 * Illustrative pricing for one financing lane. Benchmark-anchored where the
 * lane prices like a mortgage; curated typical ranges for negotiated and
 * private lanes; honest fallback when no benchmark is loaded.
 */
export function estimateLanePricing(
  laneName: string,
  rates: LaneRateContext | null,
  price: number | null
): LanePricingEstimate {
  const name = laneName.toLowerCase();
  const bench = rates?.mortgage30Pct ?? null;
  const week = rates?.mortgageWeekOf ? ` · week of ${rates.mortgageWeekOf}` : "";

  if (/hard money|asset-based bridge|private bridge/.test(name)) {
    return {
      pricing: "Typically 10–13% interest-only plus 2–4 points, 6–24 month term (private-market norm — exit plan governs)",
      estimated: true,
    };
  }
  if (/seller financing|seller-financed/.test(name)) {
    return {
      pricing:
        bench != null
          ? `Negotiated with the seller — commonly ${bench.toFixed(2)}%–${(bench + 2).toFixed(2)}% (benchmark to +2 pts${week})`
          : "Negotiated with the seller — commonly at or above the prevailing 30-year benchmark",
      estimated: bench != null,
    };
  }
  if (bench == null) {
    return { pricing: "Lender quote required — no published benchmark loaded", estimated: false };
  }
  if (/construction-to-permanent|construction to permanent/.test(name)) {
    return {
      pricing: `Typically ${(bench + 0.5).toFixed(2)}%–${(bench + 1).toFixed(2)}% (≈0.5–1 pt over the ${bench.toFixed(2)}% 30-yr avg${week})`,
      estimated: true,
    };
  }
  if (/203\(k\)/.test(name)) {
    return {
      pricing: `≈${bench.toFixed(2)}%–${(bench + 0.5).toFixed(2)}% (30-yr avg${week}, small renovation premium typical)${monthlyClause(price, bench + 0.25, 0.035, "3.5% down")} + FHA mortgage insurance`,
      estimated: true,
    };
  }
  if (/fha/.test(name)) {
    return {
      pricing: `≈${bench.toFixed(2)}% (30-yr avg${week})${monthlyClause(price, bench, 0.035, "3.5% down")} + FHA mortgage insurance`,
      estimated: true,
    };
  }
  if (/\bva\b/.test(name)) {
    return {
      pricing: `≈${bench.toFixed(2)}% (30-yr avg${week})${monthlyClause(price, bench, 0, "0% down")} + VA funding fee (eligible veterans)`,
      estimated: true,
    };
  }
  if (/rural development housing|usda/.test(name)) {
    return {
      pricing: `≈${bench.toFixed(2)}% (30-yr avg${week}, not a USDA-RD quote)${monthlyClause(price, bench, 0, "0% down")} + guarantee fee`,
      estimated: true,
    };
  }
  if (/conventional/.test(name)) {
    return {
      pricing: `${bench.toFixed(2)}% national 30-yr average${week}${monthlyClause(price, bench, 0.2, "20% down")}`,
      estimated: true,
    };
  }
  return {
    pricing: `Prices near the ${bench.toFixed(2)}% 30-yr average${week} for most bank programs — program lender confirms`,
    estimated: true,
  };
}

/** The boundary sentence every surface using these estimates must carry. */
export const LANE_PRICING_BOUNDARY =
  "Pricing shown is an illustrative estimate from the published national 30-year average and typical market spreads on the dates shown — not a rate quote, offer, or Loan Estimate. Actual rate, fees, and approval are determined only by a licensed lender for your specific situation.";
