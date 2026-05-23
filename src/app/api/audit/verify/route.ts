import { NextResponse } from "next/server";

import { verifyAuditChain } from "@/lib/audit";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Audit Chain Verification API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces immutable audit lineage, constitutional accountability, and audit openness.
 *
 * - Vol II: Regulatory Governance
 *   Supports examination-ready audit-chain validation and regulated review.
 *
 * - Vol III: Technical Infrastructure
 *   Implements deterministic audit verification and replay-safe lineage inspection.
 *
 * - Vol IV: Operational Runbooks
 *   Supports audit review, operational escalation, remediation, and examination workflows.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Preserves replayability, observability, explainability, version lineage, and anomaly review.
 */

function createAuditVerifyTraceId(): string {
  return `audit-verify-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET() {
  try {
    const traceId = createAuditVerifyTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "audit.verifyChain",
      module: "api.audit.verify",
      traceId,
      schemaVersion: "audit-chain-verification-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      metadata: {
        route: "/api/audit/verify",
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          verified: false,
          error: "Runtime governance guard blocked audit verification.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "audit.verifyChain",
      module: "api.audit.verify",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "audit-chain-verification-v0.1.0",
          "src/app/api/audit/verify/route.ts",
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
          "audit-chain-verification-v0.1.0",
          "src/lib/audit/index.ts",
          traceId
        ),
      ],
    });

    const verification = verifyAuditChain([]);

    const verified =
      verification.verified === true || verification.valid === true;

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "audit_chain_verification",
      audience: "auditor",
      claimType: "fact",
      summary: verified
        ? "Audit chain verification completed successfully."
        : "Audit chain verification did not confirm a valid state and requires review.",
      ruleVersion: "audit-verify-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: !verified,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        checkedRows: verification.checkedRows,
        brokenIndex: verification.brokenIndex,
        source: verification.source,
      },
    });

    const observability = createObservabilityEvent({
      eventType: verified
        ? "AUDIT_CHAIN_VERIFIED"
        : "AUDIT_CHAIN_REVIEW_REQUIRED",
      domain: "ledger",
      severity: verified ? "INFO" : "CRITICAL",
      message: verified
        ? "Audit chain verification succeeded."
        : "Audit chain verification requires escalation.",
      traceId,
      replayRef: traceId,
      module: "api.audit.verify",
      metadata: {
        verified,
        checkedRows: verification.checkedRows,
        brokenIndex: verification.brokenIndex,
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
            : "Unknown audit verification runtime error.",
      },
      { status: 500 }
    );
  }
}
