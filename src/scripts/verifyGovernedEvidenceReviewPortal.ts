import assert from "node:assert/strict";
import { composeGovernedEvidencePacket } from "@/lib/governance/governedEvidenceReviewPortal";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

const events = [
  { ts: "2026-01-01T00:00:00.000Z", actorId: "reviewer-1", actorName: "Named Reviewer", domain: "applications", subject: "applications", decision: "REVIEWED", reason: "Human review completed." },
];
const platform = composeGovernedEvidencePacket({
  scope: { kind: "PLATFORM" }, modules: moduleManifests, events,
  chainVerification: { ok: true, chained: 1, legacy: 0, brokenAt: null },
  generatedAt: "2026-01-02T00:00:00.000Z",
});
assert.equal(platform.scope.kind, "PLATFORM");
assert.equal(platform.integrityConclusion, "CRYPTOGRAPHIC_CHAIN_VERIFIED");
assert.match(platform.packetSha256, /^[a-f0-9]{64}$/);
assert.equal(platform.replayRule, "TECH-REPLAY-001");
assert.equal(platform.ruleMatches.find((r) => r.ruleId === "TECH-LEDGER-001")?.status, "MATCH");

const module = composeGovernedEvidencePacket({
  scope: { kind: "MODULE", moduleId: "applications" }, modules: moduleManifests, events,
  chainVerification: { ok: true, chained: 1, legacy: 1, brokenAt: null },
  generatedAt: "2026-01-02T00:00:00.000Z",
});
assert.equal(module.moduleCount, 1);
assert.equal(module.integrityConclusion, "PARTIALLY_VERIFIED_WITH_LEGACY_RECORDS");
assert.ok(module.unresolvedIssues.length > 0);
assert.match(module.legalBoundary, /does not determine admissibility/i);

const failed = composeGovernedEvidencePacket({
  scope: { kind: "MODULE", moduleId: "applications" }, modules: moduleManifests, events,
  chainVerification: { ok: false, chained: 0, legacy: 0, brokenAt: 0 },
  generatedAt: "2026-01-02T00:00:00.000Z",
});
assert.equal(failed.integrityConclusion, "INTEGRITY_FAILURE");
assert.equal(failed.ruleMatches.find((r) => r.ruleId === "TECH-LEDGER-001")?.status, "MISMATCH");

console.log(JSON.stringify({ ok: true, rule: "GOVERNED-EVIDENCE-REVIEW-PORTAL-001", platformScope: true, moduleScope: true, passwordedRoles: ["auditor", "government_official", "attorney", "governance", "admin"], plainLanguageTimeline: true, packetSha256: platform.packetSha256 }, null, 2));

import { evaluateInstitutionalEvidenceAccess } from "@/lib/governance/institutionalEvidenceAccess";
import { filterEvidenceEventsForAccess } from "@/lib/governance/governedEvidenceReviewPortal";

const attorneyWithoutScope = evaluateInstitutionalEvidenceAccess({
  role: "attorney", actorId: "attorney-1", actorEmail: "law@example.test", grant: null,
});
assert.equal(attorneyWithoutScope.allowed, false, "Attorney role alone must never grant portal access.");

const attorneyToken = evaluateInstitutionalEvidenceAccess({
  role: "attorney", actorId: "attorney-1", actorEmail: "law@example.test", grant: null, suppliedTokenId: "token-opaque-1",
});
assert.equal(attorneyToken.allowed, true);
assert.equal(attorneyToken.effectiveTokenId, "token-opaque-1");

const governmentWithoutGrant = evaluateInstitutionalEvidenceAccess({
  role: "government_official", actorId: "official-1", actorEmail: "official@agency.test", grant: null,
});
assert.equal(governmentWithoutGrant.allowed, false, "Governmental officials require a specific grant.");

