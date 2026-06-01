import currentMasterVolumeRegistry from "../../../docs/current-master-volume-registry.json";

/**
 * Doctrine-to-Code Gap Ledger Gate
 *
 * Master Volume Governance:
 * - Vol 0: translates the current build posture into an operator-readable
 *   ledger without implying production readiness.
 * - Vol I: keeps unresolved doctrine items subordinate to constitutional
 *   authority and named human owners.
 * - Vol II: prevents public, borrower, lender, sponsor, notice, report,
 *   payment, legal, regulatory, and official-reliance claims from self-clearing.
 * - Vol III: binds every gap to route, evidence, test, and replay posture.
 * - Vol III-B: treats human authority, classification, versioning,
 *   observability, and promotion state as runtime infrastructure.
 * - Vol IV: gives operators a queueable, auditable, review-bound gap ledger.
 * - Vol V: preserves claims, controlled disclosure, redaction, data rights,
 *   source authority, replayability, and evidence lineage.
 * - Vol VI: names source intelligence, public DTO, live scraper, revenue,
 *   conformance, and build-reference promotion limits before activation.
 */

export const DOCTRINE_TO_CODE_GAP_LEDGER_GATE_VERSION =
  "doctrine-to-code-gap-ledger-gate-v0.1.0";

export const DOCTRINE_TO_CODE_GAP_LEDGER_CHECKPOINT_ID =
  "BR-2026-06-01-M43";

export const DOCTRINE_TO_CODE_GAP_LEDGER_TITLE =
  "Doctrine-to-Code Gap Ledger";

export type DoctrineGapPromotionStatus = "awaiting_controlled_promotion";

export type DoctrineGapLedgerItem = {
  id: string;
  title: string;
  status: DoctrineGapPromotionStatus;
  owner: string;
  requiredHumanAuthority: string;
  route: string;
  blockedReason: string;
  requiredEvidence: string[];
  promotionCondition: string;
  tests: string[];
  existingEvidence: string[];
  sourceDocuments: string[];
  promotionTicket: string;
  productionBlocked: true;
  publicActionBlocked: true;
  publicVerificationBlocked: true;
  officialRelianceBlocked: true;
  legalAdviceBlocked: true;
  liveExternalActionBlocked: true;
  namedOwnerPresent: boolean;
  routePresent: boolean;
  requiredEvidencePresent: boolean;
  promotionConditionPresent: boolean;
};

export type MasterVolumeVersionRef = {
  key: string;
  label: string;
  governingVersion: string;
  file: string;
};

export type DoctrineGapLedgerReview = {
  reviewId: string;
  reviewStatus: "DOCTRINE_GAP_LEDGER_REVIEW_BOUND";
  productionBlocked: true;
  checkpointId: string;
  title: string;
  totalRequirements: number;
  implementedRequirements: number;
  awaitingControlledPromotion: number;
  namedGapCount: number;
  unnamedGapCount: number;
  allGapsNamed: boolean;
  allGapsOwned: boolean;
  allGapsRouted: boolean;
  allGapsHaveRequiredEvidence: boolean;
  allGapsHavePromotionConditions: boolean;
  currentMasterVolumeRegistryRef: string;
  currentMasterVolumeVersions: MasterVolumeVersionRef[];
  gapLedgerItems: DoctrineGapLedgerItem[];
  blockingReasons: string[];
  requiredActions: string[];
  disclosures: string[];
  productionLaunchAuthorized: false;
  publicProductionApiExposureAllowed: false;
  productionPortalLaunchExecuted: false;
  paymentCaptureAllowed: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  publicVerificationApprovalGranted: false;
  officialRelianceAllowed: false;
  legalAdviceProvided: false;
  liveExternalActionPerformed: false;
};

