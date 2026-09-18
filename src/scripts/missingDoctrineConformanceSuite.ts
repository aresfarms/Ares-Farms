import fs from "fs";
import path from "path";

import {
  FEATURE_GOVERNANCE_REGISTRY,
  GOVERNED_CONFIG_TYPES,
  INCIDENT_CLASSES,
  IMPLEMENTATION_TRACEABILITY_FIELDS,
  MISSING_DOCTRINE_API_ROUTES,
  MISSING_DOCTRINE_PACKAGE_COMMANDS,
  MISSING_DOCTRINE_TABLES,
  PROHIBITED_UX_PATTERNS,
  PUBLIC_CLAIM_REGISTRY,
  REQUIRED_FEATURE_METADATA,
  RUNTIME_STATE_PROFILES,
  UX_GOVERNANCE_CONTROLS,
  activateFeature,
  buildImplementationManifest,
  createIncident,
  implementationManifestComplete,
  rollbackFeature,
  runtimeStatesComplete,
  transitionRuntimeState,
  validateConfigChange,
  validatePublicClaim,
  validateUxGovernance,
} from "@/lib/governance/constitutionalDoctrineRuntime";

/**
 * Missing Doctrine Conformance Suite
 *
 * Verifies the supplemental Ares/Furlong Missing Governance Doctrines
 * Implementation Master across runtime states, feature governance, public
 * claims, incidents, configuration, UX, and implementation traceability.
 */

const repoRoot = process.cwd();
const mode = process.argv[2] ?? "all";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function exists(pathname: string): boolean {
  return fs.existsSync(path.join(repoRoot, pathname));
}

function routeFile(route: string): string {
  return `src/app${route}/route.ts`;
}

function packageScripts(): Record<string, string> {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"))
    .scripts as Record<string, string>;
}

function checkSchemaTables(): void {
  const schema = fs.readFileSync(
    path.join(repoRoot, "src/db/schema/missingDoctrineGovernance.ts"),
    "utf8"
  );

  for (const tableName of MISSING_DOCTRINE_TABLES) {
    assert(schema.includes(`"${tableName}"`), `${tableName} schema missing.`);
  }
}

function checkApiRoutes(): void {
  for (const route of MISSING_DOCTRINE_API_ROUTES) {
    assert(exists(routeFile(route)), `${route} route missing.`);
  }
}

function checkPackageCommands(): void {
  const scripts = packageScripts();

  for (const command of MISSING_DOCTRINE_PACKAGE_COMMANDS) {
    assert(Boolean(scripts[command]), `${command} package script missing.`);
  }
}

function verifyRuntimeStates() {
  assert(runtimeStatesComplete(), "Runtime state profiles are incomplete.");
  assert(RUNTIME_STATE_PROFILES.length === 12, "All 12 runtime states are required.");
  checkSchemaTables();
  checkApiRoutes();

  return {
    runtimeStates: RUNTIME_STATE_PROFILES.length,
    tables: MISSING_DOCTRINE_TABLES.filter((table) =>
      table.startsWith("runtime_")
    ).length,
  };
}

function smokeRuntimeTransitions() {
  const sandbox = transitionRuntimeState({
    fromState: "DEVELOPMENT",
    toState: "SANDBOX",
  });
  const blockedLive = transitionRuntimeState({
    fromState: "STAGING",
    toState: "PRODUCTION_LIVE",
  });
  const emergency = transitionRuntimeState({
    fromState: "DEGRADED_OPERATION",
    toState: "EMERGENCY_GOVERNANCE",
    authorityRef: "authority://constitutional-emergency",
  });

  assert(sandbox.ok, "Development to sandbox transition should be allowed.");
  assert(!blockedLive.ok, "Production live transition must require authority.");
  assert(emergency.ok, "Emergency transition with authority should be allowed.");

  return {
    allowedTransition: sandbox.toState,
    blockedReasons: blockedLive.blockedReasons,
    emergencyState: emergency.toState,
  };
}

function verifyFeatureGovernance() {
  assert(FEATURE_GOVERNANCE_REGISTRY.length > 0, "Feature registry is empty.");

  for (const feature of FEATURE_GOVERNANCE_REGISTRY) {
    assert(feature.featureId.length > 0, "feature_id missing.");
    assert(feature.governanceOwner.length > 0, "governance_owner missing.");
    assert(feature.constitutionalTags.length > 0, "constitutional_tags missing.");
    assert(feature.activationScope.length > 0, "activation_scope missing.");
    assert(feature.rollbackSupported, "rollback_supported must be true.");
    assert(feature.replaySafe, "replay_safe must be true.");
    assert(Array.isArray(feature.jurisdictionScope), "jurisdiction_scope missing.");
    assert(Boolean(feature.effectiveDates.effectiveFrom), "effective_dates missing.");
    assert(feature.activationAuditing, "activation auditing missing.");
  }

  return {
    requiredMetadata: REQUIRED_FEATURE_METADATA.length,
    features: FEATURE_GOVERNANCE_REGISTRY.length,
  };
}

