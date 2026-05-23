import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Canonical Ledger Read API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces immutable audit openness and constitutional accountability.
 *
 * - Vol II: Regulatory Governance
 *   Supports examination-ready ledger visibility and regulated review.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe canonical ledger read access.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational inspection, audit review, recovery, and escalation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Preserves replayability, observability, explainability, version lineage,
 *   and governed disclosure.
 */

type CanonicalLedgerMetaRow = {
  active_version?: string | null;
  promoted_at?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

function createCanonicalLedgerTraceId(): string {
  return `canonical-ledger-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeRows(result: unknown): CanonicalLedgerMetaRow[] {
  if (Array.isArray(result)) {
    return result as CanonicalLedgerMetaRow[];
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "rows" in result &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: CanonicalLedgerMetaRow[] }).rows;
  }

  return [];
}

export async function GET() {
  try {
    const traceId = createCanonicalLedgerTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "ledger.canonical.read",
      module: "api.ledger.canonical",
      traceId,
      schemaVersion: "canonical-ledger-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      metadata: {
        route: "/api/ledger/canonical",
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked canonical ledger read.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "ledger.canonical.read",
      module: "api.ledger.canonical",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "canonical-ledger-read-v0.1.0",
          "src/app/api/ledger/canonical/route.ts",
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
          "canonical-ledger-v0.1.0",
          "canonical_ledger_meta",
          traceId
        ),
      ],
    });

    const metaResult = await db.execute(sql`
      SELECT *
      FROM canonical_ledger_meta
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const rows = normalizeRows(metaResult);
    const activeMeta = rows[0] ?? null;

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "canonical_ledger_read",
      audience: "auditor",
      claimType: "fact",
      summary:
        activeMeta !== null
          ? "Canonical ledger metadata was read through the governed runtime surface."
          : "Canonical ledger metadata read completed, but no active metadata row was found.",
      ruleVersion: "canonical-ledger-read-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: activeMeta === null,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        activeMetaFound: activeMeta !== null,
      },
    });

    const observability = createObservabilityEvent({
      eventType:
        activeMeta !== null
          ? "CANONICAL_LEDGER_READ"
          : "CANONICAL_LEDGER_META_MISSING",
      domain: "ledger",
      severity: activeMeta !== null ? "INFO" : "WARN",
      message:
        activeMeta !== null
          ? "Canonical ledger read completed through runtime governance."
          : "Canonical ledger metadata was not found during governed read.",
      traceId,
      replayRef: traceId,
      module: "api.ledger.canonical",
      metadata: {
        activeMetaFound: activeMeta !== null,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      activeMeta,
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
            : "Unknown canonical ledger runtime error.",
      },
      { status: 500 }
    );
  }
}
