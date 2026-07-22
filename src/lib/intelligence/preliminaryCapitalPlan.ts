import type { PropertyProfileId } from "@/lib/property/propertyProfile";

export interface PlanningRange {
  low: number | null;
  likely: number | null;
  high: number | null;
}

export interface UsesOfFundsLine {
  id: string;
  label: string;
  range: PlanningRange;
  treatment: "primary-facility" | "separate-facility" | "customer-cash" | "quote-required";
  note: string;
}

export interface PreliminaryCapitalPlan {
  priceKnown: boolean;
  totalProjectNeed: PlanningRange;
  usesOfFunds: UsesOfFundsLine[];
  leadPathway: string | null;
  backupPathway: string | null;
  realisticStructure: string[];
  maximumPotentialStructure: string[];
  conservativeFallback: string[];
  pipeline: {
    bestCase: string;
    mostLikely: string;
    delayCase: string;
    explanation: string;
  };
  phaseIRequired: boolean;
  assumptions: string[];
}

function moneyRange(base: number, lowPct: number, likelyPct: number, highPct: number): PlanningRange {
  return {
    low: Math.round(base * lowPct),
    likely: Math.round(base * likelyPct),
    high: Math.round(base * highPct),
  };
}

function addRanges(ranges: PlanningRange[]): PlanningRange {
  const sum = (key: keyof PlanningRange) => {
    const values = ranges.map((range) => range[key]);
    return values.some((value) => value == null)
      ? null
      : values.reduce<number>((total, value) => total + (value ?? 0), 0);
  };
  return { low: sum("low"), likely: sum("likely"), high: sum("high") };
}

function isComplex(profileId: PropertyProfileId): boolean {
  return ["farm", "commercial", "hospitality", "mobile-home-park", "land"].includes(profileId);
}

function needsPhaseI(profileId: PropertyProfileId): boolean {
  return ["farm", "commercial", "hospitality", "mobile-home-park"].includes(profileId);
}

export function buildPreliminaryCapitalPlan(args: {
  profileId: PropertyProfileId;
  listedPrice: number | null;
  requestedAmount: number | null;
  pathwayNames: string[];
}): PreliminaryCapitalPlan {
  const { profileId, listedPrice, requestedAmount, pathwayNames } = args;
  const complex = isComplex(profileId);
  const phaseIRequired = needsPhaseI(profileId);
  const base = listedPrice ?? requestedAmount;

  const usesOfFunds: UsesOfFundsLine[] = [];
  if (listedPrice != null) {
    usesOfFunds.push({
      id: "acquisition",
      label: "Acquisition",
      range: { low: listedPrice, likely: listedPrice, high: listedPrice },
      treatment: "primary-facility",
      note: "Subject to negotiated price, appraisal, loan-to-value limits, and lender treatment.",
    });
  } else {
    usesOfFunds.push({
      id: "acquisition",
      label: "Acquisition",
      range: { low: null, likely: null, high: null },
      treatment: "quote-required",
      note: "The purchase price must be confirmed before a responsible capital stack can be calculated.",
    });
  }

  if (base != null) {
    usesOfFunds.push({
      id: "closing-diligence",
      label: "Closing, appraisal, legal, and diligence",
      range: moneyRange(base, 0.015, 0.03, 0.05),
      treatment: "customer-cash",
      note: "Planning allowance only; actual treatment varies by program and lender.",
    });
    usesOfFunds.push({
      id: "improvements",
      label: "Repairs, improvements, and contingency",
      range: moneyRange(base, 0.05, 0.1, 0.2),
      treatment: complex ? "primary-facility" : "separate-facility",
      note: "Must be replaced by inspections, bids, and an as-completed scope.",
    });
    if (complex) {
      usesOfFunds.push({
        id: "working-capital",
        label: "Startup and working capital",
        range: moneyRange(base, 0.03, 0.06, 0.12),
        treatment: "separate-facility",
        note: "Modeled separately unless the selected program and lender accept it in the primary facility.",
      });
    }
  }

  if (phaseIRequired) {
    usesOfFunds.push({
      id: "environmental",
      label: "Phase I ESA and environmental follow-up",
      range: { low: null, likely: null, high: null },
      treatment: "quote-required",
      note: "Obtain a lender-acceptable quote, reliance language, timing, and a contingency for further investigation.",
    });
  }

  const numericRanges = usesOfFunds
    .map((line) => line.range)
    .filter((range) => range.low != null && range.likely != null && range.high != null);

  return {
    priceKnown: listedPrice != null,
    totalProjectNeed: numericRanges.length ? addRanges(numericRanges) : { low: null, likely: null, high: null },
    usesOfFunds,
    leadPathway: pathwayNames[0] ?? null,
    backupPathway: pathwayNames[1] ?? null,
    realisticStructure: [
      "Primary real-estate facility sized from the lower of eligible project costs, lender value, and repayment support.",
      complex ? "Equipment and working capital separated unless the selected lender explicitly accepts them in the primary facility." : "Renovation costs separated unless the selected mortgage pathway permits an integrated rehabilitation structure.",
      "Customer contribution preserves post-closing reserves rather than using every available dollar to close.",
    ],
    maximumPotentialStructure: [
      "Test every eligible acquisition, fixed-improvement, equipment, working-capital, fee, and contingency category against program maximums.",
      "Show the maximum only as a ceiling; never substitute it for the realistic planning structure.",
    ],
    conservativeFallback: [
      "Finance the real estate only.",
      "Fund improvements, equipment, and working capital through separate facilities or a phased plan.",
    ],
    pipeline: complex
      ? {
          bestCase: "75–90 days",
          mostLikely: "90–150 days",
          delayCase: "150–240+ days",
          explanation: "Assumes a complete borrower file, timely appraisal and Phase I, no material environmental findings, and no major lender or agency follow-up.",
        }
      : {
          bestCase: "Pathway dependent",
          mostLikely: "Calculated after mortgage path selection",
          delayCase: "Extended when appraisal, condition, title, or rehabilitation scope changes",
          explanation: "Residential timing depends on the selected mortgage, property condition, appraisal, title, insurance, and borrower-file readiness.",
        },
    phaseIRequired,
    assumptions: [
      "Planning ranges are preliminary and are not quotes, appraisals, approvals, or commitments.",
      "Likely loan proceeds remain unknown until borrower authorization, appraisal, underwriting, and lender review.",
      "Comparable-supported value must replace owner-estimated value before collateral equity is used.",
    ],
  };
}
