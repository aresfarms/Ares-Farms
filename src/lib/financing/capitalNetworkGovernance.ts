import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { CAPITAL_NETWORK_RUNTIME_VERSION } from "@/lib/financing/capitalNetworkRuntime";

export const CAPITAL_NETWORK_SCHEMA_VERSION = "capital-network-schema-v1.0.0";
export const CAPITAL_NETWORK_GOVERNANCE_VERSION = "capital-network-v1.0.0";

export function capitalNetworkGovernanceContext(input: {
  operation: string;
  traceId: string;
  actorId: string | null;
  classificationLevel?: "CONFIDENTIAL" | "RESTRICTED";
  metadata?: Record<string, unknown>;
}) {
  const classificationLevel = input.classificationLevel ?? "CONFIDENTIAL";
  const runtimeGuard = runRuntimeGuard({
    operation: input.operation,
    module: "capital-network",
    traceId: input.traceId,
    schemaVersion: CAPITAL_NETWORK_SCHEMA_VERSION,
    governanceVersion: CAPITAL_NETWORK_GOVERNANCE_VERSION,
    classificationLevel,
    replayRef: input.traceId,
    actorId: input.actorId,
    metadata: input.metadata,
  });
  const versionRuntime = evaluateVersionRuntime({
    operation: input.operation,
    module: "capital-network",
    traceId: input.traceId,
    versions: [
      createRuntimeVersionRef(
        "schema",
        CAPITAL_NETWORK_SCHEMA_VERSION,
        "src/db/schema/capitalNetwork.ts",
        input.traceId,
      ),
      createRuntimeVersionRef(
        "rules",
        CAPITAL_NETWORK_RUNTIME_VERSION,
        "src/lib/financing/capitalNetworkRuntime.ts",
        input.traceId,
      ),
      createRuntimeVersionRef(
        "governance",
        CAPITAL_NETWORK_GOVERNANCE_VERSION,
        "docs/CAPITAL_NETWORK_MULTI_PROVIDER_2026-09-04.md",
        input.traceId,
      ),
    ],
  });
  return { runtimeGuard, versionRuntime };
}

export async function recordCapitalNetworkEvidence(input: {
  traceId: string;
  operation: string;
  actorId: string | null;
  eventType: string;
  message: string;
  severity?: "INFO" | "WARN" | "ERROR";
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const context = capitalNetworkGovernanceContext({
    operation: input.operation,
    traceId: input.traceId,
    actorId: input.actorId,
    classificationLevel: "RESTRICTED",
    metadata: input.metadata,
  });
  const observability = createObservabilityEvent({
    eventType: input.eventType,
    domain: "operations",
    severity: input.severity ?? "INFO",
    message: input.message,
    traceId: input.traceId,
    replayRef: input.traceId,
    actorId: input.actorId,
    module: "capital-network",
    metadata: input.metadata,
  });
  const evidence = await persistGovernanceEvidence({
    traceId: input.traceId,
    replayRef: input.traceId,
    versionRuntime: context.versionRuntime,
    observability,
    replayVerification: {
      traceId: input.traceId,
      replayRef: input.traceId,
      targetType: "capital_network_operation",
      targetId: input.targetId ?? input.operation,
      verificationStatus: context.versionRuntime.ok ? "PASS" : "WARN",
      deterministic: true,
      replaySafe: context.versionRuntime.replaySafe,
      sourceVersion: CAPITAL_NETWORK_RUNTIME_VERSION,
      replayVersion: CAPITAL_NETWORK_GOVERNANCE_VERSION,
      eventCount: 1,
      mismatchCount: context.versionRuntime.ok ? 0 : 1,
      result: { operation: input.operation, targetId: input.targetId ?? null },
      metadata: input.metadata,
    },
    metadata: {
      operation: input.operation,
      targetId: input.targetId ?? null,
      ...(input.metadata ?? {}),
    },
  });
  return { ...context, observability, evidence };
}
