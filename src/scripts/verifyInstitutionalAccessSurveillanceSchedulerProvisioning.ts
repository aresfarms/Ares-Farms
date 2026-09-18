import assert from "node:assert/strict";
import { composeInstitutionalSurveillanceActivationPacket } from "@/lib/governance/institutionalAccessSurveillanceActivationCeremony";
import { composeInstitutionalSurveillanceCanaryTranscript, composeInstitutionalSurveillanceSchedulerReleasePacket } from "@/lib/governance/institutionalAccessSurveillanceCanaryRelease";
import { attestPausedSchedulerCreation, composeInstitutionalSurveillanceSchedulerManifest, INSTITUTIONAL_SURVEILLANCE_SCHEDULER_PROVISIONING_RULE } from "@/lib/governance/institutionalAccessSurveillanceSchedulerProvisioning";

const activation = composeInstitutionalSurveillanceActivationPacket({
  schedulerName: "furlong-institutional-access-surveillance",
  schedulerIdentity: "institutional-surveillance@furlong-staging-499102.iam.gserviceaccount.com",
  cadenceMinutes: 15,
  route: "/api/internal/institutional-access-surveillance",
  authenticationMode: "DEDICATED_SECRET",
  authenticationConfigured: true,
  canaryRunId: "canary-4o-001",
  canaryPassed: true,
  canaryEvaluatedGrantCount: 0,
  rollbackAction: "Pause the scheduler and revoke the route credential reference.",
  alertOwner: "Module 45 governance operations",
  legalOrGovernanceApproverId: "governance-approver",
  securityOrOperationsApproverId: "security-approver",
  evidenceRecomputationRemainsPaused: true,
  requestedAt: "2026-07-26T00:00:00.000Z",
});
const canary = composeInstitutionalSurveillanceCanaryTranscript({ plans: [], executedAt: "2026-07-26T00:00:00.000Z", canaryRunId: "canary-4o-001" });
const release = composeInstitutionalSurveillanceSchedulerReleasePacket({
  activationPacket: activation,
  canary,
  routeAuthenticationReady: true,
  legalOrGovernanceApproverId: "governance-approver",
  securityOrOperationsApproverId: "security-approver",
  releaseReason: "Create a paused scheduler for post-create inspection only.",
  createdAt: "2026-07-26T00:00:00.000Z",
});
const base = {
  releasePacket: release,
  projectId: "furlong-staging-499102",
  region: "us-central1",
  schedulerName: "furlong-institutional-access-surveillance",
  schedule: "*/15 * * * *",
  timeZone: "America/New_York",
  targetUri: "https://furlong-core-mwei3cj3jq-uc.a.run.app/api/internal/institutional-access-surveillance",
  authenticationMode: "DEDICATED_SECRET" as const,
  authenticationReference: "projects/furlong-staging-499102/secrets/institutional-access-surveillance-cron/versions/latest",
  schedulerIdentity: "institutional-surveillance@furlong-staging-499102.iam.gserviceaccount.com",
  attemptDeadlineSeconds: 120,
  retryCount: 1,
  minBackoffSeconds: 15,
  maxBackoffSeconds: 60,
  requestedInitialState: "PAUSED" as const,
};
const manifest = composeInstitutionalSurveillanceSchedulerManifest(base);
assert.equal(manifest.status, "READY_FOR_PAUSED_CREATION");
assert.equal(manifest.schedulerCreationPermitted, true);
assert.equal(manifest.schedulerEnablementPermitted, false);
assert.equal(manifest.secretValueIncluded, false);
const enabled = composeInstitutionalSurveillanceSchedulerManifest({ ...base, requestedInitialState: "ENABLED" });
assert.equal(enabled.status, "BLOCKED");
assert.ok(enabled.blockers.includes("INITIAL_STATE_MUST_BE_PAUSED"));
const wrongRoute = composeInstitutionalSurveillanceSchedulerManifest({ ...base, targetUri: "https://example.invalid/run" });
assert.ok(wrongRoute.blockers.includes("CANONICAL_TARGET_URI_REQUIRED"));
const attestation = attestPausedSchedulerCreation({
  manifest,
  observedJobName: manifest.schedulerName,
  observedState: "PAUSED",
  observedTargetUri: manifest.targetUri,
  observedSchedule: manifest.schedule,
  executionCount: 0,
  attestedAt: "2026-07-26T00:01:00.000Z",
});
assert.equal(attestation.status, "PASS");
const premature = attestPausedSchedulerCreation({ ...attestation, manifest, observedState: "ENABLED", executionCount: 1, attestationId: undefined });
assert.equal(premature.status, "FAIL");
assert.ok(premature.blockers.includes("JOB_NOT_PAUSED"));
assert.ok(premature.blockers.includes("PREMATURE_EXECUTION_DETECTED"));
console.log(JSON.stringify({
  ok: true,
  rule: INSTITUTIONAL_SURVEILLANCE_SCHEDULER_PROVISIONING_RULE,
  deterministicManifest: true,
  initialStateRequired: "PAUSED",
  schedulerEnablementPermitted: false,
  plaintextCredentialStored: false,
  postCreateZeroExecutionRequired: true,
  manifestSha256: manifest.manifestSha256,
}, null, 2));
