import {
  RELEASE_CANDIDATE_FREEZE_PLAN_VERSION,
  evaluateReleaseCandidateFreezePlan,
} from "@/lib/governance/releaseCandidateFreezePlan";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Cutover Hold Gate
 *
 * Master Volume Governance:
 * - Vol 0: treats production cutover as one platform-level launch posture.
 * - Vol I: keeps cutover subordinate to constitutional authority,
 *   accountable release ownership, and qualified human approval.
 * - Vol II: prevents cutover review from becoming production approval,
 *   public verification, official reports, borrower notice sends, payment
 *   capture, legal advice, partner commitments, agency commitments, or
 *   official reliance.
 * - Vol III: assembles deterministic, replay-safe proof across release
 *   freeze, build, typecheck, smoke, secrets, migrations, DNS, TLS, CDN, WAF,
 *   monitoring, backup, rollback, incident, support, and launch holds.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without deploying, activating secrets, or changing infrastructure.
 * - Vol IV: supports launch hold review, cutover board review, incident
 *   bridge readiness, rollback readiness, support routing, and communication
 *   freeze.
 * - Vol V: preserves claims, data rights, controlled disclosure,
 *   replayability, explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable vertical
 *   surfaces, and production exposure blocked until controlled promotion is
 *   complete.
 */

export const PRODUCTION_CUTOVER_HOLD_GATE_VERSION =
  "production-cutover-hold-gate-v0.1.0";

