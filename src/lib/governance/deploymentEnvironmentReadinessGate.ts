import {
  PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION,
  evaluateProductionLaunchEvidencePacket,
} from "@/lib/governance/productionLaunchEvidencePacket";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Deployment Environment Readiness Gate
 *
 * Master Volume Governance:
 * - Vol 0: reviews deployment readiness as one platform-level release posture.
 * - Vol I: keeps environment promotion subordinate to constitutional authority,
 *   accountable release ownership, and explicit human approval.
 * - Vol II: prevents release-candidate review from becoming approvals, legal
 *   advice, official reports, notice sends, payment capture, public
 *   verification, partner commitments, agency commitments, or official
 *   reliance.
 * - Vol III: assembles deterministic, replay-safe proof across build,
 *   typecheck, backend smoke, integration smoke, secrets, migrations,
 *   observability, rollback, incident, DNS, TLS, CDN, WAF, and backup posture.
 * - Vol III-B: exposes classification, version, observability, and runtime
 *   evidence without executing deployment or live infrastructure changes.
 * - Vol IV: supports release manager review, deployment hold, incident bridge,
 *   rollback planning, support routing, and production freeze controls.
 * - Vol V: preserves content claims, data rights, replayability, explainability,
 *   controlled disclosure, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, and portable vertical
 *   surfaces blocked from live production exposure until approved.
 */

export const DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION =
  "deployment-environment-readiness-gate-v0.1.0";

export type DeploymentEnvironmentReadinessStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type DeploymentEnvironmentReadinessItem = {
  id: string;
  label: string;
  status: DeploymentEnvironmentReadinessStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type DeploymentEnvironmentReadinessReview = {
  reviewId: string;
  reviewStatus: "DEPLOYMENT_ENVIRONMENT_READINESS_BLOCKED";
  productionBlocked: true;
  releaseCandidateApproved: false;
  deploymentExecuted: false;
  environmentPromotionAllowed: false;
  productionSecretsActivated: false;
  publicDnsCutoverAllowed: false;
  cdnWafTlsEnabled: false;
  databaseMigrationAllowed: false;
  liveExternalActionAllowed: false;
  liveExternalActionPerformed: false;
  paymentCaptureAllowed: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  publicVerificationAllowed: false;
  legalAdviceProvided: false;
  officialRelianceAllowed: false;
  qualifiedReleaseManagerRequired: true;
  finalGoLiveHoldRequired: true;
  productionLaunchEvidenceVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  launchEvidencePacketCount: number;
  environmentItems: DeploymentEnvironmentReadinessItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type DeploymentEnvironmentReadinessSummary = {
  totalReviews: number;
  totalEnvironmentItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  releaseCandidateApproved: number;
  deploymentExecuted: number;
  environmentPromotionAllowed: number;
  productionSecretsActivated: number;
  publicDnsCutoverAllowed: number;
  cdnWafTlsEnabled: number;
  databaseMigrationAllowed: number;
  liveExternalActionsAllowed: number;
  liveExternalActionsPerformed: number;
  paymentCaptureAllowed: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  publicVerificationAllowed: number;
  legalAdviceProvided: number;
  officialRelianceAllowed: number;
  finalGoLiveHoldRequired: number;
};

export type DeploymentEnvironmentReadinessInput = {
  environmentScope?: string | null;
};

export type DeploymentEnvironmentReadinessResult = {
  version: string;
  productionLaunchEvidenceVersion: string;
  deploymentEnvironmentReviews: DeploymentEnvironmentReadinessReview[];
  summary: DeploymentEnvironmentReadinessSummary;
  disclosures: string[];
  deploymentPosture: "DEPLOYMENT_ENVIRONMENT_BLOCKED_PENDING_RELEASE_APPROVAL";
};

function item(
  id: string,
  label: string,
  status: DeploymentEnvironmentReadinessStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): DeploymentEnvironmentReadinessItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function launchBlocksPreserved(): boolean {
  const launchEvidence = evaluateProductionLaunchEvidencePacket();

  return (
    launchEvidence.summary.goLiveApproved === 0 &&
    launchEvidence.summary.portalLaunchExecuted === 0 &&
    launchEvidence.summary.publicLaunchAllowed === 0 &&
    launchEvidence.summary.liveExternalActionsAllowed === 0 &&
    launchEvidence.summary.liveExternalActionsPerformed === 0 &&
    launchEvidence.summary.paymentCaptureAllowed === 0 &&
    launchEvidence.summary.borrowerNoticeSendsAllowed === 0 &&
    launchEvidence.summary.officialReportsAllowed === 0 &&
    launchEvidence.summary.publicVerificationAllowed === 0 &&
    launchEvidence.summary.legalAdviceProvided === 0 &&
    launchEvidence.summary.officialRelianceAllowed === 0
  );
}

function buildEnvironmentItems(): DeploymentEnvironmentReadinessItem[] {
  const launchEvidence = evaluateProductionLaunchEvidencePacket();
  const launchEvidenceAttached =
    launchEvidence.launchEvidencePackets.length > 0 && launchBlocksPreserved();

  return [
    item(
      "master-volume-release-controls-attached",
      "Master Volume release controls attached",
      "PASS",
      "Master Volume Series / release and deployment controls",
      "governance",
      null
    ),
    item(
      "production-launch-evidence-attached",
      "Production launch evidence packet attached",
      launchEvidenceAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION}:${launchEvidence.launchReleasePosture}`,
      "governance",
      launchEvidenceAttached
        ? null
        : "Deployment readiness requires blocked production launch evidence with zero live release authority."
    ),
    item(
      "module-and-surface-inventory-attached",
      "Module and portable surface inventory attached",
      "PASS",
      `${moduleManifests.length} module manifests / ${allPortableVerticalSurfaces.length} portable surfaces`,
      "platform",
      null
    ),
    item(
      "release-candidate-build-freeze",
      "Release-candidate build freeze",
      "REVIEW_REQUIRED",
      "npm run build",
      "platform",
      "Production build must be rerun from the final release candidate before deployment approval."
    ),
    item(
      "release-candidate-typecheck-freeze",
      "Release-candidate typecheck freeze",
      "REVIEW_REQUIRED",
      "npx tsc --noEmit",
      "platform",
      "TypeScript must be rerun from the final release candidate before deployment approval."
    ),
    item(
      "backend-smoke-freeze",
      "Backend smoke freeze",
      "REVIEW_REQUIRED",
      "npm run smoke:backend",
      "platform",
      "Full backend smoke evidence must be rerun against the final release candidate."
    ),
    item(
      "integration-smoke-freeze",
      "Integration smoke freeze",
      "REVIEW_REQUIRED",
      "npm run smoke:integration",
      "platform",
      "Cross-module integration smoke evidence must be rerun against the final release candidate."
    ),
    item(
      "content-claims-public-copy-freeze",
      "Content claims and public-copy freeze",
      "REVIEW_REQUIRED",
      "npm run smoke:content-claims",
      "governance",
      "Customer-facing copy and public claims must be frozen and re-reviewed before deployment approval."
    ),
    item(
      "production-secret-inventory-approval",
      "Production secret inventory approval",
      "BLOCKED",
      "secret inventory attestation",
      "security",
      "Production secrets, API keys, webhook secrets, database credentials, and vault references have not been approved. Secret values are not collected by this gate."
    ),
    item(
      "production-database-migration-approval",
      "Production database migration approval",
      "BLOCKED",
      "database migration plan",
      "platform",
      "Production migration order, rollback plan, backup window, and restore evidence have not been approved."
    ),
    item(
      "deployment-provider-target-approval",
      "Deployment provider target approval",
      "BLOCKED",
      "deployment provider environment lock",
      "platform",
      "The production deployment target, environment lock, release owner, and promotion window have not been approved."
    ),
    item(
      "dns-cdn-tls-waf-approval",
      "DNS, CDN, TLS, and WAF approval",
      "BLOCKED",
      "edge infrastructure checklist",
      "security",
      "DNS cutover, CDN cache policy, TLS certificate, WAF policy, and rate limits have not been approved."
    ),
    item(
      "monitoring-alerting-slo-approval",
      "Monitoring, alerting, and SLO approval",
      "BLOCKED",
      "monitoring and alerting runbook",
      "operations",
      "Production metrics, alerts, error budgets, uptime checks, and escalation routing have not been approved."
    ),
    item(
      "backup-restore-dr-approval",
      "Backup, restore, and disaster recovery approval",
      "BLOCKED",
      "backup restore disaster recovery checklist",
      "operations",
      "Backup verification, restore test, disaster recovery owner, and retention evidence have not been approved."
    ),
    item(
      "rollback-emergency-hold-approval",
      "Rollback and emergency hold approval",
      "BLOCKED",
      "rollback and emergency hold runbook",
      "operations",
      "Rollback triggers, kill switch authority, emergency hold owner, and rollback execution plan have not been approved."
    ),
    item(
      "incident-support-roster-approval",
      "Incident bridge and support roster approval",
      "BLOCKED",
      "incident and support launch roster",
      "operations",
      "Incident bridge, operator support roster, communication freeze, and after-hours escalation are not approved."
    ),
    item(
      "live-actions-payment-notice-report-freeze",
      "Live actions, payments, notices, and official reports remain frozen",
      launchBlocksPreserved() ? "PASS" : "BLOCKED",
      "production launch evidence packet",
      "governance",
      launchBlocksPreserved()
        ? null
        : "Live actions, payment capture, notice sends, official reports, public verification, legal advice, and official reliance must remain frozen."
    ),
    item(
      "final-release-manager-attestation",
      "Final qualified release manager attestation",
      "BLOCKED",
      "deployment release hold",
      "governance",
      "A qualified release manager has not released the deployment environment hold."
    ),
  ];
}

export function evaluateDeploymentEnvironmentReadinessGate(
  input: DeploymentEnvironmentReadinessInput = {}
): DeploymentEnvironmentReadinessResult {
  const launchEvidence = evaluateProductionLaunchEvidencePacket();
  const environmentItems = buildEnvironmentItems();
  const blockingReasons = environmentItems
    .filter((environmentItem) => environmentItem.status !== "PASS")
    .map((environmentItem) => environmentItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No deployment has been executed.",
    "No release candidate has been approved.",
    "No production secret has been activated.",
    "No public DNS cutover has been approved.",
    "No production database migration has been approved.",
    "No production portal launch has been executed.",
    "No public verification authority has been granted.",
    "No live external source has been contacted.",
    "No payment capture has been enabled.",
    "No borrower notice has been sent.",
    "No official report has been published.",
    "This gate is deployment review evidence only.",
  ];
  const review: DeploymentEnvironmentReadinessReview = {
    reviewId: `deployment-environment-readiness:${
      input.environmentScope ?? "platform"
    }`,
    reviewStatus: "DEPLOYMENT_ENVIRONMENT_READINESS_BLOCKED",
    productionBlocked: true,
    releaseCandidateApproved: false,
    deploymentExecuted: false,
    environmentPromotionAllowed: false,
    productionSecretsActivated: false,
    publicDnsCutoverAllowed: false,
    cdnWafTlsEnabled: false,
    databaseMigrationAllowed: false,
    liveExternalActionAllowed: false,
    liveExternalActionPerformed: false,
    paymentCaptureAllowed: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    publicVerificationAllowed: false,
    legalAdviceProvided: false,
    officialRelianceAllowed: false,
    qualifiedReleaseManagerRequired: true,
    finalGoLiveHoldRequired: true,
    productionLaunchEvidenceVersion: PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    launchEvidencePacketCount: launchEvidence.launchEvidencePackets.length,
    environmentItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION,
    productionLaunchEvidenceVersion: PRODUCTION_LAUNCH_EVIDENCE_PACKET_VERSION,
    deploymentEnvironmentReviews: [review],
    summary: {
      totalReviews: 1,
      totalEnvironmentItems: environmentItems.length,
      pass: environmentItems.filter(
        (environmentItem) => environmentItem.status === "PASS"
      ).length,
      reviewRequired: environmentItems.filter(
        (environmentItem) => environmentItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: environmentItems.filter(
        (environmentItem) => environmentItem.status === "BLOCKED"
      ).length,
      releaseCandidateApproved: 0,
      deploymentExecuted: 0,
      environmentPromotionAllowed: 0,
      productionSecretsActivated: 0,
      publicDnsCutoverAllowed: 0,
      cdnWafTlsEnabled: 0,
      databaseMigrationAllowed: 0,
      liveExternalActionsAllowed: 0,
      liveExternalActionsPerformed: 0,
      paymentCaptureAllowed: 0,
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      publicVerificationAllowed: 0,
      legalAdviceProvided: 0,
      officialRelianceAllowed: 0,
      finalGoLiveHoldRequired: 1,
    },
    disclosures,
    deploymentPosture:
      "DEPLOYMENT_ENVIRONMENT_BLOCKED_PENDING_RELEASE_APPROVAL",
  };
}
