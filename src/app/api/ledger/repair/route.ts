import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auditEvents } from "@/db/schema";
import { repairLedgerChain } from "@/lib/ledger/repairLedgerChain";

import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Canonical Ledger Repair API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces immutable audit accountability and constitutional remediation controls.
 *
 * - Vol II: Regulatory Governance
 *   Supports regulated repair review and examination-ready remediation evidence.
 *
 * - Vol III: Technical Infrastructure
 *   Executes replay-safe ledger repair through governed runtime controls.
 *
 * - Vol IV: Operational Runbooks
 *   Supports controlled repair execution, escalation, recovery, and audit review.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Preserves replayability, observability, explainability, version lineage,
 *   anomaly review, and simulation-safe remediation discipline.
 */

type RepairLedgerResult = {
  ok?: boolean;
  repaired?: number;
  repairedCount?: number;
  updated?: unknown[];
  issues?: unknown[];
  [key: string]: unknown;
};

function createLedgerRepairTraceId(): string {
  return `ledger-repair-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeRepairResult(rawResult: unknown): RepairLedgerResult {
  if (Array.isArray(rawResult)) {
    return {
      ok: true,
      repairedCount: rawResult.length,
      updated: rawResult,
    };
  }

  if (typeof rawResult === "object" && rawResult !== null) {
    return rawResult as RepairLedgerResult;
  }

  return {
    ok: false,
    repairedCount: 0,
    issues: [
      {
        message: "Repair ledger chain returned an unsupported result shape.",
        rawResult,
      },
    ],
  };
}

function getRepairedCount(result: RepairLedgerResult): number {
  if (typeof result.repaired === "number") {
    return result.repaired;
  }

  if (typeof result.repairedCount === "number") {
    return result.repairedCount;
  }

  if (Array.isArray(result.updated)) {
    return result.updated.length;
  }

  return 0;
}

export async function POST() {
  try {
    const traceId = createLedgerRepairTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "ledger.repair",
      module: "api.ledger.repair",
      traceId,
      schemaVersion: "ledger-repair-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      metadata: {
        route: "/api/ledger/repair",
        mutationSensitive: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked ledger repair.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "ledger.repair",
      module: "api.ledger.repair",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "ledger-repair-v0.1.0",
          "src/app/api/ledger/repair/route.ts",
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
          "ledger-repair-chain-v0.1.0",
          "src/lib/ledger/repairLedgerChain.ts",
          traceId
        ),
      ],
    });

    const entriesBeforeRepair = await db.select().from(auditEvents);
    const rawRepairResult = await repairLedgerChain(entriesBeforeRepair);
    const repairResult = normalizeRepairResult(rawRepairResult);

    const repairedCount = getRepairedCount(repairResult);
    const repairOk = repairResult.ok !== false;

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "ledger_repair_execution",
      audience: "auditor",
      claimType: "fact",
      summary: repairOk
        ? "Ledger repair executed through governed runtime controls."
        : "Ledger repair completed with a non-ok result and requires human review.",
      ruleVersion: "ledger-repair-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        repairedCount,
        repairOk,
        issueCount: Array.isArray(repairResult.issues)
          ? repairResult.issues.length
          : 0,
      },
    });

    const observability = createObservabilityEvent({
      eventType: repairOk
        ? "LEDGER_REPAIR_EXECUTED"
        : "LEDGER_REPAIR_REVIEW_REQUIRED",
      domain: "ledger",
      severity: repairOk ? "WARN" : "CRITICAL",
      message: repairOk
        ? "Ledger repair executed through canonical runtime governance."
        : "Ledger repair returned a non-ok result and requires escalation.",
      traceId,
      replayRef: traceId,
      module: "api.ledger.repair",
      metadata: {
        repairedCount,
        repairOk,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: repairOk,
      repairedCount,
      result: repairResult,
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
            : "Unknown ledger repair runtime error.",
      },
      { status: 500 }
    );
  }
}