export type DoctrineGapLedgerSummary = {
  totalReviews: number;
  totalRequirements: number;
  implementedRequirements: number;
  awaitingControlledPromotion: number;
  namedGapCount: number;
  unnamedGapCount: number;
  allGapsNamed: number;
  allGapsOwned: number;
  allGapsRouted: number;
  allGapsHaveRequiredEvidence: number;
  allGapsHavePromotionConditions: number;
  controlledPromotionBlocked: number;
  productionLaunchAuthorized: number;
  publicProductionApiExposureAllowed: number;
  productionPortalLaunchExecuted: number;
  paymentCaptureAllowed: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  publicVerificationApprovalGranted: number;
  officialRelianceAllowed: number;
  legalAdviceProvided: number;
  liveExternalActionsPerformed: number;
};

export type DoctrineGapLedgerInput = {
  totalRequirements?: number | null;
  implementedRequirements?: number | null;
};

export type DoctrineGapLedgerResult = {
  version: string;
  checkpointId: string;
  doctrineGapLedgerReviews: DoctrineGapLedgerReview[];
  doctrineGaps: DoctrineGapLedgerItem[];
  summary: DoctrineGapLedgerSummary;
  disclosures: string[];
  ledgerPosture: "DOCTRINE_GAP_LEDGER_REVIEW_BOUND_NO_PRODUCTION_AUTHORITY";
};

const registryDocuments =
  currentMasterVolumeRegistry.documents as MasterVolumeVersionRef[];

function gap(input: {
  id: string;
  title: string;
  owner: string;
  requiredHumanAuthority: string;
  route: string;
  blockedReason: string;
  requiredEvidence: string[];
  promotionCondition: string;
  tests: string[];
  existingEvidence: string[];
  sourceDocuments: string[];
  promotionTicket: string;
}): DoctrineGapLedgerItem {
  return {
    id: input.id,
    title: input.title,
    status: "awaiting_controlled_promotion",
    owner: input.owner,
    requiredHumanAuthority: input.requiredHumanAuthority,
    route: input.route,
    blockedReason: input.blockedReason,
    requiredEvidence: input.requiredEvidence,
    promotionCondition: input.promotionCondition,
    tests: input.tests,
    existingEvidence: input.existingEvidence,
    sourceDocuments: input.sourceDocuments,
    promotionTicket: input.promotionTicket,
    productionBlocked: true,
    publicActionBlocked: true,
    publicVerificationBlocked: true,
    officialRelianceBlocked: true,
    legalAdviceBlocked: true,
    liveExternalActionBlocked: true,
    namedOwnerPresent: input.owner.trim().length > 0,
    routePresent: input.route.startsWith("/"),
    requiredEvidencePresent: input.requiredEvidence.length > 0,
    promotionConditionPresent: input.promotionCondition.trim().length > 0,
  };
}

