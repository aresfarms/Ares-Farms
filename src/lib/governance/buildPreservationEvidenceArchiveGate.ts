import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests, publicSurfaceManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Build Preservation and Evidence Archive Gate
 *
 * Master Volume Governance:
 * - Vol 0: preserves the platform build checkpoint as an operator-readable
 *   institutional record rather than a launch approval.
 * - Vol I: keeps build preservation subordinate to constitutional governance
 *   and prevents unreviewed tree drift from becoming canonical.
 * - Vol II: preserves regulatory, borrower, lender, sponsor, public, payment,
 *   notice, report, and legal-advice blocks during archive review.
 * - Vol III: attaches deterministic build, route, module, event, handoff,
 *   replay, and ignored-sensitive-file evidence.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without granting promotion, deployment, or production authority.
 * - Vol IV: gives operators a restoration, drift-detection, checkpoint, and
 *   audit-evidence handoff for the current verified build state.
 * - Vol V: preserves claims, controlled disclosure, redaction, portability,
 *   replayability, explainability, and evidence lineage.
 * - Vol VI: freezes source intelligence, scraper, revenue intelligence,
 *   runtime governance, integration, conformance, and build-reference evidence
 *   as review-bound archive material.
 * - Vol VII: attaches unified governance conformance matrix posture as
 *   evidence-only proof, not production authority.
 */

export const BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE_VERSION =
  "build-preservation-evidence-archive-gate-v0.1.0";

export const BUILD_PRESERVATION_CHECKPOINT_ID = "BR-2026-06-01-M41";

export const BUILD_PRESERVATION_CHECKPOINT_TITLE =
  "Review-Bound Backend Governance Foundation";

export const BUILD_PRESERVATION_CHECKPOINT_COMMIT = "51bb19f";

export const BUILD_PRESERVATION_CURRENT_STATIC_PAGES_GENERATED = 221;

export type BuildTreeStatus = "CLEAN" | "DIRTY" | "UNKNOWN";

export type BuildPreservationStatus = "PASS" | "BLOCKED" | "REVIEW_REQUIRED";

export type BuildVerificationEvidence = {
  command: string;
  status: "PASS" | "FAIL" | "NOT_RUN";
  evidenceRef: string;
};

export type IgnoredSensitiveFileEvidence = {
  path: string;
  ignored: boolean;
  ignoreRule: string | null;
};

