import {
  SOURCE_AUTHORITY_REGISTRY,
  SOURCE_INTELLIGENCE_VERSION,
  SourceAuthorityProfile,
} from "@/lib/source-intelligence/sourceIntelligenceRuntime";

/**
 * Connector Certification Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps connector certification subordinate to constitutional
 *   authority; certification posture describes accountable internal
 *   readiness and never replaces external promotion, public verification,
 *   or live external execution.
 * - Vol II: blocks the runtime from claiming live external action, public
 *   verification, regulatory reliance, lender commitment, environmental
 *   clearance, payment authorization, or legal reliance.
 * - Vol III: provides deterministic, replay-safe composition of connector
 *   posture across review, certification evidence, rollback, monitoring,
 *   and activation checks.
 * - Vol III-B: supplies runtime evidence with version lineage,
 *   classification, observability, and explainability-ready posture.
 * - Vol IV: routes connector certification handoffs to the Module 10
 *   Connector Certification Console, Source Ingestion Gate, Live Scraper
 *   Activation Gate, Registry Framework, Governance Evidence Engine,
 *   Internal Certification Engine, Module 16 Evidence Packet Workspace,
 *   Audit Replay Console, Governance, and Reviews.
 * - Vol V: preserves canonical claims governance, controlled disclosure,
 *   replay, audit, portability, and source-authority boundaries.
 * - Vol VI-VII: keeps the runtime internal-only; no portable external
 *   conformance or live execution claim is created.
 *
 * Safety boundary:
 * - Connector certification posture is review-bound and internal evidence
 *   only.
 * - It does not authorize live external connector execution, live fetch,
 *   external promotion, public verification, regulatory reliance,
 *   environmental clearance, payment authorization, official report
 *   publication, or legal reliance.
 * - Live external connector execution remains blocked until qualified
 *   approval through the Source Promotion Authority, the Controlled
 *   Promotion Board, the Live Scraper Activation Gate, and any other
 *   gates named in the participant role registry.
 */

export const CONNECTOR_CERTIFICATION_RUNTIME_VERSION =
  "connector-certification-runtime-v0.1.0";

export type ConnectorDimensionId =
  | "review"
  | "certification_evidence"
  | "rollback"
  | "monitoring"
  | "activation_checks";

export type ConnectorCertificationStatus =
  | "CERTIFIED_INTERNAL_REVIEW_BOUND"
  | "REVIEW_PENDING"
  | "BLOCKED_BY_GATE"
  | "NOT_STARTED";

export type ConnectorDimensionInput = {
  status?: ConnectorCertificationStatus | null;
  readinessPercent?: number | null;
  checkpointsComplete?: number | null;
  totalCheckpoints?: number | null;
  evidenceRefs?: string[];
  blockingGates?: string[];
  reviewerRole?: string | null;
};

export type ConnectorInput = {
  connectorId: string;
  connectorName?: string | null;
  sourceAuthorityTier?: string | null;
  liveExecutionRequested?: boolean | null;
  dimensions?: Partial<Record<ConnectorDimensionId, ConnectorDimensionInput>>;
};

export type ConnectorCertificationEngineInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  scope?: {
    connectorIds?: string[];
  } | null;
  connectors?: ConnectorInput[];
  metadata?: Record<string, unknown> | null;
};

export type ConnectorDimensionResult = {
  id: ConnectorDimensionId;
  label: string;
  status: ConnectorCertificationStatus;
  readinessPercent: number;
  checkpointsComplete: number;
  totalCheckpoints: number;
  evidenceRefs: string[];
  blockingGates: string[];
  reviewSignals: string[];
  reviewRoute: string;
};

export type ConnectorPostureResult = {
  connectorId: string;
  connectorName: string;
  sourceAuthorityTier: string;
  baselineCertificationStatus: string;
  liveExecutionPosture:
    | "LIVE_EXECUTION_BLOCKED"
    | "PENDING_QUALIFIED_APPROVAL";
  overallStatus: ConnectorCertificationStatus;
  overallReadinessPercent: number;
  dimensions: ConnectorDimensionResult[];
  blockingGates: string[];
  blockedClaims: string[];
};

