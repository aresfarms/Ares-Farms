import type { OnboardingState } from "@/state/onboarding/types";

import { makeDecision } from "@/services/decision/decisionEngine";
import { routeVendors } from "@/services/vendors/vendorRouter";

/**
 * MASTER OUTPUT ENGINE
 * Combines:
 * - farm intelligence
 * - vendor routing
 * - report gating
 * - compliance rules
 */
export function buildResponse(state: OnboardingState) {
  // ----------------------------
  // CORE INTELLIGENCE
  // ----------------------------
  const recommendations = makeDecision(state);

  // ----------------------------
  // VENDOR MATCHING
  // ----------------------------
  const vendorMatches = routeVendors(state);

  // ----------------------------
  // REPORT AVAILABILITY
  // ----------------------------
  const paidReports =
    recommendations.reports?.length > 0
      ? recommendations.reports.map((r) => ({
          name: r,
          status: "PAYWALLED",
          requiresPurchase: true,
        }))
      : [];

  // ----------------------------
  // EXOTIC / HIGH RISK FLAGS
  // ----------------------------
  const exotic =
    state.farmTypes?.includes("EXOTIC_ANIMALS") ||
    state.farmTypes?.includes("EXOTIC_BIRDS");

  const complianceWarnings = exotic
    ? [
        "EXOTIC FARMING CATEGORY DETECTED",
        "STATE PERMIT REQUIRED BEFORE OPERATION",
        "DO NOT PROCEED WITHOUT REGULATORY APPROVAL",
      ]
    : [];

  // ----------------------------
  // DISCLAIMER (GLOBAL SYSTEM RULE)
  // ----------------------------
  const disclaimer =
    "AI-GENERATED INFORMATION ONLY — NOT AN OFFICIAL REPORT — NOT VALID FOR PERMITTING, FINANCING, LEGAL, OR REGULATORY USE. INFORMATION IS PROVIDED FOR GENERAL EDUCATIONAL AND DECISION-SUPPORT PURPOSES ONLY AND SHOULD NOT BE RELIED UPON WITHOUT INDEPENDENT VERIFICATION. USERS ARE STRONGLY ENCOURAGED TO CONSULT APPROPRIATE LICENSED PROFESSIONALS BEFORE MAKING ANY BUSINESS OR PROPERTY DECISIONS.";

  // ----------------------------
  // FINAL RESPONSE OBJECT
  // ----------------------------
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
      free: recommendations.notes,
      paid: paidReports,
    },

    complianceWarnings,

    monetization: {
      hasPaidReports: paidReports.length > 0,
      vendorRoutingEnabled: true,
      newsletterEligible: true,
    },

    nextActions: [
      "Explore free farm plan",
      "Purchase detailed report",
      "Browse vetted vendors",
      "Check financing options",
    ],

    disclaimer,
  };
}
