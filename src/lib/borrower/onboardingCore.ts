/**
 * Core Borrower Onboarding Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps borrower intake accountable and understandable.
 * - Vol II: blocks intake from becoming approval, eligibility, financing,
 *   permitting, legal, or regulatory reliance.
 * - Vol III: gives the borrower portal deterministic readiness and handoff
 *   state.
 * - Vol III-B: preserves review, classification, and runtime evidence needs.
 * - Vol IV: supports operator continuity and human review routing.
 * - Vol V: preserves claims, data rights, replay, and disclosure boundaries.
 * - Vol VI-VII: keeps source/pathway surfaces advisory and conformance-bound.
 */

export type FarmType =
  | "CROPS"
  | "LIVESTOCK"
  | "POULTRY"
  | "DAIRY"
  | "BEEF"
  | "PIG"
  | "ORCHARD"
  | "AQUACULTURE"
  | "EXOTIC_ANIMALS"
  | "EXOTIC_BIRDS";

export type Goal =
  | "PROFIT_MAXIMIZATION"
  | "EXPANSION"
  | "LAND_ACQUISITION"
  | "SUSTAINABILITY";

export type InterestKey =
  | "soilAnalysis"
  | "environmentalReports"
  | "financing"
  | "vendorRecommendations"
  | "commodityIntelligence";

export type BorrowerOnboardingState = {
  stage: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "";
  location: {
    country: string;
    state: string;
    county: string;
  };
  farmTypes: FarmType[];
  goals: Goal[];
  acreage: number;
  interests: Record<InterestKey, boolean>;
};

export type BorrowerOnboardingHandoff = {
  id: string;
  label: string;
  route: string;
  status: "complete" | "needs-input" | "pending-review";
  reason: string;
};

export type BorrowerOnboardingWorkflow = {
  readinessPercent: number;
  missingItems: string[];
  selectedInterestCount: number;
  handoffs: BorrowerOnboardingHandoff[];
  nextRoutes: string[];
  disclosures: string[];
  productionBlocked: true;
  humanReviewRequired: true;
};

export const borrowerOnboardingDisclosureMessages = [
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
  "This intake is advisory and review-bound.",
  "No approval has been granted.",
  "No guarantee is made.",
  "No legal or regulatory reliance is authorized.",
  "No public verification is available unless separately authorized.",
] as const;

export const borrowerOnboardingInitialState: BorrowerOnboardingState = {
  stage: "",
  location: {
    country: "US",
    state: "MD",
    county: "",
  },
  farmTypes: [],
  goals: [],
  acreage: 0,
  interests: {
    soilAnalysis: false,
    environmentalReports: false,
    financing: true,
    vendorRecommendations: false,
    commodityIntelligence: false,
  },
};

export function formatBorrowerOnboardingLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function isPresent(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function createBorrowerOnboardingWorkflow(
  state: BorrowerOnboardingState
): BorrowerOnboardingWorkflow {
  const missingItems: string[] = [];

  if (!state.stage) {
    missingItems.push("farm stage");
  }

  if (!isPresent(state.location.country)) {
    missingItems.push("country");
  }

  if (!isPresent(state.location.state)) {
    missingItems.push("state");
  }

  if (!isPresent(state.location.county)) {
    missingItems.push("county");
  }

  if (state.farmTypes.length === 0) {
    missingItems.push("farm type");
  }

  if (state.goals.length === 0) {
    missingItems.push("borrower goal");
  }

  if (!Number.isFinite(state.acreage) || state.acreage <= 0) {
    missingItems.push("acreage");
  }

  const selectedInterestCount = Object.values(state.interests).filter(Boolean)
    .length;

  if (selectedInterestCount === 0) {
    missingItems.push("service interest");
  }

  const requiredItemCount = 8;
  const completedItemCount = Math.max(0, requiredItemCount - missingItems.length);
  const readinessPercent = Math.round(
    (completedItemCount / requiredItemCount) * 100
  );

  const handoffs: BorrowerOnboardingHandoff[] = [
    {
      id: "application",
      label: "Application intake",
      route: "/portal/borrower/applications",
      status: missingItems.length === 0 ? "complete" : "needs-input",
      reason:
        missingItems.length === 0
          ? "Core intake fields are ready for governed application review."
          : `Missing ${missingItems.length} intake item(s).`,
    },
    {
      id: "documents",
      label: "Document preparation",
      route: "/portal/borrower/documents",
      status: "pending-review",
      reason:
        "Supporting documents may be requested after operator and human review.",
    },
    {
      id: "financing",
      label: "Financing pathway",
      route: "/portal/revenue-opportunities",
      status: state.interests.financing ? "pending-review" : "needs-input",
      reason: state.interests.financing
        ? "Financing interest can route to advisory pathway guidance."
        : "Select financing interest to prioritize pathway guidance.",
    },
    {
      id: "environmental",
      label: "Environmental intake",
      route: "/environmental-compliance",
      status: state.interests.environmentalReports
        ? "pending-review"
        : "needs-input",
      reason: state.interests.environmentalReports
        ? "Environmental context can route to governed trigger/exemption review."
        : "Select environmental reports if environmental review is needed.",
    },
    {
      id: "opportunities",
      label: "Opportunity discovery",
      route: "/portal/property-discovery",
      status:
        state.interests.vendorRecommendations ||
        state.interests.commodityIntelligence ||
        state.interests.soilAnalysis
          ? "pending-review"
          : "needs-input",
      reason:
        "Discovery outputs are advisory and remain blocked from source certainty or approval claims.",
    },
    {
      id: "data-rights",
      label: "Data rights",
      route: "/portal/borrower/data-rights",
      status: "pending-review",
      reason:
        "Borrower portability and governed record access remain available through data-rights workflows.",
    },
  ];

  const nextRoutes = Array.from(
    new Set(
      handoffs
        .filter((handoff) => handoff.status !== "complete")
        .map((handoff) => handoff.route)
    )
  );

  return {
    readinessPercent,
    missingItems,
    selectedInterestCount,
    handoffs,
    nextRoutes,
    disclosures: [...borrowerOnboardingDisclosureMessages],
    productionBlocked: true,
    humanReviewRequired: true,
  };
}
