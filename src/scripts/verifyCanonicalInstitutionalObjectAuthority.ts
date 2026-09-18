import {
  CANONICAL_INSTITUTIONAL_OBJECT_SCHEMA_VERSION,
  canonicalInstitutionalObjectAuthority,
  createCanonicalInstitutionalObject,
  validateCanonicalInstitutionalObject,
} from "@/lib/platform/canonicalInstitutionalObjectAuthority";
import { canonicalDomainRegistry } from "@/lib/platform/canonicalDomainRegistry";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectFailure(operation: () => unknown, expected: string): void {
  try {
    operation();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(expected), `Expected failure containing: ${expected}`);
    return;
  }
  throw new Error(`Expected operation to fail: ${expected}`);
}

const recordedAt = "2026-07-21T18:00:00.000Z";

for (const domain of canonicalDomainRegistry) {
  const canonicalObjectId = `${domain.key}:verification-object`;
  const input = {
    domain: domain.key,
    canonicalObjectId,
    governanceVersion: "master-volume-series-2026-07",
    lifecycle: {
      state: "ACTIVE" as const,
      effectiveAt: recordedAt,
      recordedAt,
    },
    classification: {
      classificationLevel: "INTERNAL" as const,
      sensitivityScope: "institutional" as const,
      sharingPermissions: ["governed-platform-services"],
      aiUsagePermissions: ["derived-analysis-with-provenance"],
      retentionRequirements: "retain-per-governed-policy",
      disclosureAudience: ["authorized-operator"],
    },
    provenanceRefs: [`source:${domain.key}:verification`],
    auditRefs: [`audit:${domain.key}:verification`],
    replayRef: `replay:${domain.key}:verification`,
    versionRefs: [`version:${domain.key}:verification`],
    payload: {
      [domain.canonicalIdField]: canonicalObjectId,
      verificationOnly: true,
    },
  };

  const first = createCanonicalInstitutionalObject(input);
  const second = createCanonicalInstitutionalObject(input);
  validateCanonicalInstitutionalObject(first);

  assert(first.schemaVersion === CANONICAL_INSTITUTIONAL_OBJECT_SCHEMA_VERSION, "Schema version must be canonical.");
  assert(first.authority.module === domain.authorityModule, `${domain.key} authority module drifted.`);
  assert(first.authority.exportName === domain.authorityExport, `${domain.key} authority export drifted.`);
  assert(first.classification.replayClassificationContext.replayRef === first.replayRef, "Replay metadata must propagate.");
  assert(first.classification.replayClassificationContext.classifiedAt === recordedAt, "Classification time must be replay-safe.");
  assert(JSON.stringify(first) === JSON.stringify(second), `${domain.key} envelope creation must be deterministic.`);
  assert(Object.isFrozen(first) && Object.isFrozen(first.payload), `${domain.key} envelope must be immutable.`);
  assert(canonicalInstitutionalObjectAuthority.resolve(domain.key).implementation !== undefined, `${domain.key} authority must resolve.`);

  expectFailure(
    () => createCanonicalInstitutionalObject({ ...input, canonicalObjectId: "wrong-id" }),
    `payload.${domain.canonicalIdField}`
  );
  expectFailure(
    () => createCanonicalInstitutionalObject({ ...input, provenanceRefs: [] }),
    "provenanceRefs"
  );
}

console.log(JSON.stringify({
  ok: true,
  canonicalDomains: canonicalDomainRegistry.length,
  schemaVersion: CANONICAL_INSTITUTIONAL_OBJECT_SCHEMA_VERSION,
  guarantees: [
    "single authority resolver",
    "canonical identifier binding",
    "classification propagation",
    "provenance and audit references",
    "replay-safe deterministic timestamps",
    "immutable institutional envelopes",
  ],
  message: "Canonical institutional object authority conformance passed.",
}, null, 2));
