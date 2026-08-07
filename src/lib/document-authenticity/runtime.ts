import { createHash } from "node:crypto";
import { mayEnterExternalPackage, type AuthenticityClassification } from "./doctrine";

export type DocumentSourceType = "PLAID_DIRECT" | "CUSTOMER_UPLOAD" | "OTHER_CERTIFIED_CONNECTOR";
export type ForensicSignal = { code: string; severity: "INFO" | "WARN" | "HIGH"; detailHash?: string };

export type AuthenticityEvidence = {
  artifactSha256: string;
  sourceType: DocumentSourceType;
  sourceInstitution?: string;
  sourceReference?: string;
  customerIdentityVerificationRef: string;
  accountOwnershipVerificationRef?: string;
  forensicRunId?: string;
  fraudProviderResultRef?: string;
  institutionCorroborationRef?: string;
  corroborationFieldsChecked: string[];
  forensicSignals: ForensicSignal[];
  materialDiscrepancies: string[];
  humanReviewRef?: string;
  classification: AuthenticityClassification;
  verifiedAt: string;
  evidenceSha256: string;
};

export function sha256Bytes(value: Uint8Array | Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
}

export function classifyAuthenticity(input: {
  sourceType: DocumentSourceType;
  institutionSourceProven: boolean;
  accountOwnershipVerified: boolean;
  forensicChecksCompleted: boolean;
  highRiskSignals: number;
  materialDiscrepancies: string[];
  independentlyCorroborated: boolean;
}): AuthenticityClassification {
  if (input.materialDiscrepancies.length > 0) return "MATERIAL_DISCREPANCY";
  if (input.sourceType === "PLAID_DIRECT" && input.institutionSourceProven && input.accountOwnershipVerified) return "DIRECT_SOURCE_VERIFIED";
  if (input.independentlyCorroborated && input.accountOwnershipVerified && input.forensicChecksCompleted && input.highRiskSignals === 0) return "CORROBORATED";
  if (input.forensicChecksCompleted && input.highRiskSignals === 0) return "FORENSICALLY_CONSISTENT";
  return "REVIEW_REQUIRED";
}

export function createAuthenticityEvidence(input: Omit<AuthenticityEvidence, "classification" | "evidenceSha256"> & {
  institutionSourceProven: boolean;
  accountOwnershipVerified: boolean;
  forensicChecksCompleted: boolean;
  independentlyCorroborated: boolean;
}): AuthenticityEvidence {
  if (!/^[a-f0-9]{64}$/.test(input.artifactSha256)) throw new Error("artifactSha256 must be a SHA-256 digest.");
  if (!input.customerIdentityVerificationRef) throw new Error("Verified customer identity evidence is required.");
  const classification = classifyAuthenticity({
    sourceType: input.sourceType,
    institutionSourceProven: input.institutionSourceProven,
    accountOwnershipVerified: input.accountOwnershipVerified,
    forensicChecksCompleted: input.forensicChecksCompleted,
    highRiskSignals: input.forensicSignals.filter((signal) => signal.severity === "HIGH").length,
    materialDiscrepancies: input.materialDiscrepancies,
    independentlyCorroborated: input.independentlyCorroborated,
  });
  const evidenceBase = {
    artifactSha256: input.artifactSha256, sourceType: input.sourceType, sourceInstitution: input.sourceInstitution,
    sourceReference: input.sourceReference, customerIdentityVerificationRef: input.customerIdentityVerificationRef,
    accountOwnershipVerificationRef: input.accountOwnershipVerificationRef, forensicRunId: input.forensicRunId,
    fraudProviderResultRef: input.fraudProviderResultRef, institutionCorroborationRef: input.institutionCorroborationRef,
    corroborationFieldsChecked: input.corroborationFieldsChecked, forensicSignals: input.forensicSignals,
    materialDiscrepancies: input.materialDiscrepancies, humanReviewRef: input.humanReviewRef,
    classification, verifiedAt: input.verifiedAt,
  };
  return { ...evidenceBase, evidenceSha256: sha256Bytes(stable(evidenceBase)) };
}

export function assertExternalPackageEligible(evidence: AuthenticityEvidence): void {
  if (!mayEnterExternalPackage(evidence.classification)) throw new Error(`Document authenticity gate denied external package admission: ${evidence.classification}`);
}
