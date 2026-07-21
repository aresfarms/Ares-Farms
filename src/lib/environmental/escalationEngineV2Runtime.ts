import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION } from "@/lib/environmental/complianceV2Runtime";
import { ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION } from "@/lib/environmental/intakeV2Runtime";
import {
  ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
  EnvironmentalRiskAssessmentV2Input,
  EnvironmentalRiskAssessmentV2Result,
  composeEnvironmentalRiskAssessmentV2,
} from "@/lib/environmental/riskAssessmentV2Runtime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/platform/authorities/opportunity";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Environmental Escalation Engine v2 Runtime
 *
 * The fifteenth downstream consumer of the canonical v2 backbone.
 * Composes Environmental Risk Assessment v2 (Build 29) + everything
 * upstream into a deterministic escalation routing engine: gate
 * failures + risk findings + cross-source conflicts are mapped to a
 * canonical escalation queue with reviewer routing, evidence pack
 * reference, expected resolution timeline.
 *
 * There is no v1 environmental-escalation runtime in the canonical
 * inventory. This is a v2-native composition: a pure-functional
 * escalation router that produces an advisory escalation pack.
 *
 * Four governed escalation signals are composed:
 * - `escalation_routing_alignment` — every blocked / cross-source
 *   conflict has a reviewer route assigned.
 * - `escalation_evidence_alignment` — every escalation carries a
 *   replay-safe evidence reference.
 * - `escalation_reviewer_assignment_alignment` — every escalation
 *   is assigned to a named reviewer role.
 * - `escalation_timeline_alignment` — every escalation declares an
 *   expected human-review resolution window.
 *
 * Cross-source conflicts:
 * - Upstream Environmental Risk Assessment v2 cross-source conflicts
 *   propagated.
 * - Escalation queue empty while upstream EC v2 + ERA v2 surfaced
 *   blockers (i.e. the router missed a routing).
 * - Sovereign-tier escalation present without sovereign federation
 *   authorization.
 *
 * Constitutional posture:
 * - Internal advisory escalation routing posture only.
 * - No autonomous resolution; every escalation REQUIRES_HUMAN_REVIEW.
 * - No external escalation notification, ticket creation, queue
 *   submission to a third-party system, paging, or notice send.
 * - No environmental compliance / risk / clearance / NEPA /
 *   Phase I/II/III ESA / permit determination.
 * - No autonomous lending / eligibility / pathway / opportunity /
 *   intelligence / evidence / certification / onboarding /
 *   readiness / intake determination, credit decision, lender
 *   commitment, public verification, regulatory reliance, source
 *   certainty claim, payment authorization, live external action,
 *   or legal reliance.
 * - Environmental Engineering Spoke isolation preserved.
 */

export const ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION =
  "environmental-escalation-engine-v2-runtime-v0.1.0";

// =============================================================================
// Input types
// =============================================================================

export type EnvironmentalEscalationEngineV2Input =
  EnvironmentalRiskAssessmentV2Input;

// =============================================================================
// Tier + queue types
// =============================================================================

export type EnvironmentalEscalationTier =
  | "ROUTINE"
  | "ACCELERATED"
  | "URGENT"
  | "SOVEREIGN_REVIEW"
  | "NO_ESCALATION";

export type EnvironmentalEscalationReviewerRole =
  | "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"
  | "QUALIFIED_GOVERNANCE_REVIEWER"
  | "SOVEREIGN_FEDERATION_AUTHORITY"
  | "BORROWER_INTAKE_REVIEWER";

export type EnvironmentalEscalationSourceModule =
  | "ENVIRONMENTAL_COMPLIANCE_V2_GATE"
  | "ENVIRONMENTAL_COMPLIANCE_V2_CONFLICT"
  | "ENVIRONMENTAL_RISK_ASSESSMENT_V2_SIGNAL"
  | "ENVIRONMENTAL_RISK_ASSESSMENT_V2_CONFLICT"
  | "ENVIRONMENTAL_INTAKE_V2_CONFLICT";