export type ConnectorCertificationSummary = {
  connectorCount: number;
  certifiedConnectorCount: number;
  pendingConnectorCount: number;
  blockedConnectorCount: number;
  notStartedConnectorCount: number;
  overallReadinessPercent: number;
  liveExecutionBlockedCount: number;
};

export type ConnectorCertificationResult = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  summary: ConnectorCertificationSummary;
  connectors: ConnectorPostureResult[];
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  connectorCertificationInternalOnly: true;
  liveExecutionBlocked: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLegalReliance: true;
};

const DEFAULT_BLOCKED_CLAIMS = [
  "live external action",
  "live fetch",
  "external promotion",
  "public verification",
  "regulatory reliance",
  "lender commitment",
  "environmental clearance",
  "payment authorization",
  "official report publication",
  "legal reliance",
] as const;

export const CONNECTOR_CERTIFICATION_DISCLOSURES = [
  "Connector certification posture is review-bound and internal evidence only.",
  "Connector certification does not authorize live external connector execution.",
  "Connector certification does not authorize live source fetch.",
  "Connector certification does not create external promotion, public verification, or regulatory reliance.",
  "Connector certification does not create a lender commitment, credit decision, environmental clearance, or payment authorization.",
  "Live external connector execution remains blocked until qualified approval through the Source Promotion Authority, the Controlled Promotion Board, and the Live Scraper Activation Gate.",
  "Human review is required before any connector posture signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const CONNECTOR_CERTIFICATION_PRODUCTION_RESTRICTIONS = [
  "no live external action",
  "no live fetch",
  "no external promotion",
  "no public verification",
  "no regulatory reliance",
  "no lender commitment",
  "no credit decision",
  "no environmental clearance",
  "no payment authorization",
  "no official report publication",
  "no notice send",
  "no legal reliance",
] as const;

const DIMENSION_LABELS: Record<ConnectorDimensionId, string> = {
  review: "Adapter review",
  certification_evidence: "Certification evidence",
  rollback: "Rollback readiness",
  monitoring: "Monitoring readiness",
  activation_checks: "Activation checks",
};

const DIMENSION_REVIEW_ROUTES: Record<ConnectorDimensionId, string> = {
  review: "/connectors",
  certification_evidence: "/governance/evidence-engine",
  rollback: "/connectors",
  monitoring: "/production-operations-monitoring",
  activation_checks: "/controlled-promotion-activation",
};

const DIMENSION_DEFAULT_BLOCKING_GATES: Record<ConnectorDimensionId, string[]> = {
  review: ["Module 10 Connector Certification Console (qualified human review)"],
  certification_evidence: [
    "Module 16 Evidence Packet Workspace (qualified evidence review)",
    "Governance Evidence Engine pack composition",
  ],
  rollback: [
    "Module 33 Production Operations Monitoring Gate rollback drill",
    "Module 34 Production Incident Response Readiness Gate rollback decision tree",
  ],
  monitoring: [
    "Module 33 Production Operations Monitoring Gate monitoring/alerting/SLOs activation",
  ],
  activation_checks: [
    "Module 22 Live Scraper Activation Gate qualified approval",
    "Module 26 Controlled Promotion Activation Gate qualified approval",
    "Module 37 Production Activation Ceremony Gate dual-control quorum",
  ],
};

function unique<T>(values: T[]): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];

  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const key =
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? value
        : JSON.stringify(value);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    out.push(value);
  }

  return out;
}

