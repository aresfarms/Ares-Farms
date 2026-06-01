import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION,
  evaluateProductionActivationCeremonyGate,
} from "@/lib/governance/productionActivationCeremonyGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Production Activation Ceremony Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed activation ceremony readiness surface after
 *   final authority evidence and before launch-time production action.
 * - Vol I: keeps activation ceremony authority subordinate to constitutional
 *   governance, qualified ownership, dual control, and human review.
 * - Vol II: blocks ceremony evidence from becoming legal advice, notices,
 *   payment capture, public verification, official reports, partner
 *   commitments, agency commitments, production reliance, or official reliance.
 * - Vol III: assembles deterministic evidence across final authority, launch
 *   holds, credentials, deployment sequence, monitoring, rollback, incident,
 *   support, communications, audit, privacy, redaction, claims, and
 *   post-activation verification controls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to activation ceremony evidence.
 * - Vol IV: supports activation ceremony review, release ownership, dual
 *   control, rollback readiness, war-room posture, and evidence retention.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   redaction, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while live production exposure remains blocked.
 */

type ProductionActivationCeremonyBody = {
  actorId?: string | null;
  ceremonyScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionActivationCeremonyBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionActivationCeremonyBody;
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
  return handleProductionActivationCeremony(
    req,
    "production-activation-ceremony.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionActivationCeremony(
    req,
    "production-activation-ceremony.record"
  );
}

