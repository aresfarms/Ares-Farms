export type FinancialAuthorization = "not-requested" | "authorized" | "declined";
export type AffordabilityPosture = "authorization-required" | "incomplete" | "responsible" | "tight" | "house-poor";

export interface FinancialCapacityPlan {
  authorization: FinancialAuthorization;
  posture: AffordabilityPosture;
  monthlyHousingAndProjectCost: number | null;
  postClosingLiquidity: number | null;
  reserveMonths: number | null;
  requiredInputs: string[];
  capacityRules: string[];
  housePoorGates: string[];
  decisionRule: string;
}

export function buildFinancialCapacityPlan(args: {
  authorization: FinancialAuthorization;
  monthlyNetIncome?: number | null;
  existingMonthlyDebt?: number | null;
  projectedMonthlyCost?: number | null;
  liquidFunds?: number | null;
  cashToClose?: number | null;
  minimumReserveMonths?: number | null;
}): FinancialCapacityPlan {
  const minimumReserveMonths = args.minimumReserveMonths ?? 6;
  if (args.authorization !== "authorized") {
    return {
      authorization: args.authorization, posture: "authorization-required",
      monthlyHousingAndProjectCost: null, postClosingLiquidity: null, reserveMonths: null,
      requiredInputs: [
        "Customer authorization for borrower-specific financial analysis",
        "Stable monthly income and operating cash flow",
        "Existing debt service and recurring obligations",
        "Verified liquid funds and required cash to close",
        "Projected property, business, insurance, tax, utility, and maintenance costs",
      ],
      capacityRules: [
        "Property potential remains separate from personalized affordability.",
        "Available collateral is not treated as income or free liquidity.",
        "Maximum lender eligibility never substitutes for a responsible carrying plan.",
      ],
      housePoorGates: [
        "Closing would consume emergency, operating, tax, repair, or seasonal reserves.",
        "The plan depends on optimistic revenue before the enterprise is stabilized.",
        "A second property, bridge loan, or cross-collateral pledge creates fragile combined debt service.",
      ],
      decisionRule: "Do not personalize or state that the customer can afford the transaction until the customer authorizes review and the full recurring-cost and reserve picture is complete.",
    };
  }

  const known = [args.monthlyNetIncome, args.existingMonthlyDebt, args.projectedMonthlyCost, args.liquidFunds, args.cashToClose].every(v => v != null);
  if (!known) return {
    authorization: args.authorization, posture: "incomplete",
    monthlyHousingAndProjectCost: args.projectedMonthlyCost ?? null, postClosingLiquidity: null, reserveMonths: null,
    requiredInputs: ["Complete all authorized income, debt, liquidity, cash-to-close, and recurring-cost inputs."],
    capacityRules: ["No affordability posture is assigned from partial borrower data."],
    housePoorGates: ["Missing borrower inputs prevent a responsible proceed recommendation."],
    decisionRule: "Hold personalized ranking until the authorized financial file is complete.",
  };

  const totalMonthly = (args.existingMonthlyDebt ?? 0) + (args.projectedMonthlyCost ?? 0);
  const postClosingLiquidity = Math.max(0, (args.liquidFunds ?? 0) - (args.cashToClose ?? 0));
  const reserveMonths = (args.projectedMonthlyCost ?? 0) > 0 ? postClosingLiquidity / (args.projectedMonthlyCost ?? 1) : null;
  const burden = (args.monthlyNetIncome ?? 0) > 0 ? totalMonthly / (args.monthlyNetIncome ?? 1) : 1;
  const posture = reserveMonths != null && reserveMonths < minimumReserveMonths ? "house-poor" : burden > 0.6 ? "house-poor" : burden > 0.45 ? "tight" : "responsible";
  return {
    authorization: args.authorization, posture, monthlyHousingAndProjectCost: args.projectedMonthlyCost ?? null, postClosingLiquidity, reserveMonths,
    requiredInputs: [],
    capacityRules: ["Use verified recurring costs and conservative revenue assumptions.", "Preserve emergency, repair, tax, seasonal, and operating reserves after closing."],
    housePoorGates: ["Post-closing reserves below the selected minimum.", "Combined recurring debt consumes an unsafe share of stable monthly cash flow."],
    decisionRule: posture === "responsible" ? "Personalized capacity appears workable, subject to lender underwriting and verification." : "Reduce price, debt, scope, collateral exposure, or timing before proceeding.",
  };
}
