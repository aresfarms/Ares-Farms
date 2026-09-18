import assert from "node:assert/strict";

import { verifyInstitutionalLegalAuthority } from "@/lib/governance/institutionalLegalAuthorityVerification";
import { evaluateInstitutionalEvidenceAccess } from "@/lib/governance/institutionalEvidenceAccess";

const base = {
  principalId: "attorney-1",
  principalEmail: "law@example.test",
  role: "attorney" as const,
  clientOrAgencySubjectId: "client-token-1",
  matterId: "matter-1",
  jurisdiction: "Example State",
  authorityType: "Client representation",
  effectiveAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-12-31T23:59:59.000Z",
  sourceDocumentPayload: "submitted authority document",
  independentSourceRef: "independent://client-confirmation",
  independentSourcePayload: "client independently confirmed representation",
  namedPrincipalMatched: true,
  subjectMatched: true,
  matterMatched: true,
  jurisdictionMatched: true,
  verifiedBy: "governance-1",
  verifiedAt: "2026-02-01T00:00:00.000Z",
  reason: "Verification test",
};

assert.throws(
  () => verifyInstitutionalLegalAuthority({ ...base, namedPrincipalMatched: false }),
  /identity, subject, matter, jurisdiction, and date window/i,
);
assert.throws(
  () => verifyInstitutionalLegalAuthority({ ...base, subjectMatched: false }),
  /identity, subject, matter, jurisdiction, and date window/i,
);
assert.throws(
  () => verifyInstitutionalLegalAuthority({ ...base, matterMatched: false }),
  /identity, subject, matter, jurisdiction, and date window/i,
);
assert.throws(
  () => verifyInstitutionalLegalAuthority({ ...base, jurisdictionMatched: false }),
  /identity, subject, matter, jurisdiction, and date window/i,
);
assert.throws(
  () => verifyInstitutionalLegalAuthority({ ...base, expiresAt: "2026-01-15T00:00:00.000Z" }),
  /identity, subject, matter, jurisdiction, and date window/i,
);

for (const role of ["attorney", "government_official", "auditor"] as const) {
  const denied = evaluateInstitutionalEvidenceAccess({
    role,
    actorId: `${role}-1`,
    actorEmail: `${role}@example.test`,
    grant: null,
  });
  assert.equal(denied.allowed, false, `${role} must never receive unscoped portal access.`);
}

console.log(JSON.stringify({
  ok: true,
  rule: "INSTITUTIONAL-LEGAL-AUTHORITY-VERIFICATION-001",
  credentialAndAuthorityAreSeparate: true,
  fakeOrMismatchedPaperworkDenied: true,
  expiredAuthorityDenied: true,
  unscopedProfessionalAccessDenied: true,
}, null, 2));