async function handleProductionActivationCeremony(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const ceremonyScope =
    body.ceremonyScope ?? req.nextUrl.searchParams.get("ceremonyScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-activation-ceremony",
      traceId,
      schemaVersion: PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-activation-ceremony",
        ceremonyScope,
        method: req.method,
        activationCeremonyApprovalGranted: false,
        activationCeremonyExecuted: false,
        productionActivationExecuted: false,
        postActivationVerificationStarted: false,
        postActivationVerificationCompleted: false,
        finalAuthorityApprovalGranted: false,
        goLiveApproved: false,
        productionLaunchAuthorized: false,
        launchHoldReleased: false,
        deploymentHoldReleased: false,
        freezeHoldReleased: false,
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
            "Runtime governance guard blocked production activation ceremony review.",
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
      module: "api.governance.production-activation-ceremony",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION,
          "src/lib/governance/productionActivationCeremonyGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Activation Ceremony Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION,
          "src/lib/governance/productionActivationCeremonyGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-activation-ceremony-api-v0.1.0",
          "api.governance.production-activation-ceremony",
          traceId
        ),
      ],
    });
    const result = evaluateProductionActivationCeremonyGate({
      ceremonyScope,
    });
    const ceremonyPacket =
      req.method === "POST"
        ? {
            ceremonyPacketId: `production-activation-ceremony-${Date.now()}`,
            ceremonyScope: ceremonyScope ?? "platform",
            reviewStatus: "PRODUCTION_ACTIVATION_CEREMONY_PACKET_RECORDED",
            reviewNote: body.reviewNote ?? null,
            activationCeremonyApprovalGranted: false,
            activationCeremonyExecuted: false,
            productionActivationExecuted: false,
            postActivationVerificationStarted: false,
            postActivationVerificationCompleted: false,
            finalAuthorityApprovalGranted: false,
            goLiveApproved: false,
            productionLaunchAuthorized: false,
            launchHoldReleased: false,
            deploymentHoldReleased: false,
            freezeHoldReleased: false,
            deploymentExecuted: false,
            publicProductionApiExposureAllowed: false,
            productionPortalLaunchExecuted: false,
            liveExternalActionPerformed: false,
            paymentCaptureAllowed: false,
            productionBlocked: true,
            replayRef: traceId,
          }
        : null;
    const classifiedOutput = classifyRecord(
      {
        count: result.productionActivationCeremonyReviews.length,
        productionActivationCeremonyReviews:
          result.productionActivationCeremonyReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        ceremonyPosture: result.ceremonyPosture,
        ceremonyPacket,
        productionBlocked: true,
        activationCeremonyApprovalGranted: false,
        activationCeremonyExecuted: false,
        productionActivationExecuted: false,
        postActivationVerificationStarted: false,
        postActivationVerificationCompleted: false,
        finalAuthorityApprovalGranted: false,
        goLiveApproved: false,
        productionLaunchAuthorized: false,
        constitutionalOfficerAttestationReceived: false,
        qualifiedReleaseManagerApprovalGranted: false,
        supportCommunicationsApprovalGranted: false,
        supportOperationsActivated: false,
        customerCommunicationsReleased: false,
        publicStatusPageEnabled: false,
        incidentResponseActivated: false,
        incidentBridgeActivated: false,
        rollbackAuthorized: false,
        emergencyRollbackExecuted: false,
        emergencyHoldReleased: false,
        killSwitchActivated: false,
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
          "production-activation-ceremony-route-output",
        classificationVersion: PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-activation-ceremony-review",
          "activation-ceremony-readiness-review",
          "release-authority-review",
          "production-readiness-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-activation-ceremony-approval-authority",
          "no-activation-ceremony-execution-authority",
          "no-production-activation-authority",
          "no-post-activation-verification-authority",
          "no-go-live-approval-authority",
          "no-production-launch-authority",
          "no-hold-release-authority",
          "no-customer-communication-release-authority",
          "no-public-status-page-authority",
          "no-notice-send-authority",
          "no-official-report-publication-authority",
          "no-public-verification-authority",
          "no-legal-advice-authority",
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
          "redact activation ceremony and release authority details before external disclosure",
        ],
        consentRequirements: [
          "institutional-production-activation-ceremony-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_ACTIVATION_CEREMONY_PACKET_RECORDED"
          : "PRODUCTION_ACTIVATION_CEREMONY_REVIEWED",
      domain: "operations",
      severity:
        result.summary.activationCeremonyExecuted === 0 ? "INFO" : "WARN",
      message:
        "Governed production activation ceremony review returned blocked production posture without ceremony execution.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-activation-ceremony",
      metadata: {
        ceremonyScope,
        count: result.productionActivationCeremonyReviews.length,
        blockedCeremonyItems: result.summary.blocked,
        reviewRequiredCeremonyItems: result.summary.reviewRequired,
        activationCeremonyApprovalGranted:
          result.summary.activationCeremonyApprovalGranted,
        activationCeremonyExecuted:
          result.summary.activationCeremonyExecuted,
        productionActivationExecuted:
          result.summary.productionActivationExecuted,
        postActivationVerificationStarted:
          result.summary.postActivationVerificationStarted,
        goLiveApproved: result.summary.goLiveApproved,
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
      productionActivationCeremonyReviews:
        classifiedOutput.productionActivationCeremonyReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      ceremonyPosture: classifiedOutput.ceremonyPosture,
      ceremonyPacket: classifiedOutput.ceremonyPacket,
      productionBlocked: classifiedOutput.productionBlocked,
      activationCeremonyApprovalGranted:
        classifiedOutput.activationCeremonyApprovalGranted,
      activationCeremonyExecuted:
        classifiedOutput.activationCeremonyExecuted,
      productionActivationExecuted:
        classifiedOutput.productionActivationExecuted,
      postActivationVerificationStarted:
        classifiedOutput.postActivationVerificationStarted,
      postActivationVerificationCompleted:
        classifiedOutput.postActivationVerificationCompleted,
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
      customerCommunicationsReleased:
        classifiedOutput.customerCommunicationsReleased,
      publicStatusPageEnabled: classifiedOutput.publicStatusPageEnabled,
      incidentResponseActivated: classifiedOutput.incidentResponseActivated,
      incidentBridgeActivated: classifiedOutput.incidentBridgeActivated,
      rollbackAuthorized: classifiedOutput.rollbackAuthorized,
      emergencyRollbackExecuted: classifiedOutput.emergencyRollbackExecuted,
      emergencyHoldReleased: classifiedOutput.emergencyHoldReleased,
      killSwitchActivated: classifiedOutput.killSwitchActivated,
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
            : "Unknown production activation ceremony error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
