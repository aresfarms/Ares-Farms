import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { NextRequest, NextResponse } from "next/server";

import {
  BUILD_PRESERVATION_CHECKPOINT_COMMIT,
  BUILD_PRESERVATION_CURRENT_STATIC_PAGES_GENERATED,
  BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE_VERSION,
  BuildTreeStatus,
  IgnoredSensitiveFileEvidence,
  evaluateBuildPreservationEvidenceArchiveGate,
} from "@/lib/governance/buildPreservationEvidenceArchiveGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Build Preservation and Evidence Archive Gate API
 *
 * Master Volume Governance:
 * - Vol 0: exposes a build checkpoint archive without converting it into
 *   production launch authority.
 * - Vol I: preserves constitutional control over what becomes canonical.
 * - Vol II: keeps regulatory, public, payment, notice, report, and legal
 *   authority blocked during archive review.
 * - Vol III: detects tree drift and attaches route, module, event, handoff,
 *   build, and ignored-sensitive-file evidence.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata.
 * - Vol IV: supports operator-readable archive, recovery, audit, and
 *   checkpoint handoff.
 * - Vol V: preserves claims, redaction, controlled disclosure, replayability,
 *   and evidence lineage.
 * - Vol VI: freezes source intelligence, scraper, revenue, runtime,
 *   integration, conformance, and build-reference evidence as review-bound.
 */

type BuildPreservationBody = {
  actorId?: string | null;
  reviewNote?: string | null;
};

