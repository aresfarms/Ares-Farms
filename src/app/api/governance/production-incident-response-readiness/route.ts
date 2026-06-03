import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION,
  evaluateProductionIncidentResponseReadinessGate,
} from "@/lib/governance/productionIncidentResponseReadinessGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Production Incident Response Readiness Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed incident response readiness review surface
 *   after operations monitoring and before live production incident action.
 * - Vol I: keeps incident, rollback, emergency hold, support, and
 *   communications authority subordinate to constitutional governance.
 * - Vol II: blocks incident evidence from becoming legal advice, official
 *   reports, notices, payment capture, public verification, partner
 *   commitments, agency commitments, or official reliance.
 * - Vol III: assembles deterministic evidence across incident command,
 *   severity, escalation, rollback, communications, support, audit/replay,
 *   data integrity, emergency hold, and kill-switch controls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to incident readiness evidence.
 * - Vol IV: supports incident response runbook review, rollback review,
 *   customer-safe communications, support escalation, and evidence
 *   preservation.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   portability, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while live production exposure remains blocked.
 */

type ProductionIncidentResponseReadinessBody = {
  actorId?: string | null;
  incidentScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionIncidentResponseReadinessBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionIncidentResponseReadinessBody;
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
  return handleProductionIncidentResponseReadiness(
    req,
    "production-incident-response-readiness.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionIncidentResponseReadiness(
    req,
    "production-incident-response-readiness.record"
  );
}

