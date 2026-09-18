import {
  CANONICAL_IDENTITY_SCHEMA_VERSION,
  createCanonicalIdentity,
  createCanonicalIdentityRegistry,
  mergeCanonicalIdentities,
  resolveCanonicalIdentity,
  validateCanonicalIdentity,
} from "@/lib/platform/canonicalIdentityAuthority";

function assert(condition: boolean, message: string): asserts condition { if (!condition) throw new Error(message); }
function expectFailure(operation: () => unknown, expected: string): void {
  try { operation(); } catch (error) { assert(error instanceof Error && error.message.includes(expected), `Expected failure containing: ${expected}`); return; }
  throw new Error(`Expected operation to fail: ${expected}`);
}
const recordedAt = "2026-07-22T06:00:00.000Z";
const base = {
  domain: "property" as const, governanceVersion: "master-volume-series-2026-07", status: "ACTIVE" as const,
  confidence: "VERIFIED" as const, matchScore: 1, provenanceRefs: ["source:identity:verification"],
  auditRefs: ["audit:identity:verification"], replayRef: "replay:identity:verification",
  versionRefs: ["version:identity:verification"], createdAt: recordedAt, recordedAt,
};
const primary = createCanonicalIdentity({ ...base, canonicalIdentityId: "identity:property:123-main", aliases: ["123 Main Street", "123 MAIN ST"], externalIdentifiers: [{ namespace: "parcel", value: "18-03-456" }, { namespace: "MLS", value: "123456" }] });
const duplicate = createCanonicalIdentity({ ...base, canonicalIdentityId: "identity:property:legacy-123-main", aliases: ["123 Main St."], externalIdentifiers: [], confidence: "CORROBORATED", matchScore: 0.92 });
validateCanonicalIdentity(primary);
assert(primary.schemaVersion === CANONICAL_IDENTITY_SCHEMA_VERSION, "Schema version drifted.");
assert(Object.isFrozen(primary) && Object.isFrozen(primary.aliases), "Identity records must be immutable.");
let registry = createCanonicalIdentityRegistry([duplicate, primary]);
const resolved = resolveCanonicalIdentity(registry, { domain: "property", aliases: ["123 main street"], externalIdentifiers: [{ namespace: "parcel", value: "18-03-456" }] });
assert(resolved.canonicalIdentityId === primary.canonicalIdentityId, "Deterministic identity resolution failed.");
assert(resolved.candidates[0]?.score === 1, "Exact alias and external identifier should produce a perfect score.");
const merged = mergeCanonicalIdentities([primary, duplicate], primary.canonicalIdentityId, [duplicate.canonicalIdentityId], "2026-07-22T06:01:00.000Z");
registry = createCanonicalIdentityRegistry(merged);
assert(registry.records[duplicate.canonicalIdentityId]?.status === "MERGED", "Merge governance did not retire the source identity.");
assert(registry.records[duplicate.canonicalIdentityId]?.supersededBy[0] === primary.canonicalIdentityId, "Merge lineage was not retained.");
assert(registry.records[primary.canonicalIdentityId]?.aliases.length === 1, "Normalized aliases should deduplicate deterministically.");
expectFailure(() => createCanonicalIdentity({ ...base, canonicalIdentityId: "identity:bad", aliases: [], externalIdentifiers: [] }), "aliases");
expectFailure(() => createCanonicalIdentity({ ...base, canonicalIdentityId: "identity:bad-score", aliases: ["bad"], matchScore: 2 }), "matchScore");
console.log(JSON.stringify({ ok: true, schemaVersion: CANONICAL_IDENTITY_SCHEMA_VERSION, resolvedIdentityId: resolved.canonicalIdentityId, message: "Canonical identity authority conformance passed." }, null, 2));
