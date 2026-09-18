import { evaluateInstitutionalAction } from "@/lib/platform/institutionalActionAuthority";
import type { InstitutionalActionPolicy } from "@/lib/platform/institutionalActionAuthority";
import type { InstitutionalRelianceEvaluation } from "@/lib/platform/institutionalRelianceAuthority";

function assert(condition: boolean, message: string): asserts condition { if (!condition) throw new Error(message); }
const at = "2026-07-22T06:00:00.000Z";
const reliance: InstitutionalRelianceEvaluation = Object.freeze({
  schemaVersion: "institutional-reliance-v1", publicationPolicyId: "publication:internal",
  reliancePolicyId: "reliance:internal", claimId: "claim:property:verification",
  purpose: "INTERNAL_WORKFLOW", requestedRelianceLevel: "INTERNAL_OPERATIONAL", decision: "ALLOW",
  reasons: Object.freeze([]), evaluatedAt: at, authorityRefs: Object.freeze(["authority:operator"]),
  evidenceRefs: Object.freeze(["evidence:verified"]), auditRefs: Object.freeze(["audit:reliance"]), replayRef: "replay:reliance",
});
const internalPolicy: InstitutionalActionPolicy = {
  policyId: "action:internal", governanceVersion: "master-volume-series-2026-07",
  allowedActionTypes: ["INTERNAL_RECORD_UPDATE", "WORKFLOW_TRANSITION"], requireRelianceApproval: true,
  requireHumanApproval: false, requireProductionReadiness: false, requireCredentialReference: false,
  requireConsentReference: false, requireRollbackPlan: false, requireIncidentPlan: false,
  liveExternalActionAuthorized: false, paymentCaptureAuthorized: false, noticeSendAuthorized: false,
  regulatoryFilingAuthorized: false, legalCommitmentAuthorized: false, requiredEvidenceRefs: ["evidence:verified"],
  auditRefs: ["audit:action-policy"], replayRef: "replay:action-policy", versionRefs: ["version:action-policy"],
};
const allowed = evaluateInstitutionalAction({ reliance, policy: internalPolicy, actionType: "WORKFLOW_TRANSITION",
  evidenceRefs: ["evidence:verified"], evaluatedAt: at, auditRefs: ["audit:action"], replayRef: "replay:action" });
assert(allowed.decision === "ALLOW", "Governed internal workflow transition should be allowed.");
const reviewPolicy: InstitutionalActionPolicy = { ...internalPolicy, policyId: "action:review", requireHumanApproval: true };
const review = evaluateInstitutionalAction({ reliance, policy: reviewPolicy, actionType: "WORKFLOW_TRANSITION",
  evidenceRefs: ["evidence:verified"], evaluatedAt: at, auditRefs: ["audit:action-review"], replayRef: "replay:action-review" });
assert(review.decision === "REVIEW_REQUIRED", "Missing human approval should require review.");
const blocked = evaluateInstitutionalAction({ reliance, policy: internalPolicy, actionType: "PAYMENT_CAPTURE",
  evidenceRefs: ["evidence:verified"], evaluatedAt: at, auditRefs: ["audit:action-block"], replayRef: "replay:action-block" });
assert(blocked.decision === "BLOCK", "Payment capture must fail closed without explicit authority.");
console.log(JSON.stringify({ ok: true, schemaVersion: allowed.schemaVersion, allowed: allowed.decision,
  review: review.decision, blocked: blocked.decision, message: "Institutional action authority conformance passed." }, null, 2));
