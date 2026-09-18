import { createCanonicalIdentity } from "@/lib/platform/canonicalIdentityAuthority";
import {
  UNIVERSAL_INSTITUTIONAL_GRAPH_SCHEMA_VERSION,
  createUniversalInstitutionalGraph,
  traverseInstitutionalGraph,
  validateUniversalInstitutionalGraph,
} from "@/lib/platform/universalInstitutionalGraphRuntime";

function assert(condition: boolean, message: string): asserts condition { if (!condition) throw new Error(message); }
function expectFailure(operation: () => unknown, expected: string): void {
  try { operation(); } catch (error) {
    assert(error instanceof Error && error.message.includes(expected), `Expected failure containing: ${expected}`);
    return;
  }
  throw new Error(`Expected operation to fail: ${expected}`);
}

const recordedAt = "2026-07-22T05:45:00.000Z";
const base = {
  schemaVersion: "canonical-identity-v1" as const,
  governanceVersion: "master-volume-series-2026-07",
  status: "ACTIVE" as const,
  confidence: "VERIFIED" as const,
  matchScore: 1,
  provenanceRefs: ["source:graph:verification"],
  auditRefs: ["audit:graph:verification"],
  replayRef: "replay:graph:verification",
  versionRefs: ["version:graph:verification"],
  supersededBy: [], createdAt: recordedAt, recordedAt,
};
const organization = createCanonicalIdentity({ ...base, canonicalIdentityId: "identity:organization:ares", domain: "organization", aliases: ["Ares Farms"] });
const property = createCanonicalIdentity({ ...base, canonicalIdentityId: "identity:property:federalsburg", domain: "property", aliases: ["Federalsburg Farm"] });
const asset = createCanonicalIdentity({ ...base, canonicalIdentityId: "identity:asset:tractor", domain: "asset", aliases: ["Primary Tractor"] });

const relationships = [
  {
    relationshipId: "relationship:ares-operates-farm", relationshipType: "OPERATES",
    sourceCanonicalObjectId: "organization:ares", targetCanonicalObjectId: "property:federalsburg",
    state: "ACTIVE" as const, confidence: "VERIFIED" as const, effectiveAt: recordedAt, recordedAt,
    provenanceRefs: ["source:relationship:one"], auditRefs: ["audit:relationship:one"],
    replayRef: "replay:relationship:one", versionRefs: ["version:relationship:one"], attributes: {},
  },
  {
    relationshipId: "relationship:farm-contains-tractor", relationshipType: "CONTAINS",
    sourceCanonicalObjectId: "property:federalsburg", targetCanonicalObjectId: "asset:tractor",
    state: "ACTIVE" as const, confidence: "CORROBORATED" as const, effectiveAt: recordedAt, recordedAt,
    provenanceRefs: ["source:relationship:two"], auditRefs: ["audit:relationship:two"],
    replayRef: "replay:relationship:two", versionRefs: ["version:relationship:two"], attributes: {},
  },
];
const bindings = {
  "organization:ares": organization.canonicalIdentityId,
  "property:federalsburg": property.canonicalIdentityId,
  "asset:tractor": asset.canonicalIdentityId,
};
const graph = createUniversalInstitutionalGraph({ governanceVersion: base.governanceVersion, replayRef: base.replayRef, identities: [organization, property, asset], objectBindings: bindings, relationships });
validateUniversalInstitutionalGraph(graph);
const traversal = traverseInstitutionalGraph(graph, organization.canonicalIdentityId, { direction: "OUTBOUND", maxDepth: 2 });
assert(graph.schemaVersion === UNIVERSAL_INSTITUTIONAL_GRAPH_SCHEMA_VERSION, "Graph schema drifted.");
assert(traversal.nodeIds.length === 3 && traversal.edgeIds.length === 2, "Two-hop traversal must reach the property and asset.");
assert(Object.isFrozen(graph) && Object.isFrozen(graph.nodes) && Object.isFrozen(graph.edges), "Graph must be immutable.");
expectFailure(() => createUniversalInstitutionalGraph({ governanceVersion: base.governanceVersion, replayRef: base.replayRef, identities: [organization, property], objectBindings: bindings, relationships }), "Unknown canonical identity binding");
expectFailure(() => createUniversalInstitutionalGraph({ governanceVersion: base.governanceVersion, replayRef: base.replayRef, identities: [organization, property, asset], objectBindings: { ...bindings, "property:federalsburg": organization.canonicalIdentityId }, relationships }), "self-reference");
console.log(JSON.stringify({ ok: true, schemaVersion: graph.schemaVersion, nodes: Object.keys(graph.nodes).length, edges: Object.keys(graph.edges).length, message: "Universal institutional graph runtime conformance passed." }, null, 2));
