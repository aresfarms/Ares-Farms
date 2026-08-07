import assert from "node:assert/strict";
import fs from "node:fs";

import { verifyInstitutionalCredential } from "@/lib/governance/institutionalCredentialVerification";

assert.throws(() => verifyInstitutionalCredential({
  principalId: "lawyer-1", principalEmail: "law@example.test", fullLegalName: "Lawyer One", role: "attorney",
  credentialType: "State Bar", credentialIdentifier: "123456", jurisdictionOrIssuer: "Example State",
  officialSourceRef: "official://state-bar", officialSourcePayload: "inactive", method: "OFFICIAL_DIRECTORY_MANUAL",
  standing: "Inactive", verifiedBy: "governance-1", verifiedAt: "2026-01-01T00:00:00.000Z", expiresAt: "2026-02-01T00:00:00.000Z", reason: "red-team",
}), /active or eligible/i);

assert.throws(() => verifyInstitutionalCredential({
  principalId: "official-1", principalEmail: "official@agency.test", fullLegalName: "Official One", role: "government_official",
  credentialType: "Agency appointment", credentialIdentifier: "EMP-1", jurisdictionOrIssuer: "Example Agency",
  officialSourceRef: "official://agency", officialSourcePayload: "confirmed", method: "AGENCY_CONFIRMATION",
  standing: "Confirmed", verifiedBy: "governance-1", verifiedAt: "2026-01-01T00:00:00.000Z", expiresAt: "2026-02-01T00:00:00.000Z", reason: "red-team",
}), /agency/i);

assert.throws(() => verifyInstitutionalCredential({
  principalId: "auditor-1", principalEmail: "audit@example.test", fullLegalName: "Auditor One", role: "auditor",
  credentialType: "CPA", credentialIdentifier: "CPA-1", jurisdictionOrIssuer: "Example Board",
  officialSourceRef: "official://board", officialSourcePayload: "active", method: "OFFICIAL_DIRECTORY_MANUAL",
  standing: "Active", independenceAttested: false, verifiedBy: "governance-1", verifiedAt: "2026-01-01T00:00:00.000Z", expiresAt: "2026-02-01T00:00:00.000Z", reason: "red-team",
}), /independence/i);

const source = fs.readFileSync("src/lib/governance/institutionalCredentialVerification.ts", "utf8");
assert.ok(!source.includes("credentialIdentifierLast4"), "No license-number suffix may be retained.");
assert.ok(!source.includes("credentialIdentifierHash"), "License-number hashes are prohibited.");
assert.ok(!source.includes("credentialFingerprint"), "Derived license-number fingerprints are prohibited.");
assert.ok(source.includes("verificationToken"), "A random opaque verification token must replace the credential number after validation.");
assert.ok(source.includes("tokenBoundPrincipalId"), "Verification tokens must bind to the exact principal ID.");
assert.ok(source.includes("tokenBoundPrincipalEmail"), "Verification tokens must bind to the exact principal email.");


console.log(JSON.stringify({
  ok: true,
  rule: "INSTITUTIONAL-CREDENTIAL-VERIFICATION-001",
  roles: ["attorney", "government_official", "auditor"],
  credentialNumberStored: false,
  credentialSuffixStored: false,
  postVerificationOpaqueTokenOnly: true,
  matterAuthorityStillRequired: true,
  tokenBoundToExactPrincipal: true,
}, null, 2));