async function handleProductionIncidentResponseReadiness(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const incidentScope =
    body.incidentScope ?? req.nextUrl.searchParams.get("incidentScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-incident-response-readiness",
      traceId,
      schemaVersion: PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-incident-response-readiness",
        incidentScope,
        method: req.method,
        incidentResponseApprovalGranted: false,
        incidentResponseActivated: false,
        incidentBridgeActivated: false,
        onCallActivated: false,
        rollbackAuthorized: false,
        emergencyRollbackExecuted: false,
        emergencyHoldReleased: false,
        killSwitchActivated: false,
        customerCommunicationsReleased: false,
        regulatoryCommunicationsReleased: false,
        publicStatusPageEnabled: false,
        supportEscalationActivated: false,
        operationsMonitoringApprovalGranted: false,
        productionMonitoringActivated: false,
        cutoverAuthorityGranted: false,
        productionCutoverExecuted: false,
        deploymentExecuted: false,
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
            "Runtime governance guard blocked production incident response readiness review.",
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
      module: "api.governance.production-incident-response-readiness",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION,
          "src/lib/governance/productionIncidentResponseReadinessGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Incident Response Readiness Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION,
          "src/lib/governance/productionIncidentResponseReadinessGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-incident-response-readiness-api-v0.1.0",
          "api.governance.production-incident-response-readiness",
          traceId
        ),
      ],
    });
    const result = evaluateProductionIncidentResponseReadinessGate({
      incidentScope,
    });
    const incidentReadiness =
      req.method === "POST"
        ? {
            incidentReadinessPacketId: `production-incident-response-readiness-${Date.now()}`,
            incidentScope: incidentScope ?? "platform",
            reviewStatus:
              "PRODUCTION_INCIDENT_RESPONSE_READINESS_PACKET_RECORDED",
            reviewNote: body.reviewNote ?? null,
            incidentResponseApprovalGranted: false,
            incidentResponseActivated: false,
            incidentBridgeActivated: false,
            onCallActivated: false,
            rollbackAuthorized: false,
            emergencyRollbackExecuted: false,
            emergencyHoldReleased: false,
            killSwitchActivated: false,
            customerCommunicationsReleased: false,
            regulatoryCommunicationsReleased: false,
            publicStatusPageEnabled: false,
            supportEscalationActivated: false,
            operationsMonitoringApprovalGranted: false,
            productionMonitoringActivated: false,
            cutoverAuthorityGranted: false,
            productionCutoverExecuted: false,
            deploymentExecuted: false,
            publicProductionApiExposureAllowed: false,
            productionPortalLaunchExecuted: false,
            liveExternalActionPerformed: false,
            paymentCaptureAllowed: false,
            borrowerNoticeSendAllowed: false,
            officialReportPublicationAllowed: false,
            publicVerificationAllowed: false,
            productionBlocked: true,
            replayRef: traceId,
          }
        : null;
    const classifiedOutput = classifyRecord(
      {
        count: result.productionIncidentResponseReadinessReviews.length,
        productionIncidentResponseReadinessReviews:
          result.productionIncidentResponseReadinessReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        incidentPosture: result.incidentPosture,
        incidentReadiness,
        productionBlocked: true,
        incidentResponseApprovalGranted: false,
        incidentResponseActivated: false,
        incidentBridgeActivated: false,
        onCallActivated: false,
        rollbackAuthorized: false,
        emergencyRollbackExecuted: false,
        emergencyHoldReleased: false,
        killSwitchActivated: false,
        customerCommunicationsReleased: false,
        regulatoryCommunicationsReleased: false,
        publicStatusPageEnabled: false,
        supportEscalationActivated: false,
        operationsMonitoringApprovalGranted: false,
        productionMonitoringActivated: false,
        productionCutoverApproved: false,
        productionCutoverExecuted: false,
        cutoverAuthorityGranted: false,
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
        legalAdviceProvided: false,
        officialRelianceAllowed: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource:
          "production-incident-response-readiness-route-output",
        classificationVersion:
          PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-incident-response-readiness-review",
          "incident-response-review",
          "rollback-readiness-review",
          "production-readiness-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-incident-response-approval-authority",
          "no-incident-response-activation-authority",
          "no-incident-bridge-activation-authority",
          "no-on-call-activation-authority",
          "no-rollback-authorization-authority",
          "no-emergency-rollback-execution-authority",
          "no-emergency-hold-release-authority",
          "no-kill-switch-activation-authority",
          "no-customer-communication-release-authority",
          "no-regulatory-communication-release-authority",
          "no-public-status-page-authority",
          "no-support-escalation-activation-authority",
          "no-production-cutover-authority",
          "no-deployment-authority",
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
          "redact rollback and emergency hold details before external disclosure",
        ],
        consentRequirements: [
          "institutional-production-incident-response-readiness-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_INCIDENT_RESPONSE_READINESS_PACKET_RECORDED"
          : "PRODUCTION_INCIDENT_RESPONSE_READINESS_REVIEWED",
      domain: "operations",
      severity:
        result.summary.incidentResponseActivated === 0 ? "INFO" : "WARN",
      message:
        "Governed production incident response readiness review returned blocked production posture without incident activation.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-incident-response-readiness",
      metadata: {
        incidentScope,
        count: result.productionIncidentResponseReadinessReviews.length,
        blockedIncidentItems: result.summary.blocked,
        reviewRequiredIncidentItems: result.summary.reviewRequired,
        incidentResponseApprovalGranted:
          result.summary.incidentResponseApprovalGranted,
        incidentResponseActivated: result.summary.incidentResponseActivated,
        incidentBridgeActivated: result.summary.incidentBridgeActivated,
        rollbackAuthorized: result.summary.rollbackAuthorized,
        emergencyRollbackExecuted: result.summary.emergencyRollbackExecuted,
        publicStatusPageEnabled: result.summary.publicStatusPageEnabled,
        customerCommunicationsReleased:
          result.summary.customerCommunicationsReleased,
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
      productionIncidentResponseReadinessReviews:
        classifiedOutput.productionIncidentResponseReadinessReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      incidentPosture: classifiedOutput.incidentPosture,
      incidentReadiness: classifiedOutput.incidentReadiness,
      productionBlocked: classifiedOutput.productionBlocked,
      incidentResponseApprovalGranted:
        classifiedOutput.incidentResponseApprovalGranted,
      incidentResponseActivated: classifiedOutput.incidentResponseActivated,
      incidentBridgeActivated: classifiedOutput.incidentBridgeActivated,
      onCallActivated: classifiedOutput.onCallActivated,
      rollbackAuthorized: classifiedOutput.rollbackAuthorized,
      emergencyRollbackExecuted: classifiedOutput.emergencyRollbackExecuted,
      emergencyHoldReleased: classifiedOutput.emergencyHoldReleased,
      killSwitchActivated: classifiedOutput.killSwitchActivated,
      customerCommunicationsReleased:
        classifiedOutput.customerCommunicationsReleased,
      regulatoryCommunicationsReleased:
        classifiedOutput.regulatoryCommunicationsReleased,
      publicStatusPageEnabled: classifiedOutput.publicStatusPageEnabled,
      supportEscalationActivated:
        classifiedOutput.supportEscalationActivated,
      operationsMonitoringApprovalGranted:
        classifiedOutput.operationsMonitoringApprovalGranted,
      productionMonitoringActivated:
        classifiedOutput.productionMonitoringActivated,
      productionCutoverApproved:
        classifiedOutput.productionCutoverApproved,
      productionCutoverExecuted:
        classifiedOutput.productionCutoverExecuted,
      cutoverAuthorityGranted: classifiedOutput.cutoverAuthorityGranted,
      launchHoldReleased: classifiedOutput.launchHoldReleased,
      deploymentHoldReleased: classifiedOutput.deploymentHoldReleased,
      freezeHoldReleased: classifiedOutput.freezeHoldReleased,
      deploymentExecuted: classifiedOutput.deploymentExecuted,
      productionSecretsActivated: classifiedOutput.productionSecretsActivated,
      publicDnsCutoverAllowed: classifiedOutput.publicDnsCutoverAllowed,
      databaseMigrationAllowed: classifiedOutput.databaseMigrationAllowed,
      publicProductionApiExposureAllowed:
        classifiedOutput.publicProductionApiExposureAllowed,
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
            : "Unknown production incident response readiness error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
