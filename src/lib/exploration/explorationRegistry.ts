import {
  ExplorationDimension,
  ExplorationModule,
  FirstValueOutput,
  HumanReviewRoute,
} from "@/lib/exploration/explorationTypes";

/**
 * Universal Exploration Engine — registry (Build 45).
 *
 * The eight required Alpha exploration modules. All customer-facing copy is
 * advisory ("possible," "may," "categories," "considerations," "questions").
 * Every first-value output is free (requiresPersonalInfo: false). Human review
 * routes only trigger after value is shown; the environmental technical review
 * is held for Alpha until a qualified reviewer is assigned.
 */

function value(
  outputId: string,
  label: string,
  description: string
): FirstValueOutput {
  return {
    outputId,
    label,
    description,
    requiresPersonalInfo: false,
    allowedInFreeExploration: true,
  };
}

const generalReview: HumanReviewRoute = {
  routeId: "general-guide",
  label: "Talk through your options with a Furlong guide",
  specialistDomain: "GENERAL_REVIEW",
  triggerAfterValueShown: true,
};

function geographyDimension(prompt: string): ExplorationDimension {
  return {
    dimensionId: "geography-scope",
    label: "Geography",
    prompt,
    requiredForFocus: false,
    options: [
      {
        optionId: "national",
        label: "Anywhere in the U.S.",
        plainEnglishDescription: "Explore broadly before narrowing by place.",
      },
      {
        optionId: "state",
        label: "A specific state",
        plainEnglishDescription: "Narrow to a state you care about.",
      },
      {
        optionId: "county-local",
        label: "A county or local area",
        plainEnglishDescription: "Focus on a county or local region.",
      },
    ],
  };
}

