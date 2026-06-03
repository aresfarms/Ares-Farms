import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  READINESS_ASSESSMENT_RUNTIME_VERSION,
  ReadinessAssessmentInput,
  assessBorrowerReadiness,
} from "@/lib/readiness/readinessAssessment";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Borrower Readiness Assessment API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over borrower readiness state.
 * - Vol II: prevents readiness from becoming approval, eligibility,
 *   certification, public verification, or regulatory reliance.
 * - Vol III: provides deterministic, replay-safe readiness aggregation.
 * - Vol III-B: attaches runtime guard, classification, version, observability,
 *   explainability, replay, and human-review evidence.
 * - Vol IV: routes missing-item handoffs to operator/borrower review surfaces.
 * - Vol V-VII: enforces claims governance, source authority, conformance, and
 *   public-surface disclosure boundaries on borrower-readable readiness output.
 */

type ReadinessAssessmentRequest = ReadinessAssessmentInput & {
  userId?: string | null;
};

function createReadinessTraceId(): string {
  return `readiness-assessment-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createReadinessTraceId();

  try {
    const body = (await req.json()) as ReadinessAssessmentRequest;
    const actorId = body.userId ?? body.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower.readiness.assess",
      module: "api.readiness",
      traceId,
      schemaVersion: "readiness-assessment-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/readiness",
        borrowerGuidanceSurface: true,
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "READINESS_ASSESSMENT_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Readiness assessment runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.readiness",
        metadata: {
          route: "/api/readiness",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/readiness",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked readiness assessment request.",
          governance: {
            traceId,
            runtimeGuard,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "borrower.readiness.assess",
      module: "api.readiness",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "readiness-assessment-request-v0.1.0",
          "src/app/api/readiness/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
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
          READINESS_ASSESSMENT_RUNTIME_VERSION,
          "src/lib/readiness/readinessAssessment.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-readiness-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["borrower", "authorized-operator", "governance"],
      sharingPermissions: [
        "borrower-guidance",
        "regulated-operational-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-a-credit-decision",
        "not-a-certification",
        "not-a-public-verification",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-data-before-external-disclosure",
      ],
      consentRequirements: ["borrower-guidance-consent"],
    });

    const assessment = assessBorrowerReadiness(body);

    const classifiedOutput = classifyRecord(
      {
        assessment,
        event: {
          eventType: "borrower.readiness.assessed",
          applicationId: body.applicationId ?? null,
          borrowerId: body.borrowerId ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-readiness-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["borrower", "authorized-operator", "governance"],
        sharingPermissions: [
          "borrower-guidance",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-credit-decision",
          "not-an-approval",
          "not-an-eligibility-determination",
          "not-a-certification",
          "not-a-public-verification",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["borrower-guidance-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "borrower_readiness_assessment",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Borrower readiness assessment generated as operational guidance only with no certification, approval, or public verification.",
      ruleVersion: READINESS_ASSESSMENT_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.95,
        Math.max(0.4, assessment.overallReadinessPercent / 100)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        overallReadinessPercent: assessment.overallReadinessPercent,
        sectionCount: assessment.sections.length,
        advisoryOnly: assessment.advisoryOnly,
        productionBlocked: assessment.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "READINESS_ASSESSMENT_EVALUATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Borrower readiness assessment evaluated through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.readiness",
      metadata: {
        route: "/api/readiness",
        applicationId: body.applicationId ?? null,
        overallReadinessPercent: assessment.overallReadinessPercent,
        sectionCount: assessment.sections.length,
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
          resourceType: "readiness_assessment_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/readiness",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "readiness_assessment_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/readiness",
            stage: "output",
            advisoryOnly: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "borrower_readiness_assessment",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: READINESS_ASSESSMENT_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          overallReadinessPercent: assessment.overallReadinessPercent,
          sectionCount: assessment.sections.length,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/readiness",
          operation: "borrower.readiness.assess",
        },
      },
      metadata: {
        route: "/api/readiness",
        operation: "borrower.readiness.assess",
      },
    });

    return NextResponse.json({
      ok: true,
      assessment,
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
      eventType: "READINESS_ASSESSMENT_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Readiness assessment API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.readiness",
      metadata: {
        route: "/api/readiness",
        error:
          error instanceof Error
            ? error.message
            : "Unknown readiness assessment runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/readiness",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown readiness assessment runtime error.",
        governance: {
          traceId,
          observability,
          evidence,
        },
      },
      { status: 500 }
    );
  }
}