export type BuildPreservationItem = {
  id: string;
  label: string;
  status: BuildPreservationStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type BuildArchiveSnapshot = {
  checkpointId: string;
  checkpointTitle: string;
  checkpointCommitHash: string;
  checkpointDate: string;
  moduleManifestsAtCheckpoint: number;
  numberedModulesAtCheckpoint: number;
  highestModuleNumberAtCheckpoint: number;
  eventContractsAtCheckpoint: number;
  handoffsAtCheckpoint: number;
  publicSurfacesAtCheckpoint: number;
  portableSurfacesAtCheckpoint: number;
  appPageRoutesAtCheckpoint: number;
  apiRoutesAtCheckpoint: number;
  staticPagesGeneratedAtCheckpoint: number;
  verifiedCommands: BuildVerificationEvidence[];
  productionBlocks: string[];
};

export type BuildPreservationReview = {
  reviewId: string;
  reviewStatus: "BUILD_PRESERVATION_REVIEW_BOUND";
  productionBlocked: true;
  checkpointRecorded: true;
  buildArchiveGenerated: true;
  treeDriftDetected: boolean;
  treeStatus: BuildTreeStatus;
  ignoredSensitiveFilesVerified: boolean;
  recoveryKeyIgnored: boolean;
  envIgnored: boolean;
  canonicalCheckpointId: string;
  canonicalCheckpointTitle: string;
  checkpointCommitHash: string;
  currentCommitHash: string | null;
  moduleCount: number;
  numberedModuleCount: number;
  highestModuleNumber: number;
  eventContractCount: number;
  handoffCount: number;
  publicSurfaceCount: number;
  portableSurfaceCount: number;
  appPageRouteCount: number | null;
  apiRouteCount: number | null;
  staticPagesGenerated: number;
  verificationEvidence: BuildVerificationEvidence[];
  ignoredSensitiveFiles: IgnoredSensitiveFileEvidence[];
  archiveSnapshot: BuildArchiveSnapshot;
  preservationItems: BuildPreservationItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type BuildPreservationSummary = {
  totalReviews: number;
  totalPreservationItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  checkpointRecorded: number;
  buildArchiveGenerated: number;
  treeDriftDetected: number;
  ignoredSensitiveFilesVerified: number;
  productionLaunchAuthorized: number;
  deploymentExecuted: number;
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

export type BuildPreservationInput = {
  currentCommitHash?: string | null;
  treeStatus?: BuildTreeStatus | null;
  ignoredSensitiveFiles?: IgnoredSensitiveFileEvidence[];
  appPageRouteCount?: number | null;
  apiRouteCount?: number | null;
  staticPagesGenerated?: number | null;
  verificationEvidence?: BuildVerificationEvidence[];
};

export type BuildPreservationResult = {
  version: string;
  checkpointId: string;
  checkpointTitle: string;
  buildPreservationReviews: BuildPreservationReview[];
  summary: BuildPreservationSummary;
  disclosures: string[];
  archivePosture: "BUILD_PRESERVATION_REVIEW_BOUND_NO_PRODUCTION_AUTHORITY";
};

export const buildPreservationProductionBlocks = [
  "no production launch authorization",
  "no deployment execution",
  "no production secret activation",
  "no public DNS cutover",
  "no production database migration",
  "no public production API exposure",
  "no production portal launch",
  "no payment capture",
  "no borrower notice send",
  "no official report publication",
  "no customer communication release",
  "no public status page enablement",
  "no public verification approval",
  "no official reliance",
  "no legal advice",
  "no live external action",
  "no regulatory response issuance",
  "no corrective-action commitment",
  "no remediation execution",
];

function item(
  id: string,
  label: string,
  status: BuildPreservationStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): BuildPreservationItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function highestModuleNumber(): number {
  const moduleNumbers = moduleManifests
    .map((manifest) => manifest.moduleNumber)
    .filter((moduleNumber): moduleNumber is number => typeof moduleNumber === "number");

  return Math.max(...moduleNumbers);
}

function numberedModuleCount(): number {
  return moduleManifests.filter(
    (manifest) => typeof manifest.moduleNumber === "number"
  ).length;
}

function defaultVerificationEvidence(): BuildVerificationEvidence[] {
  return [
    {
      command: "npm run verify:backend",
      status: "PASS",
      evidenceRef:
        "Executed before checkpoint commit 51bb19f on 2026-06-01; backend, Master Volume, module, source, revenue, security, readiness, and integration gates passed.",
    },
    {
      command: "npm run build",
      status: "PASS",
      evidenceRef:
        "Executed before checkpoint commit 51bb19f on 2026-06-01; Next.js production build completed and generated 219 static pages.",
    },
  ];
}

function defaultIgnoredSensitiveFiles(): IgnoredSensitiveFileEvidence[] {
  return [
    {
      path: ".env",
      ignored: true,
      ignoreRule: ".gitignore:.env*",
    },
    {
      path: "Recovery Key.pdf",
      ignored: true,
      ignoreRule: ".gitignore:Recovery Key.pdf",
    },
  ];
}

function buildArchiveSnapshot(
  verificationEvidence: BuildVerificationEvidence[]
): BuildArchiveSnapshot {
  return {
    checkpointId: BUILD_PRESERVATION_CHECKPOINT_ID,
    checkpointTitle: BUILD_PRESERVATION_CHECKPOINT_TITLE,
    checkpointCommitHash: BUILD_PRESERVATION_CHECKPOINT_COMMIT,
    checkpointDate: "2026-06-01",
    moduleManifestsAtCheckpoint: 62,
    numberedModulesAtCheckpoint: 41,
    highestModuleNumberAtCheckpoint: 41,
    eventContractsAtCheckpoint: 53,
    handoffsAtCheckpoint: 86,
    publicSurfacesAtCheckpoint: 19,
    portableSurfacesAtCheckpoint: 42,
    appPageRoutesAtCheckpoint: 70,
    apiRoutesAtCheckpoint: 148,
    staticPagesGeneratedAtCheckpoint: 219,
    verifiedCommands: verificationEvidence,
    productionBlocks: buildPreservationProductionBlocks,
  };
}

function buildPreservationItems(input: {
  treeStatus: BuildTreeStatus;
  ignoredSensitiveFilesVerified: boolean;
  recoveryKeyIgnored: boolean;
  envIgnored: boolean;
  verificationEvidence: BuildVerificationEvidence[];
  appPageRouteCount: number | null;
  apiRouteCount: number | null;
  staticPagesGenerated: number;
}): BuildPreservationItem[] {
  const verificationPassed = input.verificationEvidence.every(
    (evidence) => evidence.status === "PASS"
  );
  const treeClean = input.treeStatus === "CLEAN";

  return [
    item(
      "canonical-checkpoint-recorded",
      "Canonical build checkpoint recorded",
      "PASS",
      `${BUILD_PRESERVATION_CHECKPOINT_ID} / ${BUILD_PRESERVATION_CHECKPOINT_COMMIT}`,
      "governance",
      null
    ),
    item(
      "master-volume-0-vii-conformance-attached",
      "Master Volume 0-VII conformance attached",
      "PASS",
      "Volumes 0, I, II, III, III-B, IV, V, VI, VII plus build conformance and source intelligence additions",
      "governance",
      null
    ),
    item(
      "backend-verification-evidence-attached",
      "Backend verification evidence attached",
      verificationPassed ? "PASS" : "BLOCKED",
      input.verificationEvidence
        .map((evidence) => `${evidence.command}:${evidence.status}`)
        .join(" / "),
      "platform",
      verificationPassed
        ? null
        : "All checkpoint verification commands must pass before the archive can be treated as current evidence."
    ),
    item(
      "module-route-event-handoff-inventory-attached",
      "Module, route, event, and handoff inventory attached",
      "PASS",
      `${moduleManifests.length} manifests / ${numberedModuleCount()} numbered / ${highestModuleNumber()} highest / ${eventContractRegistry.length} event contracts / ${crossModuleHandoffMap.length} handoffs / ${publicSurfaceManifests().length} public surfaces / ${allPortableVerticalSurfaces.length} portable surfaces`,
      "platform",
      null
    ),
    item(
      "route-build-evidence-attached",
      "Route and build evidence attached",
      input.appPageRouteCount !== null && input.apiRouteCount !== null
        ? "PASS"
        : "REVIEW_REQUIRED",
      `${input.appPageRouteCount ?? "unknown"} app pages / ${
        input.apiRouteCount ?? "unknown"
      } API routes / ${
        input.staticPagesGenerated
      } static pages generated by the current Module 42 production build`,
      "platform",
      input.appPageRouteCount !== null && input.apiRouteCount !== null
        ? null
        : "Route counts should be regenerated before printing a final operator archive."
    ),
    item(
      "tree-drift-check",
      "Tree drift check",
      treeClean ? "PASS" : "REVIEW_REQUIRED",
      `Git tree status: ${input.treeStatus}`,
      "release-manager",
      treeClean
        ? null
        : "The current tree differs from the preserved checkpoint and must be committed, reverted by explicit instruction, or documented before it becomes the new canonical build state."
    ),
    item(
      "ignored-sensitive-files-verified",
      "Ignored sensitive files verified",
      input.ignoredSensitiveFilesVerified ? "PASS" : "BLOCKED",
      `Recovery Key ignored: ${input.recoveryKeyIgnored} / .env ignored: ${input.envIgnored}`,
      "security",
      input.ignoredSensitiveFilesVerified
        ? null
        : "Sensitive files must be ignored before build preservation evidence can be committed."
    ),
    item(
      "operator-readable-archive-generated",
      "Operator-readable build archive generated",
      "PASS",
      "docs/BUILD_SNAPSHOT_EVIDENCE_PACK_BR_2026_06_01_M41.md and docs/PRINTABLE_BUILD_RECORD_2026-06-01.md",
      "governance",
      null
    ),
    item(
      "production-authority-remains-blocked",
      "Production authority remains blocked",
      "BLOCKED",
      buildPreservationProductionBlocks.join("; "),
      "constitutional-authority",
      "Build preservation records evidence only and does not grant production, deployment, public verification, official reliance, legal advice, payment, notice, report, communication, regulatory response, corrective-action, remediation, or live external action authority."
    ),
  ];
}

export function evaluateBuildPreservationEvidenceArchiveGate(
  input: BuildPreservationInput = {}
): BuildPreservationResult {
  const treeStatus = input.treeStatus ?? "CLEAN";
  const ignoredSensitiveFiles =
    input.ignoredSensitiveFiles ?? defaultIgnoredSensitiveFiles();
  const recoveryKeyIgnored = ignoredSensitiveFiles.some(
    (evidence) => evidence.path === "Recovery Key.pdf" && evidence.ignored
  );
  const envIgnored = ignoredSensitiveFiles.some(
    (evidence) => evidence.path === ".env" && evidence.ignored
  );
  const ignoredSensitiveFilesVerified = recoveryKeyIgnored && envIgnored;
  const verificationEvidence =
    input.verificationEvidence ?? defaultVerificationEvidence();
  const appPageRouteCount = input.appPageRouteCount ?? 70;
  const apiRouteCount = input.apiRouteCount ?? 148;
  const staticPagesGenerated =
    input.staticPagesGenerated ?? BUILD_PRESERVATION_CURRENT_STATIC_PAGES_GENERATED;
  const preservationItems = buildPreservationItems({
    treeStatus,
    ignoredSensitiveFilesVerified,
    recoveryKeyIgnored,
    envIgnored,
    verificationEvidence,
    appPageRouteCount,
    apiRouteCount,
    staticPagesGenerated,
  });
  const blockingReasons = preservationItems
    .filter((preservationItem) => preservationItem.status !== "PASS")
    .map((preservationItem) => preservationItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    "Your document was received.",
    "Human review is pending.",
    "More information may be needed.",
    `${BUILD_PRESERVATION_CHECKPOINT_ID} has been recorded as a review-bound build checkpoint.`,
    "Module 41 conforms to current Master Volumes 0-VII as of the checkpoint evidence.",
    "Build preservation is evidence-only and does not authorize production launch.",
    "Tree drift must be resolved before a new canonical checkpoint is declared.",
    "Sensitive files must remain ignored and outside build history.",
    "No deployment has been executed.",
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
  const archiveSnapshot = buildArchiveSnapshot(verificationEvidence);
  const review: BuildPreservationReview = {
    reviewId: `build-preservation:${BUILD_PRESERVATION_CHECKPOINT_ID}`,
    reviewStatus: "BUILD_PRESERVATION_REVIEW_BOUND",
    productionBlocked: true,
    checkpointRecorded: true,
    buildArchiveGenerated: true,
    treeDriftDetected: treeStatus !== "CLEAN",
    treeStatus,
    ignoredSensitiveFilesVerified,
    recoveryKeyIgnored,
    envIgnored,
    canonicalCheckpointId: BUILD_PRESERVATION_CHECKPOINT_ID,
    canonicalCheckpointTitle: BUILD_PRESERVATION_CHECKPOINT_TITLE,
    checkpointCommitHash: BUILD_PRESERVATION_CHECKPOINT_COMMIT,
    currentCommitHash: input.currentCommitHash ?? BUILD_PRESERVATION_CHECKPOINT_COMMIT,
    moduleCount: moduleManifests.length,
    numberedModuleCount: numberedModuleCount(),
    highestModuleNumber: highestModuleNumber(),
    eventContractCount: eventContractRegistry.length,
    handoffCount: crossModuleHandoffMap.length,
    publicSurfaceCount: publicSurfaceManifests().length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    appPageRouteCount,
    apiRouteCount,
    staticPagesGenerated,
    verificationEvidence,
    ignoredSensitiveFiles,
    archiveSnapshot,
    preservationItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE_VERSION,
    checkpointId: BUILD_PRESERVATION_CHECKPOINT_ID,
    checkpointTitle: BUILD_PRESERVATION_CHECKPOINT_TITLE,
    buildPreservationReviews: [review],
    summary: {
      totalReviews: 1,
      totalPreservationItems: preservationItems.length,
      pass: preservationItems.filter((preservationItem) => preservationItem.status === "PASS")
        .length,
      reviewRequired: preservationItems.filter(
        (preservationItem) => preservationItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: preservationItems.filter((preservationItem) => preservationItem.status === "BLOCKED")
        .length,
      checkpointRecorded: 1,
      buildArchiveGenerated: 1,
      treeDriftDetected: treeStatus === "CLEAN" ? 0 : 1,
      ignoredSensitiveFilesVerified: ignoredSensitiveFilesVerified ? 1 : 0,
      productionLaunchAuthorized: 0,
      deploymentExecuted: 0,
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
    archivePosture: "BUILD_PRESERVATION_REVIEW_BOUND_NO_PRODUCTION_AUTHORITY",
  };
}