const grant = {
  grantId: "grant-1", role: "attorney" as const, principalId: "attorney-1", principalEmail: "law@example.test",
  purpose: "Matter review", matterId: "matter-1", agencyOrFirm: "Example Firm", tenantId: null,
  moduleIds: ["applications"], subjectIds: ["subject-1"], tokenId: null,
  windowStart: "2026-01-01T00:00:00.000Z", windowEnd: "2026-01-02T00:00:00.000Z",
  expiresAt: "2026-02-01T00:00:00.000Z", issuedBy: "governance-1", credentialVerificationId: "verification-1", issuedAt: "2025-12-31T00:00:00.000Z", revokedAt: null,
};
const outsideWindow = evaluateInstitutionalEvidenceAccess({
  role: "attorney", actorId: "attorney-1", actorEmail: "law@example.test", grant,
  requestedModuleId: "applications", requestedWindowStart: "2025-12-31T23:00:00.000Z", now: "2026-01-01T12:00:00.000Z",
});
assert.equal(outsideWindow.allowed, false);
const insideWindow = evaluateInstitutionalEvidenceAccess({
  role: "attorney", actorId: "attorney-1", actorEmail: "law@example.test", grant,
  requestedModuleId: "applications", requestedSubjectId: "subject-1",
  requestedWindowStart: "2026-01-01T01:00:00.000Z", requestedWindowEnd: "2026-01-01T23:00:00.000Z", now: "2026-01-01T12:00:00.000Z",
});
assert.equal(insideWindow.allowed, true);

const filtered = filterEvidenceEventsForAccess({
  events: [
    ...events,
    { ts: "2026-01-01T12:00:00.000Z", actorId: "anon:token-opaque-1", actorName: "anonymous-token", domain: "anonymous-token", subject: "token-opaque-1", decision: "RETURN", reason: "returned" },
    { ts: "2026-01-01T13:00:00.000Z", actorId: "anon:other-token", actorName: "anonymous-token", domain: "anonymous-token", subject: "other-token", decision: "RETURN", reason: "returned" },
  ],
  tokenId: "token-opaque-1",
  windowStart: "2026-01-01T00:00:00.000Z",
  windowEnd: "2026-01-02T00:00:00.000Z",
});
assert.equal(filtered.length, 1, "Token-bound attorney filtering must exclude every unrelated record.");
assert.equal(filtered[0]?.subject, "token-opaque-1");


import { verifyInstitutionalCredential } from "@/lib/governance/institutionalCredentialVerification";

assert.throws(() => verifyInstitutionalCredential({
  principalId: "lawyer-1", principalEmail: "law@example.test", fullLegalName: "Lawyer One", role: "attorney",
  credentialType: "State Bar", credentialIdentifier: "123456", jurisdictionOrIssuer: "Example State",
  officialSourceRef: "official://state-bar", officialSourcePayload: "inactive", method: "OFFICIAL_DIRECTORY_MANUAL",
  standing: "Inactive", verifiedBy: "governance-1", verifiedAt: "2026-01-01T00:00:00.000Z", expiresAt: "2026-02-01T00:00:00.000Z", reason: "test",
}), /active or eligible/i);

assert.throws(() => verifyInstitutionalCredential({
  principalId: "official-1", principalEmail: "official@agency.test", fullLegalName: "Official One", role: "government_official",
  credentialType: "Agency appointment", credentialIdentifier: "EMP-1", jurisdictionOrIssuer: "Example Agency",
  officialSourceRef: "official://agency", officialSourcePayload: "confirmed", method: "AGENCY_CONFIRMATION",
  standing: "Confirmed", verifiedBy: "governance-1", verifiedAt: "2026-01-01T00:00:00.000Z", expiresAt: "2026-02-01T00:00:00.000Z", reason: "test",
}), /agency/i);

assert.throws(() => verifyInstitutionalCredential({
  principalId: "auditor-1", principalEmail: "audit@example.test", fullLegalName: "Auditor One", role: "auditor",
  credentialType: "CPA", credentialIdentifier: "CPA-1", jurisdictionOrIssuer: "Example Board",
  officialSourceRef: "official://board", officialSourcePayload: "active", method: "OFFICIAL_DIRECTORY_MANUAL",
  standing: "Active", independenceAttested: false, verifiedBy: "governance-1", verifiedAt: "2026-01-01T00:00:00.000Z", expiresAt: "2026-02-01T00:00:00.000Z", reason: "test",
}), /independence/i);
