import { NextResponse } from "next/server";

import { writeAuditEvent } from "@/lib/audit";
import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistApplicationState } from "@/lib/applications/applicationStore";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

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
 *   Requires replay-safe runtime execution, durable application persistence,
 *   audit lineage, durable evidence, and schema/version control.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational intake, escalation, recovery, and audit review.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, observability, replay,
 *   source authority, version lineage, and governance evidence preservation.
 */

type ApplyRequestBody = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  eventType?: string | null;
  decision?: unknown;
  applicationId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  requestedAmount?: unknown;
  requestedPrograms?: unknown;
  payload?: unknown;
  metadata?: Record<string, unknown>;
  classification?: string | null;
  source?: string | null;
  role?: string | null;
  [key: string]: unknown;
};

function createApplyTraceId(): string {
  return `apply-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function routeActorRole(body: ApplyRequestBody): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function payloadRecord(body: ApplyRequestBody): Record<string, unknown> {
  if (typeof body.payload === "object" && body.payload !== null) {
    return body.payload as Record<string, unknown>;
  }

  return body as Record<string, unknown>;
}

export async function POST(req: Request) {
  const traceId = createApplyTraceId();

  try {
    const body = (await req.json()) as ApplyRequestBody;
    const actorId = body.userId ?? body.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "application.apply",
      module: "api.apply",
      traceId,
      schemaVersion: "apply-request-v0.2.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/apply",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "APPLICATION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Apply API runtime guard blocked the application event.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.apply",
        metadata: {
          route: "/api/apply",
          applicationId: body.applicationId ?? null,
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/apply",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked this application event.",
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

    const access = evaluateAccess({
      role: routeActorRole(body),
      allowedRoles: [
        "user",
        "borrower",
        "operator",
        "underwriter",
        "admin",
        "governance",
      ],
      operation: "application.apply",
      module: "api.apply",
      traceId,
      actorId,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "APPLICATION_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Apply API write was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.apply",
        metadata: {
          route: "/api/apply",
          applicationId: body.applicationId ?? null,
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/apply",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for application submission.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const recordAccess = await evaluateApplicationRecordAccess({
      access,
      operation: "application.apply",
      module: "api.apply",
      traceId,
      resourceType: "application",
      applicationId: body.applicationId ?? body.entityId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
      allowMissingApplication: true,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "APPLICATION_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Apply API write was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.apply",
        metadata: {
          route: "/api/apply",
          applicationId: body.applicationId ?? body.entityId ?? null,
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/apply",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this application record.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess,
            observability,
            evidence,
          },
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
          "apply-request-v0.2.0",
          "src/app/api/apply/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "applications-v0.1.0",
          "src/db/schema/applications.ts",
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
          "audit-writer-v0.1.0",
          "src/lib/audit/writeAuditEvent.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "application-persistence-runtime-v0.1.0",
          "src/lib/applications/applicationStore.ts",
          traceId
        ),
      ],
    });

    const payload = payloadRecord(body);

    const classifiedApplicationEvent = classifyRecord(
      {
        userId: body.userId ?? null,
        borrowerId: body.borrowerId ?? null,
        applicationId: body.applicationId ?? null,
        eventType: body.eventType ?? "APPLICATION_SUBMITTED",
        entityType: body.entityType ?? "application",
        entityId: body.entityId ?? body.applicationId ?? null,
        payload,
        metadata: body.metadata ?? {},
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-apply-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["internal", "borrower", "auditor", "governance"],
        aiUsagePermissions: ["summarize", "explain", "classify"],
        sharingPermissions: [
          "governed-internal-review",
          "regulated-operational-processing",
        ],
        exportRestrictions: [
          "requires-governed-access",
          "requires-application-review-context",
        ],
        redactionRequirements: [
          "redact-sensitive-borrower-data-before-external-disclosure",
        ],
        consentRequirements: ["borrower-application-consent"],
      }
    );

    const persistedState = await persistApplicationState({
      traceId,
      source: body.source ?? "api.apply",
      applicationId: body.applicationId ?? body.entityId,
      userId: body.userId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      requestedAmount: body.requestedAmount ?? payload.requestedAmount,
      requestedPrograms: body.requestedPrograms ?? payload.requestedPrograms,
      status: "APPLICATION_SUBMITTED",
      reviewStatus: "REVIEW_REQUIRED",
      decisionStatus:
        typeof body.decision === "string" ? body.decision : "PENDING_REVIEW",
      payload,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const auditRecord = await writeAuditEvent({
      userId: body.userId ?? null,
      eventType: body.eventType ?? "APPLICATION_SUBMITTED",
      decision: body.decision ?? null,
      entityType: body.entityType ?? "application",
      entityId: persistedState.application.id,
      payload: {
        ...body,
        applicationId: persistedState.application.id,
        propertyId: persistedState.property?.id ?? null,
        traceId,
        classification: classifiedApplicationEvent.classification,
      },
      metadata: {
        ...(body.metadata ?? {}),
        traceId,
        route: "/api/apply",
        applicationId: persistedState.application.id,
        propertyId: persistedState.property?.id ?? null,
        runtimeGuardAllowed: runtimeGuard.allowed,
        versionRuntimeOk: versionRuntime.ok,
        recordAccessAllowed: recordAccess.allowed,
      },
      classification: "CONFIDENTIAL",
      source: body.source ?? "api.apply",
    });

    const classifiedAuditReceipt = classifyRecord(
      {
        auditId: auditRecord.id,
        accepted: true,
        applicationId: persistedState.application.id,
        propertyId: persistedState.property?.id ?? null,
        entityType: body.entityType ?? "application",
        entityId: persistedState.application.id,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-apply-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["internal", "borrower", "auditor", "governance"],
        aiUsagePermissions: ["summarize", "explain"],
        sharingPermissions: [
          "governed-internal-review",
          "regulated-operational-processing",
        ],
        exportRestrictions: [
          "not-a-final-credit-decision",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-audit-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["borrower-application-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "application_audit_event",
      audience: "borrower",
      claimType: "fact",
      summary:
        "Application event was received, persisted as canonical application state, classified, and written through the governed audit surface.",
      ruleVersion: "apply-runtime-rules-v0.2.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [auditRecord.id],
      metadata: {
        auditId: auditRecord.id,
        applicationId: persistedState.application.id,
        propertyId: persistedState.property?.id ?? null,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "APPLICATION_RUNTIME_EXECUTED",
      domain: "runtime",
      severity: "INFO",
      message:
        "Apply API persisted application state through canonical runtime governance.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.apply",
      metadata: {
        auditId: auditRecord.id,
        applicationId: persistedState.application.id,
        propertyId: persistedState.property?.id ?? null,
        runtimeAllowed: runtimeGuard.allowed,
        versionRuntimeOk: versionRuntime.ok,
        durableGovernanceEvidence: true,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "application_apply_input",
          resourceId: persistedState.application.id,
          classification: classifiedApplicationEvent.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/apply",
            stage: "input",
            applicationId: persistedState.application.id,
          },
        },
        {
          resourceType: "application_apply_output",
          resourceId: auditRecord.id,
          classification: classifiedAuditReceipt.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/apply",
            stage: "output",
            auditId: auditRecord.id,
            applicationId: persistedState.application.id,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "application_persistence",
        targetId: persistedState.application.id,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "apply-request-v0.2.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          auditId: auditRecord.id,
          applicationId: persistedState.application.id,
          propertyId: persistedState.property?.id ?? null,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/apply",
          operation: "application.apply",
        },
      },
      metadata: {
        route: "/api/apply",
        operation: "application.apply",
      },
    });

    return NextResponse.json({
      ok: true,
      auditId: auditRecord.id,
      application: persistedState.application,
      property: persistedState.property,
      receipt: classifiedAuditReceipt,
      governance: {
        traceId,
        runtimeGuard,
        access,
        versionRuntime,
        inputClassification: classifiedApplicationEvent.classification,
        outputClassification: classifiedAuditReceipt.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (err) {
    const observability = createObservabilityEvent({
      eventType: "APPLICATION_RUNTIME_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Apply API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.apply",
      metadata: {
        route: "/api/apply",
        error:
          err instanceof Error
            ? err.message
            : "Unknown application runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/apply",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Unknown application runtime error.",
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
