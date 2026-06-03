/**
 * Universal Capital Graph Runtime
 *
 * Constitutional funding backbone for Ares/Furlong. Composes the canonical
 * capital taxonomy, program registry, eligibility evaluator, and pathway
 * matcher into deterministic, replay-safe, conflict-preserving, advisory-
 * only governance evidence.
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): each program names its qualified
 *   sponsor authority; the runtime never claims constitutional authority
 *   or autonomous capital allocation.
 * - Vol II (Regulatory Governance): every program carries jurisdiction,
 *   regulatory boundary, and prohibited-use posture; matching is review-
 *   bound and not a regulatory determination.
 * - Vol III (Technical Infrastructure): provides deterministic, replay-
 *   safe composition over the canonical taxonomy and registry.
 * - Vol III-B (Governance Runtime): supplies runtime guard, classification,
 *   version lineage, observability, explainability, and replay verification
 *   posture for every match.
 * - Vol IV (Operational Runbooks): routes governed handoffs to sponsor
 *   review, controlled promotion, financing pathway guidance, opportunity
 *   discovery, advanced intelligence, lender workflow, evidence engine,
 *   certification engine, registry framework, governance, and reviews.
 * - Vol V (Canonical Doctrines): preserves claims governance, source
 *   authority, controlled disclosure, replay, audit, portability, and
 *   advisory-only boundaries on every program and pathway.
 * - Vol VI (Source Intelligence Integration): keeps every program registry
 *   entry behind a public-safe DTO with classification filtering and
 *   redaction; no raw sponsor records, no live external fetch, no source-
 *   certainty claim.
 *
 * Safety boundary:
 * - The runtime produces internal advisory evidence only.
 * - It does not approve, deny, underwrite, fund, commit, or otherwise
 *   create an autonomous lending or capital decision.
 * - It does not perform a live external sponsor fetch.
 * - Matching output remains advisory, replay-safe, conflict-preserving,
 *   and human-review-bound.
 * - Sponsor authority, regulatory determination, and qualified-reviewer
 *   approval remain with the named human authorities; the runtime never
 *   grants authority.
 */

export const CAPITAL_GRAPH_RUNTIME_VERSION =
  "capital-graph-runtime-v0.1.0";

// =============================================================================
// Canonical Capital Taxonomy
// =============================================================================

export type CapitalCategoryId =
  | "USDA"
  | "SBA"
  | "FSA"
  | "REAP"
  | "COMMUNITY_FACILITIES"
  | "CDFI"
  | "NEW_MARKETS_TAX_CREDITS"
  | "OPPORTUNITY_ZONES"
  | "HISTORIC_TAX_CREDITS"
  | "ENERGY_CREDITS"
  | "UTILITY_INCENTIVES"
  | "STATE_INCENTIVE_PROGRAMS"
  | "MUNICIPAL_INCENTIVES"
  | "WORKFORCE_PROGRAMS"
  | "FOUNDATION_GRANTS"
  | "PHILANTHROPIC_FUNDING"
  | "ENVIRONMENTAL_MARKETS"
  | "CARBON_MARKETS"
  | "PRIVATE_LENDING"
  | "CONVENTIONAL_BANKING"
  | "EQUIPMENT_FINANCING"
  | "VENDOR_FINANCING"
  | "REVENUE_BASED_FINANCING";

export type CapitalSponsorType =
  | "FEDERAL"
  | "STATE"
  | "MUNICIPAL"
  | "UTILITY"
  | "FOUNDATION"
  | "PHILANTHROPIC"
  | "MARKET"
  | "PRIVATE_LENDER"
  | "BANK"
  | "VENDOR"
  | "ENVIRONMENTAL_REGISTRY";

export type CapitalCategoryGovernance = {
  id: CapitalCategoryId;
  label: string;
  description: string;
  sponsorTypes: CapitalSponsorType[];
  defaultRegulatoryDomain: string;
  doctrineRefs: string[];
  blockedClaims: string[];
};

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "preapproval",
  "eligibility determination",
  "underwriting decision",
  "credit decision",
  "lender commitment",
  "funding guarantee",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "official report publication",
  "regulatory reliance",
  "legal reliance",
  "live external action",
] as const;

/**
 * Canonical capital taxonomy. Each category carries doctrine refs and a
 * default blocked-claims posture. Programs inherit and extend these.
 */
