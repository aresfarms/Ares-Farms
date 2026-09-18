import type { InstitutionalClaimRecord } from "@/lib/platform/institutionalClaimAuthority";
import { evaluateInstitutionalClaim } from "@/lib/platform/institutionalClaimAuthority";
import type { UniversalInstitutionalGraph } from "@/lib/platform/universalInstitutionalGraphRuntime";

export const INSTITUTIONAL_PUBLICATION_SCHEMA_VERSION = "institutional-publication-v1";

export type PublicationSurface = "PUBLIC" | "BORROWER" | "LENDER" | "SPONSOR" | "INTERNAL" | "REGULATOR";
export type RelianceLevel = "ADVISORY_ONLY" | "INTERNAL_OPERATIONAL" | "CONTROLLED_INSTITUTIONAL" | "OFFICIAL";
export type PublicationDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";

export type InstitutionalPublicationPolicy = Readonly<{
  policyId: string;
  governanceVersion: string;
  surface: PublicationSurface;
  allowedAudiences: readonly string[];
  allowedAuthorityTypes: readonly string[];
  maximumRelianceLevel: RelianceLevel;
  requiredDisclosures: readonly string[];
  prohibitedPredicates: readonly string[];
  requireHumanReview: boolean;
  publicVerificationAuthorized: boolean;
  officialRelianceAuthorized: boolean;
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}>;

export type InstitutionalPublicationEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_PUBLICATION_SCHEMA_VERSION;
  claimId: string;
  policyId: string;
  surface: PublicationSurface;
  requestedRelianceLevel: RelianceLevel;
  decision: PublicationDecision;
  reasons: readonly string[];
  requiredDisclosures: readonly string[];
  evaluatedAt: string;
  auditRefs: readonly string[];
  replayRef: string;
}>;

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const relianceRank: Record<RelianceLevel, number> = {
  ADVISORY_ONLY: 0,
  INTERNAL_OPERATIONAL: 1,
  CONTROLLED_INSTITUTIONAL: 2,
  OFFICIAL: 3,
};

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

export function createInstitutionalPublicationPolicy(input: InstitutionalPublicationPolicy): InstitutionalPublicationPolicy {
  if (input.surface === "PUBLIC" && input.maximumRelianceLevel !== "ADVISORY_ONLY" && !input.publicVerificationAuthorized) {
    throw new Error("Public surfaces may exceed advisory reliance only with public verification authority.");
  }
  if (input.maximumRelianceLevel === "OFFICIAL" && !input.officialRelianceAuthorized) {
    throw new Error("Official reliance requires explicit official reliance authority.");
  }
  return Object.freeze({
    policyId: nonEmpty(input.policyId, "policyId"),
    governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"),
    surface: input.surface,
    allowedAudiences: list(input.allowedAudiences, "allowedAudiences"),
    allowedAuthorityTypes: list(input.allowedAuthorityTypes, "allowedAuthorityTypes"),
    maximumRelianceLevel: input.maximumRelianceLevel,
    requiredDisclosures: list(input.requiredDisclosures, "requiredDisclosures", false),
    prohibitedPredicates: list(input.prohibitedPredicates, "prohibitedPredicates", false),
    requireHumanReview: input.requireHumanReview,
    publicVerificationAuthorized: input.publicVerificationAuthorized,
    officialRelianceAuthorized: input.officialRelianceAuthorized,
    auditRefs: list(input.auditRefs, "auditRefs"),
    replayRef: nonEmpty(input.replayRef, "replayRef"),
    versionRefs: list(input.versionRefs, "versionRefs"),
  });
}

export function evaluateInstitutionalPublication(input: {
  claim: InstitutionalClaimRecord;
  graph: UniversalInstitutionalGraph;
  policy: InstitutionalPublicationPolicy;
  requestedRelianceLevel: RelianceLevel;
  audience: string;
  evaluatedAt: string;
  humanReviewRef?: string | null;
  auditRefs: readonly string[];
  replayRef: string;
}): InstitutionalPublicationEvaluation {
  iso(input.evaluatedAt, "evaluatedAt");
  const policy = createInstitutionalPublicationPolicy(input.policy);
  const audience = nonEmpty(input.audience, "audience");
  const reasons: string[] = [];
  const claimEvaluation = evaluateInstitutionalClaim(input.claim, input.graph, input.evaluatedAt);
  reasons.push(...claimEvaluation.reasons.map((reason) => `claim:${reason}`));
  if (!policy.allowedAudiences.includes(audience) || !input.claim.audience.includes(audience)) reasons.push("audience-not-authorized");
  if (!policy.allowedAuthorityTypes.includes(input.claim.authority.authorityType)) reasons.push("authority-type-not-authorized");
  if (policy.prohibitedPredicates.includes(input.claim.predicate)) reasons.push("predicate-prohibited");
  if (relianceRank[input.requestedRelianceLevel] > relianceRank[policy.maximumRelianceLevel]) reasons.push("reliance-exceeds-policy");
  if (policy.surface === "PUBLIC" && input.requestedRelianceLevel !== "ADVISORY_ONLY" && !policy.publicVerificationAuthorized) reasons.push("public-verification-not-authorized");
  if (input.requestedRelianceLevel === "OFFICIAL" && !policy.officialRelianceAuthorized) reasons.push("official-reliance-not-authorized");
  if (policy.requireHumanReview && !input.humanReviewRef?.trim()) reasons.push("human-review-required");
  const hardBlock = reasons.some((reason) => reason !== "human-review-required");
  const decision: PublicationDecision = hardBlock ? "BLOCK" : reasons.includes("human-review-required") ? "REVIEW_REQUIRED" : "ALLOW";
  return Object.freeze({
    schemaVersion: INSTITUTIONAL_PUBLICATION_SCHEMA_VERSION,
    claimId: input.claim.claimId,
    policyId: policy.policyId,
    surface: policy.surface,
    requestedRelianceLevel: input.requestedRelianceLevel,
    decision,
    reasons: Object.freeze([...new Set(reasons)].sort()),
    requiredDisclosures: policy.requiredDisclosures,
    evaluatedAt: input.evaluatedAt,
    auditRefs: list(input.auditRefs, "auditRefs"),
    replayRef: nonEmpty(input.replayRef, "replayRef"),
  });
}

export const institutionalPublicationAuthority = Object.freeze({
  createPolicy: createInstitutionalPublicationPolicy,
  evaluate: evaluateInstitutionalPublication,
});
