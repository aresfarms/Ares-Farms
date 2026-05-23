/**
 * Classification Propagation Runtime
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces privacy, provenance, data minimization, and data immutability.
 *
 * - Vol II: Regulatory Governance
 *   Supports GLBA, ECOA, KYC/KYB, fair lending, and regulated disclosure.
 *
 * - Vol III: Technical Infrastructure
 *   Implements classification-aware data flow, connector governance,
 *   replay reconstruction, and schema metadata propagation.
 *
 * - Vol IV: Operational Runbooks
 *   Supports borrower disclosure, audit preparation, retention,
 *   escalation, and regulated export operations.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Implements CANON-CLASS-001 Data Classification and Sensitivity.
 *
 * Purpose:
 * This runtime attaches, validates, inherits, and propagates governed
 * classification metadata across events, workflows, AI outputs, exports,
 * replay artifacts, and derived records.
 */

export type ClassificationLevel =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED"
  | "SOVEREIGN_CONTROLLED";

export type SensitivityScope =
  | "borrower"
  | "lender"
  | "institutional"
  | "regulatory"
  | "treasury"
  | "security"
  | "governance"
  | "public";

export type ClassificationMetadata = {
  classificationLevel: ClassificationLevel;
  sensitivityScope: SensitivityScope;
  jurisdictionScope: string[];
  sharingPermissions: string[];
  aiUsagePermissions: string[];
  retentionRequirements: string;
  legalHoldStatus: boolean;
  exportRestrictions: string[];
  vaultRequired: boolean;
  redactionRequirements: string[];
  disclosureAudience: string[];
  consentRequirements: string[];
  replayClassificationContext: {
    classifiedAt: string;
    classificationSource: string;
    classificationVersion: string;
    replayRef?: string | null;
  };
};

export type ClassificationInput = {
  classificationLevel?: ClassificationLevel | null;
  sensitivityScope?: SensitivityScope | null;
  jurisdictionScope?: string[];
  sharingPermissions?: string[];
  aiUsagePermissions?: string[];
  retentionRequirements?: string | null;
  legalHoldStatus?: boolean;
  exportRestrictions?: string[];
  vaultRequired?: boolean;
  redactionRequirements?: string[];
  disclosureAudience?: string[];
  consentRequirements?: string[];
  classificationSource?: string | null;
  classificationVersion?: string | null;
  replayRef?: string | null;
};

export type ClassifiedRecord<T extends Record<string, unknown>> = T & {
  classification: ClassificationMetadata;
};

const CLASSIFICATION_RANK: Record<ClassificationLevel, number> = {
  PUBLIC: 1,
  INTERNAL: 2,
  CONFIDENTIAL: 3,
  RESTRICTED: 4,
  SOVEREIGN_CONTROLLED: 5,
};

function normalizeClassificationLevel(
  level?: ClassificationLevel | null
): ClassificationLevel {
  return level ?? "INTERNAL";
}

function normalizeSensitivityScope(
  scope?: SensitivityScope | null
): SensitivityScope {
  return scope ?? "institutional";
}

function requiresVault(level: ClassificationLevel): boolean {
  return level === "RESTRICTED" || level === "SOVEREIGN_CONTROLLED";
}

export function createClassificationMetadata(
  input: ClassificationInput = {}
): ClassificationMetadata {
  const classificationLevel = normalizeClassificationLevel(
    input.classificationLevel
  );

  return {
    classificationLevel,
    sensitivityScope: normalizeSensitivityScope(input.sensitivityScope),
    jurisdictionScope: input.jurisdictionScope ?? [],
    sharingPermissions: input.sharingPermissions ?? [],
    aiUsagePermissions: input.aiUsagePermissions ?? [],
    retentionRequirements:
      input.retentionRequirements ?? "retain-per-governed-policy",
    legalHoldStatus: input.legalHoldStatus ?? false,
    exportRestrictions: input.exportRestrictions ?? [],
    vaultRequired: input.vaultRequired ?? requiresVault(classificationLevel),
    redactionRequirements: input.redactionRequirements ?? [],
    disclosureAudience: input.disclosureAudience ?? [],
    consentRequirements: input.consentRequirements ?? [],
    replayClassificationContext: {
      classifiedAt: new Date().toISOString(),
      classificationSource:
        input.classificationSource ?? "classification-runtime",
      classificationVersion:
        input.classificationVersion ?? "classification-runtime-v0.1.0",
      replayRef: input.replayRef ?? null,
    },
  };
}

export function classifyRecord<T extends Record<string, unknown>>(
  record: T,
  input: ClassificationInput = {}
): ClassifiedRecord<T> {
  return {
    ...record,
    classification: createClassificationMetadata(input),
  };
}

export function inheritClassification(
  parent: ClassificationMetadata,
  overrides: ClassificationInput = {}
): ClassificationMetadata {
  const requestedLevel = normalizeClassificationLevel(
    overrides.classificationLevel
  );

  const inheritedLevel =
    CLASSIFICATION_RANK[requestedLevel] >=
    CLASSIFICATION_RANK[parent.classificationLevel]
      ? requestedLevel
      : parent.classificationLevel;

  return createClassificationMetadata({
    ...overrides,
    classificationLevel: inheritedLevel,
    sensitivityScope: overrides.sensitivityScope ?? parent.sensitivityScope,
    jurisdictionScope:
      overrides.jurisdictionScope ?? parent.jurisdictionScope,
    sharingPermissions:
      overrides.sharingPermissions ?? parent.sharingPermissions,
    aiUsagePermissions:
      overrides.aiUsagePermissions ?? parent.aiUsagePermissions,
    retentionRequirements:
      overrides.retentionRequirements ?? parent.retentionRequirements,
    legalHoldStatus:
      overrides.legalHoldStatus ?? parent.legalHoldStatus,
    exportRestrictions:
      overrides.exportRestrictions ?? parent.exportRestrictions,
    vaultRequired: overrides.vaultRequired ?? parent.vaultRequired,
    redactionRequirements:
      overrides.redactionRequirements ?? parent.redactionRequirements,
    disclosureAudience:
      overrides.disclosureAudience ?? parent.disclosureAudience,
    consentRequirements:
      overrides.consentRequirements ?? parent.consentRequirements,
    replayRef:
      overrides.replayRef ?? parent.replayClassificationContext.replayRef,
    classificationSource:
      overrides.classificationSource ?? "classification-inheritance-runtime",
    classificationVersion:
      overrides.classificationVersion ??
      parent.replayClassificationContext.classificationVersion,
  });
}

export function assertClassificationPresent(
  metadata?: ClassificationMetadata | null
): ClassificationMetadata {
  if (!metadata) {
    return createClassificationMetadata({
      classificationLevel: "INTERNAL",
      sensitivityScope: "institutional",
      classificationSource: "classification-runtime-default",
    });
  }

  return metadata;
}
