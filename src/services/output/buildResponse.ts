import type { OnboardingState } from "@/state/onboarding/types";

import { makeDecision } from "@/services/decision/decisionEngine";
import { routeVendors } from "@/services/vendors/vendorRouter";

/**
 * Governed Output Builder
 *
 * Master Volume Governance:
 * - Vol I: keeps output inside constitutional platform authority.
 * - Vol II: prevents borrower-facing output from becoming approval,
 *   eligibility, financing, permitting, legal, or regulatory determination.
 * - Vol III: preserves deterministic response structure.
 * - Vol III-B: keeps AI output advisory and human-review bounded.
 * - Vol IV: supports operator review and escalation.
 * - Vol V: preserves explainability, classification, portability, and
 *   controlled-disclosure boundaries.
 */
export function buildResponse(state: OnboardingState) {
  const recommendations = makeDecision(state);
  const vendorMatches = routeVendors(state);

  const institutionalReports =
    recommendations.reports?.length > 0
      ? recommendations.reports.map((reportName) => ({
          name: reportName,
          status: "INSTITUTIONAL_REVIEW_REQUIRED",
          borrowerCharged: false,
          requiresHumanReview: true,
        }))
      : [];

  const exotic =
    state.farmTypes?.includes("EXOTIC_ANIMALS") ||
    state.farmTypes?.includes("EXOTIC_BIRDS");

  const complianceWarnings = exotic
    ? [
        "EXOTIC FARMING CATEGORY DETECTED",
        "STATE OR LOCAL REVIEW MAY BE REQUIRED BEFORE OPERATION",
        "DO NOT RELY ON THIS PLATFORM OUTPUT AS A PERMITTING, LEGAL, OR REGULATORY DETERMINATION",
      ]
    : [];

  const disclaimer =
    "AI-GENERATED INFORMATION ONLY - NOT AN OFFICIAL REPORT - NOT VALID FOR PERMITTING, FINANCING, LEGAL, OR REGULATORY USE. INFORMATION IS PROVIDED FOR GENERAL EDUCATIONAL AND DECISION-SUPPORT PURPOSES ONLY AND SHOULD NOT BE RELIED UPON WITHOUT INDEPENDENT VERIFICATION. USERS SHOULD CONSULT APPROPRIATE LICENSED PROFESSIONALS BEFORE MAKING BUSINESS OR PROPERTY DECISIONS.";

  return {
    profile: {
      stage: state.stage,
      location: state.location,
      farmTypes: state.farmTypes,
      goals: state.goals,
      acreage: state.acreage,
    },

    intelligence: recommendations,

    vendors: vendorMatches,

    reports: {
      baseline: recommendations.notes,
      institutional: institutionalReports,
    },

    complianceWarnings,

    fundingModel: {
      borrowerCharged: false,
      institutionFunded: true,
      noOutcomeCompensation: true,
      noDataMonetization: true,
    },

    nextActions: [
      "Review baseline readiness guidance",
      "Prepare documents for human review",
      "Use governed export and portability workflows",
      "Request operator support for institutional coordination",
    ],

    disclaimer,
  };
}
