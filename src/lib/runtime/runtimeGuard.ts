/**
 * Canonical Runtime Guard Layer
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces constitutional rule supremacy before runtime execution.
 *
 * - Vol II: Regulatory Governance
 *   Preserves regulatory review, classification, and compliance posture.
 *
 * - Vol III: Technical Infrastructure
 *   Enforces replay-safe, schema-safe, deterministic runtime execution.
 *
 * - Vol IV: Operational Runbooks
 *   Provides operational guardrail outputs for escalation and recovery.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces canonical classification, replay, observability,
 *   explainability, and version-lineage requirements.
 *
 * Purpose:
 * This module is the canonical runtime guard entrypoint.
 * All materially significant backend workflows should pass through this
 * guard before execution as the runtime governance layer is expanded.
 */

export type RuntimeGuardSeverity = "INFO" | "WARN" | "BLOCK";

export type RuntimeGuardDomain =
  | "constitutional"
  | "schema"
  | "replay"
  | "classification"
  | "observability"
  | "versioning"
  | "federation"
  | "explainability";

export type RuntimeGuardInput = {
  operation: string;
  module: string;
  actorId?: string | null;
  schemaVersion?: string | null;
  governanceVersion?: string | null;
  classificationLevel?: string | null;
  replayRef?: string | null;
  traceId?: string | null;
  metadata?: Record<string, unknown>;
};

export type RuntimeGuardFinding = {
  domain: RuntimeGuardDomain;
  severity: RuntimeGuardSeverity;
  code: string;
  message: string;
};

export type RuntimeGuardResult = {
  allowed: boolean;
  operation: string;
  module: string;
  traceId: string;
  findings: RuntimeGuardFinding[];
  governance: {
    constitutionalReviewRequired: boolean;
    replayRequired: boolean;
    classificationRequired: boolean;
    observabilityRequired: boolean;
    versionLineageRequired: boolean;
  };
  timestamp: string;
};

function createRuntimeTraceId(operation: string): string {
  return `runtime-${operation}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeClassification(
  classificationLevel?: string | null
): string | null {
  if (!classificationLevel) {
    return null;
  }

  return classificationLevel.trim().toUpperCase();
}

export function runRuntimeGuard(input: RuntimeGuardInput): RuntimeGuardResult {
  const findings: RuntimeGuardFinding[] = [];
  const traceId = input.traceId ?? createRuntimeTraceId(input.operation);

  if (!input.operation || input.operation.trim().length === 0) {
    findings.push({
      domain: "constitutional",
      severity: "BLOCK",
      code: "MISSING_OPERATION",
      message: "Runtime operation name is required for governance validation.",
    });
  }

  if (!input.module || input.module.trim().length === 0) {
    findings.push({
      domain: "schema",
      severity: "BLOCK",
      code: "MISSING_MODULE",
      message: "Runtime module name is required for schema authority validation.",
    });
  }

  if (!input.schemaVersion) {
    findings.push({
      domain: "schema",
      severity: "WARN",
      code: "MISSING_SCHEMA_VERSION",
      message:
        "Schema version is missing. Runtime may proceed during migration stabilization, but this must be enforced before production hardening.",
    });
  }

  if (!input.governanceVersion) {
    findings.push({
      domain: "versioning",
      severity: "WARN",
      code: "MISSING_GOVERNANCE_VERSION",
      message:
        "Governance version is missing. Version lineage must be attached before production runtime enforcement.",
    });
  }

  if (!input.replayRef) {
    findings.push({
      domain: "replay",
      severity: "WARN",
      code: "MISSING_REPLAY_REF",
      message:
        "Replay reference is missing. Material runtime operations must preserve replay lineage.",
    });
  }

  if (!normalizeClassification(input.classificationLevel)) {
    findings.push({
      domain: "classification",
      severity: "WARN",
      code: "MISSING_CLASSIFICATION",
      message:
        "Classification level is missing. Canonical classification propagation must attach before production runtime enforcement.",
    });
  }

  findings.push({
    domain: "observability",
    severity: "INFO",
    code: "RUNTIME_GUARD_EXECUTED",
    message: "Runtime guard executed and produced governance findings.",
  });

  const blocked = findings.some((finding) => finding.severity === "BLOCK");

  return {
    allowed: !blocked,
    operation: input.operation,
    module: input.module,
    traceId,
    findings,
    governance: {
      constitutionalReviewRequired: true,
      replayRequired: true,
      classificationRequired: true,
      observabilityRequired: true,
      versionLineageRequired: true,
    },
    timestamp: new Date().toISOString(),
  };
}

export function assertRuntimeAllowed(input: RuntimeGuardInput): RuntimeGuardResult {
  const result = runRuntimeGuard(input);

  if (!result.allowed) {
    throw new Error(
      `Runtime guard blocked operation "${input.operation}" in module "${input.module}".`
    );
  }

  return result;
}
