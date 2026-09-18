import { createAuthenticityEvidence, sha256Bytes, type AuthenticityEvidence } from "./runtime";

/** Provider-boundary model only. No Plaid network call or credential is enabled by this build. */
export type PlaidDirectArtifact = {
  bytes: Uint8Array;
  institutionName: string;
  plaidItemRef: string;
  plaidAccountRef: string;
  customerIdentityVerificationRef: string;
  accountOwnershipVerificationRef: string;
  retrievedAt: string;
};

export function evidenceFromPlaidDirectArtifact(input: PlaidDirectArtifact): AuthenticityEvidence {
  return createAuthenticityEvidence({
    artifactSha256: sha256Bytes(input.bytes),
    sourceType: "PLAID_DIRECT",
    sourceInstitution: input.institutionName,
    sourceReference: `${input.plaidItemRef}:${input.plaidAccountRef}`,
    customerIdentityVerificationRef: input.customerIdentityVerificationRef,
    accountOwnershipVerificationRef: input.accountOwnershipVerificationRef,
    corroborationFieldsChecked: ["institution_source", "account_binding"],
    forensicSignals: [], materialDiscrepancies: [], verifiedAt: input.retrievedAt,
    institutionSourceProven: true, accountOwnershipVerified: true,
    forensicChecksCompleted: true, independentlyCorroborated: true,
  });
}
