import {
  persistGovernanceEvidence,
  type ClassificationEvidenceInput,
  type GovernanceEvidenceReceipt,
} from "@/lib/governance/evidenceStore";
import type { ObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import type { VersionRuntimeResult } from "@/lib/runtime/versionRuntime";

/**
 * API Route Governance Evidence Helper
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional evidence for governed route execution.
 * - Vol II: Supports regulated review and examination-safe evidence handling.
 * - Vol III: Centralizes replay-safe evidence persistence for route runtimes.
 * - Vol IV: Supports operational review, escalation, recovery, and audit prep.
 * - Vol V: Enforces canonical version, observability, classification, replay,
 *   and evidence-preservation doctrine without duplicating route logic.
 */

type RouteGovernanceEvidenceInput = {
  traceId: string;
  replayRef?: string | null;
  route: string;
  operation: string;
  module: string;
  versionRuntime?: VersionRuntimeResult | null;
  classifications?: ClassificationEvidenceInput[];
  observability?: ObservabilityEvent | null;
  sourceVersion: string;
  targetType?: string;
  targetId?: string | null;
  eventCount?: number;
  mismatchCount?: number;
  deterministic?: boolean;
  replaySafe?: boolean;
  verificationStatus?: string;
  result?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export async function persistRouteGovernanceEvidence(
  input: RouteGovernanceEvidenceInput
): Promise<GovernanceEvidenceReceipt> {
  const replayRef = input.replayRef ?? input.traceId;
  const replaySafe = input.replaySafe ?? input.versionRuntime?.replaySafe ?? true;
  const versionRuntimeOk = input.versionRuntime?.ok ?? true;

  return persistGovernanceEvidence({
    traceId: input.traceId,
    replayRef,
    versionRuntime: input.versionRuntime ?? null,
    classifications: input.classifications ?? [],
    observability: input.observability ?? null,
    replayVerification: input.versionRuntime
      ? {
          traceId: input.traceId,
          replayRef,
          targetType: input.targetType ?? "api_route",
          targetId: input.targetId ?? input.module,
          verificationStatus:
            input.verificationStatus ?? (versionRuntimeOk ? "PASS" : "WARN"),
          deterministic: input.deterministic ?? true,
          replaySafe,
          sourceVersion: input.sourceVersion,
          replayVersion: "governance-evidence-store-v0.1.0",
          eventCount: input.eventCount ?? 1,
          mismatchCount:
            input.mismatchCount ?? (versionRuntimeOk && replaySafe ? 0 : 1),
          result: {
            versionRuntimeOk,
            replaySafe,
            ...(input.result ?? {}),
          },
          metadata: {
            route: input.route,
            operation: input.operation,
            module: input.module,
            ...(input.metadata ?? {}),
          },
        }
      : null,
    metadata: {
      route: input.route,
      operation: input.operation,
      module: input.module,
      ...(input.metadata ?? {}),
    },
  });
}
