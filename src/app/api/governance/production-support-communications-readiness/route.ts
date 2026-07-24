import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION,
  evaluateProductionSupportCommunicationsReadinessGate,
} from "@/lib/governance/productionSupportCommunicationsReadinessGate";
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
 * Production Support Communications Readiness Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed support communications readiness review surface
 *   after incident response readiness and before any public/customer
 *   communication or production support activation.
 * - Vol I: keeps support escalation, public status, customer communications,
 *   borrower notices, and production claims subordinate to constitutional
 *   governance and qualified human review.
 * - Vol II: blocks support evidence from becoming legal advice, notices,
 *   payment capture, public verification, official reports, partner
 *   commitments, agency commitments, or official reliance.
 * - Vol III: assembles deterministic evidence across support queues,
 *   communication templates, public status posture, escalation, accessibility,
 *   redaction, data rights, audit, replay, and communications freeze controls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to support communications readiness evidence.
 * - Vol IV: supports support runbook review, customer-safe language, escalation
 *   routing, communications freeze, public status review, and evidence
 *   preservation.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   portability, redaction, explainability, replayability, and advisory-only
 *   boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while live production exposure remains blocked.
 */

type ProductionSupportCommunicationsReadinessBody = {
  actorId?: string | null;
  supportScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionSupportCommunicationsReadinessBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionSupportCommunicationsReadinessBody;
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
  return handleProductionSupportCommunicationsReadiness(
    req,
    "production-support-communications-readiness.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionSupportCommunicationsReadiness(
    req,
    "production-support-communications-readiness.record"
  );
}

