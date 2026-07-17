/**
 * ownershipCostContext — SERVER-side resolver that slices the committed
 * snapshots (PMMS rates, county tax medians, state electricity) down to the
 * few numbers the pure ownership-cost model needs. The full county tax table
 * never enters the client bundle; the client receives only this object.
 */

import { COUNTY_TAX_CONTEXT } from "@/lib/property/countyTaxContextGenerated";
import { MORTGAGE_RATES } from "@/lib/property/mortgageRatesGenerated";
import type { OwnershipCostContext } from "@/lib/property/ownershipCostModel";
import { STATE_ELECTRICITY } from "@/lib/property/stateElectricityGenerated";
import { STATE_HPI, STATE_HPI_PROVENANCE } from "@/lib/property/stateHpiGenerated";

export function resolveOwnershipCostContext(
  stateCode: string | null,
  countyFips: string | null
): OwnershipCostContext {
  const taxContext = countyFips ? COUNTY_TAX_CONTEXT[countyFips] ?? null : null;
  const electricity = stateCode ? STATE_ELECTRICITY[stateCode.toUpperCase()] ?? null : null;
  const hpi = stateCode ? STATE_HPI[stateCode.toUpperCase()] ?? null : null;
  return {
    rates: {
      weekOf: MORTGAGE_RATES.weekOf,
      rate30: MORTGAGE_RATES.rate30,
      rate15: MORTGAGE_RATES.rate15,
    },
    taxContext: taxContext
      ? {
          medianAnnualTax: taxContext.medianAnnualTax,
          medianHomeValue: taxContext.medianHomeValue,
          effectiveRatePct: taxContext.effectiveRatePct,
        }
      : null,
    electricity: electricity
      ? {
          resPriceCentsKwh: electricity.resPriceCentsKwh,
          resAvgMonthlyBill: electricity.resAvgMonthlyBill,
        }
      : null,
    hpi: hpi
      ? {
          factorSinceBase: hpi.factorSinceBase,
          latestQuarter: hpi.latestQuarter,
          baseYear: STATE_HPI_PROVENANCE.baseYear,
          longRunAnnualPct: hpi.longRunAnnualPct,
          longRunSpanYears: hpi.longRunSpanYears,
        }
      : null,
  };
}
