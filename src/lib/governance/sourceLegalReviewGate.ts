import {
  SOURCE_STACK_PRODUCTION_RESTRICTIONS,
  SOURCE_STACK_REGISTRY,
  SOURCE_STACK_REQUIRED_DISCLOSURES,
  SOURCE_STACK_VERSION,
  SourceStackSourceProfile,
} from "@/lib/platform/authorities/source";

/**
 * Source Legal and Licensing Review Gate
 *
 * Master Volume Governance:
 * - Vol I: keeps external source use subordinate to constitutional authority.
 * - Vol II: prevents unreviewed source licensing, ToS, anti-bulk, borrower,
 *   agency, marketplace, and institutional source reliance.
 * - Vol III: evaluates source legal/licensing readiness through canonical
 *   source-stack profiles before any live connector or scraper activation.
 * - Vol III-B: exposes runtime, classification, version, observability, and
 *   replay posture for source legal review evidence.
 * - Vol IV: supports legal review, exception routing, incident containment,
 *   rollback, and operator handoff.
 * - Vol V: preserves source authority, controlled disclosure, claims limits,
 *   replayability, provenance, public DTO boundaries, and advisory-only use.
 * - Vol VI: binds source licensing review to the canonical external source
 *   discovery architecture without performing live fetches.
 */

export const SOURCE_LEGAL_REVIEW_GATE_VERSION =
  "source-legal-review-gate-v0.1.0";

export const SOURCE_LEGAL_REQUIRED_CONTROLS = [
  "source profile present",
  "licensing restrictions identified",
  "terms of service reviewed by qualified reviewer",
  "anti-bulk acquisition posture approved",
  "permitted use categories mapped",
  "restricted use categories mapped",
  "data retention and republication reviewed",
  "public DTO and redaction posture reviewed",
  "qualified legal or compliance approval recorded",
  "human activation approval recorded",
] as const;

export type SourceLegalReviewStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type SourceLegalReviewCheck = {
  id: string;
  label: string;
  status: SourceLegalReviewStatus;
  evidenceRef: string | null;
  blockingReason: string | null;
};

export type SourceLegalReviewRecord = {
  sourceId: string;
  sourceName: string;
  sourceCategory: string;
  sourceAuthorityTier: string;
  jurisdictionScope: string[];
  licensingRestrictions: string[];
  claimsRestrictions: string[];
  freshnessCadence: string;
  legalReviewStatus: "LEGAL_REVIEW_REQUIRED";
  tosReviewStatus: "TOS_REVIEW_REQUIRED";
  activationBlocked: true;
  liveFetchAllowed: false;
  liveFetchPerformed: false;
  legalAdviceProvided: false;
  qualifiedReviewRequired: true;
  officialRelianceAllowed: false;
  republicationAllowed: false;
  bulkAcquisitionAllowed: false;
  publicDtoAllowedAfterReview: boolean;
  requiredControls: string[];
  checks: SourceLegalReviewCheck[];
  blockingReasons: string[];
};

export type SourceLegalReviewSummary = {
  totalSources: number;
  legalApproved: number;
  tosApproved: number;
  activationBlocked: number;
  liveFetchEnabled: number;
  marketplaceSources: number;
  governmentSources: number;
  qualifiedReviewRequired: number;
  requiredControls: string[];
  productionRestrictions: string[];
};

export type SourceLegalReviewGateInput = {
  sourceId?: string | null;
};

