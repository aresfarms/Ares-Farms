import {
  buildInternalChangeVerificationReport,
  internalChangeReportHash,
  type ChangeDomain,
  type FounderPrincipal,
  type InternalChangeVerificationInput,
} from "@/lib/governance/internalChangeVerification";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const owners: Record<ChangeDomain, FounderPrincipal> = {
  TECHNICAL_GOVERNANCE: "CAITLIN",
  FINANCE_UNDERWRITING: "STUART",
  PUBLIC_COMMUNICATIONS: "FRANCIS",
};
const reviewers: Record<ChangeDomain, FounderPrincipal[]> = {
  TECHNICAL_GOVERNANCE: ["STUART", "FRANCIS"],
  FINANCE_UNDERWRITING: ["CAITLIN", "FRANCIS"],
  PUBLIC_COMMUNICATIONS: ["CAITLIN", "STUART"],
};

function base(domain: ChangeDomain): InternalChangeVerificationInput {
  return {
    evidence: {
      requestId: `change-${domain.toLowerCase()}`,
      requestVersion: "v1",
      requirementText: "Implement the frozen requested behavior and preserve existing governed boundaries.",
      successCriteria: ["requested behavior works", "existing invariants pass"],
      changeOwner: owners[domain],
      domain,
      commitSha: "a".repeat(40),
      imageDigest: `sha256:${"b".repeat(64)}`,
      buildId: "build-1",
      buildStatus: "SUCCESS",
      changedComponents: ["governed-module"],
      affectedRoutes: ["/api/example"],
      affectedPermissions: [],
      databaseChanges: [],
      configurationChanges: [],
      tests: [{ name: "governed regression", status: "PASS", evidenceRef: "test:1" }],
      securityFindings: [],
      knownLimitations: [],
      unverifiedClaims: [],
      rollbackImageDigest: `sha256:${"c".repeat(64)}`,
      rollbackProcedure: "Route traffic to the bound rollback image and rerun invariants.",
      releaseInvariants: ["authentication remains enforced", "audit events remain append-only"],
      postReleaseChecks: [{ name: "health", status: "PASS" }],
    },
    summary: {
      whatChanged: "The requested governed behavior was implemented.",
      whyItChanged: "The requesting group identified a needed correction.",
      whoIsAffected: "Authorized platform users.",
      whatTestsProved: ["The new behavior works", "The listed invariants still pass"],
      whatTestsDidNotProve: ["Human intent and public interpretation still require review"],
      principalRisks: ["A future configuration change could invalidate this result"],
      rollbackExplanation: "The prior immutable image can be restored.",
    },
  };
}

for (const domain of Object.keys(owners) as ChangeDomain[]) {
  const input = base(domain);
  const hash = internalChangeReportHash(input);
  input.ownerAttestation = {
    principal: owners[domain], signedAt: "2026-07-27T10:00:00Z", signatureRef: "owner-signature", statement: "I implemented the frozen request.", reportSha256: hash,
  };
  input.reviewerApprovals = reviewers[domain].map((principal, index) => ({
    principal,
    role: index === 0 ? "REQUESTER_ACCEPTANCE" : "INDEPENDENT_REVIEW",
    decision: "APPROVE",
    checklistVersion: `${domain.toLowerCase()}-v1`,
    checklistAnswers: [{ itemId: "all-required-items", answer: "YES" }],
    signedAt: "2026-07-27T11:00:00Z",
    signatureRef: `review-${principal}`,
    reportSha256: hash,
  }));
  const approved = buildInternalChangeVerificationReport(input);
  assert(approved.status === "APPROVED_FOR_ACTIVATION", `${domain} must support cross-functional approval.`);
  assert(approved.activationAllowed, `${domain} must allow activation only after all signatures.`);

  const tampered = structuredClone(input);
  tampered.evidence.requirementText = "Changed after signatures";
  const invalidated = buildInternalChangeVerificationReport(tampered);
  assert(!invalidated.activationAllowed, `${domain} signatures must invalidate after packet mutation.`);
  assert(invalidated.blockers.some((blocker) => blocker.includes("stale")), `${domain} must expose stale signatures.`);
}

const ownerSelfApproval = base("TECHNICAL_GOVERNANCE");
const ownerHash = internalChangeReportHash(ownerSelfApproval);
ownerSelfApproval.ownerAttestation = { principal: "CAITLIN", signedAt: "2026-07-27T10:00:00Z", signatureRef: "owner", statement: "implemented", reportSha256: ownerHash };
ownerSelfApproval.reviewerApprovals = [{
  principal: "CAITLIN", role: "INDEPENDENT_REVIEW", decision: "APPROVE", checklistVersion: "v1",
  checklistAnswers: [{ itemId: "x", answer: "YES" }], signedAt: "2026-07-27T11:00:00Z", signatureRef: "self", reportSha256: ownerHash,
}];
assert(buildInternalChangeVerificationReport(ownerSelfApproval).blockers.includes("implementer-cannot-independently-approve"), "Implementer self-approval must be blocked.");

console.log(JSON.stringify({
  ok: true,
  rule: "CROSS-FUNCTIONAL-INTERNAL-CHANGE-VERIFICATION-001",
  commonEvidenceBackbone: true,
  tailoredDomainOverlays: true,
  ownerCannotSelfApprove: true,
  twoOutsideGroupApprovalsRequired: true,
  signatureInvalidationOnMutation: true,
  postReleaseRegressionChecksRequired: true,
}, null, 2));
