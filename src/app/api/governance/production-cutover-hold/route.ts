import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_CUTOVER_HOLD_GATE_VERSION,
  evaluateProductionCutoverHoldGate,
} from "@/lib/governance/productionCutoverHoldGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Production Cutover Hold Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed production cutover hold surface across the
 *   platform without launching production.
 * - Vol I: keeps production cutover subordinate to constitutional authority,
 *   accountable release ownership, and qualified approval.
 * - Vol II: blocks cutover review from becoming production approval, official
 *   reports, notice sends, payment capture, public verification, legal advice,
 *   partner commitments, agency commitments, or official reliance.
 * - Vol III: assembles deterministic evidence across release-candidate freeze,
 *   build, typecheck, smoke, secrets, migrations, edge, monitoring, backup,
 *   rollback, incident, support, and launch holds.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to production cutover hold records.
 * - Vol IV: supports release manager review, launch hold, deployment hold,
 *   cutover board review, incident bridge, support routing, rollback review,
 *   and communication freeze.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   portability, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while all live production exposure remains blocked.
 */

type ProductionCutoverHoldBody = {
  actorId?: string | null;
  cutoverScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(req: NextRequest): Promise<ProductionCutoverHoldBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionCutoverHoldBody;
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
  return handleProductionCutoverHold(req, "production-cutover-hold.read");
}

export async function POST(req: NextRequest) {
  return handleProductionCutoverHold(req, "production-cutover-hold.record");
}

async function handleProductionCutoverHold(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const cutoverScope =
    body.cutoverScope ?? req.nextUrl.searchParams.get("cutoverScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-cutover-hold",
      traceId,
      schemaVersion: PRODUCTION_CUTOVER_HOLD_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-cutover-hold",
        cutoverScope,
        method: req.method,
        productionCutoverApproved: false,
        productionCutoverExecuted: false,
        launchHoldReleased: false,
        deploymentHoldReleased: false,
        freezeHoldReleased: false,
        releaseCandidateFreezeApproved: false,
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
            "Runtime governance guard blocked production cutover hold review.",
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
      module: "api.governance.production-cutover-hold",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_CUTOVER_HOLD_GATE_VERSION,
          "src/lib/governance/productionCutoverHoldGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Cutover Hold Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_CUTOVER_HOLD_GATE_VERSION,
          "src/lib/governance/productionCutoverHoldGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-cutover-hold-api-v0.1.0",
          "api.governance.production-cutover-hold",
          traceId
        ),
      ],
    });
    const result = evaluateProductionCutoverHoldGate({ cutoverScope });
    const cutoverHold =
      req.method === "POST"
        ? {
            cutoverHoldId: `production-cutover-hold-${Date.now()}`,
            cutoverScope: cutoverScope ?? "platform",
            reviewStatus: "PRODUCTION_CUTOVER_HOLD_RECORDED",
            reviewNote: body.reviewNote ?? null,
            productionCutoverApproved: false,
            productionCutoverExecuted: false,
            releaseCandidateFreezeApproved: false,
            releaseCandidateFrozen: false,
            freezeHoldReleased: false,
            deploymentHoldReleased: false,
            finalGoLiveHoldReleased: false,
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
        count: result.productionCutoverHoldReviews.length,
        productionCutoverHoldReviews: result.productionCutoverHoldReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        cutoverPosture: result.cutoverPosture,
        cutoverHold,
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
        classificationSource: "production-cutover-hold-route-output",
        classificationVersion: PRODUCTION_CUTOVER_HOLD_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-cutover-hold-review",
          "launch-hold-evidence",
          "production-readiness-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
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
          "institutional-production-cutover-hold-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_CUTOVER_HOLD_RECORDED"
          : "PRODUCTION_CUTOVER_HOLD_REVIEWED",
      domain: "operations",
      severity: result.summary.productionCutoverExecuted === 0 ? "INFO" : "WARN",
      message:
        "Governed production cutover hold review returned blocked production posture without launch exposure.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-cutover-hold",
      metadata: {
        cutoverScope,
        count: result.productionCutoverHoldReviews.length,
        blockedCutoverItems: result.summary.blocked,
        reviewRequiredCutoverItems: result.summary.reviewRequired,
        productionCutoverApproved: result.summary.productionCutoverApproved,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        finalGoLiveHoldReleased: result.summary.finalGoLiveHoldReleased,
        deploymentExecuted: result.summary.deploymentExecuted,
        productionSecretsActivated:
          result.summary.productionSecretsActivated,
        publicDnsCutoverAllowed: result.summary.publicDnsCutoverAllowed,
        publicProductionApiExposureAllowed:
          result.summary.publicProductionApiExposureAllowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      productionCutoverHoldReviews:
        classifiedOutput.productionCutoverHoldReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      cutoverPosture: classifiedOutput.cutoverPosture,
      cutoverHold: classifiedOutput.cutoverHold,
      productionBlocked: classifiedOutput.productionBlocked,
      productionCutoverApproved:
        classifiedOutput.productionCutoverApproved,
      productionCutoverExecuted:
        classifiedOutput.productionCutoverExecuted,
      releaseCandidateFreezeApproved:
        classifiedOutput.releaseCandidateFreezeApproved,
      releaseCandidateFrozen: classifiedOutput.releaseCandidateFrozen,
      releaseCandidateApproved: classifiedOutput.releaseCandidateApproved,
      freezeHoldReleased: classifiedOutput.freezeHoldReleased,
      deploymentHoldReleased: classifiedOutput.deploymentHoldReleased,
      finalGoLiveHoldReleased: classifiedOutput.finalGoLiveHoldReleased,
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
            : "Unknown production cutover hold error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