export type EnvironmentalEscalationQueueEntry = {
  escalationId: string;
  tier: EnvironmentalEscalationTier;
  sourceModule: EnvironmentalEscalationSourceModule;
  sourceIdentifier: string;
  topic: string;
  description: string;
  reviewerRole: EnvironmentalEscalationReviewerRole;
  reviewRoute: string;
  evidenceReplayRef: string;
  expectedResolutionWindowDays: number;
  resolution: "REQUIRES_HUMAN_REVIEW";
  doctrineRefs: string[];
  blockedClaims: string[];
};

// =============================================================================
// Signal types
// =============================================================================

export type EnvironmentalEscalationEngineV2SignalId =
  | "escalation_routing_alignment"
  | "escalation_evidence_alignment"
  | "escalation_reviewer_assignment_alignment"
  | "escalation_timeline_alignment";

export type EnvironmentalEscalationEngineV2SignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type EnvironmentalEscalationEngineV2Signal = {
  id: EnvironmentalEscalationEngineV2SignalId;
  label: string;
  status: EnvironmentalEscalationEngineV2SignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type EnvironmentalEscalationEngineV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type EnvironmentalEscalationEngineV2LegacyBridge = {
  environmentalRiskAssessmentV2Version: string;
  environmentalComplianceV2Version: string;
  environmentalIntakeV2Version: string;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type EnvironmentalEscalationEngineV2Summary = {
  v2SignalCount: number;
  v2ReadyCount: number;
  v2NeedsInputCount: number;
  v2BlockedCount: number;
  v2NotStartedCount: number;
  v2OverallReadinessPercent: number;
  queueSize: number;
  routineCount: number;
  acceleratedCount: number;
  urgentCount: number;
  sovereignReviewCount: number;
  upstreamRiskBlockedCount: number;
  upstreamComplianceLoanAdvancementAllowed: boolean;
  upstreamComplianceConflictCount: number;
  upstreamRiskConflictCount: number;
  crossSourceConflictCount: number;
};

export type EnvironmentalEscalationEngineV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: EnvironmentalEscalationEngineV2Summary;
  v2Signals: EnvironmentalEscalationEngineV2Signal[];
  escalationQueue: EnvironmentalEscalationQueueEntry[];
  environmentalRiskAssessmentV2: EnvironmentalRiskAssessmentV2Result;
  crossSourceConflicts: EnvironmentalEscalationEngineV2CrossSourceConflict[];
  legacyBridge: EnvironmentalEscalationEngineV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  environmentalEscalationEngineV2InternalOnly: true;
  spokeIsolationRequired: true;
  feeAutonomyPreserved: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noAutonomousCertification: true;
  noAutonomousOnboarding: true;
  noAutonomousReadiness: true;
  noAutonomousEnvironmentalIntake: true;
  noAutonomousEnvironmentalCompliance: true;
  noAutonomousEnvironmentalRiskAssessment: true;
  noAutonomousEnvironmentalEscalation: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noOfficialEnvironmentalReport: true;
  noEnvironmentalClearance: true;
  noNEPADetermination: true;
  noPhaseIESAReport: true;
  noPhaseIIESAReport: true;
  noPermitIssued: true;
  noProviderEngagement: true;
  noFeeAuthorization: true;
  noLiveExternalAction: true;
  noExternalEscalationNotification: true;
  noSourceCertainty: true;
  noNoticeSend: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

// =============================================================================
// Canonical disclosures + production restrictions
// =============================================================================

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "preapproval",
  "autonomous environmental escalation determination",
  "autonomous environmental risk determination",
  "autonomous environmental compliance determination",
  "autonomous environmental intake determination",
  "external escalation notification",
  "external ticket creation",
  "external queue submission",
  "paging",
  "notice send",
  "credit decision",
  "lender commitment",
  "program approval",
  "official environmental report",
  "environmental clearance",
  "NEPA determination",
  "Phase I ESA report",
  "Phase II ESA report",
  "permit issued",
  "provider engagement",
  "fee authorization",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "live external action",
  "payment authorization",
] as const;

export const ENVIRONMENTAL_ESCALATION_ENGINE_V2_DISCLOSURES = [
  "Environmental Escalation Engine v2 output is advisory escalation routing posture only, replay-safe, audit-safe, and conflict-preserving.",
  "Escalation queue entries are deterministic routing recommendations into human review; no autonomous resolution occurs.",
  "Environmental Escalation Engine v2 does not perform external escalation notification, ticket creation, queue submission to a third-party system, paging, or notice send.",
  "Environmental Escalation Engine v2 does not authorize external environmental provider engagement, fee authorization, official environmental report, environmental clearance, NEPA determination, Phase I/II ESA report, permit issued, autonomous environmental escalation / risk / compliance / intake / onboarding / readiness / customer eligibility / pathway / opportunity / intelligence / evidence / certification determination, credit decision, lender commitment, public verification, regulatory reliance, or legal reliance.",
  "Sovereign-tier escalation entries are visible only when named federation participation is authorized (CANON-SOVEREIGNTY-001).",
  "Cross-source conflicts between Environmental Risk Assessment v2, Environmental Compliance v2, Environmental Intake v2, and this routing layer are preserved as first-class evidence and never collapsed.",
  "Environmental Engineering Spoke isolation is preserved; no Banker Spoke decision flows from this escalation posture.",
  "Human review is required before any composed escalation entry is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const ENVIRONMENTAL_ESCALATION_ENGINE_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous environmental escalation determination",
  "no autonomous environmental risk determination",
  "no autonomous environmental compliance determination",
  "no autonomous environmental intake determination",
  "no external escalation notification",
  "no external ticket creation",
  "no external queue submission",
  "no paging",
  "no autonomous resolution",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no approval",
  "no preapproval",
  "no credit decision",
  "no underwriting decision",
  "no lender commitment",
  "no funding guarantee",
  "no program approval",
  "no official environmental report",
  "no environmental clearance",
  "no NEPA determination",
  "no Phase I ESA report",
  "no Phase II ESA report",
  "no permit issued",
  "no provider engagement",
  "no fee authorization",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no live external action",
  "no source certainty",
  "no notice send",
  "no payment authorization",
] as const;

// =============================================================================
// Tier + reviewer routing rules
// =============================================================================

const TIER_TIMELINE_DAYS: Record<EnvironmentalEscalationTier, number> = {
  ROUTINE: 30,
  ACCELERATED: 10,
  URGENT: 3,
  SOVEREIGN_REVIEW: 14,
  NO_ESCALATION: 0,
};

const TIER_REVIEWER: Record<
  EnvironmentalEscalationTier,
  EnvironmentalEscalationReviewerRole
> = {
  ROUTINE: "BORROWER_INTAKE_REVIEWER",
  ACCELERATED: "QUALIFIED_GOVERNANCE_REVIEWER",
  URGENT: "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER",
  SOVEREIGN_REVIEW: "SOVEREIGN_FEDERATION_AUTHORITY",
  NO_ESCALATION: "BORROWER_INTAKE_REVIEWER",
};

const REVIEW_ROUTE = "/governance/environmental-escalation-engine-v2";

const DEFAULT_SIGNAL_DOCTRINE_REFS = [
  "ROLE-ARCH-001",
  "CANON-SOVEREIGNTY-001",
  "CANON-ECON-001",
  "TECH-CONN-001",
];

const DEFAULT_SIGNAL_BLOCKED_CLAIMS = [
  "official environmental report",
  "environmental clearance",
  "NEPA determination",
  "Phase I ESA report",
  "Phase II ESA report",
  "permit issued",
  "provider engagement",
  "fee authorization",
  "lender commitment",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "external escalation notification",
];

// =============================================================================
// Escalation queue construction
// =============================================================================

function buildEscalationId(prefix: string, key: string): string {
  return `${prefix}-${key.replace(/[^a-z0-9-]/gi, "_").toLowerCase()}`;
}

function buildQueue(
  era: EnvironmentalRiskAssessmentV2Result
): EnvironmentalEscalationQueueEntry[] {
  const entries: EnvironmentalEscalationQueueEntry[] = [];
  const ec = era.environmentalComplianceV2;
  const replayPrefix = `escalation-replay://`;

  // v1 environmental-compliance gate blockers.
  if (ec.summary.v1EnvironmentalAssessmentTriggered) {
    for (const blockerName of ec.gateSnapshot.blockerReasons) {
      let tier: EnvironmentalEscalationTier = "ACCELERATED";
      if (
        blockerName === "spokeIsolationConfirmed" ||
        blockerName === "bankerSpokeIsolated"
      ) {
        tier = "URGENT";
      }
      entries.push({
        escalationId: buildEscalationId("ec-gate", blockerName),
        tier,
        sourceModule: "ENVIRONMENTAL_COMPLIANCE_V2_GATE",
        sourceIdentifier: blockerName,
        topic: `v1 environmental-compliance gate blocker: ${blockerName}`,
        description: `The v1 environmental-compliance gate posture reported ${blockerName} as a blocker. Route to human review for evidence verification.`,
        reviewerRole: TIER_REVIEWER[tier],
        reviewRoute: REVIEW_ROUTE,
        evidenceReplayRef: `${replayPrefix}compliance-gate/${blockerName}`,
        expectedResolutionWindowDays: TIER_TIMELINE_DAYS[tier],
        resolution: "REQUIRES_HUMAN_REVIEW",
        doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
      });
    }
  }

  // EC v2 cross-source conflicts.
  for (const conflict of ec.crossSourceConflicts) {
    const tier: EnvironmentalEscalationTier =
      conflict.conflictId === "ec-v2-spoke-isolation-not-confirmed"
        ? "URGENT"
        : "ACCELERATED";
    entries.push({
      escalationId: buildEscalationId("ec-conflict", conflict.conflictId),
      tier,
      sourceModule: "ENVIRONMENTAL_COMPLIANCE_V2_CONFLICT",
      sourceIdentifier: conflict.conflictId,
      topic: conflict.topic,
      description: conflict.description,
      reviewerRole: TIER_REVIEWER[tier],
      reviewRoute: REVIEW_ROUTE,
      evidenceReplayRef: `${replayPrefix}compliance-conflict/${conflict.conflictId}`,
      expectedResolutionWindowDays: TIER_TIMELINE_DAYS[tier],
      resolution: "REQUIRES_HUMAN_REVIEW",
      doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    });
  }

  // Upstream Environmental Intake v2 conflicts (propagated through EC v2).
  for (const conflict of ec.environmentalIntakeV2.crossSourceConflicts) {
    const tier: EnvironmentalEscalationTier = "ROUTINE";
    entries.push({
      escalationId: buildEscalationId("ei-conflict", conflict.conflictId),
      tier,
      sourceModule: "ENVIRONMENTAL_INTAKE_V2_CONFLICT",
      sourceIdentifier: conflict.conflictId,
      topic: conflict.topic,
      description: conflict.description,
      reviewerRole: TIER_REVIEWER[tier],
      reviewRoute: REVIEW_ROUTE,
      evidenceReplayRef: `${replayPrefix}intake-conflict/${conflict.conflictId}`,
      expectedResolutionWindowDays: TIER_TIMELINE_DAYS[tier],
      resolution: "REQUIRES_HUMAN_REVIEW",
      doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    });
  }

  // ERA v2 BLOCKED_BY_CONFLICT signals.
  for (const signal of era.v2Signals) {
    if (signal.status === "BLOCKED_BY_CONFLICT") {
      const tier: EnvironmentalEscalationTier =
        signal.riskTier === "SOVEREIGN_REVIEW" ? "SOVEREIGN_REVIEW" : "URGENT";
      entries.push({
        escalationId: buildEscalationId("era-signal", signal.id),
        tier,
        sourceModule: "ENVIRONMENTAL_RISK_ASSESSMENT_V2_SIGNAL",
        sourceIdentifier: signal.id,
        topic: `Risk signal blocked: ${signal.label}`,
        description: `The risk overlay reports ${signal.id} as ${signal.status} with declared value ${signal.declaredValue}. Route to human review.`,
        reviewerRole: TIER_REVIEWER[tier],
        reviewRoute: REVIEW_ROUTE,
        evidenceReplayRef: `${replayPrefix}risk-signal/${signal.id}`,
        expectedResolutionWindowDays: TIER_TIMELINE_DAYS[tier],
        resolution: "REQUIRES_HUMAN_REVIEW",
        doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
      });
    }
  }

  // ERA v2 cross-source conflicts.
  for (const conflict of era.crossSourceConflicts) {
    const tier: EnvironmentalEscalationTier =
      conflict.conflictId === "era-v2-tribal-land-without-sovereign-authorization"
        ? "SOVEREIGN_REVIEW"
        : "ACCELERATED";
    entries.push({
      escalationId: buildEscalationId("era-conflict", conflict.conflictId),
      tier,
      sourceModule: "ENVIRONMENTAL_RISK_ASSESSMENT_V2_CONFLICT",
      sourceIdentifier: conflict.conflictId,
      topic: conflict.topic,
      description: conflict.description,
      reviewerRole: TIER_REVIEWER[tier],
      reviewRoute: REVIEW_ROUTE,
      evidenceReplayRef: `${replayPrefix}risk-conflict/${conflict.conflictId}`,
      expectedResolutionWindowDays: TIER_TIMELINE_DAYS[tier],
      resolution: "REQUIRES_HUMAN_REVIEW",
      doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    });
  }

  return entries;
}

// =============================================================================
// Signal builders
// =============================================================================

const V2_SIGNAL_IDS: readonly EnvironmentalEscalationEngineV2SignalId[] = [
  "escalation_routing_alignment",
  "escalation_evidence_alignment",
  "escalation_reviewer_assignment_alignment",
  "escalation_timeline_alignment",
];

const V2_SIGNAL_LABELS: Record<
  EnvironmentalEscalationEngineV2SignalId,
  string
> = {
  escalation_routing_alignment: "Escalation routing alignment",
  escalation_evidence_alignment: "Escalation evidence reference alignment",
  escalation_reviewer_assignment_alignment:
    "Escalation reviewer assignment alignment",
  escalation_timeline_alignment: "Escalation timeline alignment",
};

function buildSignal(
  id: EnvironmentalEscalationEngineV2SignalId,
  queue: EnvironmentalEscalationQueueEntry[]
): EnvironmentalEscalationEngineV2Signal {
  if (queue.length === 0) {
    return {
      id,
      label: V2_SIGNAL_LABELS[id],
      status: "READY_FOR_REVIEW",
      readinessPercent: 100,
      coverageCount: 0,
      reviewSignals: ["no escalation entries required for current posture"],
      blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
    };
  }

  let satisfied = 0;
  let total = queue.length;
  const reviewSignals: string[] = [];

  switch (id) {
    case "escalation_routing_alignment":
      satisfied = queue.filter(
        (entry) => entry.reviewRoute.length > 0
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} entries carry an explicit review route`
      );
      break;
    case "escalation_evidence_alignment":
      satisfied = queue.filter(
        (entry) => entry.evidenceReplayRef.length > 0
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} entries carry a replay-safe evidence ref`
      );
      break;
    case "escalation_reviewer_assignment_alignment":
      satisfied = queue.filter(
        (entry) =>
          entry.reviewerRole !== "BORROWER_INTAKE_REVIEWER" ||
          entry.tier === "ROUTINE" ||
          entry.tier === "NO_ESCALATION"
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} entries are assigned to the canonical tier reviewer role`
      );
      break;
    case "escalation_timeline_alignment":
      satisfied = queue.filter(
        (entry) =>
          entry.expectedResolutionWindowDays ===
          TIER_TIMELINE_DAYS[entry.tier]
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} entries declare the canonical timeline for their tier`
      );
      break;
  }

  const ready = satisfied === total;
  const readinessPercent =
    total === 0 ? 100 : Math.round((satisfied / total) * 100);

  return {
    id,
    label: V2_SIGNAL_LABELS[id],
    status: ready ? "READY_FOR_REVIEW" : "BLOCKED_BY_CONFLICT",
    readinessPercent,
    coverageCount: satisfied,
    reviewSignals,
    blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
  };
}

