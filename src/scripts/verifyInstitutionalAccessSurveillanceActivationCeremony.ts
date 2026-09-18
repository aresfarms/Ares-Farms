import assert from "node:assert/strict";
import {
  composeInstitutionalSurveillanceActivationPacket,
  INSTITUTIONAL_SURVEILLANCE_ACTIVATION_CEREMONY_RULE,
} from "@/lib/governance/institutionalAccessSurveillanceActivationCeremony";

const base = {
  schedulerName: "furlong-institutional-access-surveillance",
  schedulerIdentity: "institutional-surveillance@furlong-staging-499102.iam.gserviceaccount.com",
  cadenceMinutes: 15,
  route: "/api/internal/institutional-access-surveillance",
  authenticationMode: "DEDICATED_SECRET" as const,
  authenticationConfigured: true,
  canaryRunId: "canary-synthetic-001",
  canaryPassed: true,
  canaryEvaluatedGrantCount: 0,
  rollbackAction: "Pause scheduler and revoke its route credential.",
  alertOwner: "Module 45 governance operations",
  legalOrGovernanceApproverId: "governance-approver",
  securityOrOperationsApproverId: "security-approver",
  evidenceRecomputationRemainsPaused: true,
  requestedAt: "2026-07-26T00:00:00.000Z",
};

const ready = composeInstitutionalSurveillanceActivationPacket(base);
assert.equal(ready.activationPermitted, true);
assert.equal(ready.status, "READY_FOR_ACTIVATION");
assert.equal(ready.schedulerCreationPerformed, false);
assert.equal(ready.schedulerEnablementPerformed, false);
assert.match(ready.packetSha256, /^[a-f0-9]{64}$/);

const noAuth = composeInstitutionalSurveillanceActivationPacket({ ...base, authenticationConfigured: false });
assert.equal(noAuth.activationPermitted, false);
assert.ok(noAuth.blockers.includes("ROUTE_AUTHENTICATION_NOT_CONFIGURED"));

const sameApprover = composeInstitutionalSurveillanceActivationPacket({ ...base, securityOrOperationsApproverId: "governance-approver" });
assert.equal(sameApprover.activationPermitted, false);
assert.ok(sameApprover.blockers.includes("DUAL_CONTROL_REQUIRED"));

const noCanary = composeInstitutionalSurveillanceActivationPacket({ ...base, canaryRunId: null, canaryPassed: false });
assert.equal(noCanary.activationPermitted, false);
assert.ok(noCanary.blockers.includes("CLEAN_CANARY_REQUIRED"));

const boundary = composeInstitutionalSurveillanceActivationPacket({ ...base, evidenceRecomputationRemainsPaused: false });
assert.equal(boundary.activationPermitted, false);
assert.ok(boundary.blockers.includes("UNRELATED_SCHEDULER_BOUNDARY_VIOLATION"));

console.log(JSON.stringify({
  ok: true,
  rule: INSTITUTIONAL_SURVEILLANCE_ACTIVATION_CEREMONY_RULE,
  dualControl: true,
  cleanCanaryRequired: true,
  authenticationRequired: true,
  schedulerMutationPerformed: false,
  packetSha256: ready.packetSha256,
}, null, 2));
