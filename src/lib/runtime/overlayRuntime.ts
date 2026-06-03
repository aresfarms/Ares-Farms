/**
 * Overlay Resolution Runtime
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces constitutional supremacy over lower-tier overlays.
 *
 * - Vol II: Regulatory Governance
 *   Supports regulatory rule precedence and compliance-aware overlay routing.
 *
 * - Vol III: Technical Infrastructure
 *   Implements deterministic rule/overlay resolution and replay-safe lineage.
 *
 * - Vol IV: Operational Runbooks
 *   Supports escalation, dispute resolution, operational review, and audit.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Supports overlay resolution, version governance, explainability,
 *   observability, classification, and simulation equivalence.
 */

export type OverlayTier =
  | "constitutional"
  | "regulatory"
  | "technical"
  | "operational"
  | "canonical"
  | "lender"
  | "program"
  | "state"
  | "local";

export type OverlayEffect = "ALLOW" | "DENY" | "ESCALATE" | "CONSTRAIN";

export type OverlayRule = {
  overlayId: string;
  tier: OverlayTier;
  effect: OverlayEffect;
  priority: number;
  version: string;
  source: string;
  rationale: string;
  replayRef?: string | null;
  metadata?: Record<string, unknown>;
};

export type OverlayResolutionInput = {
  operation: string;
  subjectId?: string | null;
  overlays: OverlayRule[];
  traceId?: string | null;
};

export type OverlayConflict = {
  conflictId: string;
  winningOverlayId: string;
  losingOverlayId: string;
  reason: string;
};

export type OverlayResolutionResult = {
  allowed: boolean;
  effect: OverlayEffect;
  operation: string;
  subjectId: string | null;
  traceId: string;
  appliedOverlay: OverlayRule | null;
  evaluatedOverlays: OverlayRule[];
  conflicts: OverlayConflict[];
  explanation: string[];
  timestamp: string;
};

const TIER_WEIGHT: Record<OverlayTier, number> = {
  constitutional: 900,
  regulatory: 800,
  canonical: 750,
  technical: 700,
  operational: 600,
  program: 500,
  state: 450,
  local: 400,
  lender: 300,
};

function createOverlayTraceId(operation: string): string {
  return `overlay-${operation}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createConflictId(): string {
  return `overlay-conflict-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function compareOverlayPriority(a: OverlayRule, b: OverlayRule): number {
  const tierDifference = TIER_WEIGHT[b.tier] - TIER_WEIGHT[a.tier];

  if (tierDifference !== 0) {
    return tierDifference;
  }

  return b.priority - a.priority;
}

function effectAllows(effect: OverlayEffect): boolean {
  return effect === "ALLOW" || effect === "CONSTRAIN";
}

export function resolveOverlays(
  input: OverlayResolutionInput
): OverlayResolutionResult {
  const traceId = input.traceId ?? createOverlayTraceId(input.operation);

  const evaluatedOverlays = [...input.overlays].sort(compareOverlayPriority);
  const appliedOverlay = evaluatedOverlays[0] ?? null;

  const conflicts: OverlayConflict[] = [];

  if (appliedOverlay) {
    for (const overlay of evaluatedOverlays.slice(1)) {
      if (overlay.effect !== appliedOverlay.effect) {
        conflicts.push({
          conflictId: createConflictId(),
          winningOverlayId: appliedOverlay.overlayId,
          losingOverlayId: overlay.overlayId,
          reason:
            "Higher-tier or higher-priority overlay controlled deterministic resolution.",
        });
      }
    }
  }

  const effect = appliedOverlay?.effect ?? "ESCALATE";

  const explanation =
    appliedOverlay === null
      ? [
          "No overlays were available for deterministic resolution.",
          "Operation requires escalation until a governed overlay is attached.",
        ]
      : [
          `Overlay ${appliedOverlay.overlayId} controlled resolution.`,
          `Tier ${appliedOverlay.tier} with priority ${appliedOverlay.priority} was applied.`,
          appliedOverlay.rationale,
        ];

  return {
    allowed: effectAllows(effect),
    effect,
    operation: input.operation,
    subjectId: input.subjectId ?? null,
    traceId,
    appliedOverlay,
    evaluatedOverlays,
    conflicts,
    explanation,
    timestamp: new Date().toISOString(),
  };
}

export function requireOverlayApproval(
  input: OverlayResolutionInput
): OverlayResolutionResult {
  const result = resolveOverlays(input);

  if (!result.allowed) {
    throw new Error(
      `Overlay runtime blocked operation "${input.operation}" with effect "${result.effect}".`
    );
  }

  return result;
}
