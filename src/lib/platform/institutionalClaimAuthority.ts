import type { UniversalInstitutionalGraph } from "@/lib/platform/universalInstitutionalGraphRuntime";

export const INSTITUTIONAL_CLAIM_SCHEMA_VERSION = "institutional-claim-v1";

export type InstitutionalClaimVerification = "UNVERIFIED" | "ASSERTED" | "CORROBORATED" | "VERIFIED" | "DISPUTED" | "REVOKED";
export type InstitutionalClaimState = "DRAFT" | "ACTIVE" | "EXPIRED" | "SUPERSEDED" | "REVOKED";

export type InstitutionalClaimRecord = Readonly<{
  claimId: string;
  schemaVersion: typeof INSTITUTIONAL_CLAIM_SCHEMA_VERSION;
  governanceVersion: string;
  subjectCanonicalIdentityId: string;
  predicate: string;
  value: Readonly<Record<string, unknown>>;
  authority: Readonly<{ authorityId: string; authorityType: string; scope: readonly string[] }>;
  basis: Readonly<{ nodeIds: readonly string[]; edgeIds: readonly string[]; sourceRefs: readonly string[] }>;
  verificationStatus: InstitutionalClaimVerification;
  state: InstitutionalClaimState;
  audience: readonly string[];
  effectiveAt: string;
  expiresAt?: string | null;
  recordedAt: string;
  validationRefs: readonly string[];
  escalationRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}>;

export type CreateInstitutionalClaimInput = Omit<InstitutionalClaimRecord, "schemaVersion" | "authority" | "basis"> & {
  authority: { authorityId: string; authorityType: string; scope: readonly string[] };
  basis: { nodeIds?: readonly string[]; edgeIds?: readonly string[]; sourceRefs: readonly string[] };
};

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} must be non-empty.`);
  return normalized;
}
function iso(value: string, field: string): string {
  if (!ISO_UTC.test(nonEmpty(value, field))) throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`);
  return value;
}
function list(values: readonly string[], field: string, required = true): readonly string[] {
  const normalized = values.map((value) => nonEmpty(value, field));
  if (required && !normalized.length) throw new Error(`${field} must contain at least one value.`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`);
  return Object.freeze([...normalized].sort());
}

export function createInstitutionalClaim(input: CreateInstitutionalClaimInput): InstitutionalClaimRecord {
  iso(input.effectiveAt, "effectiveAt");
  iso(input.recordedAt, "recordedAt");
  if (input.expiresAt) {
    iso(input.expiresAt, "expiresAt");
    if (input.expiresAt <= input.effectiveAt) throw new Error("expiresAt must be later than effectiveAt.");
  }
  if (input.state === "ACTIVE" && input.verificationStatus === "REVOKED") throw new Error("A revoked claim cannot remain active.");
  return Object.freeze({
    claimId: nonEmpty(input.claimId, "claimId"), schemaVersion: INSTITUTIONAL_CLAIM_SCHEMA_VERSION,
    governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"),
    subjectCanonicalIdentityId: nonEmpty(input.subjectCanonicalIdentityId, "subjectCanonicalIdentityId"),
    predicate: nonEmpty(input.predicate, "predicate"), value: Object.freeze({ ...input.value }),
    authority: Object.freeze({ authorityId: nonEmpty(input.authority.authorityId, "authority.authorityId"), authorityType: nonEmpty(input.authority.authorityType, "authority.authorityType"), scope: list(input.authority.scope, "authority.scope") }),
    basis: Object.freeze({ nodeIds: list(input.basis.nodeIds ?? [], "basis.nodeIds", false), edgeIds: list(input.basis.edgeIds ?? [], "basis.edgeIds", false), sourceRefs: list(input.basis.sourceRefs, "basis.sourceRefs") }),
    verificationStatus: input.verificationStatus, state: input.state, audience: list(input.audience, "audience"),
    effectiveAt: input.effectiveAt, expiresAt: input.expiresAt ?? null, recordedAt: input.recordedAt,
    validationRefs: list(input.validationRefs, "validationRefs"), escalationRefs: list(input.escalationRefs, "escalationRefs", false),
    auditRefs: list(input.auditRefs, "auditRefs"), replayRef: nonEmpty(input.replayRef, "replayRef"), versionRefs: list(input.versionRefs, "versionRefs"),
  });
}

export function evaluateInstitutionalClaim(claim: InstitutionalClaimRecord, graph: UniversalInstitutionalGraph, at: string): Readonly<{ publishable: boolean; reasons: readonly string[] }> {
  iso(at, "at");
  const reasons: string[] = [];
  if (!graph.nodes[claim.subjectCanonicalIdentityId]) reasons.push("unknown-subject-identity");
  for (const nodeId of claim.basis.nodeIds) if (!graph.nodes[nodeId]) reasons.push(`unknown-basis-node:${nodeId}`);
  for (const edgeId of claim.basis.edgeIds) if (!graph.edges[edgeId]) reasons.push(`unknown-basis-edge:${edgeId}`);
  if (claim.state !== "ACTIVE") reasons.push(`claim-state:${claim.state.toLowerCase()}`);
  if (claim.verificationStatus !== "VERIFIED" && claim.verificationStatus !== "CORROBORATED") reasons.push(`verification:${claim.verificationStatus.toLowerCase()}`);
  if (at < claim.effectiveAt) reasons.push("not-yet-effective");
  if (claim.expiresAt && at >= claim.expiresAt) reasons.push("expired");
  return Object.freeze({ publishable: reasons.length === 0, reasons: Object.freeze([...reasons].sort()) });
}

export function validateInstitutionalClaim(claim: InstitutionalClaimRecord, graph?: UniversalInstitutionalGraph): void {
  if (claim.schemaVersion !== INSTITUTIONAL_CLAIM_SCHEMA_VERSION) throw new Error("Unsupported institutional claim schema.");
  createInstitutionalClaim({ ...claim, authority: claim.authority, basis: claim.basis });
  if (graph) {
    const evaluated = evaluateInstitutionalClaim(claim, graph, claim.effectiveAt);
    if (evaluated.reasons.some((reason) => reason.startsWith("unknown-"))) throw new Error("Institutional claim basis must resolve within the graph.");
  }
}

export const institutionalClaimAuthority = Object.freeze({ create: createInstitutionalClaim, evaluate: evaluateInstitutionalClaim, validate: validateInstitutionalClaim });
