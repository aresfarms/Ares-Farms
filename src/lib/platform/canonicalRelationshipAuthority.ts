import type { CanonicalDomainKey } from "@/lib/platform/canonicalDomainRegistry";
import { createClassificationMetadata } from "@/lib/runtime/classificationRuntime";
import type { ClassificationInput } from "@/lib/runtime/classificationRuntime";

export const CANONICAL_RELATIONSHIP_SCHEMA_VERSION = "canonical-relationship-v1";

export type CanonicalRelationshipState = "PROPOSED" | "ACTIVE" | "SUPERSEDED" | "REVOKED";
export type CanonicalRelationshipConfidence = "ASSERTED" | "CORROBORATED" | "VERIFIED" | "DISPUTED";

export type CanonicalObjectRef = Readonly<{
  domain: CanonicalDomainKey;
  canonicalObjectId: string;
}>;

export type CanonicalRelationshipEnvelope = Readonly<{
  relationshipId: string;
  relationshipType: string;
  schemaVersion: typeof CANONICAL_RELATIONSHIP_SCHEMA_VERSION;
  governanceVersion: string;
  source: CanonicalObjectRef;
  target: CanonicalObjectRef;
  state: CanonicalRelationshipState;
  confidence: CanonicalRelationshipConfidence;
  effectiveAt: string;
  recordedAt: string;
  expiresAt?: string | null;
  classification: ReturnType<typeof createClassificationMetadata>;
  provenanceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
  attributes: Readonly<Record<string, unknown>>;
}>;

export type CreateCanonicalRelationshipInput = {
  relationshipId: string;
  relationshipType: string;
  governanceVersion: string;
  source: CanonicalObjectRef;
  target: CanonicalObjectRef;
  state: CanonicalRelationshipState;
  confidence: CanonicalRelationshipConfidence;
  effectiveAt: string;
  recordedAt: string;
  expiresAt?: string | null;
  classification: ClassificationInput;
  provenanceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
  attributes?: Record<string, unknown>;
};

function nonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} must be non-empty.`);
  return normalized;
}

function iso(value: string, field: string): string {
  nonEmpty(value, field);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`);
  }
  return value;
}

function refs(values: readonly string[], field: string): readonly string[] {
  const normalized = values.map((value) => nonEmpty(value, field));
  if (normalized.length === 0) throw new Error(`${field} must contain at least one reference.`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`);
  return Object.freeze(normalized);
}

export function createCanonicalRelationship(input: CreateCanonicalRelationshipInput): CanonicalRelationshipEnvelope {
  const relationshipId = nonEmpty(input.relationshipId, "relationshipId");
  const relationshipType = nonEmpty(input.relationshipType, "relationshipType");
  nonEmpty(input.governanceVersion, "governanceVersion");
  nonEmpty(input.source.canonicalObjectId, "source.canonicalObjectId");
  nonEmpty(input.target.canonicalObjectId, "target.canonicalObjectId");
  if (input.source.domain === input.target.domain && input.source.canonicalObjectId === input.target.canonicalObjectId) {
    throw new Error("A canonical relationship may not self-reference the same object.");
  }
  iso(input.effectiveAt, "effectiveAt");
  iso(input.recordedAt, "recordedAt");
  if (input.expiresAt) iso(input.expiresAt, "expiresAt");
  const classification = createClassificationMetadata({
    ...input.classification,
    replayRef: input.replayRef,
    classificationSource: input.classification.classificationSource ?? "canonical-relationship-authority",
    classificationVersion: input.classification.classificationVersion ?? input.governanceVersion,
  });
  classification.replayClassificationContext.classifiedAt = input.recordedAt;
  return Object.freeze({
    relationshipId,
    relationshipType,
    schemaVersion: CANONICAL_RELATIONSHIP_SCHEMA_VERSION,
    governanceVersion: input.governanceVersion,
    source: Object.freeze({ ...input.source }),
    target: Object.freeze({ ...input.target }),
    state: input.state,
    confidence: input.confidence,
    effectiveAt: input.effectiveAt,
    recordedAt: input.recordedAt,
    expiresAt: input.expiresAt ?? null,
    classification: Object.freeze({ ...classification, replayClassificationContext: Object.freeze({ ...classification.replayClassificationContext }) }),
    provenanceRefs: refs(input.provenanceRefs, "provenanceRefs"),
    auditRefs: refs(input.auditRefs, "auditRefs"),
    replayRef: nonEmpty(input.replayRef, "replayRef"),
    versionRefs: refs(input.versionRefs, "versionRefs"),
    attributes: Object.freeze({ ...(input.attributes ?? {}) }),
  });
}

export function validateCanonicalRelationship(relationship: CanonicalRelationshipEnvelope): void {
  if (relationship.schemaVersion !== CANONICAL_RELATIONSHIP_SCHEMA_VERSION) throw new Error("Unsupported canonical relationship schema.");
  nonEmpty(relationship.relationshipId, "relationshipId");
  nonEmpty(relationship.relationshipType, "relationshipType");
  nonEmpty(relationship.governanceVersion, "governanceVersion");
  nonEmpty(relationship.source.canonicalObjectId, "source.canonicalObjectId");
  nonEmpty(relationship.target.canonicalObjectId, "target.canonicalObjectId");
  if (relationship.source.domain === relationship.target.domain && relationship.source.canonicalObjectId === relationship.target.canonicalObjectId) {
    throw new Error("A canonical relationship may not self-reference the same object.");
  }
  iso(relationship.effectiveAt, "effectiveAt");
  iso(relationship.recordedAt, "recordedAt");
  if (relationship.expiresAt) iso(relationship.expiresAt, "expiresAt");
  refs(relationship.provenanceRefs, "provenanceRefs");
  refs(relationship.auditRefs, "auditRefs");
  refs(relationship.versionRefs, "versionRefs");
  if (relationship.classification.replayClassificationContext.replayRef !== relationship.replayRef) {
    throw new Error("Classification replay reference must match relationship replay reference.");
  }
}

export const canonicalRelationshipAuthority = Object.freeze({
  create: createCanonicalRelationship,
  validate: validateCanonicalRelationship,
});
