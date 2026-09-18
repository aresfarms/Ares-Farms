import { sha256, canonicalJson, type BuiltPackage, type SubmissionConsent } from "./runtime";

export type LenderProvenanceCertificate = {
  schema: "furlong-loan-submission-provenance-v1";
  caseId: string;
  packageVersionId: string;
  manifestSha256: string;
  customerIdentityVerificationRef: string;
  consent: { id: string; disclosureVersion: string; disclosureSha256: string; consentedAt: string; expiresAt: string; lenderId: string; recipientScope: string; purpose: string; channel: string };
  items: Array<{ ordinal: number; canonicalName: string; sha256: string; byteLength: number; authenticityEvidenceRef: string; authenticityClassification: "DIRECT_SOURCE_VERIFIED" | "CORROBORATED" }>;
  generatedAt: string;
  certificateSha256: string;
};

export function buildLenderProvenanceCertificate(input: {
  package: BuiltPackage;
  consent: SubmissionConsent;
  customerIdentityVerificationRef: string;
  generatedAt: string;
}): LenderProvenanceCertificate {
  if (!input.customerIdentityVerificationRef) throw new Error("Customer identity verification evidence is required.");
  if (input.consent.packageVersionId !== input.package.packageVersionId || input.consent.manifestSha256 !== input.package.manifestSha256) throw new Error("Consent is not bound to this exact lender package.");
  const items = input.package.items.map((item) => {
    if (!item.authenticityEvidenceRef || !["DIRECT_SOURCE_VERIFIED", "CORROBORATED"].includes(item.authenticityClassification)) throw new Error(`Lender provenance certificate denied for ${item.canonicalName}.`);
    return { ordinal: item.ordinal, canonicalName: item.canonicalName, sha256: item.sha256, byteLength: item.byteLength, authenticityEvidenceRef: item.authenticityEvidenceRef, authenticityClassification: item.authenticityClassification };
  });
  const base = {
    schema: "furlong-loan-submission-provenance-v1" as const,
    caseId: input.package.caseId, packageVersionId: input.package.packageVersionId, manifestSha256: input.package.manifestSha256,
    customerIdentityVerificationRef: input.customerIdentityVerificationRef,
    consent: { id: input.consent.id, disclosureVersion: input.consent.disclosureVersion, disclosureSha256: input.consent.disclosureSha256, consentedAt: input.consent.consentedAt, expiresAt: input.consent.expiresAt, lenderId: input.consent.lenderId, recipientScope: input.consent.recipientScope, purpose: input.consent.purpose, channel: input.consent.channel },
    items, generatedAt: input.generatedAt,
  };
  return { ...base, certificateSha256: sha256(canonicalJson(base)) };
}
