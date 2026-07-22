import {
  createInstitutionalReliancePolicy,
  evaluateInstitutionalReliance,
  INSTITUTIONAL_RELIANCE_SCHEMA_VERSION,
} from "@/lib/platform/institutionalRelianceAuthority";
import type { InstitutionalPublicationEvaluation } from "@/lib/platform/institutionalPublicationAuthority";

function assert(condition: boolean, message: string): asserts condition { if (!condition) throw new Error(message); }
function expectFailure(operation: () => unknown, expected: string): void {
  try { operation(); } catch (error) {
    assert(error instanceof Error && error.message.includes(expected), `Expected failure containing: ${expected}`);
    return;
  }
  throw new Error(`Expected operation to fail: ${expected}`);
}

const at = "2026-07-22T05:55:00.000Z";
const publication: InstitutionalPublicationEvaluation = Object.freeze({
  schemaVersion: "institutional-publication-v1",
  claimId: "claim:property:verification",
  policyId: "publication:internal:verification",
  surface: "INTERNAL",
  requestedRelianceLevel: "INTERNAL_OPERATIONAL",
  decision: "ALLOW",
  reasons: Object.freeze([]),
  requiredDisclosures: Object.freeze(["not-an-official-decision"]),
  evaluatedAt: at,
  auditRefs: Object.freeze(["audit:publication:verification"]),
  replayRef: "replay:publication:verification",
});

const policy = createInstitutionalReliancePolicy({
  policyId: "reliance:internal-workflow:verification",
  governanceVersion: "master-volume-series-2026-07",
  allowedPurposes: ["INFORMATIONAL", "INTERNAL_WORKFLOW"],
  maximumRelianceLevel: "INTERNAL_OPERATIONAL",
  requiredAuthorityTypes: ["GOVERNANCE_OPERATOR"],
  requireHumanAuthority: true,
  requireLegalComplianceReview: false,
  regulatoryRelianceAuthorized: false,
  legalRelianceAuthorized: false,
  officialDecisionAuthorized: false,
  requiredEvidenceRefs: ["evidence:claim:verification"],
  auditRefs: ["audit:reliance-policy:verification"],
  replayRef: "replay:reliance-policy:verification",
  versionRefs: ["version:reliance-policy:verification"],
});

const allowed = evaluateInstitutionalReliance({
  publication, policy, purpose: "INTERNAL_WORKFLOW", requestedRelianceLevel: "INTERNAL_OPERATIONAL",
  authorityTypes: ["GOVERNANCE_OPERATOR"], authorityRefs: ["authority:caitlin:verification"],
  evidenceRefs: ["evidence:claim:verification"], evaluatedAt: at,
  auditRefs: ["audit:reliance:verification"], replayRef: "replay:reliance:verification",
});
assert(allowed.schemaVersion === INSTITUTIONAL_RELIANCE_SCHEMA_VERSION, "Schema version drifted.");
assert(allowed.decision === "ALLOW", "Authorized internal reliance should be allowed.");

const review = evaluateInstitutionalReliance({
  publication, policy, purpose: "INTERNAL_WORKFLOW", requestedRelianceLevel: "INTERNAL_OPERATIONAL",
  authorityTypes: ["GOVERNANCE_OPERATOR"], evidenceRefs: ["evidence:claim:verification"], evaluatedAt: at,
  auditRefs: ["audit:reliance:review"], replayRef: "replay:reliance:review",
});
assert(review.decision === "REVIEW_REQUIRED", "Missing human authority should require review.");

const blocked = evaluateInstitutionalReliance({
  publication, policy, purpose: "OFFICIAL_DECISION", requestedRelianceLevel: "OFFICIAL",
  authorityTypes: ["GOVERNANCE_OPERATOR"], authorityRefs: ["authority:caitlin:verification"],
  evidenceRefs: ["evidence:claim:verification"], evaluatedAt: at,
  auditRefs: ["audit:reliance:blocked"], replayRef: "replay:reliance:blocked",
});
assert(blocked.decision === "BLOCK", "Official decision reliance must fail closed.");
expectFailure(() => createInstitutionalReliancePolicy({ ...policy, allowedPurposes: ["LEGAL_DETERMINATION"] }), "legal reliance authority");
console.log(JSON.stringify({ ok: true, schemaVersion: INSTITUTIONAL_RELIANCE_SCHEMA_VERSION, allowed: allowed.decision, review: review.decision, blocked: blocked.decision, message: "Institutional reliance authority conformance passed." }, null, 2));
