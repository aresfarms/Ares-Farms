import type { ScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";

/**
 * Neutral paid-report recommendation.
 *
 * Furlong recommends the smallest product that can answer the customer's
 * present decision. Availability and price never increase the recommendation.
 * Authority: CANON-EXPL-001, PUBLIC-CLAIMS-001, REG-TREASURY-001.
 */
export const PROPERTY_REPORT_RECOMMENDATION_VERSION =
  "property-report-recommendation-v1.0.0";

export type RecommendedReportLevel =
  | "SNAPSHOT_ONLY"
  | "PROPERTY_REPORT"
  | "DECISION_REPORT"
  | "PROFESSIONAL_SCOPE_FIRST";

export type PropertyReportRecommendation = {
  version: typeof PROPERTY_REPORT_RECOMMENDATION_VERSION;
  level: RecommendedReportLevel;
  headline: string;
  explanation: string;
  reasons: string[];
  doNotBuyDecisionReportYet: boolean;
};

export type PropertyReportRecommendationInput = {
  plan: ScenarioRankingPlan;
  priceKnown: boolean;
  customerVisionSelected: boolean;
  activeTransaction: boolean;
  materialEvidenceGapCount: number;
  professionalEvidenceRequired?: boolean;
};

function scoreGap(plan: ScenarioRankingPlan): number | null {
  if (plan.scenarios.length < 2) return null;
  return Math.abs(plan.scenarios[0].totalScore - plan.scenarios[1].totalScore);
}

export function recommendPropertyReportLevel(
  input: PropertyReportRecommendationInput,
): PropertyReportRecommendation {
  const gap = scoreGap(input.plan);
  const reasons: string[] = [];

  if (input.professionalEvidenceRequired) {
    return {
      version: PROPERTY_REPORT_RECOMMENDATION_VERSION,
      level: "PROFESSIONAL_SCOPE_FIRST",
      headline: "Scope the professional work before buying another report.",
      explanation:
        "A field, laboratory, agency, or licensed-professional fact must be resolved before additional financial modeling can answer the decision reliably.",
      reasons: [
        "The unresolved fact can change whether the proposed use is physically or legally feasible.",
        "A paid Decision Report must not disguise missing professional evidence as completed analysis.",
      ],
      doNotBuyDecisionReportYet: true,
    };
  }

  let decisionNeed = 0;
  if (input.plan.status === "preliminary") {
    decisionNeed += 2;
    reasons.push("The three-scenario ranking is still preliminary.");
  }
  if (!input.priceKnown) {
    decisionNeed += 2;
    reasons.push(
      "No transaction price or intended offer is available for acquisition and debt-service boundaries.",
    );
  }
  if (input.activeTransaction) {
    decisionNeed += 2;
    reasons.push(
      "The customer is evaluating an active purchase or financing timeline.",
    );
  }
  if (input.customerVisionSelected) {
    const customerRank = input.plan.scenarios.findIndex(
      (scenario) => scenario.candidateRole === "customer-vision",
    );
    if (customerRank > 0) {
      decisionNeed += 1;
      reasons.push(
        "The selected vision does not currently lead the property-side ranking.",
      );
    }
  }
  if (gap !== null && gap <= 5) {
    decisionNeed += 1;
    reasons.push(
      "The leading scenarios are close enough that reviewed assumptions could change the order.",
    );
  }
  if (input.materialEvidenceGapCount >= 3) {
    decisionNeed += 1;
    reasons.push("Several material evidence gaps still affect the conclusion.");
  }
  if (input.plan.overallPosture === "renegotiate") {
    decisionNeed += 2;
    reasons.push(
      "The current result depends on price, terms, or execution conditions changing.",
    );
  }

  if (
    input.plan.overallPosture === "walk-away" &&
    input.plan.status === "evidence-supported" &&
    !input.activeTransaction
  ) {
    return {
      version: PROPERTY_REPORT_RECOMMENDATION_VERSION,
      level: "SNAPSHOT_ONLY",
      headline: "Do not buy the Decision Report yet.",
      explanation:
        "The current evidence already supports a walk-away posture. Reconsider only after the property, price, proposed use, or missing evidence materially changes.",
      reasons: [
        "Paying for more analysis should not be the default when the existing evidence already answers the immediate question.",
      ],
      doNotBuyDecisionReportYet: true,
    };
  }

  if (decisionNeed >= 4) {
    return {
      version: PROPERTY_REPORT_RECOMMENDATION_VERSION,
      level: "DECISION_REPORT",
      headline: "A Property Decision Report is warranted.",
      explanation:
        "Human review, price boundaries, and sensitivity testing can materially improve this specific acquisition decision.",
      reasons: reasons.slice(0, 5),
      doNotBuyDecisionReportYet: false,
    };
  }

  if (
    input.plan.status === "preliminary" ||
    input.materialEvidenceGapCount > 0 ||
    input.customerVisionSelected
  ) {
    return {
      version: PROPERTY_REPORT_RECOMMENDATION_VERSION,
      level: "PROPERTY_REPORT",
      headline: "Start with the Property Report.",
      explanation:
        "The automated report can answer the next property-side question without charging for human review that is not yet justified.",
      reasons:
        reasons.length > 0
          ? reasons.slice(0, 4)
          : [
              "The free snapshot does not yet contain the full scenario and economics package.",
            ],
      doNotBuyDecisionReportYet: true,
    };
  }

  return {
    version: PROPERTY_REPORT_RECOMMENDATION_VERSION,
    level: "SNAPSHOT_ONLY",
    headline: "The free snapshot is enough for now.",
    explanation:
      "No current decision signal justifies charging for a deeper report. Add a real price, supported vision, or active decision timeline before upgrading.",
    reasons: [
      "Furlong recommends paid work only when it can change or document a real decision.",
    ],
    doNotBuyDecisionReportYet: true,
  };
}
