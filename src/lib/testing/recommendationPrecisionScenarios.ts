import { BorrowerOnboardingState } from "@/lib/borrower/onboardingCore";
import { CapitalCategoryId } from "@/lib/capital-graph/capitalGraphRuntime";

/**
 * Recommendation Precision Test Harness — Canonical Persona Fixtures
 *
 * Trust-preservation gate for Furlong recommendations. Each persona
 * fixture exercises the canonical v2 stack (Customer Type Registry,
 * Capital Graph, Revenue Intelligence v2, Financing Pathway Engine
 * v2, Opportunity Discovery v2, Borrower Onboarding Core v2,
 * Readiness Assessment v2) and asserts whether the composed
 * recommendations are relevant to the borrower's customer profile,
 * project type, geography, asset type, and stated intent.
 *
 * The harness exists to prevent irrelevant recommendations such as
 * returning agricultural / pig-farm pathways for a hotel owner in
 * New Jersey. It is a trust-preservation gate, not just a quality
 * test.
 *
 * Master Volume Governance:
 * - Vol I: keeps the harness subordinate to constitutional authority;
 *   precision testing never grants authority and never replaces
 *   external review.
 * - Vol II: blocks the harness from claiming approval, eligibility
 *   certainty, lender commitment, funding certainty, agency
 *   decision, public verification, regulatory reliance, or legal
 *   reliance.
 * - Vol III: deterministic, replay-safe scenario execution with
 *   explicit version lineage chaining the harness through the v2
 *   composition stack.
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, replay verification.
 * - Vol IV: routes governed handoffs to the upstream canonical v2
 *   modules and to governance, reviews, evidence packets, audit
 *   replay, and module readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, advisory-only boundaries.
 * - Vol VI: keeps every composed recommendation behind a public-
 *   safe DTO; no live external fetch; no source-certainty claim.
 *
 * Safety boundary:
 * - Internal test harness only.
 * - No customer-facing approval, eligibility, lender commitment,
 *   agency decision, public verification, or regulatory reliance.
 * - Validates advisory relevance and trust-preserving
 *   recommendation behavior only.
 */

export const RECOMMENDATION_PRECISION_SCENARIOS_VERSION =
  "recommendation-precision-scenarios-v0.1.0";

export type RecommendationPrecisionScenario = {
  scenarioId: string;
  label: string;
  description: string;
  // Borrower profile context.
  customerType: string;
  declaredCustomerTypes: string[];
  geography: {
    country: string;
    state: string;
    county: string | null;
    contextDescriptor: string;
  };
  projectGoal: string;
  assetType: string;
  desiredUseOfFunds: string[];
  borrowerStateOverride?: Partial<BorrowerOnboardingState>;
  // Expectations.
  expectedRelevantPathways: string[];
  expectedExcludedPathways: string[];
  expectedRelevantCategories: CapitalCategoryId[];
  expectedExcludedCategories: CapitalCategoryId[];
  expectedReadinessGaps: string[];
  expectedNextSteps: string[];
  expectedConflictTopics: string[];
  expectsZeroMatchedProfiles: boolean;
  humanReviewNotes: string;
};

const baseInterests = {
  soilAnalysis: false,
  environmentalReports: false,
  financing: true,
  vendorRecommendations: false,
  commodityIntelligence: false,
} as const;

