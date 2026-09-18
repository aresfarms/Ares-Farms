import type { InstitutionalPublicationEvaluation, RelianceLevel } from "@/lib/platform/institutionalPublicationAuthority";

export const INSTITUTIONAL_RELIANCE_SCHEMA_VERSION = "institutional-reliance-v1";

export type InstitutionalReliancePurpose =
  | "INFORMATIONAL"
  | "INTERNAL_WORKFLOW"
  | "INSTITUTIONAL_REVIEW"
  | "REGULATORY_SUBMISSION"
  | "LEGAL_DETERMINATION"
  | "OFFICIAL_DECISION";
export type InstitutionalRelianceDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";

export type InstitutionalReliancePolicy = Readonly<{
  policyId: string;
  governanceVersion: string;
  allowedPurposes: readonly InstitutionalReliancePurpose[];
  maximumRelianceLevel: RelianceLevel;
  requiredAuthorityTypes: readonly string[];
  requireHumanAuthority: boolean;
  requireLegalComplianceReview: boolean;
  regulatoryRelianceAuthorized: boolean;
  legalRelianceAuthorized: boolean;
  officialDecisionAuthorized: boolean;
  requiredEvidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}>;

export type InstitutionalRelianceEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_RELIANCE_SCHEMA_VERSION;
  publicationPolicyId: string;
  reliancePolicyId: string;
  claimId: string;
  purpose: InstitutionalReliancePurpose;
  requestedRelianceLevel: RelianceLevel;
  decision: InstitutionalRelianceDecision;
  reasons: readonly string[];
  evaluatedAt: string;
  authorityRefs: readonly string[];
  evidenceRefs: readonly string[];
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
function list<T extends string>(values: readonly T[], field: string, required = true): readonly T[] {
  const normalized = values.map((value) => nonEmpty(value, field) as T);
  if (required && !normalized.length) throw new Error(`${field} must contain at least one value.`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`);
  return Object.freeze([...normalized].sort()) as readonly T[];
}

export function createInstitutionalReliancePolicy(input: InstitutionalReliancePolicy): InstitutionalReliancePolicy {
  if (input.allowedPurposes.includes("REGULATORY_SUBMISSION") && !input.regulatoryRelianceAuthorized) {
    throw new Error("Regulatory submission purpose requires regulatory reliance authority.");
  }
  if (input.allowedPurposes.includes("LEGAL_DETERMINATION") && !input.legalRelianceAuthorized) {
    throw new Error("Legal determination purpose requires legal reliance authority.");
  }
  if (input.allowedPurposes.includes("OFFICIAL_DECISION") && !input.officialDecisionAuthorized) {
    throw new Error("Official decision purpose requires official decision authority.");
  }
  return Object.freeze({
    policyId: nonEmpty(input.policyId, "policyId"),
    governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"),
    allowedPurposes: list(input.allowedPurposes, "allowedPurposes"),
    maximumRelianceLevel: input.maximumRelianceLevel,
    requiredAuthorityTypes: list(input.requiredAuthorityTypes, "requiredAuthorityTypes"),
    requireHumanAuthority: input.requireHumanAuthority,
    requireLegalComplianceReview: input.requireLegalComplianceReview,
    regulatoryRelianceAuthorized: input.regulatoryRelianceAuthorized,
    legalRelianceAuthorized: input.legalRelianceAuthorized,
    officialDecisionAuthorized: input.officialDecisionAuthorized,
    requiredEvidenceRefs: list(input.requiredEvidenceRefs, "requiredEvidenceRefs", false),
    auditRefs: list(input.auditRefs, "auditRefs"),
    replayRef: nonEmpty(input.replayRef, "replayRef"),
    versionRefs: list(input.versionRefs, "versionRefs"),
  });
}

export function evaluateInstitutionalReliance(input: {
  publication: InstitutionalPublicationEvaluation;
  policy: InstitutionalReliancePolicy;
  purpose: InstitutionalReliancePurpose;
  requestedRelianceLevel: RelianceLevel;
  authorityTypes: readonly string[];
  authorityRefs?: readonly string[];
  legalComplianceReviewRef?: string | null;
  evidenceRefs: readonly string[];
  evaluatedAt: string;
  auditRefs: readonly string[];
  replayRef: string;
}): InstitutionalRelianceEvaluation {
  iso(input.evaluatedAt, "evaluatedAt");
  const policy = createInstitutionalReliancePolicy(input.policy);
  const authorityTypes = list(input.authorityTypes, "authorityTypes", false);
  const authorityRefs = list(input.authorityRefs ?? [], "authorityRefs", false);
  const evidenceRefs = list(input.evidenceRefs, "evidenceRefs", false);
  const reasons: string[] = [];

  if (input.publication.decision !== "ALLOW") reasons.push(`publication:${input.publication.decision.toLowerCase()}`);
  if (!policy.allowedPurposes.includes(input.purpose)) reasons.push("purpose-not-authorized");
  if (relianceRank[input.requestedRelianceLevel] > relianceRank[policy.maximumRelianceLevel]) reasons.push("reliance-exceeds-policy");
  for (const required of policy.requiredAuthorityTypes) if (!authorityTypes.includes(required)) reasons.push(`missing-authority-type:${required}`);
  if (policy.requireHumanAuthority && !authorityRefs.length) reasons.push("human-authority-required");
  if (policy.requireLegalComplianceReview && !input.legalComplianceReviewRef?.trim()) reasons.push("legal-compliance-review-required");
  for (const required of policy.requiredEvidenceRefs) if (!evidenceRefs.includes(required)) reasons.push(`missing-evidence:${required}`);
  if (input.purpose === "REGULATORY_SUBMISSION" && !policy.regulatoryRelianceAuthorized) reasons.push("regulatory-reliance-not-authorized");
  if (input.purpose === "LEGAL_DETERMINATION" && !policy.legalRelianceAuthorized) reasons.push("legal-reliance-not-authorized");
  if (input.purpose === "OFFICIAL_DECISION" && !policy.officialDecisionAuthorized) reasons.push("official-decision-not-authorized");
  if (input.requestedRelianceLevel === "OFFICIAL" && !(policy.regulatoryRelianceAuthorized || policy.legalRelianceAuthorized || policy.officialDecisionAuthorized)) {
    reasons.push("official-reliance-not-authorized");
  }

  const reviewReasons = new Set(["human-authority-required", "legal-compliance-review-required"]);
  const hardBlock = reasons.some((reason) => !reviewReasons.has(reason));
  const decision: InstitutionalRelianceDecision = hardBlock ? "BLOCK" : reasons.length ? "REVIEW_REQUIRED" : "ALLOW";
  return Object.freeze({
    schemaVersion: INSTITUTIONAL_RELIANCE_SCHEMA_VERSION,
    publicationPolicyId: input.publication.policyId,
    reliancePolicyId: policy.policyId,
    claimId: input.publication.claimId,
    purpose: input.purpose,
    requestedRelianceLevel: input.requestedRelianceLevel,
    decision,
    reasons: Object.freeze([...new Set(reasons)].sort()),
    evaluatedAt: input.evaluatedAt,
    authorityRefs,
    evidenceRefs,
    auditRefs: list(input.auditRefs, "auditRefs"),
    replayRef: nonEmpty(input.replayRef, "replayRef"),
  });
}

export const institutionalRelianceAuthority = Object.freeze({
  createPolicy: createInstitutionalReliancePolicy,
  evaluate: evaluateInstitutionalReliance,
});
