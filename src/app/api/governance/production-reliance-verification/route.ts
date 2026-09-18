import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION,
  evaluateProductionRelianceVerificationGate,
} from "@/lib/governance/productionRelianceVerificationGate";
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
 * Production Reliance and Public Verification Boundary Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed reliance boundary surface after
 *   post-activation verification evidence and before any public or official
 *   reliance.
 * - Vol I: keeps reliance authority subordinate to constitutional governance,
 *   qualified ownership, separation of duties, and human review.
 * - Vol II: blocks public verification, legal advice, notices, payment
 *   capture, official reports, commitments, regulatory reliance, production
 *   reliance, and official reliance.
 * - Vol III: assembles deterministic evidence across public claims, public
 *   DTOs, audit, replay, data rights, reports, notices, payments, source
 *   authority, and live-action limits.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to reliance boundary evidence.
 * - Vol IV: supports release-board handoff, exception remediation, incident
 *   recovery, and evidence retention.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   redaction, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while public verification and official reliance remain blocked.
 */

type ProductionRelianceVerificationBody = {
  actorId?: string | null;
  relianceScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionRelianceVerificationBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionRelianceVerificationBody;
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
  return handleProductionRelianceVerification(
    req,
    "production-reliance-verification.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionRelianceVerification(
    req,
    "production-reliance-verification.record"
  );
}

