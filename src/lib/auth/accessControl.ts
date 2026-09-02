/**
 * Backend Access Control Runtime
 *
 * Master Volume Governance:
 * - Vol I: Enforces constitutional role authority and accountable access.
 * - Vol II: Supports regulated access boundaries for borrower/operator data.
 * - Vol III: Provides deterministic backend authorization decisions.
 * - Vol IV: Supports escalation, incident review, and operational supervision.
 * - Vol V: Preserves source authority, observability, explainability,
 *   replayability, and controlled disclosure.
 */

export type AccessRole =
  | "anonymous"
  | "user"
  | "borrower"
  | "broker"
  | "lender"
  | "sponsor"
  | "operator"
  | "underwriter"
  | "auditor"
  | "government_official"
  | "attorney"
  | "admin"
  | "governance";

export type AccessDecision = {
  allowed: boolean;
  role: AccessRole;
  operation: string;
  module: string;
  traceId: string;
  reason: string;
  allowedRoles: AccessRole[];
  actorId?: string | null;
  tenantId?: string | null;
};

const ROLE_ALIASES: Record<string, AccessRole> = {
  anonymous: "anonymous",
  user: "user",
  borrower: "borrower",
  broker: "broker",
  lender: "lender",
  sponsor: "sponsor",
  operator: "operator",
  underwriter: "underwriter",
  auditor: "auditor",
  government_official: "government_official",
  regulator: "government_official",
  government: "government_official",
  attorney: "attorney",
  counsel: "attorney",
  admin: "admin",
  governance: "governance",
};

export function normalizeAccessRole(role: unknown): AccessRole {
  if (typeof role !== "string") {
    return "anonymous";
  }

  const normalized = role.trim().toLowerCase();

  return ROLE_ALIASES[normalized] ?? "user";
}

export function evaluateAccess(input: {
  role?: unknown;
  allowedRoles: AccessRole[];
  operation: string;
  module: string;
  traceId: string;
  actorId?: string | null;
  tenantId?: string | null;
}): AccessDecision {
  const role = normalizeAccessRole(input.role);
  const allowed = input.allowedRoles.includes(role);

  return {
    allowed,
    role,
    operation: input.operation,
    module: input.module,
    traceId: input.traceId,
    reason: allowed
      ? "Role is authorized for this backend operation."
      : "Role is not authorized for this backend operation.",
    allowedRoles: input.allowedRoles,
    actorId: input.actorId ?? null,
    tenantId: input.tenantId ?? null,
  };
}

export function getRoleFromMetadata(metadata?: Record<string, unknown> | null) {
  return normalizeAccessRole(metadata?.role ?? metadata?.actorRole);
}
