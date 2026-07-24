import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_FINAL_AUTHORITY_GATE_VERSION,
  evaluateProductionFinalAuthorityGate,
} from "@/lib/governance/productionFinalAuthorityGate";
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
 * Production Final Authority Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed final authority evidence surface before any
 *   production go-live, public exposure, customer communication, or live action.
 * - Vol I: keeps final launch authority subordinate to constitutional
 *   governance, qualified ownership, human review, and documented supremacy.
 * - Vol II: blocks final authority evidence from becoming legal advice,
 *   official reports, adverse-action notices, payment capture, public
 *   verification, partner commitments, agency commitments, or official reliance.
 * - Vol III: assembles deterministic evidence across launch, deployment,
 *   cutover, release board, operations, incident, support, communications,
 *   audit, privacy, redaction, claims, and data rights.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to final authority evidence.
 * - Vol IV: supports final go/no-go review, executive escalation, release
 *   ownership, rollback readiness, support readiness, and evidence retention.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   redaction, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while live production exposure remains blocked.
 */

type ProductionFinalAuthorityBody = {
  actorId?: string | null;
  authorityScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionFinalAuthorityBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionFinalAuthorityBody;
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
  return handleProductionFinalAuthority(
    req,
    "production-final-authority.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionFinalAuthority(
    req,
    "production-final-authority.record"
  );
}

async function handleProductionFinalAuthority(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const authorityScope =
    body.authorityScope ?? req.nextUrl.searchParams.get("authorityScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-final-authority",
      traceId,
      schemaVersion: PRODUCTION_FINAL_AUTHORITY_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-final-authority",
        authorityScope,
        method: req.method,
        finalAuthorityApprovalGranted: false,
        goLiveApproved: false,
        productionLaunchAuthorized: false,
        constitutionalOfficerAttestationReceived: false,
        qualifiedReleaseManagerApprovalGranted: false,
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
            "Runtime governance guard blocked production final authority review.",
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
      module: "api.governance.production-final-authority",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_FINAL_AUTHORITY_GATE_VERSION,
          "src/lib/governance/productionFinalAuthorityGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Final Authority Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_FINAL_AUTHORITY_GATE_VERSION,
          "src/lib/governance/productionFinalAuthorityGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-final-authority-api-v0.1.0",
          "api.governance.production-final-authority",
          traceId
        ),
      ],
    });
    const result = evaluateProductionFinalAuthorityGate({
      authorityScope,
    });
    const scope = authorityScope ?? "platform";
    const authorityPacket =
      req.method === "POST" && actorId
        ? recordReleaseGovernanceEvidence({
            kind: "PRODUCTION_FINAL_AUTHORITY_PACKET",
            scope,
            actorId,
            reviewNote: body.reviewNote,
            replayRef: traceId,
          })
        : latestReleaseGovernanceEvidence(
            scope,
            "PRODUCTION_FINAL_AUTHORITY_PACKET"
          );
    const authorityHistory = releaseGovernanceEvidenceFor(
      scope,
      "PRODUCTION_FINAL_AUTHORITY_PACKET"
    );
    const releaseBoardEvidence = latestReleaseGovernanceEvidence(
      scope,
      "PRODUCTION_RELEASE_BOARD_PACKET"
    );
    const classifiedOutput = classifyRecord(
      {
        count: result.productionFinalAuthorityReviews.length,
        productionFinalAuthorityReviews:
          result.productionFinalAuthorityReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        authorityPosture: result.authorityPosture,
        authorityPacket,
        authorityHistory,
        releaseBoardEvidence,
        productionBlocked: true,
        finalAuthorityApprovalGranted: false,
        goLiveApproved: false,
        productionLaunchAuthorized: false,
        constitutionalOfficerAttestationReceived: false,
        qualifiedReleaseManagerApprovalGranted: false,
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
        classificationSource: "production-final-authority-route-output",
        classificationVersion: PRODUCTION_FINAL_AUTHORITY_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-final-authority-review",
          "final-go-no-go-review",
          "release-authority-review",
          "production-readiness-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-final-authority-approval-authority",
          "no-go-live-approval-authority",
          "no-production-launch-authority",
          "no-hold-release-authority",
          "no-support-communications-approval-authority",
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
          "redact release authority details before external disclosure",
        ],
        consentRequirements: [
          "institutional-production-final-authority-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_FINAL_AUTHORITY_PACKET_RECORDED"
          : "PRODUCTION_FINAL_AUTHORITY_REVIEWED",
      domain: "operations",
      severity: result.summary.goLiveApproved === 0 ? "INFO" : "WARN",
      message:
        "Governed production final authority review returned blocked production posture without go-live approval.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-final-authority",
      metadata: {
        authorityScope,
        count: result.productionFinalAuthorityReviews.length,
        blockedAuthorityItems: result.summary.blocked,
        reviewRequiredAuthorityItems: result.summary.reviewRequired,
        finalAuthorityApprovalGranted:
          result.summary.finalAuthorityApprovalGranted,
        goLiveApproved: result.summary.goLiveApproved,
        productionLaunchAuthorized:
          result.summary.productionLaunchAuthorized,
        launchHoldReleased: result.summary.launchHoldReleased,
        deploymentExecuted: result.summary.deploymentExecuted,
        publicProductionApiExposureAllowed:
          result.summary.publicProductionApiExposureAllowed,
        productionPortalLaunchExecuted:
          result.summary.productionPortalLaunchExecuted,
        paymentCaptureAllowed: result.summary.paymentCaptureAllowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      productionFinalAuthorityReviews:
        classifiedOutput.productionFinalAuthorityReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      authorityPosture: classifiedOutput.authorityPosture,
      authorityPacket: classifiedOutput.authorityPacket,
      authorityHistory: classifiedOutput.authorityHistory,
      releaseBoardEvidence: classifiedOutput.releaseBoardEvidence,
      productionBlocked: classifiedOutput.productionBlocked,
      finalAuthorityApprovalGranted:
        classifiedOutput.finalAuthorityApprovalGranted,
      goLiveApproved: classifiedOutput.goLiveApproved,
      productionLaunchAuthorized:
        classifiedOutput.productionLaunchAuthorized,
      constitutionalOfficerAttestationReceived:
        classifiedOutput.constitutionalOfficerAttestationReceived,
      qualifiedReleaseManagerApprovalGranted:
        classifiedOutput.qualifiedReleaseManagerApprovalGranted,
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
            : "Unknown production final authority error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
