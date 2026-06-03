import { eq } from "drizzle-orm";

import { applications } from "@/db/schema";
import {
  AccessDecision,
  AccessRole,
  normalizeAccessRole,
} from "@/lib/auth/accessControl";
import { db } from "@/lib/db";

/**
 * Record-Level Authorization Runtime
 *
 * Master Volume Governance:
 * - Vol I: Enforces accountable access to specific governed records.
 * - Vol II: Protects borrower, application, document, review, and workflow
 *   records from cross-tenant or cross-borrower disclosure.
 * - Vol III: Provides deterministic record-scope authorization decisions.
 * - Vol IV: Supports operator escalation, review queues, and incident review.
 * - Vol V: Preserves controlled disclosure, observability, replayability,
 *   source authority, and evidence-ready access decisions.
 */

export type RecordResourceType =
  | "application"
  | "document"
  | "connector_request"
  | "rule_evaluation"
  | "human_review"
  | "adverse_action_review"
  | "regulated_decision_notice"
  | "borrower_notice_delivery"
  | "borrower_notice_delivery_receipt"
  | "borrower_notice_exception_resolution"
  | "borrower_report";

export type RecordAccessScope = {
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  userId?: string | null;
};

export type RecordAccessDecision = {
  allowed: boolean;
  role: AccessRole;
  operation: string;
  module: string;
  traceId: string;
  resourceType: RecordResourceType;
  reason: string;
  actorId?: string | null;
  requestedScope: RecordAccessScope;
  targetScope: RecordAccessScope;
  roleAccessAllowed: boolean;
  matchedScopes: string[];
  deniedScopes: string[];
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function sameWhenBothPresent(
  requested: string | null | undefined,
  target: string | null | undefined
): boolean {
  return Boolean(requested && target && requested === target);
}

function mismatchWhenBothPresent(
  requested: string | null | undefined,
  target: string | null | undefined
): boolean {
  return Boolean(requested && target && requested !== target);
}

function privilegedRole(role: AccessRole): boolean {
  return role === "admin" || role === "governance";
}

function institutionalRole(role: AccessRole): boolean {
  return (
    role === "operator" ||
    role === "underwriter" ||
    role === "auditor" ||
    role === "lender" ||
    role === "sponsor" ||
    privilegedRole(role)
  );
}

function borrowerRole(role: AccessRole): boolean {
  return role === "borrower" || role === "user";
}

function actorMatchesBorrowerScope(input: {
  actorId?: string | null;
  requestedScope: RecordAccessScope;
  targetScope: RecordAccessScope;
}): boolean {
  return (
    sameWhenBothPresent(input.actorId, input.targetScope.borrowerId) ||
    sameWhenBothPresent(input.actorId, input.targetScope.userId) ||
    sameWhenBothPresent(
      input.requestedScope.borrowerId,
      input.targetScope.borrowerId
    ) ||
    sameWhenBothPresent(input.requestedScope.userId, input.targetScope.userId)
  );
}

function tenantScopeMatches(input: {
  actorTenantId?: string | null;
  requestedTenantId?: string | null;
  targetTenantId?: string | null;
}): boolean {
  const actorTenantMatches = sameWhenBothPresent(
    input.actorTenantId,
    input.targetTenantId
  );
  const requestedTenantMatches = sameWhenBothPresent(
    input.requestedTenantId,
    input.targetTenantId
  );

  return (
    !input.targetTenantId ||
    actorTenantMatches ||
    requestedTenantMatches ||
    (!input.actorTenantId && !input.requestedTenantId)
  );
}

function evaluateLoadedRecordAccess(input: {
  access: AccessDecision;
  operation: string;
  module: string;
  traceId: string;
  resourceType: RecordResourceType;
  requestedScope: RecordAccessScope;
  targetScope: RecordAccessScope;
}): RecordAccessDecision {
  const role = normalizeAccessRole(input.access.role);
  const matchedScopes: string[] = [];
  const deniedScopes: string[] = [];

  if (!input.access.allowed) {
    return {
      allowed: false,
      role,
      operation: input.operation,
      module: input.module,
      traceId: input.traceId,
      resourceType: input.resourceType,
      reason: "Route-level role access was denied before record access.",
      actorId: input.access.actorId ?? null,
      requestedScope: input.requestedScope,
      targetScope: input.targetScope,
      roleAccessAllowed: false,
      matchedScopes,
      deniedScopes: ["role"],
    };
  }

  if (
    mismatchWhenBothPresent(
      input.requestedScope.applicationId,
      input.targetScope.applicationId
    )
  ) {
    deniedScopes.push("applicationId");
  }

  if (
    mismatchWhenBothPresent(
      input.requestedScope.borrowerId,
      input.targetScope.borrowerId
    )
  ) {
    deniedScopes.push("borrowerId");
  }

  if (
    mismatchWhenBothPresent(input.requestedScope.tenantId, input.targetScope.tenantId)
  ) {
    deniedScopes.push("tenantId");
  }

  if (
    borrowerRole(role) &&
    mismatchWhenBothPresent(input.requestedScope.userId, input.targetScope.userId)
  ) {
    deniedScopes.push("userId");
  }

  if (deniedScopes.length > 0) {
    return {
      allowed: false,
      role,
      operation: input.operation,
      module: input.module,
      traceId: input.traceId,
      resourceType: input.resourceType,
      reason: "Requested record scope does not match the canonical record.",
      actorId: input.access.actorId ?? null,
      requestedScope: input.requestedScope,
      targetScope: input.targetScope,
      roleAccessAllowed: true,
      matchedScopes,
      deniedScopes,
    };
  }

  if (privilegedRole(role)) {
    matchedScopes.push("privileged-role");

    return {
      allowed: true,
      role,
      operation: input.operation,
      module: input.module,
      traceId: input.traceId,
      resourceType: input.resourceType,
      reason: "Privileged role is authorized for governed cross-record access.",
      actorId: input.access.actorId ?? null,
      requestedScope: input.requestedScope,
      targetScope: input.targetScope,
      roleAccessAllowed: true,
      matchedScopes,
      deniedScopes,
    };
  }

  if (institutionalRole(role)) {
    const tenantMatches = tenantScopeMatches({
      actorTenantId: input.access.tenantId,
      requestedTenantId: input.requestedScope.tenantId,
      targetTenantId: input.targetScope.tenantId,
    });

    if (tenantMatches) {
      matchedScopes.push("tenant");
    } else {
      deniedScopes.push("tenant");
    }

    return {
      allowed: tenantMatches,
      role,
      operation: input.operation,
      module: input.module,
      traceId: input.traceId,
      resourceType: input.resourceType,
      reason: tenantMatches
        ? "Institutional role is authorized within the record tenant scope."
        : "Institutional role is outside the record tenant scope.",
      actorId: input.access.actorId ?? null,
      requestedScope: input.requestedScope,
      targetScope: input.targetScope,
      roleAccessAllowed: true,
      matchedScopes,
      deniedScopes,
    };
  }

  if (borrowerRole(role)) {
    const borrowerMatches = actorMatchesBorrowerScope({
      actorId: input.access.actorId,
      requestedScope: input.requestedScope,
      targetScope: input.targetScope,
    });
    const tenantMatches = tenantScopeMatches({
      actorTenantId: input.access.tenantId,
      requestedTenantId: input.requestedScope.tenantId,
      targetTenantId: input.targetScope.tenantId,
    });

    if (borrowerMatches) {
      matchedScopes.push("borrower");
    } else {
      deniedScopes.push("borrower");
    }

    if (tenantMatches) {
      matchedScopes.push("tenant");
    } else {
      deniedScopes.push("tenant");
    }

    return {
      allowed: borrowerMatches && tenantMatches,
      role,
      operation: input.operation,
      module: input.module,
      traceId: input.traceId,
      resourceType: input.resourceType,
      reason:
        borrowerMatches && tenantMatches
          ? "Borrower role is authorized for its own governed record."
          : "Borrower role is not authorized for this governed record.",
      actorId: input.access.actorId ?? null,
      requestedScope: input.requestedScope,
      targetScope: input.targetScope,
      roleAccessAllowed: true,
      matchedScopes,
      deniedScopes,
    };
  }

  return {
    allowed: false,
    role,
    operation: input.operation,
    module: input.module,
    traceId: input.traceId,
    resourceType: input.resourceType,
    reason: "Role does not have a governed record access rule.",
    actorId: input.access.actorId ?? null,
    requestedScope: input.requestedScope,
    targetScope: input.targetScope,
    roleAccessAllowed: true,
    matchedScopes,
    deniedScopes: ["role"],
  };
}

export async function evaluateApplicationRecordAccess(input: {
  access: AccessDecision;
  operation: string;
  module: string;
  traceId: string;
  resourceType: RecordResourceType;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  userId?: string | null;
  allowMissingApplication?: boolean;
}): Promise<RecordAccessDecision> {
  const applicationId = normalizeText(input.applicationId);
  const requestedScope = {
    applicationId,
    borrowerId: normalizeText(input.borrowerId),
    tenantId: normalizeText(input.tenantId),
    userId: normalizeText(input.userId),
  };

  if (!applicationId && input.allowMissingApplication) {
    const hasCreationScope = Boolean(
      requestedScope.borrowerId || requestedScope.tenantId || requestedScope.userId
    );

    if (hasCreationScope) {
      return evaluateLoadedRecordAccess({
        access: input.access,
        operation: input.operation,
        module: input.module,
        traceId: input.traceId,
        resourceType: input.resourceType,
        requestedScope,
        targetScope: requestedScope,
      });
    }
  }

  if (!applicationId) {
    return {
      allowed: false,
      role: normalizeAccessRole(input.access.role),
      operation: input.operation,
      module: input.module,
      traceId: input.traceId,
      resourceType: input.resourceType,
      reason: "Application record access requires an applicationId.",
      actorId: input.access.actorId ?? null,
      requestedScope,
      targetScope: {
        applicationId: null,
        borrowerId: null,
        tenantId: null,
        userId: null,
      },
      roleAccessAllowed: input.access.allowed,
      matchedScopes: [],
      deniedScopes: ["applicationId"],
    };
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  const application = rows[0] ?? null;

  if (!application && input.allowMissingApplication) {
    return evaluateLoadedRecordAccess({
      access: input.access,
      operation: input.operation,
      module: input.module,
      traceId: input.traceId,
      resourceType: input.resourceType,
      requestedScope,
      targetScope: requestedScope,
    });
  }

  if (!application) {
    return {
      allowed: false,
      role: normalizeAccessRole(input.access.role),
      operation: input.operation,
      module: input.module,
      traceId: input.traceId,
      resourceType: input.resourceType,
      reason: "Application record was not found for record-level access.",
      actorId: input.access.actorId ?? null,
      requestedScope,
      targetScope: {
        applicationId,
        borrowerId: null,
        tenantId: null,
        userId: null,
      },
      roleAccessAllowed: input.access.allowed,
      matchedScopes: [],
      deniedScopes: ["application"],
    };
  }

  return evaluateLoadedRecordAccess({
    access: input.access,
    operation: input.operation,
    module: input.module,
    traceId: input.traceId,
    resourceType: input.resourceType,
    requestedScope,
    targetScope: {
      applicationId: application.id,
      borrowerId: application.borrowerId,
      tenantId: application.tenantId,
      userId: application.userId,
    },
  });
}
