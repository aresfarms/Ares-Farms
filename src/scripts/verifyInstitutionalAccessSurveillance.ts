import assert from "node:assert/strict";
import { closeInstitutionalAccessReview, evaluateInstitutionalAccessSurveillance } from "@/lib/governance/institutionalAccessSurveillance";

const clean = evaluateInstitutionalAccessSurveillance({ observations: [{ actorId: "a", grantId: "g", action: "VIEW", at: "2026-01-01T00:00:00Z", recordCount: 1, moduleId: "documents", subjectId: "s", credentialValid: true, authorityValid: true }], exportThreshold: 10, deniedThreshold: 3 });
assert.equal(clean.status, "CLEAN");
const revoke = evaluateInstitutionalAccessSurveillance({ observations: [{ actorId: "a", grantId: "g", action: "VIEW", at: "2026-01-01T00:00:00Z", recordCount: 1, moduleId: "documents", subjectId: "s", credentialValid: false, authorityValid: true }], exportThreshold: 10, deniedThreshold: 3 });
assert.equal(revoke.status, "ACCESS_REVOKED");
assert.throws(() => closeInstitutionalAccessReview({ finding: revoke, reviewerId: "issuer-1", originalGrantIssuerId: "issuer-1", reason: "reviewed" }), /independent/i);
const closed = closeInstitutionalAccessReview({ finding: revoke, reviewerId: "reviewer-2", originalGrantIssuerId: "issuer-1", reason: "Credential failure investigated and access remains revoked." });
assert.equal(closed.closed, true);
const anomaly = evaluateInstitutionalAccessSurveillance({ observations: [{ actorId: "a", grantId: "g", action: "EXPORT", at: "2026-01-01T00:00:00Z", recordCount: 12, moduleId: "documents", subjectId: "s", credentialValid: true, authorityValid: true }], exportThreshold: 10, deniedThreshold: 3 });
assert.equal(anomaly.status, "REVIEW_REQUIRED");
console.log(JSON.stringify({ ok: true, rule: "INSTITUTIONAL-ACCESS-SURVEILLANCE-001", continuousRecheck: true, anomalyReview: true, automaticRevocation: true, independentClosure: true }, null, 2));
