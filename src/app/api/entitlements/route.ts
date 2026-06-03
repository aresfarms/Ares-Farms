import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../auth/[...nextauth]/route";
import {
  getEntitlement,
  hasEntitlement,
} from "@/lib/entitlements/store";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Entitlement Read API
 *
 * Master Volume Governance:
 * - Vol I: keeps operational access authority bounded and reviewable.
 * - Vol II: protects regulated-service access and tenant metadata.
 * - Vol III: reads durable entitlement state through governed backend controls.
 * - Vol IV: supports operator review, continuity, and access recovery.
 * - Vol V: enforces classification, source authority, replay, versioning,
 *   observability, and durable governance evidence.
 *
 * Rule:
 * Entitlement status is an operational access control. It is not a credit,
 * eligibility, financing, legal, permitting, or regulatory decision.
 */

type SessionUserWithTenant = {
  id?: string | null;
  email?: string | null;
  tenantId?: string | null;
};

function createEntitlementTraceId(): string {
  return `entitlements-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET() {
  const traceId = createEntitlementTraceId();

  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUserWithTenant | undefined;

    if (!sessionUser) {
      const observability = createObservabilityEvent({
        eventType: "ENTITLEMENT_READ_UNAUTHORIZED",
        domain: "security",
        severity: "WARN",
        message: "Unauthenticated entitlement read was rejected.",
        traceId,
        replayRef: traceId,
        actorId: null,
        module: "api.entitlements",
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/entitlements",
          rejected: true,
          reason: "unauthorized",
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          governance: {
            traceId,
            observability,
            evidence,
          },
        },
        { status: 401 }
      );
    }

    const tenantId = sessionUser.tenantId ?? "dev";
    const actorId = sessionUser.id ?? sessionUser.email ?? tenantId;

    const runtimeGuard = runRuntimeGuard({
      operation: "entitlements.read",
      module: "api.entitlements",
      traceId,
      schemaVersion: "entitlements-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/entitlements",
        readsDurableEntitlementState: true,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "ENTITLEMENT_READ_BLOCKED",
        domain: "security",
        severity: "WARN",
        message: "Entitlement read was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.entitlements",
        metadata: {
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/entitlements",
          blocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked entitlement read.",
          governance: {
            traceId,
            runtimeGuard,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "entitlements.read",
      module: "api.entitlements",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "entitlements-v0.1.0",
          "src/db/schema/entitlements.ts",
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
          "api",
          "entitlement-store-v0.1.0",
          "src/lib/entitlements/store.ts",
          traceId
        ),
      ],
    });

    const entitlement = await getEntitlement(tenantId);
    const paid = await hasEntitlement(tenantId, "paid");
    const environmental = await hasEntitlement(tenantId, "environmental");

    const classifiedEntitlement = classifyRecord(
      {
        tenantId,
        paid,
        environmental,
        entitlement,
        replayRef: traceId,
        advisory:
          "Entitlement status is an operational access control only, not a regulated decision.",
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-entitlements-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "security",
          "governance",
        ],
        sharingPermissions: ["entitlement-review"],
        aiUsagePermissions: [],
        exportRestrictions: [
          "do-not-export-entitlement-status-without-review",
        ],
        redactionRequirements: ["redact-tenant-and-entitlement-identifiers"],
        consentRequirements: ["borrower-payment-consent"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "ENTITLEMENT_READ",
      domain: "security",
      severity: "INFO",
      message: "Entitlement state read through governed backend controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.entitlements",
      metadata: {
        tenantId,
        entitlementFound: Boolean(entitlement),
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "entitlement_status",
          resourceId: tenantId,
          classification: classifiedEntitlement.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/entitlements",
            entitlementFound: Boolean(entitlement),
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "entitlement_read",
        targetId: tenantId,
        verificationStatus: versionRuntime.ok ? "verified" : "warning",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "entitlement-store-v0.1.0",
        replayVersion: "entitlement-read-replay-v0.1.0",
        eventCount: entitlement ? 1 : 0,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          paid,
          environmental,
          entitlementFound: Boolean(entitlement),
        },
        metadata: {
          route: "/api/entitlements",
          versionRuntimeOk: versionRuntime.ok,
        },
        verifiedBy: "api.entitlements",
      },
      metadata: {
        route: "/api/entitlements",
        operation: "entitlements.read",
      },
    });

    return NextResponse.json({
      ok: true,
      entitlements: classifiedEntitlement,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        outputClassification: classifiedEntitlement.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown entitlement runtime error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
