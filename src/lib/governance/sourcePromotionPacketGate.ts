import {
  SOURCE_STACK_PRODUCTION_RESTRICTIONS,
  SOURCE_STACK_REGISTRY,
  SOURCE_STACK_REQUIRED_DISCLOSURES,
  SOURCE_STACK_VERSION,
  SourceStackSourceProfile,
} from "@/lib/source-stack/sourceStackRuntime";
import { sourceLegalReviewForSource } from "@/lib/governance/sourceLegalReviewGate";
import { evaluateLiveScraperActivationGate } from "@/lib/governance/liveScraperActivationGate";

/**
 * Source Promotion Packet Gate
 *
 * Master Volume Governance:
 * - Vol I: keeps source promotion subordinate to constitutional authority.
 * - Vol II: prevents source promotion from becoming legal advice, official
 *   source reliance, underwriting truth, public verification, or borrower
 *   disclosure authority.
 * - Vol III: packages source-stack, legal-review, activation, replay,
 *   provenance, credential, adapter, monitoring, rollback, and incident
 *   evidence without performing live external calls.
 * - Vol III-B: exposes runtime, classification, version, observability, and
 *   replay posture for source promotion evidence.
 * - Vol IV: supports promotion review, rollback review, degraded connector
 *   handling, incident routing, and operator handoff.
 * - Vol V: preserves source authority, claims governance, public DTO safety,
 *   controlled disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: binds source promotion packets to canonical source intelligence
 *   and portable vertical surface requirements while live fetch remains
 *   blocked.
 */

export const SOURCE_PROMOTION_PACKET_GATE_VERSION =
  "source-promotion-packet-gate-v0.1.0";

export const SOURCE_PROMOTION_REQUIRED_CONTROLS = [
  "source-stack profile present",
  "source legal and ToS review packet attached",
  "live scraper activation review packet attached",
  "production credential vault reference approved",
  "certified live adapter implementation approved",
  "schema contract and DTO boundary approved",
  "replay certification attached",
  "provenance envelope certification attached",
  "rate limit, retry, and anti-bulk controls approved",
  "freshness monitoring and stale-source handling approved",
  "failover and degraded mode runbook approved",
  "rollback and incident response runbook approved",
  "public claims and verification language reviewed",
  "qualified human source promotion approval recorded",
] as const;

export type SourcePromotionPacketCheckStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type SourcePromotionPacketCheck = {
  id: string;
  label: string;
  status: SourcePromotionPacketCheckStatus;
  evidenceRef: string | null;
  blockingReason: string | null;
};

export type SourcePromotionPacket = {
  packetId: string;
  sourceId: string;
  sourceName: string;
  sourceCategory: string;
  sourceAuthorityTier: string;
  jurisdictionScope: string[];
  promotionPacketStatus: "PROMOTION_PACKET_BLOCKED";
  sourceLegalReviewStatus: "LEGAL_REVIEW_REQUIRED";
  sourceTermsReviewStatus: "TOS_REVIEW_REQUIRED";
  liveActivationReviewCount: number;
  productionBlocked: true;
  activationBlocked: true;
  liveFetchAllowed: false;
  liveFetchPerformed: false;
  externalActionPerformed: false;
  legalAdviceProvided: false;
  publicVerificationAllowed: false;
  officialRelianceAllowed: false;
  humanPromotionRequired: true;
  replayRequired: true;
  requiredControls: string[];
  checks: SourcePromotionPacketCheck[];
  blockingReasons: string[];
};

export type SourcePromotionPacketSummary = {
  totalPackets: number;
  productionBlocked: number;
  promotionReady: number;
  humanPromotionRequired: number;
  liveFetchEnabled: number;
  externalActionsPerformed: number;
  legalAdviceProvided: number;
  publicVerificationAllowed: number;
  sourcesWithoutActivationReview: number;
  requiredControls: string[];
  productionRestrictions: string[];
};

export type SourcePromotionPacketGateInput = {
  sourceId?: string | null;
};

