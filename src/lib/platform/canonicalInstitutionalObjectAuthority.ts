/**
 * Canonical Institutional Object Authority
 *
 * Governing doctrine:
 * - Vol V / CANON-CLASS-001: classification metadata travels with every
 *   canonical object and may not be silently discarded.
 * - Vol VI / canonical runtime spine: feature projections resolve through a
 *   declared authority, governance context, audit evidence, and replay state.
 * - TECH-REPLAY-001 and SOURCE-PROV-001: durable records retain deterministic
 *   lineage to their source, audit, and replay artifacts.
 */

import {
  canonicalEvidenceAuthority,
  canonicalLandRegisterAuthority,
  canonicalOpportunityAuthority,
  canonicalOrganizationAuthority,
  canonicalPersonAuthority,
  canonicalAssetAuthority,
  canonicalTransactionAuthority,
  canonicalCaseAuthority,
  canonicalOperationAuthority,
  canonicalEventAuthority,
  canonicalPlaceAuthority,
  canonicalProgramAuthority,
  canonicalPropertyAuthority,
  canonicalProviderAuthority,
  canonicalReportAuthority,
  canonicalSourceAuthority,
} from "@/lib/platform/authorities";
import {
  canonicalDomainRegistry,
  getCanonicalDomain,
} from "@/lib/platform/canonicalDomainRegistry";
import type {
  CanonicalDomainDefinition,
  CanonicalDomainKey,
} from "@/lib/platform/canonicalDomainRegistry";
import {
  createClassificationMetadata,
} from "@/lib/runtime/classificationRuntime";
import type {
  ClassificationInput,
} from "@/lib/runtime/classificationRuntime";

export const CANONICAL_INSTITUTIONAL_OBJECT_SCHEMA_VERSION =
  "canonical-institutional-object-v1";

export type CanonicalInstitutionalObjectState =
  | "DRAFT"
  | "ACTIVE"
  | "SUPERSEDED"
  | "ARCHIVED";

export type CanonicalInstitutionalClassification = Readonly<{
  classificationLevel: ReturnType<typeof createClassificationMetadata>["classificationLevel"];
  sensitivityScope: ReturnType<typeof createClassificationMetadata>["sensitivityScope"];
  jurisdictionScope: readonly string[];
  sharingPermissions: readonly string[];
  aiUsagePermissions: readonly string[];
  retentionRequirements: string;
  legalHoldStatus: boolean;
  exportRestrictions: readonly string[];
  vaultRequired: boolean;
  redactionRequirements: readonly string[];
  disclosureAudience: readonly string[];
  consentRequirements: readonly string[];
  replayClassificationContext: Readonly<{
    classifiedAt: string;
    classificationSource: string;
    classificationVersion: string;
    replayRef?: string | null;
  }>;
}>;

export type CanonicalInstitutionalObjectEnvelope<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> = Readonly<{
  canonicalObjectId: string;
  domain: CanonicalDomainKey;
  canonicalIdField: string;
  schemaVersion: typeof CANONICAL_INSTITUTIONAL_OBJECT_SCHEMA_VERSION;
  governanceVersion: string;
  authority: Readonly<{
    module: string;
    exportName: string;
    governanceTags: readonly string[];
  }>;
  lifecycle: Readonly<{
    state: CanonicalInstitutionalObjectState;
    effectiveAt: string;
    recordedAt: string;
  }>;
  classification: CanonicalInstitutionalClassification;
  provenanceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
  payload: Readonly<TPayload>;
}>;

export type CreateCanonicalInstitutionalObjectInput<
  TPayload extends Record<string, unknown>,
> = {
  domain: CanonicalDomainKey;
  canonicalObjectId: string;
  governanceVersion: string;
  lifecycle: {
    state: CanonicalInstitutionalObjectState;
    effectiveAt: string;
    recordedAt: string;
  };
  classification: ClassificationInput;
  provenanceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
  payload: TPayload;
};

const institutionalAuthorities = Object.freeze({
  property: canonicalPropertyAuthority,
  place: canonicalPlaceAuthority,
  land_register: canonicalLandRegisterAuthority,
  evidence: canonicalEvidenceAuthority,
  source: canonicalSourceAuthority,
  program: canonicalProgramAuthority,
  provider: canonicalProviderAuthority,
  report: canonicalReportAuthority,
  opportunity: canonicalOpportunityAuthority,
  organization: canonicalOrganizationAuthority,
  person: canonicalPersonAuthority,
  asset: canonicalAssetAuthority,
  transaction: canonicalTransactionAuthority,
  case: canonicalCaseAuthority,
  operation: canonicalOperationAuthority,
  event: canonicalEventAuthority,
} satisfies Record<CanonicalDomainKey, object>);

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new Error(`${field} must be a non-empty string.`);
}

function assertIsoTimestamp(value: string, field: string): void {
  assertNonEmpty(value, field);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`);
  }
}

function normalizedRefs(values: readonly string[], field: string): readonly string[] {
  const normalized = values.map((value) => value.trim());
  if (normalized.length === 0 || normalized.some((value) => value.length === 0)) {
    throw new Error(`${field} must contain at least one non-empty reference.`);
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${field} must not contain duplicate references.`);
  }
  return Object.freeze([...normalized]);
}

