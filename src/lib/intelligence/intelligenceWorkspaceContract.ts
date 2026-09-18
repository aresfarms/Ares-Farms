export type EvidenceState =
  | "VERIFIED"
  | "INFERRED"
  | "ESTIMATED"
  | "STALE"
  | "CONFLICTING"
  | "UNKNOWN";

export type SourceUseBoundary =
  | "PUBLIC_FACT"
  | "CUSTOMER_PROVIDED"
  | "LICENSED_DISPLAY_ONLY"
  | "LICENSED_ANALYTICS_AGGREGATE_ONLY"
  | "LICENSED_RECOMMENDATION_INPUT"
  | "INTERNAL_GOVERNED";

export interface IntelligenceEvidenceRef {
  evidenceId: string;
  label: string;
  state: EvidenceState;
  sourceId: string;
  sourceAuthority: string;
  sourceUseBoundary: SourceUseBoundary;
  observedAt: string | null;
  retrievedAt: string;
  geography: string | null;
  confidence: number | null;
  conflictRefs: string[];
  traceId: string;
}

export interface IntelligenceScenarioSummary {
  scenarioId: string;
  label: string;
  capitalPosture: string;
  timingPosture: string;
  operatingPosture: string;
  compliancePosture: string;
  downsidePosture: string;
  evidenceRefs: string[];
  unresolvedDecisionIds: string[];
}

export interface IntelligenceRecommendationSummary {
  releaseId: string | null;
  state: "DRAFT" | "PENDING_HUMAN_REVIEW" | "PENDING_COUNTERSIGNATURE" | "RELEASED" | "WITHHELD";
  recommendationText: string;
  conditionCount: number;
  unresolvedDecisionCount: number;
  evidenceVersion: string;
  supersedesReleaseId: string | null;
}

export interface IntelligenceOutcomeSummary {
  status: "NOT_STARTED" | "IN_PROGRESS" | "REALIZED" | "ABANDONED" | "UNKNOWN";
  recommendationAdopted: boolean | null;
  actualCapital: number | null;
  actualCompletionDate: string | null;
  varianceNotes: string[];
  evidenceRefs: string[];
}

export interface IntelligenceWorkspaceContract {
  contractVersion: "intelligence-workspace-v1";
  subject: {
    subjectType: string;
    subjectKey: string;
    displayName: string;
    ownerOrganizationId: string | null;
  };
  goal: string;
  evidence: IntelligenceEvidenceRef[];
  scenarios: IntelligenceScenarioSummary[];
  recommendation: IntelligenceRecommendationSummary;
  outcome: IntelligenceOutcomeSummary;
  generatedAt: string;
  traceId: string;
}

export function sourceMaySupportIndividualRecommendation(boundary: SourceUseBoundary): boolean {
  return boundary === "PUBLIC_FACT"
    || boundary === "CUSTOMER_PROVIDED"
    || boundary === "LICENSED_RECOMMENDATION_INPUT"
    || boundary === "INTERNAL_GOVERNED";
}

export function assertRecommendationEvidenceBoundary(evidence: IntelligenceEvidenceRef[]): void {
  const prohibited = evidence.filter((item) => !sourceMaySupportIndividualRecommendation(item.sourceUseBoundary));
  if (prohibited.length) {
    throw new Error(`Recommendation evidence exceeds licensed-use boundary: ${prohibited.map((item) => item.evidenceId).join(", ")}`);
  }
}
