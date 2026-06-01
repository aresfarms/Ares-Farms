import { NextRequest, NextResponse } from "next/server";

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
 * Borrower Onboarding API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces intake accountability, auditability, and governed borrower handling.
 *
 * - Vol II: Regulatory Governance
 *   Supports compliant intake processing and regulated onboarding review.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe onboarding execution with durable application/property
 *   persistence, version, classification, observability, and replay evidence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports intake review, escalation, remediation, and operator workflows.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, replay lineage, observability,
 *   governed disclosure, source authority, and evidence preservation.
 */

type OnboardRequestBody = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  requestedAmount?: unknown;
  requestedPrograms?: unknown;
  role?: string | null;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

function createOnboardTraceId(): string {
  return `onboard-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function routeActorRole(body: OnboardRequestBody): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

export async function POST(req: NextRequest) {
  const traceId = createOnboardTraceId();

  try {
    const body = (await req.json()) as OnboardRequestBody;
    const actorId = body.userId ?? body.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower.onboard",
      module: "api.onboard",
      traceId,
      schemaVersion: "borrower-onboarding-v0.2.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/onboard",
        borrowerIntakeSurface: true,
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_ONBOARDING_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Borrower onboarding runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.onboard",
        metadata: {
          route: "/api/onboard",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/onboard",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked onboarding request.",
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
      allowedRoles: ["user", "borrower", "operator", "admin", "governance"],
      operation: "borrower.onboard",
      module: "api.onboard",
      traceId,
      actorId,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_ONBOARDING_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Borrower onboarding write was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.onboard",
        metadata: {
          route: "/api/onboard",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/onboard",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for borrower onboarding.",
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
      operation: "borrower.onboard",
      module: "api.onboard",
      traceId,
      resourceType: "application",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
      allowMissingApplication: true,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_ONBOARDING_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower onboarding write was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.onboard",
        metadata: {
          route: "/api/onboard",
          applicationId: body.applicationId ?? null,
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/onboard",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this onboarding application record.",
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
      operation: "borrower.onboard",
      module: "api.onboard",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "borrower-onboarding-v0.2.0",
          "src/app/api/onboard/route.ts",
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
          "api",
          "application-persistence-runtime-v0.1.0",
          "src/lib/applications/applicationStore.ts",
          traceId
        ),
      ],
    });

    const classifiedPayload = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-onboard-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-underwriter",
        "authorized-operator",
        "governance",
      ],
      sharingPermissions: [
        "borrower-underwriting-review",
        "regulated-operational-processing",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "requires-authorized-processing-context",
      ],
      redactionRequirements: [
        "redact-sensitive-pii-for-non-underwriting-audiences",
      ],
      consentRequirements: ["borrower-submission-consent"],
    });

    const persistedState = await persistApplicationState({
      traceId,
      source: "api.onboard",
      applicationId: body.applicationId,
      userId: body.userId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      requestedAmount: body.requestedAmount,
      requestedPrograms: body.requestedPrograms,
      status: "ONBOARDING_RECEIVED",
      reviewStatus: "REVIEW_REQUIRED",
      decisionStatus: "PENDING_REVIEW",
      payload: body as Record<string, unknown>,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const acceptedSubmission = classifyRecord(
      {
        accepted: true,
        applicationId: persistedState.application.id,
        propertyId: persistedState.property?.id ?? null,
        borrowerId: body.borrowerId ?? null,
        userId: body.userId ?? null,
        replayRef: traceId,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-onboard-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "governance",
        ],
        sharingPermissions: [
          "borrower-underwriting-review",
          "regulated-operational-processing",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-final-application-decision",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-sensitive-intake-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["borrower-submission-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "borrower_onboarding_submission",
      audience: "internal",
      claimType: "fact",
      summary:
        "Borrower onboarding request processed through governed runtime intake controls and persisted as canonical application state.",
      ruleVersion: "borrower-onboarding-runtime-v0.2.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        borrowerIntakeSurface: true,
        classified: true,
        applicationId: persistedState.application.id,
        propertyId: persistedState.property?.id ?? null,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "BORROWER_ONBOARDING_SUBMITTED",
      domain: "operations",
      severity: "INFO",
      message:
        "Borrower onboarding request persisted through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.onboard",
      metadata: {
        applicationId: persistedState.application.id,
        propertyId: persistedState.property?.id ?? null,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedPayload.classification.classificationLevel,
        durableGovernanceEvidence: true,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "borrower_onboarding_input",
          resourceId: traceId,
          classification: classifiedPayload.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/onboard",
            stage: "input",
            applicationId: persistedState.application.id,
          },
        },
        {
          resourceType: "borrower_onboarding_output",
          resourceId: persistedState.application.id,
          classification: acceptedSubmission.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/onboard",
            stage: "output",
            accepted: true,
            propertyId: persistedState.property?.id ?? null,
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
        sourceVersion: "borrower-onboarding-v0.2.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          accepted: true,
          applicationId: persistedState.application.id,
          propertyId: persistedState.property?.id ?? null,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/onboard",
          operation: "borrower.onboard",
        },
      },
      metadata: {
        route: "/api/onboard",
        operation: "borrower.onboard",
      },
    });

    return NextResponse.json({
      ok: true,
      accepted: true,
      application: persistedState.application,
      property: persistedState.property,
      onboarding: classifiedPayload,
      submission: acceptedSubmission,
      governance: {
        traceId,
        runtimeGuard,
        access,
        versionRuntime,
        inputClassification: classifiedPayload.classification,
        outputClassification: acceptedSubmission.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "BORROWER_ONBOARDING_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Borrower onboarding API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.onboard",
      metadata: {
        route: "/api/onboard",
        error:
          error instanceof Error
            ? error.message
            : "Unknown onboarding runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/onboard",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown onboarding runtime error.",
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
