import {
  SOURCE_STACK_PRODUCTION_RESTRICTIONS,
  SOURCE_STACK_REQUIRED_DISCLOSURES,
  SOURCE_STACK_VERSION,
} from "@/lib/source-stack/sourceStackRuntime";
import {
  SOURCE_PROMOTION_PACKET_GATE_VERSION,
  evaluateSourcePromotionPacketGate,
} from "@/lib/governance/sourcePromotionPacketGate";
import type { SourcePromotionPacket } from "@/lib/governance/sourcePromotionPacketGate";

/**
 * Source Production Promotion Readiness Gate
 *
 * Master Volume Governance:
 * - Vol I: keeps production source promotion subordinate to constitutional
 *   authority, accountable approval, and controlled promotion.
 * - Vol II: prevents production-readiness review from becoming legal advice,
 *   official source reliance, underwriting truth, borrower disclosure, public
 *   verification, or a lender/agency commitment.
 * - Vol III: assembles deterministic production-readiness checks for source
 *   promotion packets, credentials, adapters, schema contracts, replay,
 *   provenance, monitoring, failover, rollback, incident response, audit
 *   export, and claims controls without performing live external calls.
 * - Vol III-B: exposes runtime, classification, version, observability, and
 *   replay posture for production-readiness evidence.
 * - Vol IV: supports controlled-promotion hold, activation ceremony review,
 *   incident containment, degraded-source handling, rollback planning, and
 *   operator handoff.
 * - Vol V: preserves source authority, claims governance, DTO safety,
 *   controlled disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: binds canonical source intelligence to a final production
 *   readiness review while live fetch and production source promotion remain
 *   blocked.
 */

export const SOURCE_PRODUCTION_READINESS_GATE_VERSION =
  "source-production-readiness-gate-v0.1.0";

export const SOURCE_PRODUCTION_READINESS_REQUIRED_CONTROLS = [
  "source promotion packet attached",
  "source promotion packet complete",
  "source-specific legal and ToS approval recorded",
  "live activation review attached",
  "production credential vault approved",
  "certified live adapter approved",
  "schema contract and public DTO boundary approved",
  "replay certification approved",
  "provenance envelope certification approved",
  "observability and freshness monitoring approved",
  "failover and degraded mode runbook approved",
  "rollback and incident response runbook approved",
  "audit export and evidence retention approved",
  "claims, public copy, and verification language approved",
  "qualified human promotion approval recorded",
  "controlled promotion change record opened",
  "activation ceremony checklist approved",
  "production kill switch and hold authority confirmed",
] as const;

export type SourceProductionReadinessCheckStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type SourceProductionReadinessCheck = {
  id: string;
  label: string;
  status: SourceProductionReadinessCheckStatus;
  evidenceRef: string | null;
  blockingReason: string | null;
};

export type SourceProductionReadinessReview = {
  readinessId: string;
  sourceId: string;
  sourceName: string;
  sourceCategory: string;
  sourceAuthorityTier: string;
  jurisdictionScope: string[];
  readinessStatus: "PRODUCTION_PROMOTION_BLOCKED";
  promotionPacketStatus: "PROMOTION_PACKET_BLOCKED";
  productionBlocked: true;
  promotionAllowed: false;
  activationCeremonyReady: false;
  liveFetchAllowed: false;
  liveFetchPerformed: false;
  externalActionPerformed: false;
  legalAdviceProvided: false;
  publicVerificationAllowed: false;
  officialRelianceAllowed: false;
  controlledPromotionRequired: true;
  humanApprovalRequired: true;
  replayRequired: true;
  requiredControls: string[];
  checks: SourceProductionReadinessCheck[];
  blockingReasons: string[];
};

export type SourceProductionReadinessSummary = {
  totalReviews: number;
  productionBlocked: number;
  productionReady: number;
  promotionAllowed: number;
  activationCeremonyReady: number;
  liveFetchEnabled: number;
  externalActionsPerformed: number;
  legalAdviceProvided: number;
  publicVerificationAllowed: number;
  controlledPromotionRequired: number;
  humanApprovalRequired: number;
  requiredControls: string[];
  productionRestrictions: string[];
};

export type SourceProductionReadinessGateInput = {
  sourceId?: string | null;
};

export type SourceProductionReadinessGateResult = {
  version: string;
  sourceStackVersion: string;
  sourcePromotionPacketVersion: string;
  summary: SourceProductionReadinessSummary;
  sourceProductionReadinessReviews: SourceProductionReadinessReview[];
  disclosures: string[];
  readinessPosture: "ALL_SOURCE_PRODUCTION_PROMOTION_BLOCKED_PENDING_CONTROLLED_APPROVAL";
};

function check(
  id: string,
  label: string,
  status: SourceProductionReadinessCheckStatus,
  evidenceRef: string | null,
  blockingReason: string | null
): SourceProductionReadinessCheck {
  return {
    id,
    label,
    status,
    evidenceRef,
    blockingReason,
  };
}

