import type { CanonicalDomainKey } from "@/lib/platform/canonicalDomainRegistry";
import type { CanonicalIdentityRecord } from "@/lib/platform/canonicalIdentityAuthority";

export const UNIVERSAL_INSTITUTIONAL_GRAPH_SCHEMA_VERSION = "universal-institutional-graph-v1";

export type InstitutionalGraphNode = Readonly<{
  canonicalIdentityId: string;
  domain: CanonicalDomainKey;
  canonicalObjectIds: readonly string[];
  status: CanonicalIdentityRecord["status"];
  confidence: CanonicalIdentityRecord["confidence"];
}>;

export type InstitutionalGraphEdge = Readonly<{
  relationshipId: string;
  relationshipType: string;
  sourceCanonicalIdentityId: string;
  targetCanonicalIdentityId: string;
  state: "PROPOSED" | "ACTIVE" | "SUPERSEDED" | "REVOKED";
  confidence: "ASSERTED" | "CORROBORATED" | "VERIFIED" | "DISPUTED";
  effectiveAt: string;
  recordedAt: string;
  provenanceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
  attributes: Readonly<Record<string, unknown>>;
}>;

export type UniversalInstitutionalGraph = Readonly<{
  schemaVersion: typeof UNIVERSAL_INSTITUTIONAL_GRAPH_SCHEMA_VERSION;
  governanceVersion: string;
  nodes: Readonly<Record<string, InstitutionalGraphNode>>;
  edges: Readonly<Record<string, InstitutionalGraphEdge>>;
  outboundIndex: Readonly<Record<string, readonly string[]>>;
  inboundIndex: Readonly<Record<string, readonly string[]>>;
  replayRef: string;
}>;

export type InstitutionalGraphRelationshipInput = Omit<InstitutionalGraphEdge,
  "sourceCanonicalIdentityId" | "targetCanonicalIdentityId"> & {
  sourceCanonicalObjectId: string;
  targetCanonicalObjectId: string;
};

function nonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} must be non-empty.`);
  return normalized;
}

function refs(values: readonly string[], field: string): readonly string[] {
  const normalized = values.map((value) => nonEmpty(value, field));
  if (!normalized.length) throw new Error(`${field} must contain at least one reference.`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`);
  return Object.freeze([...normalized]);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function freezeIndex(index: Record<string, string[]>): Readonly<Record<string, readonly string[]>> {
  return Object.freeze(Object.fromEntries(Object.entries(index)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => [key, uniqueSorted(values)])));
}

export function createUniversalInstitutionalGraph(input: {
  governanceVersion: string;
  replayRef: string;
  identities: readonly CanonicalIdentityRecord[];
  objectBindings: Readonly<Record<string, string>>;
  relationships: readonly InstitutionalGraphRelationshipInput[];
}): UniversalInstitutionalGraph {
  const governanceVersion = nonEmpty(input.governanceVersion, "governanceVersion");
  const replayRef = nonEmpty(input.replayRef, "replayRef");
  const identities = new Map(input.identities.map((identity) => [identity.canonicalIdentityId, identity]));
  const objectIdsByIdentity = new Map<string, string[]>();

  for (const [canonicalObjectId, canonicalIdentityId] of Object.entries(input.objectBindings)) {
    nonEmpty(canonicalObjectId, "objectBindings.canonicalObjectId");
    if (!identities.has(canonicalIdentityId)) throw new Error(`Unknown canonical identity binding: ${canonicalIdentityId}`);
    (objectIdsByIdentity.get(canonicalIdentityId) ?? objectIdsByIdentity.set(canonicalIdentityId, []).get(canonicalIdentityId)!).push(canonicalObjectId);
  }

  const nodes: Record<string, InstitutionalGraphNode> = {};
  for (const identity of [...input.identities].sort((a, b) => a.canonicalIdentityId.localeCompare(b.canonicalIdentityId))) {
    if (nodes[identity.canonicalIdentityId]) throw new Error(`Duplicate graph identity: ${identity.canonicalIdentityId}`);
    nodes[identity.canonicalIdentityId] = Object.freeze({
      canonicalIdentityId: identity.canonicalIdentityId,
      domain: identity.domain,
      canonicalObjectIds: uniqueSorted(objectIdsByIdentity.get(identity.canonicalIdentityId) ?? []),
      status: identity.status,
      confidence: identity.confidence,
    });
  }

  const edges: Record<string, InstitutionalGraphEdge> = {};
  const outboundIndex: Record<string, string[]> = {};
  const inboundIndex: Record<string, string[]> = {};
  for (const relationship of [...input.relationships].sort((a, b) => a.relationshipId.localeCompare(b.relationshipId))) {
    const sourceCanonicalIdentityId = input.objectBindings[relationship.sourceCanonicalObjectId];
    const targetCanonicalIdentityId = input.objectBindings[relationship.targetCanonicalObjectId];
    if (!sourceCanonicalIdentityId || !targetCanonicalIdentityId) throw new Error("Every graph relationship endpoint must resolve through a canonical identity binding.");
    if (sourceCanonicalIdentityId === targetCanonicalIdentityId) throw new Error("Graph relationships may not self-reference one canonical identity.");
    if (edges[relationship.relationshipId]) throw new Error(`Duplicate graph relationship: ${relationship.relationshipId}`);
    const edge = Object.freeze({
      relationshipId: nonEmpty(relationship.relationshipId, "relationshipId"),
      relationshipType: nonEmpty(relationship.relationshipType, "relationshipType"),
      sourceCanonicalIdentityId,
      targetCanonicalIdentityId,
      state: relationship.state,
      confidence: relationship.confidence,
      effectiveAt: nonEmpty(relationship.effectiveAt, "effectiveAt"),
      recordedAt: nonEmpty(relationship.recordedAt, "recordedAt"),
      provenanceRefs: refs(relationship.provenanceRefs, "provenanceRefs"),
      auditRefs: refs(relationship.auditRefs, "auditRefs"),
      replayRef: nonEmpty(relationship.replayRef, "relationship.replayRef"),
      versionRefs: refs(relationship.versionRefs, "versionRefs"),
      attributes: Object.freeze({ ...relationship.attributes }),
    });
    edges[edge.relationshipId] = edge;
    (outboundIndex[sourceCanonicalIdentityId] ??= []).push(edge.relationshipId);
    (inboundIndex[targetCanonicalIdentityId] ??= []).push(edge.relationshipId);
  }

  return Object.freeze({
    schemaVersion: UNIVERSAL_INSTITUTIONAL_GRAPH_SCHEMA_VERSION,
    governanceVersion,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    outboundIndex: freezeIndex(outboundIndex),
    inboundIndex: freezeIndex(inboundIndex),
    replayRef,
  });
}