export function getCanonicalInstitutionalAuthority(domain: CanonicalDomainKey): Readonly<{
  definition: CanonicalDomainDefinition;
  implementation: object;
}> {
  return Object.freeze({
    definition: getCanonicalDomain(domain),
    implementation: institutionalAuthorities[domain],
  });
}

export function createCanonicalInstitutionalObject<
  TPayload extends Record<string, unknown>,
>(input: CreateCanonicalInstitutionalObjectInput<TPayload>): CanonicalInstitutionalObjectEnvelope<TPayload> {
  const { definition } = getCanonicalInstitutionalAuthority(input.domain);
  assertNonEmpty(input.canonicalObjectId, "canonicalObjectId");
  assertNonEmpty(input.governanceVersion, "governanceVersion");
  assertNonEmpty(input.replayRef, "replayRef");
  assertIsoTimestamp(input.lifecycle.effectiveAt, "lifecycle.effectiveAt");
  assertIsoTimestamp(input.lifecycle.recordedAt, "lifecycle.recordedAt");

  if (input.payload[definition.canonicalIdField] !== input.canonicalObjectId) {
    throw new Error(
      `payload.${definition.canonicalIdField} must equal canonicalObjectId for ${input.domain}.`
    );
  }

  const classification = createClassificationMetadata({
    ...input.classification,
    replayRef: input.replayRef,
    classificationSource:
      input.classification.classificationSource ?? "canonical-institutional-object-authority",
    classificationVersion:
      input.classification.classificationVersion ?? input.governanceVersion,
  });
  classification.replayClassificationContext.classifiedAt = input.lifecycle.recordedAt;

  return Object.freeze({
    canonicalObjectId: input.canonicalObjectId,
    domain: input.domain,
    canonicalIdField: definition.canonicalIdField,
    schemaVersion: CANONICAL_INSTITUTIONAL_OBJECT_SCHEMA_VERSION,
    governanceVersion: input.governanceVersion,
    authority: Object.freeze({
      module: definition.authorityModule,
      exportName: definition.authorityExport,
      governanceTags: Object.freeze([...definition.governanceTags]),
    }),
    lifecycle: Object.freeze({ ...input.lifecycle }),
    classification: Object.freeze({
      ...classification,
      jurisdictionScope: Object.freeze([...classification.jurisdictionScope]),
      sharingPermissions: Object.freeze([...classification.sharingPermissions]),
      aiUsagePermissions: Object.freeze([...classification.aiUsagePermissions]),
      exportRestrictions: Object.freeze([...classification.exportRestrictions]),
      redactionRequirements: Object.freeze([...classification.redactionRequirements]),
      disclosureAudience: Object.freeze([...classification.disclosureAudience]),
      consentRequirements: Object.freeze([...classification.consentRequirements]),
      replayClassificationContext: Object.freeze({
        ...classification.replayClassificationContext,
      }),
    }),
    provenanceRefs: normalizedRefs(input.provenanceRefs, "provenanceRefs"),
    auditRefs: normalizedRefs(input.auditRefs, "auditRefs"),
    replayRef: input.replayRef,
    versionRefs: normalizedRefs(input.versionRefs, "versionRefs"),
    payload: Object.freeze({ ...input.payload }),
  });
}

export function validateCanonicalInstitutionalObject(
  envelope: CanonicalInstitutionalObjectEnvelope
): void {
  const { definition } = getCanonicalInstitutionalAuthority(envelope.domain);
  if (envelope.schemaVersion !== CANONICAL_INSTITUTIONAL_OBJECT_SCHEMA_VERSION) {
    throw new Error(`Unsupported canonical institutional object schema: ${envelope.schemaVersion}`);
  }
  if (envelope.canonicalIdField !== definition.canonicalIdField) {
    throw new Error(`Canonical identifier field drift detected for ${envelope.domain}.`);
  }
  if (envelope.authority.module !== definition.authorityModule ||
      envelope.authority.exportName !== definition.authorityExport) {
    throw new Error(`Canonical authority drift detected for ${envelope.domain}.`);
  }
  if (envelope.payload[definition.canonicalIdField] !== envelope.canonicalObjectId) {
    throw new Error(`Canonical object identifier mismatch for ${envelope.domain}.`);
  }
  assertNonEmpty(envelope.governanceVersion, "governanceVersion");
  assertNonEmpty(envelope.replayRef, "replayRef");
  assertIsoTimestamp(envelope.lifecycle.effectiveAt, "lifecycle.effectiveAt");
  assertIsoTimestamp(envelope.lifecycle.recordedAt, "lifecycle.recordedAt");
  normalizedRefs(envelope.provenanceRefs, "provenanceRefs");
  normalizedRefs(envelope.auditRefs, "auditRefs");
  normalizedRefs(envelope.versionRefs, "versionRefs");
  if (envelope.classification.replayClassificationContext.replayRef !== envelope.replayRef) {
    throw new Error("Classification replay reference must match the canonical replay reference.");
  }
}

export const canonicalInstitutionalObjectAuthority = Object.freeze({
  domains: canonicalDomainRegistry,
  resolve: getCanonicalInstitutionalAuthority,
  create: createCanonicalInstitutionalObject,
  validate: validateCanonicalInstitutionalObject,
});
