import type { PropertyProfileId } from "@/lib/property/propertyProfile";

export type TimelineCompatibility = "unknown" | "compatible" | "tight" | "incompatible";

export interface TransactionTimelinePlan {
  compatibility: TimelineCompatibility;
  modeledFinancingDays: { bestCase: number | null; likelyLow: number | null; likelyHigh: number | null; delayCase: number | null };
  contractDaysAvailable: number | null;
  extensionDaysAvailable: number | null;
  recommendedContractWindow: string;
  criticalPath: string[];
  carryingCostCategories: string[];
  seasonalRisks: string[];
  bridgeWarnings: string[];
  decisionRule: string;
}

function isComplex(profileId: PropertyProfileId): boolean {
  return ["farm", "commercial", "hospitality", "mobile-home-park", "land"].includes(profileId);
}

export function buildTransactionTimelinePlan(args: {
  profileId: PropertyProfileId;
  contractDaysAvailable?: number | null;
  extensionDaysAvailable?: number | null;
}): TransactionTimelinePlan {
  const complex = isComplex(args.profileId);
  const contractDaysAvailable = args.contractDaysAvailable ?? null;
  const extensionDaysAvailable = args.extensionDaysAvailable ?? null;
  const totalAvailable = contractDaysAvailable == null ? null : contractDaysAvailable + (extensionDaysAvailable ?? 0);
  const likelyLow = complex ? 90 : null;
  const likelyHigh = complex ? 150 : null;
  let compatibility: TimelineCompatibility = "unknown";
  if (totalAvailable != null && likelyLow != null && likelyHigh != null) {
    compatibility = totalAvailable < likelyLow ? "incompatible" : totalAvailable < likelyHigh ? "tight" : "compatible";
  }

  return {
    compatibility,
    modeledFinancingDays: complex
      ? { bestCase: 75, likelyLow: 90, likelyHigh: 150, delayCase: 240 }
      : { bestCase: null, likelyLow: null, likelyHigh: null, delayCase: null },
    contractDaysAvailable,
    extensionDaysAvailable,
    recommendedContractWindow: complex
      ? "Seek at least 150 days to close, plus written extension rights tied to appraisal, environmental review, agency processing, title, and lender conditions."
      : "Match the closing period to the selected mortgage, appraisal, property condition, title, insurance, and any rehabilitation scope.",
    criticalPath: [
      "Complete borrower package and lender screening",
      "Order appraisal and lender-acceptable environmental work in parallel",
      "Complete underwriting and any SBA, USDA, FSA, or guaranty review",
      "Clear title, insurance, equity, closing, and agency conditions",
    ],
    carryingCostCategories: [
      "Rate-lock and contract-extension fees",
      "Bridge interest or duplicate housing and operating costs",
      "Appraisal, environmental, legal, and bid-update costs",
      "Insurance, utilities, taxes, security, and working-capital burn",
    ],
    seasonalRisks: args.profileId === "farm"
      ? ["Missed planting, harvest, breeding, boarding, or market season", "Delayed equipment mobilization and operating revenue"]
      : args.profileId === "hospitality"
        ? ["Missed peak booking or tourism season", "Delayed permits, staffing, and opening revenue"]
        : ["Construction, lease-up, opening, or operating-window delay"],
    bridgeWarnings: [
      "Bridge financing must be modeled as debt, not treated as free timing relief.",
      "A bridge can weaken repayment capacity, add lien risk, and become dangerous if the permanent loan is delayed or resized.",
    ],
    decisionRule: "When the contract window is shorter than the realistic financing pipeline, Furlong must recommend an extension, financing contingency, alternate structure, phased closing, or walk-away rather than assume the deadline will move.",
  };
}
