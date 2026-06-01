import { NextRequest, NextResponse } from "next/server";

import {
  DOCTRINE_TO_CODE_GAP_LEDGER_GATE_VERSION,
  evaluateDoctrineToCodeGapLedgerGate,
} from "@/lib/governance/doctrineToCodeGapLedgerGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Doctrine-to-Code Gap Ledger Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes a current build-gap ledger without implying go-live.
 * - Vol I: keeps unresolved requirements subordinate to named constitutional
 *   and human authority.
 * - Vol II: preserves regulated, public, notice, report, payment, reliance,
 *   and legal-advice boundaries.
 * - Vol III: attaches route, test, evidence, replay, and promotion posture.
 * - Vol III-B: records version, runtime guard, classification, observability,
 *   and human authority metadata.
 * - Vol IV: supports operator review, audit preparation, and promotion queueing.
 * - Vol V: preserves claims, controlled disclosure, redaction, public DTO,
 *   source authority, replayability, and evidence lineage.
 * - Vol VI: keeps source intelligence and public-safe source DTO promotion
 *   limits review-bound until qualified approval exists.
 */

type DoctrineGapLedgerBody = {
  actorId?: string | null;
  reviewNote?: string | null;
};

function createTraceId(operation: string): string {
  return `${operation}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

async function readBody(req: NextRequest): Promise<DoctrineGapLedgerBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as DoctrineGapLedgerBody;
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  return handleDoctrineGapLedger(req, "doctrine-gap-ledger.read");
}

export async function POST(req: NextRequest) {
  return handleDoctrineGapLedger(req, "doctrine-gap-ledger.record");
}

async function handleDoctrineGapLedger(req: NextRequest, operation: string) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.doctrine-gap-ledger",
      traceId,
      schemaVersion: DOCTRINE_TO_CODE_GAP_LEDGER_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/doctrine-gap-ledger",
        method: req.method,
        productionBlocked: true,
        controlledPromotionOnly: true,
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
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked doctrine-to-code gap ledger review.",
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
      module: "api.governance.doctrine-gap-ledger",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          DOCTRINE_TO_CODE_GAP_LEDGER_GATE_VERSION,
          "src/lib/governance/doctrineToCodeGapLedgerGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Doctrine-to-Code Gap Ledger",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          DOCTRINE_TO_CODE_GAP_LEDGER_GATE_VERSION,
          "src/lib/governance/doctrineToCodeGapLedgerGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "doctrine-gap-ledger-api-v0.1.0",
          "api.governance.doctrine-gap-ledger",
          traceId
        ),
      ],
    });
    const result = evaluateDoctrineToCodeGapLedgerGate();
    const reviewRecord =
      req.method === "POST"
        ? {
            reviewRecordId: `doctrine-gap-ledger-${Date.now()}`,
            checkpointId: result.checkpointId,
            reviewStatus: "DOCTRINE_GAP_LEDGER_REVIEW_RECORDED",
            reviewNote: body.reviewNote ?? null,
            namedGapCount: result.summary.namedGapCount,
            unnamedGapCount: result.summary.unnamedGapCount,
            awaitingControlledPromotion:
              result.summary.awaitingControlledPromotion,
            productionBlocked: true,
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
            replayRef: traceId,
          }
        : null;
    const classifiedOutput = classifyRecord(
      {
        count: result.doctrineGapLedgerReviews.length,
        doctrineGapLedgerReviews: result.doctrineGapLedgerReviews,
        doctrineGaps: result.doctrineGaps,
        summary: result.summary,
        disclosures: result.disclosures,
        ledgerPosture: result.ledgerPosture,
        reviewRecord,
        productionBlocked: true,
        controlledPromotionOnly: true,
        allGapsNamed: result.summary.allGapsNamed === 1,
        allGapsOwned: result.summary.allGapsOwned === 1,
        allGapsRouted: result.summary.allGapsRouted === 1,
        allGapsHaveRequiredEvidence:
          result.summary.allGapsHaveRequiredEvidence === 1,
        allGapsHavePromotionConditions:
          result.summary.allGapsHavePromotionConditions === 1,
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
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "doctrine-gap-ledger-route-output",
        classificationVersion: DOCTRINE_TO_CODE_GAP_LEDGER_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "doctrine-gap-ledger-review",
          "controlled-promotion-review",
          "master-volume-conformance-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-production-launch-authority",
          "no-public-production-api-exposure-authority",
          "no-payment-capture-authority",
          "no-notice-send-authority",
          "no-official-report-publication-authority",
          "no-public-verification-authority",
          "no-official-reliance-authority",
          "no-legal-advice-authority",
          "no-live-external-action-authority",
        ],
        redactionRequirements: [
          "redact credentials and source secrets",
          "redact private infrastructure identifiers before external disclosure",
          "redact unresolved reviewer names unless authorized",
        ],
        consentRequirements: ["institutional-doctrine-gap-review"],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "DOCTRINE_GAP_LEDGER_REVIEW_RECORDED"
          : "DOCTRINE_GAP_LEDGER_REVIEWED",
      domain: "operations",
      severity:
        result.summary.unnamedGapCount === 0 &&
        result.summary.awaitingControlledPromotion === 3
          ? "INFO"
          : "WARN",
      message:
        "Governed doctrine-to-code gap ledger returned review-bound controlled-promotion posture.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.doctrine-gap-ledger",
      metadata: {
        checkpointId: result.checkpointId,
        awaitingControlledPromotion:
          result.summary.awaitingControlledPromotion,
        namedGapCount: result.summary.namedGapCount,
        unnamedGapCount: result.summary.unnamedGapCount,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      doctrineGapLedgerReviews: classifiedOutput.doctrineGapLedgerReviews,
      doctrineGaps: classifiedOutput.doctrineGaps,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      ledgerPosture: classifiedOutput.ledgerPosture,
      reviewRecord: classifiedOutput.reviewRecord,
      productionBlocked: classifiedOutput.productionBlocked,
      controlledPromotionOnly: classifiedOutput.controlledPromotionOnly,
      allGapsNamed: classifiedOutput.allGapsNamed,
      allGapsOwned: classifiedOutput.allGapsOwned,
      allGapsRouted: classifiedOutput.allGapsRouted,
      allGapsHaveRequiredEvidence:
        classifiedOutput.allGapsHaveRequiredEvidence,
      allGapsHavePromotionConditions:
        classifiedOutput.allGapsHavePromotionConditions,
      productionLaunchAuthorized: classifiedOutput.productionLaunchAuthorized,
      publicProductionApiExposureAllowed:
        classifiedOutput.publicProductionApiExposureAllowed,
      productionPortalLaunchExecuted:
        classifiedOutput.productionPortalLaunchExecuted,
      paymentCaptureAllowed: classifiedOutput.paymentCaptureAllowed,
      borrowerNoticeSendAllowed: classifiedOutput.borrowerNoticeSendAllowed,
      officialReportPublicationAllowed:
        classifiedOutput.officialReportPublicationAllowed,
      publicVerificationApprovalGranted:
        classifiedOutput.publicVerificationApprovalGranted,
      officialRelianceAllowed: classifiedOutput.officialRelianceAllowed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
      liveExternalActionPerformed:
        classifiedOutput.liveExternalActionPerformed,
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
            : "Unknown doctrine-to-code gap ledger error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
