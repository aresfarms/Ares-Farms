import { NextRequest, NextResponse } from "next/server";

import {
  CONTROLLED_PROMOTION_ACTIVATION_GATE_VERSION,
  evaluateControlledPromotionActivationGate,
} from "@/lib/governance/controlledPromotionActivationGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Controlled Promotion Activation API
 *
 * Master Volume Governance:
 * - Vol I: keeps activation ceremony review under constitutional authority.
 * - Vol II: prevents promotion review from implying legal advice, source
 *   certainty, official reliance, underwriting use, public verification, or
 *   borrower disclosure authority.
 * - Vol III: assembles final controlled-promotion, approver, environment,
 *   credential, adapter, schema, replay, provenance, monitoring, rollback,
 *   incident, audit, claims, kill-switch, and post-activation verification
 *   controls without live external calls.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to activation review records.
 * - Vol IV: supports activation hold, ceremony review, emergency stop,
 *   rollback review, degraded-source routing, and operator handoff.
 * - Vol V: enforces source authority, claims governance, DTO safety,
 *   controlled disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: binds canonical source intelligence to controlled promotion
 *   activation review before any source becomes production-live.
 */

type ControlledPromotionActivationBody = {
  actorId?: string | null;
  sourceId?: string | null;
  reviewNote?: string | null;
};

async function readBody(
  req: NextRequest
): Promise<ControlledPromotionActivationBody> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as ControlledPromotionActivationBody;
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
  return handleControlledPromotionActivation(
    req,
    "controlled-promotion-activation.read"
  );
}

export async function POST(req: NextRequest) {
  return handleControlledPromotionActivation(
    req,
    "controlled-promotion-activation.hold"
  );
}

async function handleControlledPromotionActivation(
  req: NextRequest,
  operation: string
) {
  const traceId = createTraceId(operation);
  const body = await readBody(req);
  const sourceId = body.sourceId ?? req.nextUrl.searchParams.get("sourceId");
  const actorId = body.actorId ?? req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation,
      module: "api.governance.controlled-promotion-activation",
      traceId,
      schemaVersion: CONTROLLED_PROMOTION_ACTIVATION_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/controlled-promotion-activation",
        sourceId,
        method: req.method,
        activationExecuted: false,
        legalAdviceProvided: false,
        liveFetchAllowed: false,
        liveFetchPerformed: false,
        externalActionPerformed: false,
        publicVerificationAllowed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked controlled promotion activation review.",
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
      module: "api.governance.controlled-promotion-activation",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          CONTROLLED_PROMOTION_ACTIVATION_GATE_VERSION,
          "src/lib/governance/controlledPromotionActivationGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series / Volume VI Source Intelligence",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          CONTROLLED_PROMOTION_ACTIVATION_GATE_VERSION,
          "src/lib/governance/controlledPromotionActivationGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "controlled-promotion-activation-api-v0.1.0",
          "api.governance.controlled-promotion-activation",
          traceId
        ),
      ],
    });
    const result = evaluateControlledPromotionActivationGate({ sourceId });
    const activationHold =
      req.method === "POST"
        ? {
            activationHoldId: `controlled-promotion-activation-hold-${Date.now()}`,
            sourceId: sourceId ?? null,
            reviewStatus: "CONTROLLED_PROMOTION_ACTIVATION_HOLD_RECORDED",
            reviewNote: body.reviewNote ?? null,
            activationExecuted: false,
            legalAdviceProvided: false,
            liveFetchPerformed: false,
            externalActionPerformed: false,
            publicVerificationAllowed: false,
            productionBlocked: true,
            humanReviewRequired: true,
            replayRef: traceId,
          }
        : null;
    const classifiedOutput = classifyRecord(
      {
        count: result.controlledPromotionActivationReviews.length,
        controlledPromotionActivationReviews:
          result.controlledPromotionActivationReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        activationPosture: result.activationPosture,
        activationHold,
        productionBlocked: true,
        activationExecuted: false,
        promotionAllowed: false,
        liveFetchPerformed: false,
        externalActionPerformed: false,
        legalAdviceProvided: false,
        publicVerificationAllowed: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "controlled-promotion-activation-route-output",
        classificationVersion: CONTROLLED_PROMOTION_ACTIVATION_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "controlled-promotion-activation-review",
          "activation-ceremony-review",
          "promotion-gate-evidence",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "review-evidence-only",
          "not-legal-advice",
          "no-live-fetch-authority",
          "no-public-verification-authority",
          "no-production-promotion-authority",
          "no-activation-execution-authority",
        ],
        redactionRequirements: [
          "redact raw credentials",
          "redact source secrets",
          "redact restricted source payloads before public use",
        ],
        consentRequirements: ["institutional-controlled-promotion-review"],
      }
    );
    const observability = createObservabilityEvent({
      eventType:
        req.method === "POST"
          ? "CONTROLLED_PROMOTION_ACTIVATION_HOLD_RECORDED"
          : "CONTROLLED_PROMOTION_ACTIVATION_GATE_READ",
      domain: "connector",
      severity: result.summary.liveFetchEnabled === 0 ? "INFO" : "WARN",
      message:
        "Governed controlled promotion activation gate returned blocked posture without live external calls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.controlled-promotion-activation",
      metadata: {
        sourceId,
        count: result.controlledPromotionActivationReviews.length,
        productionBlocked: result.summary.productionBlocked,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        activationReady: result.summary.activationReady,
        activationExecuted: result.summary.activationExecuted,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      controlledPromotionActivationReviews:
        classifiedOutput.controlledPromotionActivationReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      activationPosture: classifiedOutput.activationPosture,
      activationHold: classifiedOutput.activationHold,
      productionBlocked: classifiedOutput.productionBlocked,
      activationExecuted: classifiedOutput.activationExecuted,
      promotionAllowed: classifiedOutput.promotionAllowed,
      liveFetchPerformed: classifiedOutput.liveFetchPerformed,
      externalActionPerformed: classifiedOutput.externalActionPerformed,
      legalAdviceProvided: classifiedOutput.legalAdviceProvided,
      publicVerificationAllowed: classifiedOutput.publicVerificationAllowed,
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
            : "Unknown controlled promotion activation gate error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
