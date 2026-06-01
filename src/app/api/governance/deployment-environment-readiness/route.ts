import { NextRequest, NextResponse } from "next/server";

import {
  DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION,
  evaluateDeploymentEnvironmentReadinessGate,
} from "@/lib/governance/deploymentEnvironmentReadinessGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Deployment Environment Readiness Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed deployment environment review surface across
 *   the platform without executing deployment.
 * - Vol I: keeps release-candidate promotion subordinate to constitutional
 *   authority, release ownership, and explicit qualified approval.
 * - Vol II: blocks deployment readiness review from becoming approvals,
 *   official reports, notice sends, payment capture, public verification,
 *   legal advice, partner commitments, agency commitments, or official
 *   reliance.
 * - Vol III: assembles deterministic evidence across build, typecheck,
 *   backend smoke, integration smoke, secrets, migrations, observability,
 *   rollback, incident, DNS, TLS, CDN, WAF, and backup controls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to deployment review records.
 * - Vol IV: supports release manager review, deployment hold, rollback review,
 *   incident bridge, support routing, and production freeze controls.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   portability, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while all live production exposure remains blocked.
 */

type DeploymentEnvironmentReadinessBody = {
  actorId?: string | null;
  environmentScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<DeploymentEnvironmentReadinessBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as DeploymentEnvironmentReadinessBody;
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
  return handleDeploymentEnvironmentReadiness(
    req,
    "deployment-environment-readiness.read"
  );
}

export async function POST(req: NextRequest) {
  return handleDeploymentEnvironmentReadiness(
    req,
    "deployment-environment-readiness.hold"
  );
}

async function handleDeploymentEnvironmentReadiness(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const environmentScope =
    body.environmentScope ?? req.nextUrl.searchParams.get("environmentScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.deployment-environment-readiness",
      traceId,
      schemaVersion: DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/deployment-environment-readiness",
        environmentScope,
        method: req.method,
        releaseCandidateApproved: false,
        deploymentExecuted: false,
        environmentPromotionAllowed: false,
        productionSecretsActivated: false,
        publicDnsCutoverAllowed: false,
        databaseMigrationAllowed: false,
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
            "Runtime governance guard blocked deployment environment readiness review.",
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
      module: "api.governance.deployment-environment-readiness",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION,
          "src/lib/governance/deploymentEnvironmentReadinessGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Deployment Environment Readiness Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION,
          "src/lib/governance/deploymentEnvironmentReadinessGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "deployment-environment-readiness-api-v0.1.0",
          "api.governance.deployment-environment-readiness",
          traceId
        ),
      ],
    });
    const result = evaluateDeploymentEnvironmentReadinessGate({
      environmentScope,
    });
    const deploymentHold =
      req.method === "POST"
        ? {
            deploymentHoldId: `deployment-environment-hold-${Date.now()}`,
            environmentScope: environmentScope ?? "platform",
            reviewStatus: "DEPLOYMENT_ENVIRONMENT_HOLD_RECORDED",
            reviewNote: body.reviewNote ?? null,
            releaseCandidateApproved: false,
            deploymentExecuted: false,
            environmentPromotionAllowed: false,
            productionSecretsActivated: false,
            publicDnsCutoverAllowed: false,
            databaseMigrationAllowed: false,
            liveExternalActionPerformed: false,
            paymentCaptureAllowed: false,
            borrowerNoticeSendAllowed: false,
            officialReportPublicationAllowed: false,
            publicVerificationAllowed: false,
            productionBlocked: true,
            qualifiedReleaseManagerRequired: true,
            replayRef: traceId,
          }
        : null;
    const classifiedOutput = classifyRecord(
      {
        count: result.deploymentEnvironmentReviews.length,
        deploymentEnvironmentReviews:
          result.deploymentEnvironmentReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        deploymentPosture: result.deploymentPosture,
        deploymentHold,
        productionBlocked: true,
        releaseCandidateApproved: false,
        deploymentExecuted: false,
        environmentPromotionAllowed: false,
        productionSecretsActivated: false,
        publicDnsCutoverAllowed: false,
        cdnWafTlsEnabled: false,
        databaseMigrationAllowed: false,
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
          "deployment-environment-readiness-route-output",
        classificationVersion: DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "deployment-environment-readiness-review",
          "release-candidate-review",
          "deployment-hold-evidence",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-deployment-authority",
          "no-production-secret-activation-authority",
          "no-public-dns-cutover-authority",
          "no-production-database-migration-authority",
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
          "redact borrower-sensitive data before external disclosure",
        ],
        consentRequirements: [
          "institutional-deployment-environment-readiness-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "DEPLOYMENT_ENVIRONMENT_HOLD_RECORDED"
          : "DEPLOYMENT_ENVIRONMENT_READINESS_REVIEWED",
      domain: "operations",
      severity:
        result.summary.deploymentExecuted === 0 ? "INFO" : "WARN",
      message:
        "Governed deployment environment readiness review returned blocked deployment posture without production exposure.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.deployment-environment-readiness",
      metadata: {
        environmentScope,
        count: result.deploymentEnvironmentReviews.length,
        blockedEnvironmentItems: result.summary.blocked,
        reviewRequiredEnvironmentItems: result.summary.reviewRequired,
        releaseCandidateApproved: result.summary.releaseCandidateApproved,
        deploymentExecuted: result.summary.deploymentExecuted,
        environmentPromotionAllowed:
          result.summary.environmentPromotionAllowed,
        productionSecretsActivated:
          result.summary.productionSecretsActivated,
        publicDnsCutoverAllowed: result.summary.publicDnsCutoverAllowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      deploymentEnvironmentReviews:
        classifiedOutput.deploymentEnvironmentReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      deploymentPosture: classifiedOutput.deploymentPosture,
      deploymentHold: classifiedOutput.deploymentHold,
      productionBlocked: classifiedOutput.productionBlocked,
      releaseCandidateApproved: classifiedOutput.releaseCandidateApproved,
      deploymentExecuted: classifiedOutput.deploymentExecuted,
      environmentPromotionAllowed:
        classifiedOutput.environmentPromotionAllowed,
      productionSecretsActivated: classifiedOutput.productionSecretsActivated,
      publicDnsCutoverAllowed: classifiedOutput.publicDnsCutoverAllowed,
      cdnWafTlsEnabled: classifiedOutput.cdnWafTlsEnabled,
      databaseMigrationAllowed: classifiedOutput.databaseMigrationAllowed,
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
            : "Unknown deployment environment readiness error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
