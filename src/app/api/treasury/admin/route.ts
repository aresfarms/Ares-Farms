import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import {
  listTreasuryLedger,
  listTreasuryPolicies,
  listTreasuryReserves,
} from "@/lib/treasury/treasuryStore";

/**
 * Treasury Spine Admin Read API (REG-TREASURY-001 governance oversight)
 *
 * The governed read behind treasury oversight: an authorized governance/admin/
 * auditor actor sees the reserve architecture, the versioned policy registry,
 * and the immutable ledger. There is NO write surface here and NO live payment
 * capture — the spine is backend governance infrastructure; live billing +
 * membership pricing stay gated to the founders + counsel session.
 *
 * Master Volume Governance:
 * - Vol II (REG-TREASURY-001): treasury records may not be disclosed outside
 *   governed classification permissions — role-gated to admin/auditor/governance
 *   only (treasury is more sensitive than the operator queue; NOT operator-open).
 * - Vol III / III-B (GOV-RUNTIME-001 §3.49): runtime guard + version lineage +
 *   classification + observability + persisted evidence on every read.
 * - Vol V (CANON-CLASS-001 §6): treasury min Level 3 CONFIDENTIAL; reserve +
 *   dispute records Level 4 RESTRICTED — output classified RESTRICTED.
 */

function createTraceId(): string {
  return `treasury-admin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(req: NextRequest) {
  const traceId = createTraceId();

  try {
    const p = req.nextUrl.searchParams;
    const role = p.get("role") ?? "";
    const tenantId = p.get("tenantId");
    const actor = p.get("userId") ?? tenantId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "treasury.admin-read",
      module: "api.treasury.admin",
      traceId,
      schemaVersion: "treasury-spine-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: { route: "/api/treasury/admin" },
    });

    const access = evaluateAccess({
      role,
      allowedRoles: ["admin", "auditor", "governance"],
      operation: "treasury.admin-read",
      module: "api.treasury.admin",
      traceId,
      actorId: actor,
      tenantId: tenantId ?? undefined,
    });

    if (!runtimeGuard.allowed || !access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "TREASURY_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Treasury admin read was denied by runtime or role controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.treasury.admin",
        metadata: { route: "/api/treasury/admin", runtimeGuard, access },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: "/api/treasury/admin", accessDenied: true },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for treasury admin reads.",
          governance: { traceId, runtimeGuard, access, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "treasury.admin-read",
      module: "api.treasury.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "treasury-spine-v0.1.0",
          "src/db/schema/treasury.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series (REG-TREASURY-001 / CANON-TREASURY-001)",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "treasury-governance-runtime-v0.1.0",
          "src/lib/treasury/treasuryStore.ts",
          traceId
        ),
      ],
    });

    const [reserves, policies, ledger] = await Promise.all([
      listTreasuryReserves(),
      listTreasuryPolicies(),
      listTreasuryLedger(null, 100),
    ]);

    const classifiedOutput = classifyRecord(
      {
        reserveCount: reserves.length,
        policyCount: policies.length,
        ledgerCount: ledger.length,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "institutional",
        classificationSource: "api-treasury-admin-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["governance", "auditor", "admin"],
        sharingPermissions: ["regulated-treasury-oversight"],
        aiUsagePermissions: ["summarize"],
        exportRestrictions: ["requires-governed-access", "requires-human-review"],
        redactionRequirements: [],
        consentRequirements: [],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "TREASURY_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message: "Treasury spine state read by an authorized governance actor.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.treasury.admin",
      metadata: {
        route: "/api/treasury/admin",
        reserveCount: reserves.length,
        policyCount: policies.length,
        ledgerCount: ledger.length,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "treasury_admin_read",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: { route: "/api/treasury/admin" },
        },
      ],
      observability,
      metadata: { route: "/api/treasury/admin" },
    });

    return NextResponse.json({
      ok: true,
      // Spine posture — no live billing; membership pricing gated.
      spine: {
        livePaymentCaptured: false,
        membershipPricingGated: true,
        note: "Treasury governance spine only. Live billing + membership pricing are gated to the founders + counsel session + replay certification.",
      },
      reserves,
      policies,
      ledger,
      governance: {
        traceId,
        runtimeGuard,
        access,
        versionRuntime,
        outputClassification: classifiedOutput.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "TREASURY_ADMIN_READ_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Treasury admin read encountered an unhandled error.",
      traceId,
      replayRef: traceId,
      module: "api.treasury.admin",
      metadata: {
        route: "/api/treasury/admin",
        error: error instanceof Error ? error.message : "Unknown error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: { route: "/api/treasury/admin", runtimeError: true },
    });

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
