import { NextResponse } from "next/server";

import { writeAuditEvent } from "@/lib/audit";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Apply API Route
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces auditability, rule supremacy, and governed operational authority.
 *
 * - Vol II: Regulatory Governance
 *   Preserves borrower/application compliance context and regulated review.
 *
 * - Vol III: Technical Infrastructure
 *   Requires replay-safe runtime execution, audit lineage, and schema/version control.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational intake, escalation, recovery, and audit review.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, observability, replay, and version lineage.
 */

type ApplyRequestBody = {
  userId?: string | null;
  eventType?: string | null;
  decision?: unknown;
  applicationId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: unknown;
  metadata?: Record<string, unknown>;
  classification?: string | null;
  source?: string | null;
  [key: string]: unknown;
};

function createApplyTraceId(): string {
  return `apply-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApplyRequestBody;
    const traceId = createApplyTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "application.apply",
      module: "api.apply",
      traceId,
      schemaVersion: "apply-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: body.userId ?? null,
      metadata: {
        route: "/api/apply",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked this application event.",
          runtimeGuard,
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "application.apply",
      module: "api.apply",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "apply-request-v0.1.0",
          "src/app/api/apply/route.ts",
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
          "audit-writer-v0.1.0",
          "src/lib/audit/writeAuditEvent.ts",
          traceId
        ),
      ],
    });

    const classifiedApplicationEvent = classifyRecord(
      {
        userId: body.userId ?? null,
        applicationId: body.applicationId ?? null,
        eventType: body.eventType ?? "APPLICATION_SUBMITTED",
        entityType: body.entityType ?? "application",
        entityId: body.entityId ?? body.applicationId ?? null,
        payload: body.payload ?? body,
        metadata: body.metadata ?? {},
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-apply-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["internal", "borrower", "auditor"],
        aiUsagePermissions: ["summarize", "explain", "classify"],
        sharingPermissions: ["governed-internal-review"],
        consentRequirements: ["borrower-application-consent"],
      }
    );

    const auditRecord = await writeAuditEvent({
      userId: body.userId ?? null,
      eventType: body.eventType ?? "APPLICATION_SUBMITTED",
      decision: body.decision ?? null,
      entityType: body.entityType ?? "application",
      entityId: body.entityId ?? body.applicationId ?? null,
      payload: {
        ...body,
        traceId,
        classification: classifiedApplicationEvent.classification,
      },
      metadata: {
        ...(body.metadata ?? {}),
        traceId,
        route: "/api/apply",
        runtimeGuardAllowed: runtimeGuard.allowed,
        versionRuntimeOk: versionRuntime.ok,
      },
      classification: "CONFIDENTIAL",
      source: body.source ?? "api.apply",
    });

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "application_audit_event",
      audience: "borrower",
      claimType: "fact",
      summary:
        "Application event was received, classified, and written through the governed audit event surface.",
      ruleVersion: "apply-runtime-rules-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [auditRecord.id],
      metadata: {
        auditId: auditRecord.id,
        applicationId: body.applicationId ?? null,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "APPLICATION_RUNTIME_EXECUTED",
      domain: "runtime",
      severity: "INFO",
      message: "Apply API executed through canonical runtime governance.",
      traceId,
      replayRef: traceId,
      actorId: body.userId ?? null,
      module: "api.apply",
      metadata: {
        auditId: auditRecord.id,
        runtimeAllowed: runtimeGuard.allowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      auditId: auditRecord.id,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        classification: classifiedApplicationEvent.classification,
        explainability: explanation,
        observability,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Unknown application runtime error.",
      },
      { status: 500 }
    );
  }
}
