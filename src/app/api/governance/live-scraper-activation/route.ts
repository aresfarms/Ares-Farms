import { NextRequest, NextResponse } from "next/server";

import {
  LIVE_SCRAPER_ACTIVATION_GATE_VERSION,
  evaluateLiveScraperActivationGate,
} from "@/lib/governance/liveScraperActivationGate";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Live Scraper Activation Gate API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional control over source activation.
 * - Vol II: blocks live source reliance until legal, credential, and review
 *   gates are complete.
 * - Vol III: exposes replay-safe source-stack and scraper registry posture.
 * - Vol III-B: attaches runtime guard, classification, version lineage, and
 *   observability metadata to every activation review.
 * - Vol IV: supports promotion, rollback, monitoring, and incident runbook
 *   review before any source can become production-live.
 * - Vol V: keeps source authority, provenance, replay, and claims governance
 *   visible without performing live external calls.
 * - Vol VI: aligns live-source readiness with the governed source intelligence
 *   architecture while leaving all live fetches blocked.
 */

function createTraceId(): string {
  return `live-scraper-activation-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET(req: NextRequest) {
  const traceId = createTraceId();
  const sourceId = req.nextUrl.searchParams.get("sourceId");
  const actorId = req.nextUrl.searchParams.get("actorId");

  try {
    const runtimeGuard = runRuntimeGuard({
      operation: "live-scraper-activation.review",
      module: "api.governance.live-scraper-activation",
      traceId,
      schemaVersion: LIVE_SCRAPER_ACTIVATION_GATE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/live-scraper-activation",
        sourceId,
        liveFetchAllowed: false,
        productionBlocked: true,
        activationReviewOnly: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked scraper activation review.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "live-scraper-activation.review",
      module: "api.governance.live-scraper-activation",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          LIVE_SCRAPER_ACTIVATION_GATE_VERSION,
          "src/lib/governance/liveScraperActivationGate.ts",
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
          LIVE_SCRAPER_ACTIVATION_GATE_VERSION,
          "src/lib/governance/liveScraperActivationGate.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "live-scraper-activation-api-v0.1.0",
          "api.governance.live-scraper-activation",
          traceId
        ),
      ],
    });
    const result = evaluateLiveScraperActivationGate({ sourceId });
    const classifiedOutput = classifyRecord(
      {
        count: result.sourceReviews.length,
        sourceReviews: result.sourceReviews,
        summary: result.summary,
        disclosures: result.disclosures,
        activationPosture: result.activationPosture,
        activationBlocked: true,
        liveFetchPerformed: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "live-scraper-activation-route-output",
        classificationVersion: LIVE_SCRAPER_ACTIVATION_GATE_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator", "authorized-reviewer"],
        sharingPermissions: [
          "source-activation-review",
          "promotion-gate-evidence",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "activation-review-only",
          "no-live-fetch-authority",
          "no-public-verification-authority",
        ],
        redactionRequirements: [
          "redact raw credentials",
          "redact source secrets",
          "redact restricted source payloads before public use",
        ],
        consentRequirements: ["institutional-live-action-review"],
      }
    );
    const observability = createObservabilityEvent({
      eventType: "LIVE_SCRAPER_ACTIVATION_GATE_REVIEWED",
      domain: "connector",
      severity:
        result.summary.liveFetchEnabled === 0 && versionRuntime.ok
          ? "INFO"
          : "WARN",
      message:
        "Governed live scraper activation gate reviewed source readiness without live external calls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.live-scraper-activation",
      metadata: {
        sourceId,
        count: result.sourceReviews.length,
        activationBlocked: result.summary.activationBlocked,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: classifiedOutput.count,
      sourceReviews: classifiedOutput.sourceReviews,
      summary: classifiedOutput.summary,
      disclosures: classifiedOutput.disclosures,
      activationPosture: classifiedOutput.activationPosture,
      activationBlocked: classifiedOutput.activationBlocked,
      liveFetchPerformed: classifiedOutput.liveFetchPerformed,
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
            : "Unknown live scraper activation gate error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
