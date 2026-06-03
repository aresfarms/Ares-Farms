/**
 * Simulation / Sandbox Equivalence Runtime
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Preserves constitutional accountability during non-production execution.
 *
 * - Vol II: Regulatory Governance
 *   Prevents simulated eligibility, scoring, or compliance outputs from being
 *   confused with production determinations.
 *
 * - Vol III: Technical Infrastructure
 *   Supports deterministic replay, sandbox isolation, certification testing,
 *   and deployment-safe equivalence validation.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational rehearsal, incident simulation, recovery validation,
 *   and controlled production cutover.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Implements simulation/sandbox equivalence, replayability,
 *   observability, versioning, and explainability requirements.
 */

export type SimulationMode =
  | "sandbox"
  | "replay"
  | "shadow"
  | "certification"
  | "disaster_recovery";

export type SimulationEquivalenceStatus =
  | "equivalent"
  | "divergent"
  | "not_comparable";

export type SimulationRuntimeInput<TInput = unknown, TOutput = unknown> = {
  simulationId?: string | null;
  mode: SimulationMode;
  operation: string;
  input: TInput;
  simulatedOutput: TOutput;
  canonicalOutput?: TOutput | null;
  schemaVersion?: string | null;
  ruleVersion?: string | null;
  modelVersion?: string | null;
  overlayVersion?: string | null;
  replayRef?: string | null;
  traceId?: string | null;
  metadata?: Record<string, unknown>;
};

export type SimulationRuntimeResult<TInput = unknown, TOutput = unknown> = {
  simulationId: string;
  mode: SimulationMode;
  operation: string;
  input: TInput;
  simulatedOutput: TOutput;
  canonicalOutput: TOutput | null;
  equivalenceStatus: SimulationEquivalenceStatus;
  divergenceReason: string | null;
  productionEligible: boolean;
  versions: {
    schemaVersion: string | null;
    ruleVersion: string | null;
    modelVersion: string | null;
    overlayVersion: string | null;
  };
  replayRef: string | null;
  traceId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
};

function createSimulationId(operation: string): string {
  return `sim-${operation}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createTraceId(operation: string): string {
  return `sim-trace-${operation}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function compareOutputs(
  simulatedOutput: unknown,
  canonicalOutput: unknown | null | undefined
): {
  status: SimulationEquivalenceStatus;
  reason: string | null;
} {
  if (canonicalOutput === null || canonicalOutput === undefined) {
    return {
      status: "not_comparable",
      reason:
        "No canonical output was provided for simulation equivalence comparison.",
    };
  }

  const simulated = stableStringify(simulatedOutput);
  const canonical = stableStringify(canonicalOutput);

  if (simulated === canonical) {
    return {
      status: "equivalent",
      reason: null,
    };
  }

  return {
    status: "divergent",
    reason:
      "Simulated output does not match canonical output under stable deterministic comparison.",
  };
}

export function evaluateSimulationRuntime<TInput = unknown, TOutput = unknown>(
  input: SimulationRuntimeInput<TInput, TOutput>
): SimulationRuntimeResult<TInput, TOutput> {
  const comparison = compareOutputs(
    input.simulatedOutput,
    input.canonicalOutput
  );

  const productionEligible =
    comparison.status === "equivalent" &&
    Boolean(input.schemaVersion) &&
    Boolean(input.replayRef);

  return {
    simulationId:
      input.simulationId ?? createSimulationId(input.operation),
    mode: input.mode,
    operation: input.operation,
    input: input.input,
    simulatedOutput: input.simulatedOutput,
    canonicalOutput: input.canonicalOutput ?? null,
    equivalenceStatus: comparison.status,
    divergenceReason: comparison.reason,
    productionEligible,
    versions: {
      schemaVersion: input.schemaVersion ?? null,
      ruleVersion: input.ruleVersion ?? null,
      modelVersion: input.modelVersion ?? null,
      overlayVersion: input.overlayVersion ?? null,
    },
    replayRef: input.replayRef ?? null,
    traceId: input.traceId ?? createTraceId(input.operation),
    metadata: input.metadata ?? {},
    timestamp: new Date().toISOString(),
  };
}

export function assertSimulationProductionEligible<TInput, TOutput>(
  input: SimulationRuntimeInput<TInput, TOutput>
): SimulationRuntimeResult<TInput, TOutput> {
  const result = evaluateSimulationRuntime(input);

  if (!result.productionEligible) {
    throw new Error(
      `Simulation "${result.simulationId}" is not production eligible: ${
        result.divergenceReason ?? "missing required governed runtime metadata"
      }`
    );
  }

  return result;
}
