import {
  SCRAPER_REGISTRY,
  SOURCE_INTELLIGENCE_REQUIRED_DISCLOSURES,
  SOURCE_INTELLIGENCE_VERSION,
  ScraperDefinition,
} from "@/lib/source-intelligence/sourceIntelligenceRuntime";
import {
  SOURCE_STACK_PRODUCTION_RESTRICTIONS,
  SOURCE_STACK_REGISTRY,
  SOURCE_STACK_VERSION,
  SourceStackSourceProfile,
} from "@/lib/source-stack/sourceStackRuntime";
import { sourceLegalReviewForSource } from "@/lib/governance/sourceLegalReviewGate";

/**
 * Live Scraper Activation Gate
 *
 * Master Volume Governance:
 * - Vol I: keeps source activation subordinate to constitutional authority.
 * - Vol II: blocks unreviewed agency, property, marketplace, borrower, and
 *   institutional source reliance.
 * - Vol III: evaluates source activation against canonical source, replay,
 *   connector, and provenance registries without live external calls.
 * - Vol III-B: gives runtime, classification, version, and observability
 *   surfaces an explicit activation-readiness posture.
 * - Vol IV: supports promotion, rollback, incident response, degraded
 *   connector handling, and human approval checkpoints.
 * - Vol V: preserves source authority, replayability, controlled disclosure,
 *   and advisory-only claims before any production-live promotion.
 * - Vol VI: binds scraper/source-stack activation to the governed source
 *   intelligence architecture while keeping public DTOs and live fetches gated.
 */

export const LIVE_SCRAPER_ACTIVATION_GATE_VERSION =
  "live-scraper-activation-gate-v0.1.0";

export const LIVE_SCRAPER_ACTIVATION_REQUIRED_GATES = [
  "source authority registry entry",
  "source-stack profile alignment",
  "source-specific legal and ToS review",
  "production credential vault reference",
  "live adapter implementation reference",
  "connector certification",
  "rate limit and retry policy",
  "replay certification",
  "provenance envelope certification",
  "source freshness monitoring",
  "rollback and incident runbook approval",
  "human promotion approval",
] as const;

export type LiveScraperActivationGateStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type LiveScraperActivationCheck = {
  id: string;
  label: string;
  status: LiveScraperActivationGateStatus;
  evidenceRef: string | null;
  blockingReason: string | null;
};

export type LiveScraperActivationReview = {
  sourceId: string;
  sourceName: string;
  scraperId: string;
  scraperName: string;
  sourceAuthorityTier: string;
  connectorCertificationStatus: string;
  sourceStackProfilePresent: boolean;
  sourceStackProfileRef: string | null;
  liveFetchAllowed: boolean;
  activationBlocked: true;
  humanReviewRequired: true;
  replayRequired: true;
  advisoryOnly: true;
  requiredBeforeLive: string[];
  checks: LiveScraperActivationCheck[];
  blockingReasons: string[];
};

export type LiveScraperActivationGateSummary = {
  totalScrapers: number;
  sourceStackProfiles: number;
  liveFetchEnabled: number;
  activationBlocked: number;
  sourcesMissingStackProfile: number;
  sourcesReadyForHumanPromotionReview: number;
  requiredGates: string[];
  productionRestrictions: string[];
};

export type LiveScraperActivationGateInput = {
  sourceId?: string | null;
};

