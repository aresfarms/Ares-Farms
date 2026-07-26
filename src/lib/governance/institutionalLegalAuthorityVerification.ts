import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { chainAppend, verifyLedgerChain } from "@/lib/security/ledgerHashChain";
import type { InstitutionalReviewRole } from "@/lib/governance/institutionalEvidenceAccess";

export const INSTITUTIONAL_LEGAL_AUTHORITY_RULE =
  "INSTITUTIONAL-LEGAL-AUTHORITY-VERIFICATION-001" as const;

export type LegalAuthorityVerification = {
  authorityVerificationId: string;
  authorityToken: string;
  principalId: string;
  principalEmail: string;
  role: InstitutionalReviewRole;
  clientOrAgencySubjectId: string;
  matterId: string;
  jurisdiction: string;
  authorityType: string;
  effectiveAt: string;
  expiresAt: string;
  sourceDocumentHash: string;
  independentSourceRef: string;
  independentSourceSnapshotHash: string;
  namedPrincipalMatched: boolean;
  subjectMatched: boolean;
  matterMatched: boolean;
  jurisdictionMatched: boolean;
  dateWindowValid: boolean;
  revoked: boolean;
  status: "VERIFIED" | "REJECTED" | "REVOKED" | "EXPIRED";
  verifiedBy: string;
  verifiedAt: string;
  reason: string;
};

const LEDGER = path.join(
  process.cwd(),
  "data",
  "institutional-legal-authority-ledger.ndjson",
);

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function rows(): Array<Record<string, unknown>> {
  try {
    return fs.readFileSync(LEDGER, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch {
    return [];
  }
}

export function verifyInstitutionalLegalAuthority(input: {
  principalId: string;
  principalEmail: string;
  role: InstitutionalReviewRole;
  clientOrAgencySubjectId: string;
  matterId: string;
  jurisdiction: string;
  authorityType: string;
  effectiveAt: string;
  expiresAt: string;
  sourceDocumentPayload: string;
  independentSourceRef: string;
  independentSourcePayload: string;
  namedPrincipalMatched: boolean;
  subjectMatched: boolean;
  matterMatched: boolean;
  jurisdictionMatched: boolean;
  verifiedBy: string;
  verifiedAt?: string;
  reason: string;
}): LegalAuthorityVerification {
  const verifiedAt = input.verifiedAt ?? new Date().toISOString();
  const dateWindowValid =
    Date.parse(input.effectiveAt) <= Date.parse(verifiedAt) &&
    Date.parse(input.expiresAt) > Date.parse(verifiedAt);
  if (!input.independentSourceRef.trim()) {
    throw new Error("Independent authority-source verification is required.");
  }
  if (!input.sourceDocumentPayload.trim() || !input.independentSourcePayload.trim()) {
    throw new Error("Both submitted authority evidence and independent corroboration are required.");
  }
  if (
    !input.namedPrincipalMatched ||
    !input.subjectMatched ||
    !input.matterMatched ||
    !input.jurisdictionMatched ||
    !dateWindowValid
  ) {
    throw new Error("Legal authority verification failed: identity, subject, matter, jurisdiction, and date window must all match.");
  }

  const record: LegalAuthorityVerification = {
    authorityVerificationId: randomUUID(),
    authorityToken: `authz_${randomUUID()}`,
    principalId: input.principalId,
    principalEmail: input.principalEmail.toLowerCase(),
    role: input.role,
    clientOrAgencySubjectId: input.clientOrAgencySubjectId,
    matterId: input.matterId,
    jurisdiction: input.jurisdiction,
    authorityType: input.authorityType,
    effectiveAt: input.effectiveAt,
    expiresAt: input.expiresAt,
    sourceDocumentHash: sha(input.sourceDocumentPayload),
    independentSourceRef: input.independentSourceRef,
    independentSourceSnapshotHash: sha(input.independentSourcePayload),
    namedPrincipalMatched: true,
    subjectMatched: true,
    matterMatched: true,
    jurisdictionMatched: true,
    dateWindowValid: true,
    revoked: false,
    status: "VERIFIED",
    verifiedBy: input.verifiedBy,
    verifiedAt,
    reason: input.reason,
  };

  chainAppend(LEDGER, {
    schemaVersion: "institutional-legal-authority-v1",
    event: "LEGAL_AUTHORITY_VERIFIED",
    ...record,
  });
  return record;
}

export function findLegalAuthorityVerificationById(
  authorityVerificationId: string,
): LegalAuthorityVerification | null {
  const found = rows().slice().reverse().find(
    (row) => row.event === "LEGAL_AUTHORITY_VERIFIED" && row.authorityVerificationId === authorityVerificationId,
  );
  return (found as unknown as LegalAuthorityVerification | undefined) ?? null;
}


export function latestValidLegalAuthorityVerification(input: {
  principalId: string;
  principalEmail: string;
  role: InstitutionalReviewRole;
  subjectId?: string | null;
  matterId?: string | null;
  at?: string;
}): LegalAuthorityVerification | null {
  const at = Date.parse(input.at ?? new Date().toISOString());
  const found = rows()
    .filter((row) =>
      row.event === "LEGAL_AUTHORITY_VERIFIED" &&
      row.principalId === input.principalId &&
      String(row.principalEmail).toLowerCase() === input.principalEmail.toLowerCase() &&
      row.role === input.role &&
      (!input.subjectId || row.clientOrAgencySubjectId === input.subjectId) &&
      (!input.matterId || row.matterId === input.matterId)
    )
    .reverse()
    .find((row) => row.status === "VERIFIED" && row.revoked !== true && Date.parse(String(row.expiresAt)) >= at);
  return (found as unknown as LegalAuthorityVerification | undefined) ?? null;
}

export function legalAuthorityLedgerIntegrity() {
  return verifyLedgerChain(LEDGER);
}