function packetEvidence(
  packet: SourcePromotionPacket,
  checkId: string
): string | null {
  return (
    packet.checks.find((candidate) => candidate.id === checkId)?.evidenceRef ??
    null
  );
}

function productionReadinessForPacket(
  packet: SourcePromotionPacket
): SourceProductionReadinessReview {
  const checks: SourceProductionReadinessCheck[] = [
    check(
      "source-promotion-packet-attached",
      "Source promotion packet attached",
      "PASS",
      packet.packetId,
      null
    ),
    check(
      "source-promotion-packet-complete",
      "Source promotion packet complete",
      "BLOCKED",
      packet.promotionPacketStatus,
      "Source promotion packet remains blocked and cannot be used for production promotion."
    ),
    check(
      "source-specific-legal-tos-approval",
      "Source-specific legal and ToS approval recorded",
      "BLOCKED",
      packetEvidence(packet, "source-legal-review-packet"),
      "Qualified legal, ToS, licensing, anti-bulk, retention, and republication approval is not recorded."
    ),
    check(
      "live-activation-review-attached",
      "Live activation review attached",
      packet.liveActivationReviewCount > 0 ? "REVIEW_REQUIRED" : "BLOCKED",
      packet.liveActivationReviewCount > 0
        ? `activation-review-count:${packet.liveActivationReviewCount}`
        : null,
      packet.liveActivationReviewCount > 0
        ? "Live activation review is attached but remains blocked pending controlled promotion."
        : "Live activation review evidence is not attached."
    ),
    check(
      "production-credential-vault-approved",
      "Production credential vault approved",
      "BLOCKED",
      packetEvidence(packet, "production-credential-vault"),
      "Production credential vault approval is not recorded."
    ),
    check(
      "certified-live-adapter-approved",
      "Certified live adapter approved",
      "BLOCKED",
      packetEvidence(packet, "certified-live-adapter"),
      "Certified live adapter approval is not recorded."
    ),
    check(
      "schema-contract-public-dto-approved",
      "Schema contract and public DTO boundary approved",
      "BLOCKED",
      packetEvidence(packet, "schema-contract-dto-boundary"),
      "Production schema contract, redaction, and public DTO boundary approval is not recorded."
    ),
    check(
      "replay-certification-approved",
      "Replay certification approved",
      "REVIEW_REQUIRED",
      packetEvidence(packet, "replay-certification"),
      "Replay score evidence exists only as review evidence; production replay certification is not approved."
    ),
    check(
      "provenance-envelope-approved",
      "Provenance envelope certification approved",
      "REVIEW_REQUIRED",
      packetEvidence(packet, "provenance-certification"),
      "Provenance score evidence exists only as review evidence; production provenance certification is not approved."
    ),
    check(
      "observability-freshness-monitoring-approved",
      "Observability and freshness monitoring approved",
      "BLOCKED",
      packetEvidence(packet, "freshness-monitoring"),
      "Freshness monitoring, stale-source handling, alert routing, and observability approval are not recorded."
    ),
    check(
      "failover-degraded-runbook-approved",
      "Failover and degraded mode runbook approved",
      "BLOCKED",
      packetEvidence(packet, "failover-degraded-mode"),
      "Failover mapping and degraded-source runbook approval are not recorded."
    ),
    check(
      "rollback-incident-runbook-approved",
      "Rollback and incident response runbook approved",
      "BLOCKED",
      packetEvidence(packet, "rollback-incident-response"),
      "Rollback, incident response, and source disablement approval are not recorded."
    ),
    check(
      "audit-export-retention-approved",
      "Audit export and evidence retention approved",
      "BLOCKED",
      null,
      "Audit export, evidence retention, and examiner packet approval are not recorded."
    ),
    check(
      "claims-public-copy-approved",
      "Claims, public copy, and verification language approved",
      "BLOCKED",
      packetEvidence(packet, "public-claims-review"),
      "Public claims, source certainty language, and verification copy approval are not recorded."
    ),
    check(
      "qualified-human-promotion-approval",
      "Qualified human promotion approval recorded",
      "BLOCKED",
      packetEvidence(packet, "human-source-promotion-approval"),
      "Qualified human source-promotion approval is required and has not been recorded."
    ),
    check(
      "controlled-promotion-change-record",
      "Controlled promotion change record opened",
      "BLOCKED",
      null,
      "Controlled promotion change record, rollback owner, and approval window are not recorded."
    ),
    check(
      "activation-ceremony-checklist",
      "Activation ceremony checklist approved",
      "BLOCKED",
      null,
      "Production activation ceremony checklist is not approved."
    ),
    check(
      "production-kill-switch-hold-authority",
      "Production kill switch and hold authority confirmed",
      "BLOCKED",
      null,
      "Production kill switch, emergency hold authority, and source-disable procedure are not confirmed."
    ),
    check(
      "live-fetch-remains-blocked",
      "Live fetch remains blocked",
      packet.liveFetchAllowed === false ? "PASS" : "BLOCKED",
      `liveFetchAllowed:${String(packet.liveFetchAllowed)}`,
      packet.liveFetchAllowed === false
        ? null
        : "Live fetch is enabled before controlled production promotion."
    ),
    check(
      "no-external-action-performed",
      "No external action performed",
      packet.externalActionPerformed === false ? "PASS" : "BLOCKED",
      `externalActionPerformed:${String(packet.externalActionPerformed)}`,
      packet.externalActionPerformed === false
        ? null
        : "External source action was performed before production readiness approval."
    ),
    check(
      "no-legal-advice-provided",
      "No legal advice provided",
      packet.legalAdviceProvided === false ? "PASS" : "BLOCKED",
      `legalAdviceProvided:${String(packet.legalAdviceProvided)}`,
      packet.legalAdviceProvided === false
        ? null
        : "Legal advice was provided by the runtime."
    ),
    check(
      "no-public-verification-authority",
      "No public verification authority",
      packet.publicVerificationAllowed === false ? "PASS" : "BLOCKED",
      `publicVerificationAllowed:${String(packet.publicVerificationAllowed)}`,
      packet.publicVerificationAllowed === false
        ? null
        : "Public verification authority was granted before controlled promotion."
    ),
  ];
  const blockingReasons = checks
    .filter((gate) => gate.status !== "PASS")
    .map((gate) => gate.blockingReason)
    .filter((reason): reason is string => Boolean(reason));

  return {
    readinessId: `source-production-readiness:${packet.sourceId}`,
    sourceId: packet.sourceId,
    sourceName: packet.sourceName,
    sourceCategory: packet.sourceCategory,
    sourceAuthorityTier: packet.sourceAuthorityTier,
    jurisdictionScope: [...packet.jurisdictionScope],
    readinessStatus: "PRODUCTION_PROMOTION_BLOCKED",
    promotionPacketStatus: packet.promotionPacketStatus,
    productionBlocked: true,
    promotionAllowed: false,
    activationCeremonyReady: false,
    liveFetchAllowed: false,
    liveFetchPerformed: false,
    externalActionPerformed: false,
    legalAdviceProvided: false,
    publicVerificationAllowed: false,
    officialRelianceAllowed: false,
    controlledPromotionRequired: true,
    humanApprovalRequired: true,
    replayRequired: true,
    requiredControls: [...SOURCE_PRODUCTION_READINESS_REQUIRED_CONTROLS],
    checks,
    blockingReasons,
  };
}

