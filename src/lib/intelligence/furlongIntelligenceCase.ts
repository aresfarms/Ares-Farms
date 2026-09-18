/**
 * Canonical Furlong property-intelligence case contract.
 *
 * This is intentionally advisory and evidence-first. It does not represent a
 * credit decision, lender commitment, environmental clearance, appraisal, or
 * legal determination. Each downstream spoke contributes to the same case.
 */

export type CompassLens =
  | "property-land"
  | "farms-agriculture"
  | "small-business-growth"
  | "environmental-compliance"
  | "financing-capital"
  | "grants-programs"
  | "guild"
  | "taxes-accounting-regulations";

export type RecommendationPosture =
  | "strong-opportunity"
  | "conditional-opportunity"
  | "marginal-opportunity"
  | "walk-away";

export type ConfidenceLevel = "high" | "moderate" | "low" | "unknown";

export interface EvidenceReference {
  id: string;
  sourceLabel: string;
  asOf: string | null;
  url?: string | null;
  confidence: ConfidenceLevel;
}

export interface MoneyRange {
  low: number | null;
  likely: number | null;
  high: number | null;
  currency: "USD";
}

export interface DayRange {
  low: number | null;
  likely: number | null;
  high: number | null;
}

export interface FinancingPipelineEstimate {
  bestCaseDays: DayRange;
  mostLikelyDays: DayRange;
  delayCaseDays: DayRange;
  assumptions: string[];
  criticalPath: string[];
  environmentalRequirement?: "phase-i-likely" | "phase-i-required" | "enhanced-review-likely" | "unknown";
}

export interface PropertyUseScenario {
  id: string;
  title: string;
  posture: RecommendationPosture;
  propertyFitScore: number | null;
  marketViabilityScore: number | null;
  financeabilityScore: number | null;
  lifecycleResilienceScore: number | null;
  reasons: string[];
  risks: string[];
  unknowns: string[];
  evidenceRefs: string[];
}

export interface CollateralEquitySnapshot {
  status: "consent-required" | "owner-estimate-only" | "comparable-review-needed" | "lender-review-needed" | "usable-equity-estimated";
  comparableSupportedValue: MoneyRange;
  likelyLenderValue: MoneyRange;
  grossEquity: MoneyRange;
  likelyUsableEquity: MoneyRange;
  assumptions: string[];
}

export interface FurlongIntelligenceCase {
  caseId: string;
  startingLens: CompassLens | null;
  propertyId: string | null;
  propertyAddress: string | null;
  customerGoal: string | null;
  scenarios: PropertyUseScenario[];
  recommendedScenarioId: string | null;
  financingPipeline: FinancingPipelineEstimate | null;
  financialAuthorization: "not-requested" | "authorized" | "declined";
  collateralAuthorization: "not-requested" | "authorized" | "declined";
  collateralEquity: CollateralEquitySnapshot | null;
  evidence: EvidenceReference[];
  assumptions: string[];
  unknowns: string[];
  generatedAt: string;
  replayRef: string | null;
}
