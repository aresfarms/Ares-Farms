import assert from "node:assert/strict";
import { buildDeterministicPackage, captureSubmissionConsent } from "@/lib/lender-submission/runtime";
import { buildLenderProvenanceCertificate } from "@/lib/lender-submission/provenance";
import { createAuthenticityEvidence, evidenceFromPlaidDirectArtifact, sha256Bytes } from "@/lib/document-authenticity";

const now = "2026-08-06T20:00:00.000Z";
const directBytes = Buffer.from("institution-derived-statement");
const direct = evidenceFromPlaidDirectArtifact({ bytes: directBytes, institutionName: "Fixture Bank", plaidItemRef: "item-fixture", plaidAccountRef: "acct-fixture", customerIdentityVerificationRef: "identity-fixture", accountOwnershipVerificationRef: "owner-fixture", retrievedAt: now });
assert.equal(direct.classification, "DIRECT_SOURCE_VERIFIED");

const uploadedBytes = Buffer.from("customer-uploaded-statement");
const corroborated = createAuthenticityEvidence({ artifactSha256: sha256Bytes(uploadedBytes), sourceType: "CUSTOMER_UPLOAD", sourceInstitution: "Fixture Bank", customerIdentityVerificationRef: "identity-fixture", accountOwnershipVerificationRef: "owner-fixture", forensicRunId: "forensic-fixture", institutionCorroborationRef: "plaid-corroboration-fixture", corroborationFieldsChecked: ["ownership", "period", "closing_balance", "transactions"], forensicSignals: [], materialDiscrepancies: [], verifiedAt: now, institutionSourceProven: false, accountOwnershipVerified: true, forensicChecksCompleted: true, independentlyCorroborated: true });
assert.equal(corroborated.classification, "CORROBORATED");

const mismatch = createAuthenticityEvidence({ artifactSha256: sha256Bytes("fake"), sourceType: "CUSTOMER_UPLOAD", customerIdentityVerificationRef: "identity-fixture", accountOwnershipVerificationRef: "owner-fixture", forensicRunId: "forensic-mismatch", corroborationFieldsChecked: ["closing_balance"], forensicSignals: [], materialDiscrepancies: ["closing_balance_mismatch"], verifiedAt: now, institutionSourceProven: false, accountOwnershipVerified: true, forensicChecksCompleted: true, independentlyCorroborated: false });
assert.equal(mismatch.classification, "MATERIAL_DISCREPANCY");

const pkg = buildDeterministicPackage({ caseId: "case-fixture", version: 1, frozenAt: now, sources: [
  { sourceRef: "vault://direct", sourceVersion: "v1", canonicalName: "01_statement.pdf", mediaType: "application/pdf", dataCategory: "financial", classification: "RESTRICTED", malwareScanStatus: "CLEAN", redactionStatus: "NOT_REQUIRED", overlayVersion: "overlay-v1", authenticityEvidenceRef: direct.evidenceSha256, authenticityClassification: direct.classification, content: directBytes },
  { sourceRef: "vault://upload", sourceVersion: "v1", canonicalName: "02_uploaded.pdf", mediaType: "application/pdf", dataCategory: "financial", classification: "RESTRICTED", malwareScanStatus: "CLEAN", redactionStatus: "NOT_REQUIRED", overlayVersion: "overlay-v1", authenticityEvidenceRef: corroborated.evidenceSha256, authenticityClassification: corroborated.classification, content: uploadedBytes },
] });
const consent = captureSubmissionConsent({ caseId: pkg.caseId, packageVersionId: pkg.packageVersionId, manifestSha256: pkg.manifestSha256, customerId: "customer-fixture", lenderId: "lender-fixture", recipientScope: "underwriting-team", purpose: "financing review", channel: "sandbox", dataCategories: ["financial"], consentedAt: now, expiresAt: "2026-08-07T20:00:00.000Z", accepted: true });
const cert = buildLenderProvenanceCertificate({ package: pkg, consent, customerIdentityVerificationRef: "identity-fixture", generatedAt: now });
assert.equal(cert.items.length, 2);
assert.match(cert.certificateSha256, /^[a-f0-9]{64}$/);
assert.throws(() => buildDeterministicPackage({ caseId: "bad", version: 1, frozenAt: now, sources: [{ sourceRef: "vault://bad", sourceVersion: "v1", canonicalName: "bad.pdf", mediaType: "application/pdf", dataCategory: "financial", classification: "RESTRICTED", malwareScanStatus: "CLEAN", redactionStatus: "NOT_REQUIRED", overlayVersion: "overlay-v1", authenticityEvidenceRef: mismatch.evidenceSha256, authenticityClassification: mismatch.classification as never, content: "bad" }] }), /not authenticity-cleared/);
console.log(JSON.stringify({ ok: true, direct: direct.classification, uploaded: corroborated.classification, mismatch: mismatch.classification, provenanceCertificateSha256: cert.certificateSha256 }, null, 2));