// =============================================================================
// Cross-source conflicts
// =============================================================================

function buildCrossSourceConflicts(
  queue: EnvironmentalEscalationQueueEntry[],
  era: EnvironmentalRiskAssessmentV2Result,
  scope: EnvironmentalRiskAssessmentV2Input["scope"]
): EnvironmentalEscalationEngineV2CrossSourceConflict[] {
  const conflicts: EnvironmentalEscalationEngineV2CrossSourceConflict[] = [];

  if (era.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "eee-v2-upstream-era-v2-conflicts",
      topic:
        "Upstream Environmental Risk Assessment v2 surfaced cross-source conflicts",
      description: `Environmental Risk Assessment v2 composition surfaced ${era.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Environmental Escalation Engine v2; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  const upstreamBlockers =
    era.summary.v2BlockedCount +
    era.summary.upstreamComplianceConflictCount;
  if (upstreamBlockers > 0 && queue.length === 0) {
    conflicts.push({
      conflictId: "eee-v2-router-missed-upstream-blockers",
      topic:
        "Escalation queue empty while upstream EC v2 + ERA v2 surfaced blockers",
      description: `Upstream modules surfaced ${upstreamBlockers} blocker(s) but the escalation router produced no queue entries; review whether router rules cover the upstream conditions.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  const sovereignEntries = queue.filter(
    (entry) => entry.tier === "SOVEREIGN_REVIEW"
  );
  if (
    sovereignEntries.length > 0 &&
    scope?.sovereignFederationAllowed !== true
  ) {
    conflicts.push({
      conflictId: "eee-v2-sovereign-tier-without-authorization",
      topic:
        "Sovereign-tier escalation present without sovereign federation authorization",
      description: `${sovereignEntries.length} escalation entry(ies) are tier SOVEREIGN_REVIEW, but the scope did not authorize sovereign federation participation. Sovereign entries remain hidden until a reviewer explicitly authorizes sovereign federation participation (CANON-SOVEREIGNTY-001).`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  return conflicts;
}

// =============================================================================
// Composition helper
// =============================================================================

function unique<T>(values: T[]): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    const key =
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
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

// =============================================================================
// Runtime composition
// =============================================================================

export function composeEnvironmentalEscalationEngineV2(
  input: EnvironmentalEscalationEngineV2Input = {}
): EnvironmentalEscalationEngineV2Result {
  // 1. Compose Environmental Risk Assessment v2 (which composes
  //    Environmental Compliance v2 + the full canonical v2 stack +
  //    the v1 environmental-compliance gate semantics + the
  //    borrower site-risk overlay).
  const era = composeEnvironmentalRiskAssessmentV2(input);

  // 2. Build escalation queue from gate failures + conflicts +
  //    BLOCKED_BY_CONFLICT signals.
  let escalationQueue = buildQueue(era);

  // 3. Sovereign entries are hidden unless explicitly authorized.
  const sovereignAllowed = input.scope?.sovereignFederationAllowed === true;
  if (!sovereignAllowed) {
    escalationQueue = escalationQueue.filter(
      (entry) => entry.tier !== "SOVEREIGN_REVIEW"
    );
  }

  // 4. Build governed v2 signals from the queue.
  const v2Signals: EnvironmentalEscalationEngineV2Signal[] = V2_SIGNAL_IDS.map(
    (id) => buildSignal(id, escalationQueue)
  );

  // 5. Cross-source conflicts.
  // Use the unfiltered queue for conflict detection so we can flag
  // sovereign-without-authorization correctly.
  const unfilteredQueue = buildQueue(era);
  const crossSourceConflicts = buildCrossSourceConflicts(
    unfilteredQueue,
    era,
    input.scope ?? null
  );

  // 6. Summarize.
  const v2ReadyCount = v2Signals.filter(
    (s) => s.status === "READY_FOR_REVIEW"
  ).length;
  const v2NeedsInputCount = v2Signals.filter(
    (s) => s.status === "NEEDS_INPUT"
  ).length;
  const v2BlockedCount = v2Signals.filter(
    (s) => s.status === "BLOCKED_BY_CONFLICT"
  ).length;
  const v2NotStartedCount = v2Signals.filter(
    (s) => s.status === "NOT_STARTED"
  ).length;
  const v2OverallReadinessPercent =
    v2Signals.length === 0
      ? 0
      : Math.round(
          v2Signals.reduce((sum, s) => sum + s.readinessPercent, 0) /
            v2Signals.length
        );

  const summary: EnvironmentalEscalationEngineV2Summary = {
    v2SignalCount: v2Signals.length,
    v2ReadyCount,
    v2NeedsInputCount,
    v2BlockedCount,
    v2NotStartedCount,
    v2OverallReadinessPercent,
    queueSize: escalationQueue.length,
    routineCount: escalationQueue.filter((e) => e.tier === "ROUTINE").length,
    acceleratedCount: escalationQueue.filter(
      (e) => e.tier === "ACCELERATED"
    ).length,
    urgentCount: escalationQueue.filter((e) => e.tier === "URGENT").length,
    sovereignReviewCount: escalationQueue.filter(
      (e) => e.tier === "SOVEREIGN_REVIEW"
    ).length,
    upstreamRiskBlockedCount: era.summary.v2BlockedCount,
    upstreamComplianceLoanAdvancementAllowed:
      era.summary.upstreamComplianceLoanAdvancementAllowed,
    upstreamComplianceConflictCount:
      era.summary.upstreamComplianceConflictCount,
    upstreamRiskConflictCount: era.summary.crossSourceConflictCount,
    crossSourceConflictCount: crossSourceConflicts.length,
  };

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
    "/governance/environmental-risk-assessment-v2",
    "/governance/environmental-compliance-v2",
    "/governance/environmental-intake-v2",
    "/governance/readiness-assessment-v2",
    "/governance/borrower-onboarding-core-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/environmental-compliance",
    "/portal/borrower/environmental-intake",
    "/applications",
    "/documents",
    "/data-rights",
    "/evidence-packets",
    "/audit-replay",
    "/governance",
    "/reviews",
  ]);

  return {
    runtimeVersion: ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v2Signals,
    escalationQueue,
    environmentalRiskAssessmentV2: era,
    crossSourceConflicts,
    legacyBridge: {
      environmentalRiskAssessmentV2Version:
        ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
      environmentalComplianceV2Version:
        ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
      environmentalIntakeV2Version: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
      borrowerOnboardingCoreV2Version:
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: [...ENVIRONMENTAL_ESCALATION_ENGINE_V2_DISCLOSURES],
    productionRestrictions: [
      ...ENVIRONMENTAL_ESCALATION_ENGINE_V2_PRODUCTION_RESTRICTIONS,
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    environmentalEscalationEngineV2InternalOnly: true,
    spokeIsolationRequired: true,
    feeAutonomyPreserved: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noAutonomousCertification: true,
    noAutonomousOnboarding: true,
    noAutonomousReadiness: true,
    noAutonomousEnvironmentalIntake: true,
    noAutonomousEnvironmentalCompliance: true,
    noAutonomousEnvironmentalRiskAssessment: true,
    noAutonomousEnvironmentalEscalation: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noOfficialEnvironmentalReport: true,
    noEnvironmentalClearance: true,
    noNEPADetermination: true,
    noPhaseIESAReport: true,
    noPhaseIIESAReport: true,
    noPermitIssued: true,
    noProviderEngagement: true,
    noFeeAuthorization: true,
    noLiveExternalAction: true,
    noExternalEscalationNotification: true,
    noSourceCertainty: true,
    noNoticeSend: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function environmentalEscalationEngineV2Lineage(): {
  runtimeVersion: string;
  environmentalRiskAssessmentV2Version: string;
  environmentalComplianceV2Version: string;
  environmentalIntakeV2Version: string;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
} {
  return {
    runtimeVersion: ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
    environmentalRiskAssessmentV2Version:
      ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
    environmentalComplianceV2Version:
      ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
    environmentalIntakeV2Version: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    borrowerOnboardingCoreV2Version: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
  };
}

export const ENVIRONMENTAL_ESCALATION_ENGINE_V2_SIGNAL_IDS = V2_SIGNAL_IDS;

export const ENVIRONMENTAL_ESCALATION_ENGINE_V2_TIER_TIMELINE_DAYS =
  TIER_TIMELINE_DAYS;

export const ENVIRONMENTAL_ESCALATION_ENGINE_V2_TIER_REVIEWER = TIER_REVIEWER;

// Re-export the capital-category type so downstream builds can
// constrain scope without re-importing from the capital-graph
// module.
export type EnvironmentalEscalationEngineV2CapitalCategoryId = CapitalCategoryId;
