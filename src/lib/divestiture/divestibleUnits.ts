/**
 * DIVEST-001 — Divestiture-Ready Module Separability registry.
 *
 * Makes the founder intent explicit: Furlong must always be able to operate,
 * license, or DIVEST any designated module independently — never structurally
 * locked into keeping the whole. Extends Vol I (module independence; no module
 * reads another module's data store), Vol VI §6.12 (standalone deployment),
 * Vol III §3.9 (data export/portability).
 *
 * A unit is DIVESTIBLE only if it satisfies (verified by verify:module-separability):
 *   1. owns its data store(s); no other unit reads them (API-contract only),
 *   2. no shared-backend lock-in — shared deps are replaceable/licensable,
 *   3. declared dependencies (no hidden cross-unit coupling),
 *   4. can produce a carve-out kit: a data export + a run-alone manifest,
 *   5. is designated here.
 *
 * FOUNDER RE-DESIGNATION (approved 2026-06-08): EVERY module declares a unit —
 * no undeclared territory (verify:module-separability enforces full coverage).
 *   - source-intelligence   (divestible) — property/data engine + the consumer
 *                             property storefront (folded in per founder).
 *   - financing-intelligence (divestible, NEW) — the financing/grant/provider
 *                             marketplace IP: capital-graph, financing-pathway,
 *                             opportunity-discovery, revenue-intelligence,
 *                             customer-type, the financing lane, and the provider
 *                             revenue model (billing · partners · connectors).
 *   - lender-sponsor-surfaces (divestible) — lender/sponsor coordination.
 *   - borrower-experience    (divestible, NEW) — the consumer borrower portal.
 *   - core-governance-backbone (NON-divestible) — the constitutional backbone:
 *                             governance, audit/replay, rules, decisions, reviews,
 *                             production gates, governance engines, public pages.
 *
 * Edge-safe: pure data + helpers. ownedDataStores name ONLY the data domains a
 * unit owns EXCLUSIVELY (read by no other unit). Shared registries (audit-ledger,
 * source-authority-registry, module-registry, applications, properties,
 * borrowers, classification, replay-verification, revenue/program registries read
 * by more than one unit, …) belong to the CORE governance backbone and are
 * reached via the governance API, not owned by a divestible unit.
 */

export interface SharedDependency {
  /** Logical shared service/package the unit consumes via API contract. */
  name: string;
  /** Must be true: at separation it is replaceable or licensable — never a hard lock. */
  replaceable: boolean;
  note: string;
}

export interface DivestibleUnit {
  id: string;
  name: string;
  /** true = can be operated/licensed/sold independently; false = core backbone (stays with Furlong). */
  divestible: boolean;
  /** Module ids (moduleManifests) that make up this unit. */
  moduleIds: string[];
  /** Data domains this unit owns EXCLUSIVELY (no other unit may read them directly). */
  ownedDataStores: string[];
  /** Shared services consumed by API contract — all must be replaceable/licensable. */
  sharedDependencies: SharedDependency[];
  /** External services the unit needs to run standalone (its carve-out kit). */
  services: string[];
  /** Config/env keys the unit needs to run alone. */
  config: string[];
}

const GOVERNANCE_CLIENT: SharedDependency = {
  name: "governance-client (audit-ledger · classification · replay · observability)",
  replaceable: true,
  note: "Consumed via API contract only. At separation, licensable from Furlong or replaceable with the acquirer's own governance substrate. Never a hard import of Furlong's data store.",
};
const SHARED_REGISTRY: SharedDependency = {
  name: "shared registries (source-authority-registry · module-registry · participant-role-registry)",
  replaceable: true,
  note: "Read-only reference data via API; replaceable with an equivalent registry at separation.",
};

