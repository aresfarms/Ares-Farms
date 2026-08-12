export const DOCUMENT_AUTHENTICITY_DOCTRINE = {
  canonicalId: "CANON-DOCUMENT-AUTHENTICITY-001",
  technicalId: "TECH-DOCUMENT-AUTHENTICITY-001",
  operationsId: "OPS-DOCUMENT-AUTHENTICITY-001",
  version: "document-authenticity-v1.0.0",
  livePlaidBlocked: true,
  rawIdentityDocumentRetention: false,
} as const;

export const AUTHENTICITY_CLASSIFICATIONS = [
  "DIRECT_SOURCE_VERIFIED",
  "CORROBORATED",
  "FORENSICALLY_CONSISTENT",
  "REVIEW_REQUIRED",
  "MATERIAL_DISCREPANCY",
  "REJECTED_FROM_PACKAGE",
] as const;

export type AuthenticityClassification = (typeof AUTHENTICITY_CLASSIFICATIONS)[number];

export function mayEnterExternalPackage(value: AuthenticityClassification): boolean {
  return value === "DIRECT_SOURCE_VERIFIED" || value === "CORROBORATED";
}
