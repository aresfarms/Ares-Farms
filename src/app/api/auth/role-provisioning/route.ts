import { NextRequest, NextResponse } from "next/server";

import {
  evaluateRoleProvisioningPolicy,
  extractSessionAuthorityFromHeaders,
} from "@/lib/auth/authActivationPolicy";
import { provisionUserRole } from "@/lib/auth/roleProvisioningStore";
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
 * Governed Role Provisioning API
 *
 * Master Volume Governance:
 * - Vol I: Prevents role authority from being created by caller-claimed
 *   request body values.
 * - Vol II: Protects regulated borrower/operator data by requiring governed
 *   role assignment.
 * - Vol III: Provides replay-safe, versioned, durable role provisioning.
 * - Vol IV: Supports access review, operational recovery, and incident
 *   response.
 * - Vol V: Preserves source authority, controlled disclosure, classification,
 *   observability, replayability, and governance evidence.
 */

export const runtime = "nodejs";

type RoleProvisioningRequest = {
  targetUserId?: string | null;
  targetEmail?: string | null;
  targetName?: string | null;
  targetRole?: string | null;
  targetTenantId?: string | null;
  reason?: string | null;
  operatorAttestation?: string | null;
  metadata?: Record<string, unknown>;
};

function createRoleProvisioningTraceId(): string {
  return `auth-role-provisioning-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function publicUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  tenantId: string | null;
  governanceVersion: string | null;
  classification: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}) {
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

export async function POST(req: NextRequest) {
  const traceId = createRoleProvisioningTraceId();
  const sessionAuthority = extractSessionAuthorityFromHeaders(req.headers);

  try {
    const body = (await req.json()) as RoleProvisioningRequest;
    const runtimeGuard = runRuntimeGuard({
      operation: "auth.role.provision",
      module: "api.auth.role-provisioning",
      traceId,
      schemaVersion: "auth-role-provisioning-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: sessionAuthority.actorId,
      metadata: {
        route: "/api/auth/role-provisioning",
        requesterRole: sessionAuthority.role,
        targetUserId: body.targetUserId ?? null,
        targetEmail: body.targetEmail ?? null,
        targetRole: body.targetRole ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "AUTH_ROLE_PROVISIONING_RUNTIME_BLOCKED",
        domain: "security",
        severity: "WARN",
        message: "Role provisioning was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: sessionAuthority.actorId,
        module: "api.auth.role-provisioning",
        metadata: {
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistRouteGovernanceEvidence({
        traceId,
        route: "/api/auth/role-provisioning",
        operation: "auth.role.provision",
        module: "api.auth.role-provisioning",
        observability,
        sourceVersion: "auth-role-provisioning-api-v0.1.0",
        metadata: {
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked role provisioning.",
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

    const policy = evaluateRoleProvisioningPolicy({
      requesterRole: sessionAuthority.role,
      targetRole: body.targetRole,
      hasAuthenticatedSession: sessionAuthority.authenticated,
      reason: body.reason,
      operatorAttestation: body.operatorAttestation,
    });

    if (!policy.allowed) {
      const observability = createObservabilityEvent({
        eventType: "AUTH_ROLE_PROVISIONING_POLICY_BLOCKED",
        domain: "security",
        severity: "WARN",
        message: "Role provisioning was blocked by activation policy.",
        traceId,
        replayRef: traceId,
        actorId: sessionAuthority.actorId,
        module: "api.auth.role-provisioning",
        metadata: {
          policy,
        },
      });

      const evidence = await persistRouteGovernanceEvidence({
        traceId,
        route: "/api/auth/role-provisioning",
        operation: "auth.role.provision",
        module: "api.auth.role-provisioning",
        observability,
        sourceVersion: "auth-role-provisioning-api-v0.1.0",
        metadata: {
          policyBlocked: true,
          policy,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role provisioning policy blocked this request.",
          governance: {
            traceId,
            runtimeGuard,
            policy,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "auth.role.provision",
      module: "api.auth.role-provisioning",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "auth-role-provisioning-request-v0.1.0",
          "src/app/api/auth/role-provisioning/route.ts",
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
          "auth-activation-policy-v0.1.0",
          "src/lib/auth/authActivationPolicy.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "auth-role-provisioning-api-v0.1.0",
          "api.auth.role-provisioning",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        targetUserId: body.targetUserId ?? null,
        targetEmail: body.targetEmail ?? null,
        targetRole: policy.targetRole,
        targetTenantId: body.targetTenantId ?? null,
        reason: body.reason ?? null,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-auth-role-provisioning-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "governance"],
        sharingPermissions: ["identity-access-review"],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "requires-governed-access",
          "requires-security-review-context",
        ],
        redactionRequirements: [
          "redact-user-email-before-public-disclosure",
          "redact-tenant-id-before-public-disclosure",
        ],
        consentRequirements: ["platform-access-administration"],
      }
    );

    const provisioned = await provisionUserRole({
      targetUserId: body.targetUserId ?? null,
      targetEmail: body.targetEmail ?? null,
      targetName: body.targetName ?? null,
      targetRole: policy.targetRole,
      targetTenantId: body.targetTenantId ?? null,
      provisionedBy: sessionAuthority.actorId ?? "unknown-session-actor",
      provisionedByRole: policy.requesterRole,
      traceId,
      reason: body.reason ?? "Governed role provisioning.",
      operatorAttestation:
        body.operatorAttestation ?? "Governed operator attestation.",
      metadata: body.metadata ?? {},
    });

    const classifiedOutput = classifyRecord(
      {
        user: publicUser(provisioned.user),
        previousRole: provisioned.previousRole,
        targetRole: provisioned.targetRole,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-auth-role-provisioning-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "governance"],
        sharingPermissions: ["identity-access-review"],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "requires-governed-access",
          "requires-security-review-context",
        ],
        redactionRequirements: [
          "redact-user-email-before-public-disclosure",
          "redact-tenant-id-before-public-disclosure",
        ],
        consentRequirements: ["platform-access-administration"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: provisioned.user.id,
      outputType: "role_provisioning",
      audience: "internal",
      claimType: "fact",
      summary:
        "User role was provisioned through authenticated session authority and governed role policy controls.",
      ruleVersion: "auth-activation-policy-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: false,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        previousRole: provisioned.previousRole,
        targetRole: provisioned.targetRole,
        provisionedBy: sessionAuthority.actorId,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "AUTH_ROLE_PROVISIONED",
      domain: "security",
      severity: "INFO",
      message: "User role was provisioned through governed auth controls.",
      traceId,
      replayRef: traceId,
      actorId: sessionAuthority.actorId,
      module: "api.auth.role-provisioning",
      metadata: {
        targetUserId: provisioned.user.id,
        previousRole: provisioned.previousRole,
        targetRole: provisioned.targetRole,
        targetTenantId: provisioned.targetTenantId,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      route: "/api/auth/role-provisioning",
      operation: "auth.role.provision",
      module: "api.auth.role-provisioning",
      versionRuntime,
      classifications: [
        {
          resourceType: "auth_role_provisioning_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
        },
        {
          resourceType: "auth_role_provisioning_output",
          resourceId: provisioned.user.id,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
        },
      ],
      observability,
      sourceVersion: "auth-role-provisioning-api-v0.1.0",
      targetType: "auth_role_provisioning",
      targetId: provisioned.user.id,
      result: {
        previousRole: provisioned.previousRole,
        targetRole: provisioned.targetRole,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      user: publicUser(provisioned.user),
      created: provisioned.created,
      previousRole: provisioned.previousRole,
      targetRole: provisioned.targetRole,
      governance: {
        traceId,
        runtimeGuard,
        policy,
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
      eventType: "AUTH_ROLE_PROVISIONING_RUNTIME_ERROR",
      domain: "security",
      severity: "ERROR",
      message: "Role provisioning encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      actorId: sessionAuthority.actorId,
      module: "api.auth.role-provisioning",
      metadata: {
        error:
          error instanceof Error
            ? error.message
            : "Unknown role provisioning error.",
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      route: "/api/auth/role-provisioning",
      operation: "auth.role.provision",
      module: "api.auth.role-provisioning",
      observability,
      sourceVersion: "auth-role-provisioning-api-v0.1.0",
      metadata: {
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown role provisioning error.",
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
