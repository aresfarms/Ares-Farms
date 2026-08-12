import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_REGULATORY_RESPONSE_GATE_VERSION,
  evaluateProductionRegulatoryResponseGate,
} from "@/lib/governance/productionRegulatoryResponseGate";
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
 * Production Regulatory Response and Corrective Action Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed regulatory response and corrective-action
 *   evidence surface after examination/archive review.
 * - Vol I: keeps regulator response and corrective-action authority
 *   subordinate to constitutional governance, qualified legal/compliance
 *   ownership, and recorded human review.
 * - Vol II: blocks official regulator responses, corrective-action
 *   commitments, remediation execution, legal advice, notices, payment
 *   capture, official reports, public verification, regulatory reliance,
 *   production reliance, and official reliance.
 * - Vol III: assembles deterministic evidence across examiner findings,
 *   audit, replay, retention, redaction, source authority, reports, notices,
 *   payments, communications, and live-action limits.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to response evidence.
 * - Vol IV: supports examiner finding intake, corrective-action review,
 *   remediation review, legal hold, exception remediation, incident handoff,
 *   and evidence preservation.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   redaction, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while official response issuance remains blocked.
 */

type ProductionRegulatoryResponseBody = {
  actorId?: string | null;
  responseScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionRegulatoryResponseBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionRegulatoryResponseBody;
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
  return handleProductionRegulatoryResponse(
    req,
    "production-regulatory-response.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionRegulatoryResponse(
    req,
    "production-regulatory-response.record"
  );
}

