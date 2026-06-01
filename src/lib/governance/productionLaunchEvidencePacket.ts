import {
  PRODUCTION_PORTAL_READINESS_GATE_VERSION,
  evaluateProductionPortalReadinessGate,
} from "@/lib/governance/productionPortalReadinessGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Launch Evidence Packet
 *
 * Master Volume Governance:
 * - Vol 0: packages one platform-wide launch evidence view for internal,
 *   borrower, lender, sponsor, and public translation surfaces.
 * - Vol I: keeps go-live release subordinate to constitutional authority,
 *   accountable approval, and explicit launch-hold release.
 * - Vol II: prevents evidence packaging from becoming approvals, underwriting
 *   reliance, official reports, borrower notice sends, payment capture, legal
 *   advice, public verification, lender commitments, sponsor commitments, or
 *   agency commitments.
 * - Vol III: assembles deterministic, replay-safe proof over backend, auth,
 *   security, audit, content claims, portable surfaces, monitoring, rollback,
 *   incident, support, and launch controls.
 * - Vol III-B: exposes classification, version, observability, and runtime
 *   posture for the packet review without production publication.
 * - Vol IV: supports launch board review, operator handoff, incident bridge,
 *   rollback review, support routing, communication freeze, and final hold.
 * - Vol V: preserves content claims, data rights, portability, controlled
 *   disclosure, replayability, explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable vertical
 *   surface governance blocked from live production exposure until approved.
 */

export const PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION =
  "production-launch-evidence-packet-v0.1.0";

export type ProductionLaunchEvidenceStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionLaunchEvidenceItem = {
  id: string;
  label: string;
  status: ProductionLaunchEvidenceStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionLaunchEvidencePacket = {
  packetId: string;
  packetStatus: "GO_LIVE_EVIDENCE_PACKET_BLOCKED";
  productionBlocked: true;
  evidencePacketAvailable: true;
  releaseCandidate: false;
  goLiveApproved: false;
  portalLaunchExecuted: false;
  publicLaunchAllowed: false;
  liveExternalActionAllowed: false;
  liveExternalActionPerformed: false;
  paymentCaptureAllowed: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  publicVerificationAllowed: false;
  legalAdviceProvided: false;
  officialRelianceAllowed: false;
  controlledPromotionRequired: true;
  qualifiedHumanApprovalRequired: true;
  finalLaunchHoldRequired: true;
  productionPortalReadinessVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  readinessReviewCount: number;
  evidenceItems: ProductionLaunchEvidenceItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionLaunchEvidenceSummary = {
  totalPackets: number;
  totalEvidenceItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  releaseCandidate: number;
  goLiveApproved: number;
  portalLaunchExecuted: number;
  publicLaunchAllowed: number;
  liveExternalActionsAllowed: number;
  liveExternalActionsPerformed: number;
  paymentCaptureAllowed: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  publicVerificationAllowed: number;
  legalAdviceProvided: number;
  officialRelianceAllowed: number;
  finalLaunchHoldRequired: number;
};

export type ProductionLaunchEvidencePacketInput = {
  packetScope?: string | null;
};

export type ProductionLaunchEvidencePacketResult = {
  version: string;
  productionPortalReadinessVersion: string;
  launchEvidencePackets: ProductionLaunchEvidencePacket[];
  summary: ProductionLaunchEvidenceSummary;
  disclosures: string[];
  launchReleasePosture: "GO_LIVE_RELEASE_BLOCKED_PENDING_QUALIFIED_APPROVAL";
};

function item(
  id: string,
  label: string,
  status: ProductionLaunchEvidenceStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionLaunchEvidenceItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function zeroLiveActionReadiness(): boolean {
  const readiness = evaluateProductionPortalReadinessGate();

  return (
    readiness.summary.launchReady === 0 &&
    readiness.summary.launchExecuted === 0 &&
    readiness.summary.publicLaunchAllowed === 0 &&
    readiness.summary.liveExternalActionsAllowed === 0 &&
    readiness.summary.liveExternalActionsPerformed === 0 &&
    readiness.summary.paymentCaptureAllowed === 0 &&
    readiness.summary.borrowerNoticeSendsAllowed === 0 &&
    readiness.summary.officialReportsAllowed === 0 &&
    readiness.summary.publicVerificationAllowed === 0 &&
    readiness.summary.legalAdviceProvided === 0 &&
    readiness.summary.officialRelianceAllowed === 0
  );
}

function buildEvidenceItems(): ProductionLaunchEvidenceItem[] {
  const readiness = evaluateProductionPortalReadinessGate();
  const allReadinessReviewsPresent =
    readiness.summary.totalReviews === allPortableVerticalSurfaces.length;
  const launchBlocksPreserved =
    readiness.summary.productionBlocked === readiness.summary.totalReviews &&
    zeroLiveActionReadiness();

  return [
    item(
      "master-volume-conformance-attached",
      "Master Volume conformance evidence attached",
      "PASS",
      "docs/master-volume-requirements.json",
      "governance",
      null
    ),
    item(
      "module-manifest-coverage-attached",
      "Module manifest coverage attached",
      "PASS",
      `${moduleManifests.length} module manifests`,
      "platform",
      null
    ),
    item(
      "portable-surface-readiness-attached",
      "Portable vertical surface readiness attached",
      allReadinessReviewsPresent ? "PASS" : "BLOCKED",
      `${readiness.summary.totalReviews}/${allPortableVerticalSurfaces.length} readiness reviews`,
      "platform",
      allReadinessReviewsPresent
        ? null
        : "Every portable vertical surface must have a production readiness review."
    ),
    item(
      "production-portal-readiness-attached",
      "Production portal readiness gate attached",
      "PASS",
      `${readiness.version}:${readiness.launchPosture}`,
      "governance",
      null
    ),
    item(
      "launch-blocks-preserved",
      "Launch and live-action blocks preserved",
      launchBlocksPreserved ? "PASS" : "BLOCKED",
      "production portal readiness summary",
      "governance",
      launchBlocksPreserved
        ? null
        : "Portal launch, live external actions, payments, notices, reports, public verification, legal advice, and official reliance must remain blocked."
    ),
    item(
      "production-auth-final-approval",
      "Production auth final approval",
      "BLOCKED",
      "npm run auth:activation:production",
      "security",
      "Production auth activation has not been approved for go-live release."
    ),
    item(
      "security-audit-final-approval",
      "Security and audit final approval",
      "BLOCKED",
      "npm run security:audit:production",
      "security",
      "Security and audit readiness has not been approved for go-live release."
    ),
    item(
      "backend-production-final-approval",
      "Backend production final approval",
      "BLOCKED",
      "npm run backend:production-readiness:production",
      "platform",
      "Production backend activation has not been approved for go-live release."
    ),
    item(
      "content-claims-public-copy-freeze",
      "Content claims and public-copy freeze",
      "REVIEW_REQUIRED",
      "npm run smoke:content-claims",
      "governance",
      "Customer-facing copy and public claims must be frozen and re-reviewed before release."
    ),
    item(
      "record-access-redaction-replay-freeze",
      "Record access, redaction, replay, and audit export freeze",
      "REVIEW_REQUIRED",
      "npm run smoke:record-access && npm run smoke:redaction && npm run verify:replay",
      "platform",
      "Record access, redaction, replay, and audit export evidence must be rerun against the final release candidate."
    ),
    item(
      "monitoring-incident-rollback-approval",
      "Monitoring, incident, rollback, and emergency hold approval",
      "BLOCKED",
      "monitoring incident rollback runbooks",
      "operations",
      "Monitoring, incident bridge, rollback owner, and emergency hold controls are not approved."
    ),
    item(
      "operator-support-escalation-approval",
      "Operator support and escalation approval",
      "BLOCKED",
      "operator launch checklist",
      "operations",
      "Operator support roster, escalation routing, and launch communications plan are not approved."
    ),
    item(
      "legal-compliance-qualified-review",
      "Qualified legal and compliance review",
      "BLOCKED",
      "qualified reviewer signoff",
      "governance",
      "Qualified legal/compliance review has not released the launch hold. This packet does not provide legal advice."
    ),
    item(
      "live-adapter-payment-notice-report-freeze",
      "Live adapters, payments, notices, and official reports remain frozen",
      launchBlocksPreserved ? "PASS" : "BLOCKED",
      "production portal readiness summary",
      "operations",
      launchBlocksPreserved
        ? null
        : "Live adapters, payment capture, notice sends, and official reports must remain frozen."
    ),
    item(
      "final-human-release-ceremony",
      "Final qualified human release ceremony",
      "BLOCKED",
      "final launch hold release",
      "governance",
      "Final qualified human release ceremony has not been performed."
    ),
  ];
}

export function evaluateProductionLaunchEvidencePacket(
  input: ProductionLaunchEvidencePacketInput = {}
): ProductionLaunchEvidencePacketResult {
  const readiness = evaluateProductionPortalReadinessGate();
  const evidenceItems = buildEvidenceItems();
  const blockingReasons = evidenceItems
    .filter((evidence) => evidence.status !== "PASS")
    .map((evidence) => evidence.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No production portal launch has been executed.",
    "No public verification authority has been granted.",
    "No live external source has been contacted.",
    "No payment capture has been enabled.",
    "No borrower notice has been sent.",
    "No official report has been published.",
    "No go-live release has been approved.",
    "This packet is review evidence only.",
  ];
  const packet: ProductionLaunchEvidencePacket = {
    packetId: `production-launch-evidence:${input.packetScope ?? "platform"}`,
    packetStatus: "GO_LIVE_EVIDENCE_PACKET_BLOCKED",
    productionBlocked: true,
    evidencePacketAvailable: true,
    releaseCandidate: false,
    goLiveApproved: false,
    portalLaunchExecuted: false,
    publicLaunchAllowed: false,
    liveExternalActionAllowed: false,
    liveExternalActionPerformed: false,
    paymentCaptureAllowed: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    publicVerificationAllowed: false,
    legalAdviceProvided: false,
    officialRelianceAllowed: false,
    controlledPromotionRequired: true,
    qualifiedHumanApprovalRequired: true,
    finalLaunchHoldRequired: true,
    productionPortalReadinessVersion: PRODUCTION_PORTAL_READINESS_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    readinessReviewCount: readiness.summary.totalReviews,
    evidenceItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION,
    productionPortalReadinessVersion: PRODUCTION_PORTAL_READINESS_GATE_VERSION,
    launchEvidencePackets: [packet],
    summary: {
      totalPackets: 1,
      totalEvidenceItems: evidenceItems.length,
      pass: evidenceItems.filter((evidence) => evidence.status === "PASS").length,
      reviewRequired: evidenceItems.filter(
        (evidence) => evidence.status === "REVIEW_REQUIRED"
      ).length,
      blocked: evidenceItems.filter((evidence) => evidence.status === "BLOCKED")
        .length,
      releaseCandidate: 0,
      goLiveApproved: 0,
      portalLaunchExecuted: 0,
      publicLaunchAllowed: 0,
      liveExternalActionsAllowed: 0,
      liveExternalActionsPerformed: 0,
      paymentCaptureAllowed: 0,
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      publicVerificationAllowed: 0,
      legalAdviceProvided: 0,
      officialRelianceAllowed: 0,
      finalLaunchHoldRequired: 1,
    },
    disclosures,
    launchReleasePosture:
      "GO_LIVE_RELEASE_BLOCKED_PENDING_QUALIFIED_APPROVAL",
  };
}
