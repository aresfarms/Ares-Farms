import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
  ReadinessAssessmentV2Input,
  composeReadinessAssessmentV2,
} from "@/lib/readiness/readinessAssessmentV2Runtime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type ReadinessAssessmentV2Request = ReadinessAssessmentV2Input;

function createReadinessAssessmentV2TraceId(): string {
  return `readiness-assessment-v2-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createReadinessAssessmentV2TraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as ReadinessAssessmentV2Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.readiness.assessment.v2.compose",
      module: "api.governance.readiness-assessment-v2",
      traceId,
      schemaVersion: "readiness-assessment-v2-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/readiness-assessment-v2",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "READINESS_ASSESSMENT_V2_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Readiness Assessment v2 runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.readiness-assessment-v2",
        metadata: {
          route: "/api/governance/readiness-assessment-v2",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/readiness-assessment-v2",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Readiness Assessment v2 request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.readiness.assessment.v2.compose",
      module: "api.governance.readiness-assessment-v2",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "readiness-assessment-v2-request-v0.1.0",
          "src/app/api/governance/readiness-assessment-v2/route.ts",
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
          READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
          "src/lib/readiness/readinessAssessmentV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "borrower-onboarding-core-v2-runtime-v0.1.0",
          "src/lib/borrower/onboardingCoreV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "opportunity-discovery-v2-runtime-v0.1.0",
          "src/lib/opportunity/discoveryV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "financing-pathway-engine-v2-runtime-v0.1.0",
          "src/lib/financing/pathwayEngineV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "revenue-intelligence-v2-runtime-v0.1.0",
          "src/lib/revenue-intelligence/revenueIntelligenceV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "customer-type-runtime-v0.1.0",
          "src/lib/customer-types/customerTypeRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "capital-graph-runtime-v0.1.0",
          "src/lib/capital-graph/capitalGraphRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "readiness-assessment-runtime-v0.1.0",
          "src/lib/readiness/readinessAssessment.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-readiness-assessment-v2-route",
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
        "not-an-approval",
        "not-a-readiness-determination",
        "not-an-onboarding-determination",
        "not-an-eligibility-determination",
        "not-a-pathway-determination",
        "not-an-opportunity-determination",
        "not-a-credit-decision",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-source-certainty-claim",
        "not-a-live-external-action",
        "not-a-notice-send",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-content-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: [
        "governance-readiness-assessment-v2-review-consent",
      ],
    });

    const v2Result = composeReadinessAssessmentV2(body);

    const classifiedOutput = classifyRecord(
      {
        v2Result,
        event: {
          eventType: "governance.readiness.assessment.v2.composed",
          applicationId: v2Result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-readiness-assessment-v2-route-output",
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
          "not-an-approval",
          "not-a-readiness-determination",
          "not-an-onboarding-determination",
          "not-an-eligibility-determination",
          "not-a-pathway-determination",
          "not-an-opportunity-determination",
          "not-a-credit-decision",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-lender-commitment",
          "not-a-program-approval",
          "not-a-tax-credit-allocation",
          "not-an-environmental-clearance",
          "not-a-carbon-credit-issuance",
          "not-a-source-certainty-claim",
          "not-a-live-external-action",
          "not-a-notice-send",
          "not-a-legal-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: [
          "governance-readiness-assessment-v2-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "readiness_assessment_v2_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Readiness Assessment v2 pack composed as advisory borrower guidance, replay-safe, audit-safe, conflict-preserving internal evidence only. No approval, autonomous readiness / onboarding / eligibility / pathway / opportunity / intelligence / evidence / certification determination, credit decision, lender commitment, public verification, regulatory reliance, source certainty claim, notice send, or legal reliance is created.",
      ruleVersion: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + v2Result.summary.v2OverallReadinessPercent / 200)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        v2SignalCount: v2Result.summary.v2SignalCount,
        v2ReadyCount: v2Result.summary.v2ReadyCount,
        v2BlockedCount: v2Result.summary.v2BlockedCount,
        v2OverallReadinessPercent:
          v2Result.summary.v2OverallReadinessPercent,
        v1OverallReadinessPercent:
          v2Result.summary.v1OverallReadinessPercent,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        matchedCustomerProfileCount:
          v2Result.summary.matchedCustomerProfileCount,
        totalGrantCardCount: v2Result.summary.totalGrantCardCount,
        replaySafe: v2Result.replaySafe,
        auditSafe: v2Result.auditSafe,
        conflictPreserving: v2Result.conflictPreserving,
        federationScoped: v2Result.federationScoped,
        productionBlocked: v2Result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "READINESS_ASSESSMENT_V2_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Readiness Assessment v2 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.readiness-assessment-v2",
      metadata: {
        route: "/api/governance/readiness-assessment-v2",
        v2SignalCount: v2Result.summary.v2SignalCount,
        v2ReadyCount: v2Result.summary.v2ReadyCount,
        v2BlockedCount: v2Result.summary.v2BlockedCount,
        v2OverallReadinessPercent:
          v2Result.summary.v2OverallReadinessPercent,
        v1OverallReadinessPercent:
          v2Result.summary.v1OverallReadinessPercent,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        declaredCustomerTypeCount:
          v2Result.summary.declaredCustomerTypeCount,
        matchedCustomerProfileCount:
          v2Result.summary.matchedCustomerProfileCount,
        totalGrantCardCount: v2Result.summary.totalGrantCardCount,
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
          resourceType: "readiness_assessment_v2_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/readiness-assessment-v2",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "readiness_assessment_v2_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/readiness-assessment-v2",
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
        targetType: "readiness_assessment_v2_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          v2SignalCount: v2Result.summary.v2SignalCount,
          v2ReadyCount: v2Result.summary.v2ReadyCount,
          v1OverallReadinessPercent:
            v2Result.summary.v1OverallReadinessPercent,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/readiness-assessment-v2",
          operation: "governance.readiness.assessment.v2.compose",
        },
      },
      metadata: {
        route: "/api/governance/readiness-assessment-v2",
        operation: "governance.readiness.assessment.v2.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      v2Result,
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
      eventType: "READINESS_ASSESSMENT_V2_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Readiness Assessment v2 API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.readiness-assessment-v2",
      metadata: {
        route: "/api/governance/readiness-assessment-v2",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Readiness Assessment v2 runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/readiness-assessment-v2",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Readiness Assessment v2 runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
