import { NextRequest, NextResponse } from "next/server";

import {
  PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION,
  evaluateProductionRegulatoryExaminationGate,
} from "@/lib/governance/productionRegulatoryExaminationGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Production Regulatory Examination and Evidence Archive Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed examination/archive readiness surface after
 *   production reliance and public verification boundary review.
 * - Vol I: keeps examination submission authority subordinate to
 *   constitutional governance, qualified legal/compliance ownership, and human
 *   review.
 * - Vol II: blocks regulator submissions, public verification, legal advice,
 *   notices, payment capture, official reports, commitments, regulatory
 *   reliance, production reliance, and official reliance.
 * - Vol III: assembles deterministic evidence across audit, replay, retention,
 *   redaction, source authority, reports, notices, payments, communications,
 *   and live-action limits.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to examination evidence.
 * - Vol IV: supports examination preparation, archive readiness, legal hold,
 *   exception remediation, incident handoff, and evidence preservation.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   redaction, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while official examination submission remains blocked.
 */

type ProductionRegulatoryExaminationBody = {
  actorId?: string | null;
  examinationScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ProductionRegulatoryExaminationBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ProductionRegulatoryExaminationBody;
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
  return handleProductionRegulatoryExamination(
    req,
    "production-regulatory-examination.read"
  );
}

export async function POST(req: NextRequest) {
  return handleProductionRegulatoryExamination(
    req,
    "production-regulatory-examination.record"
  );
}

