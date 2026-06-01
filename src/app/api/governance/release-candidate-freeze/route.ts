import { NextRequest, NextResponse } from "next/server";

import {
  RELEASE_CANDIDATE_FREEZE_PLAN_VERSION,
  evaluateReleaseCandidateFreezePlan,
} from "@/lib/governance/releaseCandidateFreezePlan";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Release Candidate Freeze Plan API
 *
 * Master Volume Governance:
 * - Vol 0: exposes one governed release-candidate freeze review surface across
 *   the platform without deploying production.
 * - Vol I: keeps release-candidate freeze subordinate to constitutional
 *   authority, accountable release ownership, and qualified approval.
 * - Vol II: blocks freeze review from becoming production approval, official
 *   reports, notice sends, payment capture, public verification, legal advice,
 *   partner commitments, agency commitments, or official reliance.
 * - Vol III: assembles deterministic evidence across build, typecheck,
 *   backend smoke, integration smoke, environment readiness, secrets,
 *   migrations, edge, monitoring, backup, rollback, incident, and support.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to release-candidate freeze records.
 * - Vol IV: supports release manager review, change freeze, deployment hold,
 *   incident bridge, support routing, rollback review, and communication hold.
 * - Vol V: enforces content claims, controlled disclosure, data rights,
 *   portability, explainability, replayability, and advisory-only boundaries.
 * - Vol VI: preserves portable vertical surface and source-intelligence public
 *   DTO limits while all live production exposure remains blocked.
 */

type ReleaseCandidateFreezeBody = {
  actorId?: string | null;
  releaseScope?: string | null;
  reviewNote?: string | null;
};

async function readBody(req: NextRequest): Promise<ReleaseCandidateFreezeBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ReleaseCandidateFreezeBody;
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
  return handleReleaseCandidateFreeze(req, "release-candidate-freeze.read");
}

export async function POST(req: NextRequest) {
  return handleReleaseCandidateFreeze(req, "release-candidate-freeze.hold");
}

async function handleReleaseCandidateFreeze(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const releaseScope =
    body.releaseScope ?? req.nextUrl.searchParams.get("releaseScope");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.release-candidate-freeze",
      traceId,
      schemaVersion: RELEASE_CANDIDATE_FREEZE_PLAN_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/release-candidate-freeze",
        releaseScope,
        method: req.method,
        releaseCandidateFreezeApproved: false,
        releaseCandidateFrozen: false,
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
            "Runtime governance guard blocked release-candidate freeze review.",
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
      module: "api.governance.release-candidate-freeze",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          RELEASE_CANDIDATE_FREEZE_PLAN_VERSION,
          "src/lib/governance/releaseCandidateFreezePlan.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Release Candidate Freeze Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          RELEASE_CANDIDATE_FREEZE_PLAN_VERSION,
          "src/lib/governance/releaseCandidateFreezePlan.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "release-candidate-freeze-api-v0.1.0",
          "api.governance.release-candidate-freeze",
          traceId
        ),
      ],
    });
    const result = evaluateReleaseCandidateFreezePlan({ releaseScope });
    const freezeHold =
      req.method === "POST"
        ? {
            freezeHoldId: `release-candidate-freeze-hold-${Date.now()}`,
            releaseScope: releaseScope ?? "platform",
            reviewStatus: "RELEASE_CANDIDATE_FREEZE_HOLD_RECORDED",
            reviewNote: body.reviewNote ?? null,
            releaseCandidateFreezeApproved: false,
            releaseCandidateFrozen: false,
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
        count: result.releaseCandidateFreezePlans.length,
        releaseCandidateFreezePlans: result.releaseCandidateFreezePlans,
        summary: result.summary,
        disclosures: result.disclosures,
        freezePosture: result.freezePosture,
        freezeHold,
        productionBlocked: true,
        releaseCandidateFreezeApproved: false,
        releaseCandidateFrozen: false,
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
        classificationSource: "release-candidate-freeze-route-output",
        classificationVersion: RELEASE_CANDIDATE_FREEZE_PLAN_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "release-candidate-freeze-review",
          "deployment-hold-evidence",
          "production-readiness-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-release-candidate-freeze-authority",
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
          "institutional-release-candidate-freeze-review",
        ],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "RELEASE_CANDIDATE_FREEZE_HOLD_RECORDED"
          : "RELEASE_CANDIDATE_FREEZE_REVIEWED",
      domain: "operations",
      severity: result.summary.deploymentExecuted === 0 ? "INFO" : "WARN",
      message:
        "Governed release-candidate freeze review returned blocked production posture without deployment exposure.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.release-candidate-freeze",
      metadata: {
        releaseScope,
        count: result.releaseCandidateFreezePlans.length,
        blockedFreezeItems: result.summary.blocked,
        reviewRequiredFreezeItems: result.summary.reviewRequired,
        releaseCandidateFreezeApproved:
          result.summary.releaseCandidateFreezeApproved,
        releaseCandidateFrozen: result.summary.releaseCandidateFrozen,
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
      releaseCandidateFreezePlans:
        classifiedOutput.releaseCandidateFreezePlans,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      freezePosture: classifiedOutput.freezePosture,
      freezeHold: classifiedOutput.freezeHold,
      productionBlocked: classifiedOutput.productionBlocked,
      releaseCandidateFreezeApproved:
        classifiedOutput.releaseCandidateFreezeApproved,
      releaseCandidateFrozen: classifiedOutput.releaseCandidateFrozen,
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
            : "Unknown release-candidate freeze error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