export function traverseInstitutionalGraph(graph: UniversalInstitutionalGraph, startCanonicalIdentityId: string, options: {
  direction?: "OUTBOUND" | "INBOUND" | "BOTH";
  maxDepth?: number;
  relationshipTypes?: readonly string[];
} = {}): Readonly<{ nodeIds: readonly string[]; edgeIds: readonly string[] }> {
  if (!graph.nodes[startCanonicalIdentityId]) throw new Error("Traversal start identity does not exist.");
  const direction = options.direction ?? "BOTH";
  const maxDepth = options.maxDepth ?? 1;
  if (!Number.isInteger(maxDepth) || maxDepth < 0) throw new Error("maxDepth must be a non-negative integer.");
  const typeFilter = options.relationshipTypes ? new Set(options.relationshipTypes) : null;
  const visited = new Set([startCanonicalIdentityId]);
  const edgeIds = new Set<string>();
  let frontier = [startCanonicalIdentityId];
  for (let depth = 0; depth < maxDepth && frontier.length; depth += 1) {
    const next: string[] = [];
    for (const nodeId of frontier.sort()) {
      const candidateEdgeIds = uniqueSorted([
        ...(direction !== "INBOUND" ? graph.outboundIndex[nodeId] ?? [] : []),
        ...(direction !== "OUTBOUND" ? graph.inboundIndex[nodeId] ?? [] : []),
      ]);
      for (const edgeId of candidateEdgeIds) {
        const edge = graph.edges[edgeId];
        if (!edge || edge.state !== "ACTIVE" || (typeFilter && !typeFilter.has(edge.relationshipType))) continue;
        edgeIds.add(edgeId);
        const adjacent = edge.sourceCanonicalIdentityId === nodeId ? edge.targetCanonicalIdentityId : edge.sourceCanonicalIdentityId;
        if (!visited.has(adjacent)) { visited.add(adjacent); next.push(adjacent); }
      }
    }
    frontier = uniqueSorted(next) as string[];
  }
  return Object.freeze({ nodeIds: uniqueSorted([...visited]), edgeIds: uniqueSorted([...edgeIds]) });
}

export function validateUniversalInstitutionalGraph(graph: UniversalInstitutionalGraph): void {
  if (graph.schemaVersion !== UNIVERSAL_INSTITUTIONAL_GRAPH_SCHEMA_VERSION) throw new Error("Unsupported universal institutional graph schema.");
  nonEmpty(graph.governanceVersion, "governanceVersion");
  nonEmpty(graph.replayRef, "replayRef");
  for (const edge of Object.values(graph.edges)) {
    if (!graph.nodes[edge.sourceCanonicalIdentityId] || !graph.nodes[edge.targetCanonicalIdentityId]) throw new Error("Graph edge references an unknown canonical identity.");
    if (edge.sourceCanonicalIdentityId === edge.targetCanonicalIdentityId) throw new Error("Graph edge self-reference detected.");
  }
}

export const universalInstitutionalGraphRuntime = Object.freeze({
  create: createUniversalInstitutionalGraph,
  traverse: traverseInstitutionalGraph,
  validate: validateUniversalInstitutionalGraph,
});