function createTraceId(operation: string): string {
  return `${operation}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

async function readBody(req: NextRequest): Promise<BuildPreservationBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as BuildPreservationBody;
  } catch {
    return {};
  }
}

function gitOutput(args: string[]): string | null {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function currentCommitHash(): string | null {
  return gitOutput(["rev-parse", "--short", "HEAD"]);
}

function treeStatus(): BuildTreeStatus {
  const status = gitOutput(["status", "--short"]);

  if (status === null) {
    return "UNKNOWN";
  }

  return status.length === 0 ? "CLEAN" : "DIRTY";
}

function ignoredFileEvidence(path: string): IgnoredSensitiveFileEvidence {
  const output = gitOutput(["check-ignore", "-v", path]);

  if (!output) {
    return {
      path,
      ignored: false,
      ignoreRule: null,
    };
  }

  return {
    path,
    ignored: true,
    ignoreRule: output,
  };
}

function countFiles(root: string, fileName: string): number {
  let count = 0;

  try {
    for (const entry of readdirSync(root)) {
      const fullPath = join(root, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        count += countFiles(fullPath, fileName);
      } else if (entry === fileName) {
        count += 1;
      }
    }
  } catch {
    return count;
  }

  return count;
}

function countApiRoutes(root: string): number {
  return countFiles(root, "route.ts");
}

export async function GET(req: NextRequest) {
  return handleBuildPreservation(req, "build-preservation.read");
}

export async function POST(req: NextRequest) {
  return handleBuildPreservation(req, "build-preservation.record");
}

async function handleBuildPreservation(req: NextRequest, operation: string) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");
  const currentHash = currentCommitHash();
  const gitTreeStatus = treeStatus();
  const ignoredSensitiveFiles = [
    ignoredFileEvidence(".env"),
    ignoredFileEvidence("Recovery Key.pdf"),
  ];
  const appRoot = join(process.cwd(), "src", "app");
  const appPageRouteCount = countFiles(appRoot, "page.tsx");
  const apiRouteCount = countApiRoutes(join(appRoot, "api"));

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.build-preservation",
      traceId,
      schemaVersion: BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/build-preservation",
        method: req.method,
        checkpointCommitHash: BUILD_PRESERVATION_CHECKPOINT_COMMIT,
        currentCommitHash: currentHash,
        treeStatus: gitTreeStatus,
        productionLaunchAuthorized: false,
        deploymentExecuted: false,
        publicProductionApiExposureAllowed: false,
        productionPortalLaunchExecuted: false,
        paymentCaptureAllowed: false,
        borrowerNoticeSendAllowed: false,
        officialReportPublicationAllowed: false,
        publicVerificationApprovalGranted: false,
        officialRelianceAllowed: false,
        legalAdviceProvided: false,
        liveExternalActionPerformed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked build preservation archive review.",
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
      module: "api.governance.build-preservation",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE_VERSION,
          "src/lib/governance/buildPreservationEvidenceArchiveGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Build Preservation Governance",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE_VERSION,
          "src/lib/governance/buildPreservationEvidenceArchiveGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "build-preservation-api-v0.1.0",
          "api.governance.build-preservation",
          traceId
        ),
      ],
    });
    const result = evaluateBuildPreservationEvidenceArchiveGate({
      currentCommitHash: currentHash,
      treeStatus: gitTreeStatus,
      ignoredSensitiveFiles,
      appPageRouteCount,
      apiRouteCount,
      staticPagesGenerated: BUILD_PRESERVATION_CURRENT_STATIC_PAGES_GENERATED,
    });
    const archiveRecord =
      req.method === "POST"
        ? {
            archiveRecordId: `build-preservation-${Date.now()}`,
            checkpointId: result.checkpointId,
            checkpointTitle: result.checkpointTitle,
            checkpointCommitHash: BUILD_PRESERVATION_CHECKPOINT_COMMIT,
            currentCommitHash: currentHash,
            treeStatus: gitTreeStatus,
            reviewStatus: "BUILD_PRESERVATION_ARCHIVE_RECORDED",
            reviewNote: body.reviewNote ?? null,
            productionBlocked: true,
            productionLaunchAuthorized: false,
            deploymentExecuted: false,
            publicProductionApiExposureAllowed: false,
            productionPortalLaunchExecuted: false,
            paymentCaptureAllowed: false,
            borrowerNoticeSendAllowed: false,
            officialReportPublicationAllowed: false,
            publicVerificationApprovalGranted: false,
            officialRelianceAllowed: false,
            legalAdviceProvided: false,
            liveExternalActionPerformed: false,
            replayRef: traceId,
          }
        : null;
    const classifiedOutput = classifyRecord(
      {
        count: result.buildPreservationReviews.length,
        buildPreservationReviews: result.buildPreservationReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        archivePosture: result.archivePosture,
        archiveRecord,
        productionBlocked: true,
        checkpointRecorded: true,
        buildArchiveGenerated: true,
        treeDriftDetected: result.summary.treeDriftDetected > 0,
        ignoredSensitiveFilesVerified:
          result.summary.ignoredSensitiveFilesVerified > 0,
        productionLaunchAuthorized: false,
        deploymentExecuted: false,
        publicProductionApiExposureAllowed: false,
        productionPortalLaunchExecuted: false,
        paymentCaptureAllowed: false,
        borrowerNoticeSendAllowed: false,
        officialReportPublicationAllowed: false,
        publicVerificationApprovalGranted: false,
        officialRelianceAllowed: false,
        legalAdviceProvided: false,
        liveExternalActionPerformed: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "build-preservation-route-output",
        classificationVersion: BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "build-preservation-review",
          "checkpoint-evidence-review",
          "tree-drift-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "no-production-launch-authority",
          "no-deployment-authority",
          "no-public-production-api-exposure-authority",
          "no-payment-capture-authority",
          "no-notice-send-authority",
          "no-official-report-publication-authority",
          "no-public-verification-authority",
          "no-official-reliance-authority",
          "no-legal-advice-authority",
          "no-live-external-action-authority",
        ],
        redactionRequirements: [
          "redact credentials and source secrets",
          "redact local environment values",
          "redact private recovery documents",
          "redact infrastructure identifiers before external disclosure",
        ],
        consentRequirements: ["institutional-build-preservation-review"],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "BUILD_PRESERVATION_ARCHIVE_RECORDED"
          : "BUILD_PRESERVATION_REVIEWED",
      domain: "operations",
      severity: gitTreeStatus === "CLEAN" ? "INFO" : "WARN",
      message:
        "Governed build preservation review returned evidence-only archive posture.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.build-preservation",
      metadata: {
        checkpointId: result.checkpointId,
        checkpointCommitHash: BUILD_PRESERVATION_CHECKPOINT_COMMIT,
        currentCommitHash: currentHash,
        treeStatus: gitTreeStatus,
        treeDriftDetected: result.summary.treeDriftDetected,
        ignoredSensitiveFilesVerified:
          result.summary.ignoredSensitiveFilesVerified,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      buildPreservationReviews: classifiedOutput.buildPreservationReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      archivePosture: classifiedOutput.archivePosture,
      archiveRecord: classifiedOutput.archiveRecord,
      productionBlocked: classifiedOutput.productionBlocked,
      checkpointRecorded: classifiedOutput.checkpointRecorded,
      buildArchiveGenerated: classifiedOutput.buildArchiveGenerated,
      treeDriftDetected: classifiedOutput.treeDriftDetected,
      ignoredSensitiveFilesVerified:
        classifiedOutput.ignoredSensitiveFilesVerified,
      productionLaunchAuthorized: classifiedOutput.productionLaunchAuthorized,
      deploymentExecuted: classifiedOutput.deploymentExecuted,
      publicProductionApiExposureAllowed:
        classifiedOutput.publicProductionApiExposureAllowed,
      productionPortalLaunchExecuted:
        classifiedOutput.productionPortalLaunchExecuted,
      paymentCaptureAllowed: classifiedOutput.paymentCaptureAllowed,
      borrowerNoticeSendAllowed: classifiedOutput.borrowerNoticeSendAllowed,
      officialReportPublicationAllowed:
        classifiedOutput.officialReportPublicationAllowed,
      publicVerificationApprovalGranted:
        classifiedOutput.publicVerificationApprovalGranted,
      officialRelianceAllowed: classifiedOutput.officialRelianceAllowed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
      liveExternalActionPerformed:
        classifiedOutput.liveExternalActionPerformed,
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
            : "Unknown build preservation archive error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
