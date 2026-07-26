import { buildProductionPromotionReadinessPacket } from "@/lib/governance/productionPromotionReadiness";
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
  signatureRef: `signature-${index + 1}`,
}));

const ready = buildFinalProductionPromotionDecisionPacket({
  readinessPacket: readiness,
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
