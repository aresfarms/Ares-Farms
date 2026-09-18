import type { InstitutionalRelianceEvaluation } from "@/lib/platform/institutionalRelianceAuthority";

export const INSTITUTIONAL_ACTION_SCHEMA_VERSION = "institutional-action-v1";

export type InstitutionalActionType =
  | "INTERNAL_RECORD_UPDATE"
  | "WORKFLOW_TRANSITION"
  | "DOCUMENT_GENERATION"
  | "OFFICIAL_REPORT_PUBLICATION"
  | "BORROWER_NOTICE_SEND"
  | "EXTERNAL_CONNECTOR_CALL"
  | "AUTHENTICATED_AGENCY_SESSION"
  | "PAYMENT_CAPTURE"
  | "REGULATORY_FILING"
  | "LEGAL_COMMITMENT";
export type InstitutionalActionDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";

export type InstitutionalActionPolicy = Readonly<{
  policyId: string;
  governanceVersion: string;
  allowedActionTypes: readonly InstitutionalActionType[];
  requireRelianceApproval: boolean;
  requireHumanApproval: boolean;
  requireProductionReadiness: boolean;
  requireCredentialReference: boolean;
  requireConsentReference: boolean;
  requireRollbackPlan: boolean;
  requireIncidentPlan: boolean;
  liveExternalActionAuthorized: boolean;
  paymentCaptureAuthorized: boolean;
  noticeSendAuthorized: boolean;
  regulatoryFilingAuthorized: boolean;
  legalCommitmentAuthorized: boolean;
  requiredEvidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}>;

export type InstitutionalActionEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_ACTION_SCHEMA_VERSION;
  reliancePolicyId: string;
  claimId: string;
  actionPolicyId: string;
  actionType: InstitutionalActionType;
  decision: InstitutionalActionDecision;
  reasons: readonly string[];
  evaluatedAt: string;
  approvalRefs: readonly string[];
  evidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
}>;

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const externalActions = new Set<InstitutionalActionType>([
  "OFFICIAL_REPORT_PUBLICATION", "BORROWER_NOTICE_SEND", "EXTERNAL_CONNECTOR_CALL",
  "AUTHENTICATED_AGENCY_SESSION", "PAYMENT_CAPTURE", "REGULATORY_FILING", "LEGAL_COMMITMENT",
]);

function nonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} must be non-empty.`);
  return normalized;
}
function iso(value: string, field: string): string {
  if (!ISO_UTC.test(nonEmpty(value, field))) throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`);
  return value;
}
function list<T extends string>(values: readonly T[], field: string, required = true): readonly T[] {
  const normalized = values.map((value) => nonEmpty(value, field) as T);
  if (required && !normalized.length) throw new Error(`${field} must contain at least one value.`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`);
  return Object.freeze([...normalized].sort()) as readonly T[];
}

export function createInstitutionalActionPolicy(input: InstitutionalActionPolicy): InstitutionalActionPolicy {
  if (input.allowedActionTypes.includes("PAYMENT_CAPTURE") && !input.paymentCaptureAuthorized) {
    throw new Error("Payment capture action requires payment capture authority.");
  }
  if (input.allowedActionTypes.includes("BORROWER_NOTICE_SEND") && !input.noticeSendAuthorized) {
    throw new Error("Borrower notice action requires notice send authority.");
  }
  if (input.allowedActionTypes.includes("REGULATORY_FILING") && !input.regulatoryFilingAuthorized) {
    throw new Error("Regulatory filing action requires regulatory filing authority.");
  }
  if (input.allowedActionTypes.includes("LEGAL_COMMITMENT") && !input.legalCommitmentAuthorized) {
    throw new Error("Legal commitment action requires legal commitment authority.");
  }
  if (input.allowedActionTypes.some((type) => externalActions.has(type)) && !input.liveExternalActionAuthorized) {
    throw new Error("External actions require explicit live external action authority.");
  }
  return Object.freeze({
    ...input,
    policyId: nonEmpty(input.policyId, "policyId"),
    governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"),
    allowedActionTypes: list(input.allowedActionTypes, "allowedActionTypes"),
    requiredEvidenceRefs: list(input.requiredEvidenceRefs, "requiredEvidenceRefs", false),
    auditRefs: list(input.auditRefs, "auditRefs"),
    replayRef: nonEmpty(input.replayRef, "replayRef"),
    versionRefs: list(input.versionRefs, "versionRefs"),
  });
}

export function evaluateInstitutionalAction(input: {
  reliance: InstitutionalRelianceEvaluation;
  policy: InstitutionalActionPolicy;
  actionType: InstitutionalActionType;
  humanApprovalRefs?: readonly string[];
  productionReadinessRef?: string | null;
  credentialRef?: string | null;
  consentRef?: string | null;
  rollbackPlanRef?: string | null;
  incidentPlanRef?: string | null;
  evidenceRefs: readonly string[];
  evaluatedAt: string;
  auditRefs: readonly string[];
  replayRef: string;
}): InstitutionalActionEvaluation {
  iso(input.evaluatedAt, "evaluatedAt");
  const policy = createInstitutionalActionPolicy(input.policy);
  const approvalRefs = list(input.humanApprovalRefs ?? [], "humanApprovalRefs", false);
  const evidenceRefs = list(input.evidenceRefs, "evidenceRefs", false);
  const reasons: string[] = [];

  if (policy.requireRelianceApproval && input.reliance.decision !== "ALLOW") reasons.push(`reliance:${input.reliance.decision.toLowerCase()}`);
  if (!policy.allowedActionTypes.includes(input.actionType)) reasons.push("action-type-not-authorized");
  if (policy.requireHumanApproval && !approvalRefs.length) reasons.push("human-approval-required");
  if (policy.requireProductionReadiness && !input.productionReadinessRef?.trim()) reasons.push("production-readiness-required");
  if (policy.requireCredentialReference && !input.credentialRef?.trim()) reasons.push("credential-reference-required");
  if (policy.requireConsentReference && !input.consentRef?.trim()) reasons.push("consent-reference-required");
  if (policy.requireRollbackPlan && !input.rollbackPlanRef?.trim()) reasons.push("rollback-plan-required");
  if (policy.requireIncidentPlan && !input.incidentPlanRef?.trim()) reasons.push("incident-plan-required");
  for (const required of policy.requiredEvidenceRefs) if (!evidenceRefs.includes(required)) reasons.push(`missing-evidence:${required}`);
  if (externalActions.has(input.actionType) && !policy.liveExternalActionAuthorized) reasons.push("live-external-action-not-authorized");
  if (input.actionType === "PAYMENT_CAPTURE" && !policy.paymentCaptureAuthorized) reasons.push("payment-capture-not-authorized");
  if (input.actionType === "BORROWER_NOTICE_SEND" && !policy.noticeSendAuthorized) reasons.push("notice-send-not-authorized");
  if (input.actionType === "REGULATORY_FILING" && !policy.regulatoryFilingAuthorized) reasons.push("regulatory-filing-not-authorized");
  if (input.actionType === "LEGAL_COMMITMENT" && !policy.legalCommitmentAuthorized) reasons.push("legal-commitment-not-authorized");

  const reviewReasons = new Set([
    "human-approval-required", "production-readiness-required", "credential-reference-required",
    "consent-reference-required", "rollback-plan-required", "incident-plan-required",
  ]);
  const hardBlock = reasons.some((reason) => !reviewReasons.has(reason));
  const decision: InstitutionalActionDecision = hardBlock ? "BLOCK" : reasons.length ? "REVIEW_REQUIRED" : "ALLOW";
  return Object.freeze({
    schemaVersion: INSTITUTIONAL_ACTION_SCHEMA_VERSION,
    reliancePolicyId: input.reliance.reliancePolicyId,
    claimId: input.reliance.claimId,
    actionPolicyId: policy.policyId,
    actionType: input.actionType,
    decision,
    reasons: Object.freeze([...new Set(reasons)].sort()),
    evaluatedAt: input.evaluatedAt,
    approvalRefs,
    evidenceRefs,
    auditRefs: list(input.auditRefs, "auditRefs"),
    replayRef: nonEmpty(input.replayRef, "replayRef"),
  });
}

export const institutionalActionAuthority = Object.freeze({
  createPolicy: createInstitutionalActionPolicy,
  evaluate: evaluateInstitutionalAction,
});