export const CAPITAL_CATEGORY_GOVERNANCE: CapitalCategoryGovernance[] = [
  {
    id: "USDA",
    label: "USDA",
    description:
      "United States Department of Agriculture programs, including specialty crop, conservation, value-added producer, and rural development sources.",
    sponsorTypes: ["FEDERAL"],
    defaultRegulatoryDomain: "federal-agriculture",
    doctrineRefs: [
      "Vol I §USDA-AUTHORITY",
      "Vol II §USDA-ENV-001",
      "Vol IV §USDA-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
  },
  {
    id: "SBA",
    label: "SBA",
    description:
      "Small Business Administration loan and assistance programs including 7(a), 504, microloan, and SBIC pathways.",
    sponsorTypes: ["FEDERAL"],
    defaultRegulatoryDomain: "federal-small-business",
    doctrineRefs: [
      "Vol I §SBA-AUTHORITY",
      "Vol II §SBA-REG",
      "Vol IV §SBA-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS, "small-business size determination"],
  },
  {
    id: "FSA",
    label: "FSA",
    description:
      "Farm Service Agency programs including operating loans, ownership loans, microloans, and emergency loans for agricultural producers.",
    sponsorTypes: ["FEDERAL"],
    defaultRegulatoryDomain: "federal-agriculture",
    doctrineRefs: [
      "Vol I §FSA-AUTHORITY",
      "Vol II §FSA-REG",
      "Vol IV §FSA-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "beginning-farmer determination",
      "credit-elsewhere test result",
    ],
  },
  {
    id: "REAP",
    label: "REAP",
    description:
      "Rural Energy for America Program: renewable-energy and energy-efficiency grants and guaranteed loans for rural small businesses and agricultural producers.",
    sponsorTypes: ["FEDERAL"],
    defaultRegulatoryDomain: "federal-rural-energy",
    doctrineRefs: [
      "Vol I §REAP-AUTHORITY",
      "Vol II §REAP-REG",
      "Vol II §USDA-ENV-001",
      "Vol IV §REAP-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "environmental compliance attestation",
    ],
  },
  {
    id: "COMMUNITY_FACILITIES",
    label: "Community Facilities",
    description:
      "USDA Community Facilities and related federal/state programs supporting essential community facilities in rural areas.",
    sponsorTypes: ["FEDERAL", "STATE", "MUNICIPAL"],
    defaultRegulatoryDomain: "federal-rural-development",
    doctrineRefs: [
      "Vol I §COMMUNITY-FACILITIES-AUTHORITY",
      "Vol II §COMMUNITY-FACILITIES-REG",
      "Vol IV §COMMUNITY-FACILITIES-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "essential-community-facility determination",
    ],
  },
  {
    id: "CDFI",
    label: "CDFI",
    description:
      "Community Development Financial Institution programs and CDFI-Fund-aligned capital sources.",
    sponsorTypes: ["FEDERAL", "PRIVATE_LENDER"],
    defaultRegulatoryDomain: "federal-community-finance",
    doctrineRefs: [
      "Vol I §CDFI-AUTHORITY",
      "Vol II §CDFI-REG",
      "Vol IV §CDFI-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS, "CDFI certification status"],
  },
  {
    id: "NEW_MARKETS_TAX_CREDITS",
    label: "New Markets Tax Credits",
    description:
      "New Markets Tax Credit (NMTC) program allocations and CDE pathways.",
    sponsorTypes: ["FEDERAL", "PRIVATE_LENDER"],
    defaultRegulatoryDomain: "federal-tax-credit",
    doctrineRefs: [
      "Vol I §NMTC-AUTHORITY",
      "Vol II §NMTC-REG",
      "Vol IV §NMTC-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "qualified-active-low-income-community-business determination",
      "tax-credit allocation amount",
    ],
  },
  {
    id: "OPPORTUNITY_ZONES",
    label: "Opportunity Zones",
    description:
      "Qualified Opportunity Zone investment pathways and Qualified Opportunity Fund deployments.",
    sponsorTypes: ["FEDERAL", "PRIVATE_LENDER"],
    defaultRegulatoryDomain: "federal-tax-incentive",
    doctrineRefs: [
      "Vol I §OZ-AUTHORITY",
      "Vol II §OZ-REG",
      "Vol IV §OZ-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "qualified-opportunity-zone-business determination",
    ],
  },
  {
    id: "HISTORIC_TAX_CREDITS",
    label: "Historic Tax Credits",
    description:
      "Federal and state Historic Tax Credit programs for certified historic rehabilitation projects.",
    sponsorTypes: ["FEDERAL", "STATE"],
    defaultRegulatoryDomain: "federal-state-historic-preservation",
    doctrineRefs: [
      "Vol I §HTC-AUTHORITY",
      "Vol II §HTC-REG",
      "Vol IV §HTC-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "certified-historic-structure determination",
    ],
  },
  {
    id: "ENERGY_CREDITS",
    label: "Energy Credits",
    description:
      "Federal and state energy investment, production, and clean-energy tax credit pathways including ITC, PTC, and IRA-aligned credits.",
    sponsorTypes: ["FEDERAL", "STATE"],
    defaultRegulatoryDomain: "federal-state-energy",
    doctrineRefs: [
      "Vol I §ENERGY-CREDITS-AUTHORITY",
      "Vol II §ENERGY-CREDITS-REG",
      "Vol IV §ENERGY-CREDITS-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "energy-credit eligibility determination",
    ],
  },
  {
    id: "UTILITY_INCENTIVES",
    label: "Utility Incentives",
    description:
      "Investor-owned utility, rural electric cooperative, and public-power efficiency, demand-response, and capacity programs.",
    sponsorTypes: ["UTILITY"],
    defaultRegulatoryDomain: "utility-tariff",
    doctrineRefs: [
      "Vol I §UTILITY-INCENTIVES-AUTHORITY",
      "Vol II §UTILITY-INCENTIVES-REG",
      "Vol IV §UTILITY-INCENTIVES-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "utility-territory eligibility determination",
    ],
  },
  {
    id: "STATE_INCENTIVE_PROGRAMS",
    label: "State Incentive Programs",
    description:
      "State agriculture, economic-development, rural-business, workforce, and innovation incentive programs.",
    sponsorTypes: ["STATE"],
    defaultRegulatoryDomain: "state-economic-development",
    doctrineRefs: [
      "Vol I §STATE-INCENTIVE-AUTHORITY",
      "Vol II §STATE-INCENTIVE-REG",
      "Vol IV §STATE-INCENTIVE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "state-incentive determination",
    ],
  },
  {
    id: "MUNICIPAL_INCENTIVES",
    label: "Municipal Incentives",
    description:
      "Municipal and county-level economic-development, TIF, abatement, and infrastructure incentive programs.",
    sponsorTypes: ["MUNICIPAL"],
    defaultRegulatoryDomain: "municipal-economic-development",
    doctrineRefs: [
      "Vol I §MUNICIPAL-INCENTIVE-AUTHORITY",
      "Vol II §MUNICIPAL-INCENTIVE-REG",
      "Vol IV §MUNICIPAL-INCENTIVE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "municipal-incentive determination",
    ],
  },
  {
    id: "WORKFORCE_PROGRAMS",
    label: "Workforce Programs",
    description:
      "Federal, state, and regional workforce-development, training, apprenticeship, and tax-credit programs (WIOA, WOTC, and equivalents).",
    sponsorTypes: ["FEDERAL", "STATE", "MUNICIPAL"],
    defaultRegulatoryDomain: "federal-state-workforce",
    doctrineRefs: [
      "Vol I §WORKFORCE-AUTHORITY",
      "Vol II §WORKFORCE-REG",
      "Vol IV §WORKFORCE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "workforce-program eligibility determination",
    ],
  },
  {
    id: "FOUNDATION_GRANTS",
    label: "Foundation Grants",
    description:
      "Private and family foundation grants and program-related investments.",
    sponsorTypes: ["FOUNDATION"],
    defaultRegulatoryDomain: "philanthropy-private",
    doctrineRefs: [
      "Vol I §FOUNDATION-AUTHORITY",
      "Vol II §FOUNDATION-REG",
      "Vol IV §FOUNDATION-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "foundation-grant award guarantee",
    ],
  },
  {
    id: "PHILANTHROPIC_FUNDING",
    label: "Philanthropic Funding",
    description:
      "Donor-advised funds, community foundations, and impact-philanthropy pathways.",
    sponsorTypes: ["PHILANTHROPIC"],
    defaultRegulatoryDomain: "philanthropy-public",
    doctrineRefs: [
      "Vol I §PHILANTHROPIC-AUTHORITY",
      "Vol II §PHILANTHROPIC-REG",
      "Vol IV §PHILANTHROPIC-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "philanthropic-funding guarantee",
    ],
  },
  {
    id: "ENVIRONMENTAL_MARKETS",
    label: "Environmental Markets",
    description:
      "Wetland, stream, species, and conservation-mitigation banking and credit markets.",
    sponsorTypes: ["MARKET", "ENVIRONMENTAL_REGISTRY"],
    defaultRegulatoryDomain: "environmental-mitigation-market",
    doctrineRefs: [
      "Vol I §ENV-MARKET-AUTHORITY",
      "Vol II §USDA-ENV-001",
      "Vol II §ENV-MARKET-REG",
      "Vol IV §ENV-MARKET-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "environmental-mitigation-credit issuance",
    ],
  },
  {
    id: "CARBON_MARKETS",
    label: "Carbon Markets",
    description:
      "Voluntary and compliance carbon credit registries, soil-carbon, methane-reduction, and forestry-carbon pathways.",
    sponsorTypes: ["MARKET", "ENVIRONMENTAL_REGISTRY"],
    defaultRegulatoryDomain: "carbon-market",
    doctrineRefs: [
      "Vol I §CARBON-AUTHORITY",
      "Vol II §CARBON-REG",
      "Vol IV §CARBON-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "carbon-credit issuance",
      "carbon-additionality determination",
    ],
  },
  {
    id: "PRIVATE_LENDING",
    label: "Private Lending",
    description:
      "Non-bank private lenders including impact funds, mission-aligned lenders, and specialty agricultural lenders.",
    sponsorTypes: ["PRIVATE_LENDER"],
    defaultRegulatoryDomain: "private-lending",
    doctrineRefs: [
      "Vol I §PRIVATE-LENDER-AUTHORITY",
      "Vol II §PRIVATE-LENDER-REG",
      "Vol IV §PRIVATE-LENDER-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "private-lender commitment",
    ],
  },
  {
    id: "CONVENTIONAL_BANKING",
    label: "Conventional Banking",
    description:
      "Conventional commercial banking pathways including community, regional, and national banks.",
    sponsorTypes: ["BANK"],
    defaultRegulatoryDomain: "conventional-banking",
    doctrineRefs: [
      "Vol I §BANK-AUTHORITY",
      "Vol II §BANK-REG",
      "Vol IV §BANK-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "bank lending commitment",
    ],
  },
  {
    id: "EQUIPMENT_FINANCING",
    label: "Equipment Financing",
    description:
      "Equipment-specific lenders and lessors including agricultural equipment finance specialists.",
    sponsorTypes: ["PRIVATE_LENDER", "BANK", "VENDOR"],
    defaultRegulatoryDomain: "equipment-finance",
    doctrineRefs: [
      "Vol I §EQUIPMENT-FINANCE-AUTHORITY",
      "Vol II §EQUIPMENT-FINANCE-REG",
      "Vol IV §EQUIPMENT-FINANCE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "equipment-finance commitment",
    ],
  },
  {
    id: "VENDOR_FINANCING",
    label: "Vendor Financing",
    description:
      "Vendor-extended financing programs including manufacturer credit, supplier financing, and dealer programs.",
    sponsorTypes: ["VENDOR"],
    defaultRegulatoryDomain: "vendor-financing",
    doctrineRefs: [
      "Vol I §VENDOR-FINANCE-AUTHORITY",
      "Vol II §VENDOR-FINANCE-REG",
      "Vol IV §VENDOR-FINANCE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "vendor-financing commitment",
    ],
  },
  {
    id: "REVENUE_BASED_FINANCING",
    label: "Revenue-Based Financing",
    description:
      "Revenue-share, royalty, and pay-as-you-grow financing pathways including specialty agricultural revenue lenders.",
    sponsorTypes: ["PRIVATE_LENDER", "MARKET"],
    defaultRegulatoryDomain: "revenue-based-financing",
    doctrineRefs: [
      "Vol I §RBF-AUTHORITY",
      "Vol II §RBF-REG",
      "Vol IV §RBF-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "revenue-based-financing commitment",
    ],
  },
];

// =============================================================================
// CapitalProgram Object Model
// =============================================================================

export type CapitalProgramReplayPosture = "REPLAY_SAFE" | "REVIEW_REQUIRED";
export type CapitalProgramAuditPosture = "AUDIT_ANCHORED" | "REVIEW_REQUIRED";
export type CapitalProgramFederationScope = "SOVEREIGN" | "PARTICIPANT" | "PUBLIC";

export type CapitalProgram = {
  programId: string;
  programName: string;
  categoryId: CapitalCategoryId;
  sponsorType: CapitalSponsorType;
  sponsorAuthority: string;
  jurisdiction: string[];
  eligibleCustomerTypes: string[];
  eligibleUses: string[];
  prohibitedUses: string[];
  stackingRules: string[];
  conflictRules: string[];
  deadlineProfile: string;
  sourceRefs: string[];
  replayRefs: string[];
  doctrineRefs: string[];
  classificationLevel: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL";
  replayPosture: CapitalProgramReplayPosture;
  auditPosture: CapitalProgramAuditPosture;
  federationScope: CapitalProgramFederationScope;
  blockedClaims: string[];
  reviewRoute: string;
  programVersion: string;
};

// =============================================================================
// Canonical Capital Graph Registry (seed)
//
// Each category is seeded with at least one canonical, review-bound program.
// These programs are governed translation-layer placeholders that name the
// sponsor authority, jurisdiction, eligibility, and doctrine refs. They do
// not perform a live external sponsor fetch and they do not authorize an
// award or commitment.
// =============================================================================

const PROGRAM_REVIEW_ROUTE = "/governance/capital-graph";

export const CAPITAL_GRAPH_REGISTRY: CapitalProgram[] = [
  {
    programId: "cap-usda-specialty-crop",
    programName: "USDA Specialty Crop Block Grant Program",
    categoryId: "USDA",
    sponsorType: "FEDERAL",
    sponsorAuthority: "USDA Agricultural Marketing Service",
    jurisdiction: ["federal", "state-administered"],
    eligibleCustomerTypes: [
      "specialty crop producer",
      "specialty crop industry organization",
    ],
    eligibleUses: ["specialty crop competitiveness", "marketing", "research"],
    prohibitedUses: ["unreviewed restricted products"],
    stackingRules: ["stacking subject to state-administered review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "annual state-administered cycle (review required)",
    sourceRefs: ["usda-ams-source"],
    replayRefs: ["replay-cap-usda-specialty-crop-v0.1.0"],
    doctrineRefs: [
      "Vol I §USDA-AUTHORITY",
      "Vol II §USDA-ENV-001",
      "Vol IV §USDA-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-usda-specialty-crop-v0.1.0",
  },
  {
    programId: "cap-sba-7a",
    programName: "SBA 7(a) Loan Program",
    categoryId: "SBA",
    sponsorType: "FEDERAL",
    sponsorAuthority: "U.S. Small Business Administration",
    jurisdiction: ["federal"],
    eligibleCustomerTypes: ["small business"],
    eligibleUses: ["working capital", "equipment", "real estate"],
    prohibitedUses: ["restricted SBA-prohibited industries"],
    stackingRules: ["SBA stacking subject to size and use review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling lender intake (review required)",
    sourceRefs: ["sba-source"],
    replayRefs: ["replay-cap-sba-7a-v0.1.0"],
    doctrineRefs: [
      "Vol I §SBA-AUTHORITY",
      "Vol II §SBA-REG",
      "Vol IV §SBA-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "small-business size determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-sba-7a-v0.1.0",
  },
  {
    programId: "cap-fsa-operating-loan",
    programName: "FSA Direct Operating Loan",
    categoryId: "FSA",
    sponsorType: "FEDERAL",
    sponsorAuthority: "USDA Farm Service Agency",
    jurisdiction: ["federal"],
    eligibleCustomerTypes: ["farmer", "beginning farmer", "rancher"],
    eligibleUses: ["operating expenses", "livestock", "equipment"],
    prohibitedUses: ["unreviewed restricted uses"],
    stackingRules: ["FSA stacking subject to credit-elsewhere review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling FSA intake (review required)",
    sourceRefs: ["fsa-source"],
    replayRefs: ["replay-cap-fsa-operating-loan-v0.1.0"],
    doctrineRefs: [
      "Vol I §FSA-AUTHORITY",
      "Vol II §FSA-REG",
      "Vol IV §FSA-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "beginning-farmer determination",
      "credit-elsewhere test result",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-fsa-operating-loan-v0.1.0",
  },
  {
    programId: "cap-reap-grant",
    programName: "Rural Energy for America Program Grant",
    categoryId: "REAP",
    sponsorType: "FEDERAL",
    sponsorAuthority: "USDA Rural Development",
    jurisdiction: ["federal"],
    eligibleCustomerTypes: ["rural small business", "agricultural producer"],
    eligibleUses: ["renewable energy", "energy efficiency"],
    prohibitedUses: ["unreviewed restricted uses"],
    stackingRules: ["stacking with energy credits requires review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "REAP application window (review required)",
    sourceRefs: ["reap-source"],
    replayRefs: ["replay-cap-reap-grant-v0.1.0"],
    doctrineRefs: [
      "Vol I §REAP-AUTHORITY",
      "Vol II §REAP-REG",
      "Vol II §USDA-ENV-001",
      "Vol IV §REAP-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "environmental compliance attestation",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-reap-grant-v0.1.0",
  },
  {
    programId: "cap-community-facilities-loan",
    programName: "USDA Community Facilities Direct Loan",
    categoryId: "COMMUNITY_FACILITIES",
    sponsorType: "FEDERAL",
    sponsorAuthority: "USDA Rural Development",
    jurisdiction: ["federal", "state"],
    eligibleCustomerTypes: [
      "public body",
      "nonprofit",
      "federally recognized tribe",
    ],
    eligibleUses: ["essential community facility"],
    prohibitedUses: ["unreviewed restricted uses"],
    stackingRules: ["stacking with state or local capital requires review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling CF intake (review required)",
    sourceRefs: ["community-facilities-source"],
    replayRefs: ["replay-cap-community-facilities-loan-v0.1.0"],
    doctrineRefs: [
      "Vol I §COMMUNITY-FACILITIES-AUTHORITY",
      "Vol II §COMMUNITY-FACILITIES-REG",
      "Vol IV §COMMUNITY-FACILITIES-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "essential-community-facility determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-community-facilities-loan-v0.1.0",
  },
  {
    programId: "cap-cdfi-loan",
    programName: "Certified CDFI Loan Pathway",
    categoryId: "CDFI",
    sponsorType: "PRIVATE_LENDER",
    sponsorAuthority: "U.S. Treasury CDFI Fund-certified CDFI",
    jurisdiction: ["federal", "state-administered"],
    eligibleCustomerTypes: [
      "underserved small business",
      "underserved farmer",
      "low-income community business",
    ],
    eligibleUses: ["working capital", "equipment", "real estate"],
    prohibitedUses: ["restricted uses defined by certified CDFI"],
    stackingRules: ["stacking subject to CDFI review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling CDFI intake (review required)",
    sourceRefs: ["cdfi-fund-source"],
    replayRefs: ["replay-cap-cdfi-loan-v0.1.0"],
    doctrineRefs: [
      "Vol I §CDFI-AUTHORITY",
      "Vol II §CDFI-REG",
      "Vol IV §CDFI-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS, "CDFI certification status"],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-cdfi-loan-v0.1.0",
  },
  {
    programId: "cap-nmtc-allocation",
    programName: "New Markets Tax Credit Allocation Pathway",
    categoryId: "NEW_MARKETS_TAX_CREDITS",
    sponsorType: "FEDERAL",
    sponsorAuthority:
      "U.S. Treasury CDFI Fund / CDE (Community Development Entity)",
    jurisdiction: ["federal"],
    eligibleCustomerTypes: [
      "qualified active low-income community business",
    ],
    eligibleUses: [
      "qualified low-income community investment",
      "operating support",
    ],
    prohibitedUses: ["NMTC-prohibited uses"],
    stackingRules: ["stacking with HTC or OZ requires structured review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "CDE allocation window (review required)",
    sourceRefs: ["cdfi-fund-source"],
    replayRefs: ["replay-cap-nmtc-allocation-v0.1.0"],
    doctrineRefs: [
      "Vol I §NMTC-AUTHORITY",
      "Vol II §NMTC-REG",
      "Vol IV §NMTC-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "qualified-active-low-income-community-business determination",
      "tax-credit allocation amount",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-nmtc-allocation-v0.1.0",
  },
  {
    programId: "cap-opportunity-zone-investment",
    programName: "Qualified Opportunity Zone Investment Pathway",
    categoryId: "OPPORTUNITY_ZONES",
    sponsorType: "PRIVATE_LENDER",
    sponsorAuthority: "Qualified Opportunity Fund (QOF) sponsor",
    jurisdiction: ["federal"],
    eligibleCustomerTypes: ["qualified opportunity zone business"],
    eligibleUses: ["qualified opportunity zone business investment"],
    prohibitedUses: ["OZ-prohibited sin businesses"],
    stackingRules: ["stacking with NMTC or HTC requires structured review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "QOF deployment window (review required)",
    sourceRefs: ["oz-irs-source"],
    replayRefs: ["replay-cap-opportunity-zone-investment-v0.1.0"],
    doctrineRefs: [
      "Vol I §OZ-AUTHORITY",
      "Vol II §OZ-REG",
      "Vol IV §OZ-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "qualified-opportunity-zone-business determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-opportunity-zone-investment-v0.1.0",
  },
  {
    programId: "cap-htc-federal",
    programName: "Federal Historic Rehabilitation Tax Credit Pathway",
    categoryId: "HISTORIC_TAX_CREDITS",
    sponsorType: "FEDERAL",
    sponsorAuthority: "National Park Service and IRS",
    jurisdiction: ["federal"],
    eligibleCustomerTypes: ["owner of certified historic structure"],
    eligibleUses: ["certified historic rehabilitation"],
    prohibitedUses: ["non-qualified rehabilitation costs"],
    stackingRules: ["stacking with state HTC or NMTC requires structured review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "Part 1/2/3 sequence (review required)",
    sourceRefs: ["nps-source"],
    replayRefs: ["replay-cap-htc-federal-v0.1.0"],
    doctrineRefs: [
      "Vol I §HTC-AUTHORITY",
      "Vol II §HTC-REG",
      "Vol IV §HTC-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "certified-historic-structure determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-htc-federal-v0.1.0",
  },
  {
    programId: "cap-energy-itc",
    programName: "Federal Investment Tax Credit (ITC) Energy Pathway",
    categoryId: "ENERGY_CREDITS",
    sponsorType: "FEDERAL",
    sponsorAuthority: "U.S. Internal Revenue Service",
    jurisdiction: ["federal"],
    eligibleCustomerTypes: [
      "energy project owner",
      "agricultural producer with on-farm energy project",
    ],
    eligibleUses: ["qualifying energy property"],
    prohibitedUses: ["non-qualifying energy property"],
    stackingRules: [
      "stacking with REAP or state credits requires structured review",
    ],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "tax-year placed-in-service window (review required)",
    sourceRefs: ["irs-source"],
    replayRefs: ["replay-cap-energy-itc-v0.1.0"],
    doctrineRefs: [
      "Vol I §ENERGY-CREDITS-AUTHORITY",
      "Vol II §ENERGY-CREDITS-REG",
      "Vol IV §ENERGY-CREDITS-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "energy-credit eligibility determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-energy-itc-v0.1.0",
  },
  {
    programId: "cap-utility-efficiency-rebate",
    programName: "Investor-Owned Utility Energy-Efficiency Rebate Pathway",
    categoryId: "UTILITY_INCENTIVES",
    sponsorType: "UTILITY",
    sponsorAuthority: "Investor-owned utility or rural electric cooperative",
    jurisdiction: ["state", "utility territory"],
    eligibleCustomerTypes: [
      "utility customer",
      "agricultural utility customer",
      "small business utility customer",
    ],
    eligibleUses: ["energy-efficient equipment", "demand reduction"],
    prohibitedUses: ["non-qualifying equipment"],
    stackingRules: ["utility stacking subject to tariff review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling utility intake (review required)",
    sourceRefs: ["utility-tariff-source"],
    replayRefs: ["replay-cap-utility-efficiency-rebate-v0.1.0"],
    doctrineRefs: [
      "Vol I §UTILITY-INCENTIVES-AUTHORITY",
      "Vol II §UTILITY-INCENTIVES-REG",
      "Vol IV §UTILITY-INCENTIVES-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "utility-territory eligibility determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-utility-efficiency-rebate-v0.1.0",
  },
  {
    programId: "cap-state-ag-grant",
    programName: "State Agriculture and Rural Business Grant Pathway",
    categoryId: "STATE_INCENTIVE_PROGRAMS",
    sponsorType: "STATE",
    sponsorAuthority: "State Department of Agriculture or Economic Development",
    jurisdiction: ["state"],
    eligibleCustomerTypes: [
      "state-resident farmer",
      "state-resident rural business",
    ],
    eligibleUses: [
      "state-defined agricultural development",
      "state-defined rural development",
    ],
    prohibitedUses: ["state-defined prohibited uses"],
    stackingRules: ["state stacking subject to administering-agency review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "annual state grant window (review required)",
    sourceRefs: ["state-ag-source", "state-econ-dev-source"],
    replayRefs: ["replay-cap-state-ag-grant-v0.1.0"],
    doctrineRefs: [
      "Vol I §STATE-INCENTIVE-AUTHORITY",
      "Vol II §STATE-INCENTIVE-REG",
      "Vol IV §STATE-INCENTIVE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "state-incentive determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-state-ag-grant-v0.1.0",
  },
  {
    programId: "cap-municipal-tif",
    programName: "Municipal Tax Increment Financing Pathway",
    categoryId: "MUNICIPAL_INCENTIVES",
    sponsorType: "MUNICIPAL",
    sponsorAuthority: "Municipal or county economic development authority",
    jurisdiction: ["municipal", "county"],
    eligibleCustomerTypes: [
      "municipal-area employer",
      "municipal-area developer",
    ],
    eligibleUses: ["infrastructure", "site readiness", "redevelopment"],
    prohibitedUses: ["municipal-defined prohibited uses"],
    stackingRules: ["municipal stacking subject to local review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "municipal application window (review required)",
    sourceRefs: ["municipal-tif-source"],
    replayRefs: ["replay-cap-municipal-tif-v0.1.0"],
    doctrineRefs: [
      "Vol I §MUNICIPAL-INCENTIVE-AUTHORITY",
      "Vol II §MUNICIPAL-INCENTIVE-REG",
      "Vol IV §MUNICIPAL-INCENTIVE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "municipal-incentive determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-municipal-tif-v0.1.0",
  },
  {
    programId: "cap-workforce-wotc",
    programName: "Work Opportunity Tax Credit Pathway",
    categoryId: "WORKFORCE_PROGRAMS",
    sponsorType: "FEDERAL",
    sponsorAuthority: "U.S. Department of Labor and IRS",
    jurisdiction: ["federal"],
    eligibleCustomerTypes: ["employer hiring qualifying target groups"],
    eligibleUses: ["payroll tax credit"],
    prohibitedUses: ["WOTC-prohibited uses"],
    stackingRules: ["WOTC stacking subject to certification review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "28-day certification window (review required)",
    sourceRefs: ["dol-source", "irs-source"],
    replayRefs: ["replay-cap-workforce-wotc-v0.1.0"],
    doctrineRefs: [
      "Vol I §WORKFORCE-AUTHORITY",
      "Vol II §WORKFORCE-REG",
      "Vol IV §WORKFORCE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PUBLIC",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "workforce-program eligibility determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-workforce-wotc-v0.1.0",
  },
  {
    programId: "cap-foundation-grant-pri",
    programName: "Foundation Program-Related Investment Pathway",
    categoryId: "FOUNDATION_GRANTS",
    sponsorType: "FOUNDATION",
    sponsorAuthority: "Private or family foundation",
    jurisdiction: ["foundation-defined"],
    eligibleCustomerTypes: [
      "mission-aligned organization",
      "mission-aligned for-profit",
    ],
    eligibleUses: ["foundation-mission-aligned use"],
    prohibitedUses: ["foundation-prohibited uses"],
    stackingRules: ["foundation stacking subject to grantmaker review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "foundation-defined cycle (review required)",
    sourceRefs: ["foundation-source"],
    replayRefs: ["replay-cap-foundation-grant-pri-v0.1.0"],
    doctrineRefs: [
      "Vol I §FOUNDATION-AUTHORITY",
      "Vol II §FOUNDATION-REG",
      "Vol IV §FOUNDATION-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "foundation-grant award guarantee",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-foundation-grant-pri-v0.1.0",
  },
  {
    programId: "cap-philanthropic-daf",
    programName: "Donor-Advised Fund Pathway",
    categoryId: "PHILANTHROPIC_FUNDING",
    sponsorType: "PHILANTHROPIC",
    sponsorAuthority: "Donor-advised fund sponsor organization",
    jurisdiction: ["sponsor-defined"],
    eligibleCustomerTypes: ["qualifying 501(c)(3) recipient"],
    eligibleUses: ["sponsor-defined charitable purpose"],
    prohibitedUses: ["sponsor-prohibited uses"],
    stackingRules: ["DAF stacking subject to sponsor review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "sponsor-defined cycle (review required)",
    sourceRefs: ["philanthropy-source"],
    replayRefs: ["replay-cap-philanthropic-daf-v0.1.0"],
    doctrineRefs: [
      "Vol I §PHILANTHROPIC-AUTHORITY",
      "Vol II §PHILANTHROPIC-REG",
      "Vol IV §PHILANTHROPIC-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "philanthropic-funding guarantee",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-philanthropic-daf-v0.1.0",
  },
  {
    programId: "cap-environmental-wetlands-bank",
    programName: "Wetlands Mitigation Banking Pathway",
    categoryId: "ENVIRONMENTAL_MARKETS",
    sponsorType: "MARKET",
    sponsorAuthority:
      "Approved wetlands mitigation banker under U.S. Army Corps of Engineers oversight",
    jurisdiction: ["federal", "state-administered"],
    eligibleCustomerTypes: ["landowner with wetlands restoration capacity"],
    eligibleUses: ["wetlands credit generation"],
    prohibitedUses: ["unreviewed off-banking uses"],
    stackingRules: [
      "stacking with conservation easements requires structured review",
    ],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "USACE approval cycle (review required)",
    sourceRefs: ["usace-source"],
    replayRefs: ["replay-cap-environmental-wetlands-bank-v0.1.0"],
    doctrineRefs: [
      "Vol I §ENV-MARKET-AUTHORITY",
      "Vol II §USDA-ENV-001",
      "Vol II §ENV-MARKET-REG",
      "Vol IV §ENV-MARKET-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "environmental-mitigation-credit issuance",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-environmental-wetlands-bank-v0.1.0",
  },
  {
    programId: "cap-carbon-soil-registry",
    programName: "Soil Carbon Voluntary Credit Registry Pathway",
    categoryId: "CARBON_MARKETS",
    sponsorType: "ENVIRONMENTAL_REGISTRY",
    sponsorAuthority: "Approved voluntary carbon registry",
    jurisdiction: ["federal", "state-administered", "international-aligned"],
    eligibleCustomerTypes: [
      "farmer with soil-carbon practice capacity",
      "landowner with carbon-additional practice capacity",
    ],
    eligibleUses: ["carbon credit generation"],
    prohibitedUses: ["unreviewed additionality claims"],
    stackingRules: [
      "stacking with environmental incentives requires structured review",
    ],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "registry verification cycle (review required)",
    sourceRefs: ["carbon-registry-source"],
    replayRefs: ["replay-cap-carbon-soil-registry-v0.1.0"],
    doctrineRefs: [
      "Vol I §CARBON-AUTHORITY",
      "Vol II §CARBON-REG",
      "Vol IV §CARBON-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "carbon-credit issuance",
      "carbon-additionality determination",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-carbon-soil-registry-v0.1.0",
  },
  {
    programId: "cap-private-impact-lender",
    programName: "Mission-Aligned Private Impact Lender Pathway",
    categoryId: "PRIVATE_LENDING",
    sponsorType: "PRIVATE_LENDER",
    sponsorAuthority: "Mission-aligned private impact lender",
    jurisdiction: ["sponsor-defined"],
    eligibleCustomerTypes: [
      "mission-aligned borrower",
      "underserved small business",
      "underserved farmer",
    ],
    eligibleUses: ["working capital", "equipment", "real estate"],
    prohibitedUses: ["lender-defined prohibited uses"],
    stackingRules: ["stacking subject to lender review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling lender intake (review required)",
    sourceRefs: ["private-lender-source"],
    replayRefs: ["replay-cap-private-impact-lender-v0.1.0"],
    doctrineRefs: [
      "Vol I §PRIVATE-LENDER-AUTHORITY",
      "Vol II §PRIVATE-LENDER-REG",
      "Vol IV §PRIVATE-LENDER-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "SOVEREIGN",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "private-lender commitment",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-private-impact-lender-v0.1.0",
  },
  {
    programId: "cap-conventional-community-bank",
    programName: "Community Bank Conventional Lending Pathway",
    categoryId: "CONVENTIONAL_BANKING",
    sponsorType: "BANK",
    sponsorAuthority: "Federally insured community or regional bank",
    jurisdiction: ["federal", "state"],
    eligibleCustomerTypes: ["small business", "farmer", "rural business"],
    eligibleUses: ["working capital", "equipment", "real estate"],
    prohibitedUses: ["bank-defined prohibited uses"],
    stackingRules: ["stacking subject to bank review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling bank intake (review required)",
    sourceRefs: ["bank-source"],
    replayRefs: ["replay-cap-conventional-community-bank-v0.1.0"],
    doctrineRefs: [
      "Vol I §BANK-AUTHORITY",
      "Vol II §BANK-REG",
      "Vol IV §BANK-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "SOVEREIGN",
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS, "bank lending commitment"],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-conventional-community-bank-v0.1.0",
  },
  {
    programId: "cap-equipment-finance",
    programName: "Agricultural Equipment Finance Pathway",
    categoryId: "EQUIPMENT_FINANCING",
    sponsorType: "PRIVATE_LENDER",
    sponsorAuthority: "Equipment finance specialist or captive lender",
    jurisdiction: ["sponsor-defined"],
    eligibleCustomerTypes: ["equipment-purchasing business"],
    eligibleUses: ["equipment purchase", "equipment refinance"],
    prohibitedUses: ["non-equipment uses"],
    stackingRules: ["stacking subject to lender review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling lender intake (review required)",
    sourceRefs: ["equipment-finance-source"],
    replayRefs: ["replay-cap-equipment-finance-v0.1.0"],
    doctrineRefs: [
      "Vol I §EQUIPMENT-FINANCE-AUTHORITY",
      "Vol II §EQUIPMENT-FINANCE-REG",
      "Vol IV §EQUIPMENT-FINANCE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "SOVEREIGN",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "equipment-finance commitment",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-equipment-finance-v0.1.0",
  },
  {
    programId: "cap-vendor-financing",
    programName: "Vendor / Manufacturer Financing Pathway",
    categoryId: "VENDOR_FINANCING",
    sponsorType: "VENDOR",
    sponsorAuthority: "Vendor, manufacturer, or dealer financing program",
    jurisdiction: ["sponsor-defined"],
    eligibleCustomerTypes: ["vendor customer"],
    eligibleUses: ["vendor equipment", "vendor supply purchase"],
    prohibitedUses: ["non-vendor uses"],
    stackingRules: ["stacking subject to vendor review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling vendor intake (review required)",
    sourceRefs: ["vendor-financing-source"],
    replayRefs: ["replay-cap-vendor-financing-v0.1.0"],
    doctrineRefs: [
      "Vol I §VENDOR-FINANCE-AUTHORITY",
      "Vol II §VENDOR-FINANCE-REG",
      "Vol IV §VENDOR-FINANCE-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "vendor-financing commitment",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-vendor-financing-v0.1.0",
  },
  {
    programId: "cap-revenue-based-financing",
    programName: "Revenue-Based Financing Pathway",
    categoryId: "REVENUE_BASED_FINANCING",
    sponsorType: "PRIVATE_LENDER",
    sponsorAuthority: "Revenue-based financing lender",
    jurisdiction: ["sponsor-defined"],
    eligibleCustomerTypes: [
      "revenue-generating small business",
      "revenue-generating agricultural producer",
    ],
    eligibleUses: ["working capital", "growth capital"],
    prohibitedUses: ["non-revenue-generating uses"],
    stackingRules: ["stacking subject to lender review"],
    conflictRules: ["conflicts route to qualified human review"],
    deadlineProfile: "rolling lender intake (review required)",
    sourceRefs: ["rbf-source"],
    replayRefs: ["replay-cap-revenue-based-financing-v0.1.0"],
    doctrineRefs: [
      "Vol I §RBF-AUTHORITY",
      "Vol II §RBF-REG",
      "Vol IV §RBF-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    classificationLevel: "INTERNAL",
    replayPosture: "REPLAY_SAFE",
    auditPosture: "AUDIT_ANCHORED",
    federationScope: "PARTICIPANT",
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "revenue-based-financing commitment",
    ],
    reviewRoute: PROGRAM_REVIEW_ROUTE,
    programVersion: "cap-revenue-based-financing-v0.1.0",
  },
];

// =============================================================================
// Eligibility Mapping + Pathway Matching
// =============================================================================

export type CapitalEligibilityInput = {
  customerTypes?: string[];
  jurisdiction?: {
    federal?: boolean;
    state?: string | null;
    county?: string | null;
    municipality?: string | null;
    utilityTerritory?: string | null;
    tribalNation?: string | null;
  } | null;
  intendedUses?: string[];
  participantRoles?: string[];
  sovereignFederationAllowed?: boolean;
};

export type CapitalEligibilityFinding = {
  programId: string;
  categoryId: CapitalCategoryId;
  fitScore: number;
  fitReasons: string[];
  blockingReasons: string[];
  conflictSignals: string[];
  requiredReviewRoute: string;
  blockedClaims: string[];
};

export type CapitalEligibilityResult = {
  matched: CapitalEligibilityFinding[];
  unreviewed: CapitalEligibilityFinding[];
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

function tokenSet(values: string[] | undefined): Set<string> {
  if (!Array.isArray(values)) {
    return new Set();
  }

  return new Set(
    values
      .filter((value) => typeof value === "string")
      .map((value) => value.toLowerCase())
  );
}

function programJurisdictionMatch(
  program: CapitalProgram,
  jurisdiction: CapitalEligibilityInput["jurisdiction"] | undefined | null
): { fit: number; reasons: string[]; blockers: string[] } {
  const reasons: string[] = [];
  const blockers: string[] = [];

  if (!jurisdiction) {
    return { fit: 0, reasons: ["Borrower jurisdiction not supplied."], blockers };
  }

  const programJurisdiction = new Set(
    program.jurisdiction.map((entry) => entry.toLowerCase())
  );

  let fit = 0;

  if (programJurisdiction.has("federal") && jurisdiction.federal === true) {
    fit += 20;
    reasons.push("Federal jurisdiction overlap.");
  }

  if (programJurisdiction.has("state") && jurisdiction.state) {
    fit += 15;
    reasons.push(`State jurisdiction overlap (${jurisdiction.state}).`);
  }

  if (
    (programJurisdiction.has("state-administered") ||
      programJurisdiction.has("county") ||
      programJurisdiction.has("municipal")) &&
    (jurisdiction.county || jurisdiction.municipality || jurisdiction.state)
  ) {
    fit += 10;
    reasons.push("Sub-state administered scope overlap.");
  }

  if (
    programJurisdiction.has("utility territory") &&
    jurisdiction.utilityTerritory
  ) {
    fit += 10;
    reasons.push("Utility territory overlap.");
  }

  if (
    programJurisdiction.has("sponsor-defined") &&
    program.federationScope === "SOVEREIGN" &&
    !jurisdiction.federal
  ) {
    blockers.push(
      "Sovereign sponsor jurisdiction requires named sovereign participant review."
    );
  }

  return { fit, reasons, blockers };
}

function programCustomerMatch(
  program: CapitalProgram,
  customerTokens: Set<string>
): { fit: number; reasons: string[] } {
  if (customerTokens.size === 0) {
    return {
      fit: 0,
      reasons: ["Borrower customer types not supplied."],
    };
  }

  const reasons: string[] = [];
  let fit = 0;

  for (const programType of program.eligibleCustomerTypes) {
    const lowered = programType.toLowerCase();

    for (const token of customerTokens) {
      if (lowered.includes(token) || token.includes(lowered)) {
        fit += 12;
        reasons.push(
          `Customer type alignment: ${programType} matches borrower context.`
        );
      }
    }
  }

  return { fit: Math.min(40, fit), reasons: unique(reasons) };
}

function programUseMatch(
  program: CapitalProgram,
  useTokens: Set<string>
): { fit: number; reasons: string[] } {
  if (useTokens.size === 0) {
    return {
      fit: 0,
      reasons: ["Borrower intended uses not supplied."],
    };
  }

  const reasons: string[] = [];
  let fit = 0;

  for (const programUse of program.eligibleUses) {
    const lowered = programUse.toLowerCase();

    for (const token of useTokens) {
      if (lowered.includes(token) || token.includes(lowered)) {
        fit += 10;
        reasons.push(
          `Eligible use alignment: ${programUse} matches borrower context.`
        );
      }
    }
  }

  return { fit: Math.min(35, fit), reasons: unique(reasons) };
}

function programFederationCheck(
  program: CapitalProgram,
  input: CapitalEligibilityInput
): string[] {
  if (
    program.federationScope === "SOVEREIGN" &&
    input.sovereignFederationAllowed !== true
  ) {
    return [
      "Sovereign federation participation not authorized in current scope.",
    ];
  }

  return [];
}

export function evaluateCapitalEligibility(
  input: CapitalEligibilityInput = {},
  registry: CapitalProgram[] = CAPITAL_GRAPH_REGISTRY
): CapitalEligibilityResult {
  const customerTokens = tokenSet(input.customerTypes);
  const useTokens = tokenSet(input.intendedUses);

  const matched: CapitalEligibilityFinding[] = [];
  const unreviewed: CapitalEligibilityFinding[] = [];

  for (const program of registry) {
    const jurisdiction = programJurisdictionMatch(program, input.jurisdiction);
    const customer = programCustomerMatch(program, customerTokens);
    const use = programUseMatch(program, useTokens);
    const federation = programFederationCheck(program, input);

    const fitScore = Math.max(
      0,
      Math.min(100, jurisdiction.fit + customer.fit + use.fit)
    );

    const fitReasons = unique([
      ...jurisdiction.reasons,
      ...customer.reasons,
      ...use.reasons,
    ]);

    const blockingReasons = unique([
      ...jurisdiction.blockers,
      ...federation,
    ]);

    const conflictSignals = unique([
      ...program.stackingRules.map(
        (rule) => `Stacking rule preserved for review: ${rule}`
      ),
      ...program.conflictRules.map(
        (rule) => `Conflict rule preserved for review: ${rule}`
      ),
    ]);

    const finding: CapitalEligibilityFinding = {
      programId: program.programId,
      categoryId: program.categoryId,
      fitScore,
      fitReasons,
      blockingReasons,
      conflictSignals,
      requiredReviewRoute: program.reviewRoute,
      blockedClaims: [...program.blockedClaims],
    };

    if (blockingReasons.length === 0 && fitScore >= 25) {
      matched.push(finding);
    } else {
      unreviewed.push(finding);
    }
  }

  matched.sort((a, b) => b.fitScore - a.fitScore);
  unreviewed.sort((a, b) => b.fitScore - a.fitScore);

  return { matched, unreviewed };
}

// =============================================================================
// Capital Pathway Matching + Runtime Composition
// =============================================================================

export type CapitalPathwayCandidate = {
  pathwayId: string;
  primaryProgramId: string;
  categoryId: CapitalCategoryId;
  composedPrograms: string[];
  fitScore: number;
  stackingNotes: string[];
  conflictSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type CapitalGraphInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  eligibility?: CapitalEligibilityInput | null;
  scope?: {
    categoryIds?: CapitalCategoryId[];
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type CapitalGraphSummary = {
  categoryCount: number;
  programCount: number;
  matchedProgramCount: number;
  unreviewedProgramCount: number;
  pathwayCandidateCount: number;
  conflictSignalCount: number;
  sovereignProgramCount: number;
  participantProgramCount: number;
  publicProgramCount: number;
};

export type CapitalGraphResult = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: CapitalGraphSummary;
  categories: CapitalCategoryGovernance[];
  programs: CapitalProgram[];
  eligibility: CapitalEligibilityResult;
  pathways: CapitalPathwayCandidate[];
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  capitalGraphInternalOnly: true;
  noAutonomousLending: true;
  noProgramApproval: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLegalReliance: true;
  noLiveExternalAction: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

export const CAPITAL_GRAPH_DISCLOSURES = [
  "Capital Graph output is advisory, replay-safe, audit-safe, and conflict-preserving.",
  "Capital Graph does not authorize approval, preapproval, eligibility determination, underwriting, credit decision, lender commitment, funding guarantee, program approval, tax-credit allocation, environmental clearance, carbon-credit issuance, regulatory reliance, or legal reliance.",
  "Capital Graph does not perform a live external sponsor fetch.",
  "Sponsor authority remains with the named human authorities; the Capital Graph does not grant authority.",
  "Federation scope governs which sovereign and participant programs are visible; sovereign programs require named sovereign participant review.",
  "Stacking and conflict rules are preserved as first-class evidence and never collapsed into a single authoritative claim.",
  "Human review is required before any pathway signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const CAPITAL_GRAPH_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no approval",
  "no preapproval",
  "no eligibility determination",
  "no underwriting decision",
  "no credit decision",
  "no lender commitment",
  "no funding guarantee",
  "no program approval",
  "no tax-credit allocation",
  "no environmental clearance",
  "no carbon-credit issuance",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no live external action",
  "no notice send",
  "no payment capture",
] as const;

function categoriesIncluded(
  scope: CapitalGraphInput["scope"] | undefined
): Set<CapitalCategoryId> {
  if (!scope || !Array.isArray(scope.categoryIds) || scope.categoryIds.length === 0) {
    return new Set(
      CAPITAL_CATEGORY_GOVERNANCE.map((category) => category.id)
    );
  }

  return new Set(scope.categoryIds);
}

function buildPathways(
  eligibility: CapitalEligibilityResult,
  registry: CapitalProgram[]
): CapitalPathwayCandidate[] {
  const programById = new Map(
    registry.map((program) => [program.programId, program] as const)
  );

  return eligibility.matched.slice(0, 12).map((finding) => {
    const primary = programById.get(finding.programId);

    const stackingNotes = primary?.stackingRules ?? [];
    const conflictSignals = unique([
      ...finding.conflictSignals,
      ...(primary?.conflictRules ?? []).map(
        (rule) => `Conflict rule preserved for review: ${rule}`
      ),
    ]);

    return {
      pathwayId: `pathway-${finding.programId}`,
      primaryProgramId: finding.programId,
      categoryId: finding.categoryId,
      composedPrograms: [finding.programId],
      fitScore: finding.fitScore,
      stackingNotes,
      conflictSignals,
      blockedClaims: finding.blockedClaims,
      reviewRoute: finding.requiredReviewRoute,
      doctrineRefs: primary?.doctrineRefs ?? [],
    };
  });
}

export function composeCapitalGraph(
  input: CapitalGraphInput = {}
): CapitalGraphResult {
  const includedCategories = categoriesIncluded(input.scope);
  const categories = CAPITAL_CATEGORY_GOVERNANCE.filter((category) =>
    includedCategories.has(category.id)
  );
  const programs = CAPITAL_GRAPH_REGISTRY.filter((program) =>
    includedCategories.has(program.categoryId)
  );

  const eligibility = evaluateCapitalEligibility(
    input.eligibility ?? {},
    programs
  );
  const pathways = buildPathways(eligibility, programs);

  const sovereignProgramCount = programs.filter(
    (program) => program.federationScope === "SOVEREIGN"
  ).length;
  const participantProgramCount = programs.filter(
    (program) => program.federationScope === "PARTICIPANT"
  ).length;
  const publicProgramCount = programs.filter(
    (program) => program.federationScope === "PUBLIC"
  ).length;

  const conflictSignalCount = pathways.reduce(
    (sum, pathway) => sum + pathway.conflictSignals.length,
    0
  );

  const summary: CapitalGraphSummary = {
    categoryCount: categories.length,
    programCount: programs.length,
    matchedProgramCount: eligibility.matched.length,
    unreviewedProgramCount: eligibility.unreviewed.length,
    pathwayCandidateCount: pathways.length,
    conflictSignalCount,
    sovereignProgramCount,
    participantProgramCount,
    publicProgramCount,
  };

  const recommendedReviewRoutes = unique([
    PROGRAM_REVIEW_ROUTE,
    "/financing-pathways",
    "/portal/borrower/opportunities",
    "/governance/advanced-intelligence",
    "/governance/certification-engine",
    "/governance/evidence-engine",
    "/governance/registry-framework",
    "/governance/connector-certification",
    "/lender/workflow",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: CAPITAL_GRAPH_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    categories,
    programs,
    eligibility,
    pathways,
    recommendedReviewRoutes,
    disclosures: unique([...CAPITAL_GRAPH_DISCLOSURES]),
    productionRestrictions: unique([...CAPITAL_GRAPH_PRODUCTION_RESTRICTIONS]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    capitalGraphInternalOnly: true,
    noAutonomousLending: true,
    noProgramApproval: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLegalReliance: true,
    noLiveExternalAction: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

// Version-lineage helper for downstream certification and evidence runtimes.
export function capitalGraphLineage(): {
  runtimeVersion: string;
  categoryCount: number;
  programCount: number;
} {
  return {
    runtimeVersion: CAPITAL_GRAPH_RUNTIME_VERSION,
    categoryCount: CAPITAL_CATEGORY_GOVERNANCE.length,
    programCount: CAPITAL_GRAPH_REGISTRY.length,
  };
}
