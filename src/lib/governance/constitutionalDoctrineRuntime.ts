import {
  ADVISORY_ONLY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  CONTENT_CLAIMS_POLICY_VERSION,
  LENDER_READY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Constitutional Missing Doctrine Runtime
 *
 * Master Volume Governance:
 * - Vol I: binds late-arriving doctrine to enforceable constitutional state.
 * - Vol II: preserves public-claims, incident, UX, configuration, and
 *   borrower/partner disclosure boundaries.
 * - Vol III: defines deterministic runtime state, feature, API, schema, and
 *   implementation traceability contracts.
 * - Vol III-B: gives every doctrine replay, audit, classification, and
 *   activation posture.
 * - Vol IV: supports rollback, emergency mode, escalation, degraded operation,
 *   and deployment conformance.
 * - Vol V: keeps claims, replay, observability, classification, controlled
 *   disclosure, and source-authority doctrine in one canonical runtime.
 *
 * Supplemental governing input:
 * - Ares_Furlong_Missing_Doctrines_Implementation_Master.pdf
 */

export const MISSING_DOCTRINES_SOURCE =
  "Ares_Furlong_Missing_Doctrines_Implementation_Master.pdf";

export const MISSING_DOCTRINES_VERSION =
  "missing-doctrines-runtime-v0.1.0";

export const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";

export type RuntimeOperationalMode =
  | "DEVELOPMENT"
  | "SANDBOX"
  | "SIMULATION"
  | "STAGING"
  | "INTERNAL_GOVERNED"
  | "PRODUCTION_SHADOW"
  | "PRODUCTION_LIVE"
  | "DEGRADED_OPERATION"
  | "DISCONNECTED_OPERATION"
  | "REPLAY_ONLY"
  | "EMERGENCY_GOVERNANCE"
  | "SOVEREIGN_RESTRICTED";

export type RuntimeStateProfile = {
  state: RuntimeOperationalMode;
  allowedActions: string[];
  blockedActions: string[];
  auditRequirements: string[];
  replayRequirements: string[];
  aiExecutionRestrictions: string[];
  connectorBehavior: string;
  noticeBehavior: string;
  productionAuthorityScope: string;
  escalationBehavior: string;
};

export const RUNTIME_STATE_PROFILES: RuntimeStateProfile[] = [
  {
    state: "DEVELOPMENT",
    allowedActions: ["local-development", "schema-verification", "smoke-tests"],
    blockedActions: ["production-live", "external-action", "payment-capture"],
    auditRequirements: ["runtime-guard", "version-lineage"],
    replayRequirements: ["replay-ref-required-for-material-actions"],
    aiExecutionRestrictions: ["advisory-only"],
    connectorBehavior: "no live external connector calls",
    noticeBehavior: "no external notice sends",
    productionAuthorityScope: "none",
    escalationBehavior: "operator review",
  },
  {
    state: "SANDBOX",
    allowedActions: ["test-data-workflows", "non-production-routes"],
    blockedActions: ["regulated-final-action", "payment-capture"],
    auditRequirements: ["runtime-guard", "audit-evidence"],
    replayRequirements: ["deterministic-replay-required"],
    aiExecutionRestrictions: ["advisory-only", "no-regulated-decision-use"],
    connectorBehavior: "mock or certified dry-run only",
    noticeBehavior: "packet preparation only",
    productionAuthorityScope: "none",
    escalationBehavior: "operator review",
  },
  {
    state: "SIMULATION",
    allowedActions: ["simulation", "replay-analysis", "dry-run"],
    blockedActions: ["external-action", "borrower-disclosure", "payment-capture"],
    auditRequirements: ["simulation-run-log", "audit-evidence"],
    replayRequirements: ["full-replay-required"],
    aiExecutionRestrictions: ["simulation-only", "no-live-influence"],
    connectorBehavior: "no live calls; simulated source envelopes only",
    noticeBehavior: "simulation only",
    productionAuthorityScope: "none",
    escalationBehavior: "simulation anomaly review",
  },
  {
    state: "STAGING",
    allowedActions: ["staged-validation", "production-readiness-gates"],
    blockedActions: ["production-live", "external-delivery", "payment-capture"],
    auditRequirements: ["readiness-gate", "audit-evidence"],
    replayRequirements: ["deployment-replay-required"],
    aiExecutionRestrictions: ["advisory-only", "human-review-required"],
    connectorBehavior: "certified dry-run only",
    noticeBehavior: "provider authorization not sent",
    productionAuthorityScope: "shadow validation only",
    escalationBehavior: "deployment review",
  },
  {
    state: "INTERNAL_GOVERNED",
    allowedActions: ["internal-operations", "human-review", "admin-read"],
    blockedActions: ["public-production-exposure", "payment-capture"],
    auditRequirements: ["route-evidence", "record-access-evidence"],
    replayRequirements: ["material-action-replay-ref"],
    aiExecutionRestrictions: ["advisory-only", "review-boundary-visible"],
    connectorBehavior: "authorized-not-called unless promoted",
    noticeBehavior: "controlled delivery ready only",
    productionAuthorityScope: "internal governed operation",
    escalationBehavior: "operator or governance escalation",
  },
  {
    state: "PRODUCTION_SHADOW",
    allowedActions: ["shadow-readiness", "parallel-run-validation"],
    blockedActions: ["final-live-action", "unreviewed-disclosure"],
    auditRequirements: ["production-shadow-audit", "human-approval-ref"],
    replayRequirements: ["shadow-replay-required"],
    aiExecutionRestrictions: ["advisory-only", "no-autonomous-action"],
    connectorBehavior: "live authorization may be reviewed; no unlogged call",
    noticeBehavior: "provider execution authorized not sent",
    productionAuthorityScope: "shadow only",
    escalationBehavior: "production governance review",
  },
  {
    state: "PRODUCTION_LIVE",
    allowedActions: ["certified-live-actions", "governed-public-surfaces"],
    blockedActions: ["uncertified-feature", "untraced-config-change"],
    auditRequirements: ["production-audit", "continuous-observability"],
    replayRequirements: ["production-replay-required"],
    aiExecutionRestrictions: ["advisory-only", "human-review-for-regulated-use"],
    connectorBehavior: "certified adapters only with source authority",
    noticeBehavior: "approved providers only with receipt capture",
    productionAuthorityScope: "controlled live operation",
    escalationBehavior: "incident and constitutional escalation",
  },
  {
    state: "DEGRADED_OPERATION",
    allowedActions: ["safe-read", "operator-remediation", "incident-response"],
    blockedActions: ["new-live-action", "new-payment-capture"],
    auditRequirements: ["degraded-mode-log", "incident-link"],
    replayRequirements: ["preserve-replay-before-resume"],
    aiExecutionRestrictions: ["advisory-only", "no-automation-expansion"],
    connectorBehavior: "disabled unless explicitly allowed by incident command",
    noticeBehavior: "pause sends; preserve packets",
    productionAuthorityScope: "continuity only",
    escalationBehavior: "incident commander",
  },
  {
    state: "DISCONNECTED_OPERATION",
    allowedActions: ["local-safe-read", "replay-queueing"],
    blockedActions: ["external-call", "notice-send", "payment-capture"],
    auditRequirements: ["offline-audit-queue"],
    replayRequirements: ["queue-for-replay-sync"],
    aiExecutionRestrictions: ["disabled for material workflows"],
    connectorBehavior: "disconnected",
    noticeBehavior: "disconnected",
    productionAuthorityScope: "continuity only",
    escalationBehavior: "continuity runbook",
  },
  {
    state: "REPLAY_ONLY",
    allowedActions: ["replay-verification", "audit-reconstruction"],
    blockedActions: ["state-write", "external-action", "public-disclosure"],
    auditRequirements: ["replay-log", "verification-result"],
    replayRequirements: ["full deterministic replay"],
    aiExecutionRestrictions: ["explain replay only"],
    connectorBehavior: "disabled",
    noticeBehavior: "disabled",
    productionAuthorityScope: "none",
    escalationBehavior: "audit review",
  },
  {
    state: "EMERGENCY_GOVERNANCE",
    allowedActions: ["containment", "escalation", "rollback", "evidence-export"],
    blockedActions: ["new-public-claim", "unreviewed-live-action"],
    auditRequirements: ["incident-link", "constitutional-escalation"],
    replayRequirements: ["emergency-replay-snapshot"],
    aiExecutionRestrictions: ["no autonomous action"],
    connectorBehavior: "kill-switch default",
    noticeBehavior: "pause unless emergency authority records otherwise",
    productionAuthorityScope: "emergency containment",
    escalationBehavior: "constitutional incident escalation",
  },
  {
    state: "SOVEREIGN_RESTRICTED",
    allowedActions: ["sovereign-scoped-review", "gateway-validation"],
    blockedActions: ["scoring-use", "underwriting-use", "ai-training"],
    auditRequirements: ["sovereign-consent-record", "compliance-review"],
    replayRequirements: ["sovereign-replay-context"],
    aiExecutionRestrictions: ["no training", "no scoring", "advisory-only"],
    connectorBehavior: "sovereign gateway required",
    noticeBehavior: "controlled disclosure only",
    productionAuthorityScope: "sovereign-scoped only",
    escalationBehavior: "sovereign governance escalation",
  },
];

export type RuntimeTransitionResult = {
  ok: boolean;
  fromState: RuntimeOperationalMode;
  toState: RuntimeOperationalMode;
  replayRef: string;
  auditVisible: true;
  blockedReasons: string[];
};

export const REQUIRED_FEATURE_METADATA = [
  "feature_id",
  "governance_owner",
  "constitutional_tags",
  "activation_scope",
  "rollback_supported",
  "replay_safe",
  "production_authorized",
  "jurisdiction_scope",
  "effective_dates",
] as const;

export type ConstitutionalFeature = {
  featureId: string;
  governanceOwner: string;
  constitutionalTags: string[];
  activationScope: string;
  rollbackSupported: boolean;
  replaySafe: boolean;
  productionAuthorized: boolean;
  jurisdictionScope: string[];
  effectiveDates: {
    effectiveFrom: string;
    effectiveTo: string | null;
  };
  stagedRollout: boolean;
  sovereignRegionRestricted: boolean;
  emergencyDisablementSupported: boolean;
  rollbackLineage: string[];
  activationAuditing: boolean;
};

export const FEATURE_GOVERNANCE_REGISTRY: ConstitutionalFeature[] = [
  {
    featureId: "module-registry-runtime",
    governanceOwner: "governance",
    constitutionalTags: ["MODULE-MANIFEST-001", "IMPLEMENTATION-MANIFEST-001"],
    activationScope: "internal-governed-modules",
    rollbackSupported: true,
    replaySafe: true,
    productionAuthorized: false,
    jurisdictionScope: ["US"],
    effectiveDates: {
      effectiveFrom: "2026-05-25",
      effectiveTo: null,
    },
    stagedRollout: true,
    sovereignRegionRestricted: false,
    emergencyDisablementSupported: true,
    rollbackLineage: ["feature-rollback-v0.1.0"],
    activationAuditing: true,
  },
  {
    featureId: "public-surface-gateway",
    governanceOwner: "governance",
    constitutionalTags: ["SURFACE-GOV-001", "PUBLIC-CLAIMS-001"],
    activationScope: "public-safe-translation-layer",
    rollbackSupported: true,
    replaySafe: true,
    productionAuthorized: false,
    jurisdictionScope: ["US"],
    effectiveDates: {
      effectiveFrom: "2026-05-25",
      effectiveTo: null,
    },
    stagedRollout: true,
    sovereignRegionRestricted: true,
    emergencyDisablementSupported: true,
    rollbackLineage: ["public-gateway-rollback-v0.1.0"],
    activationAuditing: true,
  },
  {
    featureId: "live-action-readiness",
    governanceOwner: "governance",
    constitutionalTags: ["PROMOTION-GATE-001", "FEATURE-GOV-001"],
    activationScope: "promotion-review-only",
    rollbackSupported: true,
    replaySafe: true,
    productionAuthorized: false,
    jurisdictionScope: ["US"],
    effectiveDates: {
      effectiveFrom: "2026-05-25",
      effectiveTo: null,
    },
    stagedRollout: true,
    sovereignRegionRestricted: true,
    emergencyDisablementSupported: true,
    rollbackLineage: ["live-action-hold-v0.1.0"],
    activationAuditing: true,
  },
];

export type FeatureActivationResult = {
  ok: boolean;
  featureId: string;
  requestedState: "activate" | "deactivate" | "rollback";
  replayRef: string;
  blockedReasons: string[];
};

export type PublicClaimValidation = {
  ok: boolean;
  claimAuthority: string;
  claimScope: string;
  claimBasis: string;
  claimVerificationStatus: string;
  claimAudience: string[];
  claimExpiration: string | null;
  replayRef: string;
  blockCount: number;
  reviewCount: number;
  findingCodes: string[];
};

export const PUBLIC_CLAIM_REGISTRY = [
  {
    claimAuthority: "governance",
    claimScope: "advisory-coordination",
    claimBasis: ADVISORY_ONLY_DISCLOSURE,
    claimVerificationStatus: "policy-enforced",
    claimAudience: ["public", "borrower", "lender", "sponsor"],
    claimExpiration: null,
  },
  {
    claimAuthority: "governance",
    claimScope: "lender-ready",
    claimBasis: LENDER_READY_DISCLOSURE,
    claimVerificationStatus: "policy-enforced",
    claimAudience: ["borrower", "lender"],
    claimExpiration: null,
  },
  {
    claimAuthority: "governance",
    claimScope: "borrower-portability",
    claimBasis: BORROWER_PORTABILITY_DISCLOSURE,
    claimVerificationStatus: "policy-enforced",
    claimAudience: ["borrower", "public"],
    claimExpiration: null,
  },
];

export const INCIDENT_CLASSES = [
  "operational",
  "constitutional",
  "replay",
  "sovereignty",
  "AI",
  "connector",
  "security",
  "disclosure",
  "survivability",
] as const;

export type IncidentClass = (typeof INCIDENT_CLASSES)[number];

export type ConstitutionalIncident = {
  incidentId: string;
  incidentClass: IncidentClass;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectionTimestamp: string;
  affectedSystems: string[];
  governanceEscalationPath: string[];
  replayRefs: string[];
  containmentActions: string[];
  resolutionState: "OPEN" | "ESCALATED" | "RESOLVED";
};

export const GOVERNED_CONFIG_TYPES = [
  "environment variables",
  "external endpoints",
  "retry behavior",
  "timeout behavior",
  "deployment modes",
  "region restrictions",
  "operational thresholds",
  "feature toggles",
] as const;

export const CONFIG_GOVERNANCE_CONTROLS = [
  "versioning",
  "audit logging",
  "replay-safe changes",
  "rollback support",
  "jurisdiction awareness",
  "constitutional tagging",
] as const;

export const UX_GOVERNANCE_CONTROLS = [
  "disclosure visibility",
  "workflow clarity",
  "escalation visibility",
  "accessibility compliance",
  "explainability readability",
  "human review visibility",
  "constitutional warning placement",
] as const;

export const PROHIBITED_UX_PATTERNS = [
  "deceptive urgency",
  "hidden restrictions",
  "buried disclosures",
  "misleading approval indicators",
  "manipulative AI framing",
] as const;

export const IMPLEMENTATION_TRACEABILITY_FIELDS = [
  "constitutional_doctrine",
  "regulatory_policy",
  "technical_standard",
  "runbook",
  "canonical_doctrine",
  "service",
  "module",
  "route",
  "API",
  "database_schema",
  "event_contract",
  "test_suite",
  "runtime_gate",
  "deployment_state",
  "certification_state",
] as const;

export const MISSING_DOCTRINE_TABLES = [
  "runtime_state_registry",
  "runtime_transition_events",
  "runtime_authority_records",
  "runtime_restriction_profiles",
  "runtime_replay_refs",
  "feature_registry",
  "feature_activation_events",
  "feature_rollout_profiles",
  "feature_kill_switch_events",
  "feature_replay_refs",
  "public_claim_registry",
  "claim_validation_records",
  "claim_escalation_events",
  "claim_replay_refs",
  "incident_registry",
  "incident_escalation_events",
  "incident_replay_refs",
  "incident_resolution_records",
  "config_registry",
  "config_change_events",
  "config_replay_refs",
  "config_validation_records",
  "ux_governance_registry",
  "ux_disclosure_profiles",
  "ux_violation_events",
  "ux_accessibility_records",
  "implementation_manifest_registry",
  "runtime_conformance_records",
  "governance_traceability_refs",
  "deployment_validation_refs",
  "constitutional_coverage_matrix",
] as const;

export const MISSING_DOCTRINE_API_ROUTES = [
  "/api/runtime/state",
  "/api/runtime/transition",
  "/api/runtime/restrictions",
  "/api/runtime/emergency-mode",
  "/api/features",
  "/api/features/activate",
  "/api/features/deactivate",
  "/api/features/rollback",
  "/api/claims/validate",
  "/api/claims/public",
  "/api/claims/escalate",
  "/api/incidents/create",
  "/api/incidents/escalate",
  "/api/incidents/status",
  "/api/incidents/resolve",
  "/api/config",
  "/api/config/change",
  "/api/config/rollback",
  "/api/ux/governance",
  "/api/ux/validate",
  "/api/ux/escalate",
  "/api/implementation/manifest",
  "/api/implementation/coverage",
  "/api/implementation/validate",
  "/api/implementation/certify",
] as const;

export const MISSING_DOCTRINE_PACKAGE_COMMANDS = [
  "verify:runtime-states",
  "smoke:runtime-transitions",
  "verify:feature-governance",
  "smoke:feature-rollbacks",
  "verify:public-claims",
  "smoke:incident-escalation",
  "verify:incident-governance",
  "verify:config-governance",
  "smoke:config-rollbacks",
  "verify:ux-governance",
  "smoke:accessibility",
  "smoke:workflow-visibility",
  "verify:implementation-manifest",
  "smoke:governance-traceability",
  "smoke:deployment-conformance",
] as const;

export function runtimeStatesComplete(): boolean {
  return RUNTIME_STATE_PROFILES.every(
    (profile) =>
      profile.allowedActions.length > 0 &&
      profile.blockedActions.length > 0 &&
      profile.auditRequirements.length > 0 &&
      profile.replayRequirements.length > 0 &&
      profile.aiExecutionRestrictions.length > 0 &&
      profile.connectorBehavior.length > 0 &&
      profile.noticeBehavior.length > 0 &&
      profile.productionAuthorityScope.length > 0 &&
      profile.escalationBehavior.length > 0
  );
}

export function runtimeStateNames(): RuntimeOperationalMode[] {
  return RUNTIME_STATE_PROFILES.map((profile) => profile.state);
}

export function transitionRuntimeState(input: {
  fromState: RuntimeOperationalMode;
  toState: RuntimeOperationalMode;
  actorId?: string | null;
  authorityRef?: string | null;
  replayRef?: string | null;
}): RuntimeTransitionResult {
  const blockedReasons: string[] = [];

  if (!runtimeStateNames().includes(input.fromState)) {
    blockedReasons.push("unknown-from-state");
  }
  if (!runtimeStateNames().includes(input.toState)) {
    blockedReasons.push("unknown-to-state");
  }
  if (
    ["PRODUCTION_LIVE", "EMERGENCY_GOVERNANCE", "SOVEREIGN_RESTRICTED"].includes(
      input.toState
    ) &&
    !input.authorityRef
  ) {
    blockedReasons.push("authority-ref-required");
  }

  return {
    ok: blockedReasons.length === 0,
    fromState: input.fromState,
    toState: input.toState,
    replayRef:
      input.replayRef ??
      `runtime-transition-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,
    auditVisible: true,
    blockedReasons,
  };
}

export function activateFeature(input: {
  featureId: string;
  productionRequested?: boolean;
  replayRef?: string | null;
}): FeatureActivationResult {
  const feature = FEATURE_GOVERNANCE_REGISTRY.find(
    (record) => record.featureId === input.featureId
  );
  const blockedReasons: string[] = [];

  if (!feature) {
    blockedReasons.push("unknown-feature");
  }
  if (feature && !feature.replaySafe) {
    blockedReasons.push("feature-not-replay-safe");
  }
  if (feature && input.productionRequested && !feature.productionAuthorized) {
    blockedReasons.push("production-not-authorized");
  }

  return {
    ok: blockedReasons.length === 0,
    featureId: input.featureId,
    requestedState: "activate",
    replayRef:
      input.replayRef ??
      `feature-activation-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,
    blockedReasons,
  };
}

export function rollbackFeature(input: {
  featureId: string;
  replayRef?: string | null;
}): FeatureActivationResult {
  const feature = FEATURE_GOVERNANCE_REGISTRY.find(
    (record) => record.featureId === input.featureId
  );
  const blockedReasons: string[] = [];

  if (!feature) {
    blockedReasons.push("unknown-feature");
  }
  if (feature && !feature.rollbackSupported) {
    blockedReasons.push("rollback-not-supported");
  }

  return {
    ok: blockedReasons.length === 0,
    featureId: input.featureId,
    requestedState: "rollback",
    replayRef:
      input.replayRef ??
      `feature-rollback-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,
    blockedReasons,
  };
}

export function validatePublicClaim(input: {
  text: string;
  claimAuthority?: string | null;
  claimScope?: string | null;
  claimBasis?: string | null;
  claimVerificationStatus?: string | null;
  claimAudience?: string[];
  claimExpiration?: string | null;
  replayRef?: string | null;
}): PublicClaimValidation {
  const evaluation = evaluateContentClaims({
    text: input.text,
    context: {
      officialDecisionAuthority: false,
      publicVerificationGatewayOperational: false,
      canonicalHashVerificationOperational: false,
      soc2Type2Operational: false,
      fedRampAuthorized: false,
    },
  });

  return {
    ok: evaluation.ok,
    claimAuthority: input.claimAuthority ?? "governance",
    claimScope: input.claimScope ?? "public-representation",
    claimBasis: input.claimBasis ?? CONTENT_CLAIMS_POLICY_VERSION,
    claimVerificationStatus:
      input.claimVerificationStatus ?? (evaluation.ok ? "validated" : "blocked"),
    claimAudience: input.claimAudience ?? ["public"],
    claimExpiration: input.claimExpiration ?? null,
    replayRef:
      input.replayRef ??
      `claim-validation-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,
    blockCount: evaluation.blockCount,
    reviewCount: evaluation.reviewCount,
    findingCodes: evaluation.findings.map((finding) => finding.code),
  };
}

export function createIncident(input: {
  incidentClass: IncidentClass;
  severity?: ConstitutionalIncident["severity"];
  affectedSystems?: string[];
  replayRefs?: string[];
  containmentActions?: string[];
}): ConstitutionalIncident {
  const severity = input.severity ?? "MEDIUM";
  const constitutionalEscalationRequired =
    input.incidentClass === "constitutional" ||
    input.incidentClass === "replay" ||
    severity === "HIGH" ||
    severity === "CRITICAL";

  return {
    incidentId: `incident-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`,
    incidentClass: input.incidentClass,
    severity,
    detectionTimestamp: new Date().toISOString(),
    affectedSystems: input.affectedSystems ?? ["governance-runtime"],
    governanceEscalationPath: constitutionalEscalationRequired
      ? ["operator", "governance", "constitutional-authority"]
      : ["operator", "governance"],
    replayRefs: input.replayRefs ?? [],
    containmentActions: input.containmentActions ?? ["preserve-evidence"],
    resolutionState: constitutionalEscalationRequired ? "ESCALATED" : "OPEN",
  };
}

export function validateConfigChange(input: {
  configType: string;
  changesConstitutionalBehavior?: boolean;
  rollbackRef?: string | null;
  promotionRef?: string | null;
  replayRef?: string | null;
}) {
  const blockedReasons: string[] = [];

  if (!GOVERNED_CONFIG_TYPES.includes(input.configType as never)) {
    blockedReasons.push("unknown-config-type");
  }
  if (!input.rollbackRef) {
    blockedReasons.push("rollback-ref-required");
  }
  if (input.changesConstitutionalBehavior && !input.promotionRef) {
    blockedReasons.push("promotion-ref-required");
  }

  return {
    ok: blockedReasons.length === 0,
    configType: input.configType,
    controls: [...CONFIG_GOVERNANCE_CONTROLS],
    replayRef:
      input.replayRef ??
      `config-change-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,
    blockedReasons,
  };
}

export function validateUxGovernance(input: {
  text: string;
  disclosureVisible?: boolean;
  workflowVisible?: boolean;
  escalationVisible?: boolean;
  humanReviewVisible?: boolean;
  accessibilityEvidence?: boolean;
}) {
  const normalized = input.text.toLowerCase();
  const violations = PROHIBITED_UX_PATTERNS.filter((pattern) =>
    normalized.includes(pattern)
  );
  const missingControls = [
    ["disclosure visibility", input.disclosureVisible],
    ["workflow clarity", input.workflowVisible],
    ["escalation visibility", input.escalationVisible],
    ["human review visibility", input.humanReviewVisible],
    ["accessibility compliance", input.accessibilityEvidence],
  ]
    .filter(([, present]) => !present)
    .map(([control]) => control as string);

  return {
    ok: violations.length === 0 && missingControls.length === 0,
    controls: [...UX_GOVERNANCE_CONTROLS],
    violations,
    missingControls,
    replayRef: `ux-governance-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`,
  };
}

export function buildImplementationManifest() {
  return {
    source: MISSING_DOCTRINES_SOURCE,
    version: MISSING_DOCTRINES_VERSION,
    generatedAt: new Date().toISOString(),
    doctrineFamilies: [
      "RUNTIME-STATE-001",
      "FEATURE-GOV-001",
      "PUBLIC-CLAIMS-001",
      "INCIDENT-GOV-001",
      "CONFIG-GOV-001",
      "UX-GOV-001",
      "IMPLEMENTATION-MANIFEST-001",
    ],
    runtimeStates: RUNTIME_STATE_PROFILES.map((profile) => profile.state),
    features: FEATURE_GOVERNANCE_REGISTRY.map((feature) => feature.featureId),
    publicClaims: PUBLIC_CLAIM_REGISTRY.map((claim) => claim.claimScope),
    incidentClasses: [...INCIDENT_CLASSES],
    configTypes: [...GOVERNED_CONFIG_TYPES],
    uxControls: [...UX_GOVERNANCE_CONTROLS],
    traceabilityFields: [...IMPLEMENTATION_TRACEABILITY_FIELDS],
    tables: [...MISSING_DOCTRINE_TABLES],
    apiRoutes: [...MISSING_DOCTRINE_API_ROUTES],
    packageCommands: [...MISSING_DOCTRINE_PACKAGE_COMMANDS],
    modules: moduleManifests.map((manifest) => ({
      module: manifest.id,
      route: manifest.route,
      deploymentState: manifest.productionBlocked
        ? "awaiting_controlled_promotion"
        : "implemented",
      certificationState: manifest.productionBlocked
        ? "not-production-certified"
        : "certified",
      runtimeGate: manifest.requiredGovernance,
    })),
    eventContracts: eventContractRegistry.map((contract) => contract.eventType),
    handoffs: crossModuleHandoffMap.map((handoff) => handoff.id),
  };
}

export function implementationManifestComplete(): boolean {
  const manifest = buildImplementationManifest();

  return (
    manifest.doctrineFamilies.length === 7 &&
    manifest.runtimeStates.length === 12 &&
    manifest.tables.length === 31 &&
    manifest.apiRoutes.length === 25 &&
    manifest.packageCommands.length === 15 &&
    manifest.modules.length > 0 &&
    manifest.eventContracts.length > 0 &&
    manifest.handoffs.length > 0
  );
}

export function dispatchMissingDoctrineAction(
  action: string,
  body: Record<string, unknown> = {}
) {
  switch (action) {
    case "runtime.state.get":
      return {
        currentState: "DEVELOPMENT",
        states: RUNTIME_STATE_PROFILES,
      };
    case "runtime.transition.post":
      return transitionRuntimeState({
        fromState: (body.fromState as RuntimeOperationalMode) ?? "DEVELOPMENT",
        toState: (body.toState as RuntimeOperationalMode) ?? "SANDBOX",
        authorityRef: (body.authorityRef as string | null) ?? null,
      });
    case "runtime.restrictions.get":
      return {
        restrictions: RUNTIME_STATE_PROFILES.map((profile) => ({
          state: profile.state,
          blockedActions: profile.blockedActions,
          aiExecutionRestrictions: profile.aiExecutionRestrictions,
          connectorBehavior: profile.connectorBehavior,
          noticeBehavior: profile.noticeBehavior,
        })),
      };
    case "runtime.emergency-mode.post":
      return transitionRuntimeState({
        fromState: (body.fromState as RuntimeOperationalMode) ?? "DEVELOPMENT",
        toState: "EMERGENCY_GOVERNANCE",
        authorityRef: (body.authorityRef as string | null) ?? null,
      });
    case "features.get":
      return { features: FEATURE_GOVERNANCE_REGISTRY };
    case "features.activate.post":
      return activateFeature({
        featureId: (body.featureId as string) ?? "module-registry-runtime",
        productionRequested: Boolean(body.productionRequested),
      });
    case "features.deactivate.post":
      return {
        ok: true,
        featureId: (body.featureId as string) ?? "module-registry-runtime",
        requestedState: "deactivate",
        replayRef: `feature-deactivation-${Date.now()}`,
        blockedReasons: [],
      };
    case "features.rollback.post":
      return rollbackFeature({
        featureId: (body.featureId as string) ?? "module-registry-runtime",
      });
    case "claims.validate.post":
      return validatePublicClaim({
        text:
          (body.text as string) ??
          "Furlong facilitates governed coordination and advisory guidance only.",
      });
    case "claims.public.get":
      return { claims: PUBLIC_CLAIM_REGISTRY };
    case "claims.escalate.post":
      return {
        ok: true,
        escalationStatus: "HUMAN_REVIEW_REQUIRED",
        replayRef: `claim-escalation-${Date.now()}`,
      };
    case "incidents.create.post":
      return createIncident({
        incidentClass: (body.incidentClass as IncidentClass) ?? "operational",
        severity: (body.severity as ConstitutionalIncident["severity"]) ?? "MEDIUM",
      });
    case "incidents.escalate.post":
      return createIncident({
        incidentClass: (body.incidentClass as IncidentClass) ?? "constitutional",
        severity: (body.severity as ConstitutionalIncident["severity"]) ?? "HIGH",
      });
    case "incidents.status.get":
      return {
        ok: true,
        incidentClasses: [...INCIDENT_CLASSES],
        escalationRequiredFor: ["constitutional", "replay", "sovereignty", "CRITICAL"],
      };
    case "incidents.resolve.post":
      return {
        ok: true,
        resolutionState: "RESOLVED",
        containmentActions: ["evidence-preserved", "replay-verified"],
        replayRef: `incident-resolution-${Date.now()}`,
      };
    case "config.get":
      return {
        configTypes: [...GOVERNED_CONFIG_TYPES],
        controls: [...CONFIG_GOVERNANCE_CONTROLS],
      };
    case "config.change.post":
      return validateConfigChange({
        configType: (body.configType as string) ?? "feature toggles",
        changesConstitutionalBehavior: Boolean(body.changesConstitutionalBehavior),
        rollbackRef: (body.rollbackRef as string | null) ?? "rollback://local",
        promotionRef: (body.promotionRef as string | null) ?? null,
      });
    case "config.rollback.post":
      return {
        ok: true,
        rollbackSupported: true,
        replayRef: `config-rollback-${Date.now()}`,
      };
    case "ux.governance.get":
      return {
        controls: [...UX_GOVERNANCE_CONTROLS],
        prohibitedPatterns: [...PROHIBITED_UX_PATTERNS],
      };
    case "ux.validate.post":
      return validateUxGovernance({
        text: (body.text as string) ?? "Human review is pending.",
        disclosureVisible: body.disclosureVisible !== false,
        workflowVisible: body.workflowVisible !== false,
        escalationVisible: body.escalationVisible !== false,
        humanReviewVisible: body.humanReviewVisible !== false,
        accessibilityEvidence: body.accessibilityEvidence !== false,
      });
    case "ux.escalate.post":
      return {
        ok: true,
        escalationStatus: "UX_GOVERNANCE_REVIEW_REQUIRED",
        replayRef: `ux-escalation-${Date.now()}`,
      };
    case "implementation.manifest.get":
    case "implementation.coverage.get":
      return buildImplementationManifest();
    case "implementation.validate.post":
      return {
        ok: implementationManifestComplete(),
        manifestComplete: implementationManifestComplete(),
        replayRef: `implementation-validate-${Date.now()}`,
      };
    case "implementation.certify.post":
      return {
        ok: false,
        certificationState: "AWAITING_CONTROLLED_PROMOTION",
        blockedReasons: ["production-certification-requires-controlled-promotion"],
        replayRef: `implementation-certify-${Date.now()}`,
      };
    default:
      return {
        ok: false,
        blockedReasons: ["unknown-doctrine-action"],
      };
  }
}
