/**
 * Observability Event Runtime
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Supports audit openness, data immutability, and operational accountability.
 *
 * - Vol II: Regulatory Governance
 *   Supports regulatory examination, compliance evidence, and incident review.
 *
 * - Vol III: Technical Infrastructure
 *   Implements replay-safe observability, runtime telemetry, and anomaly hooks.
 *
 * - Vol IV: Operational Runbooks
 *   Supports incident escalation, recovery, monitoring, and operational review.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Supports observability, anomaly detection, replayability, and explainability.
 */

export type ObservabilitySeverity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export type ObservabilityDomain =
  | "runtime"
  | "ledger"
  | "replay"
  | "classification"
  | "versioning"
  | "overlay"
  | "ai"
  | "connector"
  | "security"
  | "operations";

export type ObservabilityEventInput = {
  eventType: string;
  domain: ObservabilityDomain;
  severity?: ObservabilitySeverity;
  message: string;
  traceId?: string | null;
  replayRef?: string | null;
  actorId?: string | null;
  module?: string | null;
  metadata?: Record<string, unknown>;
};

export type ObservabilityEvent = {
  id: string;
  eventType: string;
  domain: ObservabilityDomain;
  severity: ObservabilitySeverity;
  message: string;
  traceId: string;
  replayRef: string | null;
  actorId: string | null;
  module: string | null;
  metadata: Record<string, unknown>;
  anomalyCandidate: boolean;
  timestamp: string;
};

function createObservabilityId(eventType: string): string {
  return `obs-${eventType}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isAnomalyCandidate(severity: ObservabilitySeverity): boolean {
  return severity === "ERROR" || severity === "CRITICAL";
}

export function createObservabilityEvent(
  input: ObservabilityEventInput
): ObservabilityEvent {
  const severity = input.severity ?? "INFO";

  return {
    id: createObservabilityId(input.eventType),
    eventType: input.eventType,
    domain: input.domain,
    severity,
    message: input.message,
    traceId: input.traceId ?? createTraceId(),
    replayRef: input.replayRef ?? null,
    actorId: input.actorId ?? null,
    module: input.module ?? null,
    metadata: input.metadata ?? {},
    anomalyCandidate: isAnomalyCandidate(severity),
    timestamp: new Date().toISOString(),
  };
}

export function createRuntimeObservedResult<T extends Record<string, unknown>>(
  result: T,
  event: ObservabilityEvent
): T & { observability: ObservabilityEvent } {
  return {
    ...result,
    observability: event,
  };
}

export function createAnomalyEvent(
  input: Omit<ObservabilityEventInput, "severity">
): ObservabilityEvent {
  return createObservabilityEvent({
    ...input,
    severity: "CRITICAL",
  });
}