export function evaluateSourceProductionReadinessGate(
  input: SourceProductionReadinessGateInput = {}
): SourceProductionReadinessGateResult {
  const packetGate = evaluateSourcePromotionPacketGate({
    sourceId: input.sourceId,
  });
  const sourceProductionReadinessReviews =
    packetGate.sourcePromotionPackets.map(productionReadinessForPacket);

  return {
    version: SOURCE_PRODUCTION_READINESS_GATE_VERSION,
    sourceStackVersion: SOURCE_STACK_VERSION,
    sourcePromotionPacketVersion: SOURCE_PROMOTION_PACKET_GATE_VERSION,
    summary: {
      totalReviews: sourceProductionReadinessReviews.length,
      productionBlocked: sourceProductionReadinessReviews.length,
      productionReady: 0,
      promotionAllowed: sourceProductionReadinessReviews.filter(
        (review) => review.promotionAllowed
      ).length,
      activationCeremonyReady: sourceProductionReadinessReviews.filter(
        (review) => review.activationCeremonyReady
      ).length,
      liveFetchEnabled: sourceProductionReadinessReviews.filter(
        (review) => review.liveFetchAllowed
      ).length,
      externalActionsPerformed: sourceProductionReadinessReviews.filter(
        (review) => review.externalActionPerformed
      ).length,
      legalAdviceProvided: sourceProductionReadinessReviews.filter(
        (review) => review.legalAdviceProvided
      ).length,
      publicVerificationAllowed: sourceProductionReadinessReviews.filter(
        (review) => review.publicVerificationAllowed
      ).length,
      controlledPromotionRequired: sourceProductionReadinessReviews.length,
      humanApprovalRequired: sourceProductionReadinessReviews.length,
      requiredControls: [...SOURCE_PRODUCTION_READINESS_REQUIRED_CONTROLS],
      productionRestrictions: [...SOURCE_STACK_PRODUCTION_RESTRICTIONS],
    },
    sourceProductionReadinessReviews,
    disclosures: [
      ...SOURCE_STACK_REQUIRED_DISCLOSURES,
      "No legal advice has been provided.",
      "No live external source has been contacted.",
      "No public verification authority has been granted.",
      "No source has been promoted to production.",
    ],
    readinessPosture:
      "ALL_SOURCE_PRODUCTION_PROMOTION_BLOCKED_PENDING_CONTROLLED_APPROVAL",
  };
}
