import { createHash } from "node:crypto";

import {
  composeAdvancedIntelligenceV2,
  type AdvancedIntelligenceV2Input,
} from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import type {
  IntelligenceEvidenceRef,
  IntelligenceScenarioSummary,
  IntelligenceWorkspaceContract,
} from "@/lib/intelligence/intelligenceWorkspaceContract";

export const INTELLIGENCE_CASE_WORKSPACE_VERSION = "intelligence-case-workspace-v0.1.0";

export type IntelligenceCaseWorkspaceInput = {
  caseId: string;
  displayName?: string | null;
  goal?: string | null;
  state?: string | null;
  customerTypes?: string[];
  intendedUses?: string[];
  actorId?: string | null;
};

function stableId(prefix: string, value: string): string {
  return `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 20)}`;
}

export function composeIntelligenceCaseWorkspace(
  input: IntelligenceCaseWorkspaceInput
): IntelligenceWorkspaceContract & {
  runtimeVersion: string;
  reviewRoutes: string[];
  conflictCount: number;
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  noLiveExternalAction: true;
} {
  const caseId = input.caseId.trim();
  if (!caseId) throw new Error("caseId is required.");

  const intelligenceInput: AdvancedIntelligenceV2Input = {
    userId: input.actorId ?? null,
    applicationId: caseId,
    reviewerRole: "Intelligence Case Workspace",
    borrowerContext: {
      declaredCustomerTypes: input.customerTypes?.filter(Boolean) ?? [],
      intendedUses: input.intendedUses?.filter(Boolean) ?? [],
      jurisdiction: input.state ? { federal: true, state: input.state } : null,
    },
    scope: { state: input.state ?? null, sovereignFederationAllowed: false },
    metadata: { caseId, source: INTELLIGENCE_CASE_WORKSPACE_VERSION },
  };
  const intelligence = composeAdvancedIntelligenceV2(intelligenceInput);

  const evidence: IntelligenceEvidenceRef[] = intelligence.v2Domains.flatMap((domain) =>
    domain.insights.flatMap((insight) =>
      insight.signals.map((signal) => ({
        evidenceId: stableId("evidence", `${caseId}:${signal.signalId}`),
        label: `${insight.title}: ${signal.label}`,
        state: signal.confidenceScore !== undefined && signal.confidenceScore < 0.6 ? "ESTIMATED" : "INFERRED",
        sourceId: signal.sourceRefs[0] ?? domain.id,
        sourceAuthority: signal.authorityTier ?? "GOVERNED_INTERNAL",
        sourceUseBoundary: "INTERNAL_GOVERNED",
        observedAt: null,
        retrievedAt: intelligence.generatedAt,
        geography: input.state ?? null,
        confidence: signal.confidenceScore ?? null,
        conflictRefs: insight.conflicts.map((conflict) => conflict.conflictId),
        traceId: stableId("trace", `${caseId}:${signal.signalId}`),
      } satisfies IntelligenceEvidenceRef))
    )
  );

  const scenarios: IntelligenceScenarioSummary[] = intelligence.v2Domains.map((domain) => ({
    scenarioId: stableId("scenario", `${caseId}:${domain.id}`),
    label: domain.label,
    capitalPosture: domain.id === "capital_program_intelligence" ? "PROGRAM_OPTIONS_REQUIRE_REVIEW" : "NOT_YET_DETERMINED",
    timingPosture: "HUMAN_REVIEW_REQUIRED",
    operatingPosture: `${domain.insights.length} governed insight(s) available`,
    compliancePosture: domain.conflictCount > 0 ? "CONFLICTS_REQUIRE_RESOLUTION" : "REVIEW_REQUIRED",
    downsidePosture: domain.conflictCount > 0 ? `${domain.conflictCount} preserved conflict(s)` : "UNKNOWN_UNTIL_REVIEW",
    evidenceRefs: evidence
      .filter((item) => item.sourceId === domain.id || domain.insights.some((insight) => insight.signals.some((signal) => signal.sourceRefs.includes(item.sourceId))))
      .map((item) => item.evidenceId),
    unresolvedDecisionIds: domain.insights.flatMap((insight) => insight.conflicts.map((conflict) => conflict.conflictId)),
  }));

  return {
    contractVersion: "intelligence-workspace-v1",
    runtimeVersion: INTELLIGENCE_CASE_WORKSPACE_VERSION,
    subject: {
      subjectType: "intelligence-case",
      subjectKey: caseId,
      displayName: input.displayName?.trim() || `Furlong Case ${caseId}`,
      ownerOrganizationId: null,
    },
    goal: input.goal?.trim() || "Evaluate governed pathways, evidence, constraints, and next steps.",
    evidence,
    scenarios,
    recommendation: {
      releaseId: null,
      state: "DRAFT",
      recommendationText: "No recommendation has been released. Review the evidence, conflicts, scenarios, and missing decisions with an authorized human reviewer.",
      conditionCount: intelligence.summary.conflictCount + intelligence.summary.crossSourceConflictCount,
      unresolvedDecisionCount: scenarios.reduce((sum, scenario) => sum + scenario.unresolvedDecisionIds.length, 0),
      evidenceVersion: intelligence.runtimeVersion,
      supersedesReleaseId: null,
    },
    outcome: {
      status: "NOT_STARTED",
      recommendationAdopted: null,
      actualCapital: null,
      actualCompletionDate: null,
      varianceNotes: [],
      evidenceRefs: [],
    },
    generatedAt: intelligence.generatedAt,
    traceId: stableId("case-trace", `${caseId}:${intelligence.generatedAt}`),
    reviewRoutes: intelligence.recommendedReviewRoutes,
    conflictCount: intelligence.summary.conflictCount + intelligence.summary.crossSourceConflictCount,
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    noLiveExternalAction: true,
  };
}
