import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auditEvents } from "@/db/schema";

import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Ledger Base Read API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces immutable ledger visibility and constitutional audit accountability.
 *
 * - Vol II: Regulatory Governance
 *   Supports regulated evidence review and examination-ready ledger access.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe ledger read access through governed runtime controls.
 *
 * - Vol IV: Operational Runbooks
 *   Supports audit review, operational inspection, recovery, and escalation workflows.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Preserves replayability, observability, explainability, version lineage,
 *   and governed disclosure.
 */

function createLedgerTraceId(): string {
  return `ledger-read-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET() {
  try {
    const traceId = createLedgerTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "ledger.read",
      module: "api.ledger",
      traceId,
      schemaVersion: "ledger-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      metadata: {
        route: "/api/ledger",
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked ledger read.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "ledger.read",
      module: "api.ledger",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "ledger-read-v0.1.0",
          "src/app/api/ledger/route.ts",
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
          "audit-events-v0.1.0",
          "src/db/schema/auditEvents.ts",
          traceId
        ),
      ],
    });

    const rows = await db.select().from(auditEvents);

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "ledger_read",
      audience: "auditor",
      claimType: "fact",
      summary: "Ledger rows were read through the governed runtime surface.",
      ruleVersion: "ledger-read-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: false,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        rowCount: rows.length,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "LEDGER_READ_EXECUTED",
      domain: "ledger",
      severity: "INFO",
      message: "Ledger read completed through canonical runtime governance.",
      traceId,
      replayRef: traceId,
      module: "api.ledger",
      metadata: {
        rowCount: rows.length,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: rows.length,
      rows,
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
        error:
          error instanceof Error
            ? error.message
            : "Unknown ledger read runtime error.",
      },
      { status: 500 }
    );
  }
}