function smokeFeatureRollbacks() {
  const activation = activateFeature({
    featureId: "public-surface-gateway",
    productionRequested: true,
  });
  const rollback = rollbackFeature({
    featureId: "public-surface-gateway",
  });

  assert(!activation.ok, "Production activation must remain blocked.");
  assert(
    activation.blockedReasons.includes("production-not-authorized"),
    "Production activation should state production-not-authorized."
  );
  assert(rollback.ok, "Feature rollback should be supported.");

  return {
    activationBlocked: activation.blockedReasons,
    rollbackState: rollback.requestedState,
  };
}

function verifyPublicClaims() {
  assert(PUBLIC_CLAIM_REGISTRY.length >= 3, "Public claim registry incomplete.");

  const safe = validatePublicClaim({
    text:
      "Furlong facilitates governed coordination and advisory guidance only. Human review is pending.",
  });
  const blocked = validatePublicClaim({
    text: "Furlong pre-approves borrowers for guaranteed funding.",
  });

  assert(safe.ok, "Safe public claim should pass.");
  assert(!blocked.ok, "Approval public claim should be blocked.");

  return {
    claimRegistry: PUBLIC_CLAIM_REGISTRY.length,
    blockedCodes: blocked.findingCodes,
  };
}

function verifyIncidentGovernance() {
  assert(INCIDENT_CLASSES.length === 9, "All incident classes are required.");

  const incident = createIncident({
    incidentClass: "replay",
    severity: "HIGH",
    replayRefs: ["replay://incident-test"],
  });

  assert(
    incident.resolutionState === "ESCALATED",
    "Replay or high-severity incidents must escalate."
  );
  assert(
    incident.governanceEscalationPath.includes("constitutional-authority"),
    "Constitutional escalation path missing."
  );

  return {
    incidentClasses: INCIDENT_CLASSES.length,
    escalationPath: incident.governanceEscalationPath,
  };
}

function smokeIncidentEscalation() {
  const incident = createIncident({
    incidentClass: "constitutional",
    severity: "CRITICAL",
    affectedSystems: ["runtime-state", "replay"],
    containmentActions: ["kill-switch", "preserve-evidence"],
  });

  assert(incident.resolutionState === "ESCALATED", "Incident was not escalated.");
  assert(incident.replayRefs.length === 0, "Smoke incident should not invent replay refs.");

  return {
    incidentClass: incident.incidentClass,
    severity: incident.severity,
    resolutionState: incident.resolutionState,
  };
}

function verifyConfigGovernance() {
  assert(GOVERNED_CONFIG_TYPES.length === 8, "Governed config types incomplete.");

  const invalid = validateConfigChange({
    configType: "ungoverned secret toggle",
    rollbackRef: null,
  });
  const constitutional = validateConfigChange({
    configType: "feature toggles",
    changesConstitutionalBehavior: true,
    rollbackRef: "rollback://feature-toggle",
  });

  assert(!invalid.ok, "Unknown configuration type should be blocked.");
  assert(
    !constitutional.ok &&
      constitutional.blockedReasons.includes("promotion-ref-required"),
    "Constitutional config changes must require promotion."
  );

  return {
    configTypes: GOVERNED_CONFIG_TYPES.length,
    invalidBlockers: invalid.blockedReasons,
  };
}

function smokeConfigRollbacks() {
  const change = validateConfigChange({
    configType: "deployment modes",
    rollbackRef: "rollback://deployment-mode",
    promotionRef: "promotion://controlled",
    changesConstitutionalBehavior: true,
  });

  assert(change.ok, "Config change with rollback and promotion refs should pass.");

  return {
    configType: change.configType,
    controls: change.controls.length,
  };
}

function verifyUxGovernance() {
  assert(UX_GOVERNANCE_CONTROLS.length === 7, "UX controls incomplete.");
  assert(PROHIBITED_UX_PATTERNS.length === 5, "Prohibited UX patterns incomplete.");

  const blocked = validateUxGovernance({
    text: "Use deceptive urgency and misleading approval indicators.",
    disclosureVisible: true,
    workflowVisible: true,
    escalationVisible: true,
    humanReviewVisible: true,
    accessibilityEvidence: true,
  });

  assert(!blocked.ok, "Prohibited UX patterns should be blocked.");

  return {
    controls: UX_GOVERNANCE_CONTROLS.length,
    prohibitedPatterns: PROHIBITED_UX_PATTERNS.length,
    violations: blocked.violations,
  };
}

