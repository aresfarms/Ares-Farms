import {
  CAPITAL_CATEGORY_GOVERNANCE,
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
  CapitalProgram,
} from "@/lib/capital-graph/capitalGraphRuntime";

/**
 * Customer Type Registry Runtime
 *
 * The borrower-side counterpart to the Capital Graph. Composes the
 * canonical customer-type taxonomy, the canonical CustomerType registry,
 * and the customer-type-to-Capital-Graph eligibility matcher into
 * deterministic, replay-safe, audit-safe, conflict-preserving, advisory-
 * only governance evidence.
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): each customer type names its
 *   qualified review boundary; the runtime never claims constitutional
 *   authority or autonomous eligibility determination.
 * - Vol II (Regulatory Governance): every customer type carries
 *   regulatory posture (documentation requirements, consent requirements,
 *   prohibited disclosure scope); matching is review-bound.
 * - Vol III (Technical Infrastructure): deterministic, replay-safe
 *   composition over the canonical taxonomy and registry.
 * - Vol III-B (Governance Runtime): runtime guard, classification,
 *   version lineage, observability, explainability, replay verification.
 * - Vol IV (Operational Runbooks): routes governed handoffs to the
 *   Capital Graph, financing pathway guidance, opportunity discovery,
 *   advanced intelligence, evidence engine, certification engine,
 *   registry framework, governance, reviews, and downstream consumers.
 * - Vol V (Canonical Doctrines): preserves claims governance, controlled
 *   disclosure, replay, audit, portability, and advisory-only boundaries.
 * - Vol VI (Source Intelligence Integration): keeps every customer-type
 *   entry behind a public-safe DTO with classification filtering and
 *   redaction; no raw borrower records, no live external fetch, no
 *   source-certainty claim.
 *
 * Safety boundary:
 * - The runtime produces internal advisory evidence only.
 * - It does not approve, deny, certify, underwrite, fund, commit, or
 *   otherwise create an autonomous customer eligibility determination,
 *   credit decision, lender commitment, regulatory reliance, or legal
 *   reliance.
 * - It does not perform a live external customer or sponsor fetch.
 * - Customer-type matching output remains advisory, replay-safe,
 *   conflict-preserving, and human-review-bound.
 * - Sponsor authority, regulatory determination, and qualified-reviewer
 *   approval remain with the named human authorities; the runtime never
 *   grants authority.
 */

export const CUSTOMER_TYPE_RUNTIME_VERSION =
  "customer-type-runtime-v0.1.0";

// =============================================================================
// Canonical Customer-Type Taxonomy
// =============================================================================

export type CustomerArchetype =
  | "AGRICULTURAL_PRODUCER"
  | "RURAL_SMALL_BUSINESS"
  | "AGRITOURISM_OPERATOR"
  | "UTILITY_CUSTOMER"
  | "COMMUNITY_FACILITY_SPONSOR"
  | "HISTORIC_PRESERVATION_OWNER"
  | "OPPORTUNITY_ZONE_BUSINESS"
  | "WORKFORCE_DEVELOPMENT_EMPLOYER"
  | "FOUNDATION_RECIPIENT"
  | "COOPERATIVE"
  | "NONPROFIT"
  | "TRIBAL_NATION"
  | "VETERAN_OWNED_BUSINESS"
  | "WOMEN_OWNED_BUSINESS"
  | "MINORITY_OWNED_BUSINESS"
  | "ENVIRONMENTAL_MARKET_PARTICIPANT"
  | "CARBON_MARKET_PARTICIPANT"
  | "MISSION_ALIGNED_BORROWER";

export type CustomerTypeFederationScope =
  | "SOVEREIGN"
  | "PARTICIPANT"
  | "PUBLIC";

export type CustomerType = {
  typeId: string;
  archetype: CustomerArchetype;
  label: string;
  description: string;
  matchingTokens: string[];
  eligibleCapitalCategories: CapitalCategoryId[];
  requiredDocumentation: string[];
  consentRequirements: string[];
  reviewBoundary: string;
  classificationLevel: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL";
  federationScope: CustomerTypeFederationScope;
  doctrineRefs: string[];
  blockedClaims: string[];
  reviewRoute: string;
  customerTypeVersion: string;
};

const DEFAULT_BLOCKED_CLAIMS = [
  "autonomous customer eligibility determination",
  "approval",
  "preapproval",
  "credit decision",
  "underwriting decision",
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
  "payment authorization",
  "notice send",
] as const;

const REVIEW_ROUTE = "/governance/customer-types";

