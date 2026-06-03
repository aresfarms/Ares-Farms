import {
  CONTROLLED_PROMOTION_ACTIVATION_GATE_VERSION,
  evaluateControlledPromotionActivationGate,
} from "@/lib/governance/controlledPromotionActivationGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceProductionBlocks,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";
import type {
  PortableSurfaceAudience,
  PortableVerticalSurface,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Portal Readiness Preflight Gate
 *
 * Master Volume Governance:
 * - Vol 0: reviews borrower, lender, sponsor, public, and internal surfaces
 *   as one governed platform orientation.
 * - Vol I: keeps portal launch subordinate to constitutional authority,
 *   accountable approval, and controlled promotion.
 * - Vol II: prevents launch review from creating approvals, underwriting
 *   reliance, official reports, borrower notice sends, payment capture, legal
 *   advice, public verification, lender commitments, sponsor commitments, or
 *   agency commitments.
 * - Vol III: assembles deterministic preflight checks across module
 *   manifests, portable surfaces, backend dependencies, replay posture,
 *   security, auth, audit, observability, rollback, incident, and launch hold
 *   controls without publishing a production portal.
 * - Vol III-B: exposes runtime, classification, version, observability, and
 *   replay posture for launch-readiness evidence.
 * - Vol IV: supports launch hold, operator handoff, rollback, incident bridge,
 *   communications freeze, and readiness review.
 * - Vol V: preserves content claims, controlled disclosure, portability,
 *   explainability, replayability, advisory-only boundaries, and public-safe
 *   language.
 * - Vol VI: binds source intelligence, public DTO, and portable vertical
 *   surface requirements into portal launch review while live fetches remain
 *   blocked.
 */

export const PRODUCTION_PORTAL_READINESS_GATE_VERSION =
  "production-portal-readiness-gate-v0.1.0";

export const PRODUCTION_PORTAL_READINESS_REQUIRED_CONTROLS = [
  "portable vertical surface inventory attached",
  "module manifest route registered",
  "backend dependency surface declared",
  "Master Volume governance requirements attached",
  "required public-safe status language present",
  "content claims gate must pass",
  "record-level permission posture reviewed",
  "classification and redaction posture reviewed",
  "replay and audit export posture reviewed",
  "production auth activation gate must pass",
  "security and audit readiness gate must pass",
  "production backend readiness gate must pass",
  "controlled promotion activation evidence attached",
  "environment and HTTPS configuration reviewed",
  "monitoring, incident, and rollback runbooks reviewed",
  "operator launch checklist and support routing reviewed",
  "borrower data-rights and portability posture reviewed",
  "communications and public copy freeze reviewed",
  "final no-live-action launch hold confirmed",
] as const;

export type ProductionPortalReadinessCheckStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionPortalReadinessCheck = {
  id: string;
  label: string;
  status: ProductionPortalReadinessCheckStatus;
  evidenceRef: string | null;
  blockingReason: string | null;
};

export type ProductionPortalReadinessReview = {
  readinessReviewId: string;
  surfaceId: string;
  label: string;
  route: string;
  audience: PortableSurfaceAudience;
  moduleRefs: string[];
  launchReadinessStatus: "PRODUCTION_PORTAL_LAUNCH_BLOCKED";
  productionBlocked: true;
  preflightReviewAvailable: true;
  portalLaunchApproved: false;
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
  humanApprovalRequired: true;
  replayRequired: true;
  requiredControls: string[];
  safeMessages: string[];
  productionBlocks: string[];
  checks: ProductionPortalReadinessCheck[];
  blockingReasons: string[];
};

export type ProductionPortalReadinessSummary = {
  totalReviews: number;
  productionBlocked: number;
  preflightReviewAvailable: number;
  launchReady: number;
  launchExecuted: number;
  publicLaunchAllowed: number;
  liveExternalActionsAllowed: number;
  liveExternalActionsPerformed: number;
  paymentCaptureAllowed: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  publicVerificationAllowed: number;
  legalAdviceProvided: number;
  officialRelianceAllowed: number;
  controlledPromotionRequired: number;
  humanApprovalRequired: number;
  requiredControls: string[];
  productionRestrictions: string[];
};

export type ProductionPortalReadinessGateInput = {
  surfaceId?: string | null;
};

export type ProductionPortalReadinessGateResult = {
  version: string;
  controlledPromotionActivationVersion: string;
  summary: ProductionPortalReadinessSummary;
  productionPortalReadinessReviews: ProductionPortalReadinessReview[];
  disclosures: string[];
  launchPosture: "ALL_PRODUCTION_PORTAL_LAUNCH_BLOCKED_PENDING_FINAL_APPROVAL";
};

function check(
  id: string,
  label: string,
  status: ProductionPortalReadinessCheckStatus,
  evidenceRef: string | null,
  blockingReason: string | null
): ProductionPortalReadinessCheck {
  return {
    id,
    label,
    status,
    evidenceRef,
    blockingReason,
  };
}

function routeRegistered(surface: PortableVerticalSurface): boolean {
  return moduleManifests.some((manifest) => manifest.route === surface.route);
}

function hasRequiredSafeMessages(surface: PortableVerticalSurface): boolean {
  return portableSurfaceSafeMessages.every((message) =>
    surface.safeMessages.includes(message)
  );
}

function hasProductionBlock(
  surface: PortableVerticalSurface,
  requiredBlock: string
): boolean {
  return surface.productionBlocks.includes(requiredBlock);
}

function readinessReviewForSurface(
  surface: PortableVerticalSurface,
  controlledPromotionEvidenceRef: string
): ProductionPortalReadinessReview {
  const checks: ProductionPortalReadinessCheck[] = [
    check(
      "portable-surface-inventory-attached",
      "Portable vertical surface inventory attached",
      "PASS",
      surface.id,
      null
    ),
    check(
      "module-manifest-route-registered",
      "Module manifest route registered",
      routeRegistered(surface) ? "PASS" : "REVIEW_REQUIRED",
      surface.route,
      routeRegistered(surface)
        ? null
        : "Surface route is not present in the module manifest registry."
    ),
    check(
      "backend-dependency-surface-declared",
      "Backend dependency surface declared",
      surface.requiredBackendSurfaces.length > 0 ? "PASS" : "BLOCKED",
      surface.requiredBackendSurfaces.join(", "),
      surface.requiredBackendSurfaces.length > 0
        ? null
        : "Surface does not declare governed backend dependencies."
    ),
    check(
      "master-volume-governance-attached",
      "Master Volume governance requirements attached",
      surface.governanceRequirements.length > 0 ? "PASS" : "BLOCKED",
      surface.governanceRequirements.join(", "),
      surface.governanceRequirements.length > 0
        ? null
        : "Surface does not carry Master Volume governance requirements."
    ),
    check(
      "required-safe-status-language",
      "Required public-safe status language present",
      hasRequiredSafeMessages(surface) ? "PASS" : "BLOCKED",
      surface.safeMessages.join(" | "),
      hasRequiredSafeMessages(surface)
        ? null
        : "Surface is missing required safe status messages."
    ),
    check(
      "content-claims-gate",
      "Content claims gate must pass",
      "REVIEW_REQUIRED",
      "npm run smoke:content-claims",
      "Latest production launch review must rerun content claims before public exposure."
    ),
    check(
      "record-level-permission-posture",
      "Record-level permission posture reviewed",
      "REVIEW_REQUIRED",
      "npm run smoke:record-access",
      "Latest production launch review must rerun record-level access checks."
    ),
    check(
      "classification-redaction-posture",
      "Classification and redaction posture reviewed",
      "REVIEW_REQUIRED",
      "npm run smoke:redaction",
      "Latest production launch review must rerun classification and redaction checks."
    ),
    check(
      "replay-audit-export-posture",
      "Replay and audit export posture reviewed",
      "REVIEW_REQUIRED",
      "npm run verify:replay",
      "Latest production launch review must rerun replay and audit evidence checks."
    ),
    check(
      "production-auth-activation-gate",
      "Production auth activation gate must pass",
      "BLOCKED",
      "npm run auth:activation:production",
      "Production auth activation has not been approved in this preflight review."
    ),
    check(
      "security-audit-readiness-gate",
      "Security and audit readiness gate must pass",
      "BLOCKED",
      "npm run security:audit:production",
      "Production security and audit readiness has not been approved in this preflight review."
    ),
    check(
      "production-backend-readiness-gate",
      "Production backend readiness gate must pass",
      "BLOCKED",
      "npm run backend:production-readiness:production",
      "Production backend activation has not been approved in this preflight review."
    ),
    check(
      "controlled-promotion-activation-evidence",
      "Controlled promotion activation evidence attached",
      "PASS",
      controlledPromotionEvidenceRef,
      null
    ),
    check(
      "environment-https-configuration",
      "Environment and HTTPS configuration reviewed",
      "BLOCKED",
      "NEXTAUTH_URL DATABASE_URL API_AUTH_ENFORCEMENT",
      "Production HTTPS, database SSL, auth enforcement, and rate-limit environment controls require final review."
    ),
    check(
      "monitoring-incident-rollback-runbooks",
      "Monitoring, incident, and rollback runbooks reviewed",
      "BLOCKED",
      "monitoring incident rollback",
      "Launch monitoring, incident bridge, rollback owner, and emergency hold controls are not approved."
    ),
    check(
      "operator-launch-checklist",
      "Operator launch checklist and support routing reviewed",
      "BLOCKED",
      "operator-launch-checklist",
      "Operator support, escalation, and launch communications roster is not approved."
    ),
    check(
      "borrower-data-rights-portability",
      "Borrower data-rights and portability posture reviewed",
      "REVIEW_REQUIRED",
      "/portal/borrower/data-rights",
      "Borrower data-rights and portability posture requires final production review."
    ),
    check(
      "communications-public-copy-freeze",
      "Communications and public copy freeze reviewed",
      "BLOCKED",
      "public-copy-freeze",
      "Customer-facing copy, claims, and disclosure freeze is not approved for launch."
    ),
    check(
      "final-no-live-action-launch-hold",
      "Final no-live-action launch hold confirmed",
      hasProductionBlock(surface, "no live external agency call") &&
      hasProductionBlock(surface, "no payment capture") &&
      hasProductionBlock(surface, "no borrower notice send") &&
      hasProductionBlock(surface, "no official report publication") &&
      hasProductionBlock(surface, "no public verification claim")
        ? "PASS"
        : "BLOCKED",
      surface.productionBlocks.join(" | "),
      hasProductionBlock(surface, "no live external agency call") &&
      hasProductionBlock(surface, "no payment capture") &&
      hasProductionBlock(surface, "no borrower notice send") &&
      hasProductionBlock(surface, "no official report publication") &&
      hasProductionBlock(surface, "no public verification claim")
        ? null
        : "Surface does not preserve the required final no-live-action launch hold."
    ),
  ];
  const blockingReasons = checks
    .filter((gate) => gate.status !== "PASS")
    .map((gate) => gate.blockingReason)
    .filter((reason): reason is string => Boolean(reason));

  return {
    readinessReviewId: `production-portal-readiness:${surface.id}`,
    surfaceId: surface.id,
    label: surface.label,
    route: surface.route,
    audience: surface.audience,
    moduleRefs: [...surface.moduleRefs],
    launchReadinessStatus: "PRODUCTION_PORTAL_LAUNCH_BLOCKED",
    productionBlocked: true,
    preflightReviewAvailable: true,
    portalLaunchApproved: false,
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
    humanApprovalRequired: true,
    replayRequired: true,
    requiredControls: [...PRODUCTION_PORTAL_READINESS_REQUIRED_CONTROLS],
    safeMessages: [...surface.safeMessages],
    productionBlocks: [...surface.productionBlocks],
    checks,
    blockingReasons,
  };
}

export function evaluateProductionPortalReadinessGate(
  input: ProductionPortalReadinessGateInput = {}
): ProductionPortalReadinessGateResult {
  const controlledPromotion = evaluateControlledPromotionActivationGate();
  const controlledPromotionEvidenceRef = `${controlledPromotion.version}:${controlledPromotion.activationPosture}`;
  const surfaces = input.surfaceId
    ? allPortableVerticalSurfaces.filter((surface) => surface.id === input.surfaceId)
    : allPortableVerticalSurfaces;
  const productionPortalReadinessReviews = surfaces.map((surface) =>
    readinessReviewForSurface(surface, controlledPromotionEvidenceRef)
  );

  return {
    version: PRODUCTION_PORTAL_READINESS_GATE_VERSION,
    controlledPromotionActivationVersion:
      CONTROLLED_PROMOTION_ACTIVATION_GATE_VERSION,
    summary: {
      totalReviews: productionPortalReadinessReviews.length,
      productionBlocked: productionPortalReadinessReviews.length,
      preflightReviewAvailable: productionPortalReadinessReviews.length,
      launchReady: 0,
      launchExecuted: productionPortalReadinessReviews.filter(
        (review) => review.portalLaunchExecuted
      ).length,
      publicLaunchAllowed: productionPortalReadinessReviews.filter(
        (review) => review.publicLaunchAllowed
      ).length,
      liveExternalActionsAllowed: productionPortalReadinessReviews.filter(
        (review) => review.liveExternalActionAllowed
      ).length,
      liveExternalActionsPerformed: productionPortalReadinessReviews.filter(
        (review) => review.liveExternalActionPerformed
      ).length,
      paymentCaptureAllowed: productionPortalReadinessReviews.filter(
        (review) => review.paymentCaptureAllowed
      ).length,
      borrowerNoticeSendsAllowed: productionPortalReadinessReviews.filter(
        (review) => review.borrowerNoticeSendAllowed
      ).length,
      officialReportsAllowed: productionPortalReadinessReviews.filter(
        (review) => review.officialReportPublicationAllowed
      ).length,
      publicVerificationAllowed: productionPortalReadinessReviews.filter(
        (review) => review.publicVerificationAllowed
      ).length,
      legalAdviceProvided: productionPortalReadinessReviews.filter(
        (review) => review.legalAdviceProvided
      ).length,
      officialRelianceAllowed: productionPortalReadinessReviews.filter(
        (review) => review.officialRelianceAllowed
      ).length,
      controlledPromotionRequired: productionPortalReadinessReviews.length,
      humanApprovalRequired: productionPortalReadinessReviews.length,
      requiredControls: [...PRODUCTION_PORTAL_READINESS_REQUIRED_CONTROLS],
      productionRestrictions: [...portableSurfaceProductionBlocks],
    },
    productionPortalReadinessReviews,
    disclosures: [
      ...portableSurfaceSafeMessages,
      "No production portal launch has been executed.",
      "No public verification authority has been granted.",
      "No live external source has been contacted.",
      "No payment capture has been enabled.",
      "No borrower notice has been sent.",
      "No official report has been published.",
    ],
    launchPosture:
      "ALL_PRODUCTION_PORTAL_LAUNCH_BLOCKED_PENDING_FINAL_APPROVAL",
  };
}
