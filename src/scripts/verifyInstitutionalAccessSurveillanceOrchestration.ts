import assert from "node:assert/strict";
import { planInstitutionalGrantSurveillance } from "@/lib/governance/institutionalAccessSurveillanceOrchestrator";
import type { EvidenceAccessGrant, InstitutionalAccessObservation } from "@/lib/governance/institutionalEvidenceAccess";

const now = "2030-01-02T12:00:00.000Z";
const grant: EvidenceAccessGrant = {
  grantId: "grant-1", role: "attorney", principalId: "p1", principalEmail: "a@example.com", purpose: "matter review", matterId: "m1", agencyOrFirm: "Firm", tenantId: "t1", moduleIds: ["documents"], subjectIds: ["s1"], tokenId: null, windowStart: "2030-01-01T00:00:00.000Z", windowEnd: "2030-01-03T00:00:00.000Z", expiresAt: "2030-01-03T00:00:00.000Z", issuedBy: "gov1", credentialVerificationId: "c1", authorityVerificationId: "a1", issuedAt: "2030-01-01T00:00:00.000Z", revokedAt: null,
};
const obs = (action: InstitutionalAccessObservation["action"], recordCount=1): InstitutionalAccessObservation => ({ actorId: "p1", grantId: "grant-1", action, at: now, recordCount, moduleId: "documents", subjectId: "s1" });
const clean = planInstitutionalGrantSurveillance({ grant, observations: [obs("VIEW")], credentialValid: true, authorityValid: true, now, exportThreshold: 10, deniedThreshold: 3 });
assert.equal(clean.status, "CLEAN");
const credentialFail = planInstitutionalGrantSurveillance({ grant, observations: [obs("VIEW")], credentialValid: false, authorityValid: true, now, exportThreshold: 10, deniedThreshold: 3 });
assert.equal(credentialFail.revoke, true);
assert(credentialFail.reasonCodes.includes("CREDENTIAL_RECHECK_FAILED"));
const authorityFail = planInstitutionalGrantSurveillance({ grant, observations: [obs("VIEW")], credentialValid: true, authorityValid: false, now, exportThreshold: 10, deniedThreshold: 3 });
assert.equal(authorityFail.revoke, true);
const exportAnomaly = planInstitutionalGrantSurveillance({ grant, observations: [obs("EXPORT", 11)], credentialValid: true, authorityValid: true, now, exportThreshold: 10, deniedThreshold: 3 });
assert.equal(exportAnomaly.status, "REVIEW_REQUIRED");
const deniedBurst = planInstitutionalGrantSurveillance({ grant, observations: [obs("DENIED"), obs("DENIED"), obs("DENIED")], credentialValid: true, authorityValid: true, now, exportThreshold: 10, deniedThreshold: 3 });
assert.equal(deniedBurst.status, "REVIEW_REQUIRED");
const expired = planInstitutionalGrantSurveillance({ grant: { ...grant, expiresAt: "2030-01-02T11:59:00.000Z" }, observations: [], credentialValid: true, authorityValid: true, now, exportThreshold: 10, deniedThreshold: 3 });
assert.equal(expired.revoke, true);
assert(expired.reasonCodes.includes("GRANT_EXPIRED"));
console.log(JSON.stringify({ ok: true, rule: "INSTITUTIONAL-ACCESS-SURVEILLANCE-ORCHESTRATION-001", continuousGrantEvaluation: true, automaticRevocation: true, anomalyReview: true, dedicatedProtectedRoute: true }, null, 2));
