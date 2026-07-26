import { buildProductionPromotionReadinessPacket } from "@/lib/governance/productionPromotionReadiness";
import { buildInternalChangeVerificationReport, internalChangeReportHash, type InternalChangeVerificationInput } from "@/lib/governance/internalChangeVerification";
import {
  FINAL_PRODUCTION_PROMOTION_DECISION_RULE,
  buildFinalProductionPromotionDecisionPacket,
  type PromotionApprovalRole,
} from "@/lib/governance/finalProductionPromotionDecisionPacket";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const readiness = buildProductionPromotionReadinessPacket({
  serviceUrl: "https://furlong-core.example.run.app",
  stableUrl: "https://stable---furlong-core.example.run.app",
  apiAuthEnforcement: "required",
  rateLimitingEnabled: "true",
  rateLimitWindowSeconds: "60",
  rateLimitMax: "100",
  credentialsMode: "email-allowlist",
  credentialAllowlistConfigured: true,
  roleProvisioningMode: "governed-admin-only",
  secretBindings: [
    { envName: "DATABASE_URL", secretName: "DATABASE_URL", version: "latest" },
    { envName: "NEXTAUTH_SECRET", secretName: "NEXTAUTH_SECRET", version: "latest" },
    { envName: "AUTH_CREDENTIAL_SHARED_SECRET", secretName: "AUTH_CREDENTIAL_SHARED_SECRET", version: "latest" },
  ],
  requiredSecretNames: ["DATABASE_URL", "NEXTAUTH_SECRET", "AUTH_CREDENTIAL_SHARED_SECRET"],
  iapProtected: true,
  releaseBoardApproved: false,
  constitutionalAuthorityApproved: false,
  qualifiedReleaseManagerApproved: false,
  finalActivationApproved: false,
});


const internalInput: InternalChangeVerificationInput = {
  evidence: {
    requestId: "launch-change", requestVersion: "v1", requirementText: "Prepare the governed release.", successCriteria: ["all gates pass"],
    changeOwner: "CAITLIN", domain: "TECHNICAL_GOVERNANCE", commitSha: "d".repeat(40), imageDigest: `sha256:${"e".repeat(64)}`,
    buildId: "build-launch", buildStatus: "SUCCESS", changedComponents: ["release"], affectedRoutes: [], affectedPermissions: [], databaseChanges: [], configurationChanges: [],
    tests: [{ name: "release", status: "PASS", evidenceRef: "test:release" }], securityFindings: [], knownLimitations: [], unverifiedClaims: [],
    rollbackImageDigest: `sha256:${"f".repeat(64)}`, rollbackProcedure: "Restore prior image.", releaseInvariants: ["auth remains enforced"], postReleaseChecks: [{ name: "health", status: "PASS" }],
  },
  summary: { whatChanged: "The governed release candidate was prepared.", whyItChanged: "Production readiness.", whoIsAffected: "Authorized users.", whatTestsProved: ["Gates pass"], whatTestsDidNotProve: ["Human approval is still required"], principalRisks: ["Configuration drift"], rollbackExplanation: "Restore prior image." },
};
const internalHash = internalChangeReportHash(internalInput);
internalInput.ownerAttestation = { principal: "CAITLIN", signedAt: "2026-07-27T10:00:00Z", signatureRef: "owner", statement: "implemented", reportSha256: internalHash };
internalInput.reviewerApprovals = ["STUART", "FRANCIS"].map((principal, index) => ({ principal: principal as "STUART" | "FRANCIS", role: index === 0 ? "REQUESTER_ACCEPTANCE" as const : "INDEPENDENT_REVIEW" as const, decision: "APPROVE" as const, checklistVersion: "technical-v1", checklistAnswers: [{ itemId: "all", answer: "YES" as const }], signedAt: "2026-07-27T11:00:00Z", signatureRef: `review-${principal}`, reportSha256: internalHash }));
const internalReport = buildInternalChangeVerificationReport(internalInput);

const roles: PromotionApprovalRole[] = [
  "RELEASE_BOARD",
  "CONSTITUTIONAL_AUTHORITY",
  "QUALIFIED_RELEASE_MANAGER",
  "FINAL_ACTIVATION_AUTHORITY",
];
const approvals = roles.map((role, index) => ({
  approvalId: `approval-${index + 1}`,
  principalId: `principal-${index + 1}`,
  role,
  decision: "APPROVE" as const,
  signedAt: "2026-07-27T12:00:00Z",
  readinessPacketSha256: readiness.packetSha256,
  internalChangeVerificationReportSha256: internalReport.reportSha256,
  signatureRef: `signature-${index + 1}`,
}));

const ready = buildFinalProductionPromotionDecisionPacket({
  readinessPacket: readiness,
  internalChangeVerificationReport: internalReport,
  liveImageDigest: `sha256:${"a".repeat(64)}`,
  credentialAllowlistEmails: ["Release@example.com", "security@example.com"],
  activationWindowStart: "2026-07-27T13:00:00Z",
  activationWindowEnd: "2026-07-27T14:00:00Z",
  rollbackOwnerPrincipalId: "rollback-owner",
  approvals,
});
assert(ready.status === "READY_FOR_ACTIVATION_CEREMONY", "Complete packet must reach ceremony readiness.");
assert(!ready.finalPromotionAuthorized && !ready.liveActionAuthorityGranted, "Decision packet must never activate production.");
assert(!JSON.stringify(ready).includes("Release@example.com"), "Plaintext allowlist must not survive packet construction.");

const missingApprovals = buildFinalProductionPromotionDecisionPacket({
  readinessPacket: readiness,
  internalChangeVerificationReport: internalReport,
  liveImageDigest: `sha256:${"a".repeat(64)}`,
  credentialAllowlistEmails: ["release@example.com"],
  activationWindowStart: "2026-07-27T13:00:00Z",
  activationWindowEnd: "2026-07-27T14:00:00Z",
  rollbackOwnerPrincipalId: "rollback-owner",
  approvals: [],
});
assert(missingApprovals.status === "BLOCKED", "Missing human approvals must block.");

const collided = buildFinalProductionPromotionDecisionPacket({
  readinessPacket: readiness,
  internalChangeVerificationReport: internalReport,
  liveImageDigest: `sha256:${"a".repeat(64)}`,
  credentialAllowlistEmails: ["release@example.com"],
  activationWindowStart: "2026-07-27T13:00:00Z",
  activationWindowEnd: "2026-07-27T14:00:00Z",
  rollbackOwnerPrincipalId: "rollback-owner",
  approvals: approvals.map((approval) => ({ ...approval, principalId: "same-principal" })),
});
assert(collided.blockers.includes("approval-principals-must-be-distinct"), "Dual-control collision must block.");

console.log(JSON.stringify({
  ok: true,
  rule: FINAL_PRODUCTION_PROMOTION_DECISION_RULE,
  allowlistStoredAsHashOnly: true,
  exactImageBindingRequired: true,
  fourDistinctHumanAuthoritiesRequired: true,
  boundedActivationWindowRequired: true,
  activationPerformed: false,
}, null, 2));
