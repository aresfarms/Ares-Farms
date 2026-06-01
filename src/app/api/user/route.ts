import { NextResponse } from "next/server";

import { users } from "@/db/schema";
import { db } from "@/lib/db";
import { persistRouteGovernanceEvidence } from "@/lib/governance/routeEvidence";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * User Directory API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Requires governed user visibility and accountable identity access.
 *
 * - Vol II: Regulatory Governance
 *   Preserves controlled disclosure of borrower/operator identity records.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe user reads with durable version, classification,
 *   observability, and replay-verification evidence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports identity review, operational support, escalation, and audit prep.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, observability, replayability, version lineage,
 *   source authority, and evidence preservation.
 */

export const runtime = "nodejs";

function createUserTraceId(): string {
  return `user-read-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function toUserResponse(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    governanceVersion: user.governanceVersion,
    classification: user.classification,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function GET() {
  const traceId = createUserTraceId();

  try {
    const runtimeGuard = runRuntimeGuard({
      operation: "user.read",
      module: "api.user",
      traceId,
      schemaVersion: "user-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      metadata: {
        route: "/api/user",
        identitySurface: true,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "USER_READ_RUNTIME_BLOCKED",
        domain: "security",
        severity: "WARN",
        message: "User directory read was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        module: "api.user",
        metadata: {
          route: "/api/user",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistRouteGovernanceEvidence({
        traceId,
        route: "/api/user",
        operation: "user.read",
        module: "api.user",
        observability,
        sourceVersion: "user-read-api-v0.1.0",
        metadata: {
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked user read.",
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
      operation: "user.read",
      module: "api.user",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "user-read-v0.1.0",
          "src/app/api/user/route.ts",
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
          "api",
          "user-read-api-v0.1.0",
          "api.user",
          traceId
        ),
      ],
    });

    const rows = await db.select().from(users);
    const safeUsers = rows.map(toUserResponse);

    const classifiedOutput = classifyRecord(
      {
        count: safeUsers.length,
        users: safeUsers,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "security",
        classificationSource: "api-user-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "governance"],
        sharingPermissions: ["identity-directory-review"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-public-user-data",
          "requires-governed-access",
        ],
        redactionRequirements: [
          "redact-user-email-before-public-disclosure",
          "redact-tenant-id-before-public-disclosure",
        ],
        consentRequirements: ["authorized-identity-access"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "user_directory_read",
      audience: "internal",
      claimType: "fact",
      summary: "User directory read completed through governed runtime controls.",
      ruleVersion: "user-read-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: false,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        rowCount: safeUsers.length,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "USER_DIRECTORY_READ",
      domain: "security",
      severity: "INFO",
      message: "User directory read completed through runtime governance.",
      traceId,
      replayRef: traceId,
      module: "api.user",
      metadata: {
        rowCount: safeUsers.length,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel: classifiedOutput.classification.classificationLevel,
        durableGovernanceEvidence: true,
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      route: "/api/user",
      operation: "user.read",
      module: "api.user",
      versionRuntime,
      classifications: [
        {
          resourceType: "user_directory_read",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            rowCount: safeUsers.length,
          },
        },
      ],
      observability,
      sourceVersion: "user-read-api-v0.1.0",
      eventCount: safeUsers.length,
      result: {
        rowCount: safeUsers.length,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: safeUsers.length,
      users: safeUsers,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        classification: classifiedOutput.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "USER_READ_RUNTIME_ERROR",
      domain: "security",
      severity: "ERROR",
      message: "User directory read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.user",
      metadata: {
        route: "/api/user",
        error:
          error instanceof Error ? error.message : "Unknown user read error.",
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      route: "/api/user",
      operation: "user.read",
      module: "api.user",
      observability,
      sourceVersion: "user-read-api-v0.1.0",
      metadata: {
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown user read error.",
        governance: {
          traceId,
          observability,
          evidence,
        },
      },
      { status: 500 }
    );
  }
}
