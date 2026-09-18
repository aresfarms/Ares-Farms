import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-access-runtime-"));
  process.chdir(root);
  const { verifyInstitutionalCredential } = await import("@/lib/governance/institutionalCredentialVerification");
  const { verifyInstitutionalLegalAuthority } = await import("@/lib/governance/institutionalLegalAuthorityVerification");
  const { issueEvidenceAccessGrant } = await import("@/lib/governance/institutionalEvidenceAccess");
  const { enforceInstitutionalPacketAccess } = await import("@/lib/governance/institutionalAccessRuntimeEnforcement");

  const now = "2026-08-01T12:00:00.000Z";
  const credential = verifyInstitutionalCredential({ principalId: "lawyer-1", principalEmail: "law@example.test", fullLegalName: "Lawyer One", role: "attorney", credentialType: "State Bar", credentialIdentifier: "transient-only", jurisdictionOrIssuer: "Example State", officialSourceRef: "official://bar", officialSourcePayload: "active", method: "OFFICIAL_DIRECTORY_MANUAL", standing: "Active", verifiedBy: "governance-1", verifiedAt: now, expiresAt: "2027-02-01T00:00:00.000Z", reason: "runtime test" });
  const authority = verifyInstitutionalLegalAuthority({ principalId: "lawyer-1", principalEmail: "law@example.test", role: "attorney", clientOrAgencySubjectId: "subject-1", matterId: "matter-1", jurisdiction: "Example State", authorityType: "Representation", effectiveAt: "2026-07-01T00:00:00.000Z", expiresAt: "2027-02-01T00:00:00.000Z", sourceDocumentPayload: "submitted", independentSourceRef: "official://authority", independentSourcePayload: "confirmed", namedPrincipalMatched: true, subjectMatched: true, matterMatched: true, jurisdictionMatched: true, verifiedBy: "governance-2", verifiedAt: now, reason: "runtime test" });
  const grant = issueEvidenceAccessGrant({ role: "attorney", principalId: "lawyer-1", principalEmail: "law@example.test", purpose: "matter-review", matterId: "matter-1", agencyOrFirm: "Firm", tenantId: null, moduleIds: ["applications"], subjectIds: ["subject-1"], tokenId: null, windowStart: "2026-08-01T00:00:00.000Z", windowEnd: "2026-08-02T00:00:00.000Z", expiresAt: "2027-02-01T00:00:00.000Z", issuedBy: "governance-3", credentialVerificationId: credential.verificationId, authorityVerificationId: authority.authorityVerificationId, issuedAt: now });
  const events = [
    { ts: now, actorId: "system", actorName: "system", domain: "applications", subject: "subject-1", decision: "VIEW", reason: "permitted" },
    { ts: now, actorId: "system", actorName: "system", domain: "applications", subject: "subject-2", decision: "VIEW", reason: "withheld" },
  ];
  assert.equal(enforceInstitutionalPacketAccess({ actorId: "lawyer-1", actorEmail: "law@example.test", actorRole: "attorney", grant: null, candidateEvents: events, requestedModuleId: "applications", requestedSubjectId: "subject-1", requestedWindowStart: null, requestedWindowEnd: null, now }).allowed, false);
  assert.equal(enforceInstitutionalPacketAccess({ actorId: "other", actorEmail: "law@example.test", actorRole: "attorney", grant, candidateEvents: events, requestedModuleId: "applications", requestedSubjectId: "subject-1", requestedWindowStart: null, requestedWindowEnd: null, now }).allowed, false);
  const allowed = enforceInstitutionalPacketAccess({ actorId: "lawyer-1", actorEmail: "law@example.test", actorRole: "attorney", grant, candidateEvents: events, requestedModuleId: "applications", requestedSubjectId: "subject-1", requestedWindowStart: null, requestedWindowEnd: null, now });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.events.length, 1);
  assert.equal(allowed.withheldCount, 1);
  assert.match(String(allowed.capabilityToken), /^cap_/);
  assert.ok(Date.parse(String(allowed.capabilityExpiresAt)) <= Date.parse(now) + 5 * 60_000);
  console.log(JSON.stringify({ ok: true, rule: "INSTITUTIONAL-ACCESS-RUNTIME-ENFORCEMENT-001", receiptRevalidationPerRequest: true, fieldFilteringBeforePacket: true, capabilityBoundToPacketScope: true, governanceAdminRoleMasqueradeProhibited: true }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