function clampCount(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.trunc(parsed);
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveDimensionStatus(
  input: ConnectorDimensionInput | undefined,
  blockingGates: string[],
  readinessPercent: number,
  totalCheckpoints: number
): ConnectorCertificationStatus {
  if (input?.status === "CERTIFIED_INTERNAL_REVIEW_BOUND") {
    return "CERTIFIED_INTERNAL_REVIEW_BOUND";
  }

  if (input?.status === "BLOCKED_BY_GATE") {
    return "BLOCKED_BY_GATE";
  }

  if (input?.status === "REVIEW_PENDING") {
    return "REVIEW_PENDING";
  }

  if (input?.status === "NOT_STARTED") {
    return "NOT_STARTED";
  }

  if (totalCheckpoints === 0 && readinessPercent === 0 && blockingGates.length === 0) {
    return "NOT_STARTED";
  }

  if (blockingGates.length > 0) {
    return "BLOCKED_BY_GATE";
  }

  if (readinessPercent >= 100) {
    return "CERTIFIED_INTERNAL_REVIEW_BOUND";
  }

  return "REVIEW_PENDING";
}

function summarizeDimension(
  id: ConnectorDimensionId,
  input: ConnectorDimensionInput | undefined,
  baselineBlocked: boolean
): ConnectorDimensionResult {
  const totalCheckpoints = clampCount(input?.totalCheckpoints);
  const checkpointsComplete = clampCount(input?.checkpointsComplete);
  const inputReadiness =
    typeof input?.readinessPercent === "number"
      ? clampPercent(input.readinessPercent)
      : totalCheckpoints > 0
        ? clampPercent((checkpointsComplete / Math.max(1, totalCheckpoints)) * 100)
        : 0;

  const explicitBlockingGates = Array.isArray(input?.blockingGates)
    ? input?.blockingGates ?? []
    : [];
  const defaultGates = baselineBlocked
    ? DIMENSION_DEFAULT_BLOCKING_GATES[id]
    : [];
  const blockingGates = unique([...explicitBlockingGates, ...defaultGates]);

  const status = resolveDimensionStatus(
    input,
    blockingGates,
    inputReadiness,
    totalCheckpoints
  );

  const reviewSignals: string[] = [
    "Connector certification is review-bound and internal evidence only.",
  ];

  if (blockingGates.length > 0 && status !== "CERTIFIED_INTERNAL_REVIEW_BOUND") {
    reviewSignals.push(
      `${blockingGates.length} promotion gate(s) remain blocked for this dimension.`
    );
  }

  if (status === "CERTIFIED_INTERNAL_REVIEW_BOUND") {
    reviewSignals.push(
      "Internal posture is certified review-bound. Live external connector execution remains blocked until qualified approval."
    );
  }

  if (status === "REVIEW_PENDING" && inputReadiness < 100) {
    reviewSignals.push(
      `Internal readiness for this dimension is ${inputReadiness}%; additional review remains pending.`
    );
  }

  return {
    id,
    label: DIMENSION_LABELS[id],
    status,
    readinessPercent: inputReadiness,
    checkpointsComplete,
    totalCheckpoints,
    evidenceRefs: unique(input?.evidenceRefs ?? []),
    blockingGates,
    reviewSignals,
    reviewRoute: DIMENSION_REVIEW_ROUTES[id],
  };
}

function deriveOverallStatus(
  dimensions: ConnectorDimensionResult[],
  baselineBlocked: boolean
): ConnectorCertificationStatus {
  if (dimensions.length === 0) {
    return "NOT_STARTED";
  }

  const blocked = dimensions.some(
    (dimension) => dimension.status === "BLOCKED_BY_GATE"
  );

  if (blocked) {
    return "BLOCKED_BY_GATE";
  }

  if (dimensions.every((dimension) => dimension.status === "NOT_STARTED")) {
    return "NOT_STARTED";
  }

  const allCertified = dimensions.every(
    (dimension) => dimension.status === "CERTIFIED_INTERNAL_REVIEW_BOUND"
  );

  if (allCertified && !baselineBlocked) {
    return "CERTIFIED_INTERNAL_REVIEW_BOUND";
  }

  if (allCertified && baselineBlocked) {
    return "BLOCKED_BY_GATE";
  }

  return "REVIEW_PENDING";
}

function buildConnectorPosture(
  connector: ConnectorInput,
  source: SourceAuthorityProfile | undefined
): ConnectorPostureResult {
  const baselineStatus =
    source?.connectorCertificationStatus ?? "REQUIRES_REVIEW";
  const baselineBlocked = baselineStatus !== "CERTIFIED";

  const dimensions: ConnectorDimensionResult[] = (
    [
      "review",
      "certification_evidence",
      "rollback",
      "monitoring",
      "activation_checks",
    ] as ConnectorDimensionId[]
  ).map((id) =>
    summarizeDimension(id, connector.dimensions?.[id], baselineBlocked)
  );

  const overallReadinessPercent = clampPercent(
    dimensions.reduce((sum, dimension) => sum + dimension.readinessPercent, 0) /
      dimensions.length
  );

  const overallStatus = deriveOverallStatus(dimensions, baselineBlocked);
  const blockingGates = unique(
    dimensions.flatMap((dimension) => dimension.blockingGates)
  );

  return {
    connectorId: connector.connectorId,
    connectorName:
      connector.connectorName ?? source?.sourceName ?? connector.connectorId,
    sourceAuthorityTier:
      connector.sourceAuthorityTier ?? source?.sourceAuthorityTier ?? "UNKNOWN",
    baselineCertificationStatus: baselineStatus,
    liveExecutionPosture: "LIVE_EXECUTION_BLOCKED",
    overallStatus,
    overallReadinessPercent,
    dimensions,
    blockingGates,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
  };
}

function resolveConnectorInputs(
  input: ConnectorCertificationEngineInput
): ConnectorInput[] {
  if (Array.isArray(input.connectors) && input.connectors.length > 0) {
    return input.connectors;
  }

  const explicitScope = input.scope?.connectorIds ?? [];
  const sources =
    explicitScope.length > 0
      ? SOURCE_AUTHORITY_REGISTRY.filter((entry) =>
          explicitScope.includes(entry.sourceId)
        )
      : SOURCE_AUTHORITY_REGISTRY;

  return sources.map((source) => ({
    connectorId: source.sourceId,
    connectorName: source.sourceName,
    sourceAuthorityTier: source.sourceAuthorityTier,
  }));
}

export function evaluateConnectorCertification(
  input: ConnectorCertificationEngineInput = {}
): ConnectorCertificationResult {
  const connectorInputs = resolveConnectorInputs(input);
  const sourceById = new Map(
    SOURCE_AUTHORITY_REGISTRY.map((entry) => [entry.sourceId, entry])
  );

  const connectors = connectorInputs.map((connector) =>
    buildConnectorPosture(connector, sourceById.get(connector.connectorId))
  );

  const certifiedConnectorCount = connectors.filter(
    (connector) => connector.overallStatus === "CERTIFIED_INTERNAL_REVIEW_BOUND"
  ).length;
  const pendingConnectorCount = connectors.filter(
    (connector) => connector.overallStatus === "REVIEW_PENDING"
  ).length;
  const blockedConnectorCount = connectors.filter(
    (connector) => connector.overallStatus === "BLOCKED_BY_GATE"
  ).length;
  const notStartedConnectorCount = connectors.filter(
    (connector) => connector.overallStatus === "NOT_STARTED"
  ).length;
  const overallReadinessPercent =
    connectors.length === 0
      ? 0
      : clampPercent(
          connectors.reduce(
            (sum, connector) => sum + connector.overallReadinessPercent,
            0
          ) / connectors.length
        );

  const summary: ConnectorCertificationSummary = {
    connectorCount: connectors.length,
    certifiedConnectorCount,
    pendingConnectorCount,
    blockedConnectorCount,
    notStartedConnectorCount,
    overallReadinessPercent,
    liveExecutionBlockedCount: connectors.length,
  };

  const recommendedReviewRoutes = unique([
    "/connectors",
    "/source-ingestion",
    "/live-scraper-activation",
    "/controlled-promotion-activation",
    "/governance/registry-framework",
    "/governance/certification-engine",
    "/governance/evidence-engine",
    "/evidence-packets",
    "/audit-replay",
    "/governance",
    "/reviews",
  ]);

  return {
    runtimeVersion: CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    summary,
    connectors,
    recommendedReviewRoutes,
    disclosures: unique([...CONNECTOR_CERTIFICATION_DISCLOSURES]),
    productionRestrictions: unique([
      ...CONNECTOR_CERTIFICATION_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    connectorCertificationInternalOnly: true,
    liveExecutionBlocked: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLegalReliance: true,
  };
}

export const CONNECTOR_DIMENSION_IDS: ConnectorDimensionId[] = [
  "review",
  "certification_evidence",
  "rollback",
  "monitoring",
  "activation_checks",
];

// Touch the source intelligence runtime version so the connector certification
// remains version-locked to the source authority registry.
export function connectorCertificationLineage(): {
  sourceIntelligenceVersion: string;
  connectorBaselineCount: number;
} {
  return {
    sourceIntelligenceVersion: SOURCE_INTELLIGENCE_VERSION,
    connectorBaselineCount: SOURCE_AUTHORITY_REGISTRY.length,
  };
}