export type SourcePromotionPacketGateResult = {
  version: string;
  sourceStackVersion: string;
  summary: SourcePromotionPacketSummary;
  sourcePromotionPackets: SourcePromotionPacket[];
  disclosures: string[];
  promotionPosture: "ALL_SOURCE_PROMOTION_PACKETS_BLOCKED_PENDING_APPROVAL";
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function check(
  id: string,
  label: string,
  status: SourcePromotionPacketCheckStatus,
  evidenceRef: string | null,
  blockingReason: string | null
): SourcePromotionPacketCheck {
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
  sourceId?: string | null
): boolean {
  if (!sourceId) {
    return true;
  }

  const candidate = normalize(sourceId);
  const profileId = normalize(source.sourceId);
  const profileName = normalize(source.sourceName);
  const profileCategory = normalize(source.sourceCategory);

  return (
    profileId === candidate ||
    profileName === candidate ||
    profileCategory === candidate ||
    profileName.includes(candidate) ||
    candidate.includes(profileId)
  );
}

function activationReviewRefsFor(source: SourceStackSourceProfile): string[] {
  const normalizedSourceId = normalize(source.sourceId);
  const normalizedSourceName = normalize(source.sourceName);
  const normalizedCategory = normalize(source.sourceCategory);
  const activationGate = evaluateLiveScraperActivationGate();

  return activationGate.sourceReviews
    .filter((review) => {
      const reviewSourceId = normalize(review.sourceId);
      const reviewSourceName = normalize(review.sourceName);

      return (
        reviewSourceId === normalizedSourceId ||
        reviewSourceName === normalizedSourceName ||
        reviewSourceName === normalizedCategory ||
        reviewSourceName.includes(normalizedSourceName) ||
        normalizedSourceName.includes(reviewSourceName) ||
        normalizedCategory.includes(reviewSourceName)
      );
    })
    .map((review) => review.scraperId);
}

function promotionPacketForSource(
  source: SourceStackSourceProfile
): SourcePromotionPacket {
  const legalReview = sourceLegalReviewForSource(
    source.sourceId,
    source.sourceName
  );
  const activationReviewRefs = activationReviewRefsFor(source);
  const checks: SourcePromotionPacketCheck[] = [
    check(
      "source-stack-profile",
      "Source-stack profile present",
      "PASS",
      source.sourceId,
      null
    ),
    check(
      "source-legal-review-packet",
      "Source legal and ToS review packet attached",
      "BLOCKED",
      legalReview
        ? `${legalReview.sourceId}:${legalReview.legalReviewStatus}:${legalReview.tosReviewStatus}`
        : null,
      legalReview
        ? "Source legal, ToS, licensing, anti-bulk, retention, and republication review remains pending qualified approval."
        : "Source legal and ToS review evidence is not attached."
    ),
    check(
      "live-activation-review-packet",
      "Live scraper activation review packet attached",
      activationReviewRefs.length > 0 ? "BLOCKED" : "REVIEW_REQUIRED",
      activationReviewRefs.join(" | ") || null,
      activationReviewRefs.length > 0
        ? "Live activation review exists but remains blocked pending promotion approval."
        : "No live scraper activation review is attached for this source."
    ),
    check(
      "production-credential-vault",
      "Production credential vault reference approved",
      "BLOCKED",
      null,
      "Production credential vault evidence is not approved for this source."
    ),
    check(
      "certified-live-adapter",
      "Certified live adapter implementation approved",
      "BLOCKED",
      null,
      "Certified live adapter implementation is not approved."
    ),
    check(
      "schema-contract-dto-boundary",
      "Schema contract and DTO boundary approved",
      "BLOCKED",
      null,
      "Production schema contract, public DTO boundary, and redaction posture are not approved."
    ),
    check(
      "replay-certification",
      "Replay certification attached",
      source.replayabilityScore >= 70 ? "REVIEW_REQUIRED" : "BLOCKED",
      `replayability-score-${source.replayabilityScore}`,
      "Replayability score is available, but production replay certification is not attached."
    ),
    check(
      "provenance-certification",
      "Provenance envelope certification attached",
      source.provenanceScore >= 70 ? "REVIEW_REQUIRED" : "BLOCKED",
      `provenance-score-${source.provenanceScore}`,
      "Provenance score is available, but live provenance envelope certification is not attached."
    ),
    check(
      "rate-limit-retry-anti-bulk",
      "Rate limit, retry, and anti-bulk controls approved",
      "BLOCKED",
      null,
      "Source-specific rate limit, retry, and anti-bulk controls are not approved."
    ),
    check(
      "freshness-monitoring",
      "Freshness monitoring and stale-source handling approved",
      "BLOCKED",
      source.freshnessCadence,
      "Freshness monitoring, stale-source handling, and alert routing are not approved."
    ),
    check(
      "failover-degraded-mode",
      "Failover and degraded mode runbook approved",
      "BLOCKED",
      null,
      "Failover source mapping and degraded mode runbook approval are not recorded."
    ),
    check(
      "rollback-incident-response",
      "Rollback and incident response runbook approved",
      "BLOCKED",
      null,
      "Rollback and incident response approvals are not recorded."
    ),
    check(
      "public-claims-review",
      "Public claims and verification language reviewed",
      "BLOCKED",
      source.claimsRestrictions.join(" | ") || null,
      "Public source claims, verification language, and customer-facing copy are not approved."
    ),
    check(
      "human-source-promotion-approval",
      "Qualified human source promotion approval recorded",
      "BLOCKED",
      null,
      "Qualified human approval for source promotion is required and has not been recorded."
    ),
    check(
      "live-fetch-flag",
      "Live fetch flag remains blocked",
      source.liveFetchAllowed === false ? "PASS" : "BLOCKED",
      `liveFetchAllowed:${String(source.liveFetchAllowed)}`,
      source.liveFetchAllowed === false
        ? null
        : "Live fetch is enabled before source promotion packet approval."
    ),
    check(
      "no-external-action",
      "No external action performed",
      "PASS",
      "externalActionPerformed:false",
      null
    ),
    check(
      "no-legal-advice",
      "No legal advice provided",
      "PASS",
      "legalAdviceProvided:false",
      null
    ),
  ];
  const blockingReasons = checks
    .filter((gate) => gate.status !== "PASS")
    .map((gate) => gate.blockingReason)
    .filter((reason): reason is string => Boolean(reason));

  return {
    packetId: `source-promotion-packet:${source.sourceId}`,
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    sourceCategory: source.sourceCategory,
    sourceAuthorityTier: source.sourceAuthorityTier,
    jurisdictionScope: [...source.jurisdictionScope],
    promotionPacketStatus: "PROMOTION_PACKET_BLOCKED",
    sourceLegalReviewStatus: "LEGAL_REVIEW_REQUIRED",
    sourceTermsReviewStatus: "TOS_REVIEW_REQUIRED",
    liveActivationReviewCount: activationReviewRefs.length,
    productionBlocked: true,
    activationBlocked: true,
    liveFetchAllowed: false,
    liveFetchPerformed: false,
    externalActionPerformed: false,
    legalAdviceProvided: false,
    publicVerificationAllowed: false,
    officialRelianceAllowed: false,
    humanPromotionRequired: true,
    replayRequired: true,
    requiredControls: [...SOURCE_PROMOTION_REQUIRED_CONTROLS],
    checks,
    blockingReasons,
  };
}

export function evaluateSourcePromotionPacketGate(
  input: SourcePromotionPacketGateInput = {}
): SourcePromotionPacketGateResult {
  const sourcePromotionPackets = SOURCE_STACK_REGISTRY.filter((source) =>
    sourceMatches(source, input.sourceId)
  ).map(promotionPacketForSource);

  return {
    version: SOURCE_PROMOTION_PACKET_GATE_VERSION,
    sourceStackVersion: SOURCE_STACK_VERSION,
    summary: {
      totalPackets: sourcePromotionPackets.length,
      productionBlocked: sourcePromotionPackets.length,
      promotionReady: 0,
      humanPromotionRequired: sourcePromotionPackets.length,
      liveFetchEnabled: sourcePromotionPackets.filter(
        (packet) => packet.liveFetchAllowed
      ).length,
      externalActionsPerformed: sourcePromotionPackets.filter(
        (packet) => packet.externalActionPerformed
      ).length,
      legalAdviceProvided: sourcePromotionPackets.filter(
        (packet) => packet.legalAdviceProvided
      ).length,
      publicVerificationAllowed: sourcePromotionPackets.filter(
        (packet) => packet.publicVerificationAllowed
      ).length,
      sourcesWithoutActivationReview: sourcePromotionPackets.filter(
        (packet) => packet.liveActivationReviewCount === 0
      ).length,
      requiredControls: [...SOURCE_PROMOTION_REQUIRED_CONTROLS],
      productionRestrictions: [...SOURCE_STACK_PRODUCTION_RESTRICTIONS],
    },
    sourcePromotionPackets,
    disclosures: [...SOURCE_STACK_REQUIRED_DISCLOSURES],
    promotionPosture: "ALL_SOURCE_PROMOTION_PACKETS_BLOCKED_PENDING_APPROVAL",
  };
}
