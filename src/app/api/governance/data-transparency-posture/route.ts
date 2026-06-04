import { NextRequest, NextResponse } from "next/server";

import {
  DATA_TRANSPARENCY_DOCTRINE_VERSION,
  DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION,
  DataTransparencyPostureInput,
  composeDataTransparencyPosture,
} from "@/lib/transparency/dataTransparencyPostureRuntime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type Request = DataTransparencyPostureInput;

function createTraceId(): string {
  return `data-transparency-posture-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json().catch(() => ({}))) as Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;
    const runtimeGuard = runRuntimeGuard({
      operation: "governance.data.transparency.posture.audit",
      module: "api.governance.data-transparency-posture",
      traceId,
      schemaVersion: "data-transparency-posture-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/data-transparency-posture",
        applicationId: body.applicationId ?? null,
      },
    });
    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DATA_TRANSPARENCY_POSTURE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Data Transparency Posture runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.data-transparency-posture",
        metadata: {
          route: "/api/governance/data-transparency-posture",
          findings: runtimeGuard.findings,
        },
      });
      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/data-transparency-posture",
          runtimeBlocked: true,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Data Transparency Posture request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.data.transparency.posture.audit",
      module: "api.governance.data-transparency-posture",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "data-transparency-posture-request-v0.1.0",
          "src/app/api/governance/data-transparency-posture/route.ts",
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
          DATA_TRANSPARENCY_DOCTRINE_VERSION,
          "docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md",
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
          DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION,
          "src/lib/transparency/dataTransparencyPostureRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource:
        "api-governance-data-transparency-posture-route",
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
        "not-a-secret-distribution",
        "not-a-marketing-lead",
        "not-an-approval",
        "not-a-denial",
        "not-a-rejection",
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
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: [
        "governance-data-transparency-posture-review-consent",
      ],
    });

    const result = composeDataTransparencyPosture(body);

    const classifiedOutput = classifyRecord(
      {
        result,
        event: {
          eventType: "governance.data.transparency.posture.audited",
          applicationId: result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-data-transparency-posture-route-output",
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
          "not-a-secret-distribution",
          "not-a-marketing-lead",
          "not-an-approval",
          "not-a-denial",
          "not-a-rejection",
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
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: [
          "governance-data-transparency-posture-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "data_transparency_posture_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Data Transparency Posture v1 pack composed as advisory audit posture against the Furlong Data Transparency & User Sovereignty Doctrine v1.0, replay-safe, audit-safe, conflict-preserving internal evidence only. Your information belongs to you. Furlong will not sell, silently submit, or secretly distribute it. Every finding resolves to REQUIRES_HUMAN_REVIEW.",
      ruleVersion: DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + result.summary.v1OverallReadinessPercent / 200)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        doctrineVersion: result.doctrineVersion,
        modulesAudited: result.summary.modulesAudited,
        borrowerTouchingModulesAudited:
          result.summary.borrowerTouchingModulesAudited,
        eventContractsAudited: result.summary.eventContractsAudited,
        handoffsAudited: result.summary.handoffsAudited,
        escalationStagesAudited: result.summary.escalationStagesAudited,
        escalationStagesMissing: result.summary.escalationStagesMissing,
        modulesWithMissingTopics: result.summary.modulesWithMissingTopics,
        eventContractsWithSilentSubmissionRisk:
          result.summary.eventContractsWithSilentSubmissionRisk,
        handoffsWithSilentSubmissionRisk:
          result.summary.handoffsWithSilentSubmissionRisk,
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
      eventType: "DATA_TRANSPARENCY_POSTURE_AUDITED",
      domain: "operations",
      severity: result.summary.findingCount === 0 ? "INFO" : "WARN",
      message:
        "Data Transparency Posture v1 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.data-transparency-posture",
      metadata: {
        route: "/api/governance/data-transparency-posture",
        modulesAudited: result.summary.modulesAudited,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
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
          resourceType: "data_transparency_posture_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/data-transparency-posture",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "data_transparency_posture_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/data-transparency-posture",
            stage: "output",
            advisoryOnly: true,
            userSovereigntyPreserved: true,
            noSilentSubmission: true,
            noSecretDistribution: true,
            noInformationSale: true,
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
        targetType: "data_transparency_posture_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          modulesAudited: result.summary.modulesAudited,
          findingCount: result.summary.findingCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/data-transparency-posture",
          operation: "governance.data.transparency.posture.audit",
        },
      },
      metadata: {
        route: "/api/governance/data-transparency-posture",
        operation: "governance.data.transparency.posture.audit",
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
      eventType: "DATA_TRANSPARENCY_POSTURE_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Data Transparency Posture API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.data-transparency-posture",
      metadata: {
        route: "/api/governance/data-transparency-posture",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Data Transparency Posture runtime error.",
      },
    });
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/data-transparency-posture",
        runtimeError: true,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Data Transparency Posture runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