export const RECOMMENDATION_PRECISION_SCENARIOS: RecommendationPrecisionScenario[] =
  [
    // ────────────────────────────────────────────────────────────────────
    // Scenario 1: Hotel owner in urban NJ — intentionally bad-fit
    // ────────────────────────────────────────────────────────────────────
    {
      scenarioId: "hotel-owner-urban-nj",
      label: "Hotel owner in urban NJ",
      description:
        "Hotel owner in urban Newark, NJ seeking refinance and renovation capital. Furlong's canonical taxonomy is farmer/borrower-focused; this scenario should NOT return agricultural pathways. Expected: weak or zero matched customer profiles, conflict signals surfaced, no USDA/FSA/REAP grant cards.",
      customerType: "Hotel owner (urban)",
      declaredCustomerTypes: ["hotel owner"],
      geography: {
        country: "US",
        state: "NJ",
        county: "Essex",
        contextDescriptor: "Newark — urban / metropolitan",
      },
      projectGoal: "Renovation and refinance of urban hospitality property",
      assetType: "Commercial hospitality real estate",
      desiredUseOfFunds: [
        "property renovation",
        "refinance existing debt",
        "operating capital",
      ],
      borrowerStateOverride: {
        farmTypes: [],
        goals: ["EXPANSION"],
        acreage: 0,
      },
      expectedRelevantPathways: [
        "(none — Furlong taxonomy does not currently cover urban hospitality)",
      ],
      expectedExcludedPathways: [
        "USDA Farm Service Agency loans",
        "Rural Energy for America Program (REAP)",
        "Beginning farmer or rancher programs",
        "Agricultural specialty crop programs",
      ],
      expectedRelevantCategories: [],
      expectedExcludedCategories: ["USDA", "FSA", "REAP"],
      expectedReadinessGaps: [
        "no matched customer type for hotel/hospitality archetype",
      ],
      expectedNextSteps: [
        "/governance/customer-types",
        "/governance/borrower-onboarding-core-v2",
      ],
      expectedConflictTopics: [
        "no declared customer types",
        "customer types did not match",
      ],
      expectsZeroMatchedProfiles: true,
      humanReviewNotes:
        "Reviewer must confirm: no agricultural pathway returned. If any agricultural recommendation appears, that is a trust-preservation failure. Hospitality customer types do not exist in the canonical taxonomy yet; this is the correct boundary signal.",
    },
    // ────────────────────────────────────────────────────────────────────
    // Scenario 2: Hotel owner in rural MO — partial fit via rural small business
    // ────────────────────────────────────────────────────────────────────
    {
      scenarioId: "hotel-owner-rural-mo",
      label: "Hotel owner in rural MO",
      description:
        "Hotel owner in rural Missouri operating a small lodging business. Should match rural small business archetype. Expected: SBA / CDFI / state incentive programs; NOT pig-farm / livestock / specialty-crop programs.",
      customerType: "Rural small business (hotel)",
      declaredCustomerTypes: ["rural small business"],
      geography: {
        country: "US",
        state: "MO",
        county: "Howell",
        contextDescriptor: "Howell County, MO — rural / Ozark plateau",
      },
      projectGoal:
        "Expansion of rural hospitality business with energy efficiency upgrades",
      assetType: "Rural commercial real estate (small hotel)",
      desiredUseOfFunds: [
        "energy efficiency",
        "expansion",
        "operating capital",
      ],
      borrowerStateOverride: {
        farmTypes: [],
        goals: ["EXPANSION"],
        acreage: 0,
        interests: {
          ...baseInterests,
          financing: true,
        },
      },
      expectedRelevantPathways: [
        "SBA Community Advantage / 7(a)",
        "CDFI Fund programs",
        "State rural development incentives",
        "Utility energy-efficiency incentives",
      ],
      expectedExcludedPathways: [
        "USDA livestock operating loans (e.g. pig/cattle)",
        "Specialty crop block grant",
        "FSA agricultural production loans",
      ],
      expectedRelevantCategories: ["SBA", "CDFI", "STATE_INCENTIVE_PROGRAMS"],
      expectedExcludedCategories: ["FSA"],
      expectedReadinessGaps: [
        "fee disclosure acknowledgement may be required for downstream service routing",
      ],
      expectedNextSteps: [
        "/governance/opportunity-discovery-v2",
        "/governance/financing-pathway-engine-v2",
      ],
      expectedConflictTopics: [],
      expectsZeroMatchedProfiles: false,
      humanReviewNotes:
        "Reviewer must confirm: rural small business pathways appear; no agricultural production pathways appear; any livestock-specific suggestion is a precision failure.",
    },
    // ────────────────────────────────────────────────────────────────────
    // Scenario 3: Farmer / rancher — strong canonical match
    // ────────────────────────────────────────────────────────────────────
    {
      scenarioId: "farmer-rancher-md",
      label: "Beginning farmer / rancher in MD",
      description:
        "Beginning farmer raising cattle and specialty crops in rural Maryland. Strong canonical match. Expected: USDA / FSA / REAP / state agricultural programs.",
      customerType: "Beginning farmer / rancher",
      declaredCustomerTypes: ["beginning farmer", "rancher"],
      geography: {
        country: "US",
        state: "MD",
        county: "Frederick",
        contextDescriptor: "Frederick County, MD — agricultural plateau",
      },
      projectGoal:
        "Acquire equipment, expand specialty crop operation, add livestock",
      assetType: "Agricultural land + equipment",
      desiredUseOfFunds: [
        "operating capital",
        "equipment financing",
        "specialty crops",
        "livestock",
      ],
      borrowerStateOverride: {
        farmTypes: ["CROPS", "LIVESTOCK", "BEEF"],
        goals: ["EXPANSION", "PROFIT_MAXIMIZATION"],
        acreage: 80,
        interests: {
          ...baseInterests,
          soilAnalysis: true,
          environmentalReports: false,
          vendorRecommendations: true,
        },
      },
      expectedRelevantPathways: [
        "USDA Farm Service Agency direct/guaranteed farm ownership and operating loans",
        "Beginning Farmer and Rancher Development Program",
        "Specialty Crop Block Grant",
        "Equipment financing for agricultural producers",
      ],
      expectedExcludedPathways: [
        "Historic tax credits",
        "Opportunity Zone investment vehicles",
        "Carbon market issuance (not a market participant yet)",
      ],
      expectedRelevantCategories: ["USDA", "FSA", "EQUIPMENT_FINANCING"],
      expectedExcludedCategories: [
        "HISTORIC_TAX_CREDITS",
        "OPPORTUNITY_ZONES",
      ],
      expectedReadinessGaps: [],
      expectedNextSteps: [
        "/governance/financing-pathway-engine-v2",
        "/governance/opportunity-discovery-v2",
      ],
      expectedConflictTopics: [],
      expectsZeroMatchedProfiles: false,
      humanReviewNotes:
        "Reviewer must confirm: USDA/FSA programs appear; historic tax credits do not appear; if NMTC or OZ appears without strong justification, that is a precision failure.",
    },
    // ────────────────────────────────────────────────────────────────────
    // Scenario 4: Mobile home park owner — rural small business edge case
    // ────────────────────────────────────────────────────────────────────
    {
      scenarioId: "mobile-home-park-owner",
      label: "Mobile home park owner",
      description:
        "Owner of a manufactured home community in rural Mississippi seeking capital improvements. May partially match rural small business and CDFI programs; should NOT receive agricultural production pathways.",
      customerType: "Rural small business (manufactured home community)",
      declaredCustomerTypes: ["rural small business"],
      geography: {
        country: "US",
        state: "MS",
        county: "Madison",
        contextDescriptor: "Madison County, MS — rural",
      },
      projectGoal: "Capital improvements, infrastructure upgrades",
      assetType: "Manufactured home community real property",
      desiredUseOfFunds: [
        "infrastructure",
        "energy efficiency",
        "refinance",
      ],
      borrowerStateOverride: {
        farmTypes: [],
        goals: ["EXPANSION"],
        acreage: 12,
      },
      expectedRelevantPathways: [
        "CDFI Fund / community lender programs",
        "Rural development / small business pathway",
        "State infrastructure incentive programs",
      ],
      expectedExcludedPathways: [
        "USDA Farm Service Agency operating loans",
        "Specialty crop block grant",
        "Carbon market issuance",
      ],
      expectedRelevantCategories: ["CDFI", "SBA", "STATE_INCENTIVE_PROGRAMS"],
      expectedExcludedCategories: ["FSA", "CARBON_MARKETS"],
      expectedReadinessGaps: [],
      expectedNextSteps: ["/governance/opportunity-discovery-v2"],
      expectedConflictTopics: [],
      expectsZeroMatchedProfiles: false,
      humanReviewNotes:
        "Reviewer must confirm: no agricultural production pathways. Manufactured housing is a community-development matter, not a farmer/producer matter.",
    },
    // ────────────────────────────────────────────────────────────────────
    // Scenario 5: Contractor / equipment operator
    // ────────────────────────────────────────────────────────────────────
    {
      scenarioId: "contractor-equipment-operator",
      label: "Contractor / equipment operator",
      description:
        "Rural contractor operating heavy equipment for agricultural clients. Looking for equipment financing. Should match rural small business + equipment financing; should NOT receive farmer production pathways.",
      customerType: "Rural small business (contractor)",
      declaredCustomerTypes: ["rural small business"],
      geography: {
        country: "US",
        state: "IA",
        county: "Story",
        contextDescriptor: "Story County, IA — rural",
      },
      projectGoal: "Equipment acquisition + working capital",
      assetType: "Heavy equipment",
      desiredUseOfFunds: ["equipment financing", "operating capital"],
      borrowerStateOverride: {
        farmTypes: [],
        goals: ["EXPANSION"],
        acreage: 0,
        interests: {
          ...baseInterests,
          vendorRecommendations: true,
        },
      },
      expectedRelevantPathways: [
        "SBA equipment financing",
        "Equipment financing programs",
        "Vendor financing",
      ],
      expectedExcludedPathways: [
        "FSA producer operating loans",
        "Specialty crop block grant",
      ],
      expectedRelevantCategories: [
        "SBA",
        "EQUIPMENT_FINANCING",
        "VENDOR_FINANCING",
      ],
      expectedExcludedCategories: ["FSA"],
      expectedReadinessGaps: [],
      expectedNextSteps: ["/governance/opportunity-discovery-v2"],
      expectedConflictTopics: [],
      expectsZeroMatchedProfiles: false,
      humanReviewNotes:
        "Reviewer must confirm: equipment-financing and SBA paths appear; producer pathways do not appear; conflict signals visible if customer-type-token coverage is partial.",
    },
    // ────────────────────────────────────────────────────────────────────
    // Scenario 6: Small business acquisition
    // ────────────────────────────────────────────────────────────────────
    {
      scenarioId: "small-business-acquisition",
      label: "Small business acquisition",
      description:
        "Borrower acquiring an existing rural small business in Tennessee. Expected: SBA / CDFI / conventional banking; NOT new-construction or specialty crop programs.",
      customerType: "Rural small business (acquisition)",
      declaredCustomerTypes: ["rural small business"],
      geography: {
        country: "US",
        state: "TN",
        county: "Greene",
        contextDescriptor: "Greene County, TN — rural",
      },
      projectGoal: "Acquire existing small business operation",
      assetType: "Small business equity + working capital",
      desiredUseOfFunds: ["acquisition", "operating capital"],
      borrowerStateOverride: {
        farmTypes: [],
        goals: ["EXPANSION"],
        acreage: 0,
      },
      expectedRelevantPathways: [
        "SBA 7(a) acquisition",
        "Conventional banking acquisition financing",
        "CDFI Fund small business pathway",
      ],
      expectedExcludedPathways: [
        "FSA agricultural production",
        "Specialty crop block grant",
      ],
      expectedRelevantCategories: ["SBA", "CDFI", "CONVENTIONAL_BANKING"],
      expectedExcludedCategories: ["FSA"],
      expectedReadinessGaps: [],
      expectedNextSteps: ["/governance/opportunity-discovery-v2"],
      expectedConflictTopics: [],
      expectsZeroMatchedProfiles: false,
      humanReviewNotes:
        "Reviewer must confirm: acquisition-friendly capital appears (SBA, CDFI); agricultural production pathways absent.",
    },
    // ────────────────────────────────────────────────────────────────────
    // Scenario 7: Refinance-only borrower
    // ────────────────────────────────────────────────────────────────────
    {
      scenarioId: "refinance-only-borrower",
      label: "Refinance-only rural small business",
      description:
        "Rural small business seeking refinance only — no expansion, no new equipment. Should map to conventional / private lending; should NOT map to grant or new-investment programs.",
      customerType: "Rural small business (refinance)",
      declaredCustomerTypes: ["rural small business"],
      geography: {
        country: "US",
        state: "OK",
        county: "Kay",
        contextDescriptor: "Kay County, OK — rural",
      },
      projectGoal: "Refinance existing debt at lower cost",
      assetType: "Real estate + business assets",
      desiredUseOfFunds: ["refinance"],
      borrowerStateOverride: {
        farmTypes: [],
        goals: ["PROFIT_MAXIMIZATION"],
        acreage: 0,
      },
      expectedRelevantPathways: [
        "Conventional banking refinance",
        "Private lending refinance",
        "CDFI refinance products",
      ],
      expectedExcludedPathways: [
        "Specialty crop block grant",
        "FSA new operating loans",
        "Beginning farmer programs",
      ],
      expectedRelevantCategories: [
        "CONVENTIONAL_BANKING",
        "PRIVATE_LENDING",
      ],
      expectedExcludedCategories: ["FSA"],
      expectedReadinessGaps: ["refinance terms and existing debt schedule"],
      expectedNextSteps: ["/governance/financing-pathway-engine-v2"],
      expectedConflictTopics: [],
      expectsZeroMatchedProfiles: false,
      humanReviewNotes:
        "Reviewer must confirm: only refinance-appropriate capital appears; no agricultural grant or new-investment pathway returned.",
    },
    // ────────────────────────────────────────────────────────────────────
    // Scenario 8: Expansion borrower
    // ────────────────────────────────────────────────────────────────────
    {
      scenarioId: "expansion-borrower",
      label: "Expansion rural small business",
      description:
        "Rural small business expanding into new markets with new capital investment. Should map to SBA / state incentive / conventional banking; NOT to refinance-only or limited-purpose programs.",
      customerType: "Rural small business (expansion)",
      declaredCustomerTypes: ["rural small business"],
      geography: {
        country: "US",
        state: "WV",
        county: "Monongalia",
        contextDescriptor: "Monongalia County, WV — rural / Appalachian",
      },
      projectGoal: "Open additional locations + invest in new equipment",
      assetType: "Real estate + equipment + working capital",
      desiredUseOfFunds: [
        "expansion",
        "equipment financing",
        "operating capital",
      ],
      borrowerStateOverride: {
        farmTypes: [],
        goals: ["EXPANSION"],
        acreage: 0,
      },
      expectedRelevantPathways: [
        "SBA expansion programs",
        "State incentive programs",
        "Conventional banking expansion",
        "Appalachian Regional Commission programs",
      ],
      expectedExcludedPathways: [
        "Refinance-only products",
        "Specialty crop block grant",
        "FSA producer pathway",
      ],
      expectedRelevantCategories: [
        "SBA",
        "STATE_INCENTIVE_PROGRAMS",
        "CONVENTIONAL_BANKING",
      ],
      expectedExcludedCategories: ["FSA"],
      expectedReadinessGaps: [],
      expectedNextSteps: [
        "/governance/financing-pathway-engine-v2",
        "/governance/opportunity-discovery-v2",
      ],
      expectedConflictTopics: [],
      expectsZeroMatchedProfiles: false,
      humanReviewNotes:
        "Reviewer must confirm: expansion-friendly programs appear; specialty crop / pure refinance pathways absent.",
    },
    // ────────────────────────────────────────────────────────────────────
    // Scenario 9: Intentionally bad-fit — sovereign tribe + closed federation
    // ────────────────────────────────────────────────────────────────────
    {
      scenarioId: "intentionally-bad-fit-sovereign-closed",
      label: "Intentionally bad-fit: sovereign declared, federation closed",
      description:
        "Borrower declares a federally recognized tribal customer type but the reviewer scope does NOT authorize sovereign federation participation. Expected: zero matched sovereign profiles, cross-source conflict signal preserved, no improper recommendations.",
      customerType: "Federally recognized tribe (sovereign — closed scope)",
      declaredCustomerTypes: ["federally recognized tribe"],
      geography: {
        country: "US",
        state: "MT",
        county: "Yellowstone",
        contextDescriptor: "Yellowstone County, MT — federal/tribal lands",
      },
      projectGoal: "Land stewardship and tribal nation infrastructure",
      assetType: "Tribal land + sovereign infrastructure",
      desiredUseOfFunds: ["operating capital", "infrastructure"],
      borrowerStateOverride: {
        farmTypes: ["LIVESTOCK"],
        goals: ["EXPANSION"],
        acreage: 200,
      },
      expectedRelevantPathways: [
        "(none — sovereign federation is not authorized in this scope)",
      ],
      expectedExcludedPathways: [
        "Any sovereign-federation-scoped program (must be hidden)",
        "Any program returned without conflict signals",
      ],
      expectedRelevantCategories: [],
      expectedExcludedCategories: [],
      expectedReadinessGaps: ["sovereign federation authorization required"],
      expectedNextSteps: ["/governance/customer-types"],
      expectedConflictTopics: [
        "sovereign customer type",
        "sovereign federation",
      ],
      expectsZeroMatchedProfiles: true,
      humanReviewNotes:
        "Reviewer must confirm: zero sovereign profiles surface in closed-federation scope; cross-source conflict preserved (never collapsed); no sovereign-only program recommended.",
    },
  ];

export const RECOMMENDATION_PRECISION_BANNED_LANGUAGE_TOKENS = [
  "approved",
  "preapproved",
  "guaranteed",
  "qualified you for",
  "we have committed",
  "official certification",
  "official decision",
  "agency decision",
  "regulatory reliance",
  "legal reliance",
  "lender commitment",
  "funding committed",
  "eligibility confirmed",
  "public verification",
] as const;
