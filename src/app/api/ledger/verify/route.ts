import { NextResponse } from "next/server";

import { verifyLedger } from "@/lib/audit";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Ledger Integrity Verification API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces immutable audit ledger integrity and audit openness.
 *
 * - Vol II: Regulatory Governance
 *   Supports examination-ready evidentiary review and compliance validation.
 *
 * - Vol III: Technical Infrastructure
 *   Implements replay-safe verification and deterministic ledger inspection.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational audit, recovery, escalation, and examination workflows.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Preserves replayability, observability, explainability, and version lineage.
 */

function createLedgerVerifyTraceId(): string {
  return `ledger-verify-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET() {
  try {
    const traceId = createLedgerVerifyTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "ledger.verify",
      module: "api.ledger.verify",
      traceId,
      schemaVersion: "ledger-verification-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      metadata: {
        route: "/api/ledger/verify",
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          verified: false,
          error: "Runtime governance guard blocked ledger verification.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "ledger.verify",
      module: "api.ledger.verify",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "ledger-verification-v0.1.0",
          "src/app/api/ledger/verify/route.ts",
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
          "audit-ledger-verification-v0.1.0",
          "src/lib/audit/verifyLedger.ts",
          traceId
        ),
      ],
    });

    const verification = await verifyLedger();

    const verified =
      typeof verification === "object" &&
      verification !== null &&
      "verified" in verification
        ? Boolean(verification.verified)
        : false;

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "ledger_integrity_verification",
      audience: "auditor",
      claimType: "fact",
      summary: verified
        ? "Ledger integrity verification completed successfully."
        : "Ledger integrity verification did not confirm a verified state and requires review.",
      ruleVersion: "ledger-verify-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: !verified,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        verification,
      },
    });

    const observability = createObservabilityEvent({
      eventType: verified
        ? "LEDGER_INTEGRITY_VERIFIED"
        : "LEDGER_INTEGRITY_REVIEW_REQUIRED",
      domain: "ledger",
      severity: verified ? "INFO" : "CRITICAL",
      message: verified
        ? "Ledger integrity verification succeeded."
        : "Ledger integrity verification requires escalation.",
      traceId,
      replayRef: traceId,
      module: "api.ledger.verify",
      metadata: {
        verified,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: verified,
      verified,
      result: verification,
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
            : "Unknown ledger verification runtime error.",
      },
      { status: 500 }
    );
  }
}