function smokeAccessibility() {
  const missing = validateUxGovernance({
    text: "Human review is pending. More information may be needed.",
    disclosureVisible: true,
    workflowVisible: true,
    escalationVisible: true,
    humanReviewVisible: true,
    accessibilityEvidence: false,
  });
  const ok = validateUxGovernance({
    text: "Human review is pending. More information may be needed.",
    disclosureVisible: true,
    workflowVisible: true,
    escalationVisible: true,
    humanReviewVisible: true,
    accessibilityEvidence: true,
  });

  assert(!missing.ok, "Missing accessibility evidence should block UX promotion.");
  assert(ok.ok, "Accessible UX posture should pass.");

  return {
    missingControls: missing.missingControls,
    ok: ok.ok,
  };
}

function smokeWorkflowVisibility() {
  const missing = validateUxGovernance({
    text: "Your document was received. Human review is pending.",
    disclosureVisible: true,
    workflowVisible: false,
    escalationVisible: false,
    humanReviewVisible: true,
    accessibilityEvidence: true,
  });

  assert(!missing.ok, "Workflow and escalation visibility must be present.");

  return {
    missingControls: missing.missingControls,
  };
}

function verifyImplementationManifest() {
  assert(
    implementationManifestComplete(),
    "Implementation manifest is incomplete."
  );
  checkPackageCommands();
  checkApiRoutes();
  checkSchemaTables();

  const manifest = buildImplementationManifest();

  assert(
    IMPLEMENTATION_TRACEABILITY_FIELDS.every((field) =>
      manifest.traceabilityFields.includes(field)
    ),
    "Implementation traceability fields are incomplete."
  );

  return {
    doctrineFamilies: manifest.doctrineFamilies.length,
    apiRoutes: manifest.apiRoutes.length,
    tables: manifest.tables.length,
    packageCommands: manifest.packageCommands.length,
  };
}

function smokeGovernanceTraceability() {
  const manifest = buildImplementationManifest();

  assert(
    manifest.modules.every((module) => module.runtimeGate.length > 0),
    "Every module must carry runtime gate traceability."
  );
  assert(
    manifest.eventContracts.length > 0 && manifest.handoffs.length > 0,
    "Event contract and handoff traceability are required."
  );

  return {
    modules: manifest.modules.length,
    eventContracts: manifest.eventContracts.length,
    handoffs: manifest.handoffs.length,
  };
}

function smokeDeploymentConformance() {
  const manifest = buildImplementationManifest();

  assert(
    manifest.modules.every(
      (module) =>
        module.deploymentState === "awaiting_controlled_promotion" ||
        module.deploymentState === "implemented"
    ),
    "Deployment state must be explicit."
  );
  assert(
    manifest.modules.some(
      (module) => module.certificationState === "not-production-certified"
    ),
    "Production certification boundaries must remain explicit."
  );

  return {
    modules: manifest.modules.length,
    notProductionCertified: manifest.modules.filter(
      (module) => module.certificationState === "not-production-certified"
    ).length,
  };
}

const checks: Record<string, () => Record<string, unknown>> = {
  "runtime-states": verifyRuntimeStates,
  "runtime-transitions": smokeRuntimeTransitions,
  "feature-governance": verifyFeatureGovernance,
  "feature-rollbacks": smokeFeatureRollbacks,
  "public-claims": verifyPublicClaims,
  "incident-governance": verifyIncidentGovernance,
  "incident-escalation": smokeIncidentEscalation,
  "config-governance": verifyConfigGovernance,
  "config-rollbacks": smokeConfigRollbacks,
  "ux-governance": verifyUxGovernance,
  accessibility: smokeAccessibility,
  "workflow-visibility": smokeWorkflowVisibility,
  "implementation-manifest": verifyImplementationManifest,
  "governance-traceability": smokeGovernanceTraceability,
  "deployment-conformance": smokeDeploymentConformance,
};

function main() {
  const selected =
    mode === "all"
      ? Object.entries(checks)
      : [[mode, checks[mode]]] as Array<[string, (() => Record<string, unknown>) | undefined]>;

  const results: Record<string, Record<string, unknown>> = {};

  for (const [checkName, run] of selected) {
    assert(Boolean(run), `Unknown missing doctrine conformance mode: ${checkName}`);
    results[checkName] = run!();
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        mode,
        results,
        message: "Missing doctrine conformance suite passed.",
      },
      null,
      2
    )
  );
}

main();
