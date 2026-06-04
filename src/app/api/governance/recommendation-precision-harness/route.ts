import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import {
  RECOMMENDATION_PRECISION_RUNTIME_VERSION,
  RecommendationPrecisionHarnessInput,
  composeRecommendationPrecisionHarness,
} from "@/lib/testing/recommendationPrecisionRuntime";

type RecommendationPrecisionHarnessRequest =
  RecommendationPrecisionHarnessInput;

function createRecommendationPrecisionTraceId(): string {
  return `recommendation-precision-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createRecommendationPrecisionTraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as RecommendationPrecisionHarnessRequest;
    const actorId = body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.recommendation.precision.compose",
      module: "api.governance.recommendation-precision-harness",
      traceId,
      schemaVersion: "recommendation-precision-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/recommendation-precision-harness",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "RECOMMENDATION_PRECISION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Recommendation Precision harness runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.recommendation-precision-harness",
        metadata: {
          route: "/api/governance/recommendation-precision-harness",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/recommendation-precision-harness",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Recommendation Precision harness request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.recommendation.precision.compose",
      module: "api.governance.recommendation-precision-harness",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "recommendation-precision-request-v0.1.0",
          "src/app/api/governance/recommendation-precision-harness/route.ts",
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
          RECOMMENDATION_PRECISION_RUNTIME_VERSION,
          "src/lib/testing/recommendationPrecisionRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "recommendation-precision-scenarios-v0.1.0",
          "src/lib/testing/recommendationPrecisionScenarios.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "readiness-assessment-v2-runtime-v0.1.0",
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
      ],
    });

    const classifiedInput = classifyRecord(
      body as Record<string, unknown>,
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-recommendation-precision-route",
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
          "not-an-eligibility-determination",
          "not-a-pathway-determination",
          "not-an-opportunity-determination",
          "not-a-readiness-determination",
          "not-an-environmental-intake-determination",
          "not-a-credit-decision",
          "not-a-lender-commitment",
          "not-an-agency-decision",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-legal-reliance",
          "not-a-source-certainty-claim",
          "not-a-live-external-action",
          "not-a-notice-send",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-scenario-fixtures-before-public-disclosure",
        ],
        consentRequirements: [
          "governance-recommendation-precision-review-consent",
        ],
      }
    );

    const result = composeRecommendationPrecisionHarness(body);

    const classifiedOutput = classifyRecord(
      {
        result,
        event: {
          eventType: "governance.recommendation.precision.tested",
          applicationId: result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-recommendation-precision-route-output",
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
          "not-an-eligibility-determination",
          "not-a-pathway-determination",
          "not-an-opportunity-determination",
          "not-a-readiness-determination",
          "not-an-environmental-intake-determination",
          "not-a-credit-decision",
          "not-a-lender-commitment",
          "not-an-agency-decision",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-legal-reliance",
          "not-a-source-certainty-claim",
          "not-a-live-external-action",
          "not-a-notice-send",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-scenario-fixtures-before-public-disclosure",
        ],
        consentRequirements: [
          "governance-recommendation-precision-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "recommendation_precision_harness_result",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Recommendation Precision Test Harness composed canonical persona fixtures through the full v2 stack as an internal advisory trust-preservation test. No customer-facing approval, eligibility, lender commitment, agency decision, public verification, regulatory reliance, source certainty claim, or legal reliance is created. Banned-language tokens, excluded category leakage, missing explanations, lost cross-source conflicts, and matched-profile boundary violations trigger hard CI gates.",
      ruleVersion: RECOMMENDATION_PRECISION_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.9,
        Math.max(0.5, 0.5 + result.summary.meanTrustScore * 0.4)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        scenarioCount: result.summary.scenarioCount,
        passedScenarioCount: result.summary.passedScenarioCount,
        failedScenarioCount: result.summary.failedScenarioCount,
        meanPrecisionScore: result.summary.meanPrecisionScore,
        meanExclusionScore: result.summary.meanExclusionScore,
        meanExplanationScore: result.summary.meanExplanationScore,
        meanTrustScore: result.summary.meanTrustScore,
        trustThreshold: result.trustThreshold,
        ciGatePassed: result.ciGatePassed,
        bannedLanguageScenarioCount:
          result.summary.bannedLanguageScenarioCount,
        excludedCategoryScenarioCount:
          result.summary.excludedCategoryScenarioCount,
        missingExplanationScenarioCount:
          result.summary.missingExplanationScenarioCount,
        precisionBelowThresholdScenarioCount:
          result.summary.precisionBelowThresholdScenarioCount,
        conflictPropagationLostScenarioCount:
          result.summary.conflictPropagationLostScenarioCount,
        matchedProfileBoundaryViolationScenarioCount:
          result.summary.matchedProfileBoundaryViolationScenarioCount,
        replaySafe: result.replaySafe,
        auditSafe: result.auditSafe,
        conflictPreserving: result.conflictPreserving,
        federationScoped: result.federationScoped,
        productionBlocked: result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "RECOMMENDATION_PRECISION_COMPOSED",
      domain: "operations",
      severity: result.ciGatePassed ? "INFO" : "WARN",
      message:
        "Recommendation Precision Test Harness composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.recommendation-precision-harness",
      metadata: {
        route: "/api/governance/recommendation-precision-harness",
        scenarioCount: result.summary.scenarioCount,
        passedScenarioCount: result.summary.passedScenarioCount,
        failedScenarioCount: result.summary.failedScenarioCount,
        meanTrustScore: result.summary.meanTrustScore,
        ciGatePassed: result.ciGatePassed,
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
          resourceType: "recommendation_precision_harness_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/recommendation-precision-harness",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "recommendation_precision_harness_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/recommendation-precision-harness",
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
        targetType: "recommendation_precision_harness_result",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: RECOMMENDATION_PRECISION_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          scenarioCount: result.summary.scenarioCount,
          passedScenarioCount: result.summary.passedScenarioCount,
          meanTrustScore: result.summary.meanTrustScore,
          ciGatePassed: result.ciGatePassed,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/recommendation-precision-harness",
          operation: "governance.recommendation.precision.compose",
        },
      },
      metadata: {
        route: "/api/governance/recommendation-precision-harness",
        operation: "governance.recommendation.precision.compose",
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
      eventType: "RECOMMENDATION_PRECISION_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Recommendation Precision harness API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.recommendation-precision-harness",
      metadata: {
        route: "/api/governance/recommendation-precision-harness",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Recommendation Precision runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/recommendation-precision-harness",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Recommendation Precision runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