async function handleProductionRegulatoryExamination(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const examinationScope =
    body.examinationScope ?? req.nextUrl.searchParams.get("examinationScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.production-regulatory-examination",
      traceId,
      schemaVersion: PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/production-regulatory-examination",
        examinationScope,
        method: req.method,
        regulatoryExaminationPackageApproved: false,
        regulatoryExaminationPackageSubmitted: false,
        regulatorPortalUploadAllowed: false,
        regulatoryResponseIssued: false,
        examinationArchiveCertified: false,
        evidenceRetentionCertified: false,
        legalHoldReleased: false,
        externalExaminerDisclosureApproved: false,
        productionRelianceApprovalGranted: false,
        publicVerificationApprovalGranted: false,
        officialRelianceAllowed: false,
        legalAdviceProvided: false,
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
            "Runtime governance guard blocked production regulatory examination review.",
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
      module: "api.governance.production-regulatory-examination",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION,
          "src/lib/governance/productionRegulatoryExaminationGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Production Regulatory Examination Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION,
          "src/lib/governance/productionRegulatoryExaminationGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "production-regulatory-examination-api-v0.1.0",
          "api.governance.production-regulatory-examination",
          traceId
        ),
      ],
    });
    const result = evaluateProductionRegulatoryExaminationGate({
      examinationScope,
    });
    const examinationPacket =
      req.method === "POST"
        ? {
            examinationPacketId: `production-regulatory-examination-${Date.now()}`,
            examinationScope: examinationScope ?? "platform",
            reviewStatus: "PRODUCTION_REGULATORY_EXAMINATION_PACKET_RECORDED",
            reviewNote: body.reviewNote ?? null,
            regulatoryExaminationPackageApproved: false,
            regulatoryExaminationPackageSubmitted: false,
            regulatorPortalUploadAllowed: false,
            regulatoryResponseIssued: false,
            examinationArchiveCertified: false,
            evidenceRetentionCertified: false,
            legalHoldReleased: false,
            externalExaminerDisclosureApproved: false,
            productionRelianceApprovalGranted: false,
            publicVerificationApprovalGranted: false,
            officialRelianceAllowed: false,
            legalAdviceProvided: false,
            productionHealthCertified: false,
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
        count: result.productionRegulatoryExaminationReviews.length,
        productionRegulatoryExaminationReviews:
          result.productionRegulatoryExaminationReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        examinationPosture: result.examinationPosture,
        examinationPacket,
        productionBlocked: true,
        regulatoryExaminationPackageApproved: false,
        regulatoryExaminationPackageSubmitted: false,
        regulatorPortalUploadAllowed: false,
        regulatoryResponseIssued: false,
        examinationArchiveCertified: false,
        evidenceRetentionCertified: false,
        legalHoldReleased: false,
        externalExaminerDisclosureApproved: false,
        productionRelianceApprovalGranted: false,
        publicVerificationApprovalGranted: false,
        publicVerificationGatewayOperational: false,
        publicVerificationArtifactPublished: false,
        regulatoryRelianceAllowed: false,
        officialRelianceAllowed: false,
        legalAdviceProvided: false,
        postActivationVerificationApprovalGranted: false,
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
        classificationSource:
          "production-regulatory-examination-route-output",
        classificationVersion: PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "production-regulatory-examination-review",
          "evidence-archive-readiness-review",
          "regulator-disclosure-boundary-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-regulatory-examination-package-approval-authority",
          "no-regulator-submission-authority",
          "no-regulator-portal-upload-authority",
          "no-official-regulator-response-authority",
          "no-evidence-archive-certification-authority",
          "no-retention-certification-authority",
          "no-legal-hold-release-authority",
          "no-external-examiner-disclosure-authority",
          "no-production-reliance-approval-authority",
          "no-public-verification-approval-authority",
          "no-public-verification-gateway-authority",
          "no-official-reliance-authority",
          "no-legal-advice-authority",
          "no-post-activation-verification-approval-authority",
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
          "redact restricted examination details before public use",
          "redact credentials and source secrets",
          "redact infrastructure identifiers before external disclosure",
          "redact incident and support escalation details before external disclosure",
          "redact borrower, lender, sponsor, or partner identifiers before examiner disclosure review",
          "redact legal-hold and retention internals before external disclosure",
        ],
        consentRequirements: [
          "institutional-production-regulatory-examination-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "PRODUCTION_REGULATORY_EXAMINATION_PACKET_RECORDED"
          : "PRODUCTION_REGULATORY_EXAMINATION_REVIEWED",
      domain: "operations",
      severity:
        result.summary.regulatoryExaminationPackageSubmitted === 0
          ? "INFO"
          : "WARN",
      message:
        "Governed production regulatory examination review returned blocked posture without regulator submission.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.production-regulatory-examination",
      metadata: {
        examinationScope,
        count: result.productionRegulatoryExaminationReviews.length,
        blockedExaminationItems: result.summary.blocked,
        reviewRequiredExaminationItems: result.summary.reviewRequired,
        regulatoryExaminationPackageApproved:
          result.summary.regulatoryExaminationPackageApproved,
        regulatoryExaminationPackageSubmitted:
          result.summary.regulatoryExaminationPackageSubmitted,
        regulatorPortalUploadAllowed:
          result.summary.regulatorPortalUploadAllowed,
        regulatoryResponseIssued: result.summary.regulatoryResponseIssued,
        examinationArchiveCertified:
          result.summary.examinationArchiveCertified,
        evidenceRetentionCertified:
          result.summary.evidenceRetentionCertified,
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
      productionRegulatoryExaminationReviews:
        classifiedOutput.productionRegulatoryExaminationReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      examinationPosture: classifiedOutput.examinationPosture,
      examinationPacket: classifiedOutput.examinationPacket,
      productionBlocked: classifiedOutput.productionBlocked,
      regulatoryExaminationPackageApproved:
        classifiedOutput.regulatoryExaminationPackageApproved,
      regulatoryExaminationPackageSubmitted:
        classifiedOutput.regulatoryExaminationPackageSubmitted,
      regulatorPortalUploadAllowed:
        classifiedOutput.regulatorPortalUploadAllowed,
      regulatoryResponseIssued: classifiedOutput.regulatoryResponseIssued,
      examinationArchiveCertified:
        classifiedOutput.examinationArchiveCertified,
      evidenceRetentionCertified: classifiedOutput.evidenceRetentionCertified,
      legalHoldReleased: classifiedOutput.legalHoldReleased,
      externalExaminerDisclosureApproved:
        classifiedOutput.externalExaminerDisclosureApproved,
      productionRelianceApprovalGranted:
        classifiedOutput.productionRelianceApprovalGranted,
      publicVerificationApprovalGranted:
        classifiedOutput.publicVerificationApprovalGranted,
      publicVerificationGatewayOperational:
        classifiedOutput.publicVerificationGatewayOperational,
      publicVerificationArtifactPublished:
        classifiedOutput.publicVerificationArtifactPublished,
      regulatoryRelianceAllowed: classifiedOutput.regulatoryRelianceAllowed,
      officialRelianceAllowed: classifiedOutput.officialRelianceAllowed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
      postActivationVerificationApprovalGranted:
        classifiedOutput.postActivationVerificationApprovalGranted,
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
            : "Unknown production regulatory examination error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
