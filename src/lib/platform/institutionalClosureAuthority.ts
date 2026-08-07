import type { InstitutionalRemediationEvaluation } from "@/lib/platform/institutionalRemediationAuthority";
import type { InstitutionalOutcomeReconciliation } from "@/lib/platform/institutionalOutcomeReconciliationAuthority";

export const INSTITUTIONAL_CLOSURE_SCHEMA_VERSION = "institutional-closure-v1";

export type InstitutionalClosureType = "CLOSE_AND_RESTORE" | "CLOSE_RESTRICTED" | "KEEP_OPEN" | "ESCALATE";
export type InstitutionalClosureDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type InstitutionalClosureState = "CLOSED_RESTORED" | "CLOSED_RESTRICTED" | "OPEN" | "ESCALATED";

export type InstitutionalClosurePolicy = Readonly<{
  policyId: string;
  governanceVersion: string;
  allowedTypes: readonly InstitutionalClosureType[];
  requireAllowedRemediation: boolean;
  requireIndependentReview: boolean;
  requireResolutionEvidence: boolean;
  requireMonitoringPlan: boolean;
  requireAffectedPartyConfirmation: boolean;
  claimRestorationAuthorized: boolean;
  publicationRestorationAuthorized: boolean;
  relianceRestorationAuthorized: boolean;
  requiredEvidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}>;

export type InstitutionalClosureEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_CLOSURE_SCHEMA_VERSION;
  reconciliationId: string;
  remediationPolicyId: string;
  closurePolicyId: string;
  closureType: InstitutionalClosureType;
  decision: InstitutionalClosureDecision;
  resultingState: InstitutionalClosureState;
  reasons: readonly string[];
  reviewRefs: readonly string[];
  evidenceRefs: readonly string[];
  evaluatedAt: string;
  auditRefs: readonly string[];
  replayRef: string;
}>;

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(value: string, field: string): string { const v = value.trim(); if (!v) throw new Error(`${field} must be non-empty.`); return v; }
function iso(value: string, field: string): string { if (!ISO_UTC.test(nonEmpty(value, field))) throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`); return value; }
function list<T extends string>(values: readonly T[], field: string, required = false): readonly T[] { const v = values.map((x) => nonEmpty(x, field) as T); if (required && !v.length) throw new Error(`${field} must contain at least one value.`); if (new Set(v).size !== v.length) throw new Error(`${field} must not contain duplicates.`); return Object.freeze([...v].sort()) as readonly T[]; }

export function createInstitutionalClosurePolicy(input: InstitutionalClosurePolicy): InstitutionalClosurePolicy {
  if (input.allowedTypes.includes("CLOSE_AND_RESTORE") && !(input.claimRestorationAuthorized && input.publicationRestorationAuthorized && input.relianceRestorationAuthorized)) {
    throw new Error("Close-and-restore requires claim, publication, and reliance restoration authority.");
  }
  return Object.freeze({ ...input, policyId: nonEmpty(input.policyId, "policyId"), governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"), allowedTypes: list(input.allowedTypes, "allowedTypes", true), requiredEvidenceRefs: list(input.requiredEvidenceRefs, "requiredEvidenceRefs"), auditRefs: list(input.auditRefs, "auditRefs", true), replayRef: nonEmpty(input.replayRef, "replayRef"), versionRefs: list(input.versionRefs, "versionRefs", true) });
}

export function evaluateInstitutionalClosure(input: {
  reconciliation: InstitutionalOutcomeReconciliation;
  remediation: InstitutionalRemediationEvaluation;
  policy: InstitutionalClosurePolicy;
  closureType: InstitutionalClosureType;
  independentReviewRefs?: readonly string[];
  resolutionEvidenceRef?: string | null;
  monitoringPlanRef?: string | null;
  affectedPartyConfirmationRef?: string | null;
  evidenceRefs: readonly string[];
  evaluatedAt: string;
  auditRefs: readonly string[];
  replayRef: string;
}): InstitutionalClosureEvaluation {
  iso(input.evaluatedAt, "evaluatedAt");
  const policy = createInstitutionalClosurePolicy(input.policy);
  const reviews = list(input.independentReviewRefs ?? [], "independentReviewRefs");
  const evidence = list(input.evidenceRefs, "evidenceRefs");
  const reasons: string[] = [];
  if (input.remediation.reconciliationId !== input.reconciliation.reconciliationId) reasons.push("remediation-reconciliation-mismatch");
  if (policy.requireAllowedRemediation && input.remediation.decision !== "ALLOW") reasons.push(`remediation:${input.remediation.decision.toLowerCase()}`);
  if (!policy.allowedTypes.includes(input.closureType)) reasons.push("closure-type-not-authorized");
  if (policy.requireIndependentReview && !reviews.length) reasons.push("independent-review-required");
  if (policy.requireResolutionEvidence && !input.resolutionEvidenceRef?.trim()) reasons.push("resolution-evidence-required");
  if (policy.requireMonitoringPlan && !input.monitoringPlanRef?.trim()) reasons.push("monitoring-plan-required");
  if (policy.requireAffectedPartyConfirmation && !input.affectedPartyConfirmationRef?.trim()) reasons.push("affected-party-confirmation-required");
  for (const required of policy.requiredEvidenceRefs) if (!evidence.includes(required)) reasons.push(`missing-evidence:${required}`);
  if (input.closureType === "CLOSE_AND_RESTORE") {
    if (!policy.claimRestorationAuthorized) reasons.push("claim-restoration-not-authorized");
    if (!policy.publicationRestorationAuthorized) reasons.push("publication-restoration-not-authorized");
    if (!policy.relianceRestorationAuthorized) reasons.push("reliance-restoration-not-authorized");
  }
  const reviewReasons = new Set(["independent-review-required", "resolution-evidence-required", "monitoring-plan-required", "affected-party-confirmation-required"]);
  const hardBlock = reasons.some((reason) => !reviewReasons.has(reason));
  const decision: InstitutionalClosureDecision = hardBlock ? "BLOCK" : reasons.length ? "REVIEW_REQUIRED" : "ALLOW";
  const resultingState: InstitutionalClosureState = input.closureType === "CLOSE_AND_RESTORE" ? "CLOSED_RESTORED" : input.closureType === "CLOSE_RESTRICTED" ? "CLOSED_RESTRICTED" : input.closureType === "ESCALATE" ? "ESCALATED" : "OPEN";
  return Object.freeze({ schemaVersion: INSTITUTIONAL_CLOSURE_SCHEMA_VERSION, reconciliationId: input.reconciliation.reconciliationId, remediationPolicyId: input.remediation.policyId, closurePolicyId: policy.policyId, closureType: input.closureType, decision, resultingState, reasons: Object.freeze([...new Set(reasons)].sort()), reviewRefs: reviews, evidenceRefs: evidence, evaluatedAt: input.evaluatedAt, auditRefs: list(input.auditRefs, "auditRefs", true), replayRef: nonEmpty(input.replayRef, "replayRef") });
}

export const institutionalClosureAuthority = Object.freeze({ createPolicy: createInstitutionalClosurePolicy, evaluate: evaluateInstitutionalClosure });
