import type { InstitutionalOutcomeReconciliation } from "@/lib/platform/institutionalOutcomeReconciliationAuthority";

export const INSTITUTIONAL_REMEDIATION_SCHEMA_VERSION = "institutional-remediation-v1";

export type InstitutionalRemediationType = "CORRECTIVE_UPDATE" | "REVERSAL" | "COMPENSATION" | "RETRY" | "MANUAL_RESOLUTION" | "ESCALATION_ONLY";
export type InstitutionalRemediationDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";

export type InstitutionalRemediationPolicy = Readonly<{
  policyId: string;
  governanceVersion: string;
  allowedTypes: readonly InstitutionalRemediationType[];
  requireOpenException: boolean;
  requireHumanApproval: boolean;
  requireDualControl: boolean;
  requireRollbackPlan: boolean;
  requireAffectedPartyNotice: boolean;
  compensationAuthorized: boolean;
  reversalAuthorized: boolean;
  retryAuthorized: boolean;
  requiredEvidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}>;

export type InstitutionalRemediationEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_REMEDIATION_SCHEMA_VERSION;
  reconciliationId: string;
  exceptionRef: string;
  policyId: string;
  remediationType: InstitutionalRemediationType;
  decision: InstitutionalRemediationDecision;
  reasons: readonly string[];
  approvalRefs: readonly string[];
  evidenceRefs: readonly string[];
  evaluatedAt: string;
  auditRefs: readonly string[];
  replayRef: string;
}>;

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(value: string, field: string): string { const v = value.trim(); if (!v) throw new Error(`${field} must be non-empty.`); return v; }
function iso(value: string, field: string): string { if (!ISO_UTC.test(nonEmpty(value, field))) throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`); return value; }
function list<T extends string>(values: readonly T[], field: string, required = false): readonly T[] { const v = values.map((x) => nonEmpty(x, field) as T); if (required && !v.length) throw new Error(`${field} must contain at least one value.`); if (new Set(v).size !== v.length) throw new Error(`${field} must not contain duplicates.`); return Object.freeze([...v].sort()) as readonly T[]; }

export function createInstitutionalRemediationPolicy(input: InstitutionalRemediationPolicy): InstitutionalRemediationPolicy {
  if (input.allowedTypes.includes("COMPENSATION") && !input.compensationAuthorized) throw new Error("Compensation requires explicit authority.");
  if (input.allowedTypes.includes("REVERSAL") && !input.reversalAuthorized) throw new Error("Reversal requires explicit authority.");
  if (input.allowedTypes.includes("RETRY") && !input.retryAuthorized) throw new Error("Retry requires explicit authority.");
  return Object.freeze({ ...input, policyId: nonEmpty(input.policyId, "policyId"), governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"), allowedTypes: list(input.allowedTypes, "allowedTypes", true), requiredEvidenceRefs: list(input.requiredEvidenceRefs, "requiredEvidenceRefs"), auditRefs: list(input.auditRefs, "auditRefs", true), replayRef: nonEmpty(input.replayRef, "replayRef"), versionRefs: list(input.versionRefs, "versionRefs", true) });
}

export function evaluateInstitutionalRemediation(input: {
  reconciliation: InstitutionalOutcomeReconciliation;
  policy: InstitutionalRemediationPolicy;
  remediationType: InstitutionalRemediationType;
  approvalRefs?: readonly string[];
  rollbackPlanRef?: string | null;
  affectedPartyNoticeRef?: string | null;
  evidenceRefs: readonly string[];
  evaluatedAt: string;
  auditRefs: readonly string[];
  replayRef: string;
}): InstitutionalRemediationEvaluation {
  iso(input.evaluatedAt, "evaluatedAt");
  const policy = createInstitutionalRemediationPolicy(input.policy);
  const approvals = list(input.approvalRefs ?? [], "approvalRefs");
  const evidence = list(input.evidenceRefs, "evidenceRefs");
  const reasons: string[] = [];
  const openStates = new Set(["EXCEPTION_OPEN", "REMEDIATION_PENDING", "ESCALATED"]);
  if (policy.requireOpenException && !openStates.has(input.reconciliation.state)) reasons.push("exception-not-open");
  if (!input.reconciliation.exceptionRef) reasons.push("missing-exception-reference");
  if (!policy.allowedTypes.includes(input.remediationType)) reasons.push("remediation-type-not-authorized");
  if (policy.requireHumanApproval && !approvals.length) reasons.push("human-approval-required");
  if (policy.requireDualControl && approvals.length < 2) reasons.push("dual-control-required");
  if (policy.requireRollbackPlan && !input.rollbackPlanRef?.trim()) reasons.push("rollback-plan-required");
  if (policy.requireAffectedPartyNotice && !input.affectedPartyNoticeRef?.trim()) reasons.push("affected-party-notice-required");
  for (const required of policy.requiredEvidenceRefs) if (!evidence.includes(required)) reasons.push(`missing-evidence:${required}`);
  if (input.remediationType === "COMPENSATION" && !policy.compensationAuthorized) reasons.push("compensation-not-authorized");
  if (input.remediationType === "REVERSAL" && !policy.reversalAuthorized) reasons.push("reversal-not-authorized");
  if (input.remediationType === "RETRY" && !policy.retryAuthorized) reasons.push("retry-not-authorized");
  const review = new Set(["human-approval-required", "dual-control-required", "rollback-plan-required", "affected-party-notice-required"]);
  const hardBlock = reasons.some((reason) => !review.has(reason));
  const decision: InstitutionalRemediationDecision = hardBlock ? "BLOCK" : reasons.length ? "REVIEW_REQUIRED" : "ALLOW";
  return Object.freeze({ schemaVersion: INSTITUTIONAL_REMEDIATION_SCHEMA_VERSION, reconciliationId: input.reconciliation.reconciliationId, exceptionRef: nonEmpty(input.reconciliation.exceptionRef ?? "", "exceptionRef"), policyId: policy.policyId, remediationType: input.remediationType, decision, reasons: Object.freeze([...new Set(reasons)].sort()), approvalRefs: approvals, evidenceRefs: evidence, evaluatedAt: input.evaluatedAt, auditRefs: list(input.auditRefs, "auditRefs", true), replayRef: nonEmpty(input.replayRef, "replayRef") });
}

export const institutionalRemediationAuthority = Object.freeze({ createPolicy: createInstitutionalRemediationPolicy, evaluate: evaluateInstitutionalRemediation });
