import { createCanonicalIdentity } from "@/lib/platform/canonicalIdentityAuthority";
import { createUniversalInstitutionalGraph } from "@/lib/platform/universalInstitutionalGraphRuntime";
import { createInstitutionalClaim, evaluateInstitutionalClaim, validateInstitutionalClaim, INSTITUTIONAL_CLAIM_SCHEMA_VERSION } from "@/lib/platform/institutionalClaimAuthority";
function assert(condition: boolean, message: string): asserts condition { if (!condition) throw new Error(message); }
function expectFailure(fn: () => unknown, text: string): void { try { fn(); } catch (error) { assert(error instanceof Error && error.message.includes(text), `Expected ${text}`); return; } throw new Error(`Expected failure: ${text}`); }
const now = "2026-07-22T05:40:00.000Z";
const identity = createCanonicalIdentity({ canonicalIdentityId: "identity:property:claim-test", domain: "property", governanceVersion: "master-volume-series-2026-07", status: "ACTIVE", aliases: ["123 Main Street"], confidence: "VERIFIED", matchScore: 1, provenanceRefs: ["source:property"], auditRefs: ["audit:property"], replayRef: "replay:property", versionRefs: ["version:property"], createdAt: now, recordedAt: now });
const graph = createUniversalInstitutionalGraph({ governanceVersion: "master-volume-series-2026-07", replayRef: "replay:graph:claim-test", identities: [identity], objectBindings: { "property:claim-test": identity.canonicalIdentityId }, relationships: [] });
const claim = createInstitutionalClaim({ claimId: "claim:property-location:claim-test", governanceVersion: "master-volume-series-2026-07", subjectCanonicalIdentityId: identity.canonicalIdentityId, predicate: "HAS_RECORDED_LOCATION", value: { locality: "Example County" }, authority: { authorityId: "authority:county-records", authorityType: "AUTHORITATIVE_PUBLIC_SOURCE", scope: ["property-location"] }, basis: { nodeIds: [identity.canonicalIdentityId], sourceRefs: ["source:county-record"] }, verificationStatus: "VERIFIED", state: "ACTIVE", audience: ["public-safe"], effectiveAt: now, expiresAt: "2027-07-22T05:40:00.000Z", recordedAt: now, validationRefs: ["validation:county-record"], escalationRefs: [], auditRefs: ["audit:claim"], replayRef: "replay:claim", versionRefs: ["version:claim"] });
validateInstitutionalClaim(claim, graph);
const evaluation = evaluateInstitutionalClaim(claim, graph, "2026-08-01T00:00:00.000Z");
assert(evaluation.publishable, "Verified active claim should be publishable.");
assert(Object.isFrozen(claim) && Object.isFrozen(claim.authority) && Object.isFrozen(claim.basis), "Claim must be immutable.");
assert(claim.schemaVersion === INSTITUTIONAL_CLAIM_SCHEMA_VERSION, "Claim schema drifted.");
const expired = evaluateInstitutionalClaim(claim, graph, "2028-01-01T00:00:00.000Z");
assert(!expired.publishable && expired.reasons.includes("expired"), "Expired claim must fail closed.");
expectFailure(() => createInstitutionalClaim({ ...claim, expiresAt: now, authority: claim.authority, basis: claim.basis }), "later than effectiveAt");
console.log(JSON.stringify({ ok: true, schemaVersion: INSTITUTIONAL_CLAIM_SCHEMA_VERSION, publishable: evaluation.publishable, message: "Institutional claim authority conformance passed." }, null, 2));