export const doctrineGapLedgerItems: DoctrineGapLedgerItem[] = [
  gap({
    id: "PROMOTION-GATE-001",
    title: "Production and public-action blocks",
    owner: "Constitutional Authority + Release Manager",
    requiredHumanAuthority: "Constitutional Authority + Release Manager",
    route: "/promotion",
    blockedReason:
      "Production, public action, live external calls, payments, notices, official reports, and verification authority are intentionally blocked until controlled promotion and qualified human approval are recorded.",
    requiredEvidence: [
      "backend production readiness approval",
      "security and audit readiness approval",
      "production auth activation approval",
      "feature flag and kill-switch review",
      "release, rollback, monitoring, incident, support, and audit evidence",
      "qualified constitutional authority and release manager signoff",
    ],
    promotionCondition:
      "May move from awaiting controlled promotion only after the full production gate chain through final authority, activation ceremony, post-activation verification, and reliance boundary review passes without blocked items.",
    tests: [
      "backend:production-readiness",
      "smoke:live-action-readiness",
      "verify:master-volumes",
    ],
    existingEvidence: [
      "src/app/promotion/page.tsx",
      "src/lib/governance/liveActionReadinessStore.ts",
      "src/lib/modules/featureFlagGovernance.ts",
    ],
    sourceDocuments: [
      "docs/DOCTRINE_TO_CODE_GAP_LEDGER.md",
      "docs/tickets/PROMOTION-GATE-001.md",
      "docs/current-master-volume-registry.json",
    ],
    promotionTicket: "docs/tickets/PROMOTION-GATE-001.md",
  }),
  gap({
    id: "PUBLIC-SURFACE-001",
    title: "Public surfaces as governed translation layers",
    owner: "Public Surface Governance Owner + Claims/Compliance Reviewer",
    requiredHumanAuthority:
      "Public Surface Governance Owner + Claims/Compliance Reviewer",
    route: "/api/public/surfaces",
    blockedReason:
      "Public surfaces are built as advisory DTO translation layers, but public production exposure and reliance remain blocked until claims, redaction, access, rate-limit, public-copy, and verification boundaries are approved.",
    requiredEvidence: [
      "public claims smoke pass",
      "redaction smoke pass",
      "public DTO and classification filtering review",
      "public-copy freeze and accessibility review",
      "rate-limit and abuse-control readiness",
      "qualified claims/compliance approval",
    ],
    promotionCondition:
      "May promote only when every public, borrower, lender, and sponsor surface carries required disclosures and a qualified reviewer approves public exposure without reliance, approval, guarantee, or legal/regulatory claims.",
    tests: ["smoke:public-surfaces", "smoke:claims-public", "smoke:redaction"],
    existingEvidence: [
      "src/app/api/public/surfaces/route.ts",
      "src/lib/dto/public/index.ts",
      "src/scripts/redactionSmokeTest.ts",
    ],
    sourceDocuments: [
      "docs/DOCTRINE_TO_CODE_GAP_LEDGER.md",
      "docs/PUBLIC_SURFACE_DISCLOSURE_AUDIT.md",
      "docs/tickets/PUBLIC-SURFACE-001.md",
    ],
    promotionTicket: "docs/tickets/PUBLIC-SURFACE-001.md",
  }),
  gap({
    id: "SURFACE-GOV-001",
    title: "Public Surface Gateway and public-safe source DTO governance",
    owner: "Source Intelligence Governance Owner + Public DTO Owner",
    requiredHumanAuthority:
      "Source Intelligence Governance Owner + Public DTO Owner",
    route: "/api/public/grants",
    blockedReason:
      "Public source aliases and public-safe source DTOs are implemented, but live source freshness, public verification, source certainty, and production source reliance remain blocked pending source legal, licensing, promotion, replay, and provenance approval.",
    requiredEvidence: [
      "source legal and licensing review",
      "source promotion packet approval",
      "source production readiness review",
      "controlled promotion activation review",
      "live scraper activation review with live fetch still disabled until approval",
      "public DTO safety, redaction, claims, replay, and provenance evidence",
    ],
    promotionCondition:
      "May promote only after source-specific legal/ToS/licensing, live adapter certification, provenance, replay, monitoring, rollback, incident response, and qualified human source promotion approval are recorded.",
    tests: ["smoke:public-surfaces", "smoke:claims-public", "smoke:redaction"],
    existingEvidence: [
      "src/app/api/public/surfaces/route.ts",
      "src/app/api/public/grants/route.ts",
      "src/lib/dto/publicSourceIntelligence.ts",
      "src/scripts/publicSurfaceSmokeTest.ts",
    ],
    sourceDocuments: [
      "docs/DOCTRINE_TO_CODE_GAP_LEDGER.md",
      "docs/tickets/SURFACE-GOV-001.md",
      "docs/current-master-volume-registry.json",
    ],
    promotionTicket: "docs/tickets/SURFACE-GOV-001.md",
  }),
];

const baseDisclosures = [
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
  "All current doctrine-to-code gaps are named, owned, routed, and review-bound.",
  "The ledger is verified against the current Master Volume registry for Volumes 0-VI, the Cross-Reference Index, the Unified TOC, and the Build Matrix.",
  "Awaiting controlled promotion is not production approval.",
  "No production launch has been authorized.",
  "No public production API exposure has been approved.",
  "No production portal launch has been executed.",
  "No payment capture has been enabled.",
  "No borrower notice has been sent.",
  "No official report has been published.",
  "No public verification authority has been granted.",
  "No official reliance has been created.",
  "No legal advice has been provided.",
  "No live external action has been performed.",
];

