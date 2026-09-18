import {
  EventContract,
  eventContractRegistry,
} from "@/lib/modules/eventContractRegistry";
import { ModuleManifest, moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Module 45 — Human Authority Registry Runtime v1 (Build 36)
 *
 * Canonical machine-readable binding of every clearable action to
 * a named human role. Implements the Module 45 Human Authority
 * Registry Specification.
 *
 * The registry binds ROLES, not named individuals. Individuals are
 * assigned to roles in an access-control layer and recorded in the
 * audit ledger at clear-time. The registry never approves anything:
 * it declares who is permitted to clear what, and enforces that no
 * one else (and no AI) can.
 *
 * Key constitutional invariants enforced at validation:
 * - ai_permitted MUST be false on every binding.
 * - no_self_clear MUST be true (clearer ≠ requester).
 * - separation_of_duties MUST be true for any binding that touches
 *   funds, public statements, or production actions.
 * - quorum bindings MUST declare min_approvers ≥ 2.
 * - audit_event MUST be emitted to the append-only ledger when a
 *   clear actually occurs (the registry itself only declares the
 *   binding; runtime emission is an external concern).
 *
 * The runtime also computes per-module `intent`
 * (alpha_required / intentionally_held / internal_support) so the
 * Build Self-Report verdict roll-up can apply the §2 table:
 *
 *   intent              | authority assigned → verdict
 *   alpha_required      | PASS              → PASS
 *   intentionally_held  | PASS              → BLOCKED_BY_DESIGN
 *   internal_support    | N/A               → unchanged
 *
 * intentionally_held + authority assigned NEVER resolves to PASS.
 * That would falsely signal production-readiness. The §2 rule is
 * the heart of the Module 45 build.
 *
 * Constitutional posture: internal governance evidence only,
 * replay-safe, audit-safe, conflict-preserving. The runtime does
 * NOT authorize any action. It validates the registry shape and
 * exposes the data to the Build Self-Report for verdict
 * resolution.
 */

export const HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION =
  "human-authority-registry-runtime-v0.1.0";

export const HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION =
  "module-45-human-authority-registry-spec-v1.0";

export const HUMAN_AUTHORITY_REGISTRY_DOC_REF =
  "docs/DOCTRINE_HUMAN_AUTHORITY_REGISTRY_V1.md";

// =============================================================================
// Module intent classification
// =============================================================================

export type ModuleIntent =
  | "alpha_required"
  | "intentionally_held"
  | "internal_support";

// Alpha §3 ON list canonical module-id patterns.
const ALPHA_REQUIRED_PATTERNS: RegExp[] = [
  /^applications$/,
  /^documents$/,
  /^reviews$/,
  /^rules$/,
  /^notices$/,
  /^audit-replay$/,
  /^reports$/,
  /^data-rights$/,
  /^governance$/,
  /^promotion$/,
  /^governance-revenue-intelligence-v2$/,
  /^governance-opportunity-discovery-v2$/,
  /^governance-financing-pathway-engine-v2$/,
  /^governance-capital-graph$/,
  /^governance-customer-type-registry$/,
  /^governance-borrower-onboarding-core-v2$/,
  /^governance-readiness-assessment-v2$/,
  /^portal-borrower-/,
  /^lender-workflow$/,
  /^governance-lender-workflow-v2$/,
  /^operator-queue$/,
];

// Intentionally-held module-id patterns: production / live-fetch
// / regulatory chains that must remain blocked.
const INTENTIONALLY_HELD_PATTERNS: RegExp[] = [
  /^production-/,
  /^live-scraper-/,
  /^source-promotion-/,
  /^source-production-/,
  /^source-ingestion$/,
  /^source-legal-review$/,
  /^controlled-promotion-/,
  /^deployment-environment-/,
  /^release-candidate-/,
  /^doctrine-gap-ledger$/,
  /^build-preservation$/,
  /^operator-demo$/,
  /^billing$/,
  /^decisions$/,
  /^connectors$/,
];

export function deriveModuleIntent(manifest: ModuleManifest): ModuleIntent {
  if (
    manifest.claimsProfile === "live-action-blocked" ||
    INTENTIONALLY_HELD_PATTERNS.some((re) => re.test(manifest.id))
  ) {
    return "intentionally_held";
  }
  if (ALPHA_REQUIRED_PATTERNS.some((re) => re.test(manifest.id))) {
    return "alpha_required";
  }
  return "internal_support";
}

// =============================================================================
// Role registry (seed set)
// =============================================================================

export type HumanAuthorityRoleId =
  | "GOVERNANCE_OPERATOR"
  | "QUALIFIED_GOVERNANCE_REVIEWER"
  | "CREDIT_ELIGIBILITY_AUTHORITY"
  | "SOURCE_LEGAL_AUTHORITY"
  | "DATA_RIGHTS_OFFICER"
  | "CHIEF_GOVERNANCE_AUTHORITY"
  | "REGULATORY_LIAISON_AUTHORITY"
  | "DOCUMENT_VERIFICATION_REVIEWER"
  | "BORROWER_INTAKE_REVIEWER"
  | "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"
  | "SOVEREIGN_FEDERATION_AUTHORITY"
  | "THIRD_PARTY_RECORDS_AUTHORITY";

export type HumanAuthorityRoleDefinition = {
  roleId: HumanAuthorityRoleId;
  label: string;
  scope: string;
  notes: string;
};

export const HUMAN_AUTHORITY_ROLE_REGISTRY: ReadonlyArray<HumanAuthorityRoleDefinition> =
  [
    {
      roleId: "GOVERNANCE_OPERATOR",
      label: "Governance Operator",
      scope:
        "Day-to-day operator queue, reviews (05), notices (08 in-app).",
      notes: "Tier-1 operational. Clears no external action.",
    },
    {
      roleId: "QUALIFIED_GOVERNANCE_REVIEWER",
      label: "Qualified Governance Reviewer",
      scope:
        "Cross-source conflict review, evidence pack preparation, advisory composition review across the v2 stack.",
      notes:
        "Reviewer role used across Recommendation Precision Harness, Evidence Resolution Workflow, Document Evidence Reconciliation, and downstream advisory surfaces.",
    },
    {
      roleId: "CREDIT_ELIGIBILITY_AUTHORITY",
      label: "Credit / Eligibility Authority",
      scope:
        "The human credit / eligibility decision (lender workflow, decisions).",
      notes:
        "Authority sits at the lender / agency — never Furlong, never AI.",
    },
    {
      roleId: "SOURCE_LEGAL_AUTHORITY",
      label: "Source Legal Authority",
      scope:
        "Source legal / licensing review, promotion packets.",
      notes: "Clears live-source / live-scraper activation gates.",
    },
    {
      roleId: "DATA_RIGHTS_OFFICER",
      label: "Data Rights Officer",
      scope:
        "Borrower data-rights fulfillment (data-rights module).",
      notes: "Privacy accountability.",
    },
    {
      roleId: "CHIEF_GOVERNANCE_AUTHORITY",
      label: "Chief Governance Authority",
      scope:
        "Promotion (14), final authority (36), activation (37), reliance verification (39).",
      notes: "Highest gate; quorum required.",
    },
    {
      roleId: "REGULATORY_LIAISON_AUTHORITY",
      label: "Regulatory Liaison Authority",
      scope: "Regulatory examination (40), regulatory response (41).",
      notes:
        "Coordinates with external regulators; never makes regulatory determinations.",
    },
    {
      roleId: "DOCUMENT_VERIFICATION_REVIEWER",
      label: "Document Verification Reviewer",
      scope:
        "Verifies document evidence reconciliation findings (CONSISTENT / CLARIFICATION_REQUESTED).",
      notes:
        "Used by Document Evidence Reconciliation Workflow (Build 32).",
    },
    {
      roleId: "BORROWER_INTAKE_REVIEWER",
      label: "Borrower Intake Reviewer",
      scope:
        "Handles borrower clarification requests on intake-stage variances.",
      notes:
        "Used by Evidence Resolution Workflow (Build 31) and Document Evidence Reconciliation (Build 32).",
    },
    {
      roleId: "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER",
      label: "Environmental Engineering Spoke Reviewer",
      scope:
        "Environmental compliance gate review, spoke isolation review.",
      notes:
        "Used by Environmental Compliance v2 / Risk Assessment v2 / Escalation Engine v2.",
    },
    {
      roleId: "SOVEREIGN_FEDERATION_AUTHORITY",
      label: "Sovereign Federation Authority",
      scope:
        "Authorizes sovereign-tier escalation and review for federally-recognized tribal customer types.",
      notes:
        "Sovereign federation participation is recorded externally and propagates via the scope.sovereignFederationAllowed flag.",
    },
    {
      roleId: "THIRD_PARTY_RECORDS_AUTHORITY",
      label: "Third Party Records Authority",
      scope:
        "Coordinates third-party record verification (county recorder, title, etc.).",
      notes:
        "Used by Document Evidence Reconciliation for property-ownership variances.",
    },
  ];

const ROLE_IDS = new Set<HumanAuthorityRoleId>(
  HUMAN_AUTHORITY_ROLE_REGISTRY.map((r) => r.roleId)
);

// =============================================================================
// Binding types
// =============================================================================

export type HumanAuthorityClearingMode = "single" | "dual" | "quorum";

export type HumanAuthorityCredential = {
  type: "named-officer" | "credentialed-reviewer" | "external-authority";
  must_hold: string[];
  verified_by:
    | "access-control-layer"
    | "external-records"
    | "sovereign-federation-registry";
};

export type HumanAuthorityClearingRule = {
  mode: HumanAuthorityClearingMode;
  min_approvers: number;
  separation_of_duties: boolean;
  no_self_clear: boolean;
  // ai_permitted MUST be false. The validator rejects any binding
  // with true.
  ai_permitted: false;
};

export type HumanAuthorityBindingStatus =
  | "defined"
  | "role-unfilled"
  | "active";

export type HumanAuthorityBinding = {
  binding_id: string;
  module_id: string;
  module_number: number | null;
  clearable_action: string;
  intent: ModuleIntent;
  required_roles: HumanAuthorityRoleId[];
  credential: HumanAuthorityCredential;
  clearing_rule: HumanAuthorityClearingRule;
  evidence_required: string[];
  audit_event: string;
  status: HumanAuthorityBindingStatus;
};

// =============================================================================
// Canonical bindings — the seed Module 45 registry
// =============================================================================

const NAMED_OFFICER_GOV: HumanAuthorityCredential = {
  type: "named-officer",
  must_hold: ["governance-officer-credential"],
  verified_by: "access-control-layer",
};
const CREDENTIALED_REVIEWER: HumanAuthorityCredential = {
  type: "credentialed-reviewer",
  must_hold: ["governance-reviewer-credential"],
  verified_by: "access-control-layer",
};
const EXTERNAL_AUTHORITY: HumanAuthorityCredential = {
  type: "external-authority",
  must_hold: ["external-records-authority"],
  verified_by: "external-records",
};
const SOVEREIGN_AUTHORITY: HumanAuthorityCredential = {
  type: "external-authority",
  must_hold: ["sovereign-federation-credential"],
  verified_by: "sovereign-federation-registry",
};

const RULE_SINGLE: HumanAuthorityClearingRule = {
  mode: "single",
  min_approvers: 1,
  separation_of_duties: true,
  no_self_clear: true,
  ai_permitted: false,
};
const RULE_DUAL: HumanAuthorityClearingRule = {
  mode: "dual",
  min_approvers: 2,
  separation_of_duties: true,
  no_self_clear: true,
  ai_permitted: false,
};
const RULE_QUORUM: HumanAuthorityClearingRule = {
  mode: "quorum",
  min_approvers: 2,
  separation_of_duties: true,
  no_self_clear: true,
  ai_permitted: false,
};

export const HUMAN_AUTHORITY_BINDINGS: ReadonlyArray<HumanAuthorityBinding> = [
  // ────────────────────────────────────────────────────────────────────
  // Alpha §3 ON — operator + reviewer tier
  // ────────────────────────────────────────────────────────────────────
  {
    binding_id: "auth-applications-review-transition",
    module_id: "applications",
    module_number: 3,
    clearable_action: "transition application status",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR", "QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["application-review-record", "linked-evidence-pack"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-documents-completeness-check",
    module_id: "documents",
    module_number: 4,
    clearable_action: "accept document completeness check",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["document-metadata-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-reviews-transition",
    module_id: "reviews",
    module_number: 5,
    clearable_action: "transition human review state",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: [
      "review-transition-record",
      "linked-evidence-pack",
    ],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-rules-overlay-evaluation",
    module_id: "rules",
    module_number: 6,
    clearable_action: "record advisory overlay evaluation",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["rule-overlay-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-notices-in-app-prepare",
    module_id: "notices",
    module_number: 8,
    clearable_action: "prepare in-app notice packet",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["notice-packet-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-audit-replay-verify",
    module_id: "audit-replay",
    module_number: 9,
    clearable_action: "verify audit replay integrity",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR", "QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["replay-verification-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-reports-advisory-prepare",
    module_id: "reports",
    module_number: 13,
    clearable_action: "prepare watermarked advisory export",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["advisory-export-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-data-rights-fulfill",
    module_id: "data-rights",
    module_number: 19,
    clearable_action: "fulfill borrower data-rights request",
    intent: "alpha_required",
    required_roles: ["DATA_RIGHTS_OFFICER"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["data-rights-fulfillment-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-governance-posture-review",
    module_id: "governance",
    module_number: 1,
    clearable_action: "record governance posture review",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER", "CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["governance-posture-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },

  // ────────────────────────────────────────────────────────────────────
  // Intentionally-held (production + live chain)
  // ────────────────────────────────────────────────────────────────────
  {
    binding_id: "auth-promotion-gate-clear",
    module_id: "promotion",
    module_number: 14,
    clearable_action: "clear promotion / live-action gate",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["signed-authorization", "linked-evidence-pack"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-lender-submission-sandbox-dispatch",
    module_id: "lender-submission",
    module_number: null,
    clearable_action:
      "clear an exact-version package for sandbox dispatch after customer consent and recipient verification",
    intent: "intentionally_held",
    required_roles: ["GOVERNANCE_OPERATOR", "QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_DUAL,
    evidence_required: [
      "exact-version-package-review",
      "customer-submission-consent",
      "recipient-verification-record",
    ],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-signature-execution-release",
    module_id: "signature-execution",
    module_number: null,
    clearable_action:
      "authorize release of a validated executed PDF after signer-originated consent and intent",
    intent: "intentionally_held",
    required_roles: [
      "DOCUMENT_VERIFICATION_REVIEWER",
      "QUALIFIED_GOVERNANCE_REVIEWER",
    ],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_DUAL,
    evidence_required: [
      "exact-source-hash",
      "signer-authority-record",
      "signature-consent-and-intent-record",
      "executed-pdf-validation-report",
    ],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-production-final-authority",
    module_id: "production-final-authority",
    module_number: 36,
    clearable_action: "authorize production final sign-off",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["signed-authorization", "linked-evidence-pack"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-activation-ceremony",
    module_id: "production-activation-ceremony",
    module_number: 37,
    clearable_action: "perform production activation ceremony",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["signed-activation-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-reliance-verification",
    module_id: "production-reliance-verification",
    module_number: 39,
    clearable_action: "record production reliance verification",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["reliance-verification-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-regulatory-examination",
    module_id: "production-regulatory-examination",
    module_number: 40,
    clearable_action: "respond to regulatory examination",
    intent: "intentionally_held",
    required_roles: ["REGULATORY_LIAISON_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["regulatory-examination-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-regulatory-response",
    module_id: "production-regulatory-response",
    module_number: 41,
    clearable_action: "issue regulatory response",
    intent: "intentionally_held",
    required_roles: ["REGULATORY_LIAISON_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["regulatory-response-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-source-legal-review",
    module_id: "source-legal-review",
    module_number: null,
    clearable_action: "approve source legal / licensing review",
    intent: "intentionally_held",
    required_roles: ["SOURCE_LEGAL_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["source-legal-review-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-source-promotion-packets",
    module_id: "source-promotion-packets",
    module_number: null,
    clearable_action: "promote source packet to live action",
    intent: "intentionally_held",
    required_roles: ["SOURCE_LEGAL_AUTHORITY", "CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["promotion-packet-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-live-scraper-activation",
    module_id: "live-scraper-activation",
    module_number: null,
    clearable_action: "activate live scraper",
    intent: "intentionally_held",
    required_roles: ["SOURCE_LEGAL_AUTHORITY", "CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["scraper-activation-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-controlled-promotion-activation",
    module_id: "controlled-promotion-activation",
    module_number: null,
    clearable_action: "record controlled promotion activation",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["controlled-promotion-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-deployment-environment-readiness",
    module_id: "deployment-environment-readiness",
    module_number: null,
    clearable_action: "record deployment environment readiness",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["deployment-readiness-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-billing-payment-control",
    module_id: "billing",
    module_number: 12,
    clearable_action: "review payment connector control",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["payment-control-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-decisions-finalization-gate",
    module_id: "decisions",
    module_number: 7,
    clearable_action: "finalize external decision record",
    intent: "intentionally_held",
    required_roles: ["CREDIT_ELIGIBILITY_AUTHORITY"],
    credential: EXTERNAL_AUTHORITY,
    clearing_rule: RULE_DUAL,
    evidence_required: ["decision-finalization-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-connectors-certification",
    module_id: "connectors",
    module_number: 10,
    clearable_action: "certify connector adapter",
    intent: "intentionally_held",
    required_roles: ["SOURCE_LEGAL_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["connector-certification-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },

  // ────────────────────────────────────────────────────────────────────
  // v2 backbone advisory composition modules (alpha_required)
  // ────────────────────────────────────────────────────────────────────
  {
    binding_id: "auth-borrower-onboarding-core-v2-review",
    module_id: "governance-borrower-onboarding-core-v2",
    module_number: null,
    clearable_action:
      "review borrower onboarding core v2 composition + handoffs",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["bo-v2-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-readiness-assessment-v2-review",
    module_id: "governance-readiness-assessment-v2",
    module_number: null,
    clearable_action: "review readiness assessment v2 composition",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["ra-v2-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-opportunity-discovery-v2-review",
    module_id: "governance-opportunity-discovery-v2",
    module_number: null,
    clearable_action: "review opportunity discovery v2 composition",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["od-v2-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-financing-pathway-engine-v2-review",
    module_id: "governance-financing-pathway-engine-v2",
    module_number: null,
    clearable_action: "review financing pathway engine v2 composition",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["fpe-v2-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-revenue-intelligence-v2-review",
    module_id: "governance-revenue-intelligence-v2",
    module_number: null,
    clearable_action: "review revenue intelligence v2 composition",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["ri-v2-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-capital-graph-review",
    module_id: "governance-capital-graph",
    module_number: null,
    clearable_action: "review capital graph composition",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["capital-graph-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-customer-type-registry-review",
    module_id: "governance-customer-type-registry",
    module_number: null,
    clearable_action: "review customer type registry composition",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["customer-type-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },

  // ────────────────────────────────────────────────────────────────────
  // Environmental v2 chain (alpha_required for intake; spoke
  // isolation requires spoke reviewer)
  // ────────────────────────────────────────────────────────────────────
  {
    binding_id: "auth-environmental-intake-v2-review",
    module_id: "governance-environmental-intake-v2",
    module_number: null,
    clearable_action: "review environmental intake v2 composition",
    intent: "alpha_required",
    required_roles: ["ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["ei-v2-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-environmental-compliance-v2-review",
    module_id: "governance-environmental-compliance-v2",
    module_number: null,
    clearable_action: "review environmental compliance v2 gate posture",
    intent: "alpha_required",
    required_roles: ["ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["ec-v2-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-environmental-risk-assessment-v2-review",
    module_id: "governance-environmental-risk-assessment-v2",
    module_number: null,
    clearable_action: "review environmental risk assessment v2 overlay",
    intent: "alpha_required",
    required_roles: ["ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["era-v2-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-environmental-escalation-engine-v2-route",
    module_id: "governance-environmental-escalation-engine-v2",
    module_number: null,
    clearable_action: "route environmental escalation queue entry",
    intent: "alpha_required",
    required_roles: ["ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["escalation-queue-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-environmental-compliance-v1-review",
    module_id: "environmental-compliance",
    module_number: 21,
    clearable_action:
      "review environmental compliance record (v1 environmental compliance gate)",
    intent: "alpha_required",
    required_roles: ["ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["environmental-compliance-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },

  // ────────────────────────────────────────────────────────────────────
  // Workflow / harness modules
  // ────────────────────────────────────────────────────────────────────
  {
    binding_id: "auth-recommendation-precision-harness-review",
    module_id: "governance-recommendation-precision-harness",
    module_number: null,
    clearable_action: "review recommendation precision harness output",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["precision-harness-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-evidence-resolution-workflow-review",
    module_id: "governance-evidence-resolution-workflow",
    module_number: null,
    clearable_action: "process evidence resolution clarification request",
    intent: "alpha_required",
    required_roles: ["BORROWER_INTAKE_REVIEWER", "QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["clarification-request-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-document-evidence-reconciliation-review",
    module_id: "governance-document-evidence-reconciliation",
    module_number: null,
    clearable_action: "process document evidence reconciliation finding",
    intent: "alpha_required",
    required_roles: [
      "DOCUMENT_VERIFICATION_REVIEWER",
      "BORROWER_INTAKE_REVIEWER",
      "QUALIFIED_GOVERNANCE_REVIEWER",
    ],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["reconciliation-finding-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-data-transparency-posture-review",
    module_id: "governance-data-transparency-posture",
    module_number: null,
    clearable_action: "review data transparency posture audit",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["transparency-posture-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-build-self-report-review",
    module_id: "governance-build-self-report",
    module_number: null,
    clearable_action: "review build self-report audit",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["build-self-report-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-public-alpha-profile-review",
    module_id: "governance-public-alpha-profile",
    module_number: null,
    clearable_action: "review public alpha profile audit",
    intent: "alpha_required",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["public-alpha-profile-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-human-authority-registry-amend",
    module_id: "governance-human-authority-registry",
    module_number: 45,
    clearable_action: "amend human authority registry binding set",
    intent: "alpha_required",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["registry-amendment-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },

  // ────────────────────────────────────────────────────────────────────
  // Sovereign + third-party authorities
  // ────────────────────────────────────────────────────────────────────
  {
    binding_id: "auth-sovereign-federation-participation",
    module_id: "governance-environmental-escalation-engine-v2",
    module_number: null,
    clearable_action: "authorize sovereign federation participation",
    intent: "alpha_required",
    required_roles: ["SOVEREIGN_FEDERATION_AUTHORITY"],
    credential: SOVEREIGN_AUTHORITY,
    clearing_rule: RULE_DUAL,
    evidence_required: ["sovereign-federation-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-third-party-records-verification",
    module_id: "governance-document-evidence-reconciliation",
    module_number: null,
    clearable_action:
      "verify third-party records (property ownership / title / county)",
    intent: "alpha_required",
    required_roles: ["THIRD_PARTY_RECORDS_AUTHORITY"],
    credential: EXTERNAL_AUTHORITY,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["third-party-verification-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },

  // ────────────────────────────────────────────────────────────────────
  // Operator queue + lender workflow (alpha §3 ON)
  // ────────────────────────────────────────────────────────────────────
  {
    binding_id: "auth-operator-queue-transition",
    module_id: "operator-queue",
    module_number: null,
    clearable_action: "transition operator queue entry",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["operator-queue-transition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-lender-workflow-route",
    module_id: "lender-workflow",
    module_number: null,
    clearable_action: "route lender workflow handoff",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["lender-workflow-routing-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-lender-workflow-v2-review",
    module_id: "governance-lender-workflow-v2",
    module_number: null,
    clearable_action: "review lender workflow v2 composition",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["lender-workflow-v2-composition-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },

  // ────────────────────────────────────────────────────────────────────
  // Borrower portal modules (alpha §3 ON)
  // ────────────────────────────────────────────────────────────────────
  {
    binding_id: "auth-portal-borrower-onboarding-review",
    module_id: "portal-borrower-onboarding",
    module_number: null,
    clearable_action: "review borrower onboarding portal posture",
    intent: "alpha_required",
    required_roles: ["BORROWER_INTAKE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-onboarding-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-portal-borrower-financing-pathways-review",
    module_id: "portal-borrower-financing-pathways",
    module_number: null,
    clearable_action: "review borrower financing pathways portal posture",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-financing-pathways-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-portal-borrower-readiness-review",
    module_id: "portal-borrower-readiness",
    module_number: null,
    clearable_action: "review borrower readiness portal posture",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-readiness-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-portal-borrower-environmental-intake-review",
    module_id: "portal-borrower-environmental-intake",
    module_number: null,
    clearable_action: "review borrower environmental intake portal posture",
    intent: "alpha_required",
    required_roles: ["ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-environmental-intake-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-portal-borrower-opportunities-review",
    module_id: "portal-borrower-opportunities",
    module_number: null,
    clearable_action: "review borrower opportunities portal posture",
    intent: "alpha_required",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-opportunities-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-portal-borrower-applications-review",
    module_id: "portal-borrower-applications",
    module_number: null,
    clearable_action: "review borrower applications portal posture",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-applications-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-portal-borrower-documents-review",
    module_id: "portal-borrower-documents",
    module_number: null,
    clearable_action: "review borrower documents portal posture",
    intent: "alpha_required",
    required_roles: ["DOCUMENT_VERIFICATION_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-documents-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-portal-borrower-notices-review",
    module_id: "portal-borrower-notices",
    module_number: null,
    clearable_action: "review borrower notices portal posture",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-notices-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-portal-borrower-reports-review",
    module_id: "portal-borrower-reports",
    module_number: null,
    clearable_action: "review borrower reports portal posture",
    intent: "alpha_required",
    required_roles: ["GOVERNANCE_OPERATOR"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-reports-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },
  {
    binding_id: "auth-portal-borrower-data-rights-review",
    module_id: "portal-borrower-data-rights",
    module_number: null,
    clearable_action: "review borrower data-rights portal posture",
    intent: "alpha_required",
    required_roles: ["DATA_RIGHTS_OFFICER"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_SINGLE,
    evidence_required: ["borrower-data-rights-portal-record"],
    audit_event: "authority.cleared",
    status: "defined",
  },

  // ────────────────────────────────────────────────────────────────────
  // Intentionally-held production / source ingestion / portal /
  // release chain
  // ────────────────────────────────────────────────────────────────────
  {
    binding_id: "auth-governance-connector-certification-review",
    module_id: "governance-connector-certification",
    module_number: null,
    clearable_action: "review governance connector certification posture",
    intent: "intentionally_held",
    required_roles: ["SOURCE_LEGAL_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["connector-certification-governance-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-source-ingestion-review",
    module_id: "source-ingestion",
    module_number: null,
    clearable_action: "review source ingestion gate",
    intent: "intentionally_held",
    required_roles: ["SOURCE_LEGAL_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["source-ingestion-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-source-production-readiness-review",
    module_id: "source-production-readiness",
    module_number: null,
    clearable_action: "review source production readiness",
    intent: "intentionally_held",
    required_roles: ["SOURCE_LEGAL_AUTHORITY", "CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["source-production-readiness-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-portal-readiness-review",
    module_id: "production-portal-readiness",
    module_number: null,
    clearable_action: "review production portal readiness",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["production-portal-readiness-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-launch-evidence-review",
    module_id: "production-launch-evidence",
    module_number: null,
    clearable_action: "review production launch evidence",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["production-launch-evidence-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-release-candidate-freeze-review",
    module_id: "release-candidate-freeze",
    module_number: null,
    clearable_action: "clear release candidate freeze",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["release-candidate-freeze-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-cutover-hold-review",
    module_id: "production-cutover-hold",
    module_number: null,
    clearable_action: "clear production cutover hold",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["production-cutover-hold-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-release-board-review",
    module_id: "production-release-board",
    module_number: null,
    clearable_action: "convene production release board",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["production-release-board-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-operations-monitoring-review",
    module_id: "production-operations-monitoring",
    module_number: null,
    clearable_action: "review production operations monitoring posture",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["production-operations-monitoring-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-incident-response-readiness-review",
    module_id: "production-incident-response-readiness",
    module_number: null,
    clearable_action: "review production incident response readiness",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["incident-response-readiness-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-support-communications-readiness-review",
    module_id: "production-support-communications-readiness",
    module_number: null,
    clearable_action: "review production support communications readiness",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["support-communications-readiness-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-production-post-activation-verification-review",
    module_id: "production-post-activation-verification",
    module_number: null,
    clearable_action: "review production post-activation verification",
    intent: "intentionally_held",
    required_roles: ["CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_QUORUM,
    evidence_required: ["post-activation-verification-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-build-preservation-archive-review",
    module_id: "build-preservation",
    module_number: 42,
    clearable_action: "review build preservation archive",
    intent: "intentionally_held",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER", "CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["build-preservation-archive-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-doctrine-gap-ledger-review",
    module_id: "doctrine-gap-ledger",
    module_number: 43,
    clearable_action: "review doctrine-to-code gap ledger entry",
    intent: "intentionally_held",
    required_roles: ["QUALIFIED_GOVERNANCE_REVIEWER", "CHIEF_GOVERNANCE_AUTHORITY"],
    credential: NAMED_OFFICER_GOV,
    clearing_rule: RULE_DUAL,
    evidence_required: ["doctrine-gap-ledger-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
  {
    binding_id: "auth-operator-demo-review",
    module_id: "operator-demo",
    module_number: null,
    clearable_action: "review operator demo handoff",
    intent: "intentionally_held",
    required_roles: ["GOVERNANCE_OPERATOR", "QUALIFIED_GOVERNANCE_REVIEWER"],
    credential: CREDENTIALED_REVIEWER,
    clearing_rule: RULE_DUAL,
    evidence_required: ["operator-demo-record"],
    audit_event: "authority.cleared",
    status: "role-unfilled",
  },
];

// =============================================================================
// Filled-role declarations (sign-off input)
// =============================================================================

export type HumanAuthorityRoleFill = {
  roleId: HumanAuthorityRoleId;
  filledByCount: number;
  recordedBy: string;
  recordedAt: string;
};

// =============================================================================
// Input
// =============================================================================

export type HumanAuthorityRegistryInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  // Optional filled-role roster (typically supplied by an
  // access-control layer). When a role is filled, the registry's
  // bindings that require that role flip from "role-unfilled" to
  // "active".
  filledRoles?: HumanAuthorityRoleFill[];
  metadata?: Record<string, unknown> | null;
};

// =============================================================================
// Per-module authority resolution
// =============================================================================

export type ModuleHumanAuthorityStatus = "PASS" | "FAIL" | "WARN" | "N/A";

export type ModuleHumanAuthorityResolution = {
  moduleId: string;
  intent: ModuleIntent;
  bindingIds: string[];
  bindingCount: number;
  bindingsActive: number;
  bindingsRoleUnfilled: number;
  bindingsDefinedOnly: number;
  anyAiPermitted: boolean;
  anySelfClearAllowed: boolean;
  anyBelowQuorumQuorumBinding: boolean;
  status: ModuleHumanAuthorityStatus;
  reason: string;
};

// =============================================================================
// Validation findings
// =============================================================================

export type HumanAuthorityFindingCategory =
  | "BINDING_AI_PERMITTED"
  | "BINDING_SELF_CLEAR_ALLOWED"
  | "BINDING_QUORUM_INVALID"
  | "BINDING_UNKNOWN_ROLE"
  | "MODULE_BINDING_COVERAGE_MISSING"
  | "ALPHA_REQUIRED_ROLE_UNFILLED";

export type HumanAuthorityFinding = {
  findingId: string;
  category: HumanAuthorityFindingCategory;
  subjectBindingId?: string;
  subjectModuleId?: string;
  topic: string;
  reviewerExplanation: string;
  evidenceReplayRef: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
  doctrineRefs: string[];
  blockedClaims: string[];
};

// =============================================================================
// Signal types
// =============================================================================

export type HumanAuthoritySignalId =
  | "coverage_alignment"
  | "no_ai_alignment"
  | "role_filled_alignment"
  | "separation_of_duties_alignment";

export type HumanAuthoritySignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type HumanAuthoritySignal = {
  id: HumanAuthoritySignalId;
  label: string;
  status: HumanAuthoritySignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type HumanAuthorityCrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type HumanAuthorityRegistrySummary = {
  bindingCount: number;
  bindingsActive: number;
  bindingsRoleUnfilled: number;
  bindingsDefinedOnly: number;
  rolesDeclared: number;
  rolesFilled: number;
  modulesAudited: number;
  modulesAlphaRequired: number;
  modulesIntentionallyHeld: number;
  modulesInternalSupport: number;
  modulesAuthorityPass: number;
  modulesAuthorityFail: number;
  modulesAuthorityWarn: number;
  modulesAuthorityNA: number;
  coverageMissingCount: number;
  findingCount: number;
  crossSourceConflictCount: number;
  v1SignalCount: number;
  v1ReadyCount: number;
  v1NeedsInputCount: number;
  v1BlockedCount: number;
  v1NotStartedCount: number;
  v1OverallReadinessPercent: number;
};

export type HumanAuthorityRegistryResult = {
  runtimeVersion: string;
  specVersion: string;
  docRef: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  bindings: HumanAuthorityBinding[];
  roleRegistry: ReadonlyArray<HumanAuthorityRoleDefinition>;
  moduleResolutions: ModuleHumanAuthorityResolution[];
  filledRoles: HumanAuthorityRoleFill[];
  findings: HumanAuthorityFinding[];
  v1Signals: HumanAuthoritySignal[];
  crossSourceConflicts: HumanAuthorityCrossSourceConflict[];
  summary: HumanAuthorityRegistrySummary;
  exitCode: 0 | 1;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  humanAuthorityRegistryInternalOnly: true;
  noAiClearing: true;
  noSelfClear: true;
  noAutonomousDetermination: true;
  noInformationSale: true;
  noSilentSubmission: true;
  noApproval: true;
  noDenial: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLiveExternalAction: true;
  noSourceCertainty: true;
  noNoticeSend: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

// =============================================================================
// Disclosures
// =============================================================================

const REVIEW_ROUTE = "/governance/human-authority-registry";

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "denial",
  "rejection",
  "ai-clearing",
  "self-clear",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "live external action",
  "payment authorization",
  "notice send",
  "information sale",
  "silent submission",
] as const;

export const HUMAN_AUTHORITY_REGISTRY_DISCLOSURES = [
  "Human Authority Registry v1 output is internal advisory audit evidence only, replay-safe, audit-safe, and conflict-preserving.",
  "The registry does NOT decide anything. It declares who is permitted to clear what, and enforces that no one else (and no AI) can.",
  "AI is NEVER permitted to clear a governed action. Any binding with ai_permitted: true is a constitutional violation and is rejected at validation.",
  "No self-clear: the runtime refuses any clear where actor == requester.",
  "Quorum bindings refuse to clear below min_approvers.",
  "Every clear emits authority.cleared to the append-only audit ledger with the named human actor.",
  "Roles bind to credential requirements. Individuals are assigned to roles in an access-control layer and recorded at clear-time.",
  "intentionally_held modules with an assigned authority resolve to BLOCKED_BY_DESIGN — never PASS — because PASS for a held module would falsely signal production-readiness.",
  "Every finding resolves to REQUIRES_HUMAN_REVIEW.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const HUMAN_AUTHORITY_REGISTRY_PRODUCTION_RESTRICTIONS = [
  "no AI clearing",
  "no self-clear",
  "no autonomous determination",
  "no information sale",
  "no silent submission",
  "no secret distribution",
  "no marketing lead generation",
  "no denial",
  "no rejection",
  "no approval",
  "no preapproval",
  "no lender commitment",
  "no agency decision",
  "no official certification",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no source certainty",
  "no live external action",
  "no payment authorization",
  "no notice send",
] as const;

const DEFAULT_DOCTRINE_REFS = [
  "ROLE-ARCH-001",
  "CANON-ECON-001",
  "CANON-SOVEREIGNTY-001",
  "TECH-CONN-001",
  HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
];

const DEFAULT_FINDING_BLOCKED_CLAIMS = [
  "ai-clearing",
  "self-clear",
  "approval",
  "denial",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
];

// =============================================================================
// Validation + per-module resolution
// =============================================================================

const CLEARABLE_MODULE_INTENT_REQUIRES_BINDING: ModuleIntent[] = [
  "alpha_required",
  "intentionally_held",
];

function validateBinding(b: HumanAuthorityBinding): {
  aiPermitted: boolean;
  selfClearAllowed: boolean;
  quorumInvalid: boolean;
  unknownRoles: HumanAuthorityRoleId[];
} {
  const aiPermitted = b.clearing_rule.ai_permitted as boolean;
  const selfClearAllowed = !b.clearing_rule.no_self_clear;
  const quorumInvalid =
    b.clearing_rule.mode === "quorum" && b.clearing_rule.min_approvers < 2;
  const unknownRoles = b.required_roles.filter((r) => !ROLE_IDS.has(r));
  return { aiPermitted, selfClearAllowed, quorumInvalid, unknownRoles };
}

function resolveModuleAuthority(
  manifest: ModuleManifest,
  intent: ModuleIntent,
  bindings: HumanAuthorityBinding[],
  filledRoleIds: Set<HumanAuthorityRoleId>
): ModuleHumanAuthorityResolution {
  const matching = bindings.filter((b) => b.module_id === manifest.id);
  if (intent === "internal_support") {
    return {
      moduleId: manifest.id,
      intent,
      bindingIds: matching.map((b) => b.binding_id),
      bindingCount: matching.length,
      bindingsActive: 0,
      bindingsRoleUnfilled: 0,
      bindingsDefinedOnly: matching.length,
      anyAiPermitted: false,
      anySelfClearAllowed: false,
      anyBelowQuorumQuorumBinding: false,
      status: "N/A",
      reason: "internal_support module — no clearable action required.",
    };
  }
  if (matching.length === 0) {
    return {
      moduleId: manifest.id,
      intent,
      bindingIds: [],
      bindingCount: 0,
      bindingsActive: 0,
      bindingsRoleUnfilled: 0,
      bindingsDefinedOnly: 0,
      anyAiPermitted: false,
      anySelfClearAllowed: false,
      anyBelowQuorumQuorumBinding: false,
      status: "FAIL",
      reason: `${intent} module has no human-authority binding — coverage missing.`,
    };
  }
  let bindingsActive = 0;
  let bindingsRoleUnfilled = 0;
  let bindingsDefinedOnly = 0;
  let anyAiPermitted = false;
  let anySelfClearAllowed = false;
  let anyBelowQuorumQuorumBinding = false;
  for (const b of matching) {
    const v = validateBinding(b);
    if (v.aiPermitted) anyAiPermitted = true;
    if (v.selfClearAllowed) anySelfClearAllowed = true;
    if (v.quorumInvalid) anyBelowQuorumQuorumBinding = true;
    const allRolesFilled = b.required_roles.every((r) => filledRoleIds.has(r));
    if (allRolesFilled) {
      bindingsActive += 1;
    } else if (b.status === "role-unfilled") {
      bindingsRoleUnfilled += 1;
    } else {
      bindingsDefinedOnly += 1;
    }
  }
  let status: ModuleHumanAuthorityStatus;
  let reason: string;
  if (anyAiPermitted || anySelfClearAllowed || anyBelowQuorumQuorumBinding) {
    status = "FAIL";
    reason = `constitutional violation: ${[
      anyAiPermitted ? "ai_permitted=true" : null,
      anySelfClearAllowed ? "self-clear allowed" : null,
      anyBelowQuorumQuorumBinding ? "quorum min_approvers < 2" : null,
    ]
      .filter(Boolean)
      .join("; ")}.`;
  } else if (bindingsActive === matching.length) {
    status = "PASS";
    reason = `all ${matching.length} binding(s) have required roles filled; constitutional invariants hold.`;
  } else if (intent === "intentionally_held") {
    status = "WARN";
    reason = `intentionally_held module has ${matching.length - bindingsActive} binding(s) with unfilled roles — acceptable for held modules pending production sign-off.`;
  } else {
    status = "FAIL";
    reason = `alpha_required module has ${matching.length - bindingsActive} binding(s) with unfilled roles — Alpha entry blocked until filled.`;
  }
  return {
    moduleId: manifest.id,
    intent,
    bindingIds: matching.map((b) => b.binding_id),
    bindingCount: matching.length,
    bindingsActive,
    bindingsRoleUnfilled,
    bindingsDefinedOnly,
    anyAiPermitted,
    anySelfClearAllowed,
    anyBelowQuorumQuorumBinding,
    status,
    reason,
  };
}

// =============================================================================
// Public helpers (consumed by Build Self-Report)
// =============================================================================

/**
 * Return the canonical module-authority status for a given manifest.
 * Used by the Build Self-Report runtime to resolve the
 * `human_authority` cell.
 */
export function moduleHumanAuthorityResolutionFor(
  manifest: ModuleManifest,
  filledRoles: HumanAuthorityRoleFill[] = []
): ModuleHumanAuthorityResolution {
  const intent = deriveModuleIntent(manifest);
  const filledRoleIds = new Set<HumanAuthorityRoleId>(
    filledRoles
      .filter((f) => f.filledByCount > 0)
      .map((f) => f.roleId)
  );
  return resolveModuleAuthority(
    manifest,
    intent,
    [...HUMAN_AUTHORITY_BINDINGS],
    filledRoleIds
  );
}

// =============================================================================
// Findings
// =============================================================================

function buildFindings(
  resolutions: ModuleHumanAuthorityResolution[],
  bindings: HumanAuthorityBinding[]
): HumanAuthorityFinding[] {
  const findings: HumanAuthorityFinding[] = [];
  for (const b of bindings) {
    const v = validateBinding(b);
    if (v.aiPermitted) {
      findings.push({
        findingId: `har-binding-ai-permitted-${b.binding_id}`,
        category: "BINDING_AI_PERMITTED",
        subjectBindingId: b.binding_id,
        subjectModuleId: b.module_id,
        topic: `Binding ${b.binding_id} sets ai_permitted = true`,
        reviewerExplanation:
          "Constitutional violation: AI is NEVER permitted to clear a governed action. Reject or rewrite this binding.",
        evidenceReplayRef: `har-replay://binding/${b.binding_id}/ai-permitted`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (v.selfClearAllowed) {
      findings.push({
        findingId: `har-binding-self-clear-${b.binding_id}`,
        category: "BINDING_SELF_CLEAR_ALLOWED",
        subjectBindingId: b.binding_id,
        subjectModuleId: b.module_id,
        topic: `Binding ${b.binding_id} permits self-clear`,
        reviewerExplanation:
          "no_self_clear must be true on every binding. Self-clear (actor == requester) is forbidden.",
        evidenceReplayRef: `har-replay://binding/${b.binding_id}/self-clear`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (v.quorumInvalid) {
      findings.push({
        findingId: `har-binding-quorum-invalid-${b.binding_id}`,
        category: "BINDING_QUORUM_INVALID",
        subjectBindingId: b.binding_id,
        subjectModuleId: b.module_id,
        topic: `Binding ${b.binding_id} declares mode=quorum with min_approvers < 2`,
        reviewerExplanation:
          "Quorum bindings must declare min_approvers >= 2. Re-declare the binding.",
        evidenceReplayRef: `har-replay://binding/${b.binding_id}/quorum`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (v.unknownRoles.length > 0) {
      findings.push({
        findingId: `har-binding-unknown-role-${b.binding_id}`,
        category: "BINDING_UNKNOWN_ROLE",
        subjectBindingId: b.binding_id,
        subjectModuleId: b.module_id,
        topic: `Binding ${b.binding_id} references unknown role(s): ${v.unknownRoles.join(", ")}`,
        reviewerExplanation:
          "All required_roles must be declared in the role registry.",
        evidenceReplayRef: `har-replay://binding/${b.binding_id}/unknown-role`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  for (const r of resolutions) {
    if (
      CLEARABLE_MODULE_INTENT_REQUIRES_BINDING.includes(r.intent) &&
      r.bindingCount === 0
    ) {
      findings.push({
        findingId: `har-module-coverage-missing-${r.moduleId}`,
        category: "MODULE_BINDING_COVERAGE_MISSING",
        subjectModuleId: r.moduleId,
        topic: `Module ${r.moduleId} (intent=${r.intent}) has no human-authority binding`,
        reviewerExplanation: r.reason,
        evidenceReplayRef: `har-replay://module/${r.moduleId}/coverage`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (r.intent === "alpha_required" && r.status === "FAIL") {
      findings.push({
        findingId: `har-alpha-required-role-unfilled-${r.moduleId}`,
        category: "ALPHA_REQUIRED_ROLE_UNFILLED",
        subjectModuleId: r.moduleId,
        topic: `Alpha-required module ${r.moduleId}: ${r.reason}`,
        reviewerExplanation: r.reason,
        evidenceReplayRef: `har-replay://module/${r.moduleId}/role-fill`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  return findings;
}

// =============================================================================
// Signals
// =============================================================================

const V1_SIGNAL_IDS: readonly HumanAuthoritySignalId[] = [
  "coverage_alignment",
  "no_ai_alignment",
  "role_filled_alignment",
  "separation_of_duties_alignment",
];

const V1_SIGNAL_LABELS: Record<HumanAuthoritySignalId, string> = {
  coverage_alignment: "Coverage alignment",
  no_ai_alignment: "No-AI alignment",
  role_filled_alignment: "Role-filled alignment",
  separation_of_duties_alignment: "Separation-of-duties alignment",
};

const DEFAULT_SIGNAL_BLOCKED_CLAIMS = [
  "ai-clearing",
  "self-clear",
  "approval",
  "denial",
  "lender commitment",
  "agency decision",
  "official certification",
];

function buildSignal(
  id: HumanAuthoritySignalId,
  resolutions: ModuleHumanAuthorityResolution[],
  bindings: HumanAuthorityBinding[]
): HumanAuthoritySignal {
  let satisfied = 0;
  let total = 0;
  const reviewSignals: string[] = [];
  switch (id) {
    case "coverage_alignment": {
      const clearableModules = resolutions.filter(
        (r) =>
          r.intent === "alpha_required" || r.intent === "intentionally_held"
      );
      total = clearableModules.length;
      satisfied = clearableModules.filter((r) => r.bindingCount > 0).length;
      reviewSignals.push(
        `${satisfied} of ${total} clearable modules have ≥ 1 binding`
      );
      break;
    }
    case "no_ai_alignment":
      total = bindings.length;
      satisfied = bindings.filter((b) => !b.clearing_rule.ai_permitted).length;
      reviewSignals.push(
        `${satisfied} of ${total} bindings have ai_permitted = false`
      );
      break;
    case "role_filled_alignment": {
      const alphaRequired = resolutions.filter(
        (r) => r.intent === "alpha_required"
      );
      total = alphaRequired.length;
      satisfied = alphaRequired.filter((r) => r.status === "PASS").length;
      reviewSignals.push(
        `${satisfied} of ${total} alpha_required modules have all required roles filled`
      );
      break;
    }
    case "separation_of_duties_alignment": {
      total = bindings.length;
      satisfied = bindings.filter(
        (b) =>
          b.clearing_rule.separation_of_duties &&
          b.clearing_rule.no_self_clear
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} bindings enforce separation_of_duties and no_self_clear`
      );
      break;
    }
  }
  const ready = total === 0 ? true : satisfied === total;
  const readinessPercent =
    total === 0 ? 100 : Math.round((satisfied / total) * 100);
  return {
    id,
    label: V1_SIGNAL_LABELS[id],
    status: ready ? "READY_FOR_REVIEW" : "BLOCKED_BY_CONFLICT",
    readinessPercent,
    coverageCount: satisfied,
    reviewSignals,
    blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
  };
}

// =============================================================================
// Helpers
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

export function composeHumanAuthorityRegistry(
  input: HumanAuthorityRegistryInput = {}
): HumanAuthorityRegistryResult {
  const filledRoles = input.filledRoles ?? [];
  const filledRoleIds = new Set<HumanAuthorityRoleId>(
    filledRoles
      .filter((f) => f.filledByCount > 0)
      .map((f) => f.roleId)
  );

  // 1. Per-module resolution.
  const moduleResolutions: ModuleHumanAuthorityResolution[] =
    moduleManifests.map((m) => {
      const intent = deriveModuleIntent(m);
      return resolveModuleAuthority(
        m,
        intent,
        [...HUMAN_AUTHORITY_BINDINGS],
        filledRoleIds
      );
    });

  // 2. Findings.
  const findings = buildFindings(moduleResolutions, [
    ...HUMAN_AUTHORITY_BINDINGS,
  ]);

  // 3. Signals.
  const v1Signals = V1_SIGNAL_IDS.map((id) =>
    buildSignal(id, moduleResolutions, [...HUMAN_AUTHORITY_BINDINGS])
  );

  // 4. Cross-source conflicts.
  const crossSourceConflicts: HumanAuthorityCrossSourceConflict[] = [];
  if (findings.some((f) => f.category === "BINDING_AI_PERMITTED")) {
    crossSourceConflicts.push({
      conflictId: "har-v1-ai-permitted",
      topic: "Binding with ai_permitted=true detected",
      description: "Constitutional violation. Registry rejected.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (
    findings.some(
      (f) =>
        f.category === "BINDING_SELF_CLEAR_ALLOWED" ||
        f.category === "BINDING_QUORUM_INVALID" ||
        f.category === "BINDING_UNKNOWN_ROLE"
    )
  ) {
    crossSourceConflicts.push({
      conflictId: "har-v1-binding-rule-invalid",
      topic: "Binding rule invalid (self-clear / quorum / role)",
      description:
        "At least one binding violates no_self_clear, quorum>=2, or references an unknown role.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (
    findings.some(
      (f) => f.category === "MODULE_BINDING_COVERAGE_MISSING"
    )
  ) {
    crossSourceConflicts.push({
      conflictId: "har-v1-coverage-missing",
      topic: "Clearable module without a human-authority binding",
      description:
        "Alpha-required or intentionally-held module has no binding; coverage check failed.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (
    findings.some(
      (f) => f.category === "ALPHA_REQUIRED_ROLE_UNFILLED"
    )
  ) {
    crossSourceConflicts.push({
      conflictId: "har-v1-alpha-required-role-unfilled",
      topic: "Alpha-required module has required role unfilled",
      description:
        "Alpha entry is blocked until every alpha_required module's required roles are filled in the access-control layer.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  // 5. Summary.
  const bindings = [...HUMAN_AUTHORITY_BINDINGS];
  const bindingsActive = bindings.filter((b) =>
    b.required_roles.every((r) => filledRoleIds.has(r))
  ).length;
  const bindingsRoleUnfilled = bindings.filter(
    (b) =>
      b.status === "role-unfilled" &&
      !b.required_roles.every((r) => filledRoleIds.has(r))
  ).length;
  const bindingsDefinedOnly =
    bindings.length - bindingsActive - bindingsRoleUnfilled;

  const v1ReadyCount = v1Signals.filter(
    (s) => s.status === "READY_FOR_REVIEW"
  ).length;
  const v1NeedsInputCount = v1Signals.filter(
    (s) => s.status === "NEEDS_INPUT"
  ).length;
  const v1BlockedCount = v1Signals.filter(
    (s) => s.status === "BLOCKED_BY_CONFLICT"
  ).length;
  const v1NotStartedCount = v1Signals.filter(
    (s) => s.status === "NOT_STARTED"
  ).length;
  const v1OverallReadinessPercent =
    v1Signals.length === 0
      ? 0
      : Math.round(
          v1Signals.reduce((sum, s) => sum + s.readinessPercent, 0) /
            v1Signals.length
        );

  const summary: HumanAuthorityRegistrySummary = {
    bindingCount: bindings.length,
    bindingsActive,
    bindingsRoleUnfilled,
    bindingsDefinedOnly,
    rolesDeclared: HUMAN_AUTHORITY_ROLE_REGISTRY.length,
    rolesFilled: filledRoleIds.size,
    modulesAudited: moduleResolutions.length,
    modulesAlphaRequired: moduleResolutions.filter(
      (r) => r.intent === "alpha_required"
    ).length,
    modulesIntentionallyHeld: moduleResolutions.filter(
      (r) => r.intent === "intentionally_held"
    ).length,
    modulesInternalSupport: moduleResolutions.filter(
      (r) => r.intent === "internal_support"
    ).length,
    modulesAuthorityPass: moduleResolutions.filter(
      (r) => r.status === "PASS"
    ).length,
    modulesAuthorityFail: moduleResolutions.filter(
      (r) => r.status === "FAIL"
    ).length,
    modulesAuthorityWarn: moduleResolutions.filter(
      (r) => r.status === "WARN"
    ).length,
    modulesAuthorityNA: moduleResolutions.filter(
      (r) => r.status === "N/A"
    ).length,
    coverageMissingCount: moduleResolutions.filter(
      (r) =>
        CLEARABLE_MODULE_INTENT_REQUIRES_BINDING.includes(r.intent) &&
        r.bindingCount === 0
    ).length,
    findingCount: findings.length,
    crossSourceConflictCount: crossSourceConflicts.length,
    v1SignalCount: v1Signals.length,
    v1ReadyCount,
    v1NeedsInputCount,
    v1BlockedCount,
    v1NotStartedCount,
    v1OverallReadinessPercent,
  };

  // 6. Exit code per §6: exit 0 only if 100% coverage, zero
  // ai_permitted, zero self-clear, and every alpha_required module's
  // role is filled.
  const anyAi = findings.some((f) => f.category === "BINDING_AI_PERMITTED");
  const anySelfClear = findings.some(
    (f) => f.category === "BINDING_SELF_CLEAR_ALLOWED"
  );
  const coverageMissing = summary.coverageMissingCount > 0;
  const alphaRequiredUnfilled = moduleResolutions.some(
    (r) => r.intent === "alpha_required" && r.status === "FAIL"
  );
  const exitCode: 0 | 1 =
    anyAi || anySelfClear || coverageMissing || alphaRequiredUnfilled ? 1 : 0;

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
    "/governance/build-self-report",
    "/governance/public-alpha-profile",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
    "/module-readiness",
  ]);

  return {
    runtimeVersion: HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
    specVersion: HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
    docRef: HUMAN_AUTHORITY_REGISTRY_DOC_REF,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    bindings,
    roleRegistry: HUMAN_AUTHORITY_ROLE_REGISTRY,
    moduleResolutions,
    filledRoles,
    findings,
    v1Signals,
    crossSourceConflicts,
    summary,
    exitCode,
    recommendedReviewRoutes,
    disclosures: [...HUMAN_AUTHORITY_REGISTRY_DISCLOSURES],
    productionRestrictions: [
      ...HUMAN_AUTHORITY_REGISTRY_PRODUCTION_RESTRICTIONS,
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    humanAuthorityRegistryInternalOnly: true,
    noAiClearing: true,
    noSelfClear: true,
    noAutonomousDetermination: true,
    noInformationSale: true,
    noSilentSubmission: true,
    noApproval: true,
    noDenial: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    noNoticeSend: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function humanAuthorityRegistryLineage(): {
  runtimeVersion: string;
  specVersion: string;
  docRef: string;
  bindingCount: number;
  roleCount: number;
  eventContractCount: number;
} {
  return {
    runtimeVersion: HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
    specVersion: HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
    docRef: HUMAN_AUTHORITY_REGISTRY_DOC_REF,
    bindingCount: HUMAN_AUTHORITY_BINDINGS.length,
    roleCount: HUMAN_AUTHORITY_ROLE_REGISTRY.length,
    eventContractCount: eventContractRegistry.length,
  };
}

export const HUMAN_AUTHORITY_REGISTRY_SIGNAL_IDS = V1_SIGNAL_IDS;
