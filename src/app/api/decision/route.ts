import { NextResponse } from "next/server";

import { DecisionInputSchema } from "@/lib/api/decision/input.schema";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { runPipeline } from "@/lib/pipeline/orchestrator";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Decision API Route
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces constitutional rule supremacy and governed decision authority.
 *
 * - Vol II: Regulatory Governance
 *   Preserves borrower decision context for regulated review, adverse-action
 *   discipline, and examination-safe explanation lineage.
 *
 * - Vol III: Technical Infrastructure
 *   Provides deterministic, replay-safe decision execution with durable
 *   version, classification, observability, and replay evidence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operator review, escalation, incident reconstruction, and
 *   evidence-preserving recovery workflows.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces canonical classification, explainability, observability,
 *   replayability, version lineage, and governance evidence preservation.
 */

function createDecisionTraceId(): string {
  return `decision-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: Request) {
  const traceId = createDecisionTraceId();

  try {
    const body = await req.json();
    const parsed = DecisionInputSchema.safeParse(body);

    if (!parsed.success) {
      const observability = createObservabilityEvent({
        eventType: "DECISION_INPUT_REJECTED",
        domain: "operations",
        severity: "WARN",
        message: "Decision API rejected invalid input before pipeline execution.",
        traceId,
        replayRef: traceId,
        actorId:
          body && typeof body === "object" && "userId" in body
            ? String(body.userId ?? "")
            : null,
        module: "api.decision",
        metadata: {
          route: "/api/decision",
          issues: parsed.error.flatten(),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/decision",
          rejectedBeforeRuntime: true,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid decision input.",
          issues: parsed.error.flatten(),
          governance: {
            traceId,
            observability,
            evidence,
          },
        },
        { status: 400 }
      );
    }

    const runtimeGuard = runRuntimeGuard({
      operation: "decision.evaluate",
      module: "api.decision",
      traceId,
      schemaVersion: "decision-input-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      actorId: parsed.data.userId,
      metadata: {
        route: "/api/decision",
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DECISION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Decision API runtime guard blocked execution.",
        traceId,
        replayRef: traceId,
        actorId: parsed.data.userId,
        module: "api.decision",
        metadata: {
          route: "/api/decision",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/decision",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Runtime governance guard blocked this operation.",
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
      operation: "decision.evaluate",
      module: "api.decision",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "decision-input-v0.1.0",
          "src/lib/api/decision/input.schema.ts",
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
          "api",
          "decision-pipeline-api-v0.1.0",
          "src/app/api/decision/route.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        input: parsed.data,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-decision-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-underwriter",
          "authorized-operator",
          "governance",
        ],
        sharingPermissions: [
          "decision-pipeline-review",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["score", "summarize", "explain"],
        exportRestrictions: [
          "not-a-final-credit-decision",
          "requires-human-review-before-adverse-action-reliance",
        ],
        redactionRequirements: [
          "redact-sensitive-borrower-data-before-external-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const result = await runPipeline(parsed.data);

    const classifiedOutput = classifyRecord(
      {
        decision: result.decision,
        ranking: result.ranking,
        score: result.score,
        risk: result.risk,
        compliance: result.compliance,
        explanation: result.explanation,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-decision-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-underwriter",
          "authorized-operator",
          "governance",
        ],
        sharingPermissions: [
          "decision-pipeline-review",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "advisory-review-required",
          "not-a-final-credit-decision",
          "requires-human-review-before-regulatory-reliance",
        ],
        redactionRequirements: [
          "redact-internal-review-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "decision_pipeline_result",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Decision pipeline result generated through governed runtime enforcement and preserved with durable governance evidence.",
      ruleVersion: "decision-runtime-rules-v0.1.0",
      overlayRefs: [],
      confidenceScore: 0.7,
      humanReviewRequired: true,
      replayRefs: [traceId, result.traceId],
      auditEventRefs: [],
      metadata: {
        pipelineTraceId: result.traceId,
        pipelineVersion: result.pipelineVersion,
        advisoryOnly: true,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "DECISION_RUNTIME_EXECUTED",
      domain: "runtime",
      severity: "INFO",
      message: "Decision API executed through canonical runtime governance.",
      traceId,
      replayRef: traceId,
      actorId: parsed.data.userId,
      module: "api.decision",
      metadata: {
        pipelineTraceId: result.traceId,
        runtimeAllowed: runtimeGuard.allowed,
        versionRuntimeOk: versionRuntime.ok,
        durableGovernanceEvidence: true,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "decision_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/decision",
            stage: "input",
          },
        },
        {
          resourceType: "decision_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/decision",
            stage: "output",
            pipelineTraceId: result.traceId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "api_route",
        targetId: "api.decision",
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "decision-pipeline-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          versionRuntimeOk: versionRuntime.ok,
          pipelineTraceId: result.traceId,
        },
        metadata: {
          route: "/api/decision",
          operation: "decision.evaluate",
        },
      },
      metadata: {
        route: "/api/decision",
        operation: "decision.evaluate",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        decision: result.decision,
        ranking: result.ranking,
        score: result.score,
        risk: result.risk,
        compliance: result.compliance,
        explanation: result.explanation,
      },
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
      eventType: "DECISION_RUNTIME_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Decision API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.decision",
      metadata: {
        route: "/api/decision",
        error:
          error instanceof Error
            ? error.message
            : "Unknown decision runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/decision",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown decision runtime error.",
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
