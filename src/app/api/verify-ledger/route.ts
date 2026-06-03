import { NextResponse } from "next/server";

import { verifyLedger } from "@/lib/audit";
import { persistRouteGovernanceEvidence } from "@/lib/governance/routeEvidence";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Legacy Ledger Verification API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces audit openness, immutable ledger integrity, and constitutional accountability.
 *
 * - Vol II: Regulatory Governance
 *   Supports regulated examination readiness and evidentiary review.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe verification over legacy compatibility surface.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational inspection, recovery, escalation, and audit workflows.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Preserves replayability, observability, explainability, version lineage,
 *   and anomaly review while legacy routes are migrated.
 */

function createLegacyVerifyTraceId(): string {
  return `legacy-verify-ledger-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET() {
  try {
    const traceId = createLegacyVerifyTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "ledger.legacyVerify",
      module: "api.verifyLedger",
      traceId,
      schemaVersion: "legacy-ledger-verification-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      metadata: {
        route: "/api/verify-ledger",
        legacyCompatibilitySurface: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          verified: false,
          error: "Runtime governance guard blocked legacy ledger verification.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "ledger.legacyVerify",
      module: "api.verifyLedger",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "legacy-ledger-verification-v0.1.0",
          "src/app/api/verify-ledger/route.ts",
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
      outputType: "legacy_ledger_verification",
      audience: "auditor",
      claimType: "fact",
      summary: verified
        ? "Legacy ledger verification completed successfully through governed runtime controls."
        : "Legacy ledger verification did not confirm verified state and requires review.",
      ruleVersion: "legacy-ledger-verify-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: !verified,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        verification,
        legacyCompatibilitySurface: true,
      },
    });

    const observability = createObservabilityEvent({
      eventType: verified
        ? "LEGACY_LEDGER_VERIFIED"
        : "LEGACY_LEDGER_REVIEW_REQUIRED",
      domain: "ledger",
      severity: verified ? "INFO" : "CRITICAL",
      message: verified
        ? "Legacy ledger verification succeeded through runtime governance."
        : "Legacy ledger verification requires escalation.",
      traceId,
      replayRef: traceId,
      module: "api.verifyLedger",
      metadata: {
        verified,
        versionRuntimeOk: versionRuntime.ok,
        legacyCompatibilitySurface: true,
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      route: "/api/verify-ledger",
      operation: "ledger.legacyVerify",
      module: "api.verifyLedger",
      versionRuntime,
      observability,
      sourceVersion: "legacy-ledger-verification-v0.1.0",
      verificationStatus: verified ? "PASS" : "REVIEW_REQUIRED",
      mismatchCount: verified ? 0 : 1,
      result: {
        verified,
        verification,
        legacyCompatibilitySurface: true,
      },
      metadata: {
        legacyCompatibilitySurface: true,
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
        evidence,
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
            : "Unknown legacy ledger verification runtime error.",
      },
      { status: 500 }
    );
  }
}
