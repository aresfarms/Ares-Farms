import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { chainAppend, verifyLedgerChain } from "@/lib/security/ledgerHashChain";
import type { InstitutionalReviewRole } from "@/lib/governance/institutionalEvidenceAccess";

export type ProfessionalCredentialRole = InstitutionalReviewRole | "lender" | "sponsor";

export const INSTITUTIONAL_CREDENTIAL_VERIFICATION_RULE =
  "INSTITUTIONAL-CREDENTIAL-VERIFICATION-001" as const;

export type CredentialVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "REVOKED";

export type CredentialVerificationMethod =
  | "OFFICIAL_DIRECTORY_AUTOMATED"
  | "OFFICIAL_DIRECTORY_MANUAL"
  | "ISSUER_CONFIRMATION"
  | "AGENCY_CONFIRMATION"
  | "STAGING_TEST_FIXTURE";

export type InstitutionalCredentialVerification = {
  verificationId: string;
  principalId: string;
  principalEmail: string;
  fullLegalName: string;
  role: ProfessionalCredentialRole;
  credentialType: string;
  jurisdictionOrIssuer: string;
  verificationToken: string;
  tokenBoundPrincipalId: string;
  tokenBoundPrincipalEmail: string;
  officialSourceRef: string;
  officialSourceSnapshotHash: string;
  method: CredentialVerificationMethod;
  status: CredentialVerificationStatus;
  standing: string;
  titleOrClassification: string | null;
  agencyOrFirm: string | null;
  independenceAttested: boolean | null;
  verifiedBy: string;
  verifiedAt: string;
  expiresAt: string;
  reason: string;
};

const LEDGER = path.join(
  process.cwd(),
  "data",
  "institutional-credential-verification-ledger.ndjson",
);

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function rows(): Array<Record<string, unknown>> {
  try {
    return fs
      .readFileSync(LEDGER, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch {
    return [];
  }
}

export function verifyInstitutionalCredential(input: {
  principalId: string;
  principalEmail: string;
  fullLegalName: string;
  role: ProfessionalCredentialRole;
  credentialType: string;
  credentialIdentifier: string;
  jurisdictionOrIssuer: string;
  officialSourceRef: string;
  officialSourcePayload: string;
  method: CredentialVerificationMethod;
  standing: string;
  titleOrClassification?: string | null;
  agencyOrFirm?: string | null;
  independenceAttested?: boolean | null;
  verifiedBy: string;
  verifiedAt?: string;
  expiresAt: string;
  reason: string;
}): InstitutionalCredentialVerification {
  const identifier = input.credentialIdentifier.trim();
  if (!identifier) throw new Error("A professional or official credential identifier is required.");
  if (!input.fullLegalName.trim()) throw new Error("The verified full legal name is required.");
  if (!input.officialSourceRef.trim()) throw new Error("An official verification source is required.");
  if (!input.reason.trim()) throw new Error("A verification reason is required.");
  if (Date.parse(input.expiresAt) <= Date.parse(input.verifiedAt ?? new Date().toISOString())) {
    throw new Error("Credential verification expiration must be after verification.");
  }
  if (input.role === "attorney" || input.role === "lender") {
    const normalizedStanding = input.standing.trim().toLowerCase().replace(/[^a-z]+/g, " ").trim();
    const allowedStanding = new Set(["active", "eligible", "good standing", "active good standing", "active eligible"]);
    if (!allowedStanding.has(normalizedStanding)) {
      throw new Error(`${input.role === "lender" ? "Lender" : "Attorney"} access requires active or eligible standing from the authoritative source.`);
    }
  }
  if (input.role === "sponsor" && !input.agencyOrFirm?.trim()) {
    throw new Error("Sponsor verification requires the represented organization or institution.");
  }
  if (input.role === "government_official" && !input.agencyOrFirm?.trim()) {
    throw new Error("Governmental-official verification requires the employing or appointing agency.");
  }
  if (input.role === "auditor" && input.independenceAttested !== true) {
    throw new Error("Auditor verification requires an independence attestation for the engagement.");
  }

  const record: InstitutionalCredentialVerification = {
    verificationId: randomUUID(),
    principalId: input.principalId,
    principalEmail: input.principalEmail.toLowerCase(),
    fullLegalName: input.fullLegalName,
    role: input.role,
    credentialType: input.credentialType,
    jurisdictionOrIssuer: input.jurisdictionOrIssuer,
    verificationToken: `credv_${randomUUID()}`,
    tokenBoundPrincipalId: input.principalId,
    tokenBoundPrincipalEmail: input.principalEmail.toLowerCase(),
    officialSourceRef: input.officialSourceRef,
    officialSourceSnapshotHash: sha(input.officialSourcePayload),
    method: input.method,
    status: "VERIFIED",
    standing: input.standing,
    titleOrClassification: input.titleOrClassification ?? null,
    agencyOrFirm: input.agencyOrFirm ?? null,
    independenceAttested: input.independenceAttested ?? null,
    verifiedBy: input.verifiedBy,
    verifiedAt: input.verifiedAt ?? new Date().toISOString(),
    expiresAt: input.expiresAt,
    reason: input.reason,
  };

  chainAppend(LEDGER, {
    schemaVersion: "institutional-credential-verification-v1",
    event: "CREDENTIAL_VERIFIED",
    ...record,
  });
  return record;
}


export function findCredentialVerificationById(verificationId: string): InstitutionalCredentialVerification | null {
  const found = rows().slice().reverse().find((row) => row.event === "CREDENTIAL_VERIFIED" && row.verificationId === verificationId);
  return (found as unknown as InstitutionalCredentialVerification | undefined) ?? null;
}

export function latestValidCredentialVerification(input: {
  principalId: string;
  principalEmail: string;
  role: ProfessionalCredentialRole;
  at?: string;
}): InstitutionalCredentialVerification | null {
  const at = Date.parse(input.at ?? new Date().toISOString());
  const found = rows()
    .filter(
      (row) =>
        row.event === "CREDENTIAL_VERIFIED" &&
        row.principalId === input.principalId &&
        String(row.principalEmail).toLowerCase() === input.principalEmail.toLowerCase() &&
        row.tokenBoundPrincipalId === input.principalId &&
        String(row.tokenBoundPrincipalEmail).toLowerCase() === input.principalEmail.toLowerCase() &&
        row.role === input.role,
    )
    .reverse()
    .find((row) => row.status === "VERIFIED" && Date.parse(String(row.expiresAt)) >= at);
  return (found as unknown as InstitutionalCredentialVerification | undefined) ?? null;
}

export function credentialVerificationLedgerIntegrity() {
  return verifyLedgerChain(LEDGER);
}
