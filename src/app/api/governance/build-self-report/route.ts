import { NextRequest, NextResponse } from "next/server";

import {
  BUILD_SELF_REPORT_RUNTIME_VERSION,
  BUILD_SELF_REPORT_SPEC_VERSION,
  BuildSelfReportInput,
  composeBuildSelfReport,
} from "@/lib/build-self-report/buildSelfReportRuntime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type Request = BuildSelfReportInput;

function createTraceId(): string {
  return `build-self-report-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json().catch(() => ({}))) as Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;
    const runtimeGuard = runRuntimeGuard({
      operation: "governance.build.self.report.generate",
      module: "api.governance.build-self-report",
      traceId,
      schemaVersion: "build-self-report-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/build-self-report",
        applicationId: body.applicationId ?? null,
      },
    });
    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BUILD_SELF_REPORT_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Build Self-Report runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.build-self-report",
        metadata: {
          route: "/api/governance/build-self-report",
          findings: runtimeGuard.findings,
        },
      });
      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/build-self-report",
          runtimeBlocked: true,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked Build Self-Report request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.build.self.report.generate",
      module: "api.governance.build-self-report",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "build-self-report-request-v0.1.0",
          "src/app/api/governance/build-self-report/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          BUILD_SELF_REPORT_SPEC_VERSION,
          "Module 42 — Build Self-Report Specification",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          BUILD_SELF_REPORT_RUNTIME_VERSION,
          "src/lib/build-self-report/buildSelfReportRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-build-self-report-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "governance",
        "auditor",
        "regulator",
      ],
      sharingPermissions: [
        "regulated-operational-review",
        "governance-evidence-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-an-information-sale",
        "not-a-silent-submission",
        "not-an-approval",
        "not-a-denial",
        "not-a-lender-commitment",
        "not-an-agency-decision",
        "not-an-official-certification",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-legal-reliance",
        "not-a-source-certainty-claim",
        "not-a-live-external-action",
        "not-a-notice-send",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-internal-review-notes-before-public-disclosure",
      ],
      consentRequirements: [
        "governance-build-self-report-review-consent",
      ],
    });

    const result = composeBuildSelfReport(body);

    const classifiedOutput = classifyRecord(
      {
        result,
        event: {
          eventType: "governance.build.self.report.generated",
          applicationId: result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-build-self-report-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "governance",
          "auditor",
          "regulator",
        ],
        sharingPermissions: [
          "regulated-operational-review",
          "governance-evidence-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-an-information-sale",
          "not-a-silent-submission",
          "not-an-approval",
          "not-a-denial",
          "not-a-lender-commitment",
          "not-an-agency-decision",
          "not-an-official-certification",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-legal-reliance",
          "not-a-source-certainty-claim",
          "not-a-live-external-action",
          "not-a-notice-send",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: [
          "governance-build-self-report-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "build_self_report_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Build Self-Report v1 pack composed as advisory deterministic per-module audit against the Module 42 Build Self-Report Specification. Every cell is one of PASS/FAIL/WARN/N/A/BLOCKED_BY_DESIGN. Every finding resolves to REQUIRES_HUMAN_REVIEW. Internal advisory only — no information sale, no silent submission, no autonomous determination of any kind.",
      ruleVersion: BUILD_SELF_REPORT_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + result.summary.v1OverallReadinessPercent / 200)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        specVersion: result.specVersion,
        checkpoint: result.header.checkpoint,
        commit: result.header.commit,
        modulesAudited: result.summary.modulesAudited,
        modulesPass: result.summary.modulesPass,
        modulesPassWithWarnings: result.summary.modulesPassWithWarnings,
        modulesFail: result.summary.modulesFail,
        modulesBlockedByDesign: result.summary.modulesBlockedByDesign,
        exitCode: result.header.exit_code,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        replaySafe: result.replaySafe,
        auditSafe: result.auditSafe,
        conflictPreserving: result.conflictPreserving,
        federationScoped: result.federationScoped,
        productionBlocked: result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "BUILD_SELF_REPORT_GENERATED",
      domain: "operations",
      severity: result.header.exit_code === 0 ? "INFO" : "WARN",
      message: "Build Self-Report v1 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.build-self-report",
      metadata: {
        route: "/api/governance/build-self-report",
        modulesAudited: result.summary.modulesAudited,
        modulesFail: result.summary.modulesFail,
        exitCode: result.header.exit_code,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedOutput.classification.classificationLevel,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "build_self_report_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/build-self-report",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "build_self_report_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/build-self-report",
            stage: "output",
            advisoryOnly: true,
            replaySafe: true,
            auditSafe: true,
            conflictPreserving: true,
            federationScoped: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "build_self_report_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: BUILD_SELF_REPORT_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          modulesAudited: result.summary.modulesAudited,
          modulesFail: result.summary.modulesFail,
          exitCode: result.header.exit_code,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/build-self-report",
          operation: "governance.build.self.report.generate",
        },
      },
      metadata: {
        route: "/api/governance/build-self-report",
        operation: "governance.build.self.report.generate",
      },
    });

    return NextResponse.json({
      ok: true,
      result,
      event: classifiedOutput.event,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "BUILD_SELF_REPORT_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Build Self-Report API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.build-self-report",
      metadata: {
        route: "/api/governance/build-self-report",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Build Self-Report runtime error.",
      },
    });
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/build-self-report",
        runtimeError: true,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Build Self-Report runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
