import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_RELEASE_BOARD_VERSION,
  evaluateProductionReleaseBoard,
} from "@/lib/governance/productionReleaseBoard";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Production Release Board Evidence Packet API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed release-board evidence surface without
 *   launching production.
 * - Vol I: keeps release-board authority subordinate to constitutional
 *   governance, release ownership, and qualified approval.
 * - Vol II: blocks release-board evidence from becoming production approval,
 *   official reports, notice sends, payment capture, public verification, legal
 *   advice, partner commitments, agency commitments, or official reliance.
 * - Vol III: assembles deterministic evidence across cutover hold, release
 *   freeze, deployment posture, secrets, migrations, edge, monitoring, backup,
 *   rollback, incident, support, communications, and launch holds.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to release-board evidence.
 * - Vol IV: supports release board review, quorum review, launch hold, incident
 *   bridge, support routing, rollback review, and communication freeze.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   portability, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while live production exposure remains blocked.
 */

type ProductionReleaseBoardBody = {
  actorId?: string | null;
  boardScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(req: NextRequest): Promise<ProductionReleaseBoardBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionReleaseBoardBody;
  } catch {
    return {};
  }
}

function createTraceId(operation: string): string {
  return `${operation}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET(req: NextRequest) {
  return handleProductionReleaseBoard(req, "production-release-board.read");
}

export async function POST(req: NextRequest) {
  return handleProductionReleaseBoard(req, "production-release-board.record");
}

async function handleProductionReleaseBoard(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const boardScope = body.boardScope ?? req.nextUrl.searchParams.get("boardScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-release-board",
      traceId,
      schemaVersion: PRODUCTION_RELEASE_BOARD_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-release-board",
        boardScope,
        method: req.method,
        releaseBoardApprovalGranted: false,
        cutoverAuthorityGranted: false,
        productionCutoverApproved: false,
        productionCutoverExecuted: false,
        launchHoldReleased: false,
        deploymentHoldReleased: false,
        freezeHoldReleased: false,
        deploymentExecuted: false,
        productionSecretsActivated: false,
        publicDnsCutoverAllowed: false,
        databaseMigrationAllowed: false,
        publicProductionApiExposureAllowed: false,
        productionPortalLaunchExecuted: false,
        liveExternalActionPerformed: false,
        paymentCaptureAllowed: false,
        borrowerNoticeSendAllowed: false,
        officialReportPublicationAllowed: false,
        publicVerificationAllowed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked production release board review.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation,
      module: "api.governance.production-release-board",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_RELEASE_BOARD_VERSION,
          "src/lib/governance/productionReleaseBoard.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Release Board Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_RELEASE_BOARD_VERSION,
          "src/lib/governance/productionReleaseBoard.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-release-board-api-v0.1.0",
          "api.governance.production-release-board",
          traceId
        ),
      ],
    });
    const result = evaluateProductionReleaseBoard({ boardScope });
    const releaseBoard =
      req.method === "POST"
        ? {
            releaseBoardPacketId: `production-release-board-${Date.now()}`,
            boardScope: boardScope ?? "platform",
            reviewStatus: "PRODUCTION_RELEASE_BOARD_PACKET_RECORDED",
            reviewNote: body.reviewNote ?? null,
            releaseBoardApprovalGranted: false,
            cutoverAuthorityGranted: false,
            productionCutoverApproved: false,
            productionCutoverExecuted: false,
            launchHoldReleased: false,
            deploymentHoldReleased: false,
            freezeHoldReleased: false,
            deploymentExecuted: false,
            productionSecretsActivated: false,
            publicDnsCutoverAllowed: false,
            databaseMigrationAllowed: false,
            publicProductionApiExposureAllowed: false,
            productionPortalLaunchExecuted: false,
            liveExternalActionPerformed: false,
            paymentCaptureAllowed: false,
            borrowerNoticeSendAllowed: false,
            officialReportPublicationAllowed: false,
            publicVerificationAllowed: false,
            productionBlocked: true,
            qualifiedReleaseManagerRequired: true,
            replayRef: traceId,
          }
        : null;
    const classifiedOutput = classifyRecord(
      {
        count: result.productionReleaseBoardReviews.length,
        productionReleaseBoardReviews: result.productionReleaseBoardReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        boardPosture: result.boardPosture,
        releaseBoard,
        productionBlocked: true,
        releaseBoardApprovalGranted: false,
        cutoverAuthorityGranted: false,
        productionCutoverApproved: false,
        productionCutoverExecuted: false,
        launchHoldReleased: false,
        deploymentHoldReleased: false,
        freezeHoldReleased: false,
        releaseCandidateFreezeApproved: false,
        releaseCandidateFrozen: false,
        releaseCandidateApproved: false,
        deploymentExecuted: false,
        environmentPromotionAllowed: false,
        productionSecretsActivated: false,
        publicDnsCutoverAllowed: false,
        cdnWafTlsEnabled: false,
        databaseMigrationAllowed: false,
        publicProductionApiExposureAllowed: false,
        productionPortalLaunchAllowed: false,
        productionPortalLaunchExecuted: false,
        liveExternalActionPerformed: false,
        paymentCaptureAllowed: false,
        borrowerNoticeSendAllowed: false,
        officialReportPublicationAllowed: false,
        publicVerificationAllowed: false,
        legalAdviceProvided: false,
        officialRelianceAllowed: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "production-release-board-route-output",
        classificationVersion: PRODUCTION_RELEASE_BOARD_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-release-board-review",
          "cutover-authority-review",
          "launch-hold-evidence",
          "production-readiness-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-production-release-board-approval-authority",
          "no-production-cutover-authority",
          "no-launch-hold-release-authority",
          "no-deployment-authority",
          "no-production-secret-activation-authority",
          "no-public-dns-cutover-authority",
          "no-production-database-migration-authority",
          "no-public-production-api-exposure-authority",
          "no-live-fetch-authority",
          "no-payment-capture-authority",
          "no-notice-send-authority",
          "no-official-report-publication-authority",
          "no-public-verification-authority",
        ],
        redactionRequirements: [
          "redact restricted operational details before public use",
          "redact credentials and source secrets",
          "redact infrastructure identifiers before external disclosure",
          "redact borrower-sensitive data before external disclosure",
        ],
        consentRequirements: [
          "institutional-production-release-board-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_RELEASE_BOARD_PACKET_RECORDED"
          : "PRODUCTION_RELEASE_BOARD_REVIEWED",
      domain: "operations",
      severity: result.summary.productionCutoverExecuted === 0 ? "INFO" : "WARN",
      message:
        "Governed production release board review returned blocked production posture without cutover authority.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-release-board",
      metadata: {
        boardScope,
        count: result.productionReleaseBoardReviews.length,
        blockedReleaseBoardItems: result.summary.blocked,
        reviewRequiredReleaseBoardItems: result.summary.reviewRequired,
        releaseBoardApprovalGranted:
          result.summary.releaseBoardApprovalGranted,
        cutoverAuthorityGranted: result.summary.cutoverAuthorityGranted,
        productionCutoverApproved: result.summary.productionCutoverApproved,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        launchHoldReleased: result.summary.launchHoldReleased,
        deploymentExecuted: result.summary.deploymentExecuted,
        publicProductionApiExposureAllowed:
          result.summary.publicProductionApiExposureAllowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      productionReleaseBoardReviews:
        classifiedOutput.productionReleaseBoardReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      boardPosture: classifiedOutput.boardPosture,
      releaseBoard: classifiedOutput.releaseBoard,
      productionBlocked: classifiedOutput.productionBlocked,
      releaseBoardApprovalGranted:
        classifiedOutput.releaseBoardApprovalGranted,
      cutoverAuthorityGranted: classifiedOutput.cutoverAuthorityGranted,
      productionCutoverApproved:
        classifiedOutput.productionCutoverApproved,
      productionCutoverExecuted:
        classifiedOutput.productionCutoverExecuted,
      launchHoldReleased: classifiedOutput.launchHoldReleased,
      deploymentHoldReleased: classifiedOutput.deploymentHoldReleased,
      freezeHoldReleased: classifiedOutput.freezeHoldReleased,
      releaseCandidateFreezeApproved:
        classifiedOutput.releaseCandidateFreezeApproved,
      releaseCandidateFrozen: classifiedOutput.releaseCandidateFrozen,
      releaseCandidateApproved: classifiedOutput.releaseCandidateApproved,
      deploymentExecuted: classifiedOutput.deploymentExecuted,
      environmentPromotionAllowed:
        classifiedOutput.environmentPromotionAllowed,
      productionSecretsActivated: classifiedOutput.productionSecretsActivated,
      publicDnsCutoverAllowed: classifiedOutput.publicDnsCutoverAllowed,
      cdnWafTlsEnabled: classifiedOutput.cdnWafTlsEnabled,
      databaseMigrationAllowed: classifiedOutput.databaseMigrationAllowed,
      publicProductionApiExposureAllowed:
        classifiedOutput.publicProductionApiExposureAllowed,
      productionPortalLaunchAllowed:
        classifiedOutput.productionPortalLaunchAllowed,
      productionPortalLaunchExecuted:
        classifiedOutput.productionPortalLaunchExecuted,
      liveExternalActionPerformed:
        classifiedOutput.liveExternalActionPerformed,
      paymentCaptureAllowed: classifiedOutput.paymentCaptureAllowed,
      borrowerNoticeSendAllowed: classifiedOutput.borrowerNoticeSendAllowed,
      officialReportPublicationAllowed:
        classifiedOutput.officialReportPublicationAllowed,
      publicVerificationAllowed: classifiedOutput.publicVerificationAllowed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
      officialRelianceAllowed: classifiedOutput.officialRelianceAllowed,
      data: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        outputClassification: classifiedOutput.classification,
        observability,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown production release board error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
