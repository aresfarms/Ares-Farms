import type { PlanningRange } from "@/lib/intelligence/preliminaryCapitalPlan";

export type CollateralAnalysisStatus =
  | "consent-required"
  | "owner-estimate-only"
  | "comparable-review-needed"
  | "lender-review-needed"
  | "usable-equity-estimated";

export interface CollateralEquityPlan {
  status: CollateralAnalysisStatus;
  ownerEstimatedValue: number | null;
  comparableSupportedValue: PlanningRange;
  likelyLenderValue: PlanningRange;
  grossEquity: PlanningRange;
  likelyUsableEquity: PlanningRange;
  requiredInputs: string[];
  valuationRules: string[];
  structureOptions: string[];
  riskWarnings: string[];
}

export function buildCollateralEquityPlan(args: {
  authorized: boolean;
  ownerEstimatedValue?: number | null;
  firstMortgageBalance?: number | null;
  juniorLiens?: number | null;
}): CollateralEquityPlan {
  const ownerEstimatedValue = args.ownerEstimatedValue ?? null;
  const firstMortgageBalance = args.firstMortgageBalance ?? null;
  const juniorLiens = args.juniorLiens ?? null;

  if (!args.authorized) {
    return {
      status: "consent-required",
      ownerEstimatedValue: null,
      comparableSupportedValue: { low: null, likely: null, high: null },
      likelyLenderValue: { low: null, likely: null, high: null },
      grossEquity: { low: null, likely: null, high: null },
      likelyUsableEquity: { low: null, likely: null, high: null },
      requiredInputs: [
        "Customer authorization to analyze another property",
        "Property address and ownership",
        "Current first mortgage balance",
        "HELOC, second mortgage, tax, judgment, or other liens",
        "Occupancy, income use, and willingness to pledge the asset",
      ],
      valuationRules: [
        "Owner estimates are never used as verified collateral value.",
        "Closed comparable sales, property type, acreage, condition, zoning, improvements, access, and income support must be reviewed.",
        "The financing plan uses the lower realistic lender value, not the highest market estimate.",
      ],
      structureOptions: [
        "Do not use the other property",
        "Separate equity loan, HELOC, or cash-out refinance",
        "Second lien or additional collateral",
        "Cross-collateralized or blanket facility",
      ],
      riskWarnings: [
        "Additional collateral is not free cash; new debt service must be included in affordability.",
        "Cross-collateralization may expose both properties and restrict future sale or refinancing.",
      ],
    };
  }

  const known = ownerEstimatedValue != null && firstMortgageBalance != null && juniorLiens != null;
  const gross = known ? Math.max(0, ownerEstimatedValue - firstMortgageBalance - juniorLiens) : null;

  return {
    status: known ? "comparable-review-needed" : "owner-estimate-only",
    ownerEstimatedValue,
    comparableSupportedValue: { low: null, likely: null, high: null },
    likelyLenderValue: { low: null, likely: null, high: null },
    grossEquity: gross == null ? { low: null, likely: null, high: null } : { low: gross, likely: gross, high: gross },
    likelyUsableEquity: { low: null, likely: null, high: null },
    requiredInputs: [
      "Closed comparable sales and adjustment support",
      "Current payoff statements and lien search",
      "Lender CLTV, lien-position, and retained-equity requirements",
      "Estimated borrowing and transaction costs",
      "Release, refinance, and sale restrictions",
    ],
    valuationRules: [
      "Comparable-supported market value must replace the owner estimate.",
      "Likely lender value may be lower than market value for specialty, agricultural, or commercial assets.",
      "Usable equity is calculated only after existing debt, liens, lender cushion, and costs.",
    ],
    structureOptions: [
      "Preserve the asset and contribute no collateral",
      "Borrow against equity separately",
      "Offer it as additional collateral",
      "Use a blanket or cross-collateralized structure with release terms",
    ],
    riskWarnings: [
      "A default on the new transaction may place the existing property at risk.",
      "The added payment can reduce borrowing capacity even when equity is available.",
      "A first lender or existing mortgage may restrict junior liens or further encumbrance.",
    ],
  };
}
