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

/**
 * Recommendation API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces governed borrower support, auditability, and rule-supremacy discipline.
 *
 * - Vol II: Regulatory Governance
 *   Supports compliant recommendation handling and regulated borrower assistance.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe recommendation execution with durable version,
 *   classification, observability, and replay-verification evidence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operator review, borrower guidance, escalation, and remediation workflows.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, observability, replayability,
 *   version lineage, selective disclosure, and evidence preservation.
 */

type RecommendRequestBody = {
  userId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  propertyId?: string | null;
  requestedPrograms?: string[];
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

function createRecommendTraceId(): string {
  return `recommend-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function buildRecommendations(body: RecommendRequestBody) {
  const requestedPrograms = Array.isArray(body.requestedPrograms)
    ? body.requestedPrograms
    : [];

  return {
    programs:
      requestedPrograms.length > 0
        ? requestedPrograms.map((program) => ({
            program,
            status: "REVIEW_REQUIRED",
            reason:
              "Recommendation requires governed program eligibility review before borrower-facing reliance.",
          }))
        : [
            {
              program: "USDA_OR_SBA_PATHWAY_REVIEW",
              status: "REVIEW_REQUIRED",
              reason:
                "No specific program requested; governed pathway review is required.",
            },
          ],
    notes: [
      "Recommendation output is advisory and requires governed review before being treated as a financing determination.",
      "Final eligibility must be resolved through versioned program rules, overlays, and audit-preserved decision lineage.",
    ],
  };
}

export async function POST(req: NextRequest) {
  const traceId = createRecommendTraceId();

  try {
    const body = (await req.json()) as RecommendRequestBody;

    const runtimeGuard = runRuntimeGuard({
      operation: "recommendation.generate",
      module: "api.recommend",
      traceId,
      schemaVersion: "recommendation-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: body.userId ?? body.borrowerId ?? null,
      metadata: {
        route: "/api/recommend",
        borrowerGuidanceSurface: true,
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "RECOMMENDATION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Recommendation runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId: body.userId ?? body.borrowerId ?? null,
        module: "api.recommend",
        metadata: {
          route: "/api/recommend",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/recommend",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked recommendation request.",
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
      operation: "recommendation.generate",
      module: "api.recommend",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "recommendation-request-v0.1.0",
          "src/app/api/recommend/route.ts",
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
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "recommendation-rules-v0.1.0",
          "api.recommend.placeholder-rules",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        request: body,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-recommend-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["borrower", "authorized-operator", "governance"],
        sharingPermissions: [
          "borrower-guidance",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "explain", "classify"],
        exportRestrictions: [
          "requires-governed-access",
          "requires-borrower-context",
        ],
        redactionRequirements: [
          "redact-unrelated-sensitive-data-before-external-disclosure",
        ],
        consentRequirements: ["borrower-guidance-consent"],
      }
    );

    const recommendations = buildRecommendations(body);

    const classifiedOutput = classifyRecord(
      {
        recommendations,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-recommend-route-output",
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
          "requires-program-rule-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["borrower-guidance-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "borrower_recommendation",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Recommendation generated as advisory borrower guidance through governed runtime controls.",
      ruleVersion: "recommendation-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 0.7,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        advisoryOnly: true,
        requestedProgramCount: Array.isArray(body.requestedPrograms)
          ? body.requestedPrograms.length
          : 0,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "RECOMMENDATION_GENERATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Recommendation generated through governed runtime controls as advisory guidance.",
      traceId,
      replayRef: traceId,
      actorId: body.userId ?? body.borrowerId ?? null,
      module: "api.recommend",
      metadata: {
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedOutput.classification.classificationLevel,
        advisoryOnly: true,
        durableGovernanceEvidence: true,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "recommendation_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/recommend",
            stage: "input",
          },
        },
        {
          resourceType: "recommendation_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/recommend",
            stage: "output",
            advisoryOnly: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "api_route",
        targetId: "api.recommend",
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "recommendation-request-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          advisoryOnly: true,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/recommend",
          operation: "recommendation.generate",
        },
      },
      metadata: {
        route: "/api/recommend",
        operation: "recommendation.generate",
      },
    });

    return NextResponse.json({
      ok: true,
      advisoryOnly: true,
      input: classifiedInput,
      output: classifiedOutput,
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
      eventType: "RECOMMENDATION_RUNTIME_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Recommendation API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.recommend",
      metadata: {
        route: "/api/recommend",
        error:
          error instanceof Error
            ? error.message
            : "Unknown recommendation runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/recommend",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown recommendation runtime error.",
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
