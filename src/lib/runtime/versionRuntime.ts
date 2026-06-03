/**
 * Canonical Version Runtime Registry
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces rule supremacy and amendment/version lineage.
 *
 * - Vol II: Regulatory Governance
 *   Preserves regulatory version context for governed decisions.
 *
 * - Vol III: Technical Infrastructure
 *   Implements versioned schemas, rules, models, overlays, and runtime state.
 *
 * - Vol IV: Operational Runbooks
 *   Supports rollback, recovery, audit review, and promotion procedures.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces canonical versioning, replay reconstruction,
 *   migration lineage, and historical reproducibility.
 */

export type RuntimeVersionDomain =
  | "schema"
  | "governance"
  | "rules"
  | "model"
  | "overlay"
  | "api"
  | "ledger"
  | "classification"
  | "runtime";

export type RuntimeVersionRef = {
  domain: RuntimeVersionDomain;
  version: string;
  effectiveAt: string;
  source: string;
  replayRef?: string | null;
};

export type VersionRuntimeInput = {
  operation: string;
  module: string;
  versions?: RuntimeVersionRef[];
  traceId?: string | null;
  metadata?: Record<string, unknown>;
};

export type VersionRuntimeResult = {
  ok: boolean;
  operation: string;
  module: string;
  traceId: string;
  versions: RuntimeVersionRef[];
  missingDomains: RuntimeVersionDomain[];
  replaySafe: boolean;
  timestamp: string;
};

const REQUIRED_VERSION_DOMAINS: RuntimeVersionDomain[] = [
  "schema",
  "governance",
  "runtime",
];

function createVersionTraceId(operation: string): string {
  return `version-${operation}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function hasDomain(
  versions: RuntimeVersionRef[],
  domain: RuntimeVersionDomain
): boolean {
  return versions.some((versionRef) => versionRef.domain === domain);
}

export function evaluateVersionRuntime(
  input: VersionRuntimeInput
): VersionRuntimeResult {
  const traceId = input.traceId ?? createVersionTraceId(input.operation);
  const versions = input.versions ?? [];

  const missingDomains = REQUIRED_VERSION_DOMAINS.filter(
    (domain) => !hasDomain(versions, domain)
  );

  const replaySafe = versions.every((versionRef) => {
    return (
      versionRef.version.trim().length > 0 &&
      versionRef.effectiveAt.trim().length > 0 &&
      versionRef.source.trim().length > 0
    );
  });

  return {
    ok: missingDomains.length === 0 && replaySafe,
    operation: input.operation,
    module: input.module,
    traceId,
    versions,
    missingDomains,
    replaySafe,
    timestamp: new Date().toISOString(),
  };
}

export function createRuntimeVersionRef(
  domain: RuntimeVersionDomain,
  version: string,
  source: string,
  replayRef?: string | null
): RuntimeVersionRef {
  return {
    domain,
    version,
    source,
    replayRef: replayRef ?? null,
    effectiveAt: new Date().toISOString(),
  };
}
