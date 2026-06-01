import "dotenv/config";

import fs from "fs";
import path from "path";

/**
 * Backend Module Readiness Gate
 *
 * Master Volume Governance:
 * - Vol I: records when backend constitutional authority is sufficient for
 *   module work to begin.
 * - Vol II: keeps regulated borrower, lender, sponsor, notice, document,
 *   billing, and partner modules bounded by verified backend controls.
 * - Vol III: verifies route, schema, runtime, and smoke coverage before
 *   frontend/product modules consume backend surfaces.
 * - Vol III-B: preserves runtime evidence and observability as module inputs.
 * - Vol IV: gives operators a clear stop/start line between backend foundation
 *   work and module work.
 * - Vol V: keeps live external action, production disclosure, replay,
 *   classification, content-claims, portability, verification, and
 *   source-authority limits explicit.
 * - Vol VI: governs source intelligence, public-safe source DTO aliases,
 *   module integration, conformance, and the current backend/module stop line.
 * - Batch 25 update: verifies environmental compliance records, fee controls,
 *   provider-license verification, and spoke-isolation before modules rely on
 *   environmental pathway state.
 */

type GateStatus = "PASS" | "WARN" | "BLOCK";

type GateCheck = {
  id: string;
  status: GateStatus;
  area: string;
  summary: string;
  detail: string;
};

const repoRoot = process.cwd();

function file(pathname: string): string {
  return path.join(repoRoot, pathname);
}

function exists(pathname: string): boolean {
  return fs.existsSync(file(pathname));
}

function read(pathname: string): string {
  return fs.readFileSync(file(pathname), "utf8");
}

function check(
  checks: GateCheck[],
  input: {
    id: string;
    area: string;
    passed: boolean;
    warning?: boolean;
    summary: string;
    passDetail: string;
    failDetail: string;
  }
): void {
  checks.push({
    id: input.id,
    area: input.area,
    status: input.passed ? "PASS" : input.warning ? "WARN" : "BLOCK",
    summary: input.summary,
    detail: input.passed ? input.passDetail : input.failDetail,
  });
}

function packageScripts(): Record<string, string> {
  return (
    JSON.parse(read("package.json")) as {
      scripts?: Record<string, string>;
    }
  ).scripts ?? {};
}

function allExist(pathnames: string[]): boolean {
  return pathnames.every((pathname) => exists(pathname));
}

function allIncluded(content: string, values: string[]): boolean {
  return values.every((value) => content.includes(value));
}

function allIncludedCaseInsensitive(content: string, values: string[]): boolean {
  const normalizedContent = content.toLowerCase();

  return values.every((value) =>
    normalizedContent.includes(value.toLowerCase())
  );
}