async function handleProductionRegulatoryResponse(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const responseScope =
    body.responseScope ?? req.nextUrl.searchParams.get("responseScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-regulatory-response",
      traceId,
      schemaVersion: PRODUCTION_REGULATORY_RESPONSE_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-regulatory-response",
        responseScope,
        method: req.method,
        regulatoryResponsePackageApproved: false,
        officialRegulatorResponseIssued: false,
        correctiveActionPlanApproved: false,
        correctiveActionCommitted: false,
        correctiveActionExecuted: false,
        remediationPlanApproved: false,
        remediationExecuted: false,
        examinerFindingClosed: false,
        externalExaminerDisclosureApproved: false,
        legalHoldReleased: false,
        productionRelianceApprovalGranted: false,
        publicVerificationApprovalGranted: false,
        officialRelianceAllowed: false,
        legalAdviceProvided: false,
        regulatoryExaminationPackageSubmitted: false,
        examinationArchiveCertified: false,
        productionHealthCertified: false,
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
            "Runtime governance guard blocked production regulatory response review.",
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
      module: "api.governance.production-regulatory-response",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_REGULATORY_RESPONSE_GATE_VERSION,
          "src/lib/governance/productionRegulatoryResponseGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Regulatory Response Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_REGULATORY_RESPONSE_GATE_VERSION,
          "src/lib/governance/productionRegulatoryResponseGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-regulatory-response-api-v0.1.0",
          "api.governance.production-regulatory-response",
          traceId
        ),
      ],
    });
    const result = evaluateProductionRegulatoryResponseGate({
      responseScope,
    });
    const scope = responseScope ?? "platform";
    const responsePacket =
      req.method === "POST" && actorId
        ? recordReleaseGovernanceEvidence({
            kind: "PRODUCTION_REGULATORY_RESPONSE_PACKET",
            scope,
            actorId,
            reviewNote: body.reviewNote ?? null,
            replayRef: traceId,
          })
        : latestReleaseGovernanceEvidence(
            scope,
            "PRODUCTION_REGULATORY_RESPONSE_PACKET"
          );
    const responseHistory = releaseGovernanceEvidenceFor(
      scope,
      "PRODUCTION_REGULATORY_RESPONSE_PACKET"
    );
    const regulatoryExaminationEvidence = latestReleaseGovernanceEvidence(
      scope,
      "PRODUCTION_REGULATORY_EXAMINATION_PACKET"
    );
    const classifiedOutput = classifyRecord(
      {
        count: result.productionRegulatoryResponseReviews.length,
        productionRegulatoryResponseReviews:
          result.productionRegulatoryResponseReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        responsePosture: result.responsePosture,
        responsePacket,
        responseHistory,
        regulatoryExaminationEvidence,
        productionBlocked: true,
        regulatoryResponsePackageApproved: false,
        officialRegulatorResponseIssued: false,
        correctiveActionPlanApproved: false,
        correctiveActionCommitted: false,
        correctiveActionExecuted: false,
        remediationPlanApproved: false,
        remediationExecuted: false,
        examinerFindingClosed: false,
        externalExaminerDisclosureApproved: false,
        legalHoldReleased: false,
        productionRelianceApprovalGranted: false,
        publicVerificationApprovalGranted: false,
        regulatoryRelianceAllowed: false,
        officialRelianceAllowed: false,
        legalAdviceProvided: false,
        regulatoryExaminationPackageSubmitted: false,
        examinationArchiveCertified: false,
        productionHealthCertified: false,
        productionActivationExecuted: false,
        goLiveApproved: false,
        productionLaunchAuthorized: false,
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
        classificationSource: "production-regulatory-response-route-output",
        classificationVersion: PRODUCTION_REGULATORY_RESPONSE_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-regulatory-response-review",
          "corrective-action-review",
          "remediation-evidence-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-regulatory-response-package-approval-authority",
          "no-official-regulator-response-authority",
          "no-corrective-action-plan-approval-authority",
          "no-corrective-action-commitment-authority",
          "no-corrective-action-execution-authority",
          "no-remediation-plan-approval-authority",
          "no-remediation-execution-authority",
          "no-examiner-finding-closure-authority",
          "no-external-examiner-disclosure-authority",
          "no-legal-hold-release-authority",
          "no-production-reliance-approval-authority",
          "no-public-verification-approval-authority",
          "no-official-reliance-authority",
          "no-legal-advice-authority",
          "no-production-health-certification-authority",
          "no-production-activation-authority",
          "no-go-live-approval-authority",
          "no-production-launch-authority",
          "no-deployment-authority",
          "no-public-production-api-exposure-authority",
          "no-live-fetch-authority",
          "no-payment-capture-authority",
          "no-notice-send-authority",
          "no-official-report-publication-authority",
        ],
        redactionRequirements: [
          "redact restricted response details before public use",
          "redact credentials and source secrets",
          "redact infrastructure identifiers before external disclosure",
          "redact borrower, lender, sponsor, partner, or examiner identifiers before external disclosure review",
          "redact legal-hold and corrective-action internals before external disclosure",
        ],
        consentRequirements: [
          "institutional-production-regulatory-response-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_REGULATORY_RESPONSE_PACKET_RECORDED"
          : "PRODUCTION_REGULATORY_RESPONSE_REVIEWED",
      domain: "operations",
      severity:
        result.summary.officialRegulatorResponseIssued === 0
          ? "INFO"
          : "WARN",
      message:
        "Governed production regulatory response review returned blocked posture without official regulator response.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-regulatory-response",
      metadata: {
        responseScope,
        count: result.productionRegulatoryResponseReviews.length,
        blockedResponseItems: result.summary.blocked,
        reviewRequiredResponseItems: result.summary.reviewRequired,
        regulatoryResponsePackageApproved:
          result.summary.regulatoryResponsePackageApproved,
        officialRegulatorResponseIssued:
          result.summary.officialRegulatorResponseIssued,
        correctiveActionPlanApproved:
          result.summary.correctiveActionPlanApproved,
        correctiveActionCommitted: result.summary.correctiveActionCommitted,
        correctiveActionExecuted: result.summary.correctiveActionExecuted,
        remediationPlanApproved: result.summary.remediationPlanApproved,
        remediationExecuted: result.summary.remediationExecuted,
        examinerFindingClosed: result.summary.examinerFindingClosed,
        officialRelianceAllowed: result.summary.officialRelianceAllowed,
        legalAdviceProvided: result.summary.legalAdviceProvided,
        publicVerificationApprovalGranted:
          result.summary.publicVerificationApprovalGranted,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      productionRegulatoryResponseReviews:
        classifiedOutput.productionRegulatoryResponseReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      responsePosture: classifiedOutput.responsePosture,
      responsePacket: classifiedOutput.responsePacket,
      responseHistory: classifiedOutput.responseHistory,
      regulatoryExaminationEvidence: classifiedOutput.regulatoryExaminationEvidence,
      productionBlocked: classifiedOutput.productionBlocked,
      regulatoryResponsePackageApproved:
        classifiedOutput.regulatoryResponsePackageApproved,
      officialRegulatorResponseIssued:
        classifiedOutput.officialRegulatorResponseIssued,
      correctiveActionPlanApproved:
        classifiedOutput.correctiveActionPlanApproved,
      correctiveActionCommitted: classifiedOutput.correctiveActionCommitted,
      correctiveActionExecuted: classifiedOutput.correctiveActionExecuted,
      remediationPlanApproved: classifiedOutput.remediationPlanApproved,
      remediationExecuted: classifiedOutput.remediationExecuted,
      examinerFindingClosed: classifiedOutput.examinerFindingClosed,
      externalExaminerDisclosureApproved:
        classifiedOutput.externalExaminerDisclosureApproved,
      legalHoldReleased: classifiedOutput.legalHoldReleased,
      productionRelianceApprovalGranted:
        classifiedOutput.productionRelianceApprovalGranted,
      publicVerificationApprovalGranted:
        classifiedOutput.publicVerificationApprovalGranted,
      regulatoryRelianceAllowed: classifiedOutput.regulatoryRelianceAllowed,
      officialRelianceAllowed: classifiedOutput.officialRelianceAllowed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
      regulatoryExaminationPackageSubmitted:
        classifiedOutput.regulatoryExaminationPackageSubmitted,
      examinationArchiveCertified:
        classifiedOutput.examinationArchiveCertified,
      productionHealthCertified: classifiedOutput.productionHealthCertified,
      productionActivationExecuted:
        classifiedOutput.productionActivationExecuted,
      goLiveApproved: classifiedOutput.goLiveApproved,
      productionLaunchAuthorized:
        classifiedOutput.productionLaunchAuthorized,
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
            : "Unknown production regulatory response error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