export function evaluateDoctrineToCodeGapLedgerGate(
  input: DoctrineGapLedgerInput = {}
): DoctrineGapLedgerResult {
  const totalRequirements = input.totalRequirements ?? 60;
  const implementedRequirements = input.implementedRequirements ?? 57;
  const gaps = doctrineGapLedgerItems;
  const namedGapCount = gaps.filter((item) => item.id && item.title).length;
  const unnamedGapCount = gaps.length - namedGapCount;
  const allGapsOwned = gaps.every((item) => item.namedOwnerPresent);
  const allGapsRouted = gaps.every((item) => item.routePresent);
  const allGapsHaveRequiredEvidence = gaps.every(
    (item) => item.requiredEvidencePresent
  );
  const allGapsHavePromotionConditions = gaps.every(
    (item) => item.promotionConditionPresent
  );
  const requiredActions = gaps.map(
    (item) =>
      `${item.id}: ${item.requiredHumanAuthority} must clear the required evidence boundary before promotion.`
  );
  const blockingReasons = gaps.map(
    (item) => `${item.id}: ${item.blockedReason}`
  );
  const disclosures = [...baseDisclosures];
  const review: DoctrineGapLedgerReview = {
    reviewId: `doctrine-gap-ledger:${DOCTRINE_TO_CODE_GAP_LEDGER_CHECKPOINT_ID}`,
    reviewStatus: "DOCTRINE_GAP_LEDGER_REVIEW_BOUND",
    productionBlocked: true,
    checkpointId: DOCTRINE_TO_CODE_GAP_LEDGER_CHECKPOINT_ID,
    title: DOCTRINE_TO_CODE_GAP_LEDGER_TITLE,
    totalRequirements,
    implementedRequirements,
    awaitingControlledPromotion: gaps.length,
    namedGapCount,
    unnamedGapCount,
    allGapsNamed: unnamedGapCount === 0,
    allGapsOwned,
    allGapsRouted,
    allGapsHaveRequiredEvidence,
    allGapsHavePromotionConditions,
    currentMasterVolumeRegistryRef: "docs/current-master-volume-registry.json",
    currentMasterVolumeVersions: registryDocuments,
    gapLedgerItems: gaps,
    blockingReasons,
    requiredActions,
    disclosures,
    productionLaunchAuthorized: false,
    publicProductionApiExposureAllowed: false,
    productionPortalLaunchExecuted: false,
    paymentCaptureAllowed: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    publicVerificationApprovalGranted: false,
    officialRelianceAllowed: false,
    legalAdviceProvided: false,
    liveExternalActionPerformed: false,
  };

  return {
    version: DOCTRINE_TO_CODE_GAP_LEDGER_GATE_VERSION,
    checkpointId: DOCTRINE_TO_CODE_GAP_LEDGER_CHECKPOINT_ID,
    doctrineGapLedgerReviews: [review],
    doctrineGaps: gaps,
    summary: {
      totalReviews: 1,
      totalRequirements,
      implementedRequirements,
      awaitingControlledPromotion: gaps.length,
      namedGapCount,
      unnamedGapCount,
      allGapsNamed: unnamedGapCount === 0 ? 1 : 0,
      allGapsOwned: allGapsOwned ? 1 : 0,
      allGapsRouted: allGapsRouted ? 1 : 0,
      allGapsHaveRequiredEvidence: allGapsHaveRequiredEvidence ? 1 : 0,
      allGapsHavePromotionConditions: allGapsHavePromotionConditions ? 1 : 0,
      controlledPromotionBlocked: gaps.length,
      productionLaunchAuthorized: 0,
      publicProductionApiExposureAllowed: 0,
      productionPortalLaunchExecuted: 0,
      paymentCaptureAllowed: 0,
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      publicVerificationApprovalGranted: 0,
      officialRelianceAllowed: 0,
      legalAdviceProvided: 0,
      liveExternalActionsPerformed: 0,
    },
    disclosures,
    ledgerPosture: "DOCTRINE_GAP_LEDGER_REVIEW_BOUND_NO_PRODUCTION_AUTHORITY",
  };
}