function main() {
  const checks: GateCheck[] = [];
  const scripts = packageScripts();
  const coverageMatrix = exists("docs/BACKEND_COVERAGE_MATRIX.md")
    ? read("docs/BACKEND_COVERAGE_MATRIX.md")
    : "";
  const readinessChecklist = exists("docs/BACKEND_READINESS_CHECKLIST.md")
    ? read("docs/BACKEND_READINESS_CHECKLIST.md")
    : "";

  const requiredDocs = [
    "docs/MASTER_VOLUME_SOURCE_SNAPSHOT.md",
    "docs/MASTER_VOLUME_BUILD_PROTOCOL.md",
    "docs/BACKEND_COVERAGE_MATRIX.md",
    "docs/BACKEND_READINESS_CHECKLIST.md",
    "docs/SECURITY_AUDIT_READINESS_GATE.md",
    "docs/PRODUCTION_AUTH_ACTIVATION_GATE.md",
    "docs/PRODUCTION_BACKEND_ACTIVATION_RUNBOOK.md",
    "docs/BACKEND_MODULE_READINESS_DECISION.md",
    "docs/MODULE_INTEGRATION_AND_PUBLIC_SURFACE_CONTRACT.md",
    "docs/master-volume-requirements.json",
  ];

  const requiredRoutes = [
    "src/app/api/auth/init/route.ts",
    "src/app/api/auth/[...nextauth]/route.ts",
    "src/app/api/auth/role-provisioning/route.ts",
    "src/app/api/applications/admin/route.ts",
    "src/app/api/documents/submit/route.ts",
    "src/app/api/documents/admin/route.ts",
    "src/app/api/documents/storage-handoff/route.ts",
    "src/app/api/connectors/source-check/route.ts",
    "src/app/api/connectors/adapters/route.ts",
    "src/app/api/connectors/execution/route.ts",
    "src/app/api/connectors/admin/route.ts",
    "src/app/api/connectors/credentialed-ingestion/route.ts",
    "src/app/api/connectors/credentialed-ingestion/admin/route.ts",
    "src/app/api/rules/evaluate/route.ts",
    "src/app/api/rules/admin/route.ts",
    "src/app/api/reviews/human/route.ts",
    "src/app/api/reviews/admin/route.ts",
    "src/app/api/reviews/transition/route.ts",
    "src/app/api/decisions/finalize/route.ts",
    "src/app/api/notices/deliver/route.ts",
    "src/app/api/notices/provider-execution/route.ts",
    "src/app/api/notices/receipts/route.ts",
    "src/app/api/notices/exceptions/resolve/route.ts",
    "src/app/api/notices/admin/route.ts",
    "src/app/api/queues/operator/route.ts",
    "src/app/api/queues/admin/route.ts",
    "src/app/api/partners/workflows/route.ts",
    "src/app/api/partners/admin/route.ts",
    "src/app/api/reports/pdf/route.ts",
    "src/app/api/reports/admin/route.ts",
    "src/app/api/billing/admin/route.ts",
    "src/app/api/billing/connectors/route.ts",
    "src/app/api/billing/execution/route.ts",
    "src/app/api/billing/connectors/admin/route.ts",
    "src/app/api/governance/live-action-readiness/route.ts",
    "src/app/api/governance/live-action-readiness/admin/route.ts",
    "src/app/api/governance/sovereign-consent-gateway/route.ts",
    "src/app/api/governance/sovereign-consent-gateway/admin/route.ts",
    "src/app/api/governance/environmental-compliance/route.ts",
    "src/app/api/governance/environmental-compliance/admin/route.ts",
    "src/app/api/governance/live-scraper-activation/route.ts",
    "src/app/api/governance/source-legal-review/route.ts",
    "src/app/api/governance/source-promotion-packets/route.ts",
    "src/app/api/ledger/admin/route.ts",
    "src/app/api/public/surfaces/route.ts",
    "src/app/api/public/grants/route.ts",
    "src/app/api/public/property-discovery/route.ts",
    "src/app/api/public/equipment/route.ts",
    "src/app/api/public/market-context/route.ts",
    "src/app/api/public/weather-risk/route.ts",
    "src/app/api/runtime/state/route.ts",
    "src/app/api/runtime/transition/route.ts",
    "src/app/api/runtime/restrictions/route.ts",
    "src/app/api/runtime/emergency-mode/route.ts",
    "src/app/api/features/route.ts",
    "src/app/api/features/activate/route.ts",
    "src/app/api/features/deactivate/route.ts",
    "src/app/api/features/rollback/route.ts",
    "src/app/api/claims/validate/route.ts",
    "src/app/api/claims/public/route.ts",
    "src/app/api/claims/escalate/route.ts",
    "src/app/api/incidents/create/route.ts",
    "src/app/api/incidents/escalate/route.ts",
    "src/app/api/incidents/status/route.ts",
    "src/app/api/incidents/resolve/route.ts",
    "src/app/api/config/route.ts",
    "src/app/api/config/change/route.ts",
    "src/app/api/config/rollback/route.ts",
    "src/app/api/ux/governance/route.ts",
    "src/app/api/ux/validate/route.ts",
    "src/app/api/ux/escalate/route.ts",
    "src/app/api/implementation/manifest/route.ts",
    "src/app/api/implementation/coverage/route.ts",
    "src/app/api/implementation/validate/route.ts",
    "src/app/api/implementation/certify/route.ts",
    "src/app/api/scrapers/route.ts",
    "src/app/api/scrapers/status/route.ts",
    "src/app/api/scrapers/run/route.ts",
    "src/app/api/scrapers/replay/route.ts",
    "src/app/api/scrapers/provenance/route.ts",
    "src/app/api/scrapers/classification/route.ts",
    "src/app/api/scrapers/escalate/route.ts",
    "src/app/api/source-ingestion/submit/route.ts",
    "src/app/api/source-ingestion/review/route.ts",
    "src/app/api/source-ingestion/classify/route.ts",
    "src/app/api/source-ingestion/reject/route.ts",
    "src/app/api/properties/discovery/route.ts",
    "src/app/api/properties/canonical/route.ts",
    "src/app/api/properties/replay/route.ts",
    "src/app/api/revenue-intelligence/opportunities/route.ts",
    "src/app/api/revenue-intelligence/catalog/route.ts",
    "src/app/api/revenue-intelligence/programs/route.ts",
    "src/app/api/revenue-intelligence/marketplace/route.ts",
    "src/app/api/revenue-intelligence/operating-costs/route.ts",
    "src/app/api/revenue-intelligence/market-signals/route.ts",
    "src/app/api/revenue-intelligence/geospatial/route.ts",
    "src/app/api/revenue-intelligence/state-registry/route.ts",
    "src/app/api/revenue-intelligence/customer-eligibility/route.ts",
    "src/app/api/revenue-intelligence/fusion/route.ts",
    "src/app/api/revenue-intelligence/claims/route.ts",
    "src/app/api/customer-revenue/advisory/route.ts",
    "src/app/api/source-stack/route.ts",
    "src/app/api/source-stack/canonicalization/route.ts",
    "src/app/api/source-stack/failover/route.ts",
    "src/app/api/source-stack/conflicts/route.ts",
    "src/app/api/source-stack/freshness/route.ts",
    "src/app/api/source-stack/observability/route.ts",
    "src/app/api/programs/search/route.ts",
    "src/app/api/revenue/opportunities/route.ts",
    "src/app/api/market-signals/route.ts",
    "src/app/api/geo/suitability/route.ts",
  ];

  const requiredRuntimeFiles = [
    "src/proxy.ts",
    "src/lib/auth/accessControl.ts",
    "src/lib/auth/recordAccess.ts",
    "src/lib/auth/authActivationPolicy.ts",
    "src/lib/auth/roleProvisioningStore.ts",
    "src/lib/security/apiSecurityPolicy.ts",
    "src/lib/governance/contentClaimsPolicy.ts",
    "src/lib/db/postgresSsl.ts",
    "src/lib/applications/applicationStore.ts",
    "src/lib/applications/applicationAdminStore.ts",
    "src/lib/documents/documentStore.ts",
    "src/lib/documents/documentAdminStore.ts",
    "src/lib/documents/storageHandoffStore.ts",
    "src/lib/connectors/externalDataConnectorStore.ts",
    "src/lib/connectors/certifiedConnectorAdapterStore.ts",
    "src/lib/connectors/externalConnectorExecutionStore.ts",
    "src/lib/connectors/connectorAdminStore.ts",
    "src/lib/connectors/credentialedAgencyIngestionStore.ts",
    "src/lib/connectors/credentialedIngestionAdminStore.ts",
    "src/lib/rules/ruleOverlayRegistryStore.ts",
    "src/lib/rules/ruleOverlayAdminStore.ts",
    "src/lib/reviews/humanReviewWorkflowStore.ts",
    "src/lib/reviews/reviewAdminStore.ts",
    "src/lib/reviews/reviewTransitionControlStore.ts",
    "src/lib/decisions/regulatedDecisionNoticeStore.ts",
    "src/lib/notices/borrowerNoticeDeliveryStore.ts",
    "src/lib/notices/borrowerNoticeProviderExecutionStore.ts",
    "src/lib/notices/borrowerNoticeReceiptStore.ts",
    "src/lib/notices/borrowerNoticeExceptionResolutionStore.ts",
    "src/lib/notices/borrowerNoticeAdminStore.ts",
    "src/lib/queues/operatorReviewQueueStore.ts",
    "src/lib/queues/operatorQueueAdminStore.ts",
    "src/lib/partners/partnerWorkflowStore.ts",
    "src/lib/partners/partnerWorkflowAdminStore.ts",
    "src/lib/reports/reportRecordStore.ts",
    "src/lib/billing/billingEventStore.ts",
    "src/lib/billing/paymentConnectorControlStore.ts",
    "src/lib/billing/paymentConnectorAdminStore.ts",
    "src/lib/governance/liveActionReadinessStore.ts",
    "src/lib/governance/liveActionReadinessAdminStore.ts",
    "src/lib/governance/sovereignConsentGatewayStore.ts",
    "src/lib/governance/sovereignConsentGatewayAdminStore.ts",
    "src/lib/governance/environmentalComplianceStore.ts",
    "src/lib/governance/environmentalComplianceAdminStore.ts",
    "src/lib/governance/liveScraperActivationGate.ts",
    "src/lib/governance/sourceLegalReviewGate.ts",
    "src/lib/governance/sourcePromotionPacketGate.ts",
    "src/lib/governance/constitutionalDoctrineRuntime.ts",
    "src/lib/governance/constitutionalDoctrineApi.ts",
    "src/lib/source-intelligence/sourceIntelligenceRuntime.ts",
    "src/lib/source-intelligence/sourceIntelligenceApi.ts",
    "src/lib/source-ingestion/index.ts",
    "src/lib/property-discovery/index.ts",
    "src/lib/canonical-properties/index.ts",
    "src/lib/provenance/index.ts",
    "src/lib/gis/index.ts",
    "src/lib/scrapers/registry.ts",
    "src/lib/scrapers/runner.ts",
    "src/lib/scrapers/scheduler.ts",
    "src/lib/scrapers/replay.ts",
    "src/lib/scrapers/provenance.ts",
    "src/lib/scrapers/classification.ts",
    "src/lib/scrapers/canonicalization.ts",
    "src/lib/scrapers/authority.ts",
    "src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts",
    "src/lib/revenue-intelligence/revenueSourceIntelligenceApi.ts",
    "src/lib/customer-revenue/index.ts",
    "src/lib/program-graph/index.ts",
    "src/lib/sellable-catalog/index.ts",
    "src/lib/ag-products/index.ts",
    "src/lib/livestock/index.ts",
    "src/lib/regional-eligibility/index.ts",
    "src/lib/marketplace-intel/index.ts",
    "src/lib/operating-costs/index.ts",
    "src/lib/market-signals/index.ts",
    "src/lib/geospatial-governance/index.ts",
    "src/lib/data-fusion/index.ts",
    "src/lib/source-stack/sourceStackRuntime.ts",
    "src/lib/source-stack/sourceStackApi.ts",
    "src/lib/source-stack/publicSourceIntelligenceApi.ts",
    "src/lib/canonicalization/index.ts",
    "src/lib/scrapers/conflict-resolution.ts",
    "src/lib/scrapers/market-signals.ts",
    "src/lib/scrapers/geo-intelligence.ts",
    "src/lib/ledger/auditLedgerAdminStore.ts",
    "src/db/schema/missingDoctrineGovernance.ts",
    "src/db/schema/scraperSourceGovernance.ts",
    "src/db/schema/revenueSourceIntelligenceGovernance.ts",
    "src/db/schema/externalSourceStackGovernance.ts",
    "src/lib/db/migrations/0032_external_source_stack_governance.sql",
    "src/db/schema/environmentalComplianceRecords.ts",
    "src/lib/db/migrations/0033_environmental_compliance_records.sql",
  ];

  const requiredIntegrationFiles = [
    "src/lib/modules/moduleRegistry.ts",
    "src/lib/modules/eventContractRegistry.ts",
    "src/lib/modules/caseContext.ts",
    "src/lib/modules/handoffMap.ts",
    "src/lib/modules/featureFlagGovernance.ts",
    "src/lib/dto/index.ts",
    "src/lib/dto/internal/index.ts",
    "src/lib/dto/borrower/index.ts",
    "src/lib/dto/lender/index.ts",
    "src/lib/dto/sponsor/index.ts",
    "src/lib/dto/public/index.ts",
    "src/lib/dto/publicSourceIntelligence.ts",
    "src/components/platform/PlatformShell.tsx",
    "src/components/platform/ModuleNav.tsx",
  ];

  const requiredScripts = [
    "verify:schema",
    "verify:backend",
    "smoke:backend",
    "security:audit",
    "auth:activation",
    "backend:production-readiness",
    "backend:module-readiness",
    "verify:environmental-compliance",
    "verify:master-volumes",
    "verify:module-manifests",
    "verify:modules",
    "verify:classification",
    "verify:ledger",
    "verify:replay",
    "verify:claims",
    "verify:runtime-states",
    "verify:feature-governance",
    "verify:public-claims",
    "verify:incident-governance",
    "verify:config-governance",
    "verify:ux-governance",
    "verify:implementation-manifest",
    "verify:missing-doctrines",
    "verify:scrapers",
    "verify:source-ingestion",
    "verify:connector-governance",
    "verify:property-discovery",
    "verify:source-authority",
    "verify:canonical-properties",
    "verify:provenance",
    "verify:sources",
    "verify:scraper-source-intelligence",
    "verify:revenue-intelligence",
    "verify:sellable-catalog",
    "verify:program-graph",
    "verify:marketplace-intel",
    "verify:operating-costs",
    "verify:market-signals",
    "verify:geospatial-governance",
    "verify:state-registry",
    "verify:customer-type-eligibility",
    "verify:data-fusion",
    "verify:customer-revenue-module",
    "verify:revenue-source-intelligence",
    "verify:source-stack",
    "verify:canonicalization",
    "verify:source-stack-architecture",
    "smoke:content-claims",
    "smoke:runtime-transitions",
    "smoke:feature-rollbacks",
    "smoke:incident-escalation",
    "smoke:config-rollbacks",
    "smoke:accessibility",
    "smoke:workflow-visibility",
    "smoke:governance-traceability",
    "smoke:deployment-conformance",
    "smoke:missing-doctrine-apis",
    "smoke:scraper-registry",
    "smoke:scraper-replay",
    "smoke:source-ingestion",
    "smoke:source-review",
    "smoke:connector-certification",
    "smoke:property-listings",
    "smoke:listing-canonicalization",
    "smoke:gist-reconciliation",
    "smoke:property-replay",
    "smoke:scraper-source-apis",
    "smoke:live-scraper-activation",
    "smoke:source-legal-review",
    "smoke:source-promotion-packets",
    "smoke:revenue-source-apis",
    "smoke:source-failover",
    "smoke:marketplace-ingestion",
    "smoke:source-conflict-resolution",
    "smoke:source-stack-apis",
    "smoke:environmental-compliance",
    "smoke:environmental-compliance-admin-read",
    "smoke:live-scraper-activation",
    "smoke:source-legal-review",
    "smoke:source-promotion-packets",
    "smoke:production-regulatory-response",
    "smoke:build-preservation",
    "smoke:doctrine-gap-ledger",
    "smoke:integration",
    "smoke:modules",
    "smoke:platform",
    "smoke:module-registry",
    "smoke:public-surfaces",
    "smoke:claims-public",
    "smoke:redaction",
    "smoke:cross-module-replay",
    "smoke:replay-cross-module",
  ];

  const requiredSmokeMarkers = [
    "smoke:ledger-admin-read",
    "smoke:missing-doctrine-apis",
    "smoke:scraper-source-apis",
    "smoke:revenue-source-apis",
    "smoke:source-stack-apis",
    "smoke:doctrine-gap-ledger",
    "smoke:source-legal-review",
    "smoke:source-promotion-packets",
    "smoke:persistence",
    "smoke:applications-admin-read",
    "smoke:documents",
    "smoke:documents-admin-read",
    "smoke:storage",
    "smoke:connectors",
    "smoke:credentialed-ingestion",
    "smoke:credentialed-ingestion-admin-read",
    "smoke:connector-execution",
    "smoke:connectors-admin-read",
    "smoke:certified-connectors",
    "smoke:reports-admin-read",
    "smoke:billing-admin-read",
    "smoke:payment-controls",
    "smoke:payment-controls-admin-read",
    "smoke:live-action-readiness",
    "smoke:live-action-readiness-admin-read",
    "smoke:sovereign-consent",
    "smoke:sovereign-consent-admin-read",
    "smoke:environmental-compliance",
    "smoke:environmental-compliance-admin-read",
    "smoke:rules",
    "smoke:rules-admin-read",
    "smoke:reviews",
    "smoke:reviews-admin-read",
    "smoke:review-transitions",
    "smoke:final-decisions",
    "smoke:notice-delivery",
    "smoke:notice-provider-execution",
    "smoke:notice-receipts",
    "smoke:notice-exceptions",
    "smoke:notice-admin-read",
    "smoke:queues",
    "smoke:queues-admin-read",
    "smoke:partners",
    "smoke:partners-admin-read",
    "smoke:record-access",
    "smoke:content-claims",
    "smoke:auth-activation-policy",
    "smoke:auth",
  ];

  check(checks, {
    id: "backend-module.master-volume-docs",
    area: "governance",
    passed: allExist(requiredDocs),
    summary:
      "Module work requires a documented Master Volume backend readiness decision.",
    passDetail:
      "Master Volume source, protocol, readiness, coverage, security, auth, production, and module readiness docs are present.",
    failDetail:
      "One or more Master Volume backend readiness documents are missing.",
  });

  check(checks, {
    id: "backend-module.route-surface",
    area: "routes",
    passed: allExist(requiredRoutes),
    summary:
      "The governed backend route surface must exist before module work begins.",
    passDetail:
      "Identity, applications, documents, connectors, reviews, notices, queues, partners, reports, billing, governance, and audit route surfaces are present.",
    failDetail:
      "One or more governed backend route surfaces are missing.",
  });

  check(checks, {
    id: "backend-module.runtime-surface",
    area: "runtime",
    passed: allExist(requiredRuntimeFiles),
    summary:
      "The governed backend runtime/store surface must exist before module work begins.",
    passDetail:
      "Access control, security, database SSL, applications, documents, connectors, rules, reviews, decisions, notices, queues, partners, reports, billing, governance, and audit runtimes are present.",
    failDetail:
      "One or more governed backend runtime/store files are missing.",
  });

  check(checks, {
    id: "backend-module.package-commands",
    area: "verification",
    passed: requiredScripts.every((script) => Boolean(scripts[script])),
    summary:
      "Backend readiness commands must be available before module work begins.",
    passDetail:
      "Schema, backend verification, smoke, security, auth, production readiness, and module readiness commands are wired.",
    failDetail:
      "One or more backend readiness package commands are missing.",
  });

  check(checks, {
    id: "backend-module.smoke-coverage",
    area: "verification",
    passed: allIncluded(scripts["smoke:backend"] ?? "", requiredSmokeMarkers),
    summary:
      "Full backend smoke coverage must include every governed module-facing surface.",
    passDetail:
      "Full backend smoke coverage includes all governed module-facing backend surfaces.",
    failDetail:
      "Full backend smoke coverage is missing one or more governed backend surfaces.",
  });

  check(checks, {
    id: "backend-module.verify-coverage",
    area: "verification",
    passed: allIncluded(scripts["verify:backend"] ?? "", [
      "verify:schema",
      "tsc --noEmit",
      "verify:master-volumes",
      "verify:missing-doctrines",
      "verify:scraper-source-intelligence",
      "verify:revenue-source-intelligence",
      "verify:source-stack-architecture",
      "smoke:security-policy",
      "smoke:content-claims",
      "smoke:auth-activation-policy",
      "auth:activation",
      "security:audit",
      "backend:production-readiness",
      "backend:module-readiness",
      "smoke:integration",
    ]),
    summary:
      "Backend verification must include schema, types, security, auth, production readiness, module readiness, and integration readiness.",
    passDetail:
      "Backend verification includes schema, type, security, auth, production readiness, module readiness, and integration gates.",
    failDetail:
      "Backend verification is missing one or more readiness gates.",
  });

  check(checks, {
    id: "backend-module.integration-architecture-files",
    area: "integration",
    passed: allExist(requiredIntegrationFiles),
    summary:
      "Module integration requires manifests, DTOs, events, case context, handoffs, feature flags, and platform shell files.",
    passDetail:
      "Manifest registry, DTO/view-model layer, event contract registry, shared case context, handoff map, feature flags, PlatformShell, and ModuleNav are present.",
    failDetail:
      "One or more required module integration architecture files are missing.",
  });

  check(checks, {
    id: "backend-module.integration-smoke-coverage",
    area: "verification",
    passed:
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:module-registry",
        "smoke:public-surfaces",
        "smoke:claims-public",
        "smoke:redaction",
        "smoke:replay-cross-module",
        "smoke:platform",
        "integrationSmokeTest.ts",
      ]) &&
      allIncluded(scripts["verify:backend"] ?? "", ["smoke:integration"]),
    summary:
      "Integration smoke coverage must verify manifests, public surfaces, claims, replay, and cross-module contracts.",
    passDetail:
      "Integration smoke coverage is wired and included in verify:backend.",
    failDetail:
      "Integration smoke coverage is missing one or more required checks or is not included in verify:backend.",
  });

  const integrationContract = exists(
    "docs/MODULE_INTEGRATION_AND_PUBLIC_SURFACE_CONTRACT.md"
  )
    ? read("docs/MODULE_INTEGRATION_AND_PUBLIC_SURFACE_CONTRACT.md")
    : "";

  check(checks, {
    id: "backend-module.integration-contract",
    area: "governance",
    passed: allIncluded(integrationContract, [
      "Module Manifest Layer",
      "Shared DTO/View Model Layer",
      "Event Contract Registry",
      "Shared Case Context Layer",
      "Public Surface Gateway",
      "Cross-Module Handoff Map",
      "Kill Switch and Feature Flag Governance",
      "Platform Shell",
      "Integration Smoke Layer",
    ]),
    summary:
      "The final module integration and public surface contract must document all new supplemental requirements.",
    passDetail:
      "The module integration contract documents manifests, DTOs, event contracts, case context, public gateway, handoffs, feature flags, shell, and smoke coverage.",
    failDetail:
      "The module integration contract is missing one or more required supplemental architecture requirements.",
  });

  const masterVolumeRequirementMatrix = exists(
    "docs/master-volume-requirements.json"
  )
    ? read("docs/master-volume-requirements.json")
    : "";

  check(checks, {
    id: "backend-module.master-volume-conformance-framework",
    area: "governance",
    passed:
      allExist([
        "src/scripts/masterVolumeConformanceTest.ts",
        "src/scripts/moduleConformanceTest.ts",
        "src/scripts/classificationConformanceTest.ts",
        "src/scripts/ledgerConformanceTest.ts",
        "src/scripts/replayConformanceTest.ts",
        "src/scripts/platformSmokeTest.ts",
        "src/scripts/redactionSmokeTest.ts",
        "src/scripts/missingDoctrineConformanceSuite.ts",
        "src/scripts/scraperSourceConformanceSuite.ts",
        "src/scripts/scraperSourceApiSmokeTest.ts",
        "src/scripts/revenueSourceIntelligenceConformanceSuite.ts",
        "src/scripts/revenueSourceApiSmokeTest.ts",
        "src/scripts/sourceStackConformanceSuite.ts",
        "src/scripts/sourceStackApiSmokeTest.ts",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
        "CONST-DATA-001",
        "TECH-REPLAY-001",
        "CANON-CLASS-001",
        "TECH-RBAC-001",
        "CANON-CLAIMS-001",
        "ROLE-ARCH-001",
        "REG-NEPA-001",
        "USDA-ENV-001",
        "TECH-CONN-001",
        "OPS-BORROWER-JOURNEY-001",
        "CANON-ECON-001",
        "CANON-SOVEREIGNTY-001",
        "PROMOTION-GATE-001",
        "MODULE-MANIFEST-001",
        "PUBLIC-SURFACE-001",
        "CROSS-MODULE-001",
        "RUNTIME-STATE-001",
        "FEATURE-GOV-001",
        "PUBLIC-CLAIMS-001",
        "INCIDENT-GOV-001",
        "CONFIG-GOV-001",
        "UX-GOV-001",
        "IMPLEMENTATION-MANIFEST-001",
        "VOLVI-CONSOLIDATION-001",
        "XREF-V22-001",
        "BUILD-CONFORMANCE-MATRIX-001",
        "NO-CAPABILITY-DRIFT-001",
        "SOURCEINT-001",
        "SOURCEINT-002",
        "SOURCE-AUTH-001",
        "CONNECTOR-CERT-001",
        "SOURCE-INGEST-001",
        "SOURCE-PROV-001",
        "SOURCE-REPLAY-001",
        "PROPERTY-DISC-001",
        "SCRAPER-SOURCE-GOV-001",
        "PROPERTY-DISCOVERY-GOV-001",
        "SOURCE-INTELLIGENCE-GOV-001",
        "REVENUE-INTEL-001",
        "SELLABLE-CATALOG-001",
        "PROGRAM-GRAPH-001",
        "MARKETPLACE-INTEL-001",
        "OPERATING-COST-GOV-001",
        "MARKET-SIGNAL-001",
        "GEOSPATIAL-GOV-001",
        "STATE-REGISTRY-001",
        "CUSTOMER-TYPE-ELIGIBILITY-001",
        "DATA-FUSION-001",
        "SOURCE-STACK-001",
        "SOURCE-FAILOVER-001",
        "CANONICALIZATION-PIPELINE-001",
        "EXTERNAL-SOURCE-RUNTIME-WORKPACKAGES-001",
        "PLATFORM-FED-001",
        "SURFACE-GOV-001",
        "CONFORMANCE-001",
        "MODULE-GATE-001",
        "MODULE-READINESS-001",
        "BACKEND-COVERAGE-001",
        "SURFACE-ALIGN-001",
      ]),
    summary:
      "Master Volume conformance testing must provide requirement traceability and constitutional proof commands.",
    passDetail:
      "Master Volume requirement matrix and conformance tests for modules, classification, ledger, replay, platform, redaction, and public claims are present.",
    failDetail:
      "Master Volume conformance framework is missing required matrix entries or proof scripts.",
  });

  check(checks, {
    id: "backend-module.environmental-compliance",
    area: "governance",
    passed:
      allExist([
        "src/app/api/governance/environmental-compliance/route.ts",
        "src/app/api/governance/environmental-compliance/admin/route.ts",
        "src/lib/governance/environmentalComplianceStore.ts",
        "src/lib/governance/environmentalComplianceAdminStore.ts",
        "src/db/schema/environmentalComplianceRecords.ts",
        "src/lib/db/migrations/0033_environmental_compliance_records.sql",
        "src/scripts/environmentalComplianceSmokeTest.ts",
        "src/scripts/environmentalComplianceAdminReadSmokeTest.ts",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
        "ROLE-ARCH-001",
        "REG-NEPA-001",
        "USDA-ENV-001",
        "TECH-CONN-001",
        "OPS-BORROWER-JOURNEY-001",
        "CANON-ECON-001",
        "CANON-SOVEREIGNTY-001",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:environmental-compliance",
        "smoke:environmental-compliance-admin-read",
      ]),
    summary:
      "Environmental pathway governance must exist before modules rely on environmental assessment state.",
    passDetail:
      "Environmental compliance records, borrower fee controls, provider license verification, spoke isolation, write/admin-read route surfaces, migration, and smoke coverage are wired.",
    failDetail:
      "Environmental compliance route, admin-read route, runtime, schema, migration, matrix entries, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.missing-doctrine-governance",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/constitutionalDoctrineRuntime.ts",
        "src/lib/governance/constitutionalDoctrineApi.ts",
        "src/db/schema/missingDoctrineGovernance.ts",
        "src/scripts/missingDoctrineConformanceSuite.ts",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
      "RUNTIME-STATE-001",
      "FEATURE-GOV-001",
      "PUBLIC-CLAIMS-001",
      "INCIDENT-GOV-001",
      "CONFIG-GOV-001",
      "UX-GOV-001",
      "IMPLEMENTATION-MANIFEST-001",
      ]) &&
      allIncluded(scripts["verify:missing-doctrines"] ?? "", [
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
      ]),
    summary:
      "Missing doctrine governance must be represented by runtime, schema, APIs, traceability, and tests.",
    passDetail:
      "Runtime states, feature activation, public claims, incidents, configuration, UX, and implementation traceability are wired into governance and verification.",
    failDetail:
      "One or more missing doctrine runtime, schema, route, matrix, or verification surfaces are absent.",
  });

  check(checks, {
    id: "backend-module.scraper-source-intelligence",
    area: "governance",
    passed:
      allExist([
        "src/lib/source-intelligence/sourceIntelligenceRuntime.ts",
        "src/lib/source-intelligence/sourceIntelligenceApi.ts",
        "src/db/schema/scraperSourceGovernance.ts",
        "src/lib/db/migrations/0030_scraper_source_governance.sql",
        "src/scripts/scraperSourceConformanceSuite.ts",
        "src/scripts/scraperSourceApiSmokeTest.ts",
        "src/app/api/scrapers/route.ts",
        "src/app/api/source-ingestion/submit/route.ts",
        "src/app/api/properties/discovery/route.ts",
        "src/app/api/public/grants/route.ts",
        "src/app/api/public/property-discovery/route.ts",
        "src/app/api/public/equipment/route.ts",
        "src/app/api/public/market-context/route.ts",
        "src/app/api/public/weather-risk/route.ts",
        "src/app/portal/property-discovery/page.tsx",
        "src/app/lender/property-opportunities/page.tsx",
        "src/app/sponsor/project-discovery/page.tsx",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
        "SCRAPER-SOURCE-GOV-001",
        "PROPERTY-DISCOVERY-GOV-001",
        "SOURCE-INTELLIGENCE-GOV-001",
        "SOURCEINT-001",
        "SOURCEINT-002",
        "SOURCE-AUTH-001",
        "CONNECTOR-CERT-001",
        "SOURCE-INGEST-001",
        "SOURCE-PROV-001",
        "SOURCE-REPLAY-001",
        "PROPERTY-DISC-001",
      ]) &&
      allIncluded(scripts["verify:scraper-source-intelligence"] ?? "", [
        "verify:scrapers",
        "verify:source-ingestion",
        "verify:connector-governance",
        "verify:property-discovery",
        "verify:source-authority",
        "verify:canonical-properties",
        "verify:provenance",
        "smoke:scraper-registry",
        "smoke:scraper-replay",
        "smoke:source-review",
        "smoke:connector-certification",
        "smoke:property-listings",
        "smoke:listing-canonicalization",
        "smoke:gist-reconciliation",
        "smoke:property-replay",
      ]),
    summary:
      "Scraper, source-ingestion, property discovery, and source-intelligence governance must be represented before dependent modules rely on them.",
    passDetail:
      "Source intelligence runtime, schema, APIs, public translation surfaces, conformance suite, API smoke test, matrix entries, and production blocks are wired.",
    failDetail:
      "One or more scraper/source-intelligence runtime, schema, route, matrix, public surface, or verification surfaces are absent.",
  });

  check(checks, {
    id: "backend-module.revenue-source-intelligence",
    area: "governance",
    passed:
      allExist([
        "src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts",
        "src/lib/revenue-intelligence/revenueSourceIntelligenceApi.ts",
        "src/db/schema/revenueSourceIntelligenceGovernance.ts",
        "src/lib/db/migrations/0031_revenue_source_intelligence_governance.sql",
        "src/scripts/revenueSourceIntelligenceConformanceSuite.ts",
        "src/scripts/revenueSourceApiSmokeTest.ts",
        "src/app/api/revenue-intelligence/opportunities/route.ts",
        "src/app/api/revenue-intelligence/fusion/route.ts",
        "src/app/api/customer-revenue/advisory/route.ts",
        "src/app/customer-revenue/page.tsx",
        "src/app/portal/revenue-opportunities/page.tsx",
        "src/app/lender/revenue-opportunities/page.tsx",
        "src/app/sponsor/revenue-opportunities/page.tsx",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
        "REVENUE-INTEL-001",
        "SELLABLE-CATALOG-001",
        "PROGRAM-GRAPH-001",
        "MARKETPLACE-INTEL-001",
        "OPERATING-COST-GOV-001",
        "MARKET-SIGNAL-001",
        "GEOSPATIAL-GOV-001",
        "STATE-REGISTRY-001",
        "CUSTOMER-TYPE-ELIGIBILITY-001",
        "DATA-FUSION-001",
      ]) &&
      allIncluded(scripts["verify:revenue-source-intelligence"] ?? "", [
        "verify:revenue-intelligence",
        "verify:sellable-catalog",
        "verify:program-graph",
        "verify:marketplace-intel",
        "verify:operating-costs",
        "verify:market-signals",
        "verify:geospatial-governance",
        "verify:state-registry",
        "verify:customer-type-eligibility",
        "verify:data-fusion",
        "verify:customer-revenue-module",
        "smoke:revenue-claims",
      ]),
    summary:
      "Revenue source intelligence must be represented before customer revenue, product, pricing, program, or opportunity surfaces rely on it.",
    passDetail:
      "Revenue intelligence runtime, schema, APIs, translation surfaces, conformance suite, API smoke test, matrix entries, and production blocks are wired.",
    failDetail:
      "One or more revenue source-intelligence runtime, schema, route, matrix, public surface, or verification surfaces are absent.",
  });

  check(checks, {
    id: "backend-module.source-stack-architecture",
    area: "governance",
    passed:
      allExist([
        "src/lib/source-stack/sourceStackRuntime.ts",
        "src/lib/source-stack/sourceStackApi.ts",
        "src/db/schema/externalSourceStackGovernance.ts",
        "src/lib/db/migrations/0032_external_source_stack_governance.sql",
        "src/scripts/sourceStackConformanceSuite.ts",
        "src/scripts/sourceStackApiSmokeTest.ts",
        "src/app/api/source-stack/route.ts",
        "src/app/api/source-stack/canonicalization/route.ts",
        "src/app/api/source-stack/failover/route.ts",
        "src/app/api/source-stack/conflicts/route.ts",
        "src/app/api/source-stack/freshness/route.ts",
        "src/app/api/source-stack/observability/route.ts",
        "src/app/api/programs/search/route.ts",
        "src/app/api/revenue/opportunities/route.ts",
        "src/app/api/market-signals/route.ts",
        "src/app/api/geo/suitability/route.ts",
        "src/app/api/public/grants/route.ts",
        "src/app/api/public/property-discovery/route.ts",
        "src/app/api/public/equipment/route.ts",
        "src/app/api/public/market-context/route.ts",
        "src/app/api/public/weather-risk/route.ts",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
        "SOURCE-STACK-001",
        "SOURCE-FAILOVER-001",
        "CANONICALIZATION-PIPELINE-001",
        "EXTERNAL-SOURCE-RUNTIME-WORKPACKAGES-001",
        "SURFACE-GOV-001",
      ]) &&
      allIncluded(scripts["verify:source-stack-architecture"] ?? "", [
        "verify:source-stack",
        "verify:source-authority",
        "verify:canonicalization",
        "verify:replay",
        "smoke:source-failover",
        "smoke:marketplace-ingestion",
        "smoke:source-conflict-resolution",
        "smoke:source-legal-review",
        "smoke:source-promotion-packets",
      ]),
    summary:
      "Canonical external source stack, failover, canonicalization, source freshness, conflicts, aliases, and public DTO boundaries must be represented before modules rely on source discovery.",
    passDetail:
      "Source stack runtime, schema, APIs, aliases, conformance suite, smoke test, matrix entries, and controlled production blocks are wired.",
    failDetail:
      "One or more source stack runtime, schema, route, matrix, conformance, alias, or verification surfaces are absent.",
  });

  check(checks, {
    id: "backend-module.source-legal-review-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/sourceLegalReviewGate.ts",
        "src/app/api/governance/source-legal-review/route.ts",
        "src/app/source-legal-review/page.tsx",
        "src/scripts/sourceLegalReviewGateSmokeTest.ts",
        "docs/MODULE_23_SOURCE_LEGAL_LICENSING_REVIEW_GATE.md",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
        "SOURCE-STACK-001",
        "SOURCE-AUTH-001",
        "CONNECTOR-CERT-001",
        "SOURCE-INGEST-001",
        "SOURCE-PROV-001",
        "SURFACE-GOV-001",
      ]) &&
      allIncluded(scripts["verify:source-stack-architecture"] ?? "", [
        "smoke:source-legal-review",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:source-legal-review",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:source-legal-review",
      ]),
    summary:
      "Source legal, ToS, licensing, anti-bulk, retention, republication, and public DTO review must gate source activation.",
    passDetail:
      "Source legal review runtime, API, internal surface, documentation, module integration, source-stack verification, and backend smoke coverage are wired while live fetch remains blocked.",
    failDetail:
      "Source legal review runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.source-promotion-packet-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/sourcePromotionPacketGate.ts",
        "src/app/api/governance/source-promotion-packets/route.ts",
        "src/app/source-promotion-packets/page.tsx",
        "src/scripts/sourcePromotionPacketGateSmokeTest.ts",
        "docs/MODULE_24_SOURCE_PROMOTION_PACKET_GATE.md",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
        "SOURCE-STACK-001",
        "SOURCE-AUTH-001",
        "CONNECTOR-CERT-001",
        "SOURCE-INGEST-001",
        "SOURCE-PROV-001",
        "SURFACE-GOV-001",
      ]) &&
      allIncluded(scripts["verify:source-stack-architecture"] ?? "", [
        "smoke:source-promotion-packets",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:source-promotion-packets",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:source-promotion-packets",
      ]),
    summary:
      "Source promotion packets must package legal, activation, replay, provenance, adapter, monitoring, rollback, incident, claims, and human approval evidence before source activation.",
    passDetail:
      "Source promotion packet runtime, API, internal surface, documentation, module integration, source-stack verification, and backend smoke coverage are wired while source promotion remains blocked.",
    failDetail:
      "Source promotion packet runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.source-production-readiness-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/sourceProductionReadinessGate.ts",
        "src/app/api/governance/source-production-readiness/route.ts",
        "src/app/source-production-readiness/page.tsx",
        "src/scripts/sourceProductionReadinessGateSmokeTest.ts",
        "docs/MODULE_25_SOURCE_PRODUCTION_READINESS_GATE.md",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
        "SOURCE-STACK-001",
        "SOURCE-AUTH-001",
        "CONNECTOR-CERT-001",
        "SOURCE-INGEST-001",
        "SOURCE-PROV-001",
        "SURFACE-GOV-001",
      ]) &&
      allIncluded(scripts["verify:source-stack-architecture"] ?? "", [
        "smoke:source-production-readiness",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:source-production-readiness",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:source-production-readiness",
      ]),
    summary:
      "Source production readiness must assemble final controlled-promotion evidence while keeping source activation and live fetch blocked.",
    passDetail:
      "Source production readiness runtime, API, internal surface, documentation, module integration, source-stack verification, and backend smoke coverage are wired while production source promotion remains blocked.",
    failDetail:
      "Source production readiness runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.controlled-promotion-activation-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/controlledPromotionActivationGate.ts",
        "src/app/api/governance/controlled-promotion-activation/route.ts",
        "src/app/controlled-promotion-activation/page.tsx",
        "src/scripts/controlledPromotionActivationGateSmokeTest.ts",
        "docs/MODULE_26_CONTROLLED_PROMOTION_ACTIVATION_GATE.md",
      ]) &&
      allIncluded(masterVolumeRequirementMatrix, [
        "SOURCE-STACK-001",
        "SOURCE-AUTH-001",
        "CONNECTOR-CERT-001",
        "SOURCE-INGEST-001",
        "SOURCE-PROV-001",
        "SURFACE-GOV-001",
      ]) &&
      allIncluded(scripts["verify:source-stack-architecture"] ?? "", [
        "smoke:controlled-promotion-activation",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:controlled-promotion-activation",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:controlled-promotion-activation",
      ]),
    summary:
      "Controlled promotion activation must assemble final activation ceremony evidence while keeping source activation and live fetch blocked.",
    passDetail:
      "Controlled promotion activation runtime, API, internal surface, documentation, module integration, source-stack verification, and backend smoke coverage are wired while activation execution remains blocked.",
    failDetail:
      "Controlled promotion activation runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-portal-readiness-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionPortalReadinessGate.ts",
        "src/app/api/governance/production-portal-readiness/route.ts",
        "src/app/production-portal-readiness/page.tsx",
        "src/scripts/productionPortalReadinessGateSmokeTest.ts",
        "docs/MODULE_27_PRODUCTION_PORTAL_READINESS_PREFLIGHT_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-portal-readiness",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-portal-readiness",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production portal readiness preflight gate",
      ]),
    summary:
      "Production portal readiness must assemble launch preflight evidence while keeping portal launch, public verification, live actions, payment capture, notice sends, and official reports blocked.",
    passDetail:
      "Production portal readiness runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while production portal launch remains blocked.",
    failDetail:
      "Production portal readiness runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-launch-evidence-packet",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionLaunchEvidencePacket.ts",
        "src/app/api/governance/production-launch-evidence/route.ts",
        "src/app/production-launch-evidence/page.tsx",
        "src/scripts/productionLaunchEvidencePacketSmokeTest.ts",
        "docs/MODULE_28_PRODUCTION_LAUNCH_EVIDENCE_PACKET.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-launch-evidence",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-launch-evidence",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production launch evidence packet",
      ]),
    summary:
      "Production launch evidence must assemble go-live proof while keeping portal launch, public verification, live actions, payment capture, notice sends, and official reports blocked.",
    passDetail:
      "Production launch evidence runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while go-live release remains blocked.",
    failDetail:
      "Production launch evidence runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.deployment-environment-readiness-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/deploymentEnvironmentReadinessGate.ts",
        "src/app/api/governance/deployment-environment-readiness/route.ts",
        "src/app/deployment-environment-readiness/page.tsx",
        "src/scripts/deploymentEnvironmentReadinessGateSmokeTest.ts",
        "docs/MODULE_29_DEPLOYMENT_ENVIRONMENT_READINESS_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:deployment-environment-readiness",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:deployment-environment-readiness",
      ]) &&
      allIncluded(coverageMatrix, [
        "Deployment environment readiness gate",
      ]),
    summary:
      "Deployment environment readiness must assemble release-candidate and production environment evidence while keeping deployment, secret activation, DNS cutover, migrations, and go-live release blocked.",
    passDetail:
      "Deployment environment readiness runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while deployment remains blocked.",
    failDetail:
      "Deployment environment readiness runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.release-candidate-freeze-plan",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/releaseCandidateFreezePlan.ts",
        "src/app/api/governance/release-candidate-freeze/route.ts",
        "src/app/release-candidate-freeze/page.tsx",
        "src/scripts/releaseCandidateFreezePlanSmokeTest.ts",
        "docs/MODULE_30_RELEASE_CANDIDATE_FREEZE_PLAN.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:release-candidate-freeze",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:release-candidate-freeze",
      ]) &&
      allIncluded(coverageMatrix, [
        "Release candidate freeze plan",
      ]),
    summary:
      "Release candidate freeze must assemble final freeze evidence while keeping freeze approval, candidate freeze, deployment, secret activation, DNS cutover, migrations, and go-live release blocked.",
    passDetail:
      "Release candidate freeze runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while freeze approval and deployment remain blocked.",
    failDetail:
      "Release candidate freeze runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-cutover-hold-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionCutoverHoldGate.ts",
        "src/app/api/governance/production-cutover-hold/route.ts",
        "src/app/production-cutover-hold/page.tsx",
        "src/scripts/productionCutoverHoldGateSmokeTest.ts",
        "docs/MODULE_31_PRODUCTION_CUTOVER_HOLD_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-cutover-hold",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-cutover-hold",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production cutover hold gate",
      ]),
    summary:
      "Production cutover hold must assemble final cutover, launch hold, deployment hold, freeze hold, public exposure, and release-manager evidence while keeping cutover, launch, deployment, and public production exposure blocked.",
    passDetail:
      "Production cutover hold runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while cutover, launch, deployment, and public exposure remain blocked.",
    failDetail:
      "Production cutover hold runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-release-board-evidence-packet",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionReleaseBoard.ts",
        "src/app/api/governance/production-release-board/route.ts",
        "src/app/production-release-board/page.tsx",
        "src/scripts/productionReleaseBoardSmokeTest.ts",
        "docs/MODULE_32_PRODUCTION_RELEASE_BOARD_EVIDENCE_PACKET.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-release-board",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-release-board",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production release board evidence packet",
      ]),
    summary:
      "Production release board must assemble release board, quorum, qualified release manager, security, compliance, operations, support, launch hold, cutover authority, public API exposure, and portal launch evidence while keeping board approval, cutover authority, deployment, and public production exposure blocked.",
    passDetail:
      "Production release board runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while board approval, cutover authority, launch hold release, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, notices, official reports, and public verification remain blocked.",
    failDetail:
      "Production release board runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-operations-monitoring-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionOperationsMonitoringGate.ts",
        "src/app/api/governance/production-operations-monitoring/route.ts",
        "src/app/production-operations-monitoring/page.tsx",
        "src/scripts/productionOperationsMonitoringGateSmokeTest.ts",
        "docs/MODULE_33_PRODUCTION_OPERATIONS_MONITORING_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-operations-monitoring",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-operations-monitoring",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production operations monitoring gate",
      ]),
    summary:
      "Production operations monitoring must assemble monitoring, alerting, on-call, incident, rollback, support, audit export, backup, restore, communications, emergency hold, and kill-switch evidence while keeping monitoring activation, cutover authority, deployment, and public production exposure blocked.",
    passDetail:
      "Production operations monitoring runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while operations approval, monitoring activation, on-call activation, incident bridge activation, rollback authorization, emergency hold release, cutover authority, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, notices, official reports, and public verification remain blocked.",
    failDetail:
      "Production operations monitoring runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-incident-response-readiness-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionIncidentResponseReadinessGate.ts",
        "src/app/api/governance/production-incident-response-readiness/route.ts",
        "src/app/production-incident-response-readiness/page.tsx",
        "src/scripts/productionIncidentResponseReadinessGateSmokeTest.ts",
        "docs/MODULE_34_PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-incident-response-readiness",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-incident-response-readiness",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production incident response readiness gate",
      ]),
    summary:
      "Production incident response readiness must assemble incident command, severity, escalation, rollback, support, communications, data integrity, replay, emergency hold, and kill-switch evidence while keeping incident activation, rollback, public communications, cutover authority, deployment, and public production exposure blocked.",
    passDetail:
      "Production incident response readiness runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while incident approval, incident activation, incident bridge activation, rollback authorization, emergency rollback, emergency hold release, kill-switch activation, customer communications, public status page, support escalation, cutover authority, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, notices, official reports, and public verification remain blocked.",
    failDetail:
      "Production incident response readiness runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-support-communications-readiness-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionSupportCommunicationsReadinessGate.ts",
        "src/app/api/governance/production-support-communications-readiness/route.ts",
        "src/app/production-support-communications-readiness/page.tsx",
        "src/scripts/productionSupportCommunicationsReadinessGateSmokeTest.ts",
        "docs/MODULE_35_PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-support-communications-readiness",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-support-communications-readiness",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production support communications readiness gate",
      ]),
    summary:
      "Production support communications readiness must assemble support routing, customer-safe language, public status, escalation, accessibility, translation, redaction, data rights, audit, replay, and communications freeze evidence while keeping support activation, communications release, notices, public status, cutover authority, deployment, and public production exposure blocked.",
    passDetail:
      "Production support communications readiness runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while support approval, support activation, support escalation, customer communications, regulatory communications, public status page, notices, official reports, public verification, legal advice, official reliance, incident activation, rollback authorization, cutover authority, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, and live external actions remain blocked.",
    failDetail:
      "Production support communications readiness runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-final-authority-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionFinalAuthorityGate.ts",
        "src/app/api/governance/production-final-authority/route.ts",
        "src/app/production-final-authority/page.tsx",
        "src/scripts/productionFinalAuthorityGateSmokeTest.ts",
        "docs/MODULE_36_PRODUCTION_FINAL_AUTHORITY_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-final-authority",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-final-authority",
      ]) &&
      allIncluded(coverageMatrix, ["Production final authority gate"]),
    summary:
      "Production final authority must assemble constitutional authority, release-manager, launch, deployment, cutover, operations, incident, support, communications, security, privacy, redaction, claims, audit, replay, and data-rights evidence while keeping final authority, go-live, hold release, deployment, and public production exposure blocked.",
    passDetail:
      "Production final authority runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while final authority approval, go-live approval, production launch authorization, constitutional attestation, release-manager approval, hold releases, support activation, communications release, public status page, cutover authority, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, notices, official reports, public verification, legal advice, official reliance, and live external actions remain blocked.",
    failDetail:
      "Production final authority runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-activation-ceremony-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionActivationCeremonyGate.ts",
        "src/app/api/governance/production-activation-ceremony/route.ts",
        "src/app/production-activation-ceremony/page.tsx",
        "src/scripts/productionActivationCeremonyGateSmokeTest.ts",
        "docs/MODULE_37_PRODUCTION_ACTIVATION_CEREMONY_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-activation-ceremony",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-activation-ceremony",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production activation ceremony gate",
      ]),
    summary:
      "Production activation ceremony must assemble final ceremony evidence while keeping ceremony approval, ceremony execution, production activation, post-activation verification, deployment, and public production exposure blocked.",
    passDetail:
      "Production activation ceremony runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while activation ceremony approval, ceremony execution, production activation, post-activation verification, final authority, go-live, hold releases, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, notices, official reports, public verification, legal advice, official reliance, and live external actions remain blocked.",
    failDetail:
      "Production activation ceremony runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-post-activation-verification-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionPostActivationVerificationGate.ts",
        "src/app/api/governance/production-post-activation-verification/route.ts",
        "src/app/production-post-activation-verification/page.tsx",
        "src/scripts/productionPostActivationVerificationGateSmokeTest.ts",
        "docs/MODULE_38_PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-post-activation-verification",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-post-activation-verification",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production post-activation verification gate",
      ]),
    summary:
      "Production post-activation verification must assemble verification evidence while keeping verification start, verification completion, production health certification, activation, deployment, and public production exposure blocked.",
    passDetail:
      "Production post-activation verification runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while verification approval, verification start, verification completion, production health certification, activation ceremony approval, ceremony execution, production activation, final authority, go-live, hold releases, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, notices, official reports, public verification, legal advice, official reliance, and live external actions remain blocked.",
    failDetail:
      "Production post-activation verification runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-reliance-verification-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionRelianceVerificationGate.ts",
        "src/app/api/governance/production-reliance-verification/route.ts",
        "src/app/production-reliance-verification/page.tsx",
        "src/scripts/productionRelianceVerificationGateSmokeTest.ts",
        "docs/MODULE_39_PRODUCTION_RELIANCE_VERIFICATION_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-reliance-verification",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-reliance-verification",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production reliance and public verification boundary gate",
      ]),
    summary:
      "Production reliance verification must assemble public verification and official reliance boundary evidence while keeping reliance authority, public verification, official reliance, legal advice, production health certification, activation, deployment, and public production exposure blocked.",
    passDetail:
      "Production reliance verification runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while production reliance approval, public verification approval, public verification gateway operation, public verification artifact publication, external reliance disclosure, regulatory reliance, official reliance, legal advice, post-activation verification approval, production health certification, activation, final authority, go-live, hold releases, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, notices, official reports, customer communications, public status, and live external actions remain blocked.",
    failDetail:
      "Production reliance verification runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-regulatory-examination-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionRegulatoryExaminationGate.ts",
        "src/app/api/governance/production-regulatory-examination/route.ts",
        "src/app/production-regulatory-examination/page.tsx",
        "src/scripts/productionRegulatoryExaminationGateSmokeTest.ts",
        "docs/MODULE_40_PRODUCTION_REGULATORY_EXAMINATION_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-regulatory-examination",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-regulatory-examination",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production regulatory examination and evidence archive gate",
      ]),
    summary:
      "Production regulatory examination must assemble examination and archive evidence while keeping regulator submission, official responses, archive certification, reliance authority, public verification, legal advice, deployment, and public production exposure blocked.",
    passDetail:
      "Production regulatory examination runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while package approval, regulator submission, portal upload, official regulator response, archive certification, retention certification, legal hold release, external examiner disclosure, production reliance, public verification, official reliance, legal advice, production health certification, activation, go-live, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, notices, official reports, customer communications, public status, and live external actions remain blocked.",
    failDetail:
      "Production regulatory examination runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.production-regulatory-response-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/productionRegulatoryResponseGate.ts",
        "src/app/api/governance/production-regulatory-response/route.ts",
        "src/app/production-regulatory-response/page.tsx",
        "src/scripts/productionRegulatoryResponseGateSmokeTest.ts",
        "docs/MODULE_41_PRODUCTION_REGULATORY_RESPONSE_GATE.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:production-regulatory-response",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:production-regulatory-response",
      ]) &&
      allIncluded(coverageMatrix, [
        "Production regulatory response and corrective action gate",
      ]),
    summary:
      "Production regulatory response must assemble response and corrective-action evidence while keeping official regulator response, corrective-action commitment, remediation execution, finding closure, reliance authority, public verification, legal advice, deployment, and public production exposure blocked.",
    passDetail:
      "Production regulatory response runtime, API, internal surface, documentation, module integration, integration smoke, and backend smoke coverage are wired while response package approval, official regulator response, corrective-action plan approval, corrective-action commitment, corrective-action execution, remediation plan approval, remediation execution, examiner finding closure, legal hold release, external examiner disclosure, production reliance, public verification, official reliance, legal advice, production health certification, activation, go-live, deployment, secrets, DNS, migrations, public APIs, portal launch, payments, notices, official reports, customer communications, public status, and live external actions remain blocked.",
    failDetail:
      "Production regulatory response runtime, route, page, documentation, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.build-preservation-evidence-archive-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/buildPreservationEvidenceArchiveGate.ts",
        "src/app/api/governance/build-preservation/route.ts",
        "src/app/build-preservation/page.tsx",
        "src/scripts/buildPreservationEvidenceArchiveGateSmokeTest.ts",
        "docs/MODULE_42_BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE.md",
        "docs/BUILD_SNAPSHOT_EVIDENCE_PACK_BR_2026_06_01_M41.md",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:build-preservation",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:build-preservation",
      ]) &&
      allIncluded(coverageMatrix, [
        "Build preservation and evidence archive gate",
      ]),
    summary:
      "Build preservation must freeze checkpoint BR-2026-06-01-M41, attach verification evidence, detect tree drift, verify ignored sensitive files, and keep production authority blocked.",
    passDetail:
      "Build preservation runtime, API, internal surface, documentation, build snapshot evidence pack, module integration, integration smoke, and backend smoke coverage are wired while production launch, deployment, public API exposure, portal launch, payments, notices, reports, public verification, official reliance, legal advice, regulatory response, corrective-action commitment, remediation execution, and live external actions remain blocked.",
    failDetail:
      "Build preservation runtime, route, page, documentation, evidence pack, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.doctrine-to-code-gap-ledger-gate",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/doctrineToCodeGapLedgerGate.ts",
        "src/app/api/governance/doctrine-gap-ledger/route.ts",
        "src/app/doctrine-gap-ledger/page.tsx",
        "src/scripts/doctrineToCodeGapLedgerGateSmokeTest.ts",
        "docs/MODULE_43_DOCTRINE_TO_CODE_GAP_LEDGER.md",
        "docs/DOCTRINE_TO_CODE_GAP_LEDGER.md",
        "docs/current-master-volume-registry.json",
      ]) &&
      allIncluded(scripts["smoke:integration"] ?? "", [
        "smoke:doctrine-gap-ledger",
      ]) &&
      allIncluded(scripts["smoke:backend"] ?? "", [
        "smoke:doctrine-gap-ledger",
      ]) &&
      allIncluded(coverageMatrix, [
        "Doctrine-to-code gap ledger gate",
      ]),
    summary:
      "Doctrine-to-code gap ledger must name every awaiting-controlled-promotion requirement with owner, route, blocked reason, required evidence, promotion condition, human authority, and current Master Volume version evidence.",
    passDetail:
      "Doctrine-to-code gap ledger runtime, API, internal surface, documentation, module integration, integration smoke, backend smoke coverage, current Master Volume registry evidence, named gap tickets, human authority boundaries, and production authority blocks are wired while production launch, public API exposure, portal launch, payments, notices, official reports, public verification, official reliance, legal advice, and live external actions remain blocked.",
    failDetail:
      "Doctrine-to-code gap ledger runtime, route, page, documentation, current version registry, matrix references, or smoke coverage is missing.",
  });

  check(checks, {
    id: "backend-module.live-action-boundaries",
    area: "live-action",
    passed: allIncluded(coverageMatrix, [
      "Real USDA/SBA/property external calls",
      "Authenticated agency portal session execution",
      "External notice provider sends",
      "Production payment capture",
      "Raw document content processing",
      "Public production API exposure",
      "Live revenue source refresh",
    ]),
    summary:
      "Live external actions must be separated from backend foundation completion.",
    passDetail:
      "Live external calls, authenticated agency sessions, notice sends, payment capture, raw document processing, and public production API exposure are explicitly separated from backend foundation readiness.",
    failDetail:
      "One or more live-action boundaries are missing from the backend coverage matrix.",
  });

  check(checks, {
    id: "backend-module.content-claims-policy",
    area: "governance",
    passed:
      allExist([
        "src/lib/governance/contentClaimsPolicy.ts",
        "src/scripts/contentClaimsPolicySmokeTest.ts",
      ]) &&
      allIncludedCaseInsensitive(coverageMatrix, [
        "Content claims governance",
        "lender-ready",
        "public verification",
        "borrower portability",
        "free borrower tier",
      ]) &&
      allIncludedCaseInsensitive(readinessChecklist, [
        "content claims governance",
        "borrower portability",
        "verification claims",
      ]),
    summary:
      "Customer-facing module work must pass governed content-claims policy before promotion.",
    passDetail:
      "Content claims policy, prohibited language smoke coverage, lender-ready limits, verification claim limits, free-tier protections, and borrower portability controls are documented and wired.",
    failDetail:
      "Content claims policy, smoke coverage, or module-start documentation is missing required public-claims controls.",
  });

  check(checks, {
    id: "backend-module.final-decision-language",
    area: "governance",
    passed: allIncludedCaseInsensitive(readinessChecklist, [
      "Backend Foundation Completion Decision",
      "backend foundation is complete for governed module work",
      "only modules remain",
    ]),
    summary:
      "The backend readiness checklist must contain the final module-start decision.",
    passDetail:
      "The readiness checklist records the final backend foundation completion decision.",
    failDetail:
      "The readiness checklist does not yet record the final backend foundation completion decision.",
  });

  const blocked = checks.filter((item) => item.status === "BLOCK");
  const warned = checks.filter((item) => item.status === "WARN");

  const output = {
    ok: blocked.length === 0,
    checkedAt: new Date().toISOString(),
    summary: {
      total: checks.length,
      pass: checks.filter((item) => item.status === "PASS").length,
      warn: warned.length,
      block: blocked.length,
    },
    decision:
      blocked.length === 0
        ? "Backend foundation is ready for governed module work. Production-live and live external action promotion remain separate module gates."
        : "Backend foundation is not ready for module work.",
    checks,
  };

  console.log(JSON.stringify(output, null, 2));

  if (blocked.length > 0) {
    process.exit(1);
  }
}

main();