async function handleProductionSupportCommunicationsReadiness(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const supportScope =
    body.supportScope ?? req.nextUrl.searchParams.get("supportScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-support-communications-readiness",
      traceId,
      schemaVersion: PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-support-communications-readiness",
        supportScope,
        method: req.method,
        supportCommunicationsApprovalGranted: false,
        supportOperationsActivated: false,
        supportEscalationActivated: false,
        customerCommunicationsReleased: false,
        regulatoryCommunicationsReleased: false,
        publicStatusPageEnabled: false,
        borrowerNoticeSendAllowed: false,
        officialReportPublicationAllowed: false,
        publicVerificationAllowed: false,
        legalAdviceProvided: false,
        officialRelianceAllowed: false,
        incidentResponseActivated: false,
        incidentBridgeActivated: false,
        rollbackAuthorized: false,
        emergencyRollbackExecuted: false,
        emergencyHoldReleased: false,
        killSwitchActivated: false,
        cutoverAuthorityGranted: false,
        productionCutoverExecuted: false,
        deploymentExecuted: false,
        publicProductionApiExposureAllowed: false,
        productionPortalLaunchExecuted: false,
        liveExternalActionPerformed: false,
        paymentCaptureAllowed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked production support communications readiness review.",
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
      module: "api.governance.production-support-communications-readiness",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION,
          "src/lib/governance/productionSupportCommunicationsReadinessGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Support Communications Readiness Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION,
          "src/lib/governance/productionSupportCommunicationsReadinessGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-support-communications-readiness-api-v0.1.0",
          "api.governance.production-support-communications-readiness",
          traceId
        ),
      ],
    });
    const result = evaluateProductionSupportCommunicationsReadinessGate({
      supportScope,
    });
    const scope = supportScope ?? "platform";
    const supportReadiness =
      req.method === "POST" && actorId
        ? recordReleaseGovernanceEvidence({
            kind: "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_PACKET",
            scope,
            actorId,
            reviewNote: body.reviewNote ?? null,
            replayRef: traceId,
          })
        : latestReleaseGovernanceEvidence(
            scope,
            "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_PACKET"
          );
    const supportHistory = releaseGovernanceEvidenceFor(
      scope,
      "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_PACKET"
    );
    const incidentResponseEvidence = latestReleaseGovernanceEvidence(
      scope,
      "PRODUCTION_INCIDENT_RESPONSE_READINESS_PACKET"
    );
    const classifiedOutput = classifyRecord(
      {
        count: result.productionSupportCommunicationsReadinessReviews.length,
        productionSupportCommunicationsReadinessReviews:
          result.productionSupportCommunicationsReadinessReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        supportPosture: result.supportPosture,
        supportReadiness,
        supportHistory,
        incidentResponseEvidence,
        productionBlocked: true,
        supportCommunicationsApprovalGranted: false,
        supportOperationsActivated: false,
        supportEscalationActivated: false,
        customerCommunicationsReleased: false,
        regulatoryCommunicationsReleased: false,
        publicStatusPageEnabled: false,
        borrowerNoticeSendAllowed: false,
        officialReportPublicationAllowed: false,
        publicVerificationAllowed: false,
        legalAdviceProvided: false,
        officialRelianceAllowed: false,
        incidentResponseActivated: false,
        incidentBridgeActivated: false,
        rollbackAuthorized: false,
        emergencyRollbackExecuted: false,
        emergencyHoldReleased: false,
        killSwitchActivated: false,
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
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource:
          "production-support-communications-readiness-route-output",
        classificationVersion:
          PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-support-communications-readiness-review",
          "support-routing-review",
          "communications-readiness-review",
          "production-readiness-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-support-communications-approval-authority",
          "no-support-operations-activation-authority",
          "no-support-escalation-activation-authority",
          "no-customer-communication-release-authority",
          "no-regulatory-communication-release-authority",
          "no-public-status-page-authority",
          "no-notice-send-authority",
          "no-official-report-publication-authority",
          "no-public-verification-authority",
          "no-legal-advice-authority",
          "no-production-cutover-authority",
          "no-deployment-authority",
          "no-public-production-api-exposure-authority",
          "no-live-fetch-authority",
          "no-payment-capture-authority",
        ],
        redactionRequirements: [
          "redact restricted operational details before public use",
          "redact credentials and source secrets",
          "redact infrastructure identifiers before external disclosure",
          "redact support escalation and incident details before external disclosure",
          "redact borrower or partner identifiers before public communication review",
        ],
        consentRequirements: [
          "institutional-production-support-communications-readiness-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_PACKET_RECORDED"
          : "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_REVIEWED",
      domain: "operations",
      severity:
        result.summary.supportOperationsActivated === 0 ? "INFO" : "WARN",
      message:
        "Governed production support communications readiness review returned blocked production posture without communications release.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-support-communications-readiness",
      metadata: {
        supportScope,
        count: result.productionSupportCommunicationsReadinessReviews.length,
        blockedSupportItems: result.summary.blocked,
        reviewRequiredSupportItems: result.summary.reviewRequired,
        supportCommunicationsApprovalGranted:
          result.summary.supportCommunicationsApprovalGranted,
        supportOperationsActivated:
          result.summary.supportOperationsActivated,
        supportEscalationActivated:
          result.summary.supportEscalationActivated,
        customerCommunicationsReleased:
          result.summary.customerCommunicationsReleased,
        publicStatusPageEnabled: result.summary.publicStatusPageEnabled,
        borrowerNoticeSendsAllowed:
          result.summary.borrowerNoticeSendsAllowed,
        officialReportsAllowed: result.summary.officialReportsAllowed,
        publicVerificationAllowed: result.summary.publicVerificationAllowed,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        publicProductionApiExposureAllowed:
          result.summary.publicProductionApiExposureAllowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      productionSupportCommunicationsReadinessReviews:
        classifiedOutput.productionSupportCommunicationsReadinessReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      supportPosture: classifiedOutput.supportPosture,
      supportReadiness: classifiedOutput.supportReadiness,
      supportHistory: classifiedOutput.supportHistory,
      incidentResponseEvidence: classifiedOutput.incidentResponseEvidence,
      productionBlocked: classifiedOutput.productionBlocked,
      supportCommunicationsApprovalGranted:
        classifiedOutput.supportCommunicationsApprovalGranted,
      supportOperationsActivated: classifiedOutput.supportOperationsActivated,
      supportEscalationActivated:
        classifiedOutput.supportEscalationActivated,
      customerCommunicationsReleased:
        classifiedOutput.customerCommunicationsReleased,
      regulatoryCommunicationsReleased:
        classifiedOutput.regulatoryCommunicationsReleased,
      publicStatusPageEnabled: classifiedOutput.publicStatusPageEnabled,
      borrowerNoticeSendAllowed: classifiedOutput.borrowerNoticeSendAllowed,
      officialReportPublicationAllowed:
        classifiedOutput.officialReportPublicationAllowed,
      publicVerificationAllowed: classifiedOutput.publicVerificationAllowed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
      officialRelianceAllowed: classifiedOutput.officialRelianceAllowed,
      incidentResponseActivated: classifiedOutput.incidentResponseActivated,
      incidentBridgeActivated: classifiedOutput.incidentBridgeActivated,
      rollbackAuthorized: classifiedOutput.rollbackAuthorized,
      emergencyRollbackExecuted: classifiedOutput.emergencyRollbackExecuted,
      emergencyHoldReleased: classifiedOutput.emergencyHoldReleased,
      killSwitchActivated: classifiedOutput.killSwitchActivated,
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
            : "Unknown production support communications readiness error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
