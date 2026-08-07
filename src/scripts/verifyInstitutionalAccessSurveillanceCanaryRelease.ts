import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { composeInstitutionalSurveillanceActivationPacket } from "@/lib/governance/institutionalAccessSurveillanceActivationCeremony";
import {
  composeInstitutionalSurveillanceCanaryTranscript,
  composeInstitutionalSurveillanceSchedulerReleasePacket,
  INSTITUTIONAL_SURVEILLANCE_CANARY_RELEASE_RULE,
} from "@/lib/governance/institutionalAccessSurveillanceCanaryRelease";
import type { SurveillancePlan } from "@/lib/governance/institutionalAccessSurveillanceOrchestrator";

const snap = (label: string) => createHash("sha256").update(label).digest("hex");
const plans: SurveillancePlan[] = [
  { grantId: "grant-clean", status: "CLEAN", reasonCodes: [], observationCount: 1, revoke: false, snapshotSha256: snap("clean") },
  { grantId: "grant-review", status: "REVIEW_REQUIRED", reasonCodes: ["EXPORT_VOLUME_ANOMALY"], observationCount: 3, revoke: false, snapshotSha256: snap("review") },
  { grantId: "grant-revoke", status: "ACCESS_REVOKED", reasonCodes: ["CREDENTIAL_RECHECK_FAILED"], observationCount: 1, revoke: true, snapshotSha256: snap("revoke") },
];
const canary = composeInstitutionalSurveillanceCanaryTranscript({
  plans,
  executedAt: "2026-07-26T14:00:00.000Z",
  canaryRunId: "institutional-surveillance-canary-001",
});
assert.equal(canary.status, "PASSED");
assert.equal(canary.mutationCount, 0);
assert.equal(canary.grantsEvaluated, 3);
assert.equal(canary.wouldRevoke, 1);

const activation = composeInstitutionalSurveillanceActivationPacket({
  schedulerName: "furlong-institutional-access-surveillance",
  schedulerIdentity: "institutional-surveillance@furlong-staging-499102.iam.gserviceaccount.com",
  cadenceMinutes: 15,
  route: "/api/internal/institutional-access-surveillance",
  authenticationMode: "DEDICATED_SECRET",
  authenticationConfigured: true,
  canaryRunId: canary.canaryRunId,
  canaryPassed: true,
  canaryEvaluatedGrantCount: canary.grantsEvaluated,
  rollbackAction: "Pause scheduler and revoke route authentication.",
  alertOwner: "Module 45 governance operations",
  legalOrGovernanceApproverId: "governance-approver",
  securityOrOperationsApproverId: "security-approver",
  evidenceRecomputationRemainsPaused: true,
  requestedAt: "2026-07-26T14:01:00.000Z",
});
const ready = composeInstitutionalSurveillanceSchedulerReleasePacket({
  activationPacket: activation,
  canary,
  routeAuthenticationReady: true,
  legalOrGovernanceApproverId: "governance-approver",
  securityOrOperationsApproverId: "security-approver",
  releaseReason: "Synthetic dry-run canary passed without mutations.",
  createdAt: "2026-07-26T14:02:00.000Z",
});
assert.equal(ready.status, "READY_FOR_SCHEDULER_CREATION");
assert.equal(ready.schedulerCreationPermitted, true);
assert.equal(ready.schedulerEnablementPermitted, false);
assert.equal(ready.schedulerCreationPerformed, false);
assert.equal(ready.schedulerEnablementPerformed, false);
assert.match(ready.packetSha256, /^[a-f0-9]{64}$/);

const failedCanary = composeInstitutionalSurveillanceCanaryTranscript({
  plans,
  executedAt: "2026-07-26T14:00:00.000Z",
  duplicateRevocationAttempts: 1,
  canaryRunId: "institutional-surveillance-canary-failed",
});
assert.equal(failedCanary.status, "FAILED");
const blocked = composeInstitutionalSurveillanceSchedulerReleasePacket({
  activationPacket: activation,
  canary: failedCanary,
  routeAuthenticationReady: true,
  legalOrGovernanceApproverId: "same",
  securityOrOperationsApproverId: "same",
  releaseReason: "blocked",
  createdAt: "2026-07-26T14:02:00.000Z",
});
assert.equal(blocked.status, "BLOCKED");
assert.ok(blocked.blockers.includes("CLEAN_NON_MUTATING_CANARY_REQUIRED"));
assert.ok(blocked.blockers.includes("DUAL_CONTROL_REQUIRED"));
assert.ok(blocked.blockers.includes("CANARY_ACTIVATION_PACKET_MISMATCH"));

console.log(JSON.stringify({
  ok: true,
  rule: INSTITUTIONAL_SURVEILLANCE_CANARY_RELEASE_RULE,
  dryRunOnly: true,
  mutationCount: canary.mutationCount,
  deterministicSnapshot: canary.planSnapshotSha256,
  schedulerCreationPermitted: ready.schedulerCreationPermitted,
  schedulerEnablementPermitted: ready.schedulerEnablementPermitted,
  schedulerMutationPerformed: false,
  packetSha256: ready.packetSha256,
}, null, 2));
