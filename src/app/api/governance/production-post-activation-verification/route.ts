import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION,
  evaluateProductionPostActivationVerificationGate,
} from "@/lib/governance/productionPostActivationVerificationGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Production Post-Activation Verification Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed post-activation verification readiness surface
 *   after activation ceremony evidence and before production reliance.
 * - Vol I: keeps verification authority subordinate to constitutional
 *   governance, qualified ownership, dual control, and human review.
 * - Vol II: blocks verification evidence from becoming legal advice, notices,
 *   payment capture, public verification, official reports, commitments,
 *   production reliance, or official reliance.
 * - Vol III: assembles deterministic evidence across health checks, public
 *   surfaces, audit, replay, monitoring, rollback, incident, support,
 *   communications, privacy, redaction, claims, and data rights.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to verification evidence.
 * - Vol IV: supports verification runbook review, watch-window ownership,
 *   rollback readiness, incident readiness, support readiness, and evidence
 *   retention.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   redaction, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while live production exposure remains blocked.
 */

type ProductionPostActivationVerificationBody = {
  actorId?: string | null;
  verificationScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionPostActivationVerificationBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionPostActivationVerificationBody;
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
  return handleProductionPostActivationVerification(
    req,
    "production-post-activation-verification.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionPostActivationVerification(
    req,
    "production-post-activation-verification.record"
  );
}

async function handleProductionPostActivationVerification(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const verificationScope =
    body.verificationScope ?? req.nextUrl.searchParams.get("verificationScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-post-activation-verification",
      traceId,
      schemaVersion: PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-post-activation-verification",
        verificationScope,
        method: req.method,
        postActivationVerificationApprovalGranted: false,
        postActivationVerificationStarted: false,
        postActivationVerificationCompleted: false,
        postActivationVerificationPassed: false,
        productionHealthCertified: false,
        activationCeremonyApprovalGranted: false,
        activationCeremonyExecuted: false,
        productionActivationExecuted: false,
        finalAuthorityApprovalGranted: false,
        goLiveApproved: false,
        productionLaunchAuthorized: false,
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
            "Runtime governance guard blocked production post-activation verification review.",
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
      module: "api.governance.production-post-activation-verification",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION,
          "src/lib/governance/productionPostActivationVerificationGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Post-Activation Verification Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION,
          "src/lib/governance/productionPostActivationVerificationGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-post-activation-verification-api-v0.1.0",
          "api.governance.production-post-activation-verification",
          traceId
        ),
      ],
    });
    const result = evaluateProductionPostActivationVerificationGate({
      verificationScope,
    });
    const verificationPacket =
      req.method === "POST"
        ? {
            verificationPacketId: `production-post-activation-verification-${Date.now()}`,
            verificationScope: verificationScope ?? "platform",
            reviewStatus:
              "PRODUCTION_POST_ACTIVATION_VERIFICATION_PACKET_RECORDED",
            reviewNote: body.reviewNote ?? null,
            postActivationVerificationApprovalGranted: false,
            postActivationVerificationStarted: false,
            postActivationVerificationCompleted: false,
            postActivationVerificationPassed: false,
            productionHealthCertified: false,
            activationCeremonyApprovalGranted: false,
            activationCeremonyExecuted: false,
            productionActivationExecuted: false,
            finalAuthorityApprovalGranted: false,
            goLiveApproved: false,
            productionLaunchAuthorized: false,
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
        count: result.productionPostActivationVerificationReviews.length,
        productionPostActivationVerificationReviews:
          result.productionPostActivationVerificationReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        verificationPosture: result.verificationPosture,
        verificationPacket,
        productionBlocked: true,
        postActivationVerificationApprovalGranted: false,
        postActivationVerificationStarted: false,
        postActivationVerificationCompleted: false,
        postActivationVerificationPassed: false,
        productionHealthCertified: false,
        activationCeremonyApprovalGranted: false,
        activationCeremonyExecuted: false,
        productionActivationExecuted: false,
        finalAuthorityApprovalGranted: false,
        goLiveApproved: false,
        productionLaunchAuthorized: false,
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
          "production-post-activation-verification-route-output",
        classificationVersion:
          PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-post-activation-verification-review",
          "post-activation-verification-readiness-review",
          "production-readiness-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-post-activation-verification-approval-authority",
          "no-post-activation-verification-start-authority",
          "no-post-activation-verification-completion-authority",
          "no-production-health-certification-authority",
          "no-activation-ceremony-approval-authority",
          "no-activation-ceremony-execution-authority",
          "no-production-activation-authority",
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
          "redact verification runbook and production health details before external disclosure",
        ],
        consentRequirements: [
          "institutional-production-post-activation-verification-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_POST_ACTIVATION_VERIFICATION_PACKET_RECORDED"
          : "PRODUCTION_POST_ACTIVATION_VERIFICATION_REVIEWED",
      domain: "operations",
      severity:
        result.summary.postActivationVerificationStarted === 0
          ? "INFO"
          : "WARN",
      message:
        "Governed production post-activation verification review returned blocked production posture without verification start.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-post-activation-verification",
      metadata: {
        verificationScope,
        count: result.productionPostActivationVerificationReviews.length,
        blockedVerificationItems: result.summary.blocked,
        reviewRequiredVerificationItems: result.summary.reviewRequired,
        postActivationVerificationApprovalGranted:
          result.summary.postActivationVerificationApprovalGranted,
        postActivationVerificationStarted:
          result.summary.postActivationVerificationStarted,
        postActivationVerificationCompleted:
          result.summary.postActivationVerificationCompleted,
        postActivationVerificationPassed:
          result.summary.postActivationVerificationPassed,
        productionHealthCertified: result.summary.productionHealthCertified,
        activationCeremonyExecuted:
          result.summary.activationCeremonyExecuted,
        productionActivationExecuted:
          result.summary.productionActivationExecuted,
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
      productionPostActivationVerificationReviews:
        classifiedOutput.productionPostActivationVerificationReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      verificationPosture: classifiedOutput.verificationPosture,
      verificationPacket: classifiedOutput.verificationPacket,
      productionBlocked: classifiedOutput.productionBlocked,
      postActivationVerificationApprovalGranted:
        classifiedOutput.postActivationVerificationApprovalGranted,
      postActivationVerificationStarted:
        classifiedOutput.postActivationVerificationStarted,
      postActivationVerificationCompleted:
        classifiedOutput.postActivationVerificationCompleted,
      postActivationVerificationPassed:
        classifiedOutput.postActivationVerificationPassed,
      productionHealthCertified: classifiedOutput.productionHealthCertified,
      activationCeremonyApprovalGranted:
        classifiedOutput.activationCeremonyApprovalGranted,
      activationCeremonyExecuted:
        classifiedOutput.activationCeremonyExecuted,
      productionActivationExecuted:
        classifiedOutput.productionActivationExecuted,
      finalAuthorityApprovalGranted:
        classifiedOutput.finalAuthorityApprovalGranted,
      goLiveApproved: classifiedOutput.goLiveApproved,
      productionLaunchAuthorized:
        classifiedOutput.productionLaunchAuthorized,
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
            : "Unknown production post-activation verification error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
