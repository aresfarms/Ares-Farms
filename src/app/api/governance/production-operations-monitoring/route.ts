import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION,
  evaluateProductionOperationsMonitoringGate,
} from "@/lib/governance/productionOperationsMonitoringGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import {
  latestReleaseGovernanceEvidence,
  recordReleaseGovernanceEvidence,
  releaseGovernanceEvidenceFor,
} from "@/lib/governance/releaseGovernanceEvidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Production Operations Monitoring Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed operations monitoring review surface after
 *   release-board evidence and before any live production action.
 * - Vol I: keeps operations authority subordinate to constitutional governance,
 *   release ownership, and qualified approval.
 * - Vol II: blocks monitoring evidence from becoming production approval,
 *   official reports, notice sends, payment capture, public verification, legal
 *   advice, partner commitments, agency commitments, or official reliance.
 * - Vol III: assembles deterministic evidence across monitoring, alerting,
 *   on-call, incident, rollback, support, audit export, backup, restore, and
 *   emergency hold controls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to operations evidence.
 * - Vol IV: supports monitoring/on-call review, incident bridge readiness,
 *   support routing, rollback review, backup/restore review, and emergency hold
 *   posture.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   portability, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while live production exposure remains blocked.
 */

type ProductionOperationsMonitoringBody = {
  actorId?: string | null;
  operationsScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionOperationsMonitoringBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionOperationsMonitoringBody;
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
  return handleProductionOperationsMonitoring(
    req,
    "production-operations-monitoring.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionOperationsMonitoring(
    req,
    "production-operations-monitoring.record"
  );
}

async function handleProductionOperationsMonitoring(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const operationsScope =
    body.operationsScope ?? req.nextUrl.searchParams.get("operationsScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-operations-monitoring",
      traceId,
      schemaVersion: PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-operations-monitoring",
        operationsScope,
        method: req.method,
        operationsMonitoringApprovalGranted: false,
        productionMonitoringActivated: false,
        onCallActivated: false,
        incidentBridgeActivated: false,
        rollbackAuthorized: false,
        emergencyHoldReleased: false,
        releaseBoardApprovalGranted: false,
        cutoverAuthorityGranted: false,
        productionCutoverApproved: false,
        productionCutoverExecuted: false,
        launchHoldReleased: false,
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
            "Runtime governance guard blocked production operations monitoring review.",
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
      module: "api.governance.production-operations-monitoring",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION,
          "src/lib/governance/productionOperationsMonitoringGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Operations Monitoring Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION,
          "src/lib/governance/productionOperationsMonitoringGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-operations-monitoring-api-v0.1.0",
          "api.governance.production-operations-monitoring",
          traceId
        ),
      ],
    });
    const result = evaluateProductionOperationsMonitoringGate({
      operationsScope,
    });
    const scope = operationsScope ?? "platform";
    const operationsMonitoring =
      req.method === "POST" && actorId
        ? recordReleaseGovernanceEvidence({
            kind: "PRODUCTION_OPERATIONS_MONITORING_PACKET",
            scope,
            actorId,
            reviewNote: body.reviewNote ?? null,
            replayRef: traceId,
          })
        : latestReleaseGovernanceEvidence(
            scope,
            "PRODUCTION_OPERATIONS_MONITORING_PACKET"
          );
    const operationsMonitoringHistory = releaseGovernanceEvidenceFor(
      scope,
      "PRODUCTION_OPERATIONS_MONITORING_PACKET"
    );
    const releaseBoardEvidence = latestReleaseGovernanceEvidence(
      scope,
      "PRODUCTION_RELEASE_BOARD_PACKET"
    );
    const classifiedOutput = classifyRecord(
      {
        count: result.productionOperationsMonitoringReviews.length,
        productionOperationsMonitoringReviews:
          result.productionOperationsMonitoringReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        operationsPosture: result.operationsPosture,
        operationsMonitoring,
        operationsMonitoringHistory,
        releaseBoardEvidence,
        productionBlocked: true,
        operationsMonitoringApprovalGranted: false,
        productionMonitoringActivated: false,
        onCallActivated: false,
        incidentBridgeActivated: false,
        rollbackAuthorized: false,
        emergencyHoldReleased: false,
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
        classificationSource: "production-operations-monitoring-route-output",
        classificationVersion: PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-operations-monitoring-review",
          "incident-response-review",
          "rollback-readiness-review",
          "production-readiness-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-operations-monitoring-approval-authority",
          "no-production-monitoring-activation-authority",
          "no-on-call-activation-authority",
          "no-incident-bridge-activation-authority",
          "no-rollback-authorization-authority",
          "no-emergency-hold-release-authority",
          "no-production-cutover-authority",
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
          "redact incident bridge and on-call details before external disclosure",
        ],
        consentRequirements: [
          "institutional-production-operations-monitoring-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_OPERATIONS_MONITORING_PACKET_RECORDED"
          : "PRODUCTION_OPERATIONS_MONITORING_REVIEWED",
      domain: "operations",
      severity:
        result.summary.productionMonitoringActivated === 0 ? "INFO" : "WARN",
      message:
        "Governed production operations monitoring review returned blocked production posture without operations activation.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-operations-monitoring",
      metadata: {
        operationsScope,
        count: result.productionOperationsMonitoringReviews.length,
        blockedOperationsItems: result.summary.blocked,
        reviewRequiredOperationsItems: result.summary.reviewRequired,
        operationsMonitoringApprovalGranted:
          result.summary.operationsMonitoringApprovalGranted,
        productionMonitoringActivated:
          result.summary.productionMonitoringActivated,
        onCallActivated: result.summary.onCallActivated,
        incidentBridgeActivated: result.summary.incidentBridgeActivated,
        rollbackAuthorized: result.summary.rollbackAuthorized,
        emergencyHoldReleased: result.summary.emergencyHoldReleased,
        cutoverAuthorityGranted: result.summary.cutoverAuthorityGranted,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        publicProductionApiExposureAllowed:
          result.summary.publicProductionApiExposureAllowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      productionOperationsMonitoringReviews:
        classifiedOutput.productionOperationsMonitoringReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      operationsPosture: classifiedOutput.operationsPosture,
      operationsMonitoring: classifiedOutput.operationsMonitoring,
      operationsMonitoringHistory: classifiedOutput.operationsMonitoringHistory,
      releaseBoardEvidence: classifiedOutput.releaseBoardEvidence,
      productionBlocked: classifiedOutput.productionBlocked,
      operationsMonitoringApprovalGranted:
        classifiedOutput.operationsMonitoringApprovalGranted,
      productionMonitoringActivated:
        classifiedOutput.productionMonitoringActivated,
      onCallActivated: classifiedOutput.onCallActivated,
      incidentBridgeActivated: classifiedOutput.incidentBridgeActivated,
      rollbackAuthorized: classifiedOutput.rollbackAuthorized,
      emergencyHoldReleased: classifiedOutput.emergencyHoldReleased,
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
      deploymentExecuted: classifiedOutput.deploymentExecuted,
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
            : "Unknown production operations monitoring error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
