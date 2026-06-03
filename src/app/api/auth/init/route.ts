import { NextResponse } from "next/server";

import {
  ensureDurableIdentity,
  normalizeIdentityEmail,
  toPublicUserIdentity,
} from "@/lib/auth/identity";
import { sanitizeSelfServiceAuthRole } from "@/lib/auth/authActivationPolicy";
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
 * Auth Initialization API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces governed identity initialization and tenant accountability.
 *
 * - Vol II: Regulatory Governance
 *   Preserves controlled borrower/operator identity context for regulated review.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe identity initialization with durable version,
 *   classification, observability, and replay-verification evidence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports onboarding support, identity recovery, escalation, and audit review.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, version lineage, observability, replayability,
 *   source authority, and governance evidence preservation.
 */

export const runtime = "nodejs";

type AuthInitRequestBody = {
  email?: string | null;
  name?: string | null;
  role?: string | null;
  tenantId?: string | null;
  metadata?: Record<string, unknown>;
};

function createAuthInitTraceId(): string {
  return `auth-init-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: Request) {
  const traceId = createAuthInitTraceId();

  try {
    const body = (await req.json()) as AuthInitRequestBody;
    const email = normalizeIdentityEmail(body.email);

    if (!email) {
      const observability = createObservabilityEvent({
        eventType: "AUTH_INIT_EMAIL_MISSING",
        domain: "security",
        severity: "WARN",
        message: "Auth initialization rejected a request without a valid email.",
        traceId,
        replayRef: traceId,
        module: "api.auth.init",
        metadata: {
          route: "/api/auth/init",
        },
      });

      const evidence = await persistRouteGovernanceEvidence({
        traceId,
        route: "/api/auth/init",
        operation: "auth.init",
        module: "api.auth.init",
        observability,
        sourceVersion: "auth-init-api-v0.1.0",
        metadata: {
          rejectedBeforeRuntime: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Email is required.",
          governance: {
            traceId,
            observability,
            evidence,
          },
        },
        { status: 400 }
      );
    }

    const runtimeGuard = runRuntimeGuard({
      operation: "auth.init",
      module: "api.auth.init",
      traceId,
      schemaVersion: "auth-init-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: email,
      metadata: {
        route: "/api/auth/init",
        tenantId: body.tenantId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "AUTH_INIT_RUNTIME_BLOCKED",
        domain: "security",
        severity: "WARN",
        message: "Auth initialization was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: email,
        module: "api.auth.init",
        metadata: {
          route: "/api/auth/init",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistRouteGovernanceEvidence({
        traceId,
        route: "/api/auth/init",
        operation: "auth.init",
        module: "api.auth.init",
        observability,
        sourceVersion: "auth-init-api-v0.1.0",
        metadata: {
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked auth initialization.",
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
      operation: "auth.init",
      module: "api.auth.init",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "auth-init-request-v0.1.0",
          "src/app/api/auth/init/route.ts",
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
          "auth-init-api-v0.1.0",
          "api.auth.init",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "durable-identity-runtime-v0.1.0",
          "src/lib/auth/identity.ts",
          traceId
        ),
      ],
    });

    const requestedRole = body.role;
    const role = sanitizeSelfServiceAuthRole(requestedRole);
    const elevatedRoleRequiresRoleProvisioning = Boolean(
      requestedRole && requestedRole !== role
    );

    const classifiedInput = classifyRecord(
      {
        email,
        name: body.name ?? null,
        role,
        requestedRole: requestedRole ?? null,
        tenantId: body.tenantId ?? null,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "security",
        classificationSource: "api-auth-init-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "governance"],
        sharingPermissions: ["identity-initialization-review"],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "requires-governed-access",
          "requires-identity-review-context",
        ],
        redactionRequirements: [
          "redact-user-email-before-public-disclosure",
          "redact-tenant-id-before-public-disclosure",
        ],
        consentRequirements: ["user-account-initialization-consent"],
      }
    );

    const identity = await ensureDurableIdentity({
      email,
      name: body.name ?? null,
      role,
      tenantId: body.tenantId ?? null,
      traceId,
      source: "api.auth.init",
      metadata: {
        ...(body.metadata ?? {}),
        requestedRole: requestedRole ?? null,
        assignedRole: role,
        elevatedRoleRequiresRoleProvisioning,
      },
    });

    const userResponse = toPublicUserIdentity(identity.user);

    const classifiedOutput = classifyRecord(
      {
        user: userResponse,
        created: identity.created,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "security",
        classificationSource: "api-auth-init-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "governance"],
        sharingPermissions: ["identity-initialization-review"],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-public-user-data",
          "requires-governed-access",
        ],
        redactionRequirements: [
          "redact-user-email-before-public-disclosure",
          "redact-tenant-id-before-public-disclosure",
        ],
        consentRequirements: ["user-account-initialization-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "auth_initialization",
      audience: "internal",
      claimType: "fact",
      summary:
        "User identity initialization completed through governed runtime controls and durable identity state.",
      ruleVersion: "auth-init-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: false,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        userId: identity.user.id,
        tenantId: identity.user.tenantId,
        created: identity.created,
        requestedRole: requestedRole ?? null,
        assignedRole: role,
      },
    });

    const observability = createObservabilityEvent({
      eventType: identity.created ? "AUTH_USER_CREATED" : "AUTH_USER_RETURNED",
      domain: "security",
      severity: "INFO",
      message: "Auth initialization completed through runtime governance.",
      traceId,
      replayRef: traceId,
      actorId: identity.user.id,
      module: "api.auth.init",
      metadata: {
        userId: identity.user.id,
        tenantId: identity.user.tenantId,
        created: identity.created,
        versionRuntimeOk: versionRuntime.ok,
        durableGovernanceEvidence: true,
        requestedRole: requestedRole ?? null,
        assignedRole: role,
        elevatedRoleRequiresRoleProvisioning,
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      route: "/api/auth/init",
      operation: "auth.init",
      module: "api.auth.init",
      versionRuntime,
      classifications: [
        {
          resourceType: "auth_init_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/auth/init",
            stage: "input",
          },
        },
        {
          resourceType: "auth_init_output",
          resourceId: identity.user.id,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/auth/init",
            stage: "output",
            created: identity.created,
          },
        },
      ],
      observability,
      sourceVersion: "auth-init-api-v0.1.0",
      result: {
        userId: identity.user.id,
        created: identity.created,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      user: userResponse,
      created: identity.created,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "AUTH_INIT_RUNTIME_ERROR",
      domain: "security",
      severity: "ERROR",
      message: "Auth initialization encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.auth.init",
      metadata: {
        route: "/api/auth/init",
        error:
          error instanceof Error ? error.message : "Unknown auth init error.",
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      route: "/api/auth/init",
      operation: "auth.init",
      module: "api.auth.init",
      observability,
      sourceVersion: "auth-init-api-v0.1.0",
      metadata: {
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown auth init error.",
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