async function handleProductionRelianceVerification(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const relianceScope =
    body.relianceScope ?? req.nextUrl.searchParams.get("relianceScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-reliance-verification",
      traceId,
      schemaVersion: PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-reliance-verification",
        relianceScope,
        method: req.method,
        productionRelianceApprovalGranted: false,
        publicVerificationApprovalGranted: false,
        publicVerificationGatewayOperational: false,
        publicVerificationArtifactPublished: false,
        externalRelianceDisclosureApproved: false,
        regulatoryRelianceAllowed: false,
        officialRelianceAllowed: false,
        legalAdviceProvided: false,
        postActivationVerificationApprovalGranted: false,
        postActivationVerificationStarted: false,
        postActivationVerificationCompleted: false,
        postActivationVerificationPassed: false,
        productionHealthCertified: false,
        productionActivationExecuted: false,
        finalAuthorityApprovalGranted: false,
        goLiveApproved: false,
        productionLaunchAuthorized: false,
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
            "Runtime governance guard blocked production reliance and public verification review.",
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
      module: "api.governance.production-reliance-verification",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION,
          "src/lib/governance/productionRelianceVerificationGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Reliance and Public Verification Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION,
          "src/lib/governance/productionRelianceVerificationGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-reliance-verification-api-v0.1.0",
          "api.governance.production-reliance-verification",
          traceId
        ),
      ],
    });
    const result = evaluateProductionRelianceVerificationGate({
      relianceScope,
    });
    const scope = relianceScope ?? "platform";
    const reliancePacket =
      req.method === "POST" && actorId
        ? recordReleaseGovernanceEvidence({
            kind: "PRODUCTION_RELIANCE_VERIFICATION_PACKET",
            scope,
            actorId,
            reviewNote: body.reviewNote ?? null,
            replayRef: traceId,
          })
        : latestReleaseGovernanceEvidence(
            scope,
            "PRODUCTION_RELIANCE_VERIFICATION_PACKET"
          );
    const relianceHistory = releaseGovernanceEvidenceFor(
      scope,
      "PRODUCTION_RELIANCE_VERIFICATION_PACKET"
    );
    const postActivationVerificationEvidence = latestReleaseGovernanceEvidence(
      scope,
      "PRODUCTION_POST_ACTIVATION_VERIFICATION_PACKET"
    );
    const classifiedOutput = classifyRecord(
      {
        count: result.productionRelianceVerificationReviews.length,
        productionRelianceVerificationReviews:
          result.productionRelianceVerificationReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        reliancePosture: result.reliancePosture,
        reliancePacket,
        relianceHistory,
        postActivationVerificationEvidence,
        productionBlocked: true,
        productionRelianceApprovalGranted: false,
        publicVerificationApprovalGranted: false,
        publicVerificationGatewayOperational: false,
        publicVerificationArtifactPublished: false,
        externalRelianceDisclosureApproved: false,
        regulatoryRelianceAllowed: false,
        officialRelianceAllowed: false,
        legalAdviceProvided: false,
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
        customerCommunicationsReleased: false,
        publicStatusPageEnabled: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "production-reliance-verification-route-output",
        classificationVersion: PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-reliance-verification-review",
          "public-verification-boundary-review",
          "official-reliance-boundary-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-production-reliance-approval-authority",
          "no-public-verification-approval-authority",
          "no-public-verification-gateway-authority",
          "no-public-verification-artifact-publication-authority",
          "no-external-reliance-disclosure-authority",
          "no-regulatory-reliance-authority",
          "no-official-reliance-authority",
          "no-legal-advice-authority",
          "no-post-activation-verification-approval-authority",
          "no-production-health-certification-authority",
          "no-production-activation-authority",
          "no-go-live-approval-authority",
          "no-production-launch-authority",
          "no-hold-release-authority",
          "no-customer-communication-release-authority",
          "no-public-status-page-authority",
          "no-notice-send-authority",
          "no-official-report-publication-authority",
          "no-deployment-authority",
          "no-public-production-api-exposure-authority",
          "no-live-fetch-authority",
          "no-payment-capture-authority",
        ],
        redactionRequirements: [
          "redact restricted reliance-boundary details before public use",
          "redact credentials and source secrets",
          "redact infrastructure identifiers before external disclosure",
          "redact support escalation and incident details before external disclosure",
          "redact borrower, lender, sponsor, or partner identifiers before public communication review",
          "redact public verification artifact internals before qualified publication review",
        ],
        consentRequirements: [
          "institutional-production-reliance-public-verification-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_RELIANCE_VERIFICATION_PACKET_RECORDED"
          : "PRODUCTION_RELIANCE_VERIFICATION_REVIEWED",
      domain: "operations",
      severity:
        result.summary.productionRelianceApprovalGranted === 0
          ? "INFO"
          : "WARN",
      message:
        "Governed production reliance and public verification review returned blocked production posture without reliance authority.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-reliance-verification",
      metadata: {
        relianceScope,
        count: result.productionRelianceVerificationReviews.length,
        blockedRelianceItems: result.summary.blocked,
        reviewRequiredRelianceItems: result.summary.reviewRequired,
        productionRelianceApprovalGranted:
          result.summary.productionRelianceApprovalGranted,
        publicVerificationApprovalGranted:
          result.summary.publicVerificationApprovalGranted,
        publicVerificationGatewayOperational:
          result.summary.publicVerificationGatewayOperational,
        publicVerificationArtifactPublished:
          result.summary.publicVerificationArtifactPublished,
        regulatoryRelianceAllowed: result.summary.regulatoryRelianceAllowed,
        officialRelianceAllowed: result.summary.officialRelianceAllowed,
        legalAdviceProvided: result.summary.legalAdviceProvided,
        postActivationVerificationPassed:
          result.summary.postActivationVerificationPassed,
        productionHealthCertified: result.summary.productionHealthCertified,
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
      productionRelianceVerificationReviews:
        classifiedOutput.productionRelianceVerificationReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      reliancePosture: classifiedOutput.reliancePosture,
      reliancePacket: classifiedOutput.reliancePacket,
      relianceHistory: classifiedOutput.relianceHistory,
      postActivationVerificationEvidence:
        classifiedOutput.postActivationVerificationEvidence,
      productionBlocked: classifiedOutput.productionBlocked,
      productionRelianceApprovalGranted:
        classifiedOutput.productionRelianceApprovalGranted,
      publicVerificationApprovalGranted:
        classifiedOutput.publicVerificationApprovalGranted,
      publicVerificationGatewayOperational:
        classifiedOutput.publicVerificationGatewayOperational,
      publicVerificationArtifactPublished:
        classifiedOutput.publicVerificationArtifactPublished,
      externalRelianceDisclosureApproved:
        classifiedOutput.externalRelianceDisclosureApproved,
      regulatoryRelianceAllowed: classifiedOutput.regulatoryRelianceAllowed,
      officialRelianceAllowed: classifiedOutput.officialRelianceAllowed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
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
      customerCommunicationsReleased:
        classifiedOutput.customerCommunicationsReleased,
      publicStatusPageEnabled: classifiedOutput.publicStatusPageEnabled,
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
            : "Unknown production reliance and public verification error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