export const DIVESTIBLE_UNITS: DivestibleUnit[] = [
  {
    id: "source-intelligence",
    name: "Property & Source-Intelligence module (+ property storefront)",
    divestible: true,
    moduleIds: [
      "source-ingestion",
      "live-scraper-activation",
      "source-legal-review",
      "source-promotion-packets",
      "source-production-readiness",
      "portal-property-discovery",
    ],
    ownedDataStores: [
      "credential-vault-refs",
      "credentialed-scraping-events",
      "scraper-registry",
      "source-stack-registry",
      "provenance-records",
      "licensing-restrictions",
      "claims-restrictions",
      "public-dto-boundaries",
      "live-adapter-certification",
      "promotion-controls",
      "property-listing-records",
      "property-provenance-records",
    ],
    sharedDependencies: [GOVERNANCE_CLIENT, SHARED_REGISTRY],
    services: ["postgres (dedicated source-intelligence schema)", "object storage (scraped evidence)"],
    config: ["DATABASE_URL", "credential vault keys", "rate-limit profile"],
  },
  {
    id: "financing-intelligence",
    name: "Financing & provider-marketplace intelligence",
    divestible: true,
    moduleIds: [
      "governance-capital-graph",
      "governance-financing-pathway-engine-v2",
      "governance-opportunity-discovery-v2",
      "governance-revenue-intelligence-v2",
      "governance-customer-type-registry",
      "customer-revenue",
      "portal-revenue-opportunities",
      "portal-borrower-financing-pathways",
      "billing",
      "partners",
      "connectors",
    ],
    ownedDataStores: [
      "billing-events",
      "payment-connector-executions",
      "capital-taxonomy-registry",
      "revenue-source-intelligence",
      "state-regulatory-records",
      "customer-type-eligibility-profiles",
    ],
    sharedDependencies: [GOVERNANCE_CLIENT, SHARED_REGISTRY],
    services: ["postgres (dedicated financing-intelligence schema)", "payment connector(s)"],
    config: ["DATABASE_URL", "payment provider keys", "provider-license registry endpoint"],
  },
  {
    id: "lender-sponsor-surfaces",
    name: "Lender & Sponsor surfaces",
    divestible: true,
    moduleIds: [
      "lender-dashboard", "lender-workflow", "lender-applications", "lender-overlays",
      "lender-evidence", "lender-property-opportunities", "lender-revenue-opportunities",
      "sponsor-dashboard", "sponsor-readiness", "sponsor-reports",
      "sponsor-project-discovery", "sponsor-revenue-opportunities",
      "governance-lender-workflow-v2",
    ],
    ownedDataStores: [
      "evidence-packets",
      "property-replay-refs",
      "property-conflict-resolution-events",
      "property-review-events",
    ],
    sharedDependencies: [GOVERNANCE_CLIENT, SHARED_REGISTRY],
    services: ["postgres (dedicated lender/sponsor schema)"],
    config: ["DATABASE_URL", "auth provider / SSO"],
  },
  {
    id: "borrower-experience",
    name: "Borrower portal (consumer experience)",
    divestible: true,
    moduleIds: [
      "portal-borrower",
      "portal-borrower-applications",
      "portal-borrower-documents",
      "portal-borrower-notices",
      "portal-borrower-reports",
      "portal-borrower-readiness",
      "portal-borrower-onboarding",
      "portal-borrower-environmental-intake",
      "portal-borrower-data-rights",
      "portal-borrower-opportunities",
    ],
    ownedDataStores: [
      "review-transitions",
    ],
    sharedDependencies: [GOVERNANCE_CLIENT, SHARED_REGISTRY],
    services: ["postgres (dedicated borrower-portal schema)"],
    config: ["DATABASE_URL", "auth provider / SSO"],
  },
  {
    id: "core-governance-backbone",
    name: "Core governance backbone (stays with Furlong)",
    divestible: false,
    moduleIds: [
      "governance", "operator-queue", "applications", "documents", "reviews", "rules",
      "decisions", "notices", "audit-replay", "reports", "promotion", "case-command",
      "evidence-packets", "governance-recommendation-precision-harness",
      "governance-public-alpha-profile", "governance-public-alpha-customer-journey",
      "governance-disclosure-audit-gate", "governance-human-authority-registry",
      "governance-build-self-report", "governance-data-transparency-posture",
      "governance-document-evidence-reconciliation", "governance-evidence-resolution-workflow",
      "governance-environmental-escalation-engine-v2", "governance-environmental-risk-assessment-v2",
      "governance-environmental-compliance-v2", "governance-environmental-intake-v2",
      "governance-readiness-assessment-v2", "governance-borrower-onboarding-core-v2",
      "governance-connector-certification-v2", "governance-registry-framework-v2",
      "governance-certification-engine-v2", "governance-evidence-engine-v2",
      "governance-advanced-intelligence-v2", "governance-advanced-intelligence",
      "governance-connector-certification", "governance-registry-framework",
      "governance-certification-engine", "governance-evidence-engine", "exception-remediation",
      "data-rights", "module-readiness", "environmental-compliance", "controlled-promotion-activation",
      "production-portal-readiness", "production-launch-evidence", "deployment-environment-readiness",
      "release-candidate-freeze", "production-cutover-hold", "production-release-board",
      "production-operations-monitoring", "production-incident-response-readiness",
      "production-support-communications-readiness", "production-final-authority",
      "production-activation-ceremony", "production-post-activation-verification",
      "production-reliance-verification", "production-regulatory-examination",
      "production-regulatory-response", "build-preservation", "doctrine-gap-ledger",
      "operator-demo", "public-about", "public-trust",
    ],
    ownedDataStores: ["audit-ledger", "canonical-ledger", "data-classification-registry", "replay-verification"],
    sharedDependencies: [],
    services: ["postgres (governance schema)"],
    config: ["DATABASE_URL", "NEXTAUTH_SECRET"],
  },
];

export function divestibleUnitById(id: string): DivestibleUnit | null {
  return DIVESTIBLE_UNITS.find((u) => u.id === id) ?? null;
}

/** The carve-out kit: what a divestible unit exports and needs to run alone. */
export function buildCarveOutManifest(unitId: string) {
  const u = divestibleUnitById(unitId);
  if (!u) throw new Error(`Unknown divestible unit "${unitId}".`);
  return {
    unitId: u.id,
    unitName: u.name,
    divestible: u.divestible,
    modules: u.moduleIds,
    dataExport: {
      ownedDataStores: u.ownedDataStores,
      portability: "Vol III §3.9 — complete export of the unit's own data, no cross-store reads.",
    },
    runAlone: {
      services: u.services,
      config: u.config,
      sharedDependencies: u.sharedDependencies,
    },
  };
}
