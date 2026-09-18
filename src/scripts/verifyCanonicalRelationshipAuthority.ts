import { canonicalDomainRegistry } from "@/lib/platform/canonicalDomainRegistry";
import {
  CANONICAL_RELATIONSHIP_SCHEMA_VERSION,
  createCanonicalRelationship,
  validateCanonicalRelationship,
} from "@/lib/platform/canonicalRelationshipAuthority";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function expectFailure(operation: () => unknown, expected: string): void {
  try { operation(); } catch (error) {
    assert(error instanceof Error && error.message.includes(expected), `Expected failure containing: ${expected}`);
    return;
  }
  throw new Error(`Expected operation to fail: ${expected}`);
}

const recordedAt = "2026-07-22T05:30:00.000Z";
const relationship = createCanonicalRelationship({
  relationshipId: "relationship:organization-operates-property:verification",
  relationshipType: "OPERATES",
  governanceVersion: "master-volume-series-2026-07",
  source: { domain: "organization", canonicalObjectId: "organization:verification" },
  target: { domain: "property", canonicalObjectId: "property:verification" },
  state: "ACTIVE",
  confidence: "VERIFIED",
  effectiveAt: recordedAt,
  recordedAt,
  classification: {
    classificationLevel: "INTERNAL",
    sensitivityScope: "institutional",
    sharingPermissions: ["governed-platform-services"],
    aiUsagePermissions: ["derived-analysis-with-provenance"],
    retentionRequirements: "retain-per-governed-policy",
    disclosureAudience: ["authorized-operator"],
  },
  provenanceRefs: ["source:relationship:verification"],
  auditRefs: ["audit:relationship:verification"],
  replayRef: "replay:relationship:verification",
  versionRefs: ["version:relationship:verification"],
  attributes: { authorityBasis: "verification-only" },
});
validateCanonicalRelationship(relationship);
assert(relationship.schemaVersion === CANONICAL_RELATIONSHIP_SCHEMA_VERSION, "Schema version drifted.");
assert(Object.isFrozen(relationship) && Object.isFrozen(relationship.source) && Object.isFrozen(relationship.attributes), "Relationship must be immutable.");
assert(relationship.classification.replayClassificationContext.replayRef === relationship.replayRef, "Replay context must propagate.");
assert(canonicalDomainRegistry.some((entry) => entry.key === relationship.source.domain), "Source domain must be canonical.");
assert(canonicalDomainRegistry.some((entry) => entry.key === relationship.target.domain), "Target domain must be canonical.");
expectFailure(() => createCanonicalRelationship({ ...relationship, source: relationship.target, target: relationship.target }), "self-reference");
expectFailure(() => createCanonicalRelationship({ ...relationship, provenanceRefs: [] }), "provenanceRefs");
console.log(JSON.stringify({ ok: true, schemaVersion: CANONICAL_RELATIONSHIP_SCHEMA_VERSION, message: "Canonical relationship authority conformance passed." }, null, 2));