export const EXPLORATION_MODULE_REGISTRY: ExplorationModule[] = [
  // ───────────────────────────── property-land ─────────────────────────────
  {
    moduleId: "property-land",
    label: "Property & Land",
    plainEnglishDescription:
      "Explore what a property or piece of land could support — and the questions worth asking before you commit.",
    routeBase: "/onboarding?explore=property-land",
    fullMapIntro:
      "Explore the full map of property and land possibilities — acquisition, readiness, financing, and risk — without sharing anything about yourself.",
    focusPrompt:
      "Focus your exploration: what kind of property or land are you thinking about?",
    alphaStatus: "ACTIVE",
    sourceFamilies: ["PROPERTY_DISCOVERY", "COUNTY_RECORDS", "FINANCING_PATHWAY"],
    narrowingDimensions: [
      {
        dimensionId: "property-type",
        label: "Property type",
        prompt: "What type of property or land is this?",
        requiredForFocus: true,
        options: [
          { optionId: "raw-land", label: "Raw land", plainEnglishDescription: "Undeveloped land." },
          { optionId: "farm", label: "Farm", plainEnglishDescription: "Working or prospective farm." },
          { optionId: "ranch", label: "Ranch", plainEnglishDescription: "Grazing or livestock land." },
          { optionId: "hotel", label: "Hotel", plainEnglishDescription: "Lodging or hospitality property." },
          { optionId: "rv-park", label: "RV park", plainEnglishDescription: "Recreational-vehicle park." },
          { optionId: "mobile-home-park", label: "Mobile home park", plainEnglishDescription: "Manufactured-home community." },
          { optionId: "commercial", label: "Commercial property", plainEnglishDescription: "Retail, office, or industrial." },
          { optionId: "mixed-use", label: "Mixed-use", plainEnglishDescription: "Combined residential and commercial." },
          { optionId: "housing-site", label: "Housing site", plainEnglishDescription: "Land for housing development." },
          { optionId: "unusual-distressed", label: "Unusual / distressed property", plainEnglishDescription: "Atypical, complex, or distressed property." },
        ],
      },
      {
        dimensionId: "ownership-stage",
        label: "Ownership stage",
        prompt: "Where are you in the ownership process?",
        requiredForFocus: false,
        options: [
          { optionId: "own-now", label: "I own it now", plainEnglishDescription: "You already hold it." },
          { optionId: "want-to-buy", label: "I want to buy it", plainEnglishDescription: "You hope to purchase it." },
          { optionId: "lease-to-own", label: "I lease it now", plainEnglishDescription: "You lease and may want to buy." },
        ],
      },
      geographyDimension("Where is the property located?"),
      {
        dimensionId: "intended-use",
        label: "Intended use",
        prompt: "What do you hope to do with it?",
        requiredForFocus: false,
        options: [
          { optionId: "operate", label: "Operate a business", plainEnglishDescription: "Run an operation on the property." },
          { optionId: "develop", label: "Develop it", plainEnglishDescription: "Build or improve." },
          { optionId: "hold", label: "Hold or invest", plainEnglishDescription: "Hold for the longer term." },
        ],
      },
    ],
    firstValueOutputs: [
      value("pathway-categories", "Possible pathway categories", "Broad directions a property like this could take."),
      value("readiness-questions", "Readiness questions", "What to get clear on before committing."),
      value("risk-considerations", "Risk considerations", "Common risks worth checking early."),
      value("next-questions", "Property-specific next questions", "Tailored questions for this property type."),
    ],
    humanReviewRoutes: [generalReview],
  },

  // ──────────────────────────── farms-agriculture ──────────────────────────
  {
    moduleId: "farms-agriculture",
    label: "Farms & Agriculture",
    plainEnglishDescription:
      "Explore how an agricultural project can connect to financing, conservation, infrastructure, and program opportunities.",
    routeBase: "/onboarding?explore=farms-agriculture",
    fullMapIntro:
      "Explore the full map of agricultural possibilities — crops, animals, programs, and markets — without sharing anything about yourself.",
    focusPrompt: "Focus your exploration: what kind of agriculture is this?",
    alphaStatus: "ACTIVE",
    sourceFamilies: ["USDA_PROGRAMS", "MARKET_INTELLIGENCE", "ENVIRONMENTAL"],
    narrowingDimensions: [
      {
        dimensionId: "agriculture-type",
        label: "Agriculture type",
        prompt: "What do you grow, raise, or produce?",
        requiredForFocus: true,
        options: [
          { optionId: "crops", label: "Crops", plainEnglishDescription: "Row crops, grains, produce." },
          { optionId: "flowers", label: "Flowers", plainEnglishDescription: "Cut flowers and floriculture." },
          { optionId: "livestock", label: "Livestock", plainEnglishDescription: "Cattle, hogs, poultry, dairy." },
          { optionId: "specialty-animals", label: "Specialty animals", plainEnglishDescription: "Bees, aquaculture, exotic or specialty animals." },
          { optionId: "timber", label: "Trees / timber", plainEnglishDescription: "Forestry and timber." },
          { optionId: "greenhouse", label: "Nursery / greenhouse", plainEnglishDescription: "Controlled-environment growing." },
          { optionId: "conservation", label: "Conservation", plainEnglishDescription: "Conservation-focused land use." },
          { optionId: "value-added", label: "Processing / value-added", plainEnglishDescription: "Processing or value-added products." },
          { optionId: "agritourism", label: "Agritourism", plainEnglishDescription: "Farm visits, events, experiences." },
        ],
      },
      {
        dimensionId: "business-stage",
        label: "Business stage",
        prompt: "What stage is your operation in?",
        requiredForFocus: false,
        options: [
          { optionId: "starting", label: "Just starting", plainEnglishDescription: "Getting going." },
          { optionId: "operating", label: "Operating now", plainEnglishDescription: "Already running." },
          { optionId: "expanding", label: "Expanding", plainEnglishDescription: "Growing the operation." },
        ],
      },
      geographyDimension("Where is the operation located?"),
    ],
    firstValueOutputs: [
      value("program-categories", "Program categories", "Program families that often fit agriculture."),
      value("market-data", "Commodity / market context", "Illustrative market and commodity context (placeholder data)."),
      value("financing-considerations", "Financing considerations", "Financing angles worth exploring."),
      value("conservation-compliance", "Conservation / compliance considerations", "Conservation and compliance questions to keep in mind."),
    ],
    humanReviewRoutes: [generalReview],
  },

  // ─────────────────────────── small-business-growth ───────────────────────
  {
    moduleId: "small-business-growth",
    label: "Small Business Growth",
    plainEnglishDescription:
      "Explore growth options for a small business beyond one loan or one lender.",
    routeBase: "/onboarding?explore=small-business-growth",
    fullMapIntro:
      "Explore the full map of small-business growth possibilities — capital, programs, and readiness — without sharing anything about yourself.",
    focusPrompt: "Focus your exploration: what kind of business is this?",
    alphaStatus: "ACTIVE",
    sourceFamilies: ["SBA_PROGRAMS", "GRANTS", "FINANCING_PATHWAY"],
    narrowingDimensions: [
      {
        dimensionId: "business-type",
        label: "Business type",
        prompt: "What kind of business is it?",
        requiredForFocus: true,
        options: [
          { optionId: "retail", label: "Retail", plainEnglishDescription: "Storefront or online retail." },
          { optionId: "hospitality", label: "Hospitality", plainEnglishDescription: "Lodging, food, events." },
          { optionId: "gas-convenience", label: "Gas / convenience", plainEnglishDescription: "Fuel and convenience store." },
          { optionId: "laundromat", label: "Laundromat", plainEnglishDescription: "Self-serve laundry." },
          { optionId: "food-business", label: "Food business", plainEnglishDescription: "Restaurant, food production." },
          { optionId: "service-business", label: "Service business", plainEnglishDescription: "Professional or local services." },
          { optionId: "rural-business", label: "Rural business", plainEnglishDescription: "Business in a rural area." },
          { optionId: "startup", label: "Startup", plainEnglishDescription: "A new venture." },
          { optionId: "expansion", label: "Expansion", plainEnglishDescription: "Growing an existing business." },
        ],
      },
      {
        dimensionId: "growth-goal",
        label: "Growth goal",
        prompt: "What are you trying to do?",
        requiredForFocus: false,
        options: [
          { optionId: "open", label: "Open or launch", plainEnglishDescription: "Start operating." },
          { optionId: "grow", label: "Grow revenue", plainEnglishDescription: "Increase the business." },
          { optionId: "stabilize", label: "Stabilize", plainEnglishDescription: "Steady the operation." },
        ],
      },
      geographyDimension("Where is the business located?"),
    ],
    firstValueOutputs: [
      value("growth-pathways", "Growth pathway categories", "Broad directions for growth."),
      value("financing-readiness", "Financing readiness", "What lenders and programs tend to look for."),
      value("program-incentive-categories", "Program / incentive categories", "Program and incentive families to explore."),
      value("doc-checklist-preview", "Documentation checklist preview", "A preview of documents often involved."),
    ],
    humanReviewRoutes: [generalReview],
  },

  // ──────────────────────── environmental-compliance ───────────────────────
  {
    moduleId: "environmental-compliance",
    label: "Environmental & Compliance",
    plainEnglishDescription:
      "Explore environmental and compliance questions that can change what is realistic, financeable, or safe to pursue.",
    routeBase: "/onboarding?explore=environmental-compliance",
    fullMapIntro:
      "Explore the full map of environmental and compliance questions — early, before they become surprises — without sharing anything about yourself.",
    focusPrompt: "Focus your exploration: what kind of site or concern is this?",
    alphaStatus: "ACTIVE",
    sourceFamilies: ["ENVIRONMENTAL", "STATE_REGISTRY", "COUNTY_RECORDS"],
    narrowingDimensions: [
      {
        dimensionId: "site-concern",
        label: "Site or concern",
        prompt: "What site type or concern is on your mind?",
        requiredForFocus: true,
        options: [
          { optionId: "wetlands-water", label: "Wetlands / water", plainEnglishDescription: "Water features or wetlands." },
          { optionId: "tanks", label: "Tanks", plainEnglishDescription: "Underground or above-ground tanks." },
          { optionId: "waste", label: "Waste", plainEnglishDescription: "Waste handling or history." },
          { optionId: "agriculture", label: "Agriculture", plainEnglishDescription: "Agricultural environmental questions." },
          { optionId: "construction", label: "Construction", plainEnglishDescription: "Construction-related concerns." },
          { optionId: "permitting", label: "Permitting", plainEnglishDescription: "Permits that may be required." },
          { optionId: "endangered-species", label: "Endangered species", plainEnglishDescription: "Protected species considerations." },
          { optionId: "prior-use", label: "Prior use / site history", plainEnglishDescription: "How the land was used before." },
          { optionId: "compliance-uncertainty", label: "Compliance uncertainty", plainEnglishDescription: "You are not sure what applies." },
        ],
      },
      {
        dimensionId: "project-stage",
        label: "Project stage",
        prompt: "Where are you in the project?",
        requiredForFocus: false,
        options: [
          { optionId: "considering", label: "Considering a purchase", plainEnglishDescription: "Before buying." },
          { optionId: "planning", label: "Planning a project", plainEnglishDescription: "Designing or scoping." },
          { optionId: "underway", label: "Project underway", plainEnglishDescription: "Already in progress." },
        ],
      },
      geographyDimension("Where is the site located?"),
    ],
    firstValueOutputs: [
      value("questions-before-buying", "Questions to ask before buying", "What to check before you commit."),
      value("possible-review-needs", "Possible review needs", "Where a closer look may be appropriate."),
      value("risk-categories", "Compliance risk categories", "Broad categories of environmental/compliance risk."),
      value("when-human-review", "When human environmental review is appropriate", "Signals that a qualified reviewer should be involved."),
    ],
    humanReviewRoutes: [
      generalReview,
      {
        routeId: "environmental-technical-review",
        label: "Request a qualified environmental review (when activated)",
        specialistDomain: "ENVIRONMENTAL_COMPLIANCE",
        triggerAfterValueShown: true,
        // Held for Alpha until a qualified environmental reviewer is assigned
        // (see CCR-2026-002 / Environmental Qualification Successor Plan).
        heldForAlpha: true,
      },
    ],
  },

  // ───────────────────────────── financing-capital ─────────────────────────
  {
    moduleId: "financing-capital",
    label: "Financing & Capital",
    plainEnglishDescription:
      "Explore the kinds of financing and capital that might fit a project like yours.",
    routeBase: "/onboarding?explore=financing-capital",
    fullMapIntro:
      "Explore the full map of financing and capital possibilities — without sharing anything about yourself.",
    focusPrompt: "Focus your exploration: what are you financing?",
    alphaStatus: "ACTIVE",
    sourceFamilies: ["USDA_PROGRAMS", "SBA_PROGRAMS", "FINANCING_PATHWAY"],
    narrowingDimensions: [
      {
        dimensionId: "financing-goal",
        label: "Financing goal",
        prompt: "What do you need financing for?",
        requiredForFocus: true,
        options: [
          { optionId: "purchase", label: "Purchase", plainEnglishDescription: "Buy a property or asset." },
          { optionId: "refinance", label: "Refinance", plainEnglishDescription: "Replace existing financing." },
          { optionId: "construction", label: "Construction", plainEnglishDescription: "Build or improve." },
          { optionId: "expansion", label: "Expansion", plainEnglishDescription: "Grow an operation." },
          { optionId: "working-capital", label: "Working capital", plainEnglishDescription: "Day-to-day operating funds." },
        ],
      },
      {
        dimensionId: "capital-source",
        label: "Capital source",
        prompt: "What kinds of capital are you curious about?",
        requiredForFocus: false,
        options: [
          { optionId: "usda", label: "USDA", plainEnglishDescription: "USDA program pathways." },
          { optionId: "sba", label: "SBA", plainEnglishDescription: "SBA program pathways." },
          { optionId: "conventional", label: "Conventional", plainEnglishDescription: "Conventional lending." },
          { optionId: "seller-financing", label: "Seller financing", plainEnglishDescription: "Financing from the seller." },
          { optionId: "private-capital", label: "Private capital", plainEnglishDescription: "Private or investor capital." },
          { optionId: "grant-adjacent", label: "Grant-adjacent", plainEnglishDescription: "Grant-adjacent possibilities." },
        ],
      },
      geographyDimension("Where is the project located?"),
    ],
    firstValueOutputs: [
      value("capital-pathways", "Possible capital pathway categories", "Broad categories of capital that may fit."),
      value("readiness-gaps", "Readiness gaps", "Where you may need to prepare."),
      value("doc-preview", "Documentation preview", "Documents commonly involved."),
      value("reality-preview", "Reality classification preview", "An advisory sense of how financeable a project may be."),
    ],
    humanReviewRoutes: [
      generalReview,
      {
        routeId: "financing-specialist",
        label: "Talk with a financing & capital specialist",
        specialistDomain: "FINANCING_CAPITAL",
        triggerAfterValueShown: true,
      },
    ],
  },

  // ──────────────────────────── housing-development ────────────────────────
  {
    moduleId: "housing-development",
    label: "Housing & Development",
    plainEnglishDescription:
      "Explore development projects beyond construction costs — funding, infrastructure, readiness, and community impact.",
    routeBase: "/onboarding?explore=housing-development",
    fullMapIntro:
      "Explore the full map of housing and development possibilities — without sharing anything about yourself.",
    focusPrompt: "Focus your exploration: what kind of housing or development is this?",
    alphaStatus: "ACTIVE",
    sourceFamilies: ["GRANTS", "STATE_REGISTRY", "PROPERTY_DISCOVERY"],
    narrowingDimensions: [
      {
        dimensionId: "housing-type",
        label: "Housing type",
        prompt: "What kind of housing or development is this?",
        requiredForFocus: true,
        options: [
          { optionId: "workforce-housing", label: "Workforce housing", plainEnglishDescription: "Housing for the local workforce." },
          { optionId: "rural-housing", label: "Rural housing", plainEnglishDescription: "Housing in rural areas." },
          { optionId: "mixed-use", label: "Mixed-use", plainEnglishDescription: "Combined residential and commercial." },
          { optionId: "manufactured-modular", label: "Manufactured / modular", plainEnglishDescription: "Manufactured or modular homes." },
          { optionId: "redevelopment", label: "Redevelopment", plainEnglishDescription: "Reusing existing sites." },
          { optionId: "infrastructure", label: "Infrastructure", plainEnglishDescription: "Roads, water, utilities." },
          { optionId: "community-impact", label: "Community impact", plainEnglishDescription: "Community-focused development." },
        ],
      },
      {
        dimensionId: "development-stage",
        label: "Development stage",
        prompt: "Where are you in the development?",
        requiredForFocus: false,
        options: [
          { optionId: "idea", label: "Early idea", plainEnglishDescription: "Just exploring." },
          { optionId: "planning", label: "Planning", plainEnglishDescription: "Scoping and design." },
          { optionId: "ready", label: "Ready to move", plainEnglishDescription: "Close to action." },
        ],
      },
      geographyDimension("Where is the development located?"),
    ],
    firstValueOutputs: [
      value("development-pathways", "Development pathway categories", "Broad directions for the project."),
      value("infrastructure-questions", "Infrastructure questions", "Infrastructure considerations to explore."),
      value("financing-program-possibilities", "Financing / program possibilities", "Funding and program angles."),
      value("readiness-considerations", "Readiness considerations", "What to prepare for."),
    ],
    humanReviewRoutes: [generalReview],
  },

  // ──────────────────────────── programs-incentives ────────────────────────
  {
    moduleId: "programs-incentives",
    label: "Programs & Incentives",
    plainEnglishDescription:
      "Explore programs and incentives people often do not know to look for.",
    routeBase: "/onboarding?explore=programs-incentives",
    fullMapIntro:
      "Explore the full map of programs and incentives — without sharing anything about yourself.",
    focusPrompt: "Focus your exploration: what kind of program interests you?",
    alphaStatus: "ACTIVE",
    sourceFamilies: ["USDA_PROGRAMS", "SBA_PROGRAMS", "GRANTS", "STATE_REGISTRY"],
    narrowingDimensions: [
      {
        dimensionId: "program-type",
        label: "Program type",
        prompt: "What kind of program or incentive?",
        requiredForFocus: true,
        options: [
          { optionId: "usda", label: "USDA", plainEnglishDescription: "USDA programs." },
          { optionId: "sba", label: "SBA", plainEnglishDescription: "SBA programs." },
          { optionId: "state-programs", label: "State programs", plainEnglishDescription: "State-level programs." },
          { optionId: "local-incentives", label: "Local incentives", plainEnglishDescription: "Local or regional incentives." },
          { optionId: "conservation", label: "Conservation", plainEnglishDescription: "Conservation programs." },
          { optionId: "housing", label: "Housing", plainEnglishDescription: "Housing programs." },
          { optionId: "rural-development", label: "Rural development", plainEnglishDescription: "Rural development programs." },
          { optionId: "small-business", label: "Small business", plainEnglishDescription: "Small-business programs." },
          { optionId: "grants", label: "Grants", plainEnglishDescription: "Grant possibilities." },
          { optionId: "tax-incentives", label: "Tax incentives", plainEnglishDescription: "Tax-incentive possibilities." },
        ],
      },
      {
        dimensionId: "applicant-type",
        label: "Applicant type",
        prompt: "Who would be exploring this?",
        requiredForFocus: false,
        options: [
          { optionId: "individual", label: "An individual or family", plainEnglishDescription: "Personal project." },
          { optionId: "business", label: "A business", plainEnglishDescription: "Business project." },
          { optionId: "organization", label: "An organization", plainEnglishDescription: "Nonprofit or community group." },
        ],
      },
      geographyDimension("Where is the project located?"),
    ],
    firstValueOutputs: [
      value("program-families", "Possible program families", "Families of programs that may fit."),
      value("eligibility-questions", "Eligibility questions to consider", "Questions that often affect what fits — not a determination."),
      value("doc-preview", "Documentation preview", "Documents programs commonly ask for."),
      value("source-provenance", "Where this comes from", "How program information is sourced and kept current."),
    ],
    humanReviewRoutes: [generalReview],
  },

  // ─────────────────────────────── not-sure-yet ────────────────────────────
  {
    moduleId: "not-sure-yet",
    label: "I’m Not Sure Yet",
    plainEnglishDescription:
      "Not sure where to start? Explore a few simple starting points and we’ll suggest directions.",
    routeBase: "/onboarding?explore=not-sure-yet",
    fullMapIntro:
      "Explore the full map at your own pace — no destination required, and nothing about yourself needed.",
    focusPrompt: "Focus your exploration: which of these sounds most like you?",
    alphaStatus: "ACTIVE",
    sourceFamilies: ["CUSTOMER_TYPE", "MARKET_INTELLIGENCE"],
    narrowingDimensions: [
      {
        dimensionId: "curiosity-starter",
        label: "Starting point",
        prompt: "Which of these sounds most like you?",
        requiredForFocus: true,
        options: [
          { optionId: "own-property", label: "I own property", plainEnglishDescription: "You already own property.", nextDimensions: ["goal"] },
          { optionId: "want-property", label: "I want to buy property", plainEnglishDescription: "You hope to buy.", nextDimensions: ["goal"] },
          { optionId: "run-business", label: "I run a business", plainEnglishDescription: "You operate a business.", nextDimensions: ["goal"] },
          { optionId: "farm", label: "I farm or want to farm", plainEnglishDescription: "Agriculture interests you.", nextDimensions: ["goal"] },
          { optionId: "exploring-funding", label: "I am exploring funding", plainEnglishDescription: "You want to understand financing.", nextDimensions: ["goal"] },
          { optionId: "worried-risk", label: "I am worried about risk", plainEnglishDescription: "You have concerns to check.", nextDimensions: ["goal"] },
          { optionId: "just-learn", label: "I just want to learn", plainEnglishDescription: "You're here to understand.", nextDimensions: ["goal"] },
        ],
      },
      {
        dimensionId: "goal",
        label: "Goal",
        prompt: "What would feel most helpful right now?",
        requiredForFocus: false,
        options: [
          { optionId: "see-options", label: "See my options", plainEnglishDescription: "Understand what's possible." },
          { optionId: "understand-risk", label: "Understand risks", plainEnglishDescription: "Know what to watch for." },
          { optionId: "learn-next", label: "Know my next step", plainEnglishDescription: "Find a sensible next move." },
        ],
      },
      geographyDimension("Where, roughly, are you focused?"),
    ],
    firstValueOutputs: [
      value("suggested-paths", "Suggested exploration paths", "Directions that may fit where you are."),
      value("simple-next-questions", "Simple next questions", "A few easy questions to move forward."),
      value("recommended-categories", "Recommended categories", "Categories worth a closer look."),
    ],
    humanReviewRoutes: [generalReview],
  },
];

export function explorationModuleById(
  moduleId: string,
  modules: ExplorationModule[] = EXPLORATION_MODULE_REGISTRY
): ExplorationModule | undefined {
  return modules.find((m) => m.moduleId === moduleId);
}