export type ProductionCutoverHoldStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionCutoverHoldItem = {
  id: string;
  label: string;
  status: ProductionCutoverHoldStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionCutoverHoldReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_CUTOVER_HOLD_BLOCKED";
  productionBlocked: true;
  productionCutoverApproved: false;
  productionCutoverExecuted: false;
  releaseCandidateFreezeApproved: false;
  releaseCandidateFrozen: false;
  releaseCandidateApproved: false;
  freezeHoldReleased: false;
  deploymentHoldReleased: false;
  finalGoLiveHoldReleased: false;
  deploymentExecuted: false;
  environmentPromotionAllowed: false;
  productionSecretsActivated: false;
  publicDnsCutoverAllowed: false;
  cdnWafTlsEnabled: false;
  databaseMigrationAllowed: false;
  publicProductionApiExposureAllowed: false;
  productionPortalLaunchAllowed: false;
  productionPortalLaunchExecuted: false;
  liveExternalActionAllowed: false;
  liveExternalActionPerformed: false;
  paymentCaptureAllowed: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  publicVerificationAllowed: false;
  legalAdviceProvided: false;
  officialRelianceAllowed: false;
  qualifiedReleaseManagerRequired: true;
  releaseBoardRequired: true;
  finalLaunchHoldRequired: true;
  releaseCandidateFreezeVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  releaseCandidateFreezePlanCount: number;
  cutoverItems: ProductionCutoverHoldItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionCutoverHoldSummary = {
  totalReviews: number;
  totalCutoverItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  productionCutoverApproved: number;
  productionCutoverExecuted: number;
  releaseCandidateFreezeApproved: number;
  releaseCandidateFrozen: number;
  releaseCandidateApproved: number;
  freezeHoldReleased: number;
  deploymentHoldReleased: number;
  finalGoLiveHoldReleased: number;
  deploymentExecuted: number;
  environmentPromotionAllowed: number;
  productionSecretsActivated: number;
  publicDnsCutoverAllowed: number;
  cdnWafTlsEnabled: number;
  databaseMigrationAllowed: number;
  publicProductionApiExposureAllowed: number;
  productionPortalLaunchAllowed: number;
  productionPortalLaunchExecuted: number;
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

export type ProductionCutoverHoldInput = {
  cutoverScope?: string | null;
};

export type ProductionCutoverHoldResult = {
  version: string;
  releaseCandidateFreezeVersion: string;
  productionCutoverHoldReviews: ProductionCutoverHoldReview[];
  summary: ProductionCutoverHoldSummary;
  disclosures: string[];
  cutoverPosture: "PRODUCTION_CUTOVER_BLOCKED_PENDING_QUALIFIED_APPROVAL";
};

function item(
  id: string,
  label: string,
  status: ProductionCutoverHoldStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionCutoverHoldItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function freezeBlocksPreserved(
  freezePlan: ReturnType<typeof evaluateReleaseCandidateFreezePlan>
): boolean {
  return (
    freezePlan.summary.releaseCandidateFreezeApproved === 0 &&
    freezePlan.summary.releaseCandidateFrozen === 0 &&
    freezePlan.summary.releaseCandidateApproved === 0 &&
    freezePlan.summary.deploymentExecuted === 0 &&
    freezePlan.summary.environmentPromotionAllowed === 0 &&
    freezePlan.summary.productionSecretsActivated === 0 &&
    freezePlan.summary.publicDnsCutoverAllowed === 0 &&
    freezePlan.summary.cdnWafTlsEnabled === 0 &&
    freezePlan.summary.databaseMigrationAllowed === 0 &&
    freezePlan.summary.liveExternalActionsAllowed === 0 &&
    freezePlan.summary.liveExternalActionsPerformed === 0 &&
    freezePlan.summary.paymentCaptureAllowed === 0 &&
    freezePlan.summary.borrowerNoticeSendsAllowed === 0 &&
    freezePlan.summary.officialReportsAllowed === 0 &&
    freezePlan.summary.publicVerificationAllowed === 0 &&
    freezePlan.summary.legalAdviceProvided === 0 &&
    freezePlan.summary.officialRelianceAllowed === 0
  );
}

function buildCutoverItems(
  freezePlan: ReturnType<typeof evaluateReleaseCandidateFreezePlan>
): ProductionCutoverHoldItem[] {
  const freezePlanBlocksPreserved = freezeBlocksPreserved(freezePlan);
  const freezePlanAttached =
    freezePlan.releaseCandidateFreezePlans.length > 0 &&
    freezePlanBlocksPreserved;

  return [
    item(
      "master-volume-cutover-controls-attached",
      "Master Volume cutover controls attached",
      "PASS",
      "Master Volume Series / production cutover and launch-hold controls",
      "governance",
      null
    ),
    item(
      "release-candidate-freeze-plan-attached",
      "Release-candidate freeze plan attached",
      freezePlanAttached ? "PASS" : "BLOCKED",
      `${RELEASE_CANDIDATE_FREEZE_PLAN_VERSION}:${freezePlan.freezePosture}`,
      "governance",
      freezePlanAttached
        ? null
        : "Production cutover hold review requires blocked release-candidate freeze evidence with zero production action authority."
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
      "cutover-board-packet-review",
      "Cutover board packet review",
      "REVIEW_REQUIRED",
      "cutover board packet",
      "governance",
      "The final cutover board packet must be reviewed by qualified release, compliance, security, operations, and support owners."
    ),
    item(
      "final-public-url-copy-review",
      "Final public URL and copy review",
      "REVIEW_REQUIRED",
      "public URL, public-copy, and content-claims review",
      "governance",
      "The production URL, public-copy freeze, and content-claims evidence must be re-reviewed before any cutover approval."
    ),
    item(
      "support-incident-readiness-review",
      "Support and incident readiness review",
      "REVIEW_REQUIRED",
      "support roster and incident bridge evidence",
      "operations",
      "Support routing, incident bridge, escalation windows, and communication templates must be re-reviewed before cutover approval."
    ),
    item(
      "rollback-drill-review",
      "Rollback drill review",
      "REVIEW_REQUIRED",
      "rollback drill and emergency hold evidence",
      "operations",
      "Rollback procedure, emergency hold authority, and operator rehearsal evidence must be reviewed before cutover approval."
    ),
    item(
      "launch-hold-release",
      "Final launch hold release",
      "BLOCKED",
      "final launch hold",
      "governance",
      "The final launch hold has not been released by a qualified release manager."
    ),
    item(
      "deployment-hold-release",
      "Deployment hold release",
      "BLOCKED",
      "deployment hold",
      "governance",
      "The deployment hold has not been released by a qualified release manager."
    ),
    item(
      "freeze-hold-release",
      "Release-candidate freeze hold release",
      "BLOCKED",
      "release-candidate freeze hold",
      "governance",
      "The release-candidate freeze hold has not been released by a qualified release manager."
    ),
    item(
      "production-deployment-execution",
      "Production deployment execution",
      "BLOCKED",
      "deployment execution record",
      "platform",
      "Production deployment has not been approved or executed."
    ),
    item(
      "production-secret-activation",
      "Production secret activation",
      "BLOCKED",
      "production secret activation record",
      "security",
      "Production secrets, API keys, webhook secrets, and database credentials have not been activated."
    ),
    item(
      "production-database-migration-execution",
      "Production database migration execution",
      "BLOCKED",
      "production database migration execution record",
      "platform",
      "Production database migrations have not been approved or executed."
    ),
    item(
      "public-dns-cdn-tls-waf-cutover",
      "Public DNS, CDN, TLS, and WAF cutover",
      "BLOCKED",
      "edge cutover record",
      "security",
      "Public DNS cutover, CDN, TLS, and WAF changes have not been approved or executed."
    ),
    item(
      "public-production-api-exposure",
      "Public production API exposure",
      "BLOCKED",
      "public production API exposure record",
      "security",
      "Public production API exposure has not been approved or enabled."
    ),
    item(
      "production-portal-launch",
      "Production portal launch",
      "BLOCKED",
      "production portal launch record",
      "platform",
      "The production portal has not been launched."
    ),
    item(
      "payment-notice-report-verification-enablements",
      "Payments, notices, official reports, and public verification remain disabled",
      "BLOCKED",
      "payment, notice, official report, and public verification enablement records",
      "governance",
      "Payment capture, borrower notice sends, official report publication, and public verification have not been approved or enabled."
    ),
    item(
      "final-qualified-release-manager-cutover-signoff",
      "Final qualified release manager cutover signoff",
      "BLOCKED",
      "production cutover hold",
      "governance",
      "A qualified release manager has not approved production cutover or released the final launch hold."
    ),
    item(
      "live-actions-payment-notice-report-freeze-preserved",
      "Live actions, payments, notices, reports, public verification, and official reliance remain frozen",
      freezePlanBlocksPreserved ? "PASS" : "BLOCKED",
      "release-candidate freeze plan",
      "governance",
      freezePlanBlocksPreserved
        ? null
        : "Live actions, payment capture, notice sends, official reports, public verification, legal advice, and official reliance must remain frozen."
    ),
  ];
}

export function evaluateProductionCutoverHoldGate(
  input: ProductionCutoverHoldInput = {}
): ProductionCutoverHoldResult {
  const freezePlan = evaluateReleaseCandidateFreezePlan();
  const cutoverItems = buildCutoverItems(freezePlan);
  const blockingReasons = cutoverItems
    .filter((cutoverItem) => cutoverItem.status !== "PASS")
    .map((cutoverItem) => cutoverItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No production cutover has been approved or executed.",
    "No launch hold has been released.",
    "No deployment hold has been released.",
    "No release-candidate freeze hold has been released.",
    "No release candidate has been frozen or approved.",
    "No deployment has been executed.",
    "No production secret has been activated.",
    "No public DNS cutover has been approved.",
    "No production database migration has been approved.",
    "No production portal launch has been executed.",
    "No public production API exposure has been approved.",
    "No public verification authority has been granted.",
    "No live external source has been contacted.",
    "No payment capture has been enabled.",
    "No borrower notice has been sent.",
    "No official report has been published.",
    "This gate is production cutover hold review evidence only.",
  ];
  const review: ProductionCutoverHoldReview = {
    reviewId: `production-cutover-hold:${input.cutoverScope ?? "platform"}`,
    reviewStatus: "PRODUCTION_CUTOVER_HOLD_BLOCKED",
    productionBlocked: true,
    productionCutoverApproved: false,
    productionCutoverExecuted: false,
    releaseCandidateFreezeApproved: false,
    releaseCandidateFrozen: false,
    releaseCandidateApproved: false,
    freezeHoldReleased: false,
    deploymentHoldReleased: false,
    finalGoLiveHoldReleased: false,
    deploymentExecuted: false,
    environmentPromotionAllowed: false,
    productionSecretsActivated: false,
    publicDnsCutoverAllowed: false,
    cdnWafTlsEnabled: false,
    databaseMigrationAllowed: false,
    publicProductionApiExposureAllowed: false,
    productionPortalLaunchAllowed: false,
    productionPortalLaunchExecuted: false,
    liveExternalActionAllowed: false,
    liveExternalActionPerformed: false,
    paymentCaptureAllowed: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    publicVerificationAllowed: false,
    legalAdviceProvided: false,
    officialRelianceAllowed: false,
    qualifiedReleaseManagerRequired: true,
    releaseBoardRequired: true,
    finalLaunchHoldRequired: true,
    releaseCandidateFreezeVersion: RELEASE_CANDIDATE_FREEZE_PLAN_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    releaseCandidateFreezePlanCount:
      freezePlan.releaseCandidateFreezePlans.length,
    cutoverItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_CUTOVER_HOLD_GATE_VERSION,
    releaseCandidateFreezeVersion: RELEASE_CANDIDATE_FREEZE_PLAN_VERSION,
    productionCutoverHoldReviews: [review],
    summary: {
      totalReviews: 1,
      totalCutoverItems: cutoverItems.length,
      pass: cutoverItems.filter((cutoverItem) => cutoverItem.status === "PASS")
        .length,
      reviewRequired: cutoverItems.filter(
        (cutoverItem) => cutoverItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: cutoverItems.filter(
        (cutoverItem) => cutoverItem.status === "BLOCKED"
      ).length,
      productionCutoverApproved: 0,
      productionCutoverExecuted: 0,
      releaseCandidateFreezeApproved: 0,
      releaseCandidateFrozen: 0,
      releaseCandidateApproved: 0,
      freezeHoldReleased: 0,
      deploymentHoldReleased: 0,
      finalGoLiveHoldReleased: 0,
      deploymentExecuted: 0,
      environmentPromotionAllowed: 0,
      productionSecretsActivated: 0,
      publicDnsCutoverAllowed: 0,
      cdnWafTlsEnabled: 0,
      databaseMigrationAllowed: 0,
      publicProductionApiExposureAllowed: 0,
      productionPortalLaunchAllowed: 0,
      productionPortalLaunchExecuted: 0,
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
    cutoverPosture: "PRODUCTION_CUTOVER_BLOCKED_PENDING_QUALIFIED_APPROVAL",
  };
}