export type SourceLegalReviewGateResult = {
  version: string;
  sourceStackVersion: string;
  summary: SourceLegalReviewSummary;
  sourceLegalReviews: SourceLegalReviewRecord[];
  disclosures: string[];
  legalReviewPosture: "ALL_SOURCES_BLOCKED_PENDING_QUALIFIED_REVIEW";
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function check(
  id: string,
  label: string,
  status: SourceLegalReviewStatus,
  evidenceRef: string | null,
  blockingReason: string | null
): SourceLegalReviewCheck {
  return {
    id,
    label,
    status,
    evidenceRef,
    blockingReason,
  };
}

function sourceMatches(
  source: SourceStackSourceProfile,
  sourceId?: string | null,
  sourceName?: string | null
): boolean {
  const profileId = normalize(source.sourceId);
  const profileName = normalize(source.sourceName);
  const profileCategory = normalize(source.sourceCategory);
  const candidateId = sourceId ? normalize(sourceId) : "";
  const candidateName = sourceName ? normalize(sourceName) : "";

  return Boolean(
    (candidateId &&
      (profileId === candidateId ||
        profileName === candidateId ||
        profileCategory === candidateId ||
        candidateId.includes(profileId) ||
        profileId.includes(candidateId))) ||
      (candidateName &&
        (profileName === candidateName ||
          profileCategory === candidateName ||
          candidateName.includes(profileName) ||
          profileName.includes(candidateName)))
  );
}

function legalReviewForProfile(
  source: SourceStackSourceProfile
): SourceLegalReviewRecord {
  const marketplaceSource =
    source.sourceAuthorityTier.includes("marketplace") ||
    source.sourceCategory.toLowerCase().includes("market");
  const governmentSource =
    source.sourceAuthorityTier.includes("government") ||
    ["USDA", "FSA", "SBA", "FEMA", "NOAA", "NRCS", "Census"].includes(
      source.sourceCategory
    );
  const checks: SourceLegalReviewCheck[] = [
    check(
      "source-profile-present",
      "Source profile present",
      "PASS",
      source.sourceId,
      null
    ),
    check(
      "licensing-restrictions-present",
      "Licensing restrictions identified",
      source.licensingRestrictions.length > 0 ? "PASS" : "BLOCKED",
      source.licensingRestrictions.join(" | ") || null,
      source.licensingRestrictions.length > 0
        ? null
        : "Licensing restrictions must be identified before review can proceed."
    ),
    check(
      "terms-of-service-reviewed",
      "Terms of service reviewed by qualified reviewer",
      "BLOCKED",
      null,
      "Qualified legal or compliance review of source terms is not recorded."
    ),
    check(
      "anti-bulk-posture",
      "Anti-bulk acquisition posture approved",
      "BLOCKED",
      null,
      "Anti-bulk acquisition controls are not approved for production use."
    ),
    check(
      "permitted-use-map",
      "Permitted use categories mapped",
      "REVIEW_REQUIRED",
      "candidate-evidence-only",
      "Permitted use must be mapped to source-specific licensing language."
    ),
    check(
      "restricted-use-map",
      "Restricted use categories mapped",
      "REVIEW_REQUIRED",
      source.claimsRestrictions.join(" | ") || null,
      "Restricted uses must be reviewed against source claims and licensing limits."
    ),
    check(
      "retention-republication",
      "Data retention and republication reviewed",
      "BLOCKED",
      null,
      "Retention, caching, republication, and public display terms are not approved."
    ),
    check(
      "public-dto-redaction",
      "Public DTO and redaction posture reviewed",
      "REVIEW_REQUIRED",
      marketplaceSource ? "marketplace-dto-review-required" : "public-dto-review-required",
      "Public DTO use requires review, redaction, and claims boundaries."
    ),
    check(
      "qualified-review-approval",
      "Qualified legal or compliance approval recorded",
      "BLOCKED",
      null,
      "Qualified legal or compliance approval has not been recorded."
    ),
    check(
      "human-activation-approval",
      "Human activation approval recorded",
      "BLOCKED",
      null,
      "Human production activation approval has not been recorded."
    ),
    check(
      "live-fetch-flag",
      "Live fetch flag remains blocked",
      source.liveFetchAllowed === false ? "PASS" : "BLOCKED",
      `liveFetchAllowed:${String(source.liveFetchAllowed)}`,
      source.liveFetchAllowed === false
        ? null
        : "Live fetch is enabled before legal review is complete."
    ),
  ];
  const blockingReasons = checks
    .filter((gate) => gate.status !== "PASS")
    .map((gate) => gate.blockingReason)
    .filter((reason): reason is string => Boolean(reason));

  return {
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    sourceCategory: source.sourceCategory,
    sourceAuthorityTier: source.sourceAuthorityTier,
    jurisdictionScope: [...source.jurisdictionScope],
    licensingRestrictions: [...source.licensingRestrictions],
    claimsRestrictions: [...source.claimsRestrictions],
    freshnessCadence: source.freshnessCadence,
    legalReviewStatus: "LEGAL_REVIEW_REQUIRED",
    tosReviewStatus: "TOS_REVIEW_REQUIRED",
    activationBlocked: true,
    liveFetchAllowed: false,
    liveFetchPerformed: false,
    legalAdviceProvided: false,
    qualifiedReviewRequired: true,
    officialRelianceAllowed: false,
    republicationAllowed: false,
    bulkAcquisitionAllowed: false,
    publicDtoAllowedAfterReview: governmentSource || marketplaceSource,
    requiredControls: [...SOURCE_LEGAL_REQUIRED_CONTROLS],
    checks,
    blockingReasons,
  };
}

export function sourceLegalReviewForSource(
  sourceId?: string | null,
  sourceName?: string | null
): SourceLegalReviewRecord | null {
  const source = SOURCE_STACK_REGISTRY.find((profile) =>
    sourceMatches(profile, sourceId, sourceName)
  );

  return source ? legalReviewForProfile(source) : null;
}

export function evaluateSourceLegalReviewGate(
  input: SourceLegalReviewGateInput = {}
): SourceLegalReviewGateResult {
  const sourceFilter = input.sourceId ? normalize(input.sourceId) : null;
  const sourceLegalReviews = SOURCE_STACK_REGISTRY.filter((source) => {
    if (!sourceFilter) {
      return true;
    }

    return sourceMatches(source, sourceFilter, sourceFilter);
  }).map(legalReviewForProfile);
  const liveFetchEnabled = sourceLegalReviews.filter(
    (review) => review.liveFetchAllowed
  ).length;
  const marketplaceSources = sourceLegalReviews.filter((review) =>
    review.sourceAuthorityTier.includes("marketplace")
  ).length;
  const governmentSources = sourceLegalReviews.filter((review) =>
    review.sourceAuthorityTier.includes("government")
  ).length;

  return {
    version: SOURCE_LEGAL_REVIEW_GATE_VERSION,
    sourceStackVersion: SOURCE_STACK_VERSION,
    summary: {
      totalSources: sourceLegalReviews.length,
      legalApproved: 0,
      tosApproved: 0,
      activationBlocked: sourceLegalReviews.length,
      liveFetchEnabled,
      marketplaceSources,
      governmentSources,
      qualifiedReviewRequired: sourceLegalReviews.length,
      requiredControls: [...SOURCE_LEGAL_REQUIRED_CONTROLS],
      productionRestrictions: [...SOURCE_STACK_PRODUCTION_RESTRICTIONS],
    },
    sourceLegalReviews,
    disclosures: [...SOURCE_STACK_REQUIRED_DISCLOSURES],
    legalReviewPosture: "ALL_SOURCES_BLOCKED_PENDING_QUALIFIED_REVIEW",
  };
}