export type LiveScraperActivationGateResult = {
  version: string;
  sourceIntelligenceVersion: string;
  sourceStackVersion: string;
  summary: LiveScraperActivationGateSummary;
  sourceReviews: LiveScraperActivationReview[];
  disclosures: string[];
  activationPosture:
    | "ALL_SOURCES_BLOCKED_PENDING_EVIDENCE"
    | "REVIEW_READY_BUT_STILL_NOT_LIVE";
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function sourceStackProfileFor(
  scraper: ScraperDefinition
): SourceStackSourceProfile | null {
  const sourceId = normalize(scraper.sourceId);
  const sourceName = normalize(scraper.sourceName);

  return (
    SOURCE_STACK_REGISTRY.find((profile) => {
      const profileId = normalize(profile.sourceId);
      const profileName = normalize(profile.sourceName);
      const profileCategory = normalize(profile.sourceCategory);

      return (
        profileId === sourceId ||
        profileName === sourceName ||
        profileCategory === sourceName ||
        sourceName.includes(profileName) ||
        profileName.includes(sourceId)
      );
    }) ?? null
  );
}

function check(
  id: string,
  label: string,
  status: LiveScraperActivationGateStatus,
  evidenceRef: string | null,
  blockingReason: string | null
): LiveScraperActivationCheck {
  return {
    id,
    label,
    status,
    evidenceRef,
    blockingReason,
  };
}

function activationReviewFor(
  scraper: ScraperDefinition
): LiveScraperActivationReview {
  const sourceStackProfile = sourceStackProfileFor(scraper);
  const legalReview = sourceLegalReviewForSource(
    scraper.sourceId,
    scraper.sourceName
  );
  const checks: LiveScraperActivationCheck[] = [
    check(
      "source-authority-registry",
      "Source authority registry entry",
      "PASS",
      scraper.sourceVersion,
      null
    ),
    check(
      "source-stack-profile",
      "Source-stack profile alignment",
      sourceStackProfile ? "PASS" : "BLOCKED",
      sourceStackProfile?.sourceId ?? null,
      sourceStackProfile
        ? null
        : "No matching canonical source-stack profile is registered for this scraper."
    ),
    check(
      "legal-terms-review",
      "Source-specific legal and ToS review",
      "BLOCKED",
      legalReview
        ? `${legalReview.sourceId}:${legalReview.legalReviewStatus}`
        : null,
      legalReview
        ? "Source legal, licensing, anti-bulk, and ToS review remains blocked pending qualified review."
        : "Source-specific legal, licensing, anti-bulk, and ToS review is not recorded."
    ),
    check(
      "production-credential-vault",
      "Production credential vault reference",
      "BLOCKED",
      null,
      "No production credential vault reference is recorded."
    ),
    check(
      "live-adapter-implementation",
      "Live adapter implementation reference",
      "BLOCKED",
      scraper.adapterPath,
      "Registered adapter path is not promoted as a certified live adapter."
    ),
    check(
      "connector-certification",
      "Connector certification",
      scraper.connectorCertificationStatus === "CERTIFIED"
        ? "REVIEW_REQUIRED"
        : "BLOCKED",
      scraper.connectorCertificationStatus,
      scraper.connectorCertificationStatus === "CERTIFIED"
        ? "Certified connector still requires human promotion approval."
        : "Connector certification is pending or requires review."
    ),
    check(
      "rate-limit-retry-policy",
      "Rate limit and retry policy",
      "REVIEW_REQUIRED",
      `${scraper.rateLimitProfile} / ${scraper.retryGovernanceProfile}`,
      "Governed rate limit and replay-safe retry policy require source-specific evidence."
    ),
    check(
      "replay-certification",
      "Replay certification",
      scraper.replaySupported ? "REVIEW_REQUIRED" : "BLOCKED",
      scraper.replaySupported ? "replay-supported" : null,
      scraper.replaySupported
        ? "Replay support exists, but production-live replay certification is not recorded."
        : "Replay support is required before live activation."
    ),
    check(
      "provenance-certification",
      "Provenance envelope certification",
      "REVIEW_REQUIRED",
      `provenance-score-${scraper.provenanceScore}`,
      "Provenance score exists, but live provenance envelope certification is not recorded."
    ),
    check(
      "source-freshness-monitoring",
      "Source freshness monitoring",
      "BLOCKED",
      sourceStackProfile?.freshnessCadence ?? null,
      "Production freshness monitoring, alerts, and stale-source handling are not approved."
    ),
    check(
      "rollback-incident-runbook",
      "Rollback and incident runbook approval",
      "BLOCKED",
      null,
      "Rollback, degraded connector, and incident response runbook approvals are not recorded."
    ),
    check(
      "human-promotion-approval",
      "Human promotion approval",
      "BLOCKED",
      null,
      "Human production-live approval is required and has not been recorded."
    ),
    check(
      "live-fetch-flag",
      "Live fetch flag remains blocked",
      scraper.liveFetchAllowed === false ? "PASS" : "BLOCKED",
      `liveFetchAllowed:${String(scraper.liveFetchAllowed)}`,
      scraper.liveFetchAllowed === false
        ? null
        : "Live fetch is enabled before the activation gate is complete."
    ),
  ];
  const blockingReasons = checks
    .filter((gate) => gate.status !== "PASS")
    .map((gate) => gate.blockingReason)
    .filter((reason): reason is string => Boolean(reason));

  return {
    sourceId: scraper.sourceId,
    sourceName: scraper.sourceName,
    scraperId: scraper.scraperId,
    scraperName: scraper.scraperName,
    sourceAuthorityTier: scraper.sourceAuthorityTier,
    connectorCertificationStatus: scraper.connectorCertificationStatus,
    sourceStackProfilePresent: Boolean(sourceStackProfile),
    sourceStackProfileRef: sourceStackProfile?.sourceId ?? null,
    liveFetchAllowed: scraper.liveFetchAllowed,
    activationBlocked: true,
    humanReviewRequired: true,
    replayRequired: true,
    advisoryOnly: true,
    requiredBeforeLive: [...LIVE_SCRAPER_ACTIVATION_REQUIRED_GATES],
    checks,
    blockingReasons,
  };
}

export function evaluateLiveScraperActivationGate(
  input: LiveScraperActivationGateInput = {}
): LiveScraperActivationGateResult {
  const sourceFilter = input.sourceId ? normalize(input.sourceId) : null;
  const sourceReviews = SCRAPER_REGISTRY.filter((scraper) => {
    if (!sourceFilter) {
      return true;
    }

    return (
      normalize(scraper.sourceId) === sourceFilter ||
      normalize(scraper.scraperId) === sourceFilter ||
      normalize(scraper.sourceName) === sourceFilter
    );
  }).map(activationReviewFor);
  const liveFetchEnabled = sourceReviews.filter(
    (review) => review.liveFetchAllowed
  ).length;
  const sourcesMissingStackProfile = sourceReviews.filter(
    (review) => !review.sourceStackProfilePresent
  ).length;
  const sourcesReadyForHumanPromotionReview = sourceReviews.filter((review) =>
    review.checks.every(
      (gate) => gate.status === "PASS" || gate.status === "REVIEW_REQUIRED"
    )
  ).length;

  return {
    version: LIVE_SCRAPER_ACTIVATION_GATE_VERSION,
    sourceIntelligenceVersion: SOURCE_INTELLIGENCE_VERSION,
    sourceStackVersion: SOURCE_STACK_VERSION,
    summary: {
      totalScrapers: sourceReviews.length,
      sourceStackProfiles: SOURCE_STACK_REGISTRY.length,
      liveFetchEnabled,
      activationBlocked: sourceReviews.length,
      sourcesMissingStackProfile,
      sourcesReadyForHumanPromotionReview,
      requiredGates: [...LIVE_SCRAPER_ACTIVATION_REQUIRED_GATES],
      productionRestrictions: [...SOURCE_STACK_PRODUCTION_RESTRICTIONS],
    },
    sourceReviews,
    disclosures: [...SOURCE_INTELLIGENCE_REQUIRED_DISCLOSURES],
    activationPosture:
      liveFetchEnabled === 0
        ? "ALL_SOURCES_BLOCKED_PENDING_EVIDENCE"
        : "REVIEW_READY_BUT_STILL_NOT_LIVE",
  };
}
