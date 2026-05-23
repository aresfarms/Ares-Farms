import { NextResponse } from "next/server";

import { DecisionInputSchema } from "@/lib/api/decision/input.schema";
import { runPipeline } from "@/lib/pipeline/orchestrator";

import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { evaluateVersionRuntime, createRuntimeVersionRef } from "@/lib/runtime/versionRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Decision API Route
 *
 * Master Volume Governance:
 * - Vol I: Constitutional rule supremacy.
 * - Vol III: Replay-safe runtime execution.
 * - Vol V: Classification, explainability, observability, and version lineage.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = DecisionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid decision input.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const traceId = `decision-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const runtimeGuard = runRuntimeGuard({
      operation: "decision.evaluate",
      module: "api.decision",
      traceId,
      schemaVersion: "decision-input-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      metadata: {
        route: "/api/decision",
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Runtime governance guard blocked this operation.",
          runtimeGuard,
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
          "master-volume-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        input: parsed.data,
      },
      {
        classificationLevel: "INTERNAL",
        sensitivityScope: "borrower",
        classificationSource: "api-decision-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
      }
    );

    const result = await runPipeline(parsed.data);

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "decision_pipeline_result",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Decision pipeline result generated through governed runtime enforcement.",
      ruleVersion: "decision-runtime-rules-v0.1.0",
      overlayRefs: [],
      confidenceScore: 0.7,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        pipelineVersion: result.pipelineVersion,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "DECISION_RUNTIME_EXECUTED",
      domain: "runtime",
      severity: "INFO",
      message: "Decision API executed through canonical runtime governance.",
      traceId,
      replayRef: traceId,
      module: "api.decision",
      metadata: {
        runtimeAllowed: runtimeGuard.allowed,
        versionRuntimeOk: versionRuntime.ok,
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
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        classification: classifiedInput.classification,
        explainability: explanation,
        observability,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown decision runtime error.",
      },
      { status: 500 }
    );
  }
}
