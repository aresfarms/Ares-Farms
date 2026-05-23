import { NextResponse } from "next/server";

import { replayCanonicalLedger } from "@/lib/ledger/replayCanonicalLedger";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Canonical Ledger Replay Verification API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces audit openness, immutable ledger integrity, and constitutional accountability.
 *
 * - Vol II: Regulatory Governance
 *   Supports examination-ready replay verification and regulated evidentiary review.
 *
 * - Vol III: Technical Infrastructure
 *   Implements deterministic replay verification as runtime infrastructure.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational inspection, replay recovery, and audit escalation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Preserves replayability, observability, explainability, version lineage,
 *   and anomaly detection.
 */

function createReplayTraceId(): string {
  return `replay-verify-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET() {
  try {
    const traceId = createReplayTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "ledger.replayVerify",
      module: "api.ledger.replayVerify",
      traceId,
      schemaVersion: "ledger-replay-verification-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      metadata: {
        route: "/api/ledger/replay-verify",
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          verified: false,
          error: "Runtime governance guard blocked replay verification.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "ledger.replayVerify",
      module: "api.ledger.replayVerify",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "ledger-replay-verification-v0.1.0",
          "src/app/api/ledger/replay-verify/route.ts",
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
        createRuntimeVersionRef(
          "ledger",
          "canonical-replay-v0.1.0",
          "src/lib/ledger/replayCanonicalLedger.ts",
          traceId
        ),
      ],
    });

    const replayResult = await replayCanonicalLedger();

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "canonical_ledger_replay_verification",
      audience: "auditor",
      claimType: "fact",
      summary:
        replayResult.verified === true
          ? "Canonical ledger replay verification completed successfully."
          : "Canonical ledger replay verification detected a mismatch requiring review.",
      ruleVersion: "ledger-replay-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: replayResult.verified !== true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        count: replayResult.count,
        head: replayResult.head,
      },
    });

    const observability = createObservabilityEvent({
      eventType:
        replayResult.verified === true
          ? "LEDGER_REPLAY_VERIFIED"
          : "LEDGER_REPLAY_DIVERGENCE",
      domain: "replay",
      severity: replayResult.verified === true ? "INFO" : "CRITICAL",
      message:
        replayResult.verified === true
          ? "Canonical ledger replay verification succeeded."
          : "Canonical ledger replay verification failed and requires escalation.",
      traceId,
      replayRef: traceId,
      module: "api.ledger.replayVerify",
      metadata: {
        verified: replayResult.verified,
        count: replayResult.count,
        head: replayResult.head,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: replayResult.ok,
      verified: replayResult.verified,
      result: replayResult,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        explainability: explanation,
        observability,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        verified: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown replay verification runtime error.",
      },
      { status: 500 }
    );
  }
}