export const CUSTOMER_TYPE_REGISTRY: CustomerType[] = [
  {
    typeId: "ct-agricultural-producer",
    archetype: "AGRICULTURAL_PRODUCER",
    label: "Agricultural producer",
    description:
      "Operator of an agricultural production enterprise (row crops, specialty crops, livestock, dairy, poultry, aquaculture, or mixed).",
    matchingTokens: [
      "agricultural producer",
      "farmer",
      "rancher",
      "crop producer",
      "livestock producer",
      "dairy producer",
      "specialty crop producer",
      "row crop farmer",
      "poultry producer",
      "aquaculture producer",
    ],
    eligibleCapitalCategories: [
      "USDA",
      "FSA",
      "REAP",
      "STATE_INCENTIVE_PROGRAMS",
      "CDFI",
      "ENERGY_CREDITS",
      "UTILITY_INCENTIVES",
      "ENVIRONMENTAL_MARKETS",
      "CARBON_MARKETS",
      "PRIVATE_LENDING",
      "CONVENTIONAL_BANKING",
      "EQUIPMENT_FINANCING",
      "VENDOR_FINANCING",
      "REVENUE_BASED_FINANCING",
    ],
    requiredDocumentation: [
      "operator identity",
      "operation location",
      "operation scope and farm types",
      "production history (where required by sponsor)",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "Producer eligibility remains with sponsor authority and qualified human review; the runtime does not certify producer status.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-AG-001",
      "Vol II §USDA-ENV-001",
      "Vol IV §AG-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-agricultural-producer-v0.1.0",
  },
  {
    typeId: "ct-beginning-farmer",
    archetype: "AGRICULTURAL_PRODUCER",
    label: "Beginning farmer",
    description:
      "Agricultural producer within the first ten years of operation; carries additional federal/state protections, eligibility, and review obligations.",
    matchingTokens: [
      "beginning farmer",
      "new farmer",
      "first-generation farmer",
      "young farmer",
      "young agricultural producer",
    ],
    eligibleCapitalCategories: [
      "USDA",
      "FSA",
      "REAP",
      "STATE_INCENTIVE_PROGRAMS",
      "CDFI",
      "FOUNDATION_GRANTS",
      "PHILANTHROPIC_FUNDING",
      "PRIVATE_LENDING",
      "EQUIPMENT_FINANCING",
      "VENDOR_FINANCING",
    ],
    requiredDocumentation: [
      "operator identity",
      "operation location",
      "operation scope and farm types",
      "beginning-farmer attestation (review required)",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "Beginning-farmer determination is a regulatory determination retained by FSA and qualified state administrators; the runtime does not certify status.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-AG-001",
      "Vol II §FSA-REG",
      "Vol IV §BEGINNING-FARMER-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "beginning-farmer determination",
    ],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-beginning-farmer-v0.1.0",
  },
  {
    typeId: "ct-rancher",
    archetype: "AGRICULTURAL_PRODUCER",
    label: "Rancher",
    description:
      "Operator of a ranching enterprise — beef, sheep, goat, dairy ranching, or mixed grazing operations.",
    matchingTokens: ["rancher", "beef rancher", "sheep rancher", "cattle rancher"],
    eligibleCapitalCategories: [
      "USDA",
      "FSA",
      "REAP",
      "STATE_INCENTIVE_PROGRAMS",
      "CDFI",
      "ENVIRONMENTAL_MARKETS",
      "CARBON_MARKETS",
      "PRIVATE_LENDING",
      "CONVENTIONAL_BANKING",
      "EQUIPMENT_FINANCING",
    ],
    requiredDocumentation: [
      "operator identity",
      "ranching operation location",
      "herd or flock posture",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "Ranching producer status remains with sponsor authority and qualified human review.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-AG-001",
      "Vol II §USDA-ENV-001",
      "Vol IV §RANCHING-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-rancher-v0.1.0",
  },
  {
    typeId: "ct-agritourism-operator",
    archetype: "AGRITOURISM_OPERATOR",
    label: "Agritourism operator",
    description:
      "Operator of an agritourism or rural-experience enterprise (farm experience, event hosting, on-farm hospitality).",
    matchingTokens: [
      "agritourism operator",
      "farm experience operator",
      "agritourism business",
      "rural hospitality operator",
    ],
    eligibleCapitalCategories: [
      "USDA",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
      "FOUNDATION_GRANTS",
      "CDFI",
      "PRIVATE_LENDING",
      "CONVENTIONAL_BANKING",
      "EQUIPMENT_FINANCING",
    ],
    requiredDocumentation: [
      "operator identity",
      "operation location",
      "tourism activity scope",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "Agritourism eligibility remains with sponsor authority and qualified human review; insurance, zoning, and public safety review remain external.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-AG-001",
      "Vol II §STATE-INCENTIVE-REG",
      "Vol IV §AGRITOURISM-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-agritourism-operator-v0.1.0",
  },
  {
    typeId: "ct-rural-small-business",
    archetype: "RURAL_SMALL_BUSINESS",
    label: "Rural small business",
    description:
      "Small business operating in a rural area (rural retail, rural manufacturing, rural service, or rural hospitality).",
    matchingTokens: [
      "rural small business",
      "rural retail",
      "rural manufacturer",
      "rural service business",
      "small business",
    ],
    eligibleCapitalCategories: [
      "SBA",
      "USDA",
      "REAP",
      "COMMUNITY_FACILITIES",
      "CDFI",
      "NEW_MARKETS_TAX_CREDITS",
      "OPPORTUNITY_ZONES",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
      "UTILITY_INCENTIVES",
      "WORKFORCE_PROGRAMS",
      "FOUNDATION_GRANTS",
      "PRIVATE_LENDING",
      "CONVENTIONAL_BANKING",
      "EQUIPMENT_FINANCING",
      "VENDOR_FINANCING",
      "REVENUE_BASED_FINANCING",
    ],
    requiredDocumentation: [
      "business identity",
      "rural location",
      "business activity scope",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "Rural designation and SBA-size determination remain with sponsor authority and qualified human review.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-SB-001",
      "Vol II §SBA-REG",
      "Vol IV §RURAL-SB-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "small-business size determination",
      "rural designation",
    ],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-rural-small-business-v0.1.0",
  },
  {
    typeId: "ct-utility-customer",
    archetype: "UTILITY_CUSTOMER",
    label: "Utility customer",
    description:
      "Utility-territory customer eligible for tariffed efficiency, demand-response, or capacity programs.",
    matchingTokens: [
      "utility customer",
      "energy customer",
      "electric utility customer",
      "gas utility customer",
    ],
    eligibleCapitalCategories: [
      "UTILITY_INCENTIVES",
      "REAP",
      "ENERGY_CREDITS",
      "STATE_INCENTIVE_PROGRAMS",
      "EQUIPMENT_FINANCING",
      "VENDOR_FINANCING",
    ],
    requiredDocumentation: [
      "utility account verification",
      "facility location and tariff posture",
    ],
    consentRequirements: [
      "borrower-guidance-consent",
      "utility-data-sharing-consent",
    ],
    reviewBoundary:
      "Utility tariff eligibility remains with the named utility authority and qualified human review.",
    classificationLevel: "INTERNAL",
    federationScope: "PARTICIPANT",
    doctrineRefs: [
      "Vol I §UTILITY-INCENTIVES-AUTHORITY",
      "Vol II §UTILITY-INCENTIVES-REG",
      "Vol IV §UTILITY-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "utility-territory eligibility determination",
    ],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-utility-customer-v0.1.0",
  },
  {
    typeId: "ct-community-facility-sponsor",
    archetype: "COMMUNITY_FACILITY_SPONSOR",
    label: "Community facility sponsor",
    description:
      "Public body, nonprofit, or federally recognized tribe sponsoring an essential community facility.",
    matchingTokens: [
      "community facility sponsor",
      "public body",
      "essential community facility",
    ],
    eligibleCapitalCategories: [
      "COMMUNITY_FACILITIES",
      "USDA",
      "CDFI",
      "FOUNDATION_GRANTS",
      "PHILANTHROPIC_FUNDING",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
      "WORKFORCE_PROGRAMS",
    ],
    requiredDocumentation: [
      "sponsor identity and authority",
      "facility scope and community served",
    ],
    consentRequirements: ["sponsor-guidance-consent"],
    reviewBoundary:
      "Essential community facility determination remains with USDA Rural Development and sponsor authority; the runtime does not certify status.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
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
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-community-facility-sponsor-v0.1.0",
  },
  {
    typeId: "ct-historic-preservation-owner",
    archetype: "HISTORIC_PRESERVATION_OWNER",
    label: "Historic preservation owner",
    description:
      "Owner of a certified or potentially-certifiable historic structure undertaking rehabilitation.",
    matchingTokens: [
      "historic preservation owner",
      "certified historic structure owner",
      "historic rehabilitation owner",
    ],
    eligibleCapitalCategories: [
      "HISTORIC_TAX_CREDITS",
      "NEW_MARKETS_TAX_CREDITS",
      "OPPORTUNITY_ZONES",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
      "FOUNDATION_GRANTS",
      "PRIVATE_LENDING",
      "CONVENTIONAL_BANKING",
    ],
    requiredDocumentation: [
      "owner identity",
      "structure identity and NPS posture",
      "rehabilitation scope",
    ],
    consentRequirements: ["owner-guidance-consent"],
    reviewBoundary:
      "Historic certification (Part 1/2/3) remains with the National Park Service and qualified human review.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
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
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-historic-preservation-owner-v0.1.0",
  },
  {
    typeId: "ct-opportunity-zone-business",
    archetype: "OPPORTUNITY_ZONE_BUSINESS",
    label: "Opportunity zone business",
    description:
      "Business operating in a Qualified Opportunity Zone and potentially qualifying as a QOZ business.",
    matchingTokens: [
      "opportunity zone business",
      "qualified opportunity zone business",
      "qoz business",
    ],
    eligibleCapitalCategories: [
      "OPPORTUNITY_ZONES",
      "NEW_MARKETS_TAX_CREDITS",
      "HISTORIC_TAX_CREDITS",
      "CDFI",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
      "PRIVATE_LENDING",
    ],
    requiredDocumentation: [
      "business identity",
      "QOZ location verification",
      "QOZ business activity scope",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "QOZ business determination remains with the IRS, the QOF sponsor, and qualified human review.",
    classificationLevel: "INTERNAL",
    federationScope: "PARTICIPANT",
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
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-opportunity-zone-business-v0.1.0",
  },
  {
    typeId: "ct-nmtc-eligible-business",
    archetype: "OPPORTUNITY_ZONE_BUSINESS",
    label: "NMTC-eligible business",
    description:
      "Qualified active low-income community business potentially eligible for NMTC-aligned investment.",
    matchingTokens: [
      "nmtc eligible business",
      "low-income community business",
      "qualified active low-income community business",
    ],
    eligibleCapitalCategories: [
      "NEW_MARKETS_TAX_CREDITS",
      "OPPORTUNITY_ZONES",
      "HISTORIC_TAX_CREDITS",
      "CDFI",
      "FOUNDATION_GRANTS",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
    ],
    requiredDocumentation: [
      "business identity",
      "low-income community verification",
      "activity scope verification",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "NMTC qualified-active-low-income-community-business determination remains with the CDE and qualified human review.",
    classificationLevel: "INTERNAL",
    federationScope: "PARTICIPANT",
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
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-nmtc-eligible-business-v0.1.0",
  },
  {
    typeId: "ct-workforce-development-employer",
    archetype: "WORKFORCE_DEVELOPMENT_EMPLOYER",
    label: "Workforce development employer",
    description:
      "Employer hiring qualifying target groups under WOTC, WIOA, or aligned workforce-development programs.",
    matchingTokens: [
      "workforce development employer",
      "wotc employer",
      "wioa employer",
      "apprenticeship employer",
    ],
    eligibleCapitalCategories: [
      "WORKFORCE_PROGRAMS",
      "SBA",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
      "FOUNDATION_GRANTS",
    ],
    requiredDocumentation: [
      "employer identity",
      "workforce program enrollment posture",
      "hiring posture",
    ],
    consentRequirements: ["employer-guidance-consent"],
    reviewBoundary:
      "Workforce program eligibility remains with DOL, IRS, and state administering agencies.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
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
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-workforce-development-employer-v0.1.0",
  },
  {
    typeId: "ct-foundation-recipient",
    archetype: "FOUNDATION_RECIPIENT",
    label: "Foundation grant recipient",
    description:
      "Mission-aligned organization or for-profit qualifying for foundation grants or program-related investments.",
    matchingTokens: [
      "foundation grant recipient",
      "mission aligned organization",
      "mission aligned borrower",
      "program-related investment recipient",
    ],
    eligibleCapitalCategories: [
      "FOUNDATION_GRANTS",
      "PHILANTHROPIC_FUNDING",
      "CDFI",
      "PRIVATE_LENDING",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
    ],
    requiredDocumentation: [
      "organization identity",
      "mission alignment narrative",
      "use of funds narrative",
    ],
    consentRequirements: ["grantee-guidance-consent"],
    reviewBoundary:
      "Mission alignment and foundation award determination remain with the named foundation authority.",
    classificationLevel: "INTERNAL",
    federationScope: "PARTICIPANT",
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
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-foundation-recipient-v0.1.0",
  },
  {
    typeId: "ct-cooperative",
    archetype: "COOPERATIVE",
    label: "Cooperative",
    description:
      "Producer, worker, or consumer cooperative organized under state cooperative statute.",
    matchingTokens: [
      "cooperative",
      "co-op",
      "producer cooperative",
      "worker cooperative",
      "consumer cooperative",
    ],
    eligibleCapitalCategories: [
      "USDA",
      "FSA",
      "SBA",
      "REAP",
      "CDFI",
      "NEW_MARKETS_TAX_CREDITS",
      "STATE_INCENTIVE_PROGRAMS",
      "FOUNDATION_GRANTS",
      "PRIVATE_LENDING",
      "EQUIPMENT_FINANCING",
    ],
    requiredDocumentation: [
      "cooperative identity",
      "cooperative type and member posture",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "Cooperative status remains with state authority and qualified human review.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-COOP-001",
      "Vol II §STATE-INCENTIVE-REG",
      "Vol IV §COOP-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-cooperative-v0.1.0",
  },
  {
    typeId: "ct-nonprofit",
    archetype: "NONPROFIT",
    label: "Nonprofit organization",
    description:
      "501(c)(3) or related nonprofit organization operating in agriculture, rural development, or community services.",
    matchingTokens: ["nonprofit", "501(c)(3)", "501c3", "ngo"],
    eligibleCapitalCategories: [
      "USDA",
      "COMMUNITY_FACILITIES",
      "FOUNDATION_GRANTS",
      "PHILANTHROPIC_FUNDING",
      "CDFI",
      "NEW_MARKETS_TAX_CREDITS",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
      "WORKFORCE_PROGRAMS",
    ],
    requiredDocumentation: [
      "organization identity",
      "tax-exempt status posture",
      "mission narrative",
    ],
    consentRequirements: ["grantee-guidance-consent"],
    reviewBoundary:
      "Tax-exempt status remains with the IRS; mission alignment remains with the named sponsor authority.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-NONPROFIT-001",
      "Vol II §NONPROFIT-REG",
      "Vol IV §NONPROFIT-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-nonprofit-v0.1.0",
  },
  {
    typeId: "ct-tribal-nation",
    archetype: "TRIBAL_NATION",
    label: "Federally recognized tribe",
    description:
      "Federally recognized tribal nation or tribal enterprise. Sovereign federation participation required for sovereign-scope visibility.",
    matchingTokens: [
      "tribal nation",
      "federally recognized tribe",
      "tribal enterprise",
      "indigenous nation",
    ],
    eligibleCapitalCategories: [
      "USDA",
      "COMMUNITY_FACILITIES",
      "CDFI",
      "FOUNDATION_GRANTS",
      "PHILANTHROPIC_FUNDING",
      "WORKFORCE_PROGRAMS",
      "STATE_INCENTIVE_PROGRAMS",
      "ENVIRONMENTAL_MARKETS",
      "CARBON_MARKETS",
    ],
    requiredDocumentation: [
      "tribal authority identity",
      "tribal council resolution (where required by sponsor)",
    ],
    consentRequirements: [
      "tribal-sovereign-consent",
      "borrower-guidance-consent",
    ],
    reviewBoundary:
      "Tribal sovereign participation remains with the tribal nation and qualified human review; the runtime does not bind sovereign authority.",
    classificationLevel: "CONFIDENTIAL",
    federationScope: "SOVEREIGN",
    doctrineRefs: [
      "Vol I §CANON-SOVEREIGNTY-001",
      "Vol II §TRIBAL-REG",
      "Vol IV §TRIBAL-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "tribal sovereign reliance",
    ],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-tribal-nation-v0.1.0",
  },
  {
    typeId: "ct-veteran-owned-business",
    archetype: "VETERAN_OWNED_BUSINESS",
    label: "Veteran-owned business",
    description:
      "Veteran-owned small business (VOSB) or service-disabled veteran-owned small business (SDVOSB).",
    matchingTokens: [
      "veteran owned business",
      "vosb",
      "sdvosb",
      "service-disabled veteran",
    ],
    eligibleCapitalCategories: [
      "SBA",
      "USDA",
      "STATE_INCENTIVE_PROGRAMS",
      "FOUNDATION_GRANTS",
      "PRIVATE_LENDING",
      "CDFI",
    ],
    requiredDocumentation: [
      "business identity",
      "veteran-ownership verification",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "VOSB / SDVOSB certification remains with SBA and the named certifying authority.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-SB-001",
      "Vol II §SBA-REG",
      "Vol IV §SBA-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS, "VOSB/SDVOSB certification"],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-veteran-owned-business-v0.1.0",
  },
  {
    typeId: "ct-women-owned-business",
    archetype: "WOMEN_OWNED_BUSINESS",
    label: "Women-owned business",
    description:
      "Women-owned small business (WOSB) or economically disadvantaged women-owned small business (EDWOSB).",
    matchingTokens: [
      "women owned business",
      "wosb",
      "edwosb",
      "women-owned small business",
    ],
    eligibleCapitalCategories: [
      "SBA",
      "USDA",
      "STATE_INCENTIVE_PROGRAMS",
      "FOUNDATION_GRANTS",
      "PRIVATE_LENDING",
      "CDFI",
    ],
    requiredDocumentation: [
      "business identity",
      "women-ownership verification",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "WOSB / EDWOSB certification remains with SBA and the named certifying authority.",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-SB-001",
      "Vol II §SBA-REG",
      "Vol IV §SBA-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS, "WOSB/EDWOSB certification"],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-women-owned-business-v0.1.0",
  },
  {
    typeId: "ct-minority-owned-business",
    archetype: "MINORITY_OWNED_BUSINESS",
    label: "Minority-owned business",
    description:
      "Minority business enterprise (MBE) under federal, state, or municipal certification.",
    matchingTokens: [
      "minority owned business",
      "mbe",
      "minority business enterprise",
      "disadvantaged business enterprise",
      "dbe",
    ],
    eligibleCapitalCategories: [
      "SBA",
      "USDA",
      "STATE_INCENTIVE_PROGRAMS",
      "MUNICIPAL_INCENTIVES",
      "FOUNDATION_GRANTS",
      "PRIVATE_LENDING",
      "CDFI",
    ],
    requiredDocumentation: [
      "business identity",
      "MBE certification posture",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "MBE certification remains with the named certifying authority (federal, state, or municipal).",
    classificationLevel: "INTERNAL",
    federationScope: "PUBLIC",
    doctrineRefs: [
      "Vol I §ROLE-SB-001",
      "Vol II §SBA-REG",
      "Vol IV §SBA-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "MBE/DBE certification",
    ],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-minority-owned-business-v0.1.0",
  },
  {
    typeId: "ct-environmental-market-participant",
    archetype: "ENVIRONMENTAL_MARKET_PARTICIPANT",
    label: "Environmental market participant",
    description:
      "Landowner or producer with capacity to generate wetlands, species, or conservation mitigation credits.",
    matchingTokens: [
      "environmental market participant",
      "wetlands banker",
      "mitigation banker",
      "conservation easement participant",
    ],
    eligibleCapitalCategories: [
      "ENVIRONMENTAL_MARKETS",
      "USDA",
      "STATE_INCENTIVE_PROGRAMS",
      "FOUNDATION_GRANTS",
    ],
    requiredDocumentation: [
      "participant identity",
      "land control documentation",
      "environmental practice posture",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "Environmental mitigation credit issuance remains with the U.S. Army Corps of Engineers and approved bankers.",
    classificationLevel: "INTERNAL",
    federationScope: "PARTICIPANT",
    doctrineRefs: [
      "Vol I §ENV-MARKET-AUTHORITY",
      "Vol II §USDA-ENV-001",
      "Vol IV §ENV-MARKET-RUNBOOK",
      "Vol V §CANON-CLAIMS-001",
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      "environmental-mitigation-credit issuance",
    ],
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-environmental-market-participant-v0.1.0",
  },
  {
    typeId: "ct-carbon-market-participant",
    archetype: "CARBON_MARKET_PARTICIPANT",
    label: "Carbon market participant",
    description:
      "Producer, landowner, or aggregator with capacity to generate soil-carbon, methane-reduction, or forestry-carbon credits.",
    matchingTokens: [
      "carbon market participant",
      "soil carbon participant",
      "carbon credit producer",
      "forestry carbon participant",
    ],
    eligibleCapitalCategories: [
      "CARBON_MARKETS",
      "USDA",
      "ENVIRONMENTAL_MARKETS",
      "STATE_INCENTIVE_PROGRAMS",
      "FOUNDATION_GRANTS",
    ],
    requiredDocumentation: [
      "participant identity",
      "carbon practice posture",
      "registry enrollment posture",
    ],
    consentRequirements: ["borrower-guidance-consent"],
    reviewBoundary:
      "Carbon credit issuance and additionality determination remain with the approved registry.",
    classificationLevel: "INTERNAL",
    federationScope: "PARTICIPANT",
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
    reviewRoute: REVIEW_ROUTE,
    customerTypeVersion: "ct-carbon-market-participant-v0.1.0",
  },
];

// =============================================================================
// Composition Input + Output
// =============================================================================

export type CustomerTypeInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  borrowerContext?: {
    customerTypeIds?: string[];
    declaredTypes?: string[];
    jurisdiction?: {
      federal?: boolean;
      state?: string | null;
    } | null;
  } | null;
  scope?: {
    archetypes?: CustomerArchetype[];
    federationScope?: CustomerTypeFederationScope;
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type CustomerTypeMatchSignal = {
  signalType: "EXACT" | "TOKEN_MATCH" | "ARCHETYPE";
  matchedToken: string;
  customerTypeId: string;
};

export type CustomerTypeEligibilityCapitalRef = {
  programId: string;
  programName: string;
  categoryId: CapitalCategoryId;
  programVersion: string;
  federationScope: CapitalProgram["federationScope"];
};

export type CustomerTypeProfile = {
  customerType: CustomerType;
  matchSignals: CustomerTypeMatchSignal[];
  eligibleCapitalRefs: CustomerTypeEligibilityCapitalRef[];
  conflictSignals: string[];
  blockedClaims: string[];
  reviewBoundary: string;
};

export type CustomerTypeSummary = {
  archetypeCount: number;
  customerTypeCount: number;
  matchedTypeCount: number;
  totalEligibleCapitalRefCount: number;
  conflictSignalCount: number;
  sovereignTypeCount: number;
  participantTypeCount: number;
  publicTypeCount: number;
};

export type CustomerTypeResult = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: CustomerTypeSummary;
  archetypes: CustomerArchetype[];
  customerTypes: CustomerType[];
  profiles: CustomerTypeProfile[];
  unmatchedTypes: CustomerType[];
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  customerTypeInternalOnly: true;
  noAutonomousEligibility: true;
  noAutonomousLending: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLegalReliance: true;
  noLiveExternalAction: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

export const CUSTOMER_TYPE_DISCLOSURES = [
  "Customer Type Registry output is advisory, replay-safe, audit-safe, and conflict-preserving.",
  "Customer Type Registry does not authorize autonomous customer eligibility determination, credit decision, underwriting decision, lender commitment, funding guarantee, program approval, tax-credit allocation, environmental clearance, carbon-credit issuance, regulatory reliance, or legal reliance.",
  "Customer Type Registry does not perform a live external borrower or sponsor fetch.",
  "Sponsor authority and qualified-reviewer approval remain with the named human authorities; the Customer Type Registry does not grant authority.",
  "Sovereign customer types (e.g. tribal nations) are visible only when named sovereign federation participation is authorized.",
  "Conflict signals between eligible capital categories are preserved as first-class evidence and never collapsed into a single authoritative claim.",
  "Human review is required before any customer-type signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const CUSTOMER_TYPE_PRODUCTION_RESTRICTIONS = [
  "no autonomous customer eligibility determination",
  "no autonomous lending decision",
  "no approval",
  "no preapproval",
  "no credit decision",
  "no underwriting decision",
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
  "no payment authorization",
] as const;

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

function tokenContains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function buildMatchSignals(
  customerType: CustomerType,
  declaredTypes: string[],
  declaredIds: Set<string>
): CustomerTypeMatchSignal[] {
  const signals: CustomerTypeMatchSignal[] = [];

  if (declaredIds.has(customerType.typeId)) {
    signals.push({
      signalType: "EXACT",
      matchedToken: customerType.typeId,
      customerTypeId: customerType.typeId,
    });
  }

  for (const declared of declaredTypes) {
    if (!declared || declared.trim().length === 0) {
      continue;
    }

    for (const token of customerType.matchingTokens) {
      if (tokenContains(declared, token) || tokenContains(token, declared)) {
        signals.push({
          signalType: "TOKEN_MATCH",
          matchedToken: token,
          customerTypeId: customerType.typeId,
        });
      }
    }
  }

  return signals;
}

function buildEligibleCapitalRefs(
  customerType: CustomerType
): CustomerTypeEligibilityCapitalRef[] {
  const refs: CustomerTypeEligibilityCapitalRef[] = [];
  const allowed = new Set(customerType.eligibleCapitalCategories);

  for (const program of CAPITAL_GRAPH_REGISTRY) {
    if (!allowed.has(program.categoryId)) {
      continue;
    }

    refs.push({
      programId: program.programId,
      programName: program.programName,
      categoryId: program.categoryId,
      programVersion: program.programVersion,
      federationScope: program.federationScope,
    });
  }

  return refs;
}

function buildConflictSignals(
  customerType: CustomerType,
  capitalRefs: CustomerTypeEligibilityCapitalRef[]
): string[] {
  const categories = new Set(capitalRefs.map((ref) => ref.categoryId));
  const signals: string[] = [];

  if (categories.size >= 5) {
    signals.push(
      `Eligibility spans ${categories.size} capital categories; stacking and conflict rules must be reviewed before any pathway reliance.`
    );
  }

  if (customerType.federationScope === "SOVEREIGN") {
    signals.push(
      "Sovereign-scope customer type requires named sovereign participant review before pathway composition."
    );
  }

  const sponsorSplit = new Set(
    capitalRefs.map((ref) => ref.federationScope)
  );

  if (sponsorSplit.size > 1) {
    signals.push(
      "Capital program federation scopes are mixed across eligible programs; review required to apply correct disclosure boundaries."
    );
  }

  return signals;
}

function isScopeIncluded(
  customerType: CustomerType,
  scope: CustomerTypeInput["scope"]
): boolean {
  const sovereignFederationAllowed =
    scope?.sovereignFederationAllowed === true;

  if (
    customerType.federationScope === "SOVEREIGN" &&
    !sovereignFederationAllowed
  ) {
    return false;
  }

  if (!scope) {
    return true;
  }

  if (Array.isArray(scope.archetypes) && scope.archetypes.length > 0) {
    if (!scope.archetypes.includes(customerType.archetype)) {
      return false;
    }
  }

  if (scope.federationScope) {
    if (customerType.federationScope !== scope.federationScope) {
      return false;
    }
  }

  return true;
}

export function composeCustomerTypeRegistry(
  input: CustomerTypeInput = {}
): CustomerTypeResult {
  const scope = input.scope ?? null;
  const declaredTypes = input.borrowerContext?.declaredTypes ?? [];
  const declaredIdsArray = input.borrowerContext?.customerTypeIds ?? [];
  const declaredIds = new Set(declaredIdsArray);

  const scopedTypes = CUSTOMER_TYPE_REGISTRY.filter((customerType) =>
    isScopeIncluded(customerType, scope)
  );

  const profiles: CustomerTypeProfile[] = [];
  const unmatchedTypes: CustomerType[] = [];

  for (const customerType of scopedTypes) {
    const matchSignals = buildMatchSignals(
      customerType,
      declaredTypes,
      declaredIds
    );

    if (matchSignals.length === 0) {
      unmatchedTypes.push(customerType);
      continue;
    }

    const eligibleCapitalRefs = buildEligibleCapitalRefs(customerType);
    const conflictSignals = buildConflictSignals(
      customerType,
      eligibleCapitalRefs
    );

    profiles.push({
      customerType,
      matchSignals,
      eligibleCapitalRefs,
      conflictSignals,
      blockedClaims: [...customerType.blockedClaims],
      reviewBoundary: customerType.reviewBoundary,
    });
  }

  const archetypes = unique(
    scopedTypes.map((customerType) => customerType.archetype)
  );

  const totalEligibleCapitalRefCount = profiles.reduce(
    (sum, profile) => sum + profile.eligibleCapitalRefs.length,
    0
  );

  const conflictSignalCount = profiles.reduce(
    (sum, profile) => sum + profile.conflictSignals.length,
    0
  );

  const sovereignTypeCount = scopedTypes.filter(
    (customerType) => customerType.federationScope === "SOVEREIGN"
  ).length;
  const participantTypeCount = scopedTypes.filter(
    (customerType) => customerType.federationScope === "PARTICIPANT"
  ).length;
  const publicTypeCount = scopedTypes.filter(
    (customerType) => customerType.federationScope === "PUBLIC"
  ).length;

  const summary: CustomerTypeSummary = {
    archetypeCount: archetypes.length,
    customerTypeCount: scopedTypes.length,
    matchedTypeCount: profiles.length,
    totalEligibleCapitalRefCount,
    conflictSignalCount,
    sovereignTypeCount,
    participantTypeCount,
    publicTypeCount,
  };

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
    "/governance/capital-graph",
    "/financing-pathways",
    "/portal/borrower/opportunities",
    "/governance/advanced-intelligence",
    "/governance/certification-engine",
    "/governance/evidence-engine",
    "/governance/registry-framework",
    "/lender/workflow",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: CUSTOMER_TYPE_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    archetypes,
    customerTypes: scopedTypes,
    profiles,
    unmatchedTypes,
    recommendedReviewRoutes,
    disclosures: unique([...CUSTOMER_TYPE_DISCLOSURES]),
    productionRestrictions: unique([
      ...CUSTOMER_TYPE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    customerTypeInternalOnly: true,
    noAutonomousEligibility: true,
    noAutonomousLending: true,
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

// Version-lineage helper for downstream certification and registry runtimes.
export function customerTypeRegistryLineage(): {
  runtimeVersion: string;
  archetypeCount: number;
  customerTypeCount: number;
  capitalGraphCategoryCount: number;
} {
  const archetypes = unique(
    CUSTOMER_TYPE_REGISTRY.map((customerType) => customerType.archetype)
  );

  return {
    runtimeVersion: CUSTOMER_TYPE_RUNTIME_VERSION,
    archetypeCount: archetypes.length,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalGraphCategoryCount: CAPITAL_CATEGORY_GOVERNANCE.length,
  };
}
